"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "./supabase";
import type { PayChannel } from "./pricing";

/**
 * SESSION
 *
 * Deux modes, un seul contrat pour les composants.
 *
 * · Supabase configuré : la vraie session, OTP par SMS (§3 du brief).
 * · Sinon : une session de DÉMONSTRATION en `localStorage`, pour que l'espace
 *   compte, la réservation et la publication soient explorables.
 *
 * Le mode démonstration est annoncé partout où il change ce que voit
 * l'utilisateur. Simuler une connexion sans le dire ferait croire qu'un compte
 * existe, et la première déception d'un produit se paie très cher.
 *
 * `localStorage` est une source de vérité EXTÉRIEURE à React : on la lit avec
 * `useSyncExternalStore` plutôt qu'avec un effet qui appellerait `setState`.
 * L'effet produirait un rendu de plus à chaque montage, et surtout React ne
 * garantirait pas la cohérence entre deux composants abonnés.
 */

/** Le carro enregistré du conducteur. Choisi dans le catalogue : c'est lui
 *  qui fixe le taux au km à la publication, et sa photo rassure le passager
 *  qui cherche le bon véhicule au point de rencontre. */
export type SavedCar = {
  make: string;
  model: string;
  year: number;
  color: string;
  /** Photo compressée (JPEG ~800 px) en data URL — mode démonstration.
   *  Avec Supabase, elle partira dans le bucket Storage `carros`. */
  photoDataUrl: string | null;
};

export type Session = {
  /** Téléphone en E.164 ou adresse e-mail, selon le canal choisi. */
  contact: string;
  firstName: string;
  lastName: string;
  /** Initiale affichée en public — jamais le nom complet (« Ana M. »). */
  lastInitial: string;
  isVerified: boolean;
  /** Insigne employeur ou université, si l'utilisateur l'a connecté. */
  affiliation: string | null;
  since: string;
  /** Héritage : premier carro enregistré (les anciens comptes de démo
   *  n'en avaient qu'un). Lire via carsOf(), écrire via cars. */
  car?: SavedCar | null;
  /** Les carros enregistrés. À la publication on choisit lequel ; s'il
   *  n'y en a qu'un, c'est lui d'office. */
  cars?: SavedCar[] | null;
  /** Moyen de paiement favori, choisi à l'inscription et modifiable dans
   *  Mi cuenta. Il présélectionne le canal à la réservation — il ne
   *  l'impose jamais : les trois restent visibles à chaque reserva. */
  payPref?: PayChannel | null;
  /** CONDUCTEUR : comment il accepte l'aporte HORS app. Le cobro dans
   *  l'app est toujours accepté (l'argent lui arrive en versement, il
   *  n'a rien à gérer) ; ici il déclare s'il prend aussi le Yappy directo
   *  et/ou l'efectivo en main. Vide = « solo por la app ». */
  acceptsOutside?: ("yappy" | "efectivo")[] | null;
  /** La RUTINA : le trajet qui revient chaque semaine. C'est l'habitude
   *  qui rend la plateforme vitale — un clic pour republier ou pour
   *  chercher, et la base du matching récurrent (migration 0012). */
  routine?: {
    from: string;
    to: string;
    /** Jours ISO : 1 = lundi … 7 = dimanche. */
    days: number[];
    hour: string;
  } | null;
  /** Le dernier viaje publié — la matière du bouton « repetir » : on ne
   *  redemande jamais ce qu'on sait déjà. */
  lastPublish?: PublishedTrip | null;
  /** Tous les viajes publiés (démo : dans le navigateur). C'est sur eux
   *  que le compteur « recuperas hasta » s'empile. */
  published?: PublishedTrip[];
};

export type PublishedTrip = {
  from: string;
  to: string;
  cityStops: string[];
  pickups: string[];
  date: string;
  hour: string;
  seats: number;
  recurrence: "una-vez" | "diario" | "semanal" | "mensual";
  priceCents: number;
};

/** La liste des carros, quel que soit l'âge de la session. */
export function carsOf(session: Session | null): SavedCar[] {
  if (!session) return [];
  if (session.cars && session.cars.length > 0) return session.cars;
  return session.car ? [session.car] : [];
}

const STORAGE_KEY = "partimos.demo-session";
const EVENT = "partimos:session";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // `storage` couvre les autres onglets ; l'événement maison couvre celui-ci.
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
}

/** Le snapshot est la chaîne brute : deux lectures identiques doivent rendre
 *  la MÊME référence, sinon React reboucle indéfiniment. */
function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Stockage refusé (navigation privée stricte) : on reste déconnecté.
    return null;
  }
}

/** Sur le serveur, personne n'est connecté — et le rendu doit correspondre
 *  au premier rendu client, sinon l'hydratation échoue. */
function getServerSnapshot(): string | null {
  return null;
}

export function useSession() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const session = useMemo<Session | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }, [raw]);

  const signIn = useCallback(
    (
      contact: string,
      firstName = "Tú",
      lastName = "",
      payPref: PayChannel | null = null,
    ) => {
      const next: Session = {
        contact,
        firstName,
        lastName,
        lastInitial: lastName.charAt(0).toUpperCase(),
        isVerified: false,
        affiliation: null,
        since: new Date().toISOString(),
        payPref,
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Sans stockage, la session ne survit pas au rechargement. Acceptable.
      }
      emit();
    },
    [],
  );

  /** Met à jour la session en place — le carro, plus tard d'autres champs.
   *  Écrit puis émet : tous les composants abonnés voient le même état. */
  const updateSession = useCallback(
    (patch: Partial<Session>) => {
      const raw = getSnapshot();
      if (!raw) return;
      try {
        const current = JSON.parse(raw) as Session;
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...current, ...patch }),
        );
      } catch {
        return; // stockage refusé : rien à mettre à jour
      }
      emit();
    },
    [],
  );

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // rien à nettoyer
    }
    emit();
  }, []);

  // Pas de drapeau « prêt » : il vaudrait false sur le serveur et true dans
  // le navigateur, ce qui casserait l'hydratation. Le premier rendu est celui
  // d'un visiteur déconnecté, et React le corrige dès la lecture du stockage.
  return { session, isDemo: !isSupabaseConfigured, signIn, signOut, updateSession };
}

/** Conservé pour que l'arbre reste explicite : la session n'a pas d'état
 *  React propre, mais le fournisseur documente où elle est disponible. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
