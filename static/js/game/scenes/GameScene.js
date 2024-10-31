// static/js/game/scenes/GameScene.js

import Player from '../entities/Player.js';
import Terrain from '../entities/Terrain.js';
import Obstacles from '../entities/Obstacles.js';
import Events from '../entities/Events.js';
import Enemies from '../entities/Enemies.js';
import Bullets from '../entities/Bullets.js';
import UIManager from '../managers/UIManager.js';
import InputHandler from '../managers/InputHandler.js';
import DataManager from '../managers/DataManager.js';
import BackgroundManager from '../managers/BackgroundManager.js';
import PhysicsManager from '../managers/PhysicsManager.js';
import { gameConfig } from '../config.js';
import Enemies2 from '../entities/Enemies2.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        // Initialize properties using gameConfig
        this.REFERENCE_WIDTH = gameConfig.referenceWidth;
        this.REFERENCE_HEIGHT = gameConfig.referenceHeight;
        this.tuningParameter = gameConfig.tuningParameter;
        this.baseScrollSpeed = gameConfig.baseScrollSpeed;
        this.jumpPenalty = gameConfig.jumpPenalty;
        this.initialLives = gameConfig.initialLives;
        this.enemyPoints = gameConfig.enemyPoints;
        
        // Initialize other properties
        this.terrain = null;
        this.obstacles = null;
        this.gameEvents = null;
        this.enemies = null;
        this.bullets = null;
        this.backgroundManager = null;
        this.physicsManager = null;
        this.terrainOffset = 0;
        this.scrollSpeed = this.baseScrollSpeed * 1.0;
        this.gameOver = false;
        this.gameCompleted = false;
        this.visibleDataPoints = 60;
        this.isGameRunning = false;
        this.player = null;
        this.score = 0;
        this.lastPrice = 0;
        this.jumpCount = 0;
        this.enemiesHitCount = 0;
        this.obstacleHeightOffsetFactor = -0.03;
        this.eventHeightOffsetFactor = 0.15;
        this.enemyHeightOffsetFactor = -0.02;
        this.uiManager = null;
        this.inputHandler = null;
        this.dataManager = null;
        this.obstacleSpritesGroup = null;
        this.eventSpritesGroup = null;
        this.enemySpritesGroup = null;
        this.spriteScale = 1.0;
        this.lastUpdateTime = 0;
        this.scoreMultiplier = 1.0;

        console.log('GameScene constructor called');
    }

    preload() {
        if (this.uiManager) {
            this.load.on('progress', (value) => {
                this.uiManager.updateLoadingProgress(value);
            });

            this.load.on('complete', () => {
                this.uiManager.hideLoadingScreen();
            });
        }

        console.log('GameScene preload started');
        try {
            // Load game assets
            this.load.image('player', 'static/assets/images/player.png');
            this.load.image('obstacle', 'static/assets/images/obstacle.png');
            this.load.image('btc_event_positive', 'static/assets/images/btc_event_positive.png');
            this.load.image('btc_event_negative', 'static/assets/images/btc_event_negative.png');
            this.load.image('enemy', 'static/assets/images/enemy.png');
            this.load.image('bitcoin_pill', 'static/assets/images/bitcoin_pill.png');
            this.load.image('background', 'static/assets/images/background.png');
            this.load.image('particle', 'static/assets/images/particle.png');
            this.load.image('particle_pill', 'static/assets/images/particle_pill.png');
            this.load.image('enemy_2', 'static/assets/images/enemy_2.png');

            // Load sound effects
            this.load.audio('bullet_fire', 'static/assets/sounds/shoot.mp3');
            this.load.audio('enemy1_impact', 'static/assets/sounds/enemy1_impact.mp3');
            this.load.audio('enemy2_impact', 'static/assets/sounds/enemy2_impact.mp3');
            this.load.audio('obstacle_impact', 'static/assets/sounds/obstacle_impact.mp3');

            // Load sound effects for Bitcoin events
            this.load.audio('btc_event_positive', 'static/assets/sounds/btc_event_positive.mp3');
            this.load.audio('btc_event_negative', 'static/assets/sounds/btc_event_negative.mp3');

            console.log('Assets loaded');
        } catch (error) {
            console.error('Error in preload:', error);
        }
    }

    create() {
        console.log('GameScene create called');
        try {
            // Initialize managers
            this.backgroundManager = new BackgroundManager(this);
            this.physicsManager = new PhysicsManager(this);
            this.uiManager = new UIManager(this, gameConfig.priceLineColor);
            this.inputHandler = new InputHandler(this);
            this.dataManager = new DataManager(this);

            // Calculate initial scaling
            this.calculateScale();

            // Show score info screen
            this.uiManager.showScoreInfo(() => {
                this.startGame();
            });

            const centerX = this.sys.game.config.width / 2;

            // Initialize Player
            this.player = new Player(this, centerX, 300);
            this.player.lives = this.initialLives;

            // Initialize Bullets manager
            this.bullets = new Bullets(this);

            // Fetch game data
            this.loadGameData();

            // Handle screen resizing
            this.scale.on('resize', this.resize, this);
            this.resize();

            // Initialize sprite groups
            this.obstacleSpritesGroup = this.physics.add.group();
            this.eventSpritesGroup = this.physics.add.group();
            this.enemySpritesGroup = this.physics.add.group();

            // Set up collision detection via PhysicsManager
            this.physicsManager.handleCollisions(
                this.player.sprite,
                this.obstacleSpritesGroup,
                this.handleObstacleCollision.bind(this)
            );

            // Set up overlap detection with events
            this.physicsManager.handleEventOverlap(
                this.player.sprite,
                this.eventSpritesGroup,
                this.handleEventOverlap.bind(this)
            );

            // Handle WebGL context loss and restoration
            this.game.renderer.on('contextlost', (event) => {
                event.preventDefault();
                console.warn('WebGL context lost.');
                this.handleContextLoss();
            });

            this.game.renderer.on('contextrestored', () => {
                console.log('WebGL context restored.');
                this.handleContextRestored();
            });

            this.uiManager.createLivesDisplay(this.initialLives);

            // Initialize Enemies2
            this.enemies2 = new Enemies2(this);

            // Set up collision detection for Enemies2
            this.physics.add.collider(
                this.bullets.bullets,
                this.enemies2.enemies,
                this.handleBulletEnemyCollision,
                null,
                this
            );
        } catch (error) {
            console.error('Error in create:', error);
            this.handleError(error);
        }
    }

    calculateScale() {
        const currentWidth = this.sys.game.config.width;
        const currentHeight = this.sys.game.config.height;

        const scaleX = currentWidth / this.REFERENCE_WIDTH;
        const scaleY = currentHeight / this.REFERENCE_HEIGHT;

        this.spriteScale = Math.min(scaleX, scaleY) * this.tuningParameter;

        console.log(`Calculated spriteScale: ${this.spriteScale}`);
    }

    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Update camera and recalculate scale
        this.cameras.main.setViewport(0, 0, width, height);
        this.calculateScale();

        // Update background first
        if (this.backgroundManager) {
            this.backgroundManager.resize();
        }

        // Update UI elements
        if (this.uiManager) {
            this.uiManager.resizeUI();
        }

        // Calculate new positions based on screen size
        const centerX = width / 2;
        const groundY = height - (100 * this.spriteScale);

        // Update player position and scale
        if (this.player) {
            this.player.sprite.setScale(this.spriteScale);
            this.player.setPosition(centerX, groundY);
        }

        // Update all game entities with new scale and positions
        [this.obstacles, this.gameEvents, this.enemies, this.bullets, this.enemies2].forEach(entity => {
            if (entity && typeof entity.updateScale === 'function') {
                entity.updateScale(this.spriteScale);
            }
        });

        // Redraw terrain with new scale
        if (this.terrain) {
            this.terrain.updateScale(this.spriteScale);
            this.terrain.draw(this.terrainOffset);
        }
    }

    update(time, delta) {
        try {
            if (
                this.isGameRunning &&
                this.dataManager.terrainData &&
                this.dataManager.terrainData.length > 0 &&
                !this.gameOver &&
                !this.gameCompleted &&
                this.terrain
            ) {
                // Calculate time-based movement
                const deltaSeconds = delta / 1000;

                // Increment terrain offset to scroll the terrain
                this.terrainOffset += this.scrollSpeed * deltaSeconds;

                // Ensure terrainOffset doesn't exceed data length
                this.terrainOffset = Math.min(
                    this.terrainOffset,
                    this.dataManager.terrainData.length - 1
                );

                if (this.terrainOffset >= this.dataManager.terrainData.length - 1) {
                    // Player has reached the end successfully
                    this.gameCompleted = true;
                    this.showGameCompleted();
                    this.stopGame();
                    return;
                }

                // Draw terrain and other entities
                this.terrain.draw(this.terrainOffset);

                // Draw obstacles
                if (
                    this.obstacles &&
                    this.obstacles.obstaclesData &&
                    this.obstacles.obstaclesData.length > 0
                ) {
                    this.obstacles.draw(this.terrainOffset);
                    // Clear the obstacle group and add current obstacle sprites
                    this.obstacleSpritesGroup.clear(true, true);
                    this.obstacles.obstacleSprites.forEach((sprite) => {
                        this.obstacleSpritesGroup.add(sprite);
                    });
                }

                // Draw events
                if (
                    this.gameEvents &&
                    this.gameEvents.eventsData &&
                    this.gameEvents.eventsData.length > 0
                ) {
                    this.gameEvents.draw(this.terrainOffset);
                    // Clear the event group and add current event sprites
                    this.eventSpritesGroup.clear(true, true);
                    this.gameEvents.eventSprites.forEach((sprite) => {
                        this.eventSpritesGroup.add(sprite);
                    });
                }

                // Draw enemies
                if (
                    this.enemies &&
                    this.enemies.enemiesData &&
                    this.enemies.enemiesData.length > 0
                ) {
                    this.enemies.draw(this.terrainOffset);
                    // Clear the enemy group and add current enemy sprites
                    this.enemySpritesGroup.clear(true, true);
                    this.enemies.enemySprites.forEach((sprite) => {
                        this.enemySpritesGroup.add(sprite);
                    });
                }

                // Update bullets
                if (this.bullets) {
                    this.bullets.update(deltaSeconds);

                    // Manually check for bullet-enemy collisions
                    for (let bulletIndex = this.bullets.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
                        const bullet = this.bullets.bullets[bulletIndex];
                        for (let enemyIndex = this.enemies.enemySprites.length - 1; enemyIndex >= 0; enemyIndex--) {
                            const enemy = this.enemies.enemySprites[enemyIndex];
                            if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), enemy.getBounds())) {
                                // Bullet hit an enemy
                                this.handleBulletEnemyCollision(bullet, enemy, bulletIndex, enemyIndex);
                                break; // Exit inner loop after collision
                            }
                        }
                    }
                    // Check for bullet-enemy2 collisions
                    if (this.enemies2 && this.enemies2.enemies.length > 0) {
                        for (let bulletIndex = this.bullets.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
                            const bullet = this.bullets.bullets[bulletIndex];
                            for (let enemyIndex = this.enemies2.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                                const enemy = this.enemies2.enemies[enemyIndex];
                                if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), enemy.getBounds())) {
                                    // Bullet hit an enemy2
                                    this.handleBulletEnemyCollision(bullet, enemy);
                                    break; // Exit inner loop after collision
                                }
                            }
                        }
                    }
                }

                // Update input handler (e.g., for shooting)
                this.inputHandler.update(deltaSeconds);

                // Update player and UI elements
                const playerIndex = Math.min(
                    Math.floor(this.terrainOffset + this.visibleDataPoints / 2),
                    this.dataManager.terrainData.length - 1
                );
                const data = this.dataManager.terrainData[playerIndex];
                if (data) {
                    const terrainY = this.terrain.calculateTerrainY(data, this.terrainOffset);
                    this.player.update(terrainY, deltaSeconds);
                    this.updateScore(data);

                    // Update date and price text
                    const date = new Date(data.date_unix);
                    const dateString = date.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                    });
                    const price = data.ma_7;
                    this.uiManager.updateDateText(dateString, price);

                    // Update speed effect text
                    this.uiManager.updateSpeedEffectText(this.userSpeed);
                    this.uiManager.updateJumpCostText(this.jumpPenalty, this.userSpeed);
                }

                // Apply scaling in the update loop if necessary
                if (this.player) {
                    this.player.updateScale(this.spriteScale);
                }

                // Update Enemies2
                if (this.enemies2) {
                    this.enemies2.update(deltaSeconds);
                }
            }
        } catch (error) {
            console.error('Unexpected error in update:', error);
            this.handleError(error);
        }
    }

    async loadGameData() {
        try {
            const terrainData = await this.dataManager.fetchTerrainData();
            this.terrain = new Terrain(this, terrainData, this.visibleDataPoints, this.dataManager.eventsData);

            const obstaclesData = await this.dataManager.fetchObstaclesData();
            this.obstacles = new Obstacles(
                this,
                obstaclesData,
                this.visibleDataPoints,
                this.obstacleHeightOffsetFactor
            );

            const eventsData = await this.dataManager.fetchBitcoinEventsData();
            this.gameEvents = new Events(
                this,
                eventsData,
                this.visibleDataPoints,
                this.eventHeightOffsetFactor
            );

            const enemiesData = await this.dataManager.fetchEnemiesData();
            this.enemies = new Enemies(
                this,
                enemiesData,
                this.visibleDataPoints,
                this.enemyHeightOffsetFactor
            );

            console.log('All game data loaded successfully.');
        } catch (error) {
            console.error('Error loading game data:', error);
            this.uiManager.showErrorMessage('Failed to load game data. Please try again later.');
        }
    }

    startGame() {
        console.log('startGame called');
        if (!this.isGameRunning && this.dataManager.terrainData && this.terrain) {
            this.isGameRunning = true;
            this.terrainOffset = 0;
            this.gameOver = false;
            this.gameCompleted = false; // Reset gameCompleted flag
            this.score = 0;
            this.lastPrice = 0;
            this.jumpCount = 0;
            this.enemiesHitCount = 0; // Reset enemies hit count
            this.player.lives = this.initialLives; // Reset player lives to initial value
            this.inputHandler.setButtonState(true);
            this.inputHandler.disableSpeedSlider(false);
            const speedSlider = document.getElementById('speed-slider');
            this.userSpeed = parseFloat(speedSlider.value);
            this.scrollSpeed = this.baseScrollSpeed * this.userSpeed;

            console.log(`Game started with scrollSpeed: ${this.scrollSpeed} (base: ${this.baseScrollSpeed}, user: ${this.userSpeed})`);

            // Destroy game over and completion text if it exists
            this.uiManager.destroyGameOverText();

            // Update UI elements
            this.uiManager.updateJumpCountText(this.jumpCount, this.jumpPenalty);
            this.uiManager.updateEnemiesHitText(this.enemiesHitCount);
            this.uiManager.updateSpeedEffectText(this.userSpeed);
            this.uiManager.updateLivesDisplay(this.player.lives); // Update lives display

            // Start game logic
            this.startGameLogic();

            // Clear previous game entities
            if (this.terrain) {
                this.terrain.clear();
            }
            if (this.obstacles) {
                this.obstacles.obstacleHeightOffsetFactor = this.obstacleHeightOffsetFactor;
                this.obstacles.clear();
            }
            if (this.gameEvents) {
                this.gameEvents.eventHeightOffsetFactor = this.eventHeightOffsetFactor;
                this.gameEvents.clear();
            }
            if (this.enemies) {
                this.enemies.enemyHeightOffsetFactor = this.enemyHeightOffsetFactor;
                this.enemies.clear();
            }
            if (this.bullets) {
                this.bullets.clear();
            }
            if (this.obstacleSpritesGroup) {
                this.obstacleSpritesGroup.clear(true, true);
            }
            if (this.eventSpritesGroup) {
                this.eventSpritesGroup.clear(true, true);
            }
            if (this.enemySpritesGroup) {
                this.enemySpritesGroup.clear(true, true);
            }
            if (this.player) {
                const centerX = this.sys.game.config.width / 2;
                this.player.setPosition(centerX, 300);
                this.player.sprite.setVelocity(0, 0);
            }
            this.inputHandler.resetSpeedSlider();

            // Update Start/Stop button text
            this.inputHandler.updateStartStopButtonText('Stop');

            // Start spawning Enemies2
            if (this.enemies2) {
                this.enemies2.clear();
                this.enemies2.startSpawning();
            }

            this.uiManager.resetLivesDisplay(this.initialLives);
        }
    }

    startGameLogic() {
        this.terrainOffset = 0;
        const centerX = this.sys.game.config.width / 2;
        this.player.setPosition(centerX, 300);
        this.player.sprite.setVelocity(0, 0);
    }

    togglePause() {
        console.log('togglePause called');
        if (this.isGameRunning) {
            if (this.scene.isPaused()) {
                this.scene.resume();
                this.inputHandler.updatePauseResumeButtonText(false);
                console.log('Game resumed');
            } else {
                this.scene.pause();
                this.inputHandler.updatePauseResumeButtonText(true);
                console.log('Game paused');
            }
        }
    }

    stopGame() {
        console.log('stopGame called');
        if (this.isGameRunning) {
            this.isGameRunning = false;
            this.inputHandler.setButtonState(false);
            this.inputHandler.updatePauseResumeButtonText(false);
            this.inputHandler.disableSpeedSlider(true);

            // Clear game entities
            if (this.terrain) {
                try {
                    this.terrain.clear();
                } catch (error) {
                    console.error('Error clearing terrain:', error);
                }
            }
            if (this.obstacles) {
                try {
                    this.obstacles.clear();
                } catch (error) {
                    console.error('Error clearing obstacles:', error);
                }
            }
            if (this.gameEvents) {
                try {
                    this.gameEvents.clear();
                } catch (error) {
                    console.error('Error clearing gameEvents:', error);
                }
            }
            if (this.enemies) {
                try {
                    this.enemies.clear();
                } catch (error) {
                    console.error('Error clearing enemies:', error);
                }
            }
            if (this.bullets) {
                try {
                    this.bullets.clear();
                } catch (error) {
                    console.error('Error clearing bullets:', error);
                }
            }
            if (this.obstacleSpritesGroup) {
                this.obstacleSpritesGroup.clear(true, true);
            }
            if (this.eventSpritesGroup) {
                this.eventSpritesGroup.clear(true, true);
            }
            if (this.enemySpritesGroup) {
                this.enemySpritesGroup.clear(true, true);
            }
            if (this.player) {
                const centerX = this.sys.game.config.width / 2;
                this.player.setPosition(centerX, 300);
                this.player.sprite.setVelocity(0, 0);
            }
            this.inputHandler.resetSpeedSlider();

            // Update Start/Stop button text
            this.inputHandler.updateStartStopButtonText('Start');
            console.log('Game stopped');

            // Clear Enemies2
            if (this.enemies2) {
                this.enemies2.clear();
            }
        }
    }

    jump() {
        if (this.isGameRunning && !this.gameOver && !this.gameCompleted) {
            this.player.jump();
            this.jumpCount++;
            const speedAdjustedPenalty = this.jumpPenalty * this.scoreMultiplier;
            this.score -= speedAdjustedPenalty;
            this.uiManager.updateJumpCountText(
                this.jumpCount, 
                speedAdjustedPenalty,
                this.scoreMultiplier
            );
        }
    }

    updateScore(data) {
        if (!this.isGameRunning || !data || data.ma_7 === null || isNaN(data.ma_7)) return;

        try {
            const currentPrice = data.ma_7;
            if (this.lastPrice === 0) {
                this.score = currentPrice;
                this.lastPrice = currentPrice;
                console.log(`Initial score set to: ${this.score}`);
            } else {
                const priceDifference = currentPrice - this.lastPrice;
                const adjustedDifference = priceDifference * this.userSpeed;
                this.score += adjustedDifference;
                this.lastPrice = currentPrice;
            }

            this.uiManager.updateScoreText(this.score);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    }

    showGameOver() {
        try {
            const finalPrice = this.lastPrice;
            const finalScore = Math.round(this.score);
            const totalPenalty = this.jumpCount * this.jumpPenalty;
            const enemiesHitCount = this.enemiesHitCount;
            this.uiManager.showGameOver(finalPrice, finalScore, this.jumpCount, totalPenalty, enemiesHitCount);
            console.log('Game Over displayed');

            this.showNameInputModal("Game Over!", finalScore, false);
        } catch (error) {
            console.error('Error in showGameOver:', error);
        }
    }

    showGameCompleted() {
        try {
            const finalPrice = this.lastPrice;
            const finalScore = Math.round(this.score);
            const totalPenalty = this.jumpCount * this.jumpPenalty;
            const enemiesHitCount = this.enemiesHitCount;

            const completionText = `Congratulations!
You managed to HODL till the end!

BTC Price: $${finalPrice.toFixed(2)}
Your Score: $${finalScore}
Jumps: ${this.jumpCount}
Total Penalty: $${totalPenalty}
Enemies Hit: ${enemiesHitCount}`;

            this.uiManager.showCompletionMessage(completionText);
            console.log('Game completed successfully');

            this.showNameInputModal("Congratulations HODLer!", finalScore, true);
        } catch (error) {
            console.error('Error in showGameCompleted:', error);
        }
    }

    showNameInputModal(title, score, hodl) {
        const modal = document.getElementById('name-input-modal');
        const modalTitle = document.getElementById('modal-title');
        const submitButton = document.getElementById('submit-score-button');
        const cancelButton = document.getElementById('cancel-score-button');
        const playerNameInput = document.getElementById('player-name-input');
        const modalContent = document.getElementById('modal-content');

        // Get current BTC price
        const currentPrice = this.lastPrice;

        // Update modal content with score and price information
        modalContent.innerHTML = `
            <div class="score-details">
                <p class="score-value">Score: $${score.toFixed(2)}</p>
                <p class="btc-price">BTC Price: $${currentPrice.toFixed(2)}</p>
            </div>
            <div class="input-container">
                <input type="text" 
                       id="player-name-input" 
                       placeholder="Enter your name" 
                       maxlength="50"
                       class="name-input">
            </div>
        `;

        modalTitle.textContent = title;
        modal.style.display = 'block';

        // Focus on input after modal is shown
        setTimeout(() => {
            const newInput = document.getElementById('player-name-input');
            if (newInput) newInput.focus();
        }, 100);

        submitButton.onclick = () => {
            const newInput = document.getElementById('player-name-input');
            const playerName = newInput.value.trim();
            if (playerName) {
                this.submitScore(playerName, score, hodl, currentPrice);
                modal.style.display = 'none';
            }
        };

        cancelButton.onclick = () => {
            modal.style.display = 'none';
        };

        // Handle Enter key
        modal.onkeyup = (event) => {
            if (event.key === 'Enter') {
                submitButton.click();
            }
        };
    }

    handleObstacleCollision(playerSprite, obstacleSprite) {
        // console.log('Player collided with obstacle!');
        this.sound.play('obstacle_impact');  // Add this line to play the sound
        const remainingLives = this.player.loseLife();
        this.player.flash(); // Trigger the enhanced flash effect
        if (remainingLives <= 0) {
            this.gameOver = true;
            this.showGameOver();
            this.stopGame();
        } else {
            console.log(`Lives remaining: ${remainingLives}`);
            this.uiManager.updateLivesDisplay(remainingLives);
        }
    }

    handleEventOverlap(playerSprite, eventSprite) {
        const eventData = eventSprite.eventData;
        if (eventData && !eventSprite.collected) {
            // Update score based on event's impact
            this.score += eventData.impact;
            this.uiManager.updateScoreText(this.score);

            // Play sound based on event impact
            if (eventData.impact > 0) {
                this.sound.play('btc_event_positive');
            } else {
                this.sound.play('btc_event_negative');
            }

            // Trigger explosion animation
            this.triggerExplosion(eventSprite.x, eventSprite.y);

            // Display event impact
            this.uiManager.showScoreImpact(eventData.impact, eventSprite.x, eventSprite.y);

            // Mark as collected to prevent multiple triggers
            eventSprite.collected = true;

            // Remove the event sprite after collision
            eventSprite.destroy();
        }
    }

    handleBulletEnemyCollision(bulletSprite, enemySprite) {
        // Destroy both the bullet and the enemy
        bulletSprite.destroy();
        enemySprite.destroy();

        // Remove bullet and enemy from their respective arrays
        this.bullets.bullets = this.bullets.bullets.filter(b => b !== bulletSprite);
        
        let pointsGained;
        let color;

        if (enemySprite.texture.key === 'enemy') {
            this.enemies.enemySprites = this.enemies.enemySprites.filter(e => e !== enemySprite);
            if (enemySprite.enemyData) {
                enemySprite.enemyData.isAlive = false;
            }
            pointsGained = this.enemyPoints[enemySprite.texture.key];
            color = '#00FF00'; // Green for regular enemies
        } else if (enemySprite.texture.key === 'enemy_2') {
            this.enemies2.enemies = this.enemies2.enemies.filter(e => e !== enemySprite);
            pointsGained = this.enemyPoints[enemySprite.texture.key];
            color = '#FFA500'; // Orange for enemy2
        }

        // Increase enemies hit count
        this.enemiesHitCount += 1;
        this.uiManager.updateEnemiesHitText(this.enemiesHitCount);

        // Update the score
        this.score += pointsGained;
        this.uiManager.updateScoreText(this.score);

        // Show points gained at collision point with different style
        this.showPointsGained(enemySprite.x, enemySprite.y, pointsGained, color, enemySprite.texture.key === 'enemy_2');

        // Trigger explosion animation
        this.triggerExplosion(enemySprite.x, enemySprite.y);

        if (enemySprite.texture.key === 'enemy') {
            this.sound.play('enemy1_impact');
        } else if (enemySprite.texture.key === 'enemy_2') {
            this.sound.play('enemy2_impact');
        }
    }

    triggerExplosion(x, y) {
        // Create an explosion animation using particles
        const particles = this.add.particles('particle_pill'); // Use particle_pill.png

        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            quantity: 20,
            gravityY: 200
        });

        // Stop emitting and destroy particles after the animation
        this.time.delayedCall(500, () => {
            emitter.stop();
            particles.destroy();
        });
    }

    handleContextLoss() {
        console.warn('WebGL context lost. Attempting to restore...');
        this.isGameRunning = false;
        this.clear();
        this.uiManager.showErrorMessage('Game paused. Attempting to restore...');
        
        // Attempt to reload game data with retries
        let retries = 3;
        const attemptReload = () => {
            this.loadGameData().catch(error => {
                console.error('Failed to reload game data:', error);
                if (retries > 0) {
                    retries--;
                    setTimeout(attemptReload, 1000);
                } else {
                    this.uiManager.showErrorMessage('Failed to restore game. Please refresh the page.');
                }
            });
        };
        attemptReload();
    }

    handleContextRestored() {
        console.log('Reinitializing game after context restoration.');
        this.recreateGraphics();
        this.startGame();
        this.uiManager.hideErrorMessage();
    }

    clear() {
        [this.terrain, this.obstacles, this.gameEvents, this.enemies, this.bullets, this.enemies2].forEach(entity => {
            if (entity && typeof entity.clear === 'function') {
                entity.clear();
            }
        });
        this.terrainOffset = 0;
        this.score = 0;
        this.jumpCount = 0;
        this.enemiesHitCount = 0;
    }

    recreateGraphics() {
        [this.terrain, this.obstacles, this.gameEvents, this.enemies].forEach(entity => {
            if (entity && typeof entity.recreateGraphics === 'function') {
                entity.recreateGraphics();
            }
        });
        if (this.backgroundManager) {
            this.backgroundManager.recreateBackground();
        }
    }

    handleError(error) {
        console.error('Game error:', error);
        this.uiManager.showErrorMessage('An error occurred. The game will attempt to restart.');
        this.stopGame();
        // Add a small delay before restarting to ensure all resources are properly cleared
        setTimeout(() => {
            this.scene.restart();
        }, 1000);
    }

    submitScore(playerName, score, hodl, btcPrice) {
        if (typeof playerName !== 'string' || playerName.length > 50 || 
            typeof score !== 'number' || 
            typeof hodl !== 'boolean' ||
            typeof btcPrice !== 'number') {
            console.error('Invalid score submission data');
            return;
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        fetch('/submit_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                player_name: playerName,
                score: Math.round(score),
                hodl: hodl,
                btc_price: btcPrice
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Score submitted successfully:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to submit score. Please try again.');
        });
    }

    showPointsGained(x, y, points, color, isEnemy2 = false) {
        const fontSize = isEnemy2 ? '60px' : '30px';
        const pointsText = this.add.text(x, y, `+${points}`, {
            fontSize: fontSize,
            fill: color,
            fontStyle: 'bold'
        });
        pointsText.setOrigin(0.5);

        if (isEnemy2) {
            // Special animation for enemy_2
            this.tweens.add({
                targets: pointsText,
                scaleX: 1.5,
                scaleY: 1.5,
                y: y - 100,
                alpha: 0,
                duration: 1500,
                ease: 'Bounce.easeOut',
                onComplete: () => {
                    pointsText.destroy();
                }
            });

            // Add a particle effect
            const particles = this.add.particles('particle');
            const emitter = particles.createEmitter({
                x: x,
                y: y,
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 1000,
                quantity: 50
            });

            this.time.delayedCall(1000, () => {
                emitter.stop();
                this.time.delayedCall(1000, () => {
                    particles.destroy();
                });
            });
        } else {
            // Regular animation for other enemies
            this.tweens.add({
                targets: pointsText,
                y: y - 50,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    pointsText.destroy();
                }
            });
        }
    }

    setScrollSpeed(speed) {
        this.userSpeed = speed;
        this.scoreMultiplier = speed;
        this.scrollSpeed = this.baseScrollSpeed;
        console.log('setScrollSpeed:', {
            jumpPenalty: this.jumpPenalty,
            scoreMultiplier: this.scoreMultiplier
        });
        this.uiManager.updateSpeedEffectText(this.userSpeed);
        this.uiManager.updateJumpCostText(this.jumpPenalty, this.scoreMultiplier);
    }

    pauseScene() {
        if (!this.isGameRunning) return;
        
        this.scene.pause();
        this.input.keyboard.enabled = false;
        this.physics.pause();
        
        // Use the same entity array as clear() method
        [this.terrain, this.obstacles, this.gameEvents, this.enemies, this.bullets, this.enemies2].forEach(entity => {
            if (entity && typeof entity.pause === 'function') {
                entity.pause();
            }
        });
        
        if (this.player && this.player.sprite) {
            this.player.sprite.setVelocity(0, 0);
        }
        
        // Pause all active particle systems
        if (this.game.particles) {
            this.game.particles.pauseAll();
        }
    }

    resumeScene() {
        if (this.gameOver || this.gameCompleted) return;
        
        this.scene.resume();
        this.input.keyboard.enabled = true;
        this.physics.resume();
        
        // Resume all active entities
        [this.terrain, this.obstacles, this.gameEvents, this.enemies, this.bullets, this.enemies2].forEach(entity => {
            if (entity && typeof entity.resume === 'function') {
                entity.resume();
            }
        });
        
        // Resume all particle systems
        if (this.game.particles) {
            this.game.particles.resumeAll();
        }
        
        // Initialize backgroundManager if needed
        if (!this.backgroundManager) {
            this.backgroundManager = new BackgroundManager(this);
        }
        
        // Ensure graphics are properly restored
        this.recreateGraphics();
        this.scale.refresh();
    }

    restartScene() {
        this.clear();
        this.recreateGraphics();
        this.scene.restart();
    }
}
