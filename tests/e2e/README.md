# QAA-01: M1 real en Chromium

Base: develop c564a57. Node 22 (>=22.16 y <23), pnpm 11.22.0 y PostgreSQL 16 oficial.
No se requieren cuentas externas, Docker ni claves del desarrollador si existe PostgreSQL local.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm build
# Crear una base nueva, dedicada: nunca usar la base de desarrollo.
createdb devpath_e2e
E2E_DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/devpath_e2e pnpm test:e2e
```

PowerShell: establecer `$env:E2E_DATABASE_URL` antes de `pnpm test:e2e`.
La URL debe apuntar a PostgreSQL loopback y el nombre debe contener `test` o `e2e`.
El runner rechaza bases con usuarios antes de migrar/sembrar; no crea ni elimina bases.
Se conservan migraciones y catálogo para repetir; cada fixture elimina únicamente sus correos
aleatorios `@example.test` (con cascadas de sus propios recursos).

El runner sirve el build web por Vite preview en 5187, API compilada en 32066,
engine compilado en 32067 y control privado loopback en 32068. Rechaza puertos ocupados.
Genera una clave RSA y credencial interna temporales; borra su directorio temporal y apaga
sus procesos en `finally`, incluso si Playwright falla. No usa `.env` ni `.local-data`.
Ejecutar desde la raíz, después de `pnpm build`. No ejecutar dos suites con estos puertos a la vez.
Si se interrumpe forzosamente el proceso del runner, comprobar procesos/puertos propios antes de repetir.

## Cobertura

| Caso                       | Verificación real                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorrido M1               | Registro, logout/login, protección, edición/lectura de perfil, agregar/quitar skills, JavaScript+React frente a JavaScript+React+Git=67%, DTO requerido/coincidente/faltante, evidence, fila PostgreSQL, historial, detalle, refresh al recargar, cancelar/foco/Escape, borrar, persistencia y 404. |
| Dos cuentas                | Historial vacío de B, detalle y DELETE de A responden 404, fila de A intacta y recuperable al volver a A.                                                                                                                                                                                           |
| Caída real del engine      | Detener únicamente el proceso hijo del runner; 503 real sin persistir, perfil disponible, borrador/key conservados; arrancar, reintentar, replay 200 y una sola fila.                                                                                                                               |
| Legacy y entradas hostiles | 0% frente a null, evidence ausente simulada sobre fila propia, alias como texto, título con HTML literal sin elementos ejecutables, UUID inexistente 404.                                                                                                                                           |

Ningún servicio interno se sustituye por mocks. El caso legacy cambia solo el campo evidence de
su fila sintética para reproducir un registro histórico. La caída se controla fuera de la API de producto.
Workers=1 porque el fallo del engine afecta al stack de esta suite; retries=0 para no ocultar intermitencias.

## Reportes y privacidad

`playwright-report/` y `test-results/` están ignorados por Git. Solo en fallo se adjunta
`trace.safe.zip`: sin snapshots DOM, fuentes ni cuerpos de request/response; credenciales
conocidas, JWT y cabeceras sensibles se sustituyen. Los screenshots contienen datos sintéticos
y los campos de contraseña están enmascarados. La traza cruda solo existe en un temporal privado
durante el filtrado y se elimina aun si el filtro falla. No adjuntar capturas de cuentas reales.
`pnpm test:e2e:support` comprueba el filtrado y el rechazo de archivos inválidos.

CI añade un job independiente con PostgreSQL 16, Chromium instalado por Playwright, build,
migraciones/seed y runner. `ci-gate` exige también E2E; upload de evidencia filtrada solo en fallo.
El servicio PostgreSQL lo elimina el runner de GitHub al finalizar el job. No hay proveedor externo M1.

Los resultados concretos y limitaciones del entorno se registran en `docs/handoffs/lote-06.md`.
CI remoto, aceptación humana P5 y reproducción Docker Compose se verifican por separado.
E3/JSearch son M3: no se requieren para estas pruebas M1 y no se afirma una llamada live.

El runner fija PLAYWRIGHT_NO_COPY_PROMPT=1 en Playwright 1.64.1 para omitir su copia automática DOM de contexto de error: esa copia incluye valores de password. Se mantienen errores de aserción, ubicación, traza filtrada y screenshots. Al actualizar Playwright, repetir el fallo deliberado con password rellenado y revisar todos los artefactos.
