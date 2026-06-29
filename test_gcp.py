import gspread
import json

def run_test():
    print("="*50)
    print("🕵️  MEMULAI INVESTIGASI SERVICE ACCOUNT")
    print("="*50)
    
    try:
        # 1. Cek secara eksplisit email apa yang dipakai
        with open('credentials.json', 'r') as f:
            creds = json.load(f)
            sa_email = creds.get('client_email', 'TIDAK DITEMUKAN')
        print(f"🔑 1. Email Service Account : {sa_email}")
        print("   (PASTIKAN email ini yang di-invite ke Folder Drive)\n")

        # 2. Autentikasi
        gc = gspread.service_account(filename='credentials.json')
        print("✅ 2. Login ke Google API berhasil!\n")

        # 3. List semua file yang bisa DILIHAT oleh akun ini
        print("📂 3. Daftar spreadsheet yang bisa dilihat oleh akun ini:")
        files = gc.list_spreadsheet_files()
        if not files:
            print("   [KOSONG] ❌ Akun ini tidak bisa melihat 1 file pun!")
            print("   Penyebab:")
            print("   - Akses Share belum masuk/salah email.")
            print("   - Google Drive API belum di-Enable di GCP Console.")
        else:
            for f in files:
                print(f"   📄 {f['name']} (ID: {f['id']})")

        # 4. Coba buka file target
        # Ganti string di bawah dengan nama file terakhir yang kamu buat
        target_file = "SUTET-18/06/2026-09.50.31" 
        print(f"\n🔍 4. Mencoba membuka file: '{target_file}'...")
        
        sh = gc.open(target_file)
        print(f"✅ BERHASIL BUKA! File ada dan bisa diedit.")
        print(f"   URL: {sh.url}")

    except gspread.exceptions.SpreadsheetNotFound:
        print(f"❌ ERROR: SpreadsheetNotFound!")
        print(f"   Robot tidak bisa menemukan nama file tersebut.")
    except Exception as e:
        print(f"❌ ERROR SISTEM: {e}")

if __name__ == "__main__":
    run_test()
