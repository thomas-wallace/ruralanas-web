'use client'

/** Contador que arranca al entrar en pantalla. Portado del prototipo. */

import { useEffect, useRef, useState } from 'react'

export function CountUp({
  value,
  prefix = '',
  suffix = '',
  durationMs = 1400,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  durationMs?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      setCurrent(value)
      return
    }

    let frame = 0
    let start = 0

    const step = (now: number) => {
      start ||= now
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setCurrent(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          frame = requestAnimationFrame(step)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )

    io.observe(element)

    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, durationMs])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {current}
      {suffix}
    </span>
  )
}
