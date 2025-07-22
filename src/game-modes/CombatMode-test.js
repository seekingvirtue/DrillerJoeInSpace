/**
 * Combat Mode - Simple Test Version
 * Handles first-person combat view with crosshair
 */
class CombatMode {
    constructor(game) {
        console.log('CombatMode constructor called');
        this.game = game;
        this.playerPosition = { x: 0, y: 0 };
        console.log('CombatMode initialized successfully');
    }
    
    enter() {
        console.log('Entered CombatMode - First Person View');
    }
    
    exit() {
        console.log('Exited CombatMode');
    }
    
    update() {
        // Simple input handling
        const input = this.game.inputSystem;
        
        if (input.isKeyPressed('Escape')) {
            console.log('ESC pressed - returning to menu');
            this.game.setMode(new MenuMode(this.game));
        }
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    render(renderer) {
        // Simple test rendering
        renderer.clear('#000020');
        
        // Test crosshair
        const centerX = 400;
        const centerY = 300;
        
        renderer.drawLine(centerX - 20, centerY, centerX + 20, centerY, '#00FF00', 2);
        renderer.drawLine(centerX, centerY - 20, centerX, centerY + 20, '#00FF00', 2);
        
        // Test text
        renderer.drawText('COMBAT MODE TEST', 400, 100, '#00FFFF', 24, 'Courier New');
        renderer.drawText('Press ESC to return to menu', 400, 500, '#FFFFFF', 16, 'Courier New');
        renderer.drawText('If you can see this, CombatMode is working!', 400, 150, '#00FF00', 14, 'Courier New');
    }
}

console.log('CombatMode class defined successfully');
