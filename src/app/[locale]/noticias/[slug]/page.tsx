import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostCard } from '@/components/blog/post-card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { blog } from '@/lib/blog'
import { formatDate, interpolate } from '@/lib/format'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import { absoluteUrl, site } from '@/lib/site'

// Una nota nueva en WordPress se sirve sin volver a desplegar.
export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const slugs = await blog.listSlugs()
    return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
  } catch {
    // Sin WordPress al compilar, las notas se generan en la primera visita.
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const post = await blog.getPost(slug, locale)
  if (!post) return {}

  return {
    title: `${post.title} · Ruralanas`,
    description: post.excerpt,
    alternates: {
      canonical: routes.post(locale, slug),
      languages: Object.fromEntries(locales.map((item) => [item, routes.post(item, slug)])),
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: post.image ? [post.image.src] : undefined,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dict = getDictionary(locale)

  const post = await blog.getPost(slug, locale)
  if (!post) notFound()

  const latest = await blog.listPosts({ locale, perPage: 4 }).catch(() => null)
  const more = (latest?.posts ?? []).filter((item) => item.slug !== slug).slice(0, 3)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: post.language,
    image: post.image ? [post.image.src] : undefined,
    mainEntityOfPage: absoluteUrl(routes.post(locale, slug)),
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
  }

  return (
    <div className="bg-paper text-earth">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <article>
        <header className="px-[var(--spacing-gutter)] pt-[clamp(120px,16vh,160px)]">
          <div className="mx-auto max-w-[760px]">
            <div className="text-slate">
              <Breadcrumbs
                items={[
                  { label: dict.nav.home, href: routes.home(locale) },
                  { label: dict.blog.title, href: routes.blog(locale) },
                ]}
              />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-[0.1em] uppercase">
              {post.categories.map((category) => (
                <Link
                  key={category.slug}
                  href={routes.blog(locale, { category: category.slug })}
                  className="text-olive hover:text-earth"
                >
                  {category.name}
                </Link>
              ))}
              <time dateTime={post.publishedAt} className="text-slate">
                {formatDate(post.publishedAt, locale)}
              </time>
              <span className="text-slate">{interpolate(dict.blog.readingTime, { n: post.readingMinutes })}</span>
            </div>

            <h1
              lang={post.language}
              className="mb-0 mt-5 font-display text-[clamp(34px,5vw,64px)] font-medium leading-[1.04] tracking-[-0.01em]"
            >
              {post.title}
            </h1>

            {post.language !== locale && dict.blog.originalLanguage && (
              <p className="mb-0 mt-6 inline-block border border-earth/15 px-4 py-2 text-[13px] text-slate">
                {dict.blog.originalLanguage}
              </p>
            )}
          </div>
        </header>

        {post.image && (
          <div className="mt-12 px-[var(--spacing-gutter)]">
            <div className="relative mx-auto aspect-16/9 max-w-[1100px] overflow-hidden bg-ash">
              <Image
                src={post.image.src}
                alt={post.image.alt}
                fill
                priority
                sizes="(max-width: 1100px) 100vw, 1100px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="px-[var(--spacing-gutter)] py-[clamp(48px,8vh,88px)]">
          <div
            lang={post.language}
            className="post-body mx-auto max-w-[680px]"
            // HTML saneado en `lib/blog/sanitize.ts`: sólo etiquetas editoriales.
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <div className="mx-auto mt-14 max-w-[680px] border-t border-earth/12 pt-6">
            <Link
              href={routes.blog(locale)}
              className="text-[13px] tracking-[0.06em] uppercase hover:text-olive"
            >
              ← {dict.blog.back}
            </Link>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-paper px-[var(--spacing-gutter)] py-[clamp(64px,10vh,112px)]">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="m-0 font-display text-[clamp(28px,3.6vw,44px)] font-medium">{dict.blog.more}</h2>
            <ul className="mt-10 grid list-none gap-x-6 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((item) => (
                <li key={item.slug}>
                  <PostCard post={item} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
