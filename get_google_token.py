"""
get_google_token.py
===================
Jalankan script ini SEKALI di laptop lokal kamu (bukan di VPS).
Script ini akan membuka browser untuk OAuth, lalu mencetak refresh_token.

Cara pakai:
    pip install google-auth-oauthlib python-dotenv
    python get_google_token.py
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    print("ERROR: Set GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env terlebih dahulu!")
    exit(1)

SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/contacts",
    "https://www.googleapis.com/auth/presentations",
]

from google_auth_oauthlib.flow import InstalledAppFlow

# KITA GUNAKAN MODE WEB APP SESUAI DENGAN CLIENT ID DI GOOGLE CONSOLE
client_config = {
    "web": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost:3000/oauth2callback"],
    }
}

print("\n🔐 Memulai OAuth flow...")
print("PENTING: Pastikan 'http://localhost:3000/oauth2callback' sudah ada di ")
print("kolom 'Authorized redirect URIs' di Google Cloud Console.")
print("Jika belum, tambahkan dulu lalu save.\n")

flow = InstalledAppFlow.from_client_config(client_config, scopes=SCOPES)

# Jalankan local server di port 3000
creds = flow.run_local_server(
    host='localhost',
    port=3000,
    authorization_prompt_message='Silakan buka browser Anda untuk login...',
    success_message='OAuth berhasil! Anda bisa menutup tab browser ini.',
    open_browser=True,
    prompt='consent',
    access_type='offline'
)

print("\n✅ OAuth berhasil!\n")
print("=" * 60)
print("SALIN BARIS INI KE FILE .env DI VPS & LOKAL:")
print("=" * 60)
print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
print("=" * 60)
print("\nSetelah update .env, jalankan:")
print("  pm2 restart bulkbuddy --update-env")
print()
