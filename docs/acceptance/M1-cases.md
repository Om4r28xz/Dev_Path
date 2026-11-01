# Matriz de aceptación M1 — QA-01

Estado inicial: todos los casos **no ejecutados**. Esta matriz define esperados; no certifica M1 completo. Base contractual: OpenAPI público/interno 1.0.0; catálogo 1.0.0. Endpoints públicos bajo `/api/v1`. Las dependencias posteriores indican casos aún no ejecutables en lote 03.

Usar DB de prueba aislada, dos contextos de navegador A/B y datos sintéticos. No usar cuentas/volúmenes de demo para inyectar fallos. Contraseñas aquí son exclusivamente datos de prueba. Antes de cada ejecución registrar commit, Windows/Node/navegador, versión catálogo, fecha, ejecutor y precondiciones. Conservar evidencia saneada sin cookies/tokens.

## REG-01

- Pantalla/endpoint: /register → POST /auth/register.
- Precondiciones: Cuenta A inexistente.
- Entrada: name=Cuenta A; email=qa.a@example.test; password=Prueba-Solo-123!.
- Pasos: Enviar JSON con Origin permitido y X-DevPath-Client: web.
- Esperado: 201; DTO SessionResponse; perfil/familia/hash refresh persistidos; cookie HttpOnly; sin hash/password/refresh en JSON.
- Criterio del plan/dependencia: 7.1; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## REG-02

- Pantalla/endpoint: POST /auth/register.
- Precondiciones: A registrada.
- Entrada: Email QA.A@example.test con espacios externos.
- Pasos: Repetir registro; luego enviar dos registros simultáneos de un email nuevo.
- Esperado: 409 en duplicados; exactamente una cuenta/perfil/sesión creados en carrera.
- Criterio del plan/dependencia: 7.1; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## REG-03

- Pantalla/endpoint: POST /auth/register.
- Precondiciones: DB de pruebas aislada.
- Entrada: Nombre vacío; email inválido; password de 11 y 129 caracteres; propiedad extra.
- Pasos: Enviar cada variante por separado.
- Esperado: 400 con sobre de error; ninguna fila creada; contraseña no se recorta.
- Criterio del plan/dependencia: 7.1; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## REG-04

- Pantalla/endpoint: POST /auth/register.
- Precondiciones: DB aislada; inyección controlada de fallo tras insertar user.
- Entrada: Datos válidos únicos.
- Pasos: Forzar fallo de perfil dentro de transacción; consultar tablas.
- Esperado: Rollback completo; no queda cuenta, perfil ni sesión parcial.
- Criterio del plan/dependencia: 7.1; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## LOGIN-01

- Pantalla/endpoint: /login → POST /auth/login.
- Precondiciones: A registrada.
- Entrada: Credenciales A.
- Pasos: Enviar comando con origen/header/JSON válidos.
- Esperado: 200; JWT RS256 900 s; cookie siete días; no hash ni refresh en cuerpo.
- Criterio del plan/dependencia: 7.2; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## LOGIN-02

- Pantalla/endpoint: POST /auth/login.
- Precondiciones: A registrada.
- Entrada: Password incorrecta; email inexistente.
- Pasos: Enviar ambos casos.
- Esperado: 401 genérico idéntico; no se emite sesión/cookie.
- Criterio del plan/dependencia: 7.2; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## AUTH-SEC

- Pantalla/endpoint: POST /auth/register y /auth/login.
- Precondiciones: API disponible.
- Entrada: Origin desconocido/null/ausente; header ausente; text/plain.
- Pasos: Probar variantes independientes.
- Esperado: Rechazo de CSRF o 415; sin efectos en DB; JSON malformado da 400.
- Criterio del plan/dependencia: 7.2; seguridad.
- Observado: no ejecutado; evidencia pendiente.

## TOKEN-01

- Pantalla/endpoint: GET /me.
- Precondiciones: Token A válido y claves de prueba.
- Entrada: Token vencido, alterado, issuer/audience/algoritmo incorrectos.
- Pasos: Solicitar recurso protegido con cada variante.
- Esperado: 401; sin datos; nunca usar cookie como identidad bearer.
- Criterio del plan/dependencia: 7.2; AUTH-02/PRO-01 posteriores.
- Observado: no ejecutado; evidencia pendiente.

## SESSION-01

- Pantalla/endpoint: POST /auth/refresh y /auth/logout.
- Precondiciones: Sesión A; AUTH-02 integrada.
- Entrada: Cookie A.
- Pasos: Refresh; reutilizar anterior; logout; intentar refresh de nuevo.
- Esperado: Rotación atómica; reutilización revoca familia; logout impide refresh; bearer previo puede durar hasta exp.
- Criterio del plan/dependencia: 7.2; AUTH-02 posterior.
- Observado: no ejecutado; evidencia pendiente.

