import { useEffect, RefObject } from "react"

export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: (ev: MouseEvent | TouchEvent) => void
) {
    useEffect(() => {
        function onEvent(ev: MouseEvent | TouchEvent) {
            const el = ref.current
            if (!el) return // ainda não montou
            if (el.contains(ev.target as Node)) return // clique dentro
            handler(ev)
        }

        document.addEventListener("mousedown", onEvent)
        document.addEventListener("touchstart", onEvent, { passive: true })

        return () => {
            document.removeEventListener("mousedown", onEvent)
            document.removeEventListener("touchstart", onEvent)
        }
    }, [ref, handler])
}
