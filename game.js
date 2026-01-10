// ===== إعدادات اللعبة =====
const GameConfig = {
    VERSION: "4.0",
    JUMP_RATE: 2,           // نطتين في الثانية
    PLATFORM_SPACING: 120,  // مسافة متساوية بين المنصات
    PLATFORM_HEIGHT: 28,    // ارتفاع المنصة
    GAP_WIDTH: 60,          // عرض الفجوة في المنصة
    GRAVITY: 1.3,
    JUMP_POWER: 18,
    CHARACTER: {
        DISPLAY_SIZE: 75,   // حجم كبير جداً للعرض (75px)
        COLLISION_SIZE: 15, // حجم صغير للتصادم (15px)
        COLOR: '#FF4081'
    },
    COLORS: {
        PLATFORM: '#4CAF50',  // لون واحد للمنصات
        PLATFORM_EDGE: '#2E7D32',
        GAP: '#1A237E',
        TRAP: '#FF5252',
        COIN: '#FFD600',
        HELIX: 'rgba(33, 150, 243, 0.6)',
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
        this.helixSpeed = 0.05;
        this.platformSpeed = 4;
        this.gravity = GameConfig.GRAVITY;
        
        // الشخصية (كبيرة جداً - 75px)
        this.character = {
            x: this.canvas.width / 2,
            y: 200,
            displaySize: GameConfig.CHARACTER.DISPLAY_SIZE,      // 75 للعرض
            collisionSize: GameConfig.CHARACTER.COLLISION_SIZE,  // 15 للتصادم
            jumpPower: GameConfig.JUMP_POWER,
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
            // تأثيرات 3D
            zRotation: 0,
            shadowOffset: 0,
            scale: 1
        };
        
        // تحميل صورة الشخصية
        this.loadCharacterImage();
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        this.platformTrails = []; // آثار المنصات المدمرة
        
        // التحكم
        this.isDragging = false;
        this.lastTouchX = 0;
        this.rotationDirection = 0;
        
        // 3D Effects
        this.lightAngle = 0;
        this.cameraY = 0;
        
        // الصوتيات
        this.audio = {
            jump: document.getElementById('jumpSound'),
            coin: document.getElementById('coinSound'),
            gameOver: document.getElementById('gameOverSound'),
            platformBreak: new Audio(),
            
            init: function() {
                this.platformBreak.src = 'https://assets.mixkit.co/sfx/preview/mixkit-glass-break-with-huge-reverb-389.mp3';
                this.platformBreak.volume = 0.6;
            },
            
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
        
        this.audio.init();
        
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
        // إزالة أي مؤقت سابق
        if (this.character.jumpInterval) {
            clearInterval(this.character.jumpInterval);
        }
        
        // بدء نظام النط الجديد
        this.character.jumpInterval = setInterval(() => {
            if (this.gameActive && !this.character.isJumping && !this.character.isFalling) {
                this.character.shouldJump = true;
            }
        }, 500); // نطتين في الثانية = كل 500 ميلي ثانية
    }
    
    // ===== إنشاء عناصر اللعبة =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        this.platformTrails = [];
        
        const platformCount = 30;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * GameConfig.PLATFORM_SPACING;
            
            // إنشاء منصة موحدة اللون مع فجوة ثابتة
            this.platforms.push({
                id: i,
                x: 0,
                y: y,
                width: 130,
                height: GameConfig.PLATFORM_HEIGHT,
                angle: angle,
                hasGap: true, // كل المنصات فيها فجوة
                gapPos: 35, // موضع ثابت للفجوة
                gapWidth: GameConfig.GAP_WIDTH, // عرض الفجوة 60px
                color: GameConfig.COLORS.PLATFORM,
                edgeColor: GameConfig.COLORS.PLATFORM_EDGE,
                isActive: true,
                isDestroyed: false,
                destroyTimer: 0,
                hitCount: 0, // عدد المرات التي اصطدمت بها الشخصية
                rotation: 0,
                // تأثيرات 3D
                depth: 0,
                highlight: false
            });
            
            // فخ (25% فرصة) - يظهر في مكان الفجوة أحياناً
            if (Math.random() < 0.25) {
                const trap = {
                    x: 0,
                    y: y - 20,
                    width: 35,
                    height: 22,
                    angle: angle,
                    type: 'circular', // فخ دائري
                    active: true,
                    rotation: 0,
                    platformId: i,
                    position: Math.random() > 0.5 ? 'left' : 'right' // على جانبي الفجوة
                };
                
                this.traps.push(trap);
            }
            
            // عملة (20% فرصة) - تظهر فوق المنصة
            if (Math.random() < 0.2) {
                this.coins.push({
                    x: 0,
                    y: y - 60,
                    radius: 18,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: Math.random() < 0.15 ? 75 : 25,
                    platformId: i,
                    // تأثيرات 3D
                    z: 0,
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
    }
    
    // ===== النط =====
    jump() {
        if (!this.gameActive || this.character.isJumping || this.character.isFalling) return;
        
        const currentPlatform = this.platforms[this.character.currentPlatformIndex];
        if (!currentPlatform || !currentPlatform.isActive) {
            this.character.isFalling = true;
            return;
        }
        
        this.character.isJumping = true;
        this.character.velocityY = -this.character.jumpPower;
        this.character.jumps++;
        this.character.lastJumpTime = Date.now();
        
        // زيادة سرعة الدوران عند النط
        this.character.zRotation = 0.3;
        
        // تأثيرات القفز
        this.character.scale = 0.9;
        
        // الصوت
        this.audio.play('jump', 0.6);
        
        // جسيمات النط (3D)
        this.createJumpParticles();
        
        // إعادة تعيين علامة النط
        this.character.shouldJump = false;
        
        // تسجيل إصابة المنصة
        currentPlatform.hitCount++;
        
        // إذا كانت المنصة قد اصطدمت بها الشخصية أكثر من مرة، تبدأ في التدمير
        if (currentPlatform.hitCount > 1) {
            this.destroyPlatform(currentPlatform.id, true); // تدمير سريع
        }
    }
    
    // ===== تدمير المنصة =====
    destroyPlatform(platformIndex, quickDestroy = false) {
        if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
        
        const platform = this.platforms[platformIndex];
        if (platform.isDestroyed) return;
        
        platform.isDestroyed = true;
        platform.isActive = false;
        platform.destroyTimer = quickDestroy ? 15 : 60; // التدمير السريع أو البطيء
        
        // إضافة أثر المنصة المدمرة
        this.platformTrails.push({
            x: 0,
            y: platform.y,
            angle: platform.angle,
            width: platform.width,
            height: platform.height,
            color: platform.color,
            life: 1,
            scale: 1,
            rotation: 0
        });
        
        // الصوت
        this.audio.play('platformBreak', 0.5);
        
        // جسيمات التدمير (3D)
        this.createPlatformBreakParticles(platform);
        
        // إذا تخطت الشخصية المنصة بسرعة بدون أن تنزل عليها، تدمر فوراً
        if (quickDestroy) {
            platform.destroyTimer = 5;
        }
    }
    
    // ===== تدوير الأسطوانة =====
    rotateHelix(deltaX) {
        if (!this.gameActive) return;
        
        // تدوير الأسطوانة حسب سحب المستخدم
        this.helixRotation += deltaX * this.helixSpeed * 0.4;
        this.rotationDirection = Math.sign(deltaX);
        
        // تحديث زاوية الإضاءة
        this.lightAngle += deltaX * 0.01;
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics() {
        if (!this.gameActive) return;
        
        // التحقق إذا كان يجب النط
        if (this.character.shouldJump && !this.character.isJumping && !this.character.isFalling) {
            this.jump();
        }
        
        // تحديث تأثيرات 3D
        this.lightAngle += 0.01;
        this.cameraY = Math.sin(Date.now() * 0.001) * 10;
        
        // تحديث الشخصية
        if (this.character.isJumping || this.character.isFalling) {
            // تأثيرات القفز
            this.character.rotation += 0.2;
            this.character.zRotation *= 0.95; // تباطؤ الدوران
            this.character.scale += (1 - this.character.scale) * 0.1; // عودة للحجم الطبيعي
            
            // تطبيق الجاذبية
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
            
            // إضافة أثر القفز (3D)
            if (Math.random() < 0.4) {
                this.character.trail.push({
                    x: this.character.x,
                    y: this.character.y,
                    z: Math.sin(Date.now() * 0.01) * 10,
                    life: 1,
                    size: this.character.displaySize * 0.3
                });
            }
        }
        
        // تحديث الأثر
        this.character.trail = this.character.trail.filter(p => {
            p.life -= 0.05;
            p.z += 0.5;
            return p.life > 0;
        });
        
        // تحريك المنصات للأسفل
        this.platforms.forEach(platform => {
            platform.y -= this.platformSpeed;
            
            // تحديث تأثيرات 3D للمنصات
            platform.rotation += 0.005;
            platform.depth = Math.sin(platform.y * 0.01 + this.lightAngle) * 5;
            
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
            
            // إذا كانت الشخصية قد تخطت المنصة ولم تنزل عليها، تدمر المنصة
            if (platform.isActive && !platform.isDestroyed) {
                const distance = Math.abs(this.character.y - platform.y);
                if (distance > GameConfig.PLATFORM_SPACING * 2 && this.character.velocityY < 0) {
                    this.destroyPlatform(platform.id, true); // تدمير سريع
                }
            }
        });
        
        // تحديث آثار المنصات المدمرة
        this.platformTrails.forEach((trail, index) => {
            trail.life -= 0.02;
            trail.y -= this.platformSpeed * 0.5;
            trail.scale *= 0.98;
            trail.rotation += 0.05;
            
            if (trail.life <= 0) {
                this.platformTrails.splice(index, 1);
            }
        });
        
        // تحريك العناصر الأخرى
        this.traps.forEach(trap => {
            trap.y -= this.platformSpeed;
            trap.rotation += 0.02;
        });
        
        this.coins.forEach(coin => {
            coin.y -= this.platformSpeed;
            coin.rotation += 0.03;
            coin.bounce = Math.sin(Date.now() * 0.002 + coin.y * 0.01) * 10;
            coin.z = Math.cos(Date.now() * 0.0015 + coin.y * 0.01) * 5;
        });
        
        // تحديث الجسيمات
        this.particles.forEach((particle, index) => {
            particle.life -= particle.speed;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.z += particle.vz;
            particle.vy += 0.2;
            particle.vz *= 0.95;
            
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
        
        // زيادة الصعوبة مع النقاط
        const newLevel = Math.floor(this.score / 400) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelElement.textContent = this.level;
            this.platformSpeed += 0.4;
        }
    }
    
    // ===== إعادة تدوير المنصة =====
    recyclePlatform(platform) {
        platform.y = this.canvas.height + 300;
        platform.angle = Math.random() * Math.PI * 2;
        platform.isActive = true;
        platform.isDestroyed = false;
        platform.destroyTimer = 0;
        platform.hitCount = 0;
        platform.rotation = 0;
        
        // إزالة الفخاخ والعملات المرتبطة
        this.traps = this.traps.filter(t => t.platformId !== platform.id);
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        
        // إضافة فخ جديد (25% فرصة)
        if (Math.random() < 0.25) {
            const trap = {
                x: 0,
                y: platform.y - 20,
                width: 35,
                height: 22,
                angle: platform.angle,
                type: 'circular',
                active: true,
                rotation: 0,
                platformId: platform.id,
                position: Math.random() > 0.5 ? 'left' : 'right'
            };
            
            this.traps.push(trap);
        }
        
        // إضافة عملة جديدة (20% فرصة)
        if (Math.random() < 0.2) {
            this.coins.push({
                x: 0,
                y: platform.y - 60,
                radius: 18,
                angle: platform.angle,
                collected: false,
                rotation: 0,
                value: Math.random() < 0.15 ? 75 : 25,
                platformId: platform.id,
                z: 0,
                bounce: 0
            });
        }
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        // إذا كانت الشخصية تقفز أو تسقط
        if (this.character.isJumping || this.character.isFalling) {
            // البحث عن أقرب منصة للهبوط
            let targetPlatform = null;
            let minVerticalDistance = Infinity;
            
            for (let platform of this.platforms) {
                if (!platform.isActive || platform.isDestroyed || platform.y > this.canvas.height || platform.y < 0) continue;
                
                const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
                const verticalDistance = platform.y - (this.character.y + this.character.collisionSize);
                
                // التحقق إذا كانت الشخصية فوق المنصة وتتحرك للأسفل
                if (verticalDistance > 0 && verticalDistance < 150 && this.character.velocityY > 0) {
                    // التحقق من المحاذاة الأفقية
                    const horizontalDistance = Math.abs(this.character.x - platformX);
                    const halfPlatformWidth = platform.width / 2;
                    
                    // الشخصية على الجزء الصلب من المنصة (ليس في الفجوة)
                    const leftSection = platform.gapPos;
                    const rightSection = platform.width - leftSection - platform.gapWidth;
                    
                    let isOnSolidPart = false;
                    
                    // التحقق من الجزء الأيسر
                    if (horizontalDistance < halfPlatformWidth && 
                        this.character.x < platformX - halfPlatformWidth + leftSection) {
                        isOnSolidPart = true;
                    }
                    // التحقق من الجزء الأيمن
                    else if (horizontalDistance < halfPlatformWidth && 
                             this.character.x > platformX - halfPlatformWidth + leftSection + platform.gapWidth) {
                        isOnSolidPart = true;
                    }
                    
                    if (isOnSolidPart && verticalDistance < minVerticalDistance) {
                        minVerticalDistance = verticalDistance;
                        targetPlatform = platform;
                    }
                }
            }
            
            // إذا وجدنا منصة للهبوط
            if (targetPlatform) {
                this.landOnPlatform(targetPlatform);
            }
        }
        
        // التصادم مع الفخاخ
        for (let trap of this.traps) {
            if (!trap.active || trap.y > this.canvas.height || trap.y < 0) continue;
            
            const trapX = centerX + Math.cos(trap.angle + this.helixRotation) * 145 + 
                         (trap.position === 'left' ? -40 : 40);
            const dx = this.character.x - trapX;
            const dy = this.character.y - trap.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.collisionSize + trap.width / 2) {
                this.hitTrap(trap);
                break;
            }
        }
    }
    
    // ===== الهبوط على منصة =====
    landOnPlatform(platform) {
        // هبوط ناجح
        this.character.y = platform.y - this.character.collisionSize;
        this.character.velocityY = 0;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.currentPlatformIndex = platform.id;
        this.character.rotation = 0;
        this.character.zRotation = 0;
        
        // إضافة النقاط
        this.addScore(20);
        
        // إذا كانت هذه أول مرة تهبط عليها الشخصية
        if (platform.hitCount === 0) {
            // جسيمات الهبوط
            this.createLandingParticles(platform);
        }
        
        // زيادة عداد الاصطدامات
        platform.hitCount++;
        
        // إذا اصطدمت بها أكثر من مرة، تبدأ في التدمير
        if (platform.hitCount >= 2) {
            this.destroyPlatform(platform.id, false);
        }
        
        // جمع العملات على هذه المنصة
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
            
            if (distance < this.character.displaySize * 0.8 + coin.radius) {
                this.collectCoin(coin, coinX);
            }
        });
    }
    
    hitTrap(trap) {
        // إنشاء جسيمات الانفجار 3D
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 50,
                y: this.character.y + (Math.random() - 0.5) * 50,
                z: (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 8,
                vz: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                color: GameConfig.COLORS.TRAP,
                life: 1,
                speed: 0.03
            });
        }
        
        // الصوت
        this.audio.play('gameOver', 0.9);
        
        // نهاية اللعبة
        setTimeout(() => {
            this.endGame();
        }, 400);
    }
    
    collectCoin(coin, coinX) {
        coin.collected = true;
        
        // إضافة النقاط
        this.addScore(coin.value);
        
        // الصوت
        this.audio.play('coin', 0.7);
        
        // جسيمات العملة 3D
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: coinX + (Math.random() - 0.5) * 40,
                y: coin.y + (Math.random() - 0.5) * 40 + coin.bounce,
                z: coin.z + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                vz: (Math.random() - 0.5) * 8,
                size: Math.random() * 6 + 3,
                color: GameConfig.COLORS.COIN,
                life: 1,
                speed: 0.025
            });
        }
    }
    
    // ===== جسيمات 3D =====
    createJumpParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 40,
                y: this.character.y + this.character.displaySize,
                z: (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                vz: (Math.random() - 0.5) * 6,
                size: Math.random() * 6 + 4,
                color: this.character.color,
                life: 1,
                speed: 0.02
            });
        }
    }
    
    createLandingParticles(platform) {
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: platformX + (Math.random() - 0.5) * platform.width,
                y: platform.y + platform.height / 2,
                z: (Math.random() - 0.5) * 15,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                vz: (Math.random() - 0.5) * 4,
                size: Math.random() * 5 + 2,
                color: platform.color,
                life: 1,
                speed: 0.015
            });
        }
    }
    
    createPlatformBreakParticles(platform) {
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
        
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: platformX + (Math.random() - 0.5) * platform.width,
                y: platform.y + platform.height / 2,
                z: (Math.random() - 0.5) * 25,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 6,
                vz: (Math.random() - 0.5) * 8,
                size: Math.random() * 7 + 3,
                color: platform.edgeColor,
                life: 1,
                speed: 0.04
            });
        }
    }
    
    // ===== الرسم 3D =====
    draw() {
        if (!this.gameActive) return;
        
        // مسح الشاشة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية 3D
        this.draw3DBackground();
        
        // رسم الأسطوانة 3D
        this.draw3DHelix();
        
        // رسم آثار المنصات المدمرة
        this.drawPlatformTrails();
        
        // رسم المنصات 3D
        this.draw3DPlatforms();
        
        // رسم الفخاخ
        this.drawTraps();
        
        // رسم العملات 3D
        this.draw3DCoins();
        
        // رسم أثر الشخصية
        this.draw3DTrail();
        
        // رسم الشخصية 3D
        this.draw3DCharacter();
        
        // رسم الجسيمات
        this.draw3DParticles();
    }
    
    draw3DBackground() {
        // خلفية متدرجة 3D
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, GameConfig.COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // تأثيرات دائرية متحركة
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.lightAngle;
            const radius = 100 + i * 50;
            const x = this.canvas.width / 2 + Math.cos(angle) * radius * 0.3;
            const y = this.canvas.height / 2 + Math.sin(angle) * radius * 0.3 + this.cameraY;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.03 - i * 0.003})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    draw3DHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // مركز الأسطوانة 3D
        const centerGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 70
        );
        centerGradient.addColorStop(0, 'rgba(33, 150, 243, 0.4)');
        centerGradient.addColorStop(1, 'rgba(33, 150, 243, 0.1)');
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الخطوط الحلزونية 3D (8 خطوط متساوية)
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 70;
            const x2 = centerX + Math.cos(angle) * 250;
            
            // تدرج الخط 3D
            const lineGradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            lineGradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)');
            lineGradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.5)');
            lineGradient.addColorStop(1, 'rgba(33, 150, 243, 0.2)');
            
            this.ctx.strokeStyle = lineGradient;
            this.ctx.lineWidth = 5;
            this.ctx.lineCap = 'round';
            this.ctx.shadowColor = 'rgba(33, 150, 243, 0.5)';
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
        }
        
        // حدود الأسطوانة الخارجية 3D
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(33, 150, 243, 0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 250, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawPlatformTrails() {
        const centerX = this.canvas.width / 2;
        
        this.platformTrails.forEach(trail => {
            const x = centerX + Math.cos(trail.angle + this.helixRotation) * 145;
            const alpha = trail.life * 0.7;
            
            this.ctx.save();
            this.ctx.translate(x, trail.y);
            this.ctx.rotate(trail.rotation);
            this.ctx.scale(trail.scale, trail.scale);
            
            // منصة شفافة
            this.ctx.fillStyle = `rgba(76, 175, 80, ${alpha * 0.3})`;
            this.ctx.fillRect(-trail.width / 2, -trail.height / 2, trail.width, trail.height);
            
            // حدود شفافة
            this.ctx.strokeStyle = `rgba(46, 125, 50, ${alpha * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-trail.width / 2, -trail.height / 2, trail.width, trail.height);
            
            this.ctx.restore();
        });
    }
    
    draw3DPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            const y = platform.y + platform.depth;
            
            // إذا كانت المنصة مدمرة، نرسمها شفافة
            let alpha = 1;
            if (platform.isDestroyed) {
                alpha = platform.destroyTimer / 60;
                if (platform.destroyTimer < 15) alpha *= 0.5;
            }
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(platform.rotation);
            
            // الظل تحت المنصة
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * alpha})`;
            this.ctx.fillRect(
                -platform.width / 2 + 3,
                platform.height / 2 + 3,
                platform.width,
                platform.height / 3
            );
            
            // الجسم الرئيسي للمنصة (3D)
            const platformGradient = this.ctx.createLinearGradient(
                -platform.width / 2, -platform.height / 2,
                -platform.width / 2, platform.height / 2
            );
            platformGradient.addColorStop(0, `rgba(76, 175, 80, ${alpha})`);
            platformGradient.addColorStop(1, `rgba(46, 125, 50, ${alpha})`);
            
            this.ctx.fillStyle = platformGradient;
            
            // رسم المنصة مع الفجوة
            this.ctx.fillRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.gapPos,
                platform.height
            );
            
            this.ctx.fillRect(
                -platform.width / 2 + platform.gapPos + platform.gapWidth,
                -platform.height / 2,
                platform.width - platform.gapPos - platform.gapWidth,
                platform.height
            );
            
            // الفجوة (3D)
            this.ctx.fillStyle = `rgba(26, 35, 126, ${0.8 * alpha})`;
            this.ctx.fillRect(
                -platform.width / 2 + platform.gapPos,
                -platform.height / 2,
                platform.gapWidth,
                platform.height
            );
            
            // إضاءة على الحواف
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * alpha})`;
            this.ctx.lineWidth = 2;
            
            // الحواف العلوية
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2, -platform.height / 2);
            this.ctx.lineTo(-platform.width / 2 + platform.gapPos, -platform.height / 2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(-platform.width / 2 + platform.gapPos + platform.gapWidth, -platform.height / 2);
            this.ctx.lineTo(platform.width / 2, -platform.height / 2);
            this.ctx.stroke();
            
            // إذا كانت المنصة قد اصطدمت بها الشخصية، نضيف تأثير اهتزاز
            if (platform.hitCount > 0 && !platform.isDestroyed) {
                const shake = Math.sin(Date.now() * 0.02) * (platform.hitCount * 2);
                this.ctx.translate(shake, 0);
            }
            
            // إذا كانت المنصة معطلة، نضيف تأثير وميض
            if (platform.hitCount > 0 && Date.now() % 300 < 150) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
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
                     (trap.position === 'left' ? -40 : 40);
            const y = trap.y;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(trap.rotation);
            
            // ظل الفخ
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(3, 3, trap.width / 2 + 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفخ الرئيسي (3D)
            const trapGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, trap.width / 2);
            trapGradient.addColorStop(0, '#FF5252');
            trapGradient.addColorStop(0.7, '#D32F2F');
            trapGradient.addColorStop(1, '#B71C1C');
            
            this.ctx.fillStyle = trapGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, trap.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // أشواك حادة (3D)
            this.ctx.fillStyle = '#FF8A80';
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 4) / 8;
                const spikeLength = 12;
                
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
            
            // تأثير توهج
            this.ctx.shadowColor = '#FF5252';
            this.ctx.shadowBlur = 25;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, trap.width / 2, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });
    }
    
    draw3DCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height + 100 || coin.y < -100) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const y = coin.y + coin.bounce;
            
            this.ctx.translate(x, y);
            this.ctx.rotate(coin.rotation);
            
            // ظل العملة
            this.ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
            this.ctx.beginPath();
            this.ctx.arc(coin.z + 2, coin.bounce / 2 + 2, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // العملة الذهبية (3D)
            const coinGradient = this.ctx.createRadialGradient(
                coin.z, 0, 0,
                coin.z, 0, coin.radius
            );
            coinGradient.addColorStop(0, '#FFEA00');
            coinGradient.addColorStop(0.6, '#FFD600');
            coinGradient.addColorStop(1, '#FFAB00');
            
            this.ctx.fillStyle = coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(coin.z, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // حواف العملة (3D)
            this.ctx.strokeStyle = '#FFC400';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(coin.z, 0, coin.radius - 1, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // النجمة (3D)
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.shadowColor = '#FFD600';
            this.ctx.shadowBlur = 15;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', coin.z, 0);
            
            // العملات الخاصة لها تأثير إضافي
            if (coin.value === 75) {
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 30;
                this.ctx.beginPath();
                this.ctx.arc(coin.z, 0, coin.radius * 1.5, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });
    }
    
    draw3DTrail() {
        this.character.trail.forEach(point => {
            const alpha = point.life * 0.6;
            const size = point.size * alpha;
            
            this.ctx.fillStyle = `rgba(255, 64, 129, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y + point.z, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    draw3DCharacter() {
        this.ctx.save();
        
        // تأثيرات الإضاءة
        if (this.character.isJumping) {
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 50;
        }
        
        const x = this.character.x;
        const y = this.character.y;
        const scale = this.character.scale;
        
        this.ctx.translate(x, y);
        this.ctx.rotate(this.character.rotation);
        this.ctx.scale(scale, scale);
        
        // تطبيق تأثير 3D (دوران محور Z)
        this.ctx.transform(
            1, 0,
            Math.sin(this.character.zRotation) * 0.3, 1,
            0, 0
        );
        
        if (this.character.imageLoaded) {
            // رسم الصورة الشخصية مع تأثيرات 3D
            this.ctx.save();
            
            // ظل تحت الشخصية
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(10, 10, 
                this.character.displaySize * 0.8, 
                this.character.displaySize * 0.3, 
                0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // تأثير إضاءة على الصورة
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.drawImage(
                this.character.image,
                -this.character.displaySize,
                -this.character.displaySize,
                this.character.displaySize * 2,
                this.character.displaySize * 2
            );
            
            this.ctx.restore();
        } else {
            // رسم شخصية 3D بديلة (كرة كبيرة)
            
            // الظل
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.ellipse(8, 8, 
                this.character.displaySize * 0.9, 
                this.character.displaySize * 0.4, 
                0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الجسم الرئيسي (كرة 3D)
            const ballGradient = this.ctx.createRadialGradient(
                -this.character.displaySize * 0.3, 
                -this.character.displaySize * 0.3, 0,
                0, 0, this.character.displaySize
            );
            ballGradient.addColorStop(0, '#FF4081');
            ballGradient.addColorStop(0.7, '#E91E63');
            ballGradient.addColorStop(1, '#C2185B');
            
            this.ctx.fillStyle = ballGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.displaySize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // إضاءة على الكرة (تأثير 3D)
            const highlightGradient = this.ctx.createRadialGradient(
                -this.character.displaySize * 0.4, 
                -this.character.displaySize * 0.4, 0,
                -this.character.displaySize * 0.2, 
                -this.character.displaySize * 0.2, this.character.displaySize * 0.5
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(
                -this.character.displaySize * 0.3, 
                -this.character.displaySize * 0.3, 
                this.character.displaySize * 0.6, 
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            // العينان (3D)
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-20, -15, 12, 0, Math.PI * 2);
            this.ctx.arc(20, -15, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // التلاميذ (3D)
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-16, -15, 6, 0, Math.PI * 2);
            this.ctx.arc(16, -15, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // بريق في العينين
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-18, -17, 3, 0, Math.PI * 2);
            this.ctx.arc(18, -17, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفم (يتغير حسب الحالة)
            if (this.character.isJumping) {
                // فم مفتوح أثناء القفز
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 15, 20, 15, 0, 0, Math.PI);
                this.ctx.fill();
            } else {
                // ابتسامة أثناء الوقوف
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(0, 10, 25, 0.2 * Math.PI, 0.8 * Math.PI);
                this.ctx.stroke();
            }
            
            // قبعة المهندس (3D)
            this.ctx.fillStyle = '#3F51B5';
            this.ctx.fillRect(-25, -this.character.displaySize - 8, 50, 20);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -this.character.displaySize - 8, 25, 10, 0, 0, Math.PI);
            this.ctx.fill();
        }
        
        // رسم دائرة التصادم للتصحيح
        if (false) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.collisionSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }
    
    draw3DParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life;
            const x = particle.x + particle.z * 0.3; // تأثير المنظور
            const y = particle.y + particle.z * 0.2;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // ===== الأحداث =====
    setupEventListeners() {
        // سحب لتدوير الأسطوانة
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
            this.rotationDirection = 0;
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
            this.rotationDirection = 0;
        });
        
        // إعادة التشغيل
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.rotateHelix(-50);
                    break;
                case 'ArrowRight':
                    this.rotateHelix(50);
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
        
        // إيقاف نظام النط
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
        this.platformSpeed = 4;
        this.lightAngle = 0;
        this.cameraY = 0;
        
        // إعادة تعيين الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 200;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        this.character.zRotation = 0;
        this.character.scale = 1;
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
    
    // ===== حلقة اللعبة الرئيسية =====
    gameLoop() {
        if (this.gameActive) {
            this.updatePhysics();
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== بدء اللعبة عند تحميل الصفحة =====
window.addEventListener('load', () => {
    const game = new HelixJump();
    console.log('🔥🔥 HELIX JUMP - الإصدار النهائي 🔥🔥');
    console.log('✅ جميع الطلبات تم تنفيذها:');
    console.log('1. ألوان موحدة للمنصات');
    console.log('2. شخصية كبيرة (75 للعرض، 15 للتصادم)');
    console.log('3. منصات 3D بفجوات ثابتة');
    console.log('4. تدمير المنصات عند المرور');
    console.log('5. نطات تلقائية (نطتين/ثانية)');
    console.log('🚀 استمتع باللعبة!');
});
