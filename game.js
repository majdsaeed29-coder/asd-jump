// ===== إعدادات اللعبة الدقيقة =====
const GameConfig = {
    VERSION: "5.0",
    JUMP_RATE: 2,           // نطتين في الثانية
    PLATFORM_SPACING: 150,  // مسافة متساوية بين المنصات
    PLATFORM_HEIGHT: 25,    // ارتفاع المنصة
    GAP_WIDTH: 30,          // عرض الفجوة في المنصة (30 كما طلبت)
    JUMP_HEIGHT: 15,        // ارتفاع النطة (15 كما طلبت)
    GRAVITY: 1.8,           // جاذبية أقوى لنطات قصيرة
    JUMP_POWER: 9,          // قوة قفز أقل لارتفاع 15
    CHARACTER: {
        DISPLAY_SIZE: 50,   // حجم العرض (50 كما طلبت)
        COLLISION_SIZE: 20, // حجم التصادم (20 كما طلبت)
        COLOR: '#FF4081'
    },
    COLORS: {
        PLATFORM: '#4CAF50',  // لون واحد للمنصات
        PLATFORM_EDGE: '#2E7D32',
        GAP: '#1A237E',
        TRAP: '#FF5252',
        COIN: '#FFD600',
        HELIX: 'rgba(33, 150, 243, 0.8)',
        BACKGROUND: {
            TOP: '#0D47A1',
            MIDDLE: '#1565C0',
            BOTTOM: '#1976D2'
        }
    }
};

// ===== فئة اللعبة الرئيسية =====
class HelixJump {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // عناصر واجهة المستخدم
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalHighScoreElement = document.getElementById('finalHighScore');
        this.finalLevelElement = document.getElementById('finalLevel');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.restartButton = document.getElementById('restartButton');
        
        // إعدادات اللعبة
        this.score = 0;
        this.level = 1;
        this.highScore = localStorage.getItem('helixJumpHighScore') || 0;
        this.gameActive = true;
        this.helixRotation = 0;
        this.helixSpeed = 0.04;
        this.platformSpeed = 5;
        this.gravity = GameConfig.GRAVITY;
        
        // الشخصية (50 للعرض، 20 للتصادم)
        this.character = {
            x: this.canvas.width / 2,
            y: 200,
            displaySize: GameConfig.CHARACTER.DISPLAY_SIZE,      // 50 للعرض
            collisionSize: GameConfig.CHARACTER.COLLISION_SIZE,  // 20 للتصادم
            jumpPower: GameConfig.JUMP_POWER,                    // 9 لقفز بارتفاع 15
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            color: GameConfig.CHARACTER.COLOR,
            image: null,
            imageLoaded: false,
            currentPlatformIndex: -1,
            isFalling: false,
            trail: [],
            jumpInterval: null,
            shouldJump: false,
            // إحصائيات
            jumps: 0,
            lastJumpTime: 0,
            // تأثيرات 3D محسنة
            zRotation: 0,
            shadowOffset: 0,
            scale: 1,
            bounce: 0
        };
        
        // تحميل صورة الشخصية
        this.loadCharacterImage();
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        // التحكم
        this.isDragging = false;
        this.lastTouchX = 0;
        this.rotationDirection = 0;
        
        // 3D Effects محسنة
        this.lightAngle = 0;
        this.cameraY = 0;
        this.time = 0;
        
        // الصوتيات
        this.audio = {
            jump: document.getElementById('jumpSound'),
            coin: document.getElementById('coinSound'),
            gameOver: document.getElementById('gameOverSound'),
            
            play: function(sound, volume = 0.7) {
                if (!this[sound]) return;
                try {
                    this[sound].currentTime = 0;
                    this[sound].volume = volume;
                    this[sound].play();
                } catch (e) {
                    console.log('خطأ في تشغيل الصوت:', e);
                }
            }
        };
        
