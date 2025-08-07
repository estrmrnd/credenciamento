'use client'

import { useEffect, useState, useMemo } from 'react'
import { auth, db } from '../../../lib/firebase'
import { collection, getDocs, Timestamp } from 'firebase/firestore'
import { Card } from '../../../src/components/card'
import router from 'next/router'
import { signOut } from 'firebase/auth'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

type Credenciado = {
  id: string
  nome: string
  email: string
  cpf: string
  empresa: string
  telefone: string
  qtdColaboradores: string
  dataCredenciamento?: string // ISO string gerada a partir do createdAt do Firestore
}

export default function CredenciadosPage() {
  const [dados, setDados] = useState<Credenciado[]>([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [ordenacao, setOrdenacao] = useState<'asc' | 'desc'>('asc')
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)

  useEffect(() => {
    const fetchCredenciados = async () => {
      const snapshot = await getDocs(collection(db, 'credenciados'))
      const lista: Credenciado[] = []
      snapshot.forEach((doc) => {
        const data = doc.data() as any

        const createdAtFormatted = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || ''

        lista.push({
          id: doc.id,
          ...data,
          dataCredenciamento: createdAtFormatted,
        })
      })
      setDados(lista)
    }

    fetchCredenciados()
  }, [])

  const empresasUnicas = useMemo(() => {
    const setEmpresas = new Set<string>()
    dados.forEach((item) => {
      if (item.empresa) setEmpresas.add(item.empresa)
    })
    return Array.from(setEmpresas).sort()
  }, [dados])

  const dadosFiltrados = useMemo(() => {
    return dados.filter((item) => {
      const texto = filtroTexto.toLowerCase()
      const textoMatch =
        item.nome.toLowerCase().includes(texto) ||
        item.email.toLowerCase().includes(texto) ||
        item.empresa.toLowerCase().includes(texto)

      const empresaMatch = filtroEmpresa === 'all' ? true : item.empresa === filtroEmpresa

      return textoMatch && empresaMatch
    })
  }, [dados, filtroTexto, filtroEmpresa])

  const dadosOrdenados = useMemo(() => {
    const lista = [...dadosFiltrados]
    lista.sort((a, b) => {
      if (ordenacao === 'asc') return a.nome.localeCompare(b.nome)
      else return b.nome.localeCompare(a.nome)
    })
    return lista
  }, [dadosFiltrados, ordenacao])

  const totalPaginas = Math.ceil(dadosOrdenados.length / itensPorPagina)
  const inicio = (paginaAtual - 1) * itensPorPagina
  const fim = inicio + itensPorPagina
  const paginaDados = dadosOrdenados.slice(inicio, fim)

  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroTexto, filtroEmpresa, itensPorPagina, ordenacao])

  async function handleLogout() {
    try {
      await signOut(auth)
      router.push('/entrar')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-[5vh] px-4">
      <h1 className="text-3xl font-bold mb-6">Lista de Credenciados</h1>

      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 space-y-4 md:space-y-0">
        <input
          type="text"
          placeholder="Filtrar por nome, email ou empresa"
          className="flex-grow p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />

        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {empresasUnicas.map((empresa) => (
              <SelectItem key={empresa} value={empresa}>
                {empresa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(itensPorPagina)}
          onValueChange={(value) => setItensPorPagina(Number(value))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ordenacao}
          onValueChange={(value) => setOrdenacao(value as 'asc' | 'desc')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Nome A-Z</SelectItem>
            <SelectItem value="desc">Nome Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paginaDados.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum credenciado encontrado.</p>
      ) : (
        <div className="space-y-4">
          {paginaDados.map((item) => (
            <Card key={item.id} className="p-4">
              <p><strong>Nome:</strong> {item.nome}</p>
              <p><strong>Email:</strong> {item.email}</p>
              <p><strong>CPF:</strong> {item.cpf}</p>
              <p><strong>Empresa:</strong> {item.empresa}</p>
              <p><strong>Colaboradores:</strong> {item.qtdColaboradores}</p>
              <p><strong>Telefone:</strong> {item.telefone}</p>
              {item.dataCredenciamento ? (
                <p><strong>Data Credenciamento:</strong> {new Date(item.dataCredenciamento).toLocaleDateString()}</p>
              ) : (
                <p><em>Data não disponível</em></p>
              )}
            </Card>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((prev) => prev - 1)}
          >
            Anterior
          </button>
          <p className="dark:text-gray-300">
            Página {paginaAtual} de {totalPaginas}
          </p>
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual((prev) => prev + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
