// العناصر الأساسية
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const characterOptions = document.querySelectorAll('.character-option');
const uploadBtn = document.getElementById('uploadBtn');
const imageUpload = document.getElementById('imageUpload');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// إعدادات اللعبة
let game = {
    score: 0,
    level: 1,
    lives: 3,
    isGameOver: false,
    difficulty: 'easy',
    helixRotation: 0,
    helixRotationSpeed: 0.02,
    character: {
        x: canvas.width / 2,
        y: 100,
        radius: 20,
        speed: 5,
        isJumping: false,
        jumpSpeed: 0,
        gravity: 0.2,
        image: null,
        currentCharacter: 'engineer'
    },
    platforms: [],
    traps: [],
    coins: [],
    platformCount: 20,
    trapProbability: 0.3,
    coinProbability: 0.2,
    platformGap: 150,
    lastPlatformY: 0,
    particles: [],
    gameStarted: false
};

// مسارات الصور في مجلد assets
const characterImages = {
    engineer: 'assets/characters/engineer.png',
    astronaut: 'assets/characters/astronaut.png',
    adventurer: 'assets/characters/adventurer.png',
    robot: 'assets/characters/robot.png'
};

// مؤثرات صوتية (يمكنك إضافة الملفات لاحقاً)
const audioFiles = {
    jump: 'assets/sounds/jump.mp3',
    coin: 'assets/sounds/coin.mp3',
    trap: 'assets/sounds/trap.mp3'
};

// تحميل صورة الشخصية
function loadCharacterImage(characterType) {
    game.character.currentCharacter = characterType;
    const img = new Image();
    img.src = characterImages[characterType];
    img.onload = function() {
        game.character.image = img;
        // إذا كانت هذه هي المرة الأولى للتحميل، ابدأ اللعبة
        if (!game.gameStarted) {
            initGame();
        }
    };
    img.onerror = function() {
        console.error(`فشل تحميل صورة: ${characterImages[characterType]}`);
        // استخدام صورة افتراضية
        createDefaultCharacterImage();
    };
}

// إنشاء صورة افتراضية إذا فشل تحميل الصورة
function createDefaultCharacterImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    // رسم دائرة زرقاء
    ctx.fillStyle = '#4dccff';
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // رسم وجه
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(15, 15, 4, 0, Math.PI * 2);
    ctx.arc(25, 15, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(20, 25, 6, 0, Math.PI);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // تحويل الكانفاس إلى صورة
    const img = new Image();
    img.src = canvas.toDataURL();
    game.character.image = img;
}

// تهيئة اللعبة
function initGame() {
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.isGameOver = false;
    game.gameStarted = true;
    game.helixRotation = 0;
    game.character.x = canvas.width / 2;
    game.character.y = 100;
    game.character.isJumping = false;
    game.character.jumpSpeed = 0;
    game.platforms = [];
    game.traps = [];
    game.coins = [];
    game.particles = [];
    game.lastPlatformY = 0;
    
    // تحديث واجهة المستخدم
    scoreElement.textContent = game.score;
    levelElement.textContent = game.level;
    livesElement.textContent = game.lives;
    gameOverScreen.style.display = 'none';
    
    // إنشاء المنصات
    createPlatforms();
    
    // ضبط الصعوبة
    setDifficulty(game.difficulty);
    
    // بدء اللعبة
    gameLoop();
}

// إنشاء المنصات الحلزونية
function createPlatforms() {
    for (let i = 0; i < game.platformCount; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const radius = 120;
        const x = canvas.width / 2 + Math.cos(angle) * radius;
        const y = game.lastPlatformY + game.platformGap;
        const width = 80;
        const height = 15;
        
        game.platforms.push({
            x, y, width, height, angle, radius,
            color: i % 2 === 0 ? '#2a2a5a' : '#3a3a6a'
        });
        
        // إضافة فخاخ بشكل عشوائي
        if (Math.random() < game.trapProbability) {
            const trapWidth = 20;
            const trapX = x + Math.random() * (width - trapWidth);
            game.traps.push({
                x: trapX,
                y: y - 5,
                width: trapWidth,
                height: 10,
                active: true,
                pulse: 0
            });
        }
        
        // إضافة عملات بشكل عشوائي
        if (Math.random() < game.coinProbability) {
            const coinX = x + Math.random() * (width - 20);
            game.coins.push({
                x: coinX,
                y: y - 30,
                radius: 10,
                collected: false,
                rotation: 0
            });
        }
        
        game.lastPlatformY = y;
    }
}

