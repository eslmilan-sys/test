/**
 * El armazón HTML de la versión web.
 *
 * Sirve Inter Tight desde la propia app en vez de pedirla a Google, que es lo
 * que hace `design_system/tokens/fonts.css`. Misma cara, sin depender de la
 * red: en Apple manda Helvetica Neue y en el resto entra Inter Tight, que es
 * el orden del traspaso. Sin esto el navegador caía a Arial y ni la anchura de
 * los textos ni el interletrado se parecían a los del diseño.
 */

import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang="es-PA">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: estilos }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const pesos = [
  ['Regular', 400],
  ['Medium', 500],
  ['SemiBold', 600],
  ['Bold', 700],
] as const;

const estilos = `
${pesos
  .map(
    ([archivo, peso]) => `@font-face {
  font-family: "Inter Tight";
  font-style: normal;
  font-weight: ${peso};
  font-display: swap;
  src: url("/fuentes/InterTight-${archivo}.ttf") format("truetype");
}`,
  )
  .join('\n')}

body { background-color: #FAF7F3; }
`;
