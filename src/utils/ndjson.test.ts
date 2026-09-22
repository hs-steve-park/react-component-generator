import { describe, it, expect } from 'vitest';
import { extractNdjsonLines } from './ndjson';

describe('extractNdjsonLines', () => {
  it('개행으로 끝난 완결된 줄들을 추출하고 remainder는 비운다', () => {
    const buffer = '{"a":1}\n{"a":2}\n';

    const result = extractNdjsonLines(buffer);

    expect(result.lines).toEqual(['{"a":1}', '{"a":2}']);
    expect(result.remainder).toBe('');
  });

  it('개행 없이 끝난 마지막 조각은 remainder로 남긴다', () => {
    const buffer = '{"a":1}\n{"a":2';

    const result = extractNdjsonLines(buffer);

    expect(result.lines).toEqual(['{"a":1}']);
    expect(result.remainder).toBe('{"a":2');
  });

  it('빈 줄은 결과에서 제외한다', () => {
    const buffer = '{"a":1}\n\n{"a":2}\n';

    const result = extractNdjsonLines(buffer);

    expect(result.lines).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('완결된 줄이 없으면 빈 배열과 원본 remainder를 반환한다', () => {
    const buffer = '{"a":1}';

    const result = extractNdjsonLines(buffer);

    expect(result.lines).toEqual([]);
    expect(result.remainder).toBe('{"a":1}');
  });
});
