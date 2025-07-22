/**
 * Game Over Mode
 * Displays game over screen with final score and restart options
 */
class GameOverMode {
    constructor(game) {
        this.game = game;
        this.selectedOption = 0;
        this.options = [
            'RETURN TO MENU'
        ];
        
        // Animation effects
        this.fadeAlpha = 0;
        this.fadeSpeed = 0.02;
        this.titlePulse = 0;
        this.titlePulseSpeed = 0.1;
        
        // Input delay system to prevent accidental input
        this.inputDelayTimer = 0;
        this.inputDelayDuration = 4.0; // 4 seconds delay
        this.inputEnabled = false;
        
        // Final score will be captured when entering game over mode
        this.finalScore = 0;
        
        console.log('GameOverMode initialized');
    }
    
    enter() {
        // Capture the final score when entering game over mode (before any reset)
        this.finalScore = this.game.gameState.getScore();
        console.log('Game Over - Final Score captured:', this.finalScore);
        
        // Reset input delay system
        this.inputDelayTimer = 0;
        this.inputEnabled = false;
        
        // Stop any background music and play game over music
        this.game.audioSystem.stopMusic();
        
        // Start game over music after a brief pause for dramatic effect
        setTimeout(() => {
            this.game.audioSystem.playMusic('gameover-theme');
            console.log('Game over music started');
        }, 500); // 0.5 second pause for dramatic effect
        
        // Reset animation values
        this.fadeAlpha = 0;
        this.titlePulse = 0;
    }
    
    exit() {
        console.log('Exited GameOverMode');
        
        // Stop game over music when leaving
        this.game.audioSystem.stopMusic();
    }
    
    update() {
        // Update input delay timer
        this.inputDelayTimer += 1/60; // Assume 60 FPS
        
        // Enable input after delay period
        if (this.inputDelayTimer >= this.inputDelayDuration) {
            this.inputEnabled = true;
        }
        
        // Handle input only if enabled
        if (this.inputEnabled) {
            this.handleInput();
        }
        
        // Update animations
        this.updateAnimations();
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Only space bar returns to menu
        if (input.isKeyPressed('Space')) {
            this.selectCurrentOption();
        }
    }
    
    selectCurrentOption() {
        this.game.audioSystem.playSfx('menu-confirm');
        
        // Only one option now - return to menu
        console.log('Returning to main menu...');
        this.game.resetAllGameModes();
        this.game.switchToMode('menu');
    }

    updateAnimations() {
        // Fade in effect
        if (this.fadeAlpha < 1) {
            this.fadeAlpha = Math.min(1, this.fadeAlpha + this.fadeSpeed);
        }
        
        // Title pulse effect
        this.titlePulse += this.titlePulseSpeed;
        if (this.titlePulse >= Math.PI * 2) {
            this.titlePulse = 0;
        }
    }
    
    render(renderer) {
        // Dark background with red tint
        renderer.clear('#200000');
        
        // Apply fade effect
        const alpha = this.fadeAlpha;
        
        // Game Over title with pulse effect
        const titleScale = 1 + Math.sin(this.titlePulse) * 0.1;
        const titleSize = Math.floor(48 * titleScale * alpha);
        renderer.drawText('GAME OVER', 400, 150, `rgba(255, 0, 0, ${alpha})`, titleSize, 'Courier New');
        
        // Subtitle
        renderer.drawText('DRILLER JOE HAS FALLEN', 400, 200, `rgba(255, 100, 100, ${alpha * 0.8})`, 16, 'Courier New');
        
        // Final score display
        renderer.drawText(`FINAL SCORE: ${this.finalScore}`, 400, 280, `rgba(255, 255, 0, ${alpha})`, 20, 'Courier New');
        
        // Performance message based on score
        let performanceMessage = '';
        if (this.finalScore >= 1000) {
            performanceMessage = 'EXCELLENT PILOT!';
        } else if (this.finalScore >= 500) {
            performanceMessage = 'GOOD EFFORT!';
        } else if (this.finalScore >= 100) {
            performanceMessage = 'KEEP PRACTICING!';
        } else {
            performanceMessage = 'BETTER LUCK NEXT TIME!';
        }
        
        renderer.drawText(performanceMessage, 400, 320, `rgba(0, 255, 255, ${alpha * 0.9})`, 14, 'Courier New');
        
        // Menu options (only show if input is enabled)
        const menuY = 400;
        const optionHeight = 40;
        
        if (this.inputEnabled) {
            for (let i = 0; i < this.options.length; i++) {
                const isSelected = i === this.selectedOption;
                const optionY = menuY + (i * optionHeight);
                
                // Option background for selected item
                if (isSelected) {
                    renderer.drawRect(300, optionY - 15, 200, 30, `rgba(100, 0, 0, ${alpha * 0.3})`);
                    renderer.drawStroke(300, optionY - 15, 200, 30, `rgba(255, 0, 0, ${alpha})`, 2);
                }
                
                // Option text
                const textColor = isSelected ? 
                    `rgba(255, 255, 0, ${alpha})` : 
                    `rgba(200, 200, 200, ${alpha * 0.8})`;
                const fontSize = isSelected ? 16 : 14;
                
                renderer.drawText(this.options[i], 400, optionY, textColor, fontSize, 'Courier New');
            }
            
            // Instructions removed - no longer needed with single button interface
        } else {
            // Show countdown while input is disabled
            const timeRemaining = Math.ceil(this.inputDelayDuration - this.inputDelayTimer);
            const countdownColor = timeRemaining <= 1 ? 
                `rgba(255, 255, 0, ${alpha})` : 
                `rgba(255, 100, 100, ${alpha})`;
            
            renderer.drawText('INPUT DISABLED', 400, menuY, `rgba(255, 0, 0, ${alpha})`, 18, 'Courier New');
            renderer.drawText(`RESUMING IN: ${timeRemaining}`, 400, menuY + 30, countdownColor, 16, 'Courier New');
            renderer.drawText('Please wait to prevent accidental input...', 400, menuY + 60, `rgba(200, 200, 200, ${alpha * 0.8})`, 12, 'Courier New');
        }
        
        // Decorative elements
        this.renderDecorations(renderer, alpha);
    }
    
    renderDecorations(renderer, alpha) {
        // Draw some decorative elements to make it look more dramatic
        
        // Corner decorations
        const cornerSize = 50;
        const cornerAlpha = alpha * 0.6;
        
        // Top corners
        renderer.drawLine(50, 50, 50 + cornerSize, 50, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        renderer.drawLine(50, 50, 50, 50 + cornerSize, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        
        renderer.drawLine(750, 50, 750 - cornerSize, 50, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        renderer.drawLine(750, 50, 750, 50 + cornerSize, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        
        // Bottom corners
        renderer.drawLine(50, 550, 50 + cornerSize, 550, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        renderer.drawLine(50, 550, 50, 550 - cornerSize, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        
        renderer.drawLine(750, 550, 750 - cornerSize, 550, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        renderer.drawLine(750, 550, 750, 550 - cornerSize, `rgba(255, 0, 0, ${cornerAlpha})`, 2);
        
        // Warning stripes
        for (let i = 0; i < 5; i++) {
            const y = 580 - (i * 5);
            const stripeAlpha = alpha * 0.3 * (1 - i * 0.2);
            renderer.drawRect(0, y, 800, 2, `rgba(255, 0, 0, ${stripeAlpha})`);
        }
    }
}
