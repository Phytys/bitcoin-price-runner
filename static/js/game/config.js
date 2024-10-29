// static/js/game/config.js

// Phaser Game Configuration
export const phaserConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: {
            lockOrientation: 'landscape'
        },
        fullscreenTarget: 'game-container'
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
    // Display
    priceLineColor: '#00FFFF',
    referenceWidth: 1280,
    referenceHeight: 720,
    tuningParameter: 1.3,
    
    // Game settings
    baseScrollSpeed: 18,
    jumpPenalty: 100,
    initialLives: 3,
    
    // UI settings
    fontSize: 18,
    basePadding: 16,
    
    // Scoring
    enemyPoints: {
        enemy: 700,
        enemy_2: 2500
    }
};

export default {
    phaserConfig,
    gameConfig
};
