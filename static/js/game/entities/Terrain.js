// static/js/game/entities/Terrain.js

export default class Terrain {
    constructor(scene, terrainData, visibleDataPoints, eventsData) {
        this.scene = scene;
        this.terrainData = terrainData;
        this.visibleDataPoints = visibleDataPoints;
        this.eventsData = eventsData; // Reference to events data
        this.terrainGraphics = this.scene.add.graphics();
        this.dateTexts = [];
        this.priceTexts = [];
        this.dateTextsInitialized = false;
        this.priceTextsInitialized = false;
        this.priceLineColor = 0xff00ff; // Vibrant neon pink (matches price line)
        this.topMarginPercentage = 0.25; // % the screen height as top margin

        // Adjust line thicknesses based on scaling
        this.lineThickness = 4 * this.scene.spriteScale; // Fixed line thickness for the main price line
        this.glowThickness = 12 * this.scene.spriteScale; // Thickness for the glow effect
        this.defaultGlowAlpha = 0.2; // Default glow opacity
        this.highlightGlowAlpha = 0.6; // Increased glow opacity when event is approaching
        this.highlightGlowThickness = 20 * this.scene.spriteScale; // Thickness for the glow effect when event is approaching

        console.log('Terrain constructor called', { dataLength: terrainData.length, visibleDataPoints });
    }

    draw(terrainOffset) {
        if (!this.terrainGraphics) {
            console.warn('Terrain graphics object is null. Recreating...');
            this.terrainGraphics = this.scene.add.graphics();
        } else {
            this.terrainGraphics.clear();
        }

        const visibleWidth = this.scene.scale.width;
        const height = this.scene.scale.height;
        const topMargin = height * this.topMarginPercentage;
        const adjustedHeight = height - topMargin;
        const startIndex = Math.max(0, Math.floor(terrainOffset));
        const endIndex = Math.min(startIndex + this.visibleDataPoints, this.terrainData.length - 1);

        if (startIndex >= this.terrainData.length) {
            console.warn('Terrain offset out of bounds', { startIndex, dataLength: this.terrainData.length });
            return;
        }

        const visiblePrices = this.terrainData.slice(startIndex, endIndex + 1)
            .map(d => d.ma_7)
            .filter(price => price !== null && !isNaN(price));

        if (visiblePrices.length === 0) {
            console.warn('No valid prices in visible range');
            return;
        }

        const minPrice = Math.min(...visiblePrices);
        const maxPrice = Math.max(...visiblePrices);
        const priceRange = maxPrice - minPrice;
        const adjustedMinPrice = Math.max(0, minPrice - priceRange * 0.25);
        const adjustedMaxPrice = maxPrice + priceRange * 0.25;

        // Determine if any event is approaching within the next 5 data points
        let highlightGlow = false;
        this.eventsData.forEach(event => {
            const eventIndex = this.terrainData.findIndex(d => d.date_unix === event.date_unix);
            if (eventIndex !== -1) {
                const distance = eventIndex - Math.floor(terrainOffset);
                if (distance > 0 && distance <= 5) { // Event within next 5 data points
                    highlightGlow = true;
                }
            }
        });

        // Adjust line styles with updated thicknesses
        if (highlightGlow) {
            this.terrainGraphics.lineStyle(this.highlightGlowThickness, this.priceLineColor, this.highlightGlowAlpha);
        } else {
            this.terrainGraphics.lineStyle(this.glowThickness, this.priceLineColor, this.defaultGlowAlpha);
        }

        this.terrainGraphics.beginPath();
        let firstPoint = true;

        for (let i = 0; i < this.visibleDataPoints; i++) {
            const dataIndex = Math.min(startIndex + i, this.terrainData.length - 1);
            const data = this.terrainData[dataIndex];

            if (!data || data.ma_7 === null || isNaN(data.ma_7)) {
                continue;
            }

            const x = (i / this.visibleDataPoints) * visibleWidth;
            const y = topMargin + adjustedHeight - ((data.ma_7 - adjustedMinPrice) / (adjustedMaxPrice - adjustedMinPrice)) * adjustedHeight;

            if (firstPoint) {
                this.terrainGraphics.moveTo(x, y);
                firstPoint = false;
            } else {
                this.terrainGraphics.lineTo(x, y);
            }

            if (i === Math.floor(this.visibleDataPoints / 2)) {
                this.updateDateText(data);
            }
        }

        this.terrainGraphics.strokePath();

        // Draw the main price line on top of the glow
        this.terrainGraphics.lineStyle(this.lineThickness, this.priceLineColor, 1);
        this.terrainGraphics.beginPath();
        firstPoint = true;

        for (let i = 0; i < this.visibleDataPoints; i++) {
            const dataIndex = Math.min(startIndex + i, this.terrainData.length - 1);
            const data = this.terrainData[dataIndex];

            if (!data || data.ma_7 === null || isNaN(data.ma_7)) {
                continue;
            }

            const x = (i / this.visibleDataPoints) * visibleWidth;
            const y = topMargin + adjustedHeight - ((data.ma_7 - adjustedMinPrice) / (adjustedMaxPrice - adjustedMinPrice)) * adjustedHeight;

            if (firstPoint) {
                this.terrainGraphics.moveTo(x, y);
                firstPoint = false;
            } else {
                this.terrainGraphics.lineTo(x, y);
            }

            if (i === Math.floor(this.visibleDataPoints / 2)) {
                this.updateDateText(data);
            }
        }

        this.terrainGraphics.strokePath();

        try {
            this.drawDates(startIndex, endIndex, adjustedMinPrice, adjustedMaxPrice);
            this.drawPriceValues(minPrice, maxPrice, height);
        } catch (error) {
            console.error('Error in draw method:', error);
        }
    }

