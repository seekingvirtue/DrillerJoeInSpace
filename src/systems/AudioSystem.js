/**
 * Audio System
 * Handles background music, sound effects, and audio management
 */
class AudioSystem {
    constructor() {
        this.masterVolume = 1.0;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.currentMusic = null;
        this.musicAudio = null;
        this.sounds = {};
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.musicTracks = {};
        this.isInitialized = false;
        
        // Combat music loop tracking
        this.combatLoopCount = 0;
        this.combatMaxLoops = 3;
    }
    
    init() {
        try {
            console.log('AudioSystem initializing...');
            this.preloadMusic();
            this.preloadSfx();
            this.isInitialized = true;
            console.log('AudioSystem initialized successfully');
        } catch (error) {
            console.warn('AudioSystem initialization failed:', error);
            this.isInitialized = false;
        }
    }
    
    preloadMusic() {
        // Preload menu theme music
        this.musicTracks['menu-theme'] = new Audio('assets/audio/music/menu-theme.wav');
        this.musicTracks['menu-theme'].preload = 'auto';
        this.musicTracks['menu-theme'].loop = true;
        this.musicTracks['menu-theme'].volume = this.musicVolume * this.masterVolume;
        
        // Handle loading events
        this.musicTracks['menu-theme'].addEventListener('canplaythrough', () => {
            console.log('Menu theme loaded successfully');
        });
        
        this.musicTracks['menu-theme'].addEventListener('error', (e) => {
            console.warn('Failed to load menu theme:', e);
        });
        
        // Preload combat theme music
        this.musicTracks['combat-theme'] = new Audio('assets/audio/music/combat-theme.wav');
        this.musicTracks['combat-theme'].preload = 'auto';
        this.musicTracks['combat-theme'].loop = false; // We'll handle the 3-loop manually
        this.musicTracks['combat-theme'].volume = this.musicVolume * this.masterVolume;
        
        // Handle loading events
        this.musicTracks['combat-theme'].addEventListener('canplaythrough', () => {
            console.log('Combat theme loaded successfully');
        });
        
        this.musicTracks['combat-theme'].addEventListener('error', (e) => {
            console.warn('Failed to load combat theme:', e);
        });
        
        // Handle combat music looping (3 times total)
        this.musicTracks['combat-theme'].addEventListener('ended', () => {
            if (this.currentMusic === 'combat-theme' && this.combatLoopCount < this.combatMaxLoops) {
                this.combatLoopCount++;
                console.log(`Combat music loop ${this.combatLoopCount}/${this.combatMaxLoops}`);
                this.musicTracks['combat-theme'].currentTime = 0;
                this.musicTracks['combat-theme'].play().catch(console.warn);
            } else if (this.currentMusic === 'combat-theme') {
                console.log('Combat music finished all 3 loops');
                this.currentMusic = null;
                this.musicAudio = null;
            }
        });
        
        // Preload game over theme music
        this.musicTracks['gameover-theme'] = new Audio('assets/audio/music/gameover-theme.wav');
        this.musicTracks['gameover-theme'].preload = 'auto';
        this.musicTracks['gameover-theme'].loop = false; // Game over music shouldn't loop
        this.musicTracks['gameover-theme'].volume = this.musicVolume * this.masterVolume;
        
        // Handle loading events
        this.musicTracks['gameover-theme'].addEventListener('canplaythrough', () => {
            console.log('Game over theme loaded successfully');
        });
        
        this.musicTracks['gameover-theme'].addEventListener('error', (e) => {
            console.warn('Failed to load game over theme:', e);
        });
        
        // Preload enemy planet mission music
        this.musicTracks['enemyPlanetMusic'] = new Audio('assets/audio/music/enemyPlanetMusic.wav');
        this.musicTracks['enemyPlanetMusic'].preload = 'auto';
        this.musicTracks['enemyPlanetMusic'].loop = true; // Enemy planet music should loop
        this.musicTracks['enemyPlanetMusic'].volume = this.musicVolume * this.masterVolume;
        
        // Handle loading events
        this.musicTracks['enemyPlanetMusic'].addEventListener('canplaythrough', () => {
            console.log('Enemy planet music loaded successfully');
        });
        
        this.musicTracks['enemyPlanetMusic'].addEventListener('error', (e) => {
            console.warn('Failed to load enemy planet music:', e);
        });
        
        // Preload victory theme music
        this.musicTracks['victory-theme'] = new Audio('assets/audio/music/victory-theme.wav');
        this.musicTracks['victory-theme'].preload = 'auto';
        this.musicTracks['victory-theme'].loop = false; // Victory music plays once
        this.musicTracks['victory-theme'].volume = this.musicVolume * this.masterVolume;
        
        // Handle loading events
        this.musicTracks['victory-theme'].addEventListener('canplaythrough', () => {
            console.log('Victory theme loaded successfully');
        });
        
        this.musicTracks['victory-theme'].addEventListener('error', (e) => {
            console.warn('Failed to load victory theme:', e);
        });
        
        // Preload asteroid field music
        this.musicTracks['AsteroidField'] = new Audio('assets/audio/music/AsteroidField.wav');
        this.musicTracks['AsteroidField'].preload = 'auto';
        this.musicTracks['AsteroidField'].loop = true; // Asteroid field music should loop
        this.musicTracks['AsteroidField'].volume = this.musicVolume * this.masterVolume;
        
        // Handle loading events
        this.musicTracks['AsteroidField'].addEventListener('canplaythrough', () => {
            console.log('Asteroid field music loaded successfully');
        });
        
        this.musicTracks['AsteroidField'].addEventListener('error', (e) => {
            console.warn('Failed to load asteroid field music:', e);
        });
    }
    
