// ===== إعدادات اللعبة الدقيقة والمحسنة =====
const GameConfig = {
    VERSION: "6.0",
    JUMP_RATE: 2,
    PLATFORM_SPACING: 150,
    PLATFORM_HEIGHT: 25,
    GAP_WIDTH: 30,
    JUMP_HEIGHT: 15,
    GRAVITY: 1.8,
    JUMP_POWER: 9,
    CHARACTER: {
        DISPLAY_SIZE: 50,
        COLLISION_SIZE: 20,
        COLOR: '#FF4081',
        MAX_TRAIL: 15,
        MAX_JUMPS: 3
    },
    COLORS: {
        PLATFORM: '#4CAF50',
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
        EASY: { SPEED: 4, TRAP_CHANCE: 0.15 },
        NORMAL: { SPEED: 5, TRAP_CHANCE: 0.2 },
        HARD: { SPEED: 6, TRAP_CHANCE: 0.25 },
        EXTREME: { SPEED: 7, TRAP_CHANCE: 0.3 }
    },
    PARTICLES: {
        MAX_COUNT: 100,
        JUMP_COUNT: 8,
        LAND_COUNT: 10,
        DESTROY_COUNT: 15
    }
};

// ===== فئة اللعبة الرئيسية المحسنة =====
class HelixJump {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // تعديل حجم الكانفاس ديناميكياً
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // عناصر واجهة المستخدم المحسنة
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
        
