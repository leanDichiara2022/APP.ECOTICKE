module.exports = {
  apps: [
    {
      name: "app-tickeco",
      script: "./server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 443
      },
      error_file: "/root/.pm2/logs/app-tickeco-error.log",
      out_file: "/root/.pm2/logs/app-tickeco-out.log",
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};
