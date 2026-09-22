import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './promptValidation';

describe('validatePromptLength', () => {
  it('500자 이하이면 유효하다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH);
    expect(validatePromptLength(prompt)).toEqual({ valid: true });
  });

  it('빈 문자열은 유효하다', () => {
    expect(validatePromptLength('')).toEqual({ valid: true });
  });

  it('501자이면 무효하고 에러 메시지를 반환한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    const result = validatePromptLength(prompt);
    expect(result.valid).toBe(false);
    expect(result.error).toContain(`${MAX_PROMPT_LENGTH}`);
  });

  it('초과한 글자 수를 에러 메시지에 포함한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH + 10);
    const result = validatePromptLength(prompt);
    expect(result.error).toContain(`${MAX_PROMPT_LENGTH + 10}`);
  });
});
