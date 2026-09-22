// 각 provider의 SSE data 페이로드(JSON 문자열)에서 텍스트 델타/에러/완료 신호를 추출하는 순수 함수.
// 부수효과(fetch, 스트림 읽기 등)가 없어 단위 테스트가 가능하다.

export interface StreamDeltaResult {
  text?: string;
  error?: string;
  done?: boolean;
}

interface AnthropicStreamEvent {
  type: string;
  delta?: { type: string; text?: string };
  error?: { message?: string };
}

export function extractAnthropicDelta(payload: string): StreamDeltaResult {
  const event = JSON.parse(payload) as AnthropicStreamEvent;

  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return { text: event.delta.text ?? '' };
  }
  if (event.type === 'error') {
    return { error: event.error?.message ?? 'Claude API 스트리밍 오류가 발생했습니다.' };
  }
  if (event.type === 'message_stop') {
    return { done: true };
  }
  return {};
}

interface GoogleStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

export function extractGoogleDelta(payload: string): StreamDeltaResult {
  const chunk = JSON.parse(payload) as GoogleStreamChunk;
  const candidate = chunk.candidates?.[0];

  if (!candidate) return {};

  if (candidate.finishReason === 'MAX_TOKENS') {
    return { error: '생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.' };
  }

  const text = candidate.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  if (text) return { text };

  if (candidate.finishReason) return { done: true };

  return {};
}
