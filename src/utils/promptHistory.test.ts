import { describe, it, expect } from 'vitest';
import { addPromptToHistory } from './promptHistory';

describe('addPromptToHistory', () => {
  it('빈 히스토리에 새 프롬프트를 추가하면 맨 앞에 놓인다', () => {
    expect(addPromptToHistory([], '버튼 만들어줘')).toEqual(['버튼 만들어줘']);
  });

  it('새 프롬프트를 기존 히스토리 맨 앞에 추가한다', () => {
    expect(addPromptToHistory(['이전 프롬프트'], '새 프롬프트')).toEqual([
      '새 프롬프트',
      '이전 프롬프트',
    ]);
  });

  it('이미 존재하는 프롬프트를 다시 추가하면 중복 없이 맨 앞으로 이동한다', () => {
    const history = ['A', 'B', 'C'];
    expect(addPromptToHistory(history, 'B')).toEqual(['B', 'A', 'C']);
  });

  it('앞뒤 공백은 제거하고 저장한다', () => {
    expect(addPromptToHistory([], '  공백 포함  ')).toEqual(['공백 포함']);
  });

  it('빈 문자열이나 공백만 있는 프롬프트는 무시한다', () => {
    expect(addPromptToHistory(['기존'], '   ')).toEqual(['기존']);
  });

  it('최대 길이를 넘으면 가장 오래된 항목부터 제거한다', () => {
    const history = Array.from({ length: 20 }, (_, i) => `prompt-${i}`);
    const result = addPromptToHistory(history, 'new', 20);
    expect(result).toHaveLength(20);
    expect(result[0]).toBe('new');
    expect(result).not.toContain('prompt-19');
  });
});
