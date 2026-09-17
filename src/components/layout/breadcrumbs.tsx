import Link from 'next/link'

import { absoluteUrl } from '@/lib/site'

export interface Crumb {
  label: string
  /** Sin `href`, es la página actual. */
  href?: string
}

/**
 * Migas de pan visibles y su versión para buscadores (BreadcrumbList).
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  }

  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-[0.12em] uppercase">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="opacity-40">/</span>}
            {item.href ? (
              <Link href={item.href} className="opacity-70 transition-opacity hover:opacity-100">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
