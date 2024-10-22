// DataManager.js

export default class DataManager {
    constructor(scene) {
        this.scene = scene;
        this.terrainData = [];
        this.obstaclesData = [];
        this.eventsData = []; // Add this line
        this.enemiesData = []; // Add this line
    }

    async fetchTerrainData() {
        console.log('Fetching terrain data');
        try {
            const response = await fetch('/terrain_data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            this.terrainData = data.filter(d => d.ma_7 != null && !isNaN(d.ma_7));
            console.log('Terrain data received:', this.terrainData.length, 'points');
            return this.terrainData;
        } catch (error) {
            console.error('Error fetching terrain data:', error);
            throw error;
        }
    }

    async fetchObstaclesData() {
        console.log('Fetching obstacles data');
        try {
            const response = await fetch('/obstacles_data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            this.obstaclesData = data;
            console.log('Obstacles data received:', this.obstaclesData.length, 'obstacles');
            return this.obstaclesData;
        } catch (error) {
            console.error('Error fetching obstacles data:', error);
            throw error;
        }
    }

    // Add this method
    async fetchBitcoinEventsData() {
        console.log('Fetching Bitcoin events data');
        try {
            const response = await fetch('/bitcoin_events');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            this.eventsData = data;
            console.log('Bitcoin events data received:', this.eventsData.length, 'events');
            return this.eventsData;
        } catch (error) {
            console.error('Error fetching Bitcoin events data:', error);
            this.scene.handleError(error);
            return [];
        }
    }

    async fetchEnemiesData() {
        console.log('Fetching enemies data');
        try {
            const response = await fetch('/enemies_data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            // Add isAlive property to each enemy data object
            this.enemiesData = data.map(enemyData => {
                enemyData.isAlive = true; // Enemy is alive by default
                return enemyData;
            });
            console.log('Enemies data received:', this.enemiesData.length, 'enemies');
            return this.enemiesData;
        } catch (error) {
            console.error('Error fetching enemies data:', error);
            throw error;
        }
    }

}
