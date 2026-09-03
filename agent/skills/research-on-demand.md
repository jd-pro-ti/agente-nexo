---
description: Investiga y guarda un tema agronómico cuando el usuario pide buscar información.
---

Consulta primero Supabase. Si el usuario pide investigar y guardar, busca y lee mínimo dos fuentes independientes; combina OpenAlex y Crossref para literatura académica y DuckDuckGo para fuentes institucionales. No uses Brave. Después de leer cada fuente válida, ejecuta `save_information` inmediatamente con su URL, título, resumen, categoría, subtema y etiquetas. La investigación no puede terminar sin ese intento de guardado. No afirmes que se guardó si la herramienta no devolvió `saved: true`. Evita duplicados, limita la investigación a cinco fuentes, una ronda de guardado por fuente y 12,000 tokens por ejecución. Si una herramienta de guardado devuelve un error de esquema, no la repitas: informa el error exacto y continúa con la respuesta usando las fuentes leídas.
