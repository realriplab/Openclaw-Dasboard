// OfficeVisualization.js - Complete office scene renderer

export class OfficeVisualization {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.agents = [];
    this.animationFrame = null;
    
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
    const ctx = this.ctx;
    const canvas = this.canvas;
    
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw floor grid
    this.drawFloor();
    
    // Draw rooms
    this.drawRoom(this.ROOMS.warRoom);
    this.drawRoom(this.ROOMS.founderOffice);
    this.drawRoom(this.ROOMS.breakRoom);
    this.drawRoom(this.ROOMS.lounge);
    
    // Draw cubicles
    this.CUBICLES.forEach(cubicle => {
      this.drawCubicle(cubicle);
    });
    
    // Draw lounge furniture
    this.drawLounge();
    
    // Draw corridor
    this.drawCorridor();
  }
  
  drawFloor() {
    const ctx = this.ctx;
    const tileSize = 40;
    
    for (let y = 0; y < this.canvas.height; y += tileSize) {
      for (let x = 0; x < this.canvas.width; x += tileSize) {
        const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#0a1929' : '#0d1f33';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
  
  drawRoom(room) {
    const ctx = this.ctx;
    
    // Room background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(room.x + 4, room.y + 4, room.w - 8, room.h - 8);
    
    // Room border with accent color
    ctx.strokeStyle = room.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.w, room.h);
    
    // Glass effect overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(room.x + 4, room.y + 4, room.w - 8, room.h - 8);
    
    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(room.name, room.x + 12, room.y - 8);
    
    // Status indicator
    ctx.fillStyle = room.color;
    ctx.beginPath();
    ctx.arc(room.x + room.w - 12, room.y - 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Room-specific furniture
    if (room.name === 'War Room') {
      this.drawConferenceTable(room);
    } else if (room.name === 'Founder Office') {
      this.drawExecutiveDesk(room);
    } else if (room.name === 'Break Room') {
      this.drawKitchenArea(room);
    }
  }
  
  drawConferenceTable(room) {
    const ctx = this.ctx;
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    
    // Round table
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Chairs
    ctx.fillStyle = '#334155';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const chairX = cx + Math.cos(angle) * 55;
      const chairY = cy + Math.sin(angle) * 55;
      ctx.fillRect(chairX - 8, chairY - 8, 16, 16);
    }
  }
  
  drawExecutiveDesk(room) {
    const ctx = this.ctx;
    
    // Desk
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(room.x + 100, room.y + 60, 80, 40);
    
    // Monitor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(room.x + 130, room.y + 45, 20, 15);
    
    // Bookshelf
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(room.x + 15, room.y + 40, 40, 100);
    
    // Books
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(room.x + 18 + (i % 3) * 12, room.y + 45 + Math.floor(i / 3) * 25, 8, 18);
    }
    
    // Couch
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(room.x + 30, room.y + 120, 60, 30);
  }
  
  drawKitchenArea(room) {
    const ctx = this.ctx;
    
    // Cabinets
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(room.x + 10, room.y + 40, 180, 30);
    ctx.fillRect(room.x + 10, room.y + 80, 180, 70);
    
    // Fridge
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(room.x + 140, room.y + 50, 40, 110);
    
    // Coffee machine
    ctx.fillStyle = '#334155';
    ctx.fillRect(room.x + 20, room.y + 60, 25, 30);
  }
  
  drawCubicle(cubicle) {
    const ctx = this.ctx;
    const agent = this.AGENT_CONFIG[cubicle.agentId];
    const agentStatus = this.agents.find(a => a.id === cubicle.agentId)?.status || 'idle';
    const isWorking = agentStatus === 'working';
    
    // Cubicle walls
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
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(agent.initial, cubicle.x + 100, cubicle.y + 75);
    }
    
    // Name plate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cubicle.x + 25, cubicle.y + 55, 70, 18);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(agent.name, cubicle.x + 30, cubicle.y + 67);
    
    // Status dot
    ctx.fillStyle = isWorking ? '#22c55e' : '#64748b';
    ctx.beginPath();
    ctx.arc(cubicle.x + 165, cubicle.y + 25, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawLounge() {
    const ctx = this.ctx;
    const r = this.ROOMS.lounge;
    
    // Sofa
    ctx.fillStyle = '#374151';
    ctx.fillRect(r.x + 20, r.y + 40, 100, 50);
    
    // Coffee table
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(r.x + 40, r.y + 110, 60, 40);
    
    // Water cooler
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(r.x + 160, r.y + 50, 30, 50);
    
    // Bean bags
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(r.x + 200, r.y + 120, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(r.x + 50, r.y + 200, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Ping pong table
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(r.x + 130, r.y + 180, 120, 70);
    ctx.fillStyle = '#fff';
    ctx.fillRect(r.x + 185, r.y + 180, 10, 70);
    
    // Whiteboard
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(r.x + 20, r.y + 280, 100, 70);
  }
  
  drawCorridor() {
    const ctx = this.ctx;
    
    // Corridor line
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
  
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
