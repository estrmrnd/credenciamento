'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../../lib/firebase"
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
  const router = useRouter()

  // verificar usuario
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
        if (data.isAdmin === true || data.isAdmin === "true") {
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
  }, [router])

  // carregar credenciado
  async function loadCredenciados() {
    try {
      const querySnapshot = await getDocs(collection(db, "credenciados"))
      const list: Credenciado[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Partial<Credenciado>
        return {
          id: doc.id,
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

  // exportar credenciados

function exportarCredenciados() {
  if (credenciados.length === 0) {
    Swal.fire("Aviso", "Nenhum credenciado para exportar", "info");
    return;
  }

  const worksheetData = credenciados.map((c) => ({
    Nome: c.nome || "",
    Email: c.email || "",
    CPF: c.cpf || "",
    // Empresa: c.empresa || "",
    Telefone: c.telefone || "",
    TipoPessoa: c.tipoPessoa || "",
    funcao: c.funcao || "",
    observacao: c.observacao || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Credenciados");
  XLSX.writeFile(workbook, "credenciados.xlsx");
}

// preview da importação via excel
async function handleImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // ✅ Tipagem ajustada aqui
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

// importar credenciados

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
    await loadCredenciados()
  } catch (error) {
    console.error("Erro ao importar dados:", error)
    Swal.fire("Erro", "Não foi possível importar os dados", "error")
  }
}
  //remover credenciado
  function handleDelete(id: string) {
    Swal.fire({
      title: "Tem certeza?",
      text: "Isso remove da lista, mas não apaga do banco de dados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setCredenciados((prev) => prev.filter((c) => c.id !== id))
        Swal.fire("Removido!", "O credenciado foi removido da lista.", "success")
      }
    })
  }

  // editar credenciado
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
      await updateDoc(doc(db, "credenciados", id), data)
      Swal.fire("Sucesso", "Credenciado atualizado com sucesso!", "success")
      setEditingCredenciado(null)
      await loadCredenciados()
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      Swal.fire("Erro", "Não foi possível atualizar o credenciado", "error")
    }
  }


  //render
  if (loading) return <p>Carregando...</p>
  if (!isAdmin) return <p>Acesso negado</p>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Painel do Administrador</h1>


      <div className="flex gap-4 mb-6">
        <Button onClick={exportarCredenciados}>Exportar Excel</Button>
        <input
          type="file"
          accept=".xlsx, .csv"
          onChange={handleImportExcel}
          className="border p-2 rounded"
        />
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
            {credenciados.map((c) => (
              <li key={c.id} className="flex justify-between items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{c.nome}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.email}</p>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-600 transition-colors"
                      onClick={() => openEditModal(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(c.id)}
                    >
                      Remover
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
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
              value={editingCredenciado.funcao}
              onChange={(e) => handleEditChange("funcao", e.target.value)}
            />
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded"
              placeholder="Observação"
              value={editingCredenciado.observacao}
              onChange={(e) => handleEditChange("observacao", e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                onClick={() => setEditingCredenciado(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                onClick={saveEdit}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
