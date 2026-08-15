"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ChatThread } from "@/components/trip/ChatThread";
import { ALL_CITIES } from "@/lib/corridors";
import { formatUsd } from "@/lib/pricing";
import { formatDayLabel, formatTime, localIso } from "@/lib/trips";
import { bookingKey, useSession, type Booking } from "@/lib/session";
import { useAhora } from "@/lib/reloj";

/**
 * MIS VIAJES · MENSAJES · PERFIL — les trois écrans de compte de l'app.
 *
 * Ils vivent tous les trois sur `/cuenta`, distingués par `?panel=` :
 * la barre d'onglets pointe deux de ses quatre destinations ici, et
 * l'avatar de l'accueil la troisième. Une seule route, parce qu'une
 * seule source — la session — les nourrit toutes.
 *
 * CE QU'ILS NE FONT PAS. Aucun compteur inventé : les statistiques du
 * profil comptent des reservas réelles, et quand il n'y en a pas elles
 * affichent zéro plutôt qu'un chiffre flatteur. Un profil qui annonce
 * « 12 viajes » à quelqu'un qui n'en a fait aucun décrédibilise tout le
 * reste de l'écran.
 */

type Panel = "viajes" | "mensajes" | "perfil";

const nombre = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

/** Trois états, et ils se déduisent de l'heure — pas d'un champ à tenir
 *  à jour. Une reserva est « en curso » de l'heure de montée jusqu'à
 *  huit heures plus tard : au-delà, même le viaje le plus long du pays
 *  est arrivé. */
const DURACION_MAX_MS = 8 * 3_600_000;

type Estado = "proximo" | "curso" | "historial";

function estadoDe(b: Booking, ahora: number): Estado {
  const t = new Date(b.boardingAt).getTime();
  if (t > ahora) return "proximo";
  if (ahora - t < DURACION_MAX_MS) return "curso";
  return "historial";
}

export function Cuenta() {
  const params = useSearchParams();
  const { session } = useSession();
  const ahora = useAhora();

  const pedido = params.get("panel");
  const panel: Panel =
    pedido === "mensajes" || pedido === "perfil" ? pedido : "viajes";

  const reservas = useMemo(
    () =>
      [...(session?.bookings ?? [])].sort((a, b) =>
        a.boardingAt.localeCompare(b.boardingAt),
      ),
    [session?.bookings],
  );

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-4 pt-6">
        <p className="rounded-[18px] border border-ink-200 bg-white px-5 py-8 text-center text-[14px] leading-relaxed text-ink-500">
          Entra con tu correo para ver tus viajes, tus mensajes y tu perfil.
        </p>
      </div>
    );
  }

  if (panel === "perfil") return <Perfil reservas={reservas} ahora={ahora} />;
  if (panel === "mensajes") return <Mensajes reservas={reservas} />;
  return <MisViajes reservas={reservas} ahora={ahora} />;
}

/* ------------------------------------------------------------------ */
/* MIS VIAJES                                                          */
/* ------------------------------------------------------------------ */

const GRUPOS: { id: Estado; label: string }[] = [
  { id: "proximo", label: "Próximos" },
  { id: "curso", label: "En curso" },
  { id: "historial", label: "Historial" },
];

