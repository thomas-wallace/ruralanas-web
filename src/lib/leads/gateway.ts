/**
 * Salida hacia el CRM.
 *
 *   formulario ──> esta web ──> servicio de integración ──> HubSpot
 *
 * El navegador nunca habla con HubSpot: el token no puede salir del servidor y
 * el CRM tiene que poder cambiarse sin tocar el frontend. El consentimiento
 * viaja con el lead porque hace falta registrarlo en los tres sistemas.
 */

import 'server-only'

export type LeadSource = 'contacto' | 'newsletter' | 'mayorista' | 'aviso-reposicion'

export interface Lead {
  source: LeadSource
  email: string
  name?: string
  message?: string
  /** Idioma en que la persona escribió: define en qué idioma se le responde. */
  locale: string
  /** Slug del producto, cuando el lead sale de un aviso de reposición. */
  productSlug?: string
  /** Consentimiento explícito para comunicaciones comerciales. */
  marketingConsent: boolean
}

export interface LeadResult {
  ok: boolean
  error?: string
}

async function sendToIntegrationService(lead: Lead): Promise<LeadResult> {
  const url = process.env.INTEGRATION_API_URL
  if (!url) return { ok: false, error: 'INTEGRATION_API_URL no configurada' }

  const token = process.env.INTEGRATION_API_TOKEN

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/leads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...lead,
        // Clave de idempotencia: el servicio no debe crear dos contactos si el
        // formulario se reenvía. Ver 09-plataforma/servicio-integracion.md.
        idempotencyKey: `web:${lead.source}:${lead.email.toLowerCase()}`,
      }),
    })

    if (!response.ok) return { ok: false, error: `El servicio respondió ${response.status}` }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error de red' }
  }
}

async function logLead(lead: Lead): Promise<LeadResult> {
  // Estado actual: no hay backend. Se registra para poder verificar el formulario.
  console.info('[lead]', JSON.stringify({ ...lead, email: lead.email.toLowerCase() }))
  return { ok: true }
}

export async function submitLead(lead: Lead): Promise<LeadResult> {
  const sink = process.env.LEADS_SINK ?? 'log'
  return sink === 'http' ? sendToIntegrationService(lead) : logLead(lead)
}
