"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ChatThread } from "@/components/trip/ChatThread";
import { ALL_CITIES } from "@/lib/corridors";
import { formatUsd } from "@/lib/pricing";
import { formatDayLabel, formatTime, localIso } from "@/lib/trips";
import { bookingKey, carsOf, useSession, type Booking } from "@/lib/session";
import { LEGAL_FOOTER } from "@/lib/content";
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

type Panel = "viajes" | "mensajes" | "perfil" | "verificacion" | "legal";

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
  const PANELES: Panel[] = [
    "viajes",
    "mensajes",
    "perfil",
    "verificacion",
    "legal",
  ];
  /* Un `?panel=` inconnu retombe sur Mis viajes plutôt que sur une page
     vide. C'est ce qui a mordu : la carte « Verifica tu cédula » pointait
     vers un panneau qui n'existait pas, et le bouton ne faisait
     visiblement rien. */
  const panel: Panel = PANELES.includes(pedido as Panel)
    ? (pedido as Panel)
    : "viajes";

  const reservas = useMemo(
    () =>
      [...(session?.bookings ?? [])].sort((a, b) =>
        a.boardingAt.localeCompare(b.boardingAt),
      ),
    [session?.bookings],
  );

  /* Pas de repli « conéctate » ici : la page pose `<Puerta>` autour de
     cet écran, et c'est ELLE qui montre la connexion. Deux endroits qui
     décident de la même chose finissent toujours par se contredire. */
  if (!session) return null;

  if (panel === "perfil") return <Perfil reservas={reservas} ahora={ahora} />;
  if (panel === "mensajes") return <Mensajes reservas={reservas} />;
  if (panel === "verificacion") return <Verificacion />;
  if (panel === "legal") return <Legal />;
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
/* VERIFICACIÓN                                                        */
/* ------------------------------------------------------------------ */

/**
 * QUATRE PIÈCES, PAS UNE — et elles ne se traitent pas pareil.
 *
 * Le propriétaire l'a dit en clair : il n'y a pas que la cédula. Pour
 * conduire il faut aussi le permis, la photo du carro et la plaque.
 *
 * MAIS LA RÈGLE R6 TIENT : aucune image de cédula n'est stockée, et le
 * permis est un document d'identité de la même famille. Ces deux-là
 * passent donc par le prestataire externe, qui nous rend DEUX choses —
 * passé ou non, et une référence de dossier. Ni l'image, ni le numéro.
 *
 * Le carro et la plaque, eux, ne sont pas des documents d'identité :
 * ils décrivent un véhicule, ils sont visibles dans la rue, et le
 * passager a besoin de les voir pour reconnaître la voiture qui
 * s'arrête. Ceux-là, nous les gardons.
 *
 * Les deux premières valent pour tout le monde ; les deux dernières ne
 * concernent que qui publie. Les demander à un passager serait
 * réclamer des papiers pour monter dans une voiture.
 */
type Pieza = {
  icon: IconName;
  titulo: string;
  texto: string;
  /** Qui doit la fournir. */
  para: "todos" | "conductor";
  /** Ce que nous conservons — dit à chaque ligne, parce que c'est la
   *  question que personne ne pose et que tout le monde se pose. */
  guardamos: string;
};

const PIEZAS: Pieza[] = [
  {
    icon: "id",
    titulo: "Cédula o pasaporte",
    texto:
      "Un proveedor certificado confirma que el documento es real y que corresponde a tu cara.",
    para: "todos",
    guardamos: "Solo si pasó, y una referencia del expediente.",
  },
  {
    icon: "car",
    titulo: "Licencia de conducir",
    texto:
      "Vigente y a tu nombre. La revisa el mismo proveedor, en el mismo paso.",
    para: "conductor",
    guardamos: "Solo si pasó, y una referencia del expediente.",
  },
  {
    icon: "camera",
    titulo: "Foto del carro",
    texto:
      "Como se ve por fuera. Es lo que mira el pasajero cuando un carro se detiene.",
    para: "conductor",
    guardamos: "La foto, visible en tu viaje.",
  },
  {
    icon: "hash",
    titulo: "Número de placa",
    texto:
      "Se le muestra al pasajero que ya reservó, nunca en la búsqueda abierta.",
    para: "conductor",
    guardamos: "La placa, visible tras reservar.",
  },
];

function Verificacion() {
  const { session } = useSession();
  const carros = session ? carsOf(session) : [];
  /* On n'invente aucun état : ce que la session sait, elle le dit ; ce
     qu'elle ignore reste « pendiente ». Un badge « vérifié » posé par
     défaut serait le pire mensonge possible sur cet écran. */
  const hecho = (p: Pieza) =>
    p.icon === "id"
      ? Boolean(session?.isVerified)
      : p.icon === "camera" || p.icon === "hash"
        ? carros.length > 0
        : false;

  const listas = PIEZAS.filter(hecho).length;

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-4">
      <Volver />
      <p className="mt-2 font-display text-[26px] leading-tight font-extrabold tracking-[-0.03em]">
        Verificación
      </p>
      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
        {listas} de {PIEZAS.length} listas. Las dos primeras valen para
        cualquiera; las dos últimas solo si publicas viajes.
      </p>

      <ul className="mt-4 grid gap-2.5">
        {PIEZAS.map((p) => {
          const ok = hecho(p);
          return (
            <li
              key={p.titulo}
              className="rounded-[18px] border border-ink-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-[13px] ${
                    ok ? "bg-verde-suave text-verde-ok" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  <Icon name={p.icon} className="size-[19px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[15.5px] font-bold">
                    {p.titulo}
                    {p.para === "conductor" && (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                        Si manejas
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-600">
                    {p.texto}
                  </p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug text-ink-400">
                    <Icon name="shield" className="mt-0.5 size-3.5 shrink-0" />
                    Guardamos: {p.guardamos}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                    ok
                      ? "bg-verde-suave text-verde-ok"
                      : "bg-naranja-suave text-naranja"
                  }`}
                >
                  {ok ? "Lista" : "Pendiente"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* CE QUE CE BOUTON FAIT VRAIMENT, aujourd'hui. Le prestataire
          n'est pas branché : le dire vaut mieux qu'un bouton qui tourne
          dans le vide. */}
      <p className="mt-3 rounded-[18px] bg-naranja-suave p-4 text-[13px] leading-relaxed text-ink-600">
        <b className="font-semibold text-naranja-hondo">
          La verificación se abre pronto.
        </b>{" "}
        El proveedor externo está en conexión. Mientras tanto puedes buscar,
        reservar y publicar: la insignia solo cambia cuánto te aceptan.
      </p>

      <Link
        href="/cuenta?panel=perfil"
        className="mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-ink-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-ink-600 transition-colors hover:border-naranja"
      >
        Volver a mi perfil
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LEGAL                                                               */
/* ------------------------------------------------------------------ */

/**
 * LE TEXTE DE CONFORMITÉ, DANS SA PAGE.
 *
 * Il était en pied de CHAQUE écran de l'app : six lignes de mentions
 * sous une liste de viajes, répétées vingt fois par jour. Sur un site
 * c'est la norme — une page web se lit une fois, et le pied porte les
 * mentions. Dans une app on revient sur les mêmes écrans sans arrêt, et
 * ce pavé devient du bruit qu'on apprend à ne plus voir : la pire chose
 * qui puisse arriver à un texte légal.
 *
 * Il n'a donc pas disparu — il a une adresse, et le profil y mène.
 */
function Legal() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-4">
      <Volver />
      <p className="mt-2 font-display text-[26px] leading-tight font-extrabold tracking-[-0.03em]">
        Legal
      </p>

      <div className="mt-4 rounded-[18px] border border-ink-200 bg-white p-4">
        <p className="font-display text-[15.5px] font-bold">Qué es Partimos</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
          {LEGAL_FOOTER}
        </p>
      </div>

      <ul className="mt-3 overflow-hidden rounded-[18px] border border-ink-200 bg-white">
        {[
          { href: "/terminos", label: "Términos de uso" },
          { href: "/privacidad", label: "Privacidad" },
          { href: "/seguridad", label: "Seguridad" },
        ].map((l, i) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 ${
                i > 0 ? "border-t border-ink-100" : ""
              }`}
            >
              <span className="min-w-0 flex-1 text-[14.5px] font-semibold">
                {l.label}
              </span>
              <Icon name="arrowRight" className="size-4 shrink-0 text-ink-300" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-3 px-1 text-[12px] leading-snug text-ink-400">
        © {new Date().getFullYear()} Partimos — hecho para las carreteras de
        Panamá
      </p>
    </div>
  );
}

/** Le retour vers le profil, en haut à gauche : un écran de réglages
 *  sans retour oblige à passer par la barre d'onglets, qui n'y mène pas. */
function Volver() {
  return (
    <Link
      href="/cuenta?panel=perfil"
      aria-label="Volver a mi perfil"
      className="-ml-1.5 flex size-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100"
    >
      <Icon name="arrowRight" className="size-5 rotate-180" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* PERFIL                                                              */
/* ------------------------------------------------------------------ */

const MENU: { href: string; label: string; icon: IconName }[] = [
  { href: "/cuenta", label: "Mis viajes", icon: "route" },
  { href: "/cuenta?panel=verificacion", label: "Verificación", icon: "id" },
  { href: "/publicar/nuevo", label: "Publicar un viaje", icon: "plus" },
  { href: "/como-funciona", label: "Cómo funciona", icon: "compass" },
  { href: "/seguridad", label: "Seguridad", icon: "shield" },
  { href: "/ayuda", label: "Ayuda", icon: "chat" },
  /* LE TEXTE LÉGAL A SA PAGE. Il traînait en bas de CHAQUE écran de
     l'app — six lignes de conformité sous une liste de viajes, à
     répétition. Il reste obligatoire, il reste lisible : il est ici. */
  { href: "/cuenta?panel=legal", label: "Legal", icon: "briefcase" },
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
