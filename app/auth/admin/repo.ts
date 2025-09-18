// app/auth/admin/repo.ts
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
} from "firebase/firestore"
import { db } from "../../../lib/firebase"
import {
    Credenciado,
    CredenciadoFirestore,
    makeCredPayload,
    makePartialUpdate,
    toStr,
    normalizeTipoPessoa,
} from "./mappers"

export * from "./mappers"
export * from "./importExcel"

const colRef = collection(db, "credenciados")

export async function listCredenciados(): Promise<Credenciado[]> {
    const qs = await getDocs(colRef)
    return qs.docs.map((d) => {
        // Firestore retorna DocumentData; projetamos de forma segura
        const data = d.data() as Partial<CredenciadoFirestore>
        return {
            id: d.id,
            nome: (toStr(data.nome) ?? "Sem nome") as string,
            email: (toStr(data.email) ?? "Sem email") as string,
            cpf: toStr(data.cpf ?? undefined),
            telefone: toStr(data.telefone ?? undefined),
            tipoPessoa: normalizeTipoPessoa(data.tipoPessoa) as Credenciado["tipoPessoa"],
            empresa: toStr(data.empresa ?? undefined),
            funcao: toStr(data.funcao ?? undefined) ?? "",
            observacao: toStr(data.observacao ?? undefined) ?? "",
        }
    })
}

export async function addCredenciado(c: Credenciado): Promise<void> {
    const payload = makeCredPayload(c) // NUNCA tem undefined
    await addDoc(colRef, payload)
}

/** Importação em lote (batch) — divide em chunks de até 400 writes */
export async function addCredenciadosBulk(items: Credenciado[]): Promise<void> {
    const chunkSize = 400
    for (let i = 0; i < items.length; i += chunkSize) {
        const batch = writeBatch(db)
        const slice = items.slice(i, i + chunkSize)
        slice.forEach((c) => {
            const ref = doc(colRef) // id auto
            const payload = makeCredPayload(c) // NUNCA envia undefined
            batch.set(ref, payload)
        })
        await batch.commit()
    }
}

export async function updateCredenciado(
    id: string,
    patch: Partial<Omit<Credenciado, "id">>
): Promise<void> {
    const ref = doc(db, "credenciados", id)
    const body = makePartialUpdate(patch) // sem undefined
    await updateDoc(ref, body)
}

export async function deleteCredenciado(id: string): Promise<void> {
    await deleteDoc(doc(db, "credenciados", id))
}
