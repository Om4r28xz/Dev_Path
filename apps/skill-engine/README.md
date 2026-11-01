# Skill Engine

Servicio REST interno en TypeScript. Expone `POST /internal/v1/analyze` conforme a `packages/contracts/openapi/engine.yaml` 1.0.0. Recibe texto de vacante, IDs de habilidades del candidato y versión de catálogo; no recibe identidad ni datos personales. Solo la API lo invoca con credencial de servicio.

- Responsable: P2.
- Desarrollo: `pnpm --filter @devpath/skill-engine dev`.
- Build: `pnpm --filter @devpath/skill-engine build`.
- Pruebas: `pnpm --filter @devpath/skill-engine test`.
- Puerto predeterminado: `127.0.0.1:3001`.

El extractor 1.1.0 usa el catálogo 1.0.0, normalización NFKC y comparación sin distinguir mayúsculas. Respeta límites Unicode y signos significativos; prefiere el alias más específico cuando dos se superponen. Devuelve IDs ordenados de forma estable y hasta 20 menciones por habilidad, con texto y offsets del original. Reconoce negaciones frecuentes como “no se requiere X”, “no experience with X is required” y “X is not required”. Son reglas locales: frases con coordinación o contexto complejo pueden requerir revisión; no interpreta nivel de dominio ni distingue requisitos deseables. El corpus sintético CAT-02 cubre 30 casos ES/EN.

El scoring 1.1.0 compara conjuntos: coincidencias = requeridas ∩ candidato, faltantes = requeridas − candidato. El porcentaje es `round(100 × coincidencias / requeridas)`; vale `null` cuando no hay tecnologías requeridas y 0 cuando sí las hay pero el candidato no tiene habilidades registradas. No representa probabilidad de contratación.
