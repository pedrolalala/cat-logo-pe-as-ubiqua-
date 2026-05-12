import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Part } from '@/lib/api'

export interface CartItem extends Part {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (part: Part, quantity: number) => void
  removeFromCart: (partId: string) => void
  clearCart: () => void
  updateQuantity: (partId: string, quantity: number) => void
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

  useEffect(() => {
    localStorage.setItem('ubiqua_cart', JSON.stringify(items))
  }, [items])

  const addToCart = (part: Part, quantity: number) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === part.id)
      if (existing) {
        return current.map((item) =>
          item.id === part.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...current, { ...part, quantity }]
    })
  }

  const removeFromCart = (partId: string) => {
    setItems((current) => current.filter((item) => item.id !== partId))
  }

  const clearCart = () => {
    setItems([])
  }

  const updateQuantity = (partId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) => (item.id === partId ? { ...item, quantity } : item)),
    )
  }

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, updateQuantity }}>
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
