# 🏦 BulkBuddy

**BulkBuddy** adalah aplikasi pintar berbasis AI (Artificial Intelligence) untuk mengotomatisasi alur kerja Pembukaan Rekening Kolektif (Bulk Account Opening) di Bank Mandiri. Aplikasi ini dirancang khusus untuk mempermudah tim Cash & Trade Operations (CTO) dalam memproses formulir pendaftaran fisik secara instan.

Dengan mengombinasikan kemampuan **Gemini-OCR** (Optical Character Recognition) dan teknologi **MCP (Model Context Protocol)**, BulkBuddy dapat mengekstrak data dari KTP/Formulir secara akurat, lalu menyimpannya langsung ke Google Sheets, membuat laporan dalam format PDF/Excel, dan secara otomatis mengirimkan email rekapitulasi langsung kepada CTO.

## 🚀 Fitur Utama

- **🧠 Smart OCR Extraction**: Ekstraksi KTP dan Formulir Fisik menjadi format JSON terstruktur dengan tingkat akurasi tinggi menggunakan model Anthropic Claude / Gemini.
- **📊 Integrasi Google Sheets**: Secara otomatis membuat _spreadsheet_ baru atau menambahkan baris data _(append)_ ke _spreadsheet_ eksisting melalui Agen MCP.
- **📧 Laporan Otomatis (Gmail MCP)**: Generator otomatis yang membuat rangkuman PDF dan Excel (.xlsx) untuk kemudian dikirimkan sebagai lampiran email secara langsung kepada atasan (CTO).
- **💬 Chat History Persistence**: Riwayat percakapan yang aman dan tersinkronisasi di _backend_ menggunakan **Supabase**, memungkinkan agen LLM untuk mengingat konteks dari diskusi atau _spreadsheet_ sebelumnya.
- **🎨 UI Interaktif**: Tampilan antarmuka _chatbot_ dinamis yang dibangun dengan React + Tailwind CSS, lengkap dengan fitur presentasi panduan (Interactive Tutorial) untuk pengguna baru.

---

## 🛠️ Stack Teknologi

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Uuid
- **Backend**: Python (FastAPI), LangGraph, LangChain MCP Adapters
- **Database**: PostgreSQL (via Supabase)

---

## ⚙️ Tutorial Setup & Instalasi

Ikuti langkah-langkah di bawah ini untuk menjalankan BulkBuddy di _environment_ lokal.

### 1. Prerequisites (Persiapan)
Pastikan kamu sudah menginstal:
- **Node.js** (v18 atau lebih baru)
- **Python** (v3.10 atau lebih baru)
- Akun **Supabase** (untuk database)
- Google Cloud Console API Keys (untuk Gmail SMTP & Service Account Sheets)

### 2. Setup Database (Supabase)
1. Buat _project_ baru di Supabase.
2. Dapatkan `SUPABASE_URL` dan `SUPABASE_KEY` dari dashboard.
3. Buka **SQL Editor** di Supabase Dashboard.
4. _Copy_ semua kode SQL dari file `backend/migration_chat_sessions.sql` dan jalankan *(Run)*. Ini akan membuat tabel `chat_sessions` untuk fitur _chat history_.

### 3. Setup Backend (FastAPI + LangGraph)
Masuk ke direktori `backend` dan jalankan instalasi Python _dependencies_:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Untuk Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Konfigurasi Environment Variable:**
Buat file `.env` di _root_ project (atau di dalam direktori `backend/`), lalu isi dengan kredensial berikut:

```ini
# Supabase
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_KEY="eyJh..."

# LLM API Keys (Bisa salah satu atau lebih)
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="AIza..."

# SMTP Configuration (untuk pengiriman Email PDF/Excel)
SMTP_USERNAME="email_anda@gmail.com"
SMTP_PASSWORD="app_password_anda"
```

**Jalankan Server Backend:**
```bash
uvicorn main:app --reload --port 8000
```
Server _backend_ akan aktif pada `http://localhost:8000`.

### 4. Setup Frontend (React + Vite)
Buka terminal baru, pastikan kamu berada di direktori _root_ proyek, lalu instal _dependencies_ Node.js:

```bash
npm install
```

**Jalankan Server Frontend:**
```bash
npm run dev
```
Aplikasi akan langsung dapat diakses melalui browser pada alamat yang diberikan Vite (biasanya `http://localhost:5173`).

---

## 💡 Cara Penggunaan Flow OCR:
1. Mulai percakapan baru dengan mengklik **"Chat Baru"** di _Sidebar_ sebelah kiri.
2. Klik ikon kamera/klip kertas untuk mengunggah satu atau beberapa foto/PDF berisi form atau KTP nasabah.
3. Tunggu agen AI mengekstrak dan menampilkan *Data Card* KTP secara interaktif di layar.
4. Klik tombol **"✨ Buat Sheet Baru"** untuk menyimpannya ke Google Drive (atau pilih tambahkan ke Sheet yang sudah ada).
5. Terakhir, tekan **"Kirim ke CTO"** di atas tabel untuk mengirim notifikasi dan _attachment_ langsung ke email tim!
