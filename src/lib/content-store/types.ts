/**
 * Formatos de foto y video que acepta el admin. Sin SVG ni HTML: un archivo
 * subido nunca puede ejecutar código en el navegador de quien lo mira.
 */
export const MEDIA_TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
} as const

export type MediaExtension = keyof typeof MEDIA_TYPES

export interface ReadOptions {
  /**
   * Sin caché: lo que está guardado ahora mismo. Lo pide el admin, que tiene
   * que ver lo último; las páginas públicas leen con caché.
   */
  fresh?: boolean
}

/** Lo que tiene que saber hacer un almacén. Agregar otro es implementar esto. */
export interface ContentStore {
  /** `null` si el documento no se guardó nunca. */
  read<T>(name: string, options?: ReadOptions): Promise<T | null>
  /** Reemplaza el documento entero. */
  write(name: string, data: unknown): Promise<void>
  /** Guarda un archivo y devuelve su URL pública. */
  saveMedia(data: Buffer, extension: MediaExtension, originalName: string): Promise<string>
}
