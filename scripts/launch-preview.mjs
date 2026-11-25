import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const server = spawn(process.execPath, [
  join(project, "node_modules", "next", "dist", "bin", "next"),
  "dev", "--hostname", "127.0.0.1",
], {
  cwd: project,
  env: { ...process.env, NO_COLOR: "1" },
  stdio: ["inherit", "pipe", "inherit"],
  windowsHide: true,
});

let status = "";
let opened = false;
server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  if (opened) return;
  status = (status + chunk.toString()).slice(-4000);
  const address = status.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+)/)?.[1];
  if (!address || !/\bReady\b/.test(status)) return;
  opened = true;
  console.log(`Website preview: ${address} (keep this window open)`);
  if (process.argv.includes("--no-open")) return;
  const explorer = spawn("explorer.exe", [address], { windowsHide: true, stdio: "ignore" });
  explorer.once("error", () => console.log(`Open ${address} in your browser.`));
});
server.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.once("exit", (code) => { process.exitCode = code ?? 0; });
