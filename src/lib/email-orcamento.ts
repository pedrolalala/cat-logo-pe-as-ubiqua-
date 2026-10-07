// SPEC-172 (item 5): "Enviar por E-mail" abre o cliente de e-mail padrão do
// computador via `mailto:`, com assunto e corpo já preenchidos — mesmo
// mecanismo do envio de orçamento da Lucenera (SPEC-067,
// envio-inicial-cliente.ts). O sistema NÃO envia e-mail: sem SMTP, sem
// backend, sem chamada de rede no clique. `mailto:` não aceita anexo, então
// todo o conteúdo do orçamento vai no corpo, em texto.

const CRLF = '\r\n'

// Intl usa espaço não separável depois de "R$"; troca por espaço comum para
// não virar caractere estranho em cliente de e-mail antigo.
const brl = (v: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(v) || 0)
    .replace(/ /g, ' ')

const dataBR = (v?: string | null) => {
  if (!v) return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(v)
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const juntar = (partes: unknown[], sep: string) =>
  partes
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .join(sep)

function endereco(o: any): string {
  if (!o) return ''
  const rua = juntar([juntar([o.endereco, o.numero], ', '), o.complemento], ' - ')
  const cidade = juntar([o.cidade, o.estado ? String(o.estado).toUpperCase() : null], '/')
  return juntar([rua, o.bairro, cidade, o.cep ? `CEP ${o.cep}` : null], ' - ')
}

export interface EmailOrcamentoDados {
  orcamento: any // linha de orcamentos_revenda_ubiqua
  itens: { referencia?: string; descricao?: string; quantity?: number; valor_revenda?: number }[]
  cliente: any // linha de informacoes_cliente_ubiqua
  empresa: any // linha de configuracao_empresa_ubiqua (dados da própria Ubiqua)
}

export function numeroDoOrcamento(orcamento: any): string {
  return (
    orcamento?.numero_orcamento ||
    String(orcamento?.id || '')
      .split('-')[0]
      .toUpperCase()
  )
}

export function montarEmailOrcamento({ orcamento, itens, cliente, empresa }: EmailOrcamentoDados) {
  const nomeEmpresa = empresa?.nome_fantasia || 'Ubiqua'
  const numero = numeroDoOrcamento(orcamento)
  const subject = `Orçamento ${numero} - ${nomeEmpresa}`

  const pj = String(cliente?.cpf_cnpj || '').replace(/\D/g, '').length === 14
  const linhas: string[] = []
  const add = (...l: string[]) => linhas.push(...l)

  add(cliente?.nome ? `Olá, ${cliente.nome},` : 'Olá,', '')
  add(`Segue o orçamento Nº ${numero} para sua análise.`, '')

  add('ORÇAMENTO')
  add(`Número: ${numero}`)
  add(`Data: ${dataBR(orcamento?.created_at) || dataBR(new Date().toISOString())}`)
  const validade = dataBR(orcamento?.data_validade)
  if (validade) add(`Validade: ${validade}`)
  add('')

  add('CLIENTE')
  if (cliente?.nome) add(`Nome: ${cliente.nome}`)
  if (cliente?.cpf_cnpj) add(`${pj ? 'CNPJ' : 'CPF'}: ${cliente.cpf_cnpj}`)
  if (pj && cliente?.inscricao_estadual) add(`Inscrição Estadual: ${cliente.inscricao_estadual}`)
  if (cliente?.telefone) add(`Telefone: ${cliente.telefone}`)
  const emailCliente = cliente?.email_comercial || cliente?.email
  if (emailCliente) add(`E-mail: ${emailCliente}`)
  if (endereco(cliente)) add(`Endereço: ${endereco(cliente)}`)
  if (cliente && cliente.entrega_igual_principal === false) {
    const ent = endereco({
      endereco: cliente.endereco_entrega,
      numero: cliente.numero_entrega,
      complemento: cliente.complemento_entrega,
      bairro: cliente.bairro_entrega,
      cidade: cliente.cidade_entrega,
      estado: cliente.estado_entrega,
      cep: cliente.cep_entrega,
    })
    if (ent) add(`Endereço de entrega: ${ent}`)
  }
  if (cliente?.transportadora) add(`Transportadora: ${cliente.transportadora}`)
  add('')

  add('ITENS')
  let somaItens = 0
  itens.forEach((item, i) => {
    const qtd = Number(item.quantity) || 0
    const unit = Number(item.valor_revenda) || 0
    const sub = qtd * unit
    somaItens += sub
    add(`${i + 1}. ${juntar([item.referencia, item.descricao], ' - ')}`)
    add(`   Qtd: ${qtd}  |  Preço unit.: ${brl(unit)}  |  Subtotal: ${brl(sub)}`)
  })
  add('')

  const subtotal = orcamento?.valor_subtotal != null ? Number(orcamento.valor_subtotal) : somaItens
  const pct = Number(orcamento?.desconto_percentual) || 0
  const desconto =
    orcamento?.valor_desconto != null
      ? Number(orcamento.valor_desconto)
      : Math.round(subtotal * pct) / 100
  const total = orcamento?.valor_total != null ? Number(orcamento.valor_total) : subtotal - desconto
  const pctFmt = pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

  add('RESUMO')
  add(`Subtotal: ${brl(subtotal)}`)
  add(`Desconto${pct > 0 ? ` (${pctFmt}%)` : ''}: ${desconto > 0 ? `- ${brl(desconto)}` : brl(0)}`)
  add(`TOTAL GERAL: ${brl(total)}`)
  add('')

  if (orcamento?.condicoes_pagamento)
    add(`Condições de pagamento: ${orcamento.condicoes_pagamento}`)
  if (orcamento?.prazo_entrega) add(`Prazo de entrega: ${orcamento.prazo_entrega}`)
  if (orcamento?.observacoes) add(`Observações: ${orcamento.observacoes}`)
  if (orcamento?.condicoes_pagamento || orcamento?.prazo_entrega || orcamento?.observacoes) add('')

  add('Atenção: Valores de ST (Substituição Tributária) a confirmar no faturamento.', '')

  add('Atenciosamente,', nomeEmpresa)
  if (empresa?.razao_social && empresa.razao_social !== nomeEmpresa) add(empresa.razao_social)
  if (empresa?.cnpj) add(`CNPJ: ${empresa.cnpj}`)
  if (endereco(empresa)) add(endereco(empresa))
  if (empresa?.telefone) add(`Tel.: ${empresa.telefone}`)
  if (empresa?.email) add(`E-mail: ${empresa.email}`)
  if (empresa?.site) add(empresa.site)

  // CRLF vira %0D%0A no encodeURIComponent.
  const body = linhas.join(CRLF)
  return { subject, body, destinatario: emailCliente || '' }
}

export function montarMailtoUrl(destinatario: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(destinatario)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// Outlook clássico e alguns clientes no Windows cortam mailto: muito longo
// (~2.000 caracteres). Acima disso o e-mail abre mesmo assim com o corpo
// inteiro, e o texto completo também vai para a área de transferência para o
// usuário colar se o cliente de e-mail tiver cortado.
export const LIMITE_MAILTO = 2000

/**
 * Abre o cliente de e-mail padrão. Sem nenhuma chamada de rede.
 * Retorna 'copiado' quando o corpo era longo e também foi copiado.
 */
export async function abrirEmailOrcamento(dados: EmailOrcamentoDados): Promise<'ok' | 'copiado'> {
  const { subject, body, destinatario } = montarEmailOrcamento(dados)
  const url = montarMailtoUrl(destinatario, subject, body)
  let resultado: 'ok' | 'copiado' = 'ok'

  if (url.length > LIMITE_MAILTO) {
    try {
      await navigator.clipboard.writeText(body)
      resultado = 'copiado'
    } catch {
      // Sem acesso à área de transferência: segue só com o mailto.
    }
  }

  const a = document.createElement('a')
  a.href = url
  document.body.appendChild(a)
  a.click()
  a.remove()
  return resultado
}
