import { describe, it, expect } from 'vitest';
import { resolveActiveTabForStatus } from './tabTransition';

describe('resolveActiveTabForStatus', () => {
  it('streaming 상태가 되면 코드 탭으로 전환한다', () => {
    expect(resolveActiveTabForStatus('streaming', 'done', 'preview')).toBe('code');
  });

  it('streaming에서 done으로 바뀌면 미리보기 탭으로 전환한다', () => {
    expect(resolveActiveTabForStatus('done', 'streaming', 'code')).toBe('preview');
  });

  it('streaming에서 error로 바뀌면 현재 탭을 유지한다', () => {
    expect(resolveActiveTabForStatus('error', 'streaming', 'code')).toBe('code');
  });

  it('상태가 이미 done이었다면(스트리밍을 거치지 않았다면) 현재 탭을 유지한다', () => {
    expect(resolveActiveTabForStatus('done', 'done', 'code')).toBe('code');
  });
});
