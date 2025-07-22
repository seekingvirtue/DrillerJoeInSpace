/**
 * Unit Tests for GameState.js
 * Tests core game state functionality
 */

// GameState Tests
unitTest.test('GameState - Initial player health should be 7', () => {
    const gameState = new GameState();
    unitTest.assertEqual(gameState.player.health, 7, 'Player should start with 7 health points');
});

unitTest.test('GameState - Initial score should be 0', () => {
    const gameState = new GameState();
    unitTest.assertEqual(gameState.player.score, 0, 'Player should start with 0 score');
});

unitTest.test('GameState - Universe should be 8x8 grid', () => {
    const gameState = new GameState();
    unitTest.assertEqual(gameState.universe.gridSize, 8, 'Universe should be 8x8 grid');
    unitTest.assertEqual(gameState.universe.sectors.length, 64, 'Should have 64 sectors total');
});

unitTest.test('GameState - Player should start at position (4,4)', () => {
    const gameState = new GameState();
    unitTest.assertEqual(gameState.player.position.x, 4, 'Player should start at x=4');
    unitTest.assertEqual(gameState.player.position.y, 4, 'Player should start at y=4');
});

unitTest.test('GameState - Damage player health', () => {
    const gameState = new GameState();
    const initialHealth = gameState.player.health;
    
    gameState.damagePlayer(2);
    
    unitTest.assertEqual(gameState.player.health, initialHealth - 2, 'Health should decrease by damage amount');
});

unitTest.test('GameState - Health cannot go below 0', () => {
    const gameState = new GameState();
    
    gameState.damagePlayer(10); // More than max health
    
    unitTest.assertEqual(gameState.player.health, 0, 'Health should not go below 0');
});

unitTest.test('GameState - Player is alive with health > 0', () => {
    const gameState = new GameState();
    
    unitTest.assertTrue(gameState.isPlayerAlive(), 'Player should be alive with full health');
    
    gameState.damagePlayer(6); // Health becomes 1
    unitTest.assertTrue(gameState.isPlayerAlive(), 'Player should be alive with 1 health');
    
    gameState.damagePlayer(1); // Health becomes 0
    unitTest.assertFalse(gameState.isPlayerAlive(), 'Player should be dead with 0 health');
});

unitTest.test('GameState - Add score increases total', () => {
    const gameState = new GameState();
    
    gameState.addScore(100);
    unitTest.assertEqual(gameState.player.score, 100, 'Score should increase by added amount');
    
    gameState.addScore(50);
    unitTest.assertEqual(gameState.player.score, 150, 'Score should accumulate');
});

unitTest.test('GameState - Move player updates position', () => {
    const gameState = new GameState();
    const initialX = gameState.player.position.x;
    const initialY = gameState.player.position.y;
    
    gameState.movePlayer(1, 0); // Move right
    
    unitTest.assertEqual(gameState.player.position.x, initialX + 1, 'X position should increase');
    unitTest.assertEqual(gameState.player.position.y, initialY, 'Y position should remain same');
});

unitTest.test('GameState - Player cannot move outside universe bounds', () => {
    const gameState = new GameState();
    
    // Move to edge
    gameState.player.position.x = 0;
    gameState.player.position.y = 0;
    
    gameState.movePlayer(-1, -1); // Try to move outside
    
    unitTest.assertEqual(gameState.player.position.x, 0, 'X should not go below 0');
    unitTest.assertEqual(gameState.player.position.y, 0, 'Y should not go below 0');
    
    // Test upper bounds
    gameState.player.position.x = 7;
    gameState.player.position.y = 7;
    
    gameState.movePlayer(1, 1); // Try to move outside
    
    unitTest.assertEqual(gameState.player.position.x, 7, 'X should not exceed grid size');
    unitTest.assertEqual(gameState.player.position.y, 7, 'Y should not exceed grid size');
});

unitTest.test('GameState - Save and load functionality', () => {
    const gameState = new GameState();
    
    // Modify state
    gameState.damagePlayer(2);
    gameState.addScore(250);
    gameState.movePlayer(2, 1);
    
    // Save state
    gameState.save();
    
    // Create new instance and load
    const newGameState = new GameState();
    newGameState.load();
    
    unitTest.assertEqual(newGameState.player.health, 5, 'Loaded health should match saved');
    unitTest.assertEqual(newGameState.player.score, 250, 'Loaded score should match saved');
    unitTest.assertEqual(newGameState.player.position.x, 6, 'Loaded X position should match saved');
    unitTest.assertEqual(newGameState.player.position.y, 5, 'Loaded Y position should match saved');
});

unitTest.test('GameState - Reset clears progress', () => {
    const gameState = new GameState();
    
    // Modify state
    gameState.damagePlayer(3);
    gameState.addScore(500);
    gameState.movePlayer(3, 2);
    
    // Reset
    gameState.reset();
    
    unitTest.assertEqual(gameState.player.health, 7, 'Health should reset to 7');
    unitTest.assertEqual(gameState.player.score, 0, 'Score should reset to 0');
    unitTest.assertEqual(gameState.player.position.x, 4, 'X should reset to 4');
    unitTest.assertEqual(gameState.player.position.y, 4, 'Y should reset to 4');
});
