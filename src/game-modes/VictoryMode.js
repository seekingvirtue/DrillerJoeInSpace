/**
 * Victory Mode
 * Displays celebration screen when player completes all missions
 */
class VictoryMode {
    constructor(game) {
        this.game = game;
        this.missionType = 'enemy_route'; // Will be set when entering
        this.finalScore = 0; // Will be set when entering
        
        // Animation timers
        this.animationTimer = 0;
        this.textFlashTimer = 0;
        this.fireworksTimer = 0;
        
        // Text animation states
        this.titlePhase = 0;
        this.messagePhase = 0;
        this.scorePhase = 0;
        
        // Fireworks system
        this.fireworks = [];
        this.maxFireworks = 8;
        this.fireworkSpawnTimer = 0;
        
        // Starfield background
        this.starfield = this.generateStarfield();
        
        // Button state
        this.returnButtonActive = false;
        this.returnButtonTimer = 0;
        
        console.log('VictoryMode initialized');
    }
    
    enter(missionType = null, finalScore = 0) {
        console.log(`Entered VictoryMode - Mission: ${missionType}, Score: ${finalScore}`);
        console.log(`Current missionType before update: ${this.missionType}`);
        
        // Only update mission type if a new one is provided
        // This prevents switchToMode from overriding the mission type with default
        if (missionType !== null) {
            this.missionType = missionType;
            console.log(`Updated missionType to: ${this.missionType}`);
        } else {
            console.log(`Keeping existing missionType: ${this.missionType}`);
        }
        
        this.finalScore = finalScore || this.game.gameState.getScore();
        
        // Reset all animation states
        this.animationTimer = 0;
        this.textFlashTimer = 0;
        this.fireworksTimer = 0;
        this.titlePhase = 0;
        this.messagePhase = 0;
        this.scorePhase = 0;
        this.fireworks = [];
        this.fireworkSpawnTimer = 0;
        this.returnButtonActive = false;
        this.returnButtonTimer = 0;
        
        // Stop any current music
        this.game.audioSystem.stopMusic();
        
        // Start victory music after a short delay
        if (this.game.audioSystem && this.game.audioSystem.schedulePlay) {
            this._scheduledMusicToken = this.game.audioSystem.schedulePlay('victory-theme', 500);
        } else {
            // Fallback
            this._scheduledMusicToken = setTimeout(() => {
                this.game.audioSystem.playMusic('victory-theme');
            }, 500);
        }
        
        // Activate return button after 8 seconds
        setTimeout(() => {
            this.returnButtonActive = true;
            console.log('Return to menu button activated');
        }, 8000);
    }
    
    exit() {
        console.log('Exited VictoryMode');
        
        // Stop victory music
        // Cancel any scheduled music token and stop music
        if (this._scheduledMusicToken) {
            if (this.game.audioSystem && this.game.audioSystem.cancelScheduledPlay) {
                this.game.audioSystem.cancelScheduledPlay(this._scheduledMusicToken);
            } else {
                clearTimeout(this._scheduledMusicToken);
            }
            this._scheduledMusicToken = null;
        }

        this.game.audioSystem.stopMusic();
    }
    
    update() {
        // Update animation timers
        this.animationTimer++;
        this.textFlashTimer++;
        this.fireworksTimer++;
        this.returnButtonTimer++;
        
        // Update text phases based on timing
        if (this.animationTimer > 60) this.titlePhase = 1; // 1 second
        if (this.animationTimer > 180) this.messagePhase = 1; // 3 seconds
        if (this.animationTimer > 300) this.scorePhase = 1; // 5 seconds
        
        // Update fireworks
        this.updateFireworks();
        
        // Spawn new fireworks
        if (this.fireworksTimer > 60 && this.fireworkSpawnTimer <= 0) {
            this.spawnFirework();
            this.fireworkSpawnTimer = 30 + Math.random() * 90; // Random interval
        } else {
            this.fireworkSpawnTimer--;
        }
        
        // Update starfield
        this.updateStarfield();
        
        // Handle input
        this.handleInput();
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Only allow return to menu after button is active
        if (this.returnButtonActive) {
            if (input.isKeyPressed('Enter') || input.isKeyPressed('Space') || input.isKeyPressed('Escape')) {
                console.log('Returning to main menu from victory screen');
                this.game.audioSystem.playSfx('menu-confirm');
                
                // Reset game state for new game
                this.game.gameState.resetGame();
                this.game.switchToMode('menu');
            }
            
            // Handle mouse click on return button
            const mousePos = input.getMousePos();
            if (input.isMousePressed()) {
                // Check if clicked on return button area (centered at bottom)
                if (mousePos.x >= 300 && mousePos.x <= 500 && 
                    mousePos.y >= 520 && mousePos.y <= 560) {
                    console.log('Return button clicked');
                    this.game.audioSystem.playSfx('menu-confirm');
                    this.game.gameState.resetGame();
                    this.game.switchToMode('menu');
                }
            }
        }
    }
    
