// OfficeVisualization.js - Complete office scene renderer

export class OfficeVisualization {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.agents = [];
    this.animationFrame = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.dpr = window.devicePixelRatio || 1;
    
    // Setup touch events for mobile
    this.setupTouchEvents();
    
    // Office layout (design for 1200x700 coordinate space)
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
    
    // Set canvas size based on container
    this.resize();
  }
  
  resize() {
    const canvas = this.canvas;
    const container = canvas.parentElement;
    if (!container) return;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || containerWidth * 0.58; // maintain aspect ratio
    
    // Set canvas internal resolution (design resolution: 1200x700)
    const designWidth = 1200;
    const designHeight = 700;
    
    canvas.width = designWidth * this.dpr;
    canvas.height = designHeight * this.dpr;
    
    // Set display size via CSS
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${(containerWidth * designHeight / designWidth)}px`;
    
    // Scale context for DPR
    this.ctx.scale(this.dpr, this.dpr);
    
    this.render();
  }
  
  setAgents(agents) {
    this.agents = agents;
    this.render();
  }
  
  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    
    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Re-apply DPR scale
    ctx.scale(this.dpr, this.dpr);
    
    // Clear canvas with background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 700);
    
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
    
    for (let y = 0; y < 700; y += tileSize) {
      for (let x = 0; x < 1200; x += tileSize) {
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
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    
    // Large desk
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 60, cy - 30, 120, 60);
    
    // Chair
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 20, cy + 40, 40, 30);
    
    // Bookshelf
    ctx.fillStyle = '#334155';
    ctx.fillRect(room.x + 10, room.y + 40, 30, 100);
    
    // Books
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i];
      ctx.fillRect(room.x + 12, room.y + 45 + i * 22, 26, 18);
    }
  }
  
  drawKitchenArea(room) {
    const ctx = this.ctx;
    
    // Counter
    ctx.fillStyle = '#475569';
    ctx.fillRect(room.x + 20, room.y + 100, 180, 40);
    
    // Fridge
    ctx.fillStyle = '#64748b';
    ctx.fillRect(room.x + 150, room.y + 20, 50, 70);
    
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
    // Top sofa
    ctx.fillRect(room.x + 30, room.y + 40, 200, 60);
    // Bottom sofa
    ctx.fillRect(room.x + 30, room.y + 300, 200, 60);
    // Left sofa
    ctx.fillRect(room.x + 30, room.y + 120, 60, 160);
    
    // Coffee table
    ctx.fillStyle = '#64748b';
    ctx.fillRect(room.x + 120, room.y + 170, 80, 60);
    
    // TV
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(room.x + 180, room.y + 140, 10, 120);
    
    // TV stand
    ctx.fillStyle = '#334155';
    ctx.fillRect(room.x + 170, room.y + 260, 30, 10);
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
  
  setupTouchEvents() {
    // Touch events for mobile pan and zoom
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
      }
    }, { passive: true });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.lastTouchX;
        const deltaY = e.touches[0].clientY - this.lastTouchY;
        
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
        
        this.render();
      }
    }, { passive: true });
    
    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    }, { passive: true });
    
    // Pinch to zoom
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && this.lastPinchDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scaleChange = distance / this.lastPinchDistance;
        this.scale = Math.max(0.5, Math.min(3, this.scale * scaleChange));
        this.lastPinchDistance = distance;
        
        this.render();
      }
    }, { passive: true });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.resize();
    });
  }
  
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
