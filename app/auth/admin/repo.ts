import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { Credenciado, makeCredPayload, makePartialUpdate, toStr } from "./mappers"

const colRef = collection(db, "credenciados")

export async function listCredenciados(): Promise<Credenciado[]> {
    const qs = await getDocs(colRef)
    return qs.docs.map((d) => {
        const data = d.data() as Partial<Credenciado>
        return {
            id: d.id,
            nome: (toStr(data.nome) ?? "Sem nome") as string,
            email: (toStr(data.email) ?? "Sem email") as string,
            cpf: toStr(data.cpf),
            telefone: toStr(data.telefone),
            tipoPessoa: toStr(data.tipoPessoa),
            empresa: toStr(data.empresa),
            funcao: toStr(data.funcao) ?? "",
            observacao: toStr(data.observacao) ?? "",
        }
    })
}

export async function addCredenciado(c: Credenciado) {
    const payload = makeCredPayload(c)
    await addDoc(colRef, payload)
}

export async function addCredenciadosBulk(items: Credenciado[]) {
    for (const c of items) {
        const payload = makeCredPayload(c)
        await addDoc(colRef, payload)
    }
}

export async function updateCredenciado(id: string, patch: Partial<Omit<Credenciado, "id">>) {
    const ref = doc(db, "credenciados", id)
    const body = makePartialUpdate(patch)
    await updateDoc(ref, body)
}

export async function deleteCredenciado(id: string) {
    await deleteDoc(doc(db, "credenciados", id))
}
