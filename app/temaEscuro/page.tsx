// "use client"

// import * as React from "react"
// import { ThemeProvider as NextThemesProvider } from "next-themes"

// export function ThemeProvider({
//   children,
//   ...props
// }: React.ComponentProps<typeof NextThemesProvider>) {
//   return <NextThemesProvider {...props}>{children}</NextThemesProvider>
// }

"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export default function TemaEscuroPage() {
  return (
    <NextThemesProvider attribute="class">
      <div>Conteúdo da página de tema escuro</div>
    </NextThemesProvider>
  )
}