    spawnFirework() {
        // Random position on screen
        const x = 100 + Math.random() * 600;
        const y = 100 + Math.random() * 300;
        
        const firework = {
            x: x,
            y: y,
            particles: [],
            life: 120, // 2 seconds
            maxLife: 120,
            exploded: false,
            explodeTimer: 30 + Math.random() * 30
        };
        
        // Create explosion particles
        const particleCount = 15 + Math.random() * 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 4;
            
            firework.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60 + Math.random() * 60,
                maxLife: 60 + Math.random() * 60,
                color: this.getFireworkColor(),
                size: 2 + Math.random() * 3
            });
        }
        
        this.fireworks.push(firework);
        
        // Keep max fireworks count
        if (this.fireworks.length > this.maxFireworks) {
            this.fireworks.shift();
        }
    }
    
    updateFireworks() {
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const firework = this.fireworks[i];
            
            firework.life--;
            firework.explodeTimer--;
            
            if (!firework.exploded && firework.explodeTimer <= 0) {
                firework.exploded = true;
                // Play firework sound when it actually explodes visually
                this.game.audioSystem.playSfx('fireworks');
            }
            
            // Update particles
            for (let j = firework.particles.length - 1; j >= 0; j--) {
                const particle = firework.particles[j];
                
                if (firework.exploded) {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.vy += 0.1; // Gravity
                    particle.vx *= 0.98; // Air resistance
                    particle.life--;
                }
                
                if (particle.life <= 0) {
                    firework.particles.splice(j, 1);
                }
            }
            
            // Remove dead fireworks
            if (firework.life <= 0 || firework.particles.length === 0) {
                this.fireworks.splice(i, 1);
            }
        }
    }
    
    getFireworkColor() {
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
            '#FF00FF', '#00FFFF', '#FFA500', '#FF69B4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateStarfield() {
        const stars = [];
        const numStars = 100;
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: Math.random() * 2 + 0.5,
                color: '#FFFFFF',
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        return stars;
    }
    
    updateStarfield() {
        this.starfield.forEach(star => {
            star.twinkle += 0.1;
        });
    }
    
    render(renderer) {
        // Clear screen with dark space
        renderer.clear('#000008');
        
        // Draw starfield
        this.renderStarfield(renderer);
        
        // Draw fireworks
        this.renderFireworks(renderer);
        
        // Draw main title with flashing effect
        this.renderTitle(renderer);
        
        // Draw congratulations messages
        this.renderMessages(renderer);
        
        // Draw final score
        this.renderScore(renderer);
        
        // Draw return button (if active)
        this.renderReturnButton(renderer);
    }
    
    renderStarfield(renderer) {
        const ctx = renderer.ctx;
        
        this.starfield.forEach(star => {
            const alpha = 0.3 + 0.4 * Math.sin(star.twinkle);
            ctx.globalAlpha = alpha;
            renderer.drawCircle(star.x, star.y, star.size, star.color);
        });
        
        ctx.globalAlpha = 1.0;
    }
    
    renderFireworks(renderer) {
        const ctx = renderer.ctx;
        
        this.fireworks.forEach(firework => {
            if (firework.exploded) {
                firework.particles.forEach(particle => {
                    const alpha = particle.life / particle.maxLife;
                    ctx.globalAlpha = alpha;
                    renderer.drawCircle(particle.x, particle.y, particle.size, particle.color);
                });
            }
        });
        
        ctx.globalAlpha = 1.0;
    }
    
    renderTitle(renderer) {
        if (this.titlePhase === 0) return;
        
        // Calculate flashing colors with three hues each of green, red, and yellow
        const flashSpeed = 15;
        const colorIndex = Math.floor(this.textFlashTimer / flashSpeed) % 9; // 9 total colors
        const colors = [
            // Three hues of green
            '#00FF00', // Bright green
            '#32CD32', // Lime green  
            '#90EE90', // Light green
            // Three hues of red
            '#FF0000', // Bright red
            '#FF4500', // Orange red
            '#FF6347', // Tomato red
            // Three hues of yellow
            '#FFFF00', // Bright yellow
            '#FFD700', // Gold
            '#FFA500'  // Orange
        ];
        const titleColor = colors[colorIndex];
        
        // Render "DRILLER JOE" with bouncing wave effect
        const title = "DRILLER JOE";
        const baseY = 120;
        const fontSize = 48;
        const letterSpacing = 42; // Spacing between letters
        const waveSpeed = 0.15; // Speed of the wave
        const waveHeight = 15; // Height of the bounce
        const waveDelay = 0.3; // Delay between each letter's wave
        
        // Calculate starting X position to center the text
        const totalWidth = title.length * letterSpacing;
        const startX = 400 - (totalWidth / 2);
        
        // Draw each letter with wave animation
        for (let i = 0; i < title.length; i++) {
            const letter = title[i];
            
            // Skip spaces but still count them for positioning
            if (letter === ' ') continue;
            
            // Calculate wave offset for this letter
            const wavePhase = (this.textFlashTimer * waveSpeed) - (i * waveDelay);
            const yOffset = Math.sin(wavePhase) * waveHeight;
            
            // Calculate position
            const x = startX + (i * letterSpacing);
            const y = baseY + yOffset;
            
            // Draw the letter
            renderer.drawText(letter, x, y, titleColor, fontSize, 'Courier New');
        }
        
        // Draw "DEFIES FATE AGAIN!" normally (no wave effect)
        renderer.drawText('DEFIES FATE AGAIN!', 400, 170, titleColor, 36, 'Courier New');
    }
    
    renderMessages(renderer) {
        if (this.messagePhase === 0) return;
        
        // Congratulations text with gentle flashing
        const messageAlpha = 0.7 + 0.3 * Math.sin(this.textFlashTimer * 0.1);
        const ctx = renderer.ctx;
        ctx.globalAlpha = messageAlpha;
        
        const missionName = this.missionType === 'enemy_route' ? 'MILITARY' : 'SUPPLY';
        
        renderer.drawText('CONGRATULATIONS!', 400, 250, '#00FFFF', 28, 'Courier New');
        renderer.drawText(`${missionName} MISSION COMPLETE!`, 400, 290, '#00FFFF', 24, 'Courier New');
        renderer.drawText('Thank you for being awesome!', 400, 330, '#FFFFFF', 20, 'Courier New');
        renderer.drawText('Thank you for DRLLER\'ing', 400, 360, '#FFFFFF', 20, 'Courier New');
        renderer.drawText('Thank you for JOE\'ing', 400, 390, '#FFFFFF', 20, 'Courier New');
        
        ctx.globalAlpha = 1.0;
    }
    
    renderScore(renderer) {
        if (this.scorePhase === 0) return;
        
        // Score display with golden glow
        const scoreFlash = 0.8 + 0.2 * Math.sin(this.textFlashTimer * 0.15);
        const ctx = renderer.ctx;
        ctx.globalAlpha = scoreFlash;
        
        renderer.drawText('FINAL SCORE:', 400, 450, '#FFD700', 24, 'Courier New');
        renderer.drawText(this.finalScore.toString(), 400, 480, '#FFD700', 32, 'Courier New');
        
        ctx.globalAlpha = 1.0;
    }
    
    renderReturnButton(renderer) {
        if (!this.returnButtonActive) return;
        
        // Pulsing return button
        const pulseAlpha = 0.6 + 0.4 * Math.sin(this.returnButtonTimer * 0.1);
        const ctx = renderer.ctx;
        
        // Button background
        ctx.globalAlpha = pulseAlpha * 0.3;
        renderer.drawRect(300, 520, 200, 40, '#003366');
        
        // Button border
        ctx.globalAlpha = pulseAlpha;
        renderer.drawStroke(300, 520, 200, 40, '#00FFFF', 2);
        
        // Button text
        ctx.globalAlpha = 1.0;
        renderer.drawText('RETURN TO MENU', 400, 540, '#00FFFF', 18, 'Courier New');
        
        // Instructions
        renderer.drawText('Press SPACE, ENTER, or ESC', 400, 570, '#CCCCCC', 12, 'Courier New');
        
        ctx.globalAlpha = 1.0;
    }
}
