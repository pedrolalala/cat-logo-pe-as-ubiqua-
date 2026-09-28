/**
 * SPEC-170: botões "Sair" e "Excluir conta" do representante. Usado no Perfil e no onboarding
 * (conta nova fica presa no onboarding e não chega ao Perfil). A exclusão passa pela Edge
 * Function `excluir-conta-ubiqua`, que recusa conta da equipe Lucenera, admin e quem tem
 * clientes cadastrados.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, LogOut, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/use-auth'

const PALAVRA = 'EXCLUIR'

export function SairButton({ className }: { className?: string }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function sair() {
    const { error } = await signOut()
    if (error) {
      toast.error('Falha ao sair: ' + error.message)
      return
    }
    navigate('/')
  }

  return (
    <Button type="button" variant="outline" onClick={sair} className={className}>
      <LogOut className="w-4 h-4 mr-2" />
      Sair
    </Button>
  )
}

export function ExcluirContaButton({ className }: { className?: string }) {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  async function excluir() {
    setExcluindo(true)
    const { error } = await deleteAccount()
    setExcluindo(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setAberto(false)
    toast.success('Conta excluída.')
    navigate('/')
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          setTexto('')
          setAberto(true)
        }}
        className={className}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Excluir conta
      </Button>
      <AlertDialog open={aberto} onOpenChange={(v) => !excluindo && setAberto(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu login e seu cadastro de representante serão apagados e não dá para desfazer.
              Orçamentos já enviados continuam guardados na Ubiqua. Para confirmar, digite{' '}
              <strong>{PALAVRA}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={PALAVRA}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={texto.trim().toUpperCase() !== PALAVRA || excluindo}
              onClick={excluir}
            >
              {excluindo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir definitivamente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
