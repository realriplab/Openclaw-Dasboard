import type { D1Database } from '@cloudflare/workers-types';

export interface NotificationConfig {
  webhookUrl?: string;
  email?: string;
  offlineThresholdMinutes: number;
}

export class NotificationService {
  private db: D1Database;
  private config: NotificationConfig;

  constructor(db: D1Database, config: NotificationConfig) {
    this.db = db;
    this.config = config;
  }

  async init(): Promise<void> {
    // Create tables one by one for D1 compatibility
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged BOOLEAN DEFAULT FALSE
      )
    `);
    
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_status_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        old_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_id, team_id)
    `);
    
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_status_changes_agent ON agent_status_changes(agent_id, team_id)
    `);
  }

  async checkAndNotify(teamId: string, agents: Array<{ id: string; status: string; name: string }>): Promise<void> {
    for (const agent of agents) {
      // Get previous status
      const previous = await this.db.prepare(
        `SELECT new_status FROM agent_status_changes 
         WHERE agent_id = ? AND team_id = ? 
         ORDER BY changed_at DESC LIMIT 1`
      ).bind(agent.id, teamId).first();

      const oldStatus = previous?.new_status || 'idle';

      // If status changed, record it
      if (oldStatus !== agent.status) {
        await this.db.prepare(
          `INSERT INTO agent_status_changes (agent_id, team_id, old_status, new_status) 
           VALUES (?, ?, ?, ?)`
        ).bind(agent.id, teamId, oldStatus, agent.status).run();

        // If went offline (working → idle), check duration later
        if (oldStatus === 'working' && agent.status === 'idle') {
          // Schedule notification check after threshold
          // In production, use a queue or scheduled job
        }
      }

      // Check if offline for too long
      if (agent.status === 'idle') {
        const lastWorking = await this.db.prepare(
          `SELECT changed_at FROM agent_status_changes 
           WHERE agent_id = ? AND team_id = ? AND new_status = 'working'
           ORDER BY changed_at DESC LIMIT 1`
        ).bind(agent.id, teamId).first();

        if (lastWorking) {
          const lastWorkingTime = new Date(lastWorking.changed_at as string);
          const idleMinutes = (Date.now() - lastWorkingTime.getTime()) / 60000;

          if (idleMinutes > this.config.offlineThresholdMinutes) {
            await this.sendOfflineNotification(teamId, agent, idleMinutes);
          }
        }
      }
    }
  }

  private async sendOfflineNotification(
    teamId: string, 
    agent: { id: string; name: string; status: string },
    idleMinutes: number
  ): Promise<void> {
    // Check if already sent recently (within 1 hour)
    const recent = await this.db.prepare(
      `SELECT id FROM notifications 
       WHERE agent_id = ? AND team_id = ? AND type = 'offline' 
       AND sent_at > datetime('now', '-1 hour')`
    ).bind(agent.id, teamId).first();

    if (recent) return; // Already notified recently

    const message = `⏸️ ${agent.name} has been idle for ${Math.round(idleMinutes)} minutes`;

    // Store notification
    await this.db.prepare(
      `INSERT INTO notifications (agent_id, team_id, type, message) 
       VALUES (?, ?, 'offline', ?)`
    ).bind(agent.id, teamId, message).run();

    // Send webhook if configured
    if (this.config.webhookUrl) {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: agent.name,
            team: teamId,
            status: 'offline',
            idleMinutes: Math.round(idleMinutes),
            message,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('Webhook failed:', err);
      }
    }
  }

  async getRecentNotifications(teamId: string, hours: number = 24): Promise<any[]> {
    return await this.db.prepare(
      `SELECT * FROM notifications 
       WHERE team_id = ? AND sent_at > datetime('now', '-' || ? || ' hours')
       ORDER BY sent_at DESC`
    ).bind(teamId, hours.toString()).all().then(r => r.results);
  }

  async acknowledgeNotification(notificationId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE notifications SET acknowledged = TRUE WHERE id = ?`
    ).bind(notificationId).run();
  }
}
