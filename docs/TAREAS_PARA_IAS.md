# DevPath: backlog para cinco personas y tareas delegables a IAs

Este documento convierte el [plan técnico](PLAN_DE_IMPLEMENTACION.md) en encargos con entregables comprobables. Se ejecuta por entregas, sin fechas. El [índice de lotes](LOTES_PARA_IAS.md) contiene once prompts completos: uno de estructura y diez de hasta cinco tareas. El [flujo GitHub](FLUJO_GITHUB.md) explica cómo crear, revisar e integrar las ramas.

## 1. Reglas de uso del backlog

- P1 y P2 implementan código; P3 entrega catálogo/contenido; P4 documentación/contratos; P5 aceptación/evidencias.
- Los nombres son marcadores para asignar a las cinco personas reales.
- Un lote es un encargo de hasta cinco tareas para una IA; no cambia la granularidad de ramas y revisiones. Puede pausarse y retomarse al integrar dependencias.
- Toda tarea tiene una issue, un responsable y un PR propio. Una IA es una herramienta del responsable, no un aprobador humano.
- Salvo bootstrap y releases, todas las ramas indicadas nacen del último `origin/develop` y su PR apunta a `develop`.
- Una dependencia está disponible al estar integrada en `develop`. Tener código sin merge en otra rama no satisface la dependencia.
- No comenzar una implementación de la siguiente entrega mientras pueda contaminar el release activo. Investigación y contenido pueden adelantarse en su rama, pero se integran según el hito acordado.
- Pueden prepararse pantallas con ejemplos de contrato; se etiqueta su modo mock y se sustituye por integración real antes de cerrar la tarea.
- P1/P2 incluyen pruebas automáticas relevantes en sus tareas. P5 no hereda la obligación de escribir el código de pruebas.
- Revisor predeterminado: P1 revisa código de P2 y P2 revisa código de P1; contratos y contenido los revisan también sus consumidores.
- Si una tarea crece más allá de un PR revisable, dividirla con sufijos, por ejemplo AUTH-02a y AUTH-02b, sin omitir aceptación.

## 2. Dependencias y reparto por olas

La asignación operativa se encuentra en [LOTES_PARA_IAS.md](LOTES_PARA_IAS.md); usar allí los prompts completos, responsables y puntos de continuación. Las olas siguientes son una vista conceptual de disponibilidad, no sprints ni fechas. Cada fila admite trabajo paralelo solo cuando sus dependencias ya están integradas.

| Ola | P1: backend | P2: frontend/integración | P3: datos/contenido | P4: documentación | P5: aceptación |
| --- | --- | --- | --- | --- | --- |
| 0 | Revisar decisiones | Revisar decisiones | Definir alcance de catálogo | GOV-01, GOV-02 | Revisar recorridos |
| 1 | API-01 y luego DAT-01 | FND-01, CI-01, WEB-01 | CAT-01 | CTR-01 | QA-01 |
| 2 | AUTH-01, AUTH-02, PRO-01 | ENG-01, ENG-02, OPS-01 | CAT-02 | DOC-01 | Refinar QA-01 |
| 3 | ANL-01, ANL-03 | AUTH-03, AUTH-04, PRO-02, ANL-02, ANL-04 | Resolver casos del corpus | DOC-02 | Validar cortes integrados |
| 4 | Revisar y corregir defectos | QAA-01 | Revisar explicación del score | Cerrar docs de M1 | QA-02 |
| 5 | REL-01 | Revisar release | Contenido siguiente etapa | CTR-02 y posible JSR-01 | Evidencias de release |
| 6 / M2 | PRJ-01, CV-01 | PRJ-02, CV-02 | Preparar plantillas | Actualizar setup/contratos | QA-03 |
| 7 | REL-02 | Revisar release | LRN-01 en rama propia | JSR-01 si falta | Validar tag local |
| 8 / M3 | JSR-02, JSR-03 | JSR-04 | Revisar nomenclatura | Registrar permisos | QA-04 |
| 9 | REL-03 | Revisar release | Integrar LRN-01 | Actualizar manual | Evidencias |
| 10 / M4 | LRN-02, LRN-03 | LRN-04 | Revisar contenido generado | Documentar generador | QA-05 |
| 11 | REL-04 | Revisar release | Corregir contenido observado | Cerrar guía; DEP-01 opcional | Validar versión final |

Si JSearch queda bloqueado por acceso o permisos, LRN-02 no depende técnicamente de M3: continuar rutas con análisis manuales y documentar el orden de releases, conservando abiertas las issues live pendientes.

La disponibilidad exacta la determina el DAG de cada tarea; la tabla no autoriza saltarse dependencias. Con dos programadores, no iniciar cinco implementaciones simultáneas. P3/P4/P5 pueden mantener actividad paralela sin competir por los mismos archivos.

## 3. Base, contratos y contribuciones iniciales

### GOV-01 — Registrar decisiones y asignar responsables

- **Entrega / responsable:** M0, P4 con revisión P1/P2.
- **Dependencias:** ninguna.
- **Rama:** inicialmente contenido preparado para GOV-02; una vez existente develop, `docs/gov-01-decisions`.
- **Archivos:** `docs/adr/0001-scope.md`, `0002-topology.md`, `0003-stack.md`, matriz de responsables.
- **Encargo:** registrar el alcance por etapas, ejecución local, matching determinista, propuesta auth como módulo y engine separado. Sustituir P1–P5 por personas reales y asignar un integrador de release. Confirmar si la evaluación exige procesos separados.
- **Aceptación:** cada decisión indica confirmado/propuesto, contexto y consecuencia; no se presentan features como implementadas; todos saben qué PR revisar.
- **Validación:** revisión documental por ambos programadores; no se requieren pruebas de código.

### GOV-02 — Establecer historial y flujo de colaboración

