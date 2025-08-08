import { useEffect } from 'react'

export function useClickOutside<T extends HTMLElement>(
    ref: React.RefObject<T>,
    onOutside: () => void
) {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [ref, onOutside])
}
