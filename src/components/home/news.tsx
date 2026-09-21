import Link from 'next/link'

import { PostCard } from '@/components/blog/post-card'
import { Reveal } from '@/components/ui/reveal'
import type { PostSummary } from '@/lib/blog'
import type { Dictionary, Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/** Últimas notas del blog. Sin notas (o sin WordPress), la sección no se muestra. */
export function News({ posts, locale, dict }: { posts: PostSummary[]; locale: Locale; dict: Dictionary }) {
  if (posts.length === 0) return null

  return (
    <section
      id="noticias"
      className="bg-paper px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-earth"
    >
      <Reveal className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-4">
        <h2 className="m-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-none">
          {dict.news.title}
        </h2>
        <Link
          href={routes.blog(locale)}
          className="border-b border-caramel pb-1 font-mono text-[13px] text-earth uppercase transition-colors hover:text-olive"
        >
          {dict.news.cta} →
        </Link>
      </Reveal>

      <ul className="mx-auto mt-11 grid max-w-[1100px] list-none gap-x-6 gap-y-12 p-0 md:grid-cols-3">
        {posts.map((post, index) => (
          <Reveal as="li" key={post.slug} delayMs={index * 80}>
            <PostCard post={post} locale={locale} />
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
