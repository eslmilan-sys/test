"use client";

import { useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/session";

/**
 * INSCRIPTION ET CONNEXION
 *
 * Trois principes, dans cet ordre.
 *
 * 1. **On demande le minimum, au moment où il sert.** Nom, prénom et un moyen
 *    de contact — rien d'autre. Pas de cédula ici : la vérification d'identité
 *    est une étape séparée, déclenchée au moment de réserver ou de publier.
 *    Demander un document à l'inscription fait fuir la moitié des gens avant
 *    qu'ils aient vu un seul trajet.
 *
 * 2. **Le contact est au choix : e-mail OU téléphone.** Le téléphone sert à
 *    coordonner le jour du viaje ; l'e-mail sert à retrouver son compte et à
 *    recevoir les alertes de route. On garde les deux quand on les a, on n'en
 *    exige qu'un.
 *
 * 3. **La vérification employeur est optionnelle et arrive après.** Un e-mail
 *    professionnel ou universitaire, ou LinkedIn, donne un badge et un filtre
 *    de recherche — pas un droit supplémentaire. C'est de la réassurance entre
 *    inconnus, pas un contrôle d'accès.
 */

type Step = "identity" | "code" | "done";
type Channel = "phone" | "email";

export function AuthDialog({ trigger }: { trigger: React.ReactNode }) {
  const id = useId();
  const { signIn } = useSession();

  const [step, setStep] = useState<Step>("identity");
  const [channel, setChannel] = useState<Channel>("phone");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("identity");
    setCode("");
    setError("");
  }

  const contact = channel === "phone" ? phone : email;
  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length <= 8 ? `+507${digits}` : `+${digits}`;

  function validate(): string {
    if (firstName.trim().length < 2) return "Escribe tu nombre.";
    if (lastName.trim().length < 2) return "Escribe tu apellido.";
    if (channel === "phone" && (digits.length < 7 || digits.length > 13))
      return "Escribe tu celular, por ejemplo 6123-4567.";
    if (
      channel === "email" &&
      !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())
    )
      return "Escribe un correo válido.";
    return "";
  }

  async function submitIdentity(event: React.FormEvent) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");

    if (!isSupabaseConfigured) {
      setStep("done");
      return;
    }

    setBusy(true);
    const supabase = getSupabase()!;
    const { error: authError } =
      channel === "phone"
        ? await supabase.auth.signInWithOtp({ phone: e164 })
        : await supabase.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);

    if (authError) {
      setError("No pudimos mandar el código. Inténtalo otra vez.");
      return;
    }
    setStep("code");
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (code.replace(/\D/g, "").length !== 6) {
      setError("El código tiene seis dígitos.");
      return;
    }
    setError("");
    setBusy(true);
    const supabase = getSupabase()!;
    const { error: authError } = await supabase.auth.verifyOtp(
      channel === "phone"
        ? { phone: e164, token: code, type: "sms" }
        : { email: email.trim(), token: code, type: "email" },
    );
    setBusy(false);
    if (authError) {
      setError("Ese código no es correcto o ya venció.");
      return;
    }
    window.location.reload();
  }

  return (
    <Dialog.Root onOpenChange={(open) => !open && reset()}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-ink-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[120] max-h-[92vh] w-[calc(100vw-28px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[26px] bg-white p-6 shadow-float motion-safe:animate-[sheet-in_0.22s_cubic-bezier(0.2,0.9,0.3,1)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[24px] font-extrabold tracking-[-0.035em]">
                {step === "code" ? "Escribe tu código" : "Entrar a Partimos"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[14.5px] leading-relaxed text-ink-500">
                {step === "code"
                  ? `Te mandamos un código de seis dígitos a ${contact}.`
                  : "Sin contraseña. Te mandamos un código y listo."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Icon name="cross" className="size-4.5" />
            </Dialog.Close>
          </div>

          {step === "done" ? (
            <>
              <div className="rounded-[16px] bg-ink-50 px-5 py-4">
                <p className="text-[14.5px] leading-relaxed text-ink-500">
                  <b className="font-semibold text-ink-900">
                    Modo demostración.
                  </b>{" "}
                  Todavía no sale ningún código. Al continuar abrimos una sesión
                  que vive solo en tu navegador, para recorrer la reserva, la
                  publicación y tu cuenta como serán de verdad.
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  onClick={() =>
                    signIn(
                      channel === "phone" ? e164 : email.trim(),
                      firstName.trim(),
                      lastName.trim(),
                    )
                  }
                  className="mt-4 w-full rounded-[14px] bg-ink-900 px-5 py-3.5 font-display text-[16px] font-bold text-white transition-colors hover:bg-ink-800"
                >
                  Continuar como {firstName.trim() || "invitado"}
                </button>
              </Dialog.Close>
            </>
          ) : step === "identity" ? (
            <form
              onSubmit={submitIdentity}
              noValidate
              className="flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <Field
                  id={`${id}-first`}
                  label="Nombre"
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                  autoFocus
                />
                <Field
                  id={`${id}-last`}
                  label="Apellido"
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                />
              </div>

              <div
                role="group"
                aria-label="Cómo te mandamos el código"
                className="mt-1 flex rounded-xl bg-ink-50 p-0.5"
              >
                {(
                  [
                    ["phone", "Celular"],
                    ["email", "Correo"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={channel === value}
                    onClick={() => {
                      setChannel(value);
                      setError("");
                    }}
                    className={`flex-1 rounded-[9px] px-3 py-2 text-[14px] font-semibold transition-colors ${
                      channel === value
                        ? "bg-white text-ink-900 shadow-[0_1px_4px_rgb(14_42_53/0.12)]"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {channel === "phone" ? (
                <label htmlFor={`${id}-phone`} className="block">
                  <span className="sr-only">Tu celular</span>
                  <span className="flex items-center gap-2.5 rounded-[14px] border border-ink-200 px-3.5 py-3 focus-within:border-accent">
                    <span className="tnum shrink-0 text-[16px] font-semibold text-ink-500">
                      +507
                    </span>
                    <input
                      id={`${id}-phone`}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="6123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="tnum w-full border-none bg-transparent text-[16px] font-semibold focus:outline-none"
                    />
                  </span>
                </label>
              ) : (
                <Field
                  id={`${id}-email`}
                  label="Correo"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  hideLabel
                />
              )}

              <Button type="submit" size="lg" full disabled={busy}>
                {busy ? "Mandando…" : "Mandarme el código"}
              </Button>

              <p className="text-center text-[12px] leading-relaxed text-ink-500">
                Al continuar aceptas los{" "}
                <a
                  href="/terminos"
                  className="font-semibold text-accent-ink hover:underline"
                >
                  términos de uso
                </a>{" "}
                y el{" "}
                <a
                  href="/privacidad"
                  className="font-semibold text-accent-ink hover:underline"
                >
                  aviso de privacidad
                </a>
                .
              </p>
            </form>
          ) : (
            <form onSubmit={verify} noValidate className="flex flex-col gap-3">
              <label htmlFor={`${id}-code`} className="sr-only">
                Código de seis dígitos
              </label>
              <input
                id={`${id}-code`}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="······"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="tnum rounded-[14px] border border-ink-200 px-3.5 py-3 text-center text-[24px] font-bold tracking-[0.4em] focus:border-accent focus:outline-none"
              />
              <Button type="submit" size="lg" full disabled={busy}>
                {busy ? "Verificando…" : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("identity")}
                className="text-[13.5px] font-semibold text-accent-ink hover:underline"
              >
                Cambiar mis datos
              </button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 text-[13.5px] font-medium text-danger"
            >
              {error}
            </p>
          )}

          {step === "identity" && (
            <div className="mt-5 border-t border-ink-200 pt-4">
              <p className="mb-2 text-[13px] font-semibold text-ink-900">
                Después, si quieres
              </p>
              <ul className="grid gap-2 text-[13px] leading-relaxed text-ink-500">
                <li className="flex items-start gap-2.5">
                  <Icon name="id" className="mt-0.5 size-4 shrink-0" />
                  Verificar tu cédula — hace falta para reservar y publicar
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
                  Conectar LinkedIn o tu correo de trabajo — te da una insignia
                  y un filtro, no privilegios
                </li>
              </ul>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  autoFocus,
  hideLabel = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label htmlFor={id} className="block">
      <span
        className={
          hideLabel
            ? "sr-only"
            : "mb-1 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
        }
      >
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-[14px] border border-ink-200 px-3.5 py-3 text-[16px] font-semibold focus:border-accent focus:outline-none"
      />
    </label>
  );
}