- **Entrega / responsable:** M0, P4; P1/P2 verifican.
- **Dependencias:** GOV-01.
- **Rama:** reutilizar `main` existente y establecer `develop` cuando falte; cambios normales en `docs/gov-02-collaboration` → develop. Bootstrap directo a main únicamente si se verifica un repositorio sin historial.
- **Archivos:** descripción original, planes, README inicial, `.gitignore`, `.gitattributes`, plantilla de PR e issue, CODEOWNERS con usuarios reales.
- **Encargo:** comprobar refs y remoto sin sobrescribir historial. Ya se observó el commit `c338a21` en main/origin/main; conservarlo y no repetir bootstrap. Establecer develop, documentación de colaboración y protección de ramas. No añadir secretos ni desarrollo de negocio en main.
- **Aceptación:** existe historial y develop comparte ancestro con main; los cinco miembros pueden contribuir; está definido qué hacer si GitHub no ofrece reglas por el plan/visibilidad.
- **Validación:** clonar o consultar refs, revisar el primer diff y confirmar exclusión de env/claves/volúmenes. No hace falta crear PR ficticio para el primer commit.

### STR-01 — Preparar la estructura completa con una IA dedicada

- **Entrega / responsable:** M0, IA del lote 00; P2 responsable técnico, revisión P1/P4.
- **Dependencias:** ninguna para preparar archivos localmente.
- **Puerta de integración:** GOV-02 debe haber establecido develop antes del PR; la preparación local no marca la tarea como integrada.
- **Rama:** `chore/str-01-project-structure` desde develop cuando exista; PR → develop.
- **Archivos:** carpetas de apps, paquetes, infra, scripts, tests, .github y docs, README de área, .gitkeep, `docs/ESTRUCTURA_DEL_PROYECTO.md` y `docs/project-structure.json`.
- **Encargo:** ejecutar el [prompt completo del lote 00](prompts/lotes/00-estructura-completa.md). Reservar carpetas M0–M4 sin instalar dependencias ni implementar servicios; preservar archivos existentes y documentar responsabilidad/etapa.
- **Aceptación:** manifiesto coincide con directorios reales; .gitkeep solo en hojas vacías; ninguna carpeta futura se presenta como feature terminada. No crear app.ts, server.ts, YAML, SQL o manifiestos vacíos.
- **Validación:** comprobar todas las rutas declaradas, diff acotado e integridad de archivos preexistentes. FND-01 reutiliza el árbol cuando STR-01 esté integrado.

### FND-01 — Crear workspace y herramientas comunes

- **Entrega / responsable:** M0, P2.
- **Dependencias:** GOV-02, STR-01.
- **Rama:** `chore/fnd-01-workspace`.
- **Archivos:** manifiestos raíz, pnpm workspace, TS/lint/format, apps/web, apps/api, apps/skill-engine y paquetes mínimos.
- **Encargo:** reutilizar árbol y responsabilidades de STR-01, retirando .gitkeep solo al añadir contenido real; fijar versiones compatibles y lockfile; scripts documentados para lint, typecheck, test y build. Separar app de server para pruebas. Prohibir importaciones de DB en web/engine.
- **Contrato:** nombres de paquetes y comandos raíz estables; no implementar negocio.
- **Aceptación:** instalación reproducible con lockfile, tres apps compilables y errores de configuración claros.
- **Validación:** instalación limpia, lint, typecheck y build. P1 revisa límites de importación.

### CTR-01 — Fijar contratos de M1 y ejemplos consumibles

- **Entrega / responsable:** M0, P4; P1/P2 revisan la implementación de validadores.
- **Dependencias:** FND-01, GOV-01.
- **Rama:** `docs/ctr-01-mvp-contracts`.
- **Archivos:** `packages/contracts/openapi/public.yaml`, `engine.yaml`, ejemplos, guía de errores.
- **Encargo:** documentar auth, me, catálogo, user skills, analyses y engine interno. Elegir una dirección única de generación OpenAPI/esquemas; P1/P2 ayudan con el script necesario. Fijar límites, códigos, cursor, idempotencia, cookie y respuesta sin tecnologías.
- **Aceptación:** ejemplos válidos y de fallo, campos requeridos inequívocos, sin refresh token en JSON; frontend y backend aceptan el mismo DTO.
- **Validación:** especificación parseable y ejemplos validados; revisar que tipos/validadores no se conviertan en tres definiciones manuales.

### CAT-01 — Entregar catálogo inicial curado

- **Entrega / responsable:** M0, P3.
- **Dependencias:** FND-01, GOV-01.
- **Rama:** `data/cat-01-technology-catalog`.
- **Archivos:** `packages/catalog/technologies.json` y README del catálogo.
- **Encargo:** preparar un conjunto pequeño y útil de tecnologías de desarrollo, IDs estables, nombres, categorías y alias. Incluir Java, JavaScript, React, React Native, Node.js, Git, Docker, SQL, C# y C++ para cubrir ambigüedades.
- **Contrato:** versión `1.0.0`, claves del esquema acordado; no alias ambiguos sin resolución explícita.
- **Aceptación:** sin IDs duplicados ni aliases accidentales que mezclen tecnologías; cada alias tiene justificación revisable.
- **Validación:** revisión P2 y validación de estructura; el código del validador lo aporta P2 si aún no existe.

### API-01 — Construir infraestructura HTTP de Express

- **Entrega / responsable:** M0, P1.
- **Dependencias:** FND-01, CTR-01.
- **Rama:** `chore/api-01-http-foundation`.
- **Archivos:** `apps/api/src/app.ts`, server, platform/config, errors, logging y middleware.
- **Encargo:** config validada al arrancar, IDs de request, límites JSON, errores consistentes, redacción, cierre de pool, health básico y espacios de módulos. Configurar política de origen y límites de abuso locales, sin confundir CORS con autorización.
- **Aceptación:** ruta desconocida devuelve JSON 404, entrada excesiva 413, error interno no expone stack, logs no incluyen cookies/Authorization.
- **Validación:** pruebas HTTP representativas; health ready real se completa al conectar DAT-01.

### DAT-01 — Migraciones y acceso a PostgreSQL

