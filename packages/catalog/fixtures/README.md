# Corpus CAT-02

30 entradas sintéticas ES/EN, incluyendo dos entradas límite vacías; ninguna proviene de vacantes privadas ni CVs. Catálogo consumido: `../technologies.json`, versión 1.0.0. No modifica OpenAPI ni el extractor.

Cada caso tiene `id`, `language`, `jobText`, `requiredSkillIds`, `tags` y `rationale`. Los IDs esperados son únicos y ordenados; la justificación explica la etiqueta individual. Los tags agrupan alias, signos, nombres similares, repeticiones, negaciones, ausencia, límites de palabra, desconocidos y mayúsculas.

## Criterio de etiquetado

Las etiquetas se redactaron leyendo el catálogo y el plan, sin copiarlas de la salida del motor. JavaScript no implica Java; React Native no implica React web; Node.js no implica JS independiente; GitHub/GitLab no implican Git; MySQL/PostgreSQL no implican SQL. C no implica C++/C#. Los alias presentes varias veces producen un solo ID. Se excluyen negaciones explícitas de requisito, incluyendo «ni»; otras construcciones ambiguas requieren revisión humana. No se intenta resolver toda la semántica de una vacante.

Los casos 023 y 024 prueban el extractor directamente, no un flujo HTTP exitoso. El contrato interno requiere `jobText` de longitud 1–20000: 023 no cumple ese contrato; 024 tiene longitud positiva pero no es contenido útil. Un conjunto esperado vacío no significa que la API acepte la solicitud. No se cambian contratos ni validaciones HTTP.

## Verificación

Desde la raíz:

```powershell
node packages/catalog/scripts/validate-catalog.mjs
node packages/catalog/scripts/validate-corpus.mjs
pnpm --filter @devpath/catalog test
```

El validador comprueba forma, versiones, unicidad de casos/textos/IDs esperados, referencias al catálogo, cobertura ES/EN, categorías de casos y cobertura positiva de las diez tecnologías. Está conectado al script `test` del paquete, también ejecutado por build y CI existentes. Valida datos; no certifica que el extractor cumpla las expectativas ni sustituye revisión de etiquetas por personas.

## Diferencias conocidas con ENG-01

Comparación directa del extractor 1.0.0 en la base a28e625, usando Node 24.14.0 y eliminación de tipos TypeScript en memoria, sin cambiar archivos del engine: 17 coincidencias y 13 diferencias. No es una prueba del servidor HTTP ni del stack completo.

| Casos CAT-02       | IDs adicionales observados respecto a la etiqueta |
| ------------------ | ------------------------------------------------- |
| 002, 012, 028, 029 | java                                              |
| 004, 014           | react                                             |
| 008                | javascript (subcadena de Node.js/React.js)        |
| 017                | docker                                            |
| 018                | git                                               |
| 019                | java, javascript                                  |
| 020                | react, react-native                               |
| 025                | git                                               |
| 026                | sql                                               |

No hay IDs esperados ausentes en esta comparación. Los defectos de límites, precedencia y negación corresponden al trabajo posterior del extractor (ENG-02); no se corrigen en CAT-02 ni se suavizan las etiquetas para ocultarlos. Los esperados siguen siendo objetivos de aceptación.

Pendiente: P2 revisa ambigüedad y consumo técnico; P5 revisa legibilidad. Betsy debe revisar estas decisiones y validar su contribución antes de publicarla. No se afirma aprobación humana.
