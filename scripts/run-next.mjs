import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Missing Next.js command. Expected one of: dev, build, start.");
  process.exit(1);
}

process.chdir(projectRoot);

const nextBin = path.resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, command, ...args], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
