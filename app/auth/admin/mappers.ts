// app/auth/admin/mappers.ts
// Sem `any`. Helpers centralizados para reuso em repo.ts / index.ts / importExcel.ts

export type CredenciadoExcel = {
    Nome?: string
    Email?: string
    CPF?: string
    Empresa?: string
    Telefone?: string
    TipoPessoa?: string // livre no Excel: "F", "J", "PF", "Física", etc.
    funcao?: string
    observacao?: string
}

export type Credenciado = {
    id: string
    nome: string
    email: string
    cpf?: string
    empresa?: string
    telefone?: string
    tipoPessoa?: "F" | "J"
    funcao?: string
    observacao?: string
}

/** Payload “limpo” para Firestore (sem undefined). */
export type CredenciadoFirestore = {
    nome: string
    email: string | null
    cpf: string | null
    empresa: string | null
    telefone: string | null
    tipoPessoa: "F" | "J"
    funcao: string | null
    observacao: string | null
}


/* ───────────────────────────── helpers ───────────────────────────── */

export function toStr(v: unknown): string | undefined {
    if (typeof v === "string") {
        const t = v.trim()
        return t.length ? t : undefined
    }
    if (typeof v === "number") return String(v)
    return undefined
}

export function nonEmpty(s?: string): boolean {
    return !!(s && s.trim().length > 0)
}

function digits(v?: string): string | undefined {
    if (!v) return undefined
    const d = v.replace(/\D+/g, "")
    return d.length ? d : undefined
}

export function normalizeCPF(v: unknown): string | undefined {
    const s = toStr(v)
    const d = digits(s)
    // Se quiser validar DV, faça aqui; por ora apenas retorna dígitos se existirem
    return d
}

export function normalizeTelefone(v: unknown): string | undefined {
    const s = toStr(v)
    return digits(s)
}

export function normalizeTipoPessoa(v: unknown): "F" | "J" | undefined {
    const s = toStr(v)?.toUpperCase()
    if (!s) return undefined
    if (["F", "PF", "FISICA", "FÍSICA"].includes(s)) return "F"
    if (["J", "PJ", "JURIDICA", "JURÍDICA"].includes(s)) return "J"
    return undefined
}

/* ─────────────────────── builders para Firestore ─────────────────────── */

/**
 * Constrói payload SEM undefined (usa null nos opcionais).
 * Garante `tipoPessoa` sempre "F" ou "J".
 */
export function makeCredPayload(c: Credenciado): CredenciadoFirestore {
    return {
        nome: toStr(c.nome) ?? "",
        // antes: email: toStr(c.email) ?? ""
        // agora: se vier vazio/ausente, manda null (ou seja, não-vazio só quando realmente há valor)
        email: toStr(c.email) ?? null,
        cpf: normalizeCPF(c.cpf) ?? null,
        empresa: toStr(c.empresa) ?? null,
        telefone: normalizeTelefone(c.telefone) ?? null,
        tipoPessoa: normalizeTipoPessoa(c.tipoPessoa) ?? "F",
        funcao: toStr(c.funcao) ?? null,
        observacao: toStr(c.observacao) ?? null,
    }
}


/**
 * Atualização parcial SEM undefined (usa null quando necessário).
 * Retorna somente campos presentes no patch.
 */
export function makePartialUpdate(
    patch: Partial<Omit<Credenciado, "id">>
): Partial<CredenciadoFirestore> {
    const out: Partial<CredenciadoFirestore> = {}

    if (patch.nome !== undefined) out.nome = toStr(patch.nome) ?? ""
    // antes: out.email = toStr(patch.email) ?? ""
    // agora:
    if (patch.email !== undefined) out.email = toStr(patch.email) ?? null

    if (patch.cpf !== undefined) out.cpf = normalizeCPF(patch.cpf) ?? null
    if (patch.empresa !== undefined) out.empresa = toStr(patch.empresa) ?? null
    if (patch.telefone !== undefined) out.telefone = normalizeTelefone(patch.telefone) ?? null
    if (patch.tipoPessoa !== undefined)
        out.tipoPessoa = normalizeTipoPessoa(patch.tipoPessoa) ?? "F"
    if (patch.funcao !== undefined) out.funcao = toStr(patch.funcao) ?? null
    if (patch.observacao !== undefined) out.observacao = toStr(patch.observacao) ?? null

    return out
}