- **Entrega / responsable:** M0, P1.
- **Dependencias:** FND-01, CTR-01, CAT-01.
- **Rama:** `chore/dat-01-postgres-schema`.
- **Archivos:** `packages/db/schema`, migraciones M1, seeds, factorías de datos sintéticos.
- **Encargo:** tablas M1 del plan, restricciones únicas, FK, índices de listado y seed de catálogo idempotente. API usa un pool con cierre ordenado. No crear todavía tablas de CV/JSearch/rutas.
- **Aceptación:** registro y sesiones tienen sus invariantes estructurales; seed repetido no duplica skills; las migraciones no necesitan edición manual en DB.
- **Validación:** migrar DB vacía y repetir seed; probar unicidad, FK y rollback de transacción. Base de prueba separada de desarrollo.

### WEB-01 — Shell, navegación y componentes básicos

- **Entrega / responsable:** M0, P2.
- **Dependencias:** FND-01, CTR-01.
- **Rama:** `feature/web-01-app-shell`.
- **Archivos:** app/router/providers, layout, botones, campos, alertas y estilos.
- **Encargo:** rutas M1, layout de perfil/análisis/historial, estados reutilizables, rosa suave accesible y cliente HTTP base. Configurar proxy Vite y URLs relativas.
- **Aceptación:** navegación y recarga directa funcionan; formularios con labels, foco visible y errores asociados; pantallas aún sin conexión se identifican.
- **Validación:** build y revisión de teclado con P5. No escribir tests de estilos que dupliquen CSS.

### ENG-01 — Exponer servicio interno y validar su frontera

- **Entrega / responsable:** M0, P2.
- **Dependencias:** FND-01, CTR-01, CAT-01.
- **Rama:** `feature/eng-01-service-contract`.
- **Archivos:** skill-engine app/server, config, autenticación de servicio y validador del catálogo.
- **Encargo:** `POST /internal/v1/analyze`, health, credencial de servicio y rechazo de entradas fuera del contrato. Cargar catálogo al arrancar y fallar si es inválido.
- **Aceptación:** sin credencial no analiza; catalogVersion distinto produce error interno documentado; no existe acceso a DB ni endpoints públicos de usuario.
- **Validación:** HTTP con secreto incorrecto/ausente, cuerpos excesivos y versión incompatible. No aceptar respuestas inventadas como matcher terminado.

### CI-01 — Automatizar controles de PR

- **Entrega / responsable:** M0, P2.
- **Dependencias:** FND-01.
- **Rama:** `chore/ci-01-pull-request-checks`.
- **Archivos:** `.github/workflows/ci.yml`, scripts de validación.
- **Encargo:** instalar con lockfile, lint, tipos, build y pruebas disponibles; PostgreSQL de prueba cuando se integre DAT-01; validar contratos/datos. Incorporar E2E al llegar QAA-01.
- **Aceptación:** un check agregado `ci-gate` se ejecuta siempre y falla si cualquier job obligatorio falla; cambios de docs no dejan checks requeridos eternamente pendientes.
- **Validación:** PR controlado con fallo y corrección; permisos mínimos y ningún secreto de producción. P1 revisa que no se ejecuten contribuciones no confiables con credenciales privilegiadas.

### OPS-01 — Ejecutar stack completo localmente

- **Entrega / responsable:** M0, P2.
- **Dependencias:** API-01, DAT-01, WEB-01, ENG-01.
- **Rama:** `chore/ops-01-local-compose`.
- **Archivos:** Dockerfiles, `infra/compose.yaml`, proxy, env.example y generador de claves.
- **Encargo:** levantar web, API, engine y DB; volúmenes persistentes; proxy mismo origen; migración explícita previa al arranque útil; puertos internos protegidos. Diferenciar desarrollo y demo.
- **Aceptación:** arranque documentado desde copia limpia; recarga de pantalla SPA; engine/DB no están accesibles mediante proxy público; no hay borrado de datos automático.
- **Validación:** levantar/detener/reiniciar conservando datos. P4 reproduce instrucciones; secretos generados no aparecen en git status.

### DOC-01 — Escribir y verificar instalación

- **Entrega / responsable:** M0, P4.
- **Dependencias:** OPS-01, CI-01.
- **Rama:** `docs/doc-01-local-setup`.
- **Archivos:** README, `docs/SETUP_LOCAL.md`, solución de problemas.
- **Encargo:** documentar prerequisitos, PowerShell, env, claves, puertos, migraciones, seed, pruebas y modo de demo. Distinguir reinicio de servicios de reinicio destructivo de datos.
- **Aceptación:** una persona distinta levanta el stack siguiendo únicamente la guía; comandos copiados son reales y no incluyen credenciales.
- **Validación:** P5 ejecuta y registra sistema, comandos, resultado y correcciones. No se requieren pruebas unitarias de documentación.

### QA-01 — Preparar matriz de aceptación M1

- **Entrega / responsable:** M0, P5.
- **Dependencias:** CTR-01, CAT-01.
- **Rama:** `docs/qa-01-mvp-acceptance-cases`.
- **Archivos:** `docs/acceptance/M1-cases.md`, checklist de estados y accesibilidad.
- **Encargo:** casos por recorrido con precondiciones, datos sintéticos, pasos y resultado esperado. Incluir dos cuentas, sesión, expiración, texto vacío, sin tecnologías, error de engine y navegación por teclado.
- **Aceptación:** P1/P2 pueden ejecutar cada caso sin preguntas; nada se marca aprobado antes de probar.
- **Validación:** revisión conjunta; vincular cada caso a endpoint/pantalla y criterio del plan.

## 4. M1: autenticación, perfil y análisis manual

### AUTH-01 — Registro y login con perfil mínimo

