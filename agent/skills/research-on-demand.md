---
description: Investiga y guarda bajo demanda un tema agronómico cuando el usuario pide buscar información, usando fuentes confiables, clasificación por área y relaciones entre cultivo, suelo, agua, nutrición, plagas y enfermedades.
---

# Investigación agronómica bajo demanda

Activa este procedimiento cuando el usuario diga que quiere investigar, buscar, recopilar, documentar o guardar información de un tema agronómico.

## Procedimiento

1. Identifica el tema, cultivo, región, idioma y profundidad. Si el usuario pide información general, comienza a investigar con supuestos razonables y declara esos supuestos; pregunta solo si falta un dato indispensable para el objetivo solicitado.
2. Divide el tema en subtemas usando la taxonomía agronómica.
3. Usa `search_web` para encontrar hasta cinco fuentes relevantes. Intenta consultar al menos tres fuentes independientes; si el tema tiene pocos resultados, consulta al menos dos y explica la limitación. Prioriza universidades, gobiernos, organismos agrícolas y artículos científicos.
4. Usa `fetch_source` para leer el contenido real de cada URL. No guardes un resultado basándote solo en el título o fragmento del buscador.
5. Compara las fuentes entre sí y separa hechos, recomendaciones, rangos, condiciones y limitaciones. No inventes dosis, tratamientos ni datos que la fuente no respalde.
6. Usa `save_information` para guardar cada hallazgo con categoría, subtema, fuente, resumen, etiquetas y confianza. Guarda registros concretos, no una respuesta conversacional completa.
7. Relaciona el cultivo con clima, suelo, siembra, riego, nutrición, plagas, enfermedades, síntomas, tratamientos, cosecha y rendimiento cuando la fuente lo permita.
8. Informa al usuario qué se investigó, cuántas fuentes se guardaron y qué temas quedaron pendientes. Incluye las URLs.

## Reglas

- Antes de responder una consulta posterior, consulta `search_knowledge_base` o `get_topic_summary`.
- Si una fuente contradice a otra, guarda el hallazgo como `contradictory` o con confianza reducida y explica la diferencia.
- No repitas información ya guardada; usa la URL y el contenido como referencia de duplicados.
- Si Supabase no está configurado, no simules el guardado: informa el error.
- Para recomendaciones de plaguicidas, fertilizantes o tratamientos, indica que se requiere diagnóstico local, análisis de suelo/agua y cumplimiento de la etiqueta y regulación aplicable.
