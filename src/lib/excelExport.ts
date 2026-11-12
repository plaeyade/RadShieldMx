/**
 * ═══════════════════════════════════════════════════════════
 * Excel Export — Enhanced XLSX generation (E.1)
 * Generates multi-sheet Excel workbooks
 * ═══════════════════════════════════════════════════════════
 */

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
  columnWidths?: number[];
}

/**
 * Generate Excel XML (SpreadsheetML format)
 * No external dependencies — pure TypeScript
 */
export function generateExcelXML(workbook: { sheets: ExcelSheet[] }): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>`;

  const styles = `
<Styles>
  <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#7C3AED" ss:Pattern="Solid"/><Font ss:Color="FFFFFF"/></Style>
  <Style ss:ID="Number"><NumberFormat ss:Format="0.000"/></Style>
  <Style ss:ID="Bold"><Font ss:Bold="1"/></Style>
</Styles>`;

  let sheetsXml = "";
  for (const sheet of workbook.sheets) {
    const columnXml = sheet.headers
      .map((_, i) => `<Column ss:Index="${i + 1}" ss:Width="${sheet.columnWidths?.[i] || 15}"/>`)
      .join("");

    const headerRow = `<Row>${sheet.headers
      .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
      .join("")}</Row>`;

    const dataRows = sheet.rows
      .map(
        (row) =>
          `<Row>${row
            .map((cell) => {
              const type = typeof cell === "number" ? "Number" : "String";
              const style = typeof cell === "number" ? " ss:StyleID=\"Number\"" : "";
              return `<Cell${style}><Data ss:Type="${type}">${escapeXml(String(cell))}</Data></Cell>`;
            })
            .join("")}</Row>`
      )
      .join("");

    sheetsXml += `
<Worksheet ss:Name="${escapeXml(sheet.name)}">
  <Table>${columnXml}${headerRow}${dataRows}</Table>
</Worksheet>`;
  }

  return `${xmlHeader}
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${styles}
  ${sheetsXml}
</Workbook>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadExcel(filename: string, workbook: { sheets: ExcelSheet[] }): void {
  const xml = generateExcelXML(workbook);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate shielding report as multi-sheet Excel
 */
export function exportShieldingReport(data: {
  projectName: string;
  barriers: Array<{
    name: string;
    type: string;
    material: string;
    thickness: number;
    tvls: number;
    transmission: number;
    goalDose: number;
  }>;
  summary: {
    totalConcreteVolume: number;
    totalCost: number;
    maxDose: number;
    compliance: string;
  };
}): void {
  const workbook = {
    sheets: [
      {
        name: "Barreras",
        headers: ["Nombre", "Tipo", "Material", "Espesor (cm)", "TVLs", "Transmisión", "Meta (mSv/s)"],
        columnWidths: [20, 15, 15, 15, 10, 15, 15],
        rows: data.barriers.map((b) => [
          b.name,
          b.type,
          b.material,
          b.thickness,
          b.tvls,
          b.transmission,
          b.goalDose,
        ]),
      },
      {
        name: "Resumen",
        headers: ["Parámetro", "Valor"],
        columnWidths: [30, 20],
        rows: [
          ["Proyecto", data.projectName],
          ["Volumen concreto total (m³)", data.summary.totalConcreteVolume],
          ["Costo total estimado (USD)", data.summary.totalCost],
          ["Dosis máxima calculada (mSv/s)", data.summary.maxDose],
          ["Estado de cumplimiento", data.summary.compliance],
          ["Norma aplicada", "NCRP 151 (2005)"],
          ["Norma México", "NOM-040-NUCL-2016 / NOM-008-NUCL-2024"],
          ["Fecha", new Date().toLocaleDateString("es-MX")],
        ],
      },
    ],
  };

  downloadExcel(`RadShield_${data.projectName}_${new Date().toISOString().slice(0, 10)}`, workbook);
}
