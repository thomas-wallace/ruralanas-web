#!/usr/bin/env node
/**
 * Verificación de la conexión con Dolibarr, contra la instalación real.
 *
 *   node scripts/verificar-dolibarr.mjs [--base http://localhost:3000] [--ref RL-0042]
 *
 * Lee DOLIBARR_URL y DOLIBARR_API_KEY de .env.local (o del entorno). Sólo hace
 * GET. El token no se imprime nunca: donde haría falta mostrarlo, sale `***`.
 *
 * Cuatro comprobaciones:
 *   1. /products?limit=5 directo a Dolibarr devuelve datos.
 *   2. /api/productos devuelve el mismo total que Dolibarr (contado aparte).
 *   3. /api/productos/:ref devuelve el stock que tiene Dolibarr (con --ref).
 *   4. El token no aparece en el bundle del navegador ni en las respuestas.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const BASE = (arg('base') ?? 'http://localhost:3000').replace(/\/$/, '')
const REF = arg('ref')

// .env.local sin dependencias: sólo líneas CLAVE=valor.
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const TOKEN = process.env.DOLIBARR_API_KEY?.trim()
const ROOT = process.env.DOLIBARR_URL?.trim().replace(/\/+$/, '').replace(/\/api\/index\.php$/, '')
if (!TOKEN || !ROOT) {
  console.error('Faltan DOLIBARR_URL y/o DOLIBARR_API_KEY en .env.local.')
  process.exit(2)
}
const API = `${ROOT}/api/index.php`

const ok = (msg) => console.log(`  ✔ ${msg}`)
const fail = (msg) => {
  console.log(`  ✘ ${msg}`)
  process.exitCode = 1
}

async function dolibarr(pathAndQuery) {
  const res = await fetch(`${API}${pathAndQuery}`, { headers: { DOLAPIKEY: TOKEN, accept: 'application/json' } })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 200)
  }
  return { status: res.status, body }
}

async function store(p) {
  const res = await fetch(`${BASE}${p}`)
  const text = await res.text()
  return { status: res.status, text, headers: res.headers, body: (() => { try { return JSON.parse(text) } catch { return null } })() }
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

// ── 1 ──────────────────────────────────────────────────────────────────────
console.log(`\n1. Dolibarr directo: GET /products?limit=5`)
console.log(`   curl -H "DOLAPIKEY: ***" "${API}/products?limit=5"`)
{
  const { status, body } = await dolibarr('/products?limit=5')
  if (status === 200 && Array.isArray(body) && body.length > 0) {
    ok(`HTTP 200, ${body.length} productos`)
    for (const p of body) console.log(`     ${p.ref.padEnd(20)} ${String(p.label).slice(0, 40).padEnd(40)} stock_reel=${p.stock_reel ?? '—'}`)
  } else {
    fail(`HTTP ${status}: ${JSON.stringify(body?.error ?? body).slice(0, 200)}`)
    if (status === 401) console.log('     401 = token inválido o módulo API REST apagado.')
    if (status === 403) console.log('     403 = al usuario de API le falta el permiso de lectura de Productos.')
    process.exit(1)
  }
}

// ── 2 ──────────────────────────────────────────────────────────────────────
console.log(`\n2. Total de productos a la venta`)
async function countAll(filter) {
  let total = 0
  for (let page = 0; page < 1000; page += 1) {
    const q = `/products?limit=100&page=${page}&mode=1${filter ? `&sqlfilters=${encodeURIComponent(filter)}` : ''}`
    const { status, body } = await dolibarr(q)
    if (status === 404 || (Array.isArray(body) && body.length === 0)) break
    if (status !== 200 || !Array.isArray(body)) throw new Error(`HTTP ${status} en página ${page}`)
    total += body.length
  }
  return total
}
{
  const forSale = await countAll('(t.tosell:=:1)')
  const all = await countAll(null)
  console.log(`   Dolibarr, contado aparte: ${forSale} a la venta (de ${all} productos físicos, sin servicios)`)
  const res = await store('/api/productos')
  if (res.status !== 200 || !res.body) {
    fail(`/api/productos → HTTP ${res.status}: ${res.text.slice(0, 200)}`)
  } else {
    console.log(`   /api/productos: total=${res.body.total} (X-Cache: ${res.headers.get('x-cache')})`)
    if (res.body.total === forSale) ok('coinciden')
    else fail(`no coinciden: ${res.body.total} ≠ ${forSale}`)
    const withImages = res.body.productos.filter((p) => p.imagenes.length > 0).length
    console.log(`   Con fotos: ${withImages} de ${res.body.total}`)
    const sample = res.body.productos.find((p) => p.imagenes.length > 0)
    if (sample) {
      const img = await fetch(`${BASE}${sample.imagenes[0]}`)
      if (img.ok) ok(`foto servida desde la tienda: ${sample.imagenes[0]} (${img.headers.get('content-type')})`)
      else fail(`la foto ${sample.imagenes[0]} devolvió ${img.status}`)
    }
  }
}

// ── 3 ──────────────────────────────────────────────────────────────────────
console.log(`\n3. Stock de una pieza`)
if (!REF) {
  console.log('   (se salta: pasá --ref <REFERENCIA> con una pieza que puedas revisar en Dolibarr)')
} else {
  const direct = await dolibarr(`/products/ref/${encodeURIComponent(REF)}?includestockdata=1`)
  if (direct.status !== 200) {
    fail(`Dolibarr /products/ref/${REF} → HTTP ${direct.status}`)
  } else {
    const id = direct.body.id
    const byWh = await dolibarr(`/products/${id}/stock`)
    const warehouses = byWh.status === 200 ? Object.entries(byWh.body.stock_warehouses ?? {}) : []
    console.log(`   Dolibarr: stock_reel=${direct.body.stock_reel} · por depósito: ${warehouses.map(([w, s]) => `#${w}=${s.real}`).join(', ') || '(sin movimientos)'}`)
    const res = await store(`/api/productos/${encodeURIComponent(REF)}`)
    if (res.status !== 200) fail(`/api/productos/${REF} → HTTP ${res.status}: ${res.text.slice(0, 200)}`)
    else {
      console.log(`   /api/productos/${REF}: stock=${res.body.stock} disponible=${res.body.disponible} precio=${res.body.precio}`)
      if (res.body.stock === (num(direct.body.stock_reel) ?? 0)) ok('el stock coincide')
      else fail('el stock NO coincide')
    }
  }
}

// ── 4 ──────────────────────────────────────────────────────────────────────
console.log(`\n4. El token no se filtra`)
{
  const forbidden = ['cost_price', 'pmp', 'note_private', 'fourn_']
  for (const p of ['/api/productos', '/api/categorias', ...(REF ? [`/api/productos/${encodeURIComponent(REF)}`] : [])]) {
    const res = await store(p)
    const headersText = [...res.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')
    if (res.text.includes(TOKEN) || headersText.includes(TOKEN)) fail(`el token aparece en la respuesta de ${p}`)
    else ok(`${p}: ni en el cuerpo ni en las cabeceras`)
    const leaked = forbidden.filter((f) => res.text.includes(`"${f}`))
    if (leaked.length) fail(`${p} expone campos internos: ${leaked.join(', ')}`)
  }

  const staticDir = path.join('.next', 'static')
  if (!existsSync(staticDir)) {
    console.log('   (no hay .next/static: correr `npm run build` para revisar el bundle)')
  } else {
    let files = 0
    const hits = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else {
          files += 1
          const content = readFileSync(full, 'utf8')
          if (content.includes(TOKEN) || /DOLAPIKEY|DOLIBARR_API_KEY/.test(content)) hits.push(full)
        }
      }
    }
    walk(staticDir)
    if (hits.length) fail(`el token o su nombre aparece en el bundle: ${hits.join(', ')}`)
    else ok(`bundle del navegador (${files} archivos en .next/static): sin rastro del token`)
  }
}

console.log(process.exitCode ? '\nHay verificaciones fallidas.\n' : '\nTodo en orden.\n')
