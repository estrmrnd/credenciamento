import { useEffect, useState } from 'react'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/** Busca valores distintos (string) de um campo em uma collection do Firestore */
export function useDistinctValues(collectionName: string, field: string) {
    const [values, setValues] = useState<string[]>([])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                const q = query(collection(db, collectionName))
                const snapshot = await getDocs(q)
                const set = new Set<string>()
                snapshot.forEach((doc) => {
                    const data = doc.data() as Record<string, unknown>
                    const v = data?.[field]
                    if (typeof v === 'string' && v.trim()) set.add(v.trim())
                })
                if (mounted) {
                    setValues(Array.from(set).sort((a, b) => a.localeCompare(b)))
                }
            })()

        return () => {
            mounted = false
        }
    }, [collectionName, field])

    return values
}
