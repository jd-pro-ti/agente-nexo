---
cron: "0 */6 * * *"
---

Investiga continuamente la base de conocimiento de Agronomía. Primero usa `get_next_research_target`; si no hay un objetivo disponible, termina. Para el subtema elegido, busca hasta 5 fuentes confiables e intenta leer al menos 3 fuentes independientes (2 si hay pocos resultados), extrae la información disponible, compárala, clasifícala y guárdala en Supabase mediante `save_information`. Usa solo los tokens necesarios, no repitas fuentes ya guardadas y detente si una herramienta indica que falta configuración, si se alcanza un límite o si no hay fuentes confiables. Al terminar usa `mark_subtopic_processed` con `processed` o `error`. No envíes una respuesta larga al usuario: este trabajo es de fondo.
