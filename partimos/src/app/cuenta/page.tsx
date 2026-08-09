import type { Metadata } from "next";
import { AccountSpace } from "./AccountSpace";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Tus viajes, tu perfil, tu carro y tu verificación.",
  alternates: { canonical: canonical("/cuenta") },
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return (
    <main id="contenido" className="bg-plate-50 pb-16">
      <AccountSpace />
    </main>
  );
}
