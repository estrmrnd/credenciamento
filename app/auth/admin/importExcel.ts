
import * as XLSX from "xlsx"
import {
    Credenciado,
    CredenciadoExcel,
    nonEmpty,
    toStr,
    normalizeCPF,
    normalizeTelefone,
    normalizeTipoPessoa,
} from "./mappers"

export async function parseExcelToPreview(file: File): Promise<Credenciado[]> {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const rows = XLSX.utils.sheet_to_json<CredenciadoExcel>(worksheet, {
        defval: "", // evita undefined nos campos do Excel
        raw: false,
    })

    return rows
        .map<Credenciado>((r, idx) => {
            const nome = toStr(r.Nome) ?? ""
            const email = toStr(r.Email) ?? ""
            const cpf = normalizeCPF(r.CPF)
            const empresa = toStr(r.Empresa)
            const telefone = normalizeTelefone(r.Telefone)
            const tipoPessoa = normalizeTipoPessoa(r.TipoPessoa) ?? "F"
            const funcao = toStr(r.funcao) ?? ""
            const observacao = toStr(r.observacao) ?? ""

            return {
                id: `preview-${idx}`, // id temporário para preview
                nome,
                email,
                cpf,
                empresa,
                telefone,
                tipoPessoa,
                funcao,
                observacao,
            }
        })
        // garante que só apareçam linhas que têm algum dado relevante
        .filter((i) => nonEmpty(i.nome) || nonEmpty(i.email))
}
