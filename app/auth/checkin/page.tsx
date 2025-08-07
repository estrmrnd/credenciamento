'use client'

import { useState } from 'react'
import { db } from '../../../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { Input } from '../../temaEscuro/input'
import { Button } from '@/components/ui/button'

type Credenciado = {
  id: string
  nome: string
  email: string
  cpf: string
  empresa?: string
  tipoPessoa: 'pessoaFisica' | 'empresa' | 'colaborador'
  checkInAt?: Timestamp
}

export default function CheckInPage() {
  const [busca, setBusca] = useState('')
  const [credenciado, setCredenciado] = useState<Credenciado | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function buscarCredenciado() {
    setMensagem(null)
    setCredenciado(null)
    if (!busca.trim()) {
      setMensagem('Por favor, digite CPF ou E-mail para buscar')
      return
    }
    setLoading(true)

    try {
      // Buscar por CPF ou email igual ao que foi digitado
      const qCpf = query(
        collection(db, 'credenciados'),
        where('cpf', '==', busca.trim())
      )
      const qEmail = query(
        collection(db, 'credenciados'),
        where('email', '==', busca.trim())
      )

      let snapshot = await getDocs(qCpf)

      if (snapshot.empty) {
        snapshot = await getDocs(qEmail)
      }

      if (snapshot.empty) {
        setMensagem('Nenhum credenciado encontrado com esse CPF ou E-mail.')
        setLoading(false)
        return
      }

      // Pega o primeiro credenciado encontrado
      const docData = snapshot.docs[0]
      const data = docData.data() as Credenciado
      setCredenciado({ ...data, id: docData.id })

    } catch (error) {
      console.error(error)
      setMensagem('Erro ao buscar credenciado. Tente novamente.')
    }
    setLoading(false)
  }

  async function fazerCheckIn() {
    if (!credenciado) return
    setLoading(true)
    setMensagem(null)

    try {
      const docRef = doc(db, 'credenciados', credenciado.id)
      await updateDoc(docRef, {
        checkInAt: Timestamp.now(),
      })
      setMensagem(`Check-in realizado com sucesso para ${credenciado.nome}!`)
      setCredenciado(null)
      setBusca('')
    } catch (error) {
      console.error(error)
      setMensagem('Erro ao registrar check-in. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <div className="relative max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">
        Check-in
      </h1>

      <div className="space-y-4">
        <Input
          placeholder="Digite CPF ou E-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              buscarCredenciado()
            }
          }}
          className="w-full"
          autoComplete="off"
          disabled={loading}
        />
        <Button onClick={buscarCredenciado} disabled={loading} className="w-full">
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>

        {mensagem && (
          <p
            className={`mt-2 text-center ${
              mensagem.includes('Erro') ? 'text-red-500' : 'text-green-600'
            }`}
          >
            {mensagem}
          </p>
        )}

        {credenciado && (
          <div className="mt-4 p-4 border rounded bg-gray-100 dark:bg-zinc-800">
            <p>
              <strong>Nome:</strong> {credenciado.nome}
            </p>
            <p>
              <strong>CPF:</strong> {credenciado.cpf}
            </p>
            <p>
              <strong>E-mail:</strong> {credenciado.email}
            </p>
            {credenciado.empresa && (
              <p>
                <strong>Empresa:</strong> {credenciado.empresa}
              </p>
            )}
            <p>
              <strong>Tipo:</strong>{' '}
              {credenciado.tipoPessoa === 'pessoaFisica'
                ? 'Pessoa Física'
                : credenciado.tipoPessoa === 'empresa'
                ? 'Empresa'
                : 'Colaborador'}
            </p>

            <Button
              onClick={fazerCheckIn}
              disabled={loading}
              className="mt-4 w-full"
            >
              {loading ? 'Registrando...' : 'Fazer Check-in'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
