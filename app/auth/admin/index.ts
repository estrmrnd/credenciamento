
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
        const data = d.data() as Partial<CredenciadoFirestore>
        return {
            id: d.id,
            nome: (toStr(data.nome) ?? "Sem nome") as string,
            // no domínio email é string (obrigatória), então convertemos null -> ""
            email: (toStr(data.email) ?? "") as string,
            cpf: toStr(data.cpf ?? undefined),
            telefone: toStr(data.telefone ?? undefined),
            tipoPessoa: normalizeTipoPessoa(data.tipoPessoa),
            empresa: toStr(data.empresa ?? undefined),
            funcao: toStr(data.funcao ?? undefined) ?? "",
            observacao: toStr(data.observacao ?? undefined) ?? "",
        }
    })
}

export async function addCredenciado(c: Credenciado): Promise<void> {
    const payload = makeCredPayload(c) // sem undefined (usa null nos opcionais)
    await addDoc(colRef, payload)
}

/** Importação em lote (batch) — chunks de até ~400 writes */
export async function addCredenciadosBulk(items: Credenciado[]): Promise<void> {
    const chunkSize = 400
    for (let i = 0; i < items.length; i += chunkSize) {
        const batch = writeBatch(db)
        const slice = items.slice(i, i + chunkSize)
        slice.forEach((c) => {
            const ref = doc(colRef)
            batch.set(ref, makeCredPayload(c))
        })
        await batch.commit()
    }
}

/* ───────────────── updateCredenciado com overload ───────────────── */

// aceita patch de DOMÍNIO:
export function updateCredenciado(
    id: string,
    patch: Partial<Omit<Credenciado, "id">>
): Promise<void>

// aceita patch já normalizado para FIRESTORE:
export function updateCredenciado(
    id: string,
    patch: Partial<CredenciadoFirestore>
): Promise<void>

// implementação única
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateCredenciado(id: string, patch: any): Promise<void> {
    const ref = doc(db, "credenciados", id)

    // Se houver qualquer `null` no patch, assumimos que já está no formato Firestore.
    const hasNull = Object.values(patch ?? {}).some((v) => v === null)

    const body: Partial<CredenciadoFirestore> = hasNull
        ? (patch as Partial<CredenciadoFirestore>)
        : makePartialUpdate(patch as Partial<Omit<Credenciado, "id">>)

    await updateDoc(ref, body)
}

export async function deleteCredenciado(id: string): Promise<void> {
    await deleteDoc(doc(db, "credenciados", id))
}
