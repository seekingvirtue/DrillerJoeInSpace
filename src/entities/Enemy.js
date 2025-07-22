// Base class for all enemy types using old-style JavaScript
function Enemy(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.isDestroyed = false;
    this.hitPoints = 1; // All enemies have 1 hit point in current design
    this.scoreValue = 0; // Base score value, will be overridden by specific enemy types
    this.pulseTime = Math.random() * Math.PI * 2; // Random start phase for color pulse
    this.pulseSpeed = 0.1; // How fast the color pulses
    
    // Explosion properties
    this.isExploding = false;
    this.explosionTimer = 0;
    this.explosionDuration = 1.5; // 1.5 seconds explosion animation
    this.particles = [];
}

Enemy.prototype.update = function(deltaTime, canvas) {
    // Handle explosion animation
    if (this.isExploding) {
        this.explosionTimer += deltaTime;
        this.updateExplosion(deltaTime);
        
        // Mark as destroyed when explosion finishes
        if (this.explosionTimer >= this.explosionDuration) {
            this.isDestroyed = true;
        }
        return; // Don't update movement while exploding
    }
    
    // Base enemy update - each enemy type will override this
    // Update movement timer for animation patterns
    if (!this.movementTimer) this.movementTimer = 0;
    this.movementTimer += deltaTime;
    
    // Keep enemies within screen bounds
    this.constrainToBounds(canvas);
};

Enemy.prototype.draw = function(ctx) {
    // If exploding, draw explosion instead of enemy
    if (this.isExploding) {
        this.drawExplosion(ctx);
        return;
    }
    
    // Each enemy type will override this with their specific shape
};

