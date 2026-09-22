import { useState } from 'react';
import type { GeneratedComponent } from '../types';
import { LivePreview } from './LivePreview';
import { CodeView } from './CodeView';
import { resolveActiveTabForStatus, type Tab } from '../utils/tabTransition';

interface ComponentCardProps {
  component: GeneratedComponent;
  onRemove: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  isLoading: boolean;
}

export function ComponentCard({ component, onRemove, onRegenerate, isLoading }: ComponentCardProps) {
  const status = component.status ?? 'done';
  const isStreaming = status === 'streaming';
  const [activeTab, setActiveTab] = useState<Tab>(isStreaming ? 'code' : 'preview');
  const [previewKey, setPreviewKey] = useState(0);
  const [prevStatus, setPrevStatus] = useState(status);

  // 렌더링 도중 상태를 조정해(React 권장 패턴) 불필요한 추가 렌더 사이클(useEffect + setState)을 피한다.
  if (status !== prevStatus) {
    setActiveTab(resolveActiveTabForStatus(status, prevStatus, activeTab));
    setPrevStatus(status);
  }

  const createdAt = component.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="component-card">
      <div className="card-header">
        <div className="card-title-group">
          <span>{createdAt}</span>
          <p className="card-prompt" title={component.prompt}>
            {component.prompt}
          </p>
        </div>
        <div className="card-actions">
          <button
            className="btn-refresh"
            onClick={() => setPreviewKey((k) => k + 1)}
            title="미리보기 새로고침"
            aria-label="미리보기 새로고침"
            disabled={isStreaming}
          >
            ↻
          </button>
          <button
            className="btn-regenerate"
            onClick={() => onRegenerate(component.prompt)}
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '재생성'}
          </button>
          <button
            className="btn-remove"
            onClick={() => onRemove(component.id)}
          >
            삭제
          </button>
        </div>
      </div>
      <div className="card-tabs">
        <button
          className={`tab ${activeTab === 'preview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          미리보기
        </button>
        <button
          className={`tab ${activeTab === 'code' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          코드{isStreaming ? ' ●' : ''}
        </button>
      </div>
      {status === 'error' && component.error && (
        <p className="card-error" role="alert">
          {component.error}
        </p>
      )}
      <div className="card-content">
        {activeTab === 'preview' ? (
          isStreaming ? (
            <div className="preview-pending">
              <p>코드를 생성하는 중입니다...</p>
            </div>
          ) : (
            <LivePreview key={previewKey} code={component.code} />
          )
        ) : (
          <CodeView code={component.code} />
        )}
      </div>
    </div>
  );
}
