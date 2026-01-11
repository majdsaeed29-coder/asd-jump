// ===== إعدادات اللعبة 3D المحسنة =====
const GameConfig = {
    VERSION: "7.0 - 3D Edition",
    PLATFORM_SPACING: 120,
    PLATFORM_HEIGHT: 20,
    GAP_WIDTH: 35,
    JUMP_HEIGHT: 15,
    GRAVITY: 1.5,
    JUMP_POWER: 8.5,
    CHARACTER: {
        DISPLAY_SIZE: 40,
        COLLISION_SIZE: 18,
        COLOR: '#FF4081',
        MAX_TRAIL: 12,
        MAX_JUMPS: 2,
        POSITION_Z: 0
    },
    COLORS: {
        PLATFORM_TOP: '#4CAF50',
        PLATFORM_SIDE: '#388E3C',
        PLATFORM_EDGE: '#2E7D32',
        GAP: '#1A237E',
        TRAP: '#FF5252',
        COIN: '#FFD600',
        HELIX: 'rgba(33, 150, 243, 0.8)',
        POWERUP: '#FF9800',
        SHIELD: '#00BCD4',
        BACKGROUND: {
            TOP: '#0D47A1',
            MIDDLE: '#1565C0',
            BOTTOM: '#1976D2'
        }
    },
    DIFFICULTY: {
        EASY: { SPEED: 2.5, TRAP_CHANCE: 0.1, ROTATION_SPEED: 0.03 },
        NORMAL: { SPEED: 3, TRAP_CHANCE: 0.15, ROTATION_SPEED: 0.04 },
        HARD: { SPEED: 3.5, TRAP_CHANCE: 0.2, ROTATION_SPEED: 0.05 },
        EXTREME: { SPEED: 4, TRAP_CHANCE: 0.25, ROTATION_SPEED: 0.06 }
    },
    HELIX: {
        RADIUS: 180,
        SEGMENTS: 16,
        COLUMNS: 8
    },
    PARTICLES: {
        MAX_COUNT: 80,
        JUMP_COUNT: 6,
        LAND_COUNT: 8,
        DESTROY_COUNT: 12
    }
};

// ===== فئة اللعبة الرئيسية 3D =====
class HelixJump3D {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // تعديل حجم الكانفاس ديناميكياً
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // عناصر واجهة المستخدم
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('highScore');
        this.jumpsElement = document.getElementById('jumpsCount');
        this.coinsElement = document.getElementById('coinsCount');
        this.accuracyElement = document.getElementById('accuracy');
        this.pauseButton = document.getElementById('pauseButton');
        this.soundToggle = document.getElementById('soundToggle');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalHighScoreElement = document.getElementById('finalHighScore');
        this.finalLevelElement = document.getElementById('finalLevel');
        this.finalJumpsElement = document.getElementById('finalJumps');
        this.finalCoinsElement = document.getElementById('finalCoins');
        this.finalAccuracyElement = document.getElementById('finalAccuracy');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.shopScreen = document.getElementById('shopScreen');
        this.statsScreen = document.getElementById('statsScreen');
        this.restartButton = document.getElementById('restartButton');
        this.resumeButton = document.getElementById('resumeButton');
        this.shopButton = document.getElementById('shopButton');
        this.statsButton = document.getElementById('statsButton');
        this.buyShieldButton = document.getElementById('buyShield');
        this.buyDoubleCoinsButton = document.getElementById('buyDoubleCoins');
        
