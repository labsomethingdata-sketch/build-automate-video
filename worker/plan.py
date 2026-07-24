"""
Contrato de salida: construcción del plan.md.

Módulo puro (sin dependencias de Modal) para poder testearlo aislado.
`worker/main.py` lo importa cuando implementa la etapa `assemble_plan`.
"""

from __future__ import annotations


def build_plan_md(*, project: dict, clean_video_url: str, cuts: list[dict],
                  reframes: list[dict], visuals: list[dict], materials: list[str],
                  cost_total_usd: float) -> str:
    """Ensambla el plan.md final. Es el 'contrato' de salida del sprint."""
    out: list[str] = [f"# 🎬 Plan de edición — {project.get('title', 'Sin título')}", ""]

    if project.get("description"):
        out += [f"> **Objetivo:** {project['description']}", ""]

    out += ["## ✂️ Video limpio",
            f"- Descarga (link temporal): {clean_video_url}",
            f"- Cortes aplicados: **{len(cuts)}**", ""]

    out += ["## 🗒️ Cortes aplicados"]
    if cuts:
        out += ["| # | Inicio | Fin | Motivo |", "|---|--------|-----|--------|"]
        out += [f"| {i} | {c.get('start')} | {c.get('end')} | {c.get('reason', '')} |"
                for i, c in enumerate(cuts, 1)]
    else:
        out += ["_Sin cortes._"]
    out += [""]

    out += ["## 🔲 Reencuadres propuestos (revisión manual)"]
    out += [f"- **{r.get('at', '')}** — {r.get('suggestion', '')}" for r in reframes] \
        or ["_Sin propuestas de reencuadre._"]
    out += [""]

    out += ["## 🎨 Apoyo visual propuesto (aún no generado)"]
    out += [f"- **{v.get('at', '')}** _({v.get('type', '')})_ — {v.get('idea', '')}" for v in visuals] \
        or ["_Sin propuestas visuales._"]
    out += [""]

    out += ["## 📦 Material necesario"]
    out += [f"- [ ] {m}" for m in materials] or ["_Nada adicional._"]
    out += [""]

    out += ["## 💰 Costo estimado",
            f"- Total: **${cost_total_usd:.2f} USD**", "",
            "---", "_Generado automáticamente por Motor de Videos._"]
    return "\n".join(out)
