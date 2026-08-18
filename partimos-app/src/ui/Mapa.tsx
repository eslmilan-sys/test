/**
 * El mapa, de momento un bloque dibujado.
 *
 * El traspaso lo dice sin rodeos: todos los mapas del diseño son marcadores de
 * posición. La geometría de la ruta, el tiempo estimado y la posición en vivo
 * de `1h` necesitan un proveedor de verdad. Esto guarda el sitio y el peso
 * visual correctos hasta entonces: calles finas en tinta clara, la ruta en dos
 * capas, y la parte recorrida en rojo.
 */

import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from 'react-native-svg';

import { color } from './tokens';

const CALLES_H = [60, 130, 205, 270];
const CALLES_V = [
  [40, 70],
  [150, 180],
  [270, 300],
];

const RUTA = 'M-10 235 C 80 220, 130 150, 230 132 S 340 70, 420 34';
const RECORRIDO = 'M-10 235 C 80 220, 130 150, 230 132';

export function Mapa({ ancho = 390, alto = 300 }: { ancho?: number; alto?: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height: alto, backgroundColor: color.sand100 }]}>
      <Svg width={ancho} height={alto} viewBox="0 0 390 300">
        <Defs>
          {/* la bruma que aclara el borde superior para que el chrome se lea */}
          <LinearGradient id="bruma" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color.sand100} stopOpacity="0.55" />
            <Stop offset="0.42" stopColor={color.sand100} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {CALLES_H.map((y) => (
          <Line key={`h-${y}`} x1={-20} y1={y} x2={410} y2={y} stroke={color.ink100} strokeWidth={1} />
        ))}
        {CALLES_V.map(([x1, x2]) => (
          <Line key={`v-${x1}`} x1={x1} y1={-20} x2={x2} y2={320} stroke={color.ink100} strokeWidth={1} />
        ))}

        <Path d={RUTA} fill="none" stroke={color.sand300} strokeWidth={10} strokeLinecap="round" />
        <Path d={RUTA} fill="none" stroke={color.azul200} strokeWidth={4.5} strokeLinecap="round" />
        <Path d={RECORRIDO} fill="none" stroke={color.rojo500} strokeWidth={4.5} strokeLinecap="round" />
        <Circle cx={230} cy={132} r={7} fill={color.blanco} stroke={color.rojo500} strokeWidth={3} />

        <Rect x="0" y="0" width={390} height={300} fill="url(#bruma)" />
      </Svg>
    </View>
  );
}
