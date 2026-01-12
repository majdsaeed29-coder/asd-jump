// ===== إعدادات اللعبة الجديدة =====
const GameConfig = {
    VERSION: "2.0 - الطابة الناطحة",
    
    // إعدادات المنصة
    PLATFORM_SPACING: 110,
    PLATFORM_HEIGHT: 20,
    GAP_WIDTH_MIN: 45,
    GAP_WIDTH_MAX: 70,
    
    // إعدادات الطابة
    BALL: {
        SIZE: 35,
        JUMP_FORCE: -14,
        GRAVITY: 0.7,
        BOUNCE_FACTOR: 0.8,
        AUTO_JUMP_DELAY: 100, // تأخير 100ms بين النطات التلقائية
        COLORS: ['#FF4081', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0']
    },
    
    // الألوان
    COLORS: {
        PLATFORM: '#4CAF50',
        PLATFORM_GAP: '#FF5252',
        PLATFORM_EDGE: '#2E7D32',
        COIN: '#FFD700',
        BACKGROUND: ['#0D47A1', '#1976D2'],
        HELIX: 'rgba(33, 150, 243, 0.7)',
        BALL_SHADOW: 'rgba(0, 0, 0, 0.3)'
    },
    
    // الصعوبة
    DIFFICULTY: {
        EASY: { 
            SPEED: 1.3, 
            GAP_CHANCE: 0.15,
            AUTO_JUMP: true
        },
        NORMAL: { 
            SPEED: 1.8, 
            GAP_CHANCE: 0.25,
            AUTO_JUMP: true
        },
        HARD: { 
            SPEED: 2.3, 
            GAP_CHANCE: 0.35,
            AUTO_JUMP: true
        }
    },
    
    // الأسطوانة
    HELIX: {
        RADIUS: 170,
        COLUMNS: 10,
        PLATFORM_WIDTH: 110,
        ROTATION_SPEED: 0.02
    }
};

// ===== فئة اللعبة - الطابة الناطحة =====
class BallHelixGame {
    constructor() {
        console.log('🎮 بدء لعبة الطابة الناطحة...');
        
        try {
            this.initGame();
            console.log('✅ اللعبة مهيأة بنجاح!');
        } catch (error) {
            console.error('❌ خطأ:', error);
            this.showError(error.message);
        }
    }
    
    // ===== تهيئة اللعبة =====
    initGame() {
        // الحصول على العناصر
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error('لم يتم العثور على Canvas');
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // تهيئة حالة اللعبة
        this.gameActive = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('helixHighScore')) || 0;
        this.level = 1;
        this.combo = 0;
        this.lastJumpTime = 0;
        
        // الحصول على الصعوبة
        const difficultySelect = document.getElementById('difficultySelect');
        this.difficulty = difficultySelect ? difficultySelect.value : 'EASY';
        this.gameSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.gapChance = GameConfig.DIFFICULTY[this.difficulty].GAP_CHANCE;
        this.autoJump = GameConfig.DIFFICULTY[this.difficulty].AUTO_JUMP;
        
        // تهيئة الطابة
        this.initBall();
        
        // تهيئة المنصات
        this.platforms = [];
        this.coins = [];
        this.particles = [];
        
        // الأسطوانة
        this.helixRotation = 0;
        this.rotationSpeed = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.dragSensitivity = 0.03;
        
        // التوقيت
        this.time = 0;
        this.lastAutoJump = 0;
        
        // الأحداث
        this.initEventListeners();
        
        // تحديث الواجهة
        this.updateUI();
    }
    
    // ===== تهيئة الطابة =====
    initBall() {
        const colorIndex = Math.floor(Math.random() * GameConfig.BALL.COLORS.length);
        
        this.ball = {
            x: 0, // سيتم ضبطه بعد resizeCanvas
            y: 0, // سيتم ضبطه بعد إنشاء المنصات
            size: GameConfig.BALL.SIZE,
            color: GameConfig.BALL.COLORS[colorIndex],
            velocityY: 0,
            isJumping: false,
            isOnPlatform: true,
            currentPlatform: null,
            rotation: 0,
            scale: 1,
            shadowSize: 0,
            trail: []
        };
    }
    
    // ===== تغيير حجم الكانفاس =====
    resizeCanvas() {
        const container = document.querySelector('.game-area');
        if (!container || !this.canvas) return;
        
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // ضبط موقع الطابة في المنتصف
        if (this.ball) {
            this.ball.x = this.canvas.width / 2;
        }
    }
    
    // ===== إنشاء المنصات الأولية =====
    createPlatforms() {
        this.platforms = [];
        this.coins = [];
        
        const platformCount = 30;
        const startY = 150;
        
        for (let i = 0; i < platformCount; i++) {
            const y = startY + i * GameConfig.PLATFORM_SPACING;
            const column = i % GameConfig.HELIX.COLUMNS;
            const angle = (column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
            
            // المنصات الـ 8 الأولى بدون فجوات للتسهيل
            const hasGap = i > 7 && Math.random() < this.gapChance;
            const gapWidth = hasGap ? 
                GameConfig.GAP_WIDTH_MIN + Math.random() * (GameConfig.GAP_WIDTH_MAX - GameConfig.GAP_WIDTH_MIN) : 
                0;
            const gapPos = hasGap ? 
                Math.random() * (GameConfig.HELIX.PLATFORM_WIDTH - gapWidth) : 
                0;
            
            const platform = {
                id: i,
                y: y,
                angle: angle,
                column: column,
                width: GameConfig.HELIX.PLATFORM_WIDTH,
                height: GameConfig.PLATFORM_HEIGHT,
                color: GameConfig.COLORS.PLATFORM,
                hasGap: hasGap,
                gapPos: gapPos,
                gapWidth: gapWidth,
                isActive: true,
                isPassed: false,
                bounce: 0
            };
            
            this.platforms.push(platform);
            
            // إضافة عملات (40% فرصة)
            if (i > 5 && Math.random() < 0.4 && !hasGap) {
                this.coins.push({
                    platformId: i,
                    angle: angle + (Math.random() * 0.3 - 0.15),
                    collected: false,
                    value: 10,
                    rotation: 0,
                    floatOffset: Math.random() * Math.PI * 2
                });
            }
        }
        
        // ضبط الطابة على المنصة الأولى
        if (this.platforms.length > 0) {
            const firstPlatform = this.platforms[0];
            this.ball.currentPlatform = firstPlatform;
            this.ball.y = firstPlatform.y - GameConfig.BALL.SIZE - 5;
            this.ball.x = this.canvas.width / 2;
            this.ball.isOnPlatform = true;
            this.ball.velocityY = 0;
            
            // إزالة الفجوة من المنصة الأولى
            firstPlatform.hasGap = false;
            firstPlatform.gapWidth = 0;
            
            console.log(`✅ الطابة على المنصة #0 (y=${Math.round(this.ball.y)})`);
        }
        
        console.log(`✅ تم إنشاء ${platformCount} منصة`);
    }
    
    // ===== الأحداث - تدوير فقط (بدون نط) =====
    initEventListeners() {
        // إزالة جميع الأحداث القديمة
        this.canvas.removeEventListener('mousedown', this.startDrag);
        this.canvas.removeEventListener('mousemove', this.drag);
        this.canvas.removeEventListener('mouseup', this.endDrag);
        this.canvas.removeEventListener('touchstart', this.touchStart);
        this.canvas.removeEventListener('touchmove', this.touchMove);
        this.canvas.removeEventListener('touchend', this.touchEnd);
        
        // السحب لتدوير الأسطوانة
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('mouseleave', () => this.endDrag());
        
        // اللمس لتدوير الأسطوانة
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.drag(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endDrag());
        
        // إزالة أزرار النط من الواجهة وإخفائها
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.style.display = 'none';
            jumpBtn.removeEventListener('click', this.jump);
        }
        
        // إزالة حدث النط من لوحة المفاتيح
        document.removeEventListener('keydown', this.keyDownHandler);
        
        // إعادة التشغيل فقط
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // أزرار الدوران
        document.getElementById('leftBtn').addEventListener('click', () => this.rotationSpeed = -0.04);
        document.getElementById('rightBtn').addEventListener('click', () => this.rotationSpeed = 0.04);
        
        console.log('✅ تم إعداد الأحداث: تدوير فقط، بدون نط يدوي');
    }
    
    startDrag(e) {
        if (!this.gameActive) return;
        this.isDragging = true;
        this.lastMouseX = e.clientX || e.pageX;
    }
    
    drag(e) {
        if (!this.isDragging || !this.gameActive) return;
        
        const currentX = e.clientX || e.pageX;
        const deltaX = currentX - this.lastMouseX;
        
        // تطبيق سرعة الدوران مع حساسية
        this.rotationSpeed = deltaX * this.dragSensitivity;
        this.lastMouseX = currentX;
    }
    
    endDrag() {
        this.isDragging = false;
    }
    
    // ===== تحديث اللعبة =====
    update(deltaTime) {
        if (!this.gameActive) return;
        
        this.time += deltaTime / 1000;
        
        // تحديث دوران الأسطوانة
        this.updateRotation();
        
        // تحديث الطابة (النط التلقائي)
        this.updateBall(deltaTime);
        
        // تحريك المنصات
        this.updatePlatforms(deltaTime);
        
        // التحقق من الاصطدامات
        this.checkCollisions();
        
        // تحديث الجسيمات
        this.updateParticles(deltaTime);
        
        // تحديث الأثر
        this.updateTrail();
        
        // تحديث المنصات (تأثيرات)
        this.updatePlatformEffects(deltaTime);
        
        // تحديث العملات
        this.updateCoins(deltaTime);
    }
    
    updateRotation() {
        // تطبيق الدوران
        this.helixRotation += this.rotationSpeed;
        
        // الحفاظ على النطاق
        if (this.helixRotation > Math.PI * 2) this.helixRotation -= Math.PI * 2;
        if (this.helixRotation < 0) this.helixRotation += Math.PI * 2;
        
        // تخفيف السرعة تدريجياً
        this.rotationSpeed *= 0.92;
    }
    
    updateBall(deltaTime) {
        // تطبيق الجاذبية
        this.ball.velocityY += GameConfig.BALL.GRAVITY;
        this.ball.y += this.ball.velocityY;
        
        // تحديث دوران الطابة
        this.ball.rotation += 0.1;
        
        // تأثير القفز
        if (this.ball.velocityY < 0) {
            this.ball.scale = 1 + Math.abs(this.ball.velocityY) / 50;
        } else {
            this.ball.scale = 1;
        }
        
        // تحديل حجم الظل
        this.ball.shadowSize = Math.max(0, this.ball.velocityY * 0.5);
        
        // البحث عن المنصة الحالية
        this.findCurrentPlatform();
        
        // النط التلقائي عندما تكون الطابة على منصة
        if (this.autoJump && this.ball.isOnPlatform) {
            const now = Date.now();
            if (now - this.lastAutoJump > GameConfig.BALL.AUTO_JUMP_DELAY) {
                this.performAutoJump();
                this.lastAutoJump = now;
            }
        }
        
        // التحقق من السقوط خارج الشاشة
        if (this.ball.y > this.canvas.height + 100) {
            this.endGame();
        }
    }
    
    findCurrentPlatform() {
        let closestPlatform = null;
        let minDistance = Infinity;
        const centerX = this.canvas.width / 2;
        
        for (const platform of this.platforms) {
            if (!platform.isActive) continue;
            
            // المسافة العمودية بين الطابة والمنصة
            const verticalDistance = platform.y - this.ball.y;
            
            // إذا كانت الطابة فوق المنصة مباشرة (بهامش ±15 بكسل)
            if (verticalDistance >= -15 && verticalDistance < 80) {
                // حساب موقع المنصة على الشاشة
                const platformAngle = platform.angle + this.helixRotation;
                const platformX = centerX + Math.cos(platformAngle) * GameConfig.HELIX.RADIUS;
                
                // المسافة الأفقية
                const horizontalDistance = Math.abs(this.ball.x - platformX);
                
                // إذا كانت داخل عرض المنصة (بهامش إضافي)
                if (horizontalDistance < (platform.width / 2) + 15) {
                    // التحقق من الفجوة
                    if (!this.isBallOverGap(platform, platformX)) {
                        if (Math.abs(verticalDistance) < minDistance) {
                            minDistance = Math.abs(verticalDistance);
                            closestPlatform = platform;
                        }
                    }
                }
            }
        }
        
        if (closestPlatform) {
            // الهبوط على المنصة
            if (this.ball.velocityY > 0 && !this.ball.isOnPlatform) {
                // ضبط الارتفاع فوق المنصة
                this.ball.y = closestPlatform.y - GameConfig.BALL.SIZE - 5;
                this.ball.velocityY = 0;
                this.ball.isOnPlatform = true;
                
                // تأثير ارتداد المنصة
                closestPlatform.bounce = 1;
                
                // حدث عبور المنصة
                if (this.ball.currentPlatform !== closestPlatform) {
                    this.onPlatformPassed(closestPlatform);
                }
                
                // جسيمات الهبوط
                this.createLandingParticles(closestPlatform);
            }
            
            this.ball.currentPlatform = closestPlatform;
            this.ball.isOnPlatform = true;
        } else {
            // الطابة ليست على منصة
            this.ball.isOnPlatform = false;
            this.ball.currentPlatform = null;
        }
    }
    
    isBallOverGap(platform, platformX) {
        if (!platform.hasGap) return false;
        
        // حساب موقع الفجوة على الشاشة
        const gapStart = platformX - (platform.width / 2) + platform.gapPos;
        const gapEnd = gapStart + platform.gapWidth;
        
        // إذا كانت الطابة فوق الفجوة
        return this.ball.x >= gapStart && this.ball.x <= gapEnd;
    }
    
    performAutoJump() {
        if (!this.ball.isOnPlatform) return;
        
        // النط التلقائي
        this.ball.velocityY = GameConfig.BALL.JUMP_FORCE;
        this.ball.isOnPlatform = false;
        
        // جسيمات النط
        this.createJumpParticles();
        
        // إضافة أثر
        this.addTrailPoint();
    }
    
    updatePlatforms(deltaTime) {
        const speed = this.gameSpeed * (deltaTime / 16.67);
        
        // تحريك جميع المنصات للأعلى
        this.platforms.forEach(platform => {
            platform.y -= speed;
            
            // إعادة تدوير المنصة عندما تخرج من الأعلى
            if (platform.y < -100) {
                this.recyclePlatform(platform);
            }
        });
    }
    
    updatePlatformEffects(deltaTime) {
        // تحديث تأثير الارتداد للمنصات
        this.platforms.forEach(platform => {
            if (platform.bounce > 0) {
                platform.bounce -= 0.1;
                if (platform.bounce < 0) platform.bounce = 0;
            }
        });
    }
    
    updateCoins(deltaTime) {
        // تحديث دوران العملات وتأثير الطفو
        this.coins.forEach(coin => {
            coin.rotation += 0.03;
            coin.floatOffset += 0.05;
        });
    }
    
    recyclePlatform(platform) {
        // العثور على أدنى منصة ونقل هذه المنصة أسفلها
        const lowestY = Math.min(...this.platforms.map(p => p.y));
        platform.y = lowestY + GameConfig.PLATFORM_SPACING;
        platform.isPassed = false;
        platform.bounce = 0;
        
        // إعادة تعيين الفجوة
        platform.hasGap = Math.random() < this.gapChance;
        
        if (platform.hasGap) {
            platform.gapWidth = GameConfig.GAP_WIDTH_MIN + 
                Math.random() * (GameConfig.GAP_WIDTH_MAX - GameConfig.GAP_WIDTH_MIN);
            platform.gapPos = Math.random() * (platform.width - platform.gapWidth);
        } else {
            platform.gapWidth = 0;
            platform.gapPos = 0;
        }
        
        // تغيير العمود والزاوية
        platform.column = (platform.column + 1) % GameConfig.HELIX.COLUMNS;
        platform.angle = (platform.column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
        
        // تحديث العملات
        this.updatePlatformCoins(platform);
    }
    
    updatePlatformCoins(platform) {
        // إزالة العملات القديمة
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        
        // إضافة عملة جديدة (50% فرصة إذا لم يكن هناك فجوة)
        if (!platform.hasGap && Math.random() < 0.5) {
            this.coins.push({
                platformId: platform.id,
                angle: platform.angle + (Math.random() * 0.3 - 0.15),
                collected: false,
                value: 10,
                rotation: 0,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    checkCollisions() {
        // التحقق من العملات
        this.checkCoinCollision();
        
        // التحقق من الفجوات (فقط إذا كانت الطابة على منصة)
        if (this.ball.isOnPlatform && this.ball.currentPlatform) {
            const centerX = this.canvas.width / 2;
            const platform = this.ball.currentPlatform;
            const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * GameConfig.HELIX.RADIUS;
            
            if (platform.hasGap && this.isBallOverGap(platform, platformX)) {
                this.fallIntoGap();
            }
        }
    }
    
    checkCoinCollision() {
        const centerX = this.canvas.width / 2;
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (!platform) continue;
            
            // موقع العملة على الشاشة مع تأثير الطفو
            const floatY = Math.sin(coin.floatOffset) * 5;
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * (GameConfig.HELIX.RADIUS + 25);
            const coinY = platform.y - 30 + floatY;
            
            // حساب المسافة إلى الطابة
            const dx = this.ball.x - coinX;
            const dy = this.ball.y - coinY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // إذا كانت المسافة أقل من نصف حجم الطابة + نصف حجم العملة
            if (distance < (this.ball.size / 2) + 12) {
                this.collectCoin(coin);
            }
        }
    }
    
    // ===== النظام البصري =====
    updateTrail() {
        // إضافة نقطة أثر جديدة
        this.ball.trail.push({
            x: this.ball.x,
            y: this.ball.y,
            size: this.ball.size * 0.7,
            alpha: 0.6,
            color: this.ball.color
        });
        
        // تحديث وتقليل الشفافية
        for (let i = this.ball.trail.length - 1; i >= 0; i--) {
            this.ball.trail[i].alpha -= 0.05;
            this.ball.trail[i].size *= 0.95;
            
            if (this.ball.trail[i].alpha <= 0 || this.ball.trail[i].size < 2) {
                this.ball.trail.splice(i, 1);
            }
        }
        
        // الحفاظ على عدد معقول من النقاط
        if (this.ball.trail.length > 15) {
            this.ball.trail.shift();
        }
    }
    
    addTrailPoint() {
        this.ball.trail.push({
            x: this.ball.x,
            y: this.ball.y,
            size: this.ball.size * 0.8,
            alpha: 0.8,
            color: this.ball.color
        });
    }
    
    createJumpParticles() {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 3 + Math.random() * 4,
                color: this.ball.color,
                life: 1,
                decay: 0.03 + Math.random() * 0.02
            });
        }
    }
    
    createLandingParticles(platform) {
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * GameConfig.HELIX.RADIUS;
        
        const count = 6;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: platformX,
                y: platform.y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                size: 2 + Math.random() * 3,
                color: platform.color,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    createParticles(x, y, count, color, size = 4) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                size: size,
                color: color,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // تحديث الموقع
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // جاذبية للجسيمات
            
            // تقليل العمر
            p.life -= p.decay;
            
            // إزالة الجسيمات الميتة
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // ===== الأحداث =====
    onPlatformPassed(platform) {
        if (platform.isPassed) return;
        
        platform.isPassed = true;
        
        // إضافة النقاط مع مكافأة الكومبو
        const points = 10 + (this.combo * 2);
        this.addScore(points);
        this.combo++;
        
        // عرض الكومبو
        if (this.combo > 1) {
            this.showCombo(this.combo);
        }
        
        // زيادة السرعة تدريجياً
        if (this.score % 100 === 0) {
            this.gameSpeed += 0.1;
            console.log(`⚡ زيادة السرعة إلى: ${this.gameSpeed.toFixed(1)}`);
        }
        
        // زيادة المستوى
        const newLevel = Math.floor(this.score / 200) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            console.log(`🎉 المستوى ${this.level}!`);
        }
    }
    
    collectCoin(coin) {
        coin.collected = true;
        
        // إضافة النقاط مع مكافأة الكومبو
        const points = coin.value + (this.combo * 3);
        this.addScore(points);
        
        // جسيمات العملة
        this.createParticles(this.ball.x, this.ball.y, 15, GameConfig.COLORS.COIN, 5);
        
        console.log('💰 جمع عملة! +' + points + ' نقطة');
    }
    
    fallIntoGap() {
        console.log('💀 سقوط في فجوة!');
        
        // جسيمات السقوط
        this.createParticles(this.ball.x, this.ball.y, 25, GameConfig.COLORS.PLATFORM_GAP, 6);
        
        // إعادة تعيين الكومبو
        this.combo = 0;
        
        this.endGame();
    }
    
    showCombo(count) {
        // يمكن إضافة عرض مرئي للكومبو هنا
        console.log(`🔥 كومبو x${count}!`);
    }
    
    // ===== الرسم =====
    draw() {
        if (!this.ctx || !this.gameActive) return;
        
        // مسح الشاشة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم الأسطوانة
        this.drawHelix();
        
        // رسم أثر الطابة
        this.drawTrail();
        
        // رسم المنصات
        this.drawPlatforms();
        
        // رسم العملات
        this.drawCoins();
        
        // رسم الجسيمات
        this.drawParticles();
        
        // رسم الطابة
        this.drawBall();
        
        // رسم معلومات التصحيح (اختياري)
        if (window.showDebug) {
            this.drawDebugInfo();
        }
    }
    
    drawBackground() {
        // خلفية متدرجة
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND[0]);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // نجوم خلفية متحركة
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 25; i++) {
            const x = (i * 53) % this.canvas.width;
            const y = (i * 37 + this.time * 20) % this.canvas.height;
            const size = (Math.sin(this.time * 2 + i) + 1) * 0.5 + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = GameConfig.HELIX.RADIUS;
        const columns = GameConfig.HELIX.COLUMNS;
        
        // العمود المركزي
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(centerX - 4, 0, 8, this.canvas.height);
        
        // الخطوط الحلزونية مع تدرج
        for (let i = 0; i < columns; i++) {
            const angle = (i * Math.PI * 2) / columns + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 20;
            const x2 = centerX + Math.cos(angle) * radius;
            
            const gradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            gradient.addColorStop(0, `rgba(33, 150, 243, ${0.4 + Math.sin(this.time + i) * 0.2})`);
            gradient.addColorStop(1, `rgba(33, 150, 243, ${0.2 + Math.sin(this.time + i) * 0.1})`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // الحلقة الخارجية مع توهج
        this.ctx.strokeStyle = GameConfig.COLORS.HELIX;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // حلقة داخلية
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawTrail() {
        // رسم أثر الطابة
        for (let i = 0; i < this.ball.trail.length; i++) {
            const point = this.ball.trail[i];
            
            this.ctx.save();
            this.ctx.globalAlpha = point.alpha;
            this.ctx.fillStyle = point.color;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * GameConfig.HELIX.RADIUS;
            const y = platform.y + (platform.bounce * 3); // تأثير الارتداد
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // لون المنصة
            const platformColor = platform.hasGap ? '#666' : platform.color;
            
            if (platform.hasGap) {
                // الجزء الأيسر من المنصة
                this.ctx.fillStyle = platformColor;
                this.ctx.fillRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.gapPos,
                    platform.height
                );
                
                // الجزء الأيمن من المنصة
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos + platform.gapWidth,
                    -platform.height / 2,
                    platform.width - platform.gapPos - platform.gapWidth,
                    platform.height
                );
                
                // الفجوة مع تدرج
                const gapGradient = this.ctx.createLinearGradient(
                    -platform.width / 2 + platform.gapPos,
                    0,
                    -platform.width / 2 + platform.gapPos + platform.gapWidth,
                    0
                );
                gapGradient.addColorStop(0, 'rgba(255, 82, 82, 0.6)');
                gapGradient.addColorStop(0.5, 'rgba(255, 82, 82, 0.9)');
                gapGradient.addColorStop(1, 'rgba(255, 82, 82, 0.6)');
                
                this.ctx.fillStyle = gapGradient;
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos,
                    -platform.height / 2,
                    platform.gapWidth,
                    platform.height
                );
                
                // تأثير الخطورة في الفجوة
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let i = 0; i < 3; i++) {
                    const spikeY = -platform.height / 2 + (i * platform.height / 3);
                    this.ctx.beginPath();
                    this.ctx.moveTo(-platform.width / 2 + platform.gapPos, spikeY);
                    this.ctx.lineTo(-platform.width / 2 + platform.gapPos + platform.gapWidth / 2, spikeY + 5);
                    this.ctx.lineTo(-platform.width / 2 + platform.gapPos + platform.gapWidth, spikeY);
                    this.ctx.fill();
                }
            } else {
                // منصة كاملة
                this.ctx.fillStyle = platformColor;
                this.ctx.fillRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.width,
                    platform.height
                );
                
                // توهج للمنصة الحالية
                if (platform === this.ball.currentPlatform) {
                    this.ctx.shadowColor = platform.color;
                    this.ctx.shadowBlur = 25;
                    this.ctx.fillRect(
                        -platform.width / 2,
                        -platform.height / 2,
                        platform.width,
                        platform.height
                    );
                    this.ctx.shadowBlur = 0;
                }
                
                // خط علوي لامع
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.fillRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.width,
                    2
                );
            }
            
            // حواف المنصة
            this.ctx.strokeStyle = GameConfig.COLORS.PLATFORM_EDGE;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.width,
                platform.height
            );
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) continue;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (!platform) return;
            
            // تأثير الطفو
            const floatY = Math.sin(coin.floatOffset) * 5;
            const angle = coin.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (GameConfig.HELIX.RADIUS + 25);
            const y = platform.y - 30 + floatY;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(coin.rotation);
            
            // رسم العملة
            this.ctx.fillStyle = GameConfig.COLORS.COIN;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // توهج
            this.ctx.shadowColor = GameConfig.COLORS.COIN;
            this.ctx.shadowBlur = 20;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // تصميم العملة
            this.ctx.fillStyle = '#FFA000';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // علامة الدولار
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('$', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawBall() {
        this.ctx.save();
        this.ctx.translate(this.ball.x, this.ball.y);
        
        // تطبيق تأثير القفز (توسيع/تقليص)
        this.ctx.scale(this.ball.scale, this.ball.scale);
        
        // الظل المتحرك
        this.ctx.fillStyle = GameConfig.COLORS.BALL_SHADOW;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 15 + this.ball.shadowSize, 
                        this.ball.size * 0.6, this.ball.size * 0.15, 
                        0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الطابة مع تدرج لوني
        const gradient = this.ctx.createRadialGradient(
            -10, -10, 1,
            0, 0, this.ball.size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, this.ball.color);
        gradient.addColorStop(1, this.darkenColor(this.ball.color, 30));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.ball.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // تأثير ثلاثي الأبعاد
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.ball.size / 2 - 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // خط علوي لامع
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.ball.size / 2 - 4, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // توهج عند النط
        if (this.ball.velocityY < 0) {
            this.ctx.shadowColor = this.ball.color;
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.ball.size / 2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        // علامة المهندس (اختيارية)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('👨‍💻', 0, 0);
        
        this.ctx.restore();
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
    
    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 280, 160);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = [
            `🏆 النقاط: ${this.score}`,
            `🔥 كومبو: x${this.combo}`,
            `📊 المستوى: ${this.level}`,
            `⚡ السرعة: ${this.gameSpeed.toFixed(1)}`,
            `🌀 الدوران: ${(this.helixRotation * 180 / Math.PI).toFixed(1)}°`,
            `📍 الموقع: (${Math.round(this.ball.x)}, ${Math.round(this.ball.y)})`,
            `🎯 السرعة Y: ${this.ball.velocityY.toFixed(1)}`,
            `🔄 على منصة: ${this.ball.isOnPlatform ? 'نعم' : 'لا'}`,
            `📐 منصة حالية: ${this.ball.currentPlatform ? '#' + this.ball.currentPlatform.id : 'لا شيء'}`,
            `🎨 لون الطابة: ${this.ball.color}`,
            `🕐 الوقت: ${this.time.toFixed(1)}s`
        ];
        
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 15, 30 + i * 14);
        });
    }
    
    // ===== واجهة المستخدم =====
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        
        // إزالة عنصر النطات من الواجهة
        const jumpsElement = document.getElementById('jumpsCount');
        if (jumpsElement) {
            jumpsElement.parentElement.style.display = 'none';
        }
    }
    
    addScore(points) {
        this.score += points;
        
        // حفظ أعلى نتيجة
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
        
        // تحديث الواجهة
        document.getElementById('score').textContent = this.score;
        
        // تأثير عند إضافة النقاط
        const scoreElement = document.getElementById('score');
        scoreElement.style.transform = 'scale(1.2)';
        scoreElement.style.color = '#FFD700';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
            scoreElement.style.color = '';
        }, 300);
    }
    
    // ===== نهاية اللعبة =====
    endGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        console.log('🛑 انتهت اللعبة! النقاط:', this.score);
        
        // جسيمات نهاية اللعبة
        this.createParticles(this.ball.x, this.ball.y, 30, '#FF4081', 8);
        
        // حساب الإنجاز
        let achievement = '🎮 لاعب مبتدئ';
        if (this.score >= 1000) achievement = '🏆 بطل الأسطوانة!';
        else if (this.score >= 500) achievement = '🥈 لاعب محترف';
        else if (this.score >= 200) achievement = '🥉 لاعب جيد';
        
        // عرض شاشة النهاية بعد تأخير قصير
        setTimeout(() => {
            const finalStats = document.getElementById('finalStats');
            finalStats.innerHTML = `
                <div style="margin: 15px 0;">
                    <div style="color: rgba(255,255,255,0.8); font-size: 16px; margin-bottom: 5px;">النقاط النهائية</div>
                    <div style="font-size: 48px; color: #FFD700; font-weight: bold;">${this.score}</div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="color: rgba(255,255,255,0.8); font-size: 16px; margin-bottom: 5px;">أعلى نتيجة</div>
                    <div style="font-size: 32px; color: #4CAF50;">${this.highScore}</div>
                </div>
                <div style="margin: 15px 0;">
                    <div style="color: rgba(255,255,255,0.8); font-size: 16px; margin-bottom: 5px;">أفضل كومبو</div>
                    <div style="font-size: 32px; color: #FF4081;">x${this.combo}</div>
                </div>
            `;
            
            document.getElementById('achievementBadge').textContent = achievement;
            document.getElementById('gameOverScreen').style.display = 'flex';
            
            // إعادة تعيين حدث إعادة التشغيل
            const restartBtn = document.getElementById('gameOverRestartBtn');
            restartBtn.onclick = () => this.restartGame();
        }, 800);
    }
    
    // ===== التحكم في اللعبة =====
    startGame() {
        this.gameActive = true;
        
        // إخفاء شاشة البداية
        document.getElementById('startScreen').style.display = 'none';
        
        // إظهار شاشة اللعبة
        document.getElementById('gameContainer').style.display = 'block';
        
        // إنشاء المنصات
        this.createPlatforms();
        
        // إعادة تعيين حالة اللعبة
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.gameSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        
        // تحديث الواجهة
        this.updateUI();
        
        // بدء حلقة اللعبة
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('🎮 اللعبة بدأت! الطابة تنط تلقائياً');
        console.log('🔄 تدوير الأسطوانة باللمس أو السحب فقط');
    }
    
    restartGame() {
        // إعادة تعيين اللعبة
        this.initGame();
        this.startGame();
        
        // إخفاء شاشة النهاية
        document.getElementById('gameOverScreen').style.display = 'none';
        
        console.log('🔄 إعادة تشغيل اللعبة');
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
        if (!this.gameActive) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.lastTime = currentTime;
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // ===== وظائف مساعدة =====
    showError(message) {
        console.error('❌ ' + message);
        alert('❌ خطأ: ' + message);
    }
}

