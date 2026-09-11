/**
 * Catálogo de muestra.
 *
 * Reproduce los 16 productos del prototipo de diseño con la forma que va a
 * tener el dato real. Sirve para construir y revisar el diseño sin depender
 * del ERP.
 *
 * ATENCIÓN — datos provisorios:
 *   · Los nombres y zonas de las artesanas son de muestra. Los reales salen de
 *     Dolibarr (Ola 1, tarea 5) y requieren consentimiento de imagen y de uso
 *     del nombre antes de publicarse.
 *   · Stock, técnicas y plazos son verosímiles pero inventados.
 *   · Los precios sí salen del prototipo, en USD.
 * Nada de este archivo debe sobrevivir a la conexión con el ERP.
 */

import type { Locale } from '@/lib/i18n/config'
import type { CatalogRepository } from './repository'
import type {
  Artisan,
  Availability,
  CategoryFacet,
  CategoryRef,
  Product,
  ProductQuery,
  ProductSummary,
  Technique,
} from './types'

type Localized<T> = Record<Locale, T>

const loc = <T,>(es: T, en: T): Localized<T> => ({ es, en })

// ── Artesanas ────────────────────────────────────────────────────────────────

interface MockArtisan {
  id: string
  name: string
  region: Localized<string>
  techniques: Technique[]
  bio: Localized<string>
}

const ARTISANS: MockArtisan[] = [
  {
    id: 'a-01',
    name: 'Marta Fernández',
    region: loc('Tacuarembó', 'Tacuarembó, Uruguay'),
    techniques: ['telar'],
    bio: loc(
      'Teje en telar desde hace dieciocho años, en el mismo cuarto donde aprendió mirando a su madre.',
      'She has worked the loom for eighteen years, in the same room where she learned by watching her mother.',
    ),
  },
  {
    id: 'a-02',
    name: 'Rosario Píriz',
    region: loc('Cerro Largo', 'Cerro Largo, Uruguay'),
    techniques: ['dos-agujas'],
    bio: loc(
      'Especialista en dos agujas. Sus puntos de trenza son reconocibles a simple vista.',
      'A needle-knitting specialist. Her cable stitches are recognisable at a glance.',
    ),
  },
  {
    id: 'a-03',
    name: 'Elena Da Silva',
    region: loc('Rivera', 'Rivera, Uruguay'),
    techniques: ['crochet', 'dos-agujas'],
    bio: loc(
      'Empezó tejiendo para su familia y hoy coordina a otras seis tejedoras de su zona.',
      'She started knitting for her family and now coordinates six other knitters in her area.',
    ),
  },
  {
    id: 'a-04',
    name: 'Gladys Olivera',
    region: loc('Durazno', 'Durazno, Uruguay'),
    techniques: ['telar', 'dos-agujas'],
    bio: loc(
      'Trabaja el telar de pie. Cada ruana suya lleva entre catorce y veinte horas.',
      'She works a floor loom. Each of her ruanas takes between fourteen and twenty hours.',
    ),
  },
  {
    id: 'a-05',
    name: 'Nieves Cabrera',
    region: loc('Treinta y Tres', 'Treinta y Tres, Uruguay'),
    techniques: ['crochet'],
    bio: loc(
      'Crochet fino y piezas de decoración. Fue de las primeras en sumarse a la red, en 2005.',
      'Fine crochet and home pieces. One of the first to join the network, back in 2005.',
    ),
  },
]

// ── Categorías ───────────────────────────────────────────────────────────────

interface MockCategory {
  id: string
  slug: string
  name: Localized<string>
}

const CATEGORIES: MockCategory[] = [
  { id: 'c-01', slug: 'ruanas', name: loc('Pashminas & Ruanas', 'Shawls & Ruanas') },
  { id: 'c-02', slug: 'accesorios', name: loc('Accesorios', 'Accessories') },
  { id: 'c-03', slug: 'deco', name: loc('Deco', 'Home') },
  { id: 'c-04', slug: 'lana', name: loc('Lana', 'Yarn') },
]

// ── Textos compartidos ───────────────────────────────────────────────────────

const MERINO = loc('100% lana merino uruguaya', '100% Uruguayan merino wool')

