# 🚀 Driller Joe In Space - HTML5 Game

**A retro-inspired space adventure featuring first-person combat, strategic star map navigation, and asteroid storm survival!**

---

## 💝 Made with Love

This game was created with love for **Driller Joe**, for all the high scores he let me chase. Every line of code, every pixel, and every sound effect was crafted as a tribute to the joy of gaming and the pursuit of that perfect run. Thank you for inspiring the chase for excellence, one high score at a time.

*"In space, no one can hear you drill... but they can hear your victory!"*

---

## 🎮 Game Features

- **First-Person Combat**: Engage enemies with twin laser cannons and dynamic crosshair targeting
- **Strategic Star Map**: Navigate an 8x8 grid universe with fog-of-war exploration
- **Asteroid Storm Survival**: Classic asteroids-style gameplay with health-based damage
- **Planetary Missions**: Land on ally and enemy planets for unique challenges
- **Victory Conditions**: Complete military missions or supply runs to achieve victory
- **Retro Aesthetics**: Classic arcade-style graphics and sound design

---

## 🎯 How to Play

### Controls
- **Arrow Keys**: Navigate and move crosshair
- **Space**: Fire weapons / Confirm actions

### Game Modes
1. **Combat Mode**: First-person space combat with twin laser cannons
2. **Star Map Mode**: Strategic navigation across the galaxy
3. **Asteroid Storm**: Survival challenge in dense asteroid fields
4. **Planetary Missions**: Surface operations on various worlds

### Victory Conditions
- **Military Route**: Destroy all 3 enemy planets
- **Supply Route**: Successfully supply all 3 ally planets

---

## 🛠️ Project Structure

```
StarRaiders/
├── index.html                 # Main game entry point
├── README.md                  # This file
├── package.json              # Project metadata
├── src/                      # Source code
│   ├── core/                 # Core game engine
│   │   ├── Game.js           # Main game controller
│   │   ├── GameState.js      # Game state management
│   │   └── Canvas.js         # Canvas utilities
│   ├── systems/              # Game systems
│   │   ├── InputSystem.js    # Input handling
│   │   ├── AudioSystem.js    # Audio management
│   │   └── RenderSystem.js   # Rendering utilities
│   ├── game-modes/           # Different game modes
│   │   ├── MenuMode.js       # Main menu
│   │   ├── CombatMode.js     # First-person combat
│   │   ├── StarMapMode.js    # Star map navigation
│   │   ├── AsteroidStormMode.js # Asteroid survival
│   │   ├── VictoryMode.js    # Victory celebration
│   │   └── GameOverMode.js   # Game over screen
│   ├── entities/             # Game entities
│   │   ├── Enemy.js          # Enemy ships
│   │   └── enemyRewrite.js   # Enhanced enemy system
│   ├── ui/                   # UI components
│   │   └── Menu.js           # Menu interfaces
│   └── utils/                # Utility functions
├── assets/                   # Game assets
│   ├── audio/                # Sound assets
│   │   ├── music/            # Background music tracks
│   │   └── sfx/              # Sound effects
│   └── images/               # Graphics (placeholder)
├── tests/                    # Test files
```

---


## 🎵 Technology Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Audio**: Web Audio API with custom sound management
- **Graphics**: 2D Canvas rendering with retro aesthetics
- **Architecture**: Modular component-based game engine
- **Input**: Multi-input system supporting keyboard and mouse
- **State Management**: Centralized game state with persistence

---

## 🏆 Development Philosophy

This project embodies the spirit of classic arcade gaming while leveraging modern web technologies. Every feature was designed with the player experience in mind, from the satisfying "thunk" of laser cannons to the strategic depth of star map navigation.

Built with vanilla JavaScript to maintain simplicity and performance, this game proves that great gameplay doesn't require complex frameworks - just passion, creativity, and attention to detail.

---

## 🌟 Special Thanks

To Driller Joe - thank you for showing us that the real treasure isn't the high scores we made along the way, but the fun we had chasing them. This one's for you, space cowboy! 🤠

*Game developed with love, coffee, and an unhealthy obsession with retro space games.*

---

**May your drills be sharp and your scores be high!** ⭐
