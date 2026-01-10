// ===== إعدادات اللعبة =====
const GameConfig = {
    VERSION: "3.0",
    JUMP_RATE: 2,          // نطتين في الثانية
    JUMP_HEIGHT: 3,        // الارتفاع يعادل 3 درجات
    INITIAL_SPEED: 0.05,
    PLATFORM_SPACING: 120,  // مسافة متساوية بين المنصات
    GRAVITY: 1.2,
    JUMP_POWER: 16,
    CHARACTER: {
        DISPLAY_SIZE: 45,   // حجم كبير للعرض
        COLLISION_SIZE: 12, // حجم صغير للتصادم
        COLOR: '#FF6B9D'
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
        this.helixSpeed = GameConfig.INITIAL_SPEED;
        this.platformSpeed = 3;
        this.gravity = GameConfig.GRAVITY;
        
        // الشخصية (تنط تلقائياً - نطتين في الثانية)
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
            image: null,
            imageLoaded: false,
            currentPlatformIndex: -1,
            isFalling: false,
            trail: [],
            // إعدادات النط الجديدة
            jumpInterval: null,
            shouldJump: false
        };
        
        // تحميل صورة الشخصية
        this.loadCharacterImage();
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        // التحكم (لتدوير الأسطوانة فقط)
        this.isDragging = false;
        this.lastTouchX = 0;
        this.rotationDirection = 0;
        
        // الألوان الزاهية
        this.colors = {
            helixLine: 'rgba(255, 235, 59, 0.4)',
            helixCenter: 'rgba(255, 235, 59, 0.2)',
            platform1: '#FF5252', // أحمر فاتح
            platform2: '#448AFF', // أزرق فاتح
            platform3: '#69F0AE', // أخضر فاتح
            platform4: '#FFD740', // أصفر فاتح
            trap: '#FF1744',     // أحمر وردي
            movingTrap: '#F50057', // أحمر داكن
            coin: '#FFD600',     // أصفر ذهبي
            particle1: '#00E5FF', // سماوي
            particle2: '#FF4081', // وردي
            background: {
                top: '#1A237E',
                middle: '#311B92',
                bottom: '#4A148C'
            }
        };
        
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
            console.log('❌ لم يتم العثور على الصورة، استخدام شكل بديل');
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
        
        const platformCount = 25;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 400 + i * GameConfig.PLATFORM_SPACING; // مسافة متساوية
            
            // منصة
            const platformType = Math.floor(Math.random() * 4);
            const hasGap = Math.random() < 0.4;
            
            this.platforms.push({
                id: i,
                x: 0,
                y: y,
                width: 110,
                height: 28,
                angle: angle,
                hasGap: hasGap,
                gapPos: hasGap ? Math.random() * 65 + 25 : 0,
                gapWidth: 55,
                color: this.colors[`platform${platformType + 1}`],
                type: platformType,
                isSafe: true,
                isDestroyed: false,
                destroyTimer: 0
            });
            
            // فخ (30% فرصة) - فقط على منصات بدون فجوات
            if (Math.random() < 0.3 && !hasGap) {
                const trapType = Math.random() < 0.5 ? 'static' : 'moving';
                const trap = {
                    x: 0,
                    y: y - 18,
                    width: 32,
                    height: 20,
                    angle: angle,
                    type: trapType,
                    active: true,
                    rotation: 0,
                    platformId: i
                };
                
                if (trapType === 'moving') {
                    trap.speed = Math.random() * 2 + 1;
                    trap.direction = Math.random() > 0.5 ? 1 : -1;
                    trap.offset = 0;
                }
                
                this.traps.push(trap);
                
                // وضع علامة على المنصة بأنها غير آمنة
                this.platforms[i].isSafe = false;
            }
            
            // عملة (25% فرصة) - فقط على منصات آمنة
            if (Math.random() < 0.25 && this.platforms[i].isSafe) {
                this.coins.push({
                    x: 0,
                    y: y - 55,
                    radius: 16,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: Math.random() < 0.2 ? 50 : 10,
                    platformId: i
                });
            }
        }
        
        // وضع الشخصية على أول منصة آمنة
        this.placeCharacterOnFirstSafePlatform();
    }
    
    // ===== وضع الشخصية على أول منصة آمنة =====
    placeCharacterOnFirstSafePlatform() {
        const safePlatform = this.platforms.find(p => p.isSafe && !p.isDestroyed);
        if (safePlatform) {
            this.character.currentPlatformIndex = safePlatform.id;
            this.character.y = safePlatform.y - this.character.displaySize;
            this.character.x = this.canvas.width / 2 + Math.cos(safePlatform.angle + this.helixRotation) * 145;
            this.character.isJumping = false;
            this.character.velocityY = 0;
            this.character.isFalling = false;
        }
    }
    
    // ===== النط =====
    jump() {
        if (!this.gameActive || this.character.isJumping || this.character.isFalling) return;
        
        // العثور على المنصة الحالية
        const currentPlatform = this.platforms[this.character.currentPlatformIndex];
        if (!currentPlatform || currentPlatform.isDestroyed) {
            this.character.isFalling = true;
            return;
        }
        
        // إذا كانت المنصة تحتوي على فخ
        if (!currentPlatform.isSafe) {
            this.endGame();
            return;
        }
        
        this.character.isJumping = true;
        this.character.velocityY = -this.character.jumpPower;
        
        // حساب ارتفاع النطة (3 درجات)
        this.character.jumpHeight = GameConfig.JUMP_HEIGHT * GameConfig.PLATFORM_SPACING;
        
        // تدمير المنصة الحالية بعد النط
        this.destroyPlatform(this.character.currentPlatformIndex);
        
        // الصوت
        this.audio.play('jump', 0.6);
        
        // جسيمات النط
        this.createParticles(
            this.character.x,
            this.character.y + this.character.displaySize,
            this.character.color,
            8
        );
        
        // إعادة تعيين علامة النط
        this.character.shouldJump = false;
    }
    
    // ===== تدمير المنصة =====
    destroyPlatform(platformIndex) {
        if (platformIndex < 0 || platformIndex >= this.platforms.length) return;
        
        const platform = this.platforms[platformIndex];
        platform.isDestroyed = true;
        platform.destroyTimer = 30; // 0.5 ثانية لتلاشي المنصة
        
        // جسيمات التدمير
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: platformX + (Math.random() - 0.5) * platform.width,
                y: platform.y + platform.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 5 + 2,
                color: platform.color,
                life: 1
            });
        }
    }
    
    // ===== تدوير الأسطوانة =====
    rotateHelix(deltaX) {
        if (!this.gameActive) return;
        
        // تدوير الأسطوانة حسب سحب المستخدم
        this.helixRotation += deltaX * this.helixSpeed * 0.3;
        this.rotationDirection = Math.sign(deltaX);
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics() {
        if (!this.gameActive) return;
        
        // التحقق إذا كان يجب النط
        if (this.character.shouldJump && !this.character.isJumping && !this.character.isFalling) {
            this.jump();
        }
        
        // تحديث دوران الشخصية
        if (this.character.isJumping) {
            this.character.rotation += 0.15;
        }
        
        // تطبيق الجاذبية
        if (this.character.isJumping || this.character.isFalling) {
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
            
            // إضافة أثر للقفز
            if (Math.random() < 0.3) {
                this.character.trail.push({
                    x: this.character.x,
                    y: this.character.y,
                    life: 1
                });
            }
        }
        
        // تحديث الأثر
        this.character.trail = this.character.trail.filter(p => {
            p.life -= 0.08;
            return p.life > 0;
        });
        
        // تحريك المنصات للأسفل (بسرعة ثابتة)
        this.platforms.forEach(platform => {
            platform.y -= this.platformSpeed;
            
            // إعادة تدوير المنصات
            if (platform.y < -100) {
                platform.y = this.canvas.height + 100;
                platform.angle = Math.random() * Math.PI * 2;
                platform.isDestroyed = false;
                platform.destroyTimer = 0;
                
                // إعادة توليد المنصة
                platform.hasGap = Math.random() < 0.4;
                platform.gapPos = platform.hasGap ? Math.random() * 65 + 25 : 0;
                platform.isSafe = true;
                
                // إزالة الفخاخ والعملات المرتبطة
                this.traps = this.traps.filter(t => t.platformId !== platform.id);
                this.coins = this.coins.filter(c => c.platformId !== platform.id);
                
                // إضافة فخ جديد (30% فرصة)
                if (Math.random() < 0.3 && !platform.hasGap) {
                    const trapType = Math.random() < 0.5 ? 'static' : 'moving';
                    const trap = {
                        x: 0,
                        y: platform.y - 18,
                        width: 32,
                        height: 20,
                        angle: platform.angle,
                        type: trapType,
                        active: true,
                        rotation: 0,
                        platformId: platform.id
                    };
                    
                    if (trapType === 'moving') {
                        trap.speed = Math.random() * 2 + 1;
                        trap.direction = Math.random() > 0.5 ? 1 : -1;
                        trap.offset = 0;
                    }
                    
                    this.traps.push(trap);
                    platform.isSafe = false;
                }
                
                // إضافة عملة جديدة (25% فرصة)
                if (Math.random() < 0.25 && platform.isSafe) {
                    this.coins.push({
                        x: 0,
                        y: platform.y - 55,
                        radius: 16,
                        angle: platform.angle,
                        collected: false,
                        rotation: 0,
                        value: Math.random() < 0.2 ? 50 : 10,
                        platformId: platform.id
                    });
                }
            }
            
            // تحديث تدمير المنصة
            if (platform.isDestroyed && platform.destroyTimer > 0) {
                platform.destroyTimer--;
            }
        });
        
        // تحريك العناصر الأخرى
        this.traps.forEach(trap => {
            trap.y -= this.platformSpeed;
            if (trap.type === 'moving') {
                trap.offset += trap.speed * trap.direction;
                if (Math.abs(trap.offset) > 45) trap.direction *= -1;
            }
            if (trap.type === 'spinning') {
                trap.rotation += 0.05;
            }
        });
        
        this.coins.forEach(coin => {
            coin.y -= this.platformSpeed;
            coin.rotation += 0.05;
        });
        
        // تحديث الجسيمات
        this.particles.forEach((particle, index) => {
            particle.life -= 0.03;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.15;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // التحقق من التصادمات
        this.checkCollisions();
        
        // التحقق من خروج الشخصية
        if (this.character.y > this.canvas.height + 200) {
            this.endGame();
        }
        
        // زيادة الصعوبة مع النقاط
        const newLevel = Math.floor(this.score / 300) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelElement.textContent = this.level;
            this.platformSpeed += 0.3;
        }
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        // إذا كانت الشخصية تقفز أو تسقط
        if (this.character.isJumping || this.character.isFalling) {
            // البحث عن أقرب منصة للهبوط
            let closestPlatform = null;
            let minDistance = Infinity;
            
            for (let platform of this.platforms) {
                if (platform.isDestroyed || !platform.isSafe || platform.y > this.canvas.height || platform.y < 0) continue;
                
                const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
                const verticalDistance = platform.y - (this.character.y + this.character.collisionSize);
                
                // التحقق إذا كانت الشخصية فوق المنصة وتتحرك للأسفل
                if (verticalDistance > 0 && verticalDistance < 100 && this.character.velocityY > 0) {
                    // التحقق من المحاذاة الأفقية (باستخدام حجم التصادم الصغير)
                    if (this.character.x + this.character.collisionSize > platformX - platform.width / 2 &&
                        this.character.x - this.character.collisionSize < platformX + platform.width / 2) {
                        
                        // التحقق من الفجوة
                        let inGap = false;
                        if (platform.hasGap) {
                            const gapStart = platformX - platform.width / 2 + platform.gapPos;
                            const gapEnd = gapStart + platform.gapWidth;
                            if (this.character.x > gapStart && this.character.x < gapEnd) {
                                inGap = true;
                            }
                        }
                        
                        if (!inGap && verticalDistance < minDistance) {
                            minDistance = verticalDistance;
                            closestPlatform = platform;
                        }
                    }
                }
            }
            
            // إذا وجدنا منصة للهبوط
            if (closestPlatform) {
                // هبوط ناجح
                this.character.y = closestPlatform.y - this.character.collisionSize;
                this.character.velocityY = 0;
                this.character.isJumping = false;
                this.character.isFalling = false;
                this.character.currentPlatformIndex = closestPlatform.id;
                this.character.rotation = 0;
                
                // إضافة النقاط
                this.addScore(15);
                
                // جسيمات الهبوط
                this.createParticles(
                    this.character.x,
                    this.character.y + this.character.collisionSize,
                    closestPlatform.color,
                    10
                );
                
                // إذا كانت المنصة تحتوي على فخ
                if (!closestPlatform.isSafe) {
                    setTimeout(() => {
                        this.endGame();
                    }, 100);
                }
                
                // جمع العملات على هذه المنصة
                this.collectCoinsOnPlatform(closestPlatform.id);
            }
        }
        
        // التصادم مع الفخاخ أثناء الهبوط
        if (this.character.isJumping || this.character.isFalling) {
            for (let trap of this.traps) {
                if (!trap.active || trap.y > this.canvas.height || trap.y < 0) continue;
                
                const trapX = centerX + Math.cos(trap.angle + this.helixRotation) * 145 + (trap.type === 'moving' ? trap.offset : 0);
                const dx = this.character.x - trapX;
                const dy = this.character.y - trap.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.character.collisionSize + Math.max(trap.width, trap.height) / 2) {
                    this.hitTrap(trap);
                    break;
                }
            }
        }
    }
    
    collectCoinsOnPlatform(platformId) {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.platformId !== platformId) return;
            
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const dx = this.character.x - coinX;
            const dy = this.character.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize + coin.radius) {
                this.collectCoin(coin, coinX);
            }
        });
    }
    
    hitTrap(trap) {
        // إنشاء جسيمات الانفجار
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.character.x + (Math.random() - 0.5) * 40,
                y: this.character.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 6,
                size: Math.random() * 6 + 3,
                color: this.colors.trap,
                life: 1
            });
        }
        
        // الصوت
        this.audio.play('gameOver', 0.8);
        
        // نهاية اللعبة
        setTimeout(() => {
            this.endGame();
        }, 300);
    }
    
    collectCoin(coin, coinX) {
        coin.collected = true;
        
        // إضافة النقاط
        this.addScore(coin.value);
        
        // الصوت
        this.audio.play('coin', 0.6);
        
        // جسيمات العملة
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: coinX + (Math.random() - 0.5) * 30,
                y: coin.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 4 + 2,
                color: this.colors.coin,
                life: 1
            });
        }
    }
    
    // ===== الرسم =====
    draw() {
        if (!this.gameActive) return;
        
        // مسح الشاشة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم الأسطوانة
        this.drawHelix();
        
        // رسم العناصر
        this.drawPlatforms();
        this.drawTraps();
        this.drawCoins();
        
        // رسم أثر الشخصية
        this.drawTrail();
        
        // رسم الشخصية
        this.drawCharacter();
        
        // رسم الجسيمات
        this.drawParticles();
    }
    
    drawBackground() {
        // خلفية متدرجة
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.colors.background.top);
        gradient.addColorStop(0.5, this.colors.background.middle);
        gradient.addColorStop(1, this.colors.background.bottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // تأثيرات خلفية دائرية
        this.ctx.fillStyle = 'rgba(255, 235, 59, 0.05)';
        for (let i = 0; i < 5; i++) {
            const radius = 50 + i * 40;
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // مركز الأسطوانة
        this.ctx.fillStyle = this.colors.helixCenter;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الخطوط الحلزونية (8 خطوط متساوية)
        this.ctx.strokeStyle = this.colors.helixLine;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 60;
            const x2 = centerX + Math.cos(angle) * 220;
            
            // تدرج الخط
            const lineGradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            lineGradient.addColorStop(0, 'rgba(255, 235, 59, 0.6)');
            lineGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.4)');
            lineGradient.addColorStop(1, 'rgba(255, 235, 59, 0.2)');
            this.ctx.strokeStyle = lineGradient;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // حدود الأسطوانة الخارجية
        this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 220, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 50 || platform.y < -50) return;
            
            const x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            
            // إذا كانت المنصة مدمرة، تظهر شفافة
            if (platform.isDestroyed) {
                const alpha = platform.destroyTimer / 30;
                this.ctx.globalAlpha = alpha;
            }
            
            // منصة آمنة (زرقاء) أو غير آمنة (حمراء)
            let platformColor;
            if (!platform.isSafe) {
                platformColor = this.ctx.createLinearGradient(
                    x - platform.width / 2, platform.y,
                    x + platform.width / 2, platform.y + platform.height
                );
                platformColor.addColorStop(0, '#FF5252');
                platformColor.addColorStop(1, '#D32F2F');
            } else {
                platformColor = this.ctx.createLinearGradient(
                    x - platform.width / 2, platform.y,
                    x + platform.width / 2, platform.y + platform.height
                );
                platformColor.addColorStop(0, platform.color);
                platformColor.addColorStop(1, this.darkenColor(platform.color, 30));
            }
            
            this.ctx.fillStyle = platformColor;
            
            if (platform.hasGap) {
                // الجزء الأيسر
                this.ctx.fillRect(
                    x - platform.width / 2,
                    platform.y,
                    platform.gapPos,
                    platform.height
                );
                
                // الجزء الأيمن
                this.ctx.fillRect(
                    x - platform.width / 2 + platform.gapPos + platform.gapWidth,
                    platform.y,
                    platform.width - platform.gapPos - platform.gapWidth,
                    platform.height
                );
                
                // الفجوة
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.fillRect(
                    x - platform.width / 2 + platform.gapPos,
                    platform.y,
                    platform.gapWidth,
                    platform.height
                );
            } else {
                // منصة كاملة
                this.ctx.fillRect(
                    x - platform.width / 2,
                    platform.y,
                    platform.width,
                    platform.height
                );
            }
            
            // حدود المنصة
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                x - platform.width / 2,
                platform.y,
                platform.width,
                platform.height
            );
            
            // إعادة تعيين الشفافية
            this.ctx.globalAlpha = 1;
            
            // عرض رقم المنصة (للتشغيل فقط)
            if (false) { // تغيير إلى true لعرض الأرقام
                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(platform.id, x, platform.y + platform.height / 2 + 4);
            }
        });
    }
    
    drawTraps() {
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active || trap.y > this.canvas.height + 50 || trap.y < -50) return;
            
            this.ctx.save();
            
            let x = centerX + Math.cos(trap.angle + this.helixRotation) * 145;
            if (trap.type === 'moving') {
                x += trap.offset;
            }
            
            if (trap.type === 'spinning') {
                this.ctx.translate(x, trap.y + trap.height / 2);
                this.ctx.rotate(trap.rotation);
                this.ctx.translate(-x, -(trap.y + trap.height / 2));
            }
            
            // الفخ المتحرك له توهج
            if (trap.type === 'moving') {
                this.ctx.shadowColor = '#FF1744';
                this.ctx.shadowBlur = 20;
            }
            
            // الفخ
            const trapGradient = this.ctx.createLinearGradient(
                x - trap.width / 2, trap.y,
                x + trap.width / 2, trap.y + trap.height
            );
            trapGradient.addColorStop(0, trap.type === 'moving' ? this.colors.movingTrap : this.colors.trap);
            trapGradient.addColorStop(1, '#D50000');
            
            this.ctx.fillStyle = trapGradient;
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, trap.height);
            
            // تفاصيل الفخ
            this.ctx.fillStyle = '#FF8A80';
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, 5);
            
            // أشواك متحركة
            this.ctx.fillStyle = '#FF5252';
            const spikeCount = 4;
            for (let i = 0; i < spikeCount; i++) {
                const spikeX = x - trap.width / 2 + (i + 0.5) * (trap.width / spikeCount);
                this.ctx.beginPath();
                this.ctx.moveTo(spikeX, trap.y);
                this.ctx.lineTo(spikeX - 7, trap.y - 12);
                this.ctx.lineTo(spikeX + 7, trap.y);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height + 50 || coin.y < -50) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            this.ctx.translate(x, coin.y);
            this.ctx.rotate(coin.rotation);
            
            // توهج العملة
            this.ctx.shadowColor = '#FFD600';
            this.ctx.shadowBlur = 25;
            
            // العملة الذهبية
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
            gradient.addColorStop(0, '#FFEA00');
            gradient.addColorStop(0.5, '#FFD600');
            gradient.addColorStop(1, '#FFAB00');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // النجمة
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = 'bold 22px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            // العملات الخاصة لها توهج إضافي
            if (coin.value === 50) {
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 40;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius * 1.3, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    drawTrail() {
        this.character.trail.forEach((point, index) => {
            const alpha = point.life;
            const size = this.character.displaySize * alpha * 0.4;
            
            this.ctx.fillStyle = `rgba(255, 107, 157, ${alpha * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawCharacter() {
        this.ctx.save();
        
        // تأثير التوهج أثناء القفز
        if (this.character.isJumping) {
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 40;
        } else if (this.character.isFalling) {
            this.ctx.shadowColor = '#FF5252';
            this.ctx.shadowBlur = 30;
        }
        
        this.ctx.translate(this.character.x, this.character.y);
        this.ctx.rotate(this.character.rotation);
        
        if (this.character.imageLoaded) {
            // رسم الصورة إذا تم تحميلها
            this.ctx.drawImage(
                this.character.image,
                -this.character.displaySize,
                -this.character.displaySize,
                this.character.displaySize * 2,
                this.character.displaySize * 2
            );
        } else {
            // رسم بديل - شخصية كبيرة وملونة
            // الجسم الرئيسي (كبير)
            const bodyGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.character.displaySize);
            bodyGradient.addColorStop(0, '#FF6B9D');
            bodyGradient.addColorStop(0.7, '#FF4081');
            bodyGradient.addColorStop(1, '#E91E63');
            this.ctx.fillStyle = bodyGradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.displaySize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // العينان الكبيرتان
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-15, -12, 8, 0, Math.PI * 2);
            this.ctx.arc(15, -12, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // التلاميذ
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-12, -12, 4, 0, Math.PI * 2);
            this.ctx.arc(12, -12, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // بريق في العينين
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-14, -14, 2, 0, Math.PI * 2);
            this.ctx.arc(14, -14, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفم
            if (this.character.isJumping || this.character.isFalling) {
                // فم مفتوح أثناء القفز/السقوط
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(0, 8, 12, 0.1 * Math.PI, 0.9 * Math.PI);
                this.ctx.fill();
            } else {
                // ابتسامة أثناء الوقوف
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 5, 14, 0.2 * Math.PI, 0.8 * Math.PI);
                this.ctx.stroke();
            }
            
            // قبعة المهندس
            this.ctx.fillStyle = '#3F51B5';
            this.ctx.fillRect(-18, -this.character.displaySize - 5, 36, 15);
            this.ctx.beginPath();
            this.ctx.arc(0, -this.character.displaySize - 5, 18, 0, Math.PI);
            this.ctx.fill();
        }
        
        // رسم دائرة التصادم للتصحيح
        if (false) { // تغيير إلى true لعرض دائرة التصادم
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.collisionSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
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
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: Math.random() * 5 + 3,
                color: color,
                life: 1
            });
        }
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return `#${(
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1)}`;
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
        
        // إيقاف نظام النط
        if (this.character.jumpInterval) {
            clearInterval(this.character.jumpInterval);
        }
        
        this.audio.play('gameOver', 0.8);
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.gameActive = true;
        this.helixRotation = 0;
        this.platformSpeed = 3;
        
        // إعادة تعيين الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 200;
        this.character.isJumping = false;
        this.character.isFalling = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        this.character.trail = [];
        this.character.currentPlatformIndex = -1;
        
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
    console.log('🎮 Helix Jump - الإصدار النهائي جاهز!');
    console.log('🔥 الميزات:');
    console.log('1. نطتين في الثانية');
    console.log('2. الشخصية كبيرة (بطول 3 درجات)');
    console.log('3. المنصات تتدمر بعد النط');
    console.log('4. مسافات متساوية بين المنصات');
    console.log('5. اسحب لتدوير الأسطوانة');
});
