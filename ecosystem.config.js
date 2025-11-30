module.exports = {
  apps: [
    {
      name: "app-tickeco",
      script: "./server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
