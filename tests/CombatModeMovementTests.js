/**
 * Combat Mode Movement Tests
 * Tests for crosshair positioning and world movement functionality
 */

// Mock objects for testing
class MockGame {
    constructor() {
        this.inputSystem = new MockInputSystem();
        this.audioSystem = new MockAudioSystem();
    }
}

class MockInputSystem {
    constructor() {
        this.keysDown = {};
        this.keysPressed = {};
        this.firePressed = false;
    }
    
    isKeyPressed(key) {
        return this.keysDown[key] || false;
    }
    
    isKeyDown(key) {
        return this.keysDown[key] || false;
    }
    
    isFirePressed() {
        return this.firePressed;
    }
    
    isFireHeld() {
        return this.firePressed; // For testing purposes, treat held same as pressed
    }
    
    clearFrameStates() {
        this.keysPressed = {};
        this.firePressed = false;
    }
    
    // Test helpers
    setKeyDown(key, down = true) {
        this.keysDown[key] = down;
    }
    
    setFirePressed(pressed = true) {
        this.firePressed = pressed;
    }
}

class MockAudioSystem {
    playSfx(soundId) {
        // Mock implementation
    }
    
    stopSfx(soundId) {
        // Mock implementation
    }
    
    playMusic(musicId) {
        // Mock implementation
    }
}

class MockRenderer {
    constructor() {
        this.drawCalls = [];
        this.ctx = { globalAlpha: 1.0 };
    }
    
    clear(color) {
        this.drawCalls.push({ type: 'clear', color });
    }
    
    drawLine(x1, y1, x2, y2, color, width) {
        this.drawCalls.push({ 
            type: 'line', 
            x1, y1, x2, y2, color, width 
        });
    }
    
    drawCircle(x, y, radius, color) {
        this.drawCalls.push({ 
            type: 'circle', 
            x, y, radius, color 
        });
    }
    
    drawRect(x, y, width, height, color) {
        this.drawCalls.push({ 
            type: 'rect', 
            x, y, width, height, color 
        });
    }
    
    drawText(text, x, y, color, size, font) {
        this.drawCalls.push({ 
            type: 'text', 
            text, x, y, color, size, font 
        });
    }
    
    drawStroke(x, y, width, height, color, lineWidth) {
        this.drawCalls.push({ 
            type: 'stroke', 
            x, y, width, height, color, lineWidth 
        });
    }
    
    // Test helper
    getDrawCallsByType(type) {
        return this.drawCalls.filter(call => call.type === type);
    }
    
    reset() {
        this.drawCalls = [];
    }
}

// Test Suite
class CombatModeMovementTests {
    constructor() {
        this.tests = [];
        this.setupTests();
    }
    
    setupTests() {
        this.tests = [
            // Crosshair tests
            { name: 'Crosshair Always Centered', test: this.testCrosshairCentered.bind(this) },
            { name: 'Crosshair Fixed Position', test: this.testCrosshairFixedPosition.bind(this) },
            
            // World movement tests
            { name: 'World Position Initial State', test: this.testWorldPositionInitial.bind(this) },
            { name: 'Right Input Decreases World X', test: this.testRightInputWorldMovement.bind(this) },
            { name: 'Left Input Increases World X', test: this.testLeftInputWorldMovement.bind(this) },
            { name: 'Up Input Decreases World Y', test: this.testUpInputWorldMovement.bind(this) },
            { name: 'Down Input Increases World Y', test: this.testDownInputWorldMovement.bind(this) },
            
            // World velocity tests
            { name: 'World Velocity Applied to Position', test: this.testWorldVelocityApplication.bind(this) },
            { name: 'World Friction Applied', test: this.testWorldFriction.bind(this) },
            { name: 'World Position Boundaries', test: this.testWorldPositionBoundaries.bind(this) },
            
            // Integration tests
            { name: 'Natural Controls Integration', test: this.testNaturalControlsIntegration.bind(this) },
            { name: 'World Reset on Enter', test: this.testWorldResetOnEnter.bind(this) }
        ];
    }
    
    createCombatMode() {
        const mockGame = new MockGame();
        return new CombatMode(mockGame);
    }
    
