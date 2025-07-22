/**
 * Star Map Mode
 * Handles the strategic 8x8 grid universe navigation with fog-of-war
 */
class StarMapMode {
    constructor(game) {
        this.game = game;
        
        // Grid system: 8x8 = 64 sectors
        this.gridSize = 8;
        this.sectors = [];
        this.playerPosition = { x: 0, y: 0 }; // Grid coordinates (0-7, 0-7)
        this.selectedSector = null; // Currently highlighted sector for navigation
        
        // Sector types and distribution
        this.encounterTypes = {
            ENEMY: 'enemy',
            ASTEROID: 'asteroid', 
            ENEMY_PLANET: 'enemyPlanet',
            ALLY_PLANET: 'allyPlanet'
        };
        
        // Display configuration
        this.sectorSize = 70; // Size of each sector in pixels
        this.gridOffsetX = 140; // Left margin for grid
        this.gridOffsetY = 40;  // Top margin for grid (reduced to prevent bottom cutoff)
        this.hoveredSector = null; // For hover effects
        
        // UI state
        this.showingWarpConfirmation = false;
        this.targetSector = null;
        
        // Animation timers
        this.animationTimer = 0;
        this.playerPulseTimer = 0;
        
        // Audio feedback
        this.lastHoverSector = null;
        
        // Initialize the star map
        this.generateUniverse();
        this.revealStartingSector();
        
        console.log('StarMapMode initialized with 8x8 grid universe');
    }
    
    generateUniverse() {
        // Initialize 8x8 grid
        this.sectors = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.sectors[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.sectors[y][x] = {
                    x: x,
                    y: y,
                    encounterType: this.encounterTypes.ENEMY, // Default to enemy encounter
                    isRevealed: false,
                    isCompleted: false,
                    completedTime: 0
                };
            }
        }
        
        // Distribute encounters according to design:
        // 3 enemy planets, 3 ally planets, 18 asteroid storms, 40 enemy encounters
        this.distributeEncounters();
        
