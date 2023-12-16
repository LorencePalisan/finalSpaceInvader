const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverMp3 = document.getElementById('gameOver');
const hitSound = document.getElementById('hitSound');
const winSound = document.getElementById('win');
const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.2;
hitSound.volume = 0.9;
ctx.fillStyle = '#ffffff';
ctx.font = '20px Arial';
ctx.fillText('Press Space Bar To Start', canvas.width / 2 - 130, canvas.height / 2 - 10);
// Player object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    color: '#FF0000',
    speed: 3,
    hp: 20,
};

// Boss enemy object
const bossEnemy = {
    isBoss: false,
    health: 1500,
    x: 0,
    y: 0,
    width: 600, // Assuming a width for the boss
    height: 200, // Assuming a height for the boss
};

// Enemy array
const enemies = [];

// Game variables
let gameStarted = false;
let gameOver = false;

// Projectiles array
const projectiles = [];

// Game variables
let startTime = new Date().getTime();
let spawnInterval = 5000; // Initial spawn interval in milliseconds
let lastProjectileTime = new Date().getTime(); // Time elapsed since the last projectile

// Kill counter
let killCounter = 0;

// Boss movement speed
const bossMovementSpeed = 3; // Adjust the speed as needed

// Load the enemy image
const playerImage = new Image();
playerImage.src = 'player.png';
const enemyImage = new Image();
enemyImage.src = 'slime.png';
const bossImage = new Image();
bossImage.src = 'boss.png';

// Set the initial size of the enemy image
let enemyImageWidth = 30;
let enemyImageHeight = 40;

function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function drawEnemies() {
    for (const enemy of enemies) {
        ctx.drawImage(
            enemy.isBoss ? bossImage : enemyImage, // Fix the typo here
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );
        if (enemy.isBoss) {
            // Draw boss health bar
            ctx.fillStyle = '#00FF00';
            const healthBarWidth = (enemy.health / 50) * enemy.width;
            ctx.fillRect(enemy.x, enemy.y - 10, healthBarWidth, 5);
        }
    }
}


function drawProjectiles() {
    ctx.fillStyle = '#00FF00';
    for (const projectile of projectiles) {
        ctx.fillRect(
            projectile.x,
            projectile.y,
            projectile.width,
            projectile.height
        );
    }
}

function updatePlayer() {
    if (keysPressed['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keysPressed['ArrowRight'] && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
}

function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        if (checkCollision(player, enemy)) {
            // Player is colliding with an enemy
            if (!enemy.isColliding) {
                enemy.isColliding = true; // Mark enemy as colliding

                // Game over if player collides with an enemy
                gameOverMp3.play();
                gameOver = true;
                player.hp -= 2; // Decrease player HP

                if (player.hp <= 0) {
                    alert(
                        'Game Over! Time: ' +
                        getElapsedTimeInSeconds() +
                        ' seconds. Kills: ' +
                        killCounter
                    );
                    resetGame();
                }
            }
        } else {
            // Player is not colliding with this enemy
            enemy.isColliding = false;
        }

        if (enemy.isBoss) {
            // Boss behavior...
            if (checkCollision(player, enemy)) {
                // Game over if player collides with the boss
                gameOverMp3.play();
                gameOver = true;
                player.hp -= 2; // Decrease player HP
                if (player.hp <= 0) {
                    alert(
                        'Game Over! Time: ' +
                        getElapsedTimeInSeconds() +
                        ' seconds. Kills: ' +
                        killCounter
                    );
                    resetGame();
                }
            } else {
                // Move the boss left or right randomly
                const moveDirection = Math.random() < 0.5 ? -1 : 1;
                enemy.x += moveDirection * bossMovementSpeed;

                // Ensure the boss stays within the canvas boundaries
                if (enemy.x < 0) {
                    enemy.x = 0;
                } else if (enemy.x + enemy.width > canvas.width) {
                    enemy.x = canvas.width - enemy.width;
                }
            }
        } else {
            // Regular enemy behavior...
            enemy.y += 1; // Move regular enemies down
            if (enemy.y > canvas.height) {
                // Remove regular enemies when they go out of the canvas
                enemies.splice(i, 1);
                i--;
            }
        }
    }
}





function spawnRegularEnemies() {
    const enemy = {
        x: Math.random() * (canvas.width - enemyImageWidth),
        y: 0,
        width: enemyImageWidth,
        height: enemyImageHeight,
        isBoss: false,
    };
    enemies.push(enemy);
}

function updateProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].y -= 5; // Move projectiles up
        if (projectiles[i].y < 0) {
            // Remove projectiles when they go out of the canvas
            projectiles.splice(i, 1);
            i--;
        } else {
            // Check for collisions with enemies
            for (let j = 0; j < enemies.length; j++) {
                if (checkCollision(projectiles[i], enemies[j])) {
                    // Remove projectile and enemy on collision
                    projectiles.splice(i, 1);
                    if (enemies[j].isBoss) {
                        // Decrease boss's health on projectile hit
                        enemies[j].health--;
                        hitSound.play();
                        if (enemies[j].health <= 0) {
                            // Boss defeated
                            enemies.splice(j, 1);
                            // Reset boss properties
                            bossEnemy.isBoss = false;
                            bossEnemy.health = 300;
                            // Increment the kill counter
                            killCounter++;
                            // Spawn regular enemies again
                            spawnRegularEnemies();
                        }
                    } else {
                        enemies.splice(j, 1);
                        // Increment the kill counter
                        killCounter++;
                        hitSound.play();
                    }
                    break; // Exit the inner loop after a collision
                }
            }
        }
    }
}

