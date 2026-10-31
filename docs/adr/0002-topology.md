# ADR 0002: Topología local y fronteras de confianza

- Estado: aceptada
- Fecha: 2026-10-31
- Clasificación: topología del Skill Engine confirmada; organización de auth aceptada como propuesta técnica
- Responsables de revisión: P1, P2 y P4

## Contexto

El navegador necesita una única API pública. El Skill Engine debe poder evolucionar y probarse sin acceder a datos personales ni a PostgreSQL. La descripción inicial dejaba abierta la separación física de autenticación y no establecía con precisión quién debía llamar a JSearch.

El responsable del proyecto confirmó el 31 de octubre de 2026 que la evaluación exige ejecutar la API y el Skill Engine como procesos separados. No solicitó un proceso de autenticación independiente.

## Decisión

Se confirma esta topología local:

1. La web React/Vite solo consume rutas relativas bajo `/api/v1`.
2. La API Express es el único backend público, contiene auth como módulo y es propietaria de las operaciones con PostgreSQL.
3. El Skill Engine es un proceso REST TypeScript independiente y expone su frontera interna bajo `/internal/v1`.
4. La API llama al engine con una credencial de servicio distinta del JWT del usuario y envía solo texto, `candidateSkillIds` y `catalogVersion`.
5. El engine no accede a PostgreSQL, no recibe datos personales y no confía en un `X-User-Id` proporcionado por el navegador.
6. JSearch, cuando se implemente M3, se consume desde un adaptador de la API. Sus credenciales nunca llegan a la web ni al engine.

La autenticación como módulo de la API es una propuesta técnica aceptada para las primeras entregas. Sus rutas y contratos permanecen separados dentro de `/api/v1/auth/*`, pero no requieren un tercer proceso. Cualquier exigencia posterior de auth independiente obliga a revisar este ADR antes de implementar ese cambio.

## Consecuencias

- FND-01 debe producir dos servidores comprobables por separado: API y Skill Engine, además del proceso de desarrollo de la web.
- `app` y `server` se separan en API y engine para permitir pruebas sin abrir puertos.
- El proxy de demostración publica la web y `/api`, pero nunca `/internal`.
- Los recursos propios derivan `userId` del JWT verificado; las consultas filtran por propietario y los recursos ajenos responden `404`.
- El fallo del engine se traduce en la API y no expone detalles internos al navegador.

## Evidencia y revisión pendiente

La confirmación de procesos separados proviene de la decisión explícita del responsable durante GOV-01. P1 debe revisar la frontera de datos y P2 la ejecución separada en el PR; esas revisiones siguen pendientes hasta constar en GitHub.
