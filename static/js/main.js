// static/js/main.js

import GameScene from './game/scenes/GameScene.js';
import { phaserConfig } from './game/config.js';

let game;

const initializeGame = () => {
    const warningDiv = document.getElementById('orientation-warning');
    const gameControls = document.getElementById('game-controls');
    const topControls = document.getElementById('top-controls');
    if (!warningDiv || !gameControls || !topControls) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    warningDiv.style.display = isLandscape ? 'none' : 'flex';
    gameControls.style.display = isLandscape ? 'flex' : 'none';
    topControls.style.display = isLandscape ? 'flex' : 'none';

    if (!isLandscape) {
        if (game) {
            game.destroy(true);
            game = null;
        }
        return;
    }

    try {
        if (game) {
            game.destroy(true);
            game = null;
        }
        
        phaserConfig.width = window.innerWidth;
        phaserConfig.height = window.innerHeight;
        phaserConfig.scene = GameScene;
        
        game = new Phaser.Game(phaserConfig);
        window.game = game;
    } catch (error) {
        handleError(error, 'Failed to initialize the game. Please refresh the page.');
    }
};

window.addEventListener('resize', initializeGame);
initializeGame();

window.onerror = function(message, source, lineno, colno, error) {
    handleError(error);
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
    setTimeout(() => errorDiv.remove(), 5000);
}

console.log('Main script loaded successfully');
