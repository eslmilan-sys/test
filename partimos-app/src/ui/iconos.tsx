/**
 * Iconos dibujados a mano, trazo 1.6–1.8, extremos redondos, como el traspaso.
 * Los `d` son los del diseño, no aproximaciones.
 */

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { color } from './tokens';

type Props = { tamano?: number; tinta?: string };

export function Atras({ tamano = 20, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Carro({ tamano = 19, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M3 13.5l1.6-4.4A2.4 2.4 0 0 1 6.9 7.5h10.2a2.4 2.4 0 0 1 2.3 1.6l1.6 4.4"
        stroke={tinta}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 13.5h18v4.2H3z" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={7} cy={17.7} r={1.4} stroke={tinta} strokeWidth={1.6} />
      <Circle cx={17} cy={17.7} r={1.4} stroke={tinta} strokeWidth={1.6} />
    </Svg>
  );
}

export function Mas({ tamano = 16, tinta = color.azul700 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M12 5v14M5 12h14" stroke={tinta} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function Cerrar({ tamano = 12, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={tinta} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

/** Cobertura y batería de la barra de estado del diseño. */
export function Cobertura() {
  return (
    <Svg viewBox="0 0 18 12" width={17} height={11}>
      <Rect x={0} y={8} width={3} height={4} rx={1} fill="#fff" />
      <Rect x={4.5} y={5.5} width={3} height={6.5} rx={1} fill="#fff" />
      <Rect x={9} y={3} width={3} height={9} rx={1} fill="#fff" />
      <Rect x={13.5} y={0} width={3} height={12} rx={1} fill="#fff" />
    </Svg>
  );
}

export function Bateria() {
  return (
    <Svg viewBox="0 0 26 13" width={24} height={12} fill="none">
      <Rect x={0.6} y={0.6} width={21} height={11.8} rx={3.4} stroke="#fff" strokeOpacity={0.45} />
      <Rect x={2.4} y={2.4} width={17.4} height={8.2} rx={2.2} fill="#fff" />
      <Path d="M23.4 4.4v4.2c1.2-.4 1.7-1.1 1.7-2.1s-.5-1.7-1.7-2.1Z" fill="#fff" fillOpacity={0.5} />
    </Svg>
  );
}
