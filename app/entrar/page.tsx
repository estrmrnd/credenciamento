'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '../../lib/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '../temaEscuro/input'
import { ModeToggle } from '../temaEscuro/icons'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      setLoading(false)
      router.push('/auth/credenciamento')
    } catch (err) {
      setLoading(false)
      setError('Email ou senha inválidos.')
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    const provider = new GoogleAuthProvider()

    try {
      await signInWithPopup(auth, provider)
      setLoading(false)
      router.push('/auth/credenciamento')
    } catch (err) {
      setLoading(false)
      setError('Erro ao entrar com Google.')
    }
  }

  return (
    <div className="relative max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md mt-10">
      <ModeToggle />

      <h1 className="text-2xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">Login</h1>

      <form onSubmit={handleSignIn} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="my-4 text-center text-sm text-muted-foreground">ou</div>

      <Button
        variant="secondary"
        className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? 'Carregando...' : 'Entrar com Google'}
      </Button>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <p className="text-sm text-center mt-6 text-muted-foreground">
        Ainda não tem cadastro?{' '}
        <a href="/cadastrar" className="text-blue-600 hover:underline">
          Cadastre-se aqui
        </a>
      </p>
    </div>
  )
}
