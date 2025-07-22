/**
 * Menu Mode
 * Handles the main menu screen with space theme
 */
class MenuMode {
    constructor(game) {
        this.game = game;
        this.starfield = this.generateStarfield();
        this.selectedOption = 1; // Default to STORY option
        this.menuOptions = [
            'START',
            'STORY',
            'EXIT GAME'
        ];
        this.musicWaitingForInteraction = false;
        
        console.log('MenuMode initialized');
    }
    
    enter() {
        // Try to start menu music, but handle autoplay restrictions
        this.startMenuMusic();
        console.log('Entered MenuMode');
    }
    
    startMenuMusic() {
        // Attempt to play music immediately
        this.game.audioSystem.playMusic('menu-theme');
        
        // If autoplay is blocked, set up a one-time listener for user interaction
        if (!this.game.audioSystem.isMusicPlaying()) {
            console.log('Music autoplay blocked - waiting for user interaction');
            this.setupMusicAutoplayHandler();
        }
    }
    
    setupMusicAutoplayHandler() {
        this.musicWaitingForInteraction = true;
        
        const startMusic = () => {
            if (!this.game.audioSystem.isMusicPlaying()) {
                this.game.audioSystem.playMusic('menu-theme');
                console.log('Music started after user interaction');
                this.musicWaitingForInteraction = false;
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
        };
        
        document.addEventListener('click', startMusic, { once: true });
        document.addEventListener('keydown', startMusic, { once: true });
    }
    
    exit() {
        // Stop menu music
        this.game.audioSystem.stopMusic();
        console.log('Exited MenuMode');
    }
    
    update() {
        // Handle input
        this.handleInput();
        
        // Update starfield animation
        this.updateStarfield();
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Navigate menu with arrow keys
        if (input.isKeyPressed('ArrowUp')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
            this.game.audioSystem.playSfx('menu-select');
        }
        
        if (input.isKeyPressed('ArrowDown')) {
            this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
            this.game.audioSystem.playSfx('menu-select');
        }
        
        // Select option with Enter or Space
        if (input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
            this.selectCurrentOption();
        }
        
        // Handle mouse input
        const mousePos = input.getMousePos();
        if (input.isMousePressed()) {
            this.handleMouseClick(mousePos);
        }
    }
    
    selectCurrentOption() {
        this.game.audioSystem.playSfx('menu-confirm');
        
        switch (this.selectedOption) {
            case 0: // START GAME
                console.log('START GAME selected - resetting game state and switching to CombatMode');
                try {
                    // Always reset the game state and all game modes when starting a new game
                    this.game.resetAllGameModes();
                    this.game.switchToMode('combat');
                    console.log('Successfully started new game in combat mode');
                } catch (error) {
                    console.error('Error starting combat mode:', error);
                    alert('Error starting combat mode: ' + error.message);
                }
                break;
                
            case 1: // STORY
                console.log('STORY selected - switching to StoryMode');
                try {
                    this.game.switchToMode('story');
                    console.log('Successfully switched to story mode');
                } catch (error) {
                    console.error('Error starting story mode:', error);
                    alert('Error starting story mode: ' + error.message);
                }
                break;
                
            case 2: // EXIT GAME
                console.log('EXIT GAME selected');
                this.game.exit();
                break;
        }
    }
    
    handleMouseClick(mousePos) {
        // Check if mouse clicked on any menu option
        const menuY = 350;
        const optionHeight = 50;
        
        for (let i = 0; i < this.menuOptions.length; i++) {
            const optionY = menuY + (i * optionHeight);
            
            if (mousePos.y >= optionY - 20 && mousePos.y <= optionY + 20) {
                this.selectedOption = i;
                this.selectCurrentOption();
                break;
            }
        }
    }
    
    generateStarfield() {
        const stars = [];
        const numStars = 150;
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                // Start stars at center and give them random positions around it
                x: 400 + (Math.random() - 0.5) * 800,
                y: 300 + (Math.random() - 0.5) * 600,
                z: Math.random() * 1000 + 1, // Depth for 3D effect
                originalZ: 0, // Will store initial z for reset
                size: Math.random() * 2 + 0.5,
                color: this.getStarColor(),
                speed: 2 + Math.random() * 3 // Speed of movement toward camera
            });
        }
        
        // Set original z values
        stars.forEach(star => star.originalZ = star.z);
        
        return stars;
    }
    
    getStarColor() {
        const colors = ['#FFFFFF', '#FFFFCC', '#CCCCFF', '#FFCCCC'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateStarfield() {
        const centerX = 400;
        const centerY = 300;
        
        this.starfield.forEach(star => {
            // Move star toward camera
            star.z -= star.speed;
            
            // Calculate 3D projection
            const perspective = 800 / star.z;
            star.screenX = centerX + (star.x - centerX) * perspective;
            star.screenY = centerY + (star.y - centerY) * perspective;
            
            // Calculate size based on distance (closer = bigger)
            star.currentSize = star.size * perspective;
            
            // Calculate brightness based on distance
            const brightness = Math.min(1, Math.max(0.1, perspective));
            star.currentBrightness = brightness;
            
            // Reset star if it goes behind camera or off screen
            if (star.z <= 0 || 
                star.screenX < -50 || star.screenX > 850 || 
                star.screenY < -50 || star.screenY > 650) {
                
                // Reset to far distance
                star.z = 800 + Math.random() * 200;
                star.x = centerX + (Math.random() - 0.5) * 800;
                star.y = centerY + (Math.random() - 0.5) * 600;
            }
        });
    }
    
    render(renderer) {
        // Clear screen with space black
        renderer.clear('#000011');
        
        // Draw starfield
        this.renderStarfield(renderer);
        
        // Draw title
        renderer.drawText('DRILLER JOE', 400, 130, '#00FFFF', 48, 'Courier New');
        renderer.drawText('IN SPACE', 400, 180, '#00FFFF', 48, 'Courier New');
        renderer.drawText('HTML5 Edition', 400, 220, '#FFFFFF', 24, 'Courier New');
        
        // Draw menu options
        this.renderMenu(renderer);
        
        // Draw instructions
        renderer.drawText('▴▾◂▸ to navigate, SPACE to fire', 400, 500, '#CCCCCC', 14, 'Courier New');
        
        // Show music status if waiting for interaction
        if (this.musicWaitingForInteraction) {
            renderer.drawText('♫ Music will start after any key press or click ♫', 400, 550, '#FFFF00', 12, 'Courier New');
        }
    }
    
    renderStarfield(renderer) {
        this.starfield.forEach(star => {
            // Only draw stars that are in front of camera and on screen
            if (star.z > 0 && 
                star.screenX >= 0 && star.screenX <= 800 && 
                star.screenY >= 0 && star.screenY <= 600) {
                
                const ctx = renderer.ctx;
                
                // Set alpha based on brightness
                ctx.globalAlpha = star.currentBrightness;
                
                // Draw star at projected position with calculated size
                renderer.drawCircle(star.screenX, star.screenY, star.currentSize, star.color);
                
                // Add trail effect for fast-moving stars
                if (star.currentSize > 2) {
                    ctx.globalAlpha = star.currentBrightness * 0.3;
                    const trailLength = Math.min(20, star.currentSize * 3);
                    const centerX = 400;
                    const centerY = 300;
                    
                    // Calculate trail direction (opposite of movement)
                    const dx = star.screenX - centerX;
                    const dy = star.screenY - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        const trailX = star.screenX - (dx / dist) * trailLength;
                        const trailY = star.screenY - (dy / dist) * trailLength;
                        
                        renderer.drawLine(star.screenX, star.screenY, trailX, trailY, star.color, 1);
                    }
                }
                
                ctx.globalAlpha = 1.0;
            }
        });
    }
    
    renderMenu(renderer) {
        const menuY = 350;
        const optionHeight = 50;
        
        this.menuOptions.forEach((option, index) => {
            const y = menuY + (index * optionHeight);
            const isSelected = index === this.selectedOption;
            
            // Draw selection highlight
            if (isSelected) {
                renderer.drawRect(300, y - 25, 200, 40, '#003333');
                renderer.drawStroke(300, y - 25, 200, 40, '#00FFFF', 2);
            }
            
            // Draw option text
            const color = isSelected ? '#00FFFF' : '#FFFFFF';
            renderer.drawText(option, 400, y, color, 24, 'Courier New');
        });
    }
}
