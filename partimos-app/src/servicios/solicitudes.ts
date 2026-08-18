/**
 * Solicitudes de puesto — pantalla `11a`.
 *
 * Aquí es donde se mueve la plata: aceptar retiene el aporte; no lo entrega.
 * El aporte se libera cuando se confirma la llegada (`1i`).
 */

import { resumenDeEquipaje } from '@/dominio/equipaje';
import { tarifaDeServicio } from '@/dominio/tarifas';
import type { EstadoDeSolicitud, Payment, ReservaFila } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Solicitud = {
  id: string;
  pasajero: { id: string; nombre: string; viajes: number; calificacion: number | null };
  punto: string;
  minutosDeDesvio: number | null;
  equipaje: string;
  aporteCentavos: number;
  estado: EstadoDeSolicitud;
  expiraEn: string;
  /** A menos de una hora de caducar, la pastilla va en rojo sólido. */
  urgente: boolean;
};

export async function listarSolicitudes(viajeId: string, ahora = new Date()): Promise<Solicitud[]> {
  const solicitudes = fuente.reservas
    .filter((r) => r.trip_id === viajeId && r.status === 'pending')
    .map((r) => comoSolicitud(r, ahora));
  return demora(solicitudes);
}

/**
 * El conductor acepta. Se retiene el aporte del pasajero — no es del conductor
 * todavía — y el puesto queda vendido.
 */
export async function aceptarSolicitud(
  id: string,
): Promise<{ reserva: ReservaFila; pago: Payment; puestosLibres: number }> {
  const reserva = fuente.reservas.find((r) => r.id === id);
  if (!reserva) throw new Error(`No existe la solicitud ${id}`);
  if (reserva.status !== 'pending') throw new Error('Esta solicitud ya no está pendiente');

  const ahora = new Date().toISOString();
  const confirmada = fuente.actualizarReserva(id, {
    status: 'confirmed',
    confirmed_at: ahora,
    proposal_accepted: reserva.proposed_point ? true : null,
  });

  const pago: Payment = {
    id: nuevoId('bbbb'),
    booking_id: id,
    provider: reserva.payment_channel === 'card' ? 'tarjeta' : 'yappy',
    provider_ref: null,
    provider_order_id: null,
    amount_cents: reserva.total_cents,
    fee_cents: tarifaDeServicio(reserva.unit_price_cents * reserva.seats, reserva.payment_channel),
    // retenido, no cobrado: el conductor no lo tiene hasta la llegada
    status: 'authorized',
    raw_payload: null,
    captured_at: null,
    created_at: ahora,
  };
  fuente.guardarPago(pago);

  return demora({ reserva: confirmada, pago, puestosLibres: puestosLibresDe(reserva.trip_id) });
}

/** Rechazar no pide motivo. */
export async function rechazarSolicitud(id: string): Promise<ReservaFila> {
  return demora(
    fuente.actualizarReserva(id, {
      status: 'cancelled_driver',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'rechazada_por_el_conductor',
    }),
  );
}

export function puestosLibresDe(viajeId: string): number {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) return 0;
  const vendidos = fuente.reservas.filter(
    (r) => r.trip_id === viajeId && (r.status === 'confirmed' || r.status === 'completed'),
  ).length;
  return Math.max(0, viaje.seats_offered - vendidos);
}

/* ------------------------------------------------------------------ */

function comoSolicitud(r: ReservaFila, ahora: Date): Solicitud {
  const p = fuente.perfiles.find((x) => x.id === r.passenger_id);
  const restante = new Date(r.expires_at).getTime() - ahora.getTime();
  return {
    id: r.id,
    pasajero: {
      id: r.passenger_id,
      nombre: p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : 'Alguien',
      viajes: 0,
      calificacion: null,
    },
    punto: r.proposed_point ?? '',
    minutosDeDesvio: r.detour_minutes,
    equipaje: resumenDeEquipaje({ mochilas: r.mochilas, maletas: r.maletas }),
    aporteCentavos: r.unit_price_cents * r.seats,
    estado: restante <= 0 ? 'caducada' : 'pendiente',
    expiraEn: textoRestante(restante),
    urgente: restante > 0 && restante < 3600_000,
  };
}

function textoRestante(ms: number): string {
  if (ms <= 0) return 'Caducada';
  const minutos = Math.floor(ms / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

let contador = 0;
function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}${prefijo}-${prefijo}-4${prefijo.slice(1)}-8${prefijo.slice(1)}-${String(contador).padStart(12, '0')}`;
}