- **Responsable:** P1.
- **Dependencias:** DAT-01, API-01.
- **Rama:** `feature/auth-01-register-login`.
- **Archivos:** módulo auth, repositorios y pruebas de integración.
- **Encargo:** validar entrada, normalizar email, Argon2id, claves RS256, crear cuenta/perfil y sesión en transacción; respuestas de registro/login del contrato. Preparar tablas de rotación para AUTH-02 sin emitir un diseño incompatible.
- **Aceptación:** 201 registro, 200 login, 401 genérico, duplicado controlado y ausencia de hash en respuesta/log. No se agrega CV ni ubicación obligatoria.
- **Validación:** cuenta real de prueba, credenciales falsas, carrera de duplicados y rollback. P2 revisa DTO y Set-Cookie.

### AUTH-02 — Refresh, logout y middleware de autorización

- **Responsable:** P1.
- **Dependencias:** AUTH-01.
- **Rama:** `feature/auth-02-refresh-logout`.
- **Archivos:** sesiones, rotación, middleware JWT, validación de origen y tests.
- **Encargo:** refresh opaco con hash, siete días absolutos, consumo atómico, revocación de familia por reutilización y logout. Verificar JWT completo y flags de cookie. Proteger auth con política CSRF y rate limits de proceso apropiados al entorno local.
- **Aceptación:** ninguna ruta de negocio autentica con cookie; no hay refresh raw en DB; logout exitoso invalida la familia. DB caída no se presenta como revocación confirmada.
- **Validación:** firma/alg/iss/aud/exp alterados, rotación concurrente, reutilización, origen malicioso, cookie local y HTTPS configurado.

### AUTH-03 — Cliente de sesión y coordinación entre pestañas

- **Responsable:** P2.
- **Dependencias:** AUTH-02, WEB-01.
- **Rama:** `feature/auth-03-browser-session`.
- **Archivos:** web/features/auth, lib/http, provider y utilidades de coordinación.
- **Encargo:** token solo en memoria, bootstrap con refresh, single-flight, Web Locks/BroadcastChannel, un único reintento de petición protegida, cancelación y vaciado de caché al salir.
- **Aceptación:** recargar conserva sesión si cookie válida; 403/503 no provocan refresh; dos pestañas no generan rotación normal concurrente; cambiar cuenta no muestra datos anteriores.
- **Validación:** navegador con dos pestañas, expiración controlada y logout durante solicitudes. Documentar soporte/fallback para navegadores sin Web Locks.

### AUTH-04 — Pantallas de registro, login y rutas privadas

- **Responsable:** P2.
- **Dependencias:** AUTH-03.
- **Rama:** `feature/auth-04-auth-screens`.
- **Archivos:** RegisterPage, LoginPage, guard de rutas y navegación.
- **Encargo:** formularios accesibles, errores por campo, estados pendientes y errores del servidor; retorno interno validado y logout disponible.
- **Aceptación:** registro/login usan API real, sin parpadeo de ruta privada durante bootstrap; doble clic no duplica operación; no open redirect.
- **Validación:** cuenta nueva, datos inválidos, credenciales falsas, sesión expirada y teclado. P5 revisa mensajes y foco.

### PRO-01 — API de perfil, catálogo y habilidades

- **Responsable:** P1.
- **Dependencias:** AUTH-01, DAT-01, CAT-01.
- **Rama:** `feature/pro-01-profile-skills-api`.
- **Archivos:** módulos profile/skills, consultas y pruebas.
- **Encargo:** GET/PATCH me, GET catálogo, GET/PUT me/skills; reemplazo atómico con revisión, sin niveles de dominio inventados.
- **Aceptación:** campos permitidos y límites; IDs desconocidos se rechazan; lista sin duplicados; ninguna entrada userId sustituye al subject del token.
- **Validación:** dos cuentas, skills vacías, IDs inválidos, rollback del reemplazo y revisión consistente. Integración con middleware definitivo antes de release.

### PRO-02 — Pantalla de perfil y selector de habilidades

- **Responsable:** P2.
- **Dependencias:** PRO-01, AUTH-04.
- **Rama:** `feature/pro-02-profile-skills-ui`.
- **Archivos:** web/features/profile y skills.
- **Encargo:** mostrar/editar nombre, headline y ubicación opcional; buscar catálogo, añadir/quitar skills y guardar selección.
- **Aceptación:** datos persisten tras recargar; cliente invalida queries correctas; formulario conserva cambios si falla; estado vacío orienta al análisis.
- **Validación:** edición real y navegación con teclado; P5 verifica sin CV ni proyectos obligatorios en M1.

### CAT-02 — Corpus etiquetado de extracción

- **Responsable:** P3.
- **Dependencias:** CAT-01.
- **Rama:** `data/cat-02-matching-corpus`.
- **Archivos:** `packages/catalog/fixtures/*.json` y explicación de casos.
- **Encargo:** crear al menos 20 textos sintéticos breves ES/EN con IDs esperados. Cubrir alias, puntuación, tecnologías parecidas, repeticiones, negaciones y ausencia de términos.
- **Aceptación:** esperado independiente del resultado actual del código; errores conocidos se documentan, no se cambian etiquetas para ocultarlos.
- **Validación:** P2 revisa ambigüedad y P5 legibilidad; los fixtures no reproducen CVs ni vacantes privadas.

### ENG-02 — Extracción determinista y cálculo de matching

- **Responsable:** P2.
- **Dependencias:** ENG-01, CAT-02.
- **Rama:** `feature/eng-02-skill-matching`.
- **Archivos:** extractor, matcher, normalización y tests del engine.
- **Encargo:** implementar las reglas y fórmula del plan, evidencia acotada, orden estable y versiones. Resolver Java/JavaScript, React/React Native y signos significativos.
- **Aceptación:** matched + missing particionan required, no duplicados, 2/3 = 67, sin tecnologías = null, sin skills = 0 si hay requisitos.
- **Validación:** corpus completo, pruebas de límites, determinismo y negaciones; medir un texto de tamaño máximo. P1 revisa respuesta interna.

### ANL-01 — Orquestar análisis manual y persistencia

