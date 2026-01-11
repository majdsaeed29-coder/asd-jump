// ===== إعدادات اللعبة 3D المحسنة =====
const GameConfig = {
    VERSION: "8.0 - Stable Edition",
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

// ===== فئة اللعبة الرئيسية 3D مع معالجة أخطاء =====
class HelixJump3D {
    constructor() {
        console.log('🚀 بدء تهيئة اللعبة...');
        
        try {
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('عنصر canvas غير موجود!');
            }
            this.ctx = this.canvas.getContext('2d');
            
            // تهيئة العناصر بأمان
            this.initializeElements();
            
            // إعدادات اللعبة
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
            
            console.log('✅ تهيئة اللعبة اكتملت بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في التهيئة:', error);
            this.showError('خطأ في تهيئة اللعبة: ' + error.message);
            return;
        }
        
        // تعديل حجم الكانفاس ديناميكياً
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // التهيئة بعد تحميل الصور
        this.loadCharacterImages().then(() => {
            this.init();
        }).catch(error => {
            console.error('❌ فشل تحميل الصور:', error);
            // استمرار اللعبة بدون صور
            this.character.imageLoaded = false;
            this.init();
        });
    }
    
    // ===== تهيئة العناصر بأمان =====
    initializeElements() {
        // عناصر واجهة المستخدم مع التحقق من وجودها
        this.scoreElement = this.getElement('score');
        this.levelElement = this.getElement('level');
        this.highScoreElement = this.getElement('highScore');
        this.jumpsElement = this.getElement('jumpsCount');
        this.coinsElement = this.getElement('coinsCount');
        this.accuracyElement = this.getElement('accuracy');
        this.pauseButton = this.getElement('pauseButton');
        this.soundToggle = this.getElement('soundToggle');
        this.difficultySelect = this.getElement('difficultySelect');
        
        // شاشات النهاية والإحصائيات
        this.finalScoreElement = this.getElement('finalScore');
        this.finalHighScoreElement = this.getElement('finalHighScore');
        this.finalLevelElement = this.getElement('finalLevel');
        this.finalJumpsElement = this.getElement('finalJumps');
        this.finalCoinsElement = this.getElement('finalCoins');
        this.finalAccuracyElement = this.getElement('finalAccuracy');
        
        // الشاشات
        this.gameOverScreen = this.getElement('gameOverScreen');
        this.pauseScreen = this.getElement('pauseScreen');
        this.shopScreen = this.getElement('shopScreen');
        this.statsScreen = this.getElement('statsScreen');
        
        // الأزرار
        this.restartButton = this.getElement('restartButton');
        this.resumeButton = this.getElement('resumeButton');
        this.shopButton = this.getElement('shopButton');
        this.statsButton = this.getElement('statsButton');
        this.buyShieldButton = this.getElement('buyShield');
        this.buyDoubleCoinsButton = this.getElement('buyDoubleCoins');
    }
    
    // ===== دالة مساعدة للحصول على عناصر بأمان =====
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ العنصر ${id} غير موجود`);
        }
        return element;
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
                try {
                    if (!this.audio[sound] || !this.soundEnabled) return;
                    this.audio[sound].currentTime = 0;
                    this.audio[sound].volume = volume;
                    this.audio[sound].play();
                } catch (e) {
                    console.log('🔇 خطأ في تشغيل الصوت:', e);
                }
            },
            
            playMusic: () => {
                try {
                    if (!this.audio.background || !this.soundEnabled) return;
                    this.audio.background.volume = 0.3;
                    this.audio.background.loop = true;
                    this.audio.background.play();
                } catch (e) {
                    console.log('🔇 خطأ في تشغيل الموسيقى');
                }
            },
            
            stopMusic: () => {
                try {
                    if (!this.audio.background) return;
                    this.audio.background.pause();
                    this.audio.background.currentTime = 0;
                } catch (e) {
                    console.log('🔇 خطأ في إيقاف الموسيقى');
                }
            }
        };
    }
    
    // ===== إظهار خطأ للمستخدم =====
    showError(message) {
        console.error('❌ ' + message);
        // يمكنك إضافة رسالة خطأ في واجهة المستخدم إذا أردت
        if (this.canvas) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(message, 10, 30);
        }
    }
    
    // ===== تعديل حجم الكانفاس =====
    resizeCanvas() {
        try {
            const container = document.querySelector('.game-area');
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            this.canvas.width = Math.min(400, rect.width - 40);
            this.canvas.height = Math.min(650, window.innerHeight * 0.7);
            
            // تحديث موقع الشخصية
            if (this.character) {
                this.character.x = this.canvas.width / 2;
                this.character.y = this.canvas.height * 0.7;
            }
        } catch (error) {
            console.error('❌ خطأ في تغيير حجم الكانفاس:', error);
        }
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
                    console.log(`⚠️ لم يتم تحميل الصورة: ${name}`);
                    this.createFallbackImage(index);
                    loadedCount++;
                    
                    if (loadedCount === totalImages) {
                        this.character.imageLoaded = true;
                        resolve();
                    }
                };
                
                img.src = `assets/${name}`;
            });
        });
    }
    
    createFallbackImage(index) {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في إنشاء الصورة البديلة:', error);
        }
    }
    
    // ===== التهيئة =====
    init() {
        console.log('🎮 بدء تشغيل اللعبة...');
        
        try {
            this.updateStats();
            this.createGameElements();
            this.setupEventListeners();
            this.startBackgroundAnimation();
            
            // تشغيل الموسيقى بعد تفاعل المستخدم
            setTimeout(() => {
                if (this.audio && this.soundEnabled) {
                    this.audio.playMusic();
                }
            }, 1000);
            
            this.gameLoop();
            
            console.log('✅ اللعبة جاهزة للعب!');
            
        } catch (error) {
            console.error('❌ خطأ في init:', error);
            this.showError('خطأ في بدء اللعبة');
        }
    }
    
    // ===== تحديث الإحصائيات =====
    updateStats() {
        try {
            if (this.highScoreElement) this.highScoreElement.textContent = this.highScore;
            
            const totalCoinsEl = document.getElementById('totalCoins');
            if (totalCoinsEl) totalCoinsEl.textContent = this.totalCoins;
            
            const totalJumpsEl = document.getElementById('totalJumps');
            if (totalJumpsEl) totalJumpsEl.textContent = this.totalJumps;
            
            const gamesPlayedEl = document.getElementById('gamesPlayed');
            if (gamesPlayedEl) gamesPlayedEl.textContent = this.gamesPlayed;
            
            const accuracy = this.character.jumps > 0 ? 
                Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
            if (this.accuracyElement) this.accuracyElement.textContent = `${accuracy}%`;
        } catch (error) {
            console.error('❌ خطأ في تحديث الإحصائيات:', error);
        }
    }
    
    // ===== إنشاء كائنات الخلفية =====
    initBackgroundObjects() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في إنشاء كائنات الخلفية:', error);
        }
    }
    
    // ===== تحريك الخلفية =====
    startBackgroundAnimation() {
        try {
            setInterval(() => {
                if (!this.gameActive || this.isPaused) return;
                
                this.backgroundObjects.forEach(obj => {
                    obj.y -= obj.speed;
                    if (obj.y < -10) {
                        obj.y = this.canvas.height + 10;
                        obj.x = Math.random() * this.canvas.width;
                    }
                });
            }, 50);
        } catch (error) {
            console.error('❌ خطأ في تحريك الخلفية:', error);
        }
    }
    
    // ===== إنشاء عناصر اللعبة 3D =====
    createGameElements() {
        try {
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
                    hasGap: i > 0,
                    gapPos: 40,
                    gapWidth: GameConfig.GAP_WIDTH,
                    isActive: true,
                    isDestroyed: false,
                    destroyTimer: 0,
                    isTouched: i === 0,
                    rotation: 0,
                    depthOffset: 0,
                    highlight: false,
                    isBouncy: Math.random() < 0.1,
                    isMoving: Math.random() < 0.05,
                    moveDirection: Math.random() > 0.5 ? 1 : -1,
                    moveSpeed: Math.random() * 1.5 + 0.5
                };
                
                this.platforms.push(platform);
                
                // فخاخ
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
                
                // عملات
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
                
                // power-ups
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
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء عناصر اللعبة:', error);
            this.showError('خطأ في إنشاء عناصر اللعبة');
        }
    }
    
    // ===== وضع الشخصية على منصة =====
    placeCharacterOnPlatform(platformIndex) {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في وضع الشخصية:', error);
        }
    }
    
    // ===== النط =====
    jump() {
        try {
            if (!this.gameActive || this.isPaused) return;
            
            if (this.character.isJumping || this.character.isFalling) {
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
        } catch (error) {
            console.error('❌ خطأ في النط:', error);
        }
    }
    
    // ===== تدوير الأسطوانة =====
    rotateHelix(deltaX) {
        try {
            if (!this.gameActive || this.isPaused) return;
            
            this.helixRotationSpeed += deltaX * 0.0002;
            this.helixRotationSpeed = Math.max(-this.maxRotationSpeed, 
                Math.min(this.maxRotationSpeed, this.helixRotationSpeed));
            
            this.rotationDirection = Math.sign(deltaX);
            
            if (Math.abs(deltaX) > 30 && this.soundEnabled && navigator.vibrate) {
                navigator.vibrate(10);
            }
        } catch (error) {
            console.error('❌ خطأ في تدوير الأسطوانة:', error);
        }
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics() {
        try {
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
            
        } catch (error) {
            console.error('❌ خطأ في الفيزياء:', error);
        }
    }
    
    // ===== تحديث المؤقتات =====
    updateTimers() {
        try {
            if (this.character.hasShield && this.character.shieldTimer > 0) {
                this.character.shieldTimer--;
                if (this.character.shieldTimer <= 0) {
                    this.character.hasShield = false;
                }
            }
            
            if (this.character.doubleCoins && this.character.doubleCoinsTimer > 0) {
                this.character.doubleCoinsTimer--;
                if (this.character.doubleCoinsTimer <= 0) {
                    this.character.doubleCoins = false;
                }
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث المؤقتات:', error);
        }
    }
    
    // ===== تحديث المنصات =====
    updatePlatforms() {
        try {
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
                        }
                    }
                }
            });
        } catch (error) {
            console.error('❌ خطأ في تحديث المنصات:', error);
        }
    }
    
    // ===== تحديث الفخاخ =====
    updateTraps() {
        try {
            this.traps.forEach(trap => {
                trap.y -= this.platformSpeed;
                trap.rotation += 0.02;
                
                const platform = this.platforms.find(p => p.id === trap.platformId);
                if (platform) {
                    trap.x = Math.cos(platform.angle) * (GameConfig.HELIX.RADIUS - 20);
                    trap.z = Math.sin(platform.angle) * (GameConfig.HELIX.RADIUS - 20);
                }
            });
        } catch (error) {
            console.error('❌ خطأ في تحديث الفخاخ:', error);
        }
    }
    
    // ===== تحديث العملات =====
    updateCoins() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في تحديث العملات:', error);
        }
    }
    
    // ===== تحديث power-ups =====
    updatePowerUps() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في تحديث power-ups:', error);
        }
    }
    
    // ===== تحديث الجسيمات =====
    updateParticles() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في تحديث الجسيمات:', error);
        }
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في التصادمات:', error);
        }
    }
    
    // ===== إسقاط 3D إلى 2D =====
    project3DTo2D(x, y, z) {
        try {
            const angle = this.helixRotation + this.cameraAngle;
            const rotatedX = x * Math.cos(angle) - z * Math.sin(angle);
            const rotatedZ = x * Math.sin(angle) + z * Math.cos(angle);
            
            const scale = this.cameraDistance / (this.cameraDistance + rotatedZ);
            return {
                x: rotatedX * scale,
                y: y * scale
            };
        } catch (error) {
            console.error('❌ خطأ في إسقاط 3D:', error);
            return { x: 0, y: 0 };
        }
    }
    
    // ===== البحث عن منصة =====
    findLandingPlatform() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في البحث عن منصة:', error);
        }
    }
    
    // ===== الهبوط على منصة =====
    landOnPlatform(platform) {
        try {
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
            }
            
            this.collectCoinsOnPlatform(platform.id);
            
            if (this.soundEnabled && navigator.vibrate) {
                navigator.vibrate(80);
            }
        } catch (error) {
            console.error('❌ خطأ في الهبوط على منصة:', error);
        }
    }
    
    // ===== جمع العملات على المنصة =====
    collectCoinsOnPlatform(platformId) {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في جمع العملات:', error);
        }
    }
    
    // ===== جمع العملة =====
    collectCoin(coin, screenX) {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في جمع العملة:', error);
        }
    }
    
    // ===== جمع power-up =====
    collectPowerUp(powerUp) {
        try {
            powerUp.active = false;
            
            if (this.soundEnabled) {
                this.audio.play('powerUp', 0.7);
                if (navigator.vibrate) navigator.vibrate(150);
            }
            
            if (powerUp.type === 'shield') {
                this.character.hasShield = true;
                this.character.shieldTimer = 300;
                if (this.audio) this.audio.play('shield', 0.5);
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
        } catch (error) {
            console.error('❌ خطأ في جمع power-up:', error);
        }
    }
    
    // ===== ضرب فخ مع درع =====
    hitTrapWithShield(trap) {
        try {
            trap.active = false;
            this.character.shieldTimer = Math.max(0, this.character.shieldTimer - 100);
            
            if (this.soundEnabled && this.audio) {
                this.audio.play('shield', 0.3);
            }
        } catch (error) {
            console.error('❌ خطأ في ضرب فخ مع درع:', error);
        }
    }
    
    // ===== ضرب فخ =====
    hitTrap(trap) {
        try {
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
            
            if (this.soundEnabled && this.audio) {
                this.audio.play('trap', 0.9);
                this.audio.play('gameOver', 0.7);
                if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 150]);
            }
            
            this.character.isFalling = true;
            this.character.currentCombo = 0;
            
            setTimeout(() => {
                this.endGame();
            }, 250);
        } catch (error) {
            console.error('❌ خطأ في ضرب فخ:', error);
        }
    }
    
    // ===== جسيمات =====
    createJumpParticles() {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في إنشاء جسيمات:', error);
        }
    }
    
    // ===== إعادة تدوير المنصة =====
    recyclePlatform(platform) {
        try {
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
        } catch (error) {
            console.error('❌ خطأ في إعادة تدوير المنصة:', error);
        }
    }
    
    // ===== تدمير المنصة =====
    destroyPlatform(platformIndex) {
        try {
            if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
            
            const platform = this.platforms[platformIndex];
            if (platform.isDestroyed) return;
            
            platform.isDestroyed = true;
            platform.isActive = false;
            platform.destroyTimer = 30;
            
            if (this.soundEnabled && navigator.vibrate) {
                navigator.vibrate(80);
            }
        } catch (error) {
            console.error('❌ خطأ في تدمير المنصة:', error);
        }
    }
    
    // ===== تحديث الصعوبة =====
    updateDifficulty() {
        try {
            const newLevel = Math.floor(this.score / 300) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                if (this.levelElement) this.levelElement.textContent = this.level;
                
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
        } catch (error) {
            console.error('❌ خطأ في تحديث الصعوبة:', error);
        }
    }
    
    // ===== إضافة النقاط =====
    addScore(points) {
        try {
            this.score += points;
            if (this.scoreElement) this.scoreElement.textContent = this.score;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                if (this.highScoreElement) this.highScoreElement.textContent = this.highScore;
                localStorage.setItem('helixJumpHighScore', this.highScore);
            }
        } catch (error) {
            console.error('❌ خطأ في إضافة النقاط:', error);
        }
    }
    
    // ===== دوال التحكم =====
    togglePause() {
        try {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                if (this.pauseScreen) this.pauseScreen.style.display = 'flex';
                if (this.audio) this.audio.stopMusic();
            } else {
                if (this.pauseScreen) this.pauseScreen.style.display = 'none';
                if (this.audio) this.audio.playMusic();
            }
        } catch (error) {
            console.error('❌ خطأ في togglePause:', error);
        }
    }
    
    toggleSound() {
        try {
            this.soundEnabled = !this.soundEnabled;
            if (this.soundToggle) {
                this.soundToggle.innerHTML = this.soundEnabled ? 
                    '<i class="fas fa-volume-up"></i>' : 
                    '<i class="fas fa-volume-mute"></i>';
            }
            
            if (this.soundEnabled) {
                if (this.audio) this.audio.playMusic();
            } else {
                if (this.audio) this.audio.stopMusic();
            }
        } catch (error) {
            console.error('❌ خطأ في toggleSound:', error);
        }
    }
    
    toggleShop() {
        try {
            if (!this.shopScreen) return;
            
            if (this.shopScreen.style.display === 'flex') {
                this.shopScreen.style.display = 'none';
            } else {
                this.updateShop();
                this.shopScreen.style.display = 'flex';
            }
        } catch (error) {
            console.error('❌ خطأ في toggleShop:', error);
        }
    }
    
    toggleStats() {
        try {
            if (!this.statsScreen) return;
            
            if (this.statsScreen.style.display === 'flex') {
                this.statsScreen.style.display = 'none';
            } else {
                this.updateStatsScreen();
                this.statsScreen.style.display = 'flex';
            }
        } catch (error) {
            console.error('❌ خطأ في toggleStats:', error);
        }
    }
    
    updateShop() {
        try {
            if (document.getElementById('shopCoins')) 
                document.getElementById('shopCoins').textContent = this.totalCoins;
        } catch (error) {
            console.error('❌ خطأ في updateShop:', error);
        }
    }
    
    updateStatsScreen() {
        try {
            const accuracy = this.character.jumps > 0 ? 
                Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
            
            if (document.getElementById('statsGamesPlayed')) 
                document.getElementById('statsGamesPlayed').textContent = this.gamesPlayed;
            if (document.getElementById('statsTotalJumps')) 
                document.getElementById('statsTotalJumps').textContent = this.totalJumps;
            if (document.getElementById('statsTotalCoins')) 
                document.getElementById('statsTotalCoins').textContent = this.totalCoins;
            if (document.getElementById('statsHighScore')) 
                document.getElementById('statsHighScore').textContent = this.highScore;
            if (document.getElementById('statsAccuracy')) 
                document.getElementById('statsAccuracy').textContent = `${accuracy}%`;
            if (document.getElementById('statsLongestCombo')) 
                document.getElementById('statsLongestCombo').textContent = this.character.longestCombo;
            if (document.getElementById('statsPerfectJumps')) 
                document.getElementById('statsPerfectJumps').textContent = this.character.perfectJumps;
        } catch (error) {
            console.error('❌ خطأ في updateStatsScreen:', error);
        }
    }
    
    buyPowerUp(type) {
        try {
            let price = type === 'shield' ? 100 : 150;
            
            if (this.totalCoins >= price) {
                this.totalCoins -= price;
                localStorage.setItem('helixJumpTotalCoins', this.totalCoins);
                
                if (type === 'shield') {
                    this.character.hasShield = true;
                    this.character.shieldTimer = 300;
                    if (this.audio) this.audio.play('shield', 0.5);
                } else {
                    this.character.doubleCoins = true;
                    this.character.doubleCoinsTimer = 600;
                }
                
                this.updateShop();
                this.updateStats();
            } else {
                alert('❌ ليس لديك عملات كافية!');
            }
        } catch (error) {
            console.error('❌ خطأ في buyPowerUp:', error);
        }
    }
    
    changeDifficulty(difficulty) {
        try {
            this.difficulty = difficulty;
            this.platformSpeed = GameConfig.DIFFICULTY[difficulty].SPEED;
            this.rotationSpeed = GameConfig.DIFFICULTY[difficulty].ROTATION_SPEED;
        } catch (error) {
            console.error('❌ خطأ في changeDifficulty:', error);
        }
    }
    
    // ===== نهاية اللعبة =====
    endGame() {
        try {
            if (!this.gameActive) return;
            
            this.gameActive = false;
            this.gamesPlayed++;
            
            localStorage.setItem('helixJumpGamesPlayed', this.gamesPlayed);
            localStorage.setItem('helixJumpTotalJumps', this.totalJumps);
            
            const accuracy = this.character.jumps > 0 ? 
                Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
            
            if (this.finalScoreElement) this.finalScoreElement.textContent = this.score;
            if (this.finalHighScoreElement) this.finalHighScoreElement.textContent = this.highScore;
            if (this.finalLevelElement) this.finalLevelElement.textContent = this.level;
            if (this.finalJumpsElement) this.finalJumpsElement.textContent = this.character.jumps;
            if (this.finalCoinsElement) this.finalCoinsElement.textContent = this.coins;
            if (this.finalAccuracyElement) this.finalAccuracyElement.textContent = `${accuracy}%`;
            
            if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';
            
            if (this.audio) {
                this.audio.stopMusic();
                if (this.soundEnabled) {
                    this.audio.play('gameOver', 0.9);
                }
            }
        } catch (error) {
            console.error('❌ خطأ في endGame:', error);
        }
    }
    
    // ===== إعادة تشغيل =====
    restartGame() {
        try {
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
            
            if (this.scoreElement) this.scoreElement.textContent = '0';
            if (this.levelElement) this.levelElement.textContent = '1';
            this.updateStats();
            
            this.createGameElements();
            
            // إخفاء الشاشات
            if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
            if (this.pauseScreen) this.pauseScreen.style.display = 'none';
            if (this.shopScreen) this.shopScreen.style.display = 'none';
            if (this.statsScreen) this.statsScreen.style.display = 'none';
            
            if (this.audio) this.audio.playMusic();
            
        } catch (error) {
            console.error('❌ خطأ في restartGame:', error);
        }
    }
    
    // ===== الرسم =====
    draw() {
        try {
            if (!this.gameActive || !this.ctx) return;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // رسم الخلفية البسيطة
            this.drawSimpleBackground();
            
            // رسم الأسطوانة والمنصات
            this.drawHelixAndPlatforms();
            
            // رسم الشخصية
            this.drawCharacter();
            
            // رسم الجسيمات
            this.drawParticlesSimple();
            
            // رسم الواجهة
            this.drawUISimple();
            
        } catch (error) {
            console.error('❌ خطأ في الرسم:', error);
        }
    }
    
    // ===== رسم خلفية بسيطة =====
    drawSimpleBackground() {
        try {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#0D47A1');
            gradient.addColorStop(1, '#1976D2');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // نجوم خلفية
            this.backgroundObjects.forEach(obj => {
                this.ctx.globalAlpha = obj.alpha;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
        } catch (error) {
            console.error('❌ خطأ في رسم الخلفية:', error);
        }
    }
    
    // ===== رسم الأسطوانة والمنصات =====
    drawHelixAndPlatforms() {
        try {
            const centerX = this.canvas.width / 2;
            const helixRadius = GameConfig.HELIX.RADIUS;
            
            // الخطوط الحلزونية البسيطة
            for (let i = 0; i < GameConfig.HELIX.COLUMNS; i++) {
                const angle = (i * Math.PI * 2) / GameConfig.HELIX.COLUMNS + this.helixRotation;
                const x1 = centerX + Math.cos(angle) * (helixRadius * 0.3);
                const x2 = centerX + Math.cos(angle) * helixRadius;
                
                this.ctx.strokeStyle = `rgba(33, 150, 243, 0.4)`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, 0);
                this.ctx.lineTo(x2, this.canvas.height);
                this.ctx.stroke();
            }
            
            // رسم المنصات
            this.platforms.forEach(platform => {
                if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
                
                const angle = platform.angle + this.helixRotation;
                const x = centerX + Math.cos(angle) * helixRadius;
                const y = platform.y - this.cameraY;
                
                let alpha = platform.isDestroyed ? (platform.destroyTimer / 30) : 1;
                
                this.ctx.save();
                this.ctx.translate(x, y);
                
                // المنصة
                this.ctx.fillStyle = platform.isBouncy ? 
                    `rgba(255, 152, 0, ${alpha})` : 
                    `rgba(76, 175, 80, ${alpha})`;
                
                // الجزء الأيسر
                this.ctx.fillRect(
                    -platform.width/2,
                    0,
                    platform.gapPos,
                    platform.height
                );
                
                // الجزء الأيمن
                this.ctx.fillRect(
                    -platform.width/2 + platform.gapPos + platform.gapWidth,
                    0,
                    platform.width - platform.gapPos - platform.gapWidth,
                    platform.height
                );
                
                // الفجوة
                this.ctx.fillStyle = `rgba(26, 35, 126, ${0.8 * alpha})`;
                this.ctx.fillRect(
                    -platform.width/2 + platform.gapPos,
                    0,
                    platform.gapWidth,
                    platform.height
                );
                
                this.ctx.restore();
            });
            
            // رسم الفخاخ
            this.traps.forEach(trap => {
                if (!trap.active) return;
                
                const angle = trap.angle + this.helixRotation;
                const x = centerX + Math.cos(angle) * (helixRadius - 20);
                const y = trap.y - this.cameraY;
                
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(trap.rotation);
                
                this.ctx.fillStyle = '#FF5252';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, trap.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            });
            
            // رسم العملات
            this.coins.forEach(coin => {
                if (coin.collected) return;
                
                const angle = coin.angle + this.helixRotation;
                const x = centerX + Math.cos(angle) * (helixRadius + 25);
                const y = coin.y + coin.bounce - this.cameraY;
                
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(coin.rotation);
                
                this.ctx.fillStyle = '#FFD600';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            });
            
        } catch (error) {
            console.error('❌ خطأ في رسم الأسطوانة:', error);
        }
    }
    
    // ===== رسم الشخصية =====
    drawCharacter() {
        try {
            this.ctx.save();
            
            const x = this.character.x;
            const y = this.character.y + this.character.bounce;
            const size = this.character.displaySize * this.character.scale;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(this.character.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(4, 4, size * 0.8, size * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // درع
            if (this.character.hasShield) {
                this.ctx.strokeStyle = 'rgba(0, 188, 212, 0.5)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // الشخصية
            if (this.character.imageLoaded && this.character.images[this.character.currentImage]) {
                this.ctx.drawImage(
                    this.character.images[this.character.currentImage],
                    -size,
                    -size,
                    size * 2,
                    size * 2
                );
            } else {
                // شخصية افتراضية
                this.ctx.fillStyle = this.character.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // عيون
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(-size * 0.3, -size * 0.2, size * 0.15, 0, Math.PI * 2);
                this.ctx.arc(size * 0.3, -size * 0.2, size * 0.15, 0, Math.PI * 2);
                this.ctx.fill();
                
                // فم
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, size * 0.1, size * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        } catch (error) {
            console.error('❌ خطأ في رسم الشخصية:', error);
        }
    }
    
    // ===== رسم جسيمات بسيطة =====
    drawParticlesSimple() {
        try {
            this.particles.forEach(particle => {
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            this.ctx.globalAlpha = 1;
        } catch (error) {
            console.error('❌ خطأ في رسم الجسيمات:', error);
        }
    }
    
    // ===== رسم واجهة بسيطة =====
    drawUISimple() {
        try {
            // الكومبو
            if (this.character.currentCombo > 1) {
                this.ctx.fillStyle = '#FF00FF';
                this.ctx.font = 'bold 18px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Combo x${this.character.currentCombo}`, this.canvas.width / 2, 20);
            }
        } catch (error) {
            console.error('❌ خطأ في رسم الواجهة:', error);
        }
    }
    
    // ===== إعداد الأحداث =====
    setupEventListeners() {
        try {
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
            
            // أزرار التحكم السريع
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
            
            // الأزرار الأخرى مع التحقق من وجودها
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
            
        } catch (error) {
            console.error('❌ خطأ في إعداد الأحداث:', error);
        }
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
        try {
            if (this.gameActive && !this.isPaused) {
                this.updatePhysics();
                this.draw();
            }
            
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('❌ خطأ في gameLoop:', error);
            // محاولة الاستمرار
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// ===== بدء اللعبة بأمان =====
window.addEventListener('load', () => {
    console.log('📱 صفحة اللعبة حمّلت بنجاح');
    
    setTimeout(() => {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            console.log('🎮 بدء تشغيل اللعبة...');
            const game = new HelixJump3D();
            window.game = game;
            console.log('✅ اللعبة بدأت بنجاح!');
            
        } catch (error) {
            console.error('❌ خطأ فادح في تحميل اللعبة:', error);
            
            // إظهار رسالة خطأ للمستخدم
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 99999;
                font-family: Arial, sans-serif;
            `;
            errorDiv.innerHTML = `
                <h3>خطأ في تحميل اللعبة</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: white; color: red; border: none; border-radius: 5px; cursor: pointer;">
                    إعادة تحميل الصفحة
                </button>
            `;
            document.body.appendChild(errorDiv);
            
            // إخفاء شاشة التحميل
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }
    }, 1000);
});

// جعل الفئة متاحة عالمياً
window.HelixJump3D = HelixJump3D;
console.log('📄 ملف game.js حمّل بنجاح');