const CARE = loc(
  [
    'Lavar a mano en agua fría con jabón neutro.',
    'No retorcer: presionar para quitar el exceso de agua.',
    'Secar en horizontal, a la sombra.',
    'Guardar doblada, en lugar seco y aireado.',
  ],
  [
    'Hand wash in cold water with a neutral soap.',
    'Do not wring: press gently to remove excess water.',
    'Dry flat, away from direct sun.',
    'Store folded, in a dry and airy place.',
  ],
)

const SHIPPING = loc(
  { from: 'Punta del Este, Uruguay', estimate: 'Envío internacional · 7 a 15 días hábiles' },
  { from: 'Punta del Este, Uruguay', estimate: 'International shipping · 7 to 15 business days' },
)

// ── Productos ────────────────────────────────────────────────────────────────

interface MockProduct {
  id: string
  sku: string
  slug: string
  image: string
  categorySlug: string
  technique?: Technique
  artisanId: string
  priceUsd: number
  units: number
  /** Días de producción si se teje a pedido. `null` = no se repone. */
  leadTimeDays: number | null
  featured: boolean
  hoursForPiece: number
  colorName: Localized<string>
  name: Localized<string>
  summary: Localized<string>
  story: Localized<string>
  measurements: Localized<string>
}

const PRODUCTS: MockProduct[] = [
  {
    id: 'p-01',
    sku: 'RL-RUA-001',
    slug: 'ruana-clasica',
    image: '/shop/p01.png',
    categorySlug: 'ruanas',
    technique: 'telar',
    artisanId: 'a-01',
    priceUsd: 249,
    units: 3,
    leadTimeDays: 21,
    featured: true,
    hoursForPiece: 16,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Ruana Clásica', 'Classic Ruana'),
    summary: loc(
      'La pieza que define la casa: abrigo real sin peso, tejida en telar.',
      'The piece that defines the house: real warmth without weight, woven on the loom.',
    ),
    story: loc(
      'Nuestra prenda más pedida desde 2003. El telar le da una caída que ninguna máquina consigue, y el merino sin teñir conserva el tono exacto del vellón.',
      'Our most requested garment since 2003. The loom gives it a drape no machine achieves, and the undyed merino keeps the exact tone of the fleece.',
    ),
    measurements: loc('140 × 70 cm · talle único', '140 × 70 cm · one size'),
  },
  {
    id: 'p-02',
    sku: 'RL-RUA-002',
    slug: 'ruana-liviana',
    image: '/shop/p02.png',
    categorySlug: 'ruanas',
    technique: 'telar',
    artisanId: 'a-04',
    priceUsd: 195,
    units: 1,
    leadTimeDays: 21,
    featured: true,
    hoursForPiece: 12,
    colorName: loc('Arena', 'Sand'),
    name: loc('Ruana Liviana', 'Light Ruana'),
    summary: loc(
      'El mismo abrigo en una versión de entretiempo, para usar todo el año.',
      'The same shelter in a mid-season weight, to wear all year round.',
    ),
    story: loc(
      'Pensada para el otoño uruguayo y para los veranos del hemisferio norte: pesa un tercio menos que la clásica y ocupa nada en el bolso.',
      'Made for the Uruguayan autumn and for northern summers: a third lighter than the classic, and it takes up no room in a bag.',
    ),
    measurements: loc('135 × 65 cm · talle único', '135 × 65 cm · one size'),
  },
  {
    id: 'p-03',
    sku: 'RL-DEC-001',
    slug: 'clara-la-ovejita',
    image: '/shop/p03.png',
    categorySlug: 'deco',
    technique: 'crochet',
    artisanId: 'a-05',
    priceUsd: 49,
    units: 6,
    leadTimeDays: 14,
    featured: false,
    hoursForPiece: 5,
    colorName: loc('Crudo y merlot', 'Ecru and merlot'),
    name: loc('Clara la Ovejita', 'Clara the Little Sheep'),
    summary: loc(
      'La oveja que empezó todo, tejida a crochet pieza por pieza.',
      'The sheep that started it all, crocheted piece by piece.',
    ),
    story: loc(
      'Es el regalo que más viaja: cabe en una valija de mano y cuenta la historia entera de la marca sin decir una palabra.',
      'The gift that travels the most: it fits in hand luggage and tells the whole story of the brand without a word.',
    ),
    measurements: loc('22 cm de alto', '22 cm tall'),
  },
  {
    id: 'p-04',
    sku: 'RL-ACC-001',
    slug: 'cuello-y-guantes',
    image: '/shop/p04.png',
    categorySlug: 'accesorios',
    technique: 'dos-agujas',
    artisanId: 'a-02',
    priceUsd: 122,
    units: 2,
    leadTimeDays: 14,
    featured: true,
    hoursForPiece: 9,
    colorName: loc('Gris piedra', 'Stone grey'),
    name: loc('Cuello & Guantes', 'Snood & Gloves'),
    summary: loc('El conjunto que resuelve el invierno en dos piezas.', 'The set that solves winter in two pieces.'),
    story: loc(
      'Tejido en dos agujas con punto elástico doble: abriga sin apretar y no pierde la forma con el uso.',
      'Knitted with a double rib stitch: warm without squeezing, and it keeps its shape with use.',
    ),
    measurements: loc('Cuello 30 cm · guantes talle único', 'Snood 30 cm · gloves one size'),
  },
  {
    id: 'p-05',
    sku: 'RL-ACC-002',
    slug: 'bufanda-clasica',
    image: '/shop/p05.png',
    categorySlug: 'accesorios',
    technique: 'telar',
    artisanId: 'a-01',
    priceUsd: 49,
    units: 8,
    leadTimeDays: 10,
    featured: false,
    hoursForPiece: 4,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Bufanda Clásica', 'Classic Scarf'),
    summary: loc('La primera pieza de merino de mucha gente.', "Many people's first merino piece."),
    story: loc(
      'Simple a propósito. Es la manera más directa de entender por qué el merino no pica.',
      'Deliberately simple. It is the most direct way to understand why merino does not itch.',
    ),
    measurements: loc('180 × 25 cm', '180 × 25 cm'),
  },
  {
    id: 'p-06',
    sku: 'RL-ACC-003',
    slug: 'gorro-clasico',
    image: '/shop/p06.png',
    categorySlug: 'accesorios',
    technique: 'dos-agujas',
    artisanId: 'a-02',
    priceUsd: 39,
    units: 5,
    leadTimeDays: 10,
    featured: false,
    hoursForPiece: 3,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Gorro Clásico', 'Classic Beanie'),
    summary: loc('Punto cerrado, vuelta doble sobre la frente.', 'Tight stitch, double turn-up over the brow.'),
    story: loc(
      'La vuelta doble no es decorativa: es la que evita que el frío entre por el borde.',
      'The double turn-up is not decorative: it is what keeps the cold from getting in at the edge.',
    ),
    measurements: loc('Talle único, elástico', 'One size, stretch fit'),
  },
  {
    id: 'p-07',
    sku: 'RL-ACC-004',
    slug: 'bufanda-flame',
    image: '/shop/p07.png',
    categorySlug: 'accesorios',
    technique: 'telar',
    artisanId: 'a-04',
    priceUsd: 74,
    units: 4,
    leadTimeDays: 12,
    featured: true,
    hoursForPiece: 6,
    colorName: loc('Flamé natural', 'Natural flamé'),
    name: loc('Bufanda Flamé', 'Flamé Scarf'),
    summary: loc(
      'El hilo flamé deja un relieve irregular: no hay dos iguales.',
      'Flamé yarn leaves an irregular relief: no two are alike.',
    ),
    story: loc(
      'El grosor variable del hilo es un rasgo del hilado artesanal. Lo que en una fábrica sería un defecto, acá es la firma de la pieza.',
      'The varying thickness of the yarn is a trait of hand spinning. What a factory would call a defect is, here, the signature of the piece.',
    ),
    measurements: loc('190 × 30 cm', '190 × 30 cm'),
  },
  {
    id: 'p-08',
    sku: 'RL-ACC-005',
    slug: 'gorro-merino',
    image: '/shop/p08.png',
    categorySlug: 'accesorios',
    technique: 'dos-agujas',
    artisanId: 'a-03',
    priceUsd: 48,
    units: 1,
    leadTimeDays: 10,
    featured: false,
    hoursForPiece: 4,
    colorName: loc('Merlot', 'Merlot'),
    name: loc('Gorro Merino', 'Merino Beanie'),
    summary: loc('Teñido en el tono merlot de la casa.', 'Dyed in the house merlot tone.'),
    story: loc(
      'El merlot sale de un teñido en pequeñas partidas: el tono varía apenas de una tanda a otra.',
      'The merlot comes from small-batch dyeing: the tone shifts slightly from one batch to the next.',
    ),
    measurements: loc('Talle único, elástico', 'One size, stretch fit'),
  },
  {
    id: 'p-09',
    sku: 'RL-ACC-006',
    slug: 'calcetines',
    image: '/shop/p09.png',
    categorySlug: 'accesorios',
    technique: 'dos-agujas',
    artisanId: 'a-03',
    priceUsd: 39,
    units: 7,
    leadTimeDays: 10,
    featured: false,
    hoursForPiece: 5,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Calcetines', 'Socks'),
    summary: loc('Merino en el pie: seco todo el día.', 'Merino on your feet: dry all day.'),
    story: loc(
      'El merino absorbe hasta el 35% de su peso en humedad sin sentirse mojado. En un calcetín, eso se nota al final del día.',
      'Merino absorbs up to 35% of its weight in moisture without feeling wet. In a sock, you notice that by the end of the day.',
    ),
    measurements: loc('Talles 36-39 y 40-44', 'Sizes EU 36-39 and 40-44'),
  },
  {
    id: 'p-10',
    sku: 'RL-LAN-001',
    slug: 'madeja-lana-merino',
    image: '/shop/p10.png',
    categorySlug: 'lana',
    artisanId: 'a-01',
    priceUsd: 21,
    units: 24,
    leadTimeDays: 7,
    featured: false,
    hoursForPiece: 0,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Madeja Lana Merino', 'Merino Wool Skein'),
    summary: loc('La misma lana con la que tejemos, para tejer.', 'The same wool we knit with, for you to knit.'),
    story: loc(
      'Hilada y lavada en Uruguay. Es la fibra exacta que reciben las artesanas de la red.',
      'Spun and washed in Uruguay. The exact fibre the artisans in our network receive.',
    ),
    measurements: loc('100 g · aproximadamente 200 m', '100 g · roughly 200 m'),
  },
  {
    id: 'p-11',
    sku: 'RL-RUA-003',
    slug: 'chaleco-merino',
    image: '/shop/p11.png',
    categorySlug: 'ruanas',
    technique: 'dos-agujas',
    artisanId: 'a-02',
    priceUsd: 249,
    units: 0,
    leadTimeDays: 28,
    featured: false,
    hoursForPiece: 22,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Chaleco Merino', 'Merino Vest'),
    summary: loc('Abrigo sin manga, para usar sobre camisa.', 'Sleeveless warmth, to wear over a shirt.'),
    story: loc(
      'Veintidós horas de dos agujas. Se teje a pedido porque cada uno lleva casi tres días de trabajo.',
      'Twenty-two hours of needle knitting. Made to order, because each one takes almost three days of work.',
    ),
    measurements: loc('Talles S, M y L', 'Sizes S, M and L'),
  },
  {
    id: 'p-12',
    sku: 'RL-RUA-004',
    slug: 'chaleco-victoria',
    image: '/shop/p12.png',
    categorySlug: 'ruanas',
    technique: 'dos-agujas',
    artisanId: 'a-04',
    priceUsd: 154,
    units: 0,
    leadTimeDays: 28,
    featured: false,
    hoursForPiece: 15,
    colorName: loc('Arena', 'Sand'),
    name: loc('Chaleco Victoria', 'Victoria Vest'),
    summary: loc('Punto trenza al frente, espalda lisa.', 'Cable stitch at the front, plain back.'),
    story: loc(
      'Lleva el nombre de la artesana que diseñó el patrón de trenzas, en 2011.',
      'Named after the artisan who designed its cable pattern, back in 2011.',
    ),
    measurements: loc('Talles S, M y L', 'Sizes S, M and L'),
  },
  {
    id: 'p-13',
    sku: 'RL-RUA-005',
    slug: 'triangulo-pompon',
    image: '/shop/p13.png',
    categorySlug: 'ruanas',
    technique: 'crochet',
    artisanId: 'a-05',
    priceUsd: 272,
    units: 0,
    leadTimeDays: null,
    featured: false,
    hoursForPiece: 26,
    colorName: loc('Crudo', 'Ecru'),
    name: loc('Triángulo Pompón', 'Pompom Triangle'),
    summary: loc('Chal triangular a crochet, con pompones al borde.', 'Triangular crochet shawl, pompoms along the edge.'),
    story: loc(
      'Una pieza de colección: veintiséis horas de crochet y un remate a mano pompón por pompón.',
      'A collection piece: twenty-six hours of crochet and a hand finish, pompom by pompom.',
    ),
    measurements: loc('180 cm de envergadura', '180 cm wingspan'),
  },
  {
    id: 'p-14',
    sku: 'RL-RUA-006',
    slug: 'pashmina-bufandon',
    image: '/shop/p14.png',
    categorySlug: 'ruanas',
    technique: 'telar',
    artisanId: 'a-01',
    priceUsd: 137,
    units: 2,
    leadTimeDays: 18,
    featured: true,
    hoursForPiece: 10,
    colorName: loc('Natural crudo', 'Natural undyed'),
    name: loc('Pashmina / Bufandón', 'Pashmina / Wrap'),
    summary: loc('Bufanda o chal, según cómo se acomode.', 'Scarf or shawl, depending on how you drape it.'),
    story: loc(
      'El ancho está calculado para que funcione de las dos maneras sin sobrar tela en ninguna.',
      'The width is calculated so it works both ways without any excess fabric.',
    ),
    measurements: loc('200 × 70 cm', '200 × 70 cm'),
  },
  {
    id: 'p-15',
    sku: 'RL-ACC-007',
    slug: 'manta-merino-cinta-de-cuero',
    image: '/shop/p15.png',
    categorySlug: 'accesorios',
    technique: 'telar',
    artisanId: 'a-04',
    priceUsd: 322,
    units: 0,
    leadTimeDays: 35,
    featured: false,
    hoursForPiece: 30,
    colorName: loc('Natural con cuero natural', 'Natural with natural leather'),
    name: loc('Manta Merino con Cinta de Cuero', 'Merino Blanket with Leather Strap'),
    summary: loc('La pieza más grande de la casa, con cinta de cuero uruguayo.', 'The largest piece we make, with a Uruguayan leather strap.'),
    story: loc(
      'Treinta horas de telar y una cinta de cuero curtida en Uruguay para llevarla enrollada. Se teje a pedido.',
      'Thirty hours on the loom and a Uruguayan-tanned leather strap to carry it rolled. Made to order.',
    ),
    measurements: loc('200 × 130 cm', '200 × 130 cm'),
  },
  {
    id: 'p-16',
    sku: 'RL-ACC-008',
    slug: 'manta-merino-flame',
    image: '/shop/p16.png',
    categorySlug: 'accesorios',
    technique: 'telar',
    artisanId: 'a-01',
    priceUsd: 285,
    units: 1,
    leadTimeDays: 35,
    featured: true,
    hoursForPiece: 28,
    colorName: loc('Flamé natural', 'Natural flamé'),
    name: loc('Manta Merino Flamé', 'Flamé Merino Blanket'),
    summary: loc('Manta de telar en hilo flamé, para el sillón o la cama.', 'Loom-woven blanket in flamé yarn, for the sofa or the bed.'),
    story: loc(
      'El relieve del hilo flamé se aprecia mejor en superficies grandes: en una manta, se ve el trabajo completo del telar.',
      'The relief of flamé yarn shows best on large surfaces: in a blanket, you see the full work of the loom.',
    ),
    measurements: loc('190 × 120 cm', '190 × 120 cm'),
  },
]

