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

FND-01 añadirá los manifiestos, versiones fijadas, lockfile y comandos reproducibles. Hasta que esa tarea se integre, este repositorio no se presenta como un workspace instalable ni ejecutable.

No agregues comandos provisionales ni manifiestos vacíos. La futura guía de instalación documentará instalación con lockfile, lint, typecheck, pruebas, build y los modos locales de ejecución.

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
