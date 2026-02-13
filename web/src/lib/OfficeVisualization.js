// OfficeVisualization.js - Simplified office scene renderer

export class OfficeVisualization {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.agents = [];
    
    // Fixed design resolution
    this.designWidth = 1200;
    this.designHeight = 700;
    
    // Office layout
    this.ROOMS = {
      warRoom: { x: 50, y: 40, w: 220, h: 160, name: 'War Room', color: '#6366f1' },
      founderOffice: { x: 290, y: 40, w: 220, h: 160, name: 'Founder Office', color: '#8b5cf6' },
      breakRoom: { x: 530, y: 40, w: 220, h: 160, name: 'Break Room', color: '#f59e0b' },
      lounge: { x: 900, y: 220, w: 270, h: 420, name: 'Lounge', color: '#10b981' }
    };
    
    this.CUBICLES = [
      { x: 150, y: 260, agentId: 'coder' },
      { x: 400, y: 260, agentId: 'writer' },
      { x: 650, y: 260, agentId: 'founder' },
      { x: 150, y: 420, agentId: 'investor' },
      { x: 400, y: 420, agentId: 'coach' },
      { x: 650, y: 420, agentId: 'main' }
    ];
    
    this.AGENT_CONFIG = {
      coder: { name: 'Coder', color: '#3b82f6', initial: 'C' },
      writer: { name: 'Writer', color: '#f43f5e', initial: 'W' },
      founder: { name: 'Founder', color: '#a855f7', initial: 'F' },
      investor: { name: 'Investor', color: '#f59e0b', initial: 'I' },
      coach: { name: 'Coach', color: '#10b981', initial: 'C' },
      main: { name: 'Main', color: '#06b6d4', initial: 'M' }
    };
  }
  
  setAgents(agents) {
    this.agents = agents;
    this.render();
  }
  
  render() {
    
    const canvas = this.canvas;
    const ctx = this.ctx;
    
    if (!canvas || !ctx) {
      console.error('Canvas or context missing');
      return;
    }
    
    // Ensure canvas has proper display size
    const container = canvas.parentElement;
    if (!container) {
      console.error('Canvas has no parent container');
      return;
    }
    
    
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight || Math.round(displayWidth * 0.58);
    
    // Set internal resolution (HiDPI support)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = this.designWidth * dpr;
    canvas.height = this.designHeight * dpr;
    
    // Set display size via CSS
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    
    // Scale context to match DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    // Clear with background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.designWidth, this.designHeight);
    
    
    // Draw scene
    this.drawFloor();
    this.drawRooms();
    this.drawCubicles();
    this.drawLounge();
    this.drawCorridor();
    
  }
  
  drawFloor() {
    const ctx = this.ctx;
    const tileSize = 40;
    
    for (let y = 0; y < this.designHeight; y += tileSize) {
      for (let x = 0; x < this.designWidth; x += tileSize) {
        const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#0a1929' : '#0d1f33';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
  
  drawRooms() {
    Object.values(this.ROOMS).forEach(room => this.drawRoom(room));
  }
  
  drawRoom(room) {
    const ctx = this.ctx;
    
    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(room.x + 4, room.y + 4, room.w - 8, room.h - 8);
    
    // Border
    ctx.strokeStyle = room.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.w, room.h);
    
    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px sans-serif';
    ctx.fillText(room.name, room.x + 12, room.y - 8);
    
    // Status dot
    ctx.fillStyle = room.color;
    ctx.beginPath();
    ctx.arc(room.x + room.w - 12, room.y - 12, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawCubicles() {
    this.CUBICLES.forEach(cubicle => this.drawCubicle(cubicle));
  }
  
  drawCubicle(cubicle) {
    const ctx = this.ctx;
    const agent = this.AGENT_CONFIG[cubicle.agentId];
    const agentStatus = this.agents.find(a => a.id === cubicle.agentId)?.status || 'idle';
    const isWorking = agentStatus === 'working';
    
    // Walls
    ctx.fillStyle = '#334155';
    ctx.fillRect(cubicle.x, cubicle.y, 180, 5);
    ctx.fillRect(cubicle.x, cubicle.y, 5, 130);
    ctx.fillRect(cubicle.x + 175, cubicle.y, 5, 130);
    
    // Desk
    ctx.fillStyle = '#475569';
    ctx.fillRect(cubicle.x + 20, cubicle.y + 40, 120, 70);
    
    // Monitor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cubicle.x + 50, cubicle.y + 20, 60, 40);
    
    // Screen glow
    ctx.fillStyle = isWorking ? 'rgba(59, 130, 246, 0.3)' : 'rgba(100, 116, 139, 0.2)';
    ctx.fillRect(cubicle.x + 55, cubicle.y + 25, 50, 30);
    
    // Chair
    ctx.fillStyle = '#334155';
    ctx.fillRect(cubicle.x + 60, cubicle.y + 100, 40, 25);
    
    // Agent avatar (if working)
    if (isWorking) {
      const grad = ctx.createRadialGradient(
        cubicle.x + 100, cubicle.y + 70, 0,
        cubicle.x + 100, cubicle.y + 70, 20
      );
      grad.addColorStop(0, agent.color);
      grad.addColorStop(1, agent.color + '88');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cubicle.x + 100, cubicle.y + 70, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Initial
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agent.initial, cubicle.x + 100, cubicle.y + 70);
      
      // Activity indicator
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(cubicle.x + 115, cubicle.y + 55, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Empty chair
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cubicle.x + 100, cubicle.y + 70, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawLounge() {
    const ctx = this.ctx;
    const room = this.ROOMS.lounge;
    
    // Sofas
    ctx.fillStyle = '#475569';
    ctx.fillRect(room.x + 30, room.y + 40, 200, 60);
    ctx.fillRect(room.x + 30, room.y + 300, 200, 60);
    ctx.fillRect(room.x + 30, room.y + 120, 60, 160);
    
    // Coffee table
    ctx.fillStyle = '#64748b';
    ctx.fillRect(room.x + 120, room.y + 170, 80, 60);
    
    // TV
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(room.x + 180, room.y + 140, 10, 120);
  }
  
  drawCorridor() {
    const ctx = this.ctx;
    
    // Main corridor line
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 230);
    ctx.lineTo(800, 230);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Plants
    this.drawPlant(320, 240);
    this.drawPlant(720, 600);
  }
  
  drawPlant(x, y) {
    const ctx = this.ctx;
    
    // Pot
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 10, y - 5, 20, 15);
    
    // Plant
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(x, y - 20, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x - 10, y - 15, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + 10, y - 15, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}
