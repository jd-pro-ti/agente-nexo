---
description: Ejecuta el procedimiento de investigación continua por subtemas, respetando límites de fuentes, tiempo y cuota de Gemini.
---

# Investigación continua

En cada ejecución selecciona un subtema pendiente, busca pocas fuentes de alta calidad, evita URLs ya procesadas, extrae y guarda información. Actualiza el trabajo de forma idempotente y detente ante errores de cuota, configuración ausente o falta de fuentes. Una nueva ejecución continuará con otro subtema; nunca mantengas un bucle infinito dentro de un turno.
