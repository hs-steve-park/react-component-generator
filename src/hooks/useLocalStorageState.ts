import { useEffect, useState } from 'react';

interface Codec<T> {
  serialize: (value: T) => string;
  deserialize: (raw: string) => T;
}

const defaultCodec = <T,>(): Codec<T> => ({
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  codec: Codec<T> = defaultCodec<T>(),
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? codec.deserialize(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, codec.serialize(value));
    } catch {
      // 저장 공간 초과, 시크릿 모드 등으로 localStorage를 쓸 수 없는 경우 조용히 무시한다.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue] as const;
}
