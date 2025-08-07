'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Ban } from 'lucide-react'

export default function AcessoNegado() {
  return (
    <div className="flex h-[50vh] items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center space-y-6 p-6 border border-border rounded-2xl shadow-2xl bg-card w-full max-w-md"
      >
        {/* Ícone com animação */}
        <motion.div
          initial={{ rotate: -10, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <Ban className="text-destructive w-14 h-14" />
        </motion.div>

        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página de administrador.
        </p>

        <Button asChild variant="secondary" className="w-full">
          <Link href="/auth/credenciamento">Voltar para o credenciamento</Link>
        </Button>
      </motion.div>
    </div>
  )
}