function MisViajes({
  reservas,
  ahora,
}: {
  reservas: Booking[];
  ahora: number | null;
}) {
  const [grupo, setGrupo] = useState<Estado>("proximo");

  /* Avant l'hydratation, `ahora` est nul : on ne classe rien plutôt que
     de classer avec une heure fausse, puis de tout redéplacer sous les
     yeux de l'utilisateur. */
  const cuenta = (g: Estado) =>
    ahora === null ? 0 : reservas.filter((b) => estadoDe(b, ahora) === g).length;

  const visibles =
    ahora === null ? [] : reservas.filter((b) => estadoDe(b, ahora) === grupo);

  /* Historial : le plus récent d'abord. Pour le reste, le plus proche. */
  const ordenadas =
    grupo === "historial" ? [...visibles].reverse() : visibles;

  /* Groupées par JOUR : « lunes 18 » une fois, puis ses viajes. Répéter
     la date sur chaque carte, c'est faire relire trois fois la même
     information pour trouver celle qui change. */
  const porDia = new Map<string, Booking[]>();
  for (const b of ordenadas) {
    const dia = localIso(new Date(b.boardingAt));
    porDia.set(dia, [...(porDia.get(dia) ?? []), b]);
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))]">
      <p className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.03em]">
        Mis viajes
      </p>

      <div
        role="group"
        aria-label="Qué viajes ver"
        className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        {GRUPOS.map((g) => {
          const n = cuenta(g.id);
          const on = grupo === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setGrupo(g.id)}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${
                on
                  ? "border-naranja bg-naranja text-white"
                  : "border-ink-200 bg-white text-ink-600"
              }`}
            >
              {g.label}
              <span className={`tnum ${on ? "text-white/80" : "text-ink-400"}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {ordenadas.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-ink-200 bg-white px-5 py-8 text-center">
          <p className="font-display text-[16.5px] font-bold">
            {grupo === "proximo"
              ? "No tienes viajes por delante"
              : grupo === "curso"
                ? "Nada en curso ahora mismo"
                : "Todavía no hay historial"}
          </p>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
            {grupo === "proximo"
              ? "Busca a dónde vas y reserva tu puesto: aparecerá aquí."
              : "Cuando estés viajando, tu viaje se queda aquí a la mano."}
          </p>
          {grupo === "proximo" && (
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-naranja px-5 py-2.5 text-[14px] font-bold text-white"
            >
              Buscar un viaje
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-5 pb-4">
          {[...porDia.entries()].map(([dia, lista]) => (
            <section key={dia}>
              <h2 className="mb-2 text-[12px] font-bold tracking-[0.08em] text-ink-400 uppercase">
                {formatDayLabel(dia)}
              </h2>
              <ul className="grid gap-2.5">
                {lista.map((b, i) => (
                  <TarjetaReserva key={`${b.tripId}-${b.boardingAt}-${i}`} b={b} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaReserva({ b }: { b: Booking }) {
  const ruta = `${nombre(b.from)} → ${nombre(b.to)}`;
  return (
    <li className="rounded-[18px] border border-ink-200 bg-white p-4">
      {/* Le lien ne couvre PAS la carte : le fil de discussion vit
          dedans, et un bouton dans un lien n'est pas cliquable de façon
          fiable — Safari suit le lien. */}
      <Link
        href={`/viaje/${b.tripId}?desde=${b.from}&hacia=${b.to}`}
        className="block"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="tnum font-display text-[15px] font-bold text-naranja">
            {formatTime(b.boardingAt)}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap ${
              b.status === "confirmado"
                ? "bg-verde-suave text-verde-ok"
                : "bg-naranja-suave text-naranja"
            }`}
          >
            {b.status === "confirmado" ? "Confirmado" : "Esperando respuesta"}
          </span>
        </span>
        <span className="mt-1 flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block font-display text-[17px] leading-tight font-bold">
              {ruta}
            </span>
            <span className="mt-0.5 block truncate text-[12.5px] text-ink-500">
              {b.seats} {b.seats === 1 ? "puesto" : "puestos"} · con{" "}
              {b.driverName}
            </span>
          </span>
          <span className="tnum shrink-0 font-display text-[18px] font-extrabold">
            {formatUsd(b.totalCents + b.feeCents)}
          </span>
        </span>
        <span className="mt-2 flex items-start gap-2 rounded-[12px] bg-ink-50 px-3 py-2 text-[12.5px] leading-snug text-ink-600">
          <Icon name="pin" className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
          Te recoge: {b.point}
        </span>
      </Link>
      <ChatThread
        bookingId={bookingKey(b)}
        otherName={b.driverName.split(" ")[0] ?? b.driverName}
        ruta={`${ruta} · ${formatDayLabel(localIso(new Date(b.boardingAt)))} ${formatTime(b.boardingAt)}`}
      />
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* MENSAJES                                                            */
/* ------------------------------------------------------------------ */

/**
 * UNE CONVERSATION PAR RESERVA — pas une par personne. Deux viajes avec
 * le même conducteur sont deux coordinations différentes : les fondre
 * mélangerait « je llego en 5 » de mardi avec le point de rendez-vous de
 * samedi.
 */
function Mensajes({ reservas }: { reservas: Booking[] }) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))]">
      <p className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.03em]">
        Mensajes
      </p>
      <p className="mt-1 text-[13px] leading-snug text-ink-500">
        Una conversación por reserva. Queda escrita: nadie puede cambiar un
        mensaje después.
      </p>

      {reservas.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-ink-200 bg-white px-5 py-8 text-center">
          <p className="font-display text-[16.5px] font-bold">
            Todavía no hay conversaciones
          </p>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
            Cuando reserves un puesto, aquí hablas con quien maneja — sin dar
            tu número.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2.5 pb-4">
          {reservas.map((b, i) => (
            <li
              key={`${b.tripId}-${b.boardingAt}-${i}`}
              className="rounded-[18px] border border-ink-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-verde-perfil font-display text-[16px] font-bold text-white">
                  {(b.driverName[0] ?? "?").toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[15.5px] font-bold">
                    {b.driverName}
                  </span>
                  <span className="tnum block truncate text-[12.5px] text-ink-500">
                    {nombre(b.from)} → {nombre(b.to)} ·{" "}
                    {formatDayLabel(localIso(new Date(b.boardingAt)))}{" "}
                    {formatTime(b.boardingAt)}
                  </span>
                </span>
              </div>
              <ChatThread
                bookingId={bookingKey(b)}
                otherName={b.driverName.split(" ")[0] ?? b.driverName}
                ruta={`${nombre(b.from)} → ${nombre(b.to)} · ${formatDayLabel(
                  localIso(new Date(b.boardingAt)),
                )} ${formatTime(b.boardingAt)}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PERFIL                                                              */
/* ------------------------------------------------------------------ */

const MENU: { href: string; label: string; icon: IconName }[] = [
  { href: "/cuenta", label: "Mis viajes", icon: "route" },
  { href: "/publicar/nuevo", label: "Publicar un viaje", icon: "plus" },
  { href: "/como-funciona", label: "Cómo funciona", icon: "compass" },
  { href: "/seguridad", label: "Seguridad", icon: "shield" },
  { href: "/ayuda", label: "Ayuda", icon: "chat" },
  { href: "/terminos", label: "Términos y privacidad", icon: "id" },
];

function Perfil({
  reservas,
  ahora,
}: {
  reservas: Booking[];
  ahora: number | null;
}) {
  const { session } = useSession();
  if (!session) return null;

  const hechos =
    ahora === null
      ? 0
      : reservas.filter((b) => estadoDe(b, ahora) === "historial").length;
  const proximos =
    ahora === null
      ? 0
      : reservas.filter((b) => estadoDe(b, ahora) !== "historial").length;
  const desde = new Date(session.since).getFullYear();

  return (
    <div className="pb-4">
      {/* L'EN-TÊTE VERT — la seule surface colorée de l'écran, et elle
          sert à identifier, pas à décorer. */}
      <header className="bg-verde-perfil px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-6 text-white">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-[26px] font-bold">
              {(session.firstName[0] ?? "?").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[22px] leading-tight font-extrabold tracking-[-0.03em]">
                {session.firstName} {session.lastInitial}.
              </p>
              <p className="mt-0.5 text-[13px] text-white/70">
                En Partimos desde {desde}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {session.isVerified ? (
              <Chip icon="shield">Cédula verificada</Chip>
            ) : (
              <Chip icon="id">Sin verificar</Chip>
            )}
            {session.affiliation && <Chip icon="briefcase">{session.affiliation}</Chip>}
            {session.payPref && (
              <Chip icon="cash">
                Prefiere{" "}
                {session.payPref === "yappy"
                  ? "Yappy"
                  : session.payPref === "tarjeta"
                    ? "tarjeta"
                    : "efectivo"}
              </Chip>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[520px] px-4">
        {/* LES CHIFFRES SONT COMPTÉS, PAS INVENTÉS. */}
        <ul className="-mt-4 grid grid-cols-2 gap-2.5">
          <Dato valor={hechos} label={hechos === 1 ? "viaje hecho" : "viajes hechos"} />
          <Dato
            valor={proximos}
            label={proximos === 1 ? "viaje por delante" : "viajes por delante"}
          />
        </ul>

        {!session.isVerified && (
          <Link
            href="/cuenta?panel=verificacion"
            className="mt-3 flex items-center gap-3 rounded-[18px] bg-naranja-suave p-4 transition-colors hover:bg-naranja-suave/70"
          >
            <Icon name="id" className="size-5 shrink-0 text-naranja" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[14.5px] font-bold text-naranja-hondo">
                Verifica tu cédula
              </span>
              <span className="block text-[12.5px] leading-snug text-ink-600">
                Los conductores aceptan antes a quien está verificado.
              </span>
            </span>
            <Icon name="arrowRight" className="size-4 shrink-0 text-naranja" />
          </Link>
        )}

        <ul className="mt-3 overflow-hidden rounded-[18px] border border-ink-200 bg-white">
          {MENU.map((m, i) => (
            <li key={m.href + m.label}>
              <Link
                href={m.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 ${
                  i > 0 ? "border-t border-ink-100" : ""
                }`}
              >
                <Icon name={m.icon} className="size-[19px] shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 text-[14.5px] font-semibold">
                  {m.label}
                </span>
                <Icon name="arrowRight" className="size-4 shrink-0 text-ink-300" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-3 px-1 text-[12px] leading-snug text-ink-400">
          Tu apellido completo no se muestra nunca en público: los demás ven{" "}
          {session.firstName} {session.lastInitial}.
        </p>
      </div>
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">
      <Icon name={icon} className="size-3.5" />
      {children}
    </span>
  );
}

function Dato({ valor, label }: { valor: number; label: string }) {
  return (
    <li className="rounded-[18px] border border-ink-200 bg-white px-4 py-3">
      <span className="tnum block font-display text-[24px] leading-none font-extrabold">
        {valor}
      </span>
      <span className="mt-1 block text-[12.5px] text-ink-500">{label}</span>
    </li>
  );
}
