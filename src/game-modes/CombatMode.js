/**
 * Combat Mode
 * Handles first-person combat view with crosshair
 */
class CombatMode {
    constructor(game) {
        this.game = game;
        
        // World view controls (natural movement - world moves, crosshair stays centered)
        this.worldPosition = { x: 0, y: 0 }; // World offset for natural camera movement
        this.worldVelocity = { x: 0, y: 0 }; // World movement velocity
        this.maxWorldPosition = { x: 300, y: 200 }; // Maximum world movement range
        this.worldSpeed = 3; // World movement speed
        this.friction = 0.85; // Movement friction

        // Test enemies
        this.testEnemies = [];
        
        // Wave spawning system for 10-enemy encounters
        this.enemyWaveSystem = {
            totalEnemies: 10,
            enemiesSpawned: 0,
            maxOnScreen: 5,
            spawnInterval: 2500, // 2.5 seconds in milliseconds
            lastSpawnTime: 0,
            enemyQueue: [], // Pre-generated enemy types for this encounter
            isActive: false
        };
        
        this.crosshairSize = 20;
        
        // Dynamic starfield for active space feeling
        this.starfield = this.generateStarfield();
        
        // Projectile system
        this.projectiles = [];
        this.projectileSpeed = 32; // Increased from 8 to 32
        this.fireRate = 150; // milliseconds between shots
        this.lastFireTime = 0;
        
        // Enemy projectile system
        this.enemyProjectiles = [];
        this.enemyFireRate = 2000; // Base enemy fire rate in milliseconds (2 seconds)
        
        // Player hit box (cockpit area) - Centered exactly on crosshair
        this.playerHitBox = {
            x: 350,      // Left edge (400 - 50 = centered on crosshair X)
            y: 265,      // Top edge (300 - 35 = centered on crosshair Y)  
            width: 100,  // Width of cockpit hit area
            height: 70   // Height of cockpit hit area
        };
        
        // Visual damage effects
        this.screenCracks = [];
        this.damageFlashTimer = 0;
        
        // Test feedback
        this.testMessage = '';
        this.testMessageTimer = 0;
        
        // Death detection flag to prevent multiple transitions
        this.playerDied = false;
        
        // Alert system for incoming enemies
        this.alertActive = false;
        this.alertTimer = 0;
        this.alertDuration = 360; // 6 seconds at 60fps
        this.alertFlashTimer = 0;
        this.alertMessage = 'ALERT ALERT ALERT INCOMING ENEMY';

        // UI animation timer
        this.uiAnimationTimer = 0;
        
        // Victory state
        this.victoryActive = false;
        this.victoryTimer = 0;
        this.victoryDuration = 240; // 4 seconds at 60fps
        this.victoryMessage = 'CONGRATULATIONS JOE, SECTOR CLEARED!';
        this.victoryMessageAlpha = 0; // For fade in/out effect
        
        // Input tracking for bullet deflection
        this.inputTracking = {
            leftHeld: 0,    // Frames left has been held
            rightHeld: 0,   // Frames right has been held
            upHeld: 0,      // Frames up has been held
            downHeld: 0,    // Frames down has been held
            deflectionThreshold: 3 // Frames before deflection kicks in
        };
        
        console.log('CombatMode initialized');
    }
    
    enter() {
        console.log('Entered CombatMode - First Person View');
        this.playerDied = false; // Reset death flag when entering combat
        
        // Reset world view to center
        this.worldPosition = { x: 0, y: 0 };
        this.worldVelocity = { x: 0, y: 0 };
        
        // Reset projectiles and combat state
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.lastFireTime = 0;
        
        // Reset damage effects and screen cracks
        this.screenCracks = [];
        this.damageFlashTimer = 0;
        
        // Reset test/debug messages
        this.testMessage = '';
        this.testMessageTimer = 0;
        
        // Reset UI animation timer
        this.uiAnimationTimer = 0;
        
        // Reset input tracking
        this.inputTracking.leftHeld = 0;
        this.inputTracking.rightHeld = 0;
        this.inputTracking.upHeld = 0;
        this.inputTracking.downHeld = 0;
        
        // Reset victory state
        this.victoryActive = false;
        this.victoryMessageAlpha = 0;
        this.victoryMessageTimer = 0;
        this.victoryTimer = 0;
        
        // Reset enemies
        this.enemies = [];
        this.testEnemies = [];
        
        // Trigger alert sequence
        this.alertActive = true;
        this.alertTimer = this.alertDuration;
        this.alertFlashTimer = 0;
        
        // Initialize the enemy encounter system (this also resets the wave system)
        // IMPORTANT: Regenerate enemy queue for each new encounter
        this.initializeEnemyEncounter();
        this.startEnemyEncounter();
        
        // Play alert sound immediately
        this.game.audioSystem.playSfx('alert');
        
        // Start combat music after alert finishes
        const delayMs = this.alertDuration * (1000/60);
        if (this.game.audioSystem && this.game.audioSystem.schedulePlay) {
            this._scheduledMusicToken = this.game.audioSystem.schedulePlay('combat-theme', delayMs);
        } else {
            this._scheduledMusicToken = setTimeout(() => {
                this.game.audioSystem.playMusic('combat-theme');
                console.log('Combat music started after alert');
            }, delayMs);
        }
    }
    
    exit() {
        console.log('Exited CombatMode');
        
        // Stop combat music
        // Cancel any scheduled music token
        if (this._scheduledMusicToken) {
            if (this.game.audioSystem && this.game.audioSystem.cancelScheduledPlay) {
                this.game.audioSystem.cancelScheduledPlay(this._scheduledMusicToken);
            } else {
                clearTimeout(this._scheduledMusicToken);
            }
            this._scheduledMusicToken = null;
        }

        this.game.audioSystem.stopMusic();
        console.log('Combat music stopped');
    }
    
