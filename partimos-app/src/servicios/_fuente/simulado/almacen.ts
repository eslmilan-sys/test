/**
 * El almacén simulado: filas en memoria con la forma exacta de las tablas.
 *
 * Nadie fuera de `servicios/` importa este archivo. Las pantallas llaman a los
 * servicios y reciben filas; de dónde salen no es asunto suyo.
 */

import type { Booking, Payment, ReservaFila, TripStop, ViajeFila } from '@/tipos';

import { ANDRES_ID, DANIELA_ID, ELANTRA_ID, JOSE_ID, LUCIA_ID, MARIA_ID, MATEO_ID, ROSA_ID } from './personas';
import { corredores } from './geografia';

const CHITRE = corredores.find((c) => c.slug === 'panama-chitre')!;

export const VIAJE_CHITRE_ID = '55555555-5555-4555-8555-555555555555';
/** El mismo viaje con el booleano de maletas apagado, para ver `7a` en su otra cara. */
export const VIAJE_SIN_MALETAS_ID = '55555555-5555-4555-8555-555555555556';
/** El de esta mañana, a punto de salir: es el que se aborda en `1f` / `1g`. */
export const VIAJE_ABORDANDO_ID = '55555555-5555-4555-8555-555555555557';

/**
 * El viaje del almacén sale hoy: así las cuentas atrás de `11a` — «expira en
 * 3 h 40» — significan algo al abrir la app, en vez de contar meses.
 * `5c` no lee de aquí: allí el conductor está componiendo un viaje nuevo.
 */
const arranque = new Date();
const enMinutos = (m: number) => new Date(arranque.getTime() + m * 60_000).toISOString();
const haceMinutos = (m: number) => enMinutos(-m);

/** Hoy a las 14:50 en Panamá; si ya pasó, mañana a la misma hora. */
function proximaSalida(): Date {
  const hoy = new Date(arranque);
  hoy.setUTCHours(19, 50, 0, 0); // 14:50 en UTC−5
  if (hoy.getTime() - arranque.getTime() < 60 * 60_000) {
    hoy.setUTCDate(hoy.getUTCDate() + 1);
  }
  return hoy;
}

const AHORA = arranque.toISOString();
const salida = proximaSalida();
const SALIDA = salida.toISOString();
const desdeLaSalida = (m: number) => new Date(salida.getTime() + m * 60_000).toISOString();
const LLEGADA = desdeLaSalida(210);

/**
 * El viaje del recorrido del diseño: Albrook → Chitré, publicado y con gente
 * pidiendo puesto. Los `snap_*` son la foto del cálculo en el momento de
 * publicar, igual que en la base.
 */
export const viajes: ViajeFila[] = [
  {
    id: VIAJE_CHITRE_ID,
    driver_id: ANDRES_ID,
    vehicle_id: ELANTRA_ID,
    corridor_id: CHITRE.id,
    departure_at: SALIDA,
    arrival_estimate_at: LLEGADA,
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

viajes.push({
  ...viajes[0],
  id: VIAJE_SIN_MALETAS_ID,
  seats_offered: 2,
  accepts_luggage: false,
});


export const paradas: TripStop[] = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Albrook · Terminal',
    kind: 'origin',
    sequence: 0,
    scheduled_at: SALIDA,
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666602',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'La Chorrera',
    kind: 'waypoint',
    sequence: 1,
    scheduled_at: desdeLaSalida(45),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666603',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Penonomé',
    kind: 'waypoint',
    sequence: 2,
    scheduled_at: desdeLaSalida(110),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666604',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Chitré · Parque Unión',
    kind: 'destination',
    sequence: 3,
    scheduled_at: LLEGADA,
    created_at: AHORA,
  },
];

viajes.push({
  ...viajes[0],
  id: VIAJE_ABORDANDO_ID,
  departure_at: enMinutos(12),
  arrival_estimate_at: enMinutos(12 + 210),
  seats_offered: 3,
  origin_label: 'Albrook · bahía 4',
});

paradas.push(
  {
    id: '66666666-6666-4666-8666-666666666701',
    trip_id: VIAJE_ABORDANDO_ID,
    pickup_point_id: null,
    custom_label: 'Albrook · bahía 4',
    kind: 'origin',
    sequence: 0,
    scheduled_at: enMinutos(12),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666702',
    trip_id: VIAJE_ABORDANDO_ID,
    pickup_point_id: null,
    custom_label: 'Chitré · Parque Unión',
    kind: 'destination',
    sequence: 1,
    scheduled_at: enMinutos(12 + 210),
    created_at: AHORA,
  },
);

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

/**
 * Todas las reservas del viaje, como estarían en la tabla: la de Daniela ya
 * pagada, y las dos que `11a` tiene pendientes de respuesta.
 */
export const reservas: ReservaFila[] = [
  reservaBase({
    id: '77777777-7777-4777-8777-777777777700',
    passenger_id: DANIELA_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(180),
    proposed_point: 'Costa del Este',
    detour_minutes: 3,
    mochilas: 1,
    maletas: 1,
    boarding_code: '5521',
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777701',
    passenger_id: MATEO_ID,
    proposed_point: 'Vía Argentina, Riba Smith',
    detour_minutes: 4,
    mochilas: 1,
    maletas: 1,
    boarding_code: '4917',
    expires_at: enMinutos(220), // 3 h 40
    created_at: haceMinutos(20),
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777702',
    passenger_id: ROSA_ID,
    proposed_point: 'Vía España, El Dorado',
    detour_minutes: 2,
    mochilas: 1,
    maletas: 0,
    boarding_code: '2384',
    expires_at: enMinutos(50), // menos de 1 h: pastilla roja sólida
    created_at: haceMinutos(190),
  }),
];

/** Los tres puestos vendidos del viaje que está abordando: dos ya subieron. */
reservas.push(
  reservaBase({
    id: '77777777-7777-4777-8777-777777777710',
    trip_id: VIAJE_ABORDANDO_ID,
    passenger_id: MARIA_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(2880),
    proposed_point: 'Albrook · bahía 4',
    boarding_code: '3179',
    maletas: 1,
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777711',
    trip_id: VIAJE_ABORDANDO_ID,
    passenger_id: JOSE_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(2900),
    proposed_point: 'Albrook · bahía 4',
    boarding_code: '6042',
    boarded_at: haceMinutos(3),
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777712',
    trip_id: VIAJE_ABORDANDO_ID,
    passenger_id: LUCIA_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(3000),
    proposed_point: 'Vía Brasil',
    boarding_code: '8465',
    boarded_at: haceMinutos(1),
    payment_channel: 'external',
    service_fee_cents: 0,
    total_cents: 600,
  }),
);

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
