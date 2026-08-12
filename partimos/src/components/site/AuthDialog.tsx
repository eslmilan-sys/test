"use client";

import { useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/session";

/**
 * INSCRIPTION ET CONNEXION — l'écran NUIT.
 *
 * La logique vient des bons écrans d'auth (référence validée par le
 * propriétaire) : marque centrée, un grand titre, les champs avec leur
 * icône, UN bouton pilule, « o continúa con » Google/Apple — et la
 * bascule entre entrer et créer vit EN BAS, en une phrase (« ¿Todavía
 * no tienes cuenta? ») : l'écran ne montre qu'un chemin à la fois.
 *
 * L'habit est celui de la maison, pas celui de la référence copiée :
 * la nuit de Partimos (night-950, la même que Historias et le footer),
 * l'ambre en unique accent, et UN rectangle incliné en lueur sous le
 * titre. Le fond de page se floute : la carte est opaque à la lecture.
 *
 * On demande le MINIMUM : nom et un moyen de contact. Sans mot de
 * passe — un code par WhatsApp (recommandé), SMS ou correo. Pas de
 * cédula ici, pas de question de paiement : chaque chose à l'endroit
 * où elle a du contexte.
 */

type Step = "identity" | "code" | "done";
type Channel = "phone" | "email";
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

/** Les pilules du thème nuit — champs et boutons secondaires. */
const pill =
  "rounded-full border border-white/15 bg-white/10 text-white transition-colors";

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
        `${provider === "google" ? "Google" : "Apple"} llega al conectar la base — mientras tanto entra con tu celular o correo.`,
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
  }

  async function sendCode(): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    const supabase = getSupabase()!;
    const { error: authError } =
      channel === "phone"
        ? await supabase.auth.signInWithOtp({
            phone: e164,
            /* WhatsApp o SMS — el mismo código, el canal elegido.
               WhatsApp requiere el sender de Twilio en Supabase. */
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
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-night-950/70 backdrop-blur-[6px] motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[140] w-[calc(100vw-24px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-white/12 bg-night-950/95 text-white shadow-float backdrop-blur-xl motion-safe:animate-[sheet-in_0.22s_cubic-bezier(0.2,0.9,0.3,1)]">
          <div className="relative max-h-[90vh] overflow-y-auto rounded-[30px] px-6 pt-8 pb-6">
            {/* La lueur de la maison : UN rectangle ambre incliné, fondu
                dans la nuit derrière le titre. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 left-1/2 h-36 w-52 -translate-x-1/2 rotate-[-8deg] rounded-[28px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-[0.14] blur-2xl"
            />

            {step === "code" ? (
              <button
                type="button"
                aria-label="Volver"
                onClick={() => {
                  setStep("identity");
                  setCode("");
                }}
                className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <Icon name="arrowRight" className="size-4 rotate-180" />
              </button>
            ) : null}
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Icon name="cross" className="size-4" />
            </Dialog.Close>

            {/* La marque, centrée — l'écran appartient à Partimos. */}
            <p className="text-center font-display text-[17px] font-bold tracking-[-0.02em] text-white/85">
              Partimos
            </p>

            <Dialog.Title className="mx-auto mt-3 max-w-[16ch] text-center font-display text-[27px] leading-[1.12] font-extrabold tracking-[-0.03em]">
              {step === "code"
                ? "Escribe tu código"
                : step === "done"
                  ? "Casi listo"
                  : mode === "login"
                    ? "Conéctate — alguien ya va para allá"
                    : "Empieza aquí: crea tu cuenta"}
            </Dialog.Title>
            <Dialog.Description className="mx-auto mt-2 mb-6 max-w-[34ch] text-center text-[13.5px] leading-snug text-night-200">
              {step === "code"
                ? `Te mandamos seis dígitos a ${codeDestination}.`
                : step === "done"
                  ? "Un paso más y entras."
                  : mode === "login"
                    ? "Sin contraseña: un toque, o un código y listo."
                    : "Toma diez segundos. Sin contraseña, sin tarjeta."}
            </Dialog.Description>

            {step === "done" ? (
              <>
                <div className="rounded-[18px] border border-white/12 bg-white/8 px-5 py-4">
                  <p className="text-[13.5px] leading-snug text-night-200">
                    <b className="font-semibold text-white">
                      Modo demostración.
                    </b>{" "}
                    Todavía no sale ningún código. Al continuar abrimos una
                    sesión que vive solo en tu navegador, para recorrer la
                    reserva, la publicación y tu cuenta como serán de verdad.
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
                    className="mt-4 w-full rounded-full bg-action px-5 py-3.5 font-display text-[16px] font-bold text-ink-900 transition-opacity hover:opacity-90"
                  >
                    Continuar como {firstName.trim() || "invitado"}
                  </button>
                </Dialog.Close>
              </>
            ) : step === "identity" ? (
              <>
                <form
                  onSubmit={submitIdentity}
                  noValidate
                  className="flex flex-col gap-3.5"
                >
                  {mode === "register" && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <NightField
                        id={`${id}-first`}
                        label="Nombre"
                        icon="users"
                        value={firstName}
                        onChange={setFirstName}
                        autoComplete="given-name"
                        placeholder="Ana"
                        autoFocus
                      />
                      <NightField
                        id={`${id}-last`}
                        label="Apellido"
                        icon="users"
                        value={lastName}
                        onChange={setLastName}
                        autoComplete="family-name"
                        placeholder="Mora"
                        hideIcon
                      />
                    </div>
                  )}

                  <div>
                    <span className="mb-1.5 flex items-center justify-between text-[12.5px] font-semibold text-night-200">
                      {channel === "phone" ? "Celular" : "Correo"}
                      <button
                        type="button"
                        onClick={() => {
                          setChannel(channel === "phone" ? "email" : "phone");
                          setError("");
                        }}
                        className="font-semibold text-action/90 hover:underline"
                      >
                        {channel === "phone"
                          ? "usar mi correo"
                          : "usar mi celular"}
                      </button>
                    </span>
                    {channel === "phone" ? (
                      <label
                        htmlFor={`${id}-phone`}
                        className={`flex items-center gap-2.5 px-4 py-3 focus-within:border-action/70 ${pill}`}
                      >
                        <span className="sr-only">Tu celular</span>
                        <Icon
                          name="phone"
                          className="size-4.5 shrink-0 text-night-200"
                        />
                        <span className="tnum shrink-0 text-[15.5px] font-semibold text-night-200">
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
                          className="tnum w-full border-none bg-transparent text-[15.5px] font-semibold text-white placeholder:text-white/35 focus:outline-none"
                        />
                      </label>
                    ) : (
                      <NightField
                        id={`${id}-email`}
                        label="Correo"
                        icon="chat"
                        value={email}
                        onChange={setEmail}
                        type="email"
                        autoComplete="email"
                        placeholder="tu@correo.com"
                        hideLabel
                      />
                    )}
                  </div>

                  {channel === "phone" && (
                    <div
                      role="group"
                      aria-label="Por dónde llega el código"
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="text-[12.5px] text-night-200">
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
                          className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                            codeVia === value
                              ? "border-action bg-action text-ink-900"
                              : "border-white/15 bg-white/5 text-night-200 hover:border-white/35"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 w-full rounded-full bg-action px-5 py-3.5 font-display text-[16px] font-bold text-ink-900 transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Mandando…" : "Mandarme el código"}
                  </button>
                </form>

                <div
                  aria-hidden
                  className="my-4 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.1em] text-night-300 uppercase"
                >
                  <span className="h-px flex-1 bg-white/12" />
                  o continúa con
                  <span className="h-px flex-1 bg-white/12" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => social("google")}
                    disabled={busy}
                    className={`flex items-center justify-center gap-2.5 px-3 py-3 text-[14.5px] font-semibold hover:bg-white/20 disabled:opacity-60 ${pill}`}
                  >
                    <GoogleMark />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => social("apple")}
                    disabled={busy}
                    className={`flex items-center justify-center gap-2.5 px-3 py-3 text-[14.5px] font-semibold hover:bg-white/20 disabled:opacity-60 ${pill}`}
                  >
                    <AppleMark />
                    Apple
                  </button>
                </div>

                {/* La bascule, EN BAS et en une phrase : l'écran ne
                    montre qu'un chemin à la fois. */}
                <p className="mt-6 text-center text-[13.5px] text-night-200">
                  {mode === "login" ? (
                    <>
                      ¿Todavía no tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          setError("");
                        }}
                        className="font-bold text-white hover:underline"
                      >
                        Crear cuenta
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setError("");
                        }}
                        className="font-bold text-white hover:underline"
                      >
                        Conectarme
                      </button>
                    </>
                  )}
                </p>

                <p className="mt-3 text-center text-[11.5px] leading-snug text-night-300">
                  Al continuar aceptas los{" "}
                  <a href="/terminos" className="font-semibold text-white">
                    términos de uso
                  </a>{" "}
                  y el{" "}
                  <a
                    href="/privacidad"
                    className="font-semibold text-white"
                  >
                    aviso de privacidad
                  </a>
                  .
                </p>
              </>
            ) : (
              <form
                onSubmit={verify}
                noValidate
                className="flex flex-col gap-4"
              >
                <div
                  className="relative"
                  onClick={() => codeInput.current?.focus()}
                >
                  <div aria-hidden className="grid grid-cols-6 gap-2">
                    {Array.from({ length: CODE_LENGTH }, (_, i) => (
                      <span
                        key={i}
                        className={`tnum flex h-14 items-center justify-center rounded-[14px] border bg-white/8 font-display text-[24px] font-bold ${
                          i === code.length
                            ? "border-action"
                            : code[i]
                              ? "border-white/60"
                              : "border-white/15"
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

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-action px-5 py-3.5 font-display text-[16px] font-bold text-ink-900 transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Verificando…" : "Confirmar"}
                </button>

                <p className="text-center text-[13.5px] text-night-200">
                  ¿No te llegó?{" "}
                  <button
                    type="button"
                    onClick={resend}
                    disabled={busy}
                    className="font-bold text-white hover:underline disabled:opacity-60"
                  >
                    Reenviar el código
                  </button>
                </p>
              </form>
            )}

            {notice && (
              <p
                role="status"
                className="mt-3 rounded-[14px] border border-white/12 bg-white/8 px-4 py-2.5 text-[12.5px] leading-snug text-night-200"
              >
                {notice}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="mt-3 text-center text-[13px] font-medium text-[#FF9C90]"
              >
                {error}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NightField({
  id,
  label,
  icon,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  autoFocus,
  hideLabel = false,
  hideIcon = false,
}: {
  id: string;
  label: string;
  icon: "users" | "chat" | "phone";
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  hideLabel?: boolean;
  hideIcon?: boolean;
}) {
  return (
    <label htmlFor={id} className="block">
      <span
        className={
          hideLabel
            ? "sr-only"
            : "mb-1.5 block text-[12.5px] font-semibold text-night-200"
        }
      >
        {label}
      </span>
      <span
        className={`flex items-center gap-2.5 px-4 py-3 focus-within:border-action/70 ${pill}`}
      >
        {!hideIcon && (
          <Icon name={icon} className="size-4.5 shrink-0 text-night-200" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full border-none bg-transparent text-[15.5px] font-semibold text-white placeholder:text-white/35 focus:outline-none"
        />
      </span>
    </label>
  );
}
