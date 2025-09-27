/**
 * Input System
 * Handles keyboard and mouse input for the game
 */
class InputSystem {
    constructor() {
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mousePressed = false;
        this.canvas = null;
        
        // Key state tracking
        this.keyPressed = {};
        this.keyReleased = {};
        
        // Fire button tracking (Step 2: Single-button control scheme)
        this.fireButtonHoldStart = 0;
        this.fireButtonHeld = false;
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.setupEventListeners();
        console.log('InputSystem initialized');
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleKeyDown(event) {
        this.keys[event.code] = true;
        this.keyPressed[event.code] = true;
        
        // Fire button hold tracking (Space key is our fire button)
        if (event.code === 'Space' && !this.fireButtonHeld) {
            this.fireButtonHeld = true;
            this.fireButtonHoldStart = Date.now();
        }
        
        // Prevent default behavior for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        this.keys[event.code] = false;
        this.keyReleased[event.code] = true;
        
        // Fire button hold tracking
        if (event.code === 'Space') {
            this.fireButtonHeld = false;
            this.fireButtonHoldStart = 0;
        }
    }
    
    handleMouseMove(event) {
        // Map client coordinates to logical canvas coordinates
        const logical = Viewport.clientToLogical(event.clientX, event.clientY);
        this.mousePos.x = logical.x;
        this.mousePos.y = logical.y;
    }
    
    handleMouseDown(event) {
        this.mousePressed = true;
        event.preventDefault();
    }
    
    handleMouseUp(event) {
        this.mousePressed = false;
    }
    
    // Check if key is currently held down
    isKeyDown(keyCode) {
        return !!this.keys[keyCode];
    }
    
    // Check if key was just pressed this frame
    isKeyPressed(keyCode) {
        return !!this.keyPressed[keyCode];
    }
    
    // Check if key was just released this frame
    isKeyReleased(keyCode) {
        return !!this.keyReleased[keyCode];
    }
    
    // Get mouse position
    getMousePos() {
        return { ...this.mousePos };
    }
    
    // Check if mouse is pressed
    isMousePressed() {
        return this.mousePressed;
    }
    
    // Step 2: Fire button methods for single-button control scheme
    isFirePressed() {
        return this.isKeyPressed('Space');
    }
    
    isFireHeld() {
        return this.fireButtonHeld;
    }
    
    getFireHoldDuration() {
        if (this.fireButtonHeld) {
            return Date.now() - this.fireButtonHoldStart;
        }
        return 0;
    }
    
    // Check if fire button is held for speed boost (500ms threshold)
    isSpeedBoostActive() {
        return this.getFireHoldDuration() > 500;
    }
    
    // Mouse input methods
    getMousePosition() {
        return { x: this.mousePos.x, y: this.mousePos.y };
    }
    
    isMousePressed() {
        return this.mousePressed;
    }
    
    // Clear frame-specific input states (call at end of each frame)
    clearFrameStates() {
        this.keyPressed = {};
        this.keyReleased = {};
        this.mousePressed = false; // Reset mouse pressed state each frame
    }
}
