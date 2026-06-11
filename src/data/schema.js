/**
 * BulkBuddy — Nasabah Data Schema
 *
 * Format: JSON (dipilih karena paling stabil untuk MCP tool-calls & LLM parsing)
 * Struktur mengikuti template CSV Bank Mandiri: datanasabah.csv
 *
 * Tiap kolom didefinisikan dengan:
 *   key       → JSON key (snake_case, MCP-friendly, no spaces/special chars)
 *   csvHeader → Header persis di CSV Mandiri (untuk mapping export)
 *   label     → Label UI bahasa Indonesia
 *   type      → "string" | "number" | "enum"
 *   source    → "ocr" (dari KTP/form) | "default" (pre-filled) | "user" (input manual)
 *   required  → wajib diisi
 *   width     → lebar kolom tabel UI (tailwind class)
 */

export const NASABAH_COLUMNS = [
  // ── Data Pribadi (OCR dari KTP / Form) ──
  { key: 'nama',          csvHeader: 'NAMA',                      label: 'Nama',            type: 'string', source: 'ocr',     required: true,  width: 'min-w-[180px]' },
  { key: 'gelar_sbl',     csvHeader: 'GELARSBL',                  label: 'Gelar Depan',     type: 'string', source: 'user',    required: false, width: 'min-w-[80px]' },
  { key: 'gelar_sdh',     csvHeader: 'GELARSDH',                  label: 'Gelar Belakang',  type: 'string', source: 'user',    required: false, width: 'min-w-[80px]' },
  { key: 'kelamin',       csvHeader: 'KELAMIN',                   label: 'Kelamin',         type: 'enum',   source: 'ocr',     required: true,  width: 'min-w-[70px]',  options: ['M', 'F'] },
  { key: 'tgl_lhr',       csvHeader: 'TGL_LHR',                   label: 'Tgl Lahir',       type: 'string', source: 'ocr',     required: true,  width: 'min-w-[100px]' },
  { key: 'kota_lhr',      csvHeader: 'KOTA_LHR',                  label: 'Kota Lahir',      type: 'string', source: 'ocr',     required: true,  width: 'min-w-[110px]' },
  { key: 'warga_negara',  csvHeader: 'WARGA NEGARA',              label: 'WN',              type: 'string', source: 'default', required: true,  width: 'min-w-[50px]',  defaultValue: 'ID' },
  { key: 'no_ktp',        csvHeader: 'NO KTP / PASSPORT',         label: 'No KTP',          type: 'string', source: 'ocr',     required: true,  width: 'min-w-[160px]' },
  { key: 'kota_ktp',      csvHeader: 'KOTA_KTP',                  label: 'Kota KTP',        type: 'string', source: 'ocr',     required: true,  width: 'min-w-[120px]' },
  { key: 'exp_ktp',       csvHeader: 'EXP_KTP/PASSPORT',          label: 'Exp KTP',         type: 'number', source: 'default', required: false, width: 'min-w-[70px]',  defaultValue: 0 },
  { key: 'jenis_id_tambahan', csvHeader: 'JENIS IDENTITAS TAMBAHAN', label: 'Jenis ID Lain', type: 'string', source: 'user',  required: false, width: 'min-w-[100px]' },
  { key: 'no_id_tambahan',    csvHeader: 'NO IDENTITAS TAMBAHAN',    label: 'No ID Lain',   type: 'string', source: 'user',    required: false, width: 'min-w-[120px]' },
  { key: 'ibu_kandung',   csvHeader: 'IBUKANDUNG',                label: 'Ibu Kandung',     type: 'string', source: 'ocr',     required: true,  width: 'min-w-[140px]' },
  { key: 'sts_kawin',     csvHeader: 'STS KAWIN',                 label: 'Status',          type: 'enum',   source: 'ocr',     required: false, width: 'min-w-[60px]',  options: ['B', 'S', 'D', ''] },

  // ── Alamat ──
  { key: 'alamat1',       csvHeader: 'ALAMAT1',                   label: 'Alamat 1',        type: 'string', source: 'ocr',     required: true,  width: 'min-w-[200px]' },
  { key: 'alamat2',       csvHeader: 'ALAMAT2',                   label: 'Alamat 2',        type: 'string', source: 'ocr',     required: false, width: 'min-w-[180px]' },
  { key: 'kodepos',       csvHeader: 'KODEPOS',                   label: 'Kodepos',         type: 'string', source: 'ocr',     required: true,  width: 'min-w-[80px]' },

  // ── Kontak ──
  { key: 'telp_rumah',    csvHeader: 'No Telp Rumah',             label: 'Telp Rumah',      type: 'string', source: 'user',    required: false, width: 'min-w-[120px]' },
  { key: 'handphone',     csvHeader: 'No. Handphone',             label: 'Handphone',       type: 'string', source: 'ocr',     required: true,  width: 'min-w-[130px]' },
  { key: 'email',         csvHeader: 'EMAIL',                     label: 'Email',           type: 'string', source: 'user',    required: false, width: 'min-w-[150px]' },

  // ── Pekerjaan ──
  { key: 'pekerjaan',     csvHeader: 'PEKERJAAN',                 label: 'Pekerjaan',       type: 'string', source: 'ocr',     required: false, width: 'min-w-[80px]' },
  { key: 'jabatan',       csvHeader: 'JABATAN',                   label: 'Jabatan',         type: 'string', source: 'user',    required: false, width: 'min-w-[80px]' },
  { key: 'employer_name', csvHeader: 'EMPLOYER NAME',             label: 'Perusahaan',      type: 'string', source: 'user',    required: false, width: 'min-w-[120px]' },
  { key: 'kode_industri', csvHeader: 'KODE_INDUSTRI',             label: 'Kd Industri',     type: 'number', source: 'user',    required: false, width: 'min-w-[80px]' },
  { key: 'tgl_mulai',     csvHeader: 'TGL_MULAI',                 label: 'Tgl Mulai',       type: 'string', source: 'user',    required: false, width: 'min-w-[90px]' },
  { key: 'gaji',          csvHeader: 'GAJI',                      label: 'Gaji',            type: 'number', source: 'user',    required: false, width: 'min-w-[100px]' },
  { key: 'pen_lain',      csvHeader: 'PEN_LAIN',                  label: 'Pend. Lain',      type: 'number', source: 'user',    required: false, width: 'min-w-[80px]' },

  // ── Data Bank (biasanya default / prefilled) ──
  { key: 'cif_no',        csvHeader: 'CIF_NO',                    label: 'CIF No',          type: 'number', source: 'default', required: false, width: 'min-w-[70px]',  defaultValue: 0 },
  { key: 'currency',      csvHeader: 'CURRENCY',                  label: 'Currency',        type: 'string', source: 'default', required: true,  width: 'min-w-[70px]',  defaultValue: 'IDR' },
  { key: 'produk',        csvHeader: 'PRODUK',                    label: 'Produk',          type: 'string', source: 'default', required: true,  width: 'min-w-[110px]', defaultValue: 'TABMANDIRI' },
  { key: 'biaya_admin',   csvHeader: 'BIAYA ADMIN KHUSUS',        label: 'Biaya Admin',     type: 'string', source: 'default', required: false, width: 'min-w-[90px]' },
  { key: 'tujuan_buka',   csvHeader: 'TUJUAN BUKA REKENING',      label: 'Tujuan',          type: 'string', source: 'default', required: false, width: 'min-w-[70px]',  defaultValue: 'A' },
  { key: 'kode_cabang',   csvHeader: 'KODE CABANG',               label: 'Kd Cabang',       type: 'number', source: 'default', required: true,  width: 'min-w-[80px]',  defaultValue: 12000 },
  { key: 'bansos_type',   csvHeader: 'BANSOS TYPE',               label: 'Bansos',          type: 'string', source: 'default', required: false, width: 'min-w-[70px]' },
  { key: 'consent',       csvHeader: 'CONSENT',                   label: 'Consent',         type: 'string', source: 'default', required: true,  width: 'min-w-[70px]',  defaultValue: 'YYYY' },
]