        // التهيئة
        this.init();
    }
    
    // ===== تحميل صورة الشخصية =====
    loadCharacterImage() {
        this.character.image = new Image();
        this.character.image.src = 'assets/engineer.png';
        
        this.character.image.onload = () => {
            this.character.imageLoaded = true;
            console.log('✅ صورة الشخصية حمّلت بنجاح!');
        };
        
        this.character.image.onerror = () => {
            console.log('❌ لم يتم العثور على الصورة، استخدام شكل 3D بديل');
            this.character.imageLoaded = false;
        };
    }
    
    // ===== التهيئة =====
    init() {
        // تحديث أعلى نتيجة
        this.highScoreElement.textContent = this.highScore;
        
        // إنشاء العناصر
        this.createGameElements();
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        // بدء نظام النط التلقائي (نطتين في الثانية)
        this.startAutoJumpSystem();
        
        // بدء اللعبة
        this.gameLoop();
    }
    
    // ===== نظام النط التلقائي (نطتين في الثانية) =====
    startAutoJumpSystem() {
        if (this.character.jumpInterval) {
            clearInterval(this.character.jumpInterval);
        }
        
        this.character.jumpInterval = setInterval(() => {
            if (this.gameActive && !this.character.isJumping && !this.character.isFalling) {
                this.character.shouldJump = true;
            }
        }, 500);
    }
    
    // ===== إنشاء عناصر اللعبة =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        const platformCount = 25;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * GameConfig.PLATFORM_SPACING;
            
            // إنشاء منصة موحدة اللون مع فجوة 30px
            this.platforms.push({
                id: i,
                x: 0,
                y: y,
                width: 120,
                height: GameConfig.PLATFORM_HEIGHT,
                angle: angle,
                hasGap: true,
                gapPos: 45, // موضع ثابت للفجوة
                gapWidth: GameConfig.GAP_WIDTH, // عرض الفجوة 30px
                color: GameConfig.COLORS.PLATFORM,
                edgeColor: GameConfig.COLORS.PLATFORM_EDGE,
                isActive: true,
                isDestroyed: false,
                destroyTimer: 0,
                isTouched: false, // هل لمسها اللاعب؟
                rotation: 0,
                // تأثيرات 3D محسنة
                depth: 0,
                highlight: false,
                pulse: 0
            });
            
            // فخ (20% فرصة) - يظهر على جانبي الفجوة
            if (Math.random() < 0.2) {
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
                    position: Math.random() > 0.5 ? 'left' : 'right'
                };
                
                this.traps.push(trap);
            }
            
            // عملة (15% فرصة)
            if (Math.random() < 0.15) {
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
                    glow: 0
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
        
        // وضع علامة أن المنصة تم لمسها
        platform.isTouched = true;
    }
    
    // ===== النط (ارتفاع 15 فقط) =====
    jump() {
        if (!this.gameActive || this.character.isJumping || this.character.isFalling) return;
        
        const currentPlatform = this.platforms[this.character.currentPlatformIndex];
        if (!currentPlatform || !currentPlatform.isActive) {
            this.character.isFalling = true;
            return;
        }
        
        this.character.isJumping = true;
        this.character.velocityY = -this.character.jumpPower; // قوة أقل لارتفاع 15
        this.character.jumps++;
        this.character.lastJumpTime = Date.now();
        
        // تأثيرات القفز
        this.character.scale = 0.85;
        this.character.zRotation = 0.2;
        
        // الصوت
        this.audio.play('jump', 0.5);
        
        // جسيمات النط
        this.createJumpParticles();
        
        this.character.shouldJump = false;
        
        // إذا كانت الشخصية تنزل من منصة، لا تدمر المنصة التي تحتها
        // (سنتعامل مع هذا في التصادمات)
    }
    
    // ===== تدمير المنصة =====
    destroyPlatform(platformIndex, immediate = false) {
        if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
        
        const platform = this.platforms[platformIndex];
        if (platform.isDestroyed) return;
        
        platform.isDestroyed = true;
        platform.isActive = false;
        platform.destroyTimer = immediate ? 10 : 40;
        
        // جسيمات التدمير
        this.createPlatformBreakParticles(platform);
    }
    
    // ===== تدوير الأسطوانة =====
    rotateHelix(deltaX) {
        if (!this.gameActive) return;
        
        this.helixRotation += deltaX * this.helixSpeed * 0.3;
        this.rotationDirection = Math.sign(deltaX);
        this.lightAngle += deltaX * 0.008;
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics() {
        if (!this.gameActive) return;
        
        this.time += 0.016; // 60 FPS
        
        // التحقق إذا كان يجب النط
        if (this.character.shouldJump && !this.character.isJumping && !this.character.isFalling) {
            this.jump();
        }
        
        // تحديث تأثيرات 3D
        this.lightAngle += 0.008;
        this.cameraY = Math.sin(this.time * 0.8) * 8;
        
        // تحديث الشخصية
        if (this.character.isJumping || this.character.isFalling) {
            // تأثيرات القفز
            this.character.rotation += 0.15;
            this.character.zRotation *= 0.9;
            this.character.scale += (1 - this.character.scale) * 0.15;
            this.character.bounce = Math.sin(this.time * 10) * 2;
            
            // تطبيق الجاذبية (أقوى لنطات قصيرة)
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
            
            // أثر القفز
            if (Math.random() < 0.3) {
                this.character.trail.push({
                    x: this.character.x,
                    y: this.character.y,
                    life: 1,
                    size: this.character.displaySize * 0.4
                });
            }
        }
        
        // تحديث الأثر
        this.character.trail = this.character.trail.filter(p => {
            p.life -= 0.06;
            return p.life > 0;
        });
        
        // تحريك المنصات للأسفل
        this.platforms.forEach(platform => {
            platform.y -= this.platformSpeed;
            
            // تحديث تأثيرات 3D للمنصات
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
            
            // **المنصات التي لمستها الشخصية ولا تزال تحتها لا تتدمر**
            // **المنصات التي قطعتها الشخصية أثناء النزول تتدمر**
            if (platform.isActive && !platform.isDestroyed && platform.isTouched) {
                const distanceBelow = this.character.y - platform.y;
                // إذا كانت الشخصية فوق المنصة بمسافة معينة (تنزل)، تدمر المنصة
                if (distanceBelow > 50 && this.character.velocityY > 0) {
                    this.destroyPlatform(platform.id, false);
                }
            }
        });
        
        // تحريك العناصر الأخرى
        this.traps.forEach(trap => {
            trap.y -= this.platformSpeed;
            trap.rotation += 0.015;
        });
        
        this.coins.forEach(coin => {
            coin.y -= this.platformSpeed;
            coin.rotation += 0.025;
            coin.bounce = Math.sin(this.time * 2 + coin.y * 0.01) * 8;
            coin.glow = Math.sin(this.time * 3) * 0.3 + 0.7;
        });
        
        // تحديث الجسيمات
        this.particles.forEach((particle, index) => {
            particle.life -= 0.03;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.25;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // التحقق من التصادمات
        this.checkCollisions();
        
        // التحقق من خروج الشخصية
        if (this.character.y > this.canvas.height + 300) {
            this.endGame();
        }
        
        // زيادة الصعوبة
        const newLevel = Math.floor(this.score / 350) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelElement.textContent = this.level;
            this.platformSpeed += 0.3;
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
        
        // إزالة الفخاخ والعملات
        this.traps = this.traps.filter(t => t.platformId !== platform.id);
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        
        // فخ جديد (20% فرصة)
        if (Math.random() < 0.2) {
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
                position: Math.random() > 0.5 ? 'left' : 'right'
            };
            
            this.traps.push(trap);
        }
        
        // عملة جديدة (15% فرصة)
        if (Math.random() < 0.15) {
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
                glow: 0
            });
        }
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        if (this.character.isJumping || this.character.isFalling) {
            // البحث عن منصة للهبوط
            let targetPlatform = null;
            let minDistance = Infinity;
            
            for (let platform of this.platforms) {
                if (!platform.isActive || platform.isDestroyed) continue;
                
                const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
                const verticalDistance = platform.y - (this.character.y + this.character.collisionSize);
                
                // الشخصية فوق المنصة وتنزل
                if (verticalDistance > 0 && verticalDistance < 100 && this.character.velocityY > 0) {
                    const horizontalDistance = Math.abs(this.character.x - platformX);
                    
                    // التحقق من الفجوة 30px
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
        
        // التصادم مع الفخاخ
        for (let trap of this.traps) {
            if (!trap.active) continue;
            
            const trapX = centerX + Math.cos(trap.angle + this.helixRotation) * 145 + 
                         (trap.position === 'left' ? -35 : 35);
            const dx = this.character.x - trapX;
            const dy = this.character.y - trap.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.collisionSize + trap.width/2) {
                this.hitTrap(trap);
                break;
            }
        }
    }
    
    // ===== الهبوط على منصة =====
    landOnPlatform(platform) {
        this.character.y = platform.y - this.character.collisionSize;
        this.character.velocityY = 0;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.currentPlatformIndex = platform.id;
        this.character.rotation = 0;
        this.character.zRotation = 0;
        
        // وضع علامة أن المنصة تم لمسها
        platform.isTouched = true;
        
        // إضافة النقاط
        this.addScore(15);
        
        // جسيمات الهبوط
        this.createLandingParticles(platform);
        
        // جمع العملات
        this.collectCoinsOnPlatform(platform.id);
    }
    
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
        
        this.audio.play('gameOver', 0.9);
        
        setTimeout(() => {
            this.endGame();
        }, 300);
    }
    
    collectCoin(coin, coinX) {
        coin.collected = true;
        this.addScore(coin.value);
        this.audio.play('coin', 0.6);
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: coinX + (Math.random() - 0.5) * 30,
                y: coin.y + (Math.random() - 0.5) * 30 + coin.bounce,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 4 + 2,
                color: GameConfig.COLORS.COIN,
                life: 1
            });
        }
    }
    
    // ===== جسيمات =====
    createJumpParticles() {
        for (let i = 0; i < 12; i++) {
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
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: platformX + (Math.random() - 0.5) * platform.width,
                y: platform.y + platform.height / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                size: Math.random() * 3 + 2,
                color: platform.color,
                life: 1
            });
        }
    }
    
    createPlatformBreakParticles(platform) {
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
        
        for (let i = 0; i < 20; i++) {
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
    
    // ===== الرسم 3D المحسن =====
    draw() {
        if (!this.gameActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // خلفية 3D محسنة
        this.drawEnhancedBackground();
        
        // الأسطوانة 3D محسنة
        this.drawEnhancedHelix();
        
        // المنصات 3D محسنة
        this.drawEnhancedPlatforms();
        
        // الفخاخ
        this.drawTraps();
        
        // العملات 3D محسنة
        this.drawEnhancedCoins();
        
        // أثر الشخصية
        this.drawTrail();
        
        // الشخصية 3D محسنة
        this.drawEnhancedCharacter();
        
        // الجسيمات
        this.drawParticles();
    }
    
    drawEnhancedBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, GameConfig.COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // تأثيرات دائرية 3D
        for (let i = 0; i < 6; i++) {
            const radius = 80 + i * 60;
            const alpha = 0.05 - i * 0.007;
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.canvas.width / 2,
                this.canvas.height / 2 + this.cameraY,
                radius,
                0, Math.PI * 2
            );
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        }
    }
    
    drawEnhancedHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // مركز الأسطوانة 3D
        const centerGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 65
        );
        centerGradient.addColorStop(0, 'rgba(33, 150, 243, 0.6)');
        centerGradient.addColorStop(0.7, 'rgba(33, 150, 243, 0.3)');
        centerGradient.addColorStop(1, 'rgba(33, 150, 243, 0.1)');
        
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 65, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الخطوط الحلزونية 3D محسنة (8 خطوط)
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const cos = Math.cos(angle);
            const x1 = centerX + cos * 65;
            const x2 = centerX + cos * 230;
            
            // تدرج 3D للخط
            const lineGradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            lineGradient.addColorStop(0, 'rgba(33, 150, 243, 0.9)');
            lineGradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.6)');
            lineGradient.addColorStop(1, 'rgba(33, 150, 243, 0.3)');
            
            this.ctx.strokeStyle = lineGradient;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            
            // تأثير إضاءة 3D
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
        
        // حدود الأسطوانة 3D محسنة
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(33, 150, 243, 0.4)';
        this.ctx.shadowBlur = 25;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 230, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawEnhancedPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            const y = platform.y + platform.depth;
            
            // الشفافية للمنصات المدمرة
            let alpha = 1;
            if (platform.isDestroyed) {
                alpha = platform.destroyTimer / 40;
            }
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(platform.rotation);
            
            // الظل 3D
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.25 * alpha})`;
            this.ctx.fillRect(
                -platform.width / 2 + 4,
                platform.height / 2 + 4,
                platform.width * 0.9,
                platform.height / 4
            );
            
            // المنصة الرئيسية 3D
            const platformGradient = this.ctx.createLinearGradient(
                -platform.width / 2, -platform.height / 2,
                -platform.width / 2, platform.height
            );
            platformGradient.addColorStop(0, `rgba(76, 175, 80, ${alpha})`);
            platformGradient.addColorStop(0.5, `rgba(66, 165, 70, ${alpha})`);
            platformGradient.addColorStop(1, `rgba(56, 155, 60, ${alpha})`);
            
            this.ctx.fillStyle = platformGradient;
            
            // الجزء الأيسر (قبل الفجوة)
            this.ctx.fillRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.gapPos,
                platform.height
            );
            
            // الجزء الأيمن (بعد الفجوة)
            this.ctx.fillRect(
                -platform.width / 2 + platform.gapPos + platform.gapWidth,
                -platform.height / 2,
                platform.width - platform.gapPos - platform.gapWidth,
                platform.height
            );
            
            // الفجوة 30px (3D)
            this.ctx.fillStyle = `rgba(26, 35, 126, ${0.85 * alpha})`;
            this.ctx.fillRect(
                -platform.width / 2 + platform.gapPos,
                -platform.height / 2,
                platform.gapWidth,
                platform.height
            );
            
            // حواف 3D محسنة
            this.ctx.strokeStyle = `rgba(46, 125, 50, ${alpha})`;
            this.ctx.lineWidth = 3;
            
            // الحافة العلوية اليسرى
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2, -platform.height / 2);
            this.ctx.lineTo(-platform.width / 2 + platform.gapPos, -platform.height / 2);
            this.ctx.stroke();
            
            // الحافة العلوية اليمنى
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2 + platform.gapPos + platform.gapWidth, -platform.height / 2);
            this.ctx.lineTo(platform.width / 2, -platform.height / 2);
            this.ctx.stroke();
            
            // إضاءة حواف 3D
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
            
            // تأثير النبض للمنصات التي تم لمسها
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
    
    drawTraps() {
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active || trap.y > this.canvas.height + 100 || trap.y < -100) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(trap.angle + this.helixRotation) * 145 + 
                     (trap.position === 'left' ? -35 : 35);
            const y = trap.y;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(trap.rotation);
            
            // ظل 3D
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(3, 3, trap.width / 2 + 1, trap.height / 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفخ الرئيسي 3D
            const trapGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, trap.width / 2);
            trapGradient.addColorStop(0, '#FF5252');
            trapGradient.addColorStop(0.6, '#E53935');
            trapGradient.addColorStop(1, '#C62828');
            
            this.ctx.fillStyle = trapGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, trap.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // أشواك 3D
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
    
    drawEnhancedCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height + 100 || coin.y < -100) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const y = coin.y + coin.bounce;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(coin.rotation);
            
            // ظل 3D
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 4, coin.radius, coin.radius / 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // العملة الذهبية 3D
            const coinGradient = this.ctx.createRadialGradient(0, -coin.radius * 0.3, 0, 0, 0, coin.radius);
            coinGradient.addColorStop(0, '#FFEA00');
            coinGradient.addColorStop(0.5, '#FFD600');
            coinGradient.addColorStop(0.8, '#FFAB00');
            coinGradient.addColorStop(1, '#FF8F00');
            
            this.ctx.fillStyle = coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // حواف 3D
            this.ctx.strokeStyle = '#FFC400';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius - 1, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // النجمة 3D
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            // توهج 3D للعملات الخاصة
            if (coin.value === 50) {
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 25 * coin.glow;
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
    
    drawTrail() {
        this.character.trail.forEach(point => {
            const alpha = point.life * 0.4;
            const size = point.size * point.life;
            
            this.ctx.fillStyle = `rgba(255, 64, 129, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
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
        
        // ظل 3D
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            8, 8,
            this.character.displaySize * 0.9,
            this.character.displaySize * 0.3,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        if (this.character.imageLoaded) {
            // الصورة مع تأثيرات 3D
            this.ctx.save();
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetY = 3;
            
            this.ctx.drawImage(
                this.character.image,
                -this.character.displaySize,
                -this.character.displaySize,
                this.character.displaySize * 2,
                this.character.displaySize * 2
            );
            
            this.ctx.restore();
        } else {
            // شخصية 3D بديلة (50px)
            // الجسم الرئيسي 3D
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
            
            // إضاءة 3D على الجسم
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
            
            // العينان 3D
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-15, -10, 8, 0, Math.PI * 2);
            this.ctx.arc(15, -10, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // التلاميذ 3D
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-12, -10, 4, 0, Math.PI * 2);
            this.ctx.arc(12, -10, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // بريق العينين 3D
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-13, -12, 2, 0, Math.PI * 2);
            this.ctx.arc(13, -12, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفم 3D
            if (this.character.isJumping) {
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 12, 18, 12, 0, 0, Math.PI);
                this.ctx.fill();
            } else {
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(0, 8, 20, 0.2 * Math.PI, 0.8 * Math.PI);
                this.ctx.stroke();
            }
            
            // قبعة المهندس 3D
            this.ctx.fillStyle = '#3F51B5';
            this.ctx.fillRect(-20, -this.character.displaySize - 5, 40, 15);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -this.character.displaySize - 5, 20, 8, 0, 0, Math.PI);
            this.ctx.fill();
        }
        
        // دائرة التصادم للتصحيح (20px)
        if (false) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.collisionSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
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
    
    // ===== الأحداث =====
    setupEventListeners() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || !this.gameActive) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotateHelix(deltaX);
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastTouchX = e.clientX;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.gameActive) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotateHelix(deltaX);
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.restartButton.addEventListener('click', () => this.restartGame());
        
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
                    if (!this.character.isJumping && !this.character.isFalling) {
                        this.character.shouldJump = true;
                    }
                    break;
                case 'r':
                case 'R':
                    this.restartGame();
                    break;
            }
        });
    }
    
    // ===== دوال المساعدة =====
    addScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('helixJumpHighScore', this.highScore);
        }
    }
    
    endGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.finalLevelElement.textContent = this.level;
        
        this.gameOverScreen.style.display = 'flex';
        
        if (this.character.jumpInterval) {
            clearInterval(this.character.jumpInterval);
        }
        
        this.audio.play('gameOver', 0.9);
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.gameActive = true;
        this.helixRotation = 0;
        this.platformSpeed = 5;
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
        
        this.scoreElement.textContent = '0';
        this.levelElement.textContent = '1';
        
        // إعادة إنشاء العناصر
        this.createGameElements();
        
        // إعادة تشغيل نظام النط
        this.startAutoJumpSystem();
        
        // إخفاء شاشة نهاية اللعبة
        this.gameOverScreen.style.display = 'none';
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
        if (this.gameActive) {
            this.updatePhysics();
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== بدء اللعبة =====
window.addEventListener('load', () => {
    const game = new HelixJump();
    console.log('🔥 HELIX JUMP - الإصدار الدقيق 🔥');
    console.log('✅ التعديلات التي تم إجراؤها:');
    console.log('1. حجم الشخصية: 50 للعرض، 20 للتصادم');
    console.log('2. عرض الفجوة: 30 بكسل (بدلاً من 60)');
    console.log('3. ارتفاع النطة: 15 بكسل فقط');
    console.log('4. تدمير المنصات: تبقى تحتك، تختفي عندما تنزل منها');
    console.log('5. تأثيرات 3D محسنة للأسطوانة والدرجات');
    console.log('🚀 اللعبة جاهزة!');
});
