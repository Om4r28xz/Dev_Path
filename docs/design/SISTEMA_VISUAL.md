# Sistema visual de DevPath

Estado: VIS-01, propuesta implementada en `feature/vis-01-design-system`. VIS-02 y VIS-03 deben aplicar estos patrones a sus pantallas; VIS-04 registra la aceptación del conjunto. Este documento describe la UI, no cambia el contrato de `/api/v1`.

## Principios

La tarea y el siguiente paso deben quedar visibles sin recorrido innecesario. El rosa identifica marca, enlaces, acción principal y foco; las superficies grandes son neutras. Un resultado de análisis expresa cobertura de tecnologías detectadas, nunca probabilidad de empleo. Los estados vacíos, errores y carga llevan texto explícito.

## Tokens

La fuente de verdad es [tokens.css](../../apps/web/src/styles/tokens.css). [index.css](../../apps/web/src/styles/index.css) contiene reglas de base y patrones compartidos. No copiar colores, radios ni espaciados literales en una pantalla nueva.

| Rol              | Token                            | Valor               | Uso                                           |
| ---------------- | -------------------------------- | ------------------- | --------------------------------------------- |
| Fondo            | `--color-canvas`                 | `#faf9f8`           | Página                                        |
| Superficie       | `--color-surface`                | `#ffffff`           | Cabecera, controles, paneles                  |
| Superficie suave | `--color-surface-soft`           | `#f4f1f1`           | Agrupaciones discretas                        |
| Texto            | `--color-text`                   | `#28272d`           | Texto principal                               |
| Texto secundario | `--color-text-muted`             | `#59555e`           | Ayudas, metadatos                             |
| Borde            | `--color-border`                 | `#d4ced1`           | Separación sin sombra                         |
| Marca            | `--color-brand`                  | `#823b5b`           | CTA, enlace, foco                             |
| Marca hover      | `--color-brand-hover`            | `#682c48`           | Hover de acciones                             |
| Marca suave      | `--color-brand-soft`             | `#f9eef2`           | Navegación activa                             |
| Error            | `--color-danger`                 | `#a42d36`           | Error, eliminación                            |
| Informativo      | `--color-info-text/soft`         | `#255477 / #eaf3f8` | Estado informativo                            |
| Éxito            | `--color-success-text/soft`      | `#1d583c / #eaf5ef` | Confirmación                                  |
| Aviso            | `--color-warning-text/soft`      | `#744d00 / #fff6df` | Estado desactualizado                         |
| Inhabilitado     | `--color-disabled-text/disabled` | `#4b454b / #e9e6e7` | Controles deshabilitados                      |
| Checkbox         | `--checkbox-size`                | `1.5rem` (24 px)    | Entrada visible en etiqueta de al menos 44 px |

Contraste calculado con luminancia relativa sRGB: texto principal sobre blanco 14.8:1; secundario sobre blanco 7.28:1; marca sobre blanco 7.70:1; blanco sobre marca 7.70:1; error sobre blanco 6.98:1; texto informativo en su fondo 7.15:1; éxito 7.48:1; aviso 6.95:1. Estos valores cubren las parejas indicadas, no sustituyen una inspección de todos los estados.

La escala tipográfica es 14/16/18/20/24 px para ayuda, cuerpo, destacado, subtítulo y sección. El título de pantalla fluye de 28 a 36 px. La altura de línea del cuerpo es 1.55 y la de títulos 1.2. Espaciados: 4, 8, 12, 16, 20, 24, 32, 40 y 48 px. El contenido general tiene máximo 72 rem; formularios 40 rem; lectura continua debe quedar cerca de `--reading-width` (64 caracteres). Los radios de 6 y 10 px agrupan sin apariencia de tarjetas anidadas. La sombra `--shadow-raised` se reserva para diálogos.

## Composición y navegación

[AppLayout](../../apps/web/src/components/layout/AppLayout.tsx) usa cabecera neutra, ancho máximo, navegación con estado activo textual y enlace para saltar al contenido. La ruta y las etiquetas siguen siendo las existentes. A 320 px, la navegación y la cuenta se reordenan en filas; no se ocultan destinos. `.page-form` es una columna de ancho limitado para flujos M1. `.surface` agrupa contenido con un único borde, sin tarjeta dentro de tarjeta salvo que haya jerarquía de datos real.

## Componentes y estados

- [Button](../../apps/web/src/components/ui/Button.tsx): `primary` para una acción principal por contexto; `secondary` para alternativa; `danger` para eliminación. El estado `isLoading` bloquea un segundo envío y muestra texto de espera. `disabled` conserva contraste y no se usa para ocultar instrucciones.
- [TextField](../../apps/web/src/components/forms/TextField.tsx): etiqueta nativa, atributo `required`, error asociado por `aria-describedby` y `aria-invalid`. Para textarea o select, usar `.field`, `.field__label`, `.field__input`, `.field__hint` y `.field__error` con la misma asociación.
- Checkbox: `.checkbox-option` y entrada nativa; el texto completo es etiqueta clicable. El estado seleccionado se comunica por `checked`, no solo por color. La variante heredada `.profile-skill-option` conserva el mismo tamaño hasta VIS-02.
- [Alert](../../apps/web/src/components/feedback/Alert.tsx): `info`, `success`, `warning`, `error`. Errores y avisos usan `role=alert`; información y éxito usan `role=status`. No mostrar el mismo mensaje de error en dos regiones vivas.
- [StatePanel](../../apps/web/src/components/feedback/StatePanel.tsx): carga, vacío y error con título, explicación y acción opcional. Usar un verbo útil en la acción de reintento. Mantener el contenido del formulario al fallar.
- Diálogo: `.dialog-surface` viste un `<dialog>` nativo con título y descripción asociados. La confirmación de borrado conserva cancelación con Escape, retorno de foco y bloqueo mientras está pendiente. VIS-03 migrará el diálogo de historial al patrón compartido junto con la revisión de la pantalla.
- Listas: usar `<ul>/<li>` para colecciones, `.surface` si necesitan separación visual. La lista de historial conserva su estilo heredado hasta VIS-03; entonces deberá reemplazar sus literales visuales por tokens.

Todos los controles tienen foco visible de 3 px. El target mínimo para navegación y botones es 44 px. Hover no sustituye foco; errores incluyen texto. Las animaciones se limitan a cambios sobrios y respetan `prefers-reduced-motion`.

## Extensión para M2–M4

PRJ-02, CV-02, JSR-04 y LRN-04 consumen los tokens y componentes anteriores. Un patrón nuevo se añade primero a `apps/web/src/components` o `apps/web/src/styles` dentro del PR de su pantalla y se documenta aquí. Mantener componentes React para estructura, semántica y estado; CSS solo define presentación. Reutilizar `/api/v1` y los DTO existentes, sin inferir nuevos campos de la apariencia visual. VIS-04 debe revisar móvil, zoom real, teclado, lector y lenguaje antes de considerar completa la guía.
