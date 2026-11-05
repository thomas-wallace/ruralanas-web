import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Reveal } from '@/components/ui/reveal'
import { Watermark } from '@/components/ui/watermark'
import { listCampaigns } from '@/lib/campaigns'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

/**
 * Campañas: el contenido editorial de moda. La primera de la lista —la que se
 * pone arriba en el admin— abre la página a todo el ancho; las demás siguen
 * en dos columnas. Se cargan desde `/admin/campanas`.
 */

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  return {
    title: `${dict.campaigns.title} - Ruralanas`,
    description: dict.campaigns.lead,
    alternates: {
      canonical: routes.campaigns(locale),
      languages: Object.fromEntries(locales.map((item) => [item, routes.campaigns(item)])),
    },
  }
}

export default async function CampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const [featured, ...rest] = await listCampaigns(locale)

  return (
    <div className="bg-paper text-earth">
      <div className="relative isolate overflow-hidden bg-shell px-[var(--spacing-gutter)] pb-12 pt-[120px]">
        <Watermark className="left-[62%] top-1/2 hidden h-[clamp(300px,34vw,420px)] -translate-x-1/2 -translate-y-[42%] opacity-[0.09] sm:block" />
        <div className="mx-auto max-w-[1240px]">
          <h1 className="m-0 font-display text-[clamp(38px,6vw,68px)] font-medium leading-none">
            {dict.campaigns.title}
          </h1>
          <p className="mt-4 mb-0 max-w-[560px] text-[15px] leading-relaxed text-slate">
            {dict.campaigns.lead}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)] py-[clamp(48px,7vh,90px)] lg:px-8">
        {!featured ? (
          <p className="m-0 py-16 text-center font-display text-2xl text-slate">{dict.campaigns.empty}</p>
        ) : (
          <>
            <Reveal>
              <Link href={routes.campaigns(locale, featured.slug)} className="group block">
                <div className="relative aspect-4/5 overflow-hidden bg-ash sm:aspect-[16/9]">
                  <Image
                    src={featured.cover}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(max-width: 1240px) 100vw, 1240px"
                    className="object-cover object-[center_12%] transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,4vw,48px)] text-paper">
                    {featured.season && (
                      <div className="font-sans text-[11px] tracking-[0.2em] uppercase">{featured.season}</div>
                    )}
                    <h2 className="mt-2 mb-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-none">
                      {featured.title}
                    </h2>
                    <span className="mt-4 inline-block border-b border-paper/70 pb-1 font-sans text-[11px] tracking-[0.14em] uppercase">
                      {dict.campaigns.view} →
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>

            {rest.length > 0 && (
              <div className="mt-[clamp(40px,6vw,72px)] grid gap-x-6 gap-y-12 md:grid-cols-2">
                {rest.map((campaign) => (
                  <Reveal key={campaign.slug}>
                    <Link href={routes.campaigns(locale, campaign.slug)} className="group block">
                      <div className="relative aspect-4/5 overflow-hidden bg-ash">
                        <Image
                          src={campaign.cover}
                          alt={campaign.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 600px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                      {campaign.season && (
                        <div className="mt-4 font-sans text-[10px] tracking-[0.2em] text-slate uppercase">
                          {campaign.season}
                        </div>
                      )}
                      <h2 className="mt-1.5 mb-0 font-display text-[clamp(24px,3vw,34px)] font-medium leading-tight group-hover:text-olive">
                        {campaign.title}
                      </h2>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
