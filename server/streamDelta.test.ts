import { describe, it, expect } from 'vitest';
import { extractAnthropicDelta, extractGoogleDelta } from './streamDelta';

describe('extractAnthropicDelta', () => {
  it('content_block_delta의 text_delta에서 텍스트를 추출한다', () => {
    const payload = JSON.stringify({
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'const A' },
    });

    expect(extractAnthropicDelta(payload)).toEqual({ text: 'const A' });
  });

  it('error 이벤트는 에러 메시지로 변환한다', () => {
    const payload = JSON.stringify({
      type: 'error',
      error: { type: 'overloaded_error', message: '과부하 상태입니다' },
    });

    expect(extractAnthropicDelta(payload)).toEqual({ error: '과부하 상태입니다' });
  });

  it('message_stop 이벤트는 done으로 표시한다', () => {
    const payload = JSON.stringify({ type: 'message_stop' });

    expect(extractAnthropicDelta(payload)).toEqual({ done: true });
  });

  it('관심 없는 이벤트 타입은 빈 객체를 반환한다', () => {
    const payload = JSON.stringify({ type: 'content_block_start' });

    expect(extractAnthropicDelta(payload)).toEqual({});
  });
});

describe('extractGoogleDelta', () => {
  it('candidate의 parts에서 텍스트를 추출한다', () => {
    const payload = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'const A' }] } }],
    });

    expect(extractGoogleDelta(payload)).toEqual({ text: 'const A' });
  });

  it('finishReason이 MAX_TOKENS면 에러 메시지를 반환한다', () => {
    const payload = JSON.stringify({
      candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [] } }],
    });

    expect(extractGoogleDelta(payload)).toEqual({
      error: '생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.',
    });
  });

  it('텍스트 없이 finishReason만 STOP으로 끝나면 done으로 표시한다', () => {
    const payload = JSON.stringify({
      candidates: [{ finishReason: 'STOP', content: { parts: [] } }],
    });

    expect(extractGoogleDelta(payload)).toEqual({ done: true });
  });

  it('candidate가 없으면 빈 객체를 반환한다', () => {
    const payload = JSON.stringify({ candidates: [] });

    expect(extractGoogleDelta(payload)).toEqual({});
  });
});
