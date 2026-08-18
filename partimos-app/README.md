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

Pantallas hechas, por orden de riesgo:

| Id | Pantalla | Ruta |
| --- | --- | --- |
| `5c` | Publicar | `/(conductor)/publicar` |

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
para que la migración sea mecánica: el booleano de maletas en `trips`, el tope
en `corridors`, y en `bookings` el código de abordaje, la marca de abordaje, la
caducidad de la solicitud, los minutos de desvío, la liberación del aporte y los
contadores de equipaje. Falta además el estado «rechazada» en `booking_status`.

No se ha tocado la base de producción.
