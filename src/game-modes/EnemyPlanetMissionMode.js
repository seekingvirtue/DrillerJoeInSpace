/**
 * Enemy Planet Mission Mode
 * River Raid-style vertical scrolling shooter for enemy planet assault
 * SIMPLIFIED VERSION - Focus on corridor rendering and scrolling first
 */
class EnemyPlanetMissionMode {
    constructor(game) {
        this.game = game;
        
        // Mission state
        this.missionActive = false;
        this.missionTimer = 0;
        this.missionComplete = false;
        this.missionFailed = false;
        this.completionHandled = false; // Prevent multiple completion calls
        this.transitionInProgress = false; // Prevent race conditions between update and input
        
        // Victory/completion timing (enhanced with fade effects)
        this.victoryTimer = 0;
        this.victoryDuration = 300; // 5 seconds at 60fps (extended for better fade effects)
        this.victoryActive = false;
        
        // Scrolling system
        this.scrollY = 0;
        this.scrollSpeed = 6; // Increased from 2 to 6 for faster movement
        
        // Terrain system
        this.terrainSegments = [];
        this.terrainWidth = 300; // Initial canyon width
        
        // Player system
        this.player = {
            x: 400,  // Center of screen
            y: 500,  // Near bottom
            width: 20,
            height: 30
            // Health will be managed by existing planet descent system
        };
        
        // Player ship color pulsing
        this.playerColorPhase = 0;
        this.playerColors = [
            '#00FFFF',  // Cyan
            '#00BFFF',  // Deep sky blue
            '#0080FF',  // Dodger blue
            '#4169E1',  // Royal blue
            '#6495ED',  // Cornflower blue
            '#87CEEB',  // Sky blue
            '#ADD8E6'   // Light blue
        ];
        
        // Obstacle system
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleColorPhase = 0;
        this.obstacleColors = ['#FFFF00', '#8B008B']; // Yellow and purple
        
        // Player shooting system
        this.projectiles = [];
        this.fireRate = 12; // frames between shots (5 shots per second at 60fps)
        this.lastFireFrame = 0;
        this.projectileSpeed = 12; // Pixels per frame (fast moving)
        
        // Barrier system (destructible targets worth 1 point each)
        this.barriers = [];
        this.barrierSpawnTimer = 0;
        this.barrierFlashPhase = 0;
        this.score = 0; // Track destroyed barriers
        
        // Exit point system
        this.exitPoint = {
            x: 400,  // Center of screen
            y: -1000, // Will be set when spawned
            size: 100,  // Increased from 80 to 100
            flashPhase: 0,
            reached: false,
            spawned: false,
            active: false
        };
        this.exitColors = ['#00FF00', '#FFFF00', '#00FFFF']; // Green, yellow, cyan flashing
        
        // Exit point spawn timing (reduced for testing - 30-60 seconds = 1800-3600 frames at 60fps)
        this.exitSpawnTime = 1800 + Math.random() * 1800; // Random between 30-60 seconds (reduced from 90-120)
        console.log(`Exit point will spawn at ${Math.floor(this.exitSpawnTime / 60)} seconds`);
        
        // Rear missile enemy system
        this.rearMissiles = [];
        this.rearMissileTimer = 0;
        this.warningIndicators = [];
        this.rearMissileSpawnInterval = this.getRandomMissileInterval(); // Random 5-10 seconds
        this.rearMissileSpeed = 2; // Slow moving missiles
        
        // Dynamic corridor system
        this.corridorSegments = [];
        this.currentWidth = 300; // Track current width for smooth transitions
        this.serpentinePhase = 0; // For creating serpentine patterns
        
        // Red color palette for rocky walls (7 different shades)
        this.redPalette = [
            '#8B2635',  // Dark red
            '#A52A2A',  // Brown red
            '#CD5C5C',  // Indian red
            '#B22222',  // Fire brick
            '#DC143C',  // Crimson
            '#8B0000',  // Dark red
            '#9B111E'   // Ruby red
        ];
        
        this.generateDynamicCorridor();
        
        console.log('EnemyPlanetMissionMode initialized (simplified version)');
    }
    
    getRandomMissileInterval() {
        // Return random interval between 5-10 seconds (300-600 frames at 60fps)
        return 300 + Math.floor(Math.random() * 301); // 300-600 frames
    }
    
    enter() {
        console.log('Entering Enemy Planet Mission - Simple Static Corridor');
        
        // Initialize mission
        this.missionActive = true;
        this.missionTimer = 0;
        this.missionComplete = false;
        this.missionFailed = false;
        this.completionHandled = false;
        this.transitionInProgress = false;

        // Reset victory state
        this.victoryTimer = 0;
        this.victoryActive = false;        // Reset scrolling and regenerate corridor
        this.scrollY = 0;
        this.currentWidth = 300;
        this.serpentinePhase = 0;
        this.generateDynamicCorridor();
        
        // Reset player position and state
        this.player.x = 400;  // Center of screen
        this.player.y = 500;  // Near bottom
        // Keep existing health from planet descent system
        this.playerColorPhase = 0;
        
        // Reset obstacles
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleColorPhase = 0;
        
        // Reset shooting system
        this.projectiles = [];
        this.lastFireFrame = 0;
        
        // Reset rear missile system
        this.rearMissiles = [];
        this.warningIndicators = [];
        this.rearMissileTimer = 0;
        this.rearMissileSpawnInterval = this.getRandomMissileInterval(); // New random interval
        
        // Reset barriers but keep score from game state
        this.barriers = [];
        this.barrierSpawnTimer = 0;
        this.barrierFlashPhase = 0;
        this.score = 0; // Local score counter starts at 0 for this mission
        
        // Reset exit point
        this.exitPoint.x = 400;
        this.exitPoint.y = -1000; // Will be set when spawned
        this.exitPoint.flashPhase = 0;
        this.exitPoint.reached = false;
        this.exitPoint.spawned = false;
        this.exitPoint.active = false;
        
        // Set random exit spawn time (30-60 seconds for easier testing)
        this.exitSpawnTime = 5400 + Math.random() * 1800; // 5400-7200 frames (90-120 seconds)
        console.log(`Exit point will spawn at ${Math.floor(this.exitSpawnTime / 60)} seconds`);
        
        // Start enemy planet music (looping)
        if (this.game.audioSystem) {
            this.game.audioSystem.playMusic('enemyPlanetMusic', true); // true for looping
        }
        
        console.log(`Enemy planet mission started. Global score: ${this.game.gameState.getScore()}, Local mission score: ${this.score}`);
    }
    
    generateDynamicCorridor() {
        this.corridorSegments = [];
        const segmentHeight = 50;
        const totalSegments = 20; // Extra segments for smooth scrolling
        
        // More dramatic width variations for 2-minute test
        const minWidth = 150;  // Much narrower minimum
        const maxWidth = 300;  // Same maximum as default
        
        console.log('Generating dynamic 2-minute corridor with serpentine patterns');
        
        for (let i = 0; i < totalSegments; i++) {
            const y = -i * segmentHeight; // Start above screen and go up
            
            // Create serpentine patterns using sine wave
            this.serpentinePhase += 0.2; // Advance the wave
            const serpentineInfluence = Math.sin(this.serpentinePhase) * 40; // ±40px wave
            
            // Combine random changes with serpentine patterns
            const randomChange = (Math.random() - 0.5) * 60; // Larger random changes ±30px
            const totalChange = randomChange + serpentineInfluence * 0.3; // Blend both effects
            
            this.currentWidth += totalChange;
            
            // Keep width within bounds but allow more dramatic changes
            this.currentWidth = Math.max(minWidth, Math.min(maxWidth, this.currentWidth));
            
            // Add some horizontal offset for serpentine movement
            const horizontalOffset = Math.sin(this.serpentinePhase * 0.7) * 30; // Side-to-side movement
            
            // Calculate wall positions with offset
            const centerX = 400 + horizontalOffset;
            const leftWall = centerX - this.currentWidth / 2;
            const rightWall = centerX + this.currentWidth / 2;
            
            // Ensure walls stay within screen bounds
            const clampedLeftWall = Math.max(50, Math.min(leftWall, 350));
            const clampedRightWall = Math.max(450, Math.min(rightWall, 750));
            
            this.corridorSegments.push({
                y: y,
                leftWall: clampedLeftWall,
                rightWall: clampedRightWall,
                width: clampedRightWall - clampedLeftWall
            });
        }
        
        console.log(`Generated ${totalSegments} serpentine corridor segments for 2-minute test`);
    }
    