/**
 * Columns visible by default in the spreadsheet UI (most important for review)
 * The rest are accessible via horizontal scroll
 */
export const PRIMARY_COLUMNS = [
  'nama', 'kelamin', 'tgl_lhr', 'no_ktp', 'ibu_kandung', 'handphone', 'alamat1', 'kodepos',
]

/**
 * Create an empty nasabah row with defaults pre-filled
 */
export function createEmptyNasabah(id) {
  const row = { id }
  for (const col of NASABAH_COLUMNS) {
    row[col.key] = col.defaultValue !== undefined ? col.defaultValue : ''
  }
  return row
}

/**
 * Convert a nasabah JSON row → CSV header-keyed object (for Sheets MCP export)
 * This is what gets sent to MCP google-sheets tool
 */
export function toSheetRow(nasabah) {
  const row = {}
  for (const col of NASABAH_COLUMNS) {
    row[col.csvHeader] = nasabah[col.key] ?? ''
  }
  return row
}

/**
 * Convert array of nasabah objects → MCP-ready JSON payload
 * Format: { rows: [...], metadata: {...} }
 */
export function toMCPPayload(nasabahList) {
  return {
    rows: nasabahList.map(toSheetRow),
    metadata: {
      total: nasabahList.length,
      timestamp: new Date().toISOString(),
      source: 'BulkBuddy OCR',
      columns: NASABAH_COLUMNS.map(c => c.csvHeader),
    },
  }
}