    // Crosshair Tests
    testCrosshairCentered() {
        const combatMode = this.createCombatMode();
        const renderer = new MockRenderer();
        
        // Skip alert screen for crosshair testing
        combatMode.alertActive = false;
        
        // Render crosshair
        combatMode.renderCrosshair(renderer);
        
        // Check that crosshair lines are centered at (400, 300)
        const lines = renderer.getDrawCallsByType('line');
        const circles = renderer.getDrawCallsByType('circle');
        
        // Should have horizontal and vertical lines
        this.assert(lines.length >= 2, 'Should have at least 2 crosshair lines');
        
        // Check horizontal line (should pass through center)
        const horizontalLine = lines.find(line => line.y1 === line.y2 && line.y1 === 300);
        this.assert(horizontalLine, 'Should have horizontal line at y=300');
        
        // Check vertical line (should pass through center)
        const verticalLine = lines.find(line => line.x1 === line.x2 && line.x1 === 400);
        this.assert(verticalLine, 'Should have vertical line at x=400');
        
        // Check center dot
        const centerDot = circles.find(circle => circle.x === 400 && circle.y === 300);
        this.assert(centerDot, 'Should have center dot at (400, 300)');
    }
    
    testCrosshairFixedPosition() {
        const combatMode = this.createCombatMode();
        const renderer = new MockRenderer();
        
        combatMode.alertActive = false;
        
        // Move world position
        combatMode.worldPosition.x = 100;
        combatMode.worldPosition.y = 50;
        
        // Render crosshair
        combatMode.renderCrosshair(renderer);
        
        // Crosshair should still be centered regardless of world position
        const lines = renderer.getDrawCallsByType('line');
        const circles = renderer.getDrawCallsByType('circle');
        
        const horizontalLine = lines.find(line => line.y1 === line.y2 && line.y1 === 300);
        const verticalLine = lines.find(line => line.x1 === line.x2 && line.x1 === 400);
        const centerDot = circles.find(circle => circle.x === 400 && circle.y === 300);
        
        this.assert(horizontalLine, 'Horizontal line should remain at y=300');
        this.assert(verticalLine, 'Vertical line should remain at x=400');
        this.assert(centerDot, 'Center dot should remain at (400, 300)');
    }
    
    // World Movement Tests
    testWorldPositionInitial() {
        const combatMode = this.createCombatMode();
        
        this.assert(combatMode.worldPosition.x === 0, 'Initial world X should be 0');
        this.assert(combatMode.worldPosition.y === 0, 'Initial world Y should be 0');
        this.assert(combatMode.worldVelocity.x === 0, 'Initial world velocity X should be 0');
        this.assert(combatMode.worldVelocity.y === 0, 'Initial world velocity Y should be 0');
    }
    
    testRightInputWorldMovement() {
        const combatMode = this.createCombatMode();
        combatMode.alertActive = false; // Skip alert for input testing
        
        // Simulate right key press
        combatMode.game.inputSystem.setKeyDown('ArrowRight', true);
        
        // Handle input
        combatMode.handleInput();
        
        // World velocity should decrease (move left to create right look)
        this.assert(combatMode.worldVelocity.x < 0, 'Right input should decrease world velocity X');
    }
    
    testLeftInputWorldMovement() {
        const combatMode = this.createCombatMode();
        combatMode.alertActive = false;
        
        // Simulate left key press
        combatMode.game.inputSystem.setKeyDown('ArrowLeft', true);
        
        combatMode.handleInput();
        
        // World velocity should increase (move right to create left look)
        this.assert(combatMode.worldVelocity.x > 0, 'Left input should increase world velocity X');
    }
    
    testUpInputWorldMovement() {
        const combatMode = this.createCombatMode();
        combatMode.alertActive = false;
        
        // Simulate up key press
        combatMode.game.inputSystem.setKeyDown('ArrowUp', true);
        
        combatMode.handleInput();
        
        // World velocity should increase (move down to create up look)
        this.assert(combatMode.worldVelocity.y > 0, 'Up input should increase world velocity Y');
    }
    
    testDownInputWorldMovement() {
        const combatMode = this.createCombatMode();
        combatMode.alertActive = false;
        
        // Simulate down key press
        combatMode.game.inputSystem.setKeyDown('ArrowDown', true);
        
        combatMode.handleInput();
        
        // World velocity should decrease (move up to create down look)
        this.assert(combatMode.worldVelocity.y < 0, 'Down input should decrease world velocity Y');
    }
    
    testWorldVelocityApplication() {
        const combatMode = this.createCombatMode();
        
        // Store initial position
        const initialX = combatMode.worldPosition.x;
        const initialY = combatMode.worldPosition.y;
        
        // Set initial velocity
        combatMode.worldVelocity.x = 5;
        combatMode.worldVelocity.y = -3;
        
        // Update world movement
        combatMode.updateWorldMovement();
        
        // Position should have changed by (velocity * friction) amount
        const expectedX = initialX + (5 * combatMode.friction);
        const expectedY = initialY + (-3 * combatMode.friction);
        
        this.assert(Math.abs(combatMode.worldPosition.x - expectedX) < 0.01, 
            `World position X should update by velocity (expected: ${expectedX}, got: ${combatMode.worldPosition.x})`);
        this.assert(Math.abs(combatMode.worldPosition.y - expectedY) < 0.01, 
            `World position Y should update by velocity (expected: ${expectedY}, got: ${combatMode.worldPosition.y})`);
    }
    