    updateScrollingCorridor() {
        const segmentHeight = 50;
        
        // Move all segments down
        for (let segment of this.corridorSegments) {
            segment.y += this.scrollSpeed;
        }
        
        // Remove segments that have scrolled off the bottom
        this.corridorSegments = this.corridorSegments.filter(segment => segment.y < 700);
        
        // Add new segments at the top when needed
        while (this.corridorSegments.length < 20) {
            // Find the topmost segment
            let topY = Math.min(...this.corridorSegments.map(s => s.y));
            let newY = topY - segmentHeight;
            
            // Generate new segment with serpentine and random variations
            const minWidth = 150;
            const maxWidth = 300;
            
            // Advance serpentine pattern
            this.serpentinePhase += 0.2;
            const serpentineInfluence = Math.sin(this.serpentinePhase) * 40;
            
            // Combine effects
            const randomChange = (Math.random() - 0.5) * 60;
            const totalChange = randomChange + serpentineInfluence * 0.3;
            
            this.currentWidth += totalChange;
            this.currentWidth = Math.max(minWidth, Math.min(maxWidth, this.currentWidth));
            
            // Add horizontal serpentine movement
            const horizontalOffset = Math.sin(this.serpentinePhase * 0.7) * 30;
            const centerX = 400 + horizontalOffset;
            
            let leftWall = centerX - this.currentWidth / 2;
            let rightWall = centerX + this.currentWidth / 2;
            
            // Clamp to screen bounds
            leftWall = Math.max(50, Math.min(leftWall, 350));
            rightWall = Math.max(450, Math.min(rightWall, 750));
            
            this.corridorSegments.push({
                y: newY,
                leftWall: leftWall,
                rightWall: rightWall,
                width: rightWall - leftWall
            });
        }
    }
    
    updateObstacles() {
        // Move existing obstacles down
        for (let obstacle of this.obstacles) {
            obstacle.y += this.scrollSpeed;
        }
        
        // Remove obstacles that have scrolled off screen
        this.obstacles = this.obstacles.filter(obstacle => obstacle.y < 700);
        
        // Dynamic spawn frequency - gets faster over time
        this.obstacleSpawnTimer++;
        
        // Calculate dynamic spawn interval based on elapsed time
        // Start at 180 frames (3 seconds), reduce to 60 frames (1 second) over 2 minutes
        // But keep going past 2 minutes if exit hasn't spawned yet
        const timeElapsed = this.missionTimer / 60; // Convert to seconds
        const maxTime = 120; // 2 minutes in seconds
        const timeProgress = Math.min(timeElapsed / maxTime, 1.0); // Cap at 1.0 for max difficulty
        
        const maxSpawnInterval = 180; // 3 seconds at start
        const minSpawnInterval = 60;  // 1 second at max difficulty
        const currentSpawnInterval = maxSpawnInterval - (timeProgress * (maxSpawnInterval - minSpawnInterval));
        
        if (this.obstacleSpawnTimer > currentSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
    }
    
    spawnObstacle() {
        // Find a corridor segment near the top of screen to place obstacle in
        const topSegments = this.corridorSegments.filter(segment => segment.y >= -100 && segment.y <= 50);
        if (topSegments.length === 0) return;
        
        const segment = topSegments[Math.floor(Math.random() * topSegments.length)];
        
        // Place obstacle within the corridor bounds with some margin
        const margin = 30;
        const minX = segment.leftWall + margin;
        const maxX = segment.rightWall - margin;
        
        if (maxX <= minX) return; // Corridor too narrow
        
        const obstacleX = minX + Math.random() * (maxX - minX);
        
        // Random shape: 0=circle, 1=diamond, 2=pentagon
        const shapes = ['circle', 'diamond', 'pentagon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        const obstacle = {
            x: obstacleX,
            y: -30, // Start above screen
            size: 20, // Similar to ship size
            shape: shape,
            colorPhase: Math.random() * Math.PI * 2 // Random starting phase
        };
        
        this.obstacles.push(obstacle);
        
        // Play obstacle spawn sound
        if (this.game.audioSystem) {
            this.game.audioSystem.playSfx('obstacleSpawn');
        }
        
        console.log(`Spawned ${shape} obstacle at x:${Math.round(obstacleX)}, y:${obstacle.y}`);
    }
    
    checkExitPointSpawn() {
        // Check if it's time to spawn the exit point
        if (!this.exitPoint.spawned && this.missionTimer >= this.exitSpawnTime) {
            this.spawnExitPoint();
        }
    }
    
    spawnExitPoint() {
        console.log(`Spawning exit point at ${Math.floor(this.missionTimer / 60)} seconds`);
        
        // Find a good corridor segment to spawn the exit point in (near the top of screen)
        const topSegments = this.corridorSegments.filter(segment => segment.y >= -200 && segment.y <= -50);
        
        if (topSegments.length > 0) {
            const segment = topSegments[Math.floor(Math.random() * topSegments.length)];
            
            // Position exit point in center of the corridor segment
            this.exitPoint.x = (segment.leftWall + segment.rightWall) / 2;
            this.exitPoint.y = segment.y; // Spawn at the segment's position
        } else {
            // Fallback positioning if no good segment found
            this.exitPoint.x = 400;
            this.exitPoint.y = -100;
        }
        
        this.exitPoint.spawned = true;
        this.exitPoint.active = true;
        this.exitPoint.flashPhase = 0;
        
        // Play a special spawn sound effect
        if (this.game.audioSystem) {
            this.game.audioSystem.playSfx('enteringEnemyOrbit'); // Dramatic entrance sound
        }
        
        console.log(`Exit point spawned at x:${Math.round(this.exitPoint.x)}, y:${Math.round(this.exitPoint.y)}`);
    }
    
    updateExitPoint() {
        if (!this.exitPoint.active) return;
        
        // Move exit point down with the scrolling, but slow down if getting close to bottom
        if (this.exitPoint.y < 450) {
            // Normal scrolling speed when exit is in upper part of screen
            this.exitPoint.y += this.scrollSpeed;
        } else if (this.exitPoint.y < 550) {
            // Slow down scrolling when exit approaches bottom half
            this.exitPoint.y += this.scrollSpeed * 0.5;
        } else {
            // Stop scrolling when exit reaches lower screen to give player time
            // Exit point stays at this position
            console.log('Exit point reached bottom area - holding position');
        }
        
        // Update flashing phase (faster when near bottom to draw attention)
        const flashSpeed = this.exitPoint.y > 450 ? 0.5 : 0.3;
        this.exitPoint.flashPhase += flashSpeed;
        
        // Keep exit point centered in the corridor
        // Find the corridor segment at the exit point's position
        const exitSegments = this.corridorSegments.filter(segment => 
            Math.abs(segment.y - this.exitPoint.y) < 25
        );
        
        if (exitSegments.length > 0) {
            const segment = exitSegments[0];
            this.exitPoint.x = (segment.leftWall + segment.rightWall) / 2; // Center of corridor
        } else {
            this.exitPoint.x = 400; // Default center if no segment found
        }
    }
    
    checkExitPointCollision() {
        if (this.exitPoint.reached) return;
        
        // Check if player is close to exit point
        const dx = this.player.x - this.exitPoint.x;
        const dy = this.player.y - this.exitPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.exitPoint.size / 2 + this.player.width / 2) {
            this.exitPoint.reached = true;
            this.missionComplete = true;
            this.victoryActive = true;
            this.victoryTimer = this.victoryDuration; // Start victory countdown
            console.log('Player reached exit point! Mission complete!');
            
            // Play a success sound effect
            if (this.game.audioSystem) {
                this.game.audioSystem.playSfx('enteringAllyOrbit'); // Reuse existing sound
            }
        }
    }
    
