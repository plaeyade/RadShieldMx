# Fuentes locales (no versionadas)

Regla del proyecto: los PDF con licencia no se versionan. Los documentos siguientes no están en git;
aquí sólo queda la referencia bibliográfica, sin contenido. La app y las pruebas no leen estos archivos
(las pruebas transcriben únicamente los números necesarios, ver `docs/plan-motores-calculo.md`).
`scripts/manifiesto_gamma.py` los incluye en `gamma-ingesta.json` cuando están en la carpeta local.

**Ruta local del propietario:** `data\pdf\` del clon local de RadShieldMx (ignorada por `.gitignore`)
y su copia indexada en `GAMMA_Knowledge_RAGFlow\corpus\`.

| Archivo local | Título | Emisor | Año |
|---|---|---|---|
| `data/pdf/tg108_pet_shielding.pdf` | M. T. Madsen et al., *AAPM Task Group 108: PET and PET/CT Shielding Requirements*, Med. Phys. 33(1) 4–15 | AAPM | 2006 |
| `data/pdf/room_shield_design.pdf` | R. Kudchadker, *Radiation Vault Design and Shielding* (presentación, curso IAEA) | MD Anderson Cancer Center / IAEA | 2014 |
| `data/pdf/ncrp_151.pdf`, `data/pdf/ncrp_151_en.pdf` | *NCRP Report No. 151: Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities* | NCRP | 2005 |
| `data/pdf/ncrp_147.pdf` | *NCRP Report No. 147: Structural Shielding Design for Medical X-Ray Imaging Facilities* | NCRP | 2004 |

Se conservan en git, por ser públicos o propios:

- `data/pdf/nom_008_ener.pdf`: NOM-008-NUCL-2011, *Control de la contaminación radiactiva* (DOF,
  26-10-2011), SENER/CNSNS. Documento público del Diario Oficial (el nombre del archivo se mantiene por
  compatibilidad; no es la NOM-008-ENER).
- `public/Manual_Usuario_RadShieldMX_v28.pdf` y `_v32.pdf`: manuales propios.
