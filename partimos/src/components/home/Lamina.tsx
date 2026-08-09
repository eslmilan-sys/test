"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { RouteProfile } from "@/components/plate/RouteProfile";
import { PRICE_RULE, RATE_PER_KM_CENTS } from "@/lib/pricing";
import { pathBetween, station } from "@/lib/network";

/**
 * LE PREMIER ÉCRAN — la planche.
 *
 * Ce n'est pas un en-tête, c'est la thèse. La page s'ouvre sur le tracé réel
 * de la Panaméricaine, coté en kilomètres, et la recherche se fait DESSUS.
 * Le cartouche en bas porte la formule du plafond : quelqu'un qui ne défile
 * jamais a quand même vu d'où sort le montant.
 *
 * Ce qui a été refusé ici, et pourquoi :
 *   · le hero à champ de recherche posé sur une photo — il raconte le produit
 *     au lieu de le montrer, et il est interchangeable avec ceux de la
 *     catégorie entière ;
 *   · la grille de quatre cartes icône + titre + texte, deux fois signalée
 *     comme laide par l'utilisateur, et qui est la structure paresseuse par
 *     défaut ;
 *   · le sur-titre en capitales au-dessus du titre : le titre porte son
 *     propre poids.
 */
export function Lamina() {
  const router = useRouter();
  const [from, setFrom] = useState("panama-city");
  const [to, setTo] = useState("david");
  const [picking, setPicking] = useState<"origin" | "destination">("origin");

  const path = pathBetween(from, to);
  const fromStation = station(from);
  const toStation = station(to);

  function search() {
    if (!path) return;
    const today = new Date().toISOString().slice(0, 10);
    router.push(`/buscar?desde=${from}&hacia=${to}&fecha=${today}&puestos=1`);
  }

  return (
    <section className="plate grid-field relative overflow-hidden border-b-2 border-plate-700">
      <Container className="pt-8 pb-10">
        {/* Titre à gauche, cartouche à droite : les deux dans le premier
            écran, avec le dessin en dessous et l'action juste après. La
            version précédente poussait l'action et la formule sous la ligne
            de flottaison — sur une surface qui doit convaincre, une action
            invisible est une action absente. */}
        {/* Une colonne sur téléphone, une grille à partir de 1000 px.
            L'ordre change entre les deux : sur petit écran la légende passe
            APRÈS l'action, parce que c'est de la référence et pas une étape.
            Un seul élément dans le DOM à chaque fois — donc un seul dans
            l'ordre de tabulation, et rien de dupliqué pour un lecteur
            d'écran. */}
        <div className="flex flex-col min-[1000px]:grid min-[1000px]:grid-cols-[minmax(0,1fr)_380px] min-[1000px]:gap-x-10">
          <div className="order-1 max-w-[46ch] min-[1000px]:col-start-1 min-[1000px]:row-start-1">
            <h1 className="text-[clamp(32px,5.4vw,50px)] leading-[1.03]">
              Alguien ya va para allá
            </h1>
            <p className="mt-3.5 text-[16px] leading-relaxed text-plate-300">
              Lo que te pueden pedir por el puesto sale de los kilómetros que
              recorres, no del apuro que tengas. Está medido, y tiene tope.
            </p>
          </div>

          {/* Le tracé. C'est le champ de recherche. */}
          <div className="order-2 mt-6 min-[1000px]:col-span-2 min-[1000px]:row-start-2 min-[1000px]:mt-7">
            <p className="mb-2 text-[13px] text-plate-300" aria-hidden>
              {picking === "origin"
                ? "Toca tu estación de salida"
                : "Ahora toca dónde te bajas"}
              <span className="mx-2 text-plate-500">·</span>
              <span className="text-plate-400">
                o arrastra los puntos naranjas
              </span>
            </p>

            <RouteProfile
              fromSlug={from}
              toSlug={to}
              picking={picking}
              onPickingChange={setPicking}
              onPick={(nextFrom, nextTo) => {
                setFrom(nextFrom);
                setTo(nextTo);
              }}
            />
          </div>

          <div className="order-3 mt-6 min-[1000px]:col-span-2 min-[1000px]:row-start-3">
            {path && fromStation && toStation ? (
              <button
                type="button"
                onClick={search}
                className="inline-flex items-center gap-2.5 border-2 border-ochre-400 bg-ochre-400 px-6 py-3.5 text-[16px] font-bold text-plate-950 transition-colors hover:border-ochre-300 hover:bg-ochre-300"
                style={{ fontStretch: "112%" }}
              >
                Ver los viajes de {fromStation.name} a {toStation.name}
                <Icon name="arrowRight" className="size-4.5" />
              </button>
            ) : (
              <p className="border-2 border-dashed border-plate-600 px-5 py-3.5 text-[14.5px] text-plate-300">
                Ese par de estaciones no se conecta en un solo viaje. Escoge un
                destino sobre la misma rama del trazado.
              </p>
            )}
            <p className="mt-3 text-[13px] text-plate-400">
              Buscar es gratis y no pide cuenta.
            </p>
          </div>

          <div className="order-4 mt-9 min-[1000px]:order-none min-[1000px]:col-start-2 min-[1000px]:row-start-1 min-[1000px]:mt-0">
            <Cartouche />
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * LE CARTOUCHE
 *
 * Le rectangle qu'on regarde sur une planche pour savoir comment lire le
 * dessin : échelle, unités, conventions. Ici il porte la FORMULE du plafond —
 * c'est ce qui met le mécanisme du produit dans le premier écran, au lieu
 * d'une page « comment ça marche » que personne n'ouvre.
 */
function Cartouche() {
  return (
    <dl
      className="cartouche border-plate-500 text-plate-300"
      aria-label="Leyenda del trazado"
    >
      <div className="flex justify-between gap-4 px-4 py-2.5">
        <dt className="text-[11px] tracking-[0.16em] text-plate-400 uppercase">
          Escala
        </dt>
        <dd className="cote text-[12px] text-plate-100">
          km reales de carretera
        </dd>
      </div>
      <div className="px-4 py-2.5">
        <dt className="mb-1.5 text-[11px] tracking-[0.16em] text-plate-400 uppercase">
          Aporte máximo por puesto
        </dt>
        <dd className="cote text-[12.5px] leading-relaxed text-ochre-300">
          (km × ${(RATE_PER_KM_CENTS.standard / 100).toFixed(2)}/km ×{" "}
          {(1 + PRICE_RULE.detourTolerancePct / 100).toFixed(2)} + peajes) ÷
          (puestos + 1)
        </dd>
      </div>
      <div className="px-4 py-2.5">
        <dt className="mb-1 text-[11px] tracking-[0.16em] text-plate-400 uppercase">
          El + 1
        </dt>
        <dd className="text-[12.5px] leading-relaxed text-plate-200">
          Es el conductor. Paga su parte como todos, así que nunca recupera el
          costo completo. Por eso esto es compartir gastos y no cobrar pasaje.
        </dd>
      </div>
    </dl>
  );
}
