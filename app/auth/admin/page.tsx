'use client'

import { auth, db } from "@/lib/firebase"
import { Button } from "@/src/components/ui/button"
import { FirebaseError } from "firebase/app"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Swal from "sweetalert2"

import {
  addCredenciadosBulk,
  Credenciado,
  deleteCredenciado,
  listCredenciados,
  makePartialUpdate,
  parseExcelToPreview,
  updateCredenciado
} from "./"

type Order = "asc" | "desc"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [_user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [credenciados, setCredenciados] = useState<Credenciado[]>([])
  const [previewData, setPreviewData] = useState<Credenciado[]>([])
  const [editingCredenciado, setEditingCredenciado] = useState<Credenciado | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [showFileInput, setShowFileInput] = useState(true)
  const router = useRouter()

  // Filtro/ordenação/paginação
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<"all" | string>("all")
  const [ordenacao, setOrdenacao] = useState<Order>("asc")
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const dadosFiltrados = useMemo(() => {
    const texto = filtroTexto.toLowerCase()
    return credenciados.filter((c) => {
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

  useEffect(() => setPaginaAtual(1), [filtroTexto, filtroTipo, itensPorPagina, ordenacao])

  // Auth/Admin
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
        const snap = await getDoc(docRef)
        if (!snap.exists() || !snap.data()?.isAdmin) {
          setLoading(false)
          Swal.fire("Acesso negado", "Você não tem permissão para acessar esta página", "error")
          router.push("/auth/sem-acesso")
          return
        }
        setIsAdmin(true)
        await loadCredenciados()
      } catch (e) {
        console.error(e)
        Swal.fire("Erro", "Ocorreu um problema ao verificar acesso", "error")
        router.push("/entrar")
      } finally {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  async function loadCredenciados() {
    try {
      const list = await listCredenciados()
      setCredenciados(list)
    } catch (e) {
      console.error("Erro ao carregar credenciados:", e)
      Swal.fire("Erro", "Não foi possível carregar os credenciados", "error")
    }
  }

  // Exportar Excel (import dinâmico para não pesar o bundle)
  function exportarCredenciados() {
    if (credenciados.length === 0) {
      Swal.fire("Aviso", "Nenhum credenciado para exportar", "info")
      return
    }
    import("xlsx").then((XLSX) => {
      const worksheetData = credenciados.map((c) => ({
        Nome: c.nome || "",
        Email: c.email || "",
        CPF: c.cpf || "",
        Telefone: c.telefone || "",
        TipoPessoa: c.tipoPessoa || "",
        Empresa: c.empresa || "",
        funcao: c.funcao || "",
        observacao: c.observacao || "",
      }))
      const worksheet = XLSX.utils.json_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Credenciados")
      XLSX.writeFile(workbook, "credenciados.xlsx")
    })
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const preview = await parseExcelToPreview(file)
      setPreviewData(preview)
    } catch (error) {
      console.error("Erro ao ler Excel:", error)
      Swal.fire("Erro", "Não foi possível ler o arquivo", "error")
    }
  }

  async function confirmImport() {
    if (previewData.length === 0) {
      Swal.fire("Aviso", "Nenhum dado para importar", "info")
      return
    }
    try {
      await addCredenciadosBulk(previewData)
      Swal.fire("Sucesso", "Credenciados importados com sucesso!", "success")
      setPreviewData([])
      setShowFileInput(false)
      setTimeout(() => setShowFileInput(true), 0)
      await loadCredenciados()
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      const msg = error instanceof Error ? error.message : "Erro desconhecido"
      Swal.fire("Erro", `Não foi possível importar os dados.\n${msg}`, "error")
    }
  }

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
      await deleteCredenciado(id)
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

  function openEditModal(c: Credenciado) { setEditingCredenciado(c) }
  function handleEditChange(field: keyof Credenciado, value: string) {
    if (!editingCredenciado) return
    setEditingCredenciado({ ...editingCredenciado, [field]: value })
  }
  async function saveEdit() {
    if (!editingCredenciado) return
    const { id, ...data } = editingCredenciado
    try {
      setSavingEdit(true)
      await updateCredenciado(id, makePartialUpdate(data))
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
        <Button onClick={exportarCredenciados}>Exportar Excel</Button>
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
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-200 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 border">Nome</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">CPF</th>
                <th className="px-4 py-2 border">Telefone</th>
                <th className="px-4 py-2 border">TipoPessoa</th>
                <th className="px-4 py-2 border">Empresa</th>
                <th className="px-4 py-2 border">Função</th>
                <th className="px-4 py-2 border">OBS</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((c, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2 border">{c.nome}</td>
                  <td className="px-4 py-2 border">{c.email}</td>
                  <td className="px-4 py-2 border">{c.cpf}</td>
                  <td className="px-4 py-2 border">{c.telefone}</td>
                  <td className="px-4 py-2 border">{c.tipoPessoa}</td>
                  <td className="px-4 py-2 border">{c.empresa}</td>
                  <td className="px-4 py-2 border">{c.funcao}</td>
                  <td className="px-4 py-2 border">{c.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-1.5">
            <Button onClick={confirmImport}>Confirmar Importação</Button>
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
              <li key={c.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold">{c.nome}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.email}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-3">
                    <button className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100"
                            onClick={() => openEditModal(c)}>
                      Editar
                    </button>
                    <button className="px-3 py-1 rounded bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100 disabled:opacity-60"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}>
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
          <button className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => p - 1)}>
            Anterior
          </button>
          <p className="dark:text-gray-300">Página {paginaAtual} de {totalPaginas}</p>
          <button className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual((p) => p + 1)}>
            Próxima
          </button>
        </div>
      )}

      {editingCredenciado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded max-w-md w-full border">
            <h3 className="text-lg font-semibold mb-4">Editar Credenciado</h3>

            <input className="border p-2 w-full mb-2" placeholder="Nome"
                   value={editingCredenciado.nome}
                   onChange={(e) => handleEditChange("nome", e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="Email"
                   value={editingCredenciado.email}
                   onChange={(e) => handleEditChange("email", e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="CPF"
                   value={editingCredenciado.cpf || ""}
                   onChange={(e) => handleEditChange("cpf", e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="Empresa"
                   value={editingCredenciado.empresa || ""}
                   onChange={(e) => handleEditChange("empresa", e.target.value)} />
            <input className="border p-2 w-full mb-2" placeholder="Telefone"
                   value={editingCredenciado.telefone || ""}
                   onChange={(e) => handleEditChange("telefone", e.target.value)} />
            <select className="border p-2 w-full mb-2"
                    value={editingCredenciado.tipoPessoa || "pessoaFisica"}
                    onChange={(e) => handleEditChange("tipoPessoa", e.target.value)}>
              <option value="pessoaFisica">Pessoa Física</option>
              <option value="empresa">Empresa</option>
              <option value="colaborador">Colaborador</option>
            </select>
            <input className="border p-2 w-full mb-2" placeholder="Função"
                   value={editingCredenciado.funcao || ""}
                   onChange={(e) => handleEditChange("funcao", e.target.value)} />
            <input className="border p-2 w-full mb-4" placeholder="Observação"
                   value={editingCredenciado.observacao || ""}
                   onChange={(e) => handleEditChange("observacao", e.target.value)} />

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-300"
                      onClick={() => setEditingCredenciado(null)}
                      disabled={savingEdit}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
                      onClick={saveEdit}
                      disabled={savingEdit}>
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
