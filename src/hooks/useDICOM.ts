// Batch 5: DICOM import — real metadata extraction (kVp, mAs, exposure, pixel spacing)
// Parses DICOM tags from raw ArrayBuffer without external libraries

export interface DICOMMetadata {
  patientName?: string;
  studyDate?: string;
  modality?: string;
  institution?: string;
  kVp?: number;
  mAs?: number;
  exposureTime_ms?: number;
  distanceSourceToDetector_mm?: number;
  gantryAngle_deg?: number;
  sliceThickness_mm?: number;
  dataCollectionDiameter_mm?: number;
  pixelSpacing?: [number, number];
  imageDimensions?: [number, number];
  sliceLocation?: number;
  seriesDescription?: string;
  bodyPart?: string;
}

function readString(dv: DataView, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const c = dv.getUint8(offset + i);
    if (c !== 0) s += String.fromCharCode(c);
  }
  return s.trim();
}

function readVRValue(dv: DataView, offset: number, vr: string, length: number): string | number {
  if (vr === 'US' || vr === 'SS' || vr === 'OW') {
    return dv.getUint16(offset, true);
  }
  if (vr === 'UL' || vr === 'SL') {
    return dv.getUint32(offset, true);
  }
  if (vr === 'FL') {
    return dv.getFloat32(offset, true);
  }
  if (vr === 'FD') {
    return dv.getFloat64(offset, true);
  }
  return readString(dv, offset, length);
}

function parseDS(value: string): number | undefined {
  const v = value.replace(/\\/g, '').trim();
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function parseIS(value: string): number | undefined {
  const v = value.trim();
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}

export function parseDICOMFile(file: File): Promise<DICOMMetadata | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer || buffer.byteLength < 132) { resolve(null); return; }
      const preamble = new Uint8Array(buffer, 128, 4);
      const isDICOM = preamble[0] === 68 && preamble[1] === 73 && preamble[2] === 67 && preamble[3] === 77;
      if (!isDICOM) { resolve(null); return; }

      const dv = new DataView(buffer);
      const metadata: DICOMMetadata = {};
      let offset = 132;
      const endOffset = Math.min(buffer.byteLength, 32768); // scan first 32KB

      try {
        while (offset < endOffset - 8) {
          const group = dv.getUint16(offset, true);
          const element = dv.getUint16(offset + 2, true);
          const vrChar1 = dv.getUint8(offset + 4);
          const vrChar2 = dv.getUint8(offset + 5);
          const vr = String.fromCharCode(vrChar1, vrChar2);

          let valueLength: number;
          let valueOffset: number;
          const isExplicitVR = 'AE|AS|AT|CS|DA|DS|DT|FL|FD|IS|LO|LT|OB|OD|OF|OW|PN|SH|SL|SQ|SS|ST|TM|UC|UI|UL|UN|UR|US|UT'.includes(vr);

          if (isExplicitVR) {
            if (vr === 'OB' || vr === 'OW' || vr === 'SQ' || vr === 'UN' || vr === 'UC' || vr === 'UR' || vr === 'UT') {
              valueLength = dv.getUint32(offset + 8, true);
              valueOffset = offset + 12;
            } else {
              valueLength = dv.getUint16(offset + 6, true);
              valueOffset = offset + 8;
            }
          } else {
            // Implicit VR
            valueLength = dv.getUint32(offset + 4, true);
            valueOffset = offset + 8;
          }

          if (valueLength === 0xFFFFFFFF) { // undefined length (sequences) — skip
            offset += 12;
            continue;
          }

          const rawValue = readVRValue(dv, valueOffset, vr, valueLength);
          const strValue = typeof rawValue === 'string' ? rawValue : String(rawValue);

          // Extract relevant tags
          if (group === 0x0008 && element === 0x0060) metadata.modality = strValue.slice(0, 4); // CS
          if (group === 0x0010 && element === 0x0010) metadata.patientName = strValue.slice(0, 64); // PN
          if (group === 0x0018 && element === 0x0060) metadata.kVp = parseDS(strValue); // DS
          if (group === 0x0018 && element === 0x1151) metadata.mAs = parseIS(strValue); // IS
          if (group === 0x0018 && element === 0x1150) metadata.exposureTime_ms = parseDS(strValue); // DS
          if (group === 0x0018 && element === 0x1110) metadata.distanceSourceToDetector_mm = parseDS(strValue); // DS
          if (group === 0x0018 && element === 0x1120) metadata.gantryAngle_deg = parseDS(strValue); // DS
          if (group === 0x0018 && element === 0x0050) metadata.sliceThickness_mm = parseDS(strValue); // DS
          if (group === 0x0018 && element === 0x0090) metadata.dataCollectionDiameter_mm = parseDS(strValue); // DS
          if (group === 0x0020 && element === 0x1041) metadata.sliceLocation = parseDS(strValue); // DS
          if (group === 0x0008 && element === 0x1030) metadata.seriesDescription = strValue.slice(0, 64); // LO
          if (group === 0x0018 && element === 0x0015) metadata.bodyPart = strValue.slice(0, 16); // CS
          if (group === 0x0028 && element === 0x0030) {
            const parts = strValue.split('\\').map(parseDS).filter((v): v is number => v !== undefined);
            if (parts.length >= 2) metadata.pixelSpacing = [parts[0], parts[1]];
          }
          if (group === 0x0028 && element === 0x0010) {
            const rows = parseIS(strValue);
            if (rows !== undefined) metadata.imageDimensions = [rows, metadata.imageDimensions?.[1] || 0];
          }
          if (group === 0x0028 && element === 0x0011) {
            const cols = parseIS(strValue);
            if (cols !== undefined) metadata.imageDimensions = [metadata.imageDimensions?.[0] || 0, cols];
          }

          offset = valueOffset + valueLength;
          if (offset % 2 !== 0) offset++; // padding to even
        }
      } catch (err) {
        // If parsing fails mid-way, return whatever we extracted
      }

      resolve(metadata);
    };
    reader.readAsArrayBuffer(file);
  });
}
