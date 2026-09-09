import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Vercel provides DATABASE_URL. Reconcile the application schema against
// that database before building so a fresh Neon database is bootstrapped.
if (process.env.VERCEL === "1") {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for Vercel database setup.");
    process.exit(1);
  }

  run("drizzle-kit", ["push", "--force", "--config", "drizzle.config.mts"]);
}

run("next", ["build"]);
