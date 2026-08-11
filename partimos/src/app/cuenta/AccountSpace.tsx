"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { AuthDialog } from "@/components/site/AuthDialog";
import { carsOf, useSession, type SavedCar } from "@/lib/session";
import {
  getVerificationState,
  isSupabaseConfigured,
  startIdVerification,
  type VerificationState,
} from "@/lib/didit";
import { connectLinkedIn, hasLinkedIn } from "@/lib/linkedin";
import {
  CAR_MAKES,
  CAR_YEARS,
  agedConsumption,
  findCar,
  modelsForMake,
  rateFromConsumption,
} from "@/lib/cars";

/**
 * ESPACE COMPTE
 *
 * Quatre onglets, qui correspondent aux quatre tables où vit un utilisateur :
 * ses réservations, son profil, ses véhicules, sa vérification d'identité.
 *
 * Déconnecté, la page ne redirige pas : elle explique ce qu'on y trouve et
 * propose d'entrer. Une redirection sèche vers l'accueil fait perdre le fil à
 * qui a cliqué exprès sur « Mi cuenta ».
 */

type Tab = "viajes" | "perfil" | "carro" | "verificacion";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "viajes", label: "Mis viajes", icon: "route" },
  { id: "perfil", label: "Mi perfil", icon: "users" },
  { id: "carro", label: "Mi carro", icon: "car" },
  { id: "verificacion", label: "Verificación", icon: "shield" },
];

