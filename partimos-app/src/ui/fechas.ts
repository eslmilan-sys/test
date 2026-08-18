/**
 * Fechas y horas, siempre en la hora de Panamá.
 *
 * El teléfono del pasajero puede estar en cualquier zona; la hora de salida de
 * un viaje no. Todo se formatea con `America/Panama` a propósito.
 *
 * Reloj de 24 h con cero delante, y minúsculas: «sábado 14, 14:50».
 */

export const ZONA = 'America/Panama';

const hhmm = new Intl.DateTimeFormat('es-PA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: ZONA,
});

const diaYNumero = new Intl.DateTimeFormat('es-PA', {
  weekday: 'long',
  day: 'numeric',
  timeZone: ZONA,
});

const fechaLarga = new Intl.DateTimeFormat('es-PA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: ZONA,
});

/** «14:50» */
export function hora(d: Date | string): string {
  return hhmm.format(new Date(d));
}

/** «sábado 14» */
export function diaCorto(d: Date | string): string {
  return diaYNumero.format(new Date(d)).replace(',', '');
}

/** «sábado 14 de noviembre» */
export function diaLargo(d: Date | string): string {
  return fechaLarga.format(new Date(d)).replace(',', '');
}

/** Suma minutos y devuelve una fecha nueva. */
export function mas(d: Date | string, minutos: number): Date {
  return new Date(new Date(d).getTime() + minutos * 60_000);
}
