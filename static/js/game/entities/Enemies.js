// static/js/game/entities/Enemies.js

export default class Enemies {
    constructor(scene, enemiesData, visibleDataPoints, enemyHeightOffsetFactor) {
        this.scene = scene;
        this.enemiesData = enemiesData;
        this.visibleDataPoints = visibleDataPoints;
        this.enemyHeightOffsetFactor = enemyHeightOffsetFactor;
        this.enemySprites = [];
    }

    draw(terrainOffset) {
        if (!this.enemiesData || this.enemiesData.length === 0) {
            return;
        }

        // Clear existing enemy sprites
        this.enemySprites.forEach(sprite => sprite.destroy());
        this.enemySprites = [];

        // Calculate visible indices in terrain data
        const startTerrainIndex = Math.floor(terrainOffset);
        const endTerrainIndex = Math.min(
            startTerrainIndex + this.visibleDataPoints,
            this.scene.dataManager.terrainData.length - 1
        );

        // Create a map of terrain data by date_unix for quick lookup
        const terrainDataMap = {};
        for (let i = startTerrainIndex; i <= endTerrainIndex; i++) {
            const dataPoint = this.scene.dataManager.terrainData[i];
            if (dataPoint && dataPoint.date_unix) {
                terrainDataMap[dataPoint.date_unix] = {
                    dataPoint,
                    index: i
                };
            }
        }

        // Filter enemies that are alive and within the visible terrain data
        const visibleEnemies = this.enemiesData.filter(enemyData => {
            return enemyData.isAlive && terrainDataMap.hasOwnProperty(enemyData.date_unix);
        });

        visibleEnemies.forEach(enemyData => {
            const terrainInfo = terrainDataMap[enemyData.date_unix];
            const dataPoint = terrainInfo.dataPoint;
            const index = terrainInfo.index;

            // Calculate X and Y positions
            const x = this.scene.sys.game.config.width * (index - terrainOffset) / this.visibleDataPoints;
            const terrainY = this.scene.terrain.calculateTerrainY(dataPoint, terrainOffset);
            const y = terrainY - (this.scene.sys.game.config.height * this.enemyHeightOffsetFactor);

            // Create enemy sprite
            const enemySprite = this.scene.add.sprite(x, y, 'enemy');
            enemySprite.setOrigin(0.5, 1);

            // Apply scaling
            enemySprite.setScale(this.scene.spriteScale);

            // Store reference to enemyData
            enemySprite.enemyData = enemyData;

            // Add enemy sprite to the array
            this.enemySprites.push(enemySprite);
        });
    }

    updateScale(scale) {
        this.enemySprites.forEach(sprite => {
            sprite.setScale(scale);
        });
    }

    clear() {
        // Clear enemy sprites
        this.enemySprites.forEach(sprite => sprite.destroy());
        this.enemySprites = [];
    }
}