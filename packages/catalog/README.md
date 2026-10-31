# Catálogo

Catálogo curado y versionado de tecnologías, alias y categorías. P3 cura el contenido y P2 revisa su consumo técnico.

## Esquema 1.0.0

La raíz contiene `version` y `technologies`. Cada tecnología tiene:

- `id`: identificador textual estable en minúsculas; persiste en perfiles y análisis.
- `name`: etiqueta de presentación, incluyendo signos como `C#` y `C++`.
- `category`: una de `language`, `library`, `framework`, `runtime`, `tool` o `platform`.
- `aliases`: objetos `{ value, reason }`; la justificación permite revisar por qué un término no mezcla tecnologías.

La normalización para detectar colisiones ignora mayúsculas, espacios y separadores `.`, `_` y `-`, pero conserva signos semánticos como `#` y `+`. Java/JavaScript y React/React Native son entradas distintas. SQL no representa una base de datos concreta.

Ejecuta `pnpm test` en este paquete para comprobar versión, forma, categorías, IDs requeridos, unicidad global de IDs/nombres/alias y justificaciones no vacías.