export function AccountSpace() {
  const { session, isDemo, signOut } = useSession();
  const [tab, setTab] = useState<Tab>("viajes");

  if (!session) {
    return (
      <Container className="pt-10">
        <div className="mx-auto max-w-[520px] rounded-[24px] border border-ink-200 bg-white p-7">
          <h1 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.03em]">
            Tu cuenta
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
            Aquí ves tus viajes reservados y publicados, tu perfil, tu carro y
            el estado de tu verificación. Conectarte toma diez segundos: te
            mandamos un código por SMS, sin contraseña.
          </p>

          <ul className="mb-6 grid gap-2.5">
            {TABS.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-[14px] bg-ink-50 px-4 py-3 text-[14.5px] font-medium"
              >
                <Icon name={t.icon} className="size-5 shrink-0 text-ink-500" />
                {t.label}
              </li>
            ))}
          </ul>

          <AuthDialog
            trigger={
              <button className="w-full rounded-[14px] bg-ink-900 px-7 py-4 font-display text-[17px] font-bold text-white transition-colors hover:bg-ink-800">
                Conectarme o crear cuenta
              </button>
            }
          />
          <p className="mt-4 text-center text-[13px] text-ink-500">
            Buscar viajes y calcular el aporte no necesita cuenta.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="pt-6">
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[20px] border border-ink-200 bg-white p-5">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full font-display text-[21px] font-bold text-ink-50 bg-ink-900"
        >
          {session.firstName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.03em]">
            Hola, {session.firstName}
          </h1>
          <p className="tnum text-[13.5px] text-ink-500">{session.contact}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-[12px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[14px] font-semibold transition-colors hover:border-accent hover:text-accent-ink"
        >
          Salir
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Secciones de la cuenta"
        className="mb-5 flex gap-1.5 overflow-x-auto pb-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              tab === t.id
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 bg-white text-ink-500 hover:border-accent"
            }`}
          >
            <Icon name={t.icon} className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6"
      >
        {tab === "viajes" && (
          <Empty
            icon="route"
            title="Todavía no tienes viajes"
            body="Cuando reserves un puesto o publiques un viaje, aparecen aquí con la hora, el punto de recogida y el número de la otra persona."
            actions={
              <>
                <ButtonLink href="/buscar">Buscar un viaje</ButtonLink>
                <ButtonLink href="/publicar/nuevo" variant="secondary">
                  Publicar un viaje
                </ButtonLink>
              </>
            }
          />
        )}

        {tab === "perfil" && (
          <>
            <h2 className="mb-4 font-display text-[19px] font-bold">
              Mi perfil
            </h2>
            <dl className="grid gap-3">
              <Field
                label="Nombre"
                value={`${session.firstName} ${session.lastName}`.trim()}
                note={`En público apareces como ${session.firstName} ${session.lastInitial}.`}
              />
              <Field
                label="Contacto"
                value={session.contact}
                note="No es público hasta que tengas una reserva confirmada"
              />
              <Field
                label="Trabajo o universidad"
                value={session.affiliation ?? "Sin conectar"}
                note="Da una insignia y un filtro de búsqueda, no privilegios"
              />
              <Field label="Ciudad" value="Sin definir" />
              <Field label="Sobre mí" value="Sin definir" />
            </dl>

            <LinkedInRow />

            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              Tu celular queda oculto hasta que tengas una reserva confirmada.
              Es una regla de la base de datos, no de la pantalla.
            </p>
          </>
        )}

        {tab === "carro" && <CarPanel />}

        {tab === "verificacion" && (
          <VerificacionPanel sessionVerified={session.isVerified} />
        )}
      </div>

      {isDemo && (
        <p className="mt-5 text-center text-[12.5px] text-ink-500">
          Modo demostración: esta sesión vive solo en tu navegador y no crea
          ninguna cuenta.{" "}
          <Link
            href="/ayuda"
            className="font-semibold text-accent-ink hover:underline"
          >
            Cómo funcionará de verdad
          </Link>
        </p>
      )}
    </Container>
  );
}

/**
 * Onglet Mi carro — le véhicule se déclare UNE fois, ici.
 *
 * Marque, modèle et année sortent du catalogue : c'est ce qui fixe le taux
 * au km à la publication (un carro qui consomme plus a un tope plus haut —
 * le coût, jamais la demande). La photo rassure le passager qui cherche le
 * bon carro au point de rencontre. Elle est compressée côté client (~800 px
 * JPEG) avant d'entrer en session : en démonstration elle vit dans le
 * navigateur, avec Supabase elle partira dans le bucket Storage `carros`.
 */
function CarPanel() {
  const { session, updateSession } = useSession();
  const cars = carsOf(session);
  const [editing, setEditing] = useState(cars.length === 0);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2020);
  const [color, setColor] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const ref = findCar(make, model);
  const l100 = ref ? agedConsumption(ref.l100, year) : null;
  const rate = l100 !== null ? rateFromConsumption(l100) : null;

  const saveCars = (next: SavedCar[]) => {
    /* `car` reste synchronisé sur le premier : les vieilles sessions et
       tout code qui lirait encore le champ hérité voient la même chose. */
    updateSession({ cars: next, car: next[0] ?? null });
  };

  const addCar = () => {
    saveCars([
      ...cars,
      { make, model, year, color: color.trim(), photoDataUrl: photo },
    ]);
    setMake("");
    setModel("");
    setColor("");
    setPhoto(null);
    setEditing(false);
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await shrinkPhoto(file));
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <>
      <h2 className="mb-1.5 font-display text-[19px] font-bold">
        {cars.length === 1 ? "Mi carro" : "Mis carros"}
      </h2>
      <p className="mb-4 text-[14px] leading-relaxed text-ink-500">
        Se registran una vez y quedan listos para publicar. Al publicar eliges
        cuál llevas; si tienes uno solo, va ese. El modelo y el año fijan tu
        costo por kilómetro.
      </p>

      {cars.length > 0 && (
        <ul className="mb-5 grid gap-3">
          {cars.map((c, i) => {
            const cRef = findCar(c.make, c.model);
            const cRate = cRef
              ? rateFromConsumption(agedConsumption(cRef.l100, c.year))
              : null;
            return (
              <li
                key={`${c.make}-${c.model}-${c.year}-${i}`}
                className="flex flex-wrap items-center gap-4 rounded-[16px] border border-ink-200 px-4 py-3.5"
              >
                {c.photoDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- data URL locale */
                  <img
                    src={c.photoDataUrl}
                    alt={`${c.make} ${c.model} ${c.color}`}
                    className="h-16 w-24 rounded-[12px] border border-ink-200 object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-24 items-center justify-center rounded-[12px] bg-ink-50 text-ink-500">
                    <Icon name="car" className="size-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15.5px] font-semibold">
                    {c.make} {c.model} {c.year}
                  </p>
                  <p className="tnum text-[13px] text-ink-500 capitalize">
                    {c.color}
                    {cRate !== null &&
                      ` · $${(cRate / 100).toFixed(2)} por km`}
                  </p>
                </div>
                <button
                  onClick={() => saveCars(cars.filter((_, j) => j !== i))}
                  className="text-[13px] font-semibold text-ink-500 transition-colors hover:text-danger"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
        >
          {cars.length === 0 ? "Registrar mi carro" : "Agregar otro carro"}
        </button>
      ) : (
        <div className={cars.length > 0 ? "border-t border-ink-200 pt-5" : ""}>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel("");
              }}
              aria-label="Marca del carro"
              className={accountSelect()}
            >
              <option value="">Marca…</option>
              {CAR_MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make}
              aria-label="Modelo del carro"
              className={accountSelect()}
            >
              <option value="">Modelo…</option>
              {modelsForMake(make).map((m) => (
                <option key={m.model} value={m.model}>
                  {m.model}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={!ref}
              aria-label="Año del carro"
              className={accountSelect()}
            >
              {CAR_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Color (gris, blanco…)"
            aria-label="Color del carro"
            className="mt-2 w-full rounded-[12px] border-[1.5px] border-ink-200 px-3.5 py-2.5 text-[14.5px] font-semibold placeholder:font-normal placeholder:text-ink-400 focus:border-accent focus:outline-none sm:max-w-[calc((100%-1rem)/3)]"
          />

          {ref && l100 !== null && rate !== null && (
            <p className="tnum mt-2.5 rounded-[12px] bg-ink-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-500">
              <b className="font-semibold text-ink-900">
                {make} {model} {year}
              </b>
              {" — consumo de referencia ~"}
              {l100.toFixed(1).replace(".", ",")} L/100 km, o sea{" "}
              <b className="font-semibold text-ink-900">
                ${(rate / 100).toFixed(2)} por km
              </b>
              .
            </p>
          )}

          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-ink-900">
              Foto del carro
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {photo ? (
                /* eslint-disable-next-line @next/next/no-img-element -- data URL locale */
                <img
                  src={photo}
                  alt="Foto elegida de tu carro"
                  className="h-24 w-36 rounded-[12px] border border-ink-200 object-cover"
                />
              ) : (
                <span className="flex h-24 w-36 items-center justify-center rounded-[12px] border-2 border-dashed border-ink-200 text-ink-400">
                  <Icon name="car" className="size-7" />
                </span>
              )}
              <label className="cursor-pointer rounded-[12px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:border-accent hover:text-accent-ink">
                {photoBusy
                  ? "Procesando…"
                  : photo
                    ? "Cambiar foto"
                    : "Subir foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onPhoto(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-2 text-[12.5px] leading-snug text-ink-500">
              Una sola foto, del exterior. Nada de placa completa: en tu perfil
              público solo aparecen el modelo, el color y la foto.
            </p>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              disabled={!ref}
              onClick={addCar}
              className="rounded-[14px] bg-ink-900 px-6 py-3 font-display text-[15px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
            >
              Guardar este carro
            </button>
            {cars.length > 0 && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function accountSelect() {
  return [
    "w-full appearance-none rounded-[12px] border-[1.5px] border-ink-200 bg-white",
    "px-3.5 py-2.5 text-[14.5px] font-semibold text-ink-900 transition-colors",
    "hover:border-accent focus:border-accent focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}

/** Compresse la photo côté client : 800 px max, JPEG qualité 0,72. Une photo
 *  de téléphone fait 3–8 Mo ; en session `localStorage` (~5 Mo au total),
 *  seule une version réduite tient — et c'est aussi tout ce que l'affichage
 *  demande. */
async function shrinkPhoto(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const scale = Math.min(1, 800 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

/**
 * LinkedIn au profil — une insigne, pas un privilège.
 *
 * Avec Supabase configuré, `linkIdentity` attache l'identité LinkedIn au
 * compte déjà connecté (OTP) et redirige vers l'OAuth. En démonstration,
 * on l'annonce comme à venir — sans le simuler.
 */
function LinkedInRow() {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    hasLinkedIn().then((v) => {
      if (!cancelled) setConnected(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = async () => {
    setBusy(true);
    setError(null);
    const result = await connectLinkedIn();
    if (result?.error) {
      setBusy(false);
      setError("No se pudo conectar LinkedIn. Intenta de nuevo.");
    }
    // Sin error: el navegador ya va camino a LinkedIn.
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-ink-200 px-4 py-3">
      <Icon name="briefcase" className="size-5 shrink-0 text-ink-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold">
          LinkedIn
          {connected && (
            <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-bold text-white">
              Conectado
            </span>
          )}
        </p>
        <p className="text-[12.5px] leading-snug text-ink-500">
          {connected
            ? "Tu perfil muestra la insignia profesional."
            : "Da una insignia en tu perfil público. No copiamos nada de tu perfil de LinkedIn — solo que está conectado."}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
      {!connected &&
        (isSupabaseConfigured ? (
          <button
            onClick={connect}
            disabled={busy}
            className="rounded-[12px] border-[1.5px] border-ink-200 px-4 py-2 text-[13.5px] font-semibold transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-60"
          >
            {busy ? "Abriendo…" : "Conectar"}
          </button>
        ) : (
          <span className="text-[12.5px] font-semibold text-ink-500">
            Disponible al conectar la base
          </span>
        ))}
    </div>
  );
}

/**
 * Onglet Verificación — la cédula pasa por Didit, nunca por nosotros.
 *
 * Con Supabase configurado, el botón pide a la función Edge `didit-start`
 * una sesión de verificación y redirige al recorrido alojado de Didit ;
 * el veredicto vuelve por webhook y aquí solo se lee un estado. En modo
 * demostración no hay backend : el panel lo dice tal cual, sin fingir.
 */
function VerificacionPanel({ sessionVerified }: { sessionVerified: boolean }) {
  const [remote, setRemote] = useState<VerificationState | null>(null);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    getVerificationState().then((state) => {
      if (!cancelled) setRemote(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const status = remote?.status ?? "none";
  const verified = sessionVerified || status === "verified";
  const pending = status === "pending";

  const launch = async () => {
    setLaunching(true);
    setError(null);
    const result = await startIdVerification();
    if ("url" in result) {
      window.location.assign(result.url);
      return;
    }
    setLaunching(false);
    setError(
      result.error === "already_verified"
        ? "Tu cédula ya está verificada."
        : "No se pudo abrir la verificación. Intenta de nuevo en un momento.",
    );
  };

  return (
    <>
      <h2 className="mb-4 font-display text-[19px] font-bold">Verificación</h2>
      <ul className="grid gap-2.5">
        <Status
          done
          label="Celular confirmado"
          detail="Con el código que acabas de usar"
        />
        <Status
          done={verified}
          label={
            pending ? "Cédula en revisión" : "Cédula verificada"
          }
          detail={
            pending
              ? "Didit está revisando tu documento. El resultado aparece aquí solo."
              : "La hace Didit, un proveedor certificado. No guardamos la imagen ni el número — solo el resultado."
          }
        />
      </ul>

      {!verified && !pending && isSupabaseConfigured && (
        <div className="mt-4">
          <button
            onClick={launch}
            disabled={launching}
            className="rounded-[14px] bg-ink-900 px-6 py-3.5 font-display text-[15.5px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {launching ? "Abriendo…" : "Verificar mi cédula"}
          </button>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
            Te lleva al recorrido seguro de Didit: foto de la cédula y una
            selfie, dos minutos. Al terminar vuelves aquí.
            {status === "rejected" &&
              " Tu intento anterior no pasó; puedes volver a intentarlo."}
            {status === "expired" &&
              " Tu intento anterior expiró; puedes volver a empezar."}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-[13.5px] font-semibold text-danger">
              {error}
            </p>
          )}
        </div>
      )}

      {!verified && !isSupabaseConfigured && (
        <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
          La verificación la hará Didit, un proveedor certificado: nosotros
          nunca vemos ni guardamos tu cédula, solo el resultado. En esta
          demostración todavía no está conectada. Puedes buscar y reservar sin
          ella; para publicar sí hace falta.
        </p>
      )}
    </>
  );
}

function Empty({
  icon,
  title,
  body,
  actions,
}: {
  icon: IconName;
  title: string;
  body: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="py-4 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-ink-50 text-ink-500">
        <Icon name={icon} className="size-6" />
      </span>
      <h2 className="mb-2 font-display text-[19px] font-bold">{title}</h2>
      <p className="mx-auto mb-5 max-w-[46ch] text-[14.5px] leading-relaxed text-ink-500">
        {body}
      </p>
      <div className="flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-200 pb-2.5 last:border-0">
      <dt className="text-[13.5px] text-ink-500">{label}</dt>
      <dd className="text-right">
        <span className="block text-[15px] font-semibold">{value}</span>
        {note && <span className="block text-[12px] text-ink-500">{note}</span>}
      </dd>
    </div>
  );
}

function Status({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-[14px] border border-ink-200 px-4 py-3">
      <span
        aria-hidden
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-ink-900 text-white" : "border-2 border-ink-200"
        }`}
      >
        {done && <Icon name="check" className="size-3.5" />}
      </span>
      <span>
        <span className="block text-[15px] font-semibold">
          {label}
          <span className="sr-only">
            {done ? " — completado" : " — pendiente"}
          </span>
        </span>
        <span className="block text-[13px] leading-snug text-ink-500">
          {detail}
        </span>
      </span>
    </li>
  );
}
