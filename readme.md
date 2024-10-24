# Bitcoin Price Runner

Bitcoin Price Runner is an interactive web-based game that simulates the Bitcoin price journey. Players navigate through historical Bitcoin price movements, avoiding obstacles, collecting bonuses, and experiencing the volatility of the cryptocurrency market firsthand.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Backend](#backend)
3. [Frontend](#frontend)
4. [Game Mechanics](#game-mechanics)
5. [Database](#database)
6. [Redis Usage](#redis-usage)
7. [Installation and Setup](#installation-and-setup)
8. [Game Tuning Parameters](#game-tuning-parameters)
9. [Future Optimizations and Enhancements](#future-optimizations-and-enhancements)

## Project Overview

Bitcoin Price Runner combines historical Bitcoin price data with interactive gameplay. The game uses Flask for the backend, Phaser for the game engine, and vanilla JavaScript for frontend interactions. It features a responsive design, leaderboard functionality, and various game elements representing Bitcoin market events and challenges.

## Backend

The backend is built using Flask and includes the following key components:

- `app.py`: Main Flask application
- `config.py`: Configuration settings for different environments
- `utils.py`: Utility functions for data processing
- `models.py`: Database models for the leaderboard

### Key Features:

1. **Data Processing**: Fetches and processes historical Bitcoin data
2. **API Endpoints**: Provides data for terrain, obstacles, events, and enemies
3. **Caching**: Implements caching to improve performance
4. **Database Integration**: Manages leaderboard entries
5. **Error Handling**: Comprehensive error handling and logging

### API Endpoints:

- `/terrain_data`: Provides Bitcoin price data for game terrain
- `/obstacles_data`: Supplies obstacle data for the game
- `/bitcoin_events`: Delivers Bitcoin-related events data
- `/enemies_data`: Provides enemy data for the game
- `/leaderboard`: Retrieves leaderboard data
- `/submit_score`: Endpoint for submitting player scores

## Frontend

The frontend consists of HTML templates and JavaScript files:

### HTML Templates:
- `index.html`: Landing page
- `game.html`: Main game page

### JavaScript Files:
- `main.js`: Entry point for the Phaser game
- `GameScene.js`: Main game scene handling game logic
- `leaderboard.js`: Manages leaderboard functionality

### Key Components:

1. **Game Entities**: Player, Terrain, Obstacles, Events, Enemies
2. **Managers**: UIManager, InputHandler, DataManager, BackgroundManager
3. **Responsive Design**: Adapts to different screen sizes
4. **Error Handling**: Manages and displays errors gracefully

## Game Mechanics

1. **Terrain**: Represents Bitcoin price movements
2. **Player**: Navigates through the price terrain
3. **Obstacles**: Represent market drawdowns
4. **Events**: Positive and negative Bitcoin events affecting score
5. **Enemies**: Altcoin distractors and Fiat maxis to be defeated
6. **Scoring**: Based on price movements and player actions

## Database

The project uses SQLAlchemy as an ORM and supports both development and production environments:

- **Development**: SQLite database
- **Production**: PostgreSQL database

The database stores leaderboard entries, including player names, scores, and timestamps.

## Redis Usage

Redis is utilized for:

1. **Rate Limiting**: Implements distributed rate limiting for API endpoints
2. **Caching**: Used as a caching backend in production for improved performance
3. **Session Management**: Potential use for centralized session storage in a distributed environment

The application checks for Redis availability and falls back to local alternatives when Redis is not available, providing flexibility for different deployment scenarios.

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables (refer to `.env.example`)
4. Initialize the database:
   ```
   flask db init
   flask db migrate
   flask db upgrade
   ```
5. Run the application:
   ```
   python app.py
   ```

## Game Tuning Parameters

Game parameters can be adjusted to modify difficulty and gameplay experience:

1. **Scroll Speed**: Adjust `baseScrollSpeed` in GameScene.js
2. **Player Jump Strength**: Modify `jumpVelocity` in Player.js
3. **Obstacle Frequency**: Change `obstacleHeightOffsetFactor` in GameScene.js
4. **Enemy Spawn Rate**: Adjust `spawnInterval` in Enemies2.js
5. **Score Multipliers**: Modify `enemyPoints` in GameScene.js
6. **Lives**: Change `initialLives` in GameScene.js

Example of adjusting scroll speed:

## Future Optimizations and Enhancements

1. **WebSocket Integration**: Implement real-time updates for leaderboard and multiplayer features
2. **Asset Optimization**: Implement lazy loading and sprite atlases for improved performance
3. **Mobile App Version**: Develop native mobile apps for iOS and Android
4. **Machine Learning Integration**: Implement AI-driven enemies or dynamic difficulty adjustment
5. **Blockchain Integration**: Add features to interact with actual Bitcoin transactions or Lightning Network
6. **Expanded Events**: Include more historical and real-time Bitcoin events
7. **Social Features**: Add sharing capabilities and friend challenges
8. **Localization**: Implement multi-language support
9. **Advanced Analytics**: Integrate detailed player statistics and gameplay analysis
10. **VR/AR Support**: Develop virtual or augmented reality versions of the game

These enhancements would further improve the game's performance, engagement, and educational value in the cryptocurrency space.
