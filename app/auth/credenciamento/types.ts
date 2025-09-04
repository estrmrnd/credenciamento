export type TipoPessoa = 'pessoaFisica' | 'empresa' | 'colaborador'

export type Credenciado = {
    nome: string
    email: string
    cpf: string
    empresa: string
    telefone: string
    tipoPessoa: TipoPessoa
    funcao: string
    observacao: string
}
