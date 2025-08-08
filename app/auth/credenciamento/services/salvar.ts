import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/firebase'
import type { Credenciado } from '../types'

export async function salvarCredenciado(payload: Credenciado) {
    const id = uuidv4()
    await addDoc(collection(db, 'credenciados'), {
        id,
        ...payload,
        createdAt: Timestamp.now(), // se preferir: serverTimestamp()
    })
}
