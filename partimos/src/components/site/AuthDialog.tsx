"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import {
  fetchProveedores,
  getSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { track } from "@/lib/analytics";
import { readPastedAuth } from "@/lib/otp-link";

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
  /* Le courriel par défaut : c'est le seul canal qui marche sans
     fournisseur SMS branché. Le celular reste choisissable — et le dit
     clairement s'il échoue. */
  const [channel, setChannel] = useState<Channel>("email");
  const [codeVia, setCodeVia] = useState<CodeVia>("whatsapp");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  /* LE MOT DE PASSE. Le site était « sin contraseña », et sur le papier
     c'est plus simple — sauf que le seul chemin passait alors par le
     courriel, et le courriel est le maillon qui casse : quota de deux
     envois par heure, gabarit qu'on ne peut pas changer, liens qui
     expirent. Un mot de passe, lui, marche hors ligne, tout de suite, et
     sur n'importe quel appareil. Le lien par courriel reste, en secours. */
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  /* Le chemin par courriel devient l'exception qu'on demande. */
  const [porEnlace, setPorEnlace] = useState(false);
  const [code, setCode] = useState("");
  /* Ce que la personne colle quand son courriel contient un LIEN et pas
     un code. Tant que le gabarit du courriel n'a pas été corrigé dans le
     tableau de bord, c'est la seule façon d'entrer — et même après, un
     client courriel qui masque le code laissera toujours le lien. */
  const [pasted, setPasted] = useState("");
  /* Par courriel, les six cases ne s'affichent QUE si on les demande : le
     gabarit d'origine de Supabase n'envoie pas de chiffres, et six cases
     vides devant un courriel qui n'en contient pas, c'est une porte
     peinte sur un mur. Par téléphone, le code est bien un code. */
  const [verCodigo, setVerCodigo] = useState(false);
  /* Le quota d'envois de Supabase est minuscule et partagé par tout le
     site : on empêche de le brûler à coups de « reenviar ». */
  const [puedeReenviar, setPuedeReenviar] = useState(true);
  /* `null` = on ne sait pas encore ; on montre tout, comme avant. */
  const [proveedores, setProveedores] = useState<{
    google: boolean;
    apple: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);

  /* La configuration publique de Supabase dit quels boutons sociaux
     existent vraiment. Requête unique, asynchrone : elle ne bloque rien
     et, si elle échoue, l'écran reste tel qu'il était. */
  useEffect(() => {
    let vivo = true;
    void fetchProveedores().then((p) => {
      if (vivo && p) setProveedores(p);
    });
    return () => {
      vivo = false;
    };
  }, []);

  function reset() {
    setStep("identity");
    setCode("");
    setPasted("");
    setVerCodigo(false);
    setError("");
    setNotice("");
  }

  /* Le mot de passe ne vaut que pour le courriel : par téléphone, le code
     reste le seul moyen. Et « por enlace » le désactive volontairement. */
  const usaPassword = channel === "email" && !porEnlace;

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
    if (usaPassword && password.length < 8)
      return "La contraseña necesita al menos ocho caracteres.";
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
    /* Le prénom voyage AVEC la demande de code : c'est le déclencheur
       `handle_new_user` (migration 0017) qui le lit pour créer le
       profil. Sans ça, la personne s'appellerait « Viajero » sur son
       propre compte. */
    const data = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      locale: "es",
    };
    /* « Entrar » n'invente pas de compte. Sans ça, se tromper d'adresse en
       se connectant créait silencieusement un deuxième compte vide — et la
       personne jurait avoir perdu ses viajes. Créer, c'est le rôle de
       « crear cuenta », et de lui seul. */
    const shouldCreateUser = mode === "register";
    const { error: authError } =
      channel === "phone"
        ? await supabase.auth.signInWithOtp({
            phone: e164,
            /* WhatsApp o SMS — el mismo código, el canal elegido.
               WhatsApp requiere el sender de Twilio en Supabase. */
            options: { channel: codeVia, data, shouldCreateUser },
          })
        : await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              data,
              shouldCreateUser,
              /* Où le lien du courriel doit RETOMBER. Sans ça, Supabase
                 renvoie sur son « Site URL » — et si celui-ci est resté
                 sur localhost, le lien meurt dans le téléphone de la
                 personne. On donne donc l'adresse d'ici, celle du site
                 réellement ouvert : elle sera juste en production comme
                 en développement. (Elle doit figurer dans la liste des
                 « Redirect URLs » du tableau de bord, sinon Supabase
                 retombe sur le Site URL.) */
              emailRedirectTo: window.location.href,
            },
          });
    if (authError) {
      /* CHAQUE PANNE A SON NOM. « Inténtalo otra vez » était le pire des
         messages : il invite à refaire exactement ce qui vient d'échouer.
         Sur la limite d'envoi, il fait même du mal — chaque nouvel essai
         repousse le déblocage. */
      const codigo = (authError as { code?: string }).code ?? "";
      const status = (authError as { status?: number }).status ?? 0;

      if (codigo === "over_email_send_rate_limit" || status === 429) {
        setError(
          "El servidor de correo llegó a su tope de envíos por hora y está esperando. No sirve de nada volver a intentar ahora: espera un rato, o revisa si ya te llegó un correo de antes — todavía sirve.",
        );
        return false;
      }
      const noExiste =
        !shouldCreateUser &&
        /signup|not found|user.*exist/i.test(authError.message);
      if (noExiste) {
        setError(
          "No hay cuenta con esos datos. Crea tu cuenta aquí abajo, toma diez segundos.",
        );
        setMode("register");
        return false;
      }
      setError(
        channel === "phone"
          ? "Todavía no podemos mandar códigos por celular. Entra con tu correo mientras tanto."
          : "No pudimos mandar el correo. Espera un momento y vuelve a intentar.",
      );
      return false;
    }
    /* Un envoi réussi ferme la porte une minute. Le quota d'envois est
       petit et partagé par TOUT le site : chaque « reenviar » impatient le
       brûlait pour la personne suivante. */
    setPuedeReenviar(false);
    window.setTimeout(() => setPuedeReenviar(true), 60_000);
    return true;
  }

  /**
   * ENTRER, PAR LE CHEMIN LE PLUS COURT QUI MARCHE.
   *
   * Avec un mot de passe, personne n'attend un courriel : on entre. Sans
   * mot de passe (celular, ou « por enlace »), on retombe sur le code.
   * À l'inscription, si Supabase rend une session tout de suite, on est
   * dedans ; s'il exige une confirmation, on passe à l'écran du courriel.
   */
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

    if (usaPassword) {
      setBusy(true);
      const ok = await conPassword();
      setBusy(false);
      return void ok;
    }

    setBusy(true);
    const ok = await sendCode();
    setBusy(false);
    if (ok) setStep("code");
  }

  /** Entrer ou créer le compte avec un mot de passe. */
  async function conPassword(): Promise<boolean> {
    const supabase = getSupabase()!;

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!authError) {
        window.location.reload();
        return true;
      }
      const codigo = (authError as { code?: string }).code ?? "";
      if (codigo === "email_not_confirmed") {
        setError(
          "Tu correo todavía no está confirmado. Te mandamos el enlace de confirmación: ábrelo y vuelve.",
        );
        setPorEnlace(true);
        return false;
      }
      /* Le cas le plus fréquent, et de loin : le compte existe (créé par
         un lien magique) mais n'a jamais eu de mot de passe. On ne dit
         donc pas « mot de passe incorrect » tout sec — on montre la
         sortie de secours. */
      setError(
        "Correo o contraseña incorrectos. Si nunca pusiste una contraseña, entra con el enlace por correo y luego créala en tu cuenta.",
      );
      return false;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          locale: "es",
        },
        emailRedirectTo: window.location.href,
      },
    });
    if (authError) {
      const codigo = (authError as { code?: string }).code ?? "";
      const status = (authError as { status?: number }).status ?? 0;
      if (codigo === "over_email_send_rate_limit" || status === 429) {
        setError(
          "El servidor de correo llegó a su tope de envíos por hora. Tu cuenta no se creó — vuelve en un rato.",
        );
        return false;
      }
      if (codigo === "user_already_exists" || /already registered/i.test(authError.message)) {
        setError("Ya hay una cuenta con ese correo. Entra en vez de crearla.");
        setMode("login");
        return false;
      }
      setError("No pudimos crear la cuenta. Inténtalo otra vez.");
      return false;
    }
    /* Session immédiate = la confirmation par courriel est désactivée :
       on est dedans, rien à attendre. */
    if (data.session) {
      window.location.reload();
      return true;
    }
    setStep("code");
    return true;
  }

  async function resend() {
    setBusy(true);
    setError("");
    const ok = await sendCode();
    setBusy(false);
    if (ok)
      setNotice(
        channel === "email"
          ? "Correo reenviado. Revisa también la carpeta de no deseados."
          : codeVia === "whatsapp"
            ? "Código reenviado por WhatsApp."
            : "Código reenviado por SMS.",
      );
  }

  /**
   * Entrer, avec ce que la personne a REÇU — pas avec ce qu'on espérait
   * qu'elle reçoive. Six chiffres si le courriel en contient ; le lien
   * lui-même s'il n'y a qu'un lien. Les deux ouvrent la même porte.
   */
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabase()!;

    /* Le lien collé passe devant : s'il est là, c'est qu'il n'y avait pas
       de code à recopier. */
    const glued = readPastedAuth(pasted);
    if (pasted.trim() && glued.kind === "nada") {
      setError(
        "Eso no parece el enlace del correo. Copia el enlace completo, empezando por https://",
      );
      return;
    }

    if (glued.kind === "nada" && code.length !== CODE_LENGTH) {
      setError("El código tiene seis dígitos.");
      return;
    }

    setError("");
    setBusy(true);

    let authError = null;
    if (glued.kind === "hash") {
      ({ error: authError } = await supabase.auth.verifyOtp({
        token_hash: glued.tokenHash,
        type: glued.type as "email",
      }));
    } else if (glued.kind === "session") {
      ({ error: authError } = await supabase.auth.setSession({
        access_token: glued.accessToken,
        refresh_token: glued.refreshToken,
      }));
    } else if (glued.kind === "pkce") {
      ({ error: authError } = await supabase.auth.exchangeCodeForSession(
        glued.code,
      ));
    } else {
      ({ error: authError } = await supabase.auth.verifyOtp(
        channel === "phone"
          ? { phone: e164, token: code, type: "sms" }
          : { email: email.trim(), token: code, type: "email" },
      ));
    }

    setBusy(false);
    if (authError) {
      setError(
        glued.kind === "nada"
          ? "Ese código no es correcto o ya venció."
          : "Ese enlace ya se usó o venció. Pide otro y pega el nuevo.",
      );
      return;
    }
    window.location.reload();
  }

  /* Tant qu'on ne sait pas, on montre — c'est l'état d'avant. */
  const hayGoogle = proveedores === null || proveedores.google;
  const hayApple = proveedores === null || proveedores.apple;

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
        {/* Le fond de la carte est un DÉGRADÉ, pas un aplat : plus clair
            en haut (là où vivent la marque et le titre), il descend vers
            la nuit — c'est la lumière des bonnes cartes sombres, et ça
            différencie naturellement la tête du corps. */}
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[140] w-[calc(100vw-24px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(168deg,#1d475f_0%,#0e2534_46%,#06141d_100%)] text-white shadow-float backdrop-blur-xl motion-safe:animate-[sheet-in_0.22s_cubic-bezier(0.2,0.9,0.3,1)]">
          <div className="relative max-h-[90vh] overflow-y-auto rounded-[28px] px-6 pt-8 pb-6">
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

            <Dialog.Title className="mx-auto mt-3 max-w-[16ch] text-center font-display text-[26px] leading-[1.12] font-extrabold tracking-[-0.03em]">
              {step === "code"
                ? channel === "email"
                  ? "Revisa tu correo"
                  : "Escribe tu código"
                : step === "done"
                  ? "Casi listo"
                  : mode === "login"
                    ? "Conéctate — alguien ya va para allá"
                    : "Empieza aquí: crea tu cuenta"}
            </Dialog.Title>
            <Dialog.Description className="mx-auto mt-2 mb-6 max-w-[34ch] text-center text-[13.5px] leading-snug text-night-200">
              {step === "code"
                ? channel === "email"
                  ? `Te escribimos a ${email.trim()}. Abre el correo y toca el enlace: con eso entras, no tienes que volver aquí.`
                  : `Te mandamos seis dígitos a ${codeDestination}.`
                : step === "done"
                  ? "Un paso más y entras."
                  : mode === "login"
                    ? "Con tu correo y tu contraseña. Sin tarjeta."
                    : "Toma diez segundos. Sin tarjeta, sin cédula todavía."}
            </Dialog.Description>

            {step === "done" ? (
              <>
                <div className="rounded-[20px] border border-white/12 bg-white/8 px-5 py-4">
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
                    onClick={() => {
                      signIn(
                        channel === "phone" ? e164 : email.trim(),
                        firstName.trim(),
                        lastName.trim(),
                      );
                      /* Une cuenta_creada la première fois, une
                         sesion_iniciada à chaque fois : la vue
                         metricas_usuarios compte les secondes pour
                         savoir qui revient. */
                      track("cuenta_creada", { props: { canal: channel } });
                      track("sesion_iniciada", { props: { canal: channel } });
                    }}
                    className="mt-4 w-full rounded-full bg-white px-5 py-3.5 font-display text-[16.5px] font-bold text-ink-900 transition-colors hover:bg-ink-50"
                  >
                    Continuar como {firstName.trim() || "invitado"}
                  </button>
                </Dialog.Close>
              </>
            ) : step === "identity" ? (
              <>
                {/* Zone 1 — TES DONNÉES, dans son propre panneau : la
                    tête (titre) au-dessus, le panneau au milieu, la voie
                    express en dessous. Trois zones, trois matières. */}
                <form
                  onSubmit={submitIdentity}
                  noValidate
                  className="flex flex-col gap-3.5 rounded-[20px] border border-white/10 bg-white/[0.06] p-4"
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
                        <span className="tnum shrink-0 text-[15px] font-semibold text-night-200">
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
                          className="tnum w-full border-none bg-transparent text-[15px] font-semibold text-white placeholder:text-white/35 focus:outline-none"
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
                          className={`rounded-full border px-3 py-1.5 text-[13.5px] font-semibold transition-colors ${
                            codeVia === value
                              ? "border-white bg-white text-ink-900"
                              : "border-white/15 bg-white/5 text-night-200 hover:border-white/35"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* LE MOT DE PASSE, quand on entre par courriel. C'est
                      lui le chemin normal : il n'attend rien, ne dépend
                      d'aucun serveur de courriel, et marche sur n'importe
                      quel téléphone. */}
                  {usaPassword && (
                    <div>
                      <span className="mb-1.5 flex items-center justify-between text-[12.5px] font-semibold text-night-200">
                        Contraseña
                        <button
                          type="button"
                          onClick={() => setVerPassword((v) => !v)}
                          className="font-semibold text-action/90 hover:underline"
                        >
                          {verPassword ? "ocultar" : "ver"}
                        </button>
                      </span>
                      <NightField
                        id={`${id}-pass`}
                        label="Contraseña"
                        icon="shield"
                        value={password}
                        onChange={setPassword}
                        type={verPassword ? "text" : "password"}
                        autoComplete={
                          mode === "register"
                            ? "new-password"
                            : "current-password"
                        }
                        placeholder={
                          mode === "register" ? "Mínimo 8 caracteres" : "••••••••"
                        }
                        hideLabel
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 w-full rounded-full bg-white px-5 py-3.5 font-display text-[16.5px] font-bold text-ink-900 transition-colors hover:bg-ink-50 disabled:opacity-50"
                  >
                    {busy
                      ? usaPassword
                        ? "Entrando…"
                        : "Mandando…"
                      : usaPassword
                        ? mode === "register"
                          ? "Crear mi cuenta"
                          : "Entrar"
                        : "Mandarme el código"}
                  </button>

                  {/* LA SORTIE DE SECOURS, jamais cachée. Quelqu'un qui a
                      créé son compte par lien magique n'a pas de mot de
                      passe : sans cette ligne, il est enfermé dehors. */}
                  {channel === "email" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPorEnlace((v) => !v);
                        setError("");
                        setNotice("");
                      }}
                      className="text-center text-[13px] text-night-200 underline-offset-2 hover:underline"
                    >
                      {porEnlace
                        ? "Mejor con mi contraseña"
                        : "No tengo contraseña — mándame un enlace por correo"}
                    </button>
                  )}
                </form>

                {/* On n'affiche QUE les fournisseurs réellement activés.
                    Un bouton Google qui mène à une page d'erreur de
                    Supabase au milieu de l'écran de connexion, c'est pire
                    que pas de bouton du tout. */}
                {hayGoogle || hayApple ? (
                  <>
                    <div
                      aria-hidden
                      className="my-4 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.1em] text-night-300 uppercase"
                    >
                      <span className="h-px flex-1 bg-white/12" />
                      o continúa con
                      <span className="h-px flex-1 bg-white/12" />
                    </div>

                    <div
                      className={`grid gap-2.5 ${hayGoogle && hayApple ? "grid-cols-2" : "grid-cols-1"}`}
                    >
                      {hayGoogle && (
                        <button
                          type="button"
                          onClick={() => social("google")}
                          disabled={busy}
                          className={`flex items-center justify-center gap-2.5 px-3 py-3 text-[14.5px] font-semibold hover:bg-white/20 disabled:opacity-60 ${pill}`}
                        >
                          <GoogleMark />
                          Google
                        </button>
                      )}
                      {hayApple && (
                        <button
                          type="button"
                          onClick={() => social("apple")}
                          disabled={busy}
                          className={`flex items-center justify-center gap-2.5 px-3 py-3 text-[14.5px] font-semibold hover:bg-white/20 disabled:opacity-60 ${pill}`}
                        >
                          <AppleMark />
                          Apple
                        </button>
                      )}
                    </div>
                  </>
                ) : null}

                {/* La bascule, EN BAS et en une phrase : l'écran ne
                    montre qu'un chemin à la fois. */}
                <p className="mt-5 border-t border-white/10 pt-4 text-center text-[13.5px] text-night-200">
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
                {/* PAR COURRIEL, LE CHEMIN EST LE LIEN. Le gabarit d'origine
                    de Supabase n'envoie pas de chiffres : afficher six cases
                    en premier, c'était demander à quelqu'un de recopier une
                    chose qui n'existe pas dans son courriel. */}
                {channel === "email" && (
                  <div className="rounded-[16px] border border-white/12 bg-white/6 p-4">
                    <p className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white">
                      <Icon
                        name="check"
                        className="mt-0.5 size-4 shrink-0 text-action"
                      />
                      <span>
                        <b className="font-semibold">Toca el enlace del correo</b>{" "}
                        y quedas dentro. Puedes cerrar esta ventana.
                      </span>
                    </p>
                    <label
                      htmlFor={`${id}-enlace`}
                      className="mt-3 mb-1.5 block text-[12.5px] leading-snug text-night-200"
                    >
                      ¿Tocarlo no te trajo de vuelta? Copia el enlace completo
                      y pégalo aquí:
                    </label>
                    <input
                      id={`${id}-enlace`}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={pasted}
                      onChange={(e) => setPasted(e.target.value)}
                      placeholder="https://…"
                      className={`${pill} w-full px-4 py-3 text-[14.5px] placeholder:text-night-300 focus:border-action focus:outline-none`}
                    />
                  </div>
                )}

                <div
                  className={`relative ${channel === "email" && !verCodigo ? "hidden" : ""}`}
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
                    autoFocus={channel === "phone"}
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
                  className="w-full rounded-full bg-white px-5 py-3.5 font-display text-[16.5px] font-bold text-ink-900 transition-colors hover:bg-ink-50 disabled:opacity-50"
                >
                  {busy ? "Verificando…" : "Confirmar"}
                </button>

                {channel === "email" && !verCodigo && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerCodigo(true);
                      window.setTimeout(() => codeInput.current?.focus(), 50);
                    }}
                    className="text-center text-[13.5px] text-night-200 underline-offset-2 hover:underline"
                  >
                    Mi correo trae seis dígitos
                  </button>
                )}

                <p className="text-center text-[13.5px] text-night-200">
                  {puedeReenviar ? "¿No te llegó? " : "Puedes pedir otro en un minuto. "}
                  <button
                    type="button"
                    onClick={resend}
                    disabled={busy || !puedeReenviar}
                    className="font-bold text-white hover:underline disabled:opacity-60"
                  >
                    {channel === "email" ? "Reenviar el correo" : "Reenviar el código"}
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
                className="mt-3 text-center text-[13.5px] font-medium text-[#FF9C90]"
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
  icon: "users" | "chat" | "phone" | "shield";
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
          className="w-full border-none bg-transparent text-[15px] font-semibold text-white placeholder:text-white/35 focus:outline-none"
        />
      </span>
    </label>
  );
}
