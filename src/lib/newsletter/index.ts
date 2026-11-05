import 'server-only'

/**
 * Alta en la newsletter, separada de la plataforma de mailing.
 *
 *   formulario ──> esta web ──> proveedor (NEWSLETTER_PROVIDER) ──> plataforma
 *
 * La plataforma todavía no está decidida (ver "Newsletter" en el README). Para
 * que la decisión no toque el sitio, el formulario habla con esta interfaz y
 * cada plataforma es un proveedor que la implementa:
 *
 *   crm  → (por defecto) el lead de siempre: servicio de integración → HubSpot,
 *          que es el maestro del contacto (CLAUDE.md). Con `LEADS_SINK=log`
 *          sólo queda registrado en el servidor.
 *
 * Para sumar una plataforma (Brevo, Mailchimp, MailerLite, Klaviyo…): escribir
 * su proveedor acá, con la API key en el entorno —nunca en el navegador— y
 * elegirlo con `NEWSLETTER_PROVIDER`. Lo recomendable igual es que el alta
 * pase por el servicio de integración y que él la reparta: así HubSpot sigue
 * siendo el único maestro del contacto y la plataforma de mailing se puede
 * cambiar sin perder la lista.
 *
 * Lo que todo proveedor tiene que respetar:
 *   · idempotencia: suscribirse dos veces no crea dos contactos;
 *   · guardar el consentimiento con su texto y su fecha;
 *   · doble confirmación (double opt-in) si la plataforma la ofrece: es la
 *     práctica esperada en la UE y protege la entregabilidad.
 */

import { submitLead, type LeadResult } from '@/lib/leads/gateway'

export interface Subscription {
  email: string
  locale: string
  /** Dónde se suscribió: sirve para medir qué formulario funciona. */
  origin: string
  /** El texto de consentimiento que la persona vio al suscribirse. */
  consentText: string
}

export interface NewsletterProvider {
  subscribe(subscription: Subscription): Promise<LeadResult>
}

const crmProvider: NewsletterProvider = {
  subscribe: (subscription) =>
    submitLead({
      source: 'newsletter',
      email: subscription.email,
      locale: subscription.locale,
      message: `origen: ${subscription.origin}`,
      marketingConsent: true,
      consentText: subscription.consentText,
    }),
}

const PROVIDERS: Record<string, NewsletterProvider> = {
  crm: crmProvider,
}

export function subscribe(subscription: Subscription): Promise<LeadResult> {
  const name = process.env.NEWSLETTER_PROVIDER ?? 'crm'
  const provider = PROVIDERS[name]
  if (!provider) {
    console.error(`[newsletter] NEWSLETTER_PROVIDER=${name} no existe; se usa crm.`)
  }
  return (provider ?? crmProvider).subscribe(subscription)
}
