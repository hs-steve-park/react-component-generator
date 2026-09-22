import { extractNdjsonLines } from './ndjson';

export interface GenerationStreamHandlers {
  onDelta: (text: string) => void;
  onDone: (code: string) => void;
  onError: (message: string) => void;
}

type GenerationEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; message: string };

/** /api/generate가 내려주는 NDJSON 스트림을 읽어 delta/done/error 이벤트를 콜백으로 전달한다. */
export async function consumeGenerationStream(
  body: ReadableStream<Uint8Array>,
  { onDelta, onDone, onError }: GenerationStreamHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { lines, remainder } = extractNdjsonLines(buffer);
    buffer = remainder;

    for (const line of lines) {
      const event = JSON.parse(line) as GenerationEvent;
      if (event.type === 'delta') onDelta(event.text);
      else if (event.type === 'done') onDone(event.code);
      else if (event.type === 'error') onError(event.message);
    }
  }
}