    update() {
        // Handle input (Steps 2-3)
        this.handleInput();
        
        // Step 3: Update world movement (natural controls)
        this.updateWorldMovement();
        
        // Only update enemies when not in alert mode
        if (!this.alertActive) {
            // Update enemy wave spawning system
            this.updateEnemyWaveSystem();
            
            this.updateEnemies();
            this.updateEnemyProjectiles();
            
            // Check victory condition - all enemies defeated
            this.checkVictoryCondition();
        }
        
        // Update projectiles
        this.updateProjectiles();
        
        // Update dynamic starfield
        this.updateStarfield();
        
        // Update UI animation timer
        this.uiAnimationTimer++;
        
        // Update test message timer
        if (this.testMessageTimer > 0) {
            this.testMessageTimer--;
        }
        
        // Update alert system
        if (this.alertActive) {
            this.alertTimer--;
            this.alertFlashTimer++;
            
            if (this.alertTimer <= 0) {
                this.alertActive = false;
                console.log('Alert sequence completed');
            }
        }
        
        // Update victory system
        if (this.victoryActive) {
            this.victoryTimer--;
            
            // Calculate fade in/out alpha based on timer
            const fadeInDuration = 30; // 0.5 seconds fade in
            const fadeOutDuration = 30; // 0.5 seconds fade out
            const holdDuration = this.victoryDuration - fadeInDuration - fadeOutDuration; // Hold at full opacity
            
            if (this.victoryTimer > this.victoryDuration - fadeInDuration) {
                // Fade in phase
                const fadeProgress = (this.victoryDuration - this.victoryTimer) / fadeInDuration;
                this.victoryMessageAlpha = Math.min(1, fadeProgress);
            } else if (this.victoryTimer > fadeOutDuration) {
                // Hold phase - full opacity
                this.victoryMessageAlpha = 1;
            } else {
                // Fade out phase
                const fadeProgress = this.victoryTimer / fadeOutDuration;
                this.victoryMessageAlpha = Math.max(0, fadeProgress);
            }
            
            if (this.victoryTimer <= 0) {
                this.victoryActive = false;
                this.victoryMessageAlpha = 0;
                console.log('Victory sequence completed - transitioning to Star Map');
                
                // Mark the sector as completed in star map
                if (this.game.modes.starMap) {
                    this.game.modes.starMap.completeSector();
                }
                
                // Transition to star map
                this.game.switchToMode('starMap');
            }
        }
        
        // Check for player death (should happen after any damage)
        if (!this.game.gameState.isPlayerAlive() && !this.playerDied) {
            console.log('Player has died during combat - switching to Game Over');
            this.playerDied = true; // Prevent multiple transitions
            this.game.switchToMode('gameOver');
            return; // Exit early to prevent further processing
        }
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Allow skipping alert with fire button
        if (this.alertActive && input.isFirePressed()) {
            console.log('Player skipped alert sequence');
            this.skipAlert();
            return; // Don't process other inputs during alert skip
        }
        
        // Don't process normal combat inputs during alert
        if (this.alertActive) {
            return;
        }
        
        // Step 2: Single-button control scheme
        if (input.isFirePressed()) {
            console.log('Fire button pressed!');
            this.createProjectile();
        }
        
        // Step 3: Natural directional controls (world moves opposite to create proper look direction)
        // Also track sustained input for bullet deflection
        let leftPressed = input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA');
        let rightPressed = input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD');
        let upPressed = input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW');
        let downPressed = input.isKeyDown('ArrowDown') || input.isKeyDown('KeyS');
        
        if (leftPressed) {
            this.worldVelocity.x += this.worldSpeed; // World moves right when looking left
            this.inputTracking.leftHeld++;
        } else {
            this.inputTracking.leftHeld = 0;
        }
        
        if (rightPressed) {
            this.worldVelocity.x -= this.worldSpeed; // World moves left when looking right
            this.inputTracking.rightHeld++;
        } else {
            this.inputTracking.rightHeld = 0;
        }
        
        if (upPressed) {
            this.worldVelocity.y += this.worldSpeed; // World moves down when looking up
            this.inputTracking.upHeld++;
        } else {
            this.inputTracking.upHeld = 0;
        }
        
        if (downPressed) {
            this.worldVelocity.y -= this.worldSpeed; // World moves up when looking down
            this.inputTracking.downHeld++;
        } else {
            this.inputTracking.downHeld = 0;
        }
        
        // ESC key disabled in combat - player must complete or die
        // if (input.isKeyPressed('Escape')) {
        //     console.log('ESC pressed - returning to menu');
        //     this.game.switchToMode('menu');
        // }
    }
    
    createProjectile() {
        const currentTime = Date.now();
        
        // Check fire rate limit
        if (currentTime - this.lastFireTime < this.fireRate) {
            return; // Too soon to fire again
        }
        
        this.lastFireTime = currentTime;
        
        // Twin laser cannons - one from each bottom corner
        const crosshairX = 400; // Target convergence point
        const crosshairY = 300;
        
        // Left cannon position (bottom-left)
        const leftCannonX = 100;
        const leftCannonY = 580;
        
        // Right cannon position (bottom-right)
        const rightCannonX = 700;
        const rightCannonY = 580;
        
        // Calculate velocity vectors for convergence at crosshair
        const projectileSpeed = this.projectileSpeed;
        
        // Left laser - calculate direction to crosshair
        const leftDx = crosshairX - leftCannonX;
        const leftDy = crosshairY - leftCannonY;
        const leftDistance = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
        const leftVelX = (leftDx / leftDistance) * projectileSpeed;
        const leftVelY = (leftDy / leftDistance) * projectileSpeed;
        
        // Right laser - calculate direction to crosshair
        const rightDx = crosshairX - rightCannonX;
        const rightDy = crosshairY - rightCannonY;
        const rightDistance = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
        const rightVelX = (rightDx / rightDistance) * projectileSpeed;
        const rightVelY = (rightDy / rightDistance) * projectileSpeed;
        
        // Create left projectile
        const leftProjectile = {
            x: leftCannonX,
            y: leftCannonY,
            velocity: { x: leftVelX, y: leftVelY },
            active: true,
            id: Math.random(),
            cannon: 'left'
        };
        
        // Create right projectile
        const rightProjectile = {
            x: rightCannonX,
            y: rightCannonY,
            velocity: { x: rightVelX, y: rightVelY },
            active: true,
            id: Math.random(),
            cannon: 'right'
        };
        
        this.projectiles.push(leftProjectile);
        this.projectiles.push(rightProjectile);
        
        console.log('Twin lasers fired!', { left: leftProjectile, right: rightProjectile });
        
        // Play laser sound effect
        this.game.audioSystem.playSfx('laser');
    }
    
    updateEnemies() {
        // Update all test enemies with deltaTime and canvas
        const deltaTime = 1/60; // Assume 60 FPS for now
        const canvas = {
            width: 800,
            height: 600
        }; // Use fixed canvas dimensions for bounds checking
        
        const currentTime = Date.now();
        
        this.testEnemies.forEach(enemy => {
            if (enemy && !enemy.isDestroyed) {
                enemy.update(deltaTime, canvas);
                
                // Enemy firing logic with much less frequent random intervals
                if (!enemy.lastFireTime) enemy.lastFireTime = 0;
                if (!enemy.nextFireDelay) {
                    // Much longer random fire delay between 3-8 seconds (was 1-4)
                    enemy.nextFireDelay = 3000 + Math.random() * 5000;
                }
                
                if (currentTime - enemy.lastFireTime > enemy.nextFireDelay) {
                    this.createEnemyProjectile(enemy);
                    enemy.lastFireTime = currentTime;
                    // Set new random delay for next shot (3-8 seconds)
                    enemy.nextFireDelay = 3000 + Math.random() * 5000;
                }
            }
        });
        
        // Remove destroyed enemies
        this.testEnemies = this.testEnemies.filter(enemy => !enemy.isDestroyed);
    }
    
