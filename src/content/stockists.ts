import type { Stockist } from '@/lib/stockists/types'

/**
 * Tiendas adheridas: comercios que venden piezas de Ruralanas.
 *
 * Origen provisorio. El destino es cargarlas desde el admin; hasta entonces
 * viven acá y la web las lee por `getStockists()`, así que el día que cambie
 * el origen la home no se toca.
 *
 * Se muestran en el orden de esta lista. Sólo datos confirmados: si no se sabe
 * la ciudad o la web, el campo se deja afuera y la tarjeta no lo muestra.
 *
 * Relevamiento: 27-09-2026, logos entregados por Ruralanas.
 */
export const STATIC_STOCKISTS: Stockist[] = [
  { id: 'dufry-carrasco', name: 'Dufry Carrasco', logo: '/media/stockists/dufry-carrasco.png' },
  {
    id: 'las-piedras-golf-club',
    name: 'Las Piedras Golf Club',
    logo: '/media/stockists/las-piedras-golf-club.png',
  },
  { id: 'vik', name: 'Vik', logo: '/media/stockists/vik.png' },
  {
    id: 'duty-free-punta-del-este',
    name: 'Duty Free Punta del Este',
    logo: '/media/stockists/duty-free-punta-del-este.png',
  },
  { id: 'imarangatu', name: 'Imarangatu', logo: '/media/stockists/imarangatu.png' },
]
