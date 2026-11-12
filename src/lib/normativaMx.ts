/**
 * Ficha única de la NOM-008-NUCL vigente, para que diálogos, bibliografía y reportes la citen igual.
 *
 * NOM-008-NUCL-2024, «Límites de contaminación radiactiva y criterios para su control» (SENER/CNSNS),
 * DOF 24-05-2024; entra en vigor 60 días naturales después de su publicación y deroga la NOM-008-NUCL-2011
 * «Control de la contaminación radiactiva» (DOF 26-10-2011). Es una norma de control de contaminación: NO fija
 * límites de dosis (en México los fija el RGSR, 1988; véase limitesDosis.ts) ni objetivos de diseño de blindaje
 * (NCRP 147/151). Lo que sí afecta a la clasificación de áreas son las zonas de radiación (§3.11) y de alta radiación
 * (§3.12), cuyos umbrales no cambiaron respecto a la edición 2011.
 */
export const NOM_008_NUCL = {
  clave: 'NOM-008-NUCL-2024',
  titulo: 'Límites de contaminación radiactiva y criterios para su control',
  emisor: 'SENER/CNSNS',
  anio: 2024,
  publicacionDof: '2024-05-24',
  entradaEnVigor: '60 días naturales después de su publicación en el DOF (Transitorio Primero)',
  sustituyeA: 'NOM-008-NUCL-2011, Control de la contaminación radiactiva (DOF 26-10-2011)',
  urlDof: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5728406&fecha=24/05/2024',
  urlPdf: 'https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-008-NUCL-2024.pdf',
  cita: 'NOM-008-NUCL-2024. Límites de contaminación radiactiva y criterios para su control. SENER/CNSNS. Diario Oficial de la Federación, 24 de mayo de 2024.',
  alcance:
    'Límites derivados de contaminación superficial y en aire y criterios de control en instalaciones radiactivas y nucleares. ' +
    'No fija límites de dosis ni objetivos de diseño de blindaje. Sustituye a la NOM-008-NUCL-2011.',
  /** Umbrales de clasificación de zonas (§3.11 y §3.12), idénticos a la edición 2011. */
  zonas: {
    radiacion_mSv_h: 0.05,
    radiacion_mSv_5dias: 1,
    altaRadiacion_mSv_h: 1,
  },
  /** Umbral de contaminación (§5.0) y límite beta-gamma del Apéndice A (Tabla A.1), en Bq/cm². */
  contaminacion: {
    umbralBetaGamma_Bq_cm2: 0.4,
    umbralAlfa_Bq_cm2: 0.04,
  },
} as const;
