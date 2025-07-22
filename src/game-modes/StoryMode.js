/**
 * Story Mode
 * Handles the scrolling story text screen with space theme
 */
class StoryMode {
    constructor(game) {
        this.game = game;
        this.starfield = this.generateStarfield();
        
        // Text scroll parameters
        this.scrollPosition = 600; // Start text below screen
        this.scrollSpeed = 0.5; // Pixels per frame
        
        // Animation timer
        this.animationTimer = 0;
        
        // Story text content
        this.storyTitle = 'DRILLER JOE IN SPACE';
        this.storyText = [
            '┻━┻ ︵ ＼( °□° )／ ︵ ┻━┻',
            '',
            'Driller Joe, the bravest and most daring driller', 
            'of the cosmos, is returning home.',
            '',
            'His drilling had taken him to', 
            'the farthest reaches of the galaxy!',
            '',
            'Unfortunately his radar jammed,', 
            'and his ship\'s shield is down!',
            '',
            'The computer beeped frantically,', 
            'displaying a distressing message!',          
            '',
            '***RADAR JAMMED***', 
            '',
            '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            'LOCATE 3 ENEMY PLANETS TO DESTROY',
            '',
            'OR',
            '',
            'LOCATE 3 ALLY PLANETS AND DELIVER BEER',
            '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            '',
            'Driller Joe\'s eyes widened!',
            '',
            'He pondered the mission...',
            '',
            'Deliver BEER, of all things!?',
            '',
            'He recalled his briefing:',
            '',
            'The allies needed beer to hack into his system,',
            'allowing him to repair his damaged equipment.',
            '',
            '(Obviously)...',
            '',
            'He set course for the nearest star system,',
            '',
            'His ship trembling as it was buffeted by asteroids,',
            '',
            'His sensors picked up the presence of enemy ships!',
            '',
            'Driller Joe grinned,', 
            'his mustache twitching with excitement!',
            '',
            'The ship and his wits ARE READY!!!',
            '',
            'Driller Joe is off to complete his mission.',
            '',
            'The fate of his radar!',
            '',
            'BEER!', 
            '',
            '...and the galaxy of course...',
            '',
            'HANG IN THE BALANCE!!!!!',
            '',
            'So, with a mighty cry of valor, Driller Joe declared:',
            '',
            'BE DRILLER!',
            '',
            'BE JOE!',
            '',
            'BE IN SPACE!',
            '',
            '',
        ];

        console.log('StoryMode initialized');
    }
    
    enter() {
        // Reset story mode state when entering
        this.scrollPosition = 600; // Start text below screen
        this.animationTimer = 0;
        
        // Start space ambience or appropriate music
        this.game.audioSystem.playMusic('menu-theme');
        console.log('Entered StoryMode - story reset to beginning');
    }
    
    exit() {
        // Stop music
        this.game.audioSystem.stopMusic();
        console.log('Exited StoryMode');
    }
    
    update() {
        // Handle input (allow skipping)
        this.handleInput();
        
        // Update starfield
        this.updateStarfield();
        
        // Update scroll position
        this.scrollPosition -= this.scrollSpeed;
        
        // Update animation timer
        this.animationTimer++;
        
        // Calculate when all text has scrolled off screen
        // Title height (100px above scroll position) + story text height (40px per line)
        const totalTextHeight = 100 + (this.storyText.length * 40);
        const allTextScrolledOff = this.scrollPosition < -totalTextHeight;
        
        // If text has scrolled completely off screen, return to menu
        if (allTextScrolledOff) {
            this.game.switchToMode('menu');
        }
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Allow skipping with ESC, Space, or Enter
        if (input.isKeyPressed('Escape') || 
            input.isKeyPressed('Space') || 
            input.isKeyPressed('Enter')) {
            console.log('Story sequence skipped');
            this.game.switchToMode('menu');
        }
    }
    
    generateStarfield() {
        const stars = [];
        const numStars = 100;
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        
        return stars;
    }
    
    updateStarfield() {
        this.starfield.forEach(star => {
            // Subtle twinkling effect
            star.brightness = 0.5 + Math.sin(this.animationTimer * 0.05 + star.x) * 0.2;
        });
    }
    
    render(renderer) {
        // Clear screen with space black
        renderer.clear('#000005');
        
        // Render starfield
        this.renderStarfield(renderer);
        
        // Draw title
        renderer.drawText(this.storyTitle, 400, this.scrollPosition - 100, '#FFE81F', 48, 'Courier New');
        
        // Draw scrolling text
        let yOffset = this.scrollPosition; // Start at scroll position
        
        for (const line of this.storyText) {
            renderer.drawText(line, 400, yOffset, '#FFE81F', 24, 'Courier New');
            yOffset += 40; // Line spacing
        }
    }
    
    renderStarfield(renderer) {
        this.starfield.forEach(star => {
            const context = renderer.ctx;
            context.globalAlpha = star.brightness;
            renderer.drawCircle(star.x, star.y, star.size, '#FFFFFF');
        });
        renderer.ctx.globalAlpha = 1.0;
    }
}
