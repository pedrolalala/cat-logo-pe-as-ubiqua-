import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import NewQuote from './pages/NewQuote'
import AdminPage from './pages/admin/AdminPage'
import ProductDetail from './pages/ProductDetail'
import { CartProvider } from './hooks/use-cart'
import { AuthProvider } from './hooks/use-auth'
import { AuthWrapper } from './components/AuthWrapper'
import { OnboardingGuard } from './components/OnboardingGuard'
import OnboardingPage from './pages/Onboarding'

const App = () => (
  <AuthProvider>
    <CartProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="bottom-right" richColors />
          <Routes>
            <Route
              path="/onboarding"
              element={
                <AuthWrapper>
                  <OnboardingGuard>
                    <OnboardingPage />
                  </OnboardingGuard>
                </AuthWrapper>
              }
            />
            <Route
              element={
                <AuthWrapper>
                  <OnboardingGuard>
                    <Layout />
                  </OnboardingGuard>
                </AuthWrapper>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/produtos" element={<Index />} />
              <Route path="/produto/:slug" element={<ProductDetail />} />
              <Route path="/novo-orcamento" element={<NewQuote />} />
              <Route path="/carrinho" element={<NewQuote />} />
              <Route path="/admin/*" element={<AdminPage />} />
              <Route path="/dashboard" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
)

export default App
