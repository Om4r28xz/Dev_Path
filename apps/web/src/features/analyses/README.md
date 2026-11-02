# ANL-02 — formulario, resultado y detalle persistente

Implementación local para revisión y contribución de Karen. Base50d2b26 de develop, con evidence integrado por PR22. Sin commit de entrega, push ni PR de ANL-02 desde esta preparación. ANL-04 y lote06 fuera de alcance.

## Flujo implementado

Se recuperó el avance existente sin reprogramarlo desde cero. Formulario con título opcional y texto, validación, estados pendientes sin score ficticio, bloqueo del doble envío y errores con foco. Conserva texto y Idempotency-Key para reintentar el mismo comando; editar genera una clave nueva. POST real navega al detalle guardado; GET autenticado recupera PostgreSQL tras recargar. Error de detalle recuperable,404 útil para ID inválido/inexistente/ajeno y enlaces a perfil/nuevo análisis.

Resultado muestra tecnologías detectadas/coincidentes/faltantes, explicación de cobertura,0% distinto de null y aviso skillsOutdated sin recalcular historia. Evidence opcional de OpenAPI1.1.0 se muestra como menciones agrupadas por tecnología mediante texto React; nunca HTML. Ausencia en históricos: mensaje de no disponible separado de “sin tecnologías”; evidence[] sin requisitos tiene explicación propia.

## Contrato y seguridad

El tipo Analysis y el comando se importan de los artefactos públicos generados. apps/web/tsconfig.app.json incluye explícitamente ese archivo para el proyecto TypeScript compuesto; no se relajan comprobaciones ni se modifica el contrato. validation.ts comprueba DTO base, fórmula/particiones, tipos/límites/fechas/IDs y evidencia antes de almacenar en cache. Opcional malformado/excesivo se omite; snapshot base inválido se rechaza sin inventar resultado. No se puede comprobar slice del texto original en el navegador porque la API no lo expone; esa garantía pertenece al backend integrado.

Queries separadas por propietario/ID, cancelación y descarte de respuestas tardías al cambiar identidad. Borrador/key solo en memoria; no se promete recuperar el formulario después de recargar, sí el resultado por su URL. Sin credenciales en web storage ni nuevas dependencias.

No hay cambios API/Skill Engine/DB/OpenAPI/CI/lockfile. No se incluye historial frontend ANL-04.

## Validación y revisión

Node22.23.4/pnpm11.22.0. Typecheck/build/lint/formato y suites completas: web73,API118,engine51; contratos2 documentos/19 ejemplos, corpus30. PostgreSQL18.3 real aislado; no prueba local16. PR22/base50d2b26 tiene CI verde con servicio16, pero eso no es CI de la futura contribución de Karen.

Chromium/Playwright con web/API/engine/PG reales comprueba67%, evidence persistida, legacy sin evidencia, recarga,0/null, errores/404/cuentas, teclado/foco y reintento con la misma clave. Fixture adversario de transporte demuestra textoHTML inerte, separado de éxitos reales;503 controlado solo para error. El recorrido portable se entrega en el ZIP junto con resultados detallados y comandos, sin incorporar dependencias E2E al repo antes de QAA-01.

Criterios funcionales implementados y verificados automáticamente. Pendientes humanos: Karen comprende/revisa/prueba/contribuye; P5 valida comprensión, lectores de pantalla, contraste y responsive; Omar revisa el PR y su CI antes de integrar. Esta entrega no equivale a aprobación humana, integración de ANL-02 ni releaseM1.

Comprobación adicional del recorrido final: corpus30 completo por la UI real (28 análisis persistidos con IDs esperados intactos y2 entradas vacías rechazadas), cuenta sin skills con0% cuando hay requisitos. Pérdida ambigua de respuesta tras POST201 real: retry conserva key/body, recibe200 del mismo análisis y mantiene una sola fila PostgreSQL. Todo aprobado; usuarios sintéticos limpiados.
