import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Global WebSocket registry for agent execution events
export interface WebSocketClient {
  ws: any;
  userId: string;
  executionId?: string;
}

export const wsClients = new Map<string, WebSocketClient>();

export const broadcastAgentEvent = (executionId: string, event: any) => {
  const eventData = JSON.stringify({
    type: 'agent-event',
    executionId,
    timestamp: new Date().toISOString(),
    eventType: event.type,     // Preserve original event type
    eventData: event          // Nest the actual event data
  });

  Array.from(wsClients.entries()).forEach(([clientId, client]) => {
    if (client.executionId === executionId && client.ws.readyState === 1) { // WebSocket.OPEN = 1
      try {
        client.ws.send(eventData);
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        wsClients.delete(clientId);
      }
    }
  });
};

(async () => {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup express routes
  const server = await registerRoutes(app);

  // Setup WebSocket server specifically for agent execution events
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/api/agent-executions/ws'
  });

  wss.on('connection', (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const executionId = url.searchParams.get('executionId');

    console.log(`Agent execution WebSocket client connected: ${clientId} (user: ${userId})`);

    const client: WebSocketClient = {
      ws,
      userId,
      executionId: executionId || undefined
    };

    wsClients.set(clientId, client);

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection-established',
      clientId,
      timestamp: new Date().toISOString()
    }));

    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe-execution' && data.executionId) {
          client.executionId = data.executionId;
          wsClients.set(clientId, client);
          console.log(`Client ${clientId} subscribed to execution ${data.executionId}`);
          
          // Start the pending execution now that client is subscribed
          const { agentOrchestrationService } = await import('./agentOrchestrationService');
          agentOrchestrationService.startPendingExecution(data.executionId);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`Agent execution WebSocket client disconnected: ${clientId}`);
      wsClients.delete(clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      wsClients.delete(clientId);
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} with WebSocket support`);
  });
})();
