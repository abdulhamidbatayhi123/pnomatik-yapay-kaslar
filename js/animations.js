// ===== PARTICLE BACKGROUND (HYPNOTIC & MOUSE-REACTIVE) =====
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let mouse = { x: null, y: null, radius: 150 };

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    
    // Track mouse safely
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            // Mixed colors: mostly navy, rarely gold
            this.color = Math.random() > 0.85 ? 'rgba(200, 164, 21, 0.8)' : 'rgba(0, 40, 85, 0.6)';
        }
        update() {
            // Natural drift
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > w) this.speedX *= -1;
            if (this.y < 0 || this.y > h) this.speedY *= -1;

            // Mouse interaction (gentle repulsion)
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX * 0.1;
                    this.y -= directionY * 0.1;
                }
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    const count = Math.min(100, Math.floor((w * h) / 12000));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a + 1; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    let opacity = 1 - (distance / 120);
                    ctx.strokeStyle = `rgba(0, 40, 85, ${opacity * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
            
            // Connect to mouse
            if (mouse.x != null && mouse.y != null) {
                let dx = particles[a].x - mouse.x;
                let dy = particles[a].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    let opacity = 1 - (distance / 150);
                    ctx.strokeStyle = `rgba(200, 164, 21, ${opacity * 0.5})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connectParticles();
        requestAnimationFrame(animate);
    }
    animate();
})();


// ===== ANIMATED COUNTER =====
function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        if (Number.isInteger(target)) {
            el.textContent = prefix + Math.round(current) + suffix;
        } else {
            el.textContent = prefix + current.toFixed(1) + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}


