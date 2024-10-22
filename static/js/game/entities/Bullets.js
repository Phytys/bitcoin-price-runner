// static/js/game/entities/Bullets.js

export default class Bullets {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];

        // Bullet properties
        this.bulletSpeed = 500; // Adjust as needed
        this.bulletLifetime = 2000; // Bullet lifespan in milliseconds

        // Apply initial scaling to bullet properties if necessary
        this.bulletScale = this.scene.spriteScale;
    }

    shoot(x, y) {
        this.scene.sound.play('bullet_fire');
        // Create a new bullet sprite
        const bullet = this.scene.physics.add.sprite(x, y, 'bitcoin_pill');
        bullet.setOrigin(0.5, 0.5);

        // Apply scaling to the bullet
        bullet.setScale(this.bulletScale);

        // Set bullet velocity to move to the right
        bullet.body.velocity.x = this.bulletSpeed;

        // Disable gravity for the bullet
        bullet.body.allowGravity = false;

        // Add bullet to the bullets array
        this.bullets.push(bullet);

        // Destroy bullet after a certain time
        this.scene.time.delayedCall(this.bulletLifetime, () => {
            bullet.destroy();
            this.bullets = this.bullets.filter(b => b !== bullet);
        });
    }

    update() {
        // Update bullets if needed
        this.bullets.forEach(bullet => {
            // Check if bullet is out of bounds (right edge of the screen)
            if (bullet.x > this.scene.sys.game.config.width) {
                bullet.destroy();
                this.bullets = this.bullets.filter(b => b !== bullet);
            }
        });
    }

    updateScale(scale) {
        this.bulletScale = scale;
        this.bullets.forEach(bullet => {
            bullet.setScale(scale);
            // Update physics body size if necessary
            bullet.body.setSize(
                bullet.width * scale,
                bullet.height * scale
            );
        });
    }

    clear() {
        // Destroy all bullets
        this.bullets.forEach(bullet => bullet.destroy());
        this.bullets = [];
    }
}
