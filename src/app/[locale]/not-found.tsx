'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { getDictionary, resolveLocale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/**
 * 404. Next no le pasa los parámetros de ruta a esta página, así que el idioma
 * se toma del primer segmento de la URL (el middleware garantiza que exista).
 */
export default function NotFound() {
  const locale = resolveLocale(usePathname()?.split('/')[1])
  const dict = getDictionary(locale)

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 bg-paper px-[var(--spacing-gutter)] pb-20 pt-32 text-center text-earth">
      <div className="eyebrow text-olive">404</div>
      <h1 className="m-0 max-w-[560px] font-display text-[clamp(34px,5vw,64px)] font-medium leading-none">
        {dict.notFound.title}
      </h1>
      <p className="m-0 max-w-[420px] text-[16px] leading-relaxed text-slate">{dict.notFound.text}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href={routes.home(locale)}
          className="border border-earth px-6 py-3 text-[13px] tracking-[0.06em] uppercase transition-colors hover:bg-earth hover:text-paper"
        >
          {dict.notFound.home}
        </Link>
        <Link
          href={routes.shop(locale)}
          className="bg-earth px-6 py-3 text-[13px] tracking-[0.06em] text-paper uppercase transition-colors hover:bg-earth"
        >
          {dict.notFound.shop}
        </Link>
      </div>
    </div>
  )
}
