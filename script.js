const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
const keys = {};
const notes = [];
const noteWidth = 50;
const noteHeight = 20;
let noteSpeed = 2; // Default speed, will change with difficulty
const columns = 4;
let gameStarted = false;
let score = 0;
let streak = 0;
let maxStreak = 0;
let totalNotes = 0;
let hitNotes = 0;
let isPaused = false;
let gameEnded = false;
let noteInterval;
let endCheckInterval;

// Get URL parameters for song and difficulty
const urlParams = new URLSearchParams(window.location.search);
const song = urlParams.get('song');
const difficulty = urlParams.get('difficulty');

// Adjust note speed based on difficulty
switch(difficulty) {
    case 'easy':
        noteSpeed = 2;
        break;
    case 'medium':
        noteSpeed = 4;
        break;
    case 'hard':
        noteSpeed = 6;
        break;
    case 'ultrahard':
        noteSpeed = 12;
        break;
}

// Key mappings
const keyMapping = {
    'a': 0,
    's': 1,
    'd': 2,
    'f': 3
};

const columnColors = {
    'a': '#ffb3b3',
    's': '#b3ffb3',
    'd': '#b3b3ff',
    'f': '#f3b3ff'
};

// Load music
const audio = new Audio(`sounds/${song}.mp3`);
audio.crossOrigin = 'anonymous';
audio.preload = 'auto';
audio.onerror = () => console.error('Failed to load the song file:', audio.src);

// Load sound effects
const soundEffects = {
    hit: new Audio('sounds/hit.mp3'),
    miss: new Audio('sounds/miss.mp3')
};

// Adjust volumes
soundEffects.hit.volume = 1; // Full volume for hit sound
soundEffects.miss.volume = 1; // Full volume for miss sound
audio.volume = 0.5; // Lower volume for background music

// Ensure game starts only after user interaction
window.addEventListener('load', () => {
    document.addEventListener('click', () => {
        if (!gameStarted) {
            gameStarted = true;
            audio.play().catch(error => {
                console.error('Playback failed:', error);
            });
            startNoteGeneration();
            gameLoop();
        }
    }, { once: true });
});

// Create a note
function createNote() {
    const key = Object.keys(keyMapping)[Math.floor(Math.random() * columns)];
    const note = {
        x: (canvas.width / columns) * keyMapping[key] + (canvas.width / columns) / 2 - noteWidth / 2,
        y: 0,
        width: noteWidth,
        height: noteHeight,
        color: columnColors[key]
    };
    notes.push(note);
    totalNotes++;
}

// Update game logic
function update() {
    if (isPaused || gameEnded) return; // Pause or end game updates

    // Move notes and check for collisions
    notes.forEach(note => {
        note.y += noteSpeed; // Move note down
        if (note.y > canvas.height) {
            // Note missed
            notes.splice(notes.indexOf(note), 1);
            soundEffects.miss.play(); // Play miss sound
            resetStreak();
        }
    });

    // Check for key presses
    Object.keys(keyMapping).forEach(key => {
        if (keys[key]) {
            notes.forEach(note => {
                if (Math.abs(note.x - keyMapping[key] * (canvas.width / columns) - (canvas.width / columns) / 2 + noteWidth / 2) < noteWidth / 2 && note.y > canvas.height - 100) {
                    // Note hit
                    notes.splice(notes.indexOf(note), 1);
                    soundEffects.hit.play(); // Play hit sound
                    score += 10; // Increase score
                    hitNotes++;
                    streak += 1; // Increase streak
                    if (streak > maxStreak) maxStreak = streak;
                    // Add color pop effect
                    showColorPop(note.x, note.y, note.color);
                }
            });
        }
    });

    draw();
    updateScore();
    updateStreak();
}

// Show a color pop effect
function showColorPop(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + noteWidth / 2, y + noteHeight / 2, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw notes
    notes.forEach(note => {
        ctx.fillStyle = note.color;
        ctx.fillRect(note.x, note.y, note.width, note.height);
    });

    // Draw key mappings for reference
    ctx.fillStyle = 'gray';
    for (let i = 0; i < columns; i++) {
        const x = (canvas.width / columns) * i + (canvas.width / columns) / 2 - noteWidth / 2;
        ctx.fillRect(x, canvas.height - 20, noteWidth, 10);
    }
}

// Update score display
function updateScore() {
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
}

// Update streak display
function updateStreak() {
    document.getElementById('streakDisplay').textContent = `Streak: ${streak}x`;
}

// Reset streak on miss
function resetStreak() {
    streak = 0;
}

// Handle keyboard input
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'p') {
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        audio.pause();
    } else {
        audio.play();
        gameLoop(); // Resume game loop
    }
}

// Generate notes at regular intervals
function startNoteGeneration() {
    noteInterval = setInterval(createNote, 1000); // Create a note every second
    // Schedule end game at the end of the song
    setTimeout(endGame, audio.duration * 1000);
}

// Check if the game should end
function checkGameEnd() {
    if (audio.ended && notes.length === 0) {
        endGame();
    }
}

// End the game
function endGame() {
    clearInterval(noteInterval);
    clearInterval(endCheckInterval);
    gameEnded = true;
    showGameOverScreen();
}

// Show game over screen
function showGameOverScreen() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'gameOverScreen';
    gameOverScreen.style.position = 'absolute';
    gameOverScreen.style.top = '50%';
    gameOverScreen.style.left = '50%';
    gameOverScreen.style.transform = 'translate(-50%, -50%)';
    gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverScreen.style.color = 'white';
    gameOverScreen.style.padding = '20px';
    gameOverScreen.style.borderRadius = '10px';
    gameOverScreen.style.textAlign = 'center';

    const accuracy = totalNotes === 0 ? '0.00' : ((hitNotes / totalNotes) * 100).toFixed(2);

    gameOverScreen.innerHTML = `
        <h2>Game Over</h2>
        <p>Score: ${score}</p>
        <p>Max Streak: ${maxStreak}</p>
        <p>Notes Hit: ${hitNotes} / ${totalNotes}</p>
        <p>Accuracy: ${accuracy}%</p>
        <button onclick="replay()">Play Again</button>
        <button onclick="goToSongSelection()">Select Another Song</button>
    `;
    document.body.appendChild(gameOverScreen);
}

// Replay the current song
function replay() {
    window.location.reload();
}

// Go back to the song selection screen
function goToSongSelection() {
    window.location.href = 'index.html';
}

// Game loop
function gameLoop() {
    if (!isPaused && !gameEnded) {
        update();
        requestAnimationFrame(gameLoop);
    }
}

// Start checking for game end when the audio starts
audio.addEventListener('play', () => {
    endCheckInterval = setInterval(checkGameEnd, 100);
});

// Show settings panel
function showSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.style.display = 'block';
}

// Save settings
function saveSettings() {
    const column1Key = document.getElementById('column1Key').value;
    const column2Key = document.getElementById('column2Key').value;
    const column3Key = document.getElementById('column3Key').value;
    const column4Key = document.getElementById('column4Key').value;

    keyMapping[column1Key] = 0;
    keyMapping[column2Key] = 1;
    keyMapping[column3Key] = 2;
    keyMapping[column4Key] = 3;

    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.style.display = 'none';
}

// Automatically start the game when the audio is ready to play
audio.addEventListener('canplaythrough', () => {
    // Automatically start the game when the audio is ready to play
    gameStarted = true;
    audio.play().catch(error => console.error('Playback failed:', error));
    startNoteGeneration();
    gameLoop();
});
