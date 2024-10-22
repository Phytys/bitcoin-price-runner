export default class Enemies2 {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = null;
        this.spawnInterval = 5000; // Spawn an enemy every 5 seconds
        this.rotationSpeed = 0.01; // Rotation speed in radians per frame
    }

    startSpawning() {
        this.spawnTimer = this.scene.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    stopSpawning() {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }
    }

    spawnEnemy() {
        const screenWidth = this.scene.sys.game.config.width;
        const rightSideWidth = screenWidth / 3; // Spawn in the right third of the screen
        const x = Phaser.Math.Between(screenWidth - rightSideWidth, screenWidth);
        const y = -50; // Start above the screen
        const enemy = this.scene.physics.add.sprite(x, y, 'enemy_2');
        enemy.setScale(this.scene.spriteScale);
        enemy.setVelocityY(5); // Slower vertical speed
        this.scene.physics.add.existing(enemy); // Add to physics system
        this.enemies.push(enemy);
    }

    update() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.y > this.scene.sys.game.config.height + 50) { // Give some extra space
                enemy.destroy();
                return false;
            }
            // Apply rotation to the enemy
            enemy.angle += this.rotationSpeed * (180 / Math.PI); // Convert radians to degrees
            return true;
        });
    }

    clear() {
        this.stopSpawning();
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
    }
}
