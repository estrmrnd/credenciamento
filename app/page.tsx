// app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  // redireciona servidor-side antes de renderizar qualquer coisa
  redirect('/entrar');
}
