// static/js/game/config.js

// Phaser Game Configuration
export const phaserConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    }
};

// Game-Specific Configuration
export const gameConfig = {
    priceLineColor: '#00FFFF', // Cyberpunk cyan
    // Add other configuration parameters here as needed
    referenceWidth: 1280, // Original design width
    referenceHeight: 720,  // Original design height
};

// Optional: Default export containing both configurations
export default {
    phaserConfig,
    gameConfig
};
