"use client"

import { ModeToggle } from "../../app/temaEscuro/icons"
import { DropdownMenuCheckboxes } from "../components/sidebar"

export function Header() {
  return (
    <header className="p-4 border-b">
      <DropdownMenuCheckboxes />
      <ModeToggle />
    </header>
  )
}