- **Responsable:** P1.
- **Dependencias:** ENG-02, PRO-01, AUTH-02.
- **Rama:** `feature/anl-01-analysis-api`.
- **Archivos:** módulo analyses, EngineClient, repositorio y tests.
- **Encargo:** POST analyses; leer skills propias, enviar DTO mínimo al engine, validar resultado, persistir instantáneas/versiones y resolver idempotencia concurrente.
- **Aceptación:** no acepta skills del cliente como autoridad; no guarda éxito ante timeout/fallo DB/respuesta inválida; mismo comando y key no duplica.
- **Validación:** engine real y DB real para caso feliz; dobles controlados para timeout/incompatibilidad; dos usuarios y carreras de idempotencia.

### ANL-02 — Formulario, resultado y detalle de análisis

- **Responsable:** P2.
- **Dependencias:** ANL-01, ANL-03, PRO-02.
- **Rama:** `feature/anl-02-analysis-ui`.
- **Archivos:** web/features/analyses y componente AnalysisResult.
- **Encargo:** pegar texto, solicitar análisis, navegar a detalle, mostrar coincidencias/faltantes/evidencia y explicar el porcentaje.
- **Aceptación:** no hay score ficticio mientras carga; 0 y null son estados distintos; reintento conserva texto y key cuando corresponde; error de engine no bloquea perfil.
- **Validación:** conexión real, textos del corpus, sin tecnologías, sin skills, fallo y recarga de detalle. P5 revisa comprensión y accesibilidad.

### ANL-03 — Historial, lectura y eliminación autorizados

- **Responsable:** P1.
- **Dependencias:** ANL-01.
- **Rama:** `feature/anl-03-analysis-history-api`.
- **Archivos:** consultas GET/DELETE analyses, cursor y tests de propietario.
- **Encargo:** GET lista/detalle y DELETE; indicar revisión de skills antigua sin recalcular el resultado guardado.
- **Aceptación:** usuario A no lista/lee/borra datos de B; cursor estable; DELETE no cambia habilidades. Detalle usado por ANL-02 coincide con contrato.
- **Validación:** dos cuentas, IDs ajenos, paginación, eliminación y perfil modificado después del análisis.

### ANL-04 — Historial en frontend

- **Responsable:** P2.
- **Dependencias:** ANL-03, ANL-02.
- **Rama:** `feature/anl-04-analysis-history-ui`.
- **Archivos:** listado, enlaces de detalle, confirmación de eliminación.
- **Encargo:** historial paginado propio, estados vacío/error, volver a resultado y aviso de skills antiguas; eliminar con confirmación.
- **Aceptación:** se actualiza tras crear/borrar, recarga conserva historial y no mezcla cuentas; URL inexistente muestra 404 útil.
- **Validación:** recorrido de crear dos análisis, navegar, modificar skills y borrar uno.

### QAA-01 — Automatizar recorrido real M1

- **Responsable:** P2.
- **Dependencias:** ANL-04, AUTH-03, OPS-01, CI-01.
- **Rama:** `test/qaa-01-mvp-e2e`.
- **Archivos:** tests Playwright, utilidades y job de CI.
- **Encargo:** registro → perfil → skills → análisis → historial → recarga → logout; otro caso con dos cuentas y uno de fallo del engine.
- **Aceptación:** navegador, API, engine y PostgreSQL reales; sin mocks entre servicios en el recorrido feliz; fixtures externos no aplican todavía.
- **Validación:** ejecución local y CI repetibles con DB aislada y datos sintéticos; adjuntar trazas de fallos sin secretos.

### QA-02 — Ejecutar aceptación M1 y reportar defectos

- **Responsable:** P5.
- **Dependencias:** QAA-01.
- **Rama:** `docs/qa-02-mvp-acceptance-results`.
- **Archivos:** `docs/acceptance/M1-results.md` y evidencias acotadas.
- **Encargo:** ejecutar QA-01, revisar teclado/foco/contraste, dos pestañas y mensajes de dependencia. Reportar pasos, esperado, observado y commit probado.
- **Aceptación:** cada caso tiene aprobado/fallido/no ejecutado y evidencia pertinente; fallos bloqueantes tienen issue y se vuelven a probar después del arreglo.
- **Validación:** P1/P2 reproducen una muestra; ninguna captura contiene credenciales ni datos reales.

### DOC-02 — Explicar arquitectura y flujos implementados

- **Responsable:** P4.
- **Dependencias:** ANL-04, AUTH-02, ENG-02.
- **Rama:** `docs/doc-02-mvp-architecture`.
- **Archivos:** `docs/ARCHITECTURE.md`, diagramas y mapa endpoint-pantalla.
- **Encargo:** describir el comportamiento real, separación de auth/engine, flujo de token y fórmula; enlazar ADRs y limitaciones. Ajustar plan si hubo cambios aprobados.
- **Aceptación:** no confunde diseños futuros con features de M1; puertos/comandos/DTOs coinciden con código.
- **Validación:** P1/P2 revisan conexiones; no se requieren pruebas de código.

### REL-01 — Cerrar v0.1.0

- **Responsable:** P1 como integrador, P2 revisor.
- **Dependencias:** QA-02, DOC-02, DOC-01.
- **Rama:** `release/0.1.0` desde develop; PR a main y luego sincronización main → develop.
- **Encargo:** congelar alcance M1, ejecutar checks, resolver bloqueantes mediante PRs de fixes, registrar limitaciones y changelog.
- **Aceptación:** main representa M1 funcional, tag `v0.1.0` apunta al commit publicado y develop incluye la release; no hay features posteriores coladas.
- **Validación:** smoke test desde el tag y instalación documentada. No despliega ni contrata servicios.

## 5. M2: contexto profesional, CV y proyectos

### CTR-02 — Especificar contratos de las siguientes entregas

- **Responsable:** P4 con P1/P2.
- **Dependencias:** REL-01.
- **Rama:** `docs/ctr-02-extended-contracts`.
- **Archivos:** OpenAPI y ejemplos de proyectos/CV/jobs/learning paths.
- **Encargo:** contratos de M2 listos; contratos M3/M4 marcados como propuestos hasta resolver proveedor/contenido. Incluir multipart, descarga, limpieza, idempotencia y progreso.
- **Aceptación:** M2 no depende de proveedor; límites CV claros; futuro no aparece como endpoint ya disponible.
- **Validación:** esquemas y ejemplos; JSR-01/LRN-01 pueden motivar un PR de ajuste antes de su implementación.

