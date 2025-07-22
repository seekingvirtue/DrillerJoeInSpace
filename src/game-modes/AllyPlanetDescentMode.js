/**
 * Ally Planet Descent Mode
 * Handles the descent animation when approaching ally planets (Earth-like)
 */
class AllyPlanetDescentMode {
    constructor(game) {
        this.game = game;
        
        // Animation state
        this.descentActive = false;
        this.descentTimer = 0;
        this.descentDuration = 240; // 4 seconds at 60fps
        this.flashTimer = 0;
        
        // Success message state
        this.showingMessages = false;
        this.messageTimer = 0;
        this.messageDuration = 300; // 5 seconds at 60fps for messages
        this.currentMessage = 0;
        this.messages = [
            'BEER DELIVERED SUCCESSFULLY!',
            'SHIP REPAIRED BY BEER POWER!'
        ];
        this.messageAlpha = 0;
        this.messageCompleted = false;
        
        // Sound timing
        this.soundDelayTimer = 0;
        this.soundDelayDuration = 60; // 1 second delay before playing sound
        this.soundPlayed = false;
        
        // Animation elements
        this.planetPosition = { x: 400, y: 300 };
        this.planetRadius = 80;
        this.shipPosition = { x: 400, y: 100 };
        this.shipSize = 30;
        
        // Earth-like features (continents, oceans, clouds)
        this.continents = this.generateContinents();
        this.clouds = this.generateClouds();
        
        console.log('AllyPlanetDescentMode initialized');
    }
    
    generateContinents() {
        const continents = [];
        const numContinents = 6;
        
        for (let i = 0; i < numContinents; i++) {
            // Generate random continent shapes on the planet surface
            const angle = (Math.PI * 2 * i) / numContinents + Math.random() * 0.8;
            const distance = 15 + Math.random() * 35; // Distance from planet center
            const width = 8 + Math.random() * 12; // Continent width
            const height = 6 + Math.random() * 10; // Continent height
            
            continents.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                width: width,
                height: height,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        return continents;
    }
    
    generateClouds() {
        const clouds = [];
        const numClouds = 10;
        
        for (let i = 0; i < numClouds; i++) {
            // Generate random cloud formations
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 50; // Distance from planet center
            const size = 4 + Math.random() * 8; // Cloud size
            
            clouds.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: size,
                opacity: 0.3 + Math.random() * 0.4 // Varying opacity for clouds
            });
        }
        
