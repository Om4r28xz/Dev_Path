# Estructura del proyecto DevPath

Estado revisado el 2 de noviembre de 2026: STR-01 y FND-01 están integradas. El árbol de abajo documenta la organización objetivo M0–M4; una carpeta reservada no implica que su función esté implementada. Consultar el README principal y los handoffs para el estado de cada módulo.

`project-structure.json` es el manifiesto original de STR-01: sus estados y descripciones de implementación pendiente reflejan aquel momento, no el progreso actual.

## Árbol reservado

```text
apps/
  web/
    public/
    src/
      app/
      components/
        ui/
        forms/
        feedback/
        layout/
      lib/
        http/
        session/
        query/
      styles/
      features/
        auth/
          components/
          pages/
          api/
          hooks/
        profile/
          components/
          pages/
          api/
          hooks/
        skills/
          components/
          pages/
          api/
          hooks/
        analyses/
          components/
          pages/
          api/
          hooks/
        projects/
          components/
          pages/
          api/
          hooks/
        cv/
          components/
          pages/
          api/
          hooks/
        jobs/
          components/
          pages/
          api/
          hooks/
        learning-paths/
          components/
          pages/
          api/
          hooks/
    tests/
      unit/
      integration/
  api/
    src/
      modules/
        auth/
          http/
          services/
          repositories/
          schemas/
        profile/
          http/
          services/
          repositories/
          schemas/
        skills/
          http/
          services/
          repositories/
          schemas/
        analyses/
          http/
          services/
          repositories/
          schemas/
        projects/
          http/
          services/
          repositories/
          schemas/
        cv/
          http/
          services/
          repositories/
          schemas/
        jobs/
          http/
          services/
          repositories/
          schemas/
        learning-paths/
          http/
          services/
          repositories/
          schemas/
      platform/
        config/
        db/
        errors/
        http/
        logging/
        middleware/
        storage/
    tests/
      unit/
      integration/
      fixtures/
  skill-engine/
    src/
      modules/
        analysis/
          extraction/
          matching/
          schemas/
      platform/
        config/
        errors/
        http/
        logging/
        middleware/
    tests/
      unit/
      integration/
      fixtures/
packages/
  contracts/
    openapi/
    src/
      public/
      internal/
    examples/
      public/
      internal/
  catalog/
    fixtures/
    docs/
  db/
    schema/
    migrations/
    seeds/
  test-support/
    src/
      factories/
      helpers/
infra/
  proxy/
  docker/
scripts/
tests/
  e2e/
    fixtures/
    flows/
docs/
  adr/
  acceptance/
  provider/
  handoffs/
  prompts/
    lotes/
.github/
  workflows/
  ISSUE_TEMPLATE/
```

Los README de área y los documentos existentes son contenido de trazabilidad; no representan archivos de aplicación ni configuración ejecutable.

## Límites y consumo

- El navegador ejecuta `apps/web` y consume únicamente rutas relativas de la API pública bajo `/api/v1`.
- `apps/web` puede consumir contratos públicos y contenido público del catálogo. Nunca consume código de DB, módulos internos de la API, el Skill Engine, almacenamiento ni JSearch directamente.
- `apps/api` contiene auth integrado, coordina los módulos de negocio, es el único proceso que usa PostgreSQL y será el único que integre JSearch en M3.
- `apps/api` llama al Skill Engine mediante un contrato REST interno autenticado.
- `apps/skill-engine` extrae tecnologías y calcula coincidencias. Puede consumir contratos internos y catálogo, pero no DB, auth ni JSearch.
- `packages/contracts` separa fronteras públicas e internas. P4 lo mantiene y P1/P2 revisan su correspondencia con los consumidores.
- `packages/catalog` contiene datos curados y versionados; P3 los mantiene con revisión técnica de P2/P1.
- `packages/db` pertenece a P1 y solo se integra en la API.
- `packages/test-support` y `tests/e2e` pertenecen a P2 y no deben convertirse en lógica compartida de producción.
- `infra` y CI pertenecen a P2 con revisión de P1. Compose existe en `infra/compose.yaml` y los Dockerfiles están bajo `infra/docker`.

## Dueños y etapas

| Zona | Dueño | Etapa y propósito |
| --- | --- | --- |
| Base, contratos e infraestructura | P2/P4, revisión P1 | M0: workspace, contratos, catálogo inicial, DB, CI y ejecución local. |
| auth, profile, skills, analyses y matching | P1/P2 | M1: registro, sesión, perfil, habilidades y análisis manual. |
| projects y cv | P1/P2 | M2: contexto profesional y CV privado. |
| jobs y proveedor | P1/P2, documentación P4 | M3: búsqueda y análisis mediante JSearch desde la API. |
| learning-paths y plantillas | P1/P2/P3 | M4: generación determinista y progreso manual. |
| aceptación | P5 | Casos y evidencias manuales; las pruebas E2E de código siguen siendo P2. |

## Relación STR-01 → FND-01

STR-01 reservó las carpetas, sus límites y su trazabilidad. FND-01 añadió herramientas reales sobre ese árbol y ambas tareas ya están integradas. Este párrafo describe la división histórica del trabajo; no indica una tarea pendiente de bootstrap.

Un `.gitkeep` solo conserva una hoja vacía en Git. Debe eliminarse en el mismo cambio que incorpora el primer archivo real de esa hoja; no se mantiene junto a contenido efectivo.