    preloadSfx() {
        // Preload alert sound effect
        this.sounds['alert'] = new Audio('assets/audio/sfx/alert.wav');
        this.sounds['alert'].preload = 'auto';
        this.sounds['alert'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['alert'].addEventListener('canplaythrough', () => {
            console.log('Alert sound loaded successfully');
        });
        
        this.sounds['alert'].addEventListener('error', (e) => {
            console.warn('Failed to load alert sound:', e);
        });
        
        // Preload laser sound effect
        this.sounds['laser'] = new Audio('assets/audio/sfx/laser.mp3');
        this.sounds['laser'].preload = 'auto';
        this.sounds['laser'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['laser'].addEventListener('canplaythrough', () => {
            console.log('Laser sound loaded successfully');
        });
        
        this.sounds['laser'].addEventListener('error', (e) => {
            console.warn('Failed to load laser sound:', e);
        });
        
        // Preload explosion sound effect for combat mode
        this.sounds['explosionCombatMode'] = new Audio('assets/audio/sfx/explosionCombatMode.wav');
        this.sounds['explosionCombatMode'].preload = 'auto';
        this.sounds['explosionCombatMode'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['explosionCombatMode'].addEventListener('canplaythrough', () => {
            console.log('Combat explosion sound loaded successfully');
        });
        
        this.sounds['explosionCombatMode'].addEventListener('error', (e) => {
            console.warn('Failed to load combat explosion sound:', e);
        });
        
        // Preload damage taken sound effect
        this.sounds['damageTaken'] = new Audio('assets/audio/sfx/damageTaken.wav');
        this.sounds['damageTaken'].preload = 'auto';
        this.sounds['damageTaken'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['damageTaken'].addEventListener('canplaythrough', () => {
            console.log('Damage taken sound loaded successfully');
        });
        
        this.sounds['damageTaken'].addEventListener('error', (e) => {
            console.warn('Failed to load damage taken sound:', e);
        });
        
        // Preload basic enemy laser sound effect
        this.sounds['basicEnemyLaser'] = new Audio('assets/audio/sfx/basicEnemyLaser.wav');
        this.sounds['basicEnemyLaser'].preload = 'auto';
        this.sounds['basicEnemyLaser'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['basicEnemyLaser'].addEventListener('canplaythrough', () => {
            console.log('Basic enemy laser sound loaded successfully');
        });
        
        this.sounds['basicEnemyLaser'].addEventListener('error', (e) => {
            console.warn('Failed to load basic enemy laser sound:', e);
        });
        
        // Preload fast enemy laser sound effect
        this.sounds['fastEnemyLaser'] = new Audio('assets/audio/sfx/fastEnemyLaser.wav');
        this.sounds['fastEnemyLaser'].preload = 'auto';
        this.sounds['fastEnemyLaser'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['fastEnemyLaser'].addEventListener('canplaythrough', () => {
            console.log('Fast enemy laser sound loaded successfully');
        });
        
        this.sounds['fastEnemyLaser'].addEventListener('error', (e) => {
            console.warn('Failed to load fast enemy laser sound:', e);
        });
        
        // Preload elite enemy laser sound effect
        this.sounds['eliteEnemyLaser'] = new Audio('assets/audio/sfx/eliteEnemyLaser.wav');
        this.sounds['eliteEnemyLaser'].preload = 'auto';
        this.sounds['eliteEnemyLaser'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['eliteEnemyLaser'].addEventListener('canplaythrough', () => {
            console.log('Elite enemy laser sound loaded successfully');
        });
        
        this.sounds['eliteEnemyLaser'].addEventListener('error', (e) => {
            console.warn('Failed to load elite enemy laser sound:', e);
        });
        
        // Preload elite enemy hit sound effect
        this.sounds['eliteEnemyHit'] = new Audio('assets/audio/sfx/eliteEnemyHit.wav');
        this.sounds['eliteEnemyHit'].preload = 'auto';
        this.sounds['eliteEnemyHit'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['eliteEnemyHit'].addEventListener('canplaythrough', () => {
            console.log('Elite enemy hit sound loaded successfully');
        });
        
        this.sounds['eliteEnemyHit'].addEventListener('error', (e) => {
            console.warn('Failed to load elite enemy hit sound:', e);
        });
        
        // Preload entering enemy orbit sound effect
        this.sounds['enteringEnemyOrbit'] = new Audio('assets/audio/sfx/enteringEnemyOrbit.wav');
        this.sounds['enteringEnemyOrbit'].preload = 'auto';
        this.sounds['enteringEnemyOrbit'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['enteringEnemyOrbit'].addEventListener('canplaythrough', () => {
            console.log('Entering enemy orbit sound loaded successfully');
        });
        
        this.sounds['enteringEnemyOrbit'].addEventListener('error', (e) => {
            console.warn('Failed to load entering enemy orbit sound:', e);
        });
        
        // Preload entering ally orbit sound effect
        this.sounds['enteringAllyOrbit'] = new Audio('assets/audio/sfx/enteringAllyOrbit.wav');
        this.sounds['enteringAllyOrbit'].preload = 'auto';
        this.sounds['enteringAllyOrbit'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['enteringAllyOrbit'].addEventListener('canplaythrough', () => {
            console.log('Entering ally orbit sound loaded successfully');
        });
        
        this.sounds['enteringAllyOrbit'].addEventListener('error', (e) => {
            console.warn('Failed to load entering ally orbit sound:', e);
        });
        
        // Preload select map sector sound effect
        this.sounds['selectMapSector'] = new Audio('assets/audio/sfx/selectMapSector.wav');
        this.sounds['selectMapSector'].preload = 'auto';
        this.sounds['selectMapSector'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['selectMapSector'].addEventListener('canplaythrough', () => {
            console.log('Select map sector sound loaded successfully');
        });
        
        this.sounds['selectMapSector'].addEventListener('error', (e) => {
            console.warn('Failed to load select map sector sound:', e);
        });
        
        // Preload obstacle spawn sound effect
        this.sounds['obstacleSpawn'] = new Audio('assets/audio/sfx/obsticleSpawn.wav');
        this.sounds['obstacleSpawn'].preload = 'auto';
        this.sounds['obstacleSpawn'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['obstacleSpawn'].addEventListener('canplaythrough', () => {
            console.log('Obstacle spawn sound loaded successfully');
        });
        
        this.sounds['obstacleSpawn'].addEventListener('error', (e) => {
            console.warn('Failed to load obstacle spawn sound:', e);
        });
        
        // Preload enemy planet player shoot sound effect
        this.sounds['enemyPlanetPlayerShoot'] = new Audio('assets/audio/sfx/enemyPlanetPlayerShoot.wav');
        this.sounds['enemyPlanetPlayerShoot'].preload = 'auto';
        this.sounds['enemyPlanetPlayerShoot'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['enemyPlanetPlayerShoot'].addEventListener('canplaythrough', () => {
            console.log('Enemy planet player shoot sound loaded successfully');
        });
        
        this.sounds['enemyPlanetPlayerShoot'].addEventListener('error', (e) => {
            console.warn('Failed to load enemy planet player shoot sound:', e);
        });
        
        // Preload fireworks sound effect
        this.sounds['fireworks'] = new Audio('assets/audio/sfx/fireworks.wav');
        this.sounds['fireworks'].preload = 'auto';
        this.sounds['fireworks'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['fireworks'].addEventListener('canplaythrough', () => {
            console.log('Fireworks sound loaded successfully');
        });
        
        this.sounds['fireworks'].addEventListener('error', (e) => {
            console.warn('Failed to load fireworks sound:', e);
        });
        
        // Preload enemy planet incoming rear missile warning sound
        this.sounds['enemyPlanetIncomingRearMissle'] = new Audio('assets/audio/sfx/enemyPlanetIncomingRearMissle.wav');
        this.sounds['enemyPlanetIncomingRearMissle'].preload = 'auto';
        this.sounds['enemyPlanetIncomingRearMissle'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['enemyPlanetIncomingRearMissle'].addEventListener('canplaythrough', () => {
            console.log('Enemy planet incoming rear missile sound loaded successfully');
        });
        
        this.sounds['enemyPlanetIncomingRearMissle'].addEventListener('error', (e) => {
            console.warn('Failed to load enemy planet incoming rear missile sound:', e);
        });
        
        // Preload enemy planet player hit sound
        this.sounds['enemyPlanetPlayerHit'] = new Audio('assets/audio/sfx/enemyPlanetPlayerHit.wav');
        this.sounds['enemyPlanetPlayerHit'].preload = 'auto';
        this.sounds['enemyPlanetPlayerHit'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['enemyPlanetPlayerHit'].addEventListener('canplaythrough', () => {
            console.log('Enemy planet player hit sound loaded successfully');
        });
        
        this.sounds['enemyPlanetPlayerHit'].addEventListener('error', (e) => {
            console.warn('Failed to load enemy planet player hit sound:', e);
        });
        
        // Preload warning asteroids incoming sound effect
        this.sounds['warningAsteroidsIncoming'] = new Audio('assets/audio/sfx/warningAsteroidsIncoming.wav');
        this.sounds['warningAsteroidsIncoming'].preload = 'auto';
        this.sounds['warningAsteroidsIncoming'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['warningAsteroidsIncoming'].addEventListener('canplaythrough', () => {
            console.log('Warning asteroids incoming sound loaded successfully');
        });
        
        this.sounds['warningAsteroidsIncoming'].addEventListener('error', (e) => {
            console.warn('Failed to load warning asteroids incoming sound:', e);
        });
        
        // Preload player shoot asteroid sound effect
        this.sounds['playerShootAstroid'] = new Audio('assets/audio/sfx/playerShootAstroid.wav');
        this.sounds['playerShootAstroid'].preload = 'auto';
        this.sounds['playerShootAstroid'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['playerShootAstroid'].addEventListener('canplaythrough', () => {
            console.log('Player shoot asteroid sound loaded successfully');
        });
        
        this.sounds['playerShootAstroid'].addEventListener('error', (e) => {
            console.warn('Failed to load player shoot asteroid sound:', e);
        });
        
        // Preload asteroid explosion sound effect
        this.sounds['asteroidExplosion'] = new Audio('assets/audio/sfx/asteroidExplosion.wav');
        this.sounds['asteroidExplosion'].preload = 'auto';
        this.sounds['asteroidExplosion'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['asteroidExplosion'].addEventListener('canplaythrough', () => {
            console.log('Asteroid explosion sound loaded successfully');
        });
        
        this.sounds['asteroidExplosion'].addEventListener('error', (e) => {
            console.warn('Failed to load asteroid explosion sound:', e);
        });
        
        // Preload asteroid spawn sound effect
        this.sounds['asteroidSpawn'] = new Audio('assets/audio/sfx/asteroidSpawn.wav');
        this.sounds['asteroidSpawn'].preload = 'auto';
        this.sounds['asteroidSpawn'].volume = this.sfxVolume * this.masterVolume;
        
        // Handle loading events
        this.sounds['asteroidSpawn'].addEventListener('canplaythrough', () => {
            console.log('Asteroid spawn sound loaded successfully');
        });
        
        this.sounds['asteroidSpawn'].addEventListener('error', (e) => {
            console.warn('Failed to load asteroid spawn sound:', e);
        });
    }
    
    playMusic(musicId) {
        if (!this.musicEnabled || !this.isInitialized) return;
        
        console.log(`Attempting to play music: ${musicId}`);
        
        // Stop current music if playing
        this.stopMusic();
        
        // Check if music track exists
        if (this.musicTracks[musicId]) {
            this.currentMusic = musicId;
            this.musicAudio = this.musicTracks[musicId];
            
            // Reset combat loop counter when starting combat music
            if (musicId === 'combat-theme') {
                this.combatLoopCount = 1; // Start at 1 since the first play counts as loop 1
                console.log('Starting combat music - loop 1/3');
            }
            
            // Set volume
            this.musicAudio.volume = this.musicVolume * this.masterVolume;
            
            // Play the music
            const playPromise = this.musicAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`Music playing: ${musicId}`);
                }).catch((error) => {
                    console.warn(`Failed to play music ${musicId}:`, error);
                    // Browser might require user interaction first
                    this.handleAutoplayRestriction(musicId);
                });
            }
        } else {
            console.warn(`Music track not found: ${musicId}`);
        }
    }
    
    handleAutoplayRestriction(musicId) {
        console.log('Autoplay restricted - music will start after user interaction');
        
        // Don't set up duplicate listeners if they already exist
        if (this.autoplayListenersActive) return;
        this.autoplayListenersActive = true;
        
        // Create a one-time event listener for user interaction
        const startMusic = () => {
            console.log('User interaction detected, starting music...');
            this.autoplayListenersActive = false;
            
            // Try to play the music again
            if (this.musicTracks[musicId]) {
                this.currentMusic = musicId;
                this.musicAudio = this.musicTracks[musicId];
                this.musicAudio.volume = this.musicVolume * this.masterVolume;
                
                const playPromise = this.musicAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log(`Music now playing: ${musicId}`);
                    }).catch((error) => {
                        console.warn(`Still failed to play music after interaction:`, error);
                    });
                }
            }
            
            // Clean up listeners
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
            document.removeEventListener('touchstart', startMusic);
        };
        
        document.addEventListener('click', startMusic, { once: true });
        document.addEventListener('keydown', startMusic, { once: true });
        document.addEventListener('touchstart', startMusic, { once: true }); // For mobile
    }
    
    stopMusic() {
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
            console.log(`Stopped music: ${this.currentMusic}`);
            this.currentMusic = null;
            this.musicAudio = null;
        }
    }
    
    stopSfx(soundId) {
        if (this.sounds[soundId]) {
            try {
                this.sounds[soundId].pause();
                this.sounds[soundId].currentTime = 0;
                console.log(`Stopped SFX: ${soundId}`);
            } catch (error) {
                console.warn(`Error stopping SFX ${soundId}:`, error);
            }
        }
    }
    
    playSfx(soundId) {
        if (!this.sfxEnabled || !this.isInitialized) return;
        
        console.log(`Playing SFX: ${soundId}`);
        
        // Check if we have a preloaded sound file
        if (this.sounds[soundId]) {
            try {
                // Reset and play the sound
                this.sounds[soundId].currentTime = 0;
                this.sounds[soundId].play()
                    .then(() => {
                        console.log(`Successfully played SFX: ${soundId}`);
                    })
                    .catch(error => {
                        console.warn(`Failed to play SFX ${soundId}:`, error);
                        // Fallback to beep sound
                        this.createBeepSound(soundId);
                    });
            } catch (error) {
                console.warn(`Error playing SFX ${soundId}:`, error);
                this.createBeepSound(soundId);
            }
        } else {
            // Fallback to programmatic beep for sounds we don't have files for
            this.createBeepSound(soundId);
        }
    }
    
    createBeepSound(soundId) {
        try {
            // Create a simple beep using Web Audio API or fallback
            if (window.AudioContext || window.webkitAudioContext) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Different frequencies for different sounds
                if (soundId === 'menu-select') {
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                } else if (soundId === 'menu-confirm') {
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                }
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (error) {
            console.warn('Could not create beep sound:', error);
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update current playing music volume
        if (this.musicAudio) {
            this.musicAudio.volume = this.musicVolume * this.masterVolume;
        }
        
        // Update all preloaded music volumes
        Object.values(this.musicTracks).forEach(audio => {
            audio.volume = this.musicVolume * this.masterVolume;
        });
        
        console.log(`Music volume set to: ${this.musicVolume}`);
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`SFX volume set to: ${this.sfxVolume}`);
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Update current music volume
        if (this.musicAudio) {
            this.musicAudio.volume = this.musicVolume * this.masterVolume;
        }
        
        // Update all preloaded music volumes
        Object.values(this.musicTracks).forEach(audio => {
            audio.volume = this.musicVolume * this.masterVolume;
        });
        
        console.log(`Master volume set to: ${this.masterVolume}`);
    }
    
    enableMusic(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
        console.log(`Music ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    enableSfx(enabled) {
        this.sfxEnabled = enabled;
        console.log(`SFX ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    // Check if music is currently playing
    isMusicPlaying() {
        return this.musicAudio && !this.musicAudio.paused;
    }
    
    // Get current music info
    getCurrentMusic() {
        return this.currentMusic;
    }
}