    // ... (Rest of the Terrain.js code remains unchanged)

    updateDateText(data) {
        if (this.scene.uiManager && data) {
            try {
                const date = new Date(data.date_unix).toLocaleDateString();
                this.scene.uiManager.updateDateText(`Date: ${date}`, data.ma_7); // Pass number
            } catch (error) {
                console.error('Error updating date text:', error);
            }
        }
    }

    drawDates(startIndex, endIndex, minPrice, maxPrice) {
        const visibleWidth = this.scene.scale.width;
        const dateInterval = Math.floor(this.visibleDataPoints / 5);

        // Initialize date texts if not already done
        if (!this.dateTextsInitialized) {
            for (let i = 0; i <= 5; i++) {
                const text = this.scene.add.text(0, 0, '', {
                    fontSize: '16px',
                    fill: '#ff00ff', // Set to price line color
                    fontFamily: 'Roboto, sans-serif',
                    align: 'center'
                }).setOrigin(0.5, 0);
                this.dateTexts.push(text);
            }
            this.dateTextsInitialized = true;
        }

        for (let i = 0; i <= 5; i++) {
            const dataIndex = Math.min(startIndex + i * dateInterval, this.terrainData.length - 1);
            const data = this.terrainData[dataIndex];
            if (!data || !data.date_unix) continue;
            const date = new Date(data.date_unix).toLocaleDateString();
            const x = (i * visibleWidth) / 5;
            const y = this.scene.sys.game.config.height - 20;

            try {
                this.dateTexts[i].setText(date);
                this.dateTexts[i].setPosition(x, y);
                this.dateTexts[i].setFill('#ff00ff'); // Ensure color consistency
            } catch (error) {
                console.warn('Failed to update date text:', error);
            }
        }
    }

    drawPriceValues(minPrice, maxPrice, height) {
        const priceRange = maxPrice - minPrice;
        const adjustedMinPrice = Math.max(0, minPrice - priceRange * 0.1);
        const adjustedMaxPrice = maxPrice + priceRange * 0.1;

        const numPricePoints = 5;

        // Initialize price texts if not already done
        if (!this.priceTextsInitialized) {
            for (let i = 0; i < numPricePoints; i++) {
                const text = this.scene.add.text(0, 0, '', {
                    fontSize: '16px',
                    fill: '#ff00ff', // Set to price line color
                    fontFamily: 'Roboto, sans-serif',
                    align: 'right'
                });
                this.priceTexts.push(text);
            }
            this.priceTextsInitialized = true;
        }

        for (let i = 0; i < numPricePoints; i++) {
            const price = adjustedMinPrice + (adjustedMaxPrice - adjustedMinPrice) * (i / (numPricePoints - 1));
            const y = height - (height * (i / (numPricePoints - 1)));
            this.priceTexts[i].setText(`$${price.toFixed(2)}`);
            this.priceTexts[i].setPosition(this.scene.scale.width - 60, y - this.priceTexts[i].height / 2); // Positioned on the right side
            this.priceTexts[i].setFill('#ff00ff'); // Ensure color consistency
        }
    }

    calculateTerrainY(data, terrainOffset) {
        if (!data || data.ma_7 === null || isNaN(data.ma_7)) {
            return this.scene.sys.game.config.height;
        }

        const startIndex = Math.max(0, Math.floor(terrainOffset));
        const endIndex = Math.min(startIndex + this.visibleDataPoints, this.terrainData.length - 1);
        const visiblePrices = this.terrainData.slice(startIndex, endIndex + 1)
            .map(d => d.ma_7)
            .filter(price => price !== null && !isNaN(price));

        if (visiblePrices.length === 0) {
            return this.scene.sys.game.config.height;
        }

        const minPrice = Math.min(...visiblePrices);
        const maxPrice = Math.max(...visiblePrices);
        const priceRange = maxPrice - minPrice;
        const adjustedMinPrice = Math.max(0, minPrice - priceRange * 0.25);
        const adjustedMaxPrice = maxPrice + priceRange * 0.25;

        const height = this.scene.scale.height;
        const topMargin = height * this.topMarginPercentage;
        const adjustedHeight = height - topMargin;

        return topMargin + ((adjustedMaxPrice - data.ma_7) / (adjustedMaxPrice - adjustedMinPrice)) * adjustedHeight;
    }

    clear() {
        if (this.terrainGraphics) {
            this.terrainGraphics.clear();
        }

        if (this.dateTextsInitialized) {
            this.dateTexts.forEach(text => text.destroy());
            this.dateTexts = [];
            this.dateTextsInitialized = false;
        }

        if (this.priceTextsInitialized) {
            this.priceTexts.forEach(text => text.destroy());
            this.priceTexts = [];
            this.priceTextsInitialized = false;
        }
    }

    recreateGraphics() {
        this.terrainGraphics = this.scene.add.graphics();
        this.dateTextsInitialized = false;
        this.priceTextsInitialized = false;
        this.draw(this.scene.terrainOffset);
    }
}
