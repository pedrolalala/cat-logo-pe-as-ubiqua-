// SPEC-172: PDF do orçamento do Catálogo Ubiqua.
//
// Layout portado do orçamento da Lucenera (Edge Function generate-report,
// reportType 'orcamento', repo gestao-financeira): cabeçalho com logo + dados
// da empresa à esquerda e "Aprovação do Cliente" à direita, bloco do cliente,
// tabela de itens, caixa SubTotal/Desconto/Valor Total e observações.
//
// Diferença proposital: nenhum dado ou texto da Lucenera. Os dados da empresa
// vêm só de configuracao_empresa_ubiqua (linha id=1); campo vazio simplesmente
// não é impresso. empresa_ubiqua NÃO é usada aqui (é a tabela dos parceiros).
//
// Compartilhado em _shared para o envio por e-mail reaproveitar o mesmo PDF.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

type Supa = any

export interface DadosOrcamentoUbiqua {
  orcamento: any
  cliente: any
  itens: any[]
  empresa: any
  representante: { nome?: string; email?: string; empresa?: string } | null
}

export async function carregarOrcamentoUbiqua(
  admin: Supa,
  quoteId: string,
): Promise<DadosOrcamentoUbiqua | null> {
  const { data: orcamento, error } = await admin
    .from('orcamentos_revenda_ubiqua')
    .select(
      `*,
      cliente:informacoes_cliente_ubiqua!orcamentos_revenda_ubiqua_cliente_id_fkey(*),
      itens:itens_orcamento_ubiqua(
        id, quantidade, valor_unitario, desconto_item, referencia_snapshot, descricao_snapshot, ordem
      )`,
    )
    .eq('id', quoteId)
    .maybeSingle()

  if (error) throw new Error(`Erro ao ler o orçamento: ${error.message}`)
  if (!orcamento) return null

  const { data: empresa } = await admin
    .from('configuracao_empresa_ubiqua')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  // Representante = quem cadastrou o cliente (usuário do catálogo) e a
  // empresa parceira dele.
  let representante: DadosOrcamentoUbiqua['representante'] = null
  const repId = orcamento.cliente?.cadastrado_por_usuario_id
  if (repId) {
    const { data: rep } = await admin
      .from('usuarios_ubiqua')
      .select('nome, email, empresa:empresa_ubiqua(nome_fantasia)')
      .eq('id', repId)
      .maybeSingle()
    if (rep) {
      representante = {
        nome: rep.nome || undefined,
        email: rep.email || undefined,
        empresa: rep.empresa?.nome_fantasia || undefined,
      }
    }
  }

  const itens = [...(orcamento.itens || [])].sort(
    (a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0),
  )

  return {
    orcamento,
    cliente: orcamento.cliente || {},
    itens,
    empresa: empresa || { nome_fantasia: 'UBIQUA' },
    representante,
  }
}