### PRJ-01 — Proyectos y relación con tecnologías

- **Responsable:** P1.
- **Dependencias:** CTR-02, REL-01.
- **Rama:** `feature/prj-01-projects-api`.
- **Archivos:** migración, módulo projects, relaciones y tests.
- **Encargo:** CRUD propio, validación de URL como dato y skills de catálogo; actualizar revisión de proyectos transaccionalmente.
- **Aceptación:** acceso ajeno es 404; URLs no disparan fetch del servidor; borrar proyecto no borra habilidades personales.
- **Validación:** CRUD real, relaciones inválidas, usuario ajeno y rollback.

### PRJ-02 — Portafolio en perfil

- **Responsable:** P2.
- **Dependencias:** PRJ-01.
- **Rama:** `feature/prj-02-projects-ui`.
- **Archivos:** web/features/projects, navegación del perfil.
- **Encargo:** lista, creación, edición y eliminación de proyectos con selector de tecnologías; enlaces seguros al salir.
- **Aceptación:** guardado real, errores conservan formulario, estado vacío útil y confirmación de borrado.
- **Validación:** crear/editar/borrar tras recarga y teclado; P5 revisa claridad de la evidencia autodeclarada.

### CV-01 — Almacenamiento y API de CV privado

- **Responsable:** P1.
- **Dependencias:** CTR-02, REL-01.
- **Rama:** `feature/cv-01-private-storage-api`.
- **Archivos:** migración, módulo cv, interfaz CvStorage, adaptador local, limpieza y env.
- **Encargo:** un PDF ≤5 MiB por cuenta; validar carga, subir/sustituir, metadata, descargar y borrar. Implementar compensación y reconciliación descritas en el plan.
- **Aceptación:** archivos fuera de webroot, claves generadas, descarga propia con bearer, sin parseo ni URLs públicas; no exponer nombre físico.
- **Validación:** tipo/tamaño, path traversal en nombre, dos usuarios, fallo DB/escritura/limpieza y reinicio. P2 revisa volumen de Compose y contrato.

### CV-02 — Interfaz de CV

- **Responsable:** P2.
- **Dependencias:** CV-01, AUTH-03.
- **Rama:** `feature/cv-02-profile-cv-ui`.
- **Archivos:** web/features/cv y sección de perfil.
- **Encargo:** seleccionar PDF, subir/sustituir, metadata, descarga autenticada vía Blob y eliminar. Mensaje explícito: no se analiza automáticamente.
- **Aceptación:** errores claros para PDF inválido/tamaño; doble clic controlado; no aparece bearer en URL ni historial; Blob URL se libera.
- **Validación:** flujo real, descarga tras recargar, sustitución y eliminación; P5 confirma accesibilidad.

### QA-03 — Aceptación M2 y regresión M1

- **Responsable:** P5.
- **Dependencias:** PRJ-02, CV-02.
- **Rama:** `docs/qa-03-profile-context-results`.
- **Archivos:** casos/resultados M2 y defectos vinculados.
- **Encargo:** proyectos, CV, límites, descarga privada y regreso al flujo M1. Verificar que un CV no modifica skills.
- **Aceptación:** evidencias del commit probado; bloqueantes corregidos y revalidados; setup actualizado por P4 cuando cambie.
- **Validación:** P1/P2 aportan sus pruebas automáticas; P5 ejecuta aceptación con archivos sintéticos seguros.

### REL-02 — Cerrar v0.2.0

- **Responsable:** P1; P2 revisa.
- **Dependencias:** QA-03.
- **Rama:** `release/0.2.0` → main; después main → develop.
- **Encargo:** validar migraciones desde v0.1.0, volumen CV, regresión y documentación.
- **Aceptación:** main y tag `v0.2.0` representan M2, sin JSearch obligatorio.
- **Validación:** actualizar una DB de M1 y ejecutar smoke test desde tag, sin borrar datos para ocultar incompatibilidades.

## 6. M3: proveedor de vacantes

### JSR-01 — Verificar acceso y permisos de JSearch

- **Responsable:** P4; P1 valida aspectos técnicos.
- **Dependencias:** REL-01.
- **Rama:** `docs/jsr-01-provider-contract-review`.
- **Archivos:** `docs/provider/JSEARCH.md`, matriz de permisos y ejemplos sintéticos.
- **Encargo:** consultar documentación oficial vigente para endpoints, parámetros, headers, paginación, cuotas, costo cero disponible, atribución, caché y retención de texto/resultados derivados. Registrar fecha y enlaces.
- **Aceptación:** cada permiso es confirmado/no permitido/pendiente con evidencia; una cuota no se inventa ni se extrapola de otra cuenta; sin secretos.
- **Validación:** P1 determina qué puede implementarse; si falta acceso sin costo se documenta la limitación y M3 live queda pendiente, conservando demo con fixtures identificados.

### JSR-02 — Adaptador de búsqueda y detalle

- **Responsable:** P1.
- **Dependencias:** JSR-01, REL-02, CTR-02.
- **Rama:** `feature/jsr-02-jobs-provider-api`.
- **Archivos:** módulo jobs, interfaz JobsProvider, adaptadores live/fixtures y tests.
- **Encargo:** búsqueda/detalle normalizados, host fijo, key en servidor, límites de consultas y tiempo, mapeo de errores. Persistencia/caché solo según JSR-01.
- **Aceptación:** nunca entrega credencial al navegador; distingue modo fixture/live; no llama URLs arbitrarias; respeta paginación realmente soportada.
- **Validación:** fixtures de 200, vacío, 429, timeout y JSON inválido. Prueba live manual acotada solo con acceso permitido y sin contratar.

### JSR-03 — Analizar vacante del proveedor con engine existente

