// app/auth/admin/mappers.ts
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

/**
 * Tipos de entrada vindos do Excel (XLSX.utils.sheet_to_json<CredenciadoExcel>())
 */
export type CredenciadoExcel = {
    Nome?: string
    Email?: string
    CPF?: string
    Empresa?: string
    Telefone?: string
    TipoPessoa?: string // "F" | "J" (livre no Excel)
    funcao?: string
    observacao?: string
}

/**
 * Tipo de domínio usado na aplicação
 */
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

/** Usado para criação (sem id) */
export type CredenciadoCreate = Omit<Credenciado, "id">

/* ============================================================================
 * Normalizadores e utilidades
 * ==========================================================================*/

function normalizeString(v: unknown): string | undefined {
    if (typeof v === "string") {
        const trimmed = v.trim()
        return trimmed.length ? trimmed : undefined
    }
    return undefined
}

function normalizeCPF(v: unknown): string | undefined {
    const str = normalizeString(v)
    if (!str) return undefined
    const digits = str.replace(/\D+/g, "")
    return digits.length === 11 ? digits : digits || undefined
}

function normalizeTelefone(v: unknown): string | undefined {
    const str = normalizeString(v)
    if (!str) return undefined
    const digits = str.replace(/\D+/g, "")
    return digits || undefined
}

function normalizeTipoPessoa(v: unknown): "F" | "J" | undefined {
    if (typeof v !== "string") return undefined
    const s = v.trim().toUpperCase()
    if (s === "F" || s === "FISICA" || s === "FÍSICA" || s === "PF") return "F"
    if (s === "J" || s === "JURIDICA" || s === "JURÍDICA" || s === "PJ") return "J"
    return undefined
}

/* ============================================================================
 * Type guards
 * ==========================================================================*/

export function isCredenciadoExcel(x: unknown): x is CredenciadoExcel {
    if (typeof x !== "object" || x === null) return false
    // Pelo menos um campo relevante do Excel
    const o = x as Record<string, unknown>
    return (
        "Nome" in o ||
        "Email" in o ||
        "CPF" in o ||
        "Empresa" in o ||
        "Telefone" in o ||
        "TipoPessoa" in o ||
        "funcao" in o ||
        "observacao" in o
    )
}

/* ============================================================================
 * Mappers
 * ==========================================================================*/

/**
 * Converte uma linha do Excel (já tipada) para o domínio (sem id)
 * Evita `any` usando Partial<CredenciadoExcel>
 */
export function excelRowToCredenciado(
    row: Partial<CredenciadoExcel>
): CredenciadoCreate {
    return {
        nome: normalizeString(row.Nome) ?? "",
        email: normalizeString(row.Email) ?? "",
        cpf: normalizeCPF(row.CPF),
        empresa: normalizeString(row.Empresa),
        telefone: normalizeTelefone(row.Telefone),
        tipoPessoa: normalizeTipoPessoa(row.TipoPessoa) ?? "F",
        funcao: normalizeString(row.funcao),
        observacao: normalizeString(row.observacao),
    }
}

/**
 * Converte várias linhas do Excel (entrada desconhecida) com validação
 * Usa unknown + type guard para satisfazer o ESLint
 */
export function excelRowsToCredenciadosSafe(
    rows: unknown[]
): CredenciadoCreate[] {
    const validRows: CredenciadoExcel[] = []
    for (const r of rows) {
        if (isCredenciadoExcel(r)) validRows.push(r)
    }
    return validRows.map(excelRowToCredenciado)
}

/**
 * Converte um documento do Firestore para o domínio
 * Tipado com QueryDocumentSnapshot<DocumentData> (sem `any`)
 */
export function docToCredenciado(
    doc: QueryDocumentSnapshot<DocumentData>
): Credenciado {
    const data = doc.data()
    return {
        id: doc.id,
        nome: normalizeString(data.nome) ?? "",
        email: normalizeString(data.email) ?? "",
        cpf: normalizeCPF(data.cpf),
        empresa: normalizeString(data.empresa),
        telefone: normalizeTelefone(data.telefone),
        tipoPessoa: normalizeTipoPessoa(data.tipoPessoa) ?? "F",
        funcao: normalizeString(data.funcao),
        observacao: normalizeString(data.observacao),
    }
}

/**
 * Prepara o payload para salvar no Firestore (sem `any`)
 */
export function credenciadoToFirestore(
    c: CredenciadoCreate
): Record<string, unknown> {
    return {
        nome: c.nome,
        email: c.email,
        cpf: c.cpf ?? null,
        empresa: c.empresa ?? null,
        telefone: c.telefone ?? null,
        tipoPessoa: c.tipoPessoa ?? "F",
        funcao: c.funcao ?? null,
        observacao: c.observacao ?? null,
    }
}