// ===== PAM SIMULATOR =====
function initPAMSimulator(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    let pressure = 0;
    const slider = document.getElementById('pamPressureSlider');
    const valDisplay = document.getElementById('pamPressureVal');
    const contrDisplay = document.getElementById('pamContractionVal');
    const forceDisplay = document.getElementById('pamForceVal');

    function drawMuscle() {
        ctx.clearRect(0, 0, W, H);

        const maxContraction = 0.28;
        const contraction = pressure / 6 * maxContraction;
        const restLength = H * 0.7;
        const restRadius = W * 0.08;

        const currentLength = restLength * (1 - contraction);
        const maxExpansion = 2.2;
        const currentRadius = restRadius * (1 + (pressure / 6) * (maxExpansion - 1));

        const cx = W / 2;
        const topY = (H - currentLength) / 2;
        const botY = topY + currentLength;

        // Draw compressed air glow
        if (pressure > 0) {
            const glowGrad = ctx.createRadialGradient(cx, (topY + botY) / 2, 0, cx, (topY + botY) / 2, currentRadius * 2);
            glowGrad.addColorStop(0, `rgba(0, 40, 85, ${pressure / 6 * 0.15})`);
            glowGrad.addColorStop(1, 'rgba(0, 40, 85, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, W, H);
        }

        // Draw inner bladder (rubber tube)
        const bladderRadius = currentRadius * 0.85;
        ctx.beginPath();
        ctx.moveTo(cx - bladderRadius * 0.6, topY + 10);
        ctx.bezierCurveTo(
            cx - bladderRadius, topY + currentLength * 0.2,
            cx - bladderRadius, botY - currentLength * 0.2,
            cx - bladderRadius * 0.6, botY - 10
        );
        ctx.lineTo(cx + bladderRadius * 0.6, botY - 10);
        ctx.bezierCurveTo(
            cx + bladderRadius, botY - currentLength * 0.2,
            cx + bladderRadius, topY + currentLength * 0.2,
            cx + bladderRadius * 0.6, topY + 10
        );
        ctx.closePath();

        const bladderGrad = ctx.createLinearGradient(cx - bladderRadius, 0, cx + bladderRadius, 0);
        bladderGrad.addColorStop(0, `rgba(0, 120, 180, ${0.3 + pressure / 6 * 0.4})`);
        bladderGrad.addColorStop(0.5, `rgba(0, 40, 85, ${0.4 + pressure / 6 * 0.4})`);
        bladderGrad.addColorStop(1, `rgba(0, 120, 180, ${0.3 + pressure / 6 * 0.4})`);
        ctx.fillStyle = bladderGrad;
        ctx.fill();

        // Draw braided mesh pattern
        const braidLines = 14;
        const segments = 30;
        ctx.lineWidth = 1.5;

        for (let b = 0; b < braidLines; b++) {
            ctx.beginPath();
            const phase = (b / braidLines) * Math.PI * 2;
            const dir = b % 2 === 0 ? 1 : -1;

            for (let s = 0; s <= segments; s++) {
                const t = s / segments;
                const y = topY + t * currentLength;

                // Calculate radius at this y position (bulging shape)
                const normalT = (t - 0.5) * 2; // -1 to 1
                const radiusAtY = currentRadius * (1 - normalT * normalT * 0.3);

                const angle = phase + dir * t * Math.PI * 6;
                const x = cx + Math.sin(angle) * radiusAtY * 0.55;

                if (s === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            const alpha = 0.6 + pressure / 6 * 0.3;
            ctx.strokeStyle = b % 2 === 0
                ? `rgba(180, 220, 255, ${alpha})`
                : `rgba(120, 200, 240, ${alpha})`;
            ctx.stroke();
        }

        // Draw top fitting
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(cx - 18, topY - 8, 36, 16);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 14, topY - 4, 28, 8);

        // Draw bottom fitting
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(cx - 18, botY - 8, 36, 16);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 14, botY - 4, 28, 8);

        // Draw air input arrow
        if (pressure > 0) {
            ctx.beginPath();
            ctx.moveTo(cx - 30, topY - 20);
            ctx.lineTo(cx, topY - 5);
            ctx.lineTo(cx + 30, topY - 20);
            ctx.strokeStyle = `rgba(0, 40, 85, ${0.3 + pressure / 6 * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Air particles flowing in
            const time = Date.now() / 1000;
            for (let i = 0; i < 5; i++) {
                const py = topY - 30 + ((time * 40 + i * 8) % 25);
                const px = cx + Math.sin(time * 3 + i) * 10;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 40, 85, ${0.5 + Math.sin(time + i) * 0.3})`;
                ctx.fill();
            }
        }

        // Draw weight/force indicator
        if (pressure > 0) {
            const force = pressure * 150; // simplified
            const weightY = botY + 20;
            ctx.beginPath();
            ctx.moveTo(cx, botY + 8);
            ctx.lineTo(cx, weightY + 15);
            ctx.strokeStyle = 'rgba(240, 192, 64, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, weightY + 22, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(240, 192, 64, 0.4)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(240, 192, 64, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Update readouts
        if (contrDisplay) contrDisplay.textContent = (contraction * 100).toFixed(1) + '%';
        if (forceDisplay) forceDisplay.textContent = (pressure * 150).toFixed(0) + ' N';
    }

    if (slider) {
        slider.addEventListener('input', (e) => {
            pressure = parseFloat(e.target.value);
            if (valDisplay) valDisplay.textContent = pressure.toFixed(1) + ' bar';
        });
    }

    // Animation loop
    function animLoop() {
        drawMuscle();
        requestAnimationFrame(animLoop);
    }
    animLoop();
}


// ===== BRAID ANGLE VISUALIZER =====
function initBraidAngleVis(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const slider = document.getElementById('braidAngleSlider');
    const valDisplay = document.getElementById('braidAngleVal');
    const volumeDisplay = document.getElementById('braidVolumeVal');

    let angle = 20;

    function drawVisualization() {
        ctx.clearRect(0, 0, W, H);

        // Calculate volume factor based on angle
        // V ∝ sin²(θ) * cos(θ), max at θ = 54.7°
        const theta = angle * Math.PI / 180;
        const volumeFactor = Math.sin(theta) * Math.sin(theta) * Math.cos(theta);
        const maxVolume = Math.sin(54.7 * Math.PI / 180) ** 2 * Math.cos(54.7 * Math.PI / 180);
        const normalizedVolume = volumeFactor / maxVolume;

        // LEFT SIDE: Draw the muscle shape at this angle
        const leftCx = W * 0.25;
        const muscleTopY = H * 0.12;
        const muscleH = H * 0.7;
        const baseRadius = W * 0.06;
        const currentRadius = baseRadius * (0.5 + normalizedVolume * 1.2);
        const currentLength = muscleH * (1.2 - normalizedVolume * 0.5);

        const muscleBottomY = muscleTopY + currentLength;

        // Muscle body  
        ctx.beginPath();
        ctx.moveTo(leftCx - currentRadius * 0.5, muscleTopY);
        ctx.bezierCurveTo(
            leftCx - currentRadius, muscleTopY + currentLength * 0.25,
            leftCx - currentRadius, muscleBottomY - currentLength * 0.25,
            leftCx - currentRadius * 0.5, muscleBottomY
        );
        ctx.lineTo(leftCx + currentRadius * 0.5, muscleBottomY);
        ctx.bezierCurveTo(
            leftCx + currentRadius, muscleBottomY - currentLength * 0.25,
            leftCx + currentRadius, muscleTopY + currentLength * 0.25,
            leftCx + currentRadius * 0.5, muscleTopY
        );
        ctx.closePath();

        const grad = ctx.createLinearGradient(leftCx - currentRadius, 0, leftCx + currentRadius, 0);
        grad.addColorStop(0, `rgba(0, 100, 180, 0.3)`);
        grad.addColorStop(0.5, `rgba(0, 180, 216, 0.4)`);
        grad.addColorStop(1, `rgba(0, 100, 180, 0.3)`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw braid lines at the current angle
        const braidCount = 8;
        for (let i = 0; i < braidCount; i++) {
            ctx.beginPath();
            const phase = (i / braidCount) * Math.PI * 2;
            const dir = i % 2 === 0 ? 1 : -1;
            const segments = 20;

            for (let s = 0; s <= segments; s++) {
                const t = s / segments;
                const y = muscleTopY + t * currentLength;
                const normalT = (t - 0.5) * 2;
                const rAtY = currentRadius * (1 - normalT * normalT * 0.25);
                const a = phase + dir * t * Math.PI * (angle / 15);
                const x = leftCx + Math.sin(a) * rAtY * 0.5;
                if (s === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(150, 210, 255, 0.6)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw angle indicator
        ctx.save();
        ctx.translate(leftCx, muscleTopY + 20);
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 50);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        // Angle line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(theta) * 50, Math.cos(theta) * 50);
        ctx.strokeStyle = 'rgba(240, 192, 64, 0.8)';
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.stroke();
        // Angle arc
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, theta);
        ctx.strokeStyle = 'rgba(240, 192, 64, 0.5)';
        ctx.lineWidth = 1.5;
        // Rotate to measure from vertical
        ctx.stroke();
        // Label
        ctx.fillStyle = '#b8860b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`θ = ${angle}°`, 10, 20);
        ctx.restore();

        // Fittings
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(leftCx - 12, muscleTopY - 5, 24, 10);
        ctx.fillRect(leftCx - 12, muscleBottomY - 5, 24, 10);

        // RIGHT SIDE: Volume vs Angle graph
        const graphLeft = W * 0.52;
        const graphRight = W * 0.95;
        const graphTop = H * 0.12;
        const graphBottom = H * 0.82;
        const graphW = graphRight - graphLeft;
        const graphH = graphBottom - graphTop;

        // Graph background
        ctx.fillStyle = 'rgba(0, 40, 85, 0.05)';
        ctx.fillRect(graphLeft, graphTop, graphW, graphH);
        ctx.strokeStyle = 'rgba(0,40,85,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(graphLeft, graphTop, graphW, graphH);

        // Grid lines
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(0,40,85,0.06)';
        for (let i = 1; i < 5; i++) {
            const gy = graphTop + (graphH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(graphLeft, gy);
            ctx.lineTo(graphRight, gy);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Plot volume curve
        ctx.beginPath();
        for (let deg = 0; deg <= 90; deg++) {
            const th = deg * Math.PI / 180;
            const vol = Math.sin(th) * Math.sin(th) * Math.cos(th) / maxVolume;
            const x = graphLeft + (deg / 90) * graphW;
            const y = graphBottom - vol * graphH;
            if (deg === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        const lineGrad = ctx.createLinearGradient(graphLeft, 0, graphRight, 0);
        lineGrad.addColorStop(0, '#002855');
        lineGrad.addColorStop(0.6, '#5a2d82');
        lineGrad.addColorStop(1, '#c0392b');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(graphRight, graphBottom);
        ctx.lineTo(graphLeft, graphBottom);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, graphTop, 0, graphBottom);
        fillGrad.addColorStop(0, 'rgba(0, 40, 85, 0.12)');
        fillGrad.addColorStop(1, 'rgba(0, 40, 85, 0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // 54.7° reference line
        const refX = graphLeft + (54.7 / 90) * graphW;
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(refX, graphTop);
        ctx.lineTo(refX, graphBottom);
        ctx.strokeStyle = 'rgba(240, 192, 64, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // 54.7 label
        ctx.fillStyle = '#b8860b';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('54.7°', refX - 15, graphTop - 8);
        ctx.fillText('Maks. Hacim', refX - 30, graphTop - 22);

        // Current angle indicator
        const curX = graphLeft + (angle / 90) * graphW;
        const curTh = angle * Math.PI / 180;
        const curVol = Math.sin(curTh) * Math.sin(curTh) * Math.cos(curTh) / maxVolume;
        const curY = graphBottom - curVol * graphH;

        // Vertical line from current position
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX, graphBottom);
        ctx.strokeStyle = 'rgba(0, 40, 85, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Current point
        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#002855';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 40, 85, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(curX, curY, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = 'rgba(0,40,85,0.5)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Örgü Açısı (°)', graphLeft + graphW / 2 - 35, graphBottom + 22);
        ctx.save();
        ctx.translate(graphLeft - 12, graphTop + graphH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Hacim', -15, 0);
        ctx.restore();

        // X axis labels
        ctx.fillStyle = 'rgba(0,40,85,0.35)';
        ctx.font = '9px Inter, sans-serif';
        for (let d = 0; d <= 90; d += 15) {
            const lx = graphLeft + (d / 90) * graphW;
            ctx.fillText(d + '°', lx - 8, graphBottom + 12);
        }

        // Update displays
        if (volumeDisplay) volumeDisplay.textContent = (normalizedVolume * 100).toFixed(1) + '%';
    }

    let userInteracted = false;
    let autoTime = 0;

    if (slider) {
        slider.addEventListener('input', (e) => {
            userInteracted = true;
            angle = parseFloat(e.target.value);
            if (valDisplay) valDisplay.textContent = angle.toFixed(0) + '°';
        });
        
        // Touch interaction marks as interacted
        slider.addEventListener('mousedown', () => { userInteracted = true; });
        slider.addEventListener('touchstart', () => { userInteracted = true; });
    }

    function animLoop() {
        if (!userInteracted) {
            autoTime += 0.01;
            // Sweep between 10 and 80 degrees
            angle = 45 + Math.sin(autoTime) * 35; 
            if (slider) slider.value = angle;
            if (valDisplay) valDisplay.textContent = angle.toFixed(0) + '°';
        }
        
        drawVisualization();
        requestAnimationFrame(animLoop);
    }
    animLoop();
}


// ===== PNEUMATIC SYSTEM FLOW =====
function initSystemFlow(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    let particles = [];
    const compressorX = W * 0.08;
    const tankX = W * 0.30;
    const valveX = W * 0.55;
    const pamX = W * 0.80;
    const pipeY = H * 0.5;

    // Interactive Element State
    let valveOpenness = 0; // 0 to 100
    let pamSwelling = 0; // visual swelling factor based on continuous air flow

    const valveSlider = document.getElementById('valveSlider');
    const valveValDisplay = document.getElementById('valveVal');
    if (valveSlider) {
        valveSlider.addEventListener('input', (e) => {
            valveOpenness = parseInt(e.target.value);
            if(valveValDisplay) {
                valveValDisplay.textContent = `%${valveOpenness}` + (valveOpenness === 0 ? ' (Kapalı)' : (valveOpenness === 100 ? ' (Tam Açık)' : ''));
            }
        });
    }

    // Pipe path points
    const pipePathBeforeValve = [
        { x: compressorX + 45, y: pipeY },
        { x: tankX - 35, y: pipeY },
        { x: tankX + 35, y: pipeY },
        { x: valveX - 30, y: pipeY }
    ];

    const pipePathAfterValve = [
        { x: valveX + 30, y: pipeY },
        { x: pamX - 30, y: pipeY },
    ];

    class FlowParticle {
        constructor(isBeforeValve) {
            this.isBeforeValve = isBeforeValve;
            this.progress = Math.random();
            this.speed = isBeforeValve ? (0.005 + Math.random() * 0.005) : 0; 
            this.size = 2 + Math.random() * 2;
            this.opacity = 0.4 + Math.random() * 0.4;
        }
        update() {
            // Before valve: constant flow to simulate pressure build-up
            // After valve: speed depends strictly on valve openness
            
            let currentSpeed = this.isBeforeValve ? this.speed : (valveOpenness / 100) * 0.02;
            
            // If we are before the valve and valve is closed, let particles slowly crawl to a stop near the valve
            if(this.isBeforeValve && valveOpenness === 0 && this.progress > 0.9) {
                currentSpeed *= 0.1; 
            }

            this.progress += currentSpeed;
            if (this.progress > 1) this.progress = 0;
        }
        getPosition() {
            const path = this.isBeforeValve ? pipePathBeforeValve : pipePathAfterValve;
            const totalLen = path.length - 1;
            const seg = Math.max(0, Math.min(totalLen - 1, Math.floor(this.progress * totalLen)));
            const t = (this.progress * totalLen) - seg;
            const p1 = path[seg];
            const p2 = path[Math.min(seg + 1, path.length - 1)];
            
            if(!p1 || !p2) return {x: 0, y: 0}; // Safety

            return {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t + Math.sin(Date.now() / 200 + this.progress * 10) * 3
            };
        }
    }

    // Populate particles
    for (let i = 0; i < 30; i++) particles.push(new FlowParticle(true)); // Before valve
    for (let i = 0; i < 20; i++) particles.push(new FlowParticle(false)); // After valve

    function drawComponent(x, y, icon, label, color, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, 0.1)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${color}, 0.4)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${0.1 * scale})`; // Glow increases
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a1a2e';
        ctx.fillText(icon, 0, -2);
        
        ctx.restore();

        // Label (not scaled so it remains readable)
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = `rgba(0,0,0,0.7)`;
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 48);
    }

    function drawPipes() {
        ctx.beginPath();
        ctx.moveTo(compressorX + 45, pipeY);
        ctx.lineTo(pamX - 30, pipeY);
        ctx.strokeStyle = 'rgba(0,40,85,0.12)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(compressorX + 45, pipeY);
        ctx.lineTo(pamX - 30, pipeY);
        ctx.strokeStyle = 'rgba(0, 40, 85, 0.06)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        drawPipes();

        particles.forEach(p => {
            p.update();
            const pos = p.getPosition();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 180, 216, ${p.opacity + (valveOpenness/200)})`; // Glow brighter if open
            ctx.fill();
        });

        // Compute PAM swelling
        if (valveOpenness > 0) {
            pamSwelling += (valveOpenness / 100) * 0.02; // Inflate
        } else {
            pamSwelling -= 0.05; // Deflate
        }
        pamSwelling = Math.max(0, Math.min(1, pamSwelling));
        const pamScale = 1 + pamSwelling * 0.2; // Expand up to 20%

        drawComponent(compressorX, pipeY, '⚙️', 'Kompresör', '100, 200, 255');
        drawComponent(tankX, pipeY, '🛢️', 'Tank', '67, 97, 238');
        drawComponent(valveX, pipeY, '🔧', 'Valf', `${124 + valveOpenness}, 58, 237`); // Shifts color slightly based on open state
        drawComponent(pamX, pipeY, '💪', 'PAM', '0, 180, 216', pamScale);

        requestAnimationFrame(draw);
    }
    draw();
}

// ===== STATIK MODEL INTERACTIVITY =====
function initStatikModel() {
    const pSlider = document.getElementById('statik-p-slider');
    const dSlider = document.getElementById('statik-d-slider');
    const pVal = document.getElementById('statik-p-val');
    const dVal = document.getElementById('statik-d-val');
    const forceVal = document.getElementById('statik-force-val');
    const forceBar = document.getElementById('statik-force-bar');

    if (!pSlider || !dSlider || !forceVal) return;

    function updateStatikModel() {
        // Provide sliders values
        const P = parseFloat(pSlider.value);
        const D0 = parseFloat(dSlider.value);
        
        // Update display text
        pVal.textContent = (P / 1000).toFixed(0) + ' kPa';
        dVal.textContent = D0.toFixed(3) + ' m';
        
        // Calculation of Force
        // F = (pi * D0^2 / 4) * P * (a(1)^2 - b) assuming epsilon=0 for static max force demonstration
        // For standard McKibben at 0 contraction: a=3/(tan(theta)^2), b=1 / sin(theta)^2
        // Let's simplify with arbitrary realistic constants to show relationship:
        const area = Math.PI * Math.pow(D0, 2) / 4;
        const force = area * P * 1.5; // abstract multiplier representing (a-b) at epsilon=0
        
        forceVal.textContent = force.toFixed(0) + " N";
        
        // Calculate max theoretical force in this slider range for the bar percentage
        const maxP = parseFloat(pSlider.max);
        const maxD0 = parseFloat(dSlider.max);
        const maxArea = Math.PI * Math.pow(maxD0, 2) / 4;
        const maxForce = maxArea * maxP * 1.5;
        
        const percentage = (force / maxForce) * 100;
        forceBar.style.width = percentage + "%";
        
        // Color shifting based on force
        if(percentage < 33) {
            forceVal.style.color = 'var(--accent-blue)';
        } else if(percentage < 66) {
            forceVal.style.color = 'var(--accent-gold)';
        } else {
            forceVal.style.color = 'var(--accent-red)';
        }
    }

    pSlider.addEventListener('input', updateStatikModel);
    dSlider.addEventListener('input', updateStatikModel);
    
    // Initial call
    updateStatikModel();
}

// Hook into DOM loaded to safely initialize dynamic elements not tracked globally
document.addEventListener('DOMContentLoaded', () => {
    // Statik model doesn't need canvas, just DOM
    initStatikModel();
});
