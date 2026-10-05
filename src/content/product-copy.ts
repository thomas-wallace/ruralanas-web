import type { Locale } from '@/lib/i18n/config'

/**
 * Textos de ficha corregidos, por producto e idioma.
 *
 * Los textos de WooCommerce tienen errores de redacción y puntuación, mezclan
 * tuteo con el voseo del sitio y, en inglés, hay fichas que quedaron en
 * español. Además la composición y las medidas vienen mezcladas en párrafos
 * sueltos; acá van separadas y verificadas contra el texto original. Relevado
 * el 02-10-2026 sobre la Store API de producción.
 *
 * Es una capa de transición, como `CATEGORY_NAME_OVERRIDES`: lo correcto es
 * cargar estos textos en el origen. Cuando un producto se corrija allá, se
 * borra su entrada. Lo que no figura acá se muestra tal como llega de Woo.
 *
 * - `story` vacío o ausente: la ficha no muestra "Sobre esta pieza".
 * - `measurements` ausente: la fila de medidas no se muestra.
 */

export interface ProductCopy {
  summary: string
  story?: string
  composition: string
  measurements?: string
}

export const PRODUCT_COPY: Record<string, Record<Locale, ProductCopy>> = {
  'bufanda-clasica': {
    es: {
      summary:
        'Bufanda clásica de trama abierta con flecos, presentada en un divertido empaque ideal para regalar.',
      story: 'Tejida a mano en telar, con lana hilada y teñida artesanalmente.',
      composition: '100% lana merino',
      measurements: '155 x 17 cm',
    },
    en: {
      summary: 'Classic open-weave scarf with fringes, presented in fun packaging that makes it an ideal gift.',
      story: 'Handwoven on a loom, with yarn spun and dyed by hand.',
      composition: '100% merino wool',
      measurements: '155 x 17 cm',
    },
  },
  'bufanda-flame': {
    es: {
      summary: 'Bufanda flamé en color natural, súper suave, de trama abierta y con flecos.',
      story: 'Tejida a mano en telar con lana merino premium, hilada artesanalmente.',
      composition: '100% lana merino premium',
      measurements: '145 x 20 cm',
    },
    en: {
      summary: 'Super-soft flamé scarf in natural colour, with an open weave and fringes.',
      story: 'Handwoven on a loom with premium merino wool, spun by hand.',
      composition: '100% premium merino wool',
      measurements: '145 x 20 cm',
    },
  },
  calcetines: {
    es: { summary: 'Calcetines 100% lana merino.', composition: '100% lana merino' },
    en: { summary: 'Socks made of 100% merino wool.', composition: '100% merino wool' },
  },
  'chaleco-merino': {
    es: {
      summary: 'Chaleco flamé con flecos en color natural, suave y confortable.',
      story: 'Tejido artesanalmente en telar. Talle único.',
      composition: '100% lana merino premium',
    },
    en: {
      summary: 'Flamé vest with fringes in natural colour, soft and comfortable.',
      story: 'Handwoven on a loom. One size.',
      composition: '100% premium merino wool',
    },
  },
  'chaleco-victoria': {
    es: {
      summary:
        'Chaleco de doble uso: podés llevar los flecos hacia abajo o darlo vuelta para que decoren el cuello. Su trama amplia lo hace liviano y muy cómodo.',
      story: 'Tejido en telar manual y teñido artesanalmente. Talle único.',
      composition: '100% lana merino',
    },
    en: {
      summary:
        'A two-way vest: wear it with the fringes down, or turn it around so they frame the neckline. Its loose weave makes it light and very comfortable.',
      story: 'Woven on a hand loom and hand-dyed. One size.',
      composition: '100% merino wool',
    },
  },
  'clara-la-ovejita': {
    es: {
      summary:
        'Clara es nuestra simpática mascota. Ideal para regalar a niños y no tan niños: ¡siempre la adoran! Si sos de Uruguay y comprás dos, el envío dentro del país es gratis.',
      story:
        'Hecha a mano por artesanas de Uruguay, tejida en crochet. Relleno 100% lana y etiqueta artesanal de cuero.',
      composition: '80% lana merino, 20% algodón',
    },
    en: {
      summary:
        'Clara is our friendly mascot, a perfect gift for kids and grown-ups alike: everyone loves her! If you are in Uruguay and buy two, shipping within the country is free.',
      story: 'Handmade by Uruguayan artisans and crocheted. Filled with 100% wool, with a handmade leather label.',
      composition: '80% merino wool, 20% cotton',
    },
  },
  'cuello-guantes': {
    es: {
      summary:
        'Set de cuello y guantes tejidos a dos agujas, presentado en un divertido empaque ideal para regalar.',
      story: 'Hecho a mano en Uruguay, con lana hilada y teñida artesanalmente.',
      composition: '100% lana merino',
      measurements: 'Guantes 23 x 11 cm · Cuello 38 x 30 cm',
    },
    en: {
      summary: 'Hand-knitted neck warmer and gloves set, presented in fun packaging that makes it an ideal gift.',
      story: 'Handmade in Uruguay, with yarn spun and dyed by hand.',
      composition: '100% merino wool',
      measurements: 'Gloves 23 x 11 cm · Neck warmer 38 x 30 cm',
    },
  },
  'gorro-clasico': {
    es: {
      summary: 'Gorro clásico tejido a mano a dos agujas.',
      story: 'Lana hilada y teñida artesanalmente.',
      composition: '100% lana merino',
      measurements: '23 x 20 cm',
    },
    en: {
      summary: 'Classic hat, hand-knitted with two needles.',
      story: 'Yarn spun and dyed by hand.',
      composition: '100% merino wool',
      measurements: '23 x 20 cm',
    },
  },
  'gorro-merino': {
    es: {
      summary: 'Gorro de lana en color natural, tejido a dos agujas y con detalles trenzados.',
      composition: '100% lana merino',
      measurements: '25 x 20 cm',
    },
    en: {
      summary: 'Wool hat in natural colour, knitted with two needles and finished with cable details.',
      composition: '100% merino wool',
      measurements: '25 x 20 cm',
    },
  },
  'madeja-lana-merino': {
    es: { summary: 'Madeja de lana 100% merino en color natural, de 100 g.', composition: '100% lana merino' },
    en: { summary: 'Skein of 100% merino wool in natural colour, 100 g.', composition: '100% merino wool' },
  },
  'manta-merino-con-cinto-de-cuero': {
    es: {
      summary: 'Manta versátil con múltiples usos: como pie de cama o como pashminón.',
      story: 'Tejida artesanalmente en telar manual. La etiqueta de cuero está hecha a mano.',
      composition: '100% lana merino de alta calidad',
    },
    en: {
      summary: 'A versatile blanket with many uses: as a bed throw or as a large wrap.',
      story: 'Handwoven on a hand loom. The leather label is handmade.',
      composition: '100% high-quality merino wool',
    },
  },
  'manta-merino-flame-con-etiqueta-de-cuero': {
    es: {
      summary:
        'Manta flamé súper suave y acogedora, tejida artesanalmente con lana merino de la más alta calidad.',
      story: 'Viene sujeta con una cinta y una etiqueta de cuero natural, para un toque gaucho chic.',
      composition: '100% lana merino',
      measurements: '150 x 90 cm',
    },
    en: {
      summary: 'Super-soft, cosy flamé blanket, handwoven with the finest merino wool.',
      story: 'It comes held by a natural leather strap and label, for a gaucho chic touch.',
      composition: '100% merino wool',
      measurements: '150 x 90 cm',
    },
  },
  'pashmina-bufandon': {
    es: {
      summary:
        'No solo es calentita, sino también muy versátil: usala como pashmina o como bufanda grande. Su trama amplia la hace flexible y cómoda. Nuestro bufandón más popular viene en un hermoso packaging, ideal para regalar.',
      story: 'Tejida a mano en telar y teñida artesanalmente.',
      composition: '100% lana merino',
      measurements: '180 x 50 cm + flecos',
    },
    en: {
      summary:
        'Not only warm but also very versatile: wear it as a pashmina or as a big scarf. Its loose weave makes it flexible and comfortable. Our most popular scarf comes in beautiful packaging, ideal as a gift.',
      story: 'Handwoven on a loom and hand-dyed.',
      composition: '100% merino wool',
      measurements: '180 x 50 cm + fringes',
    },
  },
  'pie-de-cama-con-arnes-de-cuero': {
    es: {
      summary:
        'Precioso pie de cama de estilo flamé con arnés de cuero, ideal para decorar o para llevar de paseo.',
      story: 'Tejido a mano en telar por artesanas, en color natural. Arnés 100% cuero, color miel.',
      composition: '100% lana merino',
      measurements: '190 x 75 cm',
    },
    en: {
      summary: 'A beautiful flamé-style bed throw with a leather harness, perfect for decorating or taking along.',
      story: 'Handwoven on a loom by artisans, in natural colour. Harness in 100% honey-coloured leather.',
      composition: '100% merino wool',
      measurements: '190 x 75 cm',
    },
  },
  'ruana-clasica': {
    es: {
      summary:
        'La tradición y el mejor estilo gaucho chic, resumidos en una prenda. Esta cálida ruana clásica de trama cerrada es ideal para climas templados. Corte rectangular con terminación en flecos.',
      story:
        'Tejida en telar manual por artesanas uruguayas, con lana hilada y teñida artesanalmente. Talle único.',
      composition: '100% lana merino',
      measurements: '150 x 90 cm + flecos',
    },
    en: {
      summary:
        'Tradition and the best gaucho chic style in one garment. This warm, close-weave classic ruana is ideal for mild climates. Rectangular cut with a fringed finish.',
      story: 'Woven on a hand loom by Uruguayan artisans, with yarn spun and dyed by hand. One size.',
      composition: '100% merino wool',
      measurements: '150 x 90 cm + fringes',
    },
  },
  'ruana-liviana': {
    es: {
      summary: 'Su trama abierta la convierte en una prenda liviana, flexible y cómoda.',
      story: 'Tejida en telar manual y teñida artesanalmente. Talle único.',
      composition: '100% lana merino',
      measurements: '150 x 90 cm + flecos',
    },
    en: {
      summary: 'Its open weave makes it a light, flexible and comfortable garment.',
      story: 'Woven on a hand loom and hand-dyed. One size.',
      composition: '100% merino wool',
      measurements: '150 x 90 cm + fringes',
    },
  },
  'sendero-de-mesa': {
    es: {
      summary:
        'Sendero de mesa con detalle de tramado vainilla en el centro y flecos. Ideal para recibidores o mesas rectangulares.',
      composition: '100% lana merino',
    },
    en: {
      summary:
        'Table runner with a vanilla weave detail in the centre and fringes. Ideal for hallways or rectangular tables.',
      composition: '100% merino wool',
    },
  },
  'triangulo-pompon': {
    es: {
      summary: 'Triángulo de lana merino especial, tejido a dos agujas y con detalle de pompón.',
      composition: '100% lana merino',
    },
    en: {
      summary: 'Triangle scarf in special merino wool, knitted with two needles and finished with a pompom.',
      composition: '100% merino wool',
    },
  },
}
