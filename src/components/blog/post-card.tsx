import Image from 'next/image'
import Link from 'next/link'

import type { PostSummary } from '@/lib/blog'
import { formatDate } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/** Tarjeta de una nota: foto, tema, título y fecha. */
export function PostCard({
  post,
  locale,
  priority = false,
  headingLevel = 'h3',
}: {
  post: PostSummary
  locale: Locale
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel
  const topic = post.categories[0]?.name

  return (
    <article className="group flex flex-col">
      <Link href={routes.post(locale, post.slug)} className="flex flex-col" lang={post.language}>
        <div className="relative aspect-16/10 overflow-hidden bg-sand">
          {post.image && (
            <Image
              src={post.image.src}
              alt={post.image.alt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.1em] uppercase">
          {topic && <span className="text-bronze">{topic}</span>}
          <time dateTime={post.publishedAt} className="text-stone">
            {formatDate(post.publishedAt, locale)}
          </time>
        </div>
        <Heading className="mb-0 mt-2 font-display text-[22px] font-medium leading-tight text-ink transition-colors group-hover:text-bark">
          {post.title}
        </Heading>
      </Link>
    </article>
  )
}
