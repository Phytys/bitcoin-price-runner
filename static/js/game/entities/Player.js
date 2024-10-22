// static/js/game/entities/Player.js

/**
 * The Player class represents the player character in the game.
 * It handles movement, jumping, and interactions with the terrain.
 */
export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        // Create the player sprite
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setOrigin(0.5, 1); // Set origin to bottom center
        this.sprite.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(100); // Set gravity for jumping
        this.jumpStrength = -600; // Adjust jump strength as needed

        // Apply initial scaling
        this.sprite.setScale(this.scene.spriteScale);

        // Set the terrain offset to prevent sinking into the terrain
        this.terrainOffsetY = this.sprite.displayHeight * 0.02; // Adjust as needed

        this.lives = 3; // Default number of lives
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000; // 1 second of invulnerability after being hit
    }

    /**
     * Updates the player's position based on the terrain.
     * @param {number} terrainY - The y-coordinate of the terrain at the player's position.
     */
    update(terrainY) {
        // Prevent player from falling below the terrain
        if (this.sprite.y > terrainY - this.terrainOffsetY) {
            this.sprite.y = terrainY - this.terrainOffsetY;
            this.sprite.body.setVelocityY(0);
        }
    }

    /**
     * Makes the player jump by setting an upward velocity.
     */
    jump() {
        this.sprite.setVelocityY(this.jumpStrength);
    }

    /**
     * Sets the player's position.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     */
    setPosition(x, y) {
        this.sprite.setPosition(x, y);
    }

    /**
     * Sets the player's scale.
     * @param {number} scale - The scaling factor.
     */
    setScale(scale) {
        this.sprite.setScale(scale);
        // Update terrain offset based on new scale
        this.terrainOffsetY = this.sprite.displayHeight * 0.02;
        // Update physics body size if necessary
        this.sprite.body.setSize(
            this.sprite.width * scale,
            this.sprite.height * scale
        );
    }

    /**
     * Updates the player's scale.
     * @param {number} scale - The scaling factor.
     */
    updateScale(scale) {
        this.setScale(scale);
    }

    loseLife() {
        if (!this.isInvulnerable) {
            this.lives--;
            this.isInvulnerable = true;
            this.flash();
            setTimeout(() => {
                this.isInvulnerable = false;
            }, this.invulnerabilityDuration);
        }
        return this.lives;
    }

    flash() {
        const flashDuration = 100;
        const numFlashes = 10;
        let flashCount = 0;

        // Add a subtle glow effect
        const glowGraphics = this.scene.add.graphics()
            .setDefaultStyles({ fillStyle: { color: 0xFFA500, alpha: 0.3 } });

        const glowCircle = new Phaser.Geom.Circle(this.sprite.x, this.sprite.y, this.sprite.width * 0.6);
        glowGraphics.fillCircleShape(glowCircle);

        const flashInterval = setInterval(() => {
            this.sprite.setAlpha(this.sprite.alpha === 1 ? 0.2 : 1);
            flashCount++;
            if (flashCount >= numFlashes * 2) {
                clearInterval(flashInterval);
                this.sprite.setAlpha(1);
                glowGraphics.destroy();
            }
        }, flashDuration);

        // Animate the glow effect
        this.scene.tweens.add({
            targets: glowGraphics,
            alpha: { from: 0.3, to: 0 },
            duration: flashDuration * numFlashes * 2,
            ease: 'Linear',
            onComplete: () => {
                glowGraphics.destroy();
            }
        });
    }

    getRemainingLives() {
        return this.lives;
    }
}
