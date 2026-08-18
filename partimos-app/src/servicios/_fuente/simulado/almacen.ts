/**
 * El almacén simulado: filas en memoria con la forma exacta de las tablas.
 *
 * Nadie fuera de `servicios/` importa este archivo. Las pantallas llaman a los
 * servicios y reciben filas; de dónde salen no es asunto suyo.
 */

import type { Booking, Payment, ReservaFila, TripStop, ViajeFila } from '@/tipos';

import { ANDRES_ID, ELANTRA_ID, MATEO_ID, ROSA_ID } from './personas';
import { corredores } from './geografia';

const CHITRE = corredores.find((c) => c.slug === 'panama-chitre')!;

export const VIAJE_CHITRE_ID = '55555555-5555-4555-8555-555555555555';
const AHORA = '2026-11-14T14:00:00-05:00';

/**
 * El viaje del recorrido del diseño: Albrook → Chitré, sábado 14 a las 14:50.
 * Los `snap_*` son la foto del cálculo en el momento de publicar, como en la base.
 */
export const viajes: ViajeFila[] = [
  {
    id: VIAJE_CHITRE_ID,
    driver_id: ANDRES_ID,
    vehicle_id: ELANTRA_ID,
    corridor_id: CHITRE.id,
    departure_at: '2026-11-14T14:50:00-05:00',
    arrival_estimate_at: '2026-11-14T18:20:00-05:00',
    seats_offered: 3,
    price_cents: 600,
    gender_preference: 'any',
    notes: null,
    status: 'published',
    price_rule_id: '6ad0a57f-ec7c-4a83-b331-523af650584e',
    snap_distance_km: 250,
    snap_rate_per_km_cents: 6,
    snap_toll_cents: 300,
    snap_cost_total_cents: 2060,
    snap_occupants: 4,
    snap_max_price_cents: 700,
    published_at: AHORA,
    completed_at: null,
    cancelled_at: null,
    created_at: AHORA,
    updated_at: AHORA,
    recurrence: 'none',
    recurrence_parent_id: null,
    accepts_yappy_direct: true,
    accepts_cash: true,
    origin_place_id: null,
    destination_place_id: null,
    origin_label: 'Albrook · Terminal',
    destination_label: 'Chitré · Parque Unión',
    origin_lat: 8.9737,
    origin_lng: -79.5527,
    destination_lat: 7.9614,
    destination_lng: -80.4297,
    // pendiente de migración
    accepts_luggage: true,
  },
];

export const paradas: TripStop[] = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Albrook · Terminal',
    kind: 'origin',
    sequence: 0,
    scheduled_at: '2026-11-14T14:50:00-05:00',
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666602',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'La Chorrera',
    kind: 'waypoint',
    sequence: 1,
    scheduled_at: '2026-11-14T15:35:00-05:00',
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666603',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Penonomé',
    kind: 'waypoint',
    sequence: 2,
    scheduled_at: '2026-11-14T16:40:00-05:00',
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666604',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Chitré · Parque Unión',
    kind: 'destination',
    sequence: 3,
    scheduled_at: '2026-11-14T18:20:00-05:00',
    created_at: AHORA,
  },
];

const reservaBase = (extra: Partial<ReservaFila>): ReservaFila => ({
  id: '',
  trip_id: VIAJE_CHITRE_ID,
  passenger_id: '',
  seats: 1,
  unit_price_cents: 600,
  service_fee_cents: 30,
  total_cents: 630,
  trip_stop_id: null,
  proposed_point: null,
  proposal_accepted: null,
  status: 'pending',
  confirmed_at: null,
  completed_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  created_at: AHORA,
  updated_at: AHORA,
  board_sequence: 0,
  alight_sequence: 3,
  offer_price_cents: null,
  offer_accepted: null,
  payment_channel: 'yappy_app',
  // pendiente de migración
  boarding_code: '0000',
  boarded_at: null,
  expires_at: AHORA,
  detour_minutes: null,
  released_at: null,
  mochilas: 1,
  maletas: 0,
  ...extra,
});

/** Las dos solicitudes que `11a` tiene en pantalla. */
export const reservas: ReservaFila[] = [
  reservaBase({
    id: '77777777-7777-4777-8777-777777777701',
    passenger_id: MATEO_ID,
    proposed_point: 'Vía Argentina, Riba Smith',
    detour_minutes: 4,
    mochilas: 1,
    maletas: 1,
    boarding_code: '4917',
    expires_at: '2026-11-14T17:40:00-05:00',
    created_at: '2026-11-14T13:40:00-05:00',
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777702',
    passenger_id: ROSA_ID,
    proposed_point: 'Vía España, El Dorado',
    detour_minutes: 2,
    mochilas: 1,
    maletas: 0,
    boarding_code: '2384',
    expires_at: '2026-11-14T15:10:00-05:00',
    created_at: '2026-11-14T11:10:00-05:00',
  }),
];

/** Un puesto ya pagado, para que el contador de `11a` empiece en 1 de 3. */
export const reservasConfirmadas: ReservaFila[] = [
  reservaBase({
    id: '77777777-7777-4777-8777-777777777700',
    passenger_id: '99999999-9999-4999-8999-999999999999',
    status: 'confirmed',
    confirmed_at: '2026-11-14T12:00:00-05:00',
    proposed_point: 'Albrook · Terminal',
    boarding_code: '5521',
  }),
];

export const pagos: Payment[] = [];

/** Altas en memoria. Se pierde al recargar, y está bien: es un simulado. */
export function guardarViaje(viaje: ViajeFila): ViajeFila {
  viajes.unshift(viaje);
  return viaje;
}

export function guardarReserva(reserva: ReservaFila): ReservaFila {
  reservas.unshift(reserva);
  return reserva;
}

export function guardarPago(pago: Payment): Payment {
  pagos.unshift(pago);
  return pago;
}

export function actualizarReserva(id: string, cambios: Partial<Booking> & Partial<ReservaFila>): ReservaFila {
  const i = reservas.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`No existe la reserva ${id}`);
  reservas[i] = { ...reservas[i], ...cambios, updated_at: new Date().toISOString() };
  return reservas[i];
}
