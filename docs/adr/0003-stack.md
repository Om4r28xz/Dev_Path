# ADR 0003: Monorepo TypeScript y herramientas comunes

- Estado: aceptada como propuesta técnica para M0–M1
- Fecha: 2026-10-31
- Clasificación: propuesta técnica; versiones exactas se fijan en FND-01
- Responsables de revisión: P1, P2 y P4

## Contexto

Web, API y Skill Engine necesitan contratos compatibles, controles reproducibles y límites de importación claros. El equipo necesita una base pequeña que pueda ejecutarse localmente y crecer por entregas sin incorporar SDK de IA ni infraestructura de despliegue prematura.

## Decisión

Se adopta un monorepo con pnpm workspaces y TypeScript estricto:

| Área | Selección | Estado |
| --- | --- | --- |
| Web | React, Vite, React Router y TanStack Query. | Propuesta aceptada. |
| API | Node.js, Express, Zod, Drizzle y `pg`. | Propuesta aceptada. |
| Skill Engine | Node.js, Express y TypeScript, como servicio REST independiente. | Proceso separado confirmado; librerías propuestas aceptadas. |
| Contratos | OpenAPI versionado como fuente de verdad; tipos y validadores consumidores se generan o se comprueban contra esa fuente. | Dirección elegida; automatización corresponde a CTR-01 sobre FND-01. |
| Pruebas | Vitest para unidades/integración y Playwright para recorridos críticos. | Propuesta aceptada. |
| Calidad | TypeScript estricto, ESLint, Prettier, lint, typecheck, test y build desde la raíz. | Propuesta aceptada. |

FND-01 fijará versiones exactas compatibles en manifiestos y `pnpm-lock.yaml`; no se usarán rangos flotantes como `latest`. El workspace debe impedir que la web o el engine importen el paquete de base de datos.

Para evitar DTO divergentes, OpenAPI es la definición canónica de las fronteras HTTP. CTR-01 añadirá especificaciones, ejemplos y un script que valide los ejemplos y genere o compruebe artefactos TypeScript. No se mantendrán en paralelo tres definiciones manuales del mismo DTO.

## Consecuencias

- Los cambios de contrato comienzan en OpenAPI y deben pasar revisión conjunta P4 + P1/P2 antes de cambiar consumidores.
- El lockfile y los manifiestos raíz se serializan bajo responsabilidad de P2.
- La base M0 contiene arranque y configuración reales, no lógica de negocio ni funciones M1 simuladas.
- La instalación limpia y los comandos raíz son parte del contrato del repositorio.
- Una futura sustitución de herramienta requiere un ADR o la actualización explícita de este antes de afectar a otros paquetes.

## Evidencia y revisión pendiente

Las selecciones proceden del plan de implementación. P1 debe revisar límites de API/DB y P2 compatibilidad de workspace y versiones en los PR de GOV-01/FND-01. GOV-01 no afirma que estas herramientas ya estén instaladas.