    testWorldFriction() {
        const combatMode = this.createCombatMode();
        
        // Set initial velocity
        combatMode.worldVelocity.x = 10;
        combatMode.worldVelocity.y = 10;
        
        // Update multiple times to see friction effect
        combatMode.updateWorldMovement();
        const velocityAfterOne = { ...combatMode.worldVelocity };
        
        combatMode.updateWorldMovement();
        const velocityAfterTwo = { ...combatMode.worldVelocity };
        
        // Velocity should decrease due to friction
        this.assert(velocityAfterOne.x < 10, 'Friction should reduce velocity X');
        this.assert(velocityAfterOne.y < 10, 'Friction should reduce velocity Y');
        this.assert(velocityAfterTwo.x < velocityAfterOne.x, 'Friction should continue reducing velocity');
    }
    
    testWorldPositionBoundaries() {
        const combatMode = this.createCombatMode();
        
        // Test maximum positive boundary
        combatMode.worldPosition.x = 500; // Beyond maxWorldPosition.x (300)
        combatMode.worldPosition.y = 300; // Beyond maxWorldPosition.y (200)
        
        combatMode.updateWorldMovement();
        
        this.assert(combatMode.worldPosition.x <= 300, 'World X should be clamped to max boundary');
        this.assert(combatMode.worldPosition.y <= 200, 'World Y should be clamped to max boundary');
        
        // Test maximum negative boundary
        combatMode.worldPosition.x = -500;
        combatMode.worldPosition.y = -300;
        
        combatMode.updateWorldMovement();
        
        this.assert(combatMode.worldPosition.x >= -300, 'World X should be clamped to min boundary');
        this.assert(combatMode.worldPosition.y >= -200, 'World Y should be clamped to min boundary');
    }
    
    testNaturalControlsIntegration() {
        const combatMode = this.createCombatMode();
        combatMode.alertActive = false;
        
        // Test right movement feels natural
        combatMode.game.inputSystem.setKeyDown('ArrowRight', true);
        combatMode.handleInput();
        combatMode.updateWorldMovement();
        
        // After right input, world should move left (negative X)
        this.assert(combatMode.worldPosition.x < 0, 'Right input should result in leftward world movement');
        
        // Reset
        combatMode.worldPosition.x = 0;
        combatMode.worldVelocity.x = 0;
        combatMode.game.inputSystem.setKeyDown('ArrowRight', false);
        
        // Test left movement feels natural
        combatMode.game.inputSystem.setKeyDown('ArrowLeft', true);
        combatMode.handleInput();
        combatMode.updateWorldMovement();
        
        // After left input, world should move right (positive X)
        this.assert(combatMode.worldPosition.x > 0, 'Left input should result in rightward world movement');
    }
    
    testWorldResetOnEnter() {
        const combatMode = this.createCombatMode();
        
        // Set some world position and velocity
        combatMode.worldPosition.x = 100;
        combatMode.worldPosition.y = 50;
        combatMode.worldVelocity.x = 5;
        combatMode.worldVelocity.y = -3;
        
        // Enter combat mode (should reset)
        combatMode.enter();
        
        this.assert(combatMode.worldPosition.x === 0, 'World position X should reset to 0 on enter');
        this.assert(combatMode.worldPosition.y === 0, 'World position Y should reset to 0 on enter');
        this.assert(combatMode.worldVelocity.x === 0, 'World velocity X should reset to 0 on enter');
        this.assert(combatMode.worldVelocity.y === 0, 'World velocity Y should reset to 0 on enter');
    }
    
    // Test utility methods
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    // Run all tests
    runTests() {
        let passed = 0;
        let failed = 0;
        const results = [];
        
        console.log('🚀 Running Combat Mode Movement Tests...\n');
        
        for (const test of this.tests) {
            try {
                test.test();
                console.log(`✅ ${test.name}`);
                results.push({ name: test.name, status: 'PASSED' });
                passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                results.push({ name: test.name, status: 'FAILED', error: error.message });
                failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
        
        if (failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Check the details above.');
        }
        
        return results;
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatModeMovementTests;
}
