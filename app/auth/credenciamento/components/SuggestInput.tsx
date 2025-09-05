'use client'

import { Input } from '@/app/temaEscuro/input'
import { useMemo, useRef, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { useClickOutside } from '../hooks/useClickOutside'


type SuggestInputProps = {
  registerReturn: UseFormRegisterReturn
  value: string
  suggestions: string[]
  placeholder: string
  onSelect: (val: string) => void
  error?: string | false
  limit?: number
}

export function SuggestInput({
  registerReturn,
  value,
  suggestions,
  placeholder,
  onSelect,
  error,
  limit = 30,
}: SuggestInputProps) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useClickOutside(boxRef, () => setOpen(false))

  const filtered = useMemo(() => {
    const v = (value || '').toLowerCase()
    const base = v
      ? suggestions.filter((s) => s.toLowerCase().includes(v))
      : suggestions
    return base.slice(0, limit)
  }, [value, suggestions, limit])

  return (
    <div ref={boxRef} className="relative">
      <Input
        placeholder={placeholder}
        {...registerReturn}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {error ? <p className="text-red-500 text-sm">{error}</p> : null}

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full max-h-40 overflow-auto bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded shadow-md mt-1">
          {filtered.map((opt) => (
            <li
              key={opt}
              className="cursor-pointer px-4 py-2 hover:bg-gray-200 dark:hover:bg-zinc-600"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(opt)
                setOpen(false)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