export function numeroOrcamento(orcamento: any): string {
  return orcamento.numero_orcamento || String(orcamento.id).split('-')[0].toUpperCase()
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const dataBR = (v?: string | null) => {
  if (!v) return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00Z`) : new Date(v)
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

// As fontes padrão do pdf-lib só codificam WinAnsi: caractere fora disso
// (emoji, símbolo raro vindo do cadastro) derrubaria a geração inteira.
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
function limpar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFC')
    .replace(/[\r\n\t]+/g, ' ')
    .split('')
    .map((c) => (c.charCodeAt(0) <= 0xff || WIN_ANSI_EXTRA.has(c) ? c : '?'))
    .join('')
    .trim()
}

function quebrarLinhas(texto: string, font: PDFFont, size: number, largura: number): string[] {
  const linhas: string[] = []
  for (const paragrafo of String(texto ?? '').split(/\r?\n/)) {
    const palavras = limpar(paragrafo).split(/\s+/).filter(Boolean)
    let atual = ''
    for (const palavra of palavras) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra
      if (font.widthOfTextAtSize(tentativa, size) <= largura) {
        atual = tentativa
      } else {
        if (atual) linhas.push(atual)
        // palavra sozinha maior que a largura: corta
        let resto = palavra
        while (font.widthOfTextAtSize(resto, size) > largura && resto.length > 1) {
          let n = resto.length
          while (n > 1 && font.widthOfTextAtSize(resto.slice(0, n), size) > largura) n--
          linhas.push(resto.slice(0, n))
          resto = resto.slice(n)
        }
        atual = resto
      }
    }
    if (atual) linhas.push(atual)
  }
  return linhas
}

function juntar(partes: (string | null | undefined)[], sep: string) {
  return partes.map((p) => (p ?? '').toString().trim()).filter(Boolean).join(sep)
}

function linhasEndereco(o: any, sufixo = ''): string[] {
  const g = (k: string) => o?.[`${k}${sufixo}`]
  const rua = juntar([juntar([g('endereco'), g('numero')], ', '), g('complemento')], ' - ')
  const cidadeUf = juntar([g('cidade'), g('estado')?.toUpperCase()], '/')
  const cepCidade = juntar([g('cep') ? `CEP ${g('cep')}` : null, g('bairro'), cidadeUf], ' - ')
  return [rua, cepCidade].filter(Boolean)
}

async function carregarLogo(pdfDoc: PDFDocument, url?: string | null) {
  if (!url) return null
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const bytes = new Uint8Array(await resp.arrayBuffer())
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
    return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
  } catch (e) {
    console.error('[pdf-orcamento-ubiqua] logo não carregado:', url, e)
    return null
  }
}

export async function gerarPdfOrcamentoUbiqua(dados: DadosOrcamentoUbiqua): Promise<Uint8Array> {
  const { orcamento, cliente, itens, empresa, representante } = dados

  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`Orçamento ${numeroOrcamento(orcamento)} - ${limpar(empresa.nome_fantasia)}`)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const cinza = rgb(0.4, 0.4, 0.4)

  const A4: [number, number] = [595.28, 841.89]
  let page: PDFPage = pdfDoc.addPage(A4)
  const { width, height } = page.getSize()
  const margem = 40
  const direita = width - margem

  const txt = (
    p: PDFPage,
    t: unknown,
    x: number,
    y: number,
    size = 9,
    f: PDFFont = font,
    color = rgb(0, 0, 0),
  ) => {
    const s = limpar(t)
    if (s) p.drawText(s, { x, y, size, font: f, color })
  }
  const txtDir = (p: PDFPage, t: unknown, xDir: number, y: number, size = 9, f: PDFFont = font) => {
    const s = limpar(t)
    if (s) p.drawText(s, { x: xDir - f.widthOfTextAtSize(s, size), y, size, font: f })
  }

  // ---------- Cabeçalho: logo + empresa (esquerda) ----------
  let yEsq = height - 15
  const logo = await carregarLogo(pdfDoc, empresa.logo_url)
  if (logo) {
    const escala = Math.min(110 / logo.width, 50 / logo.height)
    const w = logo.width * escala
    const h = logo.height * escala
    page.drawImage(logo, { x: margem, y: height - 15 - h, width: w, height: h })
    yEsq = height - 15 - h - 14
  } else {
    yEsq = height - 35
  }

  const nomeEmpresa = empresa.nome_fantasia || 'UBIQUA'
  txt(page, nomeEmpresa, margem, yEsq, logo ? 10 : 16, bold)
  yEsq -= logo ? 10 : 14
  const linhasEmpresa = [
    empresa.razao_social && empresa.razao_social !== nomeEmpresa ? empresa.razao_social : null,
    juntar(
      [
        empresa.cnpj ? `CNPJ ${empresa.cnpj}` : null,
        empresa.inscricao_estadual ? `IE ${empresa.inscricao_estadual}` : null,
      ],
      '  ·  ',
    ),
    ...linhasEndereco(empresa),
    juntar([empresa.telefone, empresa.email, empresa.site], '  ·  '),
  ].filter(Boolean)
  for (const l of linhasEmpresa) {
    txt(page, l, margem, yEsq, 8)
    yEsq -= 10
  }

  // ---------- Cabeçalho: aprovação (direita), igual ao da Lucenera ----------
  const topoDir = height - 15
  const aprovY = topoDir - 25
  page.drawLine({ start: { x: direita - 160, y: aprovY }, end: { x: direita, y: aprovY }, thickness: 1 })
  txt(page, 'Aprovação do Cliente', direita - 155, aprovY + 3, 8)
  const assinY = aprovY - 25
  page.drawLine({ start: { x: direita - 160, y: assinY }, end: { x: direita, y: assinY }, thickness: 1 })
  txt(page, nomeEmpresa, direita - 155, assinY + 3, 8)
  const impressao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  txt(page, `Data Impressão ${impressao}`, direita - 110, assinY - 10, 6, font, cinza)
  txt(page, `Data Emissão ${dataBR(orcamento.created_at) || '-'}`, direita - 110, assinY - 19, 6, font, cinza)

  let y = Math.min(yEsq + 10, assinY - 19) - 15
  page.drawLine({ start: { x: margem, y }, end: { x: direita, y }, thickness: 2 })

  // ---------- Cliente + número ----------
  y -= 25
  txt(page, 'Orçamento para', margem, y, 11)
  txtDir(page, 'Orçamento', direita, y, 11)
  y -= 18
  const nomeCliente = limpar(cliente.nome || 'CLIENTE NÃO INFORMADO').toUpperCase()
  for (const l of quebrarLinhas(nomeCliente, bold, 13, 360)) {
    txt(page, l, margem, y, 13, bold)
    y -= 15
  }
  txtDir(page, numeroOrcamento(orcamento), direita, y + 15, 13, bold)
  const validade = dataBR(orcamento.data_validade)
  if (validade) txtDir(page, `Válido até ${validade}`, direita, y + 2, 8)

  const pj = cliente.tipo_pessoa === 'PJ' || String(cliente.cpf_cnpj || '').replace(/\D/g, '').length === 14
  const linhasCliente = [
    juntar(
      [
        cliente.cpf_cnpj ? `${pj ? 'CNPJ' : 'CPF'}: ${cliente.cpf_cnpj}` : null,
        pj && cliente.inscricao_estadual ? `IE: ${cliente.inscricao_estadual}` : null,
      ],
      '   ',
    ),
    ...linhasEndereco(cliente),
    juntar(
      [cliente.telefone ? `TEL: ${cliente.telefone}` : null, cliente.email_comercial || cliente.email],
      '   ',
    ),
    !cliente.entrega_igual_principal && linhasEndereco(cliente, '_entrega').length
      ? `Entrega: ${linhasEndereco(cliente, '_entrega').join(' - ')}`
      : null,
    cliente.transportadora ? `Transportadora: ${cliente.transportadora}` : null,
  ].filter(Boolean) as string[]
  y -= 2
  for (const l of linhasCliente) {
    for (const q of quebrarLinhas(l, font, 9, width - 2 * margem)) {
      txt(page, q, margem, y, 9)
      y -= 12
    }
  }

  if (representante?.nome) {
    y -= 6
    txt(page, 'Representante', margem, y, 9)
    txt(
      page,
      juntar([representante.nome, representante.empresa ? `(${representante.empresa})` : null], ' '),
      margem,
      y - 12,
      9,
      bold,
    )
    y -= 24
  }

  // ---------- Itens ----------
  y -= 14
  const cols = { ref: margem, desc: margem + 80, qtd: 395, unit: 470, sub: direita }
  const larguraDesc = cols.qtd - 25 - cols.desc
  const cabecalhoItens = () => {
    txt(page, 'Referência', cols.ref, y, 9, bold)
    txt(page, 'Descrição', cols.desc, y, 9, bold)
    txtDir(page, 'Qtd.', cols.qtd, y, 9, bold)
    txtDir(page, 'Vl. Unit.', cols.unit, y, 9, bold)
    txtDir(page, 'Subtotal', cols.sub, y, 9, bold)
    y -= 6
    page.drawLine({ start: { x: margem, y }, end: { x: direita, y }, thickness: 1 })
    y -= 13
  }
  const novaPagina = () => {
    page = pdfDoc.addPage(A4)
    y = height - 50
  }
  cabecalhoItens()

  let somaItens = 0
  for (const item of itens) {
    const qtd = Number(item.quantidade) || 0
    const unit = Number(item.valor_unitario) || 0
    const sub = qtd * unit - (Number(item.desconto_item) || 0)
    somaItens += sub
    const descLinhas = quebrarLinhas(item.descricao_snapshot || '-', font, 8, larguraDesc)
    const alturaItem = Math.max(1, descLinhas.length) * 10 + 5
    if (y - alturaItem < 60) {
      novaPagina()
      cabecalhoItens()
    }
    txt(page, item.referencia_snapshot || '-', cols.ref, y, 8, bold)
    descLinhas.forEach((l, i) => txt(page, l, cols.desc, y - i * 10, 8))
    txtDir(page, String(qtd), cols.qtd, y, 8)
    txtDir(page, brl(unit), cols.unit, y, 8)
    txtDir(page, brl(sub), cols.sub, y, 8)
    y -= alturaItem
  }

  // ---------- Totais (mesma conta da tela: subtotal - subtotal * % ) ----------
  const subtotal = orcamento.valor_subtotal != null ? Number(orcamento.valor_subtotal) : somaItens
  const pct = Number(orcamento.desconto_percentual) || 0
  const valorDesconto =
    orcamento.valor_desconto != null
      ? Number(orcamento.valor_desconto)
      : Math.round(subtotal * pct) / 100
  const total =
    orcamento.valor_total != null ? Number(orcamento.valor_total) : subtotal - valorDesconto

  if (y < 200) novaPagina()
  y -= 5
  const boxH = 70
  page.drawRectangle({
    x: direita - 230,
    y: y - boxH + 10,
    width: 230,
    height: boxH,
    color: rgb(0.95, 0.95, 0.95),
  })
  let rowY = y - 15
  const pctFmt = pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  txt(page, 'SubTotal:', direita - 210, rowY, 10)
  txtDir(page, brl(subtotal), direita - 16, rowY, 10)
  rowY -= 15
  txt(page, pct > 0 ? `Desconto (${pctFmt}%):` : 'Desconto:', direita - 210, rowY, 10)
  txtDir(page, valorDesconto > 0 ? `- ${brl(valorDesconto)}` : brl(0), direita - 16, rowY, 10)
  rowY -= 18
  txt(page, 'Valor Total:', direita - 210, rowY, 12, bold)
  txtDir(page, brl(total), direita - 16, rowY, 12, bold)
  y -= boxH + 15

  // ---------- Condições, prazo, observações ----------
  const blocos: [string, string | null][] = [
    ['Condições de Pagamento', orcamento.condicoes_pagamento || null],
    ['Prazo de Entrega', orcamento.prazo_entrega || null],
    ['Observações', orcamento.observacoes || null],
  ]
  for (const [titulo, valor] of blocos) {
    if (!valor) continue
    const linhas = quebrarLinhas(valor, font, 8, width - 2 * margem)
    if (y - 14 - linhas.length * 11 < 60) novaPagina()
    txt(page, `${titulo}:`, margem, y, 9, bold)
    y -= 13
    for (const l of linhas) {
      txt(page, l, margem, y, 8)
      y -= 11
    }
    y -= 8
  }

  // ---------- Aviso de ST ----------
  if (y < 90) novaPagina()
  y -= 4
  page.drawRectangle({
    x: margem,
    y: y - 16,
    width: width - 2 * margem,
    height: 24,
    color: rgb(1, 0.93, 0.84),
    borderColor: rgb(0.99, 0.84, 0.67),
    borderWidth: 1,
  })
  const aviso = 'Atenção: Valores de ST (Substituição Tributária) a confirmar no faturamento'
  page.drawText(aviso, {
    x: width / 2 - bold.widthOfTextAtSize(aviso, 9) / 2,
    y: y - 7,
    size: 9,
    font: bold,
    color: rgb(0.6, 0.2, 0.07),
  })

  // ---------- Rodapé + numeração ----------
  const rodape = juntar([empresa.razao_social || nomeEmpresa, empresa.cnpj, empresa.telefone, empresa.email], '  ·  ')
  const paginas = pdfDoc.getPages()
  paginas.forEach((p, i) => {
    const r = limpar(rodape)
    p.drawText(r, { x: width / 2 - font.widthOfTextAtSize(r, 7) / 2, y: 20, size: 7, font, color: cinza })
    const n = `${i + 1} de ${paginas.length}`
    p.drawText(n, { x: direita - bold.widthOfTextAtSize(n, 9), y: height - 15, size: 9, font: bold })
  })

  return await pdfDoc.save()
}