- **Responsable:** P1.
- **Dependencias:** JSR-02, ANL-01, CTR-02.
- **Rama:** `feature/jsr-03-provider-analysis`.
- **Archivos:** fuente jsearch de analyses, reglas de persistencia y tests.
- **Encargo:** resolver providerId en servidor, obtener texto permitido, reutilizar orquestación e instantáneas según permisos. No implementar otro score.
- **Aceptación:** devuelve Analysis DTO común; sin providerId falso como texto de confianza; caída del proveedor no rompe análisis manual. Se rechaza la ruta si permisos de persistencia requeridos siguen pendientes.
- **Validación:** fuente manual sigue pasando, proveedor válido, ID inválido, cuota y timeout, y guardado permitido verificable.

### JSR-04 — Pantalla de búsqueda y selección

- **Responsable:** P2.
- **Dependencias:** JSR-02, JSR-03, ANL-02.
- **Rama:** `feature/jsr-04-jobs-ui`.
- **Archivos:** web/features/jobs y navegación al resultado común.
- **Encargo:** filtros, lista, detalle, atribución y analizar selección; evitar peticiones por cada tecla sin control.
- **Aceptación:** modo demo visible, vacíos y cuota explicados, score renderizado con mismo componente de texto manual; HTML del proveedor no se inserta crudo.
- **Validación:** fixture feliz y fallos; búsqueda live manual si está disponible; P5 revisa etiquetas y enlaces.

### QA-04 — Aceptación y límites del proveedor

- **Responsable:** P5.
- **Dependencias:** JSR-04.
- **Rama:** `docs/qa-04-jsearch-results`.
- **Archivos:** resultados M3, separación de pruebas fixture/live.
- **Encargo:** demostrar consulta, selección y análisis; verificar fallos y que el flujo manual permanece operativo. Validar que la UI no confunde fixtures con datos reales.
- **Aceptación:** se indica qué fue probado con proveedor real; no se cierra integración live si solo hubo mocks. Limitaciones de acceso registradas.
- **Validación:** matriz con evidencia, revisión de P1/P4 de permisos y actualización del README.

### REL-03 — Cerrar v0.3.0

- **Responsable:** P1; P2 revisa.
- **Dependencias:** QA-04.
- **Rama:** `release/0.3.0` → main; después main → develop.
- **Encargo:** release M3 con estados y permisos claros.
- **Aceptación:** si live no se pudo completar, el alcance publicado lo declara como demo de adaptador y no cierra las issues de integración real. Si el criterio completo M3 es obligatorio, el release espera a resolver ese bloqueo.
- **Validación:** configuración sin key mantiene M1/M2 utilizables; con modo habilitado se valida su comportamiento permitido.

## 7. M4: rutas de aprendizaje sin IA generativa

### LRN-01 — Plantillas, prerequisitos y actividades curadas

- **Responsable:** P3.
- **Dependencias:** CAT-01, PRJ-02.
- **Rama:** `data/lrn-01-learning-content`.
- **Archivos:** `packages/catalog/learning-templates.json`, guía de contenido y casos esperados.
- **Encargo:** objetivos por tecnología, prerequisitos acíclicos, actividad concreta, evidencia sugerida y recurso opcional verificado. Incluir formas de extender un proyecto existente.
- **Aceptación:** IDs conocidos, sin ciclos, orden explicable, recursos pertinentes; no promesas laborales ni estimaciones de dominio falsas.
- **Validación:** revisión P1 de estructura y P5 de claridad; ejemplos de cero faltantes, varios faltantes y proyecto compatible.

### LRN-02 — Generación determinista y persistencia de rutas

- **Responsable:** P1.
- **Dependencias:** CTR-02, REL-02, LRN-01, PRJ-01.
- **Rama:** `feature/lrn-02-path-generation-api`.
- **Archivos:** migraciones, generador, repositorio learning-paths y tests.
- **Encargo:** generar desde análisis propio, skill snapshot, proyectos y contenido versionado; expandir prerequisitos, ordenar y guardar cabecera/pasos atómicamente con idempotencia.
- **Aceptación:** misma entrada/versión produce misma estructura; no acepta análisis ajeno; mantiene razones y snapshots; no llama LLM ni modifica score.
- **Validación:** corpus de rutas esperado, ciclos rechazados, doble envío, fallo de transacción y cero faltantes.

### LRN-03 — Consulta, progreso y eliminación de rutas

- **Responsable:** P1.
- **Dependencias:** LRN-02.
- **Rama:** `feature/lrn-03-learning-progress-api`.
- **Archivos:** endpoints list/detail/progress/delete y tests.
- **Encargo:** estados pending/in_progress/completed, completed_at coherente y porcentaje derivado. Conservar historia al borrar proyecto; cascade de rutas al borrar análisis.
- **Aceptación:** propietario verificado en todos los niveles; marcar paso no añade skills; reabrir paso actualiza progreso; cero pasos tiene estado explicable.
- **Validación:** cuenta ajena, step de otra ruta, transiciones, eliminación de proyecto/análisis y recarga de progreso.

### LRN-04 — Pantallas de ruta y avance

- **Responsable:** P2.
- **Dependencias:** LRN-03, ANL-02.
- **Rama:** `feature/lrn-04-learning-path-ui`.
- **Archivos:** web/features/learning-paths y CTA desde análisis.
- **Encargo:** generar ruta, listar, mostrar pasos/motivos/proyecto/recurso y registrar progreso; aclarar avance autodeclarado.
- **Aceptación:** no hay plan ficticio al cargar; doble clic no duplica; progreso persiste al recargar y fallo no confirma una actualización inexistente.
- **Validación:** flujo desde análisis, cero faltantes, proyecto eliminado y navegación por teclado. P5 revisa utilidad de cada paso.

### QA-05 — Aceptación completa y regresión de entregas

- **Responsable:** P5.
- **Dependencias:** LRN-04.
- **Rama:** `docs/qa-05-learning-path-results`.
- **Archivos:** casos/resultados M4 y matriz final de requisitos.
- **Encargo:** validar ruta explicable, progreso y conexiones con análisis/proyectos; recorrer de nuevo M1–M3 disponibles.
- **Aceptación:** cada requisito se vincula a evidencia o limitación explícita; ningún resultado fixture se presenta como live.
- **Validación:** P1/P2 corrigen y revalidan bloqueantes; P4 actualiza guía y arquitectura final.

