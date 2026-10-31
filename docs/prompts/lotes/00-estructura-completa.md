# Lote 00 — IA dedicada a la estructura completa

Copia este documento completo en una IA con acceso al repositorio. Encargo: STR-01. Responsable humano: P2; revisión P1/P4. Este lote prepara carpetas; no sustituye FND-01.

## Prompt para la IA

Eres la IA de estructura del proyecto DevPath. Crea el árbol completo de carpetas descrito abajo, preservando lo existente y sin implementar funcionalidades. Trabaja dentro del workspace del repositorio que te asigne el usuario; no asumas que otra computadora tiene la misma ruta absoluta.

Lee AGENTS.md aplicables, DevPath_Project_Description.md, docs/PLAN_DE_IMPLEMENTACION.md sección5, docs/TAREAS_PARA_IAS.md (STR-01/FND-01/GOV-02), docs/LOTES_PARA_IAS.md y docs/FLUJO_GITHUB.md. La estructura detallada de este encargo amplía el árbol abreviado del plan por petición del usuario.

Arquitectura: React+Vite/TypeScript en apps/web; API Express/TypeScript con auth integrado en apps/api; Skill Engine REST/TypeScript en apps/skill-engine. Solo API usa PostgreSQL y proveedor JSearch. El navegador consume /api/v1 de API y nunca engine/DB/proveedor directamente. Todo se ejecutará localmente; no se exige hosting ni IA generativa.

P1: backend/DB. P2: frontend/engine/infra/CI. P3: catálogo/contenido. P4: documentación/contratos. P5: aceptación manual. Tests E2E de código pertenecen P2; P5 aporta casos/evidencias, sin obligación de programarlos. No estás solo en el repo: no reviertas ni sobrescribas archivos ajenos.

### Paso 1 — Inspección y límites de Git

- Comprueba status, historial, ramas y archivos existentes. Al preparar este encargo se observó main/origin/main en c338a21 y no develop local. Es una referencia histórica, no algo que debas forzar.
- No reinicialices Git ni repitas un primer commit.
- Si develop ya existe y las condiciones de trabajo son correctas, usa chore/str-01-project-structure desde develop para preparar PR a develop.
- Si develop todavía no existe, puedes preparar los directorios como cambios locales revisables. Registra STR-01 pendiente de integración hasta que GOV-02 establezca develop. No hagas commit directo a main ni crees un merge de bootstrap ficticio.
- No hagas pushes, merges, tags, despliegues ni cambios de protección de ramas como parte de crear carpetas. Un commit local o PR posterior debe seguir el flujo y la autorización del responsable.
- Si una herramienta es rechazada por permisos, informa el rechazo y el alcance pendiente; no intentes eludirlo con otra herramienta.

### Paso 2 — Crear directorios

Expande cada expresión con llaves como directorios hermanos reales: no crees nombres que contengan llaves, comas o asteriscos. Respeta exactamente learning-paths, analyses, skill-engine y test-support para evitar dos convenciones.

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
        {auth,profile,skills,analyses,projects,cv,jobs,learning-paths}/
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
        {auth,profile,skills,analyses,projects,cv,jobs,learning-paths}/
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

Las carpetas de prompts y los documentos de planificación pueden existir ya: conservar contenido intacto. La existencia de una carpeta solo reserva su lugar, no representa una feature implementada.

### Paso 3 — Conservar en Git y documentar responsabilidades

- Agrega un .gitkeep de cero bytes solo en cada carpeta hoja que quedaría completamente vacía. Si ya tiene contenido real, no agregues otro marcador.
- No agregues .gitkeep en todos los ancestros ni en carpetas con archivos. No borres marcadores preexistentes de otros trabajos sin revisar su contexto.
- Puedes crear README.md breves en apps/web, apps/api, apps/skill-engine, packages/contracts, packages/catalog, packages/db, packages/test-support e infra, si no existen.
- Cada README indica responsabilidad, dueño humano, etapa y “Pendiente de implementación”; no incluye comandos que aún no existen ni afirma que los servicios arrancan.
- El README raíz pertenece a GOV-02; preservarlo si existe y no crearlo aquí.
- Crea docs/ESTRUCTURA_DEL_PROYECTO.md: árbol exacto, quién consume a quién, dueños, separación M0–M4 y relación STR-01→FND-01. Explica retirar .gitkeep cuando se incorpora contenido real.

Etapas: M0 herramientas/contratos/infra; M1 auth, perfil, skills y análisis manual; M2 projects/cv; M3 jobs/JSearch; M4 learning-paths y plantillas. Catalog es P3 con revisión técnica P2/P1; contratos P4 con revisión P1/P2; infra/CI P2 con revisión P1.

### Paso 4 — Manifiesto verificable

Crea docs/project-structure.json con:
- schemaVersion: 1.
- directories: una entrada por directorio real declarado, con path relativo POSIX, stage, owner y purpose. No incluir .git, node_modules ni directorios fuera del repo.
- anticipatedFiles: archivos posteriores con status:"pending" y createdByScaffolding:false. Esta lista es informativa y no exige crearlos.

Ejemplo de entrada:
```json
{
  "path": "apps/api/src/modules/auth/services",
  "stage": "M1",
  "owner": "P1",
  "purpose": "Casos de uso de autenticación; implementación pendiente."
}
```

AnticipatedFiles debe distinguir archivos de carpetas. Incluye como pendientes:
package.json, pnpm-workspace.yaml, pnpm-lock.yaml; manifiestos apps/paquetes;
apps/api/src/app.ts y server.ts;
apps/skill-engine/src/app.ts y server.ts;
packages/contracts/openapi/public.yaml y engine.yaml;
packages/catalog/technologies.json y learning-templates.json;
infra/compose.yaml.
La ruta canónica de Compose es infra/compose.yaml; infra/docker contiene Dockerfiles si OPS-01 los ubica ahí. No crear una segunda ruta Compose contradictoria.

### Paso 5 — Validar y entregar

1. Comprobar que todas las rutas del manifiesto y la expansión del árbol existen dentro del workspace.
2. Validar JSON y rutas únicas, sin ../ ni rutas absolutas.
3. Comprobar .gitkeep vacíos y únicamente en hojas sin contenido real.
4. Comparar diff/status con el estado inicial: preservar la descripción, los planes y archivos ajenos.
5. Enumerar directorios y archivos creados; informar existentes preservados y validaciones realmente ejecutadas.
6. Dejar docs/handoffs/lote-00.md con estado de STR-01, evidencia, rama si existe y acción para integrar antes de FND-01.
7. Preparar título de PR: "chore(structure): reserve complete DevPath project tree". Base develop; rama chore/str-01-project-structure.

Fuera de alcance: instalar dependencias; generar lockfile o manifiestos reales; crear app.ts/server.ts vacíos; YAML vacíos; SQL; endpoints; componentes; algoritmos; datos de catálogo inventados; claves, env, archivos CV, node_modules, builds, volúmenes, bases de datos o hosting. FND-01 y las siguientes tareas implementan esos archivos cuando correspondan.

Criterio final: árbol completo y trazable, ninguna funcionalidad ficticia, ningún archivo existente perdido. No marcar STR-01 integrada hasta que su PR esté mergeado en develop.

