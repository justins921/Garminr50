import { NextResponse } from "next/server";
import { spawn, type ChildProcess } from "child_process";

// Track the bridge process at module level
let bridgeProcess: ChildProcess | null = null;
let bridgeLogs: string[] = [];
const MAX_LOG_LINES = 200;

function addLog(line: string) {
  bridgeLogs.push(line);
  if (bridgeLogs.length > MAX_LOG_LINES) {
    bridgeLogs = bridgeLogs.slice(-MAX_LOG_LINES);
  }
}

export async function GET() {
  const running = bridgeProcess !== null && bridgeProcess.exitCode === null;
  return NextResponse.json({
    running,
    pid: running ? bridgeProcess!.pid : null,
    logs: bridgeLogs.slice(-50),
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "start") {
    // Already running?
    if (bridgeProcess && bridgeProcess.exitCode === null) {
      return NextResponse.json({ running: true, pid: bridgeProcess.pid, message: "Bridge already running" });
    }

    bridgeLogs = [];
    addLog("[bridge] Starting R50 bridge service...");

    bridgeProcess = spawn("npx", ["tsx", "src/bridge/r50-bridge.ts"], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    bridgeProcess.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => addLog(line));
    });

    bridgeProcess.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => addLog(`[stderr] ${line}`));
    });

    bridgeProcess.on("exit", (code) => {
      addLog(`[bridge] Process exited with code ${code}`);
      bridgeProcess = null;
    });

    // Give it a moment to start or fail
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const running = bridgeProcess !== null && bridgeProcess.exitCode === null;
    return NextResponse.json({
      running,
      pid: running ? bridgeProcess!.pid : null,
      logs: bridgeLogs.slice(-20),
    });
  }

  if (body.action === "stop") {
    if (bridgeProcess && bridgeProcess.exitCode === null) {
      bridgeProcess.kill("SIGTERM");
      addLog("[bridge] Stopping bridge service...");
      // Wait briefly for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));
      bridgeProcess = null;
    }
    return NextResponse.json({ running: false, message: "Bridge stopped" });
  }

  return NextResponse.json({ error: "Invalid action. Use 'start' or 'stop'." }, { status: 400 });
}
