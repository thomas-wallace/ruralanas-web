'use client'

import { useRef } from 'react'

import { PendingShot } from '@/components/ui/pending-shot'

/**
 * Botón "Visitanos digitalmente": abre el recorrido en video del local en un
 * diálogo nativo (foco atrapado y cierre con Escape de fábrica). Mientras no
 * exista el video, el diálogo muestra el marco de material pendiente.
 */
export function StoreVisitButton({
  label,
  closeLabel,
  videoSrc,
  pendingLabel,
}: {
  label: string
  closeLabel: string
  videoSrc: string | null
  pendingLabel: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const close = () => {
    dialogRef.current?.querySelector('video')?.pause()
    dialogRef.current?.close()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="cursor-pointer border border-earth/70 px-6 py-3 text-[13px] font-medium tracking-[0.06em] text-earth uppercase transition-colors hover:bg-earth hover:text-paper"
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={label}
        onClose={close}
        // Clic en el fondo oscuro: cierra.
        onClick={(event) => event.target === event.currentTarget && close()}
        className="m-auto w-[min(960px,92vw)] bg-transparent p-0 backdrop:bg-earth/80"
      >
        <div className="flex justify-end pb-3">
          <button
            type="button"
            onClick={close}
            className="cursor-pointer font-mono text-xs tracking-[0.14em] text-paper uppercase hover:text-olive"
          >
            {closeLabel} ✕
          </button>
        </div>
        {videoSrc ? (
          <video src={videoSrc} controls playsInline className="block aspect-video w-full bg-earth" />
        ) : (
          <PendingShot label={pendingLabel} ratio="16/9" tone="dark" align="center" />
        )}
      </dialog>
    </>
  )
}
