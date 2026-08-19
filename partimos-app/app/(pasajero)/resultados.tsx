/**
 * `1b` / `3b` Resultados — los viajes completos y sin cuenta.
 *
 * El pasajero ve precio, puestos, equipaje y quién maneja antes de registrarse.
 * La puerta está más adelante, al pedir puesto. Los filtros son los tres del
 * traspaso: acepta maletas, solo mujeres y método de pago.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import { type Filtros, buscarViajes, diaEnPanama, proximoDiaConViajes } from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Atras, Cerrar, Filtros as IconoFiltros } from '@/ui/iconos';
import { TarjetaDeViaje, type ViajeEnTarjeta } from '@/ui/TarjetaDeViaje';
import { familia, color, espacio, radio } from '@/ui/tokens';



export default function Resultados() {
  const router = useRouter();
  const [filtros, setFiltros] = useState<Filtros>({});
  const [viajes, setViajes] = useState<ViajeEnTarjeta[]>([]);
  const [dia, setDia] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    const fecha = await proximoDiaConViajes('panama', 'chitre');
    setDia(fecha);
    const encontrados = await buscarViajes('panama', 'chitre', fecha, filtros);
    setViajes(
      encontrados
        .map(
          (v): ViajeEnTarjeta => ({
            id: v.id!,
            salida: hora(v.departure_at!),
            duracion: duracion(v.departure_at!, v.arrival_estimate_at),
            aporteCentavos: Number(v.price_cents ?? 0),
            puestosLibres: v.seats_available ?? 0,
            origen: v.origin_label ?? '',
            destino: (v.destination_label ?? '').replace(' Unión', ''),
            llegada: v.arrival_estimate_at ? hora(v.arrival_estimate_at) : '',
            equipaje: etiquetaDeMaletero(v.accepts_luggage),
            conductor: {
              nombre: `${v.first_name ?? ''} ${v.last_initial ?? ''}`.trim(),
              calificacion: v.driver_rating ?? 0,
              carro: `${v.model ?? ''} ${v.color ?? ''}`.trim(),
            },
            canal: NOMBRE_DEL_CANAL.yappy_app,
          }),
        )
        .sort((a, b) => a.salida.localeCompare(b.salida)),
    );
  }, [filtros]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const alternar = (clave: keyof Filtros) =>
    setFiltros((f) => ({ ...f, [clave]: f[clave] ? undefined : true }));

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

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
          <View style={estilos.circulo}>
            <IconoFiltros />
          </View>
        </View>

        <Text style={estilos.titular}>
          {'Panamá'}
          {'\n'}
          <Text style={estilos.titularFuerte}>→ Chitré</Text>
        </Text>
        <Text style={estilos.subtitulo}>
          {`${cuandoTexto(dia)} · 1 puesto · ${viajes.length} ${viajes.length === 1 ? 'viaje' : 'viajes'}`}
        </Text>
      </View>

      <View style={estilos.filtros}>
        <Chip
          activo={!!filtros.aceptaMaletas}
          etiqueta="Acepta maletas"
          alPulsar={() => alternar('aceptaMaletas')}
        />
        <Chip
          activo={!!filtros.soloMujeres}
          etiqueta="Solo mujeres"
          alPulsar={() => alternar('soloMujeres')}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.filaSeccion}>
          <Epigrafe>{`Salidas de ${cuandoTexto(dia).toLowerCase()}`}</Epigrafe>
          <Text style={estilos.orden}>más temprano primero</Text>
        </View>

        {viajes.length === 0 ? (
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTitulo}>Nadie sale hoy con esos filtros.</Text>
            <Text style={estilos.vacioTexto}>Quita alguno o mira mañana.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {viajes.map((v) => (
              <TarjetaDeViaje
                key={v.id}
                viaje={v}
                alPulsar={() => router.push({ pathname: '/(pasajero)/viaje', params: { viaje: v.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({
  activo,
  etiqueta,
  alPulsar,
}: {
  activo: boolean;
  etiqueta: string;
  alPulsar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={etiqueta}
      onPress={alPulsar}
      style={[
        estilos.chip,
        activo
          ? { backgroundColor: color.azul100, borderColor: 'transparent', paddingRight: 5 }
          : { backgroundColor: color.blanco, borderColor: color.bordePorDefecto },
      ]}
    >
      <Text style={[estilos.chipTexto, { color: activo ? color.azul700 : color.ink700 }]}>
        {etiqueta}
      </Text>
      {activo ? (
        <View style={estilos.chipQuitar}>
          <Cerrar tamano={9} tinta="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

/** «Hoy», «Mañana» o el día, según cuándo salgan los viajes que hay. */
function cuandoTexto(dia: string | null): string {
  if (!dia) return 'Hoy';
  const hoy = diaEnPanama(new Date());
  if (dia === hoy) return 'Hoy';
  const manana = diaEnPanama(new Date(Date.now() + 86_400_000));
  return dia === manana ? 'Mañana' : dia;
}

function duracion(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  const minutos = Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingBottom: 24 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
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
  subtitulo: {
    fontSize: 14, lineHeight: 20.3,
    color: color.campoTexto,
    marginTop: 10,
    fontFamily: familia,
    ...tabular,
  },

  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: espacio.gutter },
  chip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipTexto: { fontSize: 13, lineHeight: 18.85, fontWeight: '500', fontFamily: familia },
  chipQuitar: {
    width: 21,
    height: 21,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul500,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lista: { paddingHorizontal: espacio.gutter, paddingTop: 18, paddingBottom: 26 },
  filaSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  orden: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },

  vacio: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 20,
    gap: 4,
  },
  vacioTitulo: { fontSize: 15, lineHeight: 21.75, fontWeight: '500', color: color.ink900, fontFamily: familia },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },
});
