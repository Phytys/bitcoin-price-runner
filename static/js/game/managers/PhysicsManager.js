// static/js/game/managers/PhysicsManager.js

export default class PhysicsManager {
    constructor(scene) {
        this.scene = scene;
        this.configurePhysics();
    }

    configurePhysics() {
        // Set global physics configurations
        this.scene.physics.world.gravity.y = 1000; // Adjust gravity as needed

        // Set bounds collision
        this.scene.physics.world.setBoundsCollision(true, true, true, true);
    }

    handleCollisions(player, obstaclesGroup, collisionCallback) {
        // Set up collision detection between player and obstacles
        this.scene.physics.add.overlap(
            player,
            obstaclesGroup,
            collisionCallback,
            null,
            this.scene
        );
    }

    handleEventOverlap(player, eventsGroup, overlapCallback) {
        // Set up overlap detection between player and events
        this.scene.physics.add.overlap(
            player,
            eventsGroup,
            overlapCallback,
            null,
            this.scene
        );
    }

    handleBulletEnemyCollisions(bulletsGroup, enemiesGroup, collisionCallback) {
        // Set up collision detection between bullets and enemies
        this.scene.physics.add.overlap(
            bulletsGroup,
            enemiesGroup,
            collisionCallback,
            null,
            this.scene
        );
    }
}
