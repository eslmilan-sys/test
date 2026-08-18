/**
 * Reservas: pedir puesto, cancelar, abordar.
 *
 * Pedir puesto no cobra nada. El cobro ocurre cuando el conductor acepta
 * (ver `solicitudes.ts`).
 */

import type { Equipaje } from '@/dominio/equipaje';
import { type CanalDePago, tarifaDeServicio } from '@/dominio/tarifas';
import type { ReservaFila } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/** Horas que tiene el conductor para responder antes de que la solicitud caduque. */
export const HORAS_PARA_RESPONDER = 4;

/** Dónde te recoge: una parada de la ruta, o una dirección que escribes tú. */
export type Punto = { paradaId: string } | { direccionPropia: string };

/**
 * Pide un puesto. No se cobra: queda pendiente hasta que el conductor acepte.
 */
export async function pedirPuesto(
  viajeId: string,
  punto: Punto,
  equipaje: Equipaje,
  opciones: { pasajeroId: string; canal?: CanalDePago } = { pasajeroId: '' },
): Promise<ReservaFila> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  if (!viaje.accepts_luggage && equipaje.maletas > 0) {
    throw new Error('Este viaje no lleva maletas');
  }

  const canal = opciones.canal ?? 'yappy_app';
  const aporte = viaje.price_cents;
  const tarifa = tarifaDeServicio(aporte, canal);
  const ahora = new Date();

  const reserva: ReservaFila = {
    id: nuevoId(),
    trip_id: viajeId,
    passenger_id: opciones.pasajeroId,
    seats: 1,
    unit_price_cents: aporte,
    service_fee_cents: tarifa,
    total_cents: aporte + tarifa,
    trip_stop_id: 'paradaId' in punto ? punto.paradaId : null,
    proposed_point: 'direccionPropia' in punto ? punto.direccionPropia : null,
    proposal_accepted: null,
    status: 'pending',
    confirmed_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: ahora.toISOString(),
    updated_at: ahora.toISOString(),
    board_sequence: null,
    alight_sequence: null,
    offer_price_cents: null,
    offer_accepted: null,
    payment_channel: canal,
    boarding_code: nuevoCodigoDeAbordaje(),
    boarded_at: null,
    expires_at: new Date(ahora.getTime() + HORAS_PARA_RESPONDER * 3600_000).toISOString(),
    detour_minutes: null,
    released_at: null,
    mochilas: equipaje.mochilas,
    maletas: equipaje.maletas,
  };

  return demora(fuente.guardarReserva(reserva));
}

export async function reservasDelViaje(viajeId: string): Promise<ReservaFila[]> {
  return demora(fuente.reservas.filter((r) => r.trip_id === viajeId));
}

/** El conductor marca a alguien al subir. Esta marca es lo que prueba que el viaje pasó. */
export async function marcarAbordaje(reservaId: string): Promise<ReservaFila> {
  return demora(fuente.actualizarReserva(reservaId, { boarded_at: new Date().toISOString() }));
}

/** Nadie apareció. Sin marca de abordaje no se libera el aporte. */
export async function marcarNoShow(reservaId: string): Promise<ReservaFila> {
  return demora(fuente.actualizarReserva(reservaId, { status: 'no_show_passenger' }));
}

/* ------------------------------------------------------------------ */

/** Cuatro dígitos. En producción lo emite el servidor y se verifica ahí. */
function nuevoCodigoDeAbordaje(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

let contador = 0;
function nuevoId(): string {
  contador += 1;
  return `aaaaaaaa-aaaa-4aaa-8aaa-${String(contador).padStart(12, '0')}`;
}
