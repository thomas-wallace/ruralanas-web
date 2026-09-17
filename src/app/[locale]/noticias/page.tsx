import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostCard } from '@/components/blog/post-card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Reveal } from '@/components/ui/reveal'
import { blog, type BlogCategory, type PostPage } from '@/lib/blog'
import { interpolate } from '@/lib/format'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

const PER_PAGE = 9

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readParams(raw: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
  const page = Number.parseInt(first(raw.pagina) ?? '1', 10)
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    category: first(raw.categoria) || undefined,
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const { page, category } = readParams(await searchParams)

  return {
    title: `${dict.blog.title} · Ruralanas`,
    description: dict.blog.lead,
    alternates: {
      canonical: routes.blog(locale, { page, category }),
      languages: Object.fromEntries(locales.map((item) => [item, routes.blog(item)])),
    },
    // Los filtros y las páginas 2+ no compiten con el listado principal.
    robots: page > 1 || category ? { index: false, follow: true } : undefined,
  }
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const { page, category } = readParams(await searchParams)

  let result: PostPage | null = null
  let categories: BlogCategory[] = []
  try {
    ;[result, categories] = await Promise.all([
      blog.listPosts({ locale, page, perPage: PER_PAGE, category }),
      blog.listCategories(locale),
    ])
  } catch (error) {
    // WordPress caído no puede tirar la página: se avisa y el resto del sitio sigue.
    console.error('[noticias] no se pudo leer el blog', error)
  }
  // Una página más allá de la última no existe.
  if (result && page > 1 && result.posts.length === 0) notFound()

  const chip = (label: string, slug: string | undefined) => {
    const active = category === slug
    return (
      <li key={slug ?? 'todas'}>
        <Link
          href={routes.blog(locale, { category: slug })}
          aria-current={active ? 'page' : undefined}
          className={`block rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
            active ? 'border-ink bg-ink text-linen' : 'border-ink/20 text-graphite hover:border-ink hover:text-ink'
          }`}
        >
          {label}
        </Link>
      </li>
    )
  }

  return (
    <div className="bg-linen-warm text-ink">
      <header className="px-[var(--spacing-gutter)] pb-10 pt-[clamp(120px,16vh,160px)]">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-graphite">
            <Breadcrumbs items={[{ label: dict.nav.home, href: routes.home(locale) }, { label: dict.blog.title }]} />
          </div>
          <h1 className="mb-0 mt-10 font-display text-[clamp(44px,7vw,96px)] font-medium leading-none">
            {dict.blog.title}
          </h1>
          <p className="mb-0 mt-5 max-w-[540px] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-graphite">
            {dict.blog.lead}
          </p>

          {categories.length > 0 && (
            <nav aria-label={dict.blog.categories} className="mt-10">
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {chip(dict.blog.all, undefined)}
                {categories.map((item) => chip(item.name, item.slug))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      <section className="px-[var(--spacing-gutter)] pb-[clamp(72px,12vh,140px)]">
        <div className="mx-auto max-w-[1100px] border-t border-ink/12 pt-12">
          {!result ? (
            <p className="py-16 text-center text-[17px] text-graphite">{dict.blog.unavailable}</p>
          ) : result.posts.length === 0 ? (
            <p className="py-16 text-center text-[17px] text-graphite">{dict.blog.empty}</p>
          ) : (
            <ul className="m-0 grid list-none gap-x-6 gap-y-14 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {result.posts.map((post, index) => (
                <Reveal as="li" key={post.slug} delayMs={Math.min(index, 5) * 60}>
                  <PostCard post={post} locale={locale} priority={index < 3} headingLevel="h2" />
                </Reveal>
              ))}
            </ul>
          )}

          {result && result.totalPages > 1 && (
            <nav
              aria-label={dict.blog.pagination}
              className="mt-16 flex items-center justify-between gap-4 border-t border-ink/12 pt-6 text-[13px] tracking-[0.06em] uppercase"
            >
              {page > 1 ? (
                <Link href={routes.blog(locale, { page: page - 1, category })} className="hover:text-bronze">
                  ← {dict.blog.previous}
                </Link>
              ) : (
                <span />
              )}
              <span className="font-mono text-[11px] text-stone">
                {interpolate(dict.blog.pageOf, { page, total: result.totalPages })}
              </span>
              {page < result.totalPages ? (
                <Link href={routes.blog(locale, { page: page + 1, category })} className="hover:text-bronze">
                  {dict.blog.nextPage} →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </section>
    </div>
  )
}
