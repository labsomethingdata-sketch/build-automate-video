import os
import sys

# Permite importar plan.py (que está en worker/, un nivel arriba).
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from plan import build_plan_md  # noqa: E402


def _plan(**overrides):
    args = dict(
        project={"title": "Mi Video", "description": "Directo y claro"},
        clean_video_url="https://s3/clean.mp4",
        cuts=[{"start": "00:00:12", "end": "00:00:19", "reason": "Silencio"}],
        reframes=[{"at": "00:00:20", "suggestion": "Centrar sujeto"}],
        visuals=[{"at": "00:01:30", "type": "gráfico", "idea": "Mostrar cifra"}],
        materials=["Gráfico con la cifra"],
        cost_total_usd=0.42,
    )
    args.update(overrides)
    return build_plan_md(**args)


def test_incluye_titulo_y_objetivo():
    md = _plan()
    assert "# 🎬 Plan de edición — Mi Video" in md
    assert "**Objetivo:** Directo y claro" in md


def test_cuenta_los_cortes_y_los_lista():
    md = _plan()
    assert "Cortes aplicados: **1**" in md
    assert "00:00:12" in md and "Silencio" in md


def test_costo_formateado_a_dos_decimales():
    assert "$0.42 USD" in _plan()


def test_secciones_vacias_muestran_placeholder():
    md = _plan(cuts=[], reframes=[], visuals=[], materials=[])
    assert "_Sin cortes._" in md
    assert "_Sin propuestas de reencuadre._" in md
    assert "_Sin propuestas visuales._" in md
    assert "_Nada adicional._" in md


def test_sin_objetivo_no_rompe():
    md = _plan(project={"title": "Solo título"})
    assert "Solo título" in md
    assert "**Objetivo:**" not in md
