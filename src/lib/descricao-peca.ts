/**
 * A descrição que vem do cadastro (`desc_produto`) termina com uma cor copiada errada entre as
 * variantes (ex.: todo PLISSE MINI termina em "- AREIA", a CRYSTAL CORTEN em "- BRONZE F.").
 * A cor certa é a coluna `cor` da referência. Então: tira a cor do fim do texto e põe a da peça.
 *
 * Só conta como cor o trecho que começa com uma palavra de cor — acessórios usam o mesmo
 * " - " para outra coisa ("CABO CARREGADOR - PLISSE NANO") e a coluna `cor` deles traz o
 * modelo ("CRYSTAL", "FLORA"), que não deve ir para o fim da descrição.
 */
const PALAVRAS_DE_COR = new Set([
  'AMARELA',
  'AMARELO',
  'AREIA',
  'AZUL',
  'BRANCA',
  'BRANCO',
  'BRONZE',
  'CHUMBO',
  'CIMENTO',
  'COBRE',
  'CORTEN',
  'DOURADA',
  'DOURADO',
  'GRAFITE',
  'LARANJA',
  'LILAS',
  'MARMORE',
  'MARROM',
  'NIQUEL',
  'OURO',
  'PRATA',
  'PRETA',
  'PRETO',
  'ROSA',
  'UV',
  'V.',
  'VERDE',
  'VERMELHA',
  'VERMELHO',
])

const ehCor = (texto: unknown) => {
  const primeira = String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .split(/\s+/)[0]
  return PALAVRAS_DE_COR.has(primeira)
}

/** Remove o último trecho " - XXX" quando ele é uma cor. */
export function descricaoSemCor(descricao: unknown): string {
  const texto = String(descricao ?? '').trim()
  const corte = texto.lastIndexOf(' - ')
  if (corte <= 0) return texto
  return ehCor(texto.slice(corte + 3)) ? texto.slice(0, corte).trim() : texto
}

/** Descrição com a cor da referência selecionada no fim. */
export function descricaoComCor(descricao: unknown, cor: unknown): string {
  const base = descricaoSemCor(descricao)
  const c = String(cor ?? '').trim()
  return ehCor(c) ? `${base} - ${c.toUpperCase()}` : base
}
