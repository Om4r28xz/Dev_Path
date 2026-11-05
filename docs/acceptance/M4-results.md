# Resultados de aceptación M4 — QA-05

Fecha: 5 de noviembre de 2026.

Estado: **aceptación técnica en curso; revisión humana P5 pendiente**. Este documento no autoriza
REL-04 mientras el E2E de la rama QA-05 y la revisión humana indicada al final no estén registrados.

## Base y alcance verificados

- Base probada: `origin/develop` en `b4724e72946236d84fe27314c0eda9bbc3f55ff4`.
- LRN-04: PR #59 integrado a `develop`; commits `af71431` y `9d0dcd0` contenidos por el merge
  `b4724e7`.
- Checks de la cabeza del PR #59: build, typecheck, lint/formato, tests, documentación, Chromium con
  PostgreSQL 16 y `CI gate (required)` aprobados en la ejecución `42125603506`.
- Datos usados por QA-05: cuentas, vacantes, proyecto y PDF exclusivamente sintéticos. Ningún
  fixture se presenta como respuesta real de JSearch.

## Matriz requisito → prueba → resultado → evidencia

| ID       | Requisito                                                                                                | Prueba                                                                                   | Resultado actual                                    | Evidencia                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `M4-01`  | Recorrido cuenta nueva → perfil → skills → análisis → proyecto → CV → ruta → progreso → recarga → logout | E2E completo con navegador, API, engine y PostgreSQL aislado                             | Pendiente de ejecución en CI de QA-05               | `tests/e2e/m4-acceptance.spec.ts`                                          |
| `M4-02`  | Crear una sola ruta ante doble clic e idempotencia                                                       | Doble clic sobre CTA y conteo de POST reales                                             | Aprobado en PR #59                                  | `tests/e2e/learning-paths.spec.ts`, API `201/200/409` de LRN-02            |
| `M4-03`  | Listar, abrir y explicar pasos, motivos, actividad, proyecto y recurso                                   | Detalle real y enlace seguro HTTP(S)                                                     | Aprobado técnicamente                               | `apps/web/src/features/learning-paths/**`, `api.test.ts`, `types.test.ts`  |
| `M4-04`  | Progreso persistente; un rechazo no confirma éxito                                                       | PATCH real, recarga y fallo `503` controlado                                             | Aprobado en PR #59                                  | `tests/e2e/learning-paths.spec.ts`, integración API LRN-03                 |
| `M4-05`  | Cero brechas muestra estado positivo sin inventar pasos                                                  | Análisis con skills completas y ruta de cero pasos                                       | Aprobado en PR #59                                  | Segundo caso de `tests/e2e/learning-paths.spec.ts`                         |
| `M4-06`  | Eliminar un proyecto no rompe la instantánea                                                             | Eliminar proyecto vinculado, recargar ruta y conservar actividad                         | Aprobado en PR #59                                  | Primer caso de `tests/e2e/learning-paths.spec.ts`                          |
| `M4-07`  | Propietario en todos los niveles y privacidad entre cuentas                                              | Cuenta B recibe `404`; rutas privadas requieren sesión                                   | Aprobado en PR #59                                  | Tercer caso de `tests/e2e/learning-paths.spec.ts`; `m4-acceptance.spec.ts` |
| `M4-08`  | No agregar skills automáticamente ni prometer empleo                                                     | Comparación de `/me/skills` y lenguaje explícito de avance autodeclarado                 | Aprobado técnicamente                               | Integración API LRN-03 y detalle LRN-04                                    |
| `M4-09`  | Accesibilidad, foco, teclado y móvil a 320 px                                                            | Foco tras navegación/error, controles nativos, acceso por teclado y ausencia de overflow | Aprobado automáticamente; revisión humana pendiente | `learning-paths.spec.ts`, `m4-acceptance.spec.ts`, `SISTEMA_VISUAL.md`     |
| `REG-M1` | Registro, sesión, perfil, skills, análisis/evidencia, historial y aislamiento                            | Regresión completa M1                                                                    | Aprobado en PR #59                                  | `tests/e2e/m1.spec.ts`, `acceptance.spec.ts`, PostgreSQL 16                |
| `REG-M2` | CRUD de proyectos y CV privado                                                                           | Crear/editar/eliminar proyecto; subir/descargar/sustituir/eliminar PDF                   | Aprobado en PR #59                                  | `tests/e2e/projects.spec.ts`, `cv.spec.ts`, PostgreSQL 16                  |
| `REG-M3` | Búsqueda, detalle y análisis desde proveedor disponible                                                  | Flujo E2E en modo `fixture`; evidencia `live` histórica separada                         | Aprobado con limitación explícita                   | `tests/e2e/jobs.spec.ts`, `docs/acceptance/M3-results.md`                  |

