# Plan de versiones M1 — propuesta sin aplicar

Estado: bloqueada la publicación. No se cambiaron manifiestos ni lockfile. Requiere aceptación humana, OPS-01 y revisión final del candidato (M1-A11Y-001 ya integrada/revalidada por PR32) antes de preparar release/0.1.0.

| Manifiesto privado                 | Versión actual | Propuesta a revisar en REL-01 |
| ---------------------------------- | -------------- | ----------------------------- |
| package.json / devpath             | 0.0.0          | 0.1.0                         |
| apps/api/package.json              | 0.0.0          | 0.1.0                         |
| apps/web/package.json              | 0.0.0          | 0.1.0                         |
| apps/skill-engine/package.json     | 0.0.0          | 0.1.0                         |
| packages/catalog/package.json      | 0.0.0          | 0.1.0                         |
| packages/contracts/package.json    | 0.0.0          | 0.1.0                         |
| packages/db/package.json           | 0.0.0          | 0.1.0                         |
| packages/test-support/package.json | 0.0.0          | 0.1.0                         |

Son8 paquetes privados; no se propone publicarlos a npm. Omar/P1/P2 deben decidir la estrategia y aplicar el cambio solo en la rama release autorizada. Revisar lockfile con pnpm11.22.0 y ejecutar instalación frozen; no editarlo para ocultar conflictos.

La versión de release **no** sustituye las versiones de datos/protocolo: OpenAPI público1.1.0, interno1.0.0, catálogo1.0.0 y extractor/scoring1.1.0 continúan independientes. No regenerar contratos con una versión ficticia ni modificar snapshots históricos para que coincidan con0.1.0.

Node22 >=22.16 <23 y pnpm11.22.0; PostgreSQL16 oficial. Registrar commit candidato, migraciones0000–0003, instalación desde vacío y upgrade con datos, y repetir tests/build/E2E/smoke tras aplicar versiones. No se publica tag hasta aprobación/merge humano y smoke del commit exacto. Guía: [M1-PUBLICATION-PLAN](M1-PUBLICATION-PLAN.md).
