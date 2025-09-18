import * as XLSX from "xlsx"
import { Credenciado, CredenciadoExcel, nonEmpty, toStr } from "./mappers"

/** Lê o Excel e devolve array normalizado para pré-visualização */
export async function parseExcelToPreview(file: File): Promise<Credenciado[]> {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows: CredenciadoExcel[] = XLSX.utils.sheet_to_json<CredenciadoExcel>(worksheet)

    return rows
        .map((r) => ({
            id: "",
            nome: toStr(r.Nome) || "",
            email: toStr(r.Email) || "",
            cpf: toStr(r.CPF),
            empresa: toStr(r.Empresa),
            telefone: toStr(r.Telefone),
            tipoPessoa: toStr(r.TipoPessoa) || "pessoaFisica",
            funcao: toStr(r.funcao),
            observacao: toStr(r.observacao),
        }))
        .filter((i) => nonEmpty(i.nome) && nonEmpty(i.email))
}
