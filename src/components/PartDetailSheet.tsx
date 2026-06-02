import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PartDetailSheetProps {
  variant: any
  groupName: string
  groupImage: string | null
  isOpen: boolean
  onClose: () => void
  onAddBudget: (variant: any) => void
}

export function PartDetailSheet({
  variant,
  groupName,
  groupImage,
  isOpen,
  onClose,
  onAddBudget,
}: PartDetailSheetProps) {
  if (!variant) return null

  const displayPrice = variant.valor_revenda ?? 0
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(displayPrice)

  const getSixDigits = (ref: string | null) => {
    if (!ref) return null
    const match = ref.match(/^[0-9]{6}/)
    if (match) return match[0]
    return null
  }

  const sixDigits = getSixDigits(variant.referencia)
  const storageBaseUrl =
    'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/'

  const mappedImageUrl =
    variant.imagem_catalogo_url ||
    variant.imagem_url ||
    groupImage ||
    (sixDigits ? `${storageBaseUrl}${sixDigits}_catalogo.jpg` : null)

  const cleanDescription = variant.descricao
    ? variant.descricao.replace(/-\s*(ISLIGHT|MANOELLA)\s*$/i, '').trim()
    : groupName

  const color = variant.cor || 'PADRÃO'
  const isOutOfStock = (Number(variant.disponivel) || 0) <= 0
  const stockDisplay = isOutOfStock
    ? 'Não tem aquela peça em estoque'
    : `${variant.disponivel} disponível`

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-extrabold uppercase leading-tight">
            {groupName}
          </SheetTitle>
          <SheetDescription>Detalhes e especificações da peça</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          <div className="w-full aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center border shadow-sm p-4 relative group">
            {mappedImageUrl ? (
              <img
                src={mappedImageUrl}
                alt={groupName}
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageOff className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-sm font-semibold uppercase tracking-wider opacity-60">
                  Sem Imagem
                </span>
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge
                className={
                  isOutOfStock
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }
              >
                {stockDisplay}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Referência
                </p>
                <p className="font-mono text-sm font-bold text-foreground">
                  {variant.referencia || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Cor
                </p>
                <p className="text-sm font-bold text-foreground capitalize">{color}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                Descrição Completa
              </p>
              <p className="text-base text-foreground leading-relaxed">{cleanDescription}</p>
            </div>

            <div className="pt-4 border-t mt-2">
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                Valor Revenda
              </p>
              <p className="text-4xl font-extrabold text-orange-600 tracking-tight">
                {formattedPrice}
              </p>
            </div>

            <Button
              className={cn(
                'w-full mt-4 shadow-md transition-all h-12 text-base font-semibold text-white',
                !isOutOfStock
                  ? 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed opacity-50',
              )}
              size="lg"
              onClick={() => {
                if (isOutOfStock) return
                onClose()
                onAddBudget(variant)
              }}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isOutOfStock ? 'Não tem aquela peça em estoque' : 'Adicionar ao Orçamento'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
