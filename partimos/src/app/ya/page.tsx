import type { Metadata } from "next";
import { YaExpress } from "./YaExpress";

/**
 * /ya — LA VOIE EXPRESS. La page qui réduit le temps-jusqu'au-viaje à
 * deux taps : elle connaît ta rutina, elle a déjà cherché, elle te tend
 * TON puesto. Personnelle par construction — hors index.
 */
export const metadata: Metadata = {
  title: "Tu próximo viaje, en dos taps",
  robots: { index: false, follow: true },
};

export default function YaPage() {
  return (
    <main id="contenido">
      <YaExpress />
    </main>
  );
}