        // إحصائيات
        this.score = 0;
        this.coins = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('helixJumpHighScore')) || 0;
        this.totalCoins = parseInt(localStorage.getItem('helixJumpTotalCoins')) || 0;
        this.totalJumps = parseInt(localStorage.getItem('helixJumpTotalJumps')) || 0;
        this.gamesPlayed = parseInt(localStorage.getItem('helixJumpGamesPlayed')) || 0;
        this.gameActive = true;
        this.isPaused = false;
        
        // إعدادات 3D
        this.helixRotation = 0;
        this.helixRotationSpeed = 0;
        this.maxRotationSpeed = 0.08;
        this.rotationAcceleration = 0.0005;
        this.rotationFriction = 0.95;
        this.cameraY = 0;
        this.cameraAngle = 0;
        this.cameraDistance = 800;
        this.lightAngle = 0;
        this.time = 0;
        
        // الصعوبة
        this.difficulty = 'NORMAL';
        this.platformSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.rotationSpeed = GameConfig.DIFFICULTY[this.difficulty].ROTATION_SPEED;
        this.gravity = GameConfig.GRAVITY;
        this.soundEnabled = true;
        
        // الشخصية (ثابتة في المنتصف)
        this.character = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.7,
            z: GameConfig.CHARACTER.POSITION_Z,
            displaySize: GameConfig.CHARACTER.DISPLAY_SIZE,
            collisionSize: GameConfig.CHARACTER.COLLISION_SIZE,
            jumpPower: GameConfig.JUMP_POWER,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            color: GameConfig.CHARACTER.COLOR,
            images: [],
            currentImage: 0,
            imageLoaded: false,
            currentPlatformIndex: -1,
            isFalling: false,
            trail: [],
            // إحصائيات
            jumps: 0,
            successfulJumps: 0,
            lastJumpTime: 0,
            // تأثيرات
            zRotation: 0,
            shadowOffset: 0,
            scale: 1,
            bounce: 0,
            // قدرات
            hasShield: false,
            shieldTimer: 0,
            doubleCoins: false,
            doubleCoinsTimer: 0,
            extraJumps: 0,
            // إحصائيات متقدمة
            longestCombo: 0,
            currentCombo: 0,
            perfectJumps: 0
        };
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.powerUps = [];
        this.particles = [];
        this.helixSegments = [];
        
        // التحكم
        this.isDragging = false;
        this.lastTouchX = 0;
        this.rotationDirection = 0;
        this.swipeThreshold = 10;
        this.targetRotation = 0;
        this.currentRotation = 0;
        
        // تأثيرات الخلفية
        this.backgroundObjects = [];
        this.initBackgroundObjects();
        
        // نظام الصوت
        this.setupAudio();
        
        // التهيئة بعد تحميل الصور
        this.loadCharacterImages().then(() => {
            this.init();
        }).catch(error => {
            console.error('❌ فشل تحميل الصور:', error);
            this.init();
        });
    }
    
    // ===== إعداد الصوت =====
    setupAudio() {
        this.audio = {
            jump: document.getElementById('jumpSound'),
            coin: document.getElementById('coinSound'),
            gameOver: document.getElementById('gameOverSound'),
            powerUp: document.getElementById('powerUpSound'),
            shield: document.getElementById('shieldSound'),
            trap: document.getElementById('trapSound'),
            background: document.getElementById('backgroundMusic'),
            
            play: (sound, volume = 0.7) => {
                if (!this.audio[sound] || !this.soundEnabled) return;
                try {
                    this.audio[sound].currentTime = 0;
                    this.audio[sound].volume = volume;
                    this.audio[sound].play();
                } catch (e) {
                    console.log('🔇 خطأ في تشغيل الصوت:', e);
                }
            },
            
            playMusic: () => {
                if (!this.audio.background || !this.soundEnabled) return;
                try {
                    this.audio.background.volume = 0.3;
                    this.audio.background.loop = true;
                    this.audio.background.play();
                } catch (e) {
                    console.log('🔇 خطأ في تشغيل الموسيقى');
                }
            },
            
            stopMusic: () => {
                if (!this.audio.background) return;
                this.audio.background.pause();
                this.audio.background.currentTime = 0;
            }
        };
    }
    
    // ===== تعديل حجم الكانفاس =====
    resizeCanvas() {
        const container = document.querySelector('.game-area');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.canvas.width = Math.min(400, rect.width - 40);
        this.canvas.height = Math.min(650, window.innerHeight * 0.7);
        
        // تحديث موقع الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = this.canvas.height * 0.7;
    }
    
    // ===== تحميل صور الشخصية =====
    loadCharacterImages() {
        return new Promise((resolve) => {
            const imageNames = ['engineer.png', 'engineer2.png', 'engineer3.png'];
            let loadedCount = 0;
            const totalImages = imageNames.length;
            
            if (totalImages === 0) {
                this.character.imageLoaded = true;
                resolve();
                return;
            }
            
            imageNames.forEach((name, index) => {
                const img = new Image();
                img.src = `assets/${name}`;
                img.onload = () => {
                    loadedCount++;
                    this.character.images[index] = img;
                    
                    if (loadedCount === totalImages) {
                        this.character.imageLoaded = true;
                        console.log('✅ جميع صور الشخصية حمّلت بنجاح!');
                        resolve();
                    }
                };
                
                img.onerror = () => {
                    console.log(`❌ لم يتم تحميل الصورة: ${name}`);
                    this.createFallbackImage(index);
                    loadedCount++;
                    
                    if (loadedCount === totalImages) {
                        this.character.imageLoaded = true;
                        resolve();
                    }
                };
            });
        });
    }
    
    createFallbackImage(index) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // شخصية افتراضية
        ctx.fillStyle = GameConfig.CHARACTER.COLOR;
        ctx.beginPath();
        ctx.arc(50, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(35, 40, 8, 0, Math.PI * 2);
        ctx.arc(65, 40, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(50, 65, 20, 0.2, 0.8 * Math.PI);
        ctx.stroke();
        
        const img = new Image();
        img.src = canvas.toDataURL();
        this.character.images[index] = img;
    }
    
    // ===== التهيئة =====
    init() {
        this.updateStats();
        this.createGameElements();
        this.setupEventListeners();
        this.startBackgroundAnimation();
        this.audio.playMusic();
        this.gameLoop();
        
        console.log('🚀 HELIX JUMP 3D - الإصدار 7.0 🚀');
    }
    
    // ===== تحديث الإحصائيات =====
    updateStats() {
        if (this.highScoreElement) this.highScoreElement.textContent = this.highScore;
        if (document.getElementById('totalCoins')) document.getElementById('totalCoins').textContent = this.totalCoins;
        if (document.getElementById('totalJumps')) document.getElementById('totalJumps').textContent = this.totalJumps;
        if (document.getElementById('gamesPlayed')) document.getElementById('gamesPlayed').textContent = this.gamesPlayed;
        
        const accuracy = this.character.jumps > 0 ? 
            Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
        if (this.accuracyElement) this.accuracyElement.textContent = `${accuracy}%`;
    }
    
    // ===== إنشاء كائنات الخلفية =====
    initBackgroundObjects() {
        this.backgroundObjects = [];
        for (let i = 0; i < 15; i++) {
            this.backgroundObjects.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 2,
                speed: Math.random() * 0.3 + 0.1,
                alpha: Math.random() * 0.2 + 0.1
            });
        }
    }
    
    // ===== تحريك الخلفية =====
    startBackgroundAnimation() {
        setInterval(() => {
            if (!this.isPaused && this.gameActive) {
                this.backgroundObjects.forEach(obj => {
                    obj.y -= obj.speed;
                    if (obj.y < -10) {
                        obj.y = this.canvas.height + 10;
                        obj.x = Math.random() * this.canvas.width;
                    }
                });
            }
        }, 50);
    }
    
    // ===== إنشاء عناصر اللعبة 3D =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.powerUps = [];
        this.particles = [];
        this.helixSegments = [];
        
        const platformCount = 40;
        const helixRadius = GameConfig.HELIX.RADIUS;
        const segments = GameConfig.HELIX.SEGMENTS;
        const columns = GameConfig.HELIX.COLUMNS;
        
        // إنشاء أجزاء الأسطوانة
        for (let i = 0; i < segments; i++) {
            const y = i * GameConfig.PLATFORM_SPACING;
            for (let j = 0; j < columns; j++) {
                const angle = (j * Math.PI * 2) / columns;
                this.helixSegments.push({
                    x: Math.cos(angle) * helixRadius,
                    y: y,
                    z: Math.sin(angle) * helixRadius,
                    angle: angle,
                    column: j,
                    segment: i
                });
            }
        }
        
        // إنشاء المنصات المرتبة
        for (let i = 0; i < platformCount; i++) {
            const y = 200 + i * GameConfig.PLATFORM_SPACING;
            const column = Math.floor(Math.random() * columns);
            const angle = (column * Math.PI * 2) / columns;
            
            const platform = {
                id: i,
                x: Math.cos(angle) * helixRadius,
                y: y,
                z: Math.sin(angle) * helixRadius,
                width: 100,
                height: GameConfig.PLATFORM_HEIGHT,
                depth: 40,
                angle: angle,
                column: column,
                hasGap: i > 0, // أول منصة بدون فجوة
                gapPos: 40,
                gapWidth: GameConfig.GAP_WIDTH,
                isActive: true,
                isDestroyed: false,
                destroyTimer: 0,
                isTouched: i === 0, // أول منصة ملموسة
                rotation: 0,
                // تأثيرات 3D
                depthOffset: 0,
                highlight: false,
                // خاصيات
                isBouncy: Math.random() < 0.1,
                isMoving: Math.random() < 0.05,
                moveDirection: Math.random() > 0.5 ? 1 : -1,
                moveSpeed: Math.random() * 1.5 + 0.5
            };
            
            this.platforms.push(platform);
            
            // إضافة فخاخ على بعض المنصات
            if (i > 3 && Math.random() < GameConfig.DIFFICULTY[this.difficulty].TRAP_CHANCE) {
                this.traps.push({
                    x: Math.cos(angle) * (helixRadius - 20),
                    y: y - 15,
                    z: Math.sin(angle) * (helixRadius - 20),
                    width: 25,
                    height: 20,
                    angle: angle,
                    type: 'spike',
                    active: true,
                    platformId: i,
                    rotation: 0
                });
            }
            
            // إضافة عملات
            if (i > 0 && Math.random() < 0.25) {
                this.coins.push({
                    x: Math.cos(angle) * (helixRadius + 25),
                    y: y - 35,
                    z: Math.sin(angle) * (helixRadius + 25),
                    radius: 12,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: Math.random() < 0.1 ? 50 : 20,
                    platformId: i,
                    bounce: 0,
                    glow: 0
                });
            }
            
            // إضافة power-ups
            if (i > 5 && Math.random() < 0.07) {
                this.powerUps.push({
                    x: Math.cos(angle) * (helixRadius + 30),
                    y: y - 50,
                    z: Math.sin(angle) * (helixRadius + 30),
                    width: 22,
                    height: 22,
                    angle: angle,
                    type: Math.random() < 0.5 ? 'shield' : 'doubleCoins',
                    active: true,
                    platformId: i,
                    rotation: 0,
                    bounce: 0
                });
            }
        }
        
        // وضع الشخصية على أول منصة
        this.placeCharacterOnPlatform(0);
    }
    
    // ===== وضع الشخصية على منصة =====
    placeCharacterOnPlatform(platformIndex) {
        if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
        
        const platform = this.platforms[platformIndex];
        this.character.currentPlatformIndex = platformIndex;
        this.character.y = platform.y - this.character.collisionSize;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        this.character.scale = 1;
        this.character.bounce = 0;
        
        if (this.character.imageLoaded && this.character.images.length > 0) {
            this.character.currentImage = (this.character.currentImage + 1) % this.character.images.length;
        }
        
        platform.isTouched = true;
    }
    
    // ===== النط =====
    jump() {
        if (!this.gameActive || this.character.isJumping || this.character.isFalling) {
            if (this.character.extraJumps > 0 && !this.character.isFalling) {
                this.character.extraJumps--;
                this.character.isJumping = true;
                this.character.velocityY = -this.character.jumpPower * 1.2;
            } else {
                return;
            }
        }
        
        const currentPlatform = this.platforms[this.character.currentPlatformIndex];
        if (!currentPlatform || !currentPlatform.isActive) {
            this.character.isFalling = true;
            return;
        }
        
        this.character.isJumping = true;
        this.character.velocityY = -this.character.jumpPower;
        this.character.jumps++;
        this.totalJumps++;
        this.character.lastJumpTime = Date.now();
        
        if (currentPlatform.isBouncy) {
            this.character.velocityY *= 1.3;
        }
        
        this.character.scale = 0.85;
        this.character.zRotation = 0.2;
        
        if (this.soundEnabled) {
            this.audio.play('jump', 0.5);
            if (navigator.vibrate) navigator.vibrate(30);
        }
        
        this.createJumpParticles();
    }
    
    // ===== تدوير الأسطوانة =====
    rotateHelix(deltaX) {
        if (!this.gameActive || this.isPaused) return;
        
        this.helixRotationSpeed += deltaX * 0.0002;
        this.helixRotationSpeed = Math.max(-this.maxRotationSpeed, 
            Math.min(this.maxRotationSpeed, this.helixRotationSpeed));
        
        this.rotationDirection = Math.sign(deltaX);
        
        if (Math.abs(deltaX) > 30 && this.soundEnabled && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics() {
        if (!this.gameActive || this.isPaused) return;
        
        this.time += 0.016;
        
        // تحديث المؤقتات
        this.updateTimers();
        
        // تحديث دوران الأسطوانة
        this.helixRotation += this.helixRotationSpeed;
        this.helixRotationSpeed *= this.rotationFriction;
        this.lightAngle += 0.008;
        this.cameraY = Math.sin(this.time * 0.5) * 10;
        this.cameraAngle = Math.sin(this.time * 0.3) * 0.1;
        
        // تحديث الشخصية
        if (this.character.isJumping || this.character.isFalling) {
            if (this.character.isJumping && this.character.velocityY < 0) {
                this.character.currentCombo++;
                if (this.character.currentCombo > this.character.longestCombo) {
                    this.character.longestCombo = this.character.currentCombo;
                }
            }
            
            this.character.rotation += 0.1;
            this.character.zRotation *= 0.9;
            this.character.scale += (1 - this.character.scale) * 0.1;
            this.character.bounce = Math.sin(this.time * 8) * 1.5;
            
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
            
            if (Math.random() < 0.3 && this.character.trail.length < GameConfig.CHARACTER.MAX_TRAIL) {
                this.character.trail.push({
                    x: this.character.x,
                    y: this.character.y,
                    life: 1,
                    size: this.character.displaySize * 0.3,
                    color: this.character.hasShield ? GameConfig.COLORS.SHIELD : this.character.color
                });
            }
        }
        
        // تحديث الأثر
        this.character.trail = this.character.trail.filter(p => {
            p.life -= 0.08;
            p.size *= 0.9;
            return p.life > 0;
        });
        
        // تحديث المنصات
        this.updatePlatforms();
        
        // تحديث العناصر
        this.updateTraps();
        this.updateCoins();
        this.updatePowerUps();
        
        // تحديث الجسيمات
        this.updateParticles();
        
        // التحقق من التصادمات
        this.checkCollisions();
        
        // التحقق من خروج الشخصية
        if (this.character.y > this.canvas.height + 300) {
            this.endGame();
        }
        
        // تحديث الصعوبة
        this.updateDifficulty();
    }
    
    // ===== تحديث المؤقتات =====
    updateTimers() {
        if (this.character.hasShield && this.character.shieldTimer > 0) {
            this.character.shieldTimer--;
            if (this.character.shieldTimer <= 0) {
                this.character.hasShield = false;
                this.createShieldEffect(false);
            }
        }
        
        if (this.character.doubleCoins && this.character.doubleCoinsTimer > 0) {
            this.character.doubleCoinsTimer--;
            if (this.character.doubleCoinsTimer <= 0) {
                this.character.doubleCoins = false;
            }
        }
    }
    
    // ===== تحديث المنصات =====
    updatePlatforms() {
        this.platforms.forEach(platform => {
            platform.y -= this.platformSpeed;
            
            if (platform.isMoving) {
                platform.angle += platform.moveDirection * platform.moveSpeed * 0.01;
                platform.x = Math.cos(platform.angle) * GameConfig.HELIX.RADIUS;
                platform.z = Math.sin(platform.angle) * GameConfig.HELIX.RADIUS;
            }
            
            platform.rotation += 0.003;
            platform.depthOffset = Math.sin(platform.y * 0.01 + this.lightAngle) * 4;
            
            if (platform.y < -200) {
                this.recyclePlatform(platform);
            }
            
            if (platform.isDestroyed && platform.destroyTimer > 0) {
                platform.destroyTimer--;
                if (platform.destroyTimer <= 0) {
                    platform.isActive = false;
                }
            }
            
            if (platform.isActive && !platform.isDestroyed && platform.isTouched) {
                const distanceBelow = this.character.y - platform.y;
                if (distanceBelow > 60 && this.character.velocityY > 0 && !this.character.isFalling) {
                    this.destroyPlatform(platform.id);
                    
                    if (this.character.currentCombo % 5 === 0) {
                        this.character.extraJumps++;
                        this.createComboEffect();
                    }
                }
            }
        });
    }
    
    // ===== تحديث الفخاخ =====
    updateTraps() {
        this.traps.forEach(trap => {
            trap.y -= this.platformSpeed;
            trap.rotation += 0.02;
            
            const platform = this.platforms.find(p => p.id === trap.platformId);
            if (platform) {
                trap.x = Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS - 20);
                trap.z = Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS - 20);
            }
        });
    }
    
    // ===== تحديث العملات =====
    updateCoins() {
        this.coins.forEach(coin => {
            coin.y -= this.platformSpeed;
            coin.rotation += 0.03;
            coin.bounce = Math.sin(this.time * 2 + coin.y * 0.01) * 6;
            coin.glow = Math.sin(this.time * 3) * 0.3 + 0.7;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (platform) {
                coin.x = Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS + 25);
                coin.z = Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS + 25);
            }
        });
    }
    
    // ===== تحديث power-ups =====
    updatePowerUps() {
        this.powerUps.forEach(powerUp => {
            powerUp.y -= this.platformSpeed;
            powerUp.rotation += 0.025;
            powerUp.bounce = Math.sin(this.time * 1.5 + powerUp.platformId) * 4;
            
            const platform = this.platforms.find(p => p.id === powerUp.platformId);
            if (platform) {
                powerUp.x = Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS + 30);
                powerUp.z = Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS + 30);
            }
        });
    }
    
    // ===== تحديث الجسيمات =====
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.life -= 0.04;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        if (this.particles.length > GameConfig.PARTICLES.MAX_COUNT) {
            this.particles = this.particles.slice(-GameConfig.PARTICLES.MAX_COUNT);
        }
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        // تصادم مع الفخاخ
        for (let trap of this.traps) {
            if (!trap.active) continue;
            
            const projected = this.project3DTo2D(trap.x, trap.y, trap.z);
            const dx = this.character.x - (centerX + projected.x);
            const dy = this.character.y - (projected.y + this.cameraY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.collisionSize + trap.width/2) {
                if (this.character.hasShield) {
                    this.hitTrapWithShield(trap);
                } else {
                    this.hitTrap(trap);
                }
                break;
            }
        }
        
        // تصادم مع power-ups
        for (let powerUp of this.powerUps) {
            if (!powerUp.active) continue;
            
            const projected = this.project3DTo2D(powerUp.x, powerUp.y + powerUp.bounce, powerUp.z);
            const dx = this.character.x - (centerX + projected.x);
            const dy = this.character.y - (projected.y + this.cameraY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize * 0.6 + powerUp.width/2) {
                this.collectPowerUp(powerUp);
                break;
            }
        }
        
        // البحث عن منصة للهبوط
        if (this.character.isJumping || this.character.isFalling) {
            this.findLandingPlatform();
        }
    }
    
    // ===== إسقاط 3D إلى 2D =====
    project3DTo2D(x, y, z) {
        const angle = this.helixRotation + this.cameraAngle;
        const rotatedX = x * Math.cos(angle) - z * Math.sin(angle);
        const rotatedZ = x * Math.sin(angle) + z * Math.cos(angle);
        
        const scale = this.cameraDistance / (this.cameraDistance + rotatedZ);
        return {
            x: rotatedX * scale,
            y: y * scale
        };
    }
    
    // ===== البحث عن منصة =====
    findLandingPlatform() {
        const centerX = this.canvas.width / 2;
        let targetPlatform = null;
        let minDistance = Infinity;
        
        for (let platform of this.platforms) {
            if (!platform.isActive || platform.isDestroyed) continue;
            
            const projected = this.project3DTo2D(platform.x, platform.y, platform.z);
            const platformScreenX = centerX + projected.x;
            const platformScreenY = projected.y + this.cameraY;
            
            const verticalDistance = platformScreenY - (this.character.y + this.character.collisionSize);
            
            if (verticalDistance > 0 && verticalDistance < 80 && this.character.velocityY > 0) {
                const horizontalDistance = Math.abs(this.character.x - platformScreenX);
                
                // التحقق من الفجوة
                let isOnSolid = true;
                if (platform.hasGap) {
                    const platformLeft = platformScreenX - platform.width/2;
                    const gapStart = platformLeft + platform.gapPos;
                    const gapEnd = gapStart + platform.gapWidth;
                    
                    if (this.character.x >= gapStart && this.character.x <= gapEnd) {
                        isOnSolid = false;
                    }
                }
                
                if (isOnSolid && verticalDistance < minDistance) {
                    minDistance = verticalDistance;
                    targetPlatform = platform;
                }
            }
        }
        
        if (targetPlatform) {
            this.landOnPlatform(targetPlatform);
        }
    }
    
    // ===== الهبوط على منصة =====
    landOnPlatform(platform) {
        const projected = this.project3DTo2D(platform.x, platform.y, platform.z);
        this.character.y = projected.y + this.cameraY - this.character.collisionSize;
        this.character.velocityY = 0;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.currentPlatformIndex = platform.id;
        this.character.rotation = 0;
        this.character.zRotation = 0;
        this.character.successfulJumps++;
        
        platform.isTouched = true;
        
        const comboMultiplier = 1 + (this.character.currentCombo * 0.1);
        const points = Math.round(10 * comboMultiplier);
        this.addScore(points);
        
        const centerX = this.canvas.width / 2;
        const platformScreenX = centerX + projected.x;
        const landingAccuracy = Math.abs(this.character.x - platformScreenX);
        if (landingAccuracy < 8) {
            this.character.perfectJumps++;
            this.addScore(20);
            this.createPerfectJumpEffect();
        }
        
        this.collectCoinsOnPlatform(platform.id);
        this.createLandingParticles(platform);
        
        if (this.soundEnabled && navigator.vibrate) {
            navigator.vibrate(80);
        }
    }
    
    // ===== جمع العملات على المنصة =====
    collectCoinsOnPlatform(platformId) {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.platformId !== platformId) return;
            
            const projected = this.project3DTo2D(coin.x, coin.y + coin.bounce, coin.z);
            const dx = this.character.x - (centerX + projected.x);
            const dy = this.character.y - (projected.y + this.cameraY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize * 0.6 + coin.radius) {
                this.collectCoin(coin, centerX + projected.x);
            }
        });
    }
    
    // ===== جمع العملة =====
    collectCoin(coin, screenX) {
        coin.collected = true;
        
        let value = coin.value;
        if (this.character.doubleCoins) {
            value *= 2;
        }
        
        this.addScore(value);
        this.coins += value;
        this.totalCoins += value;
        
        if (this.soundEnabled) {
            this.audio.play('coin', 0.6);
            if (navigator.vibrate) navigator.vibrate(20);
        }
        
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: screenX + (Math.random() - 0.5) * 25,
                y: coin.y + (Math.random() - 0.5) * 25 + coin.bounce,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                size: Math.random() * 3 + 2,
                color: GameConfig.COLORS.COIN,
                life: 1
            });
        }
        
        this.updateStats();
        localStorage.setItem('helixJumpTotalCoins', this.totalCoins);
    }
    
    // ===== جمع power-up =====
    collectPowerUp(powerUp) {
        powerUp.active = false;
        
        if (this.soundEnabled) {
            this.audio.play('powerUp', 0.7);
            if (navigator.vibrate) navigator.vibrate(150);
        }
        
        if (powerUp.type === 'shield') {
            this.character.hasShield = true;
            this.character.shieldTimer = 300;
            this.audio.play('shield', 0.5);
            this.createShieldEffect(true);
        } else if (powerUp.type === 'doubleCoins') {
            this.character.doubleCoins = true;
            this.character.doubleCoinsTimer = 600;
        }
        
        for (let i = 0; i < 18; i++) {
            this.particles.push({
                x: powerUp.x + (Math.random() - 0.5) * 35,
                y: powerUp.y + (Math.random() - 0.5) * 35 + powerUp.bounce,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 4 + 3,
                color: GameConfig.COLORS.POWERUP,
                life: 1
            });
        }
    }
    
    // ===== ضرب فخ مع درع =====
    hitTrapWithShield(trap) {
        trap.active = false;
        this.character.shieldTimer = Math.max(0, this.character.shieldTimer - 100);
        
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: trap.x + (Math.random() - 0.5) * 35,
                y: trap.y + (Math.random() - 0.5) * 35,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: Math.random() * 5 + 3,
                color: GameConfig.COLORS.SHIELD,
                life: 1
            });
        }
        
        if (this.soundEnabled) {
            this.audio.play('shield', 0.3);
        }
    }
    
    // ===== ضرب فخ =====
    hitTrap(trap) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 35,
                y: this.character.y + (Math.random() - 0.5) * 35,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: Math.random() * 5 + 3,
                color: GameConfig.COLORS.TRAP,
                life: 1
            });
        }
        
        if (this.soundEnabled) {
            this.audio.play('trap', 0.9);
            this.audio.play('gameOver', 0.7);
            if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 150]);
        }
        
        this.character.isFalling = true;
        this.character.currentCombo = 0;
        
        setTimeout(() => {
            this.endGame();
        }, 250);
    }
    
    // ===== جسيمات =====
    createJumpParticles() {
        for (let i = 0; i < GameConfig.PARTICLES.JUMP_COUNT; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 25,
                y: this.character.y + this.character.displaySize,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2.5,
                size: Math.random() * 3 + 2,
                color: this.character.color,
                life: 1
            });
        }
    }
    
    createLandingParticles(platform) {
        const centerX = this.canvas.width / 2;
        const projected = this.project3DTo2D(platform.x, platform.y, platform.z);
        const screenX = centerX + projected.x;
        const screenY = projected.y + this.cameraY;
        
        for (let i = 0; i < GameConfig.PARTICLES.LAND_COUNT; i++) {
            this.particles.push({
                x: screenX + (Math.random() - 0.5) * platform.width,
                y: screenY + platform.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                size: Math.random() * 2 + 2,
                color: platform.isBouncy ? '#FF9800' : GameConfig.COLORS.PLATFORM_TOP,
                life: 1
            });
        }
    }
    
    createPlatformBreakParticles(platform) {
        const centerX = this.canvas.width / 2;
        const projected = this.project3DTo2D(platform.x, platform.y, platform.z);
        const screenX = centerX + projected.x;
        const screenY = projected.y + this.cameraY;
        
        for (let i = 0; i < GameConfig.PARTICLES.DESTROY_COUNT; i++) {
            this.particles.push({
                x: screenX + (Math.random() - 0.5) * platform.width,
                y: screenY + platform.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 4 + 3,
                color: GameConfig.COLORS.PLATFORM_SIDE,
                life: 1
            });
        }
    }
    
    createShieldEffect(gained) {
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 50,
                y: this.character.y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7 - 3.5,
                size: Math.random() * 5 + 4,
                color: GameConfig.COLORS.SHIELD,
                life: 1
            });
        }
    }
    
    createComboEffect() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 40,
                y: this.character.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2.5,
                size: Math.random() * 4 + 3,
                color: '#FF00FF',
                life: 1
            });
        }
    }
    
    createPerfectJumpEffect() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.character.x,
                y: this.character.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: Math.random() * 3 + 2,
                color: '#FFFF00',
                life: 1.3
            });
        }
    }
    
    // ===== تحديث الصعوبة =====
    updateDifficulty() {
        const newLevel = Math.floor(this.score / 300) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelElement.textContent = this.level;
            
            this.platformSpeed += 0.1;
            this.maxRotationSpeed += 0.005;
            
            if (this.level % 5 === 0) {
                if (this.difficulty === 'NORMAL' && this.level >= 10) {
                    this.difficulty = 'HARD';
                } else if (this.difficulty === 'HARD' && this.level >= 20) {
                    this.difficulty = 'EXTREME';
                }
            }
        }
    }
    
    // ===== إعادة تدوير المنصة =====
    recyclePlatform(platform) {
        platform.y = this.canvas.height + 400;
        platform.angle = (Math.floor(Math.random() * GameConfig.HELIX.COLUMNS) * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
        platform.x = Math.cos(platform.angle) * GameConfig.HELIX.RADIUS;
        platform.z = Math.sin(platform.angle) * GameConfig.HELIX.RADIUS;
        platform.isActive = true;
        platform.isDestroyed = false;
        platform.destroyTimer = 0;
        platform.isTouched = false;
        platform.hasGap = true;
        
        platform.isBouncy = Math.random() < 0.1;
        platform.isMoving = Math.random() < 0.05;
        platform.moveDirection = Math.random() > 0.5 ? 1 : -1;
        
        this.traps = this.traps.filter(t => t.platformId !== platform.id);
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        this.powerUps = this.powerUps.filter(p => p.platformId !== platform.id);
        
        const trapChance = GameConfig.DIFFICULTY[this.difficulty].TRAP_CHANCE;
        if (Math.random() < trapChance) {
            this.traps.push({
                x: Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS - 20),
                y: platform.y - 15,
                z: Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS - 20),
                width: 25,
                height: 20,
                angle: platform.angle,
                type: 'spike',
                active: true,
                platformId: platform.id,
                rotation: 0
            });
        }
        
        if (Math.random() < 0.25) {
            this.coins.push({
                x: Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS + 25),
                y: platform.y - 35,
                z: Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS + 25),
                radius: 12,
                angle: platform.angle,
                collected: false,
                rotation: 0,
                value: Math.random() < 0.1 ? 50 : 20,
                platformId: platform.id,
                bounce: 0,
                glow: 0
            });
        }
        
        if (Math.random() < 0.07) {
            this.powerUps.push({
                x: Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS + 30),
                y: platform.y - 50,
                z: Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS + 30),
                width: 22,
                height: 22,
                angle: platform.angle,
                type: Math.random() < 0.5 ? 'shield' : 'doubleCoins',
                active: true,
                platformId: platform.id,
                rotation: 0,
                bounce: 0
            });
        }
    }
    
    // ===== تدمير المنصة =====
    destroyPlatform(platformIndex) {
        if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
        
        const platform = this.platforms[platformIndex];
        if (platform.isDestroyed) return;
        
        platform.isDestroyed = true;
        platform.isActive = false;
        platform.destroyTimer = 30;
        
        this.createPlatformBreakParticles(platform);
        
        if (this.soundEnabled && navigator.vibrate) {
            navigator.vibrate(80);
        }
    }
    
    // ===== الرسم =====
    draw() {
        if (!this.gameActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawHelixStructure();
        this.drawPlatforms();
        this.drawTraps();
        this.drawCoins();
        this.drawPowerUps();
        this.drawTrail();
        this.drawCharacter();
        this.drawParticles();
        this.drawUI();
    }
    
    // ===== رسم الخلفية =====
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(
            0, this.cameraY,
            0, this.canvas.height + this.cameraY
        );
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, GameConfig.COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.backgroundObjects.forEach(obj => {
            this.ctx.globalAlpha = obj.alpha;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    // ===== رسم هيكل الأسطوانة =====
    drawHelixStructure() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + this.cameraY;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        // الخطوط الحلزونية
        for (let i = 0; i < GameConfig.HELIX.COLUMNS; i++) {
            const angle = (i * Math.PI * 2) / GameConfig.HELIX.COLUMNS + this.helixRotation;
            
            for (let j = 0; j < GameConfig.HELIX.SEGMENTS - 1; j++) {
                const segment1 = this.helixSegments.find(s => s.column === i && s.segment === j);
                const segment2 = this.helixSegments.find(s => s.column === i && s.segment === j + 1);
                
                if (segment1 && segment2) {
                    const p1 = this.project3DTo2D(segment1.x, segment1.y, segment1.z);
                    const p2 = this.project3DTo2D(segment2.x, segment2.y, segment2.z);
                    
                    const alpha = 0.3 - (j * 0.02);
                    this.ctx.strokeStyle = `rgba(33, 150, 243, ${alpha})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.lineCap = 'round';
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX + p1.x, p1.y + this.cameraY);
                    this.ctx.lineTo(centerX + p2.x, p2.y + this.cameraY);
                    this.ctx.stroke();
                }
            }
        }
        
        // الحلقة السفلية
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        for (let i = 0; i <= GameConfig.HELIX.COLUMNS; i++) {
            const angle = (i * Math.PI * 2) / GameConfig.HELIX.COLUMNS + this.helixRotation;
            const x = Math.cos(angle) * helixRadius;
            const z = Math.sin(angle) * helixRadius;
            const projected = this.project3DTo2D(x, 0, z);
            
            if (i === 0) {
                this.ctx.moveTo(centerX + projected.x, centerY + projected.y);
            } else {
                this.ctx.lineTo(centerX + projected.x, centerY + projected.y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    // ===== رسم المنصات =====
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const projected = this.project3DTo2D(platform.x, platform.y + platform.depthOffset, platform.z);
            const screenX = centerX + projected.x;
            const screenY = projected.y + this.cameraY;
            
            let alpha = 1;
            if (platform.isDestroyed) {
                alpha = platform.destroyTimer / 30;
            }
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(platform.rotation);
            
            // الظل
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * alpha})`;
            this.ctx.fillRect(
                -platform.width/2 + 3,
                platform.height/2 + 3,
                platform.width * 0.85,
                platform.height/3
            );
            
            // الجانب الأمامي
            const frontGradient = this.ctx.createLinearGradient(
                -platform.width/2, -platform.height/2,
                -platform.width/2, platform.height/2
            );
            frontGradient.addColorStop(0, `rgba(76, 175, 80, ${alpha})`);
            frontGradient.addColorStop(1, `rgba(66, 165, 70, ${alpha})`);
            
            this.ctx.fillStyle = platform.isBouncy ? `rgba(255, 152, 0, ${alpha})` : frontGradient;
            
            // الجزء الأيسر
            this.ctx.fillRect(
                -platform.width/2,
                -platform.height/2,
                platform.gapPos,
                platform.height
            );
            
            // الجزء الأيمن
            this.ctx.fillRect(
                -platform.width/2 + platform.gapPos + platform.gapWidth,
                -platform.height/2,
                platform.width - platform.gapPos - platform.gapWidth,
                platform.height
            );
            
            // الجانب الجانبي (3D تأثير)
            this.ctx.fillStyle = `rgba(56, 142, 60, ${alpha * 0.8})`;
            this.ctx.fillRect(
                -platform.width/2,
                -platform.height/2,
                platform.width,
                3
            );
            
            // الفجوة
            this.ctx.fillStyle = `rgba(26, 35, 126, ${0.8 * alpha})`;
            this.ctx.fillRect(
                -platform.width/2 + platform.gapPos,
                -platform.height/2,
                platform.gapWidth,
                platform.height
            );
            
            // حواف
            this.ctx.strokeStyle = platform.isBouncy ? '#FF9800' : `rgba(46, 125, 50, ${alpha})`;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width/2, -platform.height/2);
            this.ctx.lineTo(-platform.width/2 + platform.gapPos, -platform.height/2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width/2 + platform.gapPos + platform.gapWidth, -platform.height/2);
            this.ctx.lineTo(platform.width/2, -platform.height/2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم الفخاخ =====
    drawTraps() {
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active || trap.y > this.canvas.height + 100 || trap.y < -100) return;
            
            const projected = this.project3DTo2D(trap.x, trap.y, trap.z);
            const screenX = centerX + projected.x;
            const screenY = projected.y + this.cameraY;
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(trap.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.beginPath();
            this.ctx.ellipse(2, 2, trap.width/2 + 1, trap.height/3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفخ
            const trapGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, trap.width/2);
            trapGradient.addColorStop(0, '#FF5252');
            trapGradient.addColorStop(0.7, '#E53935');
            trapGradient.addColorStop(1, '#C62828');
            
            this.ctx.fillStyle = trapGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, trap.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // أشواك
            this.ctx.fillStyle = '#FF8A80';
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const spikeLength = 8;
                
                this.ctx.save();
                this.ctx.rotate(angle);
                this.ctx.translate(trap.width/2, 0);
                
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(spikeLength, -spikeLength/2);
                this.ctx.lineTo(spikeLength, spikeLength/2);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم العملات =====
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height + 100 || coin.y < -100) return;
            
            const projected = this.project3DTo2D(coin.x, coin.y + coin.bounce, coin.z);
            const screenX = centerX + projected.x;
            const screenY = projected.y + this.cameraY;
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(coin.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 3, coin.radius, coin.radius/3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // العملة
            const coinGradient = this.ctx.createRadialGradient(0, -coin.radius*0.3, 0, 0, 0, coin.radius);
            coinGradient.addColorStop(0, '#FFEA00');
            coinGradient.addColorStop(0.5, '#FFD600');
            coinGradient.addColorStop(0.8, '#FFAB00');
            coinGradient.addColorStop(1, '#FF8F00');
            
            this.ctx.fillStyle = coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // حواف
            this.ctx.strokeStyle = '#FFC400';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius - 1, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // نجمة
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم power-ups =====
    drawPowerUps() {
        const centerX = this.canvas.width / 2;
        
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active || powerUp.y > this.canvas.height + 100 || powerUp.y < -100) return;
            
            const projected = this.project3DTo2D(powerUp.x, powerUp.y + powerUp.bounce, powerUp.z);
            const screenX = centerX + projected.x;
            const screenY = projected.y + this.cameraY;
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(powerUp.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.fillRect(-powerUp.width/2 + 1.5, powerUp.height/2 + 1.5, powerUp.width, powerUp.height/4);
            
            // power-up
            const powerUpGradient = this.ctx.createLinearGradient(
                -powerUp.width/2, -powerUp.height/2,
                powerUp.width/2, powerUp.height/2
            );
            
            if (powerUp.type === 'shield') {
                powerUpGradient.addColorStop(0, '#00BCD4');
                powerUpGradient.addColorStop(1, '#00838F');
            } else {
                powerUpGradient.addColorStop(0, '#FF9800');
                powerUpGradient.addColorStop(1, '#F57C00');
            }
            
            this.ctx.fillStyle = powerUpGradient;
            this.ctx.fillRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
            
            // حدود
            this.ctx.strokeStyle = powerUp.type === 'shield' ? '#FFFFFF' : '#FFD54F';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
            
            // رمز
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (powerUp.type === 'shield') {
                this.ctx.fillText('🛡️', 0, 0);
            } else {
                this.ctx.fillText('2×', 0, 0);
            }
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم أثر الشخصية =====
    drawTrail() {
        this.character.trail.forEach(point => {
            const alpha = point.life * 0.3;
            const size = point.size * point.life;
            
            this.ctx.fillStyle = `rgba(${this.hexToRgb(point.color)}, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // ===== رسم الشخصية =====
    drawCharacter() {
        this.ctx.save();
        
        const x = this.character.x;
        const y = this.character.y + this.character.bounce;
        const scale = this.character.scale;
        
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        this.ctx.rotate(this.character.rotation);
        
        // تأثير 3D
        const skewX = Math.sin(this.character.zRotation) * 0.15;
        this.ctx.transform(1, 0, skewX, 1, 0, 0);
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            6, 6,
            this.character.displaySize * 0.8,
            this.character.displaySize * 0.25,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // درع
        if (this.character.hasShield) {
            const shieldAlpha = 0.25 + Math.sin(this.time * 8) * 0.15;
            this.ctx.strokeStyle = `rgba(0, 188, 212, ${shieldAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.displaySize + 8, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        if (this.character.imageLoaded && this.character.images[this.character.currentImage]) {
            // صورة الشخصية
            this.ctx.save();
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.drawImage(
                this.character.images[this.character.currentImage],
                -this.character.displaySize,
                -this.character.displaySize,
                this.character.displaySize * 2,
                this.character.displaySize * 2
            );
            
            this.ctx.restore();
        } else {
            // شخصية افتراضية
            const bodyGradient = this.ctx.createRadialGradient(
                -this.character.displaySize * 0.2,
                -this.character.displaySize * 0.2,
                0,
                0, 0,
                this.character.displaySize
            );
            bodyGradient.addColorStop(0, '#FF4081');
            bodyGradient.addColorStop(0.6, '#F50057');
            bodyGradient.addColorStop(1, '#C51162');
            
            this.ctx.fillStyle = bodyGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.displaySize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // تفاصيل
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-12, -8, 6, 0, Math.PI * 2);
            this.ctx.arc(12, -8, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-10, -8, 3, 0, Math.PI * 2);
            this.ctx.arc(10, -8, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(0, 6, 16, 0.2 * Math.PI, 0.8 * Math.PI);
            this.ctx.stroke();
        }
        
        // نطات إضافية
        if (this.character.extraJumps > 0) {
            this.ctx.fillStyle = '#FF4081';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`+${this.character.extraJumps}`, 0, -this.character.displaySize - 15);
        }
        
        this.ctx.restore();
    }
    
    // ===== رسم الجسيمات =====
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // ===== رسم الواجهة =====
    drawUI() {
        // الكومبو
        if (this.character.currentCombo > 1) {
            this.ctx.fillStyle = '#FF00FF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(`Combo x${this.character.currentCombo}`, this.canvas.width / 2, 15);
            this.ctx.shadowBlur = 0;
        }
        
        // مؤقتات
        if (this.character.hasShield) {
            const shieldTime = Math.ceil(this.character.shieldTimer / 60);
            this.ctx.fillStyle = '#00BCD4';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`🛡️ ${shieldTime}s`, 8, 25);
        }
        
        if (this.character.doubleCoins) {
            const doubleTime = Math.ceil(this.character.doubleCoinsTimer / 60);
            this.ctx.fillStyle = '#FF9800';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`2× ${doubleTime}s`, 8, 45);
        }
    }
    
    // ===== دوال مساعدة =====
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '255, 64, 129';
    }
    
    addScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('helixJumpHighScore', this.highScore);
        }
    }
    
    // ===== الأحداث =====
    setupEventListeners() {
        // التحكم باللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
            
            if (e.touches.length === 1 && !this.character.isJumping && !this.character.isFalling) {
                this.jump();
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || !this.gameActive || this.isPaused) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.lastTouchX;
            
            if (Math.abs(deltaX) > this.swipeThreshold) {
                this.rotateHelix(deltaX);
                this.lastTouchX = currentX;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // التحكم بالفأرة
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastTouchX = e.clientX;
            
            if (!this.character.isJumping && !this.character.isFalling) {
                this.jump();
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.gameActive || this.isPaused) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastTouchX;
            
            if (Math.abs(deltaX) > this.swipeThreshold) {
                this.rotateHelix(deltaX);
                this.lastTouchX = currentX;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.rotateHelix(-30);
                    break;
                case 'ArrowRight':
                    this.rotateHelix(30);
                    break;
                case ' ':
                case 'w':
                case 'W':
                case 'ArrowUp':
                    this.jump();
                    break;
                case 'p':
                case 'P':
                case 'Escape':
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    this.restartGame();
                    break;
                case 'm':
                case 'M':
                    this.toggleSound();
                    break;
            }
        });
        
        // أزرار التحكم
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                switch(action) {
                    case 'jump':
                        this.jump();
                        break;
                    case 'restart':
                        this.restartGame();
                        break;
                    case 'pause':
                        this.togglePause();
                        break;
                    case 'sound':
                        this.toggleSound();
                        break;
                }
            });
        });
        
        // الأزرار الأخرى
        if (this.restartButton) this.restartButton.addEventListener('click', () => this.restartGame());
        if (this.resumeButton) this.resumeButton.addEventListener('click', () => this.togglePause());
        if (this.pauseButton) this.pauseButton.addEventListener('click', () => this.togglePause());
        if (this.soundToggle) this.soundToggle.addEventListener('click', () => this.toggleSound());
        if (this.shopButton) this.shopButton.addEventListener('click', () => this.toggleShop());
        if (this.statsButton) this.statsButton.addEventListener('click', () => this.toggleStats());
        if (this.buyShieldButton) this.buyShieldButton.addEventListener('click', () => this.buyPowerUp('shield'));
        if (this.buyDoubleCoinsButton) this.buyDoubleCoinsButton.addEventListener('click', () => this.buyPowerUp('doubleCoins'));
        
        if (this.difficultySelect) {
            this.difficultySelect.addEventListener('change', (e) => {
                this.changeDifficulty(e.target.value);
            });
        }
        
        // منع سلوك اللمس الافتراضي
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // ===== دوال التحكم =====
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseScreen.style.display = 'flex';
            this.audio.stopMusic();
        } else {
            this.pauseScreen.style.display = 'none';
            this.audio.playMusic();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.innerHTML = this.soundEnabled ? 
            '<i class="fas fa-volume-up"></i>' : 
            '<i class="fas fa-volume-mute"></i>';
        
        if (this.soundEnabled) {
            this.audio.playMusic();
        } else {
            this.audio.stopMusic();
        }
    }
    
    toggleShop() {
        if (this.shopScreen.style.display === 'flex') {
            this.shopScreen.style.display = 'none';
        } else {
            this.updateShop();
            this.shopScreen.style.display = 'flex';
        }
    }
    
    toggleStats() {
        if (this.statsScreen.style.display === 'flex') {
            this.statsScreen.style.display = 'none';
        } else {
            this.updateStatsScreen();
            this.statsScreen.style.display = 'flex';
        }
    }
    
    updateShop() {
        if (document.getElementById('shopCoins')) document.getElementById('shopCoins').textContent = this.totalCoins;
        if (document.getElementById('shieldPrice')) document.getElementById('shieldPrice').textContent = '100';
        if (document.getElementById('doubleCoinsPrice')) document.getElementById('doubleCoinsPrice').textContent = '150';
    }
    
    updateStatsScreen() {
        const accuracy = this.character.jumps > 0 ? 
            Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
        
        if (document.getElementById('statsGamesPlayed')) document.getElementById('statsGamesPlayed').textContent = this.gamesPlayed;
        if (document.getElementById('statsTotalJumps')) document.getElementById('statsTotalJumps').textContent = this.totalJumps;
        if (document.getElementById('statsTotalCoins')) document.getElementById('statsTotalCoins').textContent = this.totalCoins;
        if (document.getElementById('statsHighScore')) document.getElementById('statsHighScore').textContent = this.highScore;
        if (document.getElementById('statsAccuracy')) document.getElementById('statsAccuracy').textContent = `${accuracy}%`;
        if (document.getElementById('statsLongestCombo')) document.getElementById('statsLongestCombo').textContent = this.character.longestCombo;
        if (document.getElementById('statsPerfectJumps')) document.getElementById('statsPerfectJumps').textContent = this.character.perfectJumps;
    }
    
    buyPowerUp(type) {
        let price = type === 'shield' ? 100 : 150;
        
        if (this.totalCoins >= price) {
            this.totalCoins -= price;
            localStorage.setItem('helixJumpTotalCoins', this.totalCoins);
            
            if (type === 'shield') {
                this.character.hasShield = true;
                this.character.shieldTimer = 300;
                this.createShieldEffect(true);
                this.audio.play('shield', 0.5);
            } else {
                this.character.doubleCoins = true;
                this.character.doubleCoinsTimer = 600;
            }
            
            this.updateShop();
            this.updateStats();
        } else {
            alert('❌ ليس لديك عملات كافية!');
        }
    }
    
    changeDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.platformSpeed = GameConfig.DIFFICULTY[difficulty].SPEED;
        this.rotationSpeed = GameConfig.DIFFICULTY[difficulty].ROTATION_SPEED;
    }
    
    // ===== نهاية اللعبة =====
    endGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        this.gamesPlayed++;
        
        localStorage.setItem('helixJumpGamesPlayed', this.gamesPlayed);
        localStorage.setItem('helixJumpTotalJumps', this.totalJumps);
        
        const accuracy = this.character.jumps > 0 ? 
            Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
        
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.finalLevelElement.textContent = this.level;
        this.finalJumpsElement.textContent = this.character.jumps;
        this.finalCoinsElement.textContent = this.coins;
        this.finalAccuracyElement.textContent = `${accuracy}%`;
        
        this.gameOverScreen.style.display = 'flex';
        
        this.audio.stopMusic();
        if (this.soundEnabled) {
            this.audio.play('gameOver', 0.9);
        }
    }
    
    // ===== إعادة تشغيل =====
    restartGame() {
        this.score = 0;
        this.coins = 0;
        this.level = 1;
        this.gameActive = true;
        this.isPaused = false;
        this.helixRotation = 0;
        this.helixRotationSpeed = 0;
        this.platformSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.maxRotationSpeed = 0.08;
        this.lightAngle = 0;
        this.cameraY = 0;
        this.cameraAngle = 0;
        this.time = 0;
        
        // إعادة تعيين الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = this.canvas.height * 0.7;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        this.character.zRotation = 0;
        this.character.scale = 1;
        this.character.bounce = 0;
        this.character.trail = [];
        this.character.currentPlatformIndex = -1;
        this.character.jumps = 0;
        this.character.successfulJumps = 0;
        this.character.currentCombo = 0;
        this.character.hasShield = false;
        this.character.shieldTimer = 0;
        this.character.doubleCoins = false;
        this.character.doubleCoinsTimer = 0;
        this.character.extraJumps = 0;
        
        this.scoreElement.textContent = '0';
        this.levelElement.textContent = '1';
        this.updateStats();
        
        this.createGameElements();
        
        this.gameOverScreen.style.display = 'none';
        this.pauseScreen.style.display = 'none';
        this.shopScreen.style.display = 'none';
        this.statsScreen.style.display = 'none';
        
        this.audio.playMusic();
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
        if (this.gameActive && !this.isPaused) {
            this.updatePhysics();
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== بدء اللعبة =====
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            const game = new HelixJump3D();
            window.game = game;
            console.log('🎮 HELIX JUMP 3D - الإصدار 7.0 🚀');
            
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل اللعبة:', error);
            alert('حدث خطأ في تحميل اللعبة. يرجى تحديث الصفحة.');
        }
    }, 500);
});

window.HelixJump3D = HelixJump3D;
