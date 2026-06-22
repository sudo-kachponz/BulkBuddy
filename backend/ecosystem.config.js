// ─────────────────────────────────────────────────────────────────────
// PM2 Ecosystem Config for BulkBuddy Backend
//
// Mengganti: pm2 start "python main.py" 
// Menjadi:   pm2 start ecosystem.config.js
//
// Gunicorn membungkus Uvicorn workers dengan auto-restart setelah
// --max-requests tercapai, mencegah memory leak yang menyebabkan
// server crash setiap 6 jam.
// ─────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      name: "bulkbuddy-api",
      // Jalankan Gunicorn (bukan python main.py langsung)
      script: "gunicorn",
      args: "main:app -c gunicorn.conf.py",
      cwd: "/root/BulkBuddy/backend",  // Sesuaikan dengan path di VPS
      interpreter: "none",              // Gunicorn sudah executable sendiri

      // ── PM2 Memory Safety Net ──────────────────────────────────
      // Kalau somehow Gunicorn master process makan > 1.8GB, PM2 restart
      max_memory_restart: "1800M",

      // ── PM2 Restart Policy ─────────────────────────────────────
      // Restart otomatis kalau crash, tapi jangan spam restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,          // Tunggu 5 detik sebelum restart

      // ── Environment Variables ──────────────────────────────────
      // PM2 akan load .env dari cwd, tapi kalau perlu override:
      env: {
        NODE_ENV: "production",
      },

      // ── Logging ────────────────────────────────────────────────
      error_file: "/root/BulkBuddy/logs/pm2-error.log",
      out_file: "/root/BulkBuddy/logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ── Watch (disabled for production) ────────────────────────
      watch: false,
    },
  ],
};
