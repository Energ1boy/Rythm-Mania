const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const columns = 4;
const noteRadius = 40; // Radius of the falling circles
const hitCircleRadius = 40; // Radius of the hit detection circle
let noteSpeed = 2; // Default speed, will change with difficulty
const keys = {};
const notes = [];
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

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth * 1.0;
    canvas.height = window.innerHeight * 1.0;
}

// Adjust column spacing after setting canvas size
function updateColumnSpacing() {
    return canvas.width / (columns + 0.7);
}

// Adjust canvas size and column spacing
resizeCanvas();
const columnSpacing = updateColumnSpacing();

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
let keyMapping = {
    'a': 0,
    's': 1,
    'd': 2,
    'f': 3
};

const columnColors = {
    'a': '#ffb3b3', // Light red
    's': '#b3ffb3', // Light green
    'd': '#b3b3ff', // Light blue
    'f': '#f3b3ff'  // Light purple
};

// Hit circle colors
const hitCircleColors = {
    'a': '#ff9999', // Darker light red
    's': '#99ff99', // Darker light green
    'd': '#9999ff', // Darker light blue
    'f': '#d9aaff'  // Darker light purple
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
audio.volume = 0.3; // Lower volume for background music

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
        x: updateColumnSpacing() * (keyMapping[key] + 1),
        y: -noteRadius, // Start offscreen
        radius: noteRadius,
        color: columnColors[key],
        column: keyMapping[key],
        hit: false // Flag to track if note has been hit
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
        if (note.y > canvas.height + note.radius) {
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
                if (!note.hit && note.column === keyMapping[key] &&
                    Math.abs(note.x - updateColumnSpacing() * (note.column + 1)) < note.radius &&
                    note.y > canvas.height - hitCircleRadius) {
                    // Note hit
                    note.hit = true; // Mark note as hit
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
    ctx.arc(x, y, 25, 0, Math.PI * 2); // Adjusted size for color pop
    ctx.fill();
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw notes
    notes.forEach(note => {
        ctx.fillStyle = note.color;
        ctx.beginPath();
        ctx.arc(note.x, note.y, note.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw hit circles
    Object.keys(keyMapping).forEach(key => {
        const columnX = updateColumnSpacing() * (keyMapping[key] + 1);
        const circleY = canvas.height - hitCircleRadius + 5; // Adjust Y position

        // Ensure hit circles are fully visible and at the bottom
        ctx.fillStyle = keys[key] ? hitCircleColors[key] : 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(columnX, circleY, hitCircleRadius, 0, Math.PI * 2);
        ctx.fill();
    });
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

    // Populate current key values
    document.getElementById('column1Key').value = getKeyFromValue(0);
    document.getElementById('column2Key').value = getKeyFromValue(1);
    document.getElementById('column3Key').value = getKeyFromValue(2);
    document.getElementById('column4Key').value = getKeyFromValue(3);
}

// Save settings
function saveSettings() {
    const column1Key = document.getElementById('column1Key').value;
    const column2Key = document.getElementById('column2Key').value;
    const column3Key = document.getElementById('column3Key').value;
    const column4Key = document.getElementById('column4Key').value;

    // Update keyMapping
    keyMapping = {
        [column1Key]: 0,
        [column2Key]: 1,
        [column3Key]: 2,
        [column4Key]: 3
    };

    // Update column colors and hit circle colors to reflect new keys
    columnColors[column1Key] = '#ffb3b3'; // Light red
    columnColors[column2Key] = '#b3ffb3'; // Light green
    columnColors[column3Key] = '#b3b3ff'; // Light blue
    columnColors[column4Key] = '#f3b3ff'; // Light purple

    hitCircleColors[column1Key] = '#ff9999'; // Darker light red
    hitCircleColors[column2Key] = '#99ff99'; // Darker light green
    hitCircleColors[column3Key] = '#9999ff'; // Darker light blue
    hitCircleColors[column4Key] = '#d9aaff'; // Darker light purple

    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.style.display = 'none';

    // Reset the game to apply changes
    if (gameStarted) {
        notes.length = 0; // Clear existing notes
        score = 0;
        streak = 0;
        maxStreak = 0;
        totalNotes = 0;
        hitNotes = 0;
        startNoteGeneration(); // Restart note generation
    }
}

// Get the key from the value in keyMapping
function getKeyFromValue(value) {
    return Object.keys(keyMapping).find(key => keyMapping[key] === value);
}

// Automatically start the game when the audio is ready to play
audio.addEventListener('canplaythrough', () => {
    if (!gameStarted) {
        gameStarted = true;
        audio.play().catch(error => console.error('Playback failed:', error));
        startNoteGeneration();
        gameLoop();
    }
});