## Validaciones ejecutadas en QA-05

- Formato del alcance CI y lint completo: aprobados.
- Typecheck de API, web, Skill Engine, contratos, DB y E2E: aprobado.
- Build de API, web y Skill Engine: aprobado; Vite produjo 115 módulos.
- Vitest: 30 archivos y 240 pruebas aprobadas; 7 archivos / 71 casos PostgreSQL omitidos localmente
  por no existir `E2E_DATABASE_URL` aislada configurada.
- Contratos: 5 OpenAPI y 54 ejemplos validados, incluidas las respuestas rechazadas esperadas.
- Catálogo: 10 tecnologías, 18 alias, 30 casos sintéticos ES/EN y 10 plantillas acíclicas validadas.
- Playwright: el nuevo caso M4 fue descubierto y compilado; su ejecución real queda a cargo del CI
  con PostgreSQL 16 de la rama QA-05.

La ejecución global de Prettier sobre documentación histórica detectó 12 archivos anteriores fuera
del formato actual. El comando oficial del repositorio no incluye esos documentos y pasó; QA-05 no
reescribe archivos históricos ajenos para ocultar esa diferencia.

## M3: `fixture`, `live` y pendientes

- CI y el recorrido reproducible utilizan `JOBS_PROVIDER_MODE=fixture`; son datos sintéticos.
- La consulta `live` documentada en `M3-results.md` ocurrió el 5 de noviembre de 2026 contra
  `/search-v2` y `/job-details`; QA-05 no hizo nuevas llamadas ni consumió cuota.
- `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false` permanecen como valores seguros
  por defecto. La autorización de retención del proveedor sigue siendo una limitación abierta y no
  bloquea los flujos locales/fixture publicados en M3.

## Defectos y limitaciones

- No se encontró un defecto funcional bloqueante en las suites ejecutadas.
- QA-05 detectó que el manifiesto histórico de readiness comparaba la evidencia M1 contra un probe
  modificado después de aquella ejecución (`76c7b11`). Se archivó la versión exacta probada de
  `ff667d8` (mismo SHA-256 ya registrado) y el manifiesto apunta ahora a esa instantánea inmutable;
  `validate-results.mjs` vuelve a comprobar la evidencia sin atribuir una reejecución inexistente.
  Se aplicó el mismo archivado fiel al probe de contraste de `7846f86`, también modificado después
  de generar su manifiesto final.
- La ejecución local del E2E real no se declara aprobada: PostgreSQL está escuchando localmente, pero
  no hay una URL/credencial de base **vacía y aislada** configurada; el runner se niega correctamente
  a usar una base no identificada como `test`/`e2e`.
- El zoom real al 200 %, contraste observado, utilidad de cada paso y claridad transversal necesitan
  revisión humana P5. Las métricas automatizadas no sustituyen esa decisión.

## Checklist humano P5 pendiente

Con datos exclusivamente sintéticos, P5 debe registrar resultado y observaciones para:

1. Recorrer con teclado la creación y apertura de una ruta, el selector de estado, el recurso externo
   y el retorno a “Mis rutas”; confirmar foco visible y orden comprensible.
2. Repetir detalle y listado con zoom real del navegador al 200 %; confirmar que no se ocultan
   acciones ni aparece desplazamiento horizontal que impida operar.
3. Revisar contraste y legibilidad de estado, progreso, mensajes de error, vacío y cero brechas.
4. Confirmar que motivo y actividad de cada paso son útiles y comprensibles, y que el proyecto
   eliminado no deja una instrucción engañosa.
5. Confirmar que “autodeclarado”, la ausencia de certificación y la ausencia de garantía laboral se
   entienden sin explicación adicional.

Registrar nombre real del revisor, fecha, navegador, resultado por punto y cualquier defecto. Hasta
entonces QA-05 queda técnicamente preparada, no aceptada por P5.
