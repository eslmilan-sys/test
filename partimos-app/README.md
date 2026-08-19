# Partimos — app móvil

Recreación del traspaso de diseño (`design_handoff_partimos_app/`) en Expo.
Un solo código para el navegador y para el teléfono con Expo Go.

## Correrla

```bash
cd partimos-app
npm install
npx expo start          # escanea el QR con Expo Go
npx expo start --web    # o en el navegador, en localhost:8081
```

Pantallas hechas:

| Id | Pantalla | Ruta |
| --- | --- | --- |
| `3a` | Inicio | `/(pasajero)` |
| `1b` / `3b` | Resultados | `/(pasajero)/resultados` |
| `5a` | Detalle del viaje | `/(pasajero)/viaje` |
| `1c` | La puerta | `/(cuenta)/puerta` |
| `4b`–`4d` | Registro | `/(cuenta)/registro` |
| `5c` | Publicar | `/(conductor)/publicar` |
| `11a` | Solicitudes de puesto | `/(conductor)/solicitudes` |
| `7a` | Reserva | `/(pasajero)/reservar` |
| `7b` | Pago del aporte | `/(pasajero)/pagar` |
| `1f` | Código de abordaje · pasajero | `/(pasajero)/codigo` |
| `1g` | Código de abordaje · conductor | `/(conductor)/abordaje` |
| `1i` | Llegada y liberación | `/(pasajero)/llegada` |
| `6b` | Perfil público | `/(pasajero)/perfil` |
| `6c` | Chat del viaje | `/(pasajero)/chat` |
| `1j` | Calificar | `/(pasajero)/calificar` |

## Cómo está montada

```
app/                    una ruta por pantalla del diseño
src/
  servicios/            lo ÚNICO que habla con datos
    _fuente/            el interruptor simulado ⇄ producción
      simulado/         filas con la forma exacta de las tablas
      supabase/         vacío por ahora
  dominio/              reglas puras, sin IO, con pruebas
  tipos/base.ts         generado desde el proyecto Supabase del sitio
  ui/                   el design system portado
```

Las pantallas no ven datos falsos: llaman a `servicios/*` y reciben filas con
la forma de las tablas reales. `src/tipos/base.ts` está generado desde la base
de producción, así que si una columna cambia, el simulado deja de compilar.

```bash
npm test        # las reglas de negocio contra el viaje de referencia
npm run typecheck
```

## Decisiones tomadas

**El costo del viaje** — gasolina, no un baremo kilométrico:

```
costo = distancia × (consumo_L/100km ÷ 100 × precio_litro) × (1 + 10 % desvío) + peajes
```

Consumo por categoría: económico 7,0 · estándar 8,0 · SUV 11,0 L/100 km.
Precio de la gasolina: 0,80 $/L — es un dato, cambia cada quincena en Panamá.
Albrook → Chitré (250 km, peaje 3 $, sedán) da **20,60 $**, el número del diseño.

**El tope** es de la ruta, no del viaje: `ceil(costo_con_carro_de_referencia / 3)`,
que en Chitré da **7 $**. No sube porque el conductor maneje una camioneta.

**El aporte por defecto**: `ceil(costo / (puestos + 1))` — el conductor cuenta
como uno más que paga — limitado a `[3 $, tope]`.

**Las tarifas** se calculan sobre el aporte y se suman encima: Yappy 5 %,
tarjeta 8 %, efectivo 0 %. El conductor recibe el aporte completo siempre.

**Los reembolsos**: la tarifa se retiene solo cuando la cancelación es tuya
(6,00 $ de 6,30 $). Si falla el otro, vuelve todo (6,30 $). A menos de 2 h de
la salida, el conductor se queda 1 $ por el puesto que ya no vende.

## Lo que la base todavía no tiene

Está en `src/tipos/index.ts`, bajo «pendiente de migración», con nombre propio
para que la migración sea mecánica:

- `trips.accepts_luggage` — el booleano de maletas de `5c`.
- `corridors.max_price_cents` — el tope por ruta.
- `bookings`: `boarding_code` y `arrival_code` (son dos códigos distintos: uno
  abre el viaje en `1f`/`1g` y otro lo cierra en `1i`), `boarded_at`,
  `released_at`, `expires_at` para las 4 h de `11a`, `detour_minutes`, y
  `mochilas` / `maletas`.
- `booking_status` necesita «rechazada»: hoy no hay estado para que el conductor
  diga que no sin cancelar una reserva confirmada.

No se ha tocado la base de producción.