## PROFILE-01

- Pantalla/endpoint: /profile → GET/PATCH /me.
- Precondiciones: A y B registradas en contextos distintos.
- Entrada: Nombre/headline de A.
- Pasos: Editar A; leer B en otro contexto.
- Esperado: Solo cambia A; email no editable; campos fuera de DTO rechazados.
- Criterio del plan/dependencia: 7.1; PRO-01 posterior.
- Observado: no ejecutado; evidencia pendiente.

## SKILLS-01

- Pantalla/endpoint: /profile → GET /skills; PUT /me/skills.
- Precondiciones: A autenticada; catálogo 1.0.0.
- Entrada: java, javascript; ID inexistente; duplicados.
- Pasos: Buscar, reemplazar skills y volver a leer.
- Esperado: IDs conocidos únicos; error coherente ante inválidos; revisión incrementada al cambiar.
- Criterio del plan/dependencia: 7.3; PRO-01/PRO-02 posteriores.
- Observado: no ejecutado; evidencia pendiente.

## ANL-01

- Pantalla/endpoint: /analysis/new → POST /analyses.
- Precondiciones: A con java; flujo integrado.
- Entrada: Vacante Java y SQL; Idempotency-Key UUID nuevo.
- Pasos: Crear análisis real; inspeccionar respuesta y DB.
- Esperado: required java/sql; matched java; missing sql; 50%; snapshots/versiones persistidos.
- Criterio del plan/dependencia: 7.4; ANL/ENG-02 posteriores.
- Observado: no ejecutado; evidencia pendiente.

## ANL-EMPTY

- Pantalla/endpoint: POST /analyses.
- Precondiciones: A autenticada.
- Entrada: jobText vacío y solo espacios.
- Pasos: Enviar ambos por separado.
- Esperado: 400; no análisis persistido; sin éxito de negocio.
- Criterio del plan/dependencia: 8.4; ANL-01 posterior.
- Observado: no ejecutado; evidencia pendiente.

## ANL-NONE

- Pantalla/endpoint: /analysis/new → POST /analyses.
- Precondiciones: A autenticada.
- Entrada: Buscamos comunicación y trabajo en equipo..
- Pasos: Analizar y abrir detalle.
- Esperado: Sin tecnologías; porcentaje null; aviso NO_TECHNOLOGIES_DETECTED; no 0% engañoso.
- Criterio del plan/dependencia: 8.3; ANL/ENG posteriores.
- Observado: no ejecutado; evidencia pendiente.

## ANL-CORPUS

- Pantalla/endpoint: POST /internal/v1/analyze (red interna).
- Precondiciones: Credencial servicio; ENG-02 integrada.
- Entrada: Corpus CAT-02 salvo límites vacíos.
- Pasos: Ejecutar corpus; comparar conjuntos esperados sin reetiquetar.
- Esperado: Java/JS y React/Native separados; alias/signos/negaciones según etiquetas.
- Criterio del plan/dependencia: 8.1–8.2; CAT-02/ENG-02.
- Observado: no ejecutado; evidencia pendiente.

## ANL-IDEM

- Pantalla/endpoint: POST /analyses.
- Precondiciones: A autenticada.
- Entrada: Mismo UUID y cuerpo; luego mismo UUID con cuerpo distinto.
- Pasos: Repetir y contar registros.
- Esperado: Un análisis; repetición reproducible; 409 al cambiar comando.
- Criterio del plan/dependencia: 7.4; ANL-01 posterior.
- Observado: no ejecutado; evidencia pendiente.

## OWN-01

- Pantalla/endpoint: GET /analyses/{id}.
- Precondiciones: Análisis propio de A; tokens A/B.
- Entrada: ID A y UUID inexistente.
- Pasos: Leer como A; luego como B; luego ID inexistente.
- Esperado: A obtiene 200; B e inexistente obtienen 404 sin filtrar existencia.
- Criterio del plan/dependencia: 9; ANL-03 posterior.
- Observado: no ejecutado; evidencia pendiente.

## HISTORY-01

- Pantalla/endpoint: /analyses y /analyses/:id.
- Precondiciones: A con análisis guardado.
- Entrada: Recargar página; cambiar skills después.
- Pasos: Abrir listado/detalle; recargar URL; volver atrás.
- Esperado: Snapshots históricos estables; marca skillsOutdated; navegación válida.
- Criterio del plan/dependencia: 7.4; ANL-03/04 posteriores.
- Observado: no ejecutado; evidencia pendiente.

## ERR-01

- Pantalla/endpoint: POST /analyses.
- Precondiciones: API real; engine detenido o timeout inducido.
- Entrada: Vacante válida.
- Pasos: Solicitar con engine caído; repetir con plazo excedido.
- Esperado: 503/504 contractual; mensaje legible; sin análisis ficticio; sin bucle de refresh.
- Criterio del plan/dependencia: 8.4; ANL-01 posterior.
- Observado: no ejecutado; evidencia pendiente.

