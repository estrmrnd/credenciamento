'use client'

import { useForm } from 'react-hook-form'
import { db } from '../../../lib/firebase'
import { collection, addDoc, getDocs, Timestamp, query } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { useState, useEffect, useRef } from 'react'
import { auth } from '../../../lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Input } from '../../temaEscuro/input'
import { Button } from '@/components/ui/button'

type Credenciado = {
  nome: string
  email: string
  cpf: string
  empresa: string
  telefone: string
  tipoPessoa: 'pessoaFisica' | 'empresa' | 'colaborador'
}

export default function CredenciamentoPage() {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Credenciado>({
    defaultValues: {
      tipoPessoa: 'pessoaFisica',
      empresa: '',
    },
  })

  const [mensagem, setMensagem] = useState<string | null>(null)
  const [empresas, setEmpresas] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const empresaRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Observar os campos
  const empresaDigitada = watch('empresa') || ''
  const tipoPessoaSelecionada = watch('tipoPessoa')

  useEffect(() => {
    const carregarEmpresas = async () => {
      const q = query(collection(db, 'credenciados'))
      const snapshot = await getDocs(q)
      const listaEmpresasSet = new Set<string>()
      snapshot.forEach((doc) => {
        const data = doc.data() as any
        if (data.empresa) listaEmpresasSet.add(data.empresa)
      })
      setEmpresas(Array.from(listaEmpresasSet).sort())
    }
    carregarEmpresas()
  }, [])

  const sugestoesFiltradas = empresas.filter((e) =>
    e.toLowerCase().includes(empresaDigitada.toLowerCase())
  )

  const onSubmit = async (data: Credenciado) => {
    try {
      const id = uuidv4()
      await addDoc(collection(db, 'credenciados'), {
        id,
        ...data,
        createdAt: Timestamp.now(),
      })
      setMensagem('Credenciamento realizado com sucesso!')
      reset()
      setShowSuggestions(false)
    } catch (error) {
      console.error(error)
      setMensagem('Erro ao credenciar. Tente novamente.')
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        empresaRef.current &&
        !empresaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleSelectEmpresa(empresa: string) {
    setValue('empresa', empresa)
    setShowSuggestions(false)
  }

const [nomes, setNomes] = useState<string[]>([])
const [showNomeSuggestions, setShowNomeSuggestions] = useState(false)

const nomeDigitado = watch('nome') || ''
const nomeRef = useRef<HTMLDivElement>(null)


// Carregar nomes já cadastrados
useEffect(() => {
  const carregarNomes = async () => {
    const q = query(collection(db, 'credenciados'))
    const snapshot = await getDocs(q)
    const listaNomesSet = new Set<string>()
    snapshot.forEach((doc) => {
      const data = doc.data() as any
      if (data.nome) listaNomesSet.add(data.nome)
    })
    setNomes(Array.from(listaNomesSet).sort())
  }
  carregarNomes()
}, [])

// Filtro de sugestões de nomes
const sugestoesNomes = nomes.filter((n) =>
  n.toLowerCase().includes(nomeDigitado.toLowerCase())
)

// handleSelectNome
function handleSelectNome(nome: string) {
  setValue('nome', nome)
  setShowNomeSuggestions(false)
}

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      nomeRef.current &&
      !nomeRef.current.contains(event.target as Node)
    ) {
      setShowNomeSuggestions(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [])


  return (
    <div className="relative max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">
        Credenciamento
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        {/* Tipo Pessoa - radio 3 opções exclusivas */}
        <div className="flex flex-row gap-2 mb-4 text-sm">
          <label className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <input
              type="radio"
              value="pessoaFisica"
              {...register('tipoPessoa', { required: true })}
              defaultChecked
            />
            Pessoa Física
          </label>

          <label className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <input
              type="radio"
              value="empresa"
              {...register('tipoPessoa', { required: true })}
            />
            Empresa
          </label>

          <label className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <input
              type="radio"
              value="colaborador"
              {...register('tipoPessoa', { required: true })}
            />
            Sou colaborador
          </label>
          {errors.tipoPessoa && (
            <p className="text-red-500 text-sm">Escolha uma opção</p>
          )}
        </div>

<div ref={nomeRef} className="relative">
  <Input
    type="text"
placeholder={
  (tipoPessoaSelecionada === 'pessoaFisica' || tipoPessoaSelecionada === 'colaborador')
    ? 'Nome Completo'
    : 'Razão Social'
}
    className="w-full"
    onFocus={() => setShowNomeSuggestions(true)}
    autoComplete="off"
  />
  {errors.nome && <p className="text-red-500 text-sm">Nome é obrigatório</p>}

  {showNomeSuggestions && sugestoesNomes.length > 0 && (
    <ul className="absolute z-10 w-full max-h-40 overflow-auto bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded shadow-md mt-1">
      {sugestoesNomes.map((nome) => (
        <li
          key={nome}
          className="cursor-pointer px-4 py-2 hover:bg-gray-200 dark:hover:bg-zinc-600"
          onMouseDown={(e) => {
            e.preventDefault()
            handleSelectNome(nome)
          }}
        >
          {nome}
        </li>
      ))}
    </ul>
  )}
</div>

        <Input
          type="email"
          placeholder="E-mail"
          {...register('email', { required: true })}
          className="w-full"
        />
        {errors.email && <p className="text-red-500 text-sm">E-mail é obrigatório</p>}

        <Input
          type="text"
          placeholder={tipoPessoaSelecionada === 'empresa' ? 'CNPJ' : 'CPF'}
          {...register('cpf', { required: true })}
          className="w-full"
        />
        {errors.cpf && <p className="text-red-500 text-sm">CPF ou CNPJ é obrigatório</p>}

        {/* Mostra empresa somente se empresa ou colaborador */}
        {(tipoPessoaSelecionada === 'empresa' || tipoPessoaSelecionada === 'colaborador') && (
          <div ref={empresaRef} className="relative">
            <Input
              placeholder="Empresa"
              {...register('empresa', {
                required: true,
              })}
              className="w-full"
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
            {errors.empresa && (
              <p className="text-red-500 text-sm">Empresa é obrigatória</p>
            )}

            {showSuggestions && sugestoesFiltradas.length > 0 && (
              <ul className="absolute z-10 w-full max-h-40 overflow-auto bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded shadow-md mt-1">
                {sugestoesFiltradas.map((empresa) => (
                  <li
                    key={empresa}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-200 dark:hover:bg-zinc-600"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectEmpresa(empresa)
                    }}
                  >
                    {empresa}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Input
          placeholder="Telefone"
          {...register('telefone', { required: true })}
          className="w-full"
        />
        {errors.telefone && <p className="text-red-500 text-sm">Telefone é obrigatório</p>}

        <Button type="submit" className="w-full">
          Enviar
        </Button>

        {mensagem && <p className="mt-2 text-green-600">{mensagem}</p>}
      </form>
    </div>
  )
}