        return clouds;
    }
    
    enter() {
        console.log('Entering ally planet descent mode');
        this.descentActive = true;
        this.descentTimer = 0;
        this.flashTimer = 0;
        
        // Reset success message state
        this.showingMessages = false;
        this.messageTimer = 0;
        this.currentMessage = 0;
        this.messageAlpha = 0;
        this.messageCompleted = false;
        
        // Reset sound timing
        this.soundDelayTimer = 0;
        this.soundPlayed = false;
        
        // Regenerate features for variety
        this.continents = this.generateContinents();
        this.clouds = this.generateClouds();
    }
    
    exit() {
        console.log('Exiting ally planet descent mode');
        this.descentActive = false;
        this.descentTimer = 0;
        this.flashTimer = 0;
    }
    
    update() {
        if (this.descentActive) {
            // Handle sound timing (1 second delay)
            if (!this.soundPlayed) {
                this.soundDelayTimer++;
                if (this.soundDelayTimer >= this.soundDelayDuration) {
                    this.game.audioSystem.playSfx('enteringAllyOrbit');
                    this.soundPlayed = true;
                    console.log('Playing ally orbit sound');
                }
            }
            
            // Update descent timer
            this.descentTimer++;
            
            // Update ship position (descending toward planet)
            const progress = this.descentTimer / this.descentDuration;
            const easedProgress = this.easeInOut(progress);
            
            // Ship descends from top to close to planet
            this.shipPosition.y = 100 + (easedProgress * 120);
            this.shipSize = 30 + (easedProgress * 20); // Ship appears larger as it gets closer
            
            // Planet grows slightly as we approach
            this.planetRadius = 80 + (easedProgress * 30);
            
            // Flash effect near the end
            if (progress > 0.8) {
                this.flashTimer++;
            }
            
            // Complete the descent and start message sequence
            if (this.descentTimer >= this.descentDuration) {
                console.log('Ally planet descent complete, starting success messages');
                this.descentActive = false;
                this.showingMessages = true;
                this.messageTimer = 0;
                this.currentMessage = 0;
                
                // Play celebration sound
                this.game.audioSystem.playSfx('fireworks');
            }
        } else if (this.showingMessages) {
            // Handle success message sequence
            this.messageTimer++;
            
            // Calculate fade in/out alpha for current message
            const messageHalfDuration = this.messageDuration / 2;
            const messageProgress = this.messageTimer % messageHalfDuration;
            
            if (this.messageTimer < messageHalfDuration) {
                // Fade in first message
                this.messageAlpha = messageProgress / messageHalfDuration;
            } else if (this.messageTimer < this.messageDuration) {
                // Fade out first message
                this.messageAlpha = 1 - ((this.messageTimer - messageHalfDuration) / messageHalfDuration);
            } else if (this.messageTimer < this.messageDuration + messageHalfDuration) {
                // Fade in second message
                this.currentMessage = 1;
                const secondProgress = this.messageTimer - this.messageDuration;
                this.messageAlpha = secondProgress / messageHalfDuration;
            } else if (this.messageTimer < this.messageDuration * 2) {
                // Fade out second message
                const secondProgress = this.messageTimer - this.messageDuration - messageHalfDuration;
                this.messageAlpha = 1 - (secondProgress / messageHalfDuration);
            } else {
                // Messages complete
                this.messageCompleted = true;
                console.log('Beer delivery success messages complete');
                
                // Fully heal the player with beer power!
                this.game.gameState.player.health = 7; // Full heal to max health
                console.log('Player fully healed by beer power! Health: 7/7');
                
                // Mark ally planet as completed
                if (this.game.modes.starMap) {
                    this.game.modes.starMap.completeSector();
                    console.log('Ally planet sector marked as completed');
                }
                
                // Return to star map
                this.game.switchToMode('starMap');
            }
        }
    }
    
    easeInOut(t) {
        // Smooth ease-in-out function for natural movement
        return t * t * (3.0 - 2.0 * t);
    }
    
    render(renderer) {
        // Clear with deep space background
        renderer.clear('#000022');
        
        // Render stars
        this.renderStars(renderer);
        
        // Render Earth-like ally planet
        this.renderAllyPlanet(renderer);
        
        // Render descending ship
        this.renderDescentShip(renderer);
        
        // Flash effect during descent
        if (this.descentActive && this.flashTimer > 0 && this.flashTimer % 10 < 5) {
            renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            renderer.ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
        }
        
        if (this.descentActive) {
            // Descent progress indicator (keep at top)
            const progress = this.descentTimer / this.descentDuration;
            renderer.ctx.fillStyle = '#00ff00';
            renderer.ctx.fillRect(50, 20, 300 * progress, 8);
            
            // Status text (moved to bottom center)
            renderer.ctx.save();
            renderer.ctx.fillStyle = '#00ff00';
            renderer.ctx.font = '18px Arial';
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillText('APPROACHING ALLY PLANET', 400, 520);
            renderer.ctx.fillText(`DESCENT PROGRESS: ${Math.floor(progress * 100)}%`, 400, 550);
            renderer.ctx.restore();
        } else if (this.showingMessages) {
            // Show success messages with fade effect
            renderer.ctx.save();
            renderer.ctx.globalAlpha = this.messageAlpha;
            renderer.ctx.fillStyle = '#00FF00';
            renderer.ctx.font = 'bold 32px Arial';
            renderer.ctx.textAlign = 'center';
            renderer.ctx.shadowColor = '#00FF00';
            renderer.ctx.shadowBlur = 10;
            
            // Draw current message
            const message = this.messages[this.currentMessage];
            renderer.ctx.fillText(message, 400, 300);
            
            // Add a glow box around the text
            renderer.ctx.globalAlpha = this.messageAlpha * 0.3;
            renderer.ctx.strokeStyle = '#00FF00';
            renderer.ctx.lineWidth = 3;
            const textWidth = renderer.ctx.measureText(message).width;
            renderer.ctx.strokeRect(400 - textWidth/2 - 20, 270, textWidth + 40, 60);
            
            renderer.ctx.restore();
        }
    }
    
    renderStars(renderer) {
        // Simple star field
        renderer.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 43) % renderer.canvas.width;
            const y = (i * 67) % renderer.canvas.height;
            const size = (i % 3) + 1;
            renderer.ctx.fillRect(x, y, size, size);
        }
    }
    
    renderAllyPlanet(renderer) {
        const ctx = renderer.ctx;
        const centerX = this.planetPosition.x;
        const centerY = this.planetPosition.y;
        const radius = this.planetRadius;
        
        // Main planet body (ocean blue)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1E90FF'; // Deep sky blue for oceans
        ctx.fill();
        
        // Render continents (green/brown land masses)
        ctx.save();
        ctx.translate(centerX, centerY);
        
        for (const continent of this.continents) {
            // Only render continents that are within the planet circle
            const distanceFromCenter = Math.sqrt(continent.x * continent.x + continent.y * continent.y);
            if (distanceFromCenter < radius - 5) {
                ctx.save();
                ctx.translate(continent.x, continent.y);
                ctx.rotate(continent.rotation);
                
                // Alternate between green (forests) and brown (land)
                const isGreen = Math.random() > 0.4;
                ctx.fillStyle = isGreen ? '#228B22' : '#8B4513'; // Forest green or saddle brown
                
                ctx.beginPath();
                ctx.ellipse(0, 0, continent.width, continent.height, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
        
        // Render clouds (white/light gray)
        for (const cloud of this.clouds) {
            const distanceFromCenter = Math.sqrt(cloud.x * cloud.x + cloud.y * cloud.y);
            if (distanceFromCenter < radius - 2) {
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = '#F0F8FF'; // Alice blue for clouds
                
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.globalAlpha = 1.0; // Reset alpha
            }
        }
        
        ctx.restore();
        
        // Planet atmosphere glow (light blue)
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.2);
        gradient.addColorStop(0, 'rgba(135, 206, 235, 0)'); // Transparent sky blue
        gradient.addColorStop(1, 'rgba(135, 206, 235, 0.3)'); // Light sky blue glow
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Planet rim highlight
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#87CEEB'; // Sky blue
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    renderDescentShip(renderer) {
        const ctx = renderer.ctx;
        const x = this.shipPosition.x;
        const y = this.shipPosition.y;
        const size = this.shipSize;
        
        // Ship body (X-wing style, friendly)
        ctx.fillStyle = '#C0C0C0'; // Silver
        ctx.fillRect(x - size/4, y - size/2, size/2, size);
        
        // Ship wings
        ctx.fillStyle = '#A0A0A0'; // Darker silver
        ctx.fillRect(x - size/2, y - size/4, size, size/8);
        ctx.fillRect(x - size/2, y + size/8, size, size/8);
        
        // Ship cockpit
        ctx.fillStyle = '#0000FF'; // Blue cockpit
        ctx.fillRect(x - size/8, y - size/3, size/4, size/3);
        
        // Engine glow
        ctx.fillStyle = '#00FFFF'; // Cyan engine glow
        ctx.fillRect(x - size/6, y + size/2, size/3, size/4);
    }
    
    handleInput(inputSystem) {
        // Allow ESC to skip animation and return to star map
        if (inputSystem.isKeyPressed('Escape')) {
            console.log('Descent animation skipped by user');
            this.game.switchToMode('starMap');
        }
    }
}
