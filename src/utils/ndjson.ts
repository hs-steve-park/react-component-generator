// NDJSON(줄바꿈으로 구분된 JSON) 버퍼에서 완결된 줄만 추출하는 순수 함수.
// 부수효과(스트림 읽기 등)가 없어 단위 테스트가 가능하다.

export interface ExtractNdjsonLinesResult {
  lines: string[];
  remainder: string;
}

export function extractNdjsonLines(buffer: string): ExtractNdjsonLinesResult {
  const parts = buffer.split('\n');
  const remainder = parts.pop() ?? '';
  const lines = parts.filter((line) => line.length > 0);

  return { lines, remainder };
}
