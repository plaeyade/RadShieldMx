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

/**
 * Ficha única de la NOM-040-NUCL-2016 (medicina nuclear). Antes se citaba como «NOM-040-NUCL» sin año y, en varios
 * diálogos, con el título equivocado «Instalaciones de radioterapia»: la norma es EXCLUSIVA de medicina nuclear (§2)
 * y no aplica a búnkeres de linac, Co-60, Gamma Knife ni HDR.
 *
 * NOM-040-NUCL-2016, «Requisitos de seguridad radiológica para la práctica de medicina nuclear» (SENER/CNSNS),
 * DOF 04-08-2016; entra en vigor 60 días naturales después de su publicación (§14). Vigente según el catálogo
 * PLATIICA (Secretaría de Economía), con revisión sistemática del 20-08-2026 con resultado «Modificación» (todavía sin
 * proyecto publicado). La NOM-042-NUCL-2026 (DOF 15-07-2026) trata de seguridad física en el transporte de material
 * radiactivo y no la sustituye.
 *
 * No fija objetivos de diseño de blindaje: §5.2.1 exige que la memoria analítica (§4.8) demuestre que el POE no rebasa
 * el límite anual del RGSR y §5.3.5.1 que fuera del área de cada paciente en la sala de espera no se rebase el límite de
 * público del RGSR. Los objetivos 0.1/0.02 mSv/semana de RadShield (NCRP 147/151, TG-108; limitesDosis.ts) son más
 * restrictivos y cumplen ambos requisitos.
 */
export const NOM_040_NUCL = {
  clave: 'NOM-040-NUCL-2016',
  titulo: 'Requisitos de seguridad radiológica para la práctica de medicina nuclear',
  emisor: 'SENER/CNSNS',
  anio: 2016,
  publicacionDof: '2016-08-04',
  entradaEnVigor: '60 días naturales después de su publicación en el DOF (§14)',
  sustituyeA: null,
  urlDof: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5446807&fecha=04/08/2016',
  urlPdf: 'https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/040nucl2016.pdf',
  /** Ficha de la fuente oficial en el repo (el PDF no se versiona: los .pdf van por Git LFS). */
  fichaFuente: 'docs/normas/README.md',
  cita: 'NOM-040-NUCL-2016. Requisitos de seguridad radiológica para la práctica de medicina nuclear. SENER/CNSNS. Diario Oficial de la Federación, 4 de agosto de 2016.',
  alcance:
    'Requisitos de la instalación de medicina nuclear (zona controlada, cuarto caliente, almacenes de material y de desechos, ' +
    'descontaminación, sala de espera y sanitario exclusivos, cuarto de hospitalización), equipo de detección, personal y ' +
    'registros. Exclusiva de medicina nuclear (§2): no aplica a radioterapia. No fija objetivos de diseño de blindaje.',
  /** Requisitos de diseño/blindaje que el diseñador de la instalación debe reflejar en planos y memoria analítica. */
  requisitosDiseno: [
    { seccion: '§5.1', texto: 'Zona controlada con, cuando aplique: cuarto caliente (apertura de bultos y preparación), almacén de material radiactivo, almacén de desechos y objetos contaminados, área de descontaminación, área de administración, sala de espera y sanitario exclusivos para pacientes inyectados, sala de estudios (incluye su área de control) y cuarto de hospitalización.' },
    { seccion: '§5.2.1', texto: 'Diseño, construcción y ubicación de las áreas: el POE no debe rebasar el límite anual del RGSR, demostrado con la memoria analítica (§4.8: cálculos de blindaje de las zonas controladas).' },
    { seccion: '§5.2.2–5.2.7', texto: 'Paredes lisas con pintura lavable no porosa, pisos lisos impermeables sin juntas, curva sanitaria sellada, monitor de contaminación a la salida de la zona controlada, mobiliario mínimo y descontaminable.' },
    { seccion: '§5.2.8', texto: 'Señalización de accesos: nombre del área, símbolo de radiación (NOM-026-STPS-2008) y «PELIGRO - ZONA CONTROLADA - MATERIAL RADIACTIVO – PROHIBIDO EL PASO A TODA PERSONA NO AUTORIZADA»; en sala de espera y cuarto de hospitalización, «ZONA CONTROLADA - PARA USO EXCLUSIVO DE PACIENTES A QUIENES SE LES HA ADMINISTRADO MATERIAL RADIACTIVO».' },
    { seccion: '§5.3.1', texto: 'Cuarto caliente: puerta que abre desde dentro sin llave, superficie de trabajo que soporte el blindaje, lavamanos sin contacto, celda caliente o recinto blindado autorizado y campana de extracción si hay volátiles (Xe-133, I-131).' },
    { seccion: '§5.3.2', texto: 'Almacenes de material y de desechos: puerta que abre desde dentro sin llave y paso al área de preparación por puerta o ventana de transferencia; si están en el cuarto caliente, área exclusiva con separación física entre material sin usar y desechos.' },
    { seccion: '§5.3.3–5.3.6', texto: 'Descontaminación (regadera de emergencia) adyacente a preparación; administración adyacente a preparación o almacén; sala de espera con un área por paciente o mamparas que mantengan fuera de cada área el límite de público del RGSR, adjunta a la sala de estudios.' },
    { seccion: '§5.3.7', texto: 'Cuarto de hospitalización (p. ej. I-131): un área por paciente o mamparas, baño completo exclusivo con apertura sin contacto, y prohibido usar cuartos externos a la instalación de medicina nuclear.' },
    { seccion: '§6.1.1', texto: 'Monitoreo: detector de área permanente en el exterior de la puerta del almacén, detector portátil, detector de contaminación y, con pacientes hospitalizados, detector de área con alarma en la puerta del cuarto de hospitalización (NOM-012-NUCL-2002).' },
    { seccion: '§8.2.1 / §8.3', texto: 'El material que entra a la zona controlada no transita por zonas no controladas (condiciona la circulación del proyecto); desechos según NOM-028-NUCL-2009.' },
  ],
  /**
   * Recintos y equipos que las plantillas y checklists de medicina nuclear deben listar (con su numeral). Antes las
   * plantillas no tenían almacén de desechos, descontaminación con regadera, sanitario de pacientes inyectados ni cuarto
   * de hospitalización, y nada pedía el detector con alarma. `cuandoAplica` = sólo si la instalación lo requiere.
   */
  recintos: [
    { id: 'almacen-desechos', nombre: 'Almacén de desechos radiactivos y objetos contaminados', numeral: '§5.1.3 / §5.3.2', cuandoAplica: null },
    { id: 'descontaminacion', nombre: 'Área de descontaminación personal con regadera de emergencia, adyacente a preparación', numeral: '§5.1.4 / §5.3.3', cuandoAplica: null },
    { id: 'sanitario-inyectados', nombre: 'Sanitario exclusivo para pacientes inyectados', numeral: '§5.1.8', cuandoAplica: null },
    { id: 'hospitalizacion-i131', nombre: 'Cuarto de hospitalización (p. ej. I-131) con baño exclusivo', numeral: '§5.1.9 / §5.3.7', cuandoAplica: 'pacientes que no cumplan el criterio de egreso de la NOM-013-NUCL-2009 (p. ej. terapia con I-131)' },
    { id: 'detector-alarma', nombre: 'Detector de área con alarma en la puerta del cuarto de hospitalización (y detector de área fijo en la puerta del almacén)', numeral: '§6.1.1.1 / §6.1.1.4', cuandoAplica: 'con pacientes hospitalizados (§6.1.1.4); el del almacén siempre (§6.1.1.1)' },
  ],
} as const;

