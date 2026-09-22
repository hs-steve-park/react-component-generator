export const MAX_PROMPT_HISTORY_LENGTH = 20;

export function addPromptToHistory(
  history: string[],
  prompt: string,
  maxLength = MAX_PROMPT_HISTORY_LENGTH,
): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return history;
  }
  const deduped = history.filter((p) => p !== trimmed);
  return [trimmed, ...deduped].slice(0, maxLength);
}
