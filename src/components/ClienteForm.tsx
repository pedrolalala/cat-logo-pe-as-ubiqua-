import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { formatCPFOuCNPJ, isValidCPFOuCNPJ } from '@/lib/utils'
import { buscarEnderecoPorCep } from '@/services/cepService'

// SPEC-172: cadastro completo do cliente do Catálogo Ubiqua. Mesmos campos
// (e nomes de coluna) do cadastro de cliente da Lucenera (public.contatos):
// endereço principal, IE, regime, e-mail financeiro, entrega e cobrança.

export const REGIMES_TRIBUTARIOS = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'mei', label: 'MEI' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
  { value: 'outro', label: 'Outro' },
]

const CAMPOS_ENDERECO = ['cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado'] as const
type CampoEndereco = (typeof CAMPOS_ENDERECO)[number]
type Sufixo = '' | '_entrega' | '_cobranca'

export interface ClienteFormData {
  nome: string
  email: string
  telefone: string
  cpf_cnpj: string
  inscricao_estadual: string
  regime_tributario: string
  email_comercial: string
  email_financeiro: string
  transportadora: string
  entrega_igual_principal: boolean
  cobranca_igual_principal: boolean
  [campo: string]: string | boolean
}

export function clienteFormVazio(): ClienteFormData {
  const base: ClienteFormData = {
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
    regime_tributario: '',
    email_comercial: '',
    email_financeiro: '',
    transportadora: '',
    entrega_igual_principal: true,
    cobranca_igual_principal: true,
  }
  for (const suf of ['', '_entrega', '_cobranca'] as Sufixo[]) {
    for (const c of CAMPOS_ENDERECO) base[`${c}${suf}`] = ''
  }
  return base
}

export function clienteFormDeRegistro(c: any): ClienteFormData {
  const form = clienteFormVazio()
  for (const k of Object.keys(form)) {
    if (typeof form[k] === 'boolean') form[k] = c?.[k] ?? true
    else form[k] = c?.[k] ?? ''
  }
  return form
}

const digitos = (v: string) => (v || '').replace(/\D/g, '')

export const isPJ = (cpfCnpj: string) => digitos(cpfCnpj).length === 14

