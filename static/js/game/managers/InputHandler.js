// static/js/game/managers/InputHandler.js

export default class InputHandler {
    constructor(scene) {
        this.scene = scene;

        // Keyboard input
        this.initializeKeyboardInput();

        // Touch and mouse input
        this.initializePointerInput();

        // Game control buttons
        this.initializeGameControlButtons();
    }

    initializeKeyboardInput() {
        // Add an event listener for the 'keydown-SPACE' event
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            this.handleShoot();
        });

        // Add event listener for the 'keydown-UP' event for jumping
        this.scene.input.keyboard.on('keydown-UP', () => {
            this.handleJump();
        });
    }

    initializePointerInput() {
        const addButtonFeedback = (button) => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.92)';
            });
            button.addEventListener('touchend', () => {
                button.style.transform = 'scale(1)';
            });
        };

        const shootButton = document.getElementById('shoot-button');
        const jumpButton = document.getElementById('jump-button');

        if (shootButton) {
            addButtonFeedback(shootButton);
            shootButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                this.handleShoot();
            });
        }

        if (jumpButton) {
            addButtonFeedback(jumpButton);
            jumpButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                this.handleJump();
            });
        }

        // Handle jumping when the game canvas is clicked or tapped
        this.scene.input.on('pointerdown', (pointer) => {
            // If the pointer is not over any UI elements, make the player jump
            if (!pointer.wasTouch || !this.isPointerOverUIButton(pointer)) {
                this.handleJump();
            }
        });
    }

    isPointerOverUIButton(pointer) {
        // Check if the pointer is over any UI buttons
        const elements = ['shoot-button', 'jump-button', 'start-stop-button', 'pause-resume-button', 'speed-slider'];
        for (let id of elements) {
            const element = document.getElementById(id);
            if (element) {
                const bounds = element.getBoundingClientRect();
                if (
                    pointer.x >= bounds.left &&
                    pointer.x <= bounds.right &&
                    pointer.y >= bounds.top &&
                    pointer.y <= bounds.bottom
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    initializeGameControlButtons() {
        // Start/Stop button
        const startStopButton = document.getElementById('start-stop-button');
        if (startStopButton) {
            startStopButton.addEventListener('click', () => {
                if (this.scene.isGameRunning) {
                    this.scene.stopGame();
                    this.updateStartStopButtonText('Start');
                } else {
                    this.scene.startGame();
                    this.updateStartStopButtonText('Stop');
                }
            });
        }

        // Pause/Resume button
        const pauseResumeButton = document.getElementById('pause-resume-button');
        if (pauseResumeButton) {
            pauseResumeButton.addEventListener('click', () => {
                this.scene.togglePause();
                this.updatePauseResumeButtonText(this.scene.scene.isPaused());
            });
        }

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value);
                this.scene.userSpeed = value;
                this.scene.scrollSpeed = this.scene.baseScrollSpeed * value;
                const speedValueDisplay = document.getElementById('speed-value');
                if (speedValueDisplay) {
                    speedValueDisplay.textContent = `${value.toFixed(1)}x`;
                }
            });
        }
    }

    handleShoot() {
        if (this.scene.isGameRunning && !this.scene.gameOver && !this.scene.gameCompleted) {
            // Handle shooting
            this.scene.bullets.shoot(
                this.scene.player.sprite.x + this.scene.player.sprite.displayWidth / 2,
                this.scene.player.sprite.y - this.scene.player.sprite.displayHeight / 2
            );
        }
    }

    handleJump() {
        if (this.scene.isGameRunning && !this.scene.gameOver && !this.scene.gameCompleted) {
            this.scene.jump();
        }
    }

    update() {
        // No need to check for input here since we're using event listeners
    }

    updateStartStopButtonText(text) {
        const startStopButton = document.getElementById('start-stop-button');
        if (startStopButton) {
            startStopButton.textContent = text;
        }
    }

    updatePauseResumeButtonText(isPaused) {
        const pauseResumeButton = document.getElementById('pause-resume-button');
        if (pauseResumeButton) {
            pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause';
        }
    }

    setButtonState(enabled) {
        const buttons = [
            document.getElementById('shoot-button'),
            document.getElementById('start-stop-button'),
            document.getElementById('pause-resume-button'),
            document.getElementById('jump-button')
        ];
        buttons.forEach(button => {
            if (button) {
                button.disabled = !enabled;
            }
        });
    }

    disableSpeedSlider(disabled) {
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.disabled = disabled;
        }
    }

    resetSpeedSlider() {
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.value = 1.0;
            const event = new Event('input');
            speedSlider.dispatchEvent(event);
        }
    }
}