export type RecintoNom040 = (typeof NOM_040_NUCL.recintos)[number];

/**
 * Ficha única de la NOM-013-NUCL-2009. Antes se citaba como «NOM-013-NUCL-2013» (edición inexistente) y como norma de
 * transporte; en la memoria Word aparecía además una «NOM-041-NUCL-2013» para la liberación de pacientes. La NOM-040
 * §5.1.9 remite a esta norma («o la que la sustituya»).
 *
 * NOM-013-NUCL-2009, «Requerimientos de seguridad radiológica para egresar a pacientes a quienes se les ha administrado
 * material radiactivo» (SENER/CNSNS), DOF 20-10-2009, en vigor el 20-12-2009. Vigente según PLATIICA (Secretaría de
 * Economía); revisión sistemática del 06-12-2024 con resultado «Modificación», sin norma sustituta publicada.
 */
export const NOM_013_NUCL = {
  clave: 'NOM-013-NUCL-2009',
  titulo: 'Requerimientos de seguridad radiológica para egresar a pacientes a quienes se les ha administrado material radiactivo',
  emisor: 'SENER/CNSNS',
  anio: 2009,
  publicacionDof: '2009-10-20',
  entradaEnVigor: '2009-12-20',
  urlDof: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5114948&fecha=20/10/2009',
  urlPdf: 'https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/013nucl2009.pdf',
  cita: 'NOM-013-NUCL-2009. Requerimientos de seguridad radiológica para egresar a pacientes a quienes se les ha administrado material radiactivo. SENER/CNSNS. Diario Oficial de la Federación, 20 de octubre de 2009.',
  alcance: 'Criterios para el egreso de pacientes con material radiactivo administrado (medicina nuclear). No regula transporte ni blindaje.',
} as const;

