"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getSupabase } from "@/lib/supabase";
import {
  MAX_BODY,
  QUICK_QUESTIONS,
  countUnread,
  fetchMessages,
  markRead,
  sendMessage,
  subscribe,
  transportFor,
  type ChatMessage,
} from "@/lib/chat";

/**
 * LE FIL D'UNE RESERVA.
 *
 * Il remplace le numéro de téléphone, et c'est tout le propos : donner le
 * celular du conducteur, c'était sortir la coordination de la plateforme
 * dès la première minute — plus de trace de ce qui a été convenu le jour
 * où quelqu'un réclame, et une porte ouverte vers « arreglemos por fuera ».
 * Le fil garde la preuve : `messages_inmutables` interdit de réécrire un
 * message après coup, des deux côtés.
 *
 * Fermé par défaut. Une conversation dépliée par reserva transformerait
 * « Mis viajes » en mur de texte ; la pastille suffit à dire qu'il y a du
 * nouveau.
 */

/** L'id du compte connecté côté base — sert à savoir quels messages sont
 *  les miens. Nul en démonstration : le fil local est mono-utilisateur. */
function useMyId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let vivo = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (vivo) setId(data.user?.id ?? null);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  return id;
}

function hora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-PA", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ChatThread({
  bookingId,
  otherName,
  /** Une reserva annulée ne se discute plus — la policy d'écriture le
   *  refuse en base, l'écran doit le dire au lieu de laisser taper. */
  closed = false,
}: {
  bookingId: string;
  otherName: string;
  closed?: boolean;
}) {
  const myId = useMyId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const finDelHilo = useRef<HTMLDivElement | null>(null);

  const transport = transportFor(bookingId);
  const unread = countUnread(messages);

  const recargar = useCallback(() => {
    void fetchMessages(bookingId, myId).then(setMessages);
  }, [bookingId, myId]);

  /* Charger + écouter. L'abonnement vit même fil FERMÉ : sans ça la
     pastille ne pourrait pas s'allumer, et il faudrait recharger la page
     pour savoir qu'on a reçu une réponse. */
  useEffect(() => {
    recargar();
    return subscribe(bookingId, myId, recargar);
  }, [bookingId, myId, recargar]);

  /* Ouvrir, c'est lire. */
  useEffect(() => {
    if (!open || unread === 0) return;
    void markRead(bookingId, myId).then(recargar);
  }, [open, unread, bookingId, myId, recargar]);

  /* Le dernier message doit être visible sans faire défiler. */
  useEffect(() => {
    if (open) finDelHilo.current?.scrollIntoView({ block: "nearest" });
  }, [open, messages.length]);

  async function enviar(texto: string) {
    if (!texto.trim() || sending || closed) return;
    setSending(true);
    setFailed(false);
    const escrito = await sendMessage(bookingId, myId, texto);
    setSending(false);
    if (!escrito) {
      /* Un message qui disparaît sans rien dire est pire que pas de chat :
         on garde le brouillon et on l'annonce. */
      setFailed(true);
      return;
    }
    setDraft("");
    recargar();
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink-200 px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:border-accent hover:text-accent-ink"
      >
        <Icon name="chat" className="size-4" />
        {messages.length === 0
          ? `Escribir a ${otherName}`
          : `Chat con ${otherName}`}
        {unread > 0 && (
          <span
            className="tnum inline-flex min-w-[19px] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white"
            aria-label={`${unread} sin leer`}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2.5 rounded-[14px] border border-ink-200 bg-ink-50/60 p-3">
          <div className="mb-2.5 grid max-h-[300px] gap-1.5 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="px-1 py-2 text-[13px] leading-relaxed text-ink-500">
                Aquí coordinas la hora y el punto exacto con {otherName}. Queda
                escrito: ninguno de los dos puede cambiar un mensaje después.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[13px] px-3 py-2 text-[14px] leading-snug ${
                      m.mine
                        ? "bg-ink-900 text-white"
                        : "border border-ink-200 bg-white"
                    }`}
                  >
                    <span className="block break-words whitespace-pre-wrap">
                      {m.body}
                    </span>
                    <span
                      className={`tnum mt-0.5 block text-[11px] ${
                        m.mine ? "text-white/60" : "text-ink-500"
                      }`}
                    >
                      {hora(m.at)}
                      {m.mine && m.readAt ? " · Leído" : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={finDelHilo} />
          </div>

          {messages.length === 0 && !closed && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void enviar(q)}
                  disabled={sending}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[12.5px] text-ink-500 transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {closed ? (
            <p className="text-[12.5px] leading-snug text-ink-500">
              Esta reserva está cancelada: la conversación queda para consulta,
              pero ya no se puede escribir.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enviar(draft);
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor={`chat-${bookingId}`} className="sr-only">
                Mensaje para {otherName}
              </label>
              <textarea
                id={`chat-${bookingId}`}
                rows={1}
                value={draft}
                maxLength={MAX_BODY}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  /* Entrée envoie, Maj+Entrée saute une ligne : c'est ce que
                     font tous les chats, et c'est ce que les doigts font. */
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar(draft);
                  }
                }}
                placeholder="Escribe un mensaje"
                className="min-h-[42px] flex-1 resize-none rounded-[12px] border-[1.5px] border-ink-200 bg-white px-3 py-2.5 text-[14.5px] outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px] bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Enviar"
              >
                <Icon name="arrowRight" className="size-4" />
              </button>
            </form>
          )}

          {failed && (
            <p className="mt-2 text-[12.5px] leading-snug text-ink-900">
              No se pudo enviar. Tu mensaje sigue escrito arriba: vuelve a
              intentar.
            </p>
          )}

          {/* CE QUE CET ÉCRAN EST VRAIMENT. Tant que les reservas vivent
              dans le navigateur, le fil aussi : le conducteur ne le reçoit
              pas. Le taire ferait attendre une réponse qui ne viendra
              jamais. */}
          {transport === "local" && (
            <p className="mt-2 text-[12.5px] leading-snug text-ink-500">
              Demostración: este hilo se guarda en tu teléfono y {otherName} no
              lo recibe todavía. Cuando los viajes sean reales, el mismo chat
              funciona entre los dos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
