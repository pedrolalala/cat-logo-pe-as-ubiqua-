import { Outlet, useSearchParams, Link } from 'react-router-dom'
import { Search, Wrench, ShoppingCart, LayoutDashboard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/use-cart'

function CartButton() {
  const { items } = useCart()
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <Link
      to="/novo-orcamento"
      className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
    >
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-background">
          {itemCount}
        </span>
      )}
    </Link>
  )
}

export default function Layout() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [localQuery, setLocalQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery) {
        setSearchParams({ q: localQuery })
      } else {
        setSearchParams({})
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localQuery, setSearchParams])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-lg text-primary shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="hidden sm:inline-block font-extrabold text-2xl tracking-tighter uppercase text-primary">
              Ubìqua
            </span>
            <span className="sm:hidden font-extrabold text-xl tracking-tighter uppercase text-primary">
              Ubìqua
            </span>
          </Link>
          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Buscar por referência ou descrição..."
              className="pl-9 w-full bg-background/50 border-muted focus-visible:ring-primary shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              title="Painel Administrativo"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="py-6 mt-auto border-t bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ubiqua Peças. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-primary transition-colors">
              Suporte
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
