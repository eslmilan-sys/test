/**
 * Los tipos de la app, atados a la forma real de las tablas.
 *
 * `base.ts` está generado desde el proyecto Supabase del sitio. Todo lo que
 * viaja por `servicios/` se declara contra él, así que el cambio a producción
 * es cambiar de dónde salen las filas, no cómo se llaman los campos.
 */

import type { Database } from './base';

type Tablas = Database['public']['Tables'];
type Vistas = Database['public']['Views'];
export type Enums = Database['public']['Enums'];

export type Profile = Tablas['profiles']['Row'];
export type Vehicle = Tablas['vehicles']['Row'];
export type VehicleCategory = Tablas['vehicle_categories']['Row'];
export type City = Tablas['cities']['Row'];
export type Corridor = Tablas['corridors']['Row'];
export type Trip = Tablas['trips']['Row'];
export type TripStop = Tablas['trip_stops']['Row'];
export type Booking = Tablas['bookings']['Row'];
export type Payment = Tablas['payments']['Row'];
export type Message = Tablas['messages']['Row'];
export type Review = Tablas['reviews']['Row'];
export type PickupPoint = Tablas['pickup_points']['Row'];
export type PriceRule = Tablas['price_rules']['Row'];

export type AvailableTrip = Vistas['available_trips']['Row'];
export type PublicProfile = Vistas['public_profiles']['Row'];

export type BookingStatus = Enums['booking_status'];
export type TripStatus = Enums['trip_status'];
export type PaymentChannel = Enums['payment_channel'];
export type PaymentStatus = Enums['payment_status'];
export type GenderPref = Enums['gender_pref'];
export type StopKind = Enums['stop_kind'];

/* ------------------------------------------------------------------ *
 * Columnas que el diseño necesita y la base todavía no tiene.
 *
 * Están aparte y con nombre propio para que la migración sea mecánica:
 * cuando existan en Postgres, estos tipos desaparecen y los `&` de abajo
 * se caen solos sin tocar ni una pantalla.
 * ------------------------------------------------------------------ */

/** `trips` — el booleano de maletas de `5c`, y el tope guardado de la ruta. */
export type TripPendiente = {
  /** «Acepto maletas». Una sola casilla, sin contabilidad de maletero. */
  accepts_luggage: boolean;
};

/** `corridors` — el tope por ruta, hoy calculado, mañana columna. */
export type CorridorPendiente = {
  max_price_cents: number;
};

/** `bookings` — abordaje, caducidad de la solicitud y desvío. */
export type BookingPendiente = {
  /** El código de 4 dígitos de `1f` / `1g`. */
  boarding_code: string;
  /** El segundo código, el de `1i`: cierra el viaje y suelta el aporte. */
  arrival_code: string;
  /** La marca que prueba que el viaje pasó. Sin ella no se libera el aporte. */
  boarded_at: string | null;
  /** Las 4 h que tiene el conductor para responder (`11a`). */
  expires_at: string;
  /** Los minutos que el punto del pasajero le añade al conductor. */
  detour_minutes: number | null;
  /** Cuándo se soltó el aporte al conductor. */
  released_at: string | null;
  mochilas: number;
  maletas: number;
};

/** El estado que le falta al enum `booking_status`: el conductor dice que no. */
export type EstadoDeSolicitud = 'pendiente' | 'aceptada' | 'rechazada' | 'caducada';

/* ------------------------------------------------------------------ *
 * Las filas tal y como las ven las pantallas: la tabla real más lo pendiente.
 * ------------------------------------------------------------------ */

export type ViajeFila = Trip & TripPendiente;
export type CorredorFila = Corridor & CorridorPendiente;
export type ReservaFila = Booking & BookingPendiente;
