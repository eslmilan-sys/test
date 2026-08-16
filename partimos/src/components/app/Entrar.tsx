"use client";

import { Icon } from "@/components/ui/Icon";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

/**
 * LA PORTE DE L'APP — le premier écran, avant tout le reste.
 *
 * SA FORME VIENT D'UNE DEMANDE PRÉCISE du propriétaire, exemple à
 * l'appui : une photo qui occupe le haut de l'écran, une croix en haut à
 * GAUCHE pour la quitter, et en bas une feuille blanche avec le titre,
 * le bouton d'inscription puis le lien de connexion. C'est la grammaire
 * de tous les onboardings de voyage, et elle marche pour une raison :
 * l'image dit ce qu'on achète avant qu'un mot soit lu.
 *
 * LA CROIX N'EST PAS DÉCORATIVE. Elle mène au mode invité, où la
 * RECHERCHE reste entière — chercher un viaje et voir l'aporte ne
 * demandent pas de compte, et exiger l'inscription à l'entrée coûte plus
 * de visiteurs qu'elle n'en qualifie. Tout ce qui engage quelqu'un
 * (réserver, publier, écrire, son profil) ramène ici.
 *
 * TROIS PORTES, ET C'EST UNE LEÇON PAYÉE CHER. L'inscription est restée
 * cassée des heures pour trois raisons cumulées : un quota de deux
 * courriels par heure, un gabarit non modifiable, et un lien qui
 * renvoyait sur localhost. La règle qui en sort : ne jamais faire
 * dépendre l'entrée d'un seul canal. Google et LinkedIn ne sont pas du
 * confort, ce sont des chemins de secours quand le courriel tombe.
 *
 * Et quand un fournisseur n'est pas activé, on le DIT — avec sa vraie
 * cause. « Réessaie » sur un provider désactivé fait réessayer à l'infini
 * quelque chose qui ne marchera jamais.
 */

/** TROIS pictogrammes, et trois seulement — demande du propriétaire.
 *  Quatre ronds alignés se lisent comme une barre d'outils ; trois se
 *  lisent comme trois idées. Ce sont les trois qui décident vraiment :
 *  la voiture (ce qu'on partage), le bouclier (avec qui), l'aporte (ce
 *  que ça coûte). Ils ne remplacent pas le titre — ils le préparent. */
const CAPACIDADES = [
  { icon: "car", label: "Comparte el carro" },
  { icon: "shield", label: "Con gente verificada" },
  { icon: "cash", label: "Solo el aporte" },
] as const;

export function Entrar({
  onRegistro,
  onAcceder,
  onCerrar,
  /** Le titre change selon la porte par laquelle on arrive : entrer dans
   *  l'app n'est pas la même demande que « je viens de toucher Perfil ».
   *  Un écran de connexion qui ne dit pas POURQUOI il s'affiche se lit
   *  comme un mur. */
  motivo,
}: {
  onRegistro: () => void;
  onAcceder: () => void;
  /** Absent = pas de sortie (première ouverture d'une session). */
  onCerrar?: () => void;
  motivo?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* LA PHOTO — elle occupe le haut, elle est coupée par la feuille. */}
      <div className="relative min-h-0 flex-1">
        <Photo
          photo={PHOTOS.carroLleno}
          sizes="100vw"
          priority
          fill
          imgClassName="object-cover object-[50%_38%]"
        />
        {/* Un dégradé bas : sans lui, les pictogrammes blancs tombent
            parfois sur une zone claire de la photo et disparaissent. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(20,16,12,0.55),transparent)]"
        />

        {onCerrar && (
          /* LA CROIX, EN HAUT À GAUCHE — demande explicite du
             propriétaire, et c'est aussi la convention : à gauche on
             quitte, à droite on agit. En verre, pour rester lisible quelle
             que soit la photo derrière. */
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Seguir sin cuenta"
            /* 48 px et non 44 : le propriétaire l'a vue rater. Sur une
               photo, sans bord net, on vise moins bien qu'on croit — et
               une croix qu'on rate deux fois passe pour cassée. */
            className="glass absolute top-[calc(14px+env(safe-area-inset-top))] left-4 z-20 flex size-12 items-center justify-center rounded-full"
          >
            <Icon name="cross" className="size-5" />
          </button>
        )}

      </div>

      {/* LA FEUILLE — elle monte par-dessus la photo, coins arrondis.
          Elle est EN VERRE : la photo se devine derrière son bord, ce qui
          la pose sur l'image au lieu de la couper en deux. */}
      <div className="glass relative z-20 -mt-8 rounded-t-[28px] px-6 pt-6 pb-[calc(22px+env(safe-area-inset-bottom))]">
        {/* LES TROIS IDÉES, DANS la feuille et non à cheval sur le bord.
            Collées au bas de la photo, elles tombaient dans la couture
            entre l'image et le texte — l'endroit exact où l'œil ne
            s'arrête pas. Ici elles ouvrent la feuille, avec leur mot :
            un rond sans légende est une devinette. */}
        <ul className="mb-5 flex items-start justify-between gap-2">
          {CAPACIDADES.map((c) => (
            <li key={c.label} className="flex w-full flex-col items-center gap-1.5">
              {/* LA SIGNATURE DU SITE, enfin dans l'app : un rectangle
                  orange incliné qui dépasse d'une tuile de verre dépoli.
                  Là où la tuile le recouvre, le flou le fond en lumière ;
                  le coin qui dépasse reste net. C'est ce contraste sur un
                  MÊME objet qui fait « verre » — la transparence seule
                  n'y suffit pas. */}
              <GlassIcon name={c.icon} tone="naranja" />
              <span className="text-center text-[11.5px] leading-tight font-semibold text-ink-600">
                {c.label}
              </span>
            </li>
          ))}
        </ul>
        <h1 className="font-display text-[27px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          {motivo ?? (
            <>
              Alguien ya va <span className="text-naranja">para allá</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-[14.5px] leading-snug text-ink-500">
          Comparte el carro y los gastos entre Ciudad de Panamá y el interior.
        </p>

        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            onClick={onRegistro}
            className="flex h-[54px] items-center justify-center rounded-full bg-naranja px-6 font-display text-[16.5px] font-bold text-white transition-colors hover:bg-naranja-hondo"
          >
            Crear cuenta
          </button>

          {/* CONNEXION EN SECOND, et en lien : celui qui a déjà un compte
              sait le trouver ; celui qui n'en a pas doit voir d'abord la
              porte qui le concerne. */}
          <button
            type="button"
            onClick={onAcceder}
            className="flex h-[46px] items-center justify-center rounded-full font-display text-[15.5px] font-bold text-naranja transition-colors hover:bg-naranja-suave"
          >
            Iniciar sesión
          </button>

          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="mt-1 text-center text-[13.5px] font-semibold text-ink-500 underline-offset-2 hover:underline"
            >
              Solo quiero buscar viajes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
