import { describe, it, expect } from 'vitest';

export const sum = (a: number, b: number) => a + b;

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('adds -1 + 5 to equal 4', () => {
    expect(sum(-1, 5)).toBe(4);
  });
});
