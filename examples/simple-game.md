# Simple Game Example

## Overview

The Simple Game example demonstrates basic gameplay mechanics implemented with the Shade Engine. It serves as a reference implementation showing how to structure a complete game using the engine's core systems.

## Game Description

This sample game is a 3D collection challenge where:

1. Players control a character to navigate a simple 3D environment
2. The goal is to collect items while avoiding obstacles
3. Collecting all items advances to the next level with increased difficulty
4. Colliding with obstacles costs lives
5. The game ends when all lives are depleted

## Architecture

The game leverages Shade Engine's state-based game architecture:

- **Menu State**: Entry point with title screen and navigation options
- **Gameplay State**: Main gameplay loop with player control, collision detection, and scoring
- **Additional States**: Options and credits (placeholders for expansion)

## Engine Components Used

The game demonstrates usage of these engine features:

- **Rendering**: Textured 3D objects with standard and cubemap materials
- **Camera System**: Third-person camera with orbit controls
- **Physics**: Basic gravity, velocity, and collision detection
- **Input Handling**: Keyboard and mouse interaction with configurable bindings
- **Audio**: Background music, sound effects with positional audio
- **UI**: In-game HUD and menu interfaces
- **State Management**: Game state transitions and persistence

## Required Assets

To run the simple game, you need to provide these assets:

### Textures

Located in `assets/textures/`:

- **test.png**: Generic test texture for development
- **floor.png**: Ground texture for the level floor
- **player.png**: Texture for the player character
- **obstacle.png**: Texture for obstacles
- **collectible.png**: Texture for collectible items
- **menu_background.png**: Background image for menu screen

### Audio

Located in `assets/sounds/`:

- **hit.mp3**: Sound played when colliding with obstacles
- **collect.mp3**: Sound played when collecting an item
- **gameOver.mp3**: Sound played at game over
- **levelComplete.mp3**: Sound played when completing a level

### Music

Located in `assets/music/`:

- **menu.mp3**: Background music for the menu
- **gameplay.mp3**: Background music during gameplay

## Creating Assets

If you don't have these assets, you can:

1. **Create your own**: Using any image editing or sound creation tool
2. **Use placeholders**: Simple colored textures and basic sound effects
3. **Use free assets**: From sources like [OpenGameArt.org](https://opengameart.org/) (ensure proper licenses)

### Asset Requirements

- **Textures**: PNG format, power-of-two dimensions recommended (e.g., 256×256, 512×512)
- **Audio**: MP3 format, short sounds for effects, longer tracks for music
- **Naming**: Files must match the names listed above or require code changes

## Running the Example

1. Ensure all assets are placed in the appropriate directories
2. Open `examples/simple-game.html` in a WebGPU-capable browser
3. Controls:
   - WASD: Move player
   - Space: Jump
   - ESC: Pause game
   - Mouse: Camera control

## Common Issues

- **Missing assets**: Check file paths and names match what the code expects
- **WebGPU support**: Ensure you're using a browser that supports WebGPU
- **Performance**: If the game runs slowly, try reducing resolution or number of objects

## Extending the Example

This example provides a foundation you can build upon:
- Add new level designs
- Create more enemy types
- Implement additional game mechanics
- Enhance visual effects
- Add more sophisticated audio
