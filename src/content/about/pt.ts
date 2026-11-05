/**
 * Nosotros, en portugués de Brasil. Traducción de `es.ts`: mismos slugs, mismos
 * bloques, mismos datos. Si se agrega un bloque en español, se agrega acá también.
 */

import type { AboutContent } from '@/lib/about/types'

export const pt: AboutContent = {
  hub: {
    meta: {
      title: 'Sobre nós - Ruralanas',
      description:
        'Empresa social uruguaia desde 2003: roupas e peças para casa em lã merino 100% artesanal, tecidas por mais de 150 mulheres rurais.',
    },
    eyebrow: 'Sobre nós',
    title: 'Tecemos qualidade de vida',
    lead: 'Somos uma empresa social uruguaia. Produzimos roupas e objetos de decoração 100% em lã merino, tecidos à mão por uma rede de mais de 150 mulheres rurais.',
    image: {
      src: '/media/nosotros/artesanas.jpg',
      alt: 'Artesãs da Ruralanas rindo ao lado de um tear',
      position: 'center 30%',
    },
    sectionsTitle: 'Conheça a Ruralanas a fundo',
    blocks: [
      {
        type: 'figures',
        items: [
          { value: '2003', label: 'o ano em que começamos' },
          { value: '+150', label: 'mulheres artesãs rurais' },
          { value: '100%', label: 'lã merino premium' },
          { value: '3', label: 'países onde o modelo é tecido' },
        ],
      },
      {
        type: 'text',
        eyebrow: 'Quem somos',
        title: 'O elo entre o campo e a cidade',
        paragraphs: [
          'Somos uma empresa social dedicada a melhorar a vida da mulher rural. Criamos coleções com a nossa marca e para outras marcas, no Uruguai e no exterior.',
          'Oferecemos um meio de vida a famílias rurais e promovemos o desenvolvimento pessoal e profissional de cada artesã, que tece qualidade de vida para si mesma e para quem usa seus produtos. O apoio da família e o trabalho em equipe, baseados no respeito, foram fundamentais para crescer.',
        ],
      },
      {
        type: 'timeline',
        eyebrow: 'Nossa história',
        title: 'Mais de duas décadas tecendo',
        items: [
          {
            date: '2003',
            title: 'Nasce a Ruralanas',
            text: 'A Fundación Gastesi Martinicorena cria a Ruralanas com o objetivo de melhorar a vida da mulher rural.',
          },
          {
            date: '2006 – 2007',
            title: 'Apoio do BID',
            text: 'O Banco Interamericano de Desenvolvimento acompanha o crescimento do projeto.',
          },
          {
            date: 'Final de 2009',
            title: 'Um caminho próprio',
            text: 'Virginia Montoro, designer industrial têxtil, assume a direção e a independência da empresa, mantendo sua finalidade social.',
          },
          {
            date: '2014',
            title: 'Ruralanas Equador',
            text: 'Empreendedores equatorianos conhecem a nossa embalagem e nos convidam a replicar o projeto ao pé do Chimborazo, com comunidades indígenas.',
          },
          {
            date: '2019',
            title: 'Ruralanas Colômbia',
            text: 'Depois de capacitar artesãos junto com uma fundação, o trabalho continua e nasce a Ruralanas Colômbia, com a marca da sua própria cultura.',
          },
          {
            date: 'Dezembro de 2019',
            title: 'Prêmio Morosoli',
            text: 'Virginia Montoro recebe o Prêmio Morosoli de Bronze de Design de Moda, em Minas, Lavalleja.',
          },
        ],
      },
      {
        type: 'features',
        eyebrow: 'Nossa filosofia',
        title: 'Três pilares sustentam cada peça',
        items: [
          {
            title: 'Um produto 100% artesanal',
            text: 'Exclusivo e único, valorizado com o tempo. Incorporamos jovens artesãs para preservar a tradição e para que cada peça continue sendo feita à mão.',
          },
          {
            title: '100% lã merino premium',
            text: 'Somos especialistas em uma fibra de propriedades excepcionais, vinda do Uruguai e reconhecida pela qualidade e pelo cuidado com o meio ambiente em todo o processo.',
          },
          {
            title: 'Criamos pensando em cada artesã',
            text: 'Cada peça se adapta ao talento e às habilidades de quem a tece, para que ela fique satisfeita com o seu trabalho e com o que cria.',
          },
        ],
      },
      {
        type: 'text',
        eyebrow: 'Nossa equipe',
        title: 'Uma equipe que faz brilhar o trabalho de cada artesã',
        paragraphs: [
          'Com mais de duas décadas dedicadas à moda sustentável, chegamos a mercados internacionais. Nossa equipe garante que o trabalho de cada artesã se destaque e alcance uma qualidade premium.',
        ],
      },
    ],
  },

  sections: [
    {
      slug: 'materiales',
      meta: {
        title: 'Materiais - Ruralanas',
        description:
          'Lã merino uruguaia, penteada, fiada e tingida artesanalmente. Suas propriedades e como cuidar dela.',
      },
      eyebrow: 'Materiais',
      title: 'Lã merino, do começo ao fim',
      lead: 'Nossas peças são 100% lã merino uruguaia, penteada, fiada e tingida artesanalmente. Uma fibra natural que a ciência ainda não conseguiu igualar.',
      summary: 'A lã merino uruguaia: por que a escolhemos, suas propriedades e como cuidar dela.',
      image: {
        src: '/media/nosotros/manta-etiqueta-cuero.jpg',
        alt: 'Manta de lã merino crua com fita e etiqueta de couro',
      },
      blocks: [
        {
          type: 'text',
          eyebrow: 'Por que lã',
          title: 'Uma das fibras mais antigas e valiosas',
          paragraphs: [
            'Embora hoje existam inúmeras fibras sintéticas e artificiais, nenhuma conseguiu reproduzir as propriedades da lã.',
            'A nossa vem do Uruguai, reconhecida pela sua excelente qualidade e pelo cuidado com o meio ambiente em todo o processo.',
          ],
        },
        {
          type: 'features',
          eyebrow: 'Propriedades',
          title: 'Uma fibra que sabe o que faz',
          items: [
            {
              title: 'Isola do frio e do calor',
              text: 'Seus cachos e escamas retêm o ar e formam uma camada isolante. Traz conforto em climas frios e quentes.',
            },
            {
              title: 'Respira',
              text: 'Absorve a transpiração do corpo e a libera para o exterior, mantendo a pele seca.',
            },
            {
              title: 'Repele a água',
              text: 'Consegue absorver umidade e, ao mesmo tempo, repelir a água.',
            },
            {
              title: 'Resiste ao fogo',
              text: 'A chama se apaga sozinha: é uma fibra naturalmente segura.',
            },
            {
              title: 'Elástica e durável',
              text: 'Se esticada, volta à sua forma original. Não amassa e dura muitos anos.',
            },
            {
              title: 'Repele a sujeira',
              text: 'Ao absorver a umidade e reduzir a estática, repele a poeira do ar.',
            },
          ],
        },
        {
          type: 'certifications',
          eyebrow: 'Certificações',
          title: 'O que garante a nossa lã',
          items: [],
        },
        {
          type: 'features',
          eyebrow: 'Cuidados',
          title: 'Como cuidar da sua lã',
          lead: 'Bem cuidada, uma peça de lã merino acompanha você por muitos anos.',
          items: [
            { title: 'Lavagem', text: 'À mão, com água fria e sabão neutro. Sem torcer.' },
            { title: 'Secagem', text: 'Na horizontal e à sombra. Nunca pendurada nem ao sol direto.' },
            { title: 'Armazenamento', text: 'Dobrada, em um lugar seco e arejado.' },
          ],
        },
        {
          type: 'cta',
          title: 'Sinta a diferença',
          text: 'Cada peça da loja é tecida com esta lã.',
          label: 'Ver a loja',
          to: { kind: 'shop' },
        },
      ],
    },

    {
      slug: 'artesanas',
      meta: {
        title: 'As artesãs - Ruralanas',
        description:
          'Mais de 150 mulheres rurais do Uruguai tecem cada peça da Ruralanas em suas casas.',
      },
      eyebrow: 'As artesãs',
      title: 'As mãos por trás de cada peça',
      lead: 'Mais de 150 mulheres de zonas rurais do Uruguai tecem no tear, no tricô e no crochê em suas casas, sem sair do lugar onde vivem.',
      summary: 'A rede de mulheres rurais que tece cada peça, e como trabalhamos com elas.',
      image: {
        src: '/media/nosotros/telar-en-casa.jpg',
        alt: 'Uma criança pequena ao lado de um tear em uma casa rural',
        position: 'center 40%',
      },
      blocks: [
        {
          type: 'split',
          eyebrow: 'Uma rede que cresce',
          title: 'Um trabalho que valoriza o conhecimento e o tempo',
          paragraphs: [
            'Criamos uma rede que motiva mais de 150 mulheres de zonas rurais e melhora a sua qualidade de vida.',
            'Elas trabalham de forma independente ou em grupos. Criamos os designs para aproveitar suas habilidades, valorizando seu conhecimento e seu tempo: isso se traduz em mais produção e mais renda para cada uma.',
          ],
          image: {
            src: '/media/nosotros/artesanas.jpg',
            alt: 'Artesãs da Ruralanas rindo ao lado de um tear',
          },
          imageSide: 'right',
        },
        {
          type: 'features',
          eyebrow: 'O que importa para nós',
          title: 'Como trabalhamos com elas',
          items: [
            {
              title: 'Sem desenraizamento',
              text: 'Cada artesã tece em casa, perto da família e na sua comunidade.',
            },
            {
              title: 'Design sob medida',
              text: 'As peças são pensadas de acordo com o talento de quem as tece.',
            },
            {
              title: 'Novas gerações',
              text: 'Incorporamos jovens artesãs para que a tradição continue viva.',
            },
          ],
        },
        {
          type: 'artisans',
          eyebrow: 'Quem tece',
          title: 'Algumas das nossas artesãs',
        },
        {
          type: 'quote',
          text: 'Todos precisam se sentir à vontade e o mais felizes possível no seu ambiente de trabalho, porque isso se reflete no produto final. Tecemos qualidade de vida, para quem compra e para quem tece.',
          source: 'Ruralanas, no jornal El País',
        },
        {
          type: 'cta',
          title: 'Leve uma peça tecida por elas',
          label: 'Ver a loja',
          to: { kind: 'shop' },
        },
      ],
    },

    {
      slug: 'procesos',
      meta: {
        title: 'Processos e produção - Ruralanas',
        description:
          'Da tosquia aos acabamentos: como cada peça da Ruralanas é produzida, 100% à mão.',
      },
      eyebrow: 'Processos e produção',
      title: 'Do velo às suas mãos',
      lead: 'Um processo artesanal do começo ao fim, organizado para que cada artesã possa tecer em casa.',
      summary: 'As seis etapas de cada peça, como organizamos a produção e a nossa embalagem.',
      image: {
        src: '/media/nosotros/telar.jpg',
        alt: 'Mãos tecendo lã em um tear',
      },
      blocks: [
        {
          type: 'steps',
          eyebrow: 'Passo a passo',
          title: 'O processo de cada peça',
          items: [
            {
              title: 'Tosquia',
              text: 'Uma vez por ano, a ovelha merino entrega o seu velo: um recurso que se renova.',
            },
            {
              title: 'Lavagem e penteação',
              text: 'A fibra é limpa e organizada, e começa a mostrar sua maciez natural.',
            },
            {
              title: 'Fiação e tingimento',
              text: 'Em oficinas, a lã é fiada e tingida artesanalmente.',
            },
            {
              title: 'Design',
              text: 'Cada design é pensado de acordo com as habilidades da artesã que vai tecer a peça.',
            },
            {
              title: 'Confecção',
              text: 'As artesãs tecem no tear, no tricô ou no crochê, em suas casas.',
            },
            {
              title: 'Acabamentos',
              text: 'A peça passa pelo controle de qualidade, recebe seus acabamentos e é preparada para a exportação ou para o mercado local mais exigente.',
            },
          ],
        },
        {
          type: 'split',
          eyebrow: 'Como trabalhamos',
          title: 'Organização industrial, trabalho 100% artesanal',
          paragraphs: [
            'A lã merino, lavada e penteada, vai para uma oficina onde é fiada, depois para outra onde é tingida, e volta ao centro de produção. De lá segue para as artesãs, que a tecem de acordo com cada design.',
            'Produzimos o mesmo produto em quantidade, de forma parecida com a indústria, mas totalmente à mão. Assim economizamos tempo de produção e cada artesã tece com mais desenvoltura.',
            'Muitas peças são únicas ou saem em séries curtas: dependem do tempo de quem as tece. Quando uma se esgota, pode voltar a ser tecida, mas isso leva tempo.',
          ],
          image: {
            src: '/media/nosotros/manos-telar.jpg',
            alt: 'Detalhe de mãos ajustando os fios de um tear',
          },
          imageSide: 'right',
        },
        {
          type: 'split',
          eyebrow: 'Embalagem',
          title: 'Uma apresentação que conta a história',
          paragraphs: [
            'Muitos dos nossos produtos são reconhecidos pela apresentação: uma embalagem que deixa ver parte da peça e conta o que significa escolher a Ruralanas.',
            'Essa apresentação nos levou a outros países e a replicar o mesmo sistema de trabalho com grupos de artesãs no Equador e na Colômbia.',
          ],
          image: {
            src: '/media/nosotros/packaging.jpg',
            alt: 'Caixa de papelão da Ruralanas com uma ovelha de tricô à vista',
          },
          imageSide: 'left',
        },
        {
          type: 'cta',
          title: 'Por trás de cada etapa há uma pessoa',
          label: 'Conheça as artesãs',
          to: { kind: 'about', slug: 'artesanas' },
        },
      ],
    },

    {
      slug: 'sustentabilidad',
      meta: {
        title: 'Sustentabilidade e compromisso - Ruralanas',
        description:
          'Finalidade social, fibra natural e produção responsável: o compromisso da Ruralanas com a mulher rural e com o meio ambiente.',
      },
      eyebrow: 'Sustentabilidade e compromisso',
      title: 'Compromisso social e slow fashion',
      lead: 'Somos reconhecidos como pioneiros em desenvolvimento sustentável no Uruguai. Nossa finalidade social e a produção responsável com fibras naturais fazem parte de cada peça.',
      summary: 'Igualdade para a mulher rural, fibra natural e uma produção sem excessos.',
      image: {
        src: '/media/nosotros/packaging-en-manos.jpg',
        alt: 'Mãos segurando uma caixa da Ruralanas feita no Uruguai',
      },
      blocks: [
        {
          type: 'features',
          eyebrow: 'Nossos compromissos',
          title: 'Sustentável no social e no ambiental',
          items: [
            {
              title: 'Igualdade para a mulher rural',
              text: 'Damos a possibilidade de gerar renda para o lar sem precisar deixar o lugar onde se vive.',
            },
            {
              title: 'Fibra 100% natural',
              text: 'Produzimos com lã merino natural: renovável, biodegradável e sem microplásticos.',
            },
            {
              title: 'Sem superprodução',
              text: 'Tecemos peças únicas e séries curtas no ritmo das artesãs, sem estoque que acabe descartado.',
            },
          ],
        },
        {
          type: 'figures',
          items: [
            { value: '1 velo', label: 'por ovelha a cada ano: um recurso renovável' },
            { value: '0', label: 'microplásticos liberados na lavagem' },
            { value: '100%', label: 'biodegradável no fim da sua vida útil' },
          ],
        },
        {
          type: 'text',
          eyebrow: 'Slow fashion',
          title: 'Peças para a vida toda',
          paragraphs: [
            'A lã é elástica, resistente e não amassa: uma peça bem cuidada dura muitos anos. Preferimos fazer menos e fazer bem.',
          ],
        },
        {
          type: 'text',
          eyebrow: 'Além das fronteiras',
          title: 'Um modelo que se replica',
          paragraphs: [
            'Nosso sistema de trabalho foi replicado no Equador, com comunidades indígenas ao pé do Chimborazo, e na Colômbia, com um grupo de artesãos que trabalha as fibras à sua maneira.',
            'Queremos que o projeto possa se instalar em cada país da América do Sul, respeitando as características próprias de cada cultura.',
          ],
        },
        {
          type: 'cta',
          title: 'Acompanhe as nossas novidades',
          label: 'Ir para as notícias',
          to: { kind: 'blog' },
        },
      ],
    },
    {
      slug: 'en-el-mundo',
      meta: {
        title: 'No mundo - Ruralanas',
        description:
          'Tecidas no campo uruguaio, as peças da Ruralanas viajam para clientes de muitos países. O mapa de onde já chegamos.',
      },
      eyebrow: 'No mundo',
      title: 'Do Uruguai para o mundo',
      lead: 'Cada peça é tecida em uma casa do campo uruguaio e sai com a mesma etiqueta: feito à mão no Uruguai. De lá, viaja até quem a escolhe, onde quer que esteja.',
      summary: 'Os países aonde nossas peças já chegaram.',
      image: {
        src: '/media/etiqueta-ruralanas-vertical.jpg',
        alt: 'Etiqueta tecida da Ruralanas: feito à mão com fibras naturais, made in Uruguay',
        position: 'center 35%',
      },
      blocks: [
        { type: 'worldReach' },
        {
          type: 'cta',
          title: 'Enviamos para o mundo todo',
          label: 'Ver a loja',
          to: { kind: 'shop' },
        },
      ],
    },
  ],
}
