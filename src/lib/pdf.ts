import { supabase } from '@/lib/supabase/client'
import { QuoteData } from './api'

// SPEC-172: o PDF é gerado de verdade no servidor pela Edge Function
// `gerar-pdf-orcamento-ubiqua` (pdf-lib, mesmo modelo do orçamento da
// Lucenera). Antes daqui saía um .html com dados de exemplo.

export const nomeArquivoPdf = (quote: Pick<QuoteData, 'id' | 'numero_orcamento'>) =>
  `Orcamento_${quote.numero_orcamento || quote.id.split('-')[0].toUpperCase()}.pdf`

export async function fetchQuotePdf(quoteId: string): Promise<Blob> {
  const { data: sessionData } = await supabase.auth.getSession()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-pdf-orcamento-ubiqua`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({ quote_id: quoteId }),
    },
  )
  if (!response.ok) {
    const detalhe = await response.text().catch(() => '')
    console.error('Erro ao gerar PDF do orçamento:', response.status, detalhe)
    let msg = 'Erro ao gerar o PDF.'
    try {
      msg = JSON.parse(detalhe).error || msg
    } catch {
      // resposta não-JSON: mantém a mensagem genérica
    }
    throw new Error(msg)
  }
  const blob = await response.blob()
  if (blob.type && !blob.type.includes('pdf')) throw new Error('A resposta não é um PDF.')
  return blob
}

export async function downloadQuotePdf(quote: QuoteData): Promise<void> {
  const blob = await fetchQuotePdf(quote.id)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivoPdf(quote)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

