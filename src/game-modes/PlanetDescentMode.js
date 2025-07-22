/**
 * Planet Descent Mode
 * Handles the descent animation when approaching enemy planets
 */
class PlanetDescentMode {
    constructor(game) {
        this.game = game;
        
        // Animation state
        this.descentActive = false;
        this.descentTimer = 0;
        this.descentDuration = 240; // 4 seconds at 60fps
        this.flashTimer = 0;
        
        // Sound timing
        this.soundDelayTimer = 0;
        this.soundDelayDuration = 60; // 1 second delay before playing sound
        this.soundPlayed = false;
        
        // Emergency repair system
        this.emergencyRepairs = false;
        this.originalHealth = 0;
        this.repairedHealth = 0;
        
        // Animation elements
        this.planetPosition = { x: 400, y: 300 };
        this.planetRadius = 80;
        this.shipPosition = { x: 400, y: 100 };
        this.shipSize = 30;
        
        // Crater positions (random but consistent during animation)
        this.craters = this.generateCraters();
        
        console.log('PlanetDescentMode initialized');
    }
    
    generateCraters() {
        const craters = [];
        const numCraters = 8;
        
        for (let i = 0; i < numCraters; i++) {
            // Generate random positions on the planet surface
            const angle = (Math.PI * 2 * i) / numCraters + Math.random() * 0.5;
            const distance = 20 + Math.random() * 40; // Distance from planet center
            const size = 3 + Math.random() * 8; // Crater size
            
            craters.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: size
            });
        }
        
        return craters;
    }
    
    enter() {
        console.log('Entered PlanetDescentMode - Descending to Enemy Planet');
        
        // Check for emergency repairs needed
        const currentHealth = this.game.gameState.player.health;
        this.originalHealth = currentHealth;
        this.emergencyRepairs = false;
        
        if (currentHealth <= 2) {
            // Emergency field repairs during descent
            this.repairedHealth = 3 + Math.floor(Math.random() * 2); // 3-4 health
            this.game.gameState.player.health = this.repairedHealth;
            this.emergencyRepairs = true;
            console.log(`Emergency repairs activated: ${currentHealth} -> ${this.repairedHealth} health`);
        }
        
        // Reset animation state
        this.descentActive = true;
        this.descentTimer = this.descentDuration;
        this.flashTimer = 0;
        
        // Reset sound timing
        this.soundDelayTimer = this.soundDelayDuration;
        this.soundPlayed = false;
        
        // Reset ship position for animation
        this.shipPosition = { x: 400, y: 100 };
        this.shipSize = 30;
        
        // Stop any background music
        this.game.audioSystem.stopMusic();
    }
    
    exit() {
        console.log('Exited PlanetDescentMode');
    }
    
    update() {
        if (this.descentActive) {
            // Update timers
            this.descentTimer--;
            this.flashTimer++;
            
            // Handle sound delay and play
            if (!this.soundPlayed && this.soundDelayTimer > 0) {
                this.soundDelayTimer--;
                if (this.soundDelayTimer <= 0) {
                    // Play the sound effect after 1 second delay
                    this.game.audioSystem.playSfx('enteringEnemyOrbit');
                    this.soundPlayed = true;
                    console.log('Playing entering enemy orbit sound');
                }
            }
            
            // Update ship position and size for descent animation
            const progress = 1 - (this.descentTimer / this.descentDuration);
            
            // Ship moves toward planet and gets smaller
            this.shipPosition.y = 100 + (progress * 120); // Move from y=100 to y=220
            this.shipSize = 30 - (progress * 15); // Shrink from 30 to 15
            
            // End animation when timer reaches 0
            if (this.descentTimer <= 0) {
                this.descentActive = false;
                console.log('Planet descent animation complete - launching enemy planet mission');
                
                // Launch the River Raid-style enemy planet mission
                this.game.switchToMode('enemyPlanetMission');
            }
        }
        
        // Handle input to skip animation
        this.handleInput();
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Allow skipping animation with fire button
        if (this.descentActive && input.isFirePressed()) {
            this.skipAnimation();
        }
    }
    
    skipAnimation() {
        console.log('Descent animation skipped');
        this.descentActive = false;
        
        // Stop the sound if it hasn't finished
        this.game.audioSystem.stopSfx('enteringEnemyOrbit');
        
        // Launch the River Raid-style enemy planet mission
        this.game.switchToMode('enemyPlanetMission');
    }
    
    render(renderer) {
        if (this.descentActive) {
            this.renderDescentScreen(renderer);
        }
    }
    
    renderDescentScreen(renderer) {
        // Clear with deep space black
        renderer.clear('#000008');
        
        // Calculate animation progress and flashing
        const progress = 1 - (this.descentTimer / this.descentDuration);
        const flashPhase = Math.floor(this.flashTimer / 10) % 2; // Flash every 10 frames
        
        // Draw background stars
        this.renderSpaceBackground(renderer);
        
        // Draw the enemy planet (red with craters)
        this.renderEnemyPlanet(renderer);
        
        // Draw the descending ship (triangle)
        this.renderDescentShip(renderer);
        
        // Draw the main message
        const messageColor = flashPhase === 0 ? '#FF0000' : '#FFFF00';
        renderer.drawText('ENTERING ENEMY ORBIT', 400, 150, messageColor, 32, 'Courier New');
        
        // Draw progress/instruction text
        if (this.emergencyRepairs) {
            renderer.drawText('EMERGENCY FIELD REPAIRS COMPLETE', 400, 420, '#00FF00', 16, 'Courier New');
            renderer.drawText(`HEALTH RESTORED: ${this.originalHealth} -> ${this.repairedHealth}`, 400, 440, '#00FFFF', 14, 'Courier New');
            renderer.drawText('PREPARE FOR PLANETARY ASSAULT', 400, 470, '#FF6666', 16, 'Courier New');
        } else {
            renderer.drawText('PREPARE FOR PLANETARY ASSAULT', 400, 450, '#FF6666', 16, 'Courier New');
        }
        renderer.drawText('Press FIRE to skip animation', 400, 520, '#888888', 12, 'Courier New');
        
        // Draw warning borders
        this.renderWarningBorders(renderer, flashPhase);
    }
    
    renderSpaceBackground(renderer) {
        // Simple starfield background
        const ctx = renderer.ctx;
        ctx.save();
        
        // Generate some stars
        const starCount = 100;
        for (let i = 0; i < starCount; i++) {
            const x = (i * 37) % 800; // Pseudo-random distribution
            const y = (i * 73) % 600;
            const brightness = 0.3 + 0.4 * Math.sin(i * 0.5);
            const size = 1 + Math.sin(i * 0.3) * 0.5;
            
            ctx.globalAlpha = brightness;
            renderer.drawCircle(x, y, size, '#FFFFFF');
        }
        
        ctx.restore();
    }
    
    renderEnemyPlanet(renderer) {
        const ctx = renderer.ctx;
        
        // Draw main planet body (red)
        ctx.save();
        ctx.translate(this.planetPosition.x, this.planetPosition.y);
        
        // Planet shadow/gradient effect
        const gradient = ctx.createRadialGradient(-20, -20, 0, 0, 0, this.planetRadius);
        gradient.addColorStop(0, '#FF4444');
        gradient.addColorStop(0.7, '#CC0000');
        gradient.addColorStop(1, '#880000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.planetRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw craters (darker red circles)
        ctx.fillStyle = '#660000';
        for (const crater of this.craters) {
            ctx.beginPath();
            ctx.arc(crater.x, crater.y, crater.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner crater shadow
            ctx.fillStyle = '#440000';
            ctx.beginPath();
            ctx.arc(crater.x + 1, crater.y + 1, crater.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#660000'; // Reset for next crater
        }
        
        // Planet outline
        ctx.strokeStyle = '#FF6666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.planetRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderDescentShip(renderer) {
        const ctx = renderer.ctx;
        
        ctx.save();
        ctx.translate(this.shipPosition.x, this.shipPosition.y);
        
        // Draw triangle ship (pointing down toward planet)
        ctx.fillStyle = '#00FFFF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -this.shipSize); // Top point
        ctx.lineTo(-this.shipSize * 0.6, this.shipSize * 0.5); // Bottom left
        ctx.lineTo(this.shipSize * 0.6, this.shipSize * 0.5); // Bottom right
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Engine trail effect
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.moveTo(-this.shipSize * 0.3, this.shipSize * 0.5);
        ctx.lineTo(0, this.shipSize * 1.2);
        ctx.lineTo(this.shipSize * 0.3, this.shipSize * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    renderWarningBorders(renderer, flashPhase) {
        if (flashPhase === 0) {
            const ctx = renderer.ctx;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            
            // Top and bottom warning stripes
            for (let i = 0; i < 5; i++) {
                const y1 = i * 8;
                const y2 = 600 - (i * 8);
                
                ctx.beginPath();
                ctx.moveTo(0, y1);
                ctx.lineTo(800, y1);
                ctx.moveTo(0, y2);
                ctx.lineTo(800, y2);
                ctx.stroke();
            }
        }
    }
}