Enemy.prototype.drawProjectile = function(ctx, scale) {
    // Common projectile drawing for all enemies
    // Scale parameter makes the "star" appear to get bigger as it approaches
    ctx.save();
    ctx.fillStyle = '#ff3030'; // Alert Red from art style guide
    ctx.beginPath();
    // Draw an 8-pointed star that flashes and scales up
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        const x = Math.cos(angle) * (5 * scale);
        const y = Math.sin(angle) * (5 * scale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

Enemy.prototype.getPulsingColor = function() {
    // Update pulse time
    this.pulseTime += this.pulseSpeed;
    
    // Calculate pulse value (0 to 1)
    const pulse = (Math.sin(this.pulseTime) + 1) / 2;
    
    // Base color is red (#ff3030)
    const r = 255;
    const g = Math.floor(48 + pulse * 80); // Pulse between darker and brighter orange/red
    const b = Math.floor(48 + pulse * 80);
    
    return `rgb(${r}, ${g}, ${b})`;
};

Enemy.prototype.onDestroy = function(audioSystem) {
    // Start the explosion animation and play sound
    this.startExplosion(audioSystem);
};

// Start explosion animation
Enemy.prototype.startExplosion = function(audioSystem) {
    this.isExploding = true;
    this.explosionTimer = 0;
    this.createExplosionParticles();
    
    // Play explosion sound effect if audio system is available
    if (audioSystem) {
        audioSystem.playSfx('explosionCombatMode');
    }
};

// Create fireworks-style explosion particles
Enemy.prototype.createExplosionParticles = function() {
    const particleCount = 15 + Math.random() * 10; // 15-25 particles
    this.particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Random direction for each particle
        const angle = (Math.PI * 2) * Math.random();
        const speed = 50 + Math.random() * 100; // Random speed 50-150
        
        const particle = {
            x: 0, // Relative to enemy position
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0, // Full life at start
            maxLife: 0.8 + Math.random() * 0.7, // Particles die at different times
            size: 2 + Math.random() * 3, // Random size 2-5
            color: this.getParticleColor(i, particleCount)
        };
        
        this.particles.push(particle);
    }
};

// Get color for explosion particles (fireworks style)
Enemy.prototype.getParticleColor = function(index, total) {
    const colors = [
        '#ff6b35', // Orange
        '#f7931e', // Yellow-orange  
        '#ffff00', // Yellow
        '#ff3030', // Red
        '#ff8c42', // Light orange
        '#ffffff', // White (sparks)
        '#ffd700'  // Gold
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
};

// Update explosion animation
Enemy.prototype.updateExplosion = function(deltaTime) {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        
        // Update position
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // Add gravity effect
        particle.vy += 30 * deltaTime; // Slight downward acceleration
        
        // Reduce life
        particle.life -= deltaTime / particle.maxLife;
        
        // Remove dead particles
        if (particle.life <= 0) {
            this.particles.splice(i, 1);
        }
    }
};

// Draw fireworks-style explosion
Enemy.prototype.drawExplosion = function(ctx) {
    ctx.save();
    
    // Draw each particle
    for (let particle of this.particles) {
        // Calculate alpha based on particle life
        const alpha = Math.max(0, particle.life);
        
        // Set particle color with fade-out
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        
        // Draw particle as a circle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a bright center for spark effect
        if (alpha > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
};

// Get the actual collision radius based on Z-depth scaling
Enemy.prototype.getCollisionRadius = function() {
    const scale = 1 / this.z;
    return (this.size * scale) / 2; // Return half the scaled size as radius
};

// Test method to trigger explosion (for testing before collision detection)
Enemy.prototype.triggerTestExplosion = function(audioSystem) {
    this.onDestroy(audioSystem);
};

// Basic enemy type - TIE Fighter style
function BasicEnemy(x, y, z) {
    Enemy.call(this, x, y, z);
    this.speed = 1; // Slowest speed
    this.size = 60; // Increased from 40 - more visible against larger bullets
    this.scoreValue = 1; // TIE Fighter worth 1 point
}

BasicEnemy.prototype = Object.create(Enemy.prototype);
BasicEnemy.prototype.constructor = BasicEnemy;

BasicEnemy.prototype.update = function(deltaTime, canvas) {
    // Call parent update first
    Enemy.prototype.update.call(this, deltaTime, canvas);
    
    // Enhanced movement pattern - circular + random direction changes
    const speed = this.speed * 2; // Double the speed
    
    // Base circular motion
    this.x += Math.sin(this.movementTimer * 1.5) * speed * deltaTime * 60;
    this.y += Math.cos(this.movementTimer * 1.2) * speed * 0.8 * deltaTime * 60;
    
    // Add random direction changes every 2 seconds
    if (Math.floor(this.movementTimer * 0.5) !== Math.floor((this.movementTimer - deltaTime) * 0.5)) {
        this.randomOffsetX = (Math.random() - 0.5) * 200;
        this.randomOffsetY = (Math.random() - 0.5) * 150;
    }
    
    // Apply random offset
    if (!this.randomOffsetX) this.randomOffsetX = 0;
    if (!this.randomOffsetY) this.randomOffsetY = 0;
    this.x += this.randomOffsetX * deltaTime * 0.5;
    this.y += this.randomOffsetY * deltaTime * 0.5;
    
    // More aggressive Z movement - swooping closer and further
    this.z += Math.sin(this.movementTimer * 0.8) * 1.2 * deltaTime;
    
    // Constrain to screen bounds
    this.constrainToBounds(canvas);
};

BasicEnemy.prototype.draw = function(ctx) {
    // Check if exploding first
    if (this.isExploding) {
        this.drawExplosion(ctx);
        return;
    }
    
    ctx.save();
    
    // Calculate scale based on Z-depth (closer = bigger, further = smaller)
    const scale = 1 / this.z;
    const scaledSize = this.size * scale;
    
    ctx.strokeStyle = this.getPulsingColor();
    ctx.lineWidth = 2 * scale; // Scale line width too

    const cockpitRadius = scaledSize/4;
    const wingOffset = scaledSize/2;  // Distance from center to wing center
    
    // Draw the spherical cockpit (filled red center with white outline)
    ctx.beginPath();
    ctx.arc(0, 0, cockpitRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000'; // Red fill
    ctx.fill();
    ctx.stroke(); // White outline

    // Draw the hexagonal wing panels
    for (let side = 0; side < 2; side++) {
        const wingX = side === 0 ? -wingOffset : wingOffset;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = wingX + Math.cos(angle) * cockpitRadius;
            const py = Math.sin(angle) * cockpitRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    ctx.restore();
};

// Fast enemy type - X-Wing style
function FastEnemy(x, y, z) {
    Enemy.call(this, x, y, z);
    this.speed = 2; // 2x speed of basic enemy
    this.size = 90; // Increased from 70 - more visible against larger bullets
    this.scoreValue = 2; // X-Wing worth 2 points
}

FastEnemy.prototype = Object.create(Enemy.prototype);
FastEnemy.prototype.constructor = FastEnemy;

FastEnemy.prototype.update = function(deltaTime, canvas) {
    // Call parent update first
    Enemy.prototype.update.call(this, deltaTime, canvas);
    
    // Highly erratic movement - like a fighter pilot
    const speed = this.speed * 3; // Triple the speed for fast enemy
    
    // Rapid direction changes with different frequencies
    this.x += Math.sin(this.movementTimer * 4) * speed * deltaTime * 60;
    this.y += Math.cos(this.movementTimer * 3.2) * speed * deltaTime * 60;
    
    // Add strafing runs - sudden bursts of movement
    if (Math.floor(this.movementTimer * 2) !== Math.floor((this.movementTimer - deltaTime) * 2)) {
        this.strafeX = (Math.random() - 0.5) * 400;
        this.strafeY = (Math.random() - 0.5) * 300;
        this.strafeTimer = 0.5; // Strafe for half a second
    }
    
    // Apply strafe movement
    if (!this.strafeTimer) this.strafeTimer = 0;
    if (this.strafeTimer > 0) {
        this.strafeTimer -= deltaTime;
        this.x += (this.strafeX || 0) * deltaTime * 2;
        this.y += (this.strafeY || 0) * deltaTime * 2;
    }
    
    // Very aggressive Z movement - darting attacks
    this.z += Math.sin(this.movementTimer * 2.5) * 1.8 * deltaTime;
    
    // Random evasive maneuvers
    this.x += (Math.random() - 0.5) * speed * 0.5 * deltaTime * 60;
    this.y += (Math.random() - 0.5) * speed * 0.5 * deltaTime * 60;
    
    // Constrain to screen bounds
    this.constrainToBounds(canvas);
};

FastEnemy.prototype.draw = function(ctx) {
    // Check if exploding first
    if (this.isExploding) {
        this.drawExplosion(ctx);
        return;
    }
    
    ctx.save();
    
    // Calculate scale based on Z-depth (closer = bigger, further = smaller)
    const scale = 1 / this.z;
    const scaledSize = this.size * scale;
    
    ctx.strokeStyle = this.getPulsingColor();
    ctx.lineWidth = 2 * scale; // Scale line width too

    // Draw the X-wings
    const wingSpread = scaledSize * 0.8;
    ctx.beginPath();
    // Top left wing
    ctx.moveTo(-wingSpread, -wingSpread);
    ctx.lineTo(0, 0);
    // Top right wing
    ctx.moveTo(wingSpread, -wingSpread);
    ctx.lineTo(0, 0);
    // Bottom left wing
    ctx.moveTo(-wingSpread, wingSpread);
    ctx.lineTo(0, 0);
    // Bottom right wing
    ctx.moveTo(wingSpread, wingSpread);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Draw the fuselage
    ctx.beginPath();
    ctx.moveTo(0, -scaledSize/2);
    ctx.lineTo(0, scaledSize/2);
    ctx.stroke();

    // Draw the solid cockpit
    const cockpitSize = scaledSize * 0.6; // Increased size for visibility
    ctx.fillStyle = this.getPulsingColor();
    ctx.fillRect(-cockpitSize/2, -cockpitSize/2, cockpitSize, cockpitSize);

    ctx.restore();
};

// Override collision radius for FastEnemy to make it easier to hit
FastEnemy.prototype.getCollisionRadius = function() {
    const scale = 1 / this.z;
    // Use a larger hit box multiplier for the fast, agile X-wing
    return (this.size * scale * 0.8); // 60% larger hit box than visual size
};

// Elite enemy type - Star Destroyer style
function EliteEnemy(x, y, z) {
    Enemy.call(this, x, y, z);
    this.speed = 2; // Same speed as fast enemy
    this.size = 75; // Increased from 50 - more visible against larger bullets
    this.scoreValue = 3; // Star Destroyer worth 3 points
    this.hitPoints = 3; // Takes 3 hits to destroy
    
    // Hit flash effect properties
    this.hitFlashTimer = 0;
    this.hitFlashDuration = 15; // Flash for 15 frames (1/4 second at 60fps)
    this.isFlashing = false;
}

EliteEnemy.prototype = Object.create(Enemy.prototype);
EliteEnemy.prototype.constructor = EliteEnemy;

EliteEnemy.prototype.update = function(deltaTime, canvas) {
    // Call parent update first
    Enemy.prototype.update.call(this, deltaTime, canvas);
    
    // Update hit flash timer
    if (this.hitFlashTimer > 0) {
        this.hitFlashTimer--;
        this.isFlashing = true;
    } else {
        this.isFlashing = false;
    }
    
    // Advanced tactical movement - adaptive and strategic
    const baseSpeed = this.speed * 1.5;
    
    // Phase-based movement pattern that changes strategy
    const phase = Math.floor(this.movementTimer * 0.3) % 4;
    
    switch(phase) {
        case 0: // Orbital pattern - circling for positioning
            const orbitRadius = 100;
            const orbitSpeed = 1.5;
            this.x += Math.cos(this.movementTimer * orbitSpeed) * orbitRadius * deltaTime;
            this.y += Math.sin(this.movementTimer * orbitSpeed) * orbitRadius * deltaTime;
            break;
            
        case 1: // Hunting pattern - tracking movement
            this.x += Math.sin(this.movementTimer * 0.8) * baseSpeed * deltaTime * 60;
            this.y += Math.cos(this.movementTimer * 0.6) * baseSpeed * 0.7 * deltaTime * 60;
            break;
            
        case 2: // Evasive pattern - defensive maneuvers
            this.x += Math.sin(this.movementTimer * 2.2) * baseSpeed * 0.8 * deltaTime * 60;
            this.y += Math.cos(this.movementTimer * 1.8) * baseSpeed * 1.2 * deltaTime * 60;
            break;
            
        case 3: // Attack pattern - aggressive positioning
            this.x += Math.sin(this.movementTimer * 1.2) * baseSpeed * 1.3 * deltaTime * 60;
            this.y += Math.cos(this.movementTimer * 1.4) * baseSpeed * 0.9 * deltaTime * 60;
            break;
    }
    
    // Strategic Z movement - calculated depth changes
    this.z += Math.sin(this.movementTimer * 0.7 + phase) * 1.2 * deltaTime;
    
    // Add micro-adjustments for unpredictability
    if (Math.random() < 0.02) { // 2% chance per frame
        this.microAdjustX = (Math.random() - 0.5) * 80;
        this.microAdjustY = (Math.random() - 0.5) * 80;
        this.microTimer = 0.3;
    }
    
    // Apply micro-adjustments
    if (!this.microTimer) this.microTimer = 0;
    if (this.microTimer > 0) {
        this.microTimer -= deltaTime;
        this.x += (this.microAdjustX || 0) * deltaTime * 3;
        this.y += (this.microAdjustY || 0) * deltaTime * 3;
    }
    
    // Constrain to screen bounds
    this.constrainToBounds(canvas);
};

EliteEnemy.prototype.draw = function(ctx) {
    // Check if exploding first
    if (this.isExploding) {
        this.drawExplosion(ctx);
        return;
    }
    
    ctx.save();
    
    // Calculate scale based on Z-depth (closer = bigger, further = smaller)
    const scale = 1 / this.z;
    const scaledSize = this.size * scale;
    
    // Use hit flash color if flashing, otherwise normal pulsing color
    const strokeColor = this.isFlashing ? '#FFFFFF' : this.getPulsingColor();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2 * scale; // Scale line width too

    // Add glow effect when hit
    if (this.isFlashing) {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 10 * scale;
    }

    // Draw the triangular shape of the Star Destroyer
    ctx.beginPath();
    // Front point
    ctx.moveTo(0, -scaledSize);
    // Back corners
    ctx.lineTo(-scaledSize, scaledSize);
    ctx.lineTo(scaledSize, scaledSize);
    ctx.closePath();
    ctx.stroke();

    // Add deck level lines
    ctx.beginPath();
    // Bridge tower base
    const towerBaseY = -scaledSize * 0.3;
    ctx.moveTo(-scaledSize * 0.2, towerBaseY);
    ctx.lineTo(scaledSize * 0.2, towerBaseY);
    
    // Deck lines
    for (let i = 1; i <= 3; i++) {
        const y = scaledSize * (0.2 * i - 0.4);
        ctx.moveTo(-scaledSize * (1 - 0.2 * i), y);
        ctx.lineTo(scaledSize * (1 - 0.2 * i), y);
    }
    ctx.stroke();

    // Draw bridge tower
    ctx.beginPath();
    const towerWidth = scaledSize * 0.2;
    const towerHeight = scaledSize * 0.15;
    // Main tower structure
    ctx.moveTo(-towerWidth, towerBaseY);
    ctx.lineTo(-towerWidth * 0.8, towerBaseY - towerHeight);
    ctx.lineTo(towerWidth * 0.8, towerBaseY - towerHeight);
    ctx.lineTo(towerWidth, towerBaseY);
    ctx.stroke();

    // Shield generators (two domes on top)
    const domeRadius = towerWidth * 0.2;
    ctx.beginPath();
    ctx.arc(-towerWidth * 0.4, towerBaseY - towerHeight, domeRadius, 0, Math.PI, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(towerWidth * 0.4, towerBaseY - towerHeight, domeRadius, 0, Math.PI, true);
    ctx.stroke();

    ctx.restore();
};

EliteEnemy.prototype.onDestroy = function(audioSystem) {
    Enemy.prototype.onDestroy.call(this, audioSystem);
    // Spawn 4 basic enemies when destroyed
    // The actual spawning logic will be handled by the game system
    // This just signals that we need to spawn them
    this.spawnBasicEnemies = true;
};

// Trigger hit flash effect for Elite enemy
EliteEnemy.prototype.triggerHitFlash = function(audioSystem) {
    this.hitFlashTimer = this.hitFlashDuration;
    this.isFlashing = true;
    
    // Play hit sound effect
    if (audioSystem) {
        audioSystem.playSfx('eliteEnemyHit');
    }
};

// Utility method to keep enemies within crosshair-reachable bounds
Enemy.prototype.constrainToBounds = function(canvas) {
    const margin = this.size / 2; // Half the enemy size for proper edge detection
    
    // Crosshair is fixed at screen center (400, 300)
    // Player can move world view by maxWorldPosition (±300, ±200)
    // So enemies must stay within crosshair position ± world movement range
    const crosshairX = 400;
    const crosshairY = 300;
    const maxWorldX = 300; // From CombatMode.maxWorldPosition.x
    const maxWorldY = 200; // From CombatMode.maxWorldPosition.y
    
    // Calculate reachable bounds (world coordinates that crosshair can target)
    const minX = crosshairX - maxWorldX + margin;
    const maxX = crosshairX + maxWorldX - margin;
    const minY = crosshairY - maxWorldY + margin;
    const maxY = crosshairY + maxWorldY - margin;
    
    // Left boundary
    if (this.x < minX) {
        this.x = minX;
    }
    // Right boundary
    else if (this.x > maxX) {
        this.x = maxX;
    }
    
    // Top boundary
    if (this.y < minY) {
        this.y = minY;
    }
    // Bottom boundary
    else if (this.y > maxY) {
        this.y = maxY;
    }
    
    // Z-depth bounds (keep enemies visible)
    if (this.z < 0.3) {
        this.z = 0.3; // Don't let them get too close
    }
    else if (this.z > 5.0) {
        this.z = 5.0; // Don't let them get too far
    }
};
