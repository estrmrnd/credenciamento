'use client'

import { Button } from '@/components/ui/button'
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { auth } from '../../lib/firebase'
import { ModeToggle } from '../temaEscuro/icons'
import { Input } from '../temaEscuro/input'

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

        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="my-4 text-center text-sm text-muted-foreground">ou</div>

      <Button
        variant="secondary"
        className="w-full bg-[#FFFFFF] hover:bg-[#F4F4F4] text-black border border-gray-600 border-2 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-gray-400 cursor-pointer"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>

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
