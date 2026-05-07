// Minimal ambient module for "bun:test" so `bun run typecheck` passes
// without adding @types/bun (which pulls in a large surface). Bun resolves
// the real module at runtime; these declarations cover only what we use.
//
// If we ever need more (e.g. spyOn, mock.module, beforeAll), extend here.

declare module "bun:test" {
  type Lifecycle = (fn: () => void | Promise<void>) => void;

  type Matchers = {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeDefined(): void;
    toBeInstanceOf(cls: new (...args: never[]) => unknown): void;
    toThrow(expected?: unknown): void;
  };

  export function describe(label: string, body: () => void): void;
  export function test(label: string, body: () => void | Promise<void>): void;
  export function it(label: string, body: () => void | Promise<void>): void;
  export function expect<T = unknown>(value: T): Matchers;
  export const beforeEach: Lifecycle;
  export const afterEach: Lifecycle;
  export const beforeAll: Lifecycle;
  export const afterAll: Lifecycle;
}
