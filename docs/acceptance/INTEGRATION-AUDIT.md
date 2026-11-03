# Auditoría y corrección de integración QA-02

Fecha: 2026-11-02. Fuente: API pública GitHub con consulta sin caché, fetch y comparación de contenido/ascendencia. No se deducen merges únicamente de mensajes de commit.

## Qué ocurrió

| PR          | Estado GitHub comprobado | Destino y merge                                   | Contenido efectivo                                                                                        |
| ----------- | ------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 27 — QAA-01 | Closed, merged=true      | develop, b84255efc996f67af26d6478528eba42afe6bce6 | 99ef5be es ancestro de develop; tests/config/runner existen. También llegó a main como ancestro de QA-02. |
| 28 — DOC-02 | Closed, merged=true      | develop,34a2242e9e2eb5387a41db65b4ee78fdde121612  | 38b7c7d es ancestro; ARCHITECTURE y enlace README presentes en ambas ramas.                               |
| 29          | Closed, merged=true      | main,be55f73bd582f97cb097f07a0c1e3ca1d6156c5d     | Integró develop de ese momento,34a2242. No acredita aceptación/release.                                   |
| 30 — QA-02  | Closed, merged=true      | main,fe830bb5e3ec2161014a8dc78b1c0a1987923276     | a0faee1 es ancestro de main y no de develop. Informe/probes/tres tests extra faltan en develop.           |

Referencias al auditar: origin/develop=b84255e; origin/main=fe830bb. Develop local ya estaba en b84255e. Main local no se actualizó ni se usó como base. No hay release visible en la API ni tag remoto v0.1.0. El estado abierto atribuido previamente a PR27 está desactualizado: ahora GitHub y el contenido coinciden en su integración.

## Main exclusivo revisado y decisión

La diferencia de árbol main/develop tiene15 rutas:14 corresponden a QA-02 y una a `docs/handoffs/lote-04.md`. Esta última documenta PR17, AUTH-04 y pendientes históricos; procede de commits/main merges anteriores (incluidos PR16/18), no de QA-02. No hay diferencias de producto en apps/packages, dependencias o CI entre las dos puntas auditadas. Los commits históricos exclusivos de main no equivalen a código de producto adicional en su árbol actual.

No se tomó main completo. Se creó **fix/qa-02-integrate-develop** desde origin/develop en `.worktrees/qa-02-correction` y se incorporó mediante fast-forward **solo** origin/docs/qa-02-mvp-acceptance-results. Sus cuatro commits son descendientes directos de la base develop: no hubo conflicto ni cherry-pick, se conservaron autores, fechas y hashes:

- 2e21e233bdf60f60aa95a47636a89e2c9b870df3
- 4b73e13274b46d218e382a03a158fe042e2a89f2
- 2d4119432327c2af29000ad92dd575ad1418fb0a
- a0faee1813d9717bb92f0b5b58904b02a88f351c

Se verificó que sus archivos QA-02 coinciden con main antes de añadir esta auditoría y el ensayo complementario. El handoff04 permanece idéntico a origin/develop; sus cambios válidos siguen a salvo en main. Omar debe decidir su eventual PR documental separado o sincronización posterior revisada. Esta rama no lo arrastra ni cambia CI, contratos, dependencias o código de producto. No duplica los commits originales: reutiliza los mismos objetos Git.

## Verificaciones nuevas

Producto inalterado respecto a b84255e; base QA-02 a0faee1. Instalación frozen en worktree nuevo limpio, Node22.23.4/pnpm11.22.0, PostgreSQL18.3 aislado y Chromium156/Playwright1.64.1:

