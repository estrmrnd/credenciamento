'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '../../temaEscuro/input'

import { SuggestInput } from './components/SuggestInput'
import { useDistinctValues } from './hooks/useDistinctValues'
import { salvarCredenciado } from './services/salvar'
import type { Credenciado, TipoPessoa } from './types'

export default function CredenciamentoPage() {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Credenciado>({
    defaultValues: {
      tipoPessoa: 'pessoaFisica',
      empresa: '',
    },
  })

  const [mensagem, setMensagem] = useState<string | null>(null)

  // Campos observados
  const tipoPessoa = watch('tipoPessoa')
  const nomeAtual = watch('nome') || ''
  const empresaAtual = watch('empresa') || ''

  // Sugestões do Firestore (escopo da feature)
  const nomes = useDistinctValues('credenciados', 'nome')
  const empresas = useDistinctValues('credenciados', 'empresa')

  const onSubmit = async (data: Credenciado) => {
    try {
      await salvarCredenciado({
        ...data,
        nome: data.nome.trim(),
        email: data.email.trim(),
        cpf: data.cpf.trim(),
        empresa: (data.empresa || '').trim(),
        telefone: data.telefone.trim(),
      })
      setMensagem('Credenciamento realizado com sucesso!')
      reset({ tipoPessoa: data.tipoPessoa, empresa: '' })
    } catch (e) {
      console.error(e)
      setMensagem('Erro ao credenciar. Tente novamente.')
    }
  }

  return (
    <div className="relative max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">
        Credenciamento
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">

        <div className="flex flex-row gap-2 mb-4 text-sm">
          {([
            { value: 'pessoaFisica', label: 'Pessoa Física' },
            { value: 'empresa', label: 'Empresa' },
            { value: 'colaborador', label: 'Sou colaborador' },
          ] as { value: TipoPessoa; label: string }[]).map((opt) => (
            <label key={opt.value} className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
              <input type="radio" value={opt.value} {...register('tipoPessoa', { required: true })} />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.tipoPessoa && <p className="text-red-500 text-sm">Escolha uma opção</p>}

        <SuggestInput
          registerReturn={register('nome', {
            required: true,
            setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
          })}
          value={nomeAtual}
          suggestions={nomes}
          placeholder={tipoPessoa === 'empresa' ? 'Razão Social' : 'Nome Completo'}
          onSelect={(val) => setValue('nome', val, { shouldValidate: true })}
          error={errors.nome && 'Nome é obrigatório'}
        />

        <Input
          type="email"
          placeholder="E-mail"
          {...register('email', { required: true })}
          className="w-full"
        />
        {errors.email && <p className="text-red-500 text-sm">E-mail é obrigatório</p>}

        <Input
          type="text"
          placeholder={tipoPessoa === 'empresa' ? 'CNPJ' : 'CPF'}
          {...register('cpf', { required: true })}
          className="w-full"
        />
        {errors.cpf && <p className="text-red-500 text-sm">CPF ou CNPJ é obrigatório</p>}

        {(tipoPessoa === 'empresa' || tipoPessoa === 'colaborador') && (
          <SuggestInput
            registerReturn={register('empresa', {
              required: true,
              setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
            })}
            value={empresaAtual}
            suggestions={empresas}
            placeholder="Empresa"
            onSelect={(val) => setValue('empresa', val, { shouldValidate: true })}
            error={errors.empresa && 'Empresa é obrigatória'}
          />
        )}

        <Input
          placeholder="Telefone com DDD"
          {...register('telefone', { required: true })}
          className="w-full"
        />
        {errors.telefone && <p className="text-red-500 text-sm">Telefone é obrigatório</p>}

        <Button type="submit" className="w-full">Enviar</Button>

        {mensagem && <p className="mt-2 text-green-600">{mensagem}</p>}
      </form>
    </div>
  )
}