// ضبط مستوى الصعوبة
function setDifficulty(level) {
    game.difficulty = level;
    
    switch(level) {
        case 'easy':
            game.trapProbability = 0.2;
            game.helixRotationSpeed = 0.02;
            game.character.speed = 4;
            break;
        case 'medium':
            game.trapProbability = 0.3;
            game.helixRotationSpeed = 0.03;
            game.character.speed = 5;
            break;
        case 'hard':
            game.trapProbability = 0.4;
            game.helixRotationSpeed = 0.04;
            game.character.speed = 6;
            break;
    }
    
    // تحديث أزرار الصعوبة
    difficultyButtons.forEach(btn => {
        if (btn.dataset.level === level) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// رسم البرج الحلزوني
function drawHelix() {
    // رسم العمود المركزي
    ctx.fillStyle = '#333366';
    ctx.fillRect(canvas.width/2 - 10, 0, 20, canvas.height);
    
    // إضافة تأثير ثلاثي الأبعاد للعمود
    const gradient = ctx.createLinearGradient(canvas.width/2 - 10, 0, canvas.width/2 + 10, 0);
    gradient.addColorStop(0, '#222255');
    gradient.addColorStop(0.5, '#333366');
    gradient.addColorStop(1, '#222255');
    ctx.fillStyle = gradient;
    ctx.fillRect(canvas.width/2 - 10, 0, 20, canvas.height);
    
    // رسم الخطوط الحلزونية
    ctx.strokeStyle = 'rgba(77, 204, 255, 0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8 + game.helixRotation;
        const x1 = canvas.width / 2 + Math.cos(angle) * 30;
        const y1 = 0;
        const x2 = canvas.width / 2 + Math.cos(angle) * 200;
        const y2 = canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

// رسم المنصات
function drawPlatforms() {
    game.platforms.forEach(platform => {
        // حساب موضع المنصة مع الدوران
        const rotatedAngle = platform.angle + game.helixRotation;
        const x = canvas.width / 2 + Math.cos(rotatedAngle) * platform.radius;
        const y = platform.y;
        
        // رسم المنصة
        ctx.fillStyle = platform.color;
        ctx.fillRect(x - platform.width/2, y, platform.width, platform.height);
        
        // إضافة تأثير ثلاثي الأبعاد
        ctx.fillStyle = platform.color === '#2a2a5a' ? '#3a3a7a' : '#4a4a8a';
        ctx.fillRect(x - platform.width/2, y, platform.width, 5);
        
        // رسم حواف المنصة
        ctx.strokeStyle = '#4dccff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - platform.width/2, y, platform.width, platform.height);
    });
}

// رسم الفخاخ
function drawTraps() {
    game.traps.forEach(trap => {
        if (!trap.active) return;
        
        // حساب موضع الفخ مع الدوران
        const angle = Math.atan2(trap.x - canvas.width/2, trap.y - canvas.height/2);
        const rotatedAngle = angle + game.helixRotation;
        const distance = Math.sqrt(
            Math.pow(trap.x - canvas.width/2, 2) + 
            Math.pow(trap.y - canvas.height/2, 2)
        );
        
        const x = canvas.width / 2 + Math.cos(rotatedAngle) * distance;
        const y = trap.y;
        
        // تأثير النبض
        trap.pulse += 0.1;
        const pulseSize = Math.sin(trap.pulse) * 2;
        
        // رسم الفخ
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(x - trap.width/2 - pulseSize, y - pulseSize, trap.width + pulseSize*2, trap.height + pulseSize*2);
        
        // إضافة تأثير لهب
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(x - trap.width/2, y, trap.width, 3);
        
        // رسم رؤوس الفخ
        ctx.beginPath();
        ctx.moveTo(x - trap.width/2 - 5, y);
        ctx.lineTo(x - trap.width/2, y - 5);
        ctx.lineTo(x - trap.width/2, y + 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + trap.width/2 + 5, y);
        ctx.lineTo(x + trap.width/2, y - 5);
        ctx.lineTo(x + trap.width/2, y + 5);
        ctx.closePath();
        ctx.fill();
    });
}

// رسم العملات
function drawCoins() {
    game.coins.forEach(coin => {
        if (coin.collected) return;
        
        // حساب موضع العملة مع الدوران
        const angle = Math.atan2(coin.x - canvas.width/2, coin.y - canvas.height/2);
        const rotatedAngle = angle + game.helixRotation;
        const distance = Math.sqrt(
            Math.pow(coin.x - canvas.width/2, 2) + 
            Math.pow(coin.y - canvas.height/2, 2)
        );
        
        const x = canvas.width / 2 + Math.cos(rotatedAngle) * distance;
        const y = coin.y;
        
        // تدوير العملة
        coin.rotation += 0.05;
        
        // رسم العملة
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(coin.rotation);
        
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // إضافة تفاصيل العملة
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
        
        // رسم تأثير الوميض
        ctx.strokeStyle = 'rgba(255, 204, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, coin.radius + Math.sin(Date.now()/200) * 3, 0, Math.PI * 2);
        ctx.stroke();
    });
}

// رسم الشخصية
function drawCharacter() {
    // إذا كانت الشخصية تقفز، أضف تأثير القفز
    if (game.character.isJumping) {
        ctx.shadowColor = '#4dccff';
        ctx.shadowBlur = 20;
    }
    
    // إذا كان هناك صورة شخصية، ارسمها
    if (game.character.image) {
        ctx.save();
        ctx.translate(game.character.x, game.character.y);
        
        // إذا كانت الشخصية تقفز، أضف تأثير تمدد بسيط
        if (game.character.isJumping) {
            const stretch = 1 + Math.abs(game.character.jumpSpeed) * 0.02;
            ctx.scale(1, stretch);
        }
        
        ctx.drawImage(
            game.character.image, 
            -game.character.radius, 
            -game.character.radius, 
            game.character.radius * 2, 
            game.character.radius * 2
        );
        ctx.restore();
    } else {
        // إذا لم توجد صورة، ارسم دائرة
        ctx.fillStyle = '#4dccff';
        ctx.beginPath();
        ctx.arc(game.character.x, game.character.y, game.character.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // إضافة وجه بسيط
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(game.character.x - 7, game.character.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(game.character.x + 7, game.character.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(game.character.x, game.character.y + 5, 6, 0, Math.PI);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // إعادة ضبط الظل
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// رسم الجسيمات
function drawParticles() {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const particle = game.particles[i];
        
        particle.life -= 0.02;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // جاذبية
        
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (particle.life <= 0) {
            game.particles.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1;
}

// إنشاء جسيمات تأثير
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5 - 2,
            radius: Math.random() * 3 + 1,
            color: color,
            life: 1
        });
    }
}

// تحديث حركة الشخصية
function updateCharacter() {
    // تطبيق الجاذبية إذا كانت الشخصية تقفز
    if (game.character.isJumping) {
        game.character.y += game.character.jumpSpeed;
        game.character.jumpSpeed += game.character.gravity;
        
        // التحقق من الاصطدام بالمنصات
        checkPlatformCollision();
        
        // التحقق من جمع العملات
        checkCoinCollection();
        
        // التحقق من الاصطدام بالفخاخ
        checkTrapCollision();
        
        // التحقق من خروج الشخصية من الشاشة
        if (game.character.y > canvas.height + 50) {
            loseLife();
        }
        
        // التحقق من وصول الشخصية إلى الأسفل
        if (game.character.y > canvas.height - 100 && !game.character.isJumping) {
            nextLevel();
        }
    }
}

// التحقق من الاصطدام بالمنصات
function checkPlatformCollision() {
    for (let i = 0; i < game.platforms.length; i++) {
        const platform = game.platforms[i];
        
        // حساب موضع المنصة مع الدوران
        const rotatedAngle = platform.angle + game.helixRotation;
        const platformX = canvas.width / 2 + Math.cos(rotatedAngle) * platform.radius;
        const platformY = platform.y;
        
        // التحقق من الاصطدام
        if (
            game.character.x + game.character.radius > platformX - platform.width/2 &&
            game.character.x - game.character.radius < platformX + platform.width/2 &&
            game.character.y + game.character.radius > platformY &&
            game.character.y + game.character.radius < platformY + platform.height + game.character.jumpSpeed
        ) {
            // إذا اصطدمت الشخصية بالمنصة، توقف عن القفز
            game.character.isJumping = false;
            game.character.y = platformY - game.character.radius;
            game.character.jumpSpeed = 0;
            
            // زيادة النقاط عند الهبوط على منصة
            game.score += 10;
            scoreElement.textContent = game.score;
            
            // تأثير الهبوط
            createParticles(game.character.x, game.character.y, 10, '#4dccff');
            break;
        }
    }
}

// التحقق من جمع العملات
function checkCoinCollection() {
    for (let i = 0; i < game.coins.length; i++) {
        const coin = game.coins[i];
        
        if (coin.collected) continue;
        
        // حساب موضع العملة مع الدوران
        const angle = Math.atan2(coin.x - canvas.width/2, coin.y - canvas.height/2);
        const rotatedAngle = angle + game.helixRotation;
        const distance = Math.sqrt(
            Math.pow(coin.x - canvas.width/2, 2) + 
            Math.pow(coin.y - canvas.height/2, 2)
        );
        
        const coinX = canvas.width / 2 + Math.cos(rotatedAngle) * distance;
        const coinY = coin.y;
        
        // حساب المسافة بين الشخصية والعملة
        const dx = game.character.x - coinX;
        const dy = game.character.y - coinY;
        const distanceToCoin = Math.sqrt(dx * dx + dy * dy);
        
        // إذا التقطت الشخصية العملة
        if (distanceToCoin < game.character.radius + coin.radius) {
            coin.collected = true;
            game.score += 50;
            scoreElement.textContent = game.score;
            
            // تأثير جمع العملة
            createParticles(coinX, coinY, 15, '#ffcc00');
        }
    }
}

// التحقق من الاصطدام بالفخاخ
function checkTrapCollision() {
    for (let i = 0; i < game.traps.length; i++) {
        const trap = game.traps[i];
        
        if (!trap.active) continue;
        
        // حساب موضع الفخ مع الدوران
        const angle = Math.atan2(trap.x - canvas.width/2, trap.y - canvas.height/2);
        const rotatedAngle = angle + game.helixRotation;
        const distance = Math.sqrt(
            Math.pow(trap.x - canvas.width/2, 2) + 
            Math.pow(trap.y - canvas.height/2, 2)
        );
        
        const trapX = canvas.width / 2 + Math.cos(rotatedAngle) * distance;
        const trapY = trap.y;
        
        // التحقق من الاصطدام
        if (
            game.character.x + game.character.radius > trapX - trap.width/2 &&
            game.character.x - game.character.radius < trapX + trap.width/2 &&
            game.character.y + game.character.radius > trapY &&
            game.character.y - game.character.radius < trapY + trap.height
        ) {
            trap.active = false;
            loseLife();
            
            // تأثير الاصطدام بالفخ
            createParticles(game.character.x, game.character.y, 20, '#ff3333');
            break;
        }
    }
}

// فقدان حياة
function loseLife() {
    game.lives--;
    livesElement.textContent = game.lives;
    
    // إعادة تعيين موقع الشخصية
    game.character.x = canvas.width / 2;
    game.character.y = 100;
    game.character.isJumping = false;
    game.character.jumpSpeed = 0;
    
    // إذا انتهت الأرواح
    if (game.lives <= 0) {
        gameOver();
    }
}

// الانتقال للمستوى التالي
function nextLevel() {
    game.level++;
    levelElement.textContent = game.level;
    
    // زيادة الصعوبة مع تقدم المستويات
    if (game.level % 3 === 0 && game.difficulty !== 'hard') {
        game.trapProbability += 0.05;
        game.helixRotationSpeed += 0.005;
    }
    
    // إعادة تعيين موقع الشخصية
    game.character.x = canvas.width / 2;
    game.character.y = 100;
    game.character.isJumping = false;
    game.character.jumpSpeed = 0;
    
    // إنشاء منصات جديدة
    game.platforms = [];
    game.traps = [];
    game.coins = [];
    game.lastPlatformY = 0;
    createPlatforms();
    
    // تأثير المستوى الجديد
    createParticles(canvas.width/2, canvas.height/2, 30, '#4dccff');
}

// نهاية اللعبة
function gameOver() {
    game.isGameOver = true;
    finalScoreElement.textContent = game.score;
    gameOverScreen.style.display = 'flex';
}

// الدوران الأيسر للبرج
function rotateLeft() {
    if (!game.isGameOver) {
        game.helixRotation -= game.helixRotationSpeed;
    }
}

// الدوران الأيمن للبرج
function rotateRight() {
    if (!game.isGameOver) {
        game.helixRotation += game.helixRotationSpeed;
    }
}

// جعل الشخصية تقفز
function jump() {
    if (!game.character.isJumping && !game.isGameOver) {
        game.character.isJumping = true;
        game.character.jumpSpeed = -10;
        
        // تأثير القفز
        createParticles(game.character.x, game.character.y + game.character.radius, 8, '#4dccff');
    }
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    if (game.isGameOver) return;
    
    // مسح الكنفاس
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // تحديث حركة الشخصية
    updateCharacter();
    
    // تحديث الجسيمات
    game.particles.forEach(p => {
        p.life -= 0.01;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
    });
    game.particles = game.particles.filter(p => p.life > 0);
    
    // رسم عناصر اللعبة
    drawHelix();
    drawPlatforms();
    drawTraps();
    drawCoins();
    drawCharacter();
    drawParticles();
    
    // استمرار حلقة اللعبة
    requestAnimationFrame(gameLoop);
}

// معالجة رفع الصورة
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.match('image.*')) {
        alert('يرجى اختيار ملف صورة فقط!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            game.character.image = img;
            game.character.currentCharacter = 'custom';
            
            // إزالة التحديد من الشخصيات الأخرى
            characterOptions.forEach(option => {
                option.classList.remove('selected');
            });
        };
        img.onerror = function() {
            alert('حدث خطأ في تحميل الصورة!');
        };
    };
    reader.readAsDataURL(file);
}

// تهيئة الأحداث
function initEvents() {
    // أحداث الأزرار
    leftBtn.addEventListener('click', rotateLeft);
    rightBtn.addEventListener('click', rotateRight);
    jumpBtn.addEventListener('click', jump);
    restartBtn.addEventListener('click', initGame);
    
    // أحداث لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (game.isGameOver) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                rotateLeft();
                break;
            case 'ArrowRight':
            case 'd':
                rotateRight();
                break;
            case ' ':
            case 'ArrowUp':
            case 'w':
                jump();
                e.preventDefault();
                break;
        }
    });
    
    // أحداث اختيار الشخصية
    characterOptions.forEach(option => {
        option.addEventListener('click', () => {
            // إزالة التحديد من جميع الخيارات
            characterOptions.forEach(opt => opt.classList.remove('selected'));
            
            // إضافة التحديد للخيار المختار
            option.classList.add('selected');
            
            // تحميل صورة الشخصية المختارة
            const characterType = option.dataset.character;
            loadCharacterImage(characterType);
        });
    });
    
    // أحداث رفع الصورة
    uploadBtn.addEventListener('click', () => {
        imageUpload.click();
    });
    
    imageUpload.addEventListener('change', handleImageUpload);
    
    // أحداث الصعوبة
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setDifficulty(btn.dataset.level);
        });
    });
    
    // أحداث اللمس للأجهزة المحمولة
    let touchStartX = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        e.preventDefault();
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!touchStartX) return;
        
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        
        if (Math.abs(diff) > 10) {
            if (diff > 0) {
                rotateRight();
            } else {
                rotateLeft();
            }
            touchStartX = touchX;
        }
        
        e.preventDefault();
    });
    
    canvas.addEventListener('touchend', (e) => {
        if (!game.character.isJumping && !game.isGameOver) {
            jump();
        }
        touchStartX = 0;
        e.preventDefault();
    });
}

// بدء اللعبة عند تحميل الصفحة
window.onload = function() {
    // تحميل الصورة الافتراضية أولاً
    loadCharacterImage('engineer');
    initEvents();
};