    updateEnemyProjectiles() {
        const currentTime = Date.now();
        
        // Calculate boundary deflection force based on player's position near world boundaries
        const deflectionForce = this.calculateBoundaryDeflectionForce();
        
        // Update all enemy projectiles
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemyProjectiles[i];
            
            // Move projectile forward (toward camera/player)
            projectile.z -= projectile.speed;
            
            // Calculate screen position and scale based on Z depth (much faster growth for dramatic effect)
            const scale = Math.max(0.1, (1000 - projectile.z) / 200); // Changed from 600 to 200 for much faster/bigger growth
            projectile.currentScale = scale;
            
            // Apply boundary deflection to make bullets stray away when player is maneuvering at boundaries
            // Accumulate deflection over time - each frame adds to the total deflection
            if (!projectile.deflectionX) projectile.deflectionX = 0;
            if (!projectile.deflectionY) projectile.deflectionY = 0;
            
            // Add current frame's deflection
            projectile.deflectionX += deflectionForce.x;
            projectile.deflectionY += deflectionForce.y;
            
            const deflectedX = projectile.baseX + projectile.deflectionX;
            const deflectedY = projectile.baseY + projectile.deflectionY;
            
            // Calculate screen position with trajectory wobble AND world position offset (for dodging) AND deflection
            projectile.currentX = deflectedX + Math.sin(projectile.z * 0.01) * projectile.wobble + this.worldPosition.x;
            projectile.currentY = deflectedY + Math.cos(projectile.z * 0.008) * projectile.wobble * 0.5 + this.worldPosition.y;
            
            // Calculate how long projectile has been active
            const timeAlive = currentTime - projectile.createdTime;
            const canDamage = timeAlive > 1000; // Must be alive for 1 second before it can damage
            
            // Check if projectile is large enough, has been alive long enough, and overlaps hit box
            // Also prevent damage during victory sequence
            const projectileRadius = 15 * scale; // Projectile gets bigger as it approaches
            if (canDamage && scale > 0.5 && !this.victoryActive && this.checkEnemyProjectilePlayerCollision(projectile, projectileRadius)) {
                console.log('Player hit by incoming enemy projectile!');
                
                // Create screen crack effect
                this.createScreenCrack(projectile.currentX, projectile.currentY);
                
                // Damage the player
                this.game.gameState.damagePlayer(1);
                
                // Play damage sound
                this.game.audioSystem.playSfx('damageTaken');
                
                // Visual damage flash
                this.damageFlashTimer = 20; // Flash for about 1/3 second
                
                // Remove the projectile
                this.enemyProjectiles.splice(i, 1);
                
                // Show damage feedback
                this.testMessage = 'COCKPIT HIT! HULL BREACH!';
                this.testMessageTimer = 120; // 2 seconds at 60fps
                continue;
            }
            
            // Remove projectiles that have passed the player (z <= 0) or are too far
            if (projectile.z <= 0 || projectile.z > 1000) {
                this.enemyProjectiles.splice(i, 1);
                continue;
            }
        }
        
        // Update screen cracks
        for (let i = this.screenCracks.length - 1; i >= 0; i--) {
            const crack = this.screenCracks[i];
            crack.life--;
            crack.opacity = crack.life / crack.maxLife;
            
            if (crack.life <= 0) {
                this.screenCracks.splice(i, 1);
            }
        }
        
