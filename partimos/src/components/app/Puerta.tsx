"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useHydrated } from "@/lib/lastsearch";
import { Entrar } from "./Entrar";
import { Registro } from "./Registro";
import { Acceder } from "./Acceder";

/**
 * LA PORTE, POSÉE DEVANT UN ÉCRAN QUI EXIGE UN COMPTE.
 *
 * Règle du propriétaire : sans compte, seule la RECHERCHE est
 * disponible. Toucher Perfil, Mis viajes, Mensajes ou Publicar ramène à
 * l'écran de connexion — et cet écran dit POURQUOI il s'affiche, sinon
 * il se lit comme un mur.
 *
 * ELLE N'EXISTE QUE DANS L'APP. Le site laisse tout consulter : c'est
 * son canal d'acquisition, et une page qui exige un compte avant de
 * montrer quoi que ce soit ne se référence pas. Les pages posent donc
 * ce composant à l'intérieur de leur bloc `.solo-app`.
 *
 * ELLE NE REND RIEN AVANT HYDRATATION. Le HTML servi doit rester
 * identique pour tout le monde, robots compris ; et afficher la porte
 * « au cas où » la ferait clignoter chez qui est déjà connecté.
 */

export function Puerta({
  motivo,
  children,
}: {
  /** Le titre de l'écran d'entrée, adapté à ce qu'on venait faire. */
  motivo: string;
  /** L'écran protégé, rendu tel quel dès qu'il y a une session. */
  children: React.ReactNode;
}) {
  const { session } = useSession();
  const hidratado = useHydrated();
  const router = useRouter();
  const [puerta, setPuerta] = useState<"entrar" | "registro" | "acceder">(
    "entrar",
  );

  if (!hidratado) return null;
  if (session) return <>{children}</>;

  if (puerta === "registro")
    return <Registro onCerrar={() => setPuerta("entrar")} />;
  if (puerta === "acceder")
    return (
      <Acceder
        onCerrar={() => setPuerta("entrar")}
        onRegistro={() => setPuerta("registro")}
      />
    );

  return (
    <>
      <Entrar
        motivo={motivo}
        onRegistro={() => setPuerta("registro")}
        onAcceder={() => setPuerta("acceder")}
        /* Fermer ici, c'est revenir d'où l'on vient — pas « rester sur
           une page vide ». Sans historique (lien ouvert de l'extérieur),
           on retombe sur la recherche, la seule chose qui marche sans
           compte. */
        onCerrar={() => {
          if (window.history.length > 1) router.back();
          else router.push("/ya");
        }}
      />
    </>
  );
}
