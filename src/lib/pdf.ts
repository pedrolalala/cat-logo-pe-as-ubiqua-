import { QuoteData } from './api'

// Utilitário para formatar moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

/**
 * Gera um HTML formatado do orçamento.
 * Como não podemos adicionar bibliotecas de geração de PDF no client (ex: jspdf),
 * enviamos o HTML em base64 para o backend renderizar (ex: puppeteer) na Edge Function,
 * e usamos para simular o download local.
 */
export const generateQuoteHTML = (quote: QuoteData): string => {
  const itemsHtml = quote.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px;">${item.referencia}</td>
      <td style="padding: 12px 8px;">${item.descricao}</td>
      <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">${formatCurrency(item.valor_revenda)}</td>
      <td style="padding: 12px 8px; text-align: right;">${formatCurrency(item.valor_revenda * item.quantity)}</td>
    </tr>
  `,
    )
    .join('')

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Orçamento Ubiqua</title>
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; max-width: 900px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
          <div>
            <img src="https://img.usecurling.com/i?q=company+logo&shape=outline" alt="Logo da Empresa" style="height: 60px; margin-bottom: 10px;" />
            <h1 style="font-size: 24px; margin: 0; color: #111827;">Ubiqua Peças</h1>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">Dados do Parceiro</h2>
            <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 18px;">João da Silva</p>
            <p style="margin: 0; color: #6b7280;">joao.silva@parceiro.exemplo.com</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left;">
              <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Referência</th>
              <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Descrição</th>
              <th style="padding: 12px 8px; font-weight: 600; color: #374151; text-align: center;">Quantidade</th>
              <th style="padding: 12px 8px; font-weight: 600; color: #374151; text-align: right;">Preço Unitário</th>
              <th style="padding: 12px 8px; font-weight: 600; color: #374151; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="background-color: #f9fafb; padding: 20px 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Total Geral do Orçamento</div>
            <div style="font-size: 24px; font-weight: 700; color: #111827;">
              ${formatCurrency(quote.valor_total)}
            </div>
          </div>
        </div>

        <div style="text-align: center; color: #9a3412; background-color: #ffedd5; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; font-weight: 600; margin-top: 40px;">
          Atenção: Valores de ST (Substituição Tributária) a confirmar no faturamento
        </div>
      </body>
    </html>
  `
}

export const generateQuotePDFBase64 = async (quote: QuoteData): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const html = generateQuoteHTML(quote)
      // Converte o HTML para base64 com suporte a UTF-8 de forma segura
      const base64 = btoa(
        new Uint8Array(new TextEncoder().encode(html)).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          '',
        ),
      )
      resolve(base64)
    }, 1000)
  })
}

export const downloadMockPDF = async (quote: QuoteData) => {
  // Como não há bibliotecas no pacote para geração client-side de um binário de PDF complexo,
  // exportamos a representação estrutural para uma janela de impressão imediata ou
  // criamos um documento HTML local formatado como o PDF de destino que aciona impressão.
  const html = generateQuoteHTML(quote)
  const htmlWithPrintScript = html.replace(
    '</body>',
    '<script>window.onload = () => window.print();</script></body>',
  )

  const blob = new Blob([htmlWithPrintScript], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orcamento-ubiqua-${new Date().getTime()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
