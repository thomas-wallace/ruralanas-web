import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CampaignVideo } from '@/components/campaigns/campaign-video'
import { Reveal } from '@/components/ui/reveal'
import { buttonClass } from '@/components/ui/button'
import { getCampaign, listCampaigns, type LocalizedCampaign } from '@/lib/campaigns'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

/**
 * Una campaña. Portada a sangre, la presentación y después las fotos y videos
 * en el orden del admin, con un ritmo fijo: una foto sola y centrada, dos lado
 * a lado, y otra vez. Los videos ocupan siempre el ancho. Nada se recorta a
 * otra proporción que la 4/5 de las fotos de moda.
 */

// Campañas nuevas se generan en la primera visita; no hace falta volver a construir.
export const dynamicParams = true

export async function generateStaticParams() {
  const campaigns = await listCampaigns('es')
  return locales.flatMap((locale) => campaigns.map((campaign) => ({ locale, slug: campaign.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = resolveLocale(raw)
  const campaign = await getCampaign(slug, locale)
  if (!campaign) return {}
  return {
    title: `${campaign.title} - Ruralanas`,
    description: campaign.intro || getDictionary(locale).campaigns.lead,
    alternates: {
      canonical: routes.campaigns(locale, slug),
      languages: Object.fromEntries(locales.map((item) => [item, routes.campaigns(item, slug)])),
    },
    openGraph: { title: campaign.title, images: [campaign.cover], type: 'article' },
  }
}

type Media = LocalizedCampaign['media'][number]

/**
 * Agrupa las piezas en filas: una foto sola, un par, una sola, un par… Un video
 * va siempre solo y después vuelve a empezar por una foto sola. Un par que se
 * queda con una foto se muestra como foto sola.
 */
function rows(media: Media[]): Media[][] {
  const result: Media[][] = []
  let next: 'single' | 'pair' = 'single'
  let open: Media[] | null = null

  for (const item of media) {
    if (item.kind === 'video') {
      result.push([item])
      open = null
      next = 'single'
    } else if (next === 'single') {
      result.push([item])
      next = 'pair'
    } else if (open) {
      open.push(item)
      open = null
      next = 'single'
    } else {
      open = [item]
      result.push(open)
    }
  }
  return result
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = resolveLocale(raw)
  const dict = getDictionary(locale)

  const [campaign, all] = await Promise.all([getCampaign(slug, locale), listCampaigns(locale)])
  if (!campaign) notFound()

  const others = all.filter((item) => item.slug !== campaign.slug).slice(0, 2)
  // La portada no se repite en la galería.
  const media = campaign.media.filter((item) => item.src !== campaign.cover)

  const piece = (item: Media, size: 'single' | 'pair') => (
    <figure key={item.id} className="m-0">
      <div className={`relative overflow-hidden bg-ash ${item.kind === 'video' ? 'aspect-video' : 'aspect-4/5'}`}>
        {item.kind === 'video' ? (
          <CampaignVideo src={item.src} title={item.caption || campaign.title} />
        ) : (
          <Image
            src={item.src}
            alt={item.caption || campaign.title}
            fill
            sizes={size === 'single' ? '(max-width: 768px) 100vw, 720px' : '(max-width: 768px) 100vw, 600px'}
            className="object-cover"
          />
        )}
      </div>
      {item.caption && (
        <figcaption className="mt-3 font-sans text-[12px] leading-relaxed text-slate">{item.caption}</figcaption>
      )}
    </figure>
  )

  return (
    <article className="bg-paper text-earth">
      <header className="relative isolate flex min-h-[min(92vh,900px)] items-end overflow-hidden bg-earth">
        <Image
          src={campaign.cover}
          alt={campaign.title}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[center_12%]"
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black/60 via-black/10 to-black/20" />
        <div className="mx-auto w-full max-w-[1240px] px-[var(--spacing-gutter)] pb-[clamp(36px,7vh,80px)] text-paper lg:px-8">
          <Link
            href={routes.campaigns(locale)}
            className="font-sans text-[11px] tracking-[0.16em] uppercase opacity-85 hover:opacity-100"
          >
            ← {dict.campaigns.back}
          </Link>
          {campaign.season && (
            <div className="mt-6 font-sans text-[11px] tracking-[0.2em] uppercase">{campaign.season}</div>
          )}
          <h1 className="mt-2 mb-0 max-w-[900px] font-display text-[clamp(40px,7vw,96px)] font-medium leading-[0.95]">
            {campaign.title}
          </h1>
        </div>
      </header>

      {campaign.intro && (
        <Reveal className="mx-auto max-w-[680px] px-[var(--spacing-gutter)] pt-[clamp(56px,9vh,110px)] text-center">
          <p className="m-0 whitespace-pre-line font-display text-[clamp(22px,2.6vw,30px)] leading-snug text-earth">
            {campaign.intro}
          </p>
        </Reveal>
      )}

      <div className="mx-auto flex max-w-[1240px] flex-col gap-[clamp(28px,5vw,64px)] px-[var(--spacing-gutter)] py-[clamp(56px,9vh,110px)] lg:px-8">
        {rows(media).map((row) => (
          <Reveal key={row.map((item) => item.id).join('-')}>
            {row.length === 2 ? (
              <div className="grid gap-[clamp(16px,3vw,32px)] md:grid-cols-2">
                {row.map((item) => piece(item, 'pair'))}
              </div>
            ) : row[0]?.kind === 'video' ? (
              piece(row[0], 'single')
            ) : (
              row[0] && <div className="mx-auto max-w-[720px]">{piece(row[0], 'single')}</div>
            )}
          </Reveal>
        ))}
      </div>

      <footer className="border-t border-earth/12 bg-shell px-[var(--spacing-gutter)] py-[clamp(56px,8vh,100px)]">
        <div className="mx-auto max-w-[1240px] lg:px-8">
          {others.length > 0 && (
            <>
              <h2 className="m-0 mb-8 font-display text-[clamp(26px,3.5vw,40px)] font-medium">
                {dict.campaigns.more}
              </h2>
              <div className="mb-12 grid gap-6 sm:grid-cols-2">
                {others.map((other) => (
                  <Link key={other.slug} href={routes.campaigns(locale, other.slug)} className="group flex gap-5">
                    <div className="relative aspect-4/5 w-28 shrink-0 overflow-hidden bg-ash">
                      <Image src={other.cover} alt="" fill sizes="112px" className="object-cover" />
                    </div>
                    <div className="self-center">
                      {other.season && (
                        <div className="font-sans text-[10px] tracking-[0.2em] text-slate uppercase">{other.season}</div>
                      )}
                      <div className="mt-1 font-display text-[24px] leading-tight group-hover:text-olive">{other.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          <Link href={routes.shop(locale)} className={buttonClass('primary', 'md')}>
            {dict.campaigns.shopCta}
          </Link>
        </div>
      </footer>
    </article>
  )
}
