'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export type FaderPhoto = { src: string; alt: string; position?: string }

/**
 * Fotos que se van pasando solas con un fundido. Con una sola foto no hay
 * animación, y con movimiento reducido se queda en la primera.
 */
export function PhotoFader({
  photos,
  intervalMs = 5000,
  sizes,
}: {
  photos: FaderPhoto[]
  intervalMs?: number
  sizes: string
}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (photos.length < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setCurrent((index) => (index + 1) % photos.length), intervalMs)
    return () => clearInterval(timer)
  }, [photos.length, intervalMs])

  return (
    <>
      {photos.map((photo, index) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt={index === current ? photo.alt : ''}
          aria-hidden={index !== current}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-[1200ms] ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: photo.position ?? 'center' }}
        />
      ))}
    </>
  )
}
