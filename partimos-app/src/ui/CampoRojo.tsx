/**
 * El campo rojo — el arquetipo de pantalla.
 *
 * Tres capas, exactamente como el CSS del traspaso: luz cálida arriba a la
 * derecha, sombra profunda abajo a la izquierda, y el degradado de bandera.
 * Una por pantalla, y nada debajo del subtítulo se sienta encima.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import Hibisco from '../../assets/motivos/pa-hibisco.svg';
import Mapa from '../../assets/motivos/pa-mapa.svg';
import Palmera from '../../assets/motivos/pa-palmera.svg';
import { campoRojo } from './tokens';

/** Los motivos que se recortan contra el borde del campo. Nunca sobre texto. */
const MOTIVOS = { palmera: Palmera, hibisco: Hibisco, mapa: Mapa } as const;

type Props = {
  /** 326 en una pantalla de inicio, 186–214 en una secundaria. */
  altura?: number;
  ancho?: number;
  /** Marca de agua en tinta oscura al 20 %, cortada por el borde. */
  motivo?: keyof typeof MOTIVOS;
  children?: ReactNode;
};

export function CampoRojo({
  altura = campoRojo.alturaSecundaria,
  ancho = 390,
  motivo,
  children,
}: Props) {
  const Motivo = motivo ? MOTIVOS[motivo] : null;
  return (
    <View style={[StyleSheet.absoluteFill, { height: altura, overflow: 'hidden' }]}>
      <Svg width={ancho} height={altura} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* linear-gradient(166deg, #DD1D3F 0%, #D21034 44%, #AF0B29 100%) */}
          <LinearGradient id="bandera" x1="0.434" y1="0" x2="0.566" y2="1">
            <Stop offset="0" stopColor={campoRojo.de} />
            <Stop offset="0.44" stopColor={campoRojo.medio} />
            <Stop offset="1" stopColor={campoRojo.a} />
          </LinearGradient>

          {/* radial 86% 60% at 88% 0% — la luz */}
          <RadialGradient id="luz" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFD8BC" stopOpacity="0.34" />
            <Stop offset="0.62" stopColor="#FFD8BC" stopOpacity="0" />
          </RadialGradient>

          {/* radial 96% 76% at 2% 100% — la sombra */}
          <RadialGradient id="sombra" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#5E0717" stopOpacity="0.62" />
            <Stop offset="0.7" stopColor="#5E0717" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width={ancho} height={altura} fill="url(#bandera)" />
        <Ellipse
          cx={0.88 * ancho}
          cy={0}
          rx={0.86 * ancho}
          ry={0.6 * altura}
          fill="url(#luz)"
        />
        <Ellipse
          cx={0.02 * ancho}
          cy={altura}
          rx={0.96 * ancho}
          ry={0.76 * altura}
          fill="url(#sombra)"
        />
      </Svg>

      {Motivo ? (
        <View style={estilos.motivo} pointerEvents="none">
          <Motivo width={170} height={170} color="#1C0A10" />
        </View>
      ) : null}

      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  motivo: { position: 'absolute', right: -18, bottom: -10, opacity: 0.2 },
});
