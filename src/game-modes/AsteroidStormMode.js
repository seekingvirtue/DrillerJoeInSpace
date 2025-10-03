/**
 * Asteroid Storm Mode
 * Classic Asteroids-style 2D gameplay for asteroid sector encounters
 * 2-minute survival challenge with health-based damage system
 */
class AsteroidStormMode {
    constructor(game) {
        this.game = game;
        
        // Game timing - randomized between 45-90 seconds
        const randomSeconds = 45 + Math.random() * 45; // 45-90 seconds
        this.timer = Math.floor(randomSeconds * 60); // Convert to frames at 60fps
        this.maxTimer = this.timer;
        this.timerSeconds = Math.floor(randomSeconds); // Store the actual seconds for display
        
        // Player ship properties
        this.player = {
            x: 400,                    // Center X position
            y: 300,                    // Center Y position
            angle: 0,                  // Ship rotation (in radians)
            velocity: { x: 0, y: 0 },  // Ship momentum
            size: 12,                  // Ship size for rendering
            thrusting: false,          // Whether thrust is active
            maxSpeed: 8,               // Maximum velocity
            thrustPower: 0.18,         // Acceleration rate (reduced further for more deliberate movement)
            rotationSpeed: 0.09,       // Rotation rate (reduced by 25% from 0.12 for more deliberate turning)
            friction: 0.98,            // Momentum decay
            invulnerable: false,       // Invincibility state
            invulnerabilityTimer: 0    // Frames remaining for invincibility (2 seconds = 120 frames)
        };
        
        // Bullet system
        this.bullets = [];
        this.bulletSpeed = 12;         // Bullet velocity
        this.bulletLifetime = 22;      // Bullet lifespan in frames (reduced from 45 to 22 for shorter range)
        this.fireRate = 8;             // Frames between shots (allows rapid fire)
        this.fireTimer = 0;            // Frame-based fire rate timer
        this.maxBullets = 2;           // Maximum bullets on screen at once
        
        // Asteroid system
        this.asteroids = [];
        this.asteroidTypes = {
            LARGE: 'large',
            MEDIUM: 'medium', 
            SMALL: 'small'
        };
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnRate = 120;  // Frames between asteroid spawns (2 seconds initially, faster spawning)
        this.maxAsteroids = 18;        // Maximum asteroids on screen (increased from 12)
        
        // UFO system
        this.ufos = [];
        this.ufoSpawnTimer = 0;
        this.ufoSpawnRate = 1800;      // Frames between UFO spawns (30 seconds initially)
        this.maxUfos = 2;              // Maximum UFOs on screen at once (increased to 2)
        this.ufoLastSpawn = 0;         // Track when last UFO was spawned
        
        // Canvas boundaries for wrap-around
        this.worldBounds = {
            width: 800,
            height: 600
        };
        
        // Visual effects
        this.starfield = this.generateStarfield();
        this.starfieldTimer = 0; // For twinkling animation
        
        // Game state
        this.gameActive = true;
        this.victory = false;
        
        // Warning alert system
        this.alertActive = false;
        this.alertTimer = 0;
        this.alertDuration = 240; // 4 seconds at 60fps
        this.alertFlashTimer = 0;
        
        // Victory state (similar to combat mode)
        this.victoryActive = false;
        this.victoryTimer = 0;
        this.victoryDuration = 240; // 4 seconds at 60fps
        this.victoryMessage = 'CONGRATULATIONS JOE, SECTOR CLEARED!';
        this.victoryMessageAlpha = 0; // For fade in/out effect
        
        console.log('AsteroidStormMode initialized');
    }
    
    enter() {
        console.log('Entered Asteroid Storm Mode');
        
        // Randomize timer for this encounter (45-90 seconds)
        const randomSeconds = 45 + Math.random() * 45;
        this.timer = Math.floor(randomSeconds * 60); // Convert to frames
        this.maxTimer = this.timer;
        this.timerSeconds = Math.floor(randomSeconds); // Store for display
        console.log(`Asteroid storm timer set to ${this.timerSeconds} seconds`);
        
        // Reset game state
        this.gameActive = false; // Start inactive during alert
        this.victory = false;
        
        // Reset victory state
        this.victoryActive = false;
        this.victoryMessageAlpha = 0;
        this.victoryTimer = 0;
        
        // Reset player position and state
        this.player.x = 400;
        this.player.y = 300;
        this.player.angle = 0;
        this.player.velocity = { x: 0, y: 0 };
        this.player.thrusting = false;
        this.player.invulnerable = false;
        this.player.invulnerabilityTimer = 0;
        
        // Clear bullets
        this.bullets = [];
        this.fireTimer = 0;
        
        // Clear asteroids and reset spawn system
        this.asteroids = [];
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnRate = 120; // Reset spawn rate (2 seconds, faster than before)
        
        // Clear UFOs and reset spawn system
        this.ufos = [];
        this.ufoSpawnTimer = 0;
        this.ufoLastSpawn = 0;
        
        // Spawn initial asteroids (4-6 large asteroids)
        this.spawnInitialAsteroids();
        
        // Regenerate starfield
        this.starfield = this.generateStarfield();
        
        // Start alert sequence
        this.alertActive = true;
        this.alertTimer = this.alertDuration;
        this.alertFlashTimer = 0;
        
        // Play warning sound immediately
        this.game.audioSystem.playSfx('warningAsteroidsIncoming');
        
        // Start asteroid field music after alert finishes
        const delayMs = this.alertDuration * (1000/60);
        if (this.game.audioSystem && this.game.audioSystem.schedulePlay) {
            this._scheduledMusicToken = this.game.audioSystem.schedulePlay('AsteroidField', delayMs);
        } else {
            this._scheduledMusicToken = setTimeout(() => {
                this.game.audioSystem.playMusic('AsteroidField');
                console.log('Asteroid field music started after alert');
            }, delayMs);
        }
    }
    
