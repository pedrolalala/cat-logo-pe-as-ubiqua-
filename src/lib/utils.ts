/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps a finish color name to its corresponding HEX code.
 * Normalizes strings to handle accents and casing.
 */
export function getFinishColorHex(
  colorName: string,
  fallbackMap: Record<string, string> = {},
): string {
  if (!colorName) return '#CCCCCC'

  const normalizedColor = colorName.trim().toUpperCase()
  const unaccentedColor = normalizedColor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const COLOR_MAP: Record<string, string> = {
    'UV BRONZE': '#A87932',
    'UV CHROME': '#D1D1D1',
    'UV DOURADA': '#D4AF37',
    'MARMORE VERDE': '#2E473B',
    'MÁRMORE VERDE': '#2E473B',
    'MARMORE PRETO': '#1A1A1A',
    'MÁRMORE PRETO': '#1A1A1A',
    'MARMORE BRANCO': '#F2F2F2',
    'MÁRMORE BRANCO': '#F2F2F2',
    CIMENTO: '#8E9089',
    'VERMELHO CHAMA': '#CF352E',
  }

  return (
    COLOR_MAP[unaccentedColor] ||
    COLOR_MAP[normalizedColor] ||
    fallbackMap[normalizedColor] ||
    '#CCCCCC'
  )
}
