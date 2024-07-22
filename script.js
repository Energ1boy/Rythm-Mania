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
const noteSpeedFactor = {
    'easy': 2,
    'medium': 4,
    'hard': 6
}; // Speed factors for different difficulties
const columns = 4; // Number of columns
let gameStarted = false;
let score = 0;
let streak = 0;
let maxStreak = 0;
let isPaused = false;

// Default key mappings
const defaultKeyMapping = {
    'a': 1,
    's': 2,
    'd': 3,
    'f': 4
};

// Initialize key mappings with default values
let keyMapping = {};

// Set column spacing
function setColumnSpacing() {
    const columnSpacing = (canvas.width - (noteWidth * columns)) / (columns + 1);
    keyMapping = {
        'a': columnSpacing,
        's': columnSpacing * 2 + noteWidth,
        'd': columnSpacing * 3 + noteWidth * 2,
        'f': columnSpacing * 4 + noteWidth * 3
    };
}

// Define note positions, key mappings, and pastel colors
const columnColors = {
    'a': '#ffb3b3',  // Pastel Red
    's': '#b3ffb3',  // Pastel Green
    'd': '#b3b3ff',  // Pastel Blue
    'f': '#f3b3ff'   // Pastel Purple
};

// Load music and sound effects
const audio = new Audio('sounds/song.mp3');
audio.crossOrigin = 'anonymous';
audio.preload = 'auto';
audio.volume = 0.3; // Lower volume for background music
audio.onerror = () => console.error('Failed to load the song file.');

const soundEffects = {
    hit: new Audio('sounds/hit.mp3'),
    miss: new Audio('sounds/miss.mp3')
};
soundEffects.hit.volume = 1; // Maximum volume for hit sound
soundEffects.miss.volume = 1; // Maximum volume for miss sound

// Extract difficulty from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const difficulty = urlParams.get('difficulty') || 'medium';
const noteSpeed = noteSpeedFactor[difficulty];

// Ensure game starts only after user interaction
window.addEventListener('load', () => {
    setColumnSpacing(); // Initialize column spacing and key mapping
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
        x: keyMapping[key],
        y: 0,
        width: noteWidth,
        height: noteHeight,
        color: columnColors[key]
    };
    notes.push(note);
}

// Update game logic
function update() {
    if (isPaused) return; // Pause game updates

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
                if (Math.abs(note.x - keyMapping[key]) < noteWidth / 2 && note.y > canvas.height - 100) {
                    // Note hit
                    notes.splice(notes.indexOf(note), 1);
                    soundEffects.hit.play(); // Play hit sound
                    score += 10; // Increase score
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
    Object.values(keyMapping).forEach(x => {
        ctx.fillRect(x, canvas.height - 20, noteWidth, 10);
    });

    // Draw pause button
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// Update score display
function updateScore() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${score}`;
    }
}

// Update streak display
function updateStreak() {
    const streakDisplay = document.getElementById('streakDisplay');
    if (streakDisplay) {
        streakDisplay.textContent = `Streak: ${streak}x`;
    }
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
        audio.play().catch(error => {
            console.error('Failed to resume audio:', error);
        });
        requestAnimationFrame(gameLoop); // Resume game loop
    }
}

// Generate notes at regular intervals
function startNoteGeneration() {
    setInterval(createNote, 1000); // Create a note every second
}

// Game loop
function gameLoop() {
    if (!isPaused) {
        update();
        requestAnimationFrame(gameLoop);
    }
}

// Save settings
function saveSettings() {
    const column1Key = document.getElementById('column1Key').value;
    const column2Key = document.getElementById('column2Key').value;
    const column3Key = document.getElementById('column3Key').value;
    const column4Key = document.getElementById('column4Key').value;

    if (column1Key && column2Key && column3Key && column4Key) {
        keyMapping = {
            [column1Key]: keyMapping['a'],
            [column2Key]: keyMapping['s'],
            [column3Key]: keyMapping['d'],
            [column4Key]: keyMapping['f']
        };
    }
    document.getElementById('settingsPanel').style.display = 'none';
}

// Open settings panel
document.getElementById('settingsButton').addEventListener('click', () => {
    document.getElementById('settingsPanel').style.display = 'block';
});

// Close settings panel
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('settingsPanel').style.display = 'none';
    }
});
