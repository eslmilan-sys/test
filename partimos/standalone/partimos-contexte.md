# Partimos — contexte pour une critique de design

Ce document accompagne `partimos-home-exact.html`, qui est la page d'accueil
**exacte** du site en production, exportée avec son CSS et ses polices
intégrés. Rien n'a été reconstruit ou simplifié.

Lis ce document avant de proposer quoi que ce soit : la moitié des contraintes
ci-dessous ne se devinent pas en regardant la page, et une suggestion qui les
ignore est inapplicable.

---

## 1. Le produit

**Partimos** met en relation des particuliers qui partagent les frais d'un
trajet interurbain au Panama. Six corridors ouverts entre Ciudad de Panamá et
l'intérieur du pays : Coronado, Penonomé, Santiago, Chitré, Las Tablas, David.

**Le public.** Des gens qui descendent à l'intérieur le vendredi après-midi et
remontent le dimanche midi. Aujourd'hui ils prennent le bus depuis le terminal
d'Albrook, ou ils demandent dans des groupes WhatsApp. Ils cherchent sur leur
téléphone, en données mobiles, souvent en déplacement.

**Le canal principal est le SEO.** L'intention de recherche existe déjà :
« pasaje Panamá David », « cómo llegar a Chitré ». Côté conducteur il n'y a
aucune intention de recherche — personne ne tape « compartir gastos de mi
viaje ». C'est pourquoi l'accueil sert le passager d'abord et convertit le
conducteur à travers la demande qu'il voit.

**Aucun paiement sur la plateforme.** Le passager paie le conducteur
directement, en espèces ou par Yappy, le jour du trajet.

---

## 2. Les six règles non négociables

Ce ne sont pas des préférences. Ce sont les conditions qui séparent le
covoiturage à frais partagés du transport rémunéré non autorisé. Une
suggestion qui en viole une est inapplicable, quelle que soit sa qualité.

1. **Le conducteur ne gagne jamais d'argent.** L'aporte par siège est plafonné
   par `(km × taux véhicule × 1,10 + péages) ÷ (sièges + 1)`. Le « + 1 » est le
   conducteur : il paie sa part, donc carro plein il ne récupère jamais 100 %
   de son coût. Le plafond est appliqué par une contrainte en base de données,
   pas par une page de conditions.

2. **La plateforme ne touche jamais l'argent.** Pas de carte, pas de séquestre,
   pas de commission. Ne propose pas de checkout, de panier, de paiement en
   ligne ni de « réserver et payer maintenant ».

3. **Le prix ne suit jamais la demande.** Aucune tarification dynamique, aucune
   hausse au Carnaval, aucun surge sur le dernier siège. Le calcul ne prend en
   entrée ni date, ni disponibilité, ni compteur.

4. **Le conducteur maîtrise son itinéraire.** Il pose ses points de passage ;
   le passager propose, il accepte ou refuse. Jamais de dispatch automatique.

5. **Aucune promesse de revenu.** Les mots « gana dinero », « ingresos » et
   « ganancias » sont interdits partout — interface et marketing. On écrit
   « recuperas », « aporte », « compartir gastos ».

6. **Aucune photo ni numéro de cédula stockés.** La vérification passe par un
   prestataire externe ; on conserve le résultat et la référence du dossier.

**Le piège classique :** quelqu'un proposera de facturer la prise en charge à
domicile comme un supplément. Non — un service de ramassage tarifé est du
transport commercial. La version conforme produit le même effet : le détour
change la distance, donc le coût, donc le plafond calculé par la même formule.
L'écart s'affiche en kilomètres, jamais en dollars.

---

## 3. Le système visuel : « Sol »

### Palette

| Rôle | Valeur | Contraste vérifié |
|---|---|---|
| Fond de page (crème) | `#FFFBEB` | — |
| Texte principal | `#26221C` | 15,3:1 sur le crème |
| Texte secondaire | `#6B5F4E` | 6,0:1 |
| **Action** (bouton) | `#F59E0B` | texte encre dessus : **7,4:1** |
| Ambre foncé (texte) | `#B45309` | 5,1:1 |
| **Lecture** (liens, focus) | `#1D4ED8` | 6,5:1 |
| Marque (logo seul) | `#A0D838` | — |
| Erreur seule | `#B3261E` | 7,4:1 |

### Les trois décisions qui portent tout

1. **Le fond est crème, pas blanc.** La page est chaude avant qu'un élément
   soit dessiné. C'est le geste le moins cher pour rendre une interface gaie.

2. **Le bouton est ambre avec du texte ENCRE, pas blanc.** À 7,4:1 il devient
   l'élément le plus lisible de la page. Le réflexe habituel — du blanc sur la
   couleur de marque — produit presque toujours un bouton moins lisible que le
   texte courant qui l'entoure.

3. **Le bleu est la couleur de lecture, l'ambre la couleur d'action.** L'ambre
   ne marque rien d'autre qu'une action, donc il ne se confond avec rien.

### Typographie

- **Gabarito** pour les titres.
- **Nunito Sans** pour le texte. Poids 300 pour les accroches, 800 pour les
  titres : la hiérarchie se fait à la **graisse** autant qu'à la taille.

