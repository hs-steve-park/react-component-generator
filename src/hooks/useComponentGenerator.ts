import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { useLocalStorageState } from './useLocalStorageState';
import { serializeComponents, deserializeComponents } from '../utils/componentStorage';
import { consumeGenerationStream } from '../utils/streamGeneration';

const COMPONENTS_STORAGE_KEY = 'rcg:components';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useLocalStorageState<GeneratedComponent[]>(
    COMPONENTS_STORAGE_KEY,
    [],
    { serialize: serializeComponents, deserialize: deserializeComponents },
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const updateComponent = (id: string, patch: Partial<GeneratedComponent>) => {
      setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    };

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      if (!res.body) {
        throw new Error('스트리밍 응답을 받을 수 없습니다.');
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newComponent: GeneratedComponent = {
        id,
        prompt,
        code: '',
        createdAt: new Date(),
        status: 'streaming',
      };
      setComponents((prev) => [newComponent, ...prev]);

      await consumeGenerationStream(res.body, {
        onDelta: (text) => {
          setComponents((prev) =>
            prev.map((c) => (c.id === id ? { ...c, code: c.code + text } : c)),
          );
        },
        onDone: (code) => {
          updateComponent(id, { code, status: 'done' });
        },
        onError: (message) => {
          updateComponent(id, { status: 'error', error: message });
          throw new Error(message);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setComponents]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, isLoading, error, generate, removeComponent, clearAll };
}
