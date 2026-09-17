/**
 * About, in English. Translation of `es.ts`: same slugs, same blocks, same
 * facts. If a block is added in Spanish, it is added here too.
 */

import type { AboutContent } from '@/lib/about/types'

export const en: AboutContent = {
  hub: {
    meta: {
      title: 'About us · Ruralanas',
      description:
        'A Uruguayan social enterprise since 2003: handmade merino wool garments and home pieces, knitted by more than 150 rural women.',
    },
    eyebrow: 'About us',
    title: 'We weave quality of life',
    lead: 'We are a Uruguayan social enterprise. We make garments and home pieces in 100% merino wool, hand-knitted by a network of more than 150 rural women.',
    image: {
      src: '/media/nosotros/artesanas.jpg',
      alt: 'Ruralanas artisans laughing next to a loom',
      position: 'center 30%',
    },
    sectionsTitle: 'Get to know Ruralanas in depth',
    blocks: [
      {
        type: 'figures',
        items: [
          { value: '2003', label: 'the year we started' },
          { value: '+150', label: 'rural women artisans' },
          { value: '100%', label: 'premium merino wool' },
          { value: '3', label: 'countries where the model is knitted' },
        ],
      },
      {
        type: 'text',
        eyebrow: 'Who we are',
        title: 'The link between the countryside and the city',
        paragraphs: [
          'We are a social enterprise focused on improving the lives of rural women. We create collections under our own brand and for other brands, in Uruguay and abroad.',
          'We offer a livelihood to rural families and support the personal and professional growth of every artisan, who weaves quality of life for herself and for whoever wears her work. Family support and teamwork, built on respect, have been key to our growth.',
        ],
      },
      {
        type: 'timeline',
        eyebrow: 'Our story',
        title: 'More than two decades of knitting',
        items: [
          {
            date: '2003',
            title: 'Ruralanas is born',
            text: 'The Gastesi Martinicorena Foundation creates Ruralanas to improve the lives of rural women.',
          },
          {
            date: '2006 – 2007',
            title: 'IDB support',
            text: 'The Inter-American Development Bank supports the growth of the project.',
          },
          {
            date: 'Late 2009',
            title: 'Our own path',
            text: 'Virginia Montoro, industrial textile designer, takes over the management and independence of the company, keeping its social purpose.',
          },
          {
            date: '2014',
            title: 'Ruralanas Ecuador',
            text: 'Ecuadorian entrepreneurs discover our packaging and invite us to replicate the project at the foot of Chimborazo, with indigenous communities.',
          },
          {
            date: '2019',
            title: 'Ruralanas Colombia',
            text: 'After training artisans alongside a foundation, the work carries on and Ruralanas Colombia is born, shaped by its own culture.',
          },
          {
            date: 'December 2019',
            title: 'Morosoli Award',
            text: 'Virginia Montoro receives the Bronze Morosoli Award for Fashion Design in Minas, Lavalleja.',
          },
        ],
      },
      {
        type: 'features',
        eyebrow: 'Our philosophy',
        title: 'Three pillars behind every piece',
        items: [
          {
            title: 'A 100% handmade product',
            text: 'Exclusive and unique, valued over time. We bring in young artisans to preserve the tradition and keep every piece handmade.',
          },
          {
            title: '100% premium merino wool',
            text: 'We specialise in a fibre with exceptional properties, sourced in Uruguay and known for its quality and the environmental care of the whole process.',
          },
          {
            title: 'Designed around each artisan',
            text: 'Every garment is adapted to the talent and skills of the person who knits it, so she is proud of her work and what she creates.',
          },
        ],
      },
      {
        type: 'text',
        eyebrow: 'Our team',
        title: 'A team that makes each artisan’s work shine',
        paragraphs: [
          'With more than two decades devoted to sustainable fashion, we reach international markets. Our team makes sure every artisan’s work stands out and reaches premium quality.',
        ],
      },
    ],
  },

  sections: [
    {
      slug: 'materiales',
      meta: {
        title: 'Materials · Ruralanas',
        description:
          'Uruguayan merino wool, combed, spun and dyed by hand. Its properties and how to care for it.',
      },
      eyebrow: 'Materials',
      title: 'Merino wool, from start to finish',
      lead: 'Our knits are 100% Uruguayan merino wool, combed, spun and dyed by hand. A natural fibre science has yet to match.',
      summary: 'Uruguayan merino wool: why we chose it, its properties and how to care for it.',
      image: {
        src: '/media/nosotros/manta-etiqueta-cuero.jpg',
        alt: 'Raw merino wool blanket with a leather strap and tag',
      },
      blocks: [
        {
          type: 'text',
          eyebrow: 'Why wool',
          title: 'One of the oldest and most valuable fibres',
          paragraphs: [
            'Even with countless synthetic and artificial fibres available today, none has managed to replicate the properties of wool.',
            'Ours comes from Uruguay, known for its excellent quality and for the environmental care throughout the process.',
          ],
        },
        {
          type: 'features',
          eyebrow: 'Properties',
          title: 'A fibre that knows what it is doing',
          items: [
            {
              title: 'Insulates from cold and heat',
              text: 'Its crimp and scales trap air and form an insulating layer, comfortable in cold and warm weather.',
            },
            {
              title: 'Breathes',
              text: 'It absorbs perspiration and releases it outwards, keeping the skin dry.',
            },
            {
              title: 'Repels water',
              text: 'It can absorb moisture while repelling water.',
            },
            {
              title: 'Resists fire',
              text: 'The flame puts itself out: it is a naturally safe fibre.',
            },
            {
              title: 'Elastic and durable',
              text: 'Stretched, it returns to its original shape. It does not wrinkle and lasts for years.',
            },
            {
              title: 'Resists dirt',
              text: 'By absorbing moisture and reducing static, it repels dust from the air.',
            },
          ],
        },
        {
          type: 'certifications',
          eyebrow: 'Certifications',
          title: 'What backs our wool',
          items: [],
        },
        {
          type: 'features',
          eyebrow: 'Care',
          title: 'How to care for your wool',
          lead: 'Cared for properly, a merino piece stays with you for years.',
          items: [
            { title: 'Washing', text: 'By hand, in cold water with neutral soap. Never wring it.' },
            { title: 'Drying', text: 'Flat and in the shade. Never hung or in direct sun.' },
            { title: 'Storing', text: 'Folded, somewhere dry and airy.' },
          ],
        },
        {
          type: 'cta',
          title: 'Feel the difference',
          text: 'Every piece in the shop is knitted with this wool.',
          label: 'Visit the shop',
          to: { kind: 'shop' },
        },
      ],
    },

    {
      slug: 'procesos',
      meta: {
        title: 'Process and production · Ruralanas',
        description:
          'From shearing to the final details: how every Ruralanas piece is made, 100% by hand.',
      },
      eyebrow: 'Process and production',
      title: 'From fleece to your hands',
      lead: 'A handmade process from start to finish, organised so every artisan can knit from home.',
      summary: 'The six steps behind every piece, how we organise production and our packaging.',
      image: {
        src: '/media/nosotros/telar.jpg',
        alt: 'Hands weaving wool on a loom',
      },
      blocks: [
        {
          type: 'steps',
          eyebrow: 'Step by step',
          title: 'How every piece is made',
          items: [
            {
              title: 'Shearing',
              text: 'Once a year the merino sheep gives up its fleece: a resource that grows back.',
            },
            {
              title: 'Washing and combing',
              text: 'The fibre is cleaned and aligned, and begins to show its natural softness.',
            },
            {
              title: 'Spinning and dyeing',
              text: 'In workshops, the wool is spun and dyed by hand.',
            },
            {
              title: 'Design',
              text: 'Each design is planned around the skills of the artisan who will knit the piece.',
            },
            {
              title: 'Making',
              text: 'Artisans knit on looms, with two needles or crochet, from their homes.',
            },
            {
              title: 'Final details',
              text: 'The piece goes through quality control, gets its finishing touches and is prepared for export or the most demanding local market.',
            },
          ],
        },
        {
          type: 'split',
          eyebrow: 'How we work',
          title: 'Industrial organisation, 100% handmade work',
          paragraphs: [
            'The washed and combed merino wool goes to a workshop to be spun, then to another to be dyed, and back to the production centre. From there it goes to the artisans, who knit it following each design.',
            'We make the same product in quantity, much like industry does, but entirely by hand. It saves production time and lets each artisan knit with more ease.',
            'Many pieces are one of a kind or made in short runs: they depend on the time of the person knitting them. When one sells out it can be knitted again, but it takes time.',
          ],
          image: {
            src: '/media/nosotros/manos-telar.jpg',
            alt: 'Close-up of hands adjusting the threads of a loom',
          },
          imageSide: 'right',
        },
        {
          type: 'split',
          eyebrow: 'Packaging',
          title: 'A presentation that tells the story',
          paragraphs: [
            'Many of our products are recognised by their presentation: packaging that shows part of the garment and tells what choosing Ruralanas means.',
            'That presentation took us to other countries and led us to replicate the same way of working with groups of artisans in Ecuador and Colombia.',
          ],
          image: {
            src: '/media/nosotros/packaging.jpg',
            alt: 'Ruralanas cardboard box with a knitted sheep on display',
          },
          imageSide: 'left',
        },
        {
          type: 'cta',
          title: 'Behind every step there is a person',
          label: 'Meet the artisans',
          to: { kind: 'about', slug: 'artesanas' },
        },
      ],
    },

    {
      slug: 'sustentabilidad',
      meta: {
        title: 'Sustainability and commitment · Ruralanas',
        description:
          'Social purpose, natural fibre and responsible production: Ruralanas’ commitment to rural women and the environment.',
      },
      eyebrow: 'Sustainability and commitment',
      title: 'Social commitment and slow fashion',
      lead: 'We are recognised as pioneers of sustainable development in Uruguay. Our social purpose and responsible production with natural fibres are part of every piece.',
      summary: 'Equality for rural women, natural fibre and production without excess.',
      image: {
        src: '/media/nosotros/packaging-en-manos.jpg',
        alt: 'Hands holding a Ruralanas box made in Uruguay',
      },
      blocks: [
        {
          type: 'features',
          eyebrow: 'Our commitments',
          title: 'Sustainable, socially and environmentally',
          items: [
            {
              title: 'Equality for rural women',
              text: 'We make it possible to earn an income for the household without having to leave home.',
            },
            {
              title: '100% natural fibre',
              text: 'We work with natural merino wool: renewable, biodegradable and free of microplastics.',
            },
            {
              title: 'No overproduction',
              text: 'We make one-of-a-kind pieces and short runs at our artisans’ pace, with no stock left to waste.',
            },
          ],
        },
        {
          type: 'figures',
          items: [
            { value: '1 fleece', label: 'per sheep every year: a renewable resource' },
            { value: '0', label: 'microplastics released in the wash' },
            { value: '100%', label: 'biodegradable at the end of its life' },
          ],
        },
        {
          type: 'text',
          eyebrow: 'Slow fashion',
          title: 'Pieces for a lifetime',
          paragraphs: [
            'Wool is elastic, resilient and does not wrinkle: a well-kept piece lasts for years. We would rather make less and make it well.',
          ],
        },
        {
          type: 'text',
          eyebrow: 'Beyond borders',
          title: 'A model that travels',
          paragraphs: [
            'Our way of working has been replicated in Ecuador, with indigenous communities at the foot of Chimborazo, and in Colombia, with a group of artisans who work the fibres in their own way.',
            'Our wish is for the project to take root in every South American country, respecting the character of each culture.',
          ],
        },
        {
          type: 'cta',
          title: 'Follow our news',
          label: 'Go to news',
          to: { kind: 'blog' },
        },
      ],
    },

    {
      slug: 'artesanas',
      meta: {
        title: 'The artisans · Ruralanas',
        description:
          'More than 150 rural women in Uruguay knit every Ruralanas piece from their homes.',
      },
      eyebrow: 'The artisans',
      title: 'The hands behind every knit',
      lead: 'More than 150 women from rural Uruguay knit on looms, with two needles and crochet from their homes, without leaving where they live.',
      summary: 'The network of rural women who knit every piece, and how we work with them.',
      image: {
        src: '/media/nosotros/telar-en-casa.jpg',
        alt: 'A small child next to a loom in a rural home',
        position: 'center 40%',
      },
      blocks: [
        {
          type: 'split',
          eyebrow: 'A growing network',
          title: 'Work that values knowledge and time',
          paragraphs: [
            'We have built a network that motivates more than 150 women in rural areas and improves their quality of life.',
            'They work independently or in groups. We design to make the most of their skills, valuing their knowledge and their time, which means more production and more income for each of them.',
          ],
          image: {
            src: '/media/nosotros/artesanas.jpg',
            alt: 'Ruralanas artisans laughing next to a loom',
          },
          imageSide: 'right',
        },
        {
          type: 'features',
          eyebrow: 'What matters to us',
          title: 'How we work with them',
          items: [
            {
              title: 'No uprooting',
              text: 'Each artisan knits from home, close to her family and within her community.',
            },
            {
              title: 'Design that fits them',
              text: 'Pieces are planned around the talent of the person knitting them.',
            },
            {
              title: 'New generations',
              text: 'We bring in young artisans so the tradition stays alive.',
            },
          ],
        },
        {
          type: 'artisans',
          eyebrow: 'Who knits',
          title: 'Some of our artisans',
        },
        {
          type: 'quote',
          text: 'Everyone should feel comfortable and as happy as possible at work, because it shows in the final product. We weave quality of life, for the person who buys and for the person who knits.',
          source: 'Ruralanas, in El País newspaper',
        },
        {
          type: 'cta',
          title: 'Take home a piece knitted by them',
          label: 'Visit the shop',
          to: { kind: 'shop' },
        },
      ],
    },
  ],
}
