/**
 * inputSanitization.ts — Seguridad: Sanitización de inputs CSV/DXF
 * Previene XSS e inyección de código en archivos importados.
 * NOM-037-SECT-2023, OWASP Top 10 (2021): A03 — Injection
 */

/** Sanitiza strings de archivos importados */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < > (XSS vectors)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick=, etc.)
    .trim();
}

/** Valida que un CSV de transmisión tenga el formato correcto */
export function validateTransmissionCSV(lines: string[]): { valid: boolean; errors: string[]; data: Array<{ thickness_mm: number; transmission: number }> } {
  const errors: string[] = [];
  const data: Array<{ thickness_mm: number; transmission: number }> = [];

  if (lines.length < 2) {
    errors.push('CSV must have at least header + 1 data row');
    return { valid: false, errors, data };
  }

  const header = lines[0].toLowerCase().trim();
  if (!header.includes('thickness') || !header.includes('transmission')) {
    errors.push('Header must contain "thickness" and "transmission" columns');
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => sanitizeString(s).trim());
    if (cols.length < 2) continue;

    const thickness = parseFloat(cols[0]);
    const transmission = parseFloat(cols[1]);

    if (isNaN(thickness) || thickness < 0 || thickness > 10000) {
      errors.push(`Row ${i}: Invalid thickness "${cols[0]}"`);
      continue;
    }
    if (isNaN(transmission) || transmission < 0 || transmission > 1) {
      errors.push(`Row ${i}: Invalid transmission "${cols[1]}" (must be 0-1)`);
      continue;
    }

    data.push({ thickness_mm: thickness, transmission });
  }

  return { valid: errors.length === 0, errors, data };
}

/** Valida nombre de archivo (no path traversal) */
export function validateFilename(filename: string): { valid: boolean; sanitized: string } {
  const sanitized = filename
    .replace(/[.]{2,}/g, '.') // Remove path traversal (../)
    .replace(/[\\/<>:"|?*\x00-\x1F]/g, '_') // Remove invalid chars
    .replace(/^\.+/, '') // Remove leading dots
    .trim();

  return {
    valid: sanitized.length > 0 && sanitized.length < 255,
    sanitized,
  };
}

/** Verifica integridad del módulo WASM */
export async function verifyWASMIntegrity(response: Response, expectedHash?: string): Promise<boolean> {
  if (!expectedHash) return true; // No hash to verify against

  try {
    const buffer = await response.clone().arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === expectedHash;
  } catch {
    return false;
  }
}

/** Sanitiza objeto floorplan importado */
export function sanitizeFloorPlan(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeFloorPlan);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Only allow known keys
    const allowedKeys = ['name', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height',
      'scale_m_per_pixel', 'barriers', 'sources', 'imageUrl', 'controlPoints',
      'id', 'barrierType', 'materialCode', 'designGoal_mSv_per_wk',
      'occupancyFactor', 'useFactor', 'modality', 'workloadValue', 'workloadUnit',
      'workloadHoursPerWeek', 'isocenterHeight_m', 'ctDLP_mGy_cm',
      'ctScansPerPatient', 'nuclearActivity_GBq', 'description'];

    if (!allowedKeys.includes(key)) continue;

    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      result[key] = isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      result[key] = value;
    } else if (typeof value === 'object') {
      result[key] = sanitizeFloorPlan(value);
    }
  }
  return result;
}
