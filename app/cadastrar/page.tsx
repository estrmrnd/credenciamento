// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   createUserWithEmailAndPassword,
//   signInWithPopup,
//   GoogleAuthProvider,
// } from 'firebase/auth'
// import { auth, db } from '../../lib/firebase'
// import { doc, setDoc, getDoc } from 'firebase/firestore'
// import { ModeToggle } from '../temaEscuro/icons'
// import { Input } from '../temaEscuro/input'
// import { Button } from '@/components/ui/button'

// export default function SignupPage() {
//   const router = useRouter()
//   const [email, setEmail] = useState('')
//   const [senha, setSenha] = useState('')
//   const [nome, setNome] = useState('')
//   const [erro, setErro] = useState('')
//   const [loading, setLoading] = useState(false)

//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setErro('')
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
//       const user = userCredential.user

//       await setDoc(doc(db, 'users', user.uid), {
//         nome,
//         email,
//         createdAt: new Date(),
//       })

//       router.push('/auth/credenciamento')
//     } catch (error: any) {
//       setErro(error.message || 'Erro ao criar conta')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleGoogleLogin = async () => {
//     setLoading(true)
//     setErro('')
//     try {
//       const provider = new GoogleAuthProvider()
//       const result = await signInWithPopup(auth, provider)
//       const user = result.user

//       const userRef = doc(db, 'users', user.uid)
//       const userSnap = await getDoc(userRef)

//       if (!userSnap.exists()) {
//         await setDoc(userRef, {
//           nome: user.displayName || '',
//           email: user.email || '',
//           createdAt: new Date(),
//         })
//       }

//       router.push('auth/credenciamento')
//     } catch (error: any) {
//       setErro('Erro ao fazer login com Google')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="relative max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md mt-10">
//       <ModeToggle />

//       <h1 className="text-2xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">Cadastre-se</h1>

//       <form onSubmit={handleSignup} className="space-y-4">
//         <Input
//           type="text"
//           placeholder="Nome"
//           value={nome}
//           onChange={e => setNome(e.target.value)}
//           required
//         />
//         <Input
//           type="email"
//           placeholder="E-mail"
//           value={email}
//           onChange={e => setEmail(e.target.value)}
//           required
//         />
//         <Input
//           type="password"
//           placeholder="Senha"
//           value={senha}
//           onChange={e => setSenha(e.target.value)}
//           required
//         />
//         <Button type="submit" className="w-full" disabled={loading}>
//           {loading ? 'Criando...' : 'Criar'}
//         </Button>
//       </form>
//       <div
//         style={{
//           margin: 5,
//           color: '#888',
//           textAlign: 'center',
//           fontSize: 14,
//         }}
//       >
//         ou
//       </div>
//       <Button onClick={handleGoogleLogin} className="w-full" disabled={loading}>
//           {loading ? 'Carregando...' : 'Entrar com Google'}
//       </Button>
//       {erro && (
//         <p
//           style={{
//             color: 'red',
//             marginTop: 15,
//             fontSize: 14,
//             textAlign: 'center',
//           }}
//         >
//           {erro}
//         </p>
//       )}
//       <p className="text-sm text-center mt-6 text-muted-foreground">
//         Já tem cadastro?{' '}
//         <a href="/cadastrar" className="text-blue-600 hover:underline">
//         Entre aqui
//         </a>
//       </p>
//     </div>
//   )
// }
'use client'

import { Button } from '@/components/ui/button'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { auth, db } from '../../lib/firebase'
import { ModeToggle } from '../temaEscuro/icons'
import { Input } from '../temaEscuro/input'

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
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, senha)
      const user = userCredential.user

      await setDoc(doc(db, 'users', user.uid), {
        nome,
        email,
        createdAt: new Date(),
      })

      router.push('/auth/credenciamento')
    } catch (err: unknown) {
      // tipagem segura do error
      const error = err as { message?: string }
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

      router.push('/auth/credenciamento')
    } catch (err: unknown) {
      console.error(err) // agora usamos o error
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
      <Button
        variant="secondary"
        className="w-full bg-[#FFFFFF] hover:bg-[#F4F4F4] text-black border border-gray-600 border-2 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-gray-400 cursor-pointer"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>

        {loading ? 'Carregando...' : 'Cadastre-se com Google'}
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
        <a href="/entrar" className="text-blue-600 hover:underline">
          Entre aqui
        </a>
      </p>
    </div>
  )
}
