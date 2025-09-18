// app/auth/admin/mappers.ts
// Sem "any"

export type CredenciadoExcel = {
    Nome?: string
    Email?: string
    CPF?: string
    Empresa?: string
    Telefone?: string
    TipoPessoa?: string // "F" | "J" | variações ("PF","PJ","Física","Jurídica")
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

function normalizeDigits(v: unknown): string | undefined {
    const s = toStr(v)
    if (!s) return undefined
    const d = s.replace(/\D+/g, "")
    return d.length ? d : undefined
}

export function normalizeCPF(v: unknown): string | undefined {
    const d = normalizeDigits(v)
    // Aceita 11 dígitos; se quiser validar DV, faça aqui.
    return d && d.length === 11 ? d : d
}

export function normalizeTelefone(v: unknown): string | undefined {
    return normalizeDigits(v)
}

export function normalizeTipoPessoa(v: unknown): "F" | "J" | undefined {
    const s = toStr(v)?.toUpperCase()
    if (!s) return undefined
    if (["F", "PF", "FISICA", "FÍSICA"].includes(s)) return "F"
    if (["J", "PJ", "JURIDICA", "JURÍDICA"].includes(s)) return "J"
    return undefined
}

/* ───────────────────────────── payload builders ───────────────────────────── */

/**
 * Constrói o payload para o Firestore a partir de um Credenciado completo
 * (ignora `id`).
 */
export function makeCredPayload(c: Credenciado): Omit<Credenciado, "id"> {
    return {
        nome: toStr(c.nome) ?? "",
        email: toStr(c.email) ?? "",
        cpf: normalizeCPF(c.cpf),
        empresa: toStr(c.empresa),
        telefone: normalizeTelefone(c.telefone),
        tipoPessoa: normalizeTipoPessoa(c.tipoPessoa) ?? "F",
        funcao: toStr(c.funcao),
        observacao: toStr(c.observacao),
    }
}

/**
 * Monta um objeto de atualização parcial sem campos `undefined`.
 * Útil para `updateDoc`.
 */
export function makePartialUpdate(
    patch: Partial<Omit<Credenciado, "id">>
): Partial<Omit<Credenciado, "id">> {
    const out: Partial<Omit<Credenciado, "id">> = {}

    if (patch.nome !== undefined) out.nome = toStr(patch.nome) ?? ""
    if (patch.email !== undefined) out.email = toStr(patch.email) ?? ""
    if (patch.cpf !== undefined) out.cpf = normalizeCPF(patch.cpf)
    if (patch.empresa !== undefined) out.empresa = toStr(patch.empresa)
    if (patch.telefone !== undefined) out.telefone = normalizeTelefone(patch.telefone)
    if (patch.tipoPessoa !== undefined)
        out.tipoPessoa = normalizeTipoPessoa(patch.tipoPessoa) ?? "F"
    if (patch.funcao !== undefined) out.funcao = toStr(patch.funcao)
    if (patch.observacao !== undefined) out.observacao = toStr(patch.observacao)

    return out
}