// ── Derivaciones ─────────────────────────────────────────────────────────────

function availabilityOf(product: MockProduct): Availability {
  if (product.units > 1) return { state: 'in_stock', units: product.units }
  if (product.units === 1) return { state: 'last_one', units: 1 }
  if (product.leadTimeDays !== null) {
    return { state: 'made_to_order', units: 0, leadTimeDays: product.leadTimeDays }
  }
  return { state: 'sold_out', units: 0 }
}

function categoryRef(slug: string, locale: Locale): CategoryRef {
  const category = CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0]!
  return { id: category.id, slug: category.slug, name: category.name[locale] }
}

function artisanOf(product: MockProduct, locale: Locale): Artisan {
  const artisan = ARTISANS.find((a) => a.id === product.artisanId) ?? ARTISANS[0]!
  return {
    id: artisan.id,
    name: artisan.name,
    region: artisan.region[locale],
    techniques: artisan.techniques,
    bio: artisan.bio[locale],
    hoursForPiece: product.hoursForPiece || undefined,
  }
}

function toSummary(product: MockProduct, locale: Locale): ProductSummary {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name[locale],
    category: categoryRef(product.categorySlug, locale),
    price: { amount: product.priceUsd, currency: 'USD' },
    image: {
      src: product.image,
      alt: product.name[locale],
      kind: 'product',
    },
    availability: availabilityOf(product),
    technique: product.technique,
    colorName: product.colorName[locale],
    featured: product.featured,
  }
}