export function formatTelefone(value: string): string {
  const d = digitos(value).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatCep(value: string): string {
  const d = digitos(value).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Devolve a primeira mensagem de erro, ou null se o formulário está válido. */
export function validarClienteForm(f: ClienteFormData): string | null {
  if (!String(f.nome).trim()) return 'Informe o nome.'
  if (!EMAIL_RE.test(String(f.email).trim())) return 'E-mail principal inválido.'
  for (const [campo, rotulo] of [
    ['email_comercial', 'E-mail comercial'],
    ['email_financeiro', 'E-mail financeiro'],
  ]) {
    const v = String(f[campo]).trim()
    if (v && !EMAIL_RE.test(v)) return `${rotulo} inválido.`
  }
  const tel = digitos(String(f.telefone))
  if (tel.length < 10 || tel.length > 11) return 'Telefone inválido. Use DDD + número.'
  if (!isValidCPFOuCNPJ(String(f.cpf_cnpj))) return 'CPF/CNPJ inválido.'
  if (isPJ(String(f.cpf_cnpj))) {
    if (!String(f.inscricao_estadual).trim())
      return 'Informe a Inscrição Estadual (ou "ISENTO") para CNPJ.'
    if (!f.regime_tributario) return 'Selecione o regime tributário para CNPJ.'
  }
  const secoes: [Sufixo, string, boolean][] = [
    ['', 'principal', true],
    ['_entrega', 'de entrega', !f.entrega_igual_principal],
    ['_cobranca', 'de cobrança', !f.cobranca_igual_principal],
  ]
  for (const [suf, nome, exigir] of secoes) {
    if (!exigir) continue
    if (digitos(String(f[`cep${suf}`])).length !== 8) return `CEP ${nome} inválido.`
    for (const c of ['endereco', 'numero', 'bairro', 'cidade', 'estado'] as CampoEndereco[]) {
      if (!String(f[`${c}${suf}`]).trim()) return `Preencha o endereço ${nome} completo.`
    }
  }
  return null
}

/** Monta o payload do banco. Endereços "iguais ao principal" são gravados como cópia. */
export function clienteFormParaPayload(f: ClienteFormData) {
  const pj = isPJ(String(f.cpf_cnpj))
  const t = (v: unknown) => {
    const s = String(v ?? '').trim()
    return s || null
  }
  const payload: Record<string, unknown> = {
    nome: String(f.nome).trim(),
    email: String(f.email).trim(),
    telefone: String(f.telefone).trim(),
    cpf_cnpj: String(f.cpf_cnpj).trim(),
    tipo_pessoa: pj ? 'PJ' : 'PF',
    inscricao_estadual: pj ? t(f.inscricao_estadual)?.toUpperCase() ?? null : null,
    regime_tributario: pj ? t(f.regime_tributario) : null,
    email_comercial: t(f.email_comercial),
    email_financeiro: t(f.email_financeiro),
    transportadora: t(f.transportadora),
    entrega_igual_principal: !!f.entrega_igual_principal,
    cobranca_igual_principal: !!f.cobranca_igual_principal,
  }
  for (const c of CAMPOS_ENDERECO) {
    const principal = c === 'estado' ? t(f[c])?.toUpperCase() ?? null : t(f[c])
    payload[c] = principal
    for (const suf of ['_entrega', '_cobranca'] as Sufixo[]) {
      const igual = suf === '_entrega' ? f.entrega_igual_principal : f.cobranca_igual_principal
      const proprio = c === 'estado' ? t(f[`${c}${suf}`])?.toUpperCase() ?? null : t(f[`${c}${suf}`])
      payload[`${c}${suf}`] = igual ? principal : proprio
    }
  }
  return payload
}

interface Props {
  value: ClienteFormData
  onChange: (next: ClienteFormData) => void
  disabled?: boolean
}

function Campo({
  id,
  label,
  obrigatorio,
  className,
  children,
}: {
  id: string
  label: string
  obrigatorio?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label htmlFor={id}>
        {label} {obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

export function ClienteFormFields({ value: f, onChange, disabled }: Props) {
  const [buscandoCep, setBuscandoCep] = useState<Sufixo | null>(null)
  const set = (patch: Partial<ClienteFormData>) => onChange({ ...f, ...patch } as ClienteFormData)
  const pj = isPJ(String(f.cpf_cnpj))

  async function onCep(suf: Sufixo, raw: string) {
    const cep = formatCep(raw)
    const next = { ...f, [`cep${suf}`]: cep } as ClienteFormData
    onChange(next)
    if (digitos(cep).length !== 8) return
    setBuscandoCep(suf)
    try {
      const end = await buscarEnderecoPorCep(cep)
      if (end) {
        onChange({
          ...next,
          [`endereco${suf}`]: end.logradouro || next[`endereco${suf}`],
          [`bairro${suf}`]: end.bairro || next[`bairro${suf}`],
          [`cidade${suf}`]: end.cidade || next[`cidade${suf}`],
          [`estado${suf}`]: end.uf || next[`estado${suf}`],
        } as ClienteFormData)
      }
    } finally {
      setBuscandoCep(null)
    }
  }

  const blocoEndereco = (suf: Sufixo, obrigatorio: boolean) => (
    <div className="grid grid-cols-6 gap-3">
      <Campo id={`cep${suf}`} label="CEP" obrigatorio={obrigatorio} className="col-span-3 sm:col-span-2">
        <div className="relative">
          <Input
            id={`cep${suf}`}
            inputMode="numeric"
            placeholder="00000-000"
            maxLength={9}
            value={String(f[`cep${suf}`])}
            onChange={(e) => onCep(suf, e.target.value)}
            disabled={disabled}
          />
          {buscandoCep === suf && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </Campo>
      <Campo id={`endereco${suf}`} label="Logradouro" obrigatorio={obrigatorio} className="col-span-6 sm:col-span-4">
        <Input
          id={`endereco${suf}`}
          value={String(f[`endereco${suf}`])}
          onChange={(e) => set({ [`endereco${suf}`]: e.target.value })}
          disabled={disabled}
        />
      </Campo>
      <Campo id={`numero${suf}`} label="Número" obrigatorio={obrigatorio} className="col-span-2">
        <Input
          id={`numero${suf}`}
          value={String(f[`numero${suf}`])}
          onChange={(e) => set({ [`numero${suf}`]: e.target.value })}
          disabled={disabled}
        />
      </Campo>
      <Campo id={`complemento${suf}`} label="Complemento" className="col-span-4">
        <Input
          id={`complemento${suf}`}
          value={String(f[`complemento${suf}`])}
          onChange={(e) => set({ [`complemento${suf}`]: e.target.value })}
          disabled={disabled}
        />
      </Campo>
      <Campo id={`bairro${suf}`} label="Bairro" obrigatorio={obrigatorio} className="col-span-6 sm:col-span-2">
        <Input
          id={`bairro${suf}`}
          value={String(f[`bairro${suf}`])}
          onChange={(e) => set({ [`bairro${suf}`]: e.target.value })}
          disabled={disabled}
        />
      </Campo>
      <Campo id={`cidade${suf}`} label="Cidade" obrigatorio={obrigatorio} className="col-span-4 sm:col-span-3">
        <Input
          id={`cidade${suf}`}
          value={String(f[`cidade${suf}`])}
          onChange={(e) => set({ [`cidade${suf}`]: e.target.value })}
          disabled={disabled}
        />
      </Campo>
      <Campo id={`estado${suf}`} label="UF" obrigatorio={obrigatorio} className="col-span-2 sm:col-span-1">
        <Input
          id={`estado${suf}`}
          maxLength={2}
          value={String(f[`estado${suf}`])}
          onChange={(e) => set({ [`estado${suf}`]: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
          disabled={disabled}
        />
      </Campo>
    </div>
  )

  const secaoAlternativa = (
    suf: '_entrega' | '_cobranca',
    titulo: string,
    flag: 'entrega_igual_principal' | 'cobranca_igual_principal',
  ) => (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold border-b pb-1">{titulo}</h4>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox
          checked={!!f[flag]}
          disabled={disabled}
          onCheckedChange={(checked) => {
            const igual = checked === true
            const patch: Partial<ClienteFormData> = { [flag]: igual }
            // Ao desmarcar, começa com uma cópia do principal para editar.
            if (!igual) {
              for (const c of CAMPOS_ENDERECO) {
                if (!String(f[`${c}${suf}`]).trim()) patch[`${c}${suf}`] = f[c]
              }
            }
            set(patch)
          }}
        />
        Igual ao endereço principal
      </label>
      {!f[flag] && blocoEndereco(suf, true)}
    </section>
  )

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h4 className="text-sm font-semibold border-b pb-1">Identificação</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo id="nome" label="Nome / Razão Social" obrigatorio className="sm:col-span-2">
            <Input
              id="nome"
              value={f.nome}
              onChange={(e) => set({ nome: e.target.value })}
              disabled={disabled}
            />
          </Campo>
          <Campo id="cpf_cnpj" label="CPF/CNPJ" obrigatorio>
            <Input
              id="cpf_cnpj"
              inputMode="numeric"
              maxLength={18}
              placeholder="CPF ou CNPJ"
              value={f.cpf_cnpj}
              onChange={(e) => set({ cpf_cnpj: formatCPFOuCNPJ(e.target.value) })}
              disabled={disabled}
            />
          </Campo>
          <Campo id="telefone" label="Telefone" obrigatorio>
            <Input
              id="telefone"
              type="tel"
              inputMode="numeric"
              placeholder="(00) 00000-0000"
              value={f.telefone}
              onChange={(e) => set({ telefone: formatTelefone(e.target.value) })}
              disabled={disabled}
            />
          </Campo>
          {pj && (
            <>
              <Campo id="inscricao_estadual" label="Inscrição Estadual" obrigatorio>
                <Input
                  id="inscricao_estadual"
                  placeholder='Número ou "ISENTO"'
                  value={f.inscricao_estadual}
                  onChange={(e) => set({ inscricao_estadual: e.target.value.toUpperCase() })}
                  disabled={disabled}
                />
              </Campo>
              <Campo id="regime_tributario" label="Regime Tributário" obrigatorio>
                <Select
                  value={f.regime_tributario || undefined}
                  onValueChange={(v) => set({ regime_tributario: v })}
                  disabled={disabled}
                >
                  <SelectTrigger id="regime_tributario">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIMES_TRIBUTARIOS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            </>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold border-b pb-1">E-mails</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo id="email" label="E-mail principal" obrigatorio>
            <Input
              id="email"
              type="email"
              value={f.email}
              onChange={(e) => set({ email: e.target.value })}
              disabled={disabled}
            />
          </Campo>
          <Campo id="email_comercial" label="E-mail comercial">
            <Input
              id="email_comercial"
              type="email"
              value={f.email_comercial}
              onChange={(e) => set({ email_comercial: e.target.value })}
              disabled={disabled}
            />
          </Campo>
          <Campo id="email_financeiro" label="E-mail financeiro">
            <Input
              id="email_financeiro"
              type="email"
              value={f.email_financeiro}
              onChange={(e) => set({ email_financeiro: e.target.value })}
              disabled={disabled}
            />
          </Campo>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold border-b pb-1">Endereço principal</h4>
        {blocoEndereco('', true)}
      </section>

      {secaoAlternativa('_entrega', 'Endereço de entrega', 'entrega_igual_principal')}
      {secaoAlternativa('_cobranca', 'Endereço de cobrança', 'cobranca_igual_principal')}

      <section className="space-y-3">
        <h4 className="text-sm font-semibold border-b pb-1">Logística</h4>
        <Campo id="transportadora" label="Transportadora">
          <Input
            id="transportadora"
            value={f.transportadora}
            onChange={(e) => set({ transportadora: e.target.value })}
            disabled={disabled}
          />
        </Campo>
      </section>
    </div>
  )
}
