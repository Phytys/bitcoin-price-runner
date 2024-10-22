// static/js/main.js

import GameScene from './game/scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE, // Automatically resize the game canvas
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game canvas
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false,
        },
    },
};

let game;

try {
    game = new Phaser.Game(config);
    window.game = game; // Expose game variable to global scope
} catch (error) {
    console.error('Error initializing game:', error);
    showErrorMessage('Failed to initialize the game. Please refresh the page or try again later.');
}

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, lineno, colno);
    console.error('Error object:', error);
    showErrorMessage('An unexpected error occurred. The game will attempt to restart.');

    if (game && game.scene) {
        const currentScene = game.scene.getScene('GameScene');
        if (currentScene) {
            currentScene.handleError(error);
        } else {
            game.scene.add('GameScene', GameScene, true);
        }
    }

    return true;
};

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '10px';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

console.log('Main script loaded successfully');

// Orientation detection code
function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
        // Portrait mode
        const warningDiv = document.getElementById('orientation-warning');
        if (warningDiv) {
            warningDiv.style.display = 'flex';
        }
        // Optionally, pause the game if it's running
        if (game && game.scene) {
            const currentScene = game.scene.getScene('GameScene');
            if (currentScene && !currentScene.scene.isPaused()) {
                currentScene.scene.pause();
            }
        }
    } else {
        // Landscape mode
        const warningDiv = document.getElementById('orientation-warning');
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
        // Optionally, resume the game if it was paused
        if (game && game.scene) {
            const currentScene = game.scene.getScene('GameScene');
            if (currentScene && currentScene.scene.isPaused()) {
                currentScene.scene.resume();
            }
        }
    }
}

// Ensure the DOM is loaded before accessing elements
window.addEventListener('load', function() {
    // Add event listeners for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Perform the initial check
    checkOrientation();
});
