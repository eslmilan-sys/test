"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { AuthDialog } from "@/components/site/AuthDialog";
import { useSession } from "@/lib/session";

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
            el estado de tu verificación. Entrar toma diez segundos: te mandamos
            un código por SMS, sin contraseña.
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
                Entrar
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
          className="brand-gradient flex size-14 shrink-0 items-center justify-center rounded-full font-display text-[21px] font-bold text-white"
        >
          {session.firstName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.03em]">
            Hola, {session.firstName}
          </h1>
          <p className="tnum text-[13.5px] text-ink-500">{session.phone}</p>
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
              <Field label="Nombre" value={session.firstName} />
              <Field
                label="Celular"
                value={session.phone}
                note="No es público"
              />
              <Field label="Ciudad" value="Sin definir" />
              <Field label="Sobre mí" value="Sin definir" />
            </dl>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              Tu celular queda oculto hasta que tengas una reserva confirmada.
              Es una regla de la base de datos, no de la pantalla.
            </p>
          </>
        )}

        {tab === "carro" && (
          <Empty
            icon="car"
            title="No has registrado un carro"
            body="Para publicar un viaje hace falta el carro: marca, modelo, color, año y los tres últimos caracteres de la placa. No guardamos la placa completa."
            actions={
              <ButtonLink href="/publicar/nuevo">
                Publicar mi primer viaje
              </ButtonLink>
            }
          />
        )}

        {tab === "verificacion" && (
          <>
            <h2 className="mb-4 font-display text-[19px] font-bold">
              Verificación
            </h2>
            <ul className="grid gap-2.5">
              <Status
                done
                label="Celular confirmado"
                detail="Con el código que acabas de usar"
              />
              <Status
                done={session.isVerified}
                label="Cédula verificada"
                detail="La hace un proveedor certificado. No guardamos la imagen ni el número."
              />
            </ul>
            {!session.isVerified && (
              <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
                La verificación de cédula se activa cuando el proveedor esté
                contratado. Puedes buscar y reservar sin ella; para publicar sí
                hace falta.
              </p>
            )}
          </>
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
