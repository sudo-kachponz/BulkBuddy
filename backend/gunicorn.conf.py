# ─────────────────────────────────────────────────────────────────────
# Gunicorn Configuration for BulkBuddy Backend
#
# VPS target: 2.12 GB RAM / 1 vCPU
#
# Strategi anti-OOM:
#   1. 1 worker UvicornWorker (single-process = minimum base RAM ~150-200 MB)
#   2. max_requests=80: worker direcycle setelah 80 request → RAM dikembalikan
#      lebih sering (vs. 150 sebelumnya)
#   3. timeout=120: cegah request hung yang menahan RAM terlalu lama
#   4. limit_request_line & limit_request_fields: cegah request besar masuk RAM
#
# Cara pakai:
#   gunicorn main:app -c gunicorn.conf.py
#
# Atau via PM2:
#   pm2 start ecosystem.config.js
# ─────────────────────────────────────────────────────────────────────

# ── Server Socket ──────────────────────────────────────────────────
bind = "0.0.0.0:8000"

# ── Worker Processes ───────────────────────────────────────────────
# 1 worker untuk VPS 2GB RAM / 1 vCPU — lebih dari 1 = OOM
workers = 1

# UvicornWorker agar FastAPI async tetap berjalan
worker_class = "uvicorn.workers.UvicornWorker"

# ── Memory Leak Prevention (KUNCI UTAMA) ──────────────────────────
# Restart worker setelah 80 request → RAM kembali bersih lebih cepat
max_requests = 80
# Jitter agar tidak restart tepat di angka yang sama setiap kali
max_requests_jitter = 15

# ── Timeouts ───────────────────────────────────────────────────────
# 2 menit cukup untuk LLM response lewat OpenRouter (bukan lokal)
timeout = 120
# Grace period saat worker di-recycle
graceful_timeout = 20
# Keepalive untuk koneksi idle (cocok dengan Nginx upstream)
keepalive = 5

# ── Request Size Limits ────────────────────────────────────────────
# Cegah request line + header besar masuk RAM
limit_request_line    = 4096   # default 8190, turunkan ke 4096
limit_request_fields  = 50     # default 100
limit_request_field_size = 8190

# ── Heartbeat ──────────────────────────────────────────────────────
# Gunakan RAM-disk untuk heartbeat file (lebih cepat dari disk I/O)
worker_tmp_dir = "/dev/shm"

# ── Preloading ─────────────────────────────────────────────────────
# JANGAN preload app → setiap worker punya isolasi memory sendiri.
# Kalau preload=True, memory di-share dan leak bisa menyebar.
preload_app = False

# ── Logging ────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog  = "-"   # stderr
loglevel  = "info"

# ── Server Hooks ───────────────────────────────────────────────────
def worker_exit(server, worker):
    """Log ketika worker di-recycle (untuk monitoring memory leak fix)."""
    server.log.info(
        "♻️  Worker PID %s recycled after max_requests. RAM freed.",
        worker.pid,
    )

def on_starting(server):
    """Log saat Gunicorn mulai."""
    server.log.info(
        "🚀 BulkBuddy Gunicorn starting — workers=%d max_requests=%d (jitter=%d) timeout=%ds",
        server.app.cfg.workers,
        server.app.cfg.max_requests,
        server.app.cfg.max_requests_jitter,
        server.app.cfg.timeout,
    )
