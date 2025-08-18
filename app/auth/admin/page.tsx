'use client'

import { onAuthStateChanged, type User } from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { auth, db } from "../../../lib/firebase"

type Credenciado = {
  id: string
  nome: string
  email: string
  cpf?: string
  telefone?: string
  tipoPessoa?: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [credenciados, setCredenciados] = useState<Credenciado[]>([])
  const [previewData, setPreviewData] = useState<Credenciado[]>([])
  const [editingCredenciado, setEditingCredenciado] = useState<Credenciado | null>(null)

  // flags de UX
  const [savingEdit, setSavingEdit] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const router = useRouter()

  // -------- carregar credenciados --------
  const loadCredenciados = useCallback(async () => {
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
        }
      })
      setCredenciados(list)
    } catch (error) {
      console.error("Erro ao carregar credenciados:", error)
      Swal.fire("Erro", "Não foi possível carregar os credenciados", "error")
    }
  }, [])

  // -------- verificar usuário/admin --------
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
        // Ideal: guardar isAdmin como boolean no Firestore
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
  }, [router, loadCredenciados])

  // -------- exportar CSV --------
  function exportCSV() {
    if (credenciados.length === 0) {
      Swal.fire("Aviso", "Nenhum credenciado para exportar", "info")
      return
    }
    const headers = ["Nome", "Email", "CPF", "Telefone", "TipoPessoa"]
    const rows = credenciados.map((c) => [
      c.nome,
      c.email,
      c.cpf || "",
      c.telefone || "",
      c.tipoPessoa || "",
    ])
    const csv = [headers, ...rows].map((e) => e.join(",")).join("\n")
    const csvContent = "data:text/csv;charset=utf-8," + csv
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "credenciados.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // -------- remover credenciado (Apaga do Firestore) --------
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
    } catch (error: any) {
      if (error?.code === "permission-denied") {
        Swal.fire("Sem permissão", "Sua conta não tem permissão para remover.", "warning")
      } else {
        console.error("Erro ao remover:", error)
        Swal.fire("Erro", "Não foi possível remover o credenciado", "error")
      }
    } finally {
      setDeletingId(null)
    }
  }

  // -------- editar credenciado --------
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

  // -------- importar Excel (pré-visualização + confirmar) --------
  async function handleImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
      const preview: Credenciado[] = jsonData
        .filter((item) => item.Nome && item.Email)
        .map((item) => ({
          id: "",
          nome: item.Nome,
          email: item.Email,
          cpf: item.CPF || "",
          telefone: item.Telefone || "",
          tipoPessoa: item.TipoPessoa || "pessoaFisica",
        }))
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
      setImporting(true)
      const batch = writeBatch(db)
      const col = collection(db, "credenciados")

      for (const item of previewData) {
        const ref = doc(col)
        batch.set(ref, {
          nome: item.nome,
          email: item.email,
          cpf: item.cpf ?? "",
          telefone: item.telefone ?? "",
          tipoPessoa: item.tipoPessoa ?? "pessoaFisica",
          createdAt: serverTimestamp(),
        })
      }

      await batch.commit()
      Swal.fire("Sucesso", "Credenciados importados com sucesso!", "success")
      setPreviewData([])
      await loadCredenciados()
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      Swal.fire("Erro", "Não foi possível importar os dados", "error")
    } finally {
      setImporting(false)
    }
  }

  // -------- render --------
  if (loading) return <p>Carregando...</p>
  if (!isAdmin) return <p>Acesso negado</p>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Painel do Administrador</h1>

      {/* botões importar/exportar */}
      <div className="flex gap-4 mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          onClick={exportCSV}
          disabled={credenciados.length === 0}
        >
          Exportar CSV
        </button>
        <input
          type="file"
          accept=".xlsx, .csv"
          onChange={handleImportExcel}
          className="border p-2 rounded"
        />
      </div>

      {/* pré-visualização importação */}
      {previewData.length > 0 && (
        <div className="mb-6 border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Pré-visualização da importação</h3>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">CPF</th>
                <th className="p-2 text-left">Telefone</th>
                <th className="p-2 text-left">TipoPessoa</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((c, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{c.nome}</td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2">{c.cpf}</td>
                  <td className="p-2">{c.telefone}</td>
                  <td className="p-2">{c.tipoPessoa}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
            onClick={confirmImport}
            disabled={importing}
          >
            {importing ? "Importando..." : "Confirmar Importação"}
          </button>
        </div>
      )}

      {/* lista de credenciados */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Credenciados</h2>
        {credenciados.length === 0 ? (
          <p>Nenhum credenciado na lista.</p>
        ) : (
          <ul className="space-y-2">
            {credenciados.map((c) => (
              <li key={c.id} className="flex justify-between items-center border p-2 rounded">
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-sm text-gray-600">{c.email}</p>
                </div>

                {isAdmin && (
                  <div className="flex gap-3">
                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      onClick={() => openEditModal(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 disabled:opacity-60"
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

      {/* modal de edição */}
      {editingCredenciado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Editar Credenciado</h3>
            <input
              type="text"
              className="border p-2 w-full mb-2"
              placeholder="Nome"
              value={editingCredenciado.nome}
              onChange={(e) => handleEditChange("nome", e.target.value)}
            />
            <input
              type="email"
              className="border p-2 w-full mb-2"
              placeholder="Email"
              value={editingCredenciado.email}
              onChange={(e) => handleEditChange("email", e.target.value)}
            />
            <input
              type="text"
              className="border p-2 w-full mb-2"
              placeholder="CPF"
              value={editingCredenciado.cpf || ""}
              onChange={(e) => handleEditChange("cpf", e.target.value)}
            />
            <input
              type="text"
              className="border p-2 w-full mb-2"
              placeholder="Telefone"
              value={editingCredenciado.telefone || ""}
              onChange={(e) => handleEditChange("telefone", e.target.value)}
            />
            <select
              className="border p-2 w-full mb-4"
              value={editingCredenciado.tipoPessoa || "pessoaFisica"}
              onChange={(e) => handleEditChange("tipoPessoa", e.target.value)}
            >
              <option value="pessoaFisica">Pessoa Física</option>
              <option value="empresa">Empresa</option>
              <option value="colaborador">Colaborador</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setEditingCredenciado(null)}
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
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
