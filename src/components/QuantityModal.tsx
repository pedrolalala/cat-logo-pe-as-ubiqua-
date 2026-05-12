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
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/hooks/use-cart'
import { useNavigate } from 'react-router-dom'

interface QuantityModalProps {
  part: Part | null
  isOpen: boolean
  onClose: () => void
}

export function QuantityModal({ part, isOpen, onClose }: QuantityModalProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (part) {
      addToCart(part, quantity)
      toast.success('Item adicionado ao orçamento!', {
        description: `${quantity}x ${part.referencia} adicionado ao carrinho.`,
        action: {
          label: 'Ver Carrinho',
          onClick: () => navigate('/novo-orcamento'),
        },
      })
    }
    onClose()
  }

  const increment = () => setQuantity((q) => q + 1)
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
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantidade
              </label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={decrement} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center text-lg font-semibold"
                />
                <Button variant="outline" size="icon" onClick={increment}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
