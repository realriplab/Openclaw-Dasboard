import { AgentStatus, TeamState } from '../types';
import { HistoryDB } from '../lib/HistoryDB';
import { NotificationService } from '../lib/NotificationService';

export class AgentState {
  private state: DurableObjectState;
  private env: any;
  private clients: Set<ReadableStreamDefaultController> = new Set();
  private currentState: TeamState = {
    agents: [],
    timestamp: new Date().toISOString(),
    teamId: ''
  };
  private historyDB: HistoryDB | null = null;
  private notificationService: NotificationService | null = null;
  private initialized = false;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    
    // Initialize D1 if available
    if (env.DB) {
      this.historyDB = new HistoryDB(env.DB);
      this.notificationService = new NotificationService(env.DB, {
        offlineThresholdMinutes: 10
      });
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    // Restore state from storage
    const stored = await this.state.storage.get<TeamState>('agents');
    if (stored) {
      this.currentState = stored;
    }
    
    // Init D1 tables (wrapped in try-catch to not fail request)
    if (this.historyDB) {
      try {
        await this.historyDB.init();
      } catch (e) {
        console.error('HistoryDB init failed:', e);
      }
    }
    
    if (this.notificationService) {
      try {
        await this.notificationService.init();
      } catch (e) {
        console.error('NotificationService init failed:', e);
      }
    }
    
    this.initialized = true;
  }

  async fetch(request: Request): Promise<Response> {
    // Initialize on first request
    await this.init();
    
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/report/:teamId - Local bridge reports status
    if (request.method === 'POST' && path.includes('/report/')) {
      return this.handleReport(request, corsHeaders);
    }

    // GET /api/sse/:teamId - Client subscribes to real-time updates
    if (request.method === 'GET' && path.includes('/sse/')) {
      return this.handleSSE(request, corsHeaders);
    }

    // GET /api/agents/:teamId - Get current state (REST API)
    if (request.method === 'GET' && path.includes('/agents/')) {
      return this.handleGetAgents(corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  private async handleReport(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const data = await request.json() as TeamState;
      
      // Update state
      this.currentState = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      // Persist to storage
      await this.state.storage.put('agents', this.currentState);
      
      // Store history in D1 (non-blocking)
      if (this.historyDB && data.agents.length > 0) {
        this.historyDB.recordStatus(data.teamId, data.agents).catch(e => {
          console.error('Failed to record history:', e);
        });
      }
      
      // Check for offline notifications (non-blocking)
      if (this.notificationService && data.agents.length > 0) {
        this.notificationService.checkAndNotify(data.teamId, data.agents).catch(e => {
          console.error('Failed to check notifications:', e);
        });
      }
      
      // Broadcast to all connected clients
      this.broadcast(this.currentState);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private handleSSE(request: Request, corsHeaders: Record<string, string>): Response {
    const stream = new ReadableStream({
      start: (controller) => {
        // Add client to broadcast list
        this.clients.add(controller);
        
        // Send current state immediately
        if (this.currentState.agents.length > 0) {
          this.sendToClient(controller, this.currentState);
        }
        
        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(':ping\n\n');
          } catch {
            clearInterval(keepAlive);
            this.clients.delete(controller);
          }
        }, 30000);
        
        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAlive);
          this.clients.delete(controller);
        });
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }

  private handleGetAgents(corsHeaders: Record<string, string>): Response {
    return new Response(JSON.stringify(this.currentState), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private sendToClient(controller: ReadableStreamDefaultController, data: TeamState): void {
    try {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.clients.delete(controller);
    }
  }

  private broadcast(data: TeamState): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(controller => {
      try {
        controller.enqueue(message);
      } catch {
        this.clients.delete(controller);
      }
    });
  }
}
