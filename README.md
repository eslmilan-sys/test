# The DOL Method — Website

## Estructura de archivos

```
dol-method-website/
├── index.html          → Landing page principal
├── metodo.html         → Curriculum de 7 módulos
├── sobre.html          → Bio de Milan + credenciales
├── precios.html        → Planes + tabla comparativa
├── recursos.html       → Lead magnet + descarga PDF
├── blog/
│   └── index.html      → Listado de artículos
├── css/
│   └── main.css        → Design system compartido
├── js/
│   └── main.js         → Nav, acordeón, contadores, ECG
└── README.md
```

## Design System

| Token | Valor |
|-------|-------|
| Background | `#060606` |
| Bg alternado | `#0c0c0c` / `#111111` |
| Primario (azul) | `#00b1ff` |
| Acento | `#117fec` |
| Texto | `#ffffff` |
| Texto apagado | `#c1c1c1` / `#7a7a7a` |
| Fuente principal | Poppins |
| Fuente secundaria | Montserrat |
| Radio botones (pill) | 50px |
| Radio tarjetas | 20px |

## Páginas

### index.html — Landing principal
- Hero con animación ECG y contadores animados
- Sección problema (4 tarjetas)
- Preview del método (7 módulos)
- 3 personas (Andrés, Lucía, Tomás)
- Bio de Milan
- Precios (3 planes)
- FAQ acordeón
- Captura de email (lead magnet)

### metodo.html — El Método
- Timeline vertical de 7 módulos con detalle completo
- Stack de herramientas IA (Claude, GPT-4, Descript, Canva)
- 6 resultados esperados a 12 meses

### sobre.html — Sobre Milan
- Foto placeholder (reemplazar con foto real)
- Bio completa y timeline profesional
- 4 razones por las que el insider knowledge importa

### precios.html — Precios
- 3 planes con tabla comparativa completa
- Tabla feature-by-feature
- Cálculo de ROI por tipo de engagement
- FAQ específico de precios e impuestos

### recursos.html — Recursos / Lead Magnet
- Mockup del PDF "7 criterios DOL de pharma"
- Formulario con especialidad y país (para segmentación)
- Recursos adicionales (próximamente)
- Secuencia post-descarga explicada

### blog/index.html — Blog
- Artículo destacado
- 3 artículos placeholder
- Sidebar con temas, recurso gratuito y bio del autor

## Para activar el sitio

1. **Foto de Milan**: Reemplazar el placeholder `.photo-frame` en `sobre.html` con una `<img>` real.

2. **Email/CRM**: Conectar los formularios `.lead-form` a tu proveedor (MailerLite, ConvertKit, etc.) agregando el `action` del formulario y cualquier campo oculto requerido.

3. **Checkout**: Reemplazar los links `href="recursos.html"` de los botones de compra con los links reales de Hotmart/Kajabi/Stripe.

4. **Dominio**: Subir los archivos a cualquier hosting estático (Netlify, Vercel, GitHub Pages) o a tu servidor.

5. **Google Fonts**: Las fuentes se cargan via CDN. No requiere configuración adicional.

## Notas de implementación

- Sin dependencias externas (solo Google Fonts via CDN)
- CSS y JS vanilla — cero frameworks
- Mobile responsive en todos los breakpoints
- Scroll reveal via IntersectionObserver
- Contadores animados en hero y pricing
- Acordeón FAQ con animación CSS nativa
- Animación ECG SVG en hero de index.html

---
*Generado con The DOL Method design system · webdorks.com template adaptado*