    checkCollisions() {
        // Check collision with obstacles
        for (const obstacle of this.obstacles) {
            const dx = this.player.x - obstacle.x;
            const dy = this.player.y - obstacle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < obstacle.size / 2 + this.player.width / 2) {
                console.log('Player hit obstacle - mission failed');
                this.missionFailed = true;
                
                // Play damage sound
                if (this.game.audioSystem) {
                    this.game.audioSystem.playSfx('damageTaken');
                }
                return;
            }
        }
        
        // Check collision with barriers (deadly like obstacles)
        for (const barrier of this.barriers) {
            const dx = this.player.x - barrier.x;
            const dy = this.player.y - barrier.y;
            
            // Rectangle collision with player - use smaller hitbox for barriers for forgiving gameplay
            const barrierHitboxWidth = barrier.width * 0.7; // 70% of visual size - more forgiving for player
            const barrierHitboxHeight = barrier.height * 0.7; // 70% of visual size - more forgiving for player
            const playerHitboxWidth = this.player.width * 0.8; // Also slightly smaller player hitbox
            const playerHitboxHeight = this.player.height * 0.8;
            
            if (this.player.x + playerHitboxWidth/2 > barrier.x - barrierHitboxWidth/2 &&
                this.player.x - playerHitboxWidth/2 < barrier.x + barrierHitboxWidth/2 &&
                this.player.y + playerHitboxHeight/2 > barrier.y - barrierHitboxHeight/2 &&
                this.player.y - playerHitboxHeight/2 < barrier.y + barrierHitboxHeight/2) {
                
                console.log('Player hit barrier - mission failed');
                this.missionFailed = true;
                
                // Play damage sound
                if (this.game.audioSystem) {
                    this.game.audioSystem.playSfx('damageTaken');
                }
                return;
            }
        }
        
        // Check collision with corridor walls
        const playerSegments = this.corridorSegments.filter(segment => 
            segment.y <= this.player.y && segment.y + 50 > this.player.y
        );
        
