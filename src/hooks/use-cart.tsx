import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PartVariant } from '@/lib/api'

export interface CartItem extends PartVariant {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  activeQuoteId: string | null
  selectedCustomerId: string | null
  setActiveQuoteId: (id: string | null) => void
  setSelectedCustomerId: (id: string | null) => void
  addToCart: (part: PartVariant, quantity: number) => void
  removeFromCart: (partId: string | number) => void
  clearCart: () => void
  updateQuantity: (partId: string | number, quantity: number) => void
  updatePrice: (partId: string | number, price: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('ubiqua_cart')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(() => {
    return localStorage.getItem('ubiqua_quote_id')
  })

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    return localStorage.getItem('ubiqua_client_id')
  })

  useEffect(() => {
    localStorage.setItem('ubiqua_cart', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (activeQuoteId) localStorage.setItem('ubiqua_quote_id', activeQuoteId)
    else localStorage.removeItem('ubiqua_quote_id')
  }, [activeQuoteId])

  useEffect(() => {
    if (selectedCustomerId) localStorage.setItem('ubiqua_client_id', selectedCustomerId)
    else localStorage.removeItem('ubiqua_client_id')
  }, [selectedCustomerId])

  const addToCart = (part: PartVariant, quantity: number) => {
    const disponivel = Number((part as any).disponivel) || 0
    if (disponivel <= 0) return

    setItems((current) => {
      const existing = current.find((item) => item.id === part.id)
      if (existing) {
        return current.map((item) => {
          if (item.id === part.id) {
            return { ...item, quantity: Math.min(disponivel, item.quantity + quantity) }
          }
          return item
        })
      }
      return [...current, { ...part, quantity: Math.min(disponivel, quantity) }]
    })
  }

  const removeFromCart = (partId: string | number) => {
    setItems((current) => current.filter((item) => item.id !== partId))
  }

  const clearCart = () => {
    setItems([])
    setActiveQuoteId(null)
    setSelectedCustomerId(null)
  }

  const updateQuantity = (partId: string | number, quantity: number) => {
    setItems((current) =>
      current.map((item) => (item.id === partId ? { ...item, quantity } : item)),
    )
  }

  const updatePrice = (partId: string | number, price: number) => {
    setItems((current) =>
      current.map((item) => (item.id === partId ? { ...item, valor_revenda: price } : item)),
    )
  }

  return (
    <CartContext.Provider
      value={{
        items,
        activeQuoteId,
        selectedCustomerId,
        setActiveQuoteId,
        setSelectedCustomerId,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        updatePrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
