"""Genera gamma-ingesta.json (contrato gamma/ingesta@1, ADR-0034 de GAMMA-AI) para data/pdf/.

GAMMA-AI es el motor científico del ecosistema: indexa las normas y referencias, y RadShieldMx
consume la evidencia citada (src/lib/gammaEvidence.ts).
Uso: python scripts/manifiesto_gamma.py  (desde la raíz del repo; sólo stdlib)
Verificar con GAMMA: gamma ecosistema validar gamma-ingesta.json --raiz-productor .
Un PDF sin entrada en CATALOGO falla.
La NOM-008-NUCL-2024 (DOF 24-05-2024, pública) no está en git: si se descarga del DOF se guarda como
data/pdf/nom_008_nucl_2024.pdf (docs/fuentes-locales.md). NCRP 151/147, AAPM TG-108 y la presentación de room shielding
son ejemplares con licencia del propietario que viven en su data/pdf/ local (fuera de git,
docs/fuentes-locales.md). El manifiesto lista lo que haya en la carpeta local.
"""

import datetime
import hashlib
import json
import pathlib
import subprocess

RAIZ = pathlib.Path(__file__).resolve().parents[1]
CARPETA = RAIZ / "data" / "pdf"

# archivo → (título, dominio, emisor, idioma, jurisdicción)
CATALOGO = {
    "ncrp_151.pdf": (
        "NCRP Report 151: Structural Shielding Design for Megavoltage X- and Gamma-Ray Facilities",
        "radioproteccion/normas",
        "NCRP",
        "en",
        "US",
    ),
    "tg108_pet_shielding.pdf": (
        "AAPM TG-108: PET and PET/CT Shielding Requirements",
        "radioproteccion/normas",
        "AAPM",
        "en",
        "US",
    ),
    "room_shield_design.pdf": (
        "Room shielding design (referencia)",
        "radioproteccion/blindajes",
        "referencia técnica",
        "en",
        "INT",
    ),
    "nom_008_nucl_2024.pdf": (
        "NOM-008-NUCL-2024: Límites de contaminación radiactiva y criterios para su control (DOF 24-05-2024)",
        "radioproteccion/normas",
        "SENER/CNSNS",
        "es",
        "MX",
    ),
}


def main() -> None:
    docs = []
    for p in sorted(CARPETA.glob("*.pdf")):
        if p.name not in CATALOGO:
            raise SystemExit(f"sin catálogo para {p.relative_to(RAIZ)}")
        titulo, dominio, emisor, idioma, jur = CATALOGO[p.name]
        data = p.read_bytes()
        rel = p.relative_to(RAIZ).as_posix()
        docs.append(
            {
                "id_local": rel.rsplit(".", 1)[0],
                "ruta": rel,
                "sha256": hashlib.sha256(data).hexdigest(),
                "bytes": len(data),
                "mime": "application/pdf",
                "titulo": titulo,
                "dominio": dominio,
                "gobernanza": "restricted",
                "tipo": "document",
                "emisor": emisor,
                "licencia": "ejemplar del propietario; uso interno",
                "jurisdiccion": jur,
                "idioma": idioma,
            }
        )
    try:
        commit = subprocess.run(
            ["git", "rev-parse", "--short=12", "HEAD"], cwd=RAIZ, capture_output=True, text=True, check=True
        ).stdout.strip()
    except Exception:
        commit = None
    man = {
        "contrato": "gamma/ingesta@1",
        "productor": {"repo": "radshieldmx", **({"commit": commit} if commit else {})},
        "generado_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "documentos": docs,
    }
    (RAIZ / "gamma-ingesta.json").write_text(json.dumps(man, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"gamma-ingesta.json: {len(docs)} documentos")


if __name__ == "__main__":
    main()
