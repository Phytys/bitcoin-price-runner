// static/js/game/managers/BackgroundManager.js

export default class BackgroundManager {
    constructor(scene) {
        this.scene = scene;
        this.createBackground();
    }

    createBackground() {
        // Load and add the background image
        this.background = this.scene.add.image(
            0,
            0,
            'background'
        ).setOrigin(0, 0);

        // Scale the background to fill the screen
        const scaleX = this.scene.scale.width / this.background.width;
        const scaleY = this.scene.scale.height / this.background.height;
        const scale = Math.max(scaleX, scaleY);
        this.background.setScale(scale).setScrollFactor(0);

        // Set depth to ensure background is behind other elements
        this.background.setDepth(-10);
    }

    resize() {
        if (this.background) {
            this.background.destroy();
            this.createBackground();
        }
    }

    clear() {
        if (this.background) {
            this.background.destroy();
        }
    }
}
