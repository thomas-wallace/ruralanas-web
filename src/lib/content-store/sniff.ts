import type { MediaExtension } from './types'

/**
 * Tipo de un archivo subido según sus primeros bytes, no según su nombre ni lo
 * que declare el navegador: así un archivo renombrado no entra.
 */
export function sniffMedia(bytes: Buffer): MediaExtension | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (bytes.toString('ascii', 4, 8) === 'ftyp') return 'mp4'
  if (bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'webm'
  return null
}

export const isVideo = (extension: MediaExtension) => extension === 'mp4' || extension === 'webm'
