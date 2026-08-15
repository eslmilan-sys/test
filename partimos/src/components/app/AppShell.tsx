"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useHydrated } from "@/lib/lastsearch";
import { AuthDialog } from "@/components/site/AuthDialog";
import { Entrar } from "./Entrar";
import { Bienvenida } from "./Bienvenida";

/**
 * QUI DÉCIDE DE CE QU'ON VOIT EN OUVRANT L'APP.
 *
 * Trois états, dans l'ordre voulu par le propriétaire :
 *
 *   1. pas de compte  → l'écran d'entrée, plein écran ;
 *   2. compte, première ouverture de la session → l'écran de bienvenue ;
 *   3. ensuite        → l'app.
 *
 * IL NE S'APPLIQUE QU'À L'APP INSTALLÉE. Sur le site, exiger un compte
 * pour voir l'accueil serait une faute grave : le SEO est le canal
 * principal, et une page qui demande à se connecter avant de montrer
 * quoi que ce soit ne se référence pas. C'est pour ça que ce composant
 * est enveloppé dans `.solo-app` par la page, et pourquoi il ne rend
 * RIEN avant hydratation — le HTML servi reste celui du site, identique
 * pour tout le monde, robots compris.
 */

export function AppShell() {
  const { session } = useSession();
  const hydrated = useHydrated();
  const [abrirCorreo, setAbrirCorreo] = useState(false);

  /* Avant hydratation on ne sait pas s'il y a un compte : rendre l'écran
     d'entrée « au cas où » le ferait clignoter chez qui est connecté. */
  if (!hydrated) return null;

  if (!session) {
    return (
      <div className="fixed inset-0 z-[150] overflow-y-auto bg-ink-50">
        <Entrar onCorreo={() => setAbrirCorreo(true)} />
        {/* Le formulaire courriel réutilise le dialogue existant : toute
            la logique de code, de quota et d'erreurs y vit déjà, et la
            dupliquer serait la façon la plus sûre de la faire diverger. */}
        {abrirCorreo && (
          <AuthDialog
            open={abrirCorreo}
            onOpenChange={setAbrirCorreo}
            trigger={null}
          />
        )}
      </div>
    );
  }

  return <Bienvenida nombre={session.firstName?.trim() || null} />;
}
