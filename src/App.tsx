import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import NewQuote from './pages/NewQuote'
import AdminPage from './pages/admin/AdminPage'
import { CartProvider } from './hooks/use-cart'
import { AuthProvider } from './hooks/use-auth'
import { AuthWrapper } from './components/AuthWrapper'

const App = () => (
  <AuthProvider>
    <CartProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="bottom-right" richColors />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/novo-orcamento" element={<NewQuote />} />
              <Route
                path="/admin"
                element={
                  <AuthWrapper>
                    <AdminPage />
                  </AuthWrapper>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
)

export default App
