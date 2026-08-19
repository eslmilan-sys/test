/**
 * Entrar y salir — pantallas `1c` (la puerta), `4b`–`4d` y `4e`.
 *
 * **Divergencia con el traspaso, a propósito.** El diseño dibuja un código de
 * cuatro cifras por SMS al `+507`. La base no tiene una sola cuenta de
 * teléfono: las cuatro que hay son de correo, y el sitio de `partimos/` entra
 * por enlace mágico. Mandar SMS es un proveedor más, con su contrato y su
 * factura por mensaje. Así que la app entra por donde ya se entra hoy.
 *
 * Lo que el traspaso decidía de verdad —que no hay contraseña que recordar y
 * que la cuenta se pide al pedir puesto, no al abrir la app— se respeta
 * entero. Cambia el sobre, no la regla.
 */

import { Platform } from 'react-native';

import * as Linking from 'expo-linking';

import type { Profile } from '@/tipos';

import { supabase } from './_fuente/supabase/cliente';

/**
 * A dónde vuelve el enlace del correo.
 *
 * En el navegador, a la misma página desde donde se pidió, para que quien
 * vuelve caiga donde estaba. En el teléfono, al esquema de la app, que es lo
 * que hace que el enlace abra Partimos y no el navegador.
 */
function volverA(): string {
  if (Platform.OS === 'web') return window.location.href;
  return Linking.createURL('/');
}

export type Envio =
  | { ok: true }
  | { ok: false; motivo: 'correo-invalido' | 'demasiados-envios' | 'no-se-pudo' };

/** Un correo con pinta de correo. Ni más ni menos: la verdad la dice el envío. */
export const correoValido = (correo: string): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim());

/**
 * Manda el enlace. Crea la cuenta si no existe: en una app de viajes
 * compartidos la primera vez que alguien entra es, casi siempre, para pedir un
 * puesto — obligarle a «registrarse» antes es una puerta de más.
 */
export async function mandarEnlace(correo: string, nombre?: string, apellido?: string): Promise<Envio> {
  if (!correoValido(correo)) return { ok: false, motivo: 'correo-invalido' };

  const { error } = await supabase.auth.signInWithOtp({
    email: correo.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: volverA(),
      // El disparador `handle_new_user` lee esto para escribir el perfil, así
      // que el nombre que se teclea en `4b` llega a `profiles` sin un segundo
      // viaje ni una pantalla de «completa tu perfil».
      data: { first_name: nombre?.trim() || undefined, last_name: apellido?.trim() || undefined },
    },
  });

  if (!error) return { ok: true };

  // El tope de correos por hora es de Supabase, no nuestro, y volver a pulsar
  // no lo arregla. Decirlo con su nombre evita que la gente insista.
  const tope = error.code === 'over_email_send_rate_limit' || error.status === 429;
  return { ok: false, motivo: tope ? 'demasiados-envios' : 'no-se-pudo' };
}

export async function salir(): Promise<void> {
  await supabase.auth.signOut();
}

/** Quién está dentro ahora mismo, o `null`. */
export async function quienEs(): Promise<Profile | null> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) return null;
  const { data: perfil } = await supabase.from('profiles').select('*').eq('id', id).single();
  return perfil ?? null;
}

/** Avisa cada vez que se entra o se sale. Devuelve la forma de dejar de escuchar. */
export function alCambiarLaSesion(hacer: (dentro: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => hacer(!!sesion));
  return () => data.subscription.unsubscribe();
}
