import { serverTimestamp } from "firebase/firestore"

export type Credenciado = {
    id: string
    nome: string
    email: string
    cpf?: string
    empresa?: string
    telefone?: string
    tipoPessoa?: string
    funcao?: string
    observacao?: string
}

export type CredenciadoExcel = {
    Nome?: string
    Email?: string
    CPF?: string
    Empresa?: string
    Telefone?: string
    TipoPessoa?: string
    funcao?: string
    observacao?: string
}

// -------- helpers puros --------
export const toStr = (v: unknown) =>
    v === undefined || v === null ? undefined : String(v).trim()

export const nonEmpty = (v: unknown) => {
    if (v === undefined || v === null) return false
    return String(v).trim().length > 0
}

/** Payload 100% compatível com as regras (create) */
export function makeCredPayload(input: Credenciado) {
    const nome = toStr(input.nome)
    const email = toStr(input.email)
    const tipoPessoa = toStr(input.tipoPessoa) || "pessoaFisica"

    if (!nonEmpty(nome)) throw new Error("nome obrigatório ausente/vazio")
    if (!nonEmpty(tipoPessoa)) throw new Error("tipoPessoa obrigatório ausente/vazio")

    const payload: Record<string, unknown> = {
        nome,
        email: email ?? "",
        tipoPessoa,
        createdAt: serverTimestamp(),
    }

    if (nonEmpty(input.cpf)) payload.cpf = toStr(input.cpf)
    if (nonEmpty(input.empresa)) payload.empresa = toStr(input.empresa)
    if (nonEmpty(input.telefone)) payload.telefone = toStr(input.telefone)
    if (nonEmpty(input.funcao)) payload.funcao = toStr(input.funcao)
    if (nonEmpty(input.observacao)) payload.observacao = toStr(input.observacao)

    return payload
}

/** Patch parcial sem undefined (update) */
export function makePartialUpdate(input: Partial<Omit<Credenciado, "id">>) {
    const out: Record<string, unknown> = {}
    const put = (k: keyof typeof input) => {
        const value = (input as any)[k]
        if (value === undefined || value === null) return
        out[k as string] = toStr(value) ?? ""
    }
    put("nome")
    put("email")
    put("cpf")
    put("empresa")
    put("telefone")
    put("tipoPessoa")
    put("funcao")
    put("observacao")
    return out
}
