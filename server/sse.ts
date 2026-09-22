// SSE(Server-Sent Events) 원문 버퍼에서 완결된 이벤트의 data 페이로드만 추출하는 순수 함수.
// 부수효과(스트림 읽기 등)가 없어 단위 테스트가 가능하다.

export interface ExtractSSEDataLinesResult {
  events: string[];
  remainder: string;
}

/**
 * 버퍼를 빈 줄(\n\n) 기준으로 이벤트 블록으로 나누고, 각 블록에서 `data:` 라인만 모아 반환한다.
 * 마지막 블록이 빈 줄로 끝나지 않았다면(아직 미완성) remainder로 남겨 다음 청크와 이어붙일 수 있게 한다.
 */
export function extractSSEDataLines(buffer: string): ExtractSSEDataLinesResult {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const remainder = blocks.pop() ?? '';

  const events = blocks
    .map((block) =>
      block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n'),
    )
    .filter((data) => data.length > 0);

  return { events, remainder };
}