## ERR-02

- Pantalla/endpoint: POST /auth/login.
- Precondiciones: DB de prueba inaccesible.
- Entrada: Credenciales sintéticas.
- Pasos: Detener solo DB de prueba y solicitar; restaurarla.
- Esperado: 503 saneado; sin contraseñas/URLs/stack en respuesta; recuperación tras restaurar.
- Criterio del plan/dependencia: 11; AUTH-01.
- Observado: no ejecutado; evidencia pendiente.

## UI-01

- Pantalla/endpoint: /register /login /profile /analysis/new /analyses.
- Precondiciones: Web ejecutándose; futuras conexiones integradas.
- Entrada: Solo teclado; zoom 200%; lector accesible.
- Pasos: Tab/Shift+Tab/Enter; provocar validación; revisar labels/foco/contraste.
- Esperado: Orden lógico; foco visible; alertas anunciables; sin bloqueo; WCAG AA 4.5:1 texto normal y 3:1 grande/componentes.
- Criterio del plan/dependencia: 10–11; revisión humana.
- Observado: no ejecutado; evidencia pendiente.

## OPS-01

- Pantalla/endpoint: Proxy :8080 y /health/*.
- Precondiciones: Compose instalado; config local generada.
- Entrada: URL /login directa; /internal/v1/analyze; /api/v1/auth/login.
- Pasos: Iniciar tras migrate/seed; recargar SPA; intentar engine/DB desde proxy; reiniciar.
- Esperado: SPA carga; API accesible; engine/DB no expuestos; cuenta persiste; health no prueba matching.
- Criterio del plan/dependencia: 4–5; OPS-01.
- Observado: no ejecutado; evidencia pendiente.

## Checklist de estados y accesibilidad

- [ ] Carga, vacío, éxito, validación, error de red, 401, 403, 404, 409, 429 y 503/504 tienen mensajes y recuperación adecuados.
- [ ] Loading evita doble envío y conserva datos no sensibles.
- [ ] Teclado, foco visible, labels, alertas y contraste medidos en UI-01.
- [ ] Dos cuentas y ownership comprobados con backend real.
- [ ] P1/P2 revisan ejecutabilidad; P5 registra observados por caso y enlaces de evidencia.

Ninguna casilla está aprobada por redactar la matriz. Los resultados automatizados de AUTH-01/infra se documentarán en el handoff y no se trasladan automáticamente a estos recorridos manuales.

## Casos adicionales: evidencia pública opcional (esperados, no observados)

Contrato1.1.0; revisar ADR0004. No altera ni da por ejecutados casos anteriores. Registrar commit/entorno/ejecutor/evidencia real al ejecutar.

| Caso    | Precondiciones/entrada/pasos                                                            | Esperado                                                                                                               | Observado                |
| ------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| EVID-01 | A conJS+React, textoJS+React+Git; POST yGET propio/reload                               | 67%, matches/missing y menciones literales/offsets guardados iguales; sin vacante completa ni datos internos           | No ejecutado manualmente |
| EVID-02 | DB aislada, snapshot antiguo con required y evidence[]; GET y replay con misma key/body | Sin propiedad evidence; mismo ID/score/versiones/fila, sin motor/recalcular                                            | No ejecutado manualmente |
| EVID-03 | Sin tecnologías; POST/GET                                                               | null y warning, required[]/evidence[], nunca0% engañoso                                                                | No ejecutado manualmente |
| EVID-04 | DB aislada: JSONB inválido, texto no-alias, duplicados/rangos/arrays excesivos; GET     | Omite opcional sin romper base/histórico ni loguear fragmentos; POST interno inválido sigue rechazándose sin persistir | No ejecutado manualmente |
| EVID-05 | A guarda análisis; B intenta detalle/lista/delete y cambia sesión                       | 404 ajeno, lista sin evidencia, sin datos deA en cacheB                                                                | No ejecutado manualmente |
| EVID-06 | UI futura: texto conHTML/script; teclado/lector; motor detenido después de guardar      | Texto inerte y fallback accesible; GET funciona sin engine; revisar conP5 tras adaptarANL-02                           | Pendiente de UI          |
| EVID-07 | Cliente estricto anterior y actual contra fixtures viejo/nuevo                          | Viejo DTO válido en nuevo; cliente antiguo cerrado rechaza campo nuevo; coordinar lectores antes de emisión            | No ejecutado manualmente |
| EVID-08 | DTO sintético de frontera128KiB y variante mayor/multibyte                              | Evidencia completa solo dentro del presupuesto; exceso se omite, no se trunca                                          | No ejecutado manualmente |
