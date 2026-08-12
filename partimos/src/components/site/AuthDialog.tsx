"use client";

import { useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/session";

/**
 * INSCRIPTION ET CONNEXION — la porte d'entrée, structurée.
 *
 * L'ordre des moyens va du moins cher au plus cher en effort :
 *
 *   1. **Google / Apple** — un toque, zéro saisie. Avec Supabase c'est
 *      l'OAuth natif ; sans, on le dit tel quel au lieu de le simuler.
 *   2. **Celular** — le code arrive par WhatsApp (recommandé : au Panama
 *      les SMS se perdent, WhatsApp jamais) ou par SMS, au choix.
 *   3. **Correo** — le code arrive par mail.
 *
 * On demande le MINIMUM : nom et un moyen de contact. Pas de mot de
 * passe, pas de cédula (vérification séparée, au moment de réserver ou
 * publier), et PAS de question de paiement ici — elle vivait dans ce
 * dialogue et n'avait aucun contexte ; elle se pose dans Mi cuenta et à
 * la première réservation, là où l'on voit les montants.
 *
 * Le code se tape dans six cases (une seule vraie <input> invisible
 * par-dessus : l'accessibilité et l'autofill d'un champ, le dessin de
 * six cases). Design : le verre de la maison, UN rectangle ambre
 * incliné derrière le titre — le motif, à dose homéopathique.
 */

type Step = "identity" | "code" | "done";
type Channel = "phone" | "email";
/** Par où arrive le code quand le contact est le celular. */
type CodeVia = "whatsapp" | "sms";
type Mode = "login" | "register";

const CODE_LENGTH = 6;

function GoogleMark({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleMark({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

export function AuthDialog({ trigger }: { trigger: React.ReactNode }) {
  const id = useId();
  const { signIn } = useSession();

  const [step, setStep] = useState<Step>("identity");
  const [mode, setMode] = useState<Mode>("login");
  const [channel, setChannel] = useState<Channel>("phone");
  const [codeVia, setCodeVia] = useState<CodeVia>("whatsapp");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("identity");
    setCode("");
    setError("");
    setNotice("");
  }

  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length <= 8 ? `+507${digits}` : `+${digits}`;

  function validate(): string {
    if (mode === "register" && firstName.trim().length < 2)
      return "Escribe tu nombre.";
    if (mode === "register" && lastName.trim().length < 2)
      return "Escribe tu apellido.";
    if (channel === "phone" && (digits.length < 7 || digits.length > 13))
      return "Escribe tu celular, por ejemplo 6123-4567.";
    if (
      channel === "email" &&
      !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())
    )
      return "Escribe un correo válido.";
    return "";
  }

  /** OAuth Google / Apple. Sans base connectée on l'annonce, sans le
   *  simuler : une fausse connexion Google serait un mensonge. */
  async function social(provider: "google" | "apple") {
    setError("");
    if (!isSupabaseConfigured) {
      setNotice(
        provider === "google"
          ? "Google llega al conectar la base — mientras tanto entra con tu celular o correo."
          : "Apple llega al conectar la base — mientras tanto entra con tu celular o correo.",
      );
      return;
    }
    setBusy(true);
    const supabase = getSupabase()!;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (authError) {
      setBusy(false);
      setError("No se pudo abrir la conexión. Inténtalo otra vez.");
    }
    // Sin error: el navegador ya va camino al proveedor.
  }

  async function sendCode(): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    const supabase = getSupabase()!;
    const { error: authError } =
      channel === "phone"
        ? await supabase.auth.signInWithOtp({
            phone: e164,
            /* WhatsApp o SMS — el mismo código, el canal que el usuario
               eligió. WhatsApp requiere el sender de Twilio configurado
               en Supabase (ver supabase/README). */
            options: { channel: codeVia },
          })
        : await supabase.auth.signInWithOtp({ email: email.trim() });
    if (authError) {
      setError("No pudimos mandar el código. Inténtalo otra vez.");
      return false;
    }
    return true;
  }

  async function submitIdentity(event: React.FormEvent) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setNotice("");

    if (!isSupabaseConfigured) {
      setStep("done");
      return;
    }
    setBusy(true);
    const ok = await sendCode();
    setBusy(false);
    if (ok) setStep("code");
  }

  async function resend() {
    setBusy(true);
    setError("");
    const ok = await sendCode();
    setBusy(false);
    if (ok)
      setNotice(
        channel === "email"
          ? "Código reenviado a tu correo."
          : codeVia === "whatsapp"
            ? "Código reenviado por WhatsApp."
            : "Código reenviado por SMS.",
      );
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) {
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

  const codeDestination =
    channel === "email"
      ? `tu correo ${email.trim()}`
      : codeVia === "whatsapp"
        ? `tu WhatsApp ${e164}`
        : `tu celular ${e164} por SMS`;

  return (
    <Dialog.Root onOpenChange={(open) => !open && reset()}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-night-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[120] max-h-[92vh] w-[calc(100vw-28px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-[26px] glass liquid [--glass-alpha:0.93] p-6 shadow-float motion-safe:animate-[sheet-in_0.22s_cubic-bezier(0.2,0.9,0.3,1)]">
          {/* Le motif de la maison : UN rectangle ambre incliné, glissé
              sous le coin du titre. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-6 -left-7 size-24 rotate-[-9deg] rounded-[22px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-25"
          />
          <div className="relative mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[24px] font-extrabold tracking-[-0.035em]">
                {step === "code"
                  ? "Escribe tu código"
                  : mode === "login"
                    ? "Qué bueno verte"
                    : "Crear mi cuenta"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[14.5px] leading-relaxed text-ink-500">
                {step === "code"
                  ? `Te mandamos seis dígitos a ${codeDestination}.`
                  : mode === "login"
                    ? "Sin contraseña: un toque, o un código y listo."
                    : "Toma diez segundos. Sin contraseña, sin tarjeta."}
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
              <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-500">
                ¿Manejas? Registra tu carro en{" "}
                <a
                  href="/cuenta"
                  className="font-semibold text-accent-ink hover:underline"
                >
                  Mi cuenta
                </a>{" "}
                — el modelo fija tu costo por kilómetro al publicar.
              </p>
            </>
          ) : step === "identity" ? (
            <div className="relative">
              {/* 1 — Un toque. */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => social("google")}
                  disabled={busy}
                  className="flex items-center justify-center gap-2.5 rounded-[14px] border border-ink-200 bg-white/80 px-3 py-3 text-[14.5px] font-semibold transition-colors hover:border-accent disabled:opacity-60"
                >
                  <GoogleMark />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => social("apple")}
                  disabled={busy}
                  className="flex items-center justify-center gap-2.5 rounded-[14px] border border-ink-200 bg-white/80 px-3 py-3 text-[14.5px] font-semibold transition-colors hover:border-accent disabled:opacity-60"
                >
                  <AppleMark />
                  Apple
                </button>
              </div>

              <div
                aria-hidden
                className="my-4 flex items-center gap-3 text-[12px] font-semibold tracking-[0.08em] text-ink-500 uppercase"
              >
                <span className="h-px flex-1 bg-ink-200" />
                o con un código
                <span className="h-px flex-1 bg-ink-200" />
              </div>

              {/* 2 — Le code, par le canal qu'on préfère. */}
              <form
                onSubmit={submitIdentity}
                noValidate
                className="flex flex-col gap-3"
              >
                <div
                  role="group"
                  aria-label="¿Ya tienes cuenta?"
                  className="flex rounded-xl bg-ink-50 p-0.5"
                >
                  {(
                    [
                      ["login", "Conectarme"],
                      ["register", "Crear cuenta"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={mode === value}
                      onClick={() => {
                        setMode(value);
                        setError("");
                      }}
                      className={`flex-1 rounded-[9px] px-3 py-2 text-[14px] font-semibold transition-colors ${
                        mode === value
                          ? "bg-white text-ink-900 shadow-[0_1px_4px_rgb(14_42_53/0.12)]"
                          : "text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {mode === "register" && (
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
                )}

                <div
                  role="group"
                  aria-label="Cómo te mandamos el código"
                  className="flex rounded-xl bg-ink-50 p-0.5"
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
                  <>
                    <label htmlFor={`${id}-phone`} className="block">
                      <span className="sr-only">Tu celular</span>
                      <span className="flex items-center gap-2.5 rounded-[14px] border border-ink-200 bg-white/80 px-3.5 py-3 focus-within:border-accent">
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
                    <div
                      role="group"
                      aria-label="Por dónde llega el código"
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="text-[12.5px] text-ink-500">
                        El código llega por
                      </span>
                      {(
                        [
                          ["whatsapp", "WhatsApp"],
                          ["sms", "SMS"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={codeVia === value}
                          onClick={() => setCodeVia(value)}
                          className={`rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                            codeVia === value
                              ? "border-ink-900 bg-ink-900 text-white"
                              : "border-ink-200 text-ink-500 hover:border-accent"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
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
            </div>
          ) : (
            <form onSubmit={verify} noValidate className="flex flex-col gap-4">
              {/* Six cases, une seule vraie input par-dessus : le focus,
                  l'autofill « one-time-code » et le lecteur d'écran vivent
                  sur l'input ; les cases ne font que dessiner. */}
              <div
                className="relative"
                onClick={() => codeInput.current?.focus()}
              >
                <div aria-hidden className="grid grid-cols-6 gap-2">
                  {Array.from({ length: CODE_LENGTH }, (_, i) => (
                    <span
                      key={i}
                      className={`tnum flex h-14 items-center justify-center rounded-[12px] border bg-white/80 font-display text-[24px] font-bold ${
                        i === code.length
                          ? "border-accent"
                          : code[i]
                            ? "border-ink-900"
                            : "border-ink-200"
                      }`}
                    >
                      {code[i] ?? ""}
                    </span>
                  ))}
                </div>
                <input
                  ref={codeInput}
                  aria-label="Código de seis dígitos"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
                    )
                  }
                  className="absolute inset-0 h-full w-full cursor-text opacity-0"
                />
              </div>

              <Button type="submit" size="lg" full disabled={busy}>
                {busy ? "Verificando…" : "Confirmar"}
              </Button>

              <div className="flex items-center justify-between text-[13.5px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identity");
                    setCode("");
                  }}
                  className="text-ink-500 hover:text-ink-900"
                >
                  Cambiar mis datos
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={busy}
                  className="text-accent-ink hover:underline disabled:opacity-60"
                >
                  Reenviar el código
                </button>
              </div>
            </form>
          )}

          {notice && (
            <p
              role="status"
              className="mt-3 rounded-[12px] bg-ink-50 px-4 py-2.5 text-[13px] leading-relaxed text-ink-500"
            >
              {notice}
            </p>
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
            <div className="relative mt-5 border-t border-ink-200 pt-4">
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
        className="w-full rounded-[14px] border border-ink-200 bg-white/80 px-3.5 py-3 text-[16px] font-semibold focus:border-accent focus:outline-none"
      />
    </label>
  );
}