function toProduct(product: MockProduct, locale: Locale): Product {
  const summary = toSummary(product, locale)
  const sameCategory = PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.slug !== product.slug,
  ).slice(0, 3)

  return {
    ...summary,
    images: [summary.image],
    summary: product.summary[locale],
    story: product.story[locale],
    composition: MERINO[locale],
    measurements: product.measurements[locale],
    care: CARE[locale],
    artisan: artisanOf(product, locale),
    shipping: SHIPPING[locale],
    relatedSlugs: sameCategory.map((p) => p.slug),
  }
}

const AVAILABLE_STATES: ReadonlyArray<Availability['state']> = ['in_stock', 'last_one', 'made_to_order']

/** Orden por defecto: destacados primero, después lo disponible, después el resto. */
function featuredRank(item: ProductSummary): number {
  if (item.featured && item.availability.state !== 'sold_out') return 0
  if (item.availability.state === 'sold_out') return 2
  return 1
}

export const mockCatalogRepository: CatalogRepository = {
  async listProducts(query: ProductQuery): Promise<ProductSummary[]> {
    const { locale } = query
    let items = PRODUCTS.map((p) => toSummary(p, locale))

    if (query.category && query.category !== 'todos') {
      items = items.filter((item) => item.category.slug === query.category)
    }

    if (query.techniques?.length) {
      const wanted = new Set(query.techniques)
      items = items.filter((item) => (item.technique ? wanted.has(item.technique) : false))
    }

    if (query.onlyAvailable) {
      items = items.filter((item) => AVAILABLE_STATES.includes(item.availability.state))
    }

    if (query.search) {
      const needle = query.search.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(needle) ||
          item.category.name.toLowerCase().includes(needle) ||
          item.colorName.toLowerCase().includes(needle),
      )
    }

    switch (query.sort) {
      case 'price-asc':
        items.sort((a, b) => a.price.amount - b.price.amount)
        break
      case 'price-desc':
        items.sort((a, b) => b.price.amount - a.price.amount)
        break
      default:
        items.sort((a, b) => featuredRank(a) - featuredRank(b) || b.price.amount - a.price.amount)
    }

    return query.limit ? items.slice(0, query.limit) : items
  },

  async getProduct(slug: string, locale: Locale): Promise<Product | null> {
    const found = PRODUCTS.find((p) => p.slug === slug)
    return found ? toProduct(found, locale) : null
  },

  async listProductSlugs(): Promise<string[]> {
    return PRODUCTS.map((p) => p.slug)
  },

  async listCategories(locale: Locale): Promise<CategoryFacet[]> {
    return CATEGORIES.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name[locale],
      count: PRODUCTS.filter((p) => p.categorySlug === category.slug).length,
    }))
  },

  async listArtisans(locale: Locale): Promise<Artisan[]> {
    return ARTISANS.map((artisan) => ({
      id: artisan.id,
      name: artisan.name,
      region: artisan.region[locale],
      techniques: artisan.techniques,
      bio: artisan.bio[locale],
    }))
  },
}

/** Cantidad total de piezas publicadas, para los contadores de la tienda. */
export const mockProductCount = PRODUCTS.length
