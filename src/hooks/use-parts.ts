import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { aplicarEstoqueAtual } from '@/lib/estoque-atual'

export type GroupedPart = {
  id: string
  slug: string
  nomeExibicao: string
  totalAvailable: number
  coresDisponiveis: string[]
  imagemPrincipal: string | null
  valorRevenda: number
  /** Preço sugerido (vl_venda_produto), só informativo para o representante. Null quando nenhuma linha do grupo tem o campo preenchido. */
  precoSugerido: number | null
  detalhesPorCor: any[]
  ordem: number
}

export function getVariantImage(variant: any, fallbackImage: string | null) {
  const getSixDigits = (ref: string | null) => {
    if (!ref) return null
    const match = ref.match(/^[0-9]{6}/)
    if (match) return match[0]
    return null
  }
  const sixDigits = variant ? getSixDigits(variant.referencia) : null
  const storageBaseUrl =
    'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/'

  return (
    variant?.imagem_catalogo_url ||
    variant?.imagem_url ||
    fallbackImage ||
    (sixDigits ? `${storageBaseUrl}${sixDigits}_catalogo.jpg` : null)
  )
}

export const colorMap: Record<string, string> = {
  BRANCA: '#FFFFFF',
  PRETA: '#000000',
  AREIA: '#D2B48C',
  'VERDE SÁLVIA': '#77815C',
  'VERDE SALVIA': '#77815C',
  'OURO VELHO': '#CFB53B',
  PRATA: '#C0C0C0',
  COBRE: '#B87333',
  DOURADA: '#D4AF37',
  DOURADO: '#D4AF37',
  CORTEN: '#B87333',
  NÍQUEL: '#727472',
  NIQUEL: '#727472',
  AMARELA: '#FFFF00',
  AMARELO: '#FFFF00',
  AZUL: '#0000FF',
  VERMELHA: '#FF0000',
  VERMELHO: '#FF0000',
  VERDE: '#008000',
  ROSA: '#FFC0CB',
  LILAS: '#C8A2C8',
  MARROM: '#964B00',
  LARANJA: '#FFA500',
  GRAFITE: '#383428',
  CHUMBO: '#5A5A5A',
}

/**
 * Referência normalizada (SPEC-147): mesma peça vendida pela Manoella (sem sufixo)
 * e pela Islight (sufixo `-IS`) deve cair na mesma chave de agrupamento. Variantes
 * V2 (`-V2-IS`) continuam separadas automaticamente porque o código numérico de
 * referência delas já é diferente da versão normal (ex.: `339104` vs `339204-V2-IS`)
 * — não precisa tratamento especial, só não remover o `-V2`, só o `-IS`.
 */
function normalizeReferencia(referencia: unknown): string {
  return String(referencia || '')
    .trim()
    .toUpperCase()
    .replace(/-IS$/i, '')
}

function isIslightReferencia(referencia: unknown): boolean {
  return /-IS$/i.test(String(referencia || '').trim())
}

function isV2Referencia(referencia: unknown): boolean {
  return /-V2(-|$)/i.test(String(referencia || '').trim())
}

// Palavras que sempre aparecem depois do nome/forma do produto na convenção de
// texto da Ubiqua (ex.: "TORUS DESK LUMINÁRIA LED DE MESA BATERIA..."). Tudo
// que vem ANTES da primeira dessas palavras identifica o produto (nome + forma,
// como "TORUS DESK" vs "TORUS" vs "TORUS GLASS" vs "FLORA MINI" vs "FLORA");
// tudo que vem depois é specs/variação de texto entre as duas empresas que não
// deve interferir no agrupamento (ex.: uma fonte escreve "LUMINÁRIA LED" e a
// outra só "LUMINÁRIA", mas ambas representam a mesma peça).
const FAMILY_BOUNDARY_WORDS = new Set(['LUMINARIA', 'LUMINARARIA', 'LUM', 'LED', 'BATERIA'])

/**
 * Identidade de família do produto (independente de cor e de empresa), extraída
 * da descrição. Retorna `null` quando a descrição não contém nenhuma das
 * palavras de fronteira (itens que não são luminárias, como cabo/carregador) —
 * nesse caso o chamador deve cair de volta pro agrupamento por referência, pra
 * não arriscar juntar acessórios genéricos ("IS - CABO CARREGADOR") que não têm
 * texto suficiente pra se distinguir de um produto pro outro.
 */
function extractFamilyIdentity(desc: string): string | null {
  const normalized = desc
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/^IS[\s-]+/, '')

  const tokens = normalized.split(/[^A-Z0-9]+/).filter(Boolean)
  const boundaryIndex = tokens.findIndex((t) => FAMILY_BOUNDARY_WORDS.has(t))

  if (boundaryIndex <= 0) return null
  return tokens.slice(0, boundaryIndex).join(' ')
}

