/**
 * `4e` `14e` Entrar — para quien ya tiene cuenta.
 *
 * **El celular es la llave.** No hay contraseña que recordar ni que perder: se
 * pide el número y llega un código, igual que al registrarse. Por eso esta
 * pantalla y el primer paso de `4b` se parecen tanto — es a propósito.
 *
 * Google y Apple van debajo de una línea, no arriba: en Panamá el número es lo
 * que todo el mundo tiene, y lo demás es un atajo para quien lo prefiera.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRouter } from 'expo-router';

import { PREFIJO_PA, formatearTelefono, pedirCodigo, telefonoCompleto } from '@/servicios/cuenta';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

export default function Entrar() {
  const router = useRouter();
  const [telefono, setTelefono] = useState('');
  const [enfocado, setEnfocado] = useState(false);

  const listo = telefonoCompleto(telefono);

  const enviar = async () => {
    if (!listo) return;
    await pedirCodigo(telefono);
    router.push({ pathname: '/(cuenta)/registro', params: { telefono, paso: '2' } });
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={190} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>Entrar</Text>
        </View>

        <Text style={estilos.titular}>
          {'Hola otra vez,'}
          {'\n'}
          <Text style={estilos.titularFuerte}>¿tu celular?</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <View style={estilos.filaTelefono}>
            <View style={estilos.prefijo}>
              <Text style={estilos.prefijoTexto}>{PREFIJO_PA}</Text>
              <Chevron />
            </View>
            <View style={[estilos.campoTelefono, enfocado && { borderColor: color.ink900 }]}>
              <TextInput
                accessibilityLabel="Tu celular"
                value={formatearTelefono(telefono)}
                onChangeText={(t) => setTelefono(t.replace(/\D/g, '').slice(0, 8))}
                onFocus={() => setEnfocado(true)}
                onBlur={() => setEnfocado(false)}
                onSubmitEditing={enviar}
                keyboardType="number-pad"
                placeholder="6612 4831"
                placeholderTextColor={color.ink400}
                style={estilos.entradaTelefono}
              />
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            {/* Dentro de la hoja blanca la acción es azul: rojo sobre rojo no se lee. */}
            <Boton tono="azul" desactivado={!listo} alPulsar={enviar}>
              Enviarme el código
            </Boton>
          </View>
        </View>

        <View style={estilos.abajo}>
          <View style={estilos.separador}>
            <View style={estilos.raya} />
            <Text style={estilos.oTexto}>o</Text>
            <View style={estilos.raya} />
          </View>

          <View style={estilos.otros}>
            <Pressable accessibilityRole="button" style={estilos.otro}>
              <Text style={estilos.otroTexto}>Continuar con Google</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={estilos.otro}>
              <Text style={estilos.otroTexto}>Continuar con Apple</Text>
            </Pressable>
          </View>

          <Text style={estilos.cambiaste}>
            {'¿Cambiaste de número? '}
            <Text style={estilos.escribenos}>Escríbenos</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

/** La flecha del selector de prefijo. */
function Chevron() {
  return (
    <View style={estilos.chevron}>
      <View style={estilos.chevronRama} />
      <View style={[estilos.chevronRama, { transform: [{ rotate: '-45deg' }], marginLeft: -3.5 }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.86,
    letterSpacing: -1.395,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  filaTelefono: { flexDirection: 'row', gap: 9 },
  prefijo: {
    width: 96,
    height: 58,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  prefijoTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  campoTelefono: {
    flex: 1,
    height: 58,
    borderRadius: radio.control,
    borderWidth: 1,
    // El campo activo se dibuja con el borde en tinta, no con un halo de color.
    borderColor: color.bordePorDefecto,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaTelefono: {
    fontSize: 18,
    lineHeight: interlinea(18),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
    ...tabular,
  } as never,

  abajo: { paddingHorizontal: 4, paddingTop: 26 },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  raya: { flex: 1, height: 1, backgroundColor: color.bordeSutil },
  oTexto: {
    fontSize: 12,
    lineHeight: interlinea(12),
    fontWeight: '600',
    letterSpacing: 12 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink400,
    fontFamily: familia,
  },

  otros: { gap: 10, marginTop: 20 },
  otro: {
    height: 52,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otroTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '600',
    letterSpacing: -0.16,
    color: color.ink900,
    fontFamily: familia,
  },

  cambiaste: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink600,
    marginTop: 26,
    fontFamily: familia,
  },
  escribenos: { fontWeight: '600', color: color.rojo600 },

  chevron: { width: 14, height: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chevronRama: {
    width: 7,
    height: 1.6,
    backgroundColor: color.ink600,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
