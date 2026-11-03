# Dirección de interfaz de DevPath — desde el lote 06.5

DevPath ayuda a estudiantes y desarrolladores junior a preparar su búsqueda de trabajo. La interfaz debe transmitir claridad, confianza y seriedad sin volverse fría. Mantener el tono cercano y la identidad cálida existente; usar el rosa como acento contenido, no como fondo dominante. El resultado debe sentirse profesional y minimalista, no como un panel administrativo provisional ni como una promesa de contratación.

Esta es la dirección de producto para el lote 06.5 y para toda pantalla nueva de los lotes 07–10. El lote 06.5 debe convertirla en un sistema implementado y documentado en `docs/design/SISTEMA_VISUAL.md`. Los prompts posteriores deben usar ese sistema integrado; un documento o una rama sin merge no cuentan como base terminada.

## Principios de diseño

1. **La tarea primero.** En cada pantalla se entiende qué se puede hacer, qué datos se necesitan y cuál es el siguiente paso. Un CTA principal por contexto; acciones secundarias visibles sin competir por atención.
2. **Jerarquía sobria.** Tipografía legible, títulos claros, ancho de lectura razonable y agrupación por propósito. Espacio en blanco intencional, sin grandes áreas vacías que alejen contenido y acciones. Color, bordes e iconos sirven para orientar, no para decorar.
3. **Confianza y precisión.** Explicar que la compatibilidad compara tecnologías detectadas con habilidades declaradas; no predice contratación. Diferenciar porcentaje `0` de porcentaje no calculable, habilidades faltantes de errores, proyectos autodeclarados de evidencia verificada y datos de proveedor live de fixtures/demo. No inventar precisión ni resultados.
4. **Continuidad.** Autenticación, perfil, análisis, historial, proyectos, CV, vacantes y rutas comparten navegación, tokens, componentes, lenguaje de estados y patrones de interacción. Cada módulo puede tener contenido propio, pero no una identidad visual separada.
5. **Accesibilidad incorporada.** Diseño usable con teclado, foco visible, etiquetas y errores asociados, semántica correcta, contraste medido, targets cómodos, zoom y reflujo móvil. Los estados no dependen solo del color. Respetar preferencias de movimiento reducido si se añade animación.
6. **Privacidad visible.** Tratar CV y datos de cuenta con discreción; la UI no muestra rutas de almacenamiento ni tokens. Explicar que el CV no se analiza automáticamente. Enlaces externos se identifican y se abren de forma segura.

## Alcance concreto del lote 06.5

- Definir tokens de color, tipografía, espaciado, radio, bordes, sombra y estados; elegir valores verificables, no introducir dependencias de diseño sin necesidad.
- Consolidar layout, navegación y componentes compartidos de botones, campos, selección, tarjetas/listas, alertas, estados vacíos, carga, confirmación y resultados.
- Rediseñar login, registro, perfil/habilidades, nuevo análisis, resultado/detalle e historial sin alterar contratos ni reglas de negocio.
- Resolver los hallazgos conocidos: exceso de espacio blanco, textos/controles pequeños, selector de habilidades largo y poca jerarquía del porcentaje/evidencias.
- Validar recorridos reales y estados vacíos, cargando, error, éxito, `0` y `null` en escritorio, móvil y zoom; conservar regresión de auth, análisis, historial, privacidad y accesibilidad.

## Regla para las siguientes entregas

PRJ-02, CV-02, JSR-04 y LRN-04 deben partir del sistema visual integrado y usar sus componentes/tokens. Si un patrón nuevo es necesario, se agrega al sistema compartido dentro del PR de esa pantalla y se documenta. QA-03, QA-04 y QA-05 revisan coherencia visual, accesibilidad y claridad del flujo además de sus pruebas funcionales. El cierre final del lote 10 puede pulir detalles observados, pero no debe ser la primera vez que se unifica la interfaz.

El trabajo de API, proveedor, contenido o investigación independiente puede avanzar mientras se integra el lote 06.5. No se retiene una tarea de backend por una dependencia puramente visual.
