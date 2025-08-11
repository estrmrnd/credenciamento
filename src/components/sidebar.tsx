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
import { auth } from "../../lib/firebase"
import { signOut } from "firebase/auth"

export function DropdownMenuCheckboxes() {
  const router = useRouter()

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
        <Button variant="outline">Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/auth/admin">Admin</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/auth/credenciamento">Credenciamento</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/auth/credenciados">Credenciados</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/auth/checkin">Check In</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
