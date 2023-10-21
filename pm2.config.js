module.exports = {
  apps: [
    {
      script: "build/index.js",
      watch: false,
      name: "app",
      instances: "max",
      exec_mode: "cluster",
      exp_backoff_restart_delay: 100,
    },
  ],
};
