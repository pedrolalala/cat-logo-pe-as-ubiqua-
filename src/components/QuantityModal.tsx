import { Part } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/hooks/use-cart'
import { useNavigate } from 'react-router-dom'
import type { GroupedPart } from '@/hooks/use-parts'

interface QuantityModalProps {
  part: Part | null
  /** SPEC-171: grupo do card, para somar o estoque de todas as referências da mesma cor. */
  group?: GroupedPart | null
  isOpen: boolean
  onClose: () => void
}

const BACKORDER_TECHNICAL_MAX = 999

const corDe = (v: any) => (v?.cor || 'PADRÃO').toUpperCase().trim()

export function QuantityModal({ part, group, isOpen, onClose }: QuantityModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [backorderAck, setBackorderAck] = useState(false)
  const { addToCart, items: carrinho } = useCart()
  const navigate = useNavigate()

  // SPEC-171: mesma cor pode ter 2 referências (Manoella e -IS). O limite é a soma, e o pedido
  // é dividido entre elas: primeiro a de maior estoque, o resto na outra.
  const irmas = useMemo(() => {
    if (!part) return []
    const mesmaCor = group ? group.detalhesPorCor.filter((v) => corDe(v) === corDe(part)) : []
    return mesmaCor.length > 0 ? mesmaCor : [part]
  }, [part, group])

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setBackorderAck(false)
    }
  }, [isOpen])

  const dividirPedido = (total: number) => {
    const partes: { variante: any; qtd: number }[] = []
    let falta = total
    const ordenadas = [...irmas].sort(
      (a, b) => (Number(b.disponivel) || 0) - (Number(a.disponivel) || 0),
    )
    for (const v of ordenadas) {
      const noCarrinho = carrinho.find((i) => i.id === v.id)?.quantity ?? 0
      const livre = Math.max(0, (Number(v.disponivel) || 0) - noCarrinho)
      const qtd = Math.min(falta, livre)
      if (qtd > 0) {
        partes.push({ variante: v, qtd })
        falta -= qtd
      }
      if (falta === 0) break
    }
    return { partes, falta }
  }

  const handleConfirm = () => {
    if (part) {
      const avisoCarrinho = {
        label: 'Ver Carrinho',
        onClick: () => navigate('/novo-orcamento'),
      }
      if (isOutOfStock) {
        addToCart(part, quantity)
        toast.success('Item adicionado ao orçamento!', {
          description: `${quantity}x ${part.referencia} adicionado ao carrinho.`,
          action: avisoCarrinho,
        })
      } else {
        const { partes, falta } = dividirPedido(quantity)
        if (partes.length === 0) {
          toast.error('Todo o estoque desta cor já está no orçamento.')
          return
        }
        partes.forEach(({ variante, qtd }) => addToCart(variante, qtd))
        toast.success('Item adicionado ao orçamento!', {
          description:
            partes.map(({ variante, qtd }) => `${qtd}x ${variante.referencia}`).join(' + ') +
            (falta > 0 ? ` (${falta} já estavam no orçamento)` : '') +
            ' adicionado ao carrinho.',
          action: avisoCarrinho,
        })
      }
    }
    onClose()
  }

  const disponivel = irmas.reduce((soma, v) => soma + (Number((v as any).disponivel) || 0), 0)
  const isOutOfStock = disponivel <= 0
  const maxQty = isOutOfStock ? BACKORDER_TECHNICAL_MAX : disponivel

  const increment = () => setQuantity((q) => Math.min(maxQty, q + 1))
  const decrement = () => setQuantity((q) => Math.max(1, q - 1))

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md animate-fade-in zoom-in-95">
        <DialogHeader>
          <DialogTitle>Adicionar ao Orçamento</DialogTitle>
          <DialogDescription>Defina a quantidade para o item selecionado.</DialogDescription>
        </DialogHeader>

        {part && (
          <div className="py-4">
            <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
              <p className="font-mono text-sm text-primary font-bold mb-1">{part.referencia}</p>
              <p className="font-medium text-foreground">{part.descricao}</p>
              {irmas.length > 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Estoque somado:{' '}
                  {irmas
                    .map((v: any) => `${v.referencia} (${Number(v.disponivel) || 0})`)
                    .join(' + ')}
                  . O pedido é dividido entre as referências.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantidade
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={decrement}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={maxQty || 1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-20 text-center text-lg font-semibold h-12"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={increment}
                  disabled={quantity >= maxQty}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {isOutOfStock && (
          <div className="px-6 pb-2">
            <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden">
              <div className="flex items-center justify-center bg-white py-4 border-b border-orange-100">
                <img src="/og-image.png" alt="Ubiqua" className="h-6 w-auto" />
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-orange-900 leading-relaxed">
                  Esta peça está sem estoque no momento. Peças Ubiqua são importadas — o prazo
                  estimado de entrega é de até <strong>3 meses</strong>. Você pode confirmar o
                  pedido mesmo assim.
                </p>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={backorderAck}
                    onChange={(e) => setBackorderAck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-orange-900">
                    Estou ciente do prazo de importação e quero confirmar o pedido.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-12">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isOutOfStock ? !backorderAck : false}
            className="w-full sm:w-auto h-12"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
