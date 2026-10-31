# DevPath

DevPath es una aplicación local para que estudiantes y desarrolladores junior comparen sus habilidades con las tecnologías mencionadas en una vacante. El resultado inicial será determinista, explicable y basado en un catálogo versionado; no usa IA generativa.

## Estado del proyecto

El proyecto se encuentra en M0, preparando repositorio, workspace, contratos y catálogo. Las carpetas reservadas y los documentos de diseño no significan que autenticación, análisis o matching ya estén implementados.

Las entregas previstas son:

- M0: base técnica y contratos.
- M1: autenticación, perfil, habilidades y análisis manual.
- M2: proyectos y CV privado.
- M3: integración de vacantes mediante JSearch.
- M4: rutas de aprendizaje deterministas.

## Arquitectura acordada

```text
Navegador → React/Vite → /api/v1 → API Express → PostgreSQL
                                      └───────→ Skill Engine REST interno
```

La API y el Skill Engine se ejecutan como procesos separados. Auth es un módulo de la API. El navegador nunca accede directamente a PostgreSQL, al engine ni a proveedores externos.

Las decisiones completas están en [ADR](docs/adr/), el plan en [PLAN_DE_IMPLEMENTACION.md](docs/PLAN_DE_IMPLEMENTACION.md) y las responsabilidades en [RESPONSABILIDADES.md](docs/RESPONSABILIDADES.md).

## Ejecución local

Requisitos fijados por FND-01:

- Node.js 22.16 o una versión posterior de Node 22.
- pnpm 11.22.

Instala exactamente lo registrado en el lockfile y ejecuta los controles comunes:

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Los tres procesos de desarrollo se levantan por separado:

```powershell
pnpm dev:web
pnpm dev:api
pnpm dev:engine
```

La web escucha en `127.0.0.1:5173`, la API en `127.0.0.1:3000` y el Skill Engine en `127.0.0.1:3001`. En esta etapa solo existen el shell M0 y endpoints de salud; autenticación y matching continúan pendientes.

## Colaboración

El trabajo normal nace de `develop` y vuelve a `develop` mediante pull request. `main` contiene entregas estables y recibe únicamente PR de release o hotfix según [FLUJO_GITHUB.md](docs/FLUJO_GITHUB.md).

1. Actualiza `develop` y crea la rama exacta indicada por la tarea.
2. Limita el diff al alcance de esa tarea.
3. Ejecuta y documenta los controles aplicables.
4. Abre un PR hacia la base indicada y solicita los revisores de [RESPONSABILIDADES.md](docs/RESPONSABILIDADES.md).
5. Un integrador distinto del autor realiza el merge aprobado.

No compartas cuentas ni cambies identidades Git para simular contribuciones. P1–P5 son roles operativos; cada persona usa su propia cuenta cuando actúa en GitHub.

## Protección de ramas

La política objetivo exige PR, revisión y controles exitosos para `develop` y `main`, y bloquea force-push y eliminación. Si el plan, visibilidad o permisos de GitHub no permiten configurar rulesets:

- no se hace push directo por acuerdo del equipo;
- el PR registra autor, revisor por rol, comandos y resultados;
- el integrador comprueba manualmente la base, el diff y los controles requeridos;
- cualquier excepción se documenta en el PR y en el handoff correspondiente.

La ausencia de una regla automática no convierte la revisión ni la validación en opcionales.

## Seguridad del repositorio

No confirmes archivos `.env`, claves, tokens, contraseñas, datos personales, CV, volúmenes locales, logs ni resultados de pruebas con información sensible. Los ejemplos y fixtures deben usar datos sintéticos.
