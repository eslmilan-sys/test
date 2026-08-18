/**
 * El único interruptor entre datos simulados y producción.
 *
 * Hoy `simulado`. Cuando exista `./supabase` con las mismas exportaciones, esto
 * es una línea. Ninguna pantalla importa de aquí: solo lo hacen los servicios.
 */

import * as simulado from './simulado';

export type Modo = 'simulado' | 'supabase';

export const MODO: Modo = (process.env.EXPO_PUBLIC_FUENTE as Modo) ?? 'simulado';

export const fuente = simulado;