    exit() {
        console.log('Exited Asteroid Storm Mode');
        
        // Stop music
        if (this._scheduledMusicToken) {
            if (this.game.audioSystem && this.game.audioSystem.cancelScheduledPlay) {
                this.game.audioSystem.cancelScheduledPlay(this._scheduledMusicToken);
            } else {
                clearTimeout(this._scheduledMusicToken);
            }
            this._scheduledMusicToken = null;
        }

        this.game.audioSystem.stopMusic();
    }
    
    update() {
        // Handle input
        this.handleInput();
        
        // Update alert system
        if (this.alertActive) {
            this.alertTimer--;
            this.alertFlashTimer++;
            
            if (this.alertTimer <= 0) {
                this.alertActive = false;
                this.gameActive = true; // Activate game after alert
                console.log('Asteroid warning sequence completed - starting survival timer');
            }
            // Don't update other game systems during alert
            return;
        }
        
        // Update victory system (should happen even when gameActive is false)
        if (this.victoryActive) {
            this.updateVictorySequence();
            // Continue processing some game systems during victory but not asteroid spawning
            
            // Update player ship
            this.updatePlayer();
            
            // Update bullets
            this.updateBullets();
            
            // Update asteroids
            this.updateAsteroids();
            
            // Update UFOs
            this.updateUfos();
            
            // Update UFO spawning (continue UFO spawning during victory)
            this.updateUfoSpawning();
            
            // Check bullet-asteroid collisions
            this.checkBulletAsteroidCollisions();
            
            // Check bullet-UFO collisions
            this.checkBulletUfoCollisions();
            
            // Check player-asteroid collisions
            this.checkPlayerAsteroidCollisions();
            
            // Update fire timer
            if (this.fireTimer > 0) {
                this.fireTimer--;
            }
            
            // Update starfield animation
            this.updateStarfield();
            
            return; // Exit after processing victory mode
        }
        
        if (!this.gameActive) return;
        
        // Update player ship
        this.updatePlayer();
        
        // Update bullets
        this.updateBullets();
        
        // Update asteroids
        this.updateAsteroids();
        
        // Update UFOs
        this.updateUfos();
        
        // Update asteroid spawning
        this.updateAsteroidSpawning();
        
        // Update UFO spawning
        this.updateUfoSpawning();
        
        // Check bullet-asteroid collisions
        this.checkBulletAsteroidCollisions();
        
        // Check bullet-UFO collisions
        this.checkBulletUfoCollisions();
        
        // Check player-asteroid collisions
        this.checkPlayerAsteroidCollisions();
        
        // Update fire timer
        if (this.fireTimer > 0) {
            this.fireTimer--;
        }
        
        // Update starfield animation
        this.updateStarfield();
        
        // Update timer
        this.updateTimer();
        
        // Check victory/defeat conditions only if not already in victory
        this.checkGameConditions();
        
        // Clear frame input states
        this.game.inputSystem.clearFrameStates();
    }
    