        // Set random starting position (always an enemy encounter for first combat)
        this.setRandomStartingPosition();
    }
    
    distributeEncounters() {
        const totalSectors = this.gridSize * this.gridSize;
        const encounters = [
            ...Array(3).fill(this.encounterTypes.ENEMY_PLANET),
            ...Array(3).fill(this.encounterTypes.ALLY_PLANET),
            ...Array(18).fill(this.encounterTypes.ASTEROID),
            ...Array(40).fill(this.encounterTypes.ENEMY)
        ];
        
        // Shuffle encounters for random distribution
        for (let i = encounters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [encounters[i], encounters[j]] = [encounters[j], encounters[i]];
        }
        
        // Assign encounters to sectors
        let encounterIndex = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.sectors[y][x].encounterType = encounters[encounterIndex];
                encounterIndex++;
            }
        }
        
        console.log('Universe generated: 3 enemy planets, 3 ally planets, 18 asteroid storms, 40 enemy encounters');
    }
    
    setRandomStartingPosition() {
        // Find all enemy encounter sectors for starting position options
        const enemyEncounters = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.sectors[y][x].encounterType === this.encounterTypes.ENEMY) {
                    enemyEncounters.push({ x: x, y: y });
                }
            }
        }
        
        // Select random starting position
        const startPos = enemyEncounters[Math.floor(Math.random() * enemyEncounters.length)];
        this.playerPosition = { x: startPos.x, y: startPos.y };
        
        console.log(`Player starting at sector ${this.getSectorName(startPos.x, startPos.y)}`);
    }
    
    revealStartingSector() {
        // Reveal starting sector
        this.sectors[this.playerPosition.y][this.playerPosition.x].isRevealed = true;
        
        // Reveal 2 additional random sectors
        this.revealRandomSectors(2);
        
        console.log('Starting sector revealed plus 2 random sectors');
    }
    
    revealRandomSectors(count) {
        const unrevealedSectors = [];
        
        // Find all unrevealed sectors
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (!this.sectors[y][x].isRevealed) {
                    unrevealedSectors.push({ x: x, y: y });
                }
            }
        }
        
        // Randomly reveal the requested number of sectors
        for (let i = 0; i < Math.min(count, unrevealedSectors.length); i++) {
            const randomIndex = Math.floor(Math.random() * unrevealedSectors.length);
            const sector = unrevealedSectors.splice(randomIndex, 1)[0];
            this.sectors[sector.y][sector.x].isRevealed = true;
            
            // Play discovery sound
            this.game.audioSystem.playSfx('menu-select'); // Using existing sound, can add specific discovery sound later
        }
    }
    
    resetUniverse() {
        // Regenerate the entire universe for a fresh game
        console.log('Resetting StarMap universe for new game');
        this.generateUniverse();
        this.revealStartingSector();
        
        // Reset UI state
        this.selectedSector = { x: this.playerPosition.x, y: this.playerPosition.y };
        this.showingWarpConfirmation = false;
        this.targetSector = null;
        this.hoveredSector = null;
        this.animationTimer = 0;
        this.playerPulseTimer = 0;
        this.lastHoverSector = null;
    }
    
    getSectorName(x, y) {
        const column = String.fromCharCode(65 + x); // A-H
        const row = (y + 1).toString(); // 1-8
        return column + row;
    }
    
    getSectorScreenPos(x, y) {
        return {
            x: this.gridOffsetX + (x * this.sectorSize),
            y: this.gridOffsetY + (y * this.sectorSize)
        };
    }
    
    getGridPosFromScreen(screenX, screenY) {
        const gridX = Math.floor((screenX - this.gridOffsetX) / this.sectorSize);
        const gridY = Math.floor((screenY - this.gridOffsetY) / this.sectorSize);
        
        // Validate bounds
        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
            return { x: gridX, y: gridY };
        }
        return null;
    }
    
    enter() {
        console.log('Entered StarMapMode - Strategic View');
        console.log(`Player position: ${this.getSectorName(this.playerPosition.x, this.playerPosition.y)} (${this.playerPosition.x}, ${this.playerPosition.y})`);
        const currentSector = this.sectors[this.playerPosition.y][this.playerPosition.x];
        console.log(`Current sector completed status: ${currentSector.isCompleted}, encounter type: ${currentSector.encounterType}`);
        
        // IMPORTANT: Check if we just returned from an encounter and are now on a different sector
        console.log(`DEBUG: Current sector encounter type at enter: ${currentSector.encounterType}`);
        
        // CRITICAL FIX: Do not auto-trigger encounters when entering star map mode
        // This prevents unwanted transitions after completing missions
        
        // Start contemplative star map music
        this.game.audioSystem.playMusic('menu-theme'); // Using existing theme, can add specific star map music later
        
        // Reset selection state and initialize keyboard cursor to player position
        this.selectedSector = { x: this.playerPosition.x, y: this.playerPosition.y };
        this.showingWarpConfirmation = false;
        this.targetSector = null;
        this.hoveredSector = null;
    }
    
    exit() {
        console.log('Exited StarMapMode');
        
        // Stop star map music
        this.game.audioSystem.stopMusic();
    }
    
    update() {
        // Handle input
        this.handleInput();
        
        // Update animations
        this.animationTimer++;
        this.playerPulseTimer += 0.1;
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // ESC to return to menu (for testing - later this might be restricted)
        if (input.isKeyPressed('Escape')) {
            console.log('ESC pressed - returning to menu');
            this.game.switchToMode('menu');
            return;
        }
        
        // Handle mouse hover for sector highlighting
        const mousePos = input.getMousePosition();
        if (mousePos) {
            const gridPos = this.getGridPosFromScreen(mousePos.x, mousePos.y);
            
            // Allow hovering over any valid sector
            if (gridPos) {
                // Update hovered sector
                if (!this.hoveredSector || this.hoveredSector.x !== gridPos.x || this.hoveredSector.y !== gridPos.y) {
                    this.hoveredSector = gridPos;
                    
                    // Play hover sound if different from last hover
                    if (!this.lastHoverSector || 
                        this.lastHoverSector.x !== gridPos.x || 
                        this.lastHoverSector.y !== gridPos.y) {
                        this.game.audioSystem.playSfx('menu-select');
                        this.lastHoverSector = { ...gridPos };
                    }
                }
            } else {
                this.hoveredSector = null;
            }
        }
        
        // Handle mouse clicks for sector selection
        if (input.isMousePressed() && mousePos) {
            const gridPos = this.getGridPosFromScreen(mousePos.x, mousePos.y);
            
            // Allow clicking on any valid sector (revealed or hidden)
            if (gridPos) {
                this.selectSector(gridPos.x, gridPos.y);
            }
        }
        
        // Keyboard navigation (arrow keys to move cursor, Enter to select)
        if (input.isKeyPressed('ArrowUp') && this.selectedSector && this.selectedSector.y > 0) {
            this.selectedSector.y--;
            this.game.audioSystem.playSfx('menu-select');
        }
        if (input.isKeyPressed('ArrowDown') && this.selectedSector && this.selectedSector.y < this.gridSize - 1) {
            this.selectedSector.y++;
            this.game.audioSystem.playSfx('menu-select');
        }
        if (input.isKeyPressed('ArrowLeft') && this.selectedSector && this.selectedSector.x > 0) {
            this.selectedSector.x--;
            this.game.audioSystem.playSfx('menu-select');
        }
        if (input.isKeyPressed('ArrowRight') && this.selectedSector && this.selectedSector.x < this.gridSize - 1) {
            this.selectedSector.x++;
            this.game.audioSystem.playSfx('menu-select');
        }
        
        // Space to confirm warp to selected sector (allow warping to any sector)
        if (input.isKeyPressed('Space') && this.selectedSector) {
            this.selectSector(this.selectedSector.x, this.selectedSector.y);
        }
        
        // Confirm warp if showing confirmation
        if (this.showingWarpConfirmation) {
            if (input.isKeyPressed('Space') || input.isMousePressed()) {
                this.confirmWarp();
            }
        }
    }
    
    selectSector(x, y) {
        const sector = this.sectors[y][x];
        
        // Can't warp to current position
        if (x === this.playerPosition.x && y === this.playerPosition.y) {
            console.log('Already at this sector');
            return;
        }
        
        // Can't warp to completed sectors
        if (sector.isCompleted) {
            console.log('Sector already completed');
            this.game.audioSystem.playSfx('damage'); // Negative feedback sound
            return;
        }
        
        // Set up warp confirmation
        this.selectedSector = { x: x, y: y };
        this.targetSector = { x: x, y: y };
        this.showingWarpConfirmation = true;
        
        console.log(`Selected sector ${this.getSectorName(x, y)} for warp`);
        this.game.audioSystem.playSfx('selectMapSector');
    }
    
    confirmWarp() {
        if (!this.targetSector) return;
        
        const targetSector = this.sectors[this.targetSector.y][this.targetSector.x];
        
        // Move player to target sector
        this.playerPosition = { ...this.targetSector };
        
        // Reveal target sector and 2 random sectors
        targetSector.isRevealed = true;
        this.revealRandomSectors(2);
        
        // Clear warp confirmation state
        this.showingWarpConfirmation = false;
        this.targetSector = null;
        this.selectedSector = null;
        
        
        console.log(`Warped to sector ${this.getSectorName(this.playerPosition.x, this.playerPosition.y)}`);
        
        // Trigger encounter based on sector type
        this.triggerEncounter(targetSector);
    }
    
    triggerEncounter(sector) {
        console.log(`triggerEncounter called: ${sector.encounterType} (completed: ${sector.isCompleted})`);
        console.log(`Call stack trace: triggerEncounter was called from somewhere`);
        
        // Don't trigger encounters for completed sectors
        if (sector.isCompleted) {
            console.log('Sector already completed - no encounter triggered');
            return;
        }
        
        switch (sector.encounterType) {
            case this.encounterTypes.ENEMY:
                // Transition to combat mode
                console.log('Starting enemy encounter - 10 enemies to defeat');
                this.game.switchToMode('combat');
                break;
                
            case this.encounterTypes.ASTEROID:
                console.log('Asteroid storm encounter - survival challenge');
                this.game.switchToMode('asteroidStorm');
                break;
                
            case this.encounterTypes.ENEMY_PLANET:
                console.log('Enemy planet - starting descent animation');
                // Switch to planet descent mode for the animation
                this.game.switchToMode('planetDescent');
                break;
                
            case this.encounterTypes.ALLY_PLANET:
                console.log('Ally planet - starting descent animation');
                // Switch to ally planet descent mode for the animation
                this.game.switchToMode('allyPlanetDescent');
                break;
        }
    }
    
    render(renderer) {
        // Clear with deep space background
        renderer.clear('#000011');
        
        // Render space background
        this.renderSpaceBackground(renderer);
        
        // Render the grid
        this.renderGrid(renderer);
        
        // Render sectors
        this.renderSectors(renderer);
        
        // Render player position
        this.renderPlayer(renderer);
        
        // Render UI elements
        this.renderUI(renderer);
        
        // Render warp confirmation if active
        if (this.showingWarpConfirmation) {
            this.renderWarpConfirmation(renderer);
        }
    }
    
    renderSpaceBackground(renderer) {
        // Simple starfield background
        renderer.ctx.save();
        
        // Generate some stars based on animation timer for twinkling
        const starCount = 150;
        for (let i = 0; i < starCount; i++) {
            const x = (i * 37) % 800; // Pseudo-random distribution
            const y = (i * 73) % 600;
            const brightness = 0.3 + 0.4 * Math.sin(this.animationTimer * 0.02 + i * 0.5);
            const size = 1 + Math.sin(i * 0.3) * 0.5;
            
            renderer.ctx.globalAlpha = brightness;
            renderer.drawCircle(x, y, size, '#FFFFFF');
        }
        
        renderer.ctx.restore();
    }
    
    renderGrid(renderer) {
        const gridColor = '#003366';
        const lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            const screenX = this.gridOffsetX + (x * this.sectorSize);
            renderer.drawLine(
                screenX, this.gridOffsetY,
                screenX, this.gridOffsetY + (this.gridSize * this.sectorSize),
                gridColor, lineWidth
            );
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            const screenY = this.gridOffsetY + (y * this.sectorSize);
            renderer.drawLine(
                this.gridOffsetX, screenY,
                this.gridOffsetX + (this.gridSize * this.sectorSize), screenY,
                gridColor, lineWidth
            );
        }
        
        // Draw coordinate labels
        // this.renderCoordinateLabels(renderer); // Removed to clean up display
    }
    
    renderCoordinateLabels(renderer) {
        const labelColor = '#00FFFF';
        const fontSize = 14;
        
        // Column labels (A-H)
        for (let x = 0; x < this.gridSize; x++) {
            const label = String.fromCharCode(65 + x);
            const screenX = this.gridOffsetX + (x * this.sectorSize) + (this.sectorSize / 2);
            renderer.drawText(label, screenX, this.gridOffsetY - 20, labelColor, fontSize, 'Courier New');
        }
        
        // Row labels (1-8)
        for (let y = 0; y < this.gridSize; y++) {
            const label = (y + 1).toString();
            const screenY = this.gridOffsetY + (y * this.sectorSize) + (this.sectorSize / 2);
            renderer.drawText(label, this.gridOffsetX - 30, screenY, labelColor, fontSize, 'Courier New');
        }
    }
    
    renderSectors(renderer) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const sector = this.sectors[y][x];
                const screenPos = this.getSectorScreenPos(x, y);
                
                // Only show revealed sectors (fog of war)
                const isVisible = sector.isRevealed;
                
                if (isVisible) {
                    this.renderRevealedSector(renderer, sector, screenPos);
                } else {
                    this.renderHiddenSector(renderer, screenPos);
                }
                
                // Render hover effect (allow on any sector)
                if (this.hoveredSector && this.hoveredSector.x === x && this.hoveredSector.y === y) {
                    this.renderHoverEffect(renderer, screenPos);
                }
                
                // Render selection cursor
                if (this.selectedSector && this.selectedSector.x === x && this.selectedSector.y === y) {
                    this.renderSelectionCursor(renderer, screenPos);
                }
            }
        }
    }
    
    renderHiddenSector(renderer, screenPos) {
        // Dark sector with subtle pattern
        renderer.drawRect(
            screenPos.x + 2, screenPos.y + 2,
            this.sectorSize - 4, this.sectorSize - 4,
            '#001122'
        );
        
        // Question mark or fog pattern
        renderer.drawText('?', 
            screenPos.x + this.sectorSize / 2, 
            screenPos.y + this.sectorSize / 2, 
            '#003366', 20, 'Courier New'
        );
    }
    
    renderRevealedSector(renderer, sector, screenPos) {
        let backgroundColor = '#002244';
        let iconColor = '#FFFFFF';
        let icon = '';
        let labelText = '';
        let labelColor = '#FFFFFF';
        
        // Check if player is on this sector
        const isPlayerSector = (screenPos.x === this.getSectorScreenPos(this.playerPosition.x, this.playerPosition.y).x && 
                               screenPos.y === this.getSectorScreenPos(this.playerPosition.x, this.playerPosition.y).y);
        
        // Determine sector appearance based on type
        switch (sector.encounterType) {
            case this.encounterTypes.ENEMY:
                backgroundColor = '#442200';
                iconColor = '#FF6666';
                icon = '◊'; // Enemy ship
                labelText = 'ENEMY';
                labelColor = '#FF6666';
                break;
            case this.encounterTypes.ASTEROID:
                backgroundColor = '#443300';
                iconColor = '#FFAA00';
                icon = '●'; // Asteroid
                labelText = 'ASTEROIDS';
                labelColor = '#FFAA00';
                break;
            case this.encounterTypes.ENEMY_PLANET:
                backgroundColor = '#440000';
                iconColor = '#FF0000';
                icon = '⬢'; // Enemy planet
                labelText = 'ENEMY PLANET';
                labelColor = '#FF0000';
                break;
            case this.encounterTypes.ALLY_PLANET:
                backgroundColor = '#004400';
                iconColor = '#00FF00';
                icon = '⬟'; // Ally planet
                labelText = 'ALLY PLANET';
                labelColor = '#00FF00';
                break;
        }
        
        // Completed sectors are grayed out (but only if player is not on this sector)
        if (sector.isCompleted && !isPlayerSector) {
            backgroundColor = '#222222';
            iconColor = '#666666';
            icon = '✓';
            labelText = 'COMPLETED';
            labelColor = '#666666';
        }
        
        // Draw sector background
        renderer.drawRect(
            screenPos.x + 2, screenPos.y + 2,
            this.sectorSize - 4, this.sectorSize - 4,
            backgroundColor
        );
        
        // Draw sector icon (but not if player is on this sector - player rendering handles that)
        if (!isPlayerSector) {
            renderer.drawText(icon,
                screenPos.x + this.sectorSize / 2,
                screenPos.y + this.sectorSize / 2 - 8, // Moved up to make room for label
                iconColor, 20, 'Courier New'
            );
            
            // Draw label text under the icon
            renderer.drawText(labelText,
                screenPos.x + this.sectorSize / 2,
                screenPos.y + this.sectorSize / 2 + 12, // Below the icon
                labelColor, 8, 'Courier New' // Smaller font to fit
            );
        }
    }
    
    renderHoverEffect(renderer, screenPos) {
        // Bright hover outline
        renderer.drawStroke(
            screenPos.x + 1, screenPos.y + 1,
            this.sectorSize - 2, this.sectorSize - 2,
            '#00FFFF', 2
        );
    }
    
    renderSelectionCursor(renderer, screenPos) {
        // Animated selection cursor
        const pulseAlpha = 0.5 + 0.3 * Math.sin(this.animationTimer * 0.2);
        renderer.ctx.save();
        renderer.ctx.globalAlpha = pulseAlpha;
        
        renderer.drawStroke(
            screenPos.x, screenPos.y,
            this.sectorSize, this.sectorSize,
            '#FFFF00', 3
        );
        
        renderer.ctx.restore();
    }
    
    renderPlayer(renderer) {
        const screenPos = this.getSectorScreenPos(this.playerPosition.x, this.playerPosition.y);
        
        // Pulsing player indicator
        const pulseScale = 1 + 0.2 * Math.sin(this.playerPulseTimer);
        const size = 8 * pulseScale;
        
        // Player ship icon (cyan circle)
        renderer.drawCircle(
            screenPos.x + this.sectorSize / 2,
            screenPos.y + this.sectorSize / 2 - 8, // Moved up to make room for label
            size, '#00FFFF'
        );
        
        // Ship orientation indicator (small triangle)
        renderer.drawText('▲',
            screenPos.x + this.sectorSize / 2,
            screenPos.y + this.sectorSize / 2 - 8, // Moved up to make room for label
            '#FFFFFF', 12, 'Courier New'
        );
        
        // Player label
        renderer.drawText('PLAYER',
            screenPos.x + this.sectorSize / 2,
            screenPos.y + this.sectorSize / 2 + 12, // Below the icon
            '#00FFFF', 8, 'Courier New'
        );
    }
    
    renderUI(renderer) {
        // Title
        renderer.drawText('STAR MAP - WARP TO ANY SECTOR', 400, 30, '#00FFFF', 24, 'Courier New');
        
        // Left side panel - Player Status & Legend
        this.renderLeftPanel(renderer);
        
        // Right side panel - now empty
        this.renderRightPanel(renderer);
        
        // Bottom instructions - removed per user request
        
        // Simple legend is now part of left panel
    }
    
    renderLeftPanel(renderer) {
        const health = this.game.gameState.player.health;
        const score = this.game.gameState.player.score;
        const currentSectorName = this.getSectorName(this.playerPosition.x, this.playerPosition.y);
        
        // Panel title
        renderer.drawText('STATUS', 70, 80, '#00FFFF', 16, 'Courier New');
        
        // Health status with color coding
        const healthColor = health <= 2 ? '#FF0000' : health <= 4 ? '#FFFF00' : '#00FF00';
        renderer.drawText(`Health: ${health}/7`, 70, 110, healthColor, 14, 'Courier New');
        
        // Score
        renderer.drawText(`Score: ${score}`, 70, 130, '#00FF00', 14, 'Courier New');
        
        // Current location
        renderer.drawText(`Location: ${currentSectorName}`, 70, 150, '#FFFFFF', 14, 'Courier New');
    }
    
    renderRightPanel(renderer) {
        // Right side panel is now empty - mission progress removed
    }
    
    renderWarpConfirmation(renderer) {
        if (!this.targetSector) return;
        
        const sectorName = this.getSectorName(this.targetSector.x, this.targetSector.y);
        const sector = this.sectors[this.targetSector.y][this.targetSector.x];
        const isUnknown = !sector.isRevealed;
        
        // Confirmation dialog
        renderer.drawRect(250, 200, 300, 120, '#001133');
        renderer.drawStroke(250, 200, 300, 120, '#FFFF00', 3);
        
        renderer.drawText('WARP CONFIRMATION', 400, 230, '#FFFF00', 18, 'Courier New');
        
        if (isUnknown) {
            renderer.drawText(`Destination: Sector ${sectorName} (UNKNOWN)`, 400, 255, '#FF8800', 14, 'Courier New');
        } else {
            renderer.drawText(`Destination: Sector ${sectorName}`, 400, 255, '#FFFFFF', 14, 'Courier New');
        }
        
        renderer.drawText('Click anywhere or press SPACE to confirm', 400, 280, '#00FFFF', 12, 'Courier New');
        renderer.drawText('Press ESC to cancel', 400, 300, '#888888', 10, 'Courier New');
    }
    
    calculateVictoryProgress() {
        let enemyPlanets = 0;
        let allyPlanets = 0;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const sector = this.sectors[y][x];
                if (sector.isCompleted) {
                    if (sector.encounterType === this.encounterTypes.ENEMY_PLANET) {
                        enemyPlanets++;
                    } else if (sector.encounterType === this.encounterTypes.ALLY_PLANET) {
                        allyPlanets++;
                    }
                }
            }
        }
        
        return { enemyPlanets, allyPlanets };
    }
    
    // Method to mark current sector as completed (called when returning from encounters)
    completeSector() {
        const sector = this.sectors[this.playerPosition.y][this.playerPosition.x];
        console.log(`Completing sector at ${this.getSectorName(this.playerPosition.x, this.playerPosition.y)}: was completed = ${sector.isCompleted}, encounter type = ${sector.encounterType}`);
        sector.isCompleted = true;
        sector.completedTime = Date.now();
        
        console.log(`Sector ${this.getSectorName(this.playerPosition.x, this.playerPosition.y)} marked as completed`);
        
        // Check victory conditions
        this.checkVictoryConditions();
    }
    
    checkVictoryConditions() {
        const progress = this.calculateVictoryProgress();
        
        if (progress.enemyPlanets >= 3) {
            console.log('VICTORY: All enemy planets destroyed!');
            // Trigger victory sequence
            this.game.gameState.triggerVictory('enemy_route');
        } else if (progress.allyPlanets >= 3) {
            console.log('VICTORY: All ally planets supplied!');
            // Trigger victory sequence  
            this.game.gameState.triggerVictory('ally_route');
        }
    }
}
