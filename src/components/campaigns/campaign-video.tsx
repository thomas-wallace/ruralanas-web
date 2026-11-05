import { videoSource } from '@/lib/campaigns'

/**
 * Un video de campaña. YouTube va por `youtube-nocookie.com` y Vimeo con
 * `dnt=1`: ninguno deja cookies de seguimiento hasta que alguien le da play.
 * Un archivo subido se reproduce con el reproductor del navegador.
 */
export function CampaignVideo({ src, title }: { src: string; title: string }) {
  const source = videoSource(src)
  if (!source) return null

  if (source.type === 'file') {
    return (
      <video
        src={source.src}
        controls
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full bg-earth object-cover"
      />
    )
  }

  const embed =
    source.type === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${source.id}?rel=0&modestbranding=1`
      : `https://player.vimeo.com/video/${source.id}?dnt=1&title=0&byline=0&portrait=0`

  return (
    <iframe
      src={embed}
      title={title}
      loading="lazy"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="absolute inset-0 h-full w-full border-0"
    />
  )
}
