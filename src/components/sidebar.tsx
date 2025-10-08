"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth, db } from "../../lib/firebase"
import { signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"


export function DropdownMenuCheckboxes() {
  const router = useRouter()
   const [userName, setUserName] = React.useState<string | null>(null)

  // Pega o usuário logado
React.useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // busca o nome no Firestore
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setUserName(docSnap.data().nome as string)
      } else {
        // fallback se não tiver no Firestore
        setUserName(user.email || "Usuário")
      }
    } else {
      setUserName(null)
    }
  })

  return () => unsubscribe()
}, [])

  async function handleLogout() {
    try {
      await signOut(auth)
      router.push('/entrar')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          {userName ? `Olá, ${userName}!` : 'Menu'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/auth/admin">Admin</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/auth/credenciamento">Credenciamento</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/auth/credenciados">Credenciados</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem asChild>
          <Link href="/auth/checkin">Check In</Link>
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
