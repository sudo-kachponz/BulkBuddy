// ─────────────────────────────────────────────────────────────────────
// PM2 Ecosystem Config for BulkBuddy Backend
//
// VPS: Ubuntu 22.04 / 2.12 GB RAM / 1 vCPU
// App path on VPS: /root/BulkBuddy
//
// PM2 membungkus Gunicorn+Uvicorn workers.
// max_memory_restart: safety net — restart paksa jika Gunicorn master
// process sendiri makan >700 MB (agresif agar tidak sampai OOM).
// Worker recycle sudah ditangani oleh gunicorn.conf.py (max_requests=80).
// ─────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      name: "bulkbuddy-api",
      // Jalankan Gunicorn (bukan python main.py langsung)
      script: "gunicorn",
      args: "main:app -c gunicorn.conf.py",
      cwd: "/root/BulkBuddy/backend",  // Path di VPS
      interpreter: "none",             // Gunicorn sudah executable sendiri

      // ── PM2 Memory Safety Net ──────────────────────────────────
      // 700 MB: lebih agresif dari sebelumnya (1000 MB).
      // Pada VPS 2.12 GB, restart pada 700 MB menyisakan cukup buffer
      // untuk OS + MCP proxy processes + bun runtime.
      max_memory_restart: "700M",

      // ── PM2 Kill Timeout ───────────────────────────────────────
      // Beri 5 detik untuk Gunicorn graceful shutdown sebelum SIGKILL
      kill_timeout: 5000,

      // ── PM2 Restart Policy ─────────────────────────────────────
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,  // Tunggu 5 detik sebelum restart

      // ── Environment Variables ──────────────────────────────────
      env: {
        NODE_ENV: "production",
        ENV: "production",      // Nonaktifkan tracemalloc di main.py
      },

      // ── Logging ────────────────────────────────────────────────
      error_file: "/root/BulkBuddy/logs/pm2-error.log",
      out_file:   "/root/BulkBuddy/logs/pm2-out.log",
      merge_logs:      true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ── Watch (disabled for production) ────────────────────────
      watch: false,
    },
  ],
};
