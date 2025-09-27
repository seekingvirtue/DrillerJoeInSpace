/**
 * Main Game Controller
 * Handles game initialization, state management, and the main game loop
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentMode = null;
        this.gameState = new GameState();
        this.audioSystem = new AudioSystem();
        this.inputSystem = new InputSystem();
    this.renderSystem = new RenderSystem(this.ctx);
        
        // Game modes
        this.modes = {
            menu: null,
            combat: null,
            gameOver: null,
            story: null,
            starMap: null,
            planetDescent: null,
            allyPlanetDescent: null,
            enemyPlanetMission: null,
            victory: null,
            asteroidStorm: null
        };
        
        // Initialize systems
        this.init();
    }
    
    init() {
        // Set up canvas
        this.setupCanvas();
        
        // Initialize input system
        this.inputSystem.init(this.canvas);
        
        // Initialize audio system
        this.audioSystem.init();
        
        // Create menu mode
        this.modes.menu = new MenuMode(this);
        
        // Create combat mode
        this.modes.combat = new CombatMode(this);
        
        // Create game over mode
        this.modes.gameOver = new GameOverMode(this);
        
        // Create story mode
        this.modes.story = new StoryMode(this);
        
        // Create star map mode
        this.modes.starMap = new StarMapMode(this);
        
        // Create planet descent mode
        this.modes.planetDescent = new PlanetDescentMode(this);
        
        // Create ally planet descent mode
        this.modes.allyPlanetDescent = new AllyPlanetDescentMode(this);
        
        // Create enemy planet mission mode
        this.modes.enemyPlanetMission = new EnemyPlanetMissionMode(this);
        
        // Create victory mode
        this.modes.victory = new VictoryMode(this);
        
        // Create asteroid storm mode
        this.modes.asteroidStorm = new AsteroidStormMode(this);
        
        // Start with menu
        this.switchToMode('menu');
        
        console.log('Game initialized successfully');
    }
    
    setupCanvas() {
        // Initialize viewport to manage logical resolution and scaling
        // Logical resolution remains 800x600 for game math.
        Viewport.setup(this.canvas, this.ctx, 800, 600);

        // Set default text alignment in logical space
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }
    
    switchToMode(modeName) {
        if (this.currentMode && this.currentMode.exit) {
            this.currentMode.exit();
        }
        
        this.currentMode = this.modes[modeName];
        
        if (this.currentMode && this.currentMode.enter) {
            this.currentMode.enter();
        }
        
        console.log(`Switched to mode: ${modeName}`);
    }
    
    resetAllGameModes() {
        // Reset the game state
        this.gameState.resetGame();
        
        // Reset the star map universe for a fresh game
        if (this.modes.starMap && this.modes.starMap.resetUniverse) {
            this.modes.starMap.resetUniverse();
        }
        
        console.log('All game modes reset for new game');
    }
    
    start() {
        // Start the game loop
        this.gameLoop();
        console.log('Game started');
    }
    
    gameLoop() {
        // Update current mode
        if (this.currentMode && this.currentMode.update) {
            this.currentMode.update();
        }
        
        // Clear screen
        this.renderSystem.clear();
        
        // Render current mode
        if (this.currentMode && this.currentMode.render) {
            this.currentMode.render(this.renderSystem);
        }
        
        // Clear input frame states at end of each frame (critical for proper input handling)
        this.inputSystem.clearFrameStates();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    exit() {
        console.log('Driller Joe In Space exiting...');
        // Placeholder for game exit functionality
        alert('Pslams 144 1:2 - Blessed be the LORD my strength, which teacheth my hands to war, and my fingers to fight: my goodness, and my fortress; my high tower, and my deliverer; my shield, and He in whom I trust; who subdueth my people under me!');
    }
}
