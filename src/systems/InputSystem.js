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
        // Gamepad fields
        this.gamepadIndex = null; // preferred index if set
        this.gamepadConnected = false;
        this.gamepadDeadzone = 0.3;
        this._prevSynthKeys = {};
        this._lastGamepadState = null;
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

        // Gamepad connection events
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad);
            this.gamepadConnected = true;
            // prefer the connected index if none selected
            if (this.gamepadIndex === null) this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad);
            // If the disconnected gamepad was our preferred one, clear it
            if (this.gamepadIndex === e.gamepad.index) this.gamepadIndex = null;
            // Check if any gamepads remain
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            this.gamepadConnected = Array.from(pads).some(p => p);
        });
    }

    // Polling update for gamepad state synthesis. Call once per frame before mode.update().
    update() {
        if (!navigator.getGamepads) return;

        const pads = navigator.getGamepads();
        if (!pads) return;

        // Choose a gamepad: preferred index if available, otherwise first connected
        let gp = null;
        if (this.gamepadIndex !== null && pads[this.gamepadIndex]) gp = pads[this.gamepadIndex];
        if (!gp) {
            for (let i = 0; i < pads.length; i++) {
                if (pads[i]) { gp = pads[i]; this.gamepadIndex = i; break; }
            }
        }

        if (!gp) {
            this.gamepadConnected = false;
            this._lastGamepadState = null;
            // clear any synthesized keys if needed
            this._synthesizeKeys({}, true);
            return;
        }

        this.gamepadConnected = true;

        // Snapshot raw state for helpers
        const snapshot = {
            axes: gp.axes ? gp.axes.slice(0) : [],
            buttons: gp.buttons ? gp.buttons.map(b => ({ pressed: !!b.pressed, value: b.value })) : []
        };
        this._lastGamepadState = snapshot;

        // Build synthesized key map based on left stick + buttons
        const synth = {};

        const lx = snapshot.axes[0] || 0;
        const ly = snapshot.axes[1] || 0;

        if (lx < -this.gamepadDeadzone) synth['ArrowLeft'] = true;
        if (lx > this.gamepadDeadzone) synth['ArrowRight'] = true;
        if (ly < -this.gamepadDeadzone) synth['ArrowUp'] = true;
        if (ly > this.gamepadDeadzone) synth['ArrowDown'] = true;

        // Buttons mapping: button 0 -> Space (fire), 9 -> Enter, 8 -> Escape
        if (snapshot.buttons[0] && snapshot.buttons[0].pressed) synth['Space'] = true;
        if (snapshot.buttons[9] && snapshot.buttons[9].pressed) synth['Enter'] = true;
        if (snapshot.buttons[8] && snapshot.buttons[8].pressed) synth['Escape'] = true;

        this._synthesizeKeys(synth);
    }

    _synthesizeKeys(synthMap, forceClear = false) {
        // synthMap is an object with keyCode:true for keys currently down from gamepad
        // Compare with previous synthesized keys and generate pressed/released events
        const prev = this._prevSynthKeys || {};

        // Keys that are now down
        Object.keys(synthMap).forEach(k => {
            if (synthMap[k]) {
                if (!this.keys[k]) this.keyPressed[k] = true;
                this.keys[k] = true;

                // Fire button hold tracking for Space
                if (k === 'Space' && !this.fireButtonHeld) {
                    this.fireButtonHeld = true;
                    this.fireButtonHoldStart = Date.now();
                }
            }
        });

        // Handle keys that were previously synthesized but no longer are
        Object.keys(prev).forEach(k => {
            if (!synthMap[k] || forceClear) {
                // Only generate release if we had set it
                if (this.keys[k]) this.keyReleased[k] = true;
                this.keys[k] = false;

                if (k === 'Space') {
                    this.fireButtonHeld = false;
                    this.fireButtonHoldStart = 0;
                }
            }
        });

        // Save current synth map
        this._prevSynthKeys = { ...synthMap };
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

    // Helpers for gamepad presence/state
    isGamepadConnected() {
        return !!this.gamepadConnected;
    }

    getGamepadState() {
        return this._lastGamepadState;
    }
}
