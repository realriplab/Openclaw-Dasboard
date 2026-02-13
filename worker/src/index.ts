import { AgentState } from './durable-objects/AgentState';
import type { Env } from './types';

export { AgentState };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Extract teamId from path patterns:
    // /api/report/:teamId
    // /api/sse/:teamId
    // /api/agents/:teamId
    
    let teamId: string | null = null;
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length >= 3) {
      // Path format: api/report/yunhe-core
      teamId = pathParts[2];
    }

    if (!teamId) {
      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Missing teamId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create Durable Object for this team
    const id = env.AGENT_STATE.idFromName(teamId);
    const stub = env.AGENT_STATE.get(id);
    
    // Forward request to Durable Object
    return stub.fetch(request);
  }
};
