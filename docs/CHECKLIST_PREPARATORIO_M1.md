# Checklist preparatorio M1 — no es REL-01 iniciada

Fecha:2026-11-02. Base 09dfb04, ANL-04 local e628ce4 sin merge. Material de planificación, sin release/changelog/tag ni cambio de versión. No equivale a autorización para publicar.

## Integraciones técnicas verificadas

- [x] PRO-02/PR #19,ANL-01/PR #20,ANL-03/PR #21,evidence/PR #22 integradas.
- [x] ANL-02/PR #24, commit502df79 integrado mediante09dfb04.
- [x] Auditoría nueva de 09dfb04: checks locales y navegador/servicios reales aprobados; CI consultada de base verde.
- [ ] ANL-04 revisada/fusionada y verificada por fetch. La implementación local validada no satisface esta puerta.
- [ ] QAA-01 implementada,CI real y merge comprobados.
- [ ] QA-02 ejecutada/revisada/integrada; aceptación humanaP5 registrada sin suplantación.
- [ ] DOC-02 implementada/revisada/integrada; mapa y diagrama coinciden con código.

## Condiciones previas a preparar release/0.1.0

- [ ] QA-02,DOC-02,DOC-01 integradas y bloqueantes cerrados.
- [ ] Instalación desde copia limpia reproducida por otra persona; desarrollo yCompose distinguidos.
- [ ] PostgreSQL16: migración desde vacío y desde versión anterior con datos sintéticos; seed repetible.
- [ ] Reinicio de servicios/volúmenes conserva perfil y análisis. No reset destructivo para ocultar errores.
- [ ] Registro/login/perfil/skills/análisis/evidence/historial/delete/logout y dos cuentas funcionan desde el corte.
- [ ] Errores401/404/409/503, sesión/dos pestañas y render adversario cubiertos.
- [ ] Teclado/foco/lector/contraste/responsive y comprensión revisados; no afirmar cumplimiento automático.
- [ ] Diff sin secretos/.env/claves/volúmenes/node_modules ni M2–M4 colados.
- [ ] CI del commit candidato aprobada; no usar el verde de una base antigua.

## Solo cuando se cumplan esas puertas

- [ ] Crear release/0.1.0 desde develop actualizado y congelar alcance según flujo.
- [ ] Preparar changelog/versiones, limitaciones y smoke exacto del candidato; aún no creados aquí.
- [ ] PR de release→main y revisión P1/P2/Omar.
- [ ] Integrador humano autoriza/hace merge commit, etiqueta commit exacto v0.1.0 y registra smoke del tag.
- [ ] PR main→develop con merge commit; verificar sincronización/ascendencia, sin force/reset.
- [ ] Solo después habilitar CTR-02 y sus contratos M2 en rama separada.

Pendientes concretos del entorno actual: Docker/Compose yPG 16 no disponibles localmente; PG 18.3 aislado sí fue probado. CI de base usóPG 16, pero falta CI del PR ANL-04 y E2E QAA-01. El proyecto puede avanzar localmente sin hosting/JSearch; no contratar ni desplegar para cerrar esta lista.
