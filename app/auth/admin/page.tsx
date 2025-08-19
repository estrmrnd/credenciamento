// 'use client'

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import Swal from "sweetalert2"
// import { onAuthStateChanged, type User } from "firebase/auth"
// import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from "firebase/firestore"
// import { auth, db } from "../../../lib/firebase"
// import * as XLSX from "xlsx"

// type Credenciado = {
//   id: string
//   nome: string
//   email: string
//   cpf?: string
//   telefone?: string
//   tipoPessoa?: string
// }

// export default function AdminPage() {
//   const [loading, setLoading] = useState(true)
//   const [user, setUser] = useState<User | null>(null)
//   const [isAdmin, setIsAdmin] = useState(false)
//   const [credenciados, setCredenciados] = useState<Credenciado[]>([])
//   const [previewData, setPreviewData] = useState<Credenciado[]>([])
//   const [editingCredenciado, setEditingCredenciado] = useState<Credenciado | null>(null)
//   const router = useRouter()

//   {/* verificar usuario */}
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (!currentUser) {
//         setLoading(false)
//         router.push("/entrar")
//         return
//       }
//       setUser(currentUser)
//       try {
//         const docRef = doc(db, "users", currentUser.uid)
//         const docSnap = await getDoc(docRef)
//         if (!docSnap.exists()) {
//           setLoading(false)
//           Swal.fire("Acesso negado", "Você não tem permissão para acessar esta página", "error")
//           router.push("/auth/sem-acesso")
//           return
//         }
//         const data = docSnap.data()
//         if (data.isAdmin === true || data.isAdmin === "true") {
//           setIsAdmin(true)
//           await loadCredenciados()
//         } else {
//           setLoading(false)
//           Swal.fire("Acesso negado", "Você não tem permissão para acessar esta página", "error")
//           router.push("/auth/sem-acesso")
//           return
//         }
//       } catch (error) {
//         console.error("Erro ao verificar usuário/admin:", error)
//         Swal.fire("Erro", "Ocorreu um problema ao verificar acesso", "error")
//         router.push("/entrar")
//       } finally {
//         setLoading(false)
//       }
//     })
//     return () => unsubscribe()
//   }, [router])

//   {/* carregar credenciado */}
//   async function loadCredenciados() {
//     try {
//       const querySnapshot = await getDocs(collection(db, "credenciados"))
//       const list: Credenciado[] = querySnapshot.docs.map((doc) => {
//         const data = doc.data() as Partial<Credenciado>
//         return {
//           id: doc.id,
//           nome: data.nome || "Sem nome",
//           email: data.email || "Sem email",
//           cpf: data.cpf,
//           telefone: data.telefone,
//           tipoPessoa: data.tipoPessoa
//         }
//       })
//       setCredenciados(list)
//     } catch (error) {
//       console.error("Erro ao carregar credenciados:", error)
//       Swal.fire("Erro", "Não foi possível carregar os credenciados", "error")
//     }
//   }

//   {/* exportar */}
//   function exportCSV() {
//     if (credenciados.length === 0) {
//       Swal.fire("Aviso", "Nenhum credenciado para exportar", "info")
//       return
//     }
//     const headers = ["Nome", "Email", "CPF", "Telefone", "TipoPessoa"]
//     const rows = credenciados.map((c) => [
//       c.nome, c.email, c.cpf || "", c.telefone || "", c.tipoPessoa || ""
//     ])
//     let csvContent =
//       "data:text/csv;charset=utf-8," +
//       [headers, ...rows].map((e) => e.join(",")).join("\n")
//     const encodedUri = encodeURI(csvContent)
//     const link = document.createElement("a")
//     link.setAttribute("href", encodedUri)
//     link.setAttribute("download", "credenciados.csv")
//     document.body.appendChild(link)
//     link.click()
//     document.body.removeChild(link)
//   }

//   {/* remover credenciado */}
//   function handleDelete(id: string) {
//     Swal.fire({
//       title: "Tem certeza?",
//       text: "Isso remove da lista, mas não apaga do banco de dados.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Sim, remover",
//       cancelButtonText: "Cancelar",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         setCredenciados((prev) => prev.filter((c) => c.id !== id))
//         Swal.fire("Removido!", "O credenciado foi removido da lista.", "success")
//       }
//     })
//   }

//   {/* editar credenciado */}
//   function openEditModal(c: Credenciado) {
//     setEditingCredenciado(c)
//   }

//   function handleEditChange(field: keyof Credenciado, value: string) {
//     if (!editingCredenciado) return
//     setEditingCredenciado({ ...editingCredenciado, [field]: value })
//   }

//   async function saveEdit() {
//     if (!editingCredenciado) return
//     const { id, ...data } = editingCredenciado
//     try {
//       await updateDoc(doc(db, "credenciados", id), data)
//       Swal.fire("Sucesso", "Credenciado atualizado com sucesso!", "success")
//       setEditingCredenciado(null)
//       await loadCredenciados()
//     } catch (error) {
//       console.error("Erro ao atualizar:", error)
//       Swal.fire("Erro", "Não foi possível atualizar o credenciado", "error")
//     }
//   }

//   {/* preview da importação via excel */}
//   async function handleImportExcel(event: React.ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0]
//     if (!file) return
//     try {
//       const data = await file.arrayBuffer()
//       const workbook = XLSX.read(data)
//       const sheetName = workbook.SheetNames[0]
//       const worksheet = workbook.Sheets[sheetName]
//       const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
//       const preview: Credenciado[] = jsonData
//         .filter(item => item.Nome && item.Email)
//         .map(item => ({
//           id: "",
//           nome: item.Nome,
//           email: item.Email,
//           cpf: item.CPF || "",
//           telefone: item.Telefone || "",
//           tipoPessoa: item.TipoPessoa || "pessoaFisica",
//         }))
//       setPreviewData(preview)
//     } catch (error) {
//       console.error("Erro ao ler Excel:", error)
//       Swal.fire("Erro", "Não foi possível ler o arquivo", "error")
//     }
//   }

//   async function confirmImport() {
//     if (previewData.length === 0) {
//       Swal.fire("Aviso", "Nenhum dado para importar", "info")
//       return
//     }
//     try {
//       for (const item of previewData) {
//         await addDoc(collection(db, "credenciados"), {
//           nome: item.nome,
//           email: item.email,
//           cpf: item.cpf,
//           telefone: item.telefone,
//           tipoPessoa: item.tipoPessoa,
//           createdAt: new Date()
//         })
//       }
//       Swal.fire("Sucesso", "Credenciados importados com sucesso!", "success")
//       setPreviewData([])
//       await loadCredenciados()
//     } catch (error) {
//       console.error("Erro ao importar dados:", error)
//       Swal.fire("Erro", "Não foi possível importar os dados", "error")
//     }
//   }

//   {/* render */}
//   if (loading) return <p>Carregando...</p>
//   if (!isAdmin) return <p>Acesso negado</p>

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">Painel do Administrador</h1>

//       {/* botao de importar e exportar csv */}
//       <div className="flex gap-4 mb-6">
//         <button
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//           onClick={exportCSV}
//         >
//           Exportar CSV
//         </button>
//         <input
//           type="file"
//           accept=".xlsx, .csv"
//           onChange={handleImportExcel}
//           className="border p-2 rounded"
//         />
//       </div>

//       {/* pre-visu da importação csv */}
//       {previewData.length > 0 && (
//         <div className="mb-6 border p-4 rounded bg-gray-50">
//           <h3 className="font-semibold mb-2">Pré-visualização da importação</h3>
//           <table className="w-full table-auto border-collapse">
//             <thead>
//               <tr className="border-b">
//                 <th className="p-2 text-left">Nome</th>
//                 <th className="p-2 text-left">Email</th>
//                 <th className="p-2 text-left">CPF</th>
//                 <th className="p-2 text-left">Telefone</th>
//                 <th className="p-2 text-left">TipoPessoa</th>
//               </tr>
//             </thead>
//             <tbody>
//               {previewData.map((c, idx) => (
//                 <tr key={idx} className="border-b">
//                   <td className="p-2">{c.nome}</td>
//                   <td className="p-2">{c.email}</td>
//                   <td className="p-2">{c.cpf}</td>
//                   <td className="p-2">{c.telefone}</td>
//                   <td className="p-2">{c.tipoPessoa}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <button
//             className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//             onClick={confirmImport}
//           >
//             Confirmar Importação
//           </button>
//         </div>
//       )}

//       {/* lista credenciado */}
//       <div>
//         <h2 className="text-xl font-semibold mb-4">Credenciados</h2>
//         {credenciados.length === 0 ? (
//           <p>Nenhum credenciado na lista.</p>
//         ) : (
//           <ul className="space-y-2">
//             {credenciados.map((c) => (
//               <li key={c.id} className="flex justify-between items-center border p-2 rounded">
//                 <div>
//                   <p className="font-medium">{c.nome}</p>
//                   <p className="text-sm text-gray-600">{c.email}</p>
//                 </div>

//                 {isAdmin && (
//                   <div className="flex gap-2">
//                     <button
//                       className="text-yellow-600 hover:text-yellow-800"
//                       onClick={() => openEditModal(c)}
//                     >
//                       Editar
//                     </button>
//                     <button
//                       className="text-red-600 hover:text-red-800"
//                       onClick={() => handleDelete(c.id)}
//                     >
//                       Remover
//                     </button>
//                   </div>
//                 )}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

// {/* modal de edição */}
//       {editingCredenciado && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded max-w-md w-full">
//             <h3 className="text-lg font-semibold mb-4">Editar Credenciado</h3>
//             <input
//               type="text"
//               className="border p-2 w-full mb-2"
//               placeholder="Nome"
//               value={editingCredenciado.nome}
//               onChange={(e) => handleEditChange("nome", e.target.value)}
//             />
//             <input
//               type="email"
//               className="border p-2 w-full mb-2"
//               placeholder="Email"
//               value={editingCredenciado.email}
//               onChange={(e) => handleEditChange("email", e.target.value)}
//             />
//             <input
//               type="text"
//               className="border p-2 w-full mb-2"
//               placeholder="CPF"
//               value={editingCredenciado.cpf || ""}
//               onChange={(e) => handleEditChange("cpf", e.target.value)}
//             />
//             <input
//               type="text"
//               className="border p-2 w-full mb-2"
//               placeholder="Telefone"
//               value={editingCredenciado.telefone || ""}
//               onChange={(e) => handleEditChange("telefone", e.target.value)}
//             />
//             <select
//               className="border p-2 w-full mb-4"
//               value={editingCredenciado.tipoPessoa || "pessoaFisica"}
//               onChange={(e) => handleEditChange("tipoPessoa", e.target.value)}
//             >
//               <option value="pessoaFisica">Pessoa Física</option>
//               <option value="empresa">Empresa</option>
//               <option value="colaborador">Colaborador</option>
//             </select>

//             <div className="flex justify-end gap-2">
//               <button
//                 className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
//                 onClick={() => setEditingCredenciado(null)}
//               >
//                 Cancelar
//               </button>
//               <button
//                 className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
//                 onClick={saveEdit}
//               >
//                 Salvar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../../../lib/firebase"
import * as XLSX from "xlsx"

type CredenciadoExcel = {
  Nome?: string
  Email?: string
  CPF?: string
  Telefone?: string
  TipoPessoa?: string
}

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
          tipoPessoa: data.tipoPessoa
        }
      })
      setCredenciados(list)
    } catch (error) {
      console.error("Erro ao carregar credenciados:", error)
      Swal.fire("Erro", "Não foi possível carregar os credenciados", "error")
    }
  }

  // exportar
  function exportCSV() {
    if (credenciados.length === 0) {
      Swal.fire("Aviso", "Nenhum credenciado para exportar", "info")
      return
    }
    const headers = ["Nome", "Email", "CPF", "Telefone", "TipoPessoa"]
    const rows = credenciados.map((c) => [
      c.nome, c.email, c.cpf || "", c.telefone || "", c.tipoPessoa || ""
    ])
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "credenciados.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      for (const item of previewData) {
        await addDoc(collection(db, "credenciados"), {
          nome: item.nome,
          email: item.email,
          cpf: item.cpf,
          telefone: item.telefone,
          tipoPessoa: item.tipoPessoa,
          createdAt: new Date()
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

  //render
  if (loading) return <p>Carregando...</p>
  if (!isAdmin) return <p>Acesso negado</p>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Painel do Administrador</h1>


      <div className="flex gap-4 mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={exportCSV}
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
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={confirmImport}
          >
            Confirmar Importação
          </button>
        </div>
      )}


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
                  <div className="flex gap-2">
                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      onClick={() => openEditModal(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
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
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
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
