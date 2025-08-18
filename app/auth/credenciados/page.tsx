'use client'

import CredencialPrint from '@/app/credencialPrint'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import { collection, getDocs, Timestamp } from 'firebase/firestore'
import { Printer } from 'lucide-react'
import router from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { auth, db } from '../../../lib/firebase'
import { Card } from '../../../src/components/card'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Credenciado = {
  id: string
  nome: string
  email: string
  cpf: string
  empresa: string
  telefone: string
  qtdColaboradores: string
  dataCredenciamento?: string
  checkInAt?: string // <-- adicionado
}

export default function CredenciadosPage() {
  const [dados, setDados] = useState<Credenciado[]>([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState<'all' | string>('all')
  const [ordenacao, setOrdenacao] = useState<'asc' | 'desc'>('asc')
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [selecionado, setSelecionado] = useState<Credenciado | null>(null)

  const printRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });
  
  useEffect(() => {
    const fetchCredenciados = async () => {
      const snapshot = await getDocs(collection(db, 'credenciados'))
      const lista: Credenciado[] = []
      snapshot.forEach((doc) => {
        const data = doc.data() as any
        const createdAtFormatted =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || ''
        const checkInFormatted =
          data.checkInAt instanceof Timestamp
            ? data.checkInAt.toDate().toISOString()
            : data.checkInAt || ''
            lista.push({
              id: doc.id,
              ...data,
              dataCredenciamento: createdAtFormatted,
              checkInAt: data.checkInAt ? data.checkInAt.toDate() : null
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
      const empresaMatch =
        filtroEmpresa === 'all' ? true : item.empresa === filtroEmpresa
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
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum credenciado encontrado.
        </p>
      ) : (
        <div className="space-y-4">
          {paginaDados.map((item) => (
            <Card key={item.id} className="p-4 flex justify-between items-center">
              <div>
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
                {item.checkInAt ? (
                  <p><strong>Check-in:</strong> {new Date(item.checkInAt).toLocaleString()}</p>
                ) : (
                  <p><em>Sem check-in</em></p>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelecionado(item)
                  setTimeout(() => handlePrint(), 100)
                }}
              >
                <Printer className="h-5 w-5" />
              </Button>
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

      {/* crachá oculto para impressão */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {selecionado && (
            <CredencialPrint
              nome={selecionado.nome}
              empresa={selecionado.empresa}
            />
          )}
        </div>
      </div>
    </div>
  )
}
