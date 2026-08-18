/**
 * Los controles del sistema, con las medidas del bundle de diseño:
 * Stepper (círculos de 40, hueco de 14, cifra de 34 mínimo) e
 * Interruptor (48 × 30, pulgar de 24, recorrido de 18).
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { familia, color, radio, texto } from './tokens';

/* ---------------------------------------------------------------- Stepper */

type StepperProps = {
  valor: number;
  alCambiar: (v: number) => void;
  min?: number;
  max?: number;
  /** Se lee con lector de pantalla: «Puestos libres, 3». */
  etiquetaAccesible: string;
};

export function Stepper({ valor, alCambiar, min = 0, max = 9, etiquetaAccesible }: StepperProps) {
  const boton = (paso: number, apagado: boolean, glifo: string, nombre: string) => (
    <Pressable
      disabled={apagado}
      accessibilityRole="button"
      accessibilityLabel={nombre}
      onPress={() => alCambiar(Math.min(max, Math.max(min, valor + paso)))}
      style={({ pressed }) => [
        estilos.stepperBoton,
        pressed && !apagado && { backgroundColor: color.sand200 },
      ]}
    >
      <Text style={[estilos.stepperGlifo, apagado && { color: color.ink300 }]}>{glifo}</Text>
    </Pressable>
  );

  return (
    <View
      style={estilos.stepper}
      accessibilityRole="adjustable"
      accessibilityLabel={etiquetaAccesible}
      accessibilityValue={{ min, max, now: valor }}
    >
      {boton(-1, valor <= min, '−', 'Uno menos')}
      <Text style={estilos.stepperValor}>{valor}</Text>
      {boton(1, valor >= max, '+', 'Uno más')}
    </View>
  );
}

/* ----------------------------------------------------------- Interruptor */

type InterruptorProps = {
  activo: boolean;
  alCambiar: (v: boolean) => void;
  etiqueta: string;
  descripcion?: string;
};

export function Interruptor({ activo, alCambiar, etiqueta, descripcion }: InterruptorProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: activo }}
      accessibilityLabel={etiqueta}
      onPress={() => alCambiar(!activo)}
      style={[estilos.interruptorFila, { alignItems: descripcion ? 'flex-start' : 'center' }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={estilos.interruptorEtiqueta}>{etiqueta}</Text>
        {descripcion ? <Text style={estilos.interruptorDescripcion}>{descripcion}</Text> : null}
      </View>
      <View style={[estilos.pista, { backgroundColor: activo ? color.rojo500 : color.ink200 }]}>
        <View style={[estilos.pulgar, { transform: [{ translateX: activo ? 18 : 0 }] }]} />
      </View>
    </Pressable>
  );
}

/* --------------------------------------------------------------- Pastilla */

type PastillaProps = {
  children: ReactNode;
  fondo?: string;
  tinta?: string;
  estilo?: ViewStyle;
};

export function Pastilla({ children, fondo = color.azul100, tinta = color.azul700, estilo }: PastillaProps) {
  return (
    <View style={[estilos.pastilla, { backgroundColor: fondo }, estilo]}>
      <Text style={[texto.pastilla, { color: tinta }]}>{children}</Text>
    </View>
  );
}

/* ----------------------------------------------------------------- Botón */

type BotonProps = {
  children: ReactNode;
  alPulsar?: () => void;
  /** azul dentro de una hoja, rojo sobre arena. El rojo sobre rojo no se lee. */
  tono?: 'azul' | 'rojo';
  desactivado?: boolean;
};

export function Boton({ children, alPulsar, tono = 'rojo', desactivado = false }: BotonProps) {
  const fondo = tono === 'azul' ? color.azul500 : color.rojo500;
  const fondoPulsado = tono === 'azul' ? color.azul600 : color.rojo600;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactivado}
      onPress={alPulsar}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: pressed ? fondoPulsado : fondo, opacity: desactivado ? 0.5 : 1 },
      ]}
    >
      <Text style={estilos.botonTexto}>{children}</Text>
    </Pressable>
  );
}

/* --------------------------------------------------------------- Epígrafe */

export function Epigrafe({ children, tinta = color.azul500 }: { children: ReactNode; tinta?: string }) {
  return <Text style={[texto.epigrafe, { color: tinta }]}>{children}</Text>;
}

const estilos = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperBoton: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlifo: { fontSize: 19, lineHeight: 22, fontWeight: '500', color: color.ink900, fontFamily: familia },
  stepperValor: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.38,
    color: color.ink900,
    fontVariant: ['tabular-nums'], fontFamily: familia },

  interruptorFila: { flexDirection: 'row', gap: 16, minHeight: 30 },
  interruptorEtiqueta: { fontSize: 15, fontWeight: '500', color: color.ink900, fontFamily: familia },
  interruptorDescripcion: { fontSize: 13, lineHeight: 18, color: color.ink600, marginTop: 2, fontFamily: familia },
  pista: { width: 48, height: 30, borderRadius: radio.pastilla, padding: 3, justifyContent: 'center' },
  pulgar: {
    width: 24,
    height: 24,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  pastilla: { borderRadius: radio.pastilla, paddingHorizontal: 8, paddingVertical: 3 },

  boton: {
    height: 58,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  botonTexto: { fontSize: 17, fontWeight: '600', letterSpacing: -0.17, color: color.blanco, fontFamily: familia },
});
