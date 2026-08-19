/**
 * La cuenta — pantallas `1c` (la puerta), `4b`–`4d` (registro) y `4e` (entrar).
 *
 * El teléfono es la llave: no hay contraseña. La cuenta se pide una sola vez y
 * en el momento en que ya sabes qué ganas con ella — al pedir puesto, nunca al
 * abrir la app.
 */

import type { Profile } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export const PREFIJO_PA = '+507';

/** Segundos hasta poder pedir otro SMS. */
export const ESPERA_PARA_REENVIAR = 30;

/** Los celulares panameños son de 8 dígitos. */
export function telefonoCompleto(digitos: string): boolean {
  return digitos.replace(/\D/g, '').length === 8;
}

/** «6612 4831» — en dos bloques, como se dicta en voz alta. */
export function formatearTelefono(digitos: string): string {
  const limpio = digitos.replace(/\D/g, '').slice(0, 8);
  return limpio.length > 4 ? `${limpio.slice(0, 4)} ${limpio.slice(4)}` : limpio;
}

/**
 * Manda el código por SMS. En producción lo emite el proveedor; aquí devolvemos
 * el que hay que teclear para que se pueda probar el recorrido entero.
 */
export async function pedirCodigo(telefono: string): Promise<{ enviado: true; pista: string }> {
  if (!telefonoCompleto(telefono)) throw new Error('Ese celular no tiene ocho dígitos');
  return demora({ enviado: true, pista: CODIGO_SIMULADO });
}

export type ResultadoDeEntrada =
  | { ok: true; nuevo: boolean; perfil: Profile | null }
  | { ok: false; motivo: 'codigo-no-coincide' };

/** El código de 4 dígitos del SMS. Sin contraseña que recordar. */
export async function verificarCodigoSms(
  telefono: string,
  codigo: string,
): Promise<ResultadoDeEntrada> {
  if (codigo !== CODIGO_SIMULADO) {
    return demora({ ok: false, motivo: 'codigo-no-coincide' } as const);
  }
  const limpio = telefono.replace(/\D/g, '');
  const existente = fuente.perfiles.find((p) => (p.phone ?? '').replace(/\D/g, '').endsWith(limpio));
  return demora({ ok: true, nuevo: !existente, perfil: existente ?? null } as const);
}

/**
 * En público solo se ve el nombre y la inicial del apellido. La regla vive
 * aquí, no en la pantalla: el apellido completo no sale de este servicio.
 */
export function inicialDelApellido(apellido: string): string | null {
  const limpio = apellido.trim();
  return limpio ? `${limpio[0].toUpperCase()}.` : null;
}

export async function crearCuenta(
  telefono: string,
  nombre: string,
  apellido: string,
): Promise<Profile> {
  const ahora = new Date().toISOString();
  const perfil: Profile = {
    id: nuevoId(),
    first_name: nombre.trim(),
    last_initial: inicialDelApellido(apellido),
    phone: `${PREFIJO_PA} ${formatearTelefono(telefono)}`,
    photo_url: null,
    home_city_id: null,
    gender: null,
    bio: null,
    is_id_verified: false,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: ahora,
    updated_at: ahora,
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  };
  fuente.perfiles.push(perfil);
  return demora(perfil);
}

/* ------------------------------------------------------------------ */

/** Mientras no haya proveedor de SMS. En producción no existe esta constante. */
const CODIGO_SIMULADO = '4917';

let contador = 0;
function nuevoId(): string {
  contador += 1;
  return `cccccccc-cccc-4ccc-8ccc-${String(contador).padStart(12, '0')}`;
}
