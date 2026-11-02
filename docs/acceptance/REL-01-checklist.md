# Puerta de REL-01 — todavía no habilitada

Fecha: 2026-11-02. Base integrada comprobada: b84255efc996f67af26d6478528eba42afe6bce6. No se crea `release/0.1.0`, changelog de release, versión o tag en QA-02.

| Requisito                           | Evidencia actual                                                                              | Pendiente / paso exacto                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QAA-01 integrada                    | PR27/b84255e; ancestry de99ef5be confirmado                                                   | Satisfecho para comenzar QA-02.                                                                                                                                                             |
| DOC-02 integrada                    | PR28/34a2242; commit38b7c7d                                                                   | Satisfecho.                                                                                                                                                                                 |
| DOC-01 integrada                    | PR9;08981cb ancestro de develop                                                               | Satisfecho; actualizar setup por PR si Compose revela una discrepancia real.                                                                                                                |
| QA-02 integrada y aceptada          | PR30 solo en main; no integrada en develop                                                    | Revisar/publicar/integrar PR correctivo a develop y completar aceptación humana.                                                                                                            |
| E2E PostgreSQL16                    | QA a0faee1 y main fe830bb: todos los checks aprobados                                         | CI propio de la punta correctiva pendiente al publicar.                                                                                                                                     |
| Defectos bloqueantes                | No se observaron fallos de producto en los recorridos ejecutados                              | No equivale a ausencia global; cerrar hallazgos de P5/Compose con PR fix y repetir pruebas.                                                                                                 |
| Aceptación humana                   | UI-01/EVID-06 completas pendientes                                                            | Ejecutar y firmar P5-review.md con evidencia; revisión técnica de otra persona.                                                                                                             |
| Instalación y migración desde vacío | Install frozen en worktree nuevo;0000–0003/seed en bases vacías PG18.3; base CI PG16 aprobada | Repetir en copia limpia del commit candidato integrado.                                                                                                                                     |
| Compose/proxy/volumen               | No ejecutado: Docker ausente, WSL no instalado                                                | Preparar entorno autorizado o equipo de P2; seguir SETUP_LOCAL, verificar8080, fronteras internas, cookies, restart con volumen conservado y persistencia. Nunca down -v. Registrar OPS-01. |
| Actualización de esquema con datos  | Ensayo0000–0002→0003 aprobado PG18.3; datos preservados, índice y reejecución correctos       | P1/P2 revisar y reproducir en el candidato/PG16 oficial. Compose sigue pendiente.                                                                                                           |
| Alcance, versiones y changelog      | Manifiestos0.0.0; no se preparó release                                                       | Tras cumplir puertas, congelar solo M1, preparar cambios de versión/changelog y limitaciones en release/0.1.0.                                                                              |
| Revisión Omar/P1/P2                 | No consta aprobación humana de QA-02/release                                                  | Revisar muestra de datos/ownership/sesión, instalación, CI y alcance; registrar decisiones en PR.                                                                                           |
| Publicación/tag/sincronización      | No ejecutados                                                                                 | Integrador humano aprueba merge release→main, etiqueta commit exacto v0.1.0 y sincroniza main→develop mediante PR. Verificar smoke del tag y ancestry.                                      |

## Actualización comprobada tras PR30

QA-02 está en main por fe830bb, todavía no en origin/develop b84255e. El correctivo fix/qa-02-integrate-develop preserva los cuatro commits QA-02 y excluye main exclusivo. CI de a0faee1 y fe830bb aprobado con PG16; CI correctivo pendiente. [Auditoría](INTEGRATION-AUDIT.md).

Ensayo con datos existentes aprobado en PG18.3:0000–0002→0003, filas idénticas, índice correcto y rerun idempotente. Debe revisarlo P1/P2 y reproducirse en el candidato/PG16 cuando corresponda; no acredita Compose ni aceptación humana. Instalación frozen/build se repitió desde un worktree nuevo limpio.