// ===== بدء اللعبة عند تحميل الصفحة =====
window.addEventListener('load', () => {
    console.log('🚀 جاهز لبدء لعبة الطابة الناطحة...');
    
    // إخفاء شاشة التحميل
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
    }, 1000);
    
    // بدء اللعبة عند النقر على زر البدء
    document.getElementById('startButton').addEventListener('click', function() {
        try {
            // إنشاء وبدء اللعبة
            window.game = new BallHelixGame();
            window.game.startGame();
            
            // إخفاء زر النط من الواجهة
            const jumpBtn = document.getElementById('jumpBtn');
            if (jumpBtn) jumpBtn.style.display = 'none';
            
            // تحديث نص التعليمات
            const instructions = document.querySelector('.controls-hint');
            if (instructions) {
                instructions.innerHTML = `
                    <div class="control-item">
                        <div class="control-icon">🔄</div>
                        <div class="control-text">اسحب لتدوير الأسطوانة</div>
                    </div>
                    <div class="control-item">
                        <div class="control-icon">⚡</div>
                        <div class="control-text">الطابة تنط تلقائياً</div>
                    </div>
                    <div class="control-item">
                        <div class="control-icon">🎯</div>
                        <div class="control-text">تجنب الفجوات الحمراء</div>
                    </div>
                `;
            }
            
            console.log('✅ اللعبة تعمل! الطابة تنط تلقائياً');
            
        } catch (error) {
            console.error('❌ خطأ في بدء اللعبة:', error);
            alert('حدث خطأ في بدء اللعبة. يرجى تحديث الصفحة.');
        }
    });
    
    // اختصارات لوحة المفاتيح للتصحيح
    document.addEventListener('keydown', (e) => {
        // D لتفعيل/تعطيل التصحيح
        if (e.key === 'd' || e.key === 'D') {
            window.showDebug = !window.showDebug;
            console.log('🐛 وضع التصحيح:', window.showDebug ? 'مفعل' : 'معطل');
        }
        
        // R لإعادة التشغيل
        if (e.key === 'r' || e.key === 'R') {
            if (window.game) {
                window.game.restartGame();
            }
        }
        
        // I لإضافة نقاط (للاختبار)
        if (e.key === 'i' || e.key === 'I') {
            if (window.game) {
                window.game.addScore(100);
                console.log('✨ +100 نقطة!');
            }
        }
        
        // S لإبطاء اللعبة
        if (e.key === 's' || e.key === 'S') {
            if (window.game) {
                window.game.gameSpeed = 1.0;
                console.log('🐌 الحركة البطيئة مفعلة');
            }
        }
        
        // G لإزالة الفجوات
        if (e.key === 'g' || e.key === 'G') {
            if (window.game) {
                window.game.gapChance = 0;
                console.log('🛡️ تم إزالة الفجوات');
            }
        }
    });
});

// وظائف مساعدة للاختبار
window.gameHelp = {
    // تغيير لون الطابة
    changeBallColor: function() {
        if (window.game && window.game.ball) {
            const colors = GameConfig.BALL.COLORS;
            const currentIndex = colors.indexOf(window.game.ball.color);
            const nextIndex = (currentIndex + 1) % colors.length;
            window.game.ball.color = colors[nextIndex];
            console.log('🎨 تغيير لون الطابة إلى:', window.game.ball.color);
        }
    },
    
    // إضافة كومبو
    addCombo: function(count = 5) {
        if (window.game) {
            window.game.combo += count;
            console.log(`🔥 كومبو x${window.game.combo}!`);
        }
    },
    
    // تجميد الطابة في الهواء
    freezeBall: function() {
        if (window.game && window.game.ball) {
            window.game.ball.velocityY = 0;
            window.game.autoJump = false;
            console.log('❄️ الطابة مجمدة في الهواء');
        }
    },
    
    // إعادة تفعيل النط التلقائي
    unfreezeBall: function() {
        if (window.game) {
            window.game.autoJump = true;
            console.log('🔥 النط التلقائي مفعل');
        }
    }
};
