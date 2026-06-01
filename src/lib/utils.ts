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

export function isValidCNPJ(cnpj: string): boolean {
  const c = cnpj.replace(/[^\d]+/g, '')
  if (c === '' || c.length !== 14) return false

  if (/^(\d)\1+$/.test(c)) return false

  let tamanho = c.length - 2
  let numeros = c.substring(0, tamanho)
  const digitos = c.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false

  tamanho = tamanho + 1
  numeros = c.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false

  return true
}

export function formatCNPJ(value: string): string {
  let v = value.replace(/\D/g, '')
  if (v.length > 14) v = v.slice(0, 14)
  v = v.replace(/^(\d{2})(\d)/, '$1.$2')
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
  v = v.replace(/(\d{4})(\d)/, '$1-$2')
  return v
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
