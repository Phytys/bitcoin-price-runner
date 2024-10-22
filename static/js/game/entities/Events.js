// static/js/game/entities/Events.js

export default class Events {
    constructor(scene, eventsData, visibleDataPoints, eventHeightOffsetFactor) {
        this.scene = scene;
        this.eventsData = eventsData;
        this.visibleDataPoints = visibleDataPoints;
        this.eventHeightOffsetFactor = eventHeightOffsetFactor;
        this.eventSprites = [];
        this.eventLabels = []; // To store labels
    }

    draw(terrainOffset) {
        if (!this.eventsData || this.eventsData.length === 0) {
            // Events data not yet loaded or empty
            return;
        }

        // Clear existing event sprites and labels
        this.eventSprites.forEach(sprite => sprite.destroy());
        this.eventSprites = [];

        this.eventLabels.forEach(label => label.destroy());
        this.eventLabels = [];

        // Calculate visible indices in terrain data
        const startTerrainIndex = Math.floor(terrainOffset);
        const endTerrainIndex = Math.min(
            startTerrainIndex + this.visibleDataPoints,
            this.scene.dataManager.terrainData.length - 1
        );

        // Create a map of terrain data by date_unix for quick lookup
        const terrainDataMap = {};
        for (let i = startTerrainIndex; i <= endTerrainIndex; i++) { // Changed to <= to include endIndex
            const dataPoint = this.scene.dataManager.terrainData[i];
            if (dataPoint && dataPoint.date_unix) { // Added check for dataPoint existence
                terrainDataMap[dataPoint.date_unix] = {
                    dataPoint,
                    index: i
                };
            }
        }

        // Filter events that are within the visible terrain data
        const visibleEvents = this.eventsData.filter(eventData => {
            return terrainDataMap.hasOwnProperty(eventData.date_unix);
        });

        visibleEvents.forEach(eventData => {
            const terrainInfo = terrainDataMap[eventData.date_unix];
            const dataPoint = terrainInfo.dataPoint;
            const index = terrainInfo.index;

            // Calculate X position similar to Terrain.js
            const x = this.scene.sys.game.config.width * (index - terrainOffset) / this.visibleDataPoints;

            // Calculate Y position using the terrain's calculateTerrainY method
            const terrainY = this.scene.terrain.calculateTerrainY(dataPoint, terrainOffset);

            // Adjust event position slightly above the terrain
            const y = terrainY - (this.scene.sys.game.config.height * this.eventHeightOffsetFactor);

            // Choose the appropriate sprite based on 'impact'
            const spriteKey = eventData.impact >= 0 ? 'btc_event_positive' : 'btc_event_negative';

            // Create event sprite
            const eventSprite = this.scene.physics.add.sprite(x, y, spriteKey);
            eventSprite.setOrigin(0.5, 1); // Set origin to bottom center
            eventSprite.body.allowGravity = false;
            eventSprite.body.immovable = true;

            // Apply scaling
            eventSprite.setScale(this.scene.spriteScale);

            // Store event data in the sprite for later use
            eventSprite.eventData = eventData;

            this.eventSprites.push(eventSprite);

            // Create and attach a label to the event sprite
            const label = this.scene.add.text(x, y - 40 * this.scene.spriteScale, eventData.event, {
                fontSize: `${20 * this.scene.spriteScale}px`, // Adjust font size
                fontStyle: 'bold', // Bold text
                fill: '#ffffff',
                fontFamily: 'Roboto, sans-serif',
                stroke: '#000000',
                strokeThickness: 3 * this.scene.spriteScale, // Adjust stroke thickness
                backgroundColor: 'rgba(0,0,0,0.6)', // Increased background opacity
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5, 1);

            this.eventLabels.push(label);
        });
    }

    updateScale(scale) {
        this.eventSprites.forEach(sprite => {
            sprite.setScale(scale);
        });
        this.eventLabels.forEach(label => {
            label.setFontSize(20 * scale);
            label.setStrokeThickness(3 * scale);
            // Adjust position
            label.y = label.y - 40 * scale;
        });
    }

    clear() {
        // Clear event sprites and labels
        this.eventSprites.forEach(sprite => sprite.destroy());
        this.eventSprites = [];

        this.eventLabels.forEach(label => label.destroy());
        this.eventLabels = [];
    }
}