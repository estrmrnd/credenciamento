'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth, db } from '../../lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ModeToggle } from '../temaEscuro/icons'
import { Input } from '../temaEscuro/input'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
      const user = userCredential.user

      await setDoc(doc(db, 'users', user.uid), {
        nome,
        email,
        createdAt: new Date(),
      })

      router.push('/auth/credenciamento')
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErro('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nome: user.displayName || '',
          email: user.email || '',
          createdAt: new Date(),
        })
      }

      router.push('auth/credenciamento')
    } catch (error: any) {
      setErro('Erro ao fazer login com Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md mt-10">
      <ModeToggle />

      <h1 className="text-2xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">Cadastre-se</h1>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando...' : 'Criar'}
        </Button>
      </form>
      <div
        style={{
          margin: 5,
          color: '#888',
          textAlign: 'center',
          fontSize: 14,
        }}
      >
        ou
      </div>
      <Button onClick={handleGoogleLogin} className="w-full" disabled={loading}>
          {loading ? 'Carregando...' : 'Entrar com Google'}
      </Button>
      {erro && (
        <p
          style={{
            color: 'red',
            marginTop: 15,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {erro}
        </p>
      )}
      <p className="text-sm text-center mt-6 text-muted-foreground">
        Já tem cadastro?{' '}
        <a href="/cadastrar" className="text-blue-600 hover:underline">
        Entre aqui
        </a>
      </p>
    </div>
  )
}
