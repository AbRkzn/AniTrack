export interface XlsxSheet {
  name: string;
  columns: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

type ZipEntry = { name: string; data: Uint8Array };

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, 0x21, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    const localBytes = new Uint8Array(local.buffer);
    localChunks.push(localBytes, nameBytes, entry.data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, 0, true);
    central.setUint16(14, 0x21, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, size, true);
    central.setUint32(24, size, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);
    centralChunks.push(new Uint8Array(central.buffer), nameBytes);

    offset += localBytes.length + nameBytes.length + size;
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const localSize = localChunks.reduce((sum, chunk) => sum + chunk.length, 0);

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, localSize, true);
  eocd.setUint16(20, 0, true);

  const output = new Uint8Array(localSize + centralSize + 22);
  let pos = 0;
  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(new Uint8Array(eocd.buffer), pos);
  return output;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colName(index: number): string {
  let col = '';
  let n = index;
  do {
    col = String.fromCharCode(65 + (n % 26)) + col;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return col;
}

function cellRef(col: number, row: number): string {
  return `${colName(col)}${row}`;
}

function buildWorksheetXml(sheet: XlsxSheet): string {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<sheetData>',
  ];

  const headerRow = sheet.columns.map((col, colIdx) => {
    const text = escapeXml(String(col));
    return `<c r="${cellRef(colIdx, 1)}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
  });
  parts.push(`<row r="1">${headerRow.join('')}</row>`);

  sheet.rows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2;
    const cells: string[] = [];
    row.forEach((value, colIdx) => {
      const ref = cellRef(colIdx, rowNum);
      if (value === null || value === undefined || value === '') return;
      if (typeof value === 'number' && isFinite(value)) {
        cells.push(`<c r="${ref}"><v>${value}</v></c>`);
      } else if (typeof value === 'boolean') {
        cells.push(`<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`);
      } else {
        cells.push(`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`);
      }
    });
    if (cells.length > 0) {
      parts.push(`<row r="${rowNum}">${cells.join('')}</row>`);
    }
  });

  parts.push('</sheetData>', '</worksheet>');
  return parts.join('');
}

const STYLES_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
  '</styleSheet>',
].join('');

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\[\]:*?/\\]/g, '_').slice(0, 31);
  return cleaned || 'Sheet';
}

export function createWorkbookBytes(sheets: XlsxSheet[]): Uint8Array {
  const encoder = new TextEncoder();
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const sheetNames = new Set<string>();
  const sheetParts = sheets.map((sheet, index) => {
    let name = sanitizeSheetName(sheet.name);
    while (sheetNames.has(name)) {
      name = `${name.slice(0, 28)}_${index}`;
    }
    sheetNames.add(name);
    return { name, file: `xl/worksheets/sheet${index + 1}.xml` };
  });

  const contentTypes = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    ...sheetParts.map(
      (part, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    ),
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '</Types>',
  ].join('');

  const rootRels = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>',
  ].join('');

  const workbookXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<sheets>',
    ...sheetParts.map(
      (part, index) => `<sheet name="${escapeXml(part.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    ),
    '</sheets>',
    '</workbook>',
  ].join('');

  const workbookRels = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    ...sheetParts.map(
      (part, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="${part.file}"/>`
    ),
    `<Relationship Id="rId${sheetParts.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    '</Relationships>',
  ].join('');

  const coreXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    '<dc:creator>AniTrack</dc:creator>',
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>`,
    '</cp:coreProperties>',
  ].join('');

  const appXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>AniTrack</Application>',
    `<TitlesOfParts><vt:vector size="${sheetParts.length}" baseType="lpstr">${sheetParts
      .map((part) => `<vt:lpstr>${escapeXml(part.name)}</vt:lpstr>`)
      .join('')}</vt:vector></TitlesOfParts>`,
    '</Properties>',
  ].join('');

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: encoder.encode(contentTypes) },
    { name: '_rels/.rels', data: encoder.encode(rootRels) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRels) },
    { name: 'xl/styles.xml', data: encoder.encode(STYLES_XML) },
    { name: 'docProps/core.xml', data: encoder.encode(coreXml) },
    { name: 'docProps/app.xml', data: encoder.encode(appXml) },
    ...sheetParts.map((part, index) => ({
      name: part.file,
      data: encoder.encode(buildWorksheetXml(sheets[index])),
    })),
  ];

  return buildZip(entries);
}
