import { Outlet, useSearchParams, Link, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, LayoutDashboard, Home, Users, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

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
  const location = useLocation()

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
            className="flex flex-col items-start gap-0 font-semibold text-lg text-primary shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="hidden sm:inline-block font-extrabold text-2xl tracking-tighter uppercase text-primary leading-none">
              Ubìqua
            </span>
            <span className="sm:hidden font-extrabold text-xl tracking-tighter uppercase text-primary leading-none">
              Ubìqua
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-wide text-muted-foreground font-normal">
              Ubiqua Representações
            </span>
            <span className="sm:hidden text-[9px] uppercase tracking-wide text-muted-foreground font-normal">
              Representações
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium ml-4">
            <Link to="/" className="hover:text-primary transition-colors text-muted-foreground">
              Catálogo
            </Link>
            <Link
              to="/clientes"
              className="hover:text-primary transition-colors text-muted-foreground"
            >
              Cadastro de Cliente
            </Link>
            <Link
              to="/perfil"
              className="hover:text-primary transition-colors text-muted-foreground"
            >
              Cadastro de Representante
            </Link>
          </div>
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="w-full max-w-sm relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Buscar peças..."
                className="pl-9 w-full bg-background/50 border-muted focus-visible:ring-primary shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:py-10 pb-24 md:pb-10">
        <div className="block sm:hidden w-full max-w-sm relative group mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Buscar peças..."
            className="pl-9 w-full bg-background/50 border-muted focus-visible:ring-primary shadow-sm h-12"
          />
        </div>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            to="/"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors',
              location.pathname === '/' && 'text-primary',
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Início</span>
          </Link>
          <Link
            to="/clientes"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors',
              location.pathname.startsWith('/clientes') && 'text-primary',
            )}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cadastro</span>
          </Link>
          <Link
            to="/novo-orcamento"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors',
              location.pathname.startsWith('/novo-orcamento') && 'text-primary',
            )}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Carrinho</span>
          </Link>
          <Link
            to="/perfil"
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors',
              location.pathname.startsWith('/perfil') && 'text-primary',
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfil</span>
          </Link>
        </div>
      </nav>

      <footer className="hidden md:block py-6 mt-auto border-t bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ubiqua Representações. Todos os direitos reservados.</p>
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
