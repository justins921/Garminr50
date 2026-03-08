/**
 * R50 Bridge Service
 *
 * This is a standalone local service that:
 * 1. Acts as a GSPro Open Connect v1 compatible TCP server
 * 2. The Garmin R50 connects to it over WiFi (just like connecting to GSPro)
 * 3. Receives real-time shot data from the R50
 * 4. Normalizes and broadcasts shots to the web app via WebSocket
 *
 * How it works:
 * - The R50 has built-in support for the GSPro Open Connect v1 protocol
 * - When connected to the R50's WiFi hotspot, the R50 sends shot data as JSON over TCP
 * - This bridge receives that data, parses it, and relays it to the web app
 *
 * Usage:
 *   npx ts-node src/bridge/r50-bridge.ts
 *   # or
 *   node dist/bridge/r50-bridge.js
 *
 * The R50 should be configured to connect to this machine's IP on port 921 (GSPro default)
 */

import * as net from "net";
import { WebSocketServer, WebSocket } from "ws";
import { GSProShotMessage, GSProResponse, GSPRO_CLUB_MAP } from "../types/shot";

// --- Configuration ---
const GSPRO_TCP_PORT = 921;       // GSPro Open Connect v1 default port
const WS_PORT = 8921;             // WebSocket port for web app connection
const DEVICE_ID = "GolfPulse-R50-Bridge";

// --- State ---
let currentClub = "DR";
let shotBuffer: GSProShotMessage[] = [];
const wsClients = new Set<WebSocket>();

// --- GSPro TCP Server ---
// This is what the R50 connects to. It speaks the GSPro Open Connect v1 protocol.
const tcpServer = net.createServer((socket) => {
  console.log(`[TCP] R50 connected from ${socket.remoteAddress}:${socket.remotePort}`);

  broadcastStatus("connected", socket.remoteAddress ?? undefined);

  let buffer = "";

  socket.on("data", (data) => {
    buffer += data.toString();

    // GSPro sends JSON messages; try to parse complete messages
    let braceCount = 0;
    let msgStart = -1;

    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === "{") {
        if (braceCount === 0) msgStart = i;
        braceCount++;
      } else if (buffer[i] === "}") {
        braceCount--;
        if (braceCount === 0 && msgStart >= 0) {
          const jsonStr = buffer.substring(msgStart, i + 1);
          try {
            const msg = JSON.parse(jsonStr) as GSProShotMessage;
            handleShotMessage(msg, socket);
          } catch (err) {
            console.error("[TCP] Failed to parse JSON:", err);
          }
          buffer = buffer.substring(i + 1);
          i = -1; // restart scan
          msgStart = -1;
        }
      }
    }
  });

  socket.on("close", () => {
    console.log("[TCP] R50 disconnected");
    broadcastStatus("disconnected");
  });

  socket.on("error", (err) => {
    console.error("[TCP] Socket error:", err.message);
    broadcastStatus("error");
  });
});

function handleShotMessage(msg: GSProShotMessage, socket: net.Socket) {
  // Handle heartbeats
  if (msg.ShotDataOptions?.IsHeartBeat) {
    console.log("[TCP] Heartbeat received");
    sendGSProResponse(socket, 200, "Heartbeat received");
    return;
  }

  // Handle ball detected
  if (msg.ShotDataOptions?.LaunchMonitorBallDetected) {
    console.log("[TCP] Ball detected on launch monitor");
    broadcastEvent("ball_detected", {});
    sendGSProResponse(socket, 200, "Ball detected acknowledged");
    return;
  }

  // Handle actual shot data
  if (msg.ShotDataOptions?.ContainsBallData) {
    console.log(`[TCP] Shot #${msg.ShotNumber} received - Ball Speed: ${msg.BallData.Speed}`);

    // Buffer the shot
    shotBuffer.push(msg);

    // Broadcast to web app
    broadcastShot(msg);

    // Respond to R50 with player info (tells R50 current club selection)
    sendGSProResponse(socket, 200, "Shot received", {
      Handed: "RH",
      Club: currentClub,
    });
  }
}

function sendGSProResponse(
  socket: net.Socket,
  code: number,
  message: string,
  player?: { Handed: string; Club: string }
) {
  const response: GSProResponse = { Code: code, Message: message };
  if (player) response.Player = player;
  socket.write(JSON.stringify(response));
}

// --- WebSocket Server ---
// The web app connects here to receive real-time shot updates
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
  console.log("[WS] Web app client connected");
  wsClients.add(ws);

  // Send any buffered shots
  if (shotBuffer.length > 0) {
    ws.send(JSON.stringify({
      type: "buffer_sync",
      shots: shotBuffer,
    }));
  }

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "set_club") {
        currentClub = msg.club;
        console.log(`[WS] Club changed to: ${GSPRO_CLUB_MAP[currentClub] ?? currentClub}`);
      } else if (msg.type === "clear_buffer") {
        shotBuffer = [];
        console.log("[WS] Shot buffer cleared");
      }
    } catch {
      // ignore invalid messages
    }
  });

  ws.on("close", () => {
    wsClients.delete(ws);
    console.log("[WS] Web app client disconnected");
  });
});

function broadcastShot(msg: GSProShotMessage) {
  const payload = JSON.stringify({
    type: "shot",
    data: msg,
    club: GSPRO_CLUB_MAP[currentClub] ?? currentClub,
    timestamp: new Date().toISOString(),
  });

  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function broadcastStatus(status: string, ipAddress?: string) {
  const payload = JSON.stringify({
    type: "device_status",
    status,
    ipAddress,
    timestamp: new Date().toISOString(),
  });

  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function broadcastEvent(event: string, data: unknown) {
  const payload = JSON.stringify({
    type: "event",
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

// --- Start ---
tcpServer.listen(GSPRO_TCP_PORT, "0.0.0.0", () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║           GolfPulse R50 Bridge Service               ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  GSPro TCP Server:  port ${GSPRO_TCP_PORT}                      ║
║  WebSocket Server:  port ${WS_PORT}                     ║
║                                                      ║
║  Device ID: ${DEVICE_ID}              ║
║                                                      ║
║  To connect your R50:                                ║
║  1. Connect to the R50's WiFi hotspot                ║
║  2. On the R50, select GSPro / Open API mode         ║
║  3. Set the IP to this computer's address            ║
║  4. Set the port to ${GSPRO_TCP_PORT}                           ║
║                                                      ║
║  Waiting for R50 connection...                       ║
╚══════════════════════════════════════════════════════╝
  `);
});

tcpServer.on("error", (err) => {
  if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
    console.error(`[ERROR] Port ${GSPRO_TCP_PORT} is already in use. Is GSPro running?`);
    console.error("Close GSPro or change the port in the bridge configuration.");
  } else {
    console.error("[ERROR] TCP server error:", err);
  }
  process.exit(1);
});

console.log(`[WS] WebSocket server listening on port ${WS_PORT}`);
