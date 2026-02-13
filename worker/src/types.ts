export interface Env {
  AGENT_STATE: DurableObjectNamespace;
  TEAM_CONFIG: KVNamespace;
  API_TOKEN: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'working' | 'idle';
  color: string;
  role: string;
  lastSeen: string;
}

export interface TeamState {
  agents: AgentStatus[];
  timestamp: string;
  teamId: string;
}