## Orden para retomar

1. Publicar el correctivo QA-02 hacia develop y revisar su CI nuevo. P5 completa aceptación humana; P1/P2 completan OPS-01 y revisan el ensayo de actualización con datos. Registrar fallidos/no ejecutados sin maquillarlos.
2. Resolver bloqueantes mediante PRs separados y volver a ejecutar casos afectados. Omar revisa/integrará QA-02 cuando corresponda.
3. Fetch; comprobar QA-02/DOC-02/DOC-01 en origin/develop y las revisiones humanas. Actualizar develop de forma segura conservando worktrees.
4. Solo entonces crear release/0.1.0 desde develop actualizado; preparar versiones/changelog, migraciones y smoke de instalación limpia. Abrir PR hacia main para revisión humana.
5. Omar decide publicación, merge y tag; luego sincronización main→develop y smoke del tag. La IA no ejecuta estos pasos automáticamente.
6. Solo tras verificar release/tag/sincronización se habilita CTR-02. JSearch/E3 futuro no bloquea M1 ni autoriza ampliar contratos ahora.

## Repetir las pruebas técnicas

Con Node22 >=22.16 y <23, pnpm11.22.0, PostgreSQL local autorizado y puertos libres:

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
# Bases nuevas dedicadas, creadas con PostgreSQL del entorno de P2:
# createdb devpath_test_qa02_review
# createdb devpath_e2e_qa02_review
$env:DATABASE_URL='postgresql://TEST_USER@127.0.0.1:5432/devpath_test_qa02_review'
$env:TEST_DATABASE_URL=$env:DATABASE_URL
pnpm --filter @devpath/db migrate
pnpm --filter @devpath/db seed
pnpm test
pnpm exec playwright install chromium
$env:E2E_DATABASE_URL='postgresql://TEST_USER@127.0.0.1:5432/devpath_e2e_qa02_review'
pnpm test:e2e
```

Sustituir únicamente datos locales de prueba y puerto; nunca pegar secretos en el PR. El runner E2E exige DB loopback nombrada test/e2e sin usuarios, migra/seed y limpia sus propias cuentas. Prueba de recuperación DB, sin Docker ni elevar privilegios:

```powershell
node scripts/setup-local.mjs
$env:QA_PG_BIN='C:\Program Files\PostgreSQL\18\bin' # O16 autorizado
$env:QA_TEMP_ROOT=(Resolve-Path '.local-data').Path
node docs/acceptance/probes/database-outage.mjs
```

Ese probe crea un clúster nuevo con puertos efímeros, lo detiene/reinicia y elimina solo su directorio validado. No apunta a un clúster existente. En Windows se usa stdio sin pipes heredados al arrancar PostgreSQL. El temporal del intento interrumpido descrito en M1-results no debe reutilizarse. Para repetir el navegador ampliado del historial, migrar/seed otra DB dedicada, configurar DATABASE_URL y DEVPATH_PLAYWRIGHT_MODULE a Playwright instalado y ejecutar `node apps/web/tests/integration/analysis-history.browser.mjs`.

El comando de formato raíz no incluye todo docs; comprobar explícitamente los Markdown/JSON/MJS nuevos con Prettier. El workflow Docs solo imprime echo y no certifica el contenido del informe.

### Repetir el ensayo de actualización

Crear una base **nueva vacía** de prueba loopback (no demo/desarrollo), definir QA_UPGRADE_DATABASE_URL y QA_TEMP_ROOT hacia un directorio temporal autorizado, y ejecutar `node docs/acceptance/probes/migration-upgrade.mjs`. El probe crea un historial Drizzle0000–0002 en esa DB, inserta fixtures, aplica0003 y verifica conservación/índice/rerun; rechaza DB con relaciones existentes antes de modificarla. No borra bases ni cambia migraciones del producto. Logs sin credenciales en evidence/correction-upgrade.txt.
