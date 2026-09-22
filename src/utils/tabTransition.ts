import type { GenerationStatus } from '../types';

export type Tab = 'preview' | 'code';

/**
 * 생성 상태 전이에 따라 다음에 활성화할 탭을 결정한다.
 * streaming으로 전이되면 코드 탭으로, streaming에서 done으로 전이되면 미리보기 탭으로 전환하고
 * 그 외의 전이(예: error로 전이)에서는 현재 탭을 유지한다.
 */
export function resolveActiveTabForStatus(
  status: GenerationStatus,
  prevStatus: GenerationStatus,
  currentTab: Tab,
): Tab {
  if (status === 'streaming') return 'code';
  if (status === 'done' && prevStatus === 'streaming') return 'preview';
  return currentTab;
}
