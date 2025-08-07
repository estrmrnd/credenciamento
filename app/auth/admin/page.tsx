"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { auth, db } from "../../../lib/firebase"

type Credenciado = {
  id: string
  nome: string
  email: string
  // adicione mais campos conforme seu Firestore
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [credenciados, setCredenciados] = useState<Credenciado[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/entrar")
        return
      }

      setUser(currentUser)

      const docRef = doc(db, "users", currentUser.uid)
      const docSnap = await getDoc(docRef)

if (docSnap.exists()) {
  const data = docSnap.data()
  if (data.isAdmin) {
    setIsAdmin(true)
    await loadCredenciados()
  } else {
    router.push("/auth/sem-acesso") // redireciona não-admin
  }
} else {
  router.push("/auth/sem-acesso") // redireciona caso o documento não exista
}


      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

async function loadCredenciados() {
  const querySnapshot = await getDocs(collection(db, "credenciados"))
  const list: Credenciado[] = []
  querySnapshot.forEach((doc) => {
    const { id: _, ...data } = doc.data() as Credenciado  // ignora id dentro dos dados
    list.push({ id: doc.id, ...data })
  })
  setCredenciados(list)
}


  if (loading) return <p>Carregando...</p>
  if (!isAdmin) return null

  // --- Exportação para CSV ---
  function exportCSV() {
    if (credenciados.length === 0) {
      Swal.fire("Aviso", "Nenhum credenciado para exportar", "info")
      return
    }

    const headers = ["Nome", "Email"]
    const rows = credenciados.map((c) => [c.nome, c.email])

    let csvContent =
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

  // --- Exclusão visual da lista ---
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Painel do Administrador</h1>

      <div className="flex gap-4 mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={exportCSV}
        >
          Exportar CSV
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Credenciados</h2>
        {credenciados.length === 0 ? (
          <p>Nenhum credenciado na lista.</p>
        ) : (
          <ul className="space-y-2">
            {credenciados.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-sm text-gray-600">{c.email}</p>
                </div>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(c.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