| Comprobación                                         | Resultado / evidencia                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install frozen, lint, format:check, typecheck, build | Aprobados en la copia de trabajo nueva. Esto no acredita Docker ni instalación del futuro tag.                                                                                                                                                                          |
| Web/API/motor/privacidad                             | 97/118/51/2 aprobadas; [log](evidence/correction-tests.txt).                                                                                                                                                                                                            |
| E2E reales                                           | 7/7 aprobados,10.5s; [log](evidence/correction-e2e.txt). Incluyen dos pestañas, teclado/contraste acotado,50%/67%, corpus, aislamiento, legacy y engine real detenido/retry.                                                                                            |
| Limpieza E2E                                         | Usuarios0/análisis0 en DB exclusiva; procesos propios apagados.                                                                                                                                                                                                         |
| Migración con datos                                  | [Probe](probes/migration-upgrade.mjs) y [log](evidence/correction-upgrade.txt): histórico0000–0002, datos sintéticos existentes,0003 conserva filas/score/evidence/key/hash/revisión y crea índice de cursor; segunda ejecución sin cambios. Usuario fixture eliminado. |
| Informe previo                                       | 30 casos/huellas/enlaces coherentes; se conservan27 aprobados técnicos y3 completos pendientes. No se sustituyen resultados antiguos por nuevos sin evidencia.                                                                                                          |
| CI QA-02 publicado                                   | a0faee1, [run41519866064](https://github.com/Om4r28xz/Dev_Path/actions/runs/41519866064), todos los checks aprobados, incluido PG16.                                                                                                                                    |
| CI merge a main                                      | fe830bb, [run41520120131](https://github.com/Om4r28xz/Dev_Path/actions/runs/41520120131), todos aprobados, incluido PG16. No acredita integración en develop.                                                                                                           |
| CI correctivo                                        | Pendiente al publicar su nueva punta. No atribuirle los verdes anteriores.                                                                                                                                                                                              |

Nuevo registro y SHA256: [integration-correction.json](evidence/integration-correction.json). Las evidencias anteriores y sus hashes permanecen conservados. La actualización con datos se ejecutó en PG18.3; no se afirma el mismo ensayo ejecutado en PG16. No se restauró una copia de producción ni se probaron todos los posibles orígenes históricos de esquema.

## Los tres casos completos pendientes

| Caso    | Técnico comprobado                                                                                                     | Pendiente y responsable                                                                                                                                                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI-01   | Labels, Tab/Shift+Tab, outline2px, foco de modal,13 muestras de contraste login/register mínimo6.0428:1.               | P5: lector de pantalla, zoom200%/reflujo y viewport real, contraste/estados completos, navegación y comprensión. Objetivo AA no certificado.                                                                                                     |
| EVID-06 | HTML inerte, fragmentos seguros, legacy y consulta histórica sin engine por suites existentes; regresión E2E aprobada. | P5: anuncios con lector, comprensión de evidencia/ausencia y mensajes. P1/P2 reproducen una muestra de seguridad; no es firma humana automática.                                                                                                 |
| OPS-01  | Servicios/PG nativos reales, migración desde vacío y ensayo de actualización con datos.                                | P2/P1: stack Compose/proxy8080, cookies, puertos/fronteras, restart con volumen conservado. Docker ausente; wsl.exe no implica WSL instalado. Configuración estática aprobada con CLI standalone5.6.1; stack no ejecutado (falta Docker Engine). |

## Instrucciones concretas por persona

1. **Omar:** revisar este PR hacia **develop**, el diff limitado, la ascendencia y CI; integrar solo cuando corresponda. Confirmar después a0faee1 y la auditoría en origin/develop. Revisar main exclusivo antes de cualquier sincronización general. No hay aprobación ni tag implícitos por PR30.
2. **P1/P2:** revisar las dos guías/probes y repetir una muestra en DB aislada. Para el ensayo nuevo crear una base vacía llamada test/e2e, configurar QA_UPGRADE_DATABASE_URL y ejecutar `node docs/acceptance/probes/migration-upgrade.mjs`. Repetir en PG16 oficial si ese es el entorno de aceptación; confirmar todos los datos/índice y reejecución. No apuntar a DB de desarrollo: el probe rechaza relaciones existentes antes de migrar.
3. **P2 con P1:** en un equipo con Docker autorizado seguir SETUP_LOCAL; migrar/seed sin borrar volumen, verificar web8080 y API por proxy, bloqueo de/internal, cuenta/análisis después de restart. Registrar OPS-01 con commit/entorno/observados. No usar down -v. No se autorizan instalaciones elevadas por este informe.
4. **P5:** seguir [P5-review](P5-review.md), marcar caso a caso y adjuntar evidencia saneada con su identidad. Completar UI-01/EVID-06, no firmar por recibir un informe automático. Si hay fallo, documentar severidad/reproducción y pedir PR fix separado; repetir tras corregir.
5. **Omar/P1/P2:** con QA-02 en develop, evidencia humana y OPS-01 atendidos, decidir si se habilita REL-01. Antes solo hay borradores externos; no se crea release/0.1.0 ni tag. CTR-02 sigue bloqueada.

La preparación correctiva está implementada localmente; publicación/PR y hash final se registran en el reporte de entrega. No se hace merge a main/develop ni se modifica la identidad Git configurada.

### Comprobación estática adicional de Compose

CLI standalone Docker Compose5.6.1 disponible en las herramientas locales: `--env-file infra/.env.example -f infra/compose.yaml config --quiet` terminó0, sin leer .env real ni arrancar servicios. Esto comprueba la estructura/resolución del Compose, no OPS-01, conectividad, mounts, cookies o persistencia. Docker Engine sigue ausente y wsl --status salió50 indicando subsistema no instalado. El stack y la aceptación OPS-01 siguen pendientes de P1/P2.
