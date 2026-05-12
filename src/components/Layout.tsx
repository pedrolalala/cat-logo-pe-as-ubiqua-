import { Outlet, useSearchParams } from 'react-router-dom'
import { Search, Wrench } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

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
          <div className="flex items-center gap-2 font-semibold text-lg text-primary shrink-0">
            <Wrench className="w-6 h-6" />
            <span className="hidden sm:inline-block tracking-tight text-foreground">
              Catálogo Ubiqua
            </span>
            <span className="sm:hidden tracking-tight text-foreground">Ubiqua</span>
          </div>
          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Buscar por referência ou descrição..."
              className="pl-9 w-full bg-background/50 border-muted focus-visible:ring-primary shadow-sm"
            />
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
