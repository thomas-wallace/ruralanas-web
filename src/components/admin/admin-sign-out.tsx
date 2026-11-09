'use client'

import { signOut } from './admin-fetch'
import { adminLink } from './admin-ui'

export function AdminSignOut() {
  return (
    <button type="button" onClick={() => void signOut()} className={`${adminLink} shrink-0 pb-3`}>
      Salir
    </button>
  )
}
