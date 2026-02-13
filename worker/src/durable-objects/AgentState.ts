import { AgentStatus, TeamState } from '../types';

// Simple in-memory state (no DB for now to fix deployment)
export class AgentState {
  private state: DurableObjectState;
  private env: any;
  private clients: Set<ReadableStreamDefaultController> = new Set();
  private currentState: TeamState = {
    agents: [],
    timestamp: new Date().toISOString(),
    teamId: ''
  };

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/report/:teamId
    if (request.method === 'POST' && path.includes('/report/')) {
      return this.handleReport(request, corsHeaders);
    }

    // GET /api/sse/:teamId
    if (request.method === 'GET' && path.includes('/sse/')) {
      return this.handleSSE(request, corsHeaders);
    }

    // GET /api/agents/:teamId
    if (request.method === 'GET' && path.includes('/agents/')) {
      return this.handleGetAgents(corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  private async handleReport(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const data = await request.json() as TeamState;
      
      this.currentState = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      // Persist to storage
      await this.state.storage.put('agents', this.currentState);
      
      // Broadcast to clients
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
        this.clients.add(controller);
        
        // Send current state
        if (this.currentState.agents.length > 0) {
          this.sendToClient(controller, this.currentState);
        }
        
        // Keep-alive
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(':ping\n\n');
          } catch {
            clearInterval(keepAlive);
            this.clients.delete(controller);
          }
        }, 30000);
        
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
