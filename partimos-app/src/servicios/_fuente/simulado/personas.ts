/**
 * Perfiles y carros. Forma exacta de `profiles`, `vehicles` y `vehicle_categories`.
 *
 * Andrés es el conductor del recorrido del diseño; Mateo y Rosa son quienes
 * piden puesto en `11a`.
 */

import type { Profile, Vehicle, VehicleCategory } from '@/tipos';

export const ANDRES_ID = '11111111-1111-4111-8111-111111111111';
export const MATEO_ID = '22222222-2222-4222-8222-222222222222';
export const ROSA_ID = '33333333-3333-4333-8333-333333333333';
export const ELANTRA_ID = '44444444-4444-4444-8444-444444444444';

/** Filas reales de `vehicle_categories`. El `rate_per_km_cents` de la base es
 *  otra escala de costo; la app calcula con litros y precio de gasolina
 *  (ver dominio/aporte.ts), y este consumo es lo que falta ahí. */
export const categorias: (VehicleCategory & { consumo_l_100km: number })[] = [
  { code: 'economy', label_es: 'Económico (sedán pequeño)', rate_per_km_cents: 22, consumo_l_100km: 7.0 },
  { code: 'standard', label_es: 'Estándar (sedán / crossover)', rate_per_km_cents: 25, consumo_l_100km: 8.0 },
  { code: 'suv', label_es: 'SUV o pick-up', rate_per_km_cents: 32, consumo_l_100km: 11.0 },
];

export const perfiles: Profile[] = [
  {
    id: ANDRES_ID,
    first_name: 'Andrés',
    last_initial: 'M.',
    phone: '+507 6000 0000',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'hombre',
    bio: 'Voy a Chitré casi todos los fines de semana.',
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-03-02T14:10:00+00:00',
    updated_at: '2026-08-10T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: MATEO_ID,
    first_name: 'Mateo',
    last_initial: 'Q.',
    phone: '+507 6000 0001',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'hombre',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-05-18T11:00:00+00:00',
    updated_at: '2026-08-12T08:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: ROSA_ID,
    first_name: 'Rosa',
    last_initial: 'I.',
    phone: '+507 6000 0002',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-08-14T19:40:00+00:00',
    updated_at: '2026-08-14T19:40:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: false,
  },
];

export const vehiculos: Vehicle[] = [
  {
    id: ELANTRA_ID,
    owner_id: ANDRES_ID,
    category_code: 'standard',
    make: 'Hyundai',
    model: 'Elantra',
    color: 'gris',
    year: 2019,
    seats_total: 5,
    // La base guarda 3 caracteres; `5c` enseña la placa entera. Ver tipos/index.ts.
    plate_last3: '234',
    is_active: true,
    created_at: '2026-03-02T14:30:00+00:00',
    consumption_l_100km: 8.0,
    rate_per_km_cents: null,
    photo_path: null,
  },
];

/** La placa completa, que la columna `plate_last3` todavía no puede guardar. */
export const placasCompletas: Record<string, string> = {
  [ELANTRA_ID]: 'AB-1234',
};
