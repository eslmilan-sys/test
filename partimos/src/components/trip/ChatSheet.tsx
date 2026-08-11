"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import {
  QUICK_QUESTIONS,
  loadChat,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/chat";

/**
 * Feuille de chat avec le conducteur.
 *
 * Elle s'ouvre depuis le panneau de réservation — c'est AVANT de réserver
 * qu'on a des questions, et c'est exactement la fenêtre où le téléphone est
 * encore caché. Le fil est un vrai fil (persistant, horodaté) ; en mode
 * démonstration, il le dit clairement au lieu de simuler une réponse.
 */
export function ChatSheet({
  tripId,
  driverName,
  trigger,
}: {
  tripId: string;
  driverName: string;
  trigger: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");

  const send = (value: string) => {
    setMessages(sendChatMessage(tripId, value));
    setText("");
  };

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (open) setMessages(loadChat(tripId));
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-night-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="glass liquid fixed inset-x-0 bottom-0 z-[120] flex max-h-[88vh] flex-col rounded-t-[26px] p-0 [--glass-alpha:0.93] motion-safe:animate-[sheet-in_0.24s_cubic-bezier(0.2,0.9,0.3,1)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:rounded-[26px]">
          <div className="flex items-center gap-3 border-b border-ink-200/70 px-5 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-ink-900 font-display text-[14px] font-bold text-ink-50">
              {driverName.charAt(0)}
            </span>
            <Dialog.Title className="min-w-0 flex-1 font-display text-[17px] font-bold tracking-[-0.02em]">
              {driverName}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar el chat"
              className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Icon name="cross" className="size-4.5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Chat con {driverName}. Tu número queda oculto hasta confirmar la
            reserva.
          </Dialog.Description>

          <div className="min-h-[220px] flex-1 overflow-y-auto px-5 py-4">
            {(messages ?? []).length === 0 ? (
              <div className="py-4 text-center">
                <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-ink-50 text-ink-500">
                  <Icon name="chat" className="size-5" />
                </span>
                <p className="mx-auto max-w-[36ch] text-[13.5px] leading-relaxed text-ink-500">
                  Pregunta lo que necesites antes de reservar. Tu número y el
                  de {driverName} quedan ocultos hasta que la reserva esté
                  confirmada.
                </p>
              </div>
            ) : (
              <ul className="grid gap-2">
                {messages!.map((m) => (
                  <li key={m.id} className="flex justify-end">
                    <span className="max-w-[85%] rounded-[16px] rounded-br-[6px] bg-ink-900 px-3.5 py-2 text-[14px] leading-snug text-white">
                      {m.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(messages ?? []).length === 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-3">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-ink-200 bg-white/70 px-3 py-1.5 text-[12.5px] font-semibold text-ink-600 transition-colors hover:border-accent hover:text-accent-ink"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-center gap-2 border-t border-ink-200/70 px-4 py-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu mensaje…"
              aria-label="Mensaje"
              className="min-w-0 flex-1 rounded-full border-[1.5px] border-ink-200 bg-white px-4 py-2.5 text-[14.5px] placeholder:text-ink-400 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Enviar"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:opacity-40"
            >
              <Icon name="arrowRight" className="size-4.5" />
            </button>
          </form>

          <p className="border-t border-ink-200/70 px-5 py-2.5 text-[11.5px] leading-snug text-ink-500">
            Modo demostración: el mensaje se guarda en tu navegador. Con la
            base conectada, le llega a {driverName} y te avisamos por WhatsApp
            cuando responda.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
