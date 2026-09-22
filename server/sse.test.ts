import { describe, it, expect } from 'vitest';
import { extractSSEDataLines } from './sse';

describe('extractSSEDataLines', () => {
  it('완결된 이벤트 하나를 추출하고 remainder는 비운다', () => {
    const buffer = 'data: {"a":1}\n\n';

    const result = extractSSEDataLines(buffer);

    expect(result.events).toEqual(['{"a":1}']);
    expect(result.remainder).toBe('');
  });

  it('닫는 빈 줄이 없는 미완성 이벤트는 추출하지 않고 remainder로 남긴다', () => {
    const buffer = 'data: {"a":1}\n';

    const result = extractSSEDataLines(buffer);

    expect(result.events).toEqual([]);
    expect(result.remainder).toBe('data: {"a":1}\n');
  });

  it('버퍼에 완결된 이벤트가 여러 개 있으면 모두 추출한다', () => {
    const buffer = 'data: {"a":1}\n\ndata: {"a":2}\n\n';

    const result = extractSSEDataLines(buffer);

    expect(result.events).toEqual(['{"a":1}', '{"a":2}']);
    expect(result.remainder).toBe('');
  });

  it('event: 라인은 무시하고 data: 라인만 추출한다', () => {
    const buffer = 'event: message_stop\ndata: {"done":true}\n\n';

    const result = extractSSEDataLines(buffer);

    expect(result.events).toEqual(['{"done":true}']);
  });

  it('data: 라인이 없는 블록은 결과에서 제외한다', () => {
    const buffer = ': keep-alive\n\ndata: {"a":1}\n\n';

    const result = extractSSEDataLines(buffer);

    expect(result.events).toEqual(['{"a":1}']);
  });
});
