"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Connexion par code SMS — pas de mot de passe (§3 du brief).
 *
 * Deux écrans : le numéro, puis le code à six chiffres. Le parcours réel
 * s'appuie sur l'OTP de Supabase Auth ; tant que le projet n'existe pas
 * (étape ⛔ HUMAIN), le formulaire le dit au lieu de faire semblant.
 *
 * Radix porte la partie invisible et pénible : piège de focus, restitution du
 * focus à la fermeture, `aria-modal`, fermeture à Échap, inertie du reste de
 * la page. C'est précisément le genre de composant qu'on écrit mal à la main.
 */

type Step = "phone" | "code" | "sent";

export function AuthDialog({ trigger }: { trigger: React.ReactNode }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("phone");
    setPhone("");
    setCode("");
    setError("");
  }

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 13) {
      setError("Escribe tu celular, por ejemplo 6123-4567.");
      return;
    }
    setError("");

    if (!isSupabaseConfigured) {
      setStep("sent");
      return;
    }

    setBusy(true);
    const supabase = getSupabase();
    const { error: authError } = await supabase!.auth.signInWithOtp({
      phone: digits.length <= 8 ? `+507${digits}` : `+${digits}`,
    });
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
    const supabase = getSupabase();
    const digits = phone.replace(/\D/g, "");
    const { error: authError } = await supabase!.auth.verifyOtp({
      phone: digits.length <= 8 ? `+507${digits}` : `+${digits}`,
      token: code,
      type: "sms",
    });
    setBusy(false);
    if (authError) {
      setError("Ese código no es correcto o ya venció.");
      return;
    }
    window.location.reload();
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-ink-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[120] w-[calc(100vw-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white p-6 shadow-float motion-safe:animate-[sheet-in_0.22s_cubic-bezier(0.2,0.9,0.3,1)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[22px] font-extrabold tracking-[-0.03em]">
                {step === "code" ? "Escribe tu código" : "Entrar a Partimos"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[14.5px] leading-relaxed text-ink-500">
                {step === "code"
                  ? `Te mandamos un código de seis dígitos al ${phone}.`
                  : "Sin contraseña. Te mandamos un código por SMS y listo."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Icon name="cross" className="size-4.5" />
            </Dialog.Close>
          </div>

          {step === "sent" ? (
            <div className="rounded-[16px] bg-ink-50 px-5 py-4">
              <p className="text-[14.5px] leading-relaxed text-ink-500">
                <b className="font-semibold text-ink-900">
                  Las cuentas todavía no están abiertas.
                </b>{" "}
                Estamos midiendo en qué rutas hay más gente esperando antes de
                abrir el registro. Puedes buscar viajes y calcular tu aporte sin
                cuenta.
              </p>
            </div>
          ) : step === "phone" ? (
            <form
              onSubmit={sendCode}
              noValidate
              className="flex flex-col gap-3"
            >
              <label htmlFor="auth-phone" className="sr-only">
                Tu número de celular
              </label>
              <div className="flex items-center gap-2.5 rounded-[14px] border border-ink-200 px-3.5 py-3 focus-within:border-accent">
                <span className="tnum shrink-0 text-[16px] font-semibold text-ink-500">
                  +507
                </span>
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  placeholder="6123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="tnum w-full border-none bg-transparent text-[16px] font-semibold focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg" full disabled={busy}>
                {busy ? "Mandando…" : "Mandarme el código"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} noValidate className="flex flex-col gap-3">
              <label htmlFor="auth-code" className="sr-only">
                Código de seis dígitos
              </label>
              <input
                id="auth-code"
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
                onClick={() => setStep("phone")}
                className="text-[13.5px] font-semibold text-accent-ink hover:underline"
              >
                Cambiar el número
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

          <p className="mt-4 border-t border-ink-200 pt-3.5 text-[12.5px] leading-relaxed text-ink-500">
            Tu número no se muestra a nadie hasta que tengas una reserva
            confirmada.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
