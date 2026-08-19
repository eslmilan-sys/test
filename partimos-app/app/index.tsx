/**
 * Índice de trabajo: las pantallas que ya existen, en el orden de riesgo
 * acordado. Se borra cuando el recorrido esté completo y `3a` sea la entrada.
 */

import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { color, espacio, radio, texto } from '@/ui/tokens';

const HECHAS = [
  { id: '3a', titulo: 'Inicio', ruta: '/(pasajero)' as const },
  { id: '1b', titulo: 'Resultados', ruta: '/(pasajero)/resultados' as const },
  { id: '5a', titulo: 'Detalle del viaje', ruta: '/(pasajero)/viaje' as const },
  { id: '1c', titulo: 'La puerta', ruta: '/(cuenta)/puerta' as const },
  { id: '4b–4d', titulo: 'Registro', ruta: '/(cuenta)/registro' as const },
  { id: '5c', titulo: 'Publicar', ruta: '/(conductor)/publicar' as const },
  { id: '11a', titulo: 'Solicitudes de puesto', ruta: '/(conductor)/solicitudes' as const },
  { id: '7a', titulo: 'Reserva', ruta: '/(pasajero)/reservar' as const },
  { id: '7b', titulo: 'Pago del aporte', ruta: '/(pasajero)/pagar' as const },
  { id: '1f', titulo: 'Código de abordaje · pasajero', ruta: '/(pasajero)/codigo' as const },
  { id: '1g', titulo: 'Código de abordaje · conductor', ruta: '/(conductor)/abordaje' as const },
  { id: '1i', titulo: 'Llegada y liberación', ruta: '/(pasajero)/llegada' as const },
];

/** Lo siguiente, ya fuera del bloque de riesgo: el descubrimiento del pasajero. */
const PENDIENTES = ['6b  Perfil público', '6c  Chat del viaje', '1j  Calificar'];

export default function Indice() {
  return (
    <ScrollView contentContainerStyle={estilos.pagina}>
      <Text style={estilos.titulo}>Partimos</Text>
      <Text style={estilos.sub}>Pantallas del traspaso, por orden de riesgo.</Text>

      {HECHAS.map((p) => (
        <Link key={p.id} href={p.ruta} style={estilos.enlace}>
          <Text style={estilos.enlaceId}>{p.id}</Text>
          <Text style={estilos.enlaceTitulo}>{`   ${p.titulo}`}</Text>
        </Link>
      ))}

      <View style={{ marginTop: espacio.seccion }}>
        {PENDIENTES.map((p) => (
          <Text key={p} style={estilos.pendiente}>
            {p}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pagina: { padding: espacio.gutter, gap: espacio.entreTarjetas, maxWidth: 390, width: '100%', alignSelf: 'center' },
  titulo: { ...texto.titular, color: color.ink900 },
  sub: { ...texto.cuerpo, color: color.ink600, marginBottom: espacio.seccion },
  enlace: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: espacio.tarjeta,
  },
  enlaceId: { ...texto.epigrafe, color: color.rojo500 },
  enlaceTitulo: { ...texto.tituloTarjeta, color: color.ink900 },
  pendiente: { ...texto.cuerpo, color: color.ink400, paddingVertical: 6 },
});
