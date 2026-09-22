export type Provider = 'anthropic' | 'google';

/** 생성 진행 상태. 로컬 스토리지에 저장된 과거 데이터에는 이 필드가 없을 수 있으며, 그 경우 'done'으로 취급한다. */
export type GenerationStatus = 'streaming' | 'done' | 'error';

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
  status?: GenerationStatus;
  error?: string;
}
