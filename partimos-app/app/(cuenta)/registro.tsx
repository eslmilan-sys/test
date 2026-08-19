/**
 * `4b` `4c` `4d` Registro — celular, código y nombre.
 *
 * Los tres pasos del traspaso, en una sola ruta con el paso en el parámetro,
 * porque el número escrito en el primero es lo que el segundo verifica.
 *
 * El diseño dibuja el teclado del sistema al pie para enseñar la pantalla con
 * el teclado subido. Aquí no se dibuja: se usa el teclado de verdad del
 * teléfono, que es el que va a salir.
 */

import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  ESPERA_PARA_REENVIAR,
  PREFIJO_PA,
  crearCuenta,
  formatearTelefono,
  inicialDelApellido,
  pedirCodigo,
  telefonoCompleto,
  verificarCodigoSms,
} from '@/servicios/cuenta';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

type Paso = 1 | 2 | 3;

export default function Registro() {
  const router = useRouter();
  const params = useLocalSearchParams<{ telefono?: string; paso?: string; viaje?: string }>();

  const [paso, setPaso] = useState<Paso>((Number(params.paso) as Paso) || 1);
  const [telefono, setTelefono] = useState(params.telefono ?? '');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [restante, setRestante] = useState(ESPERA_PARA_REENVIAR);

  // La cuenta atrás del reenvío solo corre mientras se está en el paso 2.
  useEffect(() => {
    if (paso !== 2) return;
    setRestante(ESPERA_PARA_REENVIAR);
    const t = setInterval(() => setRestante((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [paso]);

  const irAlCodigo = async () => {
    await pedirCodigo(telefono);
    setError(null);
    setPaso(2);
  };

  const comprobar = async (valor: string) => {
    const resultado = await verificarCodigoSms(telefono, valor);
    if (resultado.ok) {
      setError(null);
      setPaso(3);
    } else {
      setError('Ese código no es. Míralo otra vez o pide uno nuevo.');
    }
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          onPress={() => (paso === 1 ? router.back() : setPaso((p) => (p - 1) as Paso))}
          style={estilos.circulo}
        >
          <Atras />
        </Pressable>
        <Text style={estilos.epigrafeCampo}>{`Paso ${paso} de 3`}</Text>
        <Text style={estilos.titular}>
          {paso === 1 ? 'Tu ' : paso === 2 ? 'Escribe el ' : '¿Cómo te '}
          <Text style={estilos.titularFuerte}>
            {paso === 1 ? 'celular' : paso === 2 ? 'código' : 'llamas?'}
          </Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          {paso === 1 ? (
            <PasoCelular
              telefono={telefono}
              alEscribir={setTelefono}
              alSeguir={irAlCodigo}
            />
          ) : paso === 2 ? (
            <PasoCodigo
              codigo={codigo}
              alEscribir={(v) => {
                setCodigo(v);
                setError(null);
                if (v.length === 4) comprobar(v);
              }}
              telefono={telefono}
              error={error}
              restante={restante}
              alCambiarNumero={() => setPaso(1)}
              alReenviar={async () => {
                await pedirCodigo(telefono);
                setRestante(ESPERA_PARA_REENVIAR);
              }}
            />
          ) : (
            <PasoNombre
              nombre={nombre}
              apellido={apellido}
              alEscribirNombre={setNombre}
              alEscribirApellido={setApellido}
              alCrear={async () => {
                await crearCuenta(telefono, nombre, apellido);
                router.replace(
                  params.viaje
                    ? { pathname: '/(pasajero)/reservar', params: { viaje: params.viaje } }
                    : '/(pasajero)',
                );
              }}
            />
          )}
        </View>

        {paso === 3 ? (
          <View style={estilos.loQueSigue}>
            <Text style={estilos.loQueSigueTitulo}>Lo que sigue</Text>
            <Paso numero="1" texto="Pides tu puesto y el conductor acepta" />
            <Paso numero="2" texto="Verificas tu cédula cuando quieras publicar" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------ pasos */

function PasoCelular({
  telefono,
  alEscribir,
  alSeguir,
}: {
  telefono: string;
  alEscribir: (v: string) => void;
  alSeguir: () => void;
}) {
  return (
    <>
      <View style={estilos.filaTelefono}>
        <View style={estilos.prefijo}>
          <Text style={estilos.prefijoTexto}>{PREFIJO_PA}</Text>
        </View>
        <View style={estilos.campo}>
          <TextInput
            accessibilityLabel="Tu número de celular"
            value={formatearTelefono(telefono)}
            onChangeText={(v) => alEscribir(v.replace(/\D/g, '').slice(0, 8))}
            placeholder="6000 0000"
            placeholderTextColor={color.ink400}
            keyboardType="phone-pad"
            style={estilos.entradaGrande}
          />
        </View>
      </View>
      <Text style={estilos.ayuda}>
        Te mandamos un código por SMS. No hay contraseña que recordar.
      </Text>
      <View style={{ marginTop: 18 }}>
        <Boton tono="azul" desactivado={!telefonoCompleto(telefono)} alPulsar={alSeguir}>
          Enviarme el código
        </Boton>
      </View>
    </>
  );
}

function PasoCodigo({
  codigo,
  alEscribir,
  telefono,
  error,
  restante,
  alCambiarNumero,
  alReenviar,
}: {
  codigo: string;
  alEscribir: (v: string) => void;
  telefono: string;
  error: string | null;
  restante: number;
  alCambiarNumero: () => void;
  alReenviar: () => void;
}) {
  const entrada = useRef<TextInput>(null);

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Escribe el código" onPress={() => entrada.current?.focus()}>
        <View style={estilos.casillas}>
          {[0, 1, 2, 3].map((i) => {
            const valor = codigo[i];
            const activa = i === codigo.length;
            return (
              <View
                key={i}
                style={[
                  estilos.casilla,
                  valor != null
                    ? { backgroundColor: color.sand200, borderColor: 'transparent' }
                    : activa
                      ? { borderColor: color.rojo500, borderWidth: 2 }
                      : { borderColor: color.bordePorDefecto },
                ]}
              >
                {valor != null ? (
                  <Text style={estilos.casillaTexto}>{valor}</Text>
                ) : activa ? (
                  <View style={estilos.cursor} />
                ) : null}
              </View>
            );
          })}
        </View>
      </Pressable>

      {/* El campo real, invisible: el teclado que sale es el del teléfono. */}
      <TextInput
        ref={entrada}
        accessibilityLabel="Código de cuatro dígitos"
        value={codigo}
        onChangeText={(v) => alEscribir(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        autoFocus
        style={estilos.entradaInvisible}
      />

      {error ? <Text style={estilos.error}>{error}</Text> : null}

      <View style={estilos.filaReenvio}>
        <Text style={estilos.ayudaCorta}>
          {`Se lo mandamos al ${formatearTelefono(telefono)}`}
        </Text>
        <Pressable accessibilityRole="button" onPress={alCambiarNumero}>
          <Text style={estilos.enlace}>Cambiar</Text>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" disabled={restante > 0} onPress={alReenviar}>
        <Text style={[estilos.reenviar, restante === 0 && { color: color.azul700 }]}>
          {restante > 0
            ? `Reenviar en 0:${String(restante).padStart(2, '0')}`
            : 'Reenviar el código'}
        </Text>
      </Pressable>
    </>
  );
}

function PasoNombre({
  nombre,
  apellido,
  alEscribirNombre,
  alEscribirApellido,
  alCrear,
}: {
  nombre: string;
  apellido: string;
  alEscribirNombre: (v: string) => void;
  alEscribirApellido: (v: string) => void;
  alCrear: () => void;
}) {
  const inicial = inicialDelApellido(apellido);
  return (
    <>
      <View style={{ gap: 9 }}>
        <View style={estilos.campo}>
          <TextInput
            accessibilityLabel="Tu nombre"
            value={nombre}
            onChangeText={alEscribirNombre}
            placeholder="Nombre"
            placeholderTextColor={color.ink400}
            style={estilos.entradaGrande}
          />
        </View>
        <View style={estilos.campo}>
          <TextInput
            accessibilityLabel="Tu apellido"
            value={apellido}
            onChangeText={alEscribirApellido}
            placeholder="Apellido"
            placeholderTextColor={color.ink400}
            style={estilos.entradaGrande}
          />
        </View>
      </View>

      <Text style={estilos.ayuda}>
        {inicial
          ? `En público se te verá como ${nombre.trim() || 'tu nombre'} ${inicial} — nunca el apellido completo.`
          : 'En público solo se ve tu nombre y la inicial del apellido — nunca el apellido completo.'}
      </Text>

      <View style={{ marginTop: 18 }}>
        <Boton tono="azul" desactivado={!nombre.trim() || !apellido.trim()} alPulsar={alCrear}>
          Crear mi cuenta
        </Boton>
      </View>
      <Text style={estilos.legal}>
        Al crear la cuenta aceptas los términos y el aviso de privacidad.
      </Text>
    </>
  );
}

function Paso({ numero, texto }: { numero: string; texto: string }) {
  return (
    <View style={estilos.filaPaso}>
      <View style={estilos.numeroPaso}>
        <Text style={estilos.numeroPasoTexto}>{numero}</Text>
      </View>
      <Text style={estilos.textoPaso}>{texto}</Text>
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
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  epigrafeCampo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -1.35,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
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
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefijoTexto: { fontSize: 16, lineHeight: 23.2, fontWeight: '500', color: color.ink700, fontFamily: familia },
  campo: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaGrande: {
    fontSize: 18, lineHeight: 26.1,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
    outlineStyle: 'none',
  } as never,
  ayuda: { fontSize: 13.5, lineHeight: 20, color: color.ink600, marginTop: 16, fontFamily: familia },
  ayudaCorta: { flex: 1, fontSize: 13.5, lineHeight: 19.57, color: color.ink600, fontFamily: familia, ...tabular },
  legal: { fontSize: 12.5, lineHeight: 18.125, color: color.ink500, marginTop: 12, textAlign: 'center', fontFamily: familia },

  casillas: { flexDirection: 'row', gap: 10 },
  casilla: {
    flex: 1,
    height: 74,
    borderRadius: radio.cuadrado,
    borderWidth: 1.5,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaTexto: {
    fontSize: 34, lineHeight: 49.3,
    fontWeight: '600',
    letterSpacing: -1.02,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cursor: { width: 2, height: 30, backgroundColor: color.rojo500 },
  entradaInvisible: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { marginTop: 12, fontSize: 12.5, lineHeight: 18.125, color: color.rojo700, fontFamily: familia },

  filaReenvio: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  enlace: { fontSize: 13.5, lineHeight: 19.57, fontWeight: '600', color: color.azul700, fontFamily: familia },
  reenviar: { fontSize: 13.5, lineHeight: 19.57, color: color.ink500, marginTop: 10, fontFamily: familia, ...tabular },

  loQueSigue: { marginTop: 16, gap: 10 },
  loQueSigueTitulo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  filaPaso: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  numeroPaso: {
    width: 22,
    height: 22,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroPasoTexto: { fontSize: 12, lineHeight: 17.4, fontWeight: '600', color: color.azul700, fontFamily: familia },
  textoPaso: { flex: 1, fontSize: 13.5, lineHeight: 19, color: color.ink700, fontFamily: familia },
});
