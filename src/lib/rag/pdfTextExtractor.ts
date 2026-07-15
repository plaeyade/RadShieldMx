export interface ExtractedPdfText {
  text: string;
  pages: number;
  method: 'pdfjs';
}

export async function extractPdfText(file: File): Promise<ExtractedPdfText> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) pageTexts.push(`[page ${pageNumber}]\n${text}`);
  }

  return {
    text: pageTexts.join('\n\n'),
    pages: pdf.numPages,
    method: 'pdfjs',
  };
}
