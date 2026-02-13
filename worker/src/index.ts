import { AgentState } from './durable-objects/AgentState';
import { HistoryDB } from './lib/HistoryDB';
import type { Env } from './types';

// CI/CD Test - v1.0.2
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

    // Health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        version: '1.0.2',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // History API endpoints
    if (path.startsWith('/api/history/')) {
      return handleHistoryRequest(request, env, corsHeaders);
    }

    // Extract teamId from path patterns
    let teamId: string | null = null;
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length >= 3) {
      teamId = pathParts[2];
    }

    if (!teamId) {
      return new Response(JSON.stringify({ error: 'Missing teamId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create Durable Object for this team
    const id = env.AGENT_STATE.idFromName(teamId);
    const stub = env.AGENT_STATE.get(id);
    
    return stub.fetch(request);
  }
};

async function handleHistoryRequest(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const historyDB = new HistoryDB(env.DB);
  await historyDB.init();

  try {
    // /api/history/:teamId
    if (pathParts.length === 3) {
      const teamId = pathParts[2];
      const hours = parseInt(url.searchParams.get('hours') || '24');
      const history = await historyDB.getRecentHistory(teamId, hours);
      
      return new Response(JSON.stringify({ teamId, hours, records: history }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // /api/history/:teamId/:agentId
    if (pathParts.length === 4) {
      const teamId = pathParts[2];
      const agentId = pathParts[3];
      const days = parseInt(url.searchParams.get('days') || '7');
      const stats = await historyDB.getAgentStats(teamId, agentId, days);
      
      return new Response(JSON.stringify({ teamId, agentId, days, stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
