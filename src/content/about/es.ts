/**
 * Nosotros, en español. Es el idioma de referencia.
 *
 * Fuentes, relevadas el 17-09-2026: la página Nosotros de ruralanas.com y los
 * posts "Propiedades de la lana", "Fuera de fronteras", "Distinguidos con el
 * Morosoli al diseño en moda 2019" y "Ruralanas en el diario El País". Todo
 * dato de este archivo sale de ahí; lo que no está confirmado no se escribe.
 */

import type { AboutContent } from '@/lib/about/types'

export const es: AboutContent = {
  hub: {
    meta: {
      title: 'Nosotros · Ruralanas',
      description:
        'Empresa social uruguaya desde 2003: prendas y deco en lana merino 100% artesanal, tejidas por más de 150 mujeres rurales.',
    },
    eyebrow: 'Nosotros',
    title: 'Tejemos calidad de vida',
    lead: 'Somos una empresa social uruguaya. Producimos prendas y objetos de decoración 100% en lana merino, tejidos a mano por una red de más de 150 mujeres rurales.',
    image: {
      src: '/media/nosotros/artesanas.jpg',
      alt: 'Artesanas de Ruralanas riendo junto a un telar',
      position: 'center 30%',
    },
    sectionsTitle: 'Conocé Ruralanas en profundidad',
    blocks: [
      {
        type: 'figures',
        items: [
          { value: '2003', label: 'el año en que empezamos' },
          { value: '+150', label: 'mujeres artesanas rurales' },
          { value: '100%', label: 'lana merino premium' },
          { value: '3', label: 'países donde se teje el modelo' },
        ],
      },
      {
        type: 'text',
        eyebrow: 'Quiénes somos',
        title: 'El vínculo entre el campo y la ciudad',
        paragraphs: [
          'Somos una empresa social enfocada en mejorar la vida de la mujer rural. Creamos colecciones bajo nuestra marca y para otras marcas, dentro y fuera de Uruguay.',
          'Ofrecemos un medio de vida a familias rurales y promovemos el desarrollo personal y profesional de cada artesana, que teje calidad de vida para ella y para quien usa sus productos. El apoyo familiar y el trabajo en equipo, basados en el respeto, fueron fundamentales para crecer.',
        ],
      },
      {
        type: 'timeline',
        eyebrow: 'Nuestra historia',
        title: 'Más de dos décadas tejiendo',
        items: [
          {
            date: '2003',
            title: 'Nace Ruralanas',
            text: 'La Fundación Gastesi Martinicorena crea Ruralanas con el fin de mejorar la vida de la mujer rural.',
          },
          {
            date: '2006 – 2007',
            title: 'Apoyo del BID',
            text: 'El Banco Interamericano de Desarrollo acompaña el crecimiento del proyecto.',
          },
          {
            date: 'Fines de 2009',
            title: 'Un rumbo propio',
            text: 'Virginia Montoro, diseñadora industrial textil, asume la dirección y la independencia de la empresa, manteniendo su fin social.',
          },
          {
            date: '2014',
            title: 'Ruralanas Ecuador',
            text: 'Emprendedores ecuatorianos conocen nuestro packaging y nos invitan a replicar el proyecto al pie del Chimborazo, con comunidades indígenas.',
          },
          {
            date: '2019',
            title: 'Ruralanas Colombia',
            text: 'Tras capacitar artesanos junto a una fundación, el trabajo continúa y nace Ruralanas Colombia, con la impronta de su propia cultura.',
          },
          {
            date: 'Diciembre de 2019',
            title: 'Premio Morosoli',
            text: 'Virginia Montoro recibe el Premio Morosoli de Bronce al Diseño en Moda, en Minas, Lavalleja.',
          },
        ],
      },
      {
        type: 'features',
        eyebrow: 'Nuestra filosofía',
        title: 'Tres pilares sostienen cada pieza',
        items: [
          {
            title: 'Un producto 100% artesanal',
            text: 'Exclusivo y único, valorado con el tiempo. Sumamos a jóvenes artesanas para preservar la tradición y que cada pieza siga siendo hecha a mano.',
          },
          {
            title: '100% lana merino premium',
            text: 'Nos especializamos en una fibra de propiedades excepcionales, proveniente de Uruguay y reconocida por su calidad y el cuidado ambiental de todo el proceso.',
          },
          {
            title: 'Diseñamos pensando en cada artesana',
            text: 'Cada prenda se adapta al talento y las habilidades de quien la teje, para que esté satisfecha con su trabajo y con lo que crea.',
          },
        ],
      },
      {
        type: 'text',
        eyebrow: 'Nuestro equipo',
        title: 'Un equipo que hace brillar el trabajo de cada artesana',
        paragraphs: [
          'Con más de dos décadas dedicadas a la moda sostenible, llegamos a mercados internacionales. Nuestro equipo se asegura de que el trabajo de cada artesana se destaque y alcance una calidad premium.',
        ],
      },
    ],
  },

  sections: [
    {
      slug: 'materiales',
      meta: {
        title: 'Materiales · Ruralanas',
        description:
          'Lana merino uruguaya, peinada, hilada y teñida artesanalmente. Sus propiedades y cómo cuidarla.',
      },
      eyebrow: 'Materiales',
      title: 'Lana merino, de principio a fin',
      lead: 'Nuestros tejidos son 100% lana merino uruguaya, peinada, hilada y teñida artesanalmente. Una fibra natural que la ciencia todavía no logró igualar.',
      summary: 'La lana merino uruguaya: por qué la elegimos, sus propiedades y cómo cuidarla.',
      image: {
        src: '/media/nosotros/manta-etiqueta-cuero.jpg',
        alt: 'Manta de lana merino cruda con cinta y etiqueta de cuero',
      },
      blocks: [
        {
          type: 'text',
          eyebrow: 'Por qué lana',
          title: 'Una de las fibras más antiguas y valiosas',
          paragraphs: [
            'Aunque hoy existen numerosas fibras sintéticas y artificiales, ninguna logró replicar las propiedades de la lana.',
            'La nuestra proviene de Uruguay, reconocida por su excelente calidad y por el cuidado del ambiente en todo el proceso.',
          ],
        },
        {
          type: 'features',
          eyebrow: 'Propiedades',
          title: 'Una fibra que sabe lo que hace',
          items: [
            {
              title: 'Aísla del frío y del calor',
              text: 'Su rizo y sus escamas atrapan el aire y forman una capa aislante. Da confort en climas fríos y cálidos.',
            },
            {
              title: 'Respira',
              text: 'Absorbe la transpiración del cuerpo y la libera al exterior, manteniendo la piel seca.',
            },
            {
              title: 'Repele el agua',
              text: 'Puede absorber humedad y, al mismo tiempo, repeler el agua.',
            },
            {
              title: 'Resiste el fuego',
              text: 'La llama se extingue sola: es una fibra naturalmente segura.',
            },
            {
              title: 'Elástica y durable',
              text: 'Si se estira vuelve a su forma original. No se arruga y dura muchos años.',
            },
            {
              title: 'Rechaza la suciedad',
              text: 'Al absorber la humedad y reducir la estática, repele el polvo del aire.',
            },
          ],
        },
        {
          type: 'certifications',
          eyebrow: 'Certificados',
          title: 'Respaldos de nuestra lana',
          items: [],
        },
        {
          type: 'features',
          eyebrow: 'Cuidados',
          title: 'Cómo cuidar tu lana',
          lead: 'Bien cuidada, una pieza de lana merino te acompaña durante años.',
          items: [
            { title: 'Lavado', text: 'A mano, con agua fría y jabón neutro. Sin retorcer.' },
            { title: 'Secado', text: 'En horizontal y a la sombra. Nunca colgada ni al sol directo.' },
            { title: 'Guardado', text: 'Doblada, en un lugar seco y aireado.' },
          ],
        },
        {
          type: 'cta',
          title: 'Sentí la diferencia',
          text: 'Cada pieza de la tienda está tejida con esta lana.',
          label: 'Ver la tienda',
          to: { kind: 'shop' },
        },
      ],
    },

    {
      slug: 'procesos',
      meta: {
        title: 'Procesos y producción · Ruralanas',
        description:
          'Del esquilado a los detalles finales: cómo se produce cada pieza de Ruralanas, 100% a mano.',
      },
      eyebrow: 'Procesos y producción',
      title: 'Del vellón a tus manos',
      lead: 'Un proceso artesanal de principio a fin, organizado para que cada artesana pueda tejer desde su casa.',
      summary: 'Los seis pasos de cada pieza, cómo organizamos la producción y nuestro packaging.',
      image: {
        src: '/media/nosotros/telar.jpg',
        alt: 'Manos tejiendo lana en un telar',
      },
      blocks: [
        {
          type: 'steps',
          eyebrow: 'Paso a paso',
          title: 'El proceso de cada pieza',
          items: [
            {
              title: 'Esquilado',
              text: 'Una vez al año la oveja merino entrega su vellón: un recurso que se renueva.',
            },
            {
              title: 'Lavado y peinado',
              text: 'La fibra se limpia y se ordena, y empieza a mostrar su suavidad natural.',
            },
            {
              title: 'Hilado y teñido',
              text: 'En talleres, la lana se hila y se tiñe artesanalmente.',
            },
            {
              title: 'Diseño',
              text: 'Cada diseño se piensa según las habilidades de la artesana que va a tejer la pieza.',
            },
            {
              title: 'Confección',
              text: 'Las artesanas tejen en telar, dos agujas o crochet, desde sus casas.',
            },
            {
              title: 'Detalles finales',
              text: 'La pieza pasa por control de calidad, recibe sus terminaciones y se prepara para la exportación o el mercado local más exigente.',
            },
          ],
        },
        {
          type: 'split',
          eyebrow: 'Cómo trabajamos',
          title: 'Organización industrial, trabajo 100% artesanal',
          paragraphs: [
            'La lana merino, lavada y peinada, va a un taller donde se hila, luego a otro donde se tiñe y vuelve al centro de producción. De ahí pasa a las artesanas, que la tejen según cada diseño.',
            'Producimos el mismo producto en cantidades, de forma parecida a la industria pero totalmente a mano. Así ahorramos tiempo de producción y cada artesana teje con más soltura.',
            'Muchas piezas son únicas o salen en series cortas: dependen del tiempo de quien las teje. Cuando una se agota puede volver a tejerse, pero lleva su tiempo.',
          ],
          image: {
            src: '/media/nosotros/manos-telar.jpg',
            alt: 'Detalle de manos ajustando los hilos de un telar',
          },
          imageSide: 'right',
        },
        {
          type: 'split',
          eyebrow: 'Packaging',
          title: 'Una presentación que cuenta la historia',
          paragraphs: [
            'Muchos de nuestros productos se reconocen por su presentación: un packaging que deja ver parte de la prenda y cuenta lo que significa elegir Ruralanas.',
            'Esa presentación nos llevó a otros países y a replicar el mismo sistema de trabajo con grupos de artesanas en Ecuador y Colombia.',
          ],
          image: {
            src: '/media/nosotros/packaging.jpg',
            alt: 'Caja de cartón de Ruralanas con una oveja tejida a la vista',
          },
          imageSide: 'left',
        },
        {
          type: 'cta',
          title: 'Detrás de cada paso hay una persona',
          label: 'Conocé a las artesanas',
          to: { kind: 'about', slug: 'artesanas' },
        },
      ],
    },

    {
      slug: 'sustentabilidad',
      meta: {
        title: 'Sustentabilidad y compromiso · Ruralanas',
        description:
          'Fin social, fibra natural y producción responsable: el compromiso de Ruralanas con la mujer rural y el ambiente.',
      },
      eyebrow: 'Sustentabilidad y compromiso',
      title: 'Compromiso social y slow fashion',
      lead: 'Somos reconocidos como pioneros en desarrollo sostenible en Uruguay. Nuestro fin social y la producción responsable con fibras naturales son parte de cada pieza.',
      summary: 'Igualdad para la mujer rural, fibra natural y una producción sin excesos.',
      image: {
        src: '/media/nosotros/packaging-en-manos.jpg',
        alt: 'Manos sosteniendo una caja de Ruralanas hecha en Uruguay',
      },
      blocks: [
        {
          type: 'features',
          eyebrow: 'Nuestros compromisos',
          title: 'Sostenible en lo social y en lo ambiental',
          items: [
            {
              title: 'Igualdad para la mujer rural',
              text: 'Damos la posibilidad de generar ingresos para el hogar sin tener que dejar el lugar donde se vive.',
            },
            {
              title: 'Fibra 100% natural',
              text: 'Producimos con lana merino natural: renovable, biodegradable y sin microplásticos.',
            },
            {
              title: 'Sin sobreproducción',
              text: 'Tejemos piezas únicas y series cortas al ritmo de las artesanas, sin stock que termine descartado.',
            },
          ],
        },
        {
          type: 'figures',
          items: [
            { value: '1 vellón', label: 'por oveja cada año: un recurso renovable' },
            { value: '0', label: 'microplásticos liberados al lavar' },
            { value: '100%', label: 'biodegradable al final de su vida' },
          ],
        },
        {
          type: 'text',
          eyebrow: 'Slow fashion',
          title: 'Piezas para toda la vida',
          paragraphs: [
            'La lana es elástica, resistente y no se arruga: una pieza bien cuidada dura muchos años. Preferimos hacer menos y hacerlo bien.',
          ],
        },
        {
          type: 'text',
          eyebrow: 'Fuera de fronteras',
          title: 'Un modelo que se replica',
          paragraphs: [
            'Nuestro sistema de trabajo se replicó en Ecuador, con comunidades indígenas al pie del Chimborazo, y en Colombia, con un grupo de artesanos que trabaja las fibras a su manera.',
            'Queremos que el proyecto pueda instalarse en cada país de América del Sur, respetando las características propias de cada cultura.',
          ],
        },
        {
          type: 'cta',
          title: 'Seguí nuestras novedades',
          label: 'Ir a noticias',
          to: { kind: 'blog' },
        },
      ],
    },

    {
      slug: 'artesanas',
      meta: {
        title: 'Las artesanas · Ruralanas',
        description:
          'Más de 150 mujeres rurales de Uruguay tejen cada pieza de Ruralanas desde sus casas.',
      },
      eyebrow: 'Las artesanas',
      title: 'Las manos detrás de cada tejido',
      lead: 'Más de 150 mujeres de zonas rurales de Uruguay tejen en telar, dos agujas y crochet desde sus casas, sin dejar su lugar.',
      summary: 'La red de mujeres rurales que teje cada pieza, y cómo trabajamos con ellas.',
      image: {
        src: '/media/nosotros/telar-en-casa.jpg',
        alt: 'Un niño pequeño junto a un telar en una casa rural',
        position: 'center 40%',
      },
      blocks: [
        {
          type: 'split',
          eyebrow: 'Una red que crece',
          title: 'Trabajo que valora el conocimiento y el tiempo',
          paragraphs: [
            'Creamos una red que motiva a más de 150 mujeres de zonas rurales y mejora su calidad de vida.',
            'Trabajan de forma independiente o en grupos. Diseñamos para aprovechar sus habilidades, valorando su conocimiento y su tiempo: eso se traduce en más producción y más ingresos para cada una.',
          ],
          image: {
            src: '/media/nosotros/artesanas.jpg',
            alt: 'Artesanas de Ruralanas riendo junto a un telar',
          },
          imageSide: 'right',
        },
        {
          type: 'features',
          eyebrow: 'Lo que nos importa',
          title: 'Cómo trabajamos con ellas',
          items: [
            {
              title: 'Sin desarraigo',
              text: 'Cada artesana teje desde su casa, cerca de su familia y en su comunidad.',
            },
            {
              title: 'Diseño a su medida',
              text: 'Las piezas se piensan según el talento de quien las teje.',
            },
            {
              title: 'Nuevas generaciones',
              text: 'Sumamos a jóvenes artesanas para que la tradición siga viva.',
            },
          ],
        },
        {
          type: 'artisans',
          eyebrow: 'Quiénes tejen',
          title: 'Algunas de nuestras artesanas',
        },
        {
          type: 'quote',
          text: 'Todos se tienen que sentir cómodos y lo más felices posible en su ámbito de trabajo, porque eso se refleja en el producto final. Tejemos calidad de vida, para quien lo compra y para quien lo teje.',
          source: 'Ruralanas, en diario El País',
        },
        {
          type: 'cta',
          title: 'Llevá una pieza tejida por ellas',
          label: 'Ver la tienda',
          to: { kind: 'shop' },
        },
      ],
    },
  ],
}
