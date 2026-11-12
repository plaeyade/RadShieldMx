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

- `public/Manual_Usuario_RadShieldMX_v28.pdf` y `_v32.pdf`: manuales propios.

### NOM-008-NUCL-2024 (enlace oficial, sin PDF en git)

La NOM-008-NUCL-2011, *Control de la contaminación radiactiva* (DOF 26-10-2011), que se guardaba como
`data/pdf/nom_008_ener.pdf` (rótulo erróneo «ENER»), quedó derogada por la **NOM-008-NUCL-2024,
*Límites de contaminación radiactiva y criterios para su control*** (SENER/CNSNS, DOF 24-05-2024; en vigor
60 días naturales después de su publicación). El PDF 2011 se retiró del repositorio; la versión vigente se
consulta en las fuentes oficiales:

- DOF: https://www.dof.gob.mx/nota_detalle.php?codigo=5728406&fecha=24/05/2024
- Catálogo de NOM de la Secretaría de Economía:
  https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-008-NUCL-2024.pdf

Es una disposición oficial publicada en el DOF (texto no protegido, art. 14 fr. VIII de la Ley Federal del
Derecho de Autor), así que puede versionarse: si se descarga, guárdese como `data/pdf/nom_008_nucl_2024.pdf`
y regenérese `gamma-ingesta.json` con `scripts/manifiesto_gamma.py`. La ficha que cita la app está en
`src/lib/normativaMx.ts`. La norma regula contaminación radiactiva y zonas (de radiación > 0.05 mSv/h o
> 1 mSv en 5 días; de alta radiación > 1 mSv/h, sin cambio respecto a 2011); no fija límites de dosis ni
objetivos de diseño de blindaje.
