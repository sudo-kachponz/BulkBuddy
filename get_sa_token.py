"""
get_sa_token.py
===============
Generate access token dari Service Account untuk dipakai di VPS.
TIDAK butuh browser sama sekali!

Cara pakai (di laptop lokal ATAU di VPS):
    pip install google-auth python-dotenv
    python get_sa_token.py

File credentials.json (Service Account) harus ada di folder yang sama.
"""

import json
import os

SA_FILE = os.path.join(os.path.dirname(__file__), "credentials.json")

if not os.path.exists(SA_FILE):
    print(f"ERROR: File {SA_FILE} tidak ditemukan!")
    exit(1)

with open(SA_FILE) as f:
    sa_info = json.load(f)

if sa_info.get("type") != "service_account":
    print("ERROR: credentials.json bukan service account! Perlu file service account.")
    exit(1)

print(f"✅ Service Account ditemukan: {sa_info['client_email']}")
print()

# Tampilkan cara setup tokens.json untuk google-mcp menggunakan service account
SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/calendar",
]

try:
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request

    creds = service_account.Credentials.from_service_account_file(
        SA_FILE, scopes=SCOPES
    )
    creds.refresh(Request())

    print("=" * 60)
    print(f"Access Token: {creds.token}")
    print(f"Expiry: {creds.expiry}")
    print("=" * 60)

    # Tulis tokens.json langsung ke lokasi yang dipakai google-mcp
    import os
    tokens_dir = os.path.expanduser("~/.local/share/google-mcp")
    os.makedirs(tokens_dir, exist_ok=True)
    tokens_path = os.path.join(tokens_dir, "tokens.json")

    tokens_data = {
        "access_token": creds.token,
        "token_type": "Bearer",
        "expiry_date": int(creds.expiry.timestamp() * 1000) if creds.expiry else None,
        # Service account tidak punya refresh_token
        # tapi access_token bisa di-refresh ulang lewat setup_google_tokens()
    }

    with open(tokens_path, "w") as f:
        json.dump(tokens_data, f, indent=2)

    print(f"\n✅ tokens.json berhasil ditulis ke: {tokens_path}")
    print("\nJalankan 'pm2 restart bulkbuddy --update-env' di VPS")

except ImportError:
    print("Install google-auth dulu:")
    print("  pip install google-auth")
except Exception as e:
    print(f"Error: {e}")
