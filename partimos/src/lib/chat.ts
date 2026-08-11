/**
 * CHAT — le fil de discussion d'un trajet, côté client.
 *
 * Le chat existe pour une raison précise : le numéro de téléphone reste
 * caché jusqu'à la réservation confirmée (règle de la base, §8), donc il
 * faut bien un endroit pour demander « ¿sales puntual? » AVANT de réserver.
 * La table `messages` du schéma est prête ; en attendant Supabase, le fil
 * vit dans `localStorage`, annoncé comme démonstration.
 *
 * Rien n'est simulé : aucun conducteur fictif ne « répond ». Un faux
 * accusé de réception ferait croire qu'un humain a lu — c'est le genre de
 * mensonge qui coûte la confiance entière du produit.
 */

export type ChatMessage = {
  id: string;
  text: string;
  /** En démonstration, tout vient de l'utilisateur courant. */
  fromMe: boolean;
  at: string;
};

const keyFor = (tripId: string) => `partimos.chat.${tripId}`;
const EVENT = "partimos:chat";

export function loadChat(tripId: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(keyFor(tripId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function sendChatMessage(tripId: string, text: string): ChatMessage[] {
  const trimmed = text.trim();
  const current = loadChat(tripId);
  if (!trimmed) return current;
  const next = [
    ...current,
    {
      id: `${Date.now()}-${current.length}`,
      text: trimmed,
      fromMe: true,
      at: new Date().toISOString(),
    },
  ];
  try {
    window.localStorage.setItem(keyFor(tripId), JSON.stringify(next));
  } catch {
    // stockage refusé : le fil vivra le temps de la page, c'est déjà ça
  }
  window.dispatchEvent(new Event(EVENT));
  return next;
}

/** Les questions que tout le monde pose. Un appui au lieu de dix frappes —
 *  et elles montrent d'emblée à quoi sert le fil. */
export const QUICK_QUESTIONS = [
  "¿A qué hora exacta sales?",
  "¿Dónde nos encontramos?",
  "¿Cabe una maleta grande?",
  "¿Puedes recogerme un poco más adelante?",
];
