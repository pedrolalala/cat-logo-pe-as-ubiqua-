/**
 * A mesma peça pode vir de duas importações: Manoella (referência sem sufixo) e Islight
 * (sufixo `-IS`). No orçamento ela aparece numa linha só, com o estoque somado; por baixo
 * continua uma linha por referência, para cada empresa faturar a sua parte.
 */
export const chavePeca = (referencia: unknown) =>
  String(referencia ?? '')
    .trim()
    .toUpperCase()
    .replace(/-IS$/i, '')

export const origemPeca = (referencia: unknown) =>
  /-IS$/i.test(String(referencia ?? '').trim()) ? 'Islight' : 'Manoella'

/**
 * Divide `total` entre as referências da peça: primeiro a de maior estoque, o resto nas
 * outras. Sem estoque em nenhuma (encomenda), tudo fica numa referência só — a que já está
 * no orçamento, se houver.
 */
export function dividirQuantidade<T extends { id: number | string; disponivel?: number | null }>(
  variantes: T[],
  total: number,
  idsNoOrcamento: (number | string)[] = [],
): { variante: T; qtd: number }[] {
  if (variantes.length === 0 || total <= 0) return []
  const estoque = (v: T) => Math.max(0, Number(v.disponivel) || 0)
  const somaEstoque = variantes.reduce((s, v) => s + estoque(v), 0)

  if (somaEstoque <= 0) {
    const escolhida = variantes.find((v) => idsNoOrcamento.includes(v.id)) ?? variantes[0]
    return [{ variante: escolhida, qtd: total }]
  }

  const ordenadas = [...variantes].sort((a, b) => estoque(b) - estoque(a))
  const partes = new Map<T, number>()
  let falta = total
  for (const v of ordenadas) {
    const qtd = Math.min(falta, estoque(v))
    if (qtd > 0) partes.set(v, qtd)
    falta -= qtd
    if (falta === 0) break
  }
  // Acima do estoque somado (não deveria acontecer: a tela limita) vai para a de maior estoque.
  if (falta > 0) partes.set(ordenadas[0], (partes.get(ordenadas[0]) ?? 0) + falta)

  return variantes.filter((v) => partes.has(v)).map((v) => ({ variante: v, qtd: partes.get(v)! }))
}
