import { stripCodeFences, ensureRenderCall, toFriendlyErrorMessage } from './generator';
import { withModelFallback } from './fallback';
import { extractSSEDataLines } from './sse';
import { extractAnthropicDelta, extractGoogleDelta } from './streamDelta';

// 우선순위 순서. 앞 모델이 실패하면 다음 모델로 폴백한다.
const GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];

const SYSTEM_PROMPT = `You are a React component generator. Generate a single React component based on the user's description.

Rules:
- Use inline styles only (no CSS imports, no CSS modules)
- Do NOT use import statements — React is already available in scope as a global
- Define the component as a function, then call render(<ComponentName />) at the end
- Make the component visually appealing with proper styling
- Use React hooks if needed (e.g., React.useState, React.useEffect)
- The component must be completely self-contained
- Respond with ONLY the code block — no explanations, no markdown fences
- Use descriptive variable names and clean formatting
- For colors, prefer modern palettes (gradients, shadows, etc.)
- Ensure the component is interactive where appropriate (hover states, click handlers, etc.)
- Do NOT use TypeScript syntax — no type annotations, no interfaces, no generics, no "as" casts. Write plain JavaScript only.

Example output format:
const GradientButton = () => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      style={{
        background: hovered
          ? 'linear-gradient(135deg, #667eea, #764ba2)'
          : 'linear-gradient(135deg, #764ba2, #667eea)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Click me
    </button>
  );
};

render(<GradientButton />);`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type Provider = 'anthropic' | 'google';

const ENV_KEYS: Record<Provider, string | undefined> = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  google: process.env.GOOGLE_API_KEY,
};

function resolveApiKey(provider: Provider, clientKey?: string): string | null {
  return clientKey || ENV_KEYS[provider] || null;
}

/** upstream SSE 응답 바디를 읽어, 완결된 이벤트마다 extractDelta로 델타를 뽑아 onDelta로 전달한다. */
async function pumpSSE(
  body: ReadableStream<Uint8Array>,
  extractDelta: (payload: string) => { text?: string; error?: string; done?: boolean },
  onDelta: (text: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = extractSSEDataLines(buffer);
    buffer = remainder;

    for (const payload of events) {
      const result = extractDelta(payload);
      if (result.error) throw new Error(result.error);
      if (result.text) onDelta(result.text);
      if (result.done) return;
    }
  }
}

async function callAnthropicStream(
  prompt: string,
  apiKey: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  await pumpSSE(response.body, extractAnthropicDelta, onDelta);
}

/** 폴백 대상 모델의 스트림을 연다. 응답이 ok가 아니면 던져서 withModelFallback이 다음 모델을 시도하게 한다. */
async function startGoogleModelStream(
  prompt: string,
  apiKey: string,
  model: string,
): Promise<ReadableStream<Uint8Array>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  return response.body;
}

async function callGoogleStream(
  prompt: string,
  apiKey: string,
  onDelta: (text: string) => void,
): Promise<void> {
  // 모델 시작(fetch/헤더 확인) 단계에서만 폴백한다. 스트리밍이 시작된 뒤의 실패는
  // 이미 클라이언트로 델타가 전송된 상태이므로 다른 모델로 재시도하지 않는다.
  const body = await withModelFallback(GOOGLE_MODELS, (model) =>
    startGoogleModelStream(prompt, apiKey, model),
  );

  await pumpSSE(body, extractGoogleDelta, onDelta);
}

const server = Bun.serve({
  port: 3002,
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return Response.json(
        {
          envKeys: {
            anthropic: !!ENV_KEYS.anthropic,
            google: !!ENV_KEYS.google,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      try {
        const { prompt, apiKey, provider = 'anthropic' } = (await req.json()) as {
          prompt: string;
          apiKey?: string;
          provider?: Provider;
        };

        const resolvedKey = resolveApiKey(provider, apiKey);

        if (!resolvedKey) {
          return Response.json(
            { error: `API key is required. Set ${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY'} in .env or enter it manually.` },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        if (!prompt) {
          return Response.json(
            { error: 'Prompt is required' },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const encoder = new TextEncoder();
        let fullText = '';

        const stream = new ReadableStream({
          async start(controller) {
            const onDelta = (text: string) => {
              fullText += text;
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text }) + '\n'));
            };

            try {
              if (provider === 'google') {
                await callGoogleStream(prompt, resolvedKey, onDelta);
              } else {
                await callAnthropicStream(prompt, resolvedKey, onDelta);
              }

              const code = ensureRenderCall(stripCodeFences(fullText));
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'done', code }) + '\n'));
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unknown error';
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: 'error', message: toFriendlyErrorMessage(message) }) + '\n',
                ),
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/x-ndjson' },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        return Response.json(
          { error: message },
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  },
});

console.log(`API server running at http://localhost:${server.port}`);
