import { describe, expect, it } from 'vitest'
import tailwindConfig from '../../tailwind.config.js'

// Rapport de contraste WCAG 2.1 (formule 1.4.3).
function relativeLuminance(hex) {
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(a, b) {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const colors = tailwindConfig.theme.extend.colors
const WHITE = '#FFFFFF'
const AA_TEXT = 4.5
const AA_LARGE = 3

describe('contrast helper', () => {
  it('matches the reference ratios from the WCAG examples', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })
})

describe('brand palette', () => {
  it('documents that the brand warm is NOT usable for text', () => {
    // Sert de garde-fou : si quelqu'un « simplifie » en remettant `warm` sous
    // du texte blanc, ce test rappelle pourquoi warm-strong existe.
    expect(contrastRatio(WHITE, colors.warm)).toBeLessThan(AA_TEXT)
  })

  it('keeps warm-strong above AA on white and on cream', () => {
    expect(contrastRatio(WHITE, colors['warm-strong'])).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio(colors['warm-strong'], colors.cream)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio(colors['warm-strong'], colors['light-cream'])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('keeps the hover variant darker than the resting state', () => {
    expect(contrastRatio(WHITE, colors['warm-dk']))
      .toBeGreaterThan(contrastRatio(WHITE, colors['warm-strong']))
  })

  it('keeps navy and sage usable for white text', () => {
    expect(contrastRatio(WHITE, colors.navy)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio(WHITE, colors.sage)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('keeps body text readable on every surface', () => {
    const MUTED = '#756B5B'
    for (const bg of [WHITE, colors.cream, colors['light-cream']]) {
      expect(contrastRatio(MUTED, bg)).toBeGreaterThanOrEqual(AA_TEXT)
      expect(contrastRatio(colors.navy, bg)).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('keeps the form field border distinguishable (WCAG 1.4.11)', () => {
    const FIELD_BORDER = '#9E8C68'
    expect(contrastRatio(FIELD_BORDER, WHITE)).toBeGreaterThanOrEqual(AA_LARGE)
    expect(contrastRatio(FIELD_BORDER, colors['light-cream'])).toBeGreaterThanOrEqual(AA_LARGE)
  })
})
