/**
 * Game State Management
 * Handles global game state, player data, and universe state
 */
class GameState {
    constructor() {
        this.player = {
            health: 7,
            score: 0,
            position: { x: 0, y: 0 }
        };
        
        this.universe = {
            currentSector: null,
            visitedSectors: new Set(),
            sectors: {}
        };
        
        this.gameSettings = {
            soundEnabled: true,
            musicEnabled: true,
            volume: 1.0
        };
        
        console.log('GameState initialized');
    }
    
    resetGame() {
        this.player.health = 7;
        this.player.score = 0;
        this.universe.visitedSectors.clear();
        this.universe.sectors = {};
        console.log('Game state reset');
    }
    
    // Step 4: Player health system methods
    damagePlayer(damage) {
        this.player.health = Math.max(0, this.player.health - damage);
        console.log(`Player took ${damage} damage. Health: ${this.player.health}/7`);
        return this.player.health;
    }
    
    healPlayer(amount) {
        this.player.health = Math.min(7, this.player.health + amount);
        console.log(`Player healed ${amount} points. Health: ${this.player.health}/7`);
        return this.player.health;
    }
    
    isPlayerAlive() {
        return this.player.health > 0;
    }
    
    getPlayerHealth() {
        return this.player.health;
    }
    
    // Scoring system methods
    addScore(points) {
        this.player.score += points;
        console.log(`Added ${points} points. Total score: ${this.player.score}`);
        return this.player.score;
    }
    
    getScore() {
        return this.player.score;
    }
    
    saveState() {
        // Placeholder for save functionality
        const state = {
            player: this.player,
            universe: {
                currentSector: this.universe.currentSector,
                visitedSectors: Array.from(this.universe.visitedSectors),
                sectors: this.universe.sectors
            },
            settings: this.gameSettings
        };
        
        localStorage.setItem('drillerJoeInSpaceState', JSON.stringify(state));
        console.log('Game state saved');
    }
    
    loadState() {
        // Placeholder for load functionality
        const savedState = localStorage.getItem('drillerJoeInSpaceState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.player = state.player;
            this.universe.currentSector = state.universe.currentSector;
            this.universe.visitedSectors = new Set(state.universe.visitedSectors);
            this.universe.sectors = state.universe.sectors;
            this.gameSettings = state.settings;
            console.log('Game state loaded');
            return true;
        }
        return false;
    }
    
    // Victory condition methods
    triggerVictory(route) {
        console.log(`GAME VICTORY: ${route} route completed!`);
        
        // Get final score
        const finalScore = this.getScore();
        console.log(`Final score: ${finalScore}`);
        
        // Switch to victory screen after a short delay
        setTimeout(() => {
            // Access the game instance through a global reference or pass it through
            // For now, we'll use the global game reference
            if (window.game) {
                window.game.modes.victory.enter(route, finalScore);
                window.game.switchToMode('victory');
            } else {
                // Fallback to alert if game reference not available
                alert(`CONGRATULATIONS! You completed the ${route === 'enemy_route' ? 'Military' : 'Supply'} mission!`);
            }
        }, 100);
    }
}
