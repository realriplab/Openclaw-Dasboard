import type { D1Database } from '@cloudflare/workers-types';
import type { AgentStatus, TeamState } from '../types';

export class HistoryDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async init(): Promise<void> {
    // Create tables if not exist
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_agent_time ON agent_history(agent_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_team_time ON agent_history(team_id, timestamp);
    `);
  }

  async recordStatus(teamId: string, agents: AgentStatus[]): Promise<void> {
    const stmt = this.db.prepare(
      'INSERT INTO agent_history (agent_id, team_id, status) VALUES (?, ?, ?)'
    );

    const batch = agents.map(agent => 
      stmt.bind(agent.id, teamId, agent.status)
    );

    await this.db.batch(batch);
  }

  async getRecentHistory(teamId: string, hours: number = 24): Promise<AgentHistory[]> {
    const result = await this.db.prepare(
      `SELECT agent_id, status, timestamp 
       FROM agent_history 
       WHERE team_id = ? 
         AND timestamp > datetime('now', '-' || ? || ' hours')
       ORDER BY timestamp DESC`
    ).bind(teamId, hours.toString()).all();

    return result.results as AgentHistory[];
  }

  async getAgentStats(teamId: string, agentId: string, days: number = 7): Promise<AgentStats> {
    const result = await this.db.prepare(
      `SELECT 
        COUNT(CASE WHEN status = 'working' THEN 1 END) as working_count,
        COUNT(CASE WHEN status = 'idle' THEN 1 END) as idle_count,
        COUNT(*) as total_count
       FROM agent_history 
       WHERE team_id = ? 
         AND agent_id = ?
         AND timestamp > datetime('now', '-' || ? || ' days')`
    ).bind(teamId, agentId, days.toString()).first();

    if (!result) {
      return { workingHours: 0, idleHours: 0, totalRecords: 0 };
    }

    // Assuming records are taken every 5 seconds
    const recordInterval = 5 / 3600; // hours per record

    return {
      workingHours: (result.working_count as number) * recordInterval,
      idleHours: (result.idle_count as number) * recordInterval,
      totalRecords: result.total_count as number
    };
  }

  async cleanupOldData(days: number = 30): Promise<void> {
    await this.db.prepare(
      `DELETE FROM agent_history 
       WHERE timestamp < datetime('now', '-' || ? || ' days')`
    ).bind(days.toString()).run();
  }
}

export interface AgentHistory {
  agent_id: string;
  status: string;
  timestamp: string;
}

export interface AgentStats {
  workingHours: number;
  idleHours: number;
  totalRecords: number;
}
