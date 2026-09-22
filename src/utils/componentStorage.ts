import type { GeneratedComponent } from '../types';

type SerializedComponent = Omit<GeneratedComponent, 'createdAt'> & { createdAt: string };

export function serializeComponents(components: GeneratedComponent[]): string {
  return JSON.stringify(components);
}

export function deserializeComponents(raw: string): GeneratedComponent[] {
  const parsed = JSON.parse(raw) as SerializedComponent[];
  return parsed.map((item) => ({ ...item, createdAt: new Date(item.createdAt) }));
}