export function groupCatalogItems(items: any[]): GroupedPart[] {
  // Peças órfãs (SPEC-147): linha sem sufixo `-IS`, sem estoque (disponivel <= 0
  // ou nulo) e sem nenhuma irmã `-IS` no mesmo grupo de referência somem do
  // catálogo (nunca mais foram repostas). Primeiro mapeia quais grupos têm ao
  // menos uma linha `-IS`, pra decidir quais linhas remover antes de agrupar.
  const hasIslightSibling = new Map<string, boolean>()
  items.forEach((item) => {
    const key = normalizeReferencia(item.referencia)
    if (isIslightReferencia(item.referencia)) {
      hasIslightSibling.set(key, true)
    } else if (!hasIslightSibling.has(key)) {
      hasIslightSibling.set(key, false)
    }
  })

  const filteredItems = items.filter((item) => {
    if (isIslightReferencia(item.referencia)) return true
    const disponivel = Number(item.disponivel) || 0
    if (disponivel > 0) return true
    const key = normalizeReferencia(item.referencia)
    // Some do catálogo só quando não há estoque nenhum E não existe irmã -IS.
    return hasIslightSibling.get(key) === true
  })

  const groups = new Map<string, GroupedPart>()

  filteredItems.forEach((item) => {
    // Usa a descrição mais "limpa" disponível pra extrair a família (a
    // `descricao` costuma ter menos texto de cor embutido incorretamente do
    // que `desc_produto`, que às vezes vem copiado errado entre cores).
    const descForFamily = (item.descricao || item.desc_produto || '').trim()
    const desc = (item.desc_produto || item.descricao || 'Sem nome').trim()
    const price = Number(item.valor_revenda) || 0
    const normalizedRef = normalizeReferencia(item.referencia)
    const familyIdentity = descForFamily ? extractFamilyIdentity(descForFamily) : null
    const key = familyIdentity
      ? `${familyIdentity}${isV2Referencia(item.referencia) ? '_V2' : ''}`
      : normalizedRef || `${desc.toLowerCase()}_${price.toFixed(2)}`

    if (!groups.has(key)) {
      const slugBase = key
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const slug = slugBase || `item-${price.toFixed(2).replace('.', '-')}`

      groups.set(key, {
        id: key,
        slug,
        nomeExibicao: desc,
        totalAvailable: 0,
        coresDisponiveis: [],
        imagemPrincipal: null,
        valorRevenda: price,
        precoSugerido: null,
        detalhesPorCor: [],
        ordem: item.ordem ?? 999999,
      })
    }

    const group = groups.get(key)!
    group.totalAvailable += Number(item.disponivel) || 0

    const cor = (item.cor || 'PADRÃO').trim()
    if (!group.coresDisponiveis.includes(cor)) {
      group.coresDisponiveis.push(cor)
    }

    if (item.imagem_catalogo_url && !group.imagemPrincipal) {
      group.imagemPrincipal = item.imagem_catalogo_url
    }

    if (item.ordem !== null && item.ordem < group.ordem) {
      group.ordem = item.ordem
    }

    group.detalhesPorCor.push(item)
  })

  // Preço de revenda e preço sugerido do card unificado: quando as linhas do
  // grupo divergem em valor (caso raro — 3 dos 13 pares hoje), usa o MENOR
  // valor, mesmo critério que a view `vw_catalogo_unificado` já usa.
  groups.forEach((group) => {
    const prices = group.detalhesPorCor
      .map((item) => Number(item.valor_revenda) || 0)
      .filter((p) => p > 0)
    if (prices.length > 0) {
      group.valorRevenda = Math.min(...prices)
    }

    const suggestedPrices = group.detalhesPorCor
      .map((item) => (item.vl_venda_produto != null ? Number(item.vl_venda_produto) : null))
      .filter((p): p is number => p != null && !Number.isNaN(p) && p > 0)
    group.precoSugerido = suggestedPrices.length > 0 ? Math.min(...suggestedPrices) : null
  })

  return Array.from(groups.values()).sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem
    return a.nomeExibicao.localeCompare(b.nomeExibicao)
  })
}

export function useProductDetail(slug: string | undefined) {
  const [data, setData] = useState<GroupedPart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!slug) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: items, error: fetchError } = await supabase
        .from('revenda_ubiqua')
        .select('*, imagem_catalogo_url')
        .eq('slug' as any, slug)
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('id', { ascending: false })

      if (fetchError) throw fetchError

      if (!items || items.length === 0) {
        const { data: allItems, error: allFetchError } = await supabase
          .from('revenda_ubiqua')
          .select('*, imagem_catalogo_url')
          .order('ordem', { ascending: true, nullsFirst: false })
          .order('id', { ascending: false })

        if (allFetchError) throw allFetchError

        const grouped = groupCatalogItems(await aplicarEstoqueAtual(allItems || []))
        const matched = grouped.find((g) => g.slug === slug)
        setData(matched || null)
        return
      }

      const grouped = groupCatalogItems(await aplicarEstoqueAtual(items))
      setData(grouped[0] || null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}

export function useParts() {
  const [data, setData] = useState<GroupedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: items, error: fetchError } = await supabase
        .from('revenda_ubiqua')
        .select('*, imagem_catalogo_url')
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('id', { ascending: false })

      if (fetchError) throw fetchError

      // SPEC-171: estoque atual de produtos, não a cópia de junho em revenda_ubiqua
      const grouped = groupCatalogItems(await aplicarEstoqueAtual(items || []))
      setData(grouped)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('revenda_ubiqua_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenda_ubiqua' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { data, loading, error, refetch: load }
}