function gameLoop() {
    if (!gameStarted) {
        if (gameOver) {
            // Display game-over message and prompt to play again
            backgroundMusic.pause();
            ctx.fillStyle = '#ffffff';
            ctx.font = '30px Arial';
            ctx.fillText('Press Space Bar to Play Again', canvas.width / 2 - 220, canvas.height / 2 + 30);
            enemies.length = 0;
        } else {
            // Display a message to prompt the player to press the space bar to start or restart the game
            backgroundMusic.pause();
            ctx.fillStyle = '#ffffff';
            ctx.font = '30px Arial';
            ctx.fillText('Press Space Bar to Start', canvas.width / 2 - 150, canvas.height / 2);
            enemies.length = 0;
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    backgroundMusic.play();
    const elapsedTime = getElapsedTimeInSeconds();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawEnemies();
    drawProjectiles();
    updatePlayer();
    updateEnemies();
    updateProjectiles();

    // Increase enemy spawn frequency over time
    spawnInterval = Math.max(500, 2000 - elapsedTime * 10);
    var elapsedTimeInMinutes = Math.floor(elapsedTime / 60);
    var elapsedTimeInSeconds = elapsedTime % 60;
    // Draw the timer and kill counter on the canvas
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Time: ' + elapsedTimeInMinutes + ' minutes ' + elapsedTimeInSeconds + ' seconds', 10, 30);
    ctx.fillText('Kills: ' + killCounter, 10, 60);
    ctx.fillText('Hp: ' + player.hp, 10, 90); 
    
    if (elapsedTime >= 180) {
        backgroundMusic.pause();
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Arial';
        winSound.play();
        ctx.fillText('You Win!', canvas.width / 2 - 60, canvas.height / 2 - 80);
        gameStarted = false;
        requestAnimationFrame(gameLoop);
        return;
    }

    // Check if the kill count is 10 and the boss is not already spawned
    if (killCounter === 50  && !bossEnemy.isBoss) {
        bossEnemy.isBoss = true;
        bossEnemy.x = canvas.width / 2 - bossEnemy.width / 2; // Center boss horizontally
        bossEnemy.y = 0;
        enemies.push({ ...bossEnemy }); // Add a copy of the bossEnemy to the enemies array
    }

    // Spawn enemies with the adjusted spawn interval
    if (Math.random() < 0.02) {
        if (killCounter === 50 && !bossEnemy.isBoss) {
            bossEnemy.isBoss = true;
            bossEnemy.x = canvas.width / 2 - bossEnemy.width / 2; // Center boss horizontally
            bossEnemy.y = 0;
            enemies.push({ ...bossEnemy }); // Add a copy of the bossEnemy to the enemies array
        } else {
            const enemy = {
                x: Math.random() * (canvas.width - enemyImageWidth),
                y: 0,
                width: enemyImageWidth,
                height: enemyImageHeight,
                isBoss: false,
            };
            enemies.push(enemy);
        }
    }

  // Automatically shoot projectiles at a regular interval (e.g., every 500 milliseconds)
  const currentTime = new Date().getTime();
  if (currentTime - lastProjectileTime > 100) {
      const projectile = {
          x: player.x + player.width / 2 - 5,
          y: player.y,
          width: 10,
          height: 10,
      };
      projectiles.push(projectile);

      // Update the last projectile time
      lastProjectileTime = currentTime;
  }

  requestAnimationFrame(gameLoop);
}

// Keyboard input handling
const keysPressed = {};
window.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;

    // Check if the space bar is pressed to start or restart the game
    if (!gameStarted && e.key === ' ') {
        gameStarted = true;
        startTime = new Date().getTime(); // Start the timer
        gameOver = false; // Reset game over state
        gameLoop(); // Start the game loop
    }
});

window.addEventListener('keyup', (e) => {
    delete keysPressed[e.key];
});

function getElapsedTimeInSeconds() {
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - startTime) / 1000);
}

function checkCollision(obj1, obj2) {
    if (!obj1 || !obj2) {
        return false; // Return false if any object is undefined
    }
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

function resetGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset player position and game variables
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 50;
    player.hp = 20; // Reset player HP

    gameStarted = false;
    gameOver = false;
    startTime = new Date().getTime();
    killCounter = 0;
    keysPressed['ArrowUp'] = false;
    keysPressed['ArrowDown'] = false;
    keysPressed['ArrowLeft'] = false;
    keysPressed['ArrowRight'] = false;
    lastProjectileTime = new Date().getTime(); // Reset last projectile time

    // Reset difficulty variables
    spawnInterval = 5000; // Initial spawn interval in milliseconds
    enemyImageWidth = 30;
    enemyImageHeight = 40;

    // Reset boss properties
    bossEnemy.isBoss = false;
    bossEnemy.health = 300;

    // Clear existing enemies and projectiles
    enemies.length = 0;
    projectiles.length = 0;

    // Redraw regular enemies after resetting variables
    spawnRegularEnemies();

    // Reset spawnInterval based on elapsed time
    spawnInterval = Math.max(500, 1000 - getElapsedTimeInSeconds() * 10);

    // Stop the existing game loop before starting a new one
    cancelAnimationFrame(gameLoop);


    // Check if the kill count is 10 and the boss is not already spawned
    if (killCounter >= 50 && !bossEnemy.isBoss) {
        bossEnemy.isBoss = true;
        bossEnemy.x = canvas.width / 2 - bossEnemy.width / 2; // Center boss horizontally
        bossEnemy.y = 0;
        enemies.push({ ...bossEnemy }); // Add a copy of the bossEnemy to the enemies array
    }
}






