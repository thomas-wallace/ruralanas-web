/**
 * Arranca la tienda nueva contra la copia de prueba (staging).
 *
 *   npm run staging:web   →   http://localhost:3020
 *
 * Lee `staging/web.env` y lo aplica por encima de `.env.local`: Next no pisa
 * una variable que ya viene en el entorno del proceso.
 */

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const env = { ...process.env }

// `data/web.local.env` (fuera de git) guarda lo que no se versiona: la
// contraseña de aplicación del usuario de contenido de la copia.
for (const file of [join(here, 'web.env'), join(here, 'data', 'web.local.env')]) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (match) env[match[1]] = match[2]
  }
}

const next = spawn('npx', ['next', 'dev', '-p', '3020'], {
  cwd: join(here, '..'),
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
next.on('exit', (code) => process.exit(code ?? 0))
