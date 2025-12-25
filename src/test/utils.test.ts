import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('Utils', () => {
  it('cn merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })
})
