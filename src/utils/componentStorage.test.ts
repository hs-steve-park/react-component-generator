import { describe, it, expect } from 'vitest';
import { serializeComponents, deserializeComponents } from './componentStorage';
import type { GeneratedComponent } from '../types';

describe('serializeComponents / deserializeComponents', () => {
  it('직렬화 후 역직렬화하면 원본과 동일한 값을 복원한다', () => {
    const components: GeneratedComponent[] = [
      {
        id: '1',
        prompt: '버튼 만들어줘',
        code: 'render(<button>OK</button>)',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ];

    const restored = deserializeComponents(serializeComponents(components));

    expect(restored).toEqual(components);
  });

  it('createdAt을 Date 인스턴스로 복원한다', () => {
    const components: GeneratedComponent[] = [
      { id: '1', prompt: 'p', code: 'c', createdAt: new Date('2026-01-01T00:00:00.000Z') },
    ];

    const restored = deserializeComponents(serializeComponents(components));

    expect(restored[0].createdAt).toBeInstanceOf(Date);
  });

  it('잘못된 JSON 문자열을 역직렬화하면 예외를 던진다', () => {
    expect(() => deserializeComponents('not-json')).toThrow();
  });
});
