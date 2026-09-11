'use server'

/**
 * Acciones de los formularios. Corren en el servidor: el cliente no ve ni la
 * URL ni el token del servicio de integración.
 */

import { submitLead } from './gateway'
import type { LeadSource } from './gateway'

export interface FormState {
  status: 'idle' | 'ok' | 'error'
  message?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MESSAGES = {
  es: {
    invalidEmail: 'Revisá el email, parece incompleto.',
    missingName: 'Necesitamos tu nombre para responderte.',
    missingMessage: 'Contanos qué necesitás.',
    failed: 'No pudimos enviarlo. Probá de nuevo o escribinos por WhatsApp.',
    contactOk: 'Recibido. Te respondemos dentro de las próximas 24 horas hábiles.',
    newsletterOk: 'Listo. Te vamos a escribir poco y solo cuando valga la pena.',
    restockOk: 'Te avisamos apenas vuelva a estar disponible.',
  },
  en: {
    invalidEmail: 'That email looks incomplete.',
    missingName: 'We need your name to reply.',
    missingMessage: 'Tell us what you need.',
    failed: 'We could not send it. Try again or write to us on WhatsApp.',
    contactOk: 'Received. We reply within 24 business hours.',
    newsletterOk: 'Done. We write rarely, and only when it is worth it.',
    restockOk: 'We will let you know as soon as it is back.',
  },
} as const

function dict(locale: string) {
  return locale === 'en' ? MESSAGES.en : MESSAGES.es
}

function readLead(formData: FormData, source: LeadSource) {
  return {
    source,
    email: String(formData.get('email') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim() || undefined,
    message: String(formData.get('message') ?? '').trim() || undefined,
    locale: String(formData.get('locale') ?? 'es'),
    productSlug: String(formData.get('productSlug') ?? '').trim() || undefined,
  }
}

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const lead = readLead(formData, 'contacto')
  const t = dict(lead.locale)

  if (!lead.name) return { status: 'error', message: t.missingName }
  if (!EMAIL.test(lead.email)) return { status: 'error', message: t.invalidEmail }
  if (!lead.message) return { status: 'error', message: t.missingMessage }

  const result = await submitLead({ ...lead, marketingConsent: false })
  return result.ok
    ? { status: 'ok', message: t.contactOk }
    : { status: 'error', message: t.failed }
}

export async function subscribeNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const lead = readLead(formData, 'newsletter')
  const t = dict(lead.locale)

  if (!EMAIL.test(lead.email)) return { status: 'error', message: t.invalidEmail }

  // Alta a lista = consentimiento explícito de marketing.
  const result = await submitLead({ ...lead, marketingConsent: true })
  return result.ok
    ? { status: 'ok', message: t.newsletterOk }
    : { status: 'error', message: t.failed }
}

export async function requestRestockAlert(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const lead = readLead(formData, 'aviso-reposicion')
  const t = dict(lead.locale)

  if (!EMAIL.test(lead.email)) return { status: 'error', message: t.invalidEmail }

  const result = await submitLead({ ...lead, marketingConsent: false })
  return result.ok
    ? { status: 'ok', message: t.restockOk }
    : { status: 'error', message: t.failed }
}
