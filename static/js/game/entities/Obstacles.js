// static/js/game/entities/Obstacles.js

export default class Obstacles {
    constructor(scene, obstaclesData, visibleDataPoints, obstacleHeightOffsetFactor) {
        this.scene = scene;
        this.obstaclesData = obstaclesData;
        this.visibleDataPoints = visibleDataPoints;
        this.obstacleHeightOffsetFactor = obstacleHeightOffsetFactor;
        this.obstacleSprites = [];
    }

    draw(terrainOffset) {
        if (!this.obstaclesData || this.obstaclesData.length === 0) {
            // Obstacles data not yet loaded or empty
            return;
        }

        // Clear existing obstacle sprites
        this.obstacleSprites.forEach(sprite => sprite.destroy());
        this.obstacleSprites = [];

        // Calculate visible indices in terrain data
        const startTerrainIndex = Math.floor(terrainOffset);
        const endTerrainIndex = Math.min(
            startTerrainIndex + this.visibleDataPoints,
            this.scene.dataManager.terrainData.length
        );

        // Create a map of terrain data by date_unix for quick lookup
        const terrainDataMap = {};
        for (let i = startTerrainIndex; i < endTerrainIndex; i++) {
            const dataPoint = this.scene.dataManager.terrainData[i];
            terrainDataMap[dataPoint.date_unix] = {
                dataPoint,
                index: i
            };
        }

        // Filter obstacles that are within the visible terrain data
        const visibleObstacles = this.obstaclesData.filter(obstacleData => {
            return terrainDataMap.hasOwnProperty(obstacleData.drawdown_date_unix);
        });

        visibleObstacles.forEach(obstacleData => {
            const terrainInfo = terrainDataMap[obstacleData.drawdown_date_unix];
            const dataPoint = terrainInfo.dataPoint;
            const index = terrainInfo.index;

            // Calculate X position similar to Terrain.js
            const x = this.scene.sys.game.config.width * (index - terrainOffset) / this.visibleDataPoints;

            // Calculate Y position using the terrain's calculateTerrainY method
            const terrainY = this.scene.terrain.calculateTerrainY(dataPoint, terrainOffset);

            // Adjust obstacle position slightly above the terrain
            const y = terrainY - (this.scene.sys.game.config.height * this.obstacleHeightOffsetFactor);

            // Create obstacle sprite
            const obstacleSprite = this.scene.physics.add.sprite(x, y, 'obstacle');
            obstacleSprite.setOrigin(0.5, 1); // Set origin to bottom center
            obstacleSprite.body.allowGravity = false;
            obstacleSprite.body.immovable = true;

            // Apply scaling
            obstacleSprite.setScale(this.scene.spriteScale);

            this.obstacleSprites.push(obstacleSprite);
        });
    }

    updateScale(scale) {
        this.obstacleSprites.forEach(sprite => {
            sprite.setScale(scale);
        });
    }

    clear() {
        // Clear obstacle sprites
        this.obstacleSprites.forEach(sprite => sprite.destroy());
        this.obstacleSprites = [];
    }
}