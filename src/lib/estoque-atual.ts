import { supabase } from '@/lib/supabase/client'

/**
 * SPEC-171: troca `disponivel` das linhas de `revenda_ubiqua` (cópia parada de 03/06) pelo
 * estoque atual de `produtos`, via RPC `ubiqua_estoque_atual` (SECURITY DEFINER — representante
 * não lê `produtos` direto). Referência sem produto correspondente fica com 0. Se a RPC falhar,
 * devolve as linhas como vieram para o catálogo não sumir.
 */
const chave = (referencia: unknown) =>
  String(referencia ?? '')
    .trim()
    .toUpperCase()

export async function aplicarEstoqueAtual<T extends { referencia?: string | null }>(
  items: T[],
): Promise<T[]> {
  if (items.length === 0) return items
  const { data, error } = await supabase.rpc('ubiqua_estoque_atual' as any)
  if (error) {
    console.warn('ubiqua_estoque_atual:', error.message)
    return items
  }
  const mapa = new Map<string, number>(
    ((data as any[]) ?? []).map((r) => [chave(r.referencia), Number(r.disponivel) || 0]),
  )
  return items.map((item) => ({ ...item, disponivel: mapa.get(chave(item.referencia)) ?? 0 }))
}