    handleInput() {
        const input = this.game.inputSystem;
        
        // Allow skipping alert with fire button
        if (this.alertActive && input.isFirePressed()) {
            console.log('Player skipped asteroid warning sequence');
            this.skipAlert();
            return; // Don't process other inputs during alert skip
        }
        
        // Don't process normal game inputs during alert
        if (this.alertActive) {
            return;
        }
        
        // ESC key disabled - player must complete or fail the asteroid storm
        // if (input.isKeyPressed('Escape')) {
        //     console.log('ESC pressed - returning to menu');
        //     this.game.switchToMode('menu');
        //     return;
        // }
        
        // Only process game controls when game is active and not in victory mode
        if (!this.gameActive || this.victoryActive) return;
        
        // Rotation controls
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) {
            this.player.angle -= this.player.rotationSpeed;
        }
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) {
            this.player.angle += this.player.rotationSpeed;
        }
        
        // Thrust control
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW')) {
            this.player.thrusting = true;
            
            // Apply thrust in direction ship is facing
            const thrustX = Math.cos(this.player.angle) * this.player.thrustPower;
            const thrustY = Math.sin(this.player.angle) * this.player.thrustPower;
            
            this.player.velocity.x += thrustX;
            this.player.velocity.y += thrustY;
            
            // Limit maximum speed
            const speed = Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.y ** 2);
            if (speed > this.player.maxSpeed) {
                this.player.velocity.x = (this.player.velocity.x / speed) * this.player.maxSpeed;
                this.player.velocity.y = (this.player.velocity.y / speed) * this.player.maxSpeed;
            }
        } else {
            this.player.thrusting = false;
        }
        
        // Fire control
        if (input.isFirePressed()) {
            this.fireBullet();
        }
    }
    
    updatePlayer() {
        // Update invincibility timer (but not during victory sequence)
        if (this.player.invulnerabilityTimer > 0 && !this.victoryActive) {
            this.player.invulnerabilityTimer--;
            if (this.player.invulnerabilityTimer <= 0) {
                this.player.invulnerable = false;
                console.log('Player invincibility ended');
            }
        }
        
        // Apply momentum
        this.player.x += this.player.velocity.x;
        this.player.y += this.player.velocity.y;
        
        // Apply friction
        this.player.velocity.x *= this.player.friction;
        this.player.velocity.y *= this.player.friction;
        
        // Wrap around screen edges
        if (this.player.x < 0) {
            this.player.x = this.worldBounds.width;
        } else if (this.player.x > this.worldBounds.width) {
            this.player.x = 0;
        }
        
        if (this.player.y < 0) {
            this.player.y = this.worldBounds.height;
        } else if (this.player.y > this.worldBounds.height) {
            this.player.y = 0;
        }
        
        // Normalize angle
        if (this.player.angle < 0) {
            this.player.angle += Math.PI * 2;
        } else if (this.player.angle >= Math.PI * 2) {
            this.player.angle -= Math.PI * 2;
        }
    }
    
    updateTimer() {
        if (this.timer > 0) {
            this.timer--;
        }
    }
    
    updateStarfield() {
        this.starfieldTimer++;
        
        // Update each star's twinkling
        for (const star of this.starfield) {
            // Each star has its own twinkling cycle based on its position
            const twinkleSpeed = star.twinkleSpeed;
            const phase = (this.starfieldTimer * twinkleSpeed + star.twinkleOffset) % (Math.PI * 2);
            
            // Create a subtle sine wave twinkling effect
            const twinkleAmount = Math.sin(phase) * 0.3; // Range: -0.3 to +0.3
            star.currentBrightness = Math.max(0.1, Math.min(1.0, star.baseBrightness + twinkleAmount));
        }
    }
    
    fireBullet() {
        // Check fire rate limiting
        if (this.fireTimer > 0) {
            return; // Too soon to fire again
        }
        
        // Check bullet limit
        if (this.bullets.length >= this.maxBullets) {
            return; // Too many bullets on screen
        }
        
        // Create new bullet
        const bullet = {
            x: this.player.x,
            y: this.player.y,
            velocity: {
                x: Math.cos(this.player.angle) * this.bulletSpeed,
                y: Math.sin(this.player.angle) * this.bulletSpeed
            },
            lifetime: this.bulletLifetime,
            size: 2
        };
        
        this.bullets.push(bullet);
        this.fireTimer = this.fireRate; // Reset fire timer
        
        // Play shooting sound
        this.game.audioSystem.playSfx('playerShootAstroid');
    }
    
    updateBullets() {
        // Update bullet positions and lifetime
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Move bullet
            bullet.x += bullet.velocity.x;
            bullet.y += bullet.velocity.y;
            
            // Decrease lifetime
            bullet.lifetime--;
            
            // Handle screen wrapping
            if (bullet.x < 0) {
                bullet.x = this.worldBounds.width;
            } else if (bullet.x > this.worldBounds.width) {
                bullet.x = 0;
            }
            
            if (bullet.y < 0) {
                bullet.y = this.worldBounds.height;
            } else if (bullet.y > this.worldBounds.height) {
                bullet.y = 0;
            }
            
            // Remove expired bullets
            if (bullet.lifetime <= 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    spawnInitialAsteroids() {
        // Spawn 6-8 large asteroids at the start (increased from 4-6)
        const count = 6 + Math.floor(Math.random() * 3); // 6-8 asteroids
        console.log(`Spawning ${count} initial large asteroids`);
        
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid(this.asteroidTypes.LARGE);
        }
    }
    
    spawnAsteroid(type, x = null, y = null, inheritedVelocity = null, forceSpawn = false) {
        // Don't spawn if at max capacity, unless it's a fragment from breaking (forceSpawn = true)
        if (!forceSpawn && this.asteroids.length >= this.maxAsteroids) {
            return;
        }
        
        let size, health, damage, color;
        
        // Configure asteroid based on type
        switch (type) {
            case this.asteroidTypes.LARGE:
                size = 25;
                health = 1; // All asteroids destroyed in one hit
                damage = 2; // Large asteroids do 2 damage to player
                color = '#AAAAAA';
                break;
            case this.asteroidTypes.MEDIUM:
                size = 15;
                health = 1;
                damage = 1; // Medium asteroids do 1 damage
                color = '#BBBBBB';
                break;
            case this.asteroidTypes.SMALL:
                size = 8;
                health = 1;
                damage = 1; // Small asteroids do 1 damage
                color = '#CCCCCC';
                break;
        }
        
        // Position: spawn from edges or use provided position
        let spawnX, spawnY;
        if (x !== null && y !== null) {
            spawnX = x;
            spawnY = y;
        } else {
            // Spawn from random edge
            const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
            switch (edge) {
                case 0: // Top
                    spawnX = Math.random() * this.worldBounds.width;
                    spawnY = -size;
                    break;
                case 1: // Right
                    spawnX = this.worldBounds.width + size;
                    spawnY = Math.random() * this.worldBounds.height;
                    break;
                case 2: // Bottom
                    spawnX = Math.random() * this.worldBounds.width;
                    spawnY = this.worldBounds.height + size;
                    break;
                case 3: // Left
                    spawnX = -size;
                    spawnY = Math.random() * this.worldBounds.height;
                    break;
            }
        }
        
        // Velocity: random or inherited
        let velocity;
        if (inheritedVelocity) {
            // For fragments from explosions, use the explosive velocity with minimal variation
            // For normal inheritance, add some variation
            if (forceSpawn) {
                // This is a fragment - use explosive velocity with minimal variation
                velocity = {
                    x: inheritedVelocity.x + (Math.random() - 0.5) * 0.3,
                    y: inheritedVelocity.y + (Math.random() - 0.5) * 0.3
                };
            } else {
                // Normal inherited velocity with more variation
                velocity = {
                    x: inheritedVelocity.x + (Math.random() - 0.5) * 1,
                    y: inheritedVelocity.y + (Math.random() - 0.5) * 1
                };
            }
        } else {
            // Random velocity (slower speeds for more strategic gameplay)
            const speed = 0.3 + Math.random() * 1.2; // Speed between 0.3 and 1.5 (reduced from 0.5-2.5)
            const angle = Math.random() * Math.PI * 2;
            velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
        }
        
        // Create asteroid
        const asteroid = {
            type: type,
            x: spawnX,
            y: spawnY,
            velocity: velocity,
            size: size,
            health: health,
            damage: damage,
            color: color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1, // Slow tumbling
            id: Date.now() + Math.random() // Unique ID
        };
        
        this.asteroids.push(asteroid);
        
        // Play spawn sound effect
        this.game.audioSystem.playSfx('asteroidSpawn');
        
        console.log(`Spawned ${type} asteroid at (${spawnX.toFixed(1)}, ${spawnY.toFixed(1)})`);
    }
    
    updateAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // Move asteroid
            asteroid.x += asteroid.velocity.x;
            asteroid.y += asteroid.velocity.y;
            
            // Rotate asteroid
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Handle screen wrapping
            if (asteroid.x < -asteroid.size) {
                asteroid.x = this.worldBounds.width + asteroid.size;
            } else if (asteroid.x > this.worldBounds.width + asteroid.size) {
                asteroid.x = -asteroid.size;
            }
            
            if (asteroid.y < -asteroid.size) {
                asteroid.y = this.worldBounds.height + asteroid.size;
            } else if (asteroid.y > this.worldBounds.height + asteroid.size) {
                asteroid.y = -asteroid.size;
            }
        }
    }
    
    updateAsteroidSpawning() {
        // Only spawn during active gameplay (not during victory mode)
        if (!this.gameActive || this.victoryActive) {
            return;
        }
        
        this.asteroidSpawnTimer++;
        
        // Calculate dynamic spawn rate based on time elapsed
        const timeElapsed = this.maxTimer - this.timer;
        const progressRatio = timeElapsed / this.maxTimer;
        
        // Increase spawn rate over time (decrease spawn interval) - more aggressive spawning
        const baseRate = 120; // 2 seconds (reduced from 3)
        const minRate = 30;   // 0.5 second minimum (reduced from 1 second)
        this.asteroidSpawnRate = Math.max(minRate, baseRate - (progressRatio * 90)); // Faster ramp-up
        
        // Spawn new asteroid if timer reached and under max capacity
        if (this.asteroidSpawnTimer >= this.asteroidSpawnRate && this.asteroids.length < this.maxAsteroids) {
            this.spawnAsteroid(this.asteroidTypes.LARGE);
            this.asteroidSpawnTimer = 0;
            console.log(`Spawned new asteroid - total count: ${this.asteroids.length}/${this.maxAsteroids}`);
        }
    }
    
    spawnUfo() {
        // Don't spawn if at max capacity
        if (this.ufos.length >= this.maxUfos) {
            return;
        }
        
        // Spawn UFO from random edge of screen
        let spawnX, spawnY;
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        const ufoSize = 20;
        
        switch (edge) {
            case 0: // Top
                spawnX = Math.random() * this.worldBounds.width;
                spawnY = -ufoSize;
                break;
            case 1: // Right
                spawnX = this.worldBounds.width + ufoSize;
                spawnY = Math.random() * this.worldBounds.height;
                break;
            case 2: // Bottom
                spawnX = Math.random() * this.worldBounds.width;
                spawnY = this.worldBounds.height + ufoSize;
                break;
            case 3: // Left
                spawnX = -ufoSize;
                spawnY = Math.random() * this.worldBounds.height;
                break;
        }
        
        // UFO flies toward player initially, then patrol
        const angleToPlayer = Math.atan2(this.player.y - spawnY, this.player.x - spawnX);
        const speed = 1 + Math.random() * 1; // Speed 1-2 (back to original slower speed)
        
        const ufo = {
            x: spawnX,
            y: spawnY,
            velocity: {
                x: Math.cos(angleToPlayer) * speed,
                y: Math.sin(angleToPlayer) * speed
            },
            size: ufoSize,
            health: 2,                    // Takes 2 shots to destroy
            shootTimer: 0,
            shootRate: 60 + Math.random() * 90, // Shoots every 1-2.5 seconds (faster shooting)
            bullets: [],                  // UFO bullets
            patrolTimer: 0,
            patrolDirection: Math.random() * Math.PI * 2, // Random patrol direction
            id: Date.now() + Math.random()
        };
        
        this.ufos.push(ufo);
        
        // Play UFO spawn sound (we can use obstacle spawn sound for now)
        this.game.audioSystem.playSfx('obstacleSpawn');
        
        console.log('UFO spawned at edge of screen');
    }
    
    updateUfos() {
        for (let i = this.ufos.length - 1; i >= 0; i--) {
            const ufo = this.ufos[i];
            
            // Update UFO movement (simple AI - move toward player with some patrol behavior)
            ufo.patrolTimer++;
            if (ufo.patrolTimer > 180) { // Change direction every 3 seconds
                const angleToPlayer = Math.atan2(this.player.y - ufo.y, this.player.x - ufo.x);
                const patrolVariation = (Math.random() - 0.5) * 1.5; // Add some randomness
                const targetAngle = angleToPlayer + patrolVariation;
                const speed = 0.8 + Math.random() * 0.4; // Speed 0.8-1.2 (back to original slower speed)
                
                ufo.velocity.x = Math.cos(targetAngle) * speed;
                ufo.velocity.y = Math.sin(targetAngle) * speed;
                ufo.patrolTimer = 0;
            }
            
            // Move UFO
            ufo.x += ufo.velocity.x;
            ufo.y += ufo.velocity.y;
            
            // Handle screen wrapping
            if (ufo.x < -ufo.size) {
                ufo.x = this.worldBounds.width + ufo.size;
            } else if (ufo.x > this.worldBounds.width + ufo.size) {
                ufo.x = -ufo.size;
            }
            
            if (ufo.y < -ufo.size) {
                ufo.y = this.worldBounds.height + ufo.size;
            } else if (ufo.y > this.worldBounds.height + ufo.size) {
                ufo.y = -ufo.size;
            }
            
            // UFO shooting
            ufo.shootTimer++;
            if (ufo.shootTimer >= ufo.shootRate) {
                this.ufoShoot(ufo);
                ufo.shootTimer = 0;
                // Randomize next shot timing
                ufo.shootRate = 60 + Math.random() * 90; // 1-2.5 seconds (faster shooting)
            }
            
            // Update UFO bullets
            for (let b = ufo.bullets.length - 1; b >= 0; b--) {
                const bullet = ufo.bullets[b];
                bullet.x += bullet.velocity.x;
                bullet.y += bullet.velocity.y;
                bullet.lifetime--;
                
                // Remove expired bullets
                if (bullet.lifetime <= 0) {
                    ufo.bullets.splice(b, 1);
                    continue;
                }
                
                // Check collision with player
                if (!this.player.invulnerable && !this.victoryActive) {
                    const dx = bullet.x - this.player.x;
                    const dy = bullet.y - this.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.player.size + bullet.size) {
                        // Player hit by UFO bullet
                        console.log('Player hit by UFO bullet for 1 damage');
                        this.game.gameState.player.health -= 1;
                        this.game.audioSystem.playSfx('damageTaken');
                        
                        // Activate invincibility
                        this.player.invulnerable = true;
                        this.player.invulnerabilityTimer = 120;
                        
                        // Remove bullet
                        ufo.bullets.splice(b, 1);
                    }
                }
            }
        }
    }
    
    ufoShoot(ufo) {
        // Calculate angle to player
        const angleToPlayer = Math.atan2(this.player.y - ufo.y, this.player.x - ufo.x);
        const bulletSpeed = 3;
        
        const bullet = {
            x: ufo.x,
            y: ufo.y,
            velocity: {
                x: Math.cos(angleToPlayer) * bulletSpeed,
                y: Math.sin(angleToPlayer) * bulletSpeed
            },
            size: 3,
            lifetime: 180 // 3 seconds at 60fps
        };
        
        ufo.bullets.push(bullet);
        
        // Play UFO shoot sound (use basic enemy laser)
        this.game.audioSystem.playSfx('basicEnemyLaser');
    }
    
    updateUfoSpawning() {
        // Only spawn during active gameplay
        if (!this.gameActive || this.victoryActive) {
            return;
        }
        
        this.ufoSpawnTimer++;
        
        // Calculate dynamic spawn rate based on time elapsed
        const timeElapsed = this.maxTimer - this.timer;
        const progressRatio = timeElapsed / this.maxTimer;
        
        // Decrease spawn interval over time (more frequent UFOs later)
        const baseRate = 1800; // 30 seconds initially
        const minRate = 900;   // 15 seconds minimum
        this.ufoSpawnRate = Math.max(minRate, baseRate - (progressRatio * 600));
        
        // Spawn UFO if timer reached and under max capacity
        if (this.ufoSpawnTimer >= this.ufoSpawnRate && this.ufos.length < this.maxUfos) {
            this.spawnUfo();
            this.ufoSpawnTimer = 0;
            this.ufoLastSpawn = timeElapsed;
        }
    }
    
    checkBulletUfoCollisions() {
        for (let b = this.bullets.length - 1; b >= 0; b--) {
            const bullet = this.bullets[b];
            
            for (let u = this.ufos.length - 1; u >= 0; u--) {
                const ufo = this.ufos[u];
                
                // Simple distance-based collision detection
                const dx = bullet.x - ufo.x;
                const dy = bullet.y - ufo.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ufo.size + bullet.size) {
                    // UFO hit!
                    console.log('UFO hit by player bullet');
                    ufo.health--;
                    
                    // Play hit sound
                    this.game.audioSystem.playSfx('eliteEnemyHit');
                    
                    // Remove bullet
                    this.bullets.splice(b, 1);
                    
                    // Check if UFO is destroyed
                    if (ufo.health <= 0) {
                        // Award bonus points for UFO destruction
                        this.game.gameState.player.score += 5;
                        
                        // Play explosion sound
                        this.game.audioSystem.playSfx('explosionCombatMode');
                        
                        // Remove UFO
                        this.ufos.splice(u, 1);
                        console.log('UFO destroyed! +5 points');
                    }
                    
                    break; // Bullet is destroyed, check next bullet
                }
            }
        }
    }
    
    checkBulletAsteroidCollisions() {
        for (let b = this.bullets.length - 1; b >= 0; b--) {
            const bullet = this.bullets[b];
            
            for (let a = this.asteroids.length - 1; a >= 0; a--) {
                const asteroid = this.asteroids[a];
                
                // Simple distance-based collision detection
                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < asteroid.size + bullet.size) {
                    // Collision detected!
                    this.destroyAsteroid(asteroid, a);
                    this.bullets.splice(b, 1);
                    break; // Bullet is destroyed, no need to check other asteroids
                }
            }
        }
    }
    
    destroyAsteroid(asteroid, index) {
        console.log(`Destroying ${asteroid.type} asteroid`);
        
        // Award points (1 point for any asteroid destruction)
        this.game.gameState.player.score += 1;
        
        // Play explosion sound
        this.game.audioSystem.playSfx('asteroidExplosion');
        
        // Break asteroid into smaller pieces if applicable
        if (asteroid.type === this.asteroidTypes.LARGE) {
            // Large breaks into 2-3 medium asteroids with explosive separation
            const count = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
            console.log(`Breaking large asteroid into ${count} medium pieces`);
            for (let i = 0; i < count; i++) {
                // Create explosive velocity - fragments fly apart at moderate speeds
                const explosionAngle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5; // Spread evenly with some randomness
                const explosionSpeed = 0.75 + Math.random() * 1; // Speed 0.75-1.75 (reduced from 1.5-3.5)
                const explosiveVelocity = {
                    x: asteroid.velocity.x + Math.cos(explosionAngle) * explosionSpeed,
                    y: asteroid.velocity.y + Math.sin(explosionAngle) * explosionSpeed
                };
                
                this.spawnAsteroid(
                    this.asteroidTypes.MEDIUM,
                    asteroid.x,
                    asteroid.y,
                    explosiveVelocity,
                    true // Force spawn fragments even if at max capacity
                );
            }
        } else if (asteroid.type === this.asteroidTypes.MEDIUM) {
            // Medium breaks into 2-3 small asteroids with explosive separation
            const count = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
            console.log(`Breaking medium asteroid into ${count} small pieces`);
            for (let i = 0; i < count; i++) {
                // Create explosive velocity - smaller fragments move faster but not too fast
                const explosionAngle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.7; // More spread for small pieces
                const explosionSpeed = 1 + Math.random() * 1.25; // Speed 1-2.25 (reduced from 2-4.5)
                const explosiveVelocity = {
                    x: asteroid.velocity.x + Math.cos(explosionAngle) * explosionSpeed,
                    y: asteroid.velocity.y + Math.sin(explosionAngle) * explosionSpeed
                };
                
                this.spawnAsteroid(
                    this.asteroidTypes.SMALL,
                    asteroid.x,
                    asteroid.y,
                    explosiveVelocity,
                    true // Force spawn fragments even if at max capacity
                );
            }
        }
        // Small asteroids are completely destroyed (no fragments)
        
        // Remove asteroid from array
        this.asteroids.splice(index, 1);
    }
    
    checkPlayerAsteroidCollisions() {
        // Skip collision check if player is invulnerable or during victory mode
        if (this.player.invulnerable || this.victoryActive) {
            return;
        }
        
        for (let i = 0; i < this.asteroids.length; i++) {
            const asteroid = this.asteroids[i];
            
            // Simple distance-based collision detection
            const dx = this.player.x - asteroid.x;
            const dy = this.player.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.size + asteroid.size) {
                // Collision detected!
                console.log(`Player hit by ${asteroid.type} asteroid for ${asteroid.damage} damage`);
                
                // Apply damage to player
                this.game.gameState.player.health -= asteroid.damage;
                
                // Play damage sound
                this.game.audioSystem.playSfx('damageTaken');
                
                // Activate invincibility shield (2 seconds = 120 frames at 60fps)
                this.player.invulnerable = true;
                this.player.invulnerabilityTimer = 120;
                console.log('Player invincibility activated for 2 seconds');
                
                // Optional: Add knockback effect
                const knockbackForce = 3;
                const knockbackAngle = Math.atan2(dy, dx); // Direction away from asteroid
                this.player.velocity.x += Math.cos(knockbackAngle) * knockbackForce;
                this.player.velocity.y += Math.sin(knockbackAngle) * knockbackForce;
                
                break; // Only process one collision per frame
            }
        }
    }
    
    checkGameConditions() {
        // Check for player death
        if (!this.game.gameState.isPlayerAlive()) {
            console.log('Player died in asteroid storm - switching to Game Over');
            this.gameActive = false;
            this.game.switchToMode('gameOver');
            return;
        }
        
        // Check for victory (survived the timer)
        if (this.timer <= 0) {
            console.log('Asteroid storm survived - starting victory sequence');
            console.log(`Player health at victory start: ${this.game.gameState.player.health}`);
            console.log(`Victory state: victoryActive=${this.victoryActive}, victoryTimer=${this.victoryTimer}, victoryMessageAlpha=${this.victoryMessageAlpha}`);
            this.gameActive = false;
            this.victory = true;
            this.victoryActive = true;
            this.victoryTimer = this.victoryDuration;
            this.victoryMessageAlpha = 0;
            
            // Make player invulnerable during victory sequence
            this.player.invulnerable = true;
            this.player.invulnerabilityTimer = this.victoryDuration; // Stay invulnerable for the entire victory sequence
            
            console.log(`Victory sequence started: victoryActive=${this.victoryActive}, victoryTimer=${this.victoryTimer}`);
            console.log('Player made invulnerable for victory sequence');
        }
    }
    
    updateVictorySequence() {
        this.victoryTimer--;
        console.log(`Victory update: timer=${this.victoryTimer}, alpha=${this.victoryMessageAlpha}`);
        
        // Calculate fade in/out alpha based on timer (same as combat mode)
        const fadeInDuration = 30; // 0.5 seconds fade in
        const fadeOutDuration = 30; // 0.5 seconds fade out
        const holdDuration = this.victoryDuration - fadeInDuration - fadeOutDuration; // Hold at full opacity
        
        if (this.victoryTimer > this.victoryDuration - fadeInDuration) {
            // Fade in phase
            const fadeProgress = (this.victoryDuration - this.victoryTimer) / fadeInDuration;
            this.victoryMessageAlpha = Math.min(1, fadeProgress);
            console.log(`Fade in: progress=${fadeProgress}, alpha=${this.victoryMessageAlpha}`);
        } else if (this.victoryTimer > fadeOutDuration) {
            // Hold phase - full opacity
            this.victoryMessageAlpha = 1;
            console.log(`Hold phase: alpha=${this.victoryMessageAlpha}`);
        } else {
            // Fade out phase
            const fadeProgress = this.victoryTimer / fadeOutDuration;
            this.victoryMessageAlpha = Math.max(0, fadeProgress);
            console.log(`Fade out: progress=${fadeProgress}, alpha=${this.victoryMessageAlpha}`);
        }
        
        if (this.victoryTimer <= 0) {
            this.victoryActive = false;
            this.victoryMessageAlpha = 0;
            console.log('Victory sequence completed - transitioning to Star Map');
            console.log(`Player health at victory completion: ${this.game.gameState.player.health}`);
            console.log(`Player invulnerable state: ${this.player.invulnerable}, timer: ${this.player.invulnerabilityTimer}`);
            
            // Mark the sector as completed in star map
            if (this.game.modes.starMap) {
                this.game.modes.starMap.completeSector();
            }
            
            // Transition to star map
            this.game.switchToMode('starMap');
        }
    }
    
    generateStarfield() {
        const stars = [];
        const numStars = 50; // Fewer stars for classic asteroids feel
        
        for (let i = 0; i < numStars; i++) {
            const baseBrightness = 0.3 + Math.random() * 0.7;
            stars.push({
                x: Math.random() * this.worldBounds.width,
                y: Math.random() * this.worldBounds.height,
                size: 1 + Math.random() * 2,
                baseBrightness: baseBrightness,
                currentBrightness: baseBrightness,
                twinkleSpeed: 0.02 + Math.random() * 0.08, // Random twinkling speed
                twinkleOffset: Math.random() * Math.PI * 2 // Random starting phase
            });
        }
        
        return stars;
    }
    
    skipAlert() {
        // Immediately end the alert sequence
        this.alertActive = false;
        this.alertTimer = 0;
        this.gameActive = true;
        
        // Stop the warning sound effect
        this.game.audioSystem.stopSfx('warningAsteroidsIncoming');
        
        // Start asteroid field music immediately
        this.game.audioSystem.playMusic('AsteroidField');
        console.log('Alert skipped - asteroid field music started immediately');
    }
    
    render(renderer) {
        // Show alert screen when active, otherwise show normal gameplay
        if (this.alertActive) {
            this.renderAlertScreen(renderer);
        } else {
            // Clear screen with deep space black
            renderer.clear('#000000');
            
            // Draw starfield
            this.renderStarfield(renderer);
            
            // Draw player ship
            this.renderPlayer(renderer);
            
            // Draw bullets
            this.renderBullets(renderer);
            
            // Draw asteroids
            this.renderAsteroids(renderer);
            
            // Draw UFOs
            this.renderUfos(renderer);
            
            // Draw UI
            this.renderUI(renderer);
            
            // Render victory message overlay if active
            if (this.victoryActive) {
                this.renderVictoryMessage(renderer);
            }
        }
    }
    
    renderStarfield(renderer) {
        for (const star of this.starfield) {
            const alpha = star.currentBrightness;
            const color = `rgba(255, 255, 255, ${alpha})`;
            renderer.drawCircle(star.x, star.y, star.size, color);
        }
    }
    
    renderPlayer(renderer) {
        const ctx = renderer.ctx;
        
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.angle);
        
        // Draw triangular ship (classic Asteroids style)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        // Ship nose (front point)
        ctx.moveTo(this.player.size, 0);
        // Left wing
        ctx.lineTo(-this.player.size * 0.6, -this.player.size * 0.8);
        // Ship center (back)
        ctx.lineTo(-this.player.size * 0.3, 0);
        // Right wing
        ctx.lineTo(-this.player.size * 0.6, this.player.size * 0.8);
        // Back to nose
        ctx.lineTo(this.player.size, 0);
        ctx.stroke();
        
        // Draw thrust flame if thrusting
        if (this.player.thrusting) {
            ctx.strokeStyle = '#FF6600';
            ctx.lineWidth = 3;
            
            // Flame flickers
            const flameLength = this.player.size * (0.8 + Math.random() * 0.4);
            
            ctx.beginPath();
            ctx.moveTo(-this.player.size * 0.3, 0);
            ctx.lineTo(-this.player.size - flameLength, 0);
            ctx.stroke();
            
            // Add flame spread
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-this.player.size * 0.5, -this.player.size * 0.2);
            ctx.lineTo(-this.player.size - flameLength * 0.7, 0);
            ctx.moveTo(-this.player.size * 0.5, this.player.size * 0.2);
            ctx.lineTo(-this.player.size - flameLength * 0.7, 0);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw invincibility shield if active
        if (this.player.invulnerable) {
            this.renderInvincibilityShield(renderer);
        }
    }
    
    renderBullets(renderer) {
        for (const bullet of this.bullets) {
            // Calculate alpha based on remaining lifetime for fade effect
            const alpha = Math.min(1, bullet.lifetime / 30); // Fade out over last 30 frames
            const color = `rgba(255, 255, 255, ${alpha})`;
            
            // Draw bullet as a small bright circle
            renderer.drawCircle(bullet.x, bullet.y, bullet.size, color);
            
            // Add a subtle glow effect
            if (alpha > 0.5) {
                const glowColor = `rgba(255, 255, 255, ${alpha * 0.3})`;
                renderer.drawCircle(bullet.x, bullet.y, bullet.size + 1, glowColor);
            }
        }
    }
    
    renderInvincibilityShield(renderer) {
        const ctx = renderer.ctx;
        
        // Calculate shield opacity based on remaining time and flashing effect
        const timeRatio = this.player.invulnerabilityTimer / 120; // 0 to 1
        const flashSpeed = 8; // Frames per flash cycle
        const isFlashing = Math.floor(this.player.invulnerabilityTimer / flashSpeed) % 2 === 0;
        
        // Base opacity decreases over time, flashing effect
        let opacity = timeRatio * 0.6; // Max 60% opacity
        if (isFlashing) {
            opacity *= 0.7; // Dim during flash for effect
        }
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        // Draw blue shield circle around player
        ctx.strokeStyle = '#00AAFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner glow
        ctx.strokeStyle = '#AADDFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size + 6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderAsteroids(renderer) {
        for (const asteroid of this.asteroids) {
            const ctx = renderer.ctx;
            
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            
            // Draw asteroid as irregular shape
            ctx.strokeStyle = asteroid.color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            // Create irregular asteroid shape based on size
            const points = 8; // Number of points for the asteroid outline
            const radiusVariation = 0.3; // How much the radius varies
            
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const variation = 1 + (Math.sin(i * 2.7) * radiusVariation); // Pseudo-random variation
                const radius = asteroid.size * variation;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Add some internal detail lines for larger asteroids
            if (asteroid.type === this.asteroidTypes.LARGE || asteroid.type === this.asteroidTypes.MEDIUM) {
                ctx.strokeStyle = asteroid.color;
                ctx.lineWidth = 1;
                
                // Draw a few internal lines
                ctx.beginPath();
                ctx.moveTo(-asteroid.size * 0.5, -asteroid.size * 0.2);
                ctx.lineTo(asteroid.size * 0.3, asteroid.size * 0.1);
                ctx.moveTo(-asteroid.size * 0.1, asteroid.size * 0.4);
                ctx.lineTo(asteroid.size * 0.2, -asteroid.size * 0.3);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    renderUI(renderer) {
        // Timer display
        const timeRemaining = Math.ceil(this.timer / 60); // Convert frames to seconds
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        renderer.drawText(timeText, 400, 50, '#FFFFFF', 24, 'Courier New');
        renderer.drawText('SURVIVAL TIME', 400, 30, '#AAAAAA', 12, 'Courier New');
        
        // Health display
        const health = this.game.gameState.player.health;
        const maxHealth = 7;
        
        // Health bar
        const healthBarX = 50;
        const healthBarY = 50;
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
        const score = this.game.gameState.player.score;
        renderer.drawText(`SCORE: ${score}`, 700, 570, '#FFFF00', 12, 'Courier New');
    }
    
    renderAlertScreen(renderer) {
        // Orange/Yellow background for asteroid warning
        renderer.clear('#332200');
        
        // Calculate flash effect (rapid orange/yellow blinking)
        const flashSpeed = 8; // frames per flash
        const isFlashing = Math.floor(this.alertFlashTimer / flashSpeed) % 2 === 0;
        
        // Alert border with flashing effect
        if (isFlashing) {
            renderer.drawStroke(10, 10, 780, 580, '#FFAA00', 8); // Orange border
        } else {
            renderer.drawStroke(10, 10, 780, 580, '#FFFF00', 8); // Yellow border
        }
        
        // Main alert message - large and flashing
        const alertColor = isFlashing ? '#FFFFFF' : '#FFAA00';
        const alertSize = isFlashing ? 48 : 44;
        
        renderer.drawText('WARNING', 400, 180, alertColor, alertSize, 'Courier New');
        renderer.drawText('WARNING', 400, 230, alertColor, alertSize, 'Courier New');
        renderer.drawText('WARNING', 400, 280, alertColor, alertSize, 'Courier New');
        
        // Secondary message
        const messageColor = isFlashing ? '#FFFF00' : '#FFAA00';
        renderer.drawText('ASTEROID FIELD DETECTED', 400, 350, messageColor, 32, 'Courier New');
        
        // Progress indicator showing time remaining
        const progress = this.alertTimer / this.alertDuration;
        const progressWidth = 600 * progress;
        renderer.drawRect(100, 480, 600, 20, '#442200'); // Background
        renderer.drawRect(100, 480, progressWidth, 20, '#FFAA00'); // Progress
        renderer.drawText('PREPARING NAVIGATION SYSTEMS', 400, 490, '#FFFFFF', 14, 'Courier New');
        
        // Additional warning messages with alternating colors
        const warningColor1 = isFlashing ? '#FFFF00' : '#FFAA00';
        const warningColor2 = isFlashing ? '#FFAA00' : '#FFFF00';
        
        renderer.drawText('SURVIVAL MODE ACTIVATED', 400, 440, warningColor1, 16, 'Courier New');
        
        // Skip instruction
        renderer.drawText('PRESS SPACE TO SKIP WARNING', 400, 560, '#FFFFFF', 12, 'Courier New');
    }
    
    renderVictoryMessage(renderer) {
        const ctx = renderer.ctx;
        
        ctx.save();
        
        // Semi-transparent dark overlay
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 800, 600);
        
        // Victory message with fade effect
        ctx.globalAlpha = this.victoryMessageAlpha;
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 10;
        
        // Main victory message
        ctx.fillText(this.victoryMessage, 400, 280);
        
        // Additional context
        ctx.font = 'bold 18px Courier New';
        ctx.fillText('ASTEROID FIELD NAVIGATED SUCCESSFULLY', 400, 320);
        
        ctx.restore();
    }
    
    renderUfos(renderer) {
        const ctx = renderer.ctx;
        
        for (const ufo of this.ufos) {
            ctx.save();
            
            // Draw UFO as a classic flying saucer
            ctx.translate(ufo.x, ufo.y);
            
            // UFO body (ellipse)
            ctx.strokeStyle = '#00FF00';
            ctx.fillStyle = '#004400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, ufo.size * 0.8, ufo.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // UFO dome
            ctx.strokeStyle = '#00FFAA';
            ctx.fillStyle = '#002200';
            ctx.beginPath();
            ctx.ellipse(0, -ufo.size * 0.2, ufo.size * 0.4, ufo.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // UFO lights (simple dots)
            ctx.fillStyle = '#FFFF00';
            const lightCount = 6;
            for (let i = 0; i < lightCount; i++) {
                const angle = (Math.PI * 2 * i) / lightCount;
                const lightX = Math.cos(angle) * ufo.size * 0.6;
                const lightY = Math.sin(angle) * ufo.size * 0.25;
                ctx.beginPath();
                ctx.arc(lightX, lightY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Health indicator (small dots above UFO)
            ctx.fillStyle = '#FF0000';
            for (let i = 0; i < ufo.health; i++) {
                ctx.beginPath();
                ctx.arc(-ufo.size * 0.3 + (i * 8), -ufo.size * 0.8, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            // Draw UFO bullets
            ctx.save();
            ctx.fillStyle = '#00FF00';
            for (const bullet of ufo.bullets) {
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}