        if (playerSegments.length > 0) {
            const segment = playerSegments[0];
            const margin = this.player.width / 2;
            
            if (this.player.x - margin < segment.leftWall || this.player.x + margin > segment.rightWall) {
                console.log('Player hit wall - mission failed');
                this.missionFailed = true;
                
                // Play damage sound
                if (this.game.audioSystem) {
                    this.game.audioSystem.playSfx('damageTaken');
                }
                return;
            }
        }
    }
    
    spawnObstacle() {
        // Find a corridor segment near the top of screen to place obstacle in
        const topSegments = this.corridorSegments.filter(segment => segment.y >= -100 && segment.y <= 50);
        if (topSegments.length === 0) return;
        
        const segment = topSegments[Math.floor(Math.random() * topSegments.length)];
        
        // Check if exit point is nearby - don't spawn obstacles near it (only if exit is active)
        if (this.exitPoint.active) {
            const exitNearby = Math.abs(this.exitPoint.y - segment.y) < 100;
            if (exitNearby) {
                console.log('Skipping obstacle spawn - too close to exit point');
                return;
            }
        }
        
        // Place obstacle within the corridor bounds with some margin
        const margin = 30;
        const minX = segment.leftWall + margin;
        const maxX = segment.rightWall - margin;
        
        if (maxX <= minX) return; // Corridor too narrow
        
        const obstacleX = minX + Math.random() * (maxX - minX);
        
        // Random shape: 0=circle, 1=diamond, 2=pentagon
        const shapes = ['circle', 'diamond', 'pentagon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        const obstacle = {
            x: obstacleX,
            y: -30, // Start above screen
            size: 20, // Similar to ship size
            shape: shape,
            colorPhase: Math.random() * Math.PI * 2 // Random starting phase
        };
        
        this.obstacles.push(obstacle);
        
        // Play obstacle spawn sound
        if (this.game.audioSystem) {
            this.game.audioSystem.playSfx('obstacleSpawn');
        }
        
        console.log(`Spawned ${shape} obstacle at x:${Math.round(obstacleX)}, y:${obstacle.y}`);
    }
    
    fireProjectile() {
        // Create a projectile from the player's position
        const projectile = {
            x: this.player.x,
            y: this.player.y - 15, // Start slightly above player
            width: 4,
            height: 12,
            speed: this.projectileSpeed
        };
        
        this.projectiles.push(projectile);
        
        // Play shooting sound
        if (this.game.audioSystem) {
            this.game.audioSystem.playSfx('enemyPlanetPlayerShoot');
        }
        
        console.log(`Player fired projectile at x:${Math.round(projectile.x)}, y:${Math.round(projectile.y)}`);
    }
    
    updateProjectiles() {
        // Move projectiles upward
        for (let projectile of this.projectiles) {
            projectile.y -= projectile.speed;
        }
        
        // Remove projectiles that have gone off screen
        this.projectiles = this.projectiles.filter(projectile => projectile.y > -20);
        
        // Check collisions with barriers (destroys both)
        this.checkProjectileBarrierCollisions();
        
        // Check collisions with obstacles (destroys projectile only)
        this.checkProjectileObstacleCollisions();
    }
    
    updateBarriers() {
        // Move existing barriers down
        for (let barrier of this.barriers) {
            barrier.y += this.scrollSpeed;
        }
        
        // Remove barriers that have scrolled off screen
        this.barriers = this.barriers.filter(barrier => barrier.y < 700);
        
        // Update barrier flash phase
        this.barrierFlashPhase += 0.3;
        
        // Spawn new barriers much more frequently
        this.barrierSpawnTimer++;
        
        // Calculate dynamic spawn rate - start at 60 frames (1 second), reduce to 15 frames (0.25 seconds)
        const timeElapsed = this.missionTimer / 60; // Convert to seconds
        const maxTime = 120; // 2 minutes in seconds
        const timeProgress = Math.min(timeElapsed / maxTime, 1.0);
        
        const maxSpawnInterval = 60; // 1 second at start (much faster than before)
        const minSpawnInterval = 15;  // 0.25 seconds at max difficulty (very frequent)
        const currentSpawnInterval = maxSpawnInterval - (timeProgress * (maxSpawnInterval - minSpawnInterval));
        
        if (this.barrierSpawnTimer > currentSpawnInterval) {
            this.spawnBarrier();
            this.barrierSpawnTimer = 0;
        }
    }
    
    spawnBarrier() {
        // Find a corridor segment to place barrier in
        const topSegments = this.corridorSegments.filter(segment => segment.y >= -100 && segment.y <= 50);
        if (topSegments.length === 0) return;
        
        const segment = topSegments[Math.floor(Math.random() * topSegments.length)];
        
        // Special behavior when exit point is active - create defensive patterns around it
        if (this.exitPoint.active) {
            const distanceToExit = Math.abs(this.exitPoint.y - segment.y);
            
            // If we're within 200 pixels of the exit, create barrier formations
            if (distanceToExit < 200) {
                this.spawnExitDefenseBarriers(segment);
                return;
            }
            
            // Don't spawn regular barriers too close to exit
            if (distanceToExit < 100) {
                console.log('Skipping regular barrier spawn - too close to exit point');
                return;
            }
        }
        
        // Regular barrier spawning for areas away from exit
        this.spawnRegularBarrier(segment);
    }
    
    spawnRegularBarrier(segment) {
        // Check for nearby obstacles to avoid spawning on top of them
        const nearbyObstacles = this.obstacles.filter(obstacle => 
            Math.abs(obstacle.y - segment.y) < 150 // Increased from 100 to 150 pixels vertically
        );
        
        // Place barrier within corridor bounds
        const margin = 30; // Reduced margin to allow bigger barriers
        const minX = segment.leftWall + margin;
        const maxX = segment.rightWall - margin;
        
        if (maxX <= minX) return; // Corridor too narrow
        
        // Try multiple positions to avoid obstacles
        let barrierX;
        let attempts = 0;
        const maxAttempts = 20; // Increased from 10 to 20 attempts
        let foundGoodPosition = false;
        
        do {
            barrierX = minX + Math.random() * (maxX - minX);
            attempts++;
            
            // Check if this position conflicts with any nearby obstacles
            // Use barrier size for more accurate collision detection
            const barrierWidth = 45;
            const barrierHeight = 25;
            
            const conflictsWithObstacle = nearbyObstacles.some(obstacle => {
                // Calculate horizontal distance between barrier center and obstacle center
                const horizontalDistance = Math.abs(obstacle.x - barrierX);
                const verticalDistance = Math.abs(obstacle.y - segment.y);
                
                // Require larger separation - obstacle radius + barrier half-width + safety margin
                const requiredHorizontalSeparation = (obstacle.size / 2) + (barrierWidth / 2) + 20; // Added 20px safety margin
                const requiredVerticalSeparation = (obstacle.size / 2) + (barrierHeight / 2) + 15; // Added 15px safety margin
                
                return horizontalDistance < requiredHorizontalSeparation && verticalDistance < requiredVerticalSeparation;
            });
            
            if (!conflictsWithObstacle) {
                foundGoodPosition = true;
                break;
            }
        } while (attempts < maxAttempts);
        
        // If we couldn't find a good position after many attempts, skip spawning this barrier
        if (!foundGoodPosition) {
            console.log('Skipped barrier spawn - could not find position clear of obstacles after', maxAttempts, 'attempts');
            return;
        }
        
        const barrier = {
            x: barrierX,
            y: -30, // Start above screen
            width: 45, // Increased from 30 to 45
            height: 25, // Increased from 15 to 25
            flashPhase: Math.random() * Math.PI * 2 // Random starting flash phase
        };
        
        this.barriers.push(barrier);
        
        console.log(`Spawned larger regular barrier at x:${Math.round(barrierX)}, y:${barrier.y} (size: ${barrier.width}x${barrier.height}) after ${attempts} attempts`);
    }
    
    spawnExitDefenseBarriers(segment) {
        // Create defensive barrier formations around the exit point
        const margin = 25; // Smaller margin for tighter formations
        const corridorWidth = segment.rightWall - segment.leftWall - (margin * 2);
        
        if (corridorWidth < 60) return; // Need minimum space for formations
        
        // Get nearby obstacles to avoid
        const nearbyObstacles = this.obstacles.filter(obstacle => 
            obstacle.y > -200 && obstacle.y < 100 // Near exit area
        );
        
        // Choose formation type based on exit distance and random chance
        const formations = ['wall', 'flanks', 'scattered'];
        const formation = formations[Math.floor(Math.random() * formations.length)];
        
        console.log(`Spawning ${formation} barrier formation near exit point`);
        
        switch (formation) {
            case 'wall':
                // Create a wall of barriers across the corridor
                const barrierCount = Math.floor(corridorWidth / 50); // Space barriers 50 pixels apart for bigger barriers
                for (let i = 0; i < barrierCount; i++) {
                    const baseX = segment.leftWall + margin + (i * 50) + Math.random() * 15; // Slight random offset
                    
                    // Check for obstacle conflicts and adjust position if needed
                    let barrierX = baseX;
                    let foundGoodPosition = false;
                    
                    for (let offset of [0, -25, 25, -50, 50]) {
                        const testX = baseX + offset;
                        if (testX < segment.leftWall + margin || testX > segment.rightWall - margin) continue;
                        
                        const conflictsWithObstacle = nearbyObstacles.some(obstacle => {
                            const horizontalDistance = Math.abs(obstacle.x - testX);
                            const verticalDistance = Math.abs(obstacle.y - (-30));
                            const requiredHorizontalSeparation = (obstacle.size / 2) + 20 + 25; // barrier half-width + margin
                            const requiredVerticalSeparation = (obstacle.size / 2) + 12.5 + 20; // barrier half-height + margin
                            
                            return horizontalDistance < requiredHorizontalSeparation && verticalDistance < requiredVerticalSeparation;
                        });
                        
                        if (!conflictsWithObstacle) {
                            barrierX = testX;
                            foundGoodPosition = true;
                            break;
                        }
                    }
                    
                    if (foundGoodPosition) {
                        this.barriers.push({
                            x: barrierX,
                            y: -30,
                            width: 40, // Increased from 25 to 40
                            height: 25, // Increased from 15 to 25
                            flashPhase: Math.random() * Math.PI * 2
                        });
                    }
                }
                break;
                
            case 'flanks':
                // Create barriers on the sides, leaving center more open
                const leftBaseX = segment.leftWall + margin + Math.random() * 20;
                const rightBaseX = segment.rightWall - margin - Math.random() * 20;
                
                // Check left barrier position
                let leftBarrierX = leftBaseX;
                let leftConflicts = nearbyObstacles.some(obstacle => {
                    const horizontalDistance = Math.abs(obstacle.x - leftBaseX);
                    const verticalDistance = Math.abs(obstacle.y - (-30));
                    return horizontalDistance < (obstacle.size / 2) + 25 + 25 && verticalDistance < (obstacle.size / 2) + 15 + 20;
                });
                
                if (!leftConflicts) {
                    this.barriers.push({
                        x: leftBarrierX,
                        y: -30,
                        width: 50, // Increased from 35 to 50
                        height: 30, // Increased from 20 to 30
                        flashPhase: Math.random() * Math.PI * 2
                    });
                }
                
                // Check right barrier position
                let rightBarrierX = rightBaseX;
                let rightConflicts = nearbyObstacles.some(obstacle => {
                    const horizontalDistance = Math.abs(obstacle.x - rightBaseX);
                    const verticalDistance = Math.abs(obstacle.y - (-30));
                    return horizontalDistance < (obstacle.size / 2) + 25 + 25 && verticalDistance < (obstacle.size / 2) + 15 + 20;
                });
                
                if (!rightConflicts) {
                    this.barriers.push({
                        x: rightBarrierX,
                        y: -30,
                        width: 50, // Increased from 35 to 50
                        height: 30, // Increased from 20 to 30
                        flashPhase: Math.random() * Math.PI * 2
                    });
                }
                break;
                
            case 'scattered':
                // Create 2-4 randomly placed barriers
                const scatterCount = 2 + Math.floor(Math.random() * 3); // 2-4 barriers
                for (let i = 0; i < scatterCount; i++) {
                    let attempts = 0;
                    let foundPosition = false;
                    
                    while (attempts < 15 && !foundPosition) {
                        const testX = segment.leftWall + margin + Math.random() * corridorWidth;
                        const testY = -30 - (i * 15);
                        
                        const conflictsWithObstacle = nearbyObstacles.some(obstacle => {
                            const horizontalDistance = Math.abs(obstacle.x - testX);
                            const verticalDistance = Math.abs(obstacle.y - testY);
                            const requiredHorizontalSeparation = (obstacle.size / 2) + 22.5 + 25; // barrier half-width + margin
                            const requiredVerticalSeparation = (obstacle.size / 2) + 12.5 + 20; // barrier half-height + margin
                            
                            return horizontalDistance < requiredHorizontalSeparation && verticalDistance < requiredVerticalSeparation;
                        });
                        
                        if (!conflictsWithObstacle) {
                            this.barriers.push({
                                x: testX,
                                y: testY, // Stagger vertically
                                width: 45, // Increased from 30 to 45
                                height: 25, // Increased from 15 to 25
                                flashPhase: Math.random() * Math.PI * 2
                            });
                            foundPosition = true;
                        }
                        attempts++;
                    }
                }
                break;
        }
    }
    
    checkProjectileObstacleCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            for (let obstacle of this.obstacles) {
                // Simple circle-circle collision detection
                const dx = projectile.x - obstacle.x;
                const dy = projectile.y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check if projectile hits obstacle
                const projectileRadius = projectile.width / 2;
                const obstacleRadius = obstacle.size / 2;
                
                if (distance < (projectileRadius + obstacleRadius)) {
                    // Hit! Remove projectile but leave obstacle intact
                    this.projectiles.splice(i, 1);
                    
                    console.log(`Projectile blocked by ${obstacle.shape} obstacle`);
                    
                    // Play a different sound for obstacle hit (obstacle blocks shot)
                    if (this.game.audioSystem) {
                        this.game.audioSystem.playSfx('damageTaken'); // Reuse damage sound as "blocked" sound
                    }
                    
                    break; // Exit obstacle loop since projectile is destroyed
                }
            }
        }
    }
    
    checkProjectileBarrierCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            for (let j = this.barriers.length - 1; j >= 0; j--) {
                const barrier = this.barriers[j];
                
                // Use full visual size for accurate collision detection - no gaps on edges
                const barrierHitboxWidth = barrier.width; // Full visual size
                const barrierHitboxHeight = barrier.height; // Full visual size
                
                // Simple rectangle collision detection with full barrier hitbox
                if (projectile.x + projectile.width/2 > barrier.x - barrierHitboxWidth/2 &&
                    projectile.x - projectile.width/2 < barrier.x + barrierHitboxWidth/2 &&
                    projectile.y + projectile.height/2 > barrier.y - barrierHitboxHeight/2 &&
                    projectile.y - projectile.height/2 < barrier.y + barrierHitboxHeight/2) {
                    
                    // Hit! Remove both projectile and barrier
                    this.projectiles.splice(i, 1);
                    this.barriers.splice(j, 1);
                    this.score++;
                    
                    // Add score to global game state as well
                    this.game.gameState.addScore(1);
                    
                    console.log(`Barrier destroyed! Local Score: ${this.score}, Global Score: ${this.game.gameState.getScore()}`);
                    
                    // Play hit sound (reuse existing sound for now)
                    if (this.game.audioSystem) {
                        this.game.audioSystem.playSfx('eliteEnemyHit');
                    }
                    
                    break; // Exit barrier loop since projectile is destroyed
                }
            }
        }
    }
    
    exit() {
        console.log('Exiting Enemy Planet Mission');
        this.missionActive = false;
        
        // Stop enemy planet music when exiting
        if (this.game.audioSystem) {
            this.game.audioSystem.stopMusic();
        }
    }
    
    // Rear Missile System Methods
    updateRearMissiles() {
        // Increment missile timer
        this.rearMissileTimer++;
        
        // Debug: Log missile timer progress every 60 frames (1 second)
        if (this.rearMissileTimer % 60 === 0) {
            console.log(`Missile timer: ${this.rearMissileTimer}/${this.rearMissileSpawnInterval} frames`);
        }
        
        // Spawn new rear missile periodically (random between 5-10 seconds)
        if (this.rearMissileTimer >= this.rearMissileSpawnInterval) {
            console.log('Triggering rear missile spawn!');
            this.spawnRearMissile();
            this.rearMissileTimer = 0;
            this.rearMissileSpawnInterval = this.getRandomMissileInterval(); // Set new random interval
            console.log(`Next missile spawn in ${this.rearMissileSpawnInterval} frames`);
        }
        
        // Update existing missiles
        for (let i = this.rearMissiles.length - 1; i >= 0; i--) {
            const missile = this.rearMissiles[i];
            
            // Move missile upward (toward player)
            missile.y -= this.rearMissileSpeed;
            
            // Update color pulsating phase
            missile.colorPhase += 0.2;
            
            // Check collision with player
            if (this.checkMissilePlayerCollision(missile)) {
                // Damage player using game state health system and remove missile
                this.game.gameState.damagePlayer(1);
                this.rearMissiles.splice(i, 1);
                
                // Play player hit sound
                if (this.game.audioSystem) {
                    this.game.audioSystem.playSfx('enemyPlanetPlayerHit');
                }
                
                console.log(`Player hit by rear missile! Health: ${this.game.gameState.getPlayerHealth()}/7`);
                
                // Check if player is dead
                if (!this.game.gameState.isPlayerAlive()) {
                    console.log('Player killed by rear missile - mission failed');
                    this.missionFailed = true;
                }
                continue;
            }
            
            // Check collision with player projectiles
            if (this.checkMissileProjectileCollision(missile, i)) {
                continue; // Missile was destroyed, skip to next
            }
            
            // Remove missile if it goes off screen
            if (missile.y < -50) {
                this.rearMissiles.splice(i, 1);
                console.log('Rear missile went off screen');
            }
        }
    }
    
    spawnRearMissile() {
        console.log('spawnRearMissile() called - finding corridor segments...');
        
        // Find the corridor bounds at the bottom of the screen for missile spawning
        const bottomSegments = this.corridorSegments.filter(segment => 
            segment.y >= 550 && segment.y <= 650 // Near bottom of screen
        );
        
        console.log(`Found ${bottomSegments.length} bottom segments for missile spawning`);
        
        let missileX;
        if (bottomSegments.length > 0) {
            // Use corridor bounds to spawn missile within playable area
            const segment = bottomSegments[0];
            const margin = 30; // Keep away from walls
            const minX = segment.leftWall + margin;
            const maxX = segment.rightWall - margin;
            missileX = minX + Math.random() * (maxX - minX);
            console.log(`Missile X position: ${missileX} (bounds: ${minX}-${maxX})`);
        } else {
            // Fallback to center area if no segments found
            missileX = 350 + Math.random() * 100; // Center area of default corridor
            console.log(`Using fallback missile X position: ${missileX}`);
        }
        
        // Create warning indicator first
        this.warningIndicators.push({
            x: missileX,
            y: 580, // Bottom of screen
            life: 90, // 1.5 seconds at 60fps
            maxLife: 90,
            flashPhase: 0
        });
        
        // Create the missile that will spawn after warning
        setTimeout(() => {
            this.rearMissiles.push({
                x: missileX,
                y: 620, // Start below screen
                width: 16,  // Doubled from 8 to 16
                height: 32, // Doubled from 16 to 32
                colorPhase: Math.random() * Math.PI * 2 // For pulsating colors
            });
            
            console.log(`Rear missile spawned at x:${Math.round(missileX)} within corridor bounds`);
        }, 1500); // 1.5 second delay for warning
        
        // Play incoming missile warning sound
        if (this.game.audioSystem) {
            this.game.audioSystem.playSfx('enemyPlanetIncomingRearMissle');
        }
        
        console.log(`Warning indicator created at x:${Math.round(missileX)} within corridor bounds`);
    }
    
    updateWarningIndicators() {
        for (let i = this.warningIndicators.length - 1; i >= 0; i--) {
            const warning = this.warningIndicators[i];
            
            warning.life--;
            warning.flashPhase += 0.3;
            
            // Remove expired warnings
            if (warning.life <= 0) {
                this.warningIndicators.splice(i, 1);
            }
        }
    }
    
    checkMissilePlayerCollision(missile) {
        // Rectangle collision detection - missile vs player
        const missileLeft = missile.x - missile.width / 2;
        const missileRight = missile.x + missile.width / 2;
        const missileTop = missile.y - missile.height / 2;
        const missileBottom = missile.y + missile.height / 2;
        
        const playerLeft = this.player.x - this.player.width / 2;
        const playerRight = this.player.x + this.player.width / 2;
        const playerTop = this.player.y - this.player.height / 2;
        const playerBottom = this.player.y + this.player.height / 2;
        
        // Check for rectangle overlap
        return missileLeft < playerRight &&
               missileRight > playerLeft &&
               missileTop < playerBottom &&
               missileBottom > playerTop;
    }
    
    checkMissileProjectileCollision(missile, missileIndex) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Rectangle collision detection - missile vs projectile
            const missileLeft = missile.x - missile.width / 2;
            const missileRight = missile.x + missile.width / 2;
            const missileTop = missile.y - missile.height / 2;
            const missileBottom = missile.y + missile.height / 2;
            
            const projectileLeft = projectile.x - projectile.width / 2;
            const projectileRight = projectile.x + projectile.width / 2;
            const projectileTop = projectile.y - projectile.height / 2;
            const projectileBottom = projectile.y + projectile.height / 2;
            
            // Check for rectangle overlap
            if (missileLeft < projectileRight &&
                missileRight > projectileLeft &&
                missileTop < projectileBottom &&
                missileBottom > projectileTop) {
                
                // Missile destroyed by player shot - award points
                this.projectiles.splice(i, 1);
                this.rearMissiles.splice(missileIndex, 1);
                this.score += 3;
                this.game.gameState.addScore(3);
                
                console.log(`Rear missile destroyed by player! +3 points. Score: ${this.score}`);
                
                // Play hit sound
                if (this.game.audioSystem) {
                    this.game.audioSystem.playSfx('eliteEnemyHit');
                }
                
                return true; // Missile was destroyed
            }
        }
        return false;
    }
    
    generateSimpleTerrain() {
        // Generate simple, consistent terrain for testing
        this.terrainSegments = [];
        const segmentHeight = 50;
        const totalSegments = 50; // Shorter for testing
        
        console.log(`Generating simple terrain with width: ${this.terrainWidth}`);
        
        for (let i = 0; i < totalSegments; i++) {
            // Start terrain segments at screen level - like being already inside a race track
            const y = -i * segmentHeight; // No offset - walls start immediately at top of screen
            
            // Keep terrain simple and consistent for now
            const width = this.terrainWidth; // No narrowing yet
            
            this.terrainSegments.push({
                y: y,
                leftWall: 400 - width / 2,
                rightWall: 400 + width / 2,
                width: width
            });
        }
        
        console.log(`Generated ${totalSegments} terrain segments`);
        console.log(`First segment: y=${this.terrainSegments[0].y}, leftWall=${this.terrainSegments[0].leftWall}, rightWall=${this.terrainSegments[0].rightWall}, width=${this.terrainSegments[0].width}`);
    }
    
    update() {
        if (!this.missionActive) {
            return;
        }
        
        // Handle victory sequence first (like CombatMode)
        if (this.victoryActive) {
            this.victoryTimer--;
            
            if (this.victoryTimer <= 0 && !this.transitionInProgress) {
                this.transitionInProgress = true; // Prevent multiple transitions
                this.victoryActive = false;
                console.log('Victory sequence completed - transitioning to Star Map');
                
                // Add any final score to global score (though should already be added)
                if (this.score > 0) {
                    console.log(`Adding final mission score to global total: ${this.score} points`);
                }
                
                // Stop enemy planet music
                if (this.game.audioSystem) {
                    this.game.audioSystem.stopMusic();
                }
                
                // Mark the sector as completed in star map
                console.log('Marking enemy planet sector as completed...');
                console.log(`Current player position before completing: x=${this.game.modes.starMap.playerPosition.x}, y=${this.game.modes.starMap.playerPosition.y}`);
                this.game.modes.starMap.completeSector();
                
                // Transition to star map
                console.log('Transitioning to star map...');
                console.log(`Current player position after completing: x=${this.game.modes.starMap.playerPosition.x}, y=${this.game.modes.starMap.playerPosition.y}`);
                this.game.switchToMode('starMap');
                return;
            }
            
            // During victory, stop normal gameplay but continue rendering
            return;
        }
        
        // If mission failed, handle it immediately (no victory sequence for failure)
        if (this.missionFailed && !this.completionHandled && !this.transitionInProgress) {
            this.completionHandled = true;
            this.transitionInProgress = true; // Prevent multiple transitions
            
            // Stop enemy planet music on failure
            if (this.game.audioSystem) {
                this.game.audioSystem.stopMusic();
            }
            
            // Mission failure - immediate transition to game over
            console.log('Mission failed - transitioning to game over');
            this.game.switchToMode('gameOver');
            return;
        }
        
        // Update mission timer
        this.missionTimer++;
        
        // Update scrolling - make the corridor move down
        this.scrollY += this.scrollSpeed;
        
        // Update corridor segments for scrolling
        this.updateScrollingCorridor();
        
        // Update player ship color pulsing
        this.playerColorPhase += 0.15; // Smooth color transition
        
        // Update obstacle color pulsing
        this.obstacleColorPhase += 0.2;
        
        // Check if it's time to spawn exit point
        this.checkExitPointSpawn();
        
        // Update exit point (only if spawned)
        if (this.exitPoint.spawned) {
            this.updateExitPoint();
        }
        
        // Update obstacles
        this.updateObstacles();
        
        // Update projectiles and barriers
        this.updateProjectiles();
        this.updateBarriers();
        
        // Update rear missile system
        this.updateRearMissiles();
        this.updateWarningIndicators();
        
        // Check if player reached exit point (only if active)
        if (this.exitPoint.active) {
            this.checkExitPointCollision();
        }
        
        // Check for collisions with obstacles and walls
        this.checkCollisions();
        
        // Handle input
        this.handleInput();
        
        // Check if exit point scrolled off screen without being reached
        if (this.exitPoint.active && this.exitPoint.y > 700) {
            console.log('Exit point scrolled off screen - mission failed');
            this.missionFailed = true;
        }
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Block all input during victory sequence - prevents accidental navigation during transition
        if (this.victoryActive || this.missionComplete) {
            // Log any attempted input during victory sequence to help diagnose the navigation issue
            if (input.isKeyDown('ArrowLeft') || input.isKeyDown('ArrowRight') || 
                input.isKeyDown('ArrowUp') || input.isKeyDown('ArrowDown')) {
                console.log('BLOCKED: Arrow key input detected during victory sequence - this would have caused navigation issues!');
            }
            return; // Don't process any input during victory/transition
        }
        
        // Block all input during mission failure - prevents accidental navigation during transition
        if (this.missionFailed) {
            console.log('Input blocked during mission failure sequence');
            return; // Don't process any input during failure/transition
        }
        
        // Player movement controls
        const moveSpeed = 4;
        
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) {
            this.player.x = Math.max(50, this.player.x - moveSpeed); // Don't go off left edge
        }
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) {
            this.player.x = Math.min(750, this.player.x + moveSpeed); // Don't go off right edge
        }
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW')) {
            this.player.y = Math.max(50, this.player.y - moveSpeed); // Don't go off top
        }
        if (input.isKeyDown('ArrowDown') || input.isKeyDown('KeyS')) {
            this.player.y = Math.min(550, this.player.y + moveSpeed); // Don't go off bottom
        }
        
        // Shooting controls - Space or Mouse click (must be pressed, not held)
        if ((input.isKeyPressed('Space') || input.isMousePressed()) && 
            this.missionTimer - this.lastFireFrame >= this.fireRate) {
            this.fireProjectile();
            this.lastFireFrame = this.missionTimer;
        }
        
        // ESC key disabled - player must complete or fail the mission
        // if (input.isKeyPressed('Escape') && !this.transitionInProgress) {
        //     console.log('Mission aborted by player');
        //     this.transitionInProgress = true; // Prevent multiple transitions
        //     
        //     // Stop enemy planet music when aborting
        //     if (this.game.audioSystem) {
        //         this.game.audioSystem.stopMusic();
        //     }
        //     
        //     this.game.switchToMode('starMap');
        // }
    }
    
    render(renderer) {
        // Clear with enemy planet colors
        renderer.clear('#440000');
        
        // Render terrain corridor
        this.renderSimpleTerrain(renderer);
        
        // Render exit point (only if active)
        if (this.exitPoint.active) {
            this.renderExitPoint(renderer);
        }
        
        // Render player
        this.renderPlayer(renderer);
        
        // Render obstacles
        this.renderObstacles(renderer);
        
        // Render projectiles and barriers
        this.renderProjectiles(renderer);
        this.renderBarriers(renderer);
        
        // Render rear missile system
        this.renderWarningIndicators(renderer);
        this.renderRearMissiles(renderer);
        
        // Render simple UI
        this.renderSimpleUI(renderer);
        
        // Render mission status
        if (this.missionComplete) {
            this.renderMissionComplete(renderer);
        } else if (this.missionFailed) {
            this.renderMissionFailed(renderer);
        }
    }
    
    renderSimpleTerrain(renderer) {
        const ctx = renderer.ctx;
        
        // FIRST: Draw default static canyon background to ensure no gaps
        const defaultLeftWall = 250;   // 400 - 150 (300px width)
        const defaultRightWall = 550;  // 400 + 150 (300px width)
        
        // Default left wall - use varied red colors in 12px blocks
        for (let y = 0; y < 600; y += 12) {
            const colorIndex = Math.floor(y / 12) % this.redPalette.length;
            ctx.fillStyle = this.redPalette[colorIndex];
            ctx.fillRect(0, y, defaultLeftWall, Math.min(12, 600 - y));
        }
        
        // Default right wall - use varied red colors in 12px blocks (offset pattern)
        for (let y = 0; y < 600; y += 12) {
            const colorIndex = (Math.floor(y / 12) + 3) % this.redPalette.length; // Offset by 3 for variety
            ctx.fillStyle = this.redPalette[colorIndex];
            ctx.fillRect(defaultRightWall, y, 800 - defaultRightWall, Math.min(12, 600 - y));
        }
        
        // Default corridor area - Semi-transparent green
        ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
        ctx.fillRect(defaultLeftWall, 0, defaultRightWall - defaultLeftWall, 600);
        
        // SECOND: Draw dynamic serpentine segments that COMPLETELY REPLACE the default
        for (const segment of this.corridorSegments) {
            // Only render segments visible on screen
            if (segment.y >= -60 && segment.y <= 650) {
                // Draw the COMPLETE walls for this segment using varied red colors
                
                // Left wall - from screen edge to segment left wall (varied red rocky surface)
                for (let x = 0; x < segment.leftWall; x += 12) {
                    const colorIndex = (Math.floor(x / 12) + Math.floor(segment.y / 12)) % this.redPalette.length;
                    ctx.fillStyle = this.redPalette[colorIndex];
                    ctx.fillRect(x, segment.y, Math.min(12, segment.leftWall - x), 50);
                }
                
                // Right wall - from segment right wall to screen edge (varied red rocky surface)
                for (let x = segment.rightWall; x < 800; x += 12) {
                    const colorIndex = (Math.floor(x / 12) + Math.floor(segment.y / 12) + 3) % this.redPalette.length; // Offset for variety
                    ctx.fillStyle = this.redPalette[colorIndex];
                    ctx.fillRect(x, segment.y, Math.min(12, 800 - x), 50);
                }
                
                // Corridor area for this segment
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.fillRect(segment.leftWall, segment.y, segment.rightWall - segment.leftWall, 50);
                
                // Wall borders for this segment
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(segment.leftWall, segment.y);
                ctx.lineTo(segment.leftWall, segment.y + 50);
                ctx.moveTo(segment.rightWall, segment.y);
                ctx.lineTo(segment.rightWall, segment.y + 50);
                ctx.stroke();
            }
        }
        
        // THIRD: Only draw default canyon borders where there are NO scrolling segments
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Draw default borders in gaps between scrolling segments
        for (let y = 0; y < 600; y += 10) {
            // Check if there's a scrolling segment covering this area
            const hasSegment = this.corridorSegments.some(segment => 
                segment.y <= y && segment.y + 50 > y && segment.y >= -60 && segment.y <= 650
            );
            
            if (!hasSegment) {
                // Draw small pieces of default border
                ctx.beginPath();
                ctx.moveTo(defaultLeftWall, y);
                ctx.lineTo(defaultLeftWall, Math.min(y + 10, 600));
                ctx.moveTo(defaultRightWall, y);
                ctx.lineTo(defaultRightWall, Math.min(y + 10, 600));
                ctx.stroke();
            }
        }
    }
    
    renderPlayer(renderer) {
        const ctx = renderer.ctx;
        
        // Calculate current player color based on pulsing phase
        const colorIndex = Math.floor(this.playerColorPhase) % this.playerColors.length;
        const nextColorIndex = (colorIndex + 1) % this.playerColors.length;
        const blend = this.playerColorPhase - Math.floor(this.playerColorPhase);
        
        // For now, just use the current color (smooth blending would require more complex color interpolation)
        const currentPlayerColor = this.playerColors[colorIndex];
        
        // Draw simple triangular player ship with pulsing colors
        ctx.fillStyle = currentPlayerColor;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Draw triangle pointing up
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);  // Bottom tip
        ctx.lineTo(this.player.x - this.player.width/2, this.player.y + this.player.height);  // Bottom left
        ctx.lineTo(this.player.x + this.player.width/2, this.player.y + this.player.height);  // Bottom right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add a pulsing thruster glow at the back
        const thrusterPhase = (this.playerColorPhase * 2) % 1; // Faster thruster pulse
        const thrusterIntensity = 0.5 + 0.5 * Math.sin(thrusterPhase * Math.PI * 2);
        const thrusterAlpha = Math.floor(thrusterIntensity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `#FF4400${thrusterAlpha}`;  // Orange thruster with pulsing alpha
        ctx.fillRect(this.player.x - 3, this.player.y + this.player.height - 5, 6, 8);
    }
    
    renderObstacles(renderer) {
        const ctx = renderer.ctx;
        
        for (const obstacle of this.obstacles) {
            // Calculate pulsing color (yellow to purple)
            const phase = this.obstacleColorPhase + obstacle.colorPhase;
            const colorBlend = (Math.sin(phase) + 1) / 2; // 0 to 1
            
            // Interpolate between yellow and purple
            const yellow = { r: 255, g: 255, b: 0 };
            const purple = { r: 139, g: 0, b: 139 };
            
            const r = Math.floor(yellow.r + (purple.r - yellow.r) * colorBlend);
            const g = Math.floor(yellow.g + (purple.g - yellow.g) * colorBlend);
            const b = Math.floor(yellow.b + (purple.b - yellow.b) * colorBlend);
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            
            // Draw different shapes
            ctx.beginPath();
            
            if (obstacle.shape === 'circle') {
                ctx.arc(obstacle.x, obstacle.y, obstacle.size / 2, 0, Math.PI * 2);
            } else if (obstacle.shape === 'diamond') {
                const halfSize = obstacle.size / 2;
                ctx.moveTo(obstacle.x, obstacle.y - halfSize); // Top
                ctx.lineTo(obstacle.x + halfSize, obstacle.y); // Right
                ctx.lineTo(obstacle.x, obstacle.y + halfSize); // Bottom
                ctx.lineTo(obstacle.x - halfSize, obstacle.y); // Left
                ctx.closePath();
            } else if (obstacle.shape === 'pentagon') {
                const radius = obstacle.size / 2;
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2; // Start from top
                    const x = obstacle.x + Math.cos(angle) * radius;
                    const y = obstacle.y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
            }
            
            ctx.fill();
            ctx.stroke();
        }
    }
    
    renderProjectiles(renderer) {
        const ctx = renderer.ctx;
        
        ctx.fillStyle = '#00FFFF'; // Cyan projectiles
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        
        for (const projectile of this.projectiles) {
            // Draw projectile as small rectangle with glow effect
            ctx.fillRect(
                projectile.x - projectile.width/2, 
                projectile.y - projectile.height/2, 
                projectile.width, 
                projectile.height
            );
            ctx.strokeRect(
                projectile.x - projectile.width/2, 
                projectile.y - projectile.height/2, 
                projectile.width, 
                projectile.height
            );
        }
    }
    
    renderBarriers(renderer) {
        const ctx = renderer.ctx;
        
        for (const barrier of this.barriers) {
            // Calculate flashing effect (black to dark gray)
            const phase = this.barrierFlashPhase + barrier.flashPhase;
            const flashIntensity = (Math.sin(phase) + 1) / 2; // 0 to 1
            
            // Interpolate between black and dark gray
            const grayValue = Math.floor(flashIntensity * 60); // 0 to 60 (dark gray)
            ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            
            // Draw barrier as flashing black rectangle
            ctx.fillRect(
                barrier.x - barrier.width/2, 
                barrier.y - barrier.height/2, 
                barrier.width, 
                barrier.height
            );
            ctx.strokeRect(
                barrier.x - barrier.width/2, 
                barrier.y - barrier.height/2, 
                barrier.width, 
                barrier.height
            );
        }
    }
    
    renderExitPoint(renderer) {
        // Only render if exit point is visible on screen
        if (this.exitPoint.y < -50 || this.exitPoint.y > 650) return;
        
        const ctx = renderer.ctx;
        
        // Calculate flashing color
        const colorIndex = Math.floor(this.exitPoint.flashPhase / Math.PI) % this.exitColors.length;
        const nextColorIndex = (colorIndex + 1) % this.exitColors.length;
        const flashIntensity = (Math.sin(this.exitPoint.flashPhase) + 1) / 2; // 0 to 1
        
        // Use bright flashing colors
        ctx.fillStyle = this.exitColors[colorIndex];
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        
        // Draw a large hexagon as the exit portal
        const sides = 6;
        const radius = this.exitPoint.size / 2;
        
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2) / sides;
            const x = this.exitPoint.x + Math.cos(angle) * radius;
            const y = this.exitPoint.y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add a pulsing inner glow
        const glowRadius = radius * (0.5 + flashIntensity * 0.3);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.exitPoint.x, this.exitPoint.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add "EXIT" text above the point
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', this.exitPoint.x, this.exitPoint.y - radius - 10);
        ctx.textAlign = 'center'; // Restore to game default alignment
    }
    
    renderSimpleUI(renderer) {
        // Show player health with hearts
        const currentHealth = this.game.gameState.getPlayerHealth();
        let healthText = 'Health: ';
        for (let i = 0; i < currentHealth; i++) {
            healthText += '♥ ';
        }
        renderer.drawText(healthText, 120, 30, '#FFFFFF', 16, 'Courier New');
        
        // Show total score only
        const totalScore = this.game.gameState.getScore();
        renderer.drawText(`Score: ${totalScore}`, 680, 30, '#FFFF00', 16, 'Courier New');
        
        // Show exit countdown or status
        if (this.exitPoint.active) {
            renderer.drawText('EXIT POINT ACTIVE - Reach it to complete mission!', 400, 50, '#00FF00', 14, 'Courier New');
        } else {
            const timeElapsed = Math.floor(this.missionTimer / 60);
            const exitSpawnTimeSeconds = Math.floor(this.exitSpawnTime / 60);
            const timeRemaining = exitSpawnTimeSeconds - timeElapsed;
            if (timeRemaining > 0) {
                renderer.drawText(`Exit spawns in ${timeRemaining}s`, 400, 50, '#FFFF00', 14, 'Courier New');
            } else {
                renderer.drawText('Exit spawning...', 400, 50, '#FF8800', 14, 'Courier New');
            }
        }
    }
    
    renderMissionComplete(renderer) {
        // Calculate fade effect based on victory timer
        // Fade in for first 60 frames (1 second), hold for middle, fade out for last 60 frames
        const fadeInDuration = 60;  // 1 second fade in
        const fadeOutDuration = 60; // 1 second fade out
        const timeElapsed = this.victoryDuration - this.victoryTimer;
        
        let alpha;
        if (timeElapsed < fadeInDuration) {
            // Fade in
            alpha = timeElapsed / fadeInDuration;
        } else if (this.victoryTimer < fadeOutDuration) {
            // Fade out
            alpha = this.victoryTimer / fadeOutDuration;
        } else {
            // Full opacity in middle
            alpha = 1.0;
        }
        
        // Ensure alpha stays within bounds
        alpha = Math.max(0, Math.min(1, alpha));
        
        // Add subtle pulsing effect during hold period
        let pulseAlpha = alpha;
        if (timeElapsed >= fadeInDuration && this.victoryTimer >= fadeOutDuration) {
            const pulsePhase = (timeElapsed - fadeInDuration) * 0.1;
            const pulseEffect = 0.9 + 0.1 * Math.sin(pulsePhase);
            pulseAlpha = alpha * pulseEffect;
        }
        
        // Background with fade
        renderer.drawRect(200, 200, 400, 200, `rgba(0,0,0,${0.8 * alpha})`);
        
        if (this.exitPoint.reached) {
            renderer.drawText('EXIT REACHED!', 400, 280, `rgba(0,255,0,${pulseAlpha})`, 24, 'Courier New');
            renderer.drawText('Enemy planet mission successful!', 400, 320, `rgba(255,255,255,${alpha})`, 16, 'Courier New');
        } else {
            renderer.drawText('MISSION COMPLETE!', 400, 280, `rgba(0,255,0,${pulseAlpha})`, 24, 'Courier New');
            renderer.drawText('Time limit reached', 400, 320, `rgba(255,255,255,${alpha})`, 16, 'Courier New');
        }
        renderer.drawText('Returning to Star Map...', 400, 350, `rgba(255,255,0,${alpha})`, 14, 'Courier New');
    }
    
    renderMissionFailed(renderer) {
        renderer.drawRect(200, 200, 400, 200, 'rgba(0,0,0,0.8)');
        renderer.drawText('MISSION FAILED', 400, 280, '#FF0000', 24, 'Courier New');
        renderer.drawText('Ship destroyed!', 400, 320, '#FFFFFF', 16, 'Courier New');
        renderer.drawText('Game Over...', 400, 350, '#FF0000', 14, 'Courier New');
    }
    
    renderWarningIndicators(renderer) {
        for (let warning of this.warningIndicators) {
            // Flash warning indicator at bottom of screen
            const alpha = 0.3 + 0.7 * Math.sin(warning.flashPhase);
            const ctx = renderer.ctx;
            ctx.globalAlpha = alpha;
            
            // Calculate same pulsating colors as missile (orange/yellow)
            const pulseFactor = Math.sin(warning.flashPhase) * 0.5 + 0.5; // 0 to 1
            const r = Math.floor(255); // Always full red
            const g = Math.floor(165 + (90 * pulseFactor)); // 165 (orange) to 255 (yellow)
            const b = 0; // No blue for orange/yellow
            const warningColor = `rgb(${r}, ${g}, ${b})`;
            
            // Draw flashing warning triangle (doubled size)
            ctx.fillStyle = warningColor;
            ctx.beginPath();
            ctx.moveTo(warning.x, warning.y - 20); // Top point (doubled from -10)
            ctx.lineTo(warning.x - 16, warning.y + 10); // Bottom left (doubled from -8, +5)
            ctx.lineTo(warning.x + 16, warning.y + 10); // Bottom right (doubled from +8, +5)
            ctx.closePath();
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = warningColor;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw warning text (doubled size)
            ctx.globalAlpha = alpha;
            renderer.drawText('!', warning.x, warning.y, '#FFFFFF', 24, 'Courier New'); // Doubled from 12 to 24
            
            ctx.globalAlpha = 1.0;
        }
    }
    
    renderRearMissiles(renderer) {
        for (let missile of this.rearMissiles) {
            const ctx = renderer.ctx;
            
            // Calculate pulsating colors similar to combat mode enemy bullets
            const pulseFactor = Math.sin(missile.colorPhase) * 0.5 + 0.5; // 0 to 1
            
            // Outer color: interpolate between orange and yellow
            const r = Math.floor(255); // Always full red
            const g = Math.floor(165 + (90 * pulseFactor)); // 165 (orange) to 255 (yellow)
            const b = 0; // No blue for orange/yellow
            const outerColor = `rgb(${r}, ${g}, ${b})`;
            
            // Draw missile as a rectangle that matches the hitbox exactly
            const left = missile.x - missile.width / 2;
            const top = missile.y - missile.height / 2;
            
            // Draw outer rectangle with pulsating color
            ctx.fillStyle = outerColor;
            ctx.fillRect(left, top, missile.width, missile.height);
            
            // Add glow effect with outer color
            ctx.shadowColor = outerColor;
            ctx.shadowBlur = 8;
            ctx.fillRect(left, top, missile.width, missile.height);
            ctx.shadowBlur = 0;
            
            // Draw white core in the center (smaller rectangle)
            ctx.fillStyle = '#FFFFFF';
            const coreSize = 0.4; // 40% of missile size
            const coreWidth = missile.width * coreSize;
            const coreHeight = missile.height * coreSize;
            const coreLeft = missile.x - coreWidth / 2;
            const coreTop = missile.y - coreHeight / 2;
            
            ctx.fillRect(coreLeft, coreTop, coreWidth, coreHeight);
        }
    }
}