        // Update damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer--;
        }
    }
    
    calculateBoundaryDeflectionForce() {
        // Calculate deflection force based on sustained input directions
        let deflectionX = 0;
        let deflectionY = 0;
        
        const threshold = this.inputTracking.deflectionThreshold;
        const deflectionStrength = 2; // Incremental deflection per frame
        
        // X-axis deflection based on sustained horizontal input
        if (this.inputTracking.leftHeld > threshold) {
            // Player holding left, deflect bullets right (+x)
            deflectionX = deflectionStrength;
        } else if (this.inputTracking.rightHeld > threshold) {
            // Player holding right, deflect bullets left (-x)
            deflectionX = -deflectionStrength;
        }
        
        // Y-axis deflection based on sustained vertical input
        if (this.inputTracking.upHeld > threshold) {
            // Player holding up, deflect bullets down (+y)
            deflectionY = deflectionStrength;
        } else if (this.inputTracking.downHeld > threshold) {
            // Player holding down, deflect bullets up (-y)
            deflectionY = -deflectionStrength;
        }
        
        return {
            x: deflectionX,
            y: deflectionY
        };
    }
    
    createEnemyProjectile(enemy) {
        // Calculate enemy screen position (without world offset for initial position)
        const enemyScreenX = enemy.x;
        const enemyScreenY = enemy.y;
        
        // Only fire if enemy is visible on screen (check with world position)
        const visibleX = enemyScreenX + this.worldPosition.x;
        const visibleY = enemyScreenY + this.worldPosition.y;
        if (visibleX < -50 || visibleX > 850 || 
            visibleY < -50 || visibleY > 650) {
            return; // Don't fire if off-screen
        }
        
        // Play appropriate sound effect based on enemy type
        let soundEffect = 'basicEnemyLaser'; // Default
        if (enemy.constructor.name === 'BasicEnemy') {
            soundEffect = 'basicEnemyLaser';
        } else if (enemy.constructor.name === 'FastEnemy') {
            soundEffect = 'fastEnemyLaser';
        } else if (enemy.constructor.name === 'EliteEnemy') {
            soundEffect = 'eliteEnemyLaser';
        }
        
        // Play the sound effect
        this.game.audioSystem.playSfx(soundEffect);
        
        // Create projectile that appears to come straight at the player
        // Store base position in world coordinates (without world offset)
        const projectile = {
            baseX: enemyScreenX + (Math.random() - 0.5) * 60, // Start near enemy with some spread
            baseY: enemyScreenY + (Math.random() - 0.5) * 60,
            z: 800 + Math.random() * 200, // Start at far distance
            speed: 4 + Math.random() * 3, // Faster approach speed (was 3-5, now 4-7)
            wobble: 10 + Math.random() * 20, // Amount of trajectory wobble
            currentX: 0,
            currentY: 0,
            currentScale: 0.1,
            createdTime: Date.now()
        };
        
        this.enemyProjectiles.push(projectile);
        console.log(`${enemy.constructor.name} fired projectile toward player with ${soundEffect} sound!`);
    }
    
    checkEnemyProjectilePlayerCollision(projectile, projectileRadius) {
        // Check if the large incoming projectile overlaps with the hit box
        const projectileLeft = projectile.currentX - projectileRadius;
        const projectileRight = projectile.currentX + projectileRadius;
        const projectileTop = projectile.currentY - projectileRadius;
        const projectileBottom = projectile.currentY + projectileRadius;
        
        const hitBoxLeft = this.playerHitBox.x;
        const hitBoxRight = this.playerHitBox.x + this.playerHitBox.width;
        const hitBoxTop = this.playerHitBox.y;
        const hitBoxBottom = this.playerHitBox.y + this.playerHitBox.height;
        
        // Check for overlap
        return projectileLeft < hitBoxRight &&
               projectileRight > hitBoxLeft &&
               projectileTop < hitBoxBottom &&
               projectileBottom > hitBoxTop;
    }
    
    createScreenCrack(x, y) {
        // Create a crack effect at the impact point
        const crack = {
            x: x,
            y: y,
            life: 60, // 1 second at 60fps
            maxLife: 60,
            opacity: 1.0,
            segments: []
        };
        
        // Generate crack segments radiating from impact point
        const numSegments = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numSegments; i++) {
            const angle = (Math.PI * 2 / numSegments) * i + (Math.random() - 0.5) * 0.5;
            const length = 20 + Math.random() * 40;
            
            crack.segments.push({
                angle: angle,
                length: length,
                endX: x + Math.cos(angle) * length,
                endY: y + Math.sin(angle) * length
            });
        }
        
        this.screenCracks.push(crack);
    }
    
    updateProjectiles() {
        const crosshairX = 400; // Crosshair center X
        const crosshairY = 300; // Crosshair center Y
        const convergenceRadius = this.crosshairSize + 5; // Use crosshair circle as hit area (20 + 5 = 25)
        
        // Update all active projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Move projectile
            projectile.x += projectile.velocity.x;
            projectile.y += projectile.velocity.y;
            
            // Check if projectile has reached the crosshair center (convergence point)
            const distanceToCrosshair = Math.sqrt(
                Math.pow(projectile.x - crosshairX, 2) + 
                Math.pow(projectile.y - crosshairY, 2)
            );
            
            if (distanceToCrosshair <= convergenceRadius) {
                // Projectile has reached convergence point - check for enemy collisions
                let hit = false;
                
                // Check collision with all enemies
                for (let j = this.testEnemies.length - 1; j >= 0; j--) {
                    const enemy = this.testEnemies[j];
                    
                    // Skip enemies that are already exploding or destroyed
                    if (enemy.isExploding || enemy.isDestroyed) continue;
                    
                    // Calculate enemy screen position (same as in renderEnemies)
                    const enemyScreenX = enemy.x + this.worldPosition.x;
                    const enemyScreenY = enemy.y + this.worldPosition.y;
                    
                    // Check if enemy is within the crosshair circle (targeting area)
                    const enemyDistanceFromCrosshair = Math.sqrt(
                        Math.pow(enemyScreenX - crosshairX, 2) + 
                        Math.pow(enemyScreenY - crosshairY, 2)
                    );
                    
                    // Get enemy collision radius
                    const enemyRadius = enemy.getCollisionRadius();
                    
                    // Check if enemy is within crosshair targeting area
                    if (enemyDistanceFromCrosshair <= (convergenceRadius + enemyRadius)) {
                        console.log(`${projectile.cannon} laser hit ${enemy.constructor.name} within crosshair area!`);
                        
                        // Damage the enemy
                        this.damageEnemy(enemy, j);
                        hit = true;
                        break; // One projectile can only hit one enemy
                    }
                }
                
                // Remove the projectile whether it hit something or not
                this.projectiles.splice(i, 1);
                
                if (!hit) {
                    console.log(`${projectile.cannon} laser converged at crosshair center (no hit)`);
                }
                continue;
            }
            
            // Remove projectiles that have gone off screen (backup cleanup)
            if (projectile.y < -10 || projectile.y > 610 || 
                projectile.x < -10 || projectile.x > 810) {
                this.projectiles.splice(i, 1);
                console.log('Projectile removed (off-screen)');
            }
        }
    }
    
    // Check collision between projectile and enemy
    checkProjectileEnemyCollision(projectile, enemy, enemyScreenX, enemyScreenY) {
        // Calculate distance between projectile and enemy center
        const dx = projectile.x - enemyScreenX;
        const dy = projectile.y - enemyScreenY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Get enemy collision radius (accounts for Z-depth scaling)
        const enemyRadius = enemy.getCollisionRadius();
        
        // Projectile radius (small)
        const projectileRadius = 3;
        
        // Check if collision occurred
        return distance < (enemyRadius + projectileRadius);
    }
    
    // Handle enemy taking damage
    damageEnemy(enemy, enemyIndex) {
        // Reduce enemy hit points
        enemy.hitPoints--;
        
        console.log(`Enemy hit! HP: ${enemy.hitPoints}/${enemy.constructor.name === 'EliteEnemy' ? 3 : 1}`);
        
        // Check if enemy is destroyed
        if (enemy.hitPoints <= 0) {
            console.log(`${enemy.constructor.name} destroyed! Score: +${enemy.scoreValue}`);
            
            // Add score
            this.game.gameState.addScore(enemy.scoreValue);
            
            // Trigger explosion with sound
            enemy.onDestroy(this.game.audioSystem);
            
            // Handle special enemy effects
            if (enemy.spawnBasicEnemies) {
                // EliteEnemy spawns basic enemies when destroyed
                this.spawnBasicEnemiesFromElite(enemy);
            }
        } else {
            // Enemy took damage but is not destroyed
            console.log(`${enemy.constructor.name} damaged!`);
            
            // Trigger hit flash effect for Elite enemies
            if (enemy.constructor.name === 'EliteEnemy' && enemy.triggerHitFlash) {
                enemy.triggerHitFlash(this.game.audioSystem);
            }
        }
    }
    
    // Spawn basic enemies when Elite enemy is destroyed
    spawnBasicEnemiesFromElite(eliteEnemy) {
        console.log('Elite enemy destroyed - spawning 4 basic enemies');
        
        // Spawn 4 basic enemies around the elite enemy's position
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i; // Evenly spaced around circle
            const spawnDistance = 100; // Distance from elite enemy
            
            const spawnX = eliteEnemy.x + Math.cos(angle) * spawnDistance;
            const spawnY = eliteEnemy.y + Math.sin(angle) * spawnDistance;
            const spawnZ = eliteEnemy.z + (Math.random() - 0.5) * 0.5; // Slight Z variation
            
            const newEnemy = new BasicEnemy(spawnX, spawnY, spawnZ);
            this.testEnemies.push(newEnemy);
        }
    }
    
    updateWorldMovement() {
        // Apply movement physics to world view
        
        // Apply friction
        this.worldVelocity.x *= this.friction;
        this.worldVelocity.y *= this.friction;
        
        // Update world position
        this.worldPosition.x += this.worldVelocity.x;
        this.worldPosition.y += this.worldVelocity.y;
        
        // Clamp world position to boundaries (prevent infinite scrolling)
        this.worldPosition.x = Math.max(-this.maxWorldPosition.x, 
            Math.min(this.maxWorldPosition.x, this.worldPosition.x));
        this.worldPosition.y = Math.max(-this.maxWorldPosition.y, 
            Math.min(this.maxWorldPosition.y, this.worldPosition.y));
        
        // Stop tiny movements
        if (Math.abs(this.worldVelocity.x) < 0.1) this.worldVelocity.x = 0;
        if (Math.abs(this.worldVelocity.y) < 0.1) this.worldVelocity.y = 0;
    }
    
    generateStarfield() {
        const stars = [];
        const numStars = 200; // More stars for combat density
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                // Start stars at center and give them random positions around it
                x: 400 + (Math.random() - 0.5) * 1000,
                y: 300 + (Math.random() - 0.5) * 800,
                z: Math.random() * 1000 + 1, // Depth for 3D effect
                size: Math.random() * 1.5 + 0.3,
                color: this.getStarColor(),
                speed: 1 + Math.random() * 2 // Slower movement for combat focus
            });
        }
        
        return stars;
    }
    
    getStarColor() {
        const colors = ['#FFFFFF', '#FFFFCC', '#CCCCFF', '#FFCCCC', '#CCFFCC'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateStarfield() {
        const centerX = 400; // Fixed center - no parallax movement
        const centerY = 300; // Fixed center - no parallax movement
        
        this.starfield.forEach(star => {
            // Move star toward camera
            star.z -= star.speed;
            
            // Apply world position offset to star base position for natural movement
            const adjustedX = star.x + this.worldPosition.x * 0.3;
            const adjustedY = star.y + this.worldPosition.y * 0.3;
            
            // Calculate 3D projection with safety checks
            const perspective = star.z > 0 ? Math.max(0.1, 600 / star.z) : 0.1;
            star.screenX = centerX + (adjustedX - centerX) * perspective;
            star.screenY = centerY + (adjustedY - centerY) * perspective;
            
            // Calculate size based on distance (closer = bigger) with safety check
            star.currentSize = Math.max(0.1, star.size * perspective);
            
            // Calculate brightness based on distance
            const brightness = Math.min(0.8, Math.max(0.1, perspective * 0.7));
            star.currentBrightness = brightness;
            
            // Reset star if it goes behind camera or off screen
            if (star.z <= 0 || 
                star.screenX < -50 || star.screenX > 850 || 
                star.screenY < -50 || star.screenY > 650) {
                
                // Reset to far distance
                star.z = 800 + Math.random() * 200;
                star.x = centerX + (Math.random() - 0.5) * 1000;
                star.y = centerY + (Math.random() - 0.5) * 800;
            }
        });
    }
    
    renderStarfield(renderer) {
        const ctx = renderer.ctx;
        
        this.starfield.forEach(star => {
            // Only draw stars that are in front of camera and on screen
            if (star.z > 0 && 
                star.screenX >= 0 && star.screenX <= 800 && 
                star.screenY >= 0 && star.screenY <= 600) {
                
                // Set alpha based on brightness
                ctx.globalAlpha = star.currentBrightness;
                
                // Draw star at projected position with calculated size
                renderer.drawCircle(star.screenX, star.screenY, star.currentSize, star.color);
                
                // Add subtle trail effect for faster stars
                if (star.currentSize > 1.5) {
                    ctx.globalAlpha = star.currentBrightness * 0.2;
                    const trailLength = Math.min(10, star.currentSize * 2);
                    const centerX = 400;
                    const centerY = 300;
                    
                    // Calculate trail direction (opposite of movement)
                    const dirX = star.screenX - centerX;
                    const dirY = star.screenY - centerY;
                    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
                    
                    if (distance > 0) {
                        const normalX = dirX / distance;
                        const normalY = dirY / distance;
                        
                        renderer.drawLine(
                            star.screenX, star.screenY,
                            star.screenX - normalX * trailLength, 
                            star.screenY - normalY * trailLength,
                            star.color, 1
                        );
                    }
                }
            }
        });
        
        ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    skipAlert() {
        // Immediately end the alert sequence
        this.alertActive = false;
        this.alertTimer = 0;
        
        // Stop the alert sound effect
        this.game.audioSystem.stopSfx('alert');
        
        // Start combat music immediately
        this.game.audioSystem.playMusic('combat-theme');
        console.log('Alert skipped - combat music started immediately');
    }
    
    render(renderer) {
        // Show alert screen when active, otherwise show normal combat view
        if (this.alertActive) {
            this.renderAlertScreen(renderer);
        } else {
            // Clear screen and render background first
            renderer.clear('#000008');
            this.renderSpaceBackground(renderer);
            
            // Only render enemies when not in alert mode
            this.renderEnemies(renderer);
            this.renderProjectiles(renderer);
            this.renderEnemyProjectiles(renderer);
            
            // Render UI elements on top
            this.renderCrosshair(renderer);
            // this.renderPlayerHitBox(renderer); // Hidden but collision detection still active
            this.renderCockpitFrame(renderer);
            this.renderHUD(renderer);
            
            // Render damage effects on top of everything
            this.renderDamageEffects(renderer);
            
            // Render victory message overlay if active
            if (this.victoryActive) {
                this.renderVictoryMessage(renderer);
            }
        }
    }
    
    renderCockpitView(renderer) {
        // Clear screen with deep space black
        renderer.clear('#000008');
        
        // Draw space background with subtle star field
        this.renderSpaceBackground(renderer);
        
        // Draw cockpit frame/border to give first-person feel
        this.renderCockpitFrame(renderer);
    }
    
    renderSpaceBackground(renderer) {
        // Dynamic 3D starfield that responds to world movement
        this.renderStarfield(renderer);
    }
    
    renderCockpitFrame(renderer) {
        const ctx = renderer.ctx;
        
        // Save context state
        ctx.save();
        
        // Draw dark background panels with transparency
        ctx.globalAlpha = 0.8;
        // Top cockpit edge
        renderer.drawRect(0, 0, 800, 40, '#001122');
        // Side panels
        renderer.drawRect(0, 0, 60, 600, '#001122');
        renderer.drawRect(740, 0, 60, 600, '#001122');
        // Bottom instrument panel
        renderer.drawRect(0, 550, 800, 50, '#001122');
        
        // Reset alpha for border lines to ensure solid appearance
        ctx.globalAlpha = 1.0;
        
        // Draw all border lines with consistent color and opacity
        const borderColor = '#003366';
        const borderWidth = 2;
        
        // Top border
        renderer.drawStroke(0, 35, 800, 1, borderColor, borderWidth);
        // Side borders
        renderer.drawStroke(55, 0, 1, 600, borderColor, borderWidth);
        renderer.drawStroke(740, 0, 1, 600, borderColor, borderWidth);
        // Bottom border
        renderer.drawStroke(0, 550, 800, 1, borderColor, borderWidth);
        
        // Restore context state
        ctx.restore();
        
        // Add vertical text on side panels
        const leftText = 'DRILLER JOE';
        const rightText = 'COMBAT SYSTEM';
        const leftSpacing = 35; // Further reduced spacing to prevent overlap
        const rightSpacing = 28; // Further reduced spacing to prevent overlap  
        const startY = 90; // Moved down more to avoid top overlap
        const fontSize = 12; // Further reduced font size to prevent overlap
        
        // Save the current context state
        ctx.save();
        
        // Calculate color cycling effect for side panel text
        const colorCycle = [
            '#00FFFF', // Bright cyan
            '#0088FF', // Bright blue
            '#0044FF', // Medium blue
            '#0000FF', // Deep blue
            '#0044FF', // Back to medium
            '#0088FF', // Back to bright blue
            '#00FFFF'  // Back to cyan
        ];
        const cycleSpeed = 6; // Faster color cycling
        const colorIndex = Math.floor(this.uiAnimationTimer / cycleSpeed) % colorCycle.length;
        const textColor = colorCycle[colorIndex];
        
        // Set bold text style and effects for side panel text only
        ctx.font = `bold ${fontSize}px Courier New`;
        ctx.shadowColor = textColor;
        ctx.shadowBlur = 5;

        // Draw left panel text
        for (let i = 0; i < leftText.length; i++) {
            if (leftText[i] !== ' ') { // Skip spaces but keep the spacing
                renderer.drawText(leftText[i], 35, startY + (i * leftSpacing), textColor, fontSize, 'Courier New');
            }
        }

        // Draw right panel text
        for (let i = 0; i < rightText.length; i++) {
            if (rightText[i] !== ' ') { // Skip spaces but keep the spacing
                renderer.drawText(rightText[i], 770, startY + (i * rightSpacing), textColor, fontSize, 'Courier New');
            }
        }

        // Reset the context state before drawing other UI elements
        ctx.restore();

        // Draw status text with original style (no effects)
        renderer.drawText('STATUS: ACTIVE', 400, 570, '#00FF00', 12, 'Courier New');
    }
    
    renderCrosshair(renderer) {
        // Fixed crosshair always in center of screen
        const centerX = 400; // Always center X
        const centerY = 300; // Always center Y
        const size = this.crosshairSize;
        
        // Draw crosshair with classic green color
        const crosshairColor = '#00FF00';
        const lineWidth = 2;
        
        // Horizontal line
        renderer.drawLine(
            centerX - size, centerY, 
            centerX + size, centerY, 
            crosshairColor, lineWidth
        );
        
        // Vertical line
        renderer.drawLine(
            centerX, centerY - size, 
            centerX, centerY + size, 
            crosshairColor, lineWidth
        );
        
        // Center dot
        renderer.drawCircle(centerX, centerY, 2, crosshairColor);
        
        // Optional: Crosshair range circle
        const ctx = renderer.ctx;
        ctx.globalAlpha = 0.3;
        renderer.drawCircle(centerX, centerY, size + 5, crosshairColor);
        ctx.globalAlpha = 1.0;
    }
    
    renderProjectiles(renderer) {
        // Render all active projectiles
        for (const projectile of this.projectiles) {
            if (!projectile.active) continue;
            
            // Draw projectile as a bright energy bolt
            const ctx = renderer.ctx;
            
            // Create gradient effect for laser bolt
            ctx.save();
            
            // Different colors for left and right cannons for visual distinction
            let laserColor = '#00FFFF'; // Default cyan
            if (projectile.cannon === 'left') {
                laserColor = '#00FF88'; // Slightly green-cyan
            } else if (projectile.cannon === 'right') {
                laserColor = '#0088FF'; // Slightly blue-cyan
            }
            
            // Main laser beam
            ctx.strokeStyle = laserColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            // Draw the laser bolt as a line with trail effect (doubled length)
            ctx.beginPath();
            ctx.moveTo(projectile.x, projectile.y);
            ctx.lineTo(projectile.x - projectile.velocity.x * 4, projectile.y - projectile.velocity.y * 4);
            ctx.stroke();
            
            // Bright core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(projectile.x, projectile.y);
            ctx.lineTo(projectile.x - projectile.velocity.x * 2, projectile.y - projectile.velocity.y * 2);
            ctx.stroke();
            
            // Glow effect (doubled length)
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = laserColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(projectile.x, projectile.y);
            ctx.lineTo(projectile.x - projectile.velocity.x * 3, projectile.y - projectile.velocity.y * 3);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    renderEnemyProjectiles(renderer) {
        // Render all enemy projectiles coming toward the player
        for (const projectile of this.enemyProjectiles) {
            const ctx = renderer.ctx;
            
            ctx.save();
            ctx.translate(projectile.currentX, projectile.currentY);
            
            // Scale based on distance (closer = bigger)
            const scale = projectile.currentScale;
            
            // Flashing effect for visibility - fast yellow flash
            const flashSpeed = 10; // Frames per flash cycle
            const flashPhase = (Date.now() / (1000/60)) % flashSpeed; // Convert to frame-based timing
            const isFlashing = flashPhase < (flashSpeed / 2); // Flash on/off
            
            // Base radius that grows dramatically as projectile approaches
            const baseRadius = 12 * scale; // Increased from 8 to 12 for larger bullets
            
            if (isFlashing) {
                // Bright yellow when flashing
                ctx.fillStyle = '#FFFF00';
                ctx.shadowColor = '#FFFF00';
                ctx.shadowBlur = 15 * scale;
            } else {
                // Dimmer yellow-orange when not flashing
                ctx.fillStyle = '#FFAA00';
                ctx.shadowColor = '#FFAA00';
                ctx.shadowBlur = 10 * scale;
            }
            
            // Draw simple circular projectile
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add inner bright core for better visibility
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    renderDamageEffects(renderer) {
        const ctx = renderer.ctx;
        
        // Render screen cracks
        for (const crack of this.screenCracks) {
            ctx.save();
            ctx.globalAlpha = crack.opacity;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            // Draw crack segments
            for (const segment of crack.segments) {
                ctx.beginPath();
                ctx.moveTo(crack.x, crack.y);
                ctx.lineTo(segment.endX, segment.endY);
                ctx.stroke();
                
                // Add smaller branch cracks
                const midX = crack.x + (segment.endX - crack.x) * 0.6;
                const midY = crack.y + (segment.endY - crack.y) * 0.6;
                const branchAngle = segment.angle + (Math.random() - 0.5) * 1.0;
                const branchLength = segment.length * 0.3;
                const branchEndX = midX + Math.cos(branchAngle) * branchLength;
                const branchEndY = midY + Math.sin(branchAngle) * branchLength;
                
                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(branchEndX, branchEndY);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Render damage flash effect
        if (this.damageFlashTimer > 0) {
            ctx.save();
            const flashIntensity = this.damageFlashTimer / 20;
            ctx.globalAlpha = flashIntensity * 0.3;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, 800, 600);
            ctx.restore();
        }
    }
    
    renderPlayerHitBox(renderer) {
        // Draw the white player hit box overlay
        const ctx = renderer.ctx;
        
        ctx.save();
        
        // Semi-transparent white fill
        ctx.globalAlpha = 0.2;
        renderer.drawRect(
            this.playerHitBox.x, 
            this.playerHitBox.y, 
            this.playerHitBox.width, 
            this.playerHitBox.height, 
            '#FFFFFF'
        );
        
        // Solid white border
        ctx.globalAlpha = 0.6;
        renderer.drawStroke(
            this.playerHitBox.x, 
            this.playerHitBox.y, 
            this.playerHitBox.width, 
            this.playerHitBox.height, 
            '#FFFFFF', 
            2
        );
        
        // Corner indicators
        ctx.globalAlpha = 0.8;
        const cornerSize = 10;
        const corners = [
            // Top-left
            { x: this.playerHitBox.x, y: this.playerHitBox.y },
            // Top-right
            { x: this.playerHitBox.x + this.playerHitBox.width - cornerSize, y: this.playerHitBox.y },
            // Bottom-left
            { x: this.playerHitBox.x, y: this.playerHitBox.y + this.playerHitBox.height - cornerSize },
            // Bottom-right
            { x: this.playerHitBox.x + this.playerHitBox.width - cornerSize, y: this.playerHitBox.y + this.playerHitBox.height - cornerSize }
        ];
        
        corners.forEach(corner => {
            renderer.drawRect(corner.x, corner.y, cornerSize, cornerSize, '#FFFFFF');
        });
        
        ctx.restore();
        
        // Add label
        renderer.drawText('COCKPIT HIT ZONE', 400, this.playerHitBox.y - 10, '#FFFFFF', 10, 'Courier New');
    }
    
    // New 10-enemy encounter system
    initializeEnemyEncounter() {
        console.log('Initializing 10-enemy encounter system');
        
        // Generate random enemy composition for this encounter
        this.generateEnemyQueue();
        
        // Reset enemy list
        this.testEnemies = [];
    }
    
    generateEnemyQueue() {
        const enemyTypes = ['BasicEnemy', 'FastEnemy', 'EliteEnemy'];
        this.enemyWaveSystem.enemyQueue = [];
        
        // Generate 10 random enemies with weighted distribution
        for (let i = 0; i < this.enemyWaveSystem.totalEnemies; i++) {
            // Weighted random selection: 50% Basic, 35% Fast, 15% Elite
            const rand = Math.random();
            let enemyType;
            
            if (rand < 0.50) {
                enemyType = 'BasicEnemy';
            } else if (rand < 0.85) {
                enemyType = 'FastEnemy';
            } else {
                enemyType = 'EliteEnemy';
            }
            
            this.enemyWaveSystem.enemyQueue.push(enemyType);
        }
        
        console.log('Generated NEW enemy queue for this encounter:', this.enemyWaveSystem.enemyQueue);
    }
    
    startEnemyEncounter() {
        this.enemyWaveSystem.isActive = true;
        this.enemyWaveSystem.enemiesSpawned = 0;
        this.enemyWaveSystem.lastSpawnTime = Date.now();
        console.log('Enemy encounter started - will spawn 10 enemies in waves');
    }
    
    updateEnemyWaveSystem() {
        if (!this.enemyWaveSystem.isActive) return;
        
        const currentTime = Date.now();
        const timeSinceLastSpawn = currentTime - this.enemyWaveSystem.lastSpawnTime;
        
        // Check if we should spawn a new enemy
        const shouldSpawn = (
            this.enemyWaveSystem.enemiesSpawned < this.enemyWaveSystem.totalEnemies && // Still have enemies to spawn
            this.getActiveEnemyCount() < this.enemyWaveSystem.maxOnScreen && // Not at max capacity
            timeSinceLastSpawn >= this.enemyWaveSystem.spawnInterval // Enough time has passed
        );
        
        if (shouldSpawn) {
            this.spawnNextEnemy();
            this.enemyWaveSystem.lastSpawnTime = currentTime;
        }
        
        // Check if encounter is complete
        if (this.enemyWaveSystem.enemiesSpawned >= this.enemyWaveSystem.totalEnemies && 
            this.getActiveEnemyCount() === 0) {
            this.enemyWaveSystem.isActive = false;
            console.log('Enemy encounter completed - all 10 enemies defeated');
        }
    }
    
    spawnNextEnemy() {
        if (this.enemyWaveSystem.enemiesSpawned >= this.enemyWaveSystem.enemyQueue.length) return;
        
        const enemyType = this.enemyWaveSystem.enemyQueue[this.enemyWaveSystem.enemiesSpawned];
        
        // Generate random spawn position (off-screen approach)
        const spawnSide = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y, distance;
        
        switch (spawnSide) {
            case 0: // Top
                x = Math.random() * 800;
                y = -100;
                break;
            case 1: // Right
                x = 900;
                y = Math.random() * 600;
                break;
            case 2: // Bottom
                x = Math.random() * 800;
                y = 700;
                break;
            case 3: // Left
                x = -100;
                y = Math.random() * 600;
                break;
        }
        
        // Set random distance for variety
        distance = 1.5 + Math.random() * 2.0; // Between 1.5 and 3.5
        
        // Create the enemy
        let newEnemy;
        switch (enemyType) {
            case 'BasicEnemy':
                newEnemy = new BasicEnemy(x, y, distance);
                break;
            case 'FastEnemy':
                newEnemy = new FastEnemy(x, y, distance);
                break;
            case 'EliteEnemy':
                newEnemy = new EliteEnemy(x, y, distance);
                break;
        }
        
        this.testEnemies.push(newEnemy);
        this.enemyWaveSystem.enemiesSpawned++;
        
        console.log(`Spawned ${enemyType} #${this.enemyWaveSystem.enemiesSpawned} at (${x.toFixed(0)}, ${y.toFixed(0)}), distance: ${distance.toFixed(1)}`);
    }
    
    getActiveEnemyCount() {
        return this.testEnemies.filter(enemy => !enemy.isExploding && !enemy.isDestroyed).length;
    }

    renderEnemies(renderer) {
        const ctx = renderer.ctx;
        const centerX = 400;
        const centerY = 300;

        // Render each enemy with perspective scaling
        this.testEnemies.forEach(enemy => {
            try {
                ctx.save();
                
                // Calculate screen position with world offset (no perspective calculation here)
                const screenX = enemy.x + this.worldPosition.x;
                const screenY = enemy.y + this.worldPosition.y;
                
                // Transform context for enemy drawing
                ctx.translate(screenX, screenY);
                
                // Let the enemy handle its own scaling based on Z-depth
                enemy.draw(ctx);
                
                ctx.restore();
            } catch (error) {
                console.error('Error rendering enemy:', error, enemy);
                ctx.restore(); // Make sure we restore context even on error
            }
        });
    }

    renderHUD(renderer) {
        // Step 4: Health display using GameState
        const health = this.game.gameState.player.health;
        const maxHealth = 7;
        const score = this.game.gameState.player.score;
        
        // Health bar
        const healthBarX = 60;
        const healthBarY = 570;
        const healthBarWidth = 140;
        const healthBarHeight = 12;
        
        // Background
        renderer.drawRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, '#330000');
        renderer.drawStroke(healthBarX, healthBarY, healthBarWidth, healthBarHeight, '#666666', 1);
        
        // Health fill
        const healthPercent = health / maxHealth;
        const healthFillWidth = healthBarWidth * healthPercent;
        let healthColor = '#00FF00'; // Green
        
        if (healthPercent < 0.3) {
            healthColor = '#FF0000'; // Red (critical)
        } else if (healthPercent < 0.6) {
            healthColor = '#FFFF00'; // Yellow (warning)
        }
        
        if (health > 0) {
            renderer.drawRect(healthBarX, healthBarY, healthFillWidth, healthBarHeight, healthColor);
        }
        
        // Health text
        renderer.drawText(`HEALTH: ${health}/${maxHealth}`, healthBarX + 70, healthBarY + 6, '#FFFFFF', 10, 'Courier New');
        
        // Score
        renderer.drawText(`SCORE: ${score}`, 700, 570, '#FFFF00', 12, 'Courier New');
        
        // Test message
        if (this.testMessageTimer > 0) {
            renderer.drawText(this.testMessage, 400, 50, '#FF00FF', 14, 'Courier New');
        }
    }
    
    renderAlertScreen(renderer) {
        // Dark red background for emergency alert
        renderer.clear('#330000');
        
        // Calculate flash effect (rapid blinking)
        const flashSpeed = 8; // frames per flash
        const isFlashing = Math.floor(this.alertFlashTimer / flashSpeed) % 2 === 0;
        
        // Alert border with flashing effect
        if (isFlashing) {
            renderer.drawStroke(20, 20, 760, 560, '#FF0000', 8);
            renderer.drawStroke(40, 40, 720, 520, '#FF6666', 4);
        } else {
            renderer.drawStroke(20, 20, 760, 560, '#AA0000', 6);
            renderer.drawStroke(40, 40, 720, 520, '#AA3333', 3);
        }
        
        // Main alert message - large and flashing
        const alertColor = isFlashing ? '#FFFFFF' : '#FF0000';
        const alertSize = isFlashing ? 48 : 44;
        
        renderer.drawText('ALERT', 400, 200, alertColor, alertSize, 'Courier New');
        renderer.drawText('ALERT', 400, 250, alertColor, alertSize, 'Courier New');
        renderer.drawText('ALERT', 400, 300, alertColor, alertSize, 'Courier New');
        
        // Secondary message
        const messageColor = isFlashing ? '#FFFF00' : '#FFAA00';
        renderer.drawText('INCOMING ENEMY', 400, 370, messageColor, 32, 'Courier New');
        
        // Progress indicator showing time remaining
        const progress = this.alertTimer / this.alertDuration;
        const progressWidth = 600 * progress;
        renderer.drawRect(100, 500, 600, 20, '#440000'); // Background
        renderer.drawRect(100, 500, progressWidth, 20, '#FF0000'); // Progress
        renderer.drawText('PREPARING FOR COMBAT', 400, 510, '#FFFFFF', 14, 'Courier New');
        
        // Additional warning messages - make them flash green
        const statusColor = isFlashing ? '#00FF00' : '#008800'; // Bright green when flashing, dimmer when not
        renderer.drawText('HEADS UP', 400, 450, statusColor, 16, 'Courier New');
        renderer.drawText('WEAPONS ARMED', 400, 470, statusColor, 16, 'Courier New');
        
        // Corner warning indicators
        const cornerSize = 60;
        if (isFlashing) {
            // Top corners
            renderer.drawRect(0, 0, cornerSize, cornerSize, '#FF0000');
            renderer.drawRect(800 - cornerSize, 0, cornerSize, cornerSize, '#FF0000');
            // Bottom corners
            renderer.drawRect(0, 600 - cornerSize, cornerSize, cornerSize, '#FF0000');
            renderer.drawRect(800 - cornerSize, 600 - cornerSize, cornerSize, cornerSize, '#FF0000');
        }
    }
    
    renderVictoryMessage(renderer) {
        // Save current context state
        renderer.ctx.save();
        
        // Set alpha for fade effect
        renderer.ctx.globalAlpha = this.victoryMessageAlpha;
        
        // Draw semi-transparent background for message
        renderer.drawRect(100, 250, 600, 100, '#000000');
        renderer.drawStroke(100, 250, 600, 100, '#00FF00', 3);
        
        // Draw victory message
        renderer.drawText('CONGRATULATIONS JOE!', 400, 280, '#00FF00', 28, 'Courier New');
        renderer.drawText('SECTOR CLEARED!', 400, 320, '#FFFF00', 24, 'Courier New');
        
        // Restore context state
        renderer.ctx.restore();
    }
    
    checkVictoryCondition() {
        // Don't check victory if already in victory state
        if (this.victoryActive) return;
        
        // Count remaining active enemies (not exploding or destroyed)
        const activeEnemies = this.testEnemies.filter(enemy => 
            !enemy.isExploding && !enemy.isDestroyed
        );
        
        // Check victory condition: all 10 enemies spawned and all defeated
        const allEnemiesSpawned = this.enemyWaveSystem.enemiesSpawned >= this.enemyWaveSystem.totalEnemies;
        const allEnemiesDefeated = activeEnemies.length === 0 && this.testEnemies.length > 0;
        
        if (allEnemiesSpawned && allEnemiesDefeated) {
            console.log(`VICTORY: All ${this.enemyWaveSystem.totalEnemies} enemies defeated! Starting victory sequence...`);
            
            // Trigger victory screen
            this.victoryActive = true;
            this.victoryTimer = this.victoryDuration;
            this.enemyWaveSystem.isActive = false; // Stop wave system
            
            // Play victory sound effect
            this.game.audioSystem.playSfx('menu-confirm'); // Using existing sound for now
        }
    }
}