### Le motif : le tracé

C'est ce qui tient l'ensemble. Un **trait pointillé ambre**, toujours le même,
revient à quatre endroits : il longe le bas du premier écran, il relie les
trois étapes de « Cómo funciona », il porte le geste du paiement (`Tú ──▸ A`),
et il mesure les six corridors. Un ruban d'asphalte vertical traverse en plus
la page au-dessus de 1160 px.

C'est délibéré : sans motif répété, une page n'est qu'une suite de blocs, et
c'est exactement le reproche qui a été fait à la version précédente.

### Refusé délibérément — ne le re-propose pas

- **Tout dégradé.** Retiré du système, pas seulement de ses appels. L'emphase
  se fait à la graisse, à la taille et à un aplat.
- **Le sur-titre en capitales au-dessus d'un titre.** Le titre porte son poids.
- **La grille de cartes identiques** icône + titre + texte comme structure de
  page. Le client l'a rejetée deux fois. Les six routes sont donc des **pistes
  comparables** — largeur fixe, remplissage proportionnel à la distance — et
  surtout pas six cartes.
- **Les émojis en guise d'icônes.** Icônes SVG au trait, 1,9 px.
- **Toute donnée inventée présentée comme réelle.** Il n'y a aucun utilisateur
  réel, aucun témoignage, aucun compteur véritable. Les trajets affichés sont
  des exemples déterministes et l'interface le dit. Ne propose pas d'ajouter
  des témoignages, des logos de presse ou des chiffres de traction.

### Registre de langue

Espagnol du Panama, tutoiement. « carro » et non « coche », « puesto » et non
« asiento ».

---

## 4. Ce que contient la page, dans l'ordre

1. **Barre de navigation** collante
2. **Premier écran** — titre, carte de recherche, quatre preuves, bandeau des
   trajets publiés en défilement continu
3. **Pasos** — comment ça marche
4. **Historias** — carrousel éditorial horizontal
5. **Pago** — le paiement hors plateforme
6. **Conductores** — pour ceux qui conduisent
7. **Confianza** — sécurité et vérification
8. **Corredores** — les six routes, en pistes proportionnelles
9. **DriverCta** — appel à publier
10. **Faq** — questions fréquentes
11. **Pied de page** avec la mention légale
12. **Barre d'action basse** collante sur mobile

Un **ruban d'asphalte** décoratif traverse les sections au-dessus de 1160 px,
avec un marquage au sol animé par le défilement natif (`animation-timeline`).

---

## 5. Contraintes techniques

- **Next.js 16 App Router**, React 19, TypeScript, **Tailwind CSS v4** avec des
  jetons `@theme`. Toute proposition doit être exprimable en classes Tailwind
  ou en jetons CSS.
- **Export statique** vers GitHub Pages : aucune page ne peut dépendre d'un
  service tiers pour s'afficher.
- **WCAG 2.1 AA tenu et vérifié** par axe-core sur sept pages en 1440 et
  390 px, sans aucune violation. Toute proposition doit tenir ce niveau — et
  les rapports de contraste sont calculés, pas estimés à l'œil.
- **Android d'entrée de gamme en données mobiles.** La performance est ici une
  question d'accessibilité.
- `prefers-reduced-motion` respecté : les animations liées au défilement voient
  leur *timeline* coupée, pas seulement leur durée écrasée.

---

## 6. Où j'aimerais un avis

Par ordre d'intérêt :

1. **Le rythme vertical entre sections.** Elles font toutes à peu près la même
   hauteur et le même espacement ; la page manque d'alternance dense/aéré.
   C'est le point qui reste le plus faible.
2. **Le motif du tracé va-t-il assez loin ?** Il revient à quatre endroits.
   Est-ce une signature, ou faut-il l'étendre — ou au contraire l'enlever
   d'un endroit où il ne dit rien ?
3. **La section paiement.** C'est l'argument central du produit. Elle vient
   d'être resserrée en un seul bloc ; est-ce qu'elle se lit maintenant comme
   l'argument principal, ou juste comme une section de plus ?
4. **Le premier écran sur mobile.** La recherche est au-dessus de la ligne de
   flottaison, mais l'ensemble reste dense.
5. **Les quatre preuves** sous le titre — deux colonnes séparées de filets.
   Elles fonctionnent, sans plus.

À ne PAS proposer, déjà tranché : le tableau à colonnes pour les corridors (il
défilait horizontalement sur téléphone), la flèche verticale entre deux cartes
dans la section paiement (elle mangeait un quart d'écran), un schéma expliquant
que Partimos ne touche pas l'argent (c'est notre position, pas une question que
le visiteur se pose), et les rayures diagonales en fond (effet papier peint).

---

## 7. Une remarque sur ce fichier HTML

Le JavaScript a été retiré : l'export statique contient déjà tout le balisage
rendu, et les scripts ne portaient que l'hydratation React. **Les interactions
ne fonctionnent donc pas** — les listes déroulantes, les flèches du carrousel
et les onglets de la recherche sont figés dans leur état par défaut. Le rendu
visuel, lui, est exact.
