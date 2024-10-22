// static/js/game/managers/UIManager.js

export default class UIManager {
    constructor(scene, priceLineColor) {
        this.scene = scene;
        this.priceLineColor = priceLineColor; // Store the price line color

        this.scoreText = null;
        this.dateText = null;
        this.priceText = null;
        this.speedEffectText = null; // New property for speed effect
        this.jumpCountText = null;
        this.enemiesHitText = null;
        this.gameOverText = null;
        this.gameCompletedText = null;
        this.scoreInfoText = null;
        this.eventLabelText = null;
        this.livesText = null;
        this.livesIcons = [];
        this.errorMessage = null;
    }

    showScoreInfo(onStartCallback) {
        const scoreInfo = [
            "Welcome to Bitcoin Price Runner!",
            "",
            "Instructions:",
            "1. Avoid bears by jumping.",
            "2. Pass events to gain or lose points.",
            "3. Orange pill the dark fiat bros to gain points.",
            "4. HODL",
            "",
            "Click to start!"
        ].join('\n');

        this.scoreInfoText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            scoreInfo,
            {
                fontSize: '24px',
                fill: this.priceLineColor, // Set to price line color
                fontFamily: 'Roboto, sans-serif',
                align: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 20, y: 20 }
            }
        ).setOrigin(0.5);

        this.scene.input.once('pointerdown', () => {
            this.scoreInfoText.destroy();
            onStartCallback();
        });
    }

    showGameOver(finalPrice, finalScore, jumpCount, totalPenalty, enemiesHitCount) {
        const gameOverText = `Game Over
BTC Price: $${finalPrice.toFixed(2)}
Your Score: $${finalScore}
Jumps: ${jumpCount}
Total Penalty: $${totalPenalty}
Enemies Hit: ${enemiesHitCount}`;

        this.gameOverText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            gameOverText,
            { 
                fontSize: '32px', 
                fill: this.priceLineColor, // Set to price line color
                fontFamily: 'Roboto, sans-serif', 
                align: 'center', 
                backgroundColor: 'rgba(0,0,0,0.7)', 
                padding: { x: 20, y: 20 } 
            }
        ).setOrigin(0.5);
        console.log('Game over shown');
    }

    showCompletionMessage(message) {
        this.gameCompletedText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            message,
            {
                fontSize: '32px',
                fill: this.priceLineColor, // Set to price line color
                fontFamily: 'Roboto, sans-serif',
                align: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 20, y: 20 }
            }
        ).setOrigin(0.5);
        console.log('Completion message shown');
    }

    destroyCompletionMessage() {
        if (this.gameCompletedText) {
            this.gameCompletedText.destroy();
            this.gameCompletedText = null;
        }
    }

    showErrorMessage(message) {
        this.errorMessage = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            message,
            {
                fontSize: '24px',
                fill: '#FF0000',
                fontFamily: 'Roboto, sans-serif',
                align: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 20, y: 20 }
            }
        ).setOrigin(0.5);
    }

    hideErrorMessage() {
        if (this.errorMessage) {
            this.errorMessage.destroy();
            this.errorMessage = null;
        }
    }

    updateDateText(dateString, price) {
        if (this.dateText) {
            this.dateText.setText(`${dateString}`);
            this.dateText.setFill(this.priceLineColor); // Set to price line color
        } else {
            this.dateText = this.scene.add.text(
                16,
                16,
                `${dateString}`,
                {
                    fontSize: '18px',
                    fill: this.priceLineColor, // Set to price line color
                    fontFamily: 'Roboto, sans-serif',
                    align: 'left'
                }
            ).setOrigin(0, 0);
        }

        if (this.priceText) {
            this.priceText.setText(`Price: $${price}`);
            this.priceText.setFill(this.priceLineColor); // Set to price line color
        } else {
            this.priceText = this.scene.add.text(
                16,
                40,
                `Price: $${price}`,
                {
                    fontSize: '18px',
                    fill: this.priceLineColor, // Set to price line color
                    fontFamily: 'Roboto, sans-serif',
                    align: 'left'
                }
            ).setOrigin(0, 0);
        }
    }

    // New method to update the speed effect text
    updateSpeedEffectText(speedMultiplier) {
        const speedEffectMessage = `Speed Multiplier: x${speedMultiplier.toFixed(1)}
Score changes are multiplied by this factor.`;
        if (this.speedEffectText) {
            this.speedEffectText.setText(speedEffectMessage);
        } else {
            this.speedEffectText = this.scene.add.text(
                16,
                70, // Position it below the Price text
                speedEffectMessage,
                {
                    fontSize: '18px',
                    fill: this.priceLineColor,
                    fontFamily: 'Roboto, sans-serif',
                    align: 'left'
                }
            ).setOrigin(0, 0);
        }
    }

    updateScoreText(score) {
        if (this.scoreText) {
            this.scoreText.setText(`Score: $${score.toFixed(2)}`);
        } else {
            this.scoreText = this.scene.add.text(
                16,
                120, // Adjusted position to account for speed effect text
                `Score: $${score.toFixed(2)}`,
                {
                    fontSize: '18px',
                    fill: this.priceLineColor,
                    fontFamily: 'Roboto, sans-serif',
                    align: 'left'
                }
            ).setOrigin(0, 0);
        }
    }

    updateJumpCountText(jumpCount, jumpPenalty) {
        if (this.jumpCountText) {
            this.jumpCountText.setText(`Jumps: ${jumpCount} (-$${jumpPenalty} per jump)`);
        } else {
            this.jumpCountText = this.scene.add.text(
                16,
                150, // Adjusted position
                `Jumps: ${jumpCount} (-$${jumpPenalty} per jump)`,
                {
                    fontSize: '18px',
                    fill: this.priceLineColor,
                    fontFamily: 'Roboto, sans-serif',
                    align: 'left'
                }
            ).setOrigin(0, 0);
        }
    }

    updateEnemiesHitText(enemiesHitCount) {
        if (this.enemiesHitText) {
            this.enemiesHitText.setText(`Enemies Hit: ${enemiesHitCount}`);
        } else {
            this.enemiesHitText = this.scene.add.text(
                16,
                180, // Adjusted position
                `Enemies Hit: ${enemiesHitCount}`,
                {
                    fontSize: '18px',
                    fill: this.priceLineColor,
                    fontFamily: 'Roboto, sans-serif',
                    align: 'left'
                }
            ).setOrigin(0, 0);
        }
    }

    showScoreImpact(impact, x, y) {
        const impactText = this.scene.add.text(
            x,
            y,
            `${impact > 0 ? '+' : ''}${impact}`,
            {
                fontSize: '20px',
                fill: impact > 0 ? '#00FF00' : '#FF0000', // Green for positive, Red for negative
                fontFamily: 'Roboto, sans-serif',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5);

        this.scene.tweens.add({
            targets: impactText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                impactText.destroy();
            }
        });
    }

    resizeUI() {
        const scale = this.scene.spriteScale;

        // Adjust UI elements on resize
        if (this.dateText) {
            this.dateText.setFontSize(18 * scale);
            this.dateText.setPosition(16 * scale, 16 * scale);
            this.dateText.setFill(this.priceLineColor);
        }
        if (this.priceText) {
            this.priceText.setFontSize(18 * scale);
            this.priceText.setPosition(16 * scale, 40 * scale);
            this.priceText.setFill(this.priceLineColor);
        }
        if (this.speedEffectText) {
            this.speedEffectText.setFontSize(18 * scale);
            this.speedEffectText.setPosition(16 * scale, 70 * scale);
            this.speedEffectText.setFill(this.priceLineColor);
        }
        if (this.scoreText) {
            this.scoreText.setFontSize(18 * scale);
            this.scoreText.setPosition(16 * scale, 120 * scale);
            this.scoreText.setFill(this.priceLineColor);
        }
        if (this.jumpCountText) {
            this.jumpCountText.setFontSize(18 * scale);
            this.jumpCountText.setPosition(16 * scale, 150 * scale);
            this.jumpCountText.setFill(this.priceLineColor);
        }
        if (this.enemiesHitText) {
            this.enemiesHitText.setFontSize(18 * scale);
            this.enemiesHitText.setPosition(16 * scale, 180 * scale);
            this.enemiesHitText.setFill(this.priceLineColor);
        }
        if (this.livesIcons) {
            const iconSize = 30 * scale;
            const spacing = 5 * scale;
            this.livesIcons.forEach((icon, index) => {
                icon.setPosition(16 * scale + (iconSize + spacing) * index, 210 * scale);
                icon.setScale(0.5 * scale);
            });
        }
    }

    destroyGameOverText() {
        if (this.gameOverText) {
            this.gameOverText.destroy();
            this.gameOverText = null;
        }
        this.destroyCompletionMessage(); // Clear completion message as well
    }

    createLivesDisplay(initialLives) {
        this.livesIcons = [];
        const iconSize = 30;
        const spacing = 5;
        const totalWidth = (iconSize + spacing) * initialLives - spacing;
        const startX = (this.scene.sys.game.config.width - totalWidth) / 2;
        const y = 20; // Position from the top of the screen

        for (let i = 0; i < initialLives; i++) {
            const icon = this.scene.add.image(startX + (iconSize + spacing) * i, y, 'player');
            icon.setScale(0.5);
            icon.setOrigin(0, 0.5);
            this.livesIcons.push(icon);
        }
    }

    updateLivesDisplay(lives) {
        this.livesIcons.forEach((icon, index) => {
            icon.setVisible(index < lives);
        });
    }

    resetLivesDisplay(initialLives) {
        this.livesIcons.forEach((icon, index) => {
            icon.setVisible(index < initialLives);
        });
    }
}
