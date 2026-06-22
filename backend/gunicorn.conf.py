# ─────────────────────────────────────────────────────────────────────
# Gunicorn Configuration for BulkBuddy Backend
# 
# Solusi utama untuk "kutukan 6 jam" memory leak:
# Worker di-recycle otomatis setelah melayani --max-requests request,
# sehingga RAM dikembalikan ke 0 tanpa downtime.
#
# Cara pakai:
#   gunicorn main:app -c gunicorn.conf.py
#
# Atau via PM2:
#   pm2 start ecosystem.config.js
# ─────────────────────────────────────────────────────────────────────

import multiprocessing

# ── Server Socket ──────────────────────────────────────────────────
bind = "0.0.0.0:8000"

# ── Worker Processes ───────────────────────────────────────────────
# Untuk VPS 2GB RAM / 1 vCPU, 2 workers sudah optimal.
# Rumus umum: (2 × CPU) + 1, tapi kita cap di 2 karena RAM terbatas.
workers = 2

# Pakai UvicornWorker supaya tetap support async FastAPI
worker_class = "uvicorn.workers.UvicornWorker"

# ── Memory Leak Prevention (KUNCI UTAMA) ──────────────────────────
# Restart worker setelah melayani N requests → RAM kembali bersih
max_requests = 150
# Jitter supaya kedua worker tidak restart bersamaan (zero downtime)
max_requests_jitter = 30

# ── Timeouts ───────────────────────────────────────────────────────
# Timeout per-request (detik). Agent LLM bisa lambat, kasih 3 menit.
timeout = 180
# Grace period saat worker di-recycle (beri waktu request selesai)
graceful_timeout = 30
# Keepalive untuk koneksi yang idle (cocok dengan Nginx upstream)
keepalive = 5

# ── Heartbeat ──────────────────────────────────────────────────────
# Pakai RAM-disk untuk heartbeat file (lebih cepat dari disk I/O)
worker_tmp_dir = "/dev/shm"

# ── Preloading ─────────────────────────────────────────────────────
# JANGAN preload app → setiap worker punya isolasi memory sendiri.
# Kalau preload=True, memory di-share dan leak bisa menyebar.
preload_app = False

# ── Logging ────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog = "-"    # stderr
loglevel = "info"

# ── Server Hooks ───────────────────────────────────────────────────
def worker_exit(server, worker):
    """Log ketika worker di-recycle (untuk monitoring memory leak fix)."""
    server.log.info(
        "♻️  Worker %s (PID %s) recycled after max_requests. RAM freed.",
        worker.pid, worker.pid
    )

def on_starting(server):
    """Log saat Gunicorn mulai."""
    server.log.info(
        "🚀 BulkBuddy Gunicorn starting with %d workers, "
        "max_requests=%d (jitter=%d)",
        server.app.cfg.workers,
        server.app.cfg.max_requests,
        server.app.cfg.max_requests_jitter,
    )
