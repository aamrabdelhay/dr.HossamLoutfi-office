import { spawnSync } from "node:child_process";

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Vercel already provides DATABASE_URL. On deployments, reconcile the
// Drizzle schema against that database before Next.js builds the app.
if (process.env.VERCEL === "1") {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for Vercel database setup.");
    process.exit(1);
  }

  run("drizzle-kit", ["push", "--force"]);
}

run("next", ["build"]);
