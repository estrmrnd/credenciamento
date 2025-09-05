'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { onAuthStateChanged, type User } from "firebase/auth"
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore"
import { auth, db } from "../../../lib/firebase"
import { FirebaseError } from "firebase/app"
import * as XLSX from "xlsx"
import { Button } from "@/src/components/ui/button"

type CredenciadoExcel = {
  Nome?: string
  Email?: string
  CPF?: string
  Telefone?: string
  TipoPessoa?: string
  funcao?: string
  observacao?: string
}

type Credenciado = {
  id: string
  nome: string
  email: string
  cpf?: string
  telefone?: string
  tipoPessoa?: string
  funcao?: string
  observacao?: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [_user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [credenciados, setCredenciados] = useState<Credenciado[]>([])
  const [previewData, setPreviewData] = useState<Credenciado[]>([])
  const [editingCredenciado, setEditingCredenciado] = useState<Credenciado | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false) // usado no modal
  const router = useRouter()
  const [showFileInput, setShowFileInput] = useState(true)

  // ------------------ FILTRO, ORDENAÇÃO E PAGINAÇÃO ------------------
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<"all" | string>("all")
  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("asc")
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const dadosFiltrados = useMemo(() => {
    return credenciados.filter((c) => {
      const texto = filtroTexto.toLowerCase()
      const matchTexto =
        c.nome.toLowerCase().includes(texto) ||
        c.email.toLowerCase().includes(texto)
      const matchTipo = filtroTipo === "all" ? true : c.tipoPessoa === filtroTipo
      return matchTexto && matchTipo
    })
  }, [credenciados, filtroTexto, filtroTipo])

  const dadosOrdenados = useMemo(() => {
    const lista = [...dadosFiltrados]
    lista.sort((a, b) =>
      ordenacao === "asc" ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)
    )
    return lista
  }, [dadosFiltrados, ordenacao])

  const totalPaginas = Math.ceil(dadosOrdenados.length / itensPorPagina)
  const inicio = (paginaAtual - 1) * itensPorPagina
  const fim = inicio + itensPorPagina
  const paginaDados = dadosOrdenados.slice(inicio, fim)

  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroTexto, filtroTipo, itensPorPagina, ordenacao])

  // ------------------ VERIFICAR USUÁRIO / ADMIN ------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false)
        router.push("/entrar")
        return
      }
      setUser(currentUser)

      try {
        const docRef = doc(db, "users", currentUser.uid)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          setLoading(false)
          Swal.fire("Acesso negado", "Você não tem permissão para acessar esta página", "error")
          router.push("/auth/sem-acesso")
          return
        }

        const data = docSnap.data()
        const adminFlag = !!data?.isAdmin

        if (adminFlag) {
          setIsAdmin(true)
          await loadCredenciados()
        } else {
          setLoading(false)
          Swal.fire("Acesso negado", "Você não tem permissão para acessar esta página", "error")
          router.push("/auth/sem-acesso")
          return
        }
      } catch (error) {
        console.error("Erro ao verificar usuário/admin:", error)
        Swal.fire("Erro", "Ocorreu um problema ao verificar acesso", "error")
        router.push("/entrar")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
    // (sem deps adicionais para manter compatível com a estratégia de novas-alteracoes3)
  }, [router])

  // ------------------ CARREGAR CREDENCIADOS ------------------
  async function loadCredenciados() {
    try {
      const querySnapshot = await getDocs(collection(db, "credenciados"))
      const list: Credenciado[] = querySnapshot.docs.map((d) => {
        const data = d.data() as Partial<Credenciado>
        return {
          id: d.id,
          nome: data.nome || "Sem nome",
          email: data.email || "Sem email",
          cpf: data.cpf,
          telefone: data.telefone,
          tipoPessoa: data.tipoPessoa,
          funcao: data.funcao || "",
          observacao: data.observacao || ""
        }
      })
      setCredenciados(list)
    } catch (error) {
      console.error("Erro ao carregar credenciados:", error)
      Swal.fire("Erro", "Não foi possível carregar os credenciados", "error")
    }
  }

  // ------------------ EXPORTAR EXCEL ------------------
  function exportarCredenciados() {
    if (credenciados.length === 0) {
      Swal.fire("Aviso", "Nenhum credenciado para exportar", "info")
      return
    }

    const worksheetData = credenciados.map((c) => ({
      Nome: c.nome || "",
      Email: c.email || "",
      CPF: c.cpf || "",
      Telefone: c.telefone || "",
      TipoPessoa: c.tipoPessoa || "",
      funcao: c.funcao || "",
      observacao: c.observacao || ""
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credenciados")
    XLSX.writeFile(workbook, "credenciados.xlsx")
  }

  // ------------------ IMPORTAR (PRÉ-VISUALIZAÇÃO) ------------------
  async function handleImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const jsonData: CredenciadoExcel[] = XLSX.utils.sheet_to_json<CredenciadoExcel>(worksheet)
      const preview: Credenciado[] = jsonData
        .filter(item => item.Nome && item.Email)
        .map(item => ({
          id: "",
          nome: item.Nome ?? "",
          email: item.Email ?? "",
          cpf: item.CPF ?? "",
          telefone: item.Telefone ?? "",
          tipoPessoa: item.TipoPessoa ?? "pessoaFisica",
          funcao: item.funcao ?? "",
          observacao: item.observacao ?? ""
        }))

      setPreviewData(preview)
    } catch (error) {
      console.error("Erro ao ler Excel:", error)
      Swal.fire("Erro", "Não foi possível ler o arquivo", "error")
    }
  }

  // ------------------ IMPORTAR (CONFIRMAR) ------------------
  async function confirmImport() {
    if (previewData.length === 0) {
      Swal.fire("Aviso", "Nenhum dado para importar", "info")
      return
    }
    try {
      for (const item of previewData) {
        await addDoc(collection(db, "credenciados"), {
          nome: item.nome,
          email: item.email,
          cpf: item.cpf,
          telefone: item.telefone,
          tipoPessoa: item.tipoPessoa,
          funcao: item.funcao,
          observacao: item.observacao,
          createdAt: serverTimestamp()
        })
      }

      Swal.fire("Sucesso", "Credenciados importados com sucesso!", "success")
      setPreviewData([])

      // recria o input para voltar a mensagem "Escolher arquivo..."
      setShowFileInput(false)
      setTimeout(() => setShowFileInput(true), 0)

      await loadCredenciados()
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      Swal.fire("Erro", "Não foi possível importar os dados", "error")
    }
  }

  // ------------------ REMOVER ------------------
  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Isso irá APAGAR o registro do banco de dados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, apagar",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    try {
      setDeletingId(id)
      await deleteDoc(doc(db, "credenciados", id))
      setCredenciados((prev) => prev.filter((c) => c.id !== id))
      Swal.fire("Removido!", "O credenciado foi removido do banco de dados.", "success")
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "permission-denied") {
        Swal.fire("Sem permissão", "Sua conta não tem permissão para remover.", "warning")
      } else {
        console.error("Erro ao remover:", error)
        Swal.fire("Erro", "Não foi possível remover o credenciado", "error")
      }
    } finally {
      setDeletingId(null)
    }
  }

  // ------------------ EDIÇÃO ------------------
  function openEditModal(c: Credenciado) {
    setEditingCredenciado(c)
  }

  function handleEditChange(field: keyof Credenciado, value: string) {
    if (!editingCredenciado) return
    setEditingCredenciado({ ...editingCredenciado, [field]: value })
  }

  async function saveEdit() {
    if (!editingCredenciado) return
    const { id, ...data } = editingCredenciado
    try {
      setSavingEdit(true)
      await updateDoc(doc(db, "credenciados", id), data as Partial<Omit<Credenciado, "id">>)
      Swal.fire("Sucesso", "Credenciado atualizado com sucesso!", "success")
      setEditingCredenciado(null)
      await loadCredenciados()
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      Swal.fire("Erro", "Não foi possível atualizar o credenciado", "error")
    } finally {
      setSavingEdit(false)
    }
  }

  // ------------------ RENDER ------------------
  if (loading) return <p>Carregando...</p>
  if (!isAdmin) return <p>Acesso negado</p>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Painel do Administrador</h1>

      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 space-y-4 md:space-y-0">
        <input
          type="text"
          placeholder="Filtrar por nome ou email"
          className="flex-grow p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>

      <div className="flex gap-4 mb-6">
        <Button className="cursor-pointer" onClick={exportarCredenciados}>Exportar Excel</Button>
        {showFileInput && (
          <input
            key={Date.now()}
            type="file"
            accept=".xlsx, .csv"
            onChange={handleImportExcel}
            className="border p-2 rounded cursor-pointer"
          />
        )}
      </div>

      {previewData.length > 0 && (
        <div className="overflow-x-auto mb-6">
          <h3 className="font-semibold mb-2">Pré-visualização da importação</h3>
          <table className="min-w-full border border-gray-300 dark:border-gray-700 text-sm">
            <thead className="bg-gray-200 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left">Nome</th>
                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left">Email</th>
                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left">CPF</th>
                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left">Telefone</th>
                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left">TipoPessoa</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((c, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">{c.nome}</td>
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">{c.email}</td>
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">{c.cpf}</td>
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">{c.telefone}</td>
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">{c.tipoPessoa}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-1.5">
            <Button className="cursor-pointer" onClick={confirmImport}>Confirmar Importação</Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">Credenciados</h2>
        {credenciados.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhum credenciado na lista.</p>
        ) : (
          <ul className="space-y-4">
            {paginaDados.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{c.nome}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.email}</p>
                </div>

                {isAdmin && (
                  <div className="flex gap-3">
                    <button
                      className="cursor-pointer px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-600 transition-colors"
                      onClick={() => openEditModal(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="cursor-pointer px-3 py-1 rounded bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-600 transition-colors disabled:opacity-60"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                    >
                      {deletingId === c.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            className="cursor-pointer px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((prev) => prev - 1)}
          >
            Anterior
          </button>
          <p className="dark:text-gray-300">
            Página {paginaAtual} de {totalPaginas}
          </p>
          <button
            className="cursor-pointer px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual((prev) => prev + 1)}
          >
            Próxima
          </button>
        </div>
      )}

      {editingCredenciado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded max-w-md w-full border border-gray-300 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Editar Credenciado</h3>

            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Nome"
              value={editingCredenciado.nome}
              onChange={(e) => handleEditChange("nome", e.target.value)}
            />
            <input
              type="email"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Email"
              value={editingCredenciado.email}
              onChange={(e) => handleEditChange("email", e.target.value)}
            />
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="CPF"
              value={editingCredenciado.cpf || ""}
              onChange={(e) => handleEditChange("cpf", e.target.value)}
            />
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Telefone"
              value={editingCredenciado.telefone || ""}
              onChange={(e) => handleEditChange("telefone", e.target.value)}
            />
            <select
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              value={editingCredenciado.tipoPessoa || "pessoaFisica"}
              onChange={(e) => handleEditChange("tipoPessoa", e.target.value)}
            >
              <option value="pessoaFisica">Pessoa Física</option>
              <option value="empresa">Empresa</option>
              <option value="colaborador">Colaborador</option>
            </select>
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Função"
              value={editingCredenciado.funcao || ""}
              onChange={(e) => handleEditChange("funcao", e.target.value)}
            />
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Observação"
              value={editingCredenciado.observacao || ""}
              onChange={(e) => handleEditChange("observacao", e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="cursor-pointer px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                onClick={() => setEditingCredenciado(null)}
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button
                className="cursor-pointer px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                onClick={saveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
