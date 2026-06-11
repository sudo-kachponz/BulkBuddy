// Mock data for simulated OCR results
export const MOCK_NASABAH = [
  { id: 1, nik: '3578012345670001', nama: 'Ahmad Fauzan Hidayat', telepon: '081234567890', ibuKandung: 'Siti Aminah', confidence: 98 },
  { id: 2, nik: '3578012345670002', nama: 'Siti Nurhaliza Putri', telepon: '081345678901', ibuKandung: 'Ratna Dewi', confidence: 95 },
  { id: 3, nik: '357801234567????', nama: 'Budi Santoso', telepon: '08527??????', ibuKandung: 'Murni Astuti', confidence: 62 },
  { id: 4, nik: '3578012345670004', nama: 'Dewi Lestari Anggraini', telepon: '087812345678', ibuKandung: 'Kartini Wulan', confidence: 97 },
  { id: 5, nik: '3578012345670005', nama: 'Reza Mahendra Pratama', telepon: '089923456789', ibuKandung: 'Endang Sari', confidence: 71 },
]

// Quick action suggestions
export const QUICK_ACTIONS = [
  { id: 'input', label: 'Input Nasabah Baru', emoji: '🆕', message: 'Saya ingin input data nasabah baru dari form fisik.' },
  { id: 'delete', label: 'Hapus Data Nasabah', emoji: '🗑️', message: 'Saya ingin menghapus data nasabah.' },
  { id: 'status', label: 'Cek Status Batch', emoji: '📋', message: 'Tolong cek status batch input terakhir.' },
]

// Chat history mock
export const MOCK_HISTORY = [
  { id: 'c1', title: 'Batch Input 10 Juni', preview: '5 nasabah diproses', time: 'Kemarin' },
  { id: 'c2', title: 'Koreksi NIK Nasabah', preview: 'NIK diperbaiki', time: '2 hari lalu' },
  { id: 'c3', title: 'Batch Kompensasi BRI', preview: '12 form diinput', time: '5 hari lalu' },
]
