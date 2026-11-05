# Guía de contenido y plantillas de aprendizaje — LRN-01

Versión del contenido: `1.0.0` (`packages/catalog/learning-templates.json`), alineada con el catálogo `1.0.0` (`packages/catalog/technologies.json`).

## 1. Propósito y principios editoriales

Las plantillas de `learning-templates.json` permiten que el generador determinista de la API (`LRN-02`) construya rutas de aprendizaje reproducibles a partir de un análisis guardado (`required_skill_ids`, `matched_skill_ids`, `missing_skill_ids`) y del portafolio actual del usuario (`app.projects`).

Cada plantilla cumple las siguientes reglas:

1. **IDs conocidos del catálogo:** cada `skillId`, `prerequisiteSkillIds[]` y `compatibleProjectSkillIds[]` debe existir en `packages/catalog/technologies.json`.
2. **Grafo de prerequisitos acíclico (DAG) y orden explicable:**
   - Si una tecnología faltante declara prerequisitos (`prerequisiteSkillIds`) que el candidato tampoco tiene cubiertos en el snapshot del análisis, esos prerequisitos se anteponen antes de la tecnología dependiente.
   - A igual nivel topológico, el desempate es alfabético por `skillId` para garantizar determinismo absoluto.
   - Razones explícitas:
     - Si la tecnología está en `missing_skill_ids` y no fue requerida como prerequisito de otra: se explica que figura entre las habilidades faltantes del análisis guardado.
     - Si la tecnología se añade por expansión de prerequisito (o es a la vez faltante y prerequisito de otra tecnología faltante): la razón explica explícitamente qué tecnología dependiente la requiere como base previa.
3. **Conexión con proyectos existentes del usuario:**
   - Cuando el usuario posee al menos un proyecto propio cuyas `skillIds` intersectan con `compatibleProjectSkillIds` de la plantilla (eligiendo de forma determinista el proyecto compatible más reciente por `(created_at DESC, id DESC)`, o priorizando aquel que ya incluye el `skillId` o sus prerequisitos), el paso referencia ese `projectId` y utiliza `projectExtensionActivity` (sustituyendo `{projectTitle}`).
   - Cuando no existe un proyecto compatible, `projectId` es `null` y se utiliza `standaloneActivity`.
   - En ambos casos, el texto persistido del paso incluye la actividad práctica y la evidencia autodeclarada sugerida (`suggestedEvidence`), de modo que si el proyecto se elimina después (`ON DELETE SET NULL`), el texto histórico de la actividad sigue siendo completo y comprensible.
4. **Sin promesas laborales ni estimaciones de dominio falsas:**
   - Ningún título, objetivo, actividad o mensaje promete contratación, entrevistas, seniority ni dominio certificado.
   - Completar un paso registra avance autodeclarado sobre la ruta y **no añade automáticamente la tecnología a `/api/v1/me/skills`** ni modifica porcentajes históricos de compatibilidad.
5. **Caso de cero faltantes (`missing_skill_ids = []`):**
   - No se inventan carencias ni pasos de relleno. La ruta se crea con `steps: []`, `progress: { completed: 0, total: 0, percentage: null }` y el mensaje explicativo `zeroGapsMessage`.

## 2. Grafo de prerequisitos vigente (`1.0.0`)

| `skillId`      | Etiqueta     | `prerequisiteSkillIds`    | Justificación pedagógica                                                                                  |
| -------------- | ------------ | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `cplusplus`    | C++          | `[]`                      | Lenguaje base independiente dentro del catálogo inicial.                                                  |
| `csharp`       | C#           | `[]`                      | Lenguaje base independiente dentro del catálogo inicial.                                                  |
| `docker`       | Docker       | `["git"]`                 | Empaquetar y versionar definiciones reproducibles requiere manejo básico de control de versiones con Git. |
| `git`          | Git          | `[]`                      | Herramienta transversal sin prerequisitos en el catálogo.                                                 |
| `java`         | Java         | `[]`                      | Lenguaje base independiente dentro del catálogo inicial.                                                  |
| `javascript`   | JavaScript   | `[]`                      | Lenguaje base requerido antes de abordar bibliotecas o runtimes del ecosistema JS.                        |
| `nodejs`       | Node.js      | `["javascript"]`          | El runtime de servidor se apoya directamente en sintaxis, módulos y asincronía de JavaScript.             |
| `react`        | React        | `["javascript"]`          | La construcción de componentes y estado en React requiere fundamentos previos de JavaScript.              |
| `react-native` | React Native | `["javascript", "react"]` | El desarrollo móvil en React Native parte de JavaScript y del modelo de componentes/estado de React.      |
| `sql`          | SQL          | `[]`                      | Lenguaje declarativo de consulta sin prerequisitos dentro del catálogo inicial.                           |

## 3. Validación automatizada

El script `packages/catalog/scripts/validate-learning-templates.mjs` (ejecutado en `pnpm --filter @devpath/catalog test`) verifica:

- Cobertura 1 a 1 con las tecnologías de `technologies.json` y versión `1.0.0`.
- Ausencia de ciclos en `prerequisiteSkillIds` (incluyendo una prueba negativa explícita que confirma que el validador rechaza ciclos directos e indirectos).
- Límites de contrato (`title` ≤ 120, `activity` ≤ 5000, `resourceUrl` con `https://` ≤ 2048).
- Ausencia de términos prohibidos (promesas de empleo/contratación o certificaciones de dominio).
- Cumplimiento de los casos esperados en `packages/catalog/fixtures/learning-path-cases.json` (cero faltantes, varios faltantes con expansión de prerequisitos y proyecto compatible).