        // إحصائيات محسنة
        this.score = 0;
        this.coins = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('helixJumpHighScore')) || 0;
        this.totalCoins = parseInt(localStorage.getItem('helixJumpTotalCoins')) || 0;
        this.totalJumps = parseInt(localStorage.getItem('helixJumpTotalJumps')) || 0;
        this.gamesPlayed = parseInt(localStorage.getItem('helixJumpGamesPlayed')) || 0;
        this.gameActive = true;
        this.isPaused = false;
        this.helixRotation = 0;
        this.helixSpeed = 0.04;
        this.platformSpeed = GameConfig.DIFFICULTY.NORMAL.SPEED;
        this.difficulty = 'NORMAL';
        this.gravity = GameConfig.GRAVITY;
        this.soundEnabled = true;
        
        // الشخصية المحسنة
        this.character = {
            x: this.canvas.width / 2,
            y: 200,
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
            shouldJump: false,
            // إحصائيات محسنة
            jumps: 0,
            successfulJumps: 0,
            lastJumpTime: 0,
            // تأثيرات 3D محسنة
            zRotation: 0,
            shadowOffset: 0,
            scale: 1,
            bounce: 0,
            // قدرات خاصة
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
        
        // عناصر اللعبة المحسنة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.powerUps = [];
        this.particles = [];
        
        // التحكم المحسن
        this.isDragging = false;
        this.lastTouchX = 0;
        this.rotationDirection = 0;
        this.swipeThreshold = 10;
        
        // 3D Effects محسنة
        this.lightAngle = 0;
        this.cameraY = 0;
        this.time = 0;
        this.backgroundObjects = [];
        
        // نظام الصوت المحسن
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
        
        // تهيئة الألعاب المصغرة في الخلفية
        this.initBackgroundObjects();
        
        // التهيئة بعد تحميل الصور
        this.loadCharacterImages().then(() => {
            this.init();
        }).catch(error => {
            console.error('❌ فشل تحميل الصور:', error);
            this.init();
        });
    }
    
    // ===== تعديل حجم الكانفاس ديناميكياً =====
    resizeCanvas() {
        const container = document.querySelector('.game-area');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = Math.min(400, rect.width - 40);
        this.canvas.height = Math.min(650, window.innerHeight * 0.7);
        
        // تحديث موقع الشخصية
        if (this.character) {
            this.character.x = this.canvas.width / 2;
        }
    }
    
    // ===== تحميل صور متعددة للشخصية =====
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
                // إنشاء صورة بديلة
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
        
        // رسم شخصية بديلة
        ctx.fillStyle = GameConfig.CHARACTER.COLOR;
        ctx.beginPath();
        ctx.arc(50, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // العيون
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(35, 40, 8, 0, Math.PI * 2);
        ctx.arc(65, 40, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // الفم
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(50, 65, 20, 0.2, 0.8 * Math.PI);
        ctx.stroke();
        
        const img = new Image();
        img.src = canvas.toDataURL();
        this.character.images[index] = img;
    }
    
    // ===== التهيئة المحسنة =====
    init() {
        // تحديث الإحصائيات
        this.updateStats();
        
        // إنشاء العناصر
        this.createGameElements();
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        // بدء الخلفية المتحركة
        this.startBackgroundAnimation();
        
        // بدء الموسيقى
        this.audio.playMusic();
        
        // بدء اللعبة
        this.gameLoop();
        
        console.log('🚀 HELIX JUMP - الإصدار الخارق 6.0 🚀');
        console.log('🎮 اللعبة جاهزة مع جميع التحسينات!');
    }
    
    // ===== تحديث الإحصائيات =====
    updateStats() {
        if (this.highScoreElement) this.highScoreElement.textContent = this.highScore;
        if (document.getElementById('totalCoins')) document.getElementById('totalCoins').textContent = this.totalCoins;
        if (document.getElementById('totalJumps')) document.getElementById('totalJumps').textContent = this.totalJumps;
        if (document.getElementById('gamesPlayed')) document.getElementById('gamesPlayed').textContent = this.gamesPlayed;
        
        // حساب الدقة
        const accuracy = this.character.jumps > 0 ? 
            Math.round((this.character.successfulJumps / this.character.jumps) * 100) : 100;
        if (this.accuracyElement) this.accuracyElement.textContent = `${accuracy}%`;
    }
    
    // ===== إنشاء كائنات الخلفية المتحركة =====
    initBackgroundObjects() {
        this.backgroundObjects = [];
        for (let i = 0; i < 20; i++) {
            this.backgroundObjects.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                speed: Math.random() * 0.5 + 0.2,
                alpha: Math.random() * 0.3 + 0.1,
                type: Math.random() > 0.5 ? 'circle' : 'star'
            });
        }
    }
    
    // ===== بدء تحريك الخلفية =====
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
    
    // ===== إنشاء عناصر اللعبة المحسنة =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.powerUps = [];
        this.particles = [];
        
        const platformCount = 30; // زيادة عدد المنصات
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * GameConfig.PLATFORM_SPACING;
            
            // إنشاء منصة مع إمكانيات خاصة
            const platform = {
                id: i,
                x: 0,
                y: y,
                width: 120,
                height: GameConfig.PLATFORM_HEIGHT,
                angle: angle,
                hasGap: true,
                gapPos: 30 + Math.random() * 30, // موضع عشوائي للفجوة
                gapWidth: GameConfig.GAP_WIDTH,
                color: GameConfig.COLORS.PLATFORM,
                edgeColor: GameConfig.COLORS.PLATFORM_EDGE,
                isActive: true,
                isDestroyed: false,
                destroyTimer: 0,
                isTouched: false,
                rotation: 0,
                // تأثيرات 3D محسنة
                depth: 0,
                highlight: false,
                pulse: 0,
                // خاصيات خاصة
                isBouncy: Math.random() < 0.1, // 10% منصة نطاطة
                isMoving: Math.random() < 0.05, // 5% منصة متحركة
                moveDirection: Math.random() > 0.5 ? 1 : -1,
                moveSpeed: Math.random() * 2 + 1
            };
            
            this.platforms.push(platform);
            
            // فخ (باحتمال يعتمد على الصعوبة)
            const trapChance = GameConfig.DIFFICULTY[this.difficulty].TRAP_CHANCE;
            if (Math.random() < trapChance) {
                const trap = {
                    x: 0,
                    y: y - 18,
                    width: 28,
                    height: 20,
                    angle: angle,
                    type: 'spike',
                    active: true,
                    rotation: 0,
                    platformId: i,
                    position: Math.random() > 0.5 ? 'left' : 'right',
                    // تأثيرات خاصة
                    isMoving: Math.random() < 0.2,
                    moveOffset: 0
                };
                
                this.traps.push(trap);
            }
            
            // عملة (20% فرصة)
            if (Math.random() < 0.2) {
                this.coins.push({
                    x: 0,
                    y: y - 45,
                    radius: 16,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: Math.random() < 0.1 ? 50 : 20,
                    platformId: i,
                    bounce: 0,
                    glow: 0,
                    isSpecial: Math.random() < 0.05 // 5% عملات خاصة
                });
            }
            
            // power-up (5% فرصة)
            if (Math.random() < 0.05) {
                this.powerUps.push({
                    x: 0,
                    y: y - 60,
                    width: 25,
                    height: 25,
                    angle: angle,
                    type: Math.random() < 0.5 ? 'shield' : 'doubleCoins',
                    active: true,
                    rotation: 0,
                    platformId: i,
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
        this.character.x = this.canvas.width / 2 + Math.cos(platform.angle + this.helixRotation) * 145;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        this.character.scale = 1;
        this.character.bounce = 0;
        
        // تبديل صورة الشخصية
        if (this.character.imageLoaded && this.character.images.length > 0) {
            this.character.currentImage = (this.character.currentImage + 1) % this.character.images.length;
        }
        
        // وضع علامة أن المنصة تم لمسها
        platform.isTouched = true;
    }
    
    // ===== النط المحسن =====
    jump() {
        if (!this.gameActive || this.character.isJumping || this.character.isFalling) {
            // استخدام نطات إضافية إذا متوفرة
            if (this.character.extraJumps > 0 && !this.character.isFalling) {
                this.character.extraJumps--;
                this.character.isJumping = true;
                this.character.velocityY = -this.character.jumpPower * 1.2; // نطة أقوى
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
        
        // إذا كانت المنصة نطاطة، زيادة القوة
        if (currentPlatform.isBouncy) {
            this.character.velocityY *= 1.3;
        }
        
        // تأثيرات القفز
        this.character.scale = 0.85;
        this.character.zRotation = 0.2;
        
        // الصوت
        if (this.soundEnabled) {
            this.audio.play('jump', 0.5);
            if (navigator.vibrate) navigator.vibrate(50); // اهتزاز
        }
        
        // جسيمات النط
        this.createJumpParticles();
        
        this.character.shouldJump = false;
    }
    
    // ===== تدمير المنصة المحسن =====
    destroyPlatform(platformIndex, immediate = false) {
        if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
        
        const platform = this.platforms[platformIndex];
        if (platform.isDestroyed) return;
        
        platform.isDestroyed = true;
        platform.isActive = false;
        platform.destroyTimer = immediate ? 10 : 40;
        
        // جسيمات التدمير
        this.createPlatformBreakParticles(platform);
        
        // اهتزاز
        if (this.soundEnabled && navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
    
    // ===== تدوير الأسطوانة المحسن =====
    rotateHelix(deltaX) {
        if (!this.gameActive || this.isPaused) return;
        
        // تطبيق التسارع
        const acceleration = Math.min(Math.abs(deltaX) * 0.01, 0.5);
        this.helixRotation += deltaX * this.helixSpeed * (0.3 + acceleration);
        this.rotationDirection = Math.sign(deltaX);
        this.lightAngle += deltaX * 0.008;
        
        // اهتزاز خفيف للدوران السريع
        if (Math.abs(deltaX) > 30 && this.soundEnabled && navigator.vibrate) {
            navigator.vibrate(20);
        }
    }
    
    // ===== تحديث الفيزياء المحسن =====
    updatePhysics() {
        if (!this.gameActive || this.isPaused) return;
        
        this.time += 0.016;
        
        // تحديث المؤقتات
        this.updateTimers();
        
        // تحديث تأثيرات 3D
        this.lightAngle += 0.008;
        this.cameraY = Math.sin(this.time * 0.8) * 8;
        
        // تحديث الشخصية
        if (this.character.isJumping || this.character.isFalling) {
            // تحديث الكومبو
            if (this.character.isJumping && this.character.velocityY < 0) {
                this.character.currentCombo++;
                if (this.character.currentCombo > this.character.longestCombo) {
                    this.character.longestCombo = this.character.currentCombo;
                }
            }
            
            // تأثيرات القفز
            this.character.rotation += 0.15;
            this.character.zRotation *= 0.9;
            this.character.scale += (1 - this.character.scale) * 0.15;
            this.character.bounce = Math.sin(this.time * 10) * 2;
            
            // تطبيق الجاذبية
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
            
            // أثر القفز
            if (Math.random() < 0.3 && this.character.trail.length < GameConfig.CHARACTER.MAX_TRAIL) {
                this.character.trail.push({
                    x: this.character.x,
                    y: this.character.y,
                    life: 1,
                    size: this.character.displaySize * 0.4,
                    color: this.character.hasShield ? GameConfig.COLORS.SHIELD : this.character.color
                });
            }
        }
        
        // تحديث الأثر
        this.character.trail = this.character.trail.filter(p => {
            p.life -= 0.06;
            p.size *= 0.95;
            return p.life > 0;
        });
        
        // تحديث المنصات المحسنة
        this.updatePlatforms();
        
        // تحديث العناصر الأخرى
        this.updateTraps();
        this.updateCoins();
        this.updatePowerUps();
        
        // تحديث الجسيمات
        this.updateParticles();
        
        // التحقق من التصادمات المحسنة
        this.checkEnhancedCollisions();
        
        // التحقق من خروج الشخصية
        if (this.character.y > this.canvas.height + 300) {
            this.endGame();
        }
        
        // زيادة الصعوبة
        this.updateDifficulty();
    }
    
    // ===== تحديث المؤقتات =====
    updateTimers() {
        // درع
        if (this.character.hasShield && this.character.shieldTimer > 0) {
            this.character.shieldTimer--;
            if (this.character.shieldTimer <= 0) {
                this.character.hasShield = false;
                this.createShieldEffect(false);
            }
        }
        
        // عملات مزدوجة
        if (this.character.doubleCoins && this.character.doubleCoinsTimer > 0) {
            this.character.doubleCoinsTimer--;
            if (this.character.doubleCoinsTimer <= 0) {
                this.character.doubleCoins = false;
            }
        }
    }
    
    // ===== تحديث المنصات المحسنة =====
    updatePlatforms() {
        this.platforms.forEach(platform => {
            platform.y -= this.platformSpeed;
            
            // منصة متحركة
            if (platform.isMoving) {
                platform.angle += platform.moveDirection * platform.moveSpeed * 0.01;
            }
            
            // تحديث تأثيرات 3D
            platform.rotation += 0.004;
            platform.depth = Math.sin(platform.y * 0.01 + this.lightAngle) * 6;
            platform.pulse = Math.sin(this.time * 3 + platform.id) * 0.2;
            
            // إعادة تدوير المنصات
            if (platform.y < -200) {
                this.recyclePlatform(platform);
            }
            
            // تحديث تدمير المنصة
            if (platform.isDestroyed && platform.destroyTimer > 0) {
                platform.destroyTimer--;
                if (platform.destroyTimer <= 0) {
                    platform.isActive = false;
                }
            }
            
            // تدمير المنصات عندما تنزل منها الشخصية
            if (platform.isActive && !platform.isDestroyed && platform.isTouched) {
                const distanceBelow = this.character.y - platform.y;
                if (distanceBelow > 80 && this.character.velocityY > 0 && !this.character.isFalling) {
                    this.destroyPlatform(platform.id, false);
                    
                    // نطات إضافية للإنجاز
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
            trap.rotation += 0.015;
            
            // فخ متحرك
            if (trap.isMoving) {
                trap.moveOffset = Math.sin(this.time * 2 + trap.platformId) * 20;
            }
        });
    }
    
    // ===== تحديث العملات =====
    updateCoins() {
        this.coins.forEach(coin => {
            coin.y -= this.platformSpeed;
            coin.rotation += 0.025;
            coin.bounce = Math.sin(this.time * 2 + coin.y * 0.01) * 8;
            coin.glow = Math.sin(this.time * 3) * 0.3 + 0.7;
        });
    }
    
    // ===== تحديث power-ups =====
    updatePowerUps() {
        this.powerUps.forEach(powerUp => {
            powerUp.y -= this.platformSpeed;
            powerUp.rotation += 0.02;
            powerUp.bounce = Math.sin(this.time * 1.5 + powerUp.platformId) * 5;
        });
    }
    
    // ===== تحديث الجسيمات =====
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.life -= 0.03;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.25;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // تحديد عدد الجسيمات
        if (this.particles.length > GameConfig.PARTICLES.MAX_COUNT) {
            this.particles = this.particles.slice(-GameConfig.PARTICLES.MAX_COUNT);
        }
    }
    
    // ===== التصادمات المحسنة =====
    checkEnhancedCollisions() {
        const centerX = this.canvas.width / 2;
        
        // التصادم مع الفخاخ (مع الدرع)
        for (let trap of this.traps) {
            if (!trap.active) continue;
            
            const trapX = centerX + Math.cos(trap.angle + this.helixRotation) * 145 + 
                         (trap.position === 'left' ? -35 : 35) + trap.moveOffset;
            const dx = this.character.x - trapX;
            const dy = this.character.y - trap.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.collisionSize + trap.width/2) {
                if (this.character.hasShield) {
                    // استخدام الدرع
                    this.hitTrapWithShield(trap);
                } else {
                    // موت
                    this.hitTrap(trap);
                }
                break;
            }
        }
        
        // التصادم مع power-ups
        for (let powerUp of this.powerUps) {
            if (!powerUp.active) continue;
            
            const powerUpX = centerX + Math.cos(powerUp.angle + this.helixRotation) * 145;
            const dx = this.character.x - powerUpX;
            const dy = this.character.y - (powerUp.y + powerUp.bounce);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize * 0.7 + powerUp.width/2) {
                this.collectPowerUp(powerUp);
                break;
            }
        }
        
        // البحث عن منصة للهبوط
        if (this.character.isJumping || this.character.isFalling) {
            this.findLandingPlatform();
        }
    }
    
    // ===== البحث عن منصة للهبوط =====
    findLandingPlatform() {
        const centerX = this.canvas.width / 2;
        let targetPlatform = null;
        let minDistance = Infinity;
        
        for (let platform of this.platforms) {
            if (!platform.isActive || platform.isDestroyed) continue;
            
            const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            const verticalDistance = platform.y - (this.character.y + this.character.collisionSize);
            
            // الشخصية فوق المنصة وتنزل
            if (verticalDistance > 0 && verticalDistance < 100 && this.character.velocityY > 0) {
                const horizontalDistance = Math.abs(this.character.x - platformX);
                
                // التحقق من الفجوة
                const leftPart = platform.gapPos;
                const rightPart = platform.width - leftPart - platform.gapWidth;
                
                let isOnSolid = false;
                
                // الجزء الأيسر
                if (horizontalDistance < platform.width/2 && 
                    this.character.x < platformX - platform.width/2 + leftPart) {
                    isOnSolid = true;
                }
                // الجزء الأيمن
                else if (horizontalDistance < platform.width/2 && 
                         this.character.x > platformX - platform.width/2 + leftPart + platform.gapWidth) {
                    isOnSolid = true;
                }
                
                if (isOnSolid && verticalDistance < minDistance) {
                    minDistance = verticalDistance;
                    targetPlatform = platform;
                }
            }
        }
        
        // الهبوط على منصة
        if (targetPlatform) {
            this.landOnPlatform(targetPlatform);
        }
    }
    
    // ===== الهبوط على منصة محسن =====
    landOnPlatform(platform) {
        this.character.y = platform.y - this.character.collisionSize;
        this.character.velocityY = 0;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.currentPlatformIndex = platform.id;
        this.character.rotation = 0;
        this.character.zRotation = 0;
        this.character.successfulJumps++;
        
        // وضع علامة أن المنصة تم لمسها
        platform.isTouched = true;
        
        // حساب النقاط مع الكومبو
        const comboMultiplier = 1 + (this.character.currentCombo * 0.1);
        const points = Math.round(15 * comboMultiplier);
        this.addScore(points);
        
        // إذا كانت نطة مثالية
        const landingAccuracy = Math.abs(this.character.x - (this.canvas.width/2 + Math.cos(platform.angle + this.helixRotation) * 145));
        if (landingAccuracy < 10) {
            this.character.perfectJumps++;
            this.addScore(25); // نقاط إضافية
            this.createPerfectJumpEffect();
        }
        
        // جمع العملات على المنصة
        this.collectCoinsOnPlatform(platform.id);
        
        // جسيمات الهبوط
        this.createLandingParticles(platform);
        
        // اهتزاز الهبوط
        if (this.soundEnabled && navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
    
    // ===== جمع العملات مع power-up =====
    collectCoinsOnPlatform(platformId) {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.platformId !== platformId) return;
            
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const dx = this.character.x - coinX;
            const dy = (this.character.y - coin.y) - coin.bounce;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize * 0.7 + coin.radius) {
                this.collectCoin(coin, coinX);
            }
        });
    }
    
    // ===== جمع العملة المحسن =====
    collectCoin(coin, coinX) {
        coin.collected = true;
        
        // حساب القيمة مع double coins
        let value = coin.value;
        if (this.character.doubleCoins) {
            value *= 2;
        }
        
        this.addScore(value);
        this.coins += value;
        this.totalCoins += value;
        
        if (this.soundEnabled) {
            this.audio.play('coin', 0.6);
            if (navigator.vibrate) navigator.vibrate(30);
        }
        
        // جسيمات العملة
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: coinX + (Math.random() - 0.5) * 30,
                y: coin.y + (Math.random() - 0.5) * 30 + coin.bounce,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 4 + 2,
                color: coin.isSpecial ? '#FF00FF' : GameConfig.COLORS.COIN,
                life: 1
            });
        }
        
        // تحديث الإحصائيات
        this.updateStats();
        localStorage.setItem('helixJumpTotalCoins', this.totalCoins);
    }
    
    // ===== جمع power-up =====
    collectPowerUp(powerUp) {
        powerUp.active = false;
        
        if (this.soundEnabled) {
            this.audio.play('powerUp', 0.7);
            if (navigator.vibrate) navigator.vibrate(200);
        }
        
        if (powerUp.type === 'shield') {
            this.character.hasShield = true;
            this.character.shieldTimer = 300; // 5 ثواني على 60fps
            this.audio.play('shield', 0.5);
            this.createShieldEffect(true);
        } else if (powerUp.type === 'doubleCoins') {
            this.character.doubleCoins = true;
            this.character.doubleCoinsTimer = 600; // 10 ثواني
        }
        
        // جسيمات power-up
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: powerUp.x + (Math.random() - 0.5) * 40,
                y: powerUp.y + (Math.random() - 0.5) * 40 + powerUp.bounce,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: Math.random() * 5 + 3,
                color: GameConfig.COLORS.POWERUP,
                life: 1
            });
        }
    }
    
    // ===== ضرب فخ مع درع =====
    hitTrapWithShield(trap) {
        trap.active = false;
        this.character.shieldTimer = Math.max(0, this.character.shieldTimer - 100);
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: trap.x + (Math.random() - 0.5) * 40,
                y: trap.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 6,
                size: Math.random() * 6 + 3,
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
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 40,
                y: this.character.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 6,
                size: Math.random() * 6 + 3,
                color: GameConfig.COLORS.TRAP,
                life: 1
            });
        }
        
        if (this.soundEnabled) {
            this.audio.play('trap', 0.9);
            this.audio.play('gameOver', 0.7);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        this.character.isFalling = true;
        this.character.currentCombo = 0;
        
        setTimeout(() => {
            this.endGame();
        }, 300);
    }
    
    // ===== جسيمات محسنة =====
    createJumpParticles() {
        for (let i = 0; i < GameConfig.PARTICLES.JUMP_COUNT; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 30,
                y: this.character.y + this.character.displaySize,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                size: Math.random() * 4 + 2,
                color: this.character.color,
                life: 1
            });
        }
    }
    
    createLandingParticles(platform) {
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
        
        for (let i = 0; i < GameConfig.PARTICLES.LAND_COUNT; i++) {
            this.particles.push({
                x: platformX + (Math.random() - 0.5) * platform.width,
                y: platform.y + platform.height / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                size: Math.random() * 3 + 2,
                color: platform.isBouncy ? '#FF9800' : platform.color,
                life: 1
            });
        }
    }
    
    createPlatformBreakParticles(platform) {
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
        
        for (let i = 0; i < GameConfig.PARTICLES.DESTROY_COUNT; i++) {
            this.particles.push({
                x: platformX + (Math.random() - 0.5) * platform.width,
                y: platform.y + platform.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: Math.random() * 5 + 3,
                color: platform.edgeColor,
                life: 1
            });
        }
    }
    
    createShieldEffect(gained) {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 60,
                y: this.character.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 6 + 4,
                color: GameConfig.COLORS.SHIELD,
                life: 1
            });
        }
    }
    
    createComboEffect() {
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 50,
                y: this.character.y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                size: Math.random() * 5 + 3,
                color: '#FF00FF',
                life: 1
            });
        }
    }
    
    createPerfectJumpEffect() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.character.x,
                y: this.character.y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: Math.random() * 4 + 2,
                color: '#FFFF00',
                life: 1.5
            });
        }
    }
    
    // ===== تحديث الصعوبة =====
    updateDifficulty() {
        const newLevel = Math.floor(this.score / 350) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelElement.textContent = this.level;
            
            // زيادة السرعة تدريجياً
            this.platformSpeed += 0.15;
            
            // تغيير الصعوبة بناءً على المستوى
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
        platform.y = this.canvas.height + 300;
        platform.angle = Math.random() * Math.PI * 2;
        platform.isActive = true;
        platform.isDestroyed = false;
        platform.destroyTimer = 0;
        platform.isTouched = false;
        platform.rotation = 0;
        
        // خاصيات خاصة
        platform.isBouncy = Math.random() < 0.1;
        platform.isMoving = Math.random() < 0.05;
        platform.moveDirection = Math.random() > 0.5 ? 1 : -1;
        
        // إزالة العناصر القديمة
        this.traps = this.traps.filter(t => t.platformId !== platform.id);
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        this.powerUps = this.powerUps.filter(p => p.platformId !== platform.id);
        
        // إضافة عناصر جديدة بناءً على الصعوبة
        const trapChance = GameConfig.DIFFICULTY[this.difficulty].TRAP_CHANCE;
        if (Math.random() < trapChance) {
            const trap = {
                x: 0,
                y: platform.y - 18,
                width: 28,
                height: 20,
                angle: platform.angle,
                type: 'spike',
                active: true,
                rotation: 0,
                platformId: platform.id,
                position: Math.random() > 0.5 ? 'left' : 'right',
                isMoving: Math.random() < 0.2,
                moveOffset: 0
            };
            
            this.traps.push(trap);
        }
        
        // عملة
        if (Math.random() < 0.2) {
            this.coins.push({
                x: 0,
                y: platform.y - 45,
                radius: 16,
                angle: platform.angle,
                collected: false,
                rotation: 0,
                value: Math.random() < 0.1 ? 50 : 20,
                platformId: platform.id,
                bounce: 0,
                glow: 0,
                isSpecial: Math.random() < 0.05
            });
        }
        
        // power-up
        if (Math.random() < 0.05) {
            this.powerUps.push({
                x: 0,
                y: platform.y - 60,
                width: 25,
                height: 25,
                angle: platform.angle,
                type: Math.random() < 0.5 ? 'shield' : 'doubleCoins',
                active: true,
                rotation: 0,
                platformId: platform.id,
                bounce: 0
            });
        }
    }
    
    // ===== الرسم المحسن =====
    draw() {
        if (!this.gameActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // خلفية محسنة
        this.drawEnhancedBackground();
        
        // كائنات الخلفية المتحركة
        this.drawBackgroundObjects();
        
        // الأسطوانة 3D
        this.drawEnhancedHelix();
        
        // المنصات
        this.drawEnhancedPlatforms();
        
        // الفخاخ
        this.drawTraps();
        
        // العملات
        this.drawEnhancedCoins();
        
        // power-ups
        this.drawPowerUps();
        
        // أثر الشخصية
        this.drawTrail();
        
        // الشخصية
        this.drawEnhancedCharacter();
        
        // الجسيمات
        this.drawParticles();
        
        // واجهة أثناء اللعب
        this.drawInGameUI();
    }
    
    // ===== رسم الخلفية المحسنة =====
    drawEnhancedBackground() {
        // تدرج متحرك
        const gradient = this.ctx.createLinearGradient(
            0, this.cameraY,
            0, this.canvas.height + this.cameraY
        );
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, GameConfig.COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // تأثيرات دائرية متحركة
        for (let i = 0; i < 4; i++) {
            const radius = 60 + i * 40;
            const alpha = 0.04 - i * 0.01;
            const yOffset = Math.sin(this.time * 0.5 + i) * 20;
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.canvas.width / 2,
                this.canvas.height / 2 + this.cameraY + yOffset,
                radius,
                0, Math.PI * 2
            );
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        }
    }
    
    // ===== رسم كائنات الخلفية =====
    drawBackgroundObjects() {
        this.backgroundObjects.forEach(obj => {
            this.ctx.globalAlpha = obj.alpha;
            this.ctx.fillStyle = '#FFFFFF';
            
            if (obj.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // نجمة
                this.ctx.save();
                this.ctx.translate(obj.x, obj.y);
                this.ctx.rotate(this.time * 0.5);
                this.drawStar(0, 0, obj.size, obj.size * 2, 5);
                this.ctx.restore();
            }
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // ===== رسم الأسطوانة =====
    drawEnhancedHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + this.cameraY;
        
        // مركز الأسطوانة مع تأثير عمق
        const centerGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 70
        );
        centerGradient.addColorStop(0, 'rgba(33, 150, 243, 0.7)');
        centerGradient.addColorStop(0.7, 'rgba(33, 150, 243, 0.3)');
        centerGradient.addColorStop(1, 'rgba(33, 150, 243, 0.1)');
        
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الخطوط الحلزونية
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const cos = Math.cos(angle);
            const x1 = centerX + cos * 70;
            const x2 = centerX + cos * 240;
            
            const lineGradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            lineGradient.addColorStop(0, 'rgba(33, 150, 243, 0.95)');
            lineGradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.6)');
            lineGradient.addColorStop(1, 'rgba(33, 150, 243, 0.3)');
            
            this.ctx.strokeStyle = lineGradient;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            
            this.ctx.shadowColor = 'rgba(33, 150, 243, 0.5)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
        
        // الحد الخارجي
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(33, 150, 243, 0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 240, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    // ===== رسم المنصات المحسنة =====
    drawEnhancedPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            const y = platform.y + platform.depth;
            
            let alpha = 1;
            if (platform.isDestroyed) {
                alpha = platform.destroyTimer / 40;
            }
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(platform.rotation);
            
            // الظل
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.25 * alpha})`;
            this.ctx.fillRect(
                -platform.width / 2 + 4,
                platform.height / 2 + 4,
                platform.width * 0.9,
                platform.height / 4
            );
            
            // المنصة الرئيسية
            let platformColor;
            if (platform.isBouncy) {
                // منصة نطاطة
                const bounceGradient = this.ctx.createLinearGradient(
                    -platform.width / 2, -platform.height / 2,
                    -platform.width / 2, platform.height
                );
                bounceGradient.addColorStop(0, `rgba(255, 152, 0, ${alpha})`);
                bounceGradient.addColorStop(0.5, `rgba(255, 152, 0, ${alpha})`);
                bounceGradient.addColorStop(1, `rgba(255, 152, 0, ${alpha})`);
                platformColor = bounceGradient;
            } else {
                const platformGradient = this.ctx.createLinearGradient(
                    -platform.width / 2, -platform.height / 2,
                    -platform.width / 2, platform.height
                );
                platformGradient.addColorStop(0, `rgba(76, 175, 80, ${alpha})`);
                platformGradient.addColorStop(0.5, `rgba(66, 165, 70, ${alpha})`);
                platformGradient.addColorStop(1, `rgba(56, 155, 60, ${alpha})`);
                platformColor = platformGradient;
            }
            
            this.ctx.fillStyle = platformColor;
            
            // الجزء الأيسر
            this.ctx.fillRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.gapPos,
                platform.height
            );
            
            // الجزء الأيمن
            this.ctx.fillRect(
                -platform.width / 2 + platform.gapPos + platform.gapWidth,
                -platform.height / 2,
                platform.width - platform.gapPos - platform.gapWidth,
                platform.height
            );
            
            // الفجوة
            this.ctx.fillStyle = `rgba(26, 35, 126, ${0.85 * alpha})`;
            this.ctx.fillRect(
                -platform.width / 2 + platform.gapPos,
                -platform.height / 2,
                platform.gapWidth,
                platform.height
            );
            
            // حواف
            this.ctx.strokeStyle = platform.isBouncy ? '#FF9800' : `rgba(46, 125, 50, ${alpha})`;
            this.ctx.lineWidth = 3;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2, -platform.height / 2);
            this.ctx.lineTo(-platform.width / 2 + platform.gapPos, -platform.height / 2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2 + platform.gapPos + platform.gapWidth, -platform.height / 2);
            this.ctx.lineTo(platform.width / 2, -platform.height / 2);
            this.ctx.stroke();
            
            // إضاءة حواف
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * alpha})`;
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2 + 2, -platform.height / 2 + 2);
            this.ctx.lineTo(-platform.width / 2 + platform.gapPos - 2, -platform.height / 2 + 2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2 + platform.gapPos + platform.gapWidth + 2, -platform.height / 2 + 2);
            this.ctx.lineTo(platform.width / 2 - 2, -platform.height / 2 + 2);
            this.ctx.stroke();
            
            // تأثير النبض
            if (platform.isTouched && !platform.isDestroyed) {
                const pulseAlpha = Math.sin(this.time * 5) * 0.2 + 0.3;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha * alpha})`;
                this.ctx.fillRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.width,
                    platform.height
                );
            }
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم الفخاخ =====
    drawTraps() {
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active || trap.y > this.canvas.height + 100 || trap.y < -100) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(trap.angle + this.helixRotation) * 145 + 
                     (trap.position === 'left' ? -35 : 35) + trap.moveOffset;
            const y = trap.y;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(trap.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(3, 3, trap.width / 2 + 1, trap.height / 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفخ الرئيسي
            const trapGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, trap.width / 2);
            trapGradient.addColorStop(0, '#FF5252');
            trapGradient.addColorStop(0.6, '#E53935');
            trapGradient.addColorStop(1, '#C62828');
            
            this.ctx.fillStyle = trapGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, trap.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // أشواك
            this.ctx.fillStyle = '#FF8A80';
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const spikeLength = 10;
                
                this.ctx.save();
                this.ctx.rotate(angle);
                this.ctx.translate(trap.width / 2, 0);
                
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(spikeLength, -spikeLength / 2);
                this.ctx.lineTo(spikeLength, spikeLength / 2);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم العملات =====
    drawEnhancedCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height + 100 || coin.y < -100) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const y = coin.y + coin.bounce;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(coin.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 4, coin.radius, coin.radius / 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // العملة
            const coinGradient = this.ctx.createRadialGradient(0, -coin.radius * 0.3, 0, 0, 0, coin.radius);
            coinGradient.addColorStop(0, '#FFEA00');
            coinGradient.addColorStop(0.5, '#FFD600');
            coinGradient.addColorStop(0.8, '#FFAB00');
            coinGradient.addColorStop(1, '#FF8F00');
            
            this.ctx.fillStyle = coin.isSpecial ? '#FF00FF' : coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // حواف
            this.ctx.strokeStyle = coin.isSpecial ? '#FFFFFF' : '#FFC400';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius - 1, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // النجمة
            this.ctx.fillStyle = coin.isSpecial ? '#FFFFFF' : '#FFFF00';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            // توهج للعملات الخاصة
            if (coin.isSpecial) {
                this.ctx.shadowColor = '#FF00FF';
                this.ctx.shadowBlur = 25 * coin.glow;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius * 1.2, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 * coin.glow})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else if (coin.value === 50) {
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 20 * coin.glow;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius * 1.2, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 255, 0, ${0.5 * coin.glow})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });
    }
    
    // ===== رسم power-ups =====
    drawPowerUps() {
        const centerX = this.canvas.width / 2;
        
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active || powerUp.y > this.canvas.height + 100 || powerUp.y < -100) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(powerUp.angle + this.helixRotation) * 145;
            const y = powerUp.y + powerUp.bounce;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(powerUp.rotation);
            
            // ظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(-powerUp.width/2 + 2, powerUp.height/2 + 2, powerUp.width, powerUp.height/4);
            
            // power-up الرئيسي
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
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
            
            // رمز
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
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
            const alpha = point.life * 0.4;
            const size = point.size * point.life;
            
            this.ctx.fillStyle = `rgba(${this.hexToRgb(point.color)}, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // ===== رسم الشخصية المحسنة =====
    drawEnhancedCharacter() {
        this.ctx.save();
        
        const x = this.character.x;
        const y = this.character.y + this.character.bounce;
        const scale = this.character.scale;
        
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        this.ctx.rotate(this.character.rotation);
        
        // تطبيق تأثير الدوران 3D
        const skewX = Math.sin(this.character.zRotation) * 0.2;
        this.ctx.transform(1, 0, skewX, 1, 0, 0);
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            8, 8,
            this.character.displaySize * 0.9,
            this.character.displaySize * 0.3,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // رسم الدرع إذا موجود
        if (this.character.hasShield) {
            const shieldAlpha = 0.3 + Math.sin(this.time * 10) * 0.2;
            this.ctx.strokeStyle = `rgba(0, 188, 212, ${shieldAlpha})`;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.displaySize + 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        if (this.character.imageLoaded && this.character.images[this.character.currentImage]) {
            // الصورة مع تأثيرات
            this.ctx.save();
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetY = 3;
            
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
            
            // إضاءة
            const highlightGradient = this.ctx.createRadialGradient(
                -this.character.displaySize * 0.3,
                -this.character.displaySize * 0.3,
                0,
                -this.character.displaySize * 0.1,
                -this.character.displaySize * 0.1,
                this.character.displaySize * 0.6
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(
                -this.character.displaySize * 0.2,
                -this.character.displaySize * 0.2,
                this.character.displaySize * 0.5,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            // العيون
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-15, -10, 8, 0, Math.PI * 2);
            this.ctx.arc(15, -10, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // التلاميذ
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-12, -10, 4, 0, Math.PI * 2);
            this.ctx.arc(12, -10, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // بريق العيون
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-13, -12, 2, 0, Math.PI * 2);
            this.ctx.arc(13, -12, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفم
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(0, 8, 20, 0.2 * Math.PI, 0.8 * Math.PI);
            this.ctx.stroke();
            
            // قبعة
            this.ctx.fillStyle = '#3F51B5';
            this.ctx.fillRect(-20, -this.character.displaySize - 5, 40, 15);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -this.character.displaySize - 5, 20, 8, 0, 0, Math.PI);
            this.ctx.fill();
        }
        
        // رسم نطات إضافية
        if (this.character.extraJumps > 0) {
            this.ctx.fillStyle = '#FF4081';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`+${this.character.extraJumps}`, 0, -this.character.displaySize - 20);
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
    
    // ===== رسم واجهة أثناء اللعب =====
    drawInGameUI() {
        // عرض الكومبو
        if (this.character.currentCombo > 1) {
            this.ctx.fillStyle = '#FF00FF';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(`Combo x${this.character.currentCombo}`, this.canvas.width / 2, 20);
            this.ctx.shadowBlur = 0;
        }
        
        // عرض المؤقتات
        if (this.character.hasShield) {
            const shieldTime = Math.ceil(this.character.shieldTimer / 60);
            this.ctx.fillStyle = '#00BCD4';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`🛡️ ${shieldTime}s`, 10, 30);
        }
        
        if (this.character.doubleCoins) {
            const doubleTime = Math.ceil(this.character.doubleCoinsTimer / 60);
            this.ctx.fillStyle = '#FF9800';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`2× ${doubleTime}s`, 10, 50);
        }
    }
    
    // ===== دوال مساعدة =====
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '255, 64, 129';
    }
    
    // ===== إضافة النقاط =====
    addScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('helixJumpHighScore', this.highScore);
        }
    }
    
    // ===== الأحداث المحسنة =====
    setupEventListeners() {
        // التحكم باللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
            
            // النط باللمس
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
            
            // النط بالنقر
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
                    this.rotateHelix(-40);
                    break;
                case 'ArrowRight':
                    this.rotateHelix(40);
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
        
        // الأزرار
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
    }
    
    // ===== نهاية اللعبة =====
    endGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        this.gamesPlayed++;
        
        // تحديث الإحصائيات
        localStorage.setItem('helixJumpGamesPlayed', this.gamesPlayed);
        localStorage.setItem('helixJumpTotalJumps', this.totalJumps);
        
        // تحديث شاشة النهاية
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
    
    // ===== إعادة تشغيل اللعبة =====
    restartGame() {
        this.score = 0;
        this.coins = 0;
        this.level = 1;
        this.gameActive = true;
        this.isPaused = false;
        this.helixRotation = 0;
        this.platformSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.lightAngle = 0;
        this.cameraY = 0;
        this.time = 0;
        
        // إعادة تعيين الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 200;
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
        
        // تحديث العرض
        this.scoreElement.textContent = '0';
        this.levelElement.textContent = '1';
        this.updateStats();
        
        // إعادة إنشاء العناصر
        this.createGameElements();
        
        // إخفاء الشاشات
        this.gameOverScreen.style.display = 'none';
        this.pauseScreen.style.display = 'none';
        this.shopScreen.style.display = 'none';
        this.statsScreen.style.display = 'none';
        
        // إعادة تشغيل الموسيقى
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
    // التأكد من تحميل الصفحة بالكامل
    setTimeout(() => {
        try {
            const game = new HelixJump();
            window.game = game; // جعل اللعبة متاحة عالمياً
            console.log('🎮 HELIX JUMP 6.0 - الإصدار الخارق 🎮');
            console.log('✅ جميع التحسينات تم تطبيقها بنجاح!');
            
            // إخفاء شاشة التحميل
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

// جعل الفئة متاحة عالمياً
window.HelixJump = HelixJump;
