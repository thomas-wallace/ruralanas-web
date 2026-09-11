'use client'

/**
 * Video del Capítulo I: el marco crece de recuadro a pantalla completa mientras
 * se avanza, y el video se recorre con el scroll.
 *
 * Portado del prototipo con dos cambios que el prototipo no podía tener:
 *
 * 1. El scrub por fotogramas solo corre en pantallas grandes. Extraer cien
 *    frames a memoria en un móvil es caro y en Safari iOS el seek encadenado
 *    entrecorta. En móvil el video se reproduce en bucle y el marco sigue
 *    animándose con el scroll: el efecto se conserva, el costo no.
 * 2. Todo listener y todo ImageBitmap se libera al desmontar.
 */

import { useEffect, useRef } from 'react'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function VideoScrub({
  src,
  caption,
  poster,
}: {
  src: string
  caption: string
  poster?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const capRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const frame = frameRef.current
    const video = videoRef.current
    const canvas = canvasRef.current
    const veil = veilRef.current
    const cap = capRef.current
    if (!wrap || !frame || !video || !canvas) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const smallScreen = window.matchMedia('(max-width: 860px)').matches
    const scrubMode = !reduce && !smallScreen

    let cancelled = false
    let frames: Array<ImageBitmap | null> = []
    let frameCount = 0
    let framesReady = false
    let duration = 0
    let target = 0
    let current = 0
    let rafId: number | null = null
    let seeking = false

    const context = canvas.getContext('2d')

    // ── Marco: recuadro → pantalla completa ────────────────────────────────
    const readProgress = () => {
      const rect = wrap.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      return span > 0 ? clamp01(-rect.top / span) : 0
    }

    const layout = (p: number) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const pad = Math.min(80, Math.max(18, vw * 0.05))
      const boxedW = Math.min(1100, vw - pad * 2)
      const boxedH = Math.min(420, Math.max(220, vh * 0.42))
      const open = ease(ramp(p, 0, 0.22))
      const close = ease(ramp(p, 0.82, 1))
      const t = open * (1 - close)

      frame.style.width = `${lerp(boxedW, vw, t)}px`
      frame.style.height = `${lerp(boxedH, vh, t)}px`
      frame.style.borderRadius = `${lerp(2, 0, t)}px`
      frame.style.boxShadow = t < 0.98 ? '0 30px 80px rgba(0,0,0,.5)' : 'none'
      if (veil) veil.style.opacity = String((1 - clamp01(ramp(p, 0.02, 0.16))) * 0.9 + close * 0.75)
      if (cap) cap.style.opacity = String(t)
    }

    // ── Dibujo de fotogramas ───────────────────────────────────────────────
    const nearestFrame = (index: number): ImageBitmap | null => {
      if (frames[index]) return frames[index]
      for (let offset = 1; offset < frameCount; offset++) {
        const before = frames[index - offset]
        if (before) return before
        const after = frames[index + offset]
        if (after) return after
      }
      return null
    }

    const drawFrame = (p: number) => {
      if (!framesReady || !context) return
      const index = Math.max(0, Math.min(frameCount - 1, Math.round(clamp01(p) * (frameCount - 1))))
      const bitmap = nearestFrame(index)
      if (!bitmap) return

      const width = frame.clientWidth || 1
      const height = frame.clientHeight || 1
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      const cw = Math.round(width * dpr)
      const ch = Math.round(height * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }

      const scale = Math.max(cw / bitmap.width, ch / bitmap.height)
      const dw = bitmap.width * scale
      const dh = bitmap.height * scale
      context.drawImage(bitmap, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    /**
     * Extrae los fotogramas a memoria en pasadas progresivas (cada 8, 4, 2, 1):
     * el scrub queda usable después de la primera pasada, no al final.
     */
    const extract = async () => {
      if (typeof createImageBitmap !== 'function') return

      const probe = document.createElement('video')
      probe.muted = true
      probe.playsInline = true
      probe.preload = 'auto'
      probe.src = src

      try {
        await new Promise<void>((resolve, reject) => {
          probe.onloadedmetadata = () => resolve()
          probe.onerror = () => reject(new Error('video'))
          setTimeout(() => reject(new Error('timeout')), 8000)
        })

        const seconds = probe.duration || 0
        if (!seconds || cancelled) return

        const total = Math.max(48, Math.min(100, Math.round(seconds * 10)))
        const resizeWidth = Math.min(
          800,
          probe.videoWidth || 800,
          Math.round(Math.max(window.innerWidth, window.innerHeight) * 1.1),
        )

        frames = new Array<ImageBitmap | null>(total).fill(null)
        frameCount = total

        const seen = new Set<number>()
        const order: number[] = []
        for (const step of [8, 4, 2, 1]) {
          for (let i = 0; i < total; i += step) {
            if (!seen.has(i)) {
              seen.add(i)
              order.push(i)
            }
          }
        }

        const activateAt = Math.ceil(total / 8)
        let got = 0

        for (const index of order) {
          if (cancelled) return
          probe.currentTime = (index / (total - 1)) * Math.max(0, seconds - 0.08)
          await new Promise<void>((resolve) => {
            probe.onseeked = () => resolve()
            setTimeout(resolve, 1200)
          })
          if (cancelled) return

          frames[index] = await createImageBitmap(probe, {
            resizeWidth,
            resizeQuality: 'low',
          })
          got++

          if (got === activateAt) {
            framesReady = true
            canvas.style.display = 'block'
            video.style.visibility = 'hidden'
            drawFrame(current)
          }
        }

        framesReady = true
        drawFrame(current)
      } catch {
        // Sin frames se cae al modo seek, que ya está implementado abajo.
      } finally {
        probe.removeAttribute('src')
        probe.load()
      }
    }

    // ── Modo sin scrub: reproducción en bucle ──────────────────────────────
    let observer: IntersectionObserver | null = null
    const tryPlay = () => {
      const promise = video.play()
      if (promise?.catch) promise.catch(() => {})
    }
    const kick = () => {
      if (video.paused) tryPlay()
    }

    if (!scrubMode) {
      video.loop = true
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) tryPlay()
              else video.pause()
            }
          },
          { threshold: 0.05 },
        )
        observer.observe(wrap)
      } else {
        tryPlay()
      }
      // Varios navegadores bloquean el autoplay hasta la primera interacción.
      window.addEventListener('pointerdown', kick, { once: true })
      window.addEventListener('scroll', kick, { passive: true, once: true })
    } else {
      video.pause()
      void extract()
    }

    // ── Bucle de animación ─────────────────────────────────────────────────
    const onSeeked = () => {
      seeking = false
    }
    video.addEventListener('seeked', onSeeked)

    const doSeek = (time: number) => {
      if (seeking || video.readyState < 2) return
      seeking = true
      try {
        if (typeof video.fastSeek === 'function') video.fastSeek(time)
        else video.currentTime = time
      } catch {
        seeking = false
      }
    }

    const tick = () => {
      current = lerp(current, target, 0.16)

      if (framesReady) {
        drawFrame(current)
      } else if (duration) {
        const time = clamp01(current) * duration
        if (Math.abs(video.currentTime - time) > 0.06) doSeek(time)
      }

      if (Math.abs(target - current) > 0.0005) {
        rafId = requestAnimationFrame(tick)
      } else {
        current = target
        rafId = null
        if (framesReady) drawFrame(current)
      }
    }

    const onScroll = () => {
      const p = readProgress()
      layout(p)
      if (!scrubMode) return

      target = clamp01((p - 0.08) / 0.78)
      if (rafId === null) rafId = requestAnimationFrame(tick)
    }

    const onMeta = () => {
      duration = video.duration || 0
      onScroll()
    }

    if (video.readyState >= 1) onMeta()
    else video.addEventListener('loadedmetadata', onMeta)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()

    return () => {
      cancelled = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('scroll', kick)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadedmetadata', onMeta)
      observer?.disconnect()
      for (const bitmap of frames) bitmap?.close()
      frames = []
    }
  }, [src])

  return (
    /* `z-3` es lo que hace que el hilo de lana de la home pase POR DETRÁS del
       video en vez de por encima. El hilo (`ThreadTrail`) se dibuja en `z-2`
       sobre toda la página; sin esto, la hebra y el ovillo quedan flotando
       sobre la oveja, que es exactamente lo que no tiene que pasar: el hilo
       cose la página, no la tapa.

       El envoltorio mide 300vh pero no pinta nada: sólo el video pegajoso de
       adentro es opaco, así que el hilo sigue visible por encima y por debajo
       de la toma y sólo se esconde mientras el video ocupa la pantalla. */
    <div
      ref={wrapRef}
      className="relative z-3 mt-14 h-[300vh] w-screen"
      style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div ref={frameRef} className="absolute overflow-hidden bg-carbon">
          <video
            ref={videoRef}
            muted
            playsInline
            preload="metadata"
            poster={poster}
            aria-hidden="true"
            className="block h-full w-full object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>

          <canvas ref={canvasRef} className="absolute inset-0 hidden h-full w-full" />

          <div ref={veilRef} className="pointer-events-none absolute inset-0 bg-carbon" />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg,rgba(20,17,14,.55) 0%,transparent 28%,transparent 68%,rgba(20,17,14,.75) 100%)',
            }}
          />

          <div
            ref={capRef}
            className="pointer-events-none absolute inset-x-0 bottom-8 text-center opacity-0"
          >
            <div className="font-mono text-[11px] tracking-[0.22em] text-linen/75">
              {caption.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