/**
 * Ficha única de la NOM-033-NUCL-2016, la norma mexicana vigente de radioterapia con aceleradores lineales. Sustituye a la
 * NOM-040-NUCL-2016 en los reportes de búnker de linac (la NOM-040 es exclusiva de medicina nuclear).
 *
 * NOM-033-NUCL-2016, «Especificaciones técnicas para la operación de unidades de teleterapia: aceleradores lineales»
 * (SENER/CNSNS), DOF 04-08-2016, en vigor el 03-10-2016; sustituye a la NOM-033-NUCL-1999. Vigente según PLATIICA;
 * revisión sistemática del 18-08-2026 con resultado «Confirmación». Alcance (§2): sólo aceleradores lineales de uso médico
 * (no Co-60, Gamma Knife ni HDR). Regula operación, verificaciones y mantenimiento: NO fija blindajes ni objetivos de
 * diseño (los límites de dosis siguen siendo los del RGSR; el cálculo, NCRP 151).
 */
export const NOM_033_NUCL = {
  clave: 'NOM-033-NUCL-2016',
  titulo: 'Especificaciones técnicas para la operación de unidades de teleterapia: aceleradores lineales',
  emisor: 'SENER/CNSNS',
  anio: 2016,
  publicacionDof: '2016-08-04',
  entradaEnVigor: '2016-10-03',
  sustituyeA: 'NOM-033-NUCL-1999 (DOF 05-07-1999)',
  urlDof: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5446806&fecha=04/08/2016',
  urlPdf: 'https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/033nucl2016.pdf',
  cita: 'NOM-033-NUCL-2016. Especificaciones técnicas para la operación de unidades de teleterapia: aceleradores lineales. SENER/CNSNS. Diario Oficial de la Federación, 4 de agosto de 2016.',
  alcance: 'Operación, pruebas de aceptación, verificaciones y mantenimiento de aceleradores lineales médicos. No fija blindajes ni objetivos de diseño.',
  /** Requisitos de instalación que sí tocan al búnker. */
  requisitosInstalacion: [
    { seccion: '§5.2', texto: 'Paros de emergencia y dispositivos de seguridad verificados cada seis meses.' },
    { seccion: '§5.3', texto: 'Detector de neutrones en instalaciones con aceleradores de 10 MeV o más.' },
    { seccion: 'Apéndice A (A7, A12)', texto: 'Verificación diaria del interruptor de seguridad de la puerta de la sala de tratamiento y de los monitores de área.' },
  ],
} as const;

/** Rótulo del RGSR, la base de límites de dosis en México (véase limitesDosis.ts). */
export const RGSR_1988 = 'RGSR (1988)';

type ModalidadNormas = { id?: string; category?: string } | null | undefined;

/**
 * Normas mexicanas que corresponden a las modalidades del proyecto, para que los reportes no citen la NOM-040 en un
 * búnker de linac ni la NOM-033 en medicina nuclear. Siempre: RGSR y NOM-008-NUCL-2024. Medicina nuclear: NOM-040 y
 * NOM-013. Aceleradores lineales: NOM-033.
 */
export function normasMxAplicables(modalidades: ReadonlyArray<ModalidadNormas>): string[] {
  const normas: string[] = [RGSR_1988, NOM_008_NUCL.clave];
  const hayMN = modalidades.some((m) => m?.category === 'nuclear');
  const hayLinac = modalidades.some((m) => /^linac/i.test(m?.id ?? ''));
  if (hayLinac) normas.push(NOM_033_NUCL.clave);
  if (hayMN) normas.push(NOM_040_NUCL.clave, NOM_013_NUCL.clave);
  return normas;
}

const CITAS_MX: Record<string, string> = {
  [RGSR_1988]: 'Reglamento General de Seguridad Radiológica (RGSR), SENER, 1988 (límites de dosis).',
  [NOM_008_NUCL.clave]: NOM_008_NUCL.cita,
  [NOM_033_NUCL.clave]: NOM_033_NUCL.cita,
  [NOM_040_NUCL.clave]: NOM_040_NUCL.cita,
  [NOM_013_NUCL.clave]: NOM_013_NUCL.cita,
};

/** Las referencias completas de `normasMxAplicables`, para listas de bibliografía de los reportes. */
export function citasMxAplicables(modalidades: ReadonlyArray<ModalidadNormas>): string[] {
  return normasMxAplicables(modalidades).map((clave) => CITAS_MX[clave] ?? clave);
}