### REL-04 — Cerrar v0.4.0

- **Responsable:** P1; P2 revisa.
- **Dependencias:** QA-05.
- **Rama:** `release/0.4.0` → main; después main → develop.
- **Encargo:** validar actualización desde versión previa, setup y casos completos; generar release notes y tag.
- **Aceptación:** versión local reproducible con datos sintéticos y limitaciones visibles; no se exige hosting.
- **Validación:** arrancar desde tag, migrar y ejecutar recorrido completo. Conservar main/develop sincronizadas.

## 8. Trabajo opcional

### DEP-01 — Evaluar despliegue a cero pesos

- **Responsable:** P4 con P1/P2.
- **Dependencias:** REL-01.
- **Rama:** `docs/dep-01-zero-budget-options`.
- **Archivos:** `docs/DEPLOY_OPTIONS.md`.
- **Encargo:** comparar opciones oficiales vigentes para web, API, engine, PostgreSQL, CV privado y JSearch. Separar demo temporal de servicio persistente; registrar suspensión, cuotas, tarjeta, retención y términos.
- **Aceptación:** costo total y límites justificados; puede recomendar seguir local si no existe opción adecuada. Ninguna cuenta de pago ni despliegue se crea con esta tarea.
- **Validación:** enlaces oficiales y fecha de consulta; P1/P2 evalúan si la topología funciona. Implementar/publicar requeriría tareas nuevas.

## 9. Prompt reutilizable para encargar una tarea a otra IA

Copiar la sección de la tarea y completar el contexto. No entregar solo un título como “haz login”.

```text
Proyecto: DevPath.
Lee la descripción y docs/PLAN_DE_IMPLEMENTACION.md.
Lee docs/FLUJO_GITHUB.md y los contratos del módulo.
La aplicación se construye por etapas y no debes implementar features ajenas.

Tarea asignada: <ID y texto completo de su sección>
Persona responsable: <nombre>
Entrega: <M0/M1/M2/M3/M4>
Dependencias integradas: <IDs y commits/PRs>
Base: origin/develop, commit <SHA verificado>
Rama: <rama exacta>
Worktree/carpeta: <ruta exclusiva para esta tarea>
Archivos permitidos: <lista de la tarea; concretar con el integrador>
Entradas/salidas: <DTO, endpoint, catálogo o documento esperado>
Fuera de alcance: <funciones que no corresponden a esta tarea>

Procedimiento:
1. Inspecciona el estado real y las instrucciones aplicables del repositorio.
2. Confirma que las dependencias existen y que el contrato no es ambiguo.
3. Si falta una dependencia, informa el bloqueo preciso; no inventes otra API.
4. Implementa o documenta solo el alcance asignado.
5. No cambies contratos, migraciones, lockfile ni configuración compartida
   fuera de tu alcance sin coordinar un cambio concreto con el integrador.
6. Ejecuta la validación apropiada. Si no se ejecuta, explica la limitación.
7. Revisa el diff y evita secretos, datos reales y archivos de otras tareas.
8. Entrega commits revisables y un resumen para el PR:
   cambio observable, contrato utilizado, pruebas y limitaciones.
9. No hagas merge ni publiques una release por tu cuenta.

Criterios de aceptación:
<copiar los criterios y validaciones de la tarea>

Salida esperada:
- Archivos y comportamiento cambiados.
- Comandos/casos ejecutados y resultados reales.
- Dependencias o limitaciones pendientes.
- Título y cuerpo propuestos del PR hacia develop.
```

Para una tarea documental o de catálogo, sustituir “implementa” por el entregable correspondiente y no exigir pruebas de aplicación que no aporten evidencia.

## 10. Ejemplo completo: entregar login entre capas

El login se divide para no dejar dos IAs inventando contratos diferentes:

1. **CTR-01, P4 + revisión P1/P2:** fija request/response, cookie, errores y refresh.
2. **AUTH-01/AUTH-02, P1:** implementa credenciales, sesión y middleware. Cada tarea tiene su rama desde develop.
3. **AUTH-03, P2:** integra cliente HTTP, token en memoria y coordinación de renovación.
4. **AUTH-04, P2:** conecta formulario y rutas privadas al cliente de sesión existente.
5. **QA-01/QA-02, P5:** define y luego ejecuta casos; no modifica código de auth.
6. **DOC-02, P4:** documenta el sistema que realmente quedó.
7. **P2 revisa PRs backend y P1 los de frontend.** Después de cada merge, la siguiente tarea nace del develop actualizado.

Si P2 adelanta maquetación, usa los ejemplos de CTR-01 en su propia rama. AUTH-04 solo se cierra al verificar conexión real con AUTH-01/AUTH-02. “Se ve el formulario” y “login integrado” son entregables distintos.

## 11. Cómo cerrar una issue y medir avance

Columnas sugeridas: Backlog → Ready → In progress → In review → Done; Blocked con motivo y dependencia concreta cuando aplique.

Una tarea pasa a Ready cuando tiene contrato suficiente y dependencias integradas. Solo una tarea de implementación principal activa por programador. Los contribuidores de catálogo/docs/QA pueden trabajar en paralelo.

Registrar por issue: ID, entrega, responsable, revisor, rama, dependencias, criterio, enlaces a PR/evidencia y estado. Avance se mide por criterios aceptados y recorridos funcionales, no por cantidad de commits o líneas.

Este documento define 50 tareas: las 49 originales y STR-01 para estructura, incluida la evaluación opcional de despliegue. Se distribuyen en el lote 00 dedicado y diez lotes de hasta cinco tareas. GOV-01 prepara decisiones antes del bootstrap; los fixes descubiertos se convierten en issues adicionales del hito afectado, no se esconden dentro de tareas no relacionadas.
