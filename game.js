// ===== إعدادات اللعبة - النسخة الخارقة =====
const GameConfig = {
    VERSION: "10.0 - النسخة الكاملة",
    PLATFORM_SPACING: 130,
    PLATFORM_HEIGHT: 25,
    GAP_WIDTH_MIN: 35,
    GAP_WIDTH_MAX: 60,
    CHARACTER: {
        SIZE: 60,
        JUMP_HEIGHT: 80,
        JUMP_DURATION: 600,
        FALL_SPEED: 8,
        ROTATION_SPEED: 0.15
    },
    COLORS: {
        PLATFORM: ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'],
        PLATFORM_EDGE: '#FFFFFF',
        GAP: '#FF5252',
        TRAP: '#F44336',
        COIN: '#FFD700',
        HELIX: 'rgba(33, 150, 243, 0.9)',
        BACKGROUND: {
            TOP: '#0D47A1',
            MIDDLE: '#1565C0',
            BOTTOM: '#1976D2'
        }
    },
    DIFFICULTY: {
        EASY: { 
            SPEED: 1.8, 
            ROTATION_SPEED: 0.015,
            GAP_CHANCE: 0.4,
            TRAP_CHANCE: 0.1
        },
        NORMAL: { 
            SPEED: 2.3, 
            ROTATION_SPEED: 0.022,
            GAP_CHANCE: 0.5,
            TRAP_CHANCE: 0.2
        },
        HARD: { 
            SPEED: 2.8, 
            ROTATION_SPEED: 0.028,
            GAP_CHANCE: 0.6,
            TRAP_CHANCE: 0.3
        },
        EXTREME: { 
            SPEED: 3.5, 
            ROTATION_SPEED: 0.035,
            GAP_CHANCE: 0.7,
            TRAP_CHANCE: 0.4
        }
    },
    HELIX: {
        RADIUS: 200,
        COLUMNS: 12,
        PLATFORM_WIDTH: 120,
        PLATFORM_DEPTH: 40
    },
    PARTICLES: {
        JUMP: { COUNT: 8, COLOR: '#FF4081', SIZE: 4 },
        COIN: { COUNT: 12, COLOR: '#FFD700', SIZE: 6 },
        FALL: { COUNT: 20, COLOR: '#FF5252', SIZE: 8 }
    }
};

// ===== فئة اللعبة الخارقة =====
class UltimateHelixJump {
    constructor() {
        console.log('🚀 بدء تحميل اللعبة - النسخة الخارقة');
        
        try {
            // تهيئة العناصر
            this.initElements();
            this.initGameState();
            this.initImages();
            this.initEventListeners();
            this.createInitialPlatforms();
            this.setupShop();
            
            console.log('✅ اللعبة مهيأة بنجاح');
            
            // بدء اللعبة
            this.lastFrameTime = performance.now();
            this.gameLoop();
            
        } catch (error) {
            console.error('❌ خطأ في التهيئة:', error);
            this.showError(error.message);
        }
    }
    
    // ===== تهيئة العناصر =====
    initElements() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error('لم يتم العثور على canvas');
        
        this.ctx = this.canvas.getContext('2d');
        this.gameActive = false;
        this.isPaused = false;
        this.isJumping = false;
        
        // عناصر واجهة المستخدم
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('highScore');
        this.jumpsCountElement = document.getElementById('jumpsCount');
        this.comboDisplay = document.getElementById('comboDisplay');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    initGameState() {
        // حالة اللعبة
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.highScore = parseInt(localStorage.getItem('helixHighScore')) || 0;
        this.totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
        this.jumpsRemaining = 3;
        this.maxJumps = 3;
        this.lastJumpTime = 0;
        this.jumpCooldown = 500;
        
        // الصعوبة
        this.difficulty = 'NORMAL';
        this.platformSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.rotationSpeed = GameConfig.DIFFICULTY[this.difficulty].ROTATION_SPEED;
        this.gapChance = GameConfig.DIFFICULTY[this.difficulty].GAP_CHANCE;
        this.trapChance = GameConfig.DIFFICULTY[this.difficulty].TRAP_CHANCE;
        
        // الشخصية
        this.character = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.75,
            size: GameConfig.CHARACTER.SIZE,
            color: '#FF4081',
            rotation: 0,
            scale: 1,
            velocityY: 0,
            isFalling: false,
            fallSpeed: 0,
            currentPlatform: null
        };
        
        // الأسطوانة
        this.helixRotation = 0;
        this.targetRotation = 0;
        this.rotationVelocity = 0;
        this.isDragging = false;
        this.lastTouchX = 0;
        this.dragSensitivity = 0.02;
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        // إحصائيات
        this.stats = {
            platformsPassed: 0,
            jumpsMade: 0,
            coinsCollected: 0,
            trapsAvoided: 0,
            playTime: 0,
            bestCombo: 0
        };
        
        // الصوت
        this.soundEnabled = true;
        this.sounds = {};
        
        // الوقت
        this.time = 0;
        this.gameStartTime = Date.now();
    }
    
    initImages() {
        // تحميل صور الشخصية
        this.characterImages = {
            default: this.loadImage('./assets/engineer.png'),
            jump: this.loadImage('./assets/engineer2.png'),
            fall: this.loadImage('./assets/engineer3.png')
        };
        
        this.currentCharacterImage = this.characterImages.default;
        
        // تحميل صور أخرى
        this.coinImage = this.loadImage('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23FFD700"/><text x="12" y="16" text-anchor="middle" fill="%238B8000" font-size="10">$</text></svg>');
        this.trapImage = this.loadImage('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="%23FF5252"/></svg>');
    }
    
    loadImage(src) {
        const img = new Image();
        img.src = src;
        img.onerror = () => console.warn(`⚠️ لم يتم تحميل الصورة: ${src}`);
        return img;
    }
    
    // ===== إنشاء المنصات =====
    createInitialPlatforms() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        
        const platformCount = 25;
        const helixRadius = GameConfig.HELIX.RADIUS;
        const columns = GameConfig.HELIX.COLUMNS;
        
        for (let i = 0; i < platformCount; i++) {
            const y = 100 + i * GameConfig.PLATFORM_SPACING;
            const column = i % columns;
            const angle = (column * Math.PI * 2) / columns;
            
            // إعدادات المنصة
            const hasGap = i > 0 && Math.random() < this.gapChance;
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
                depth: GameConfig.HELIX.PLATFORM_DEPTH,
                color: GameConfig.COLORS.PLATFORM[column % GameConfig.COLORS.PLATFORM.length],
                hasGap: hasGap,
                gapPos: gapPos,
                gapWidth: gapWidth,
                isActive: true,
                isPassed: false
            };
            
            this.platforms.push(platform);
            
            // إضافة فخ (30% فرصة)
            if (i > 0 && Math.random() < this.trapChance) {
                this.traps.push({
                    id: this.traps.length,
                    platformId: i,
                    angle: angle,
                    type: 'spike',
                    active: true,
                    rotation: Math.random() * Math.PI * 2
                });
            }
            
            // إضافة عملة (40% فرصة)
            if (i > 0 && Math.random() < 0.4) {
                this.coins.push({
                    id: this.coins.length,
                    platformId: i,
                    angle: angle + (Math.random() * 0.5 - 0.25), // زاوية عشوائية قليلاً
                    collected: false,
                    value: 10,
                    rotation: 0,
                    scale: 1
                });
            }
        }
        
        // تعيين المنصة الحالية للشخصية
        this.character.currentPlatform = this.platforms[0];
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics(deltaTime) {
        if (!this.gameActive || this.isPaused) return;
        
        // تحديث الوقت
        this.time += deltaTime / 1000;
        this.stats.playTime += deltaTime / 1000;
        
        // تحديث دوران الأسطوانة
        this.updateHelixRotation(deltaTime);
        
        // تحديث حركة الشخصية
        this.updateCharacter(deltaTime);
        
        // تحريك المنصات
        this.updatePlatforms(deltaTime);
        
        // التحقق من الاصطدامات
        this.checkCollisions();
        
        // تحديث الجسيمات
        this.updateParticles(deltaTime);
        
        // زيادة الصعوبة
        this.updateDifficulty();
    }
    
    updateHelixRotation(deltaTime) {
        // تطبيق السرعة الأساسية
        this.helixRotation += this.rotationSpeed * (deltaTime / 16.67);
        
        // تطبيق السرعة من السحب
        this.helixRotation += this.rotationVelocity;
        
        // تخفيف السرعة تدريجياً
        this.rotationVelocity *= 0.92;
        
        // الحفاظ على الدوران ضمن النطاق
        if (this.helixRotation > Math.PI * 2) this.helixRotation -= Math.PI * 2;
        if (this.helixRotation < 0) this.helixRotation += Math.PI * 2;
    }
    
    updateCharacter(deltaTime) {
        // تحديث النط
        if (this.isJumping) {
            this.character.velocityY = -GameConfig.CHARACTER.JUMP_HEIGHT;
            this.isJumping = false;
        }
        
        // تطبيق الجاذبية
        this.character.velocityY += GameConfig.CHARACTER.FALL_SPEED * (deltaTime / 16.67);
        this.character.y += this.character.velocityY;
        
        // تحديث الدوران
        this.character.rotation += GameConfig.CHARACTER.ROTATION_SPEED * (deltaTime / 16.67);
        
        // التأثيرات البصرية
        if (this.character.velocityY < 0) {
            this.character.scale = 1 + Math.abs(this.character.velocityY) / 200;
            this.currentCharacterImage = this.characterImages.jump;
        } else if (this.character.velocityY > 5) {
            this.character.scale = 1 - Math.min(0.2, this.character.velocityY / 100);
            this.currentCharacterImage = this.characterImages.fall;
        } else {
            this.character.scale = 1;
            this.currentCharacterImage = this.characterImages.default;
        }
        
        // تحديد المنصة الحالية
        this.updateCurrentPlatform();
    }
    
    updateCurrentPlatform() {
        let closestPlatform = null;
        let minDistance = Infinity;
        
        for (const platform of this.platforms) {
            if (!platform.isActive || platform.hasGap) continue;
            
            const distance = Math.abs(platform.y - this.character.y);
            if (distance < minDistance && distance < 100) {
                // التحقق من المحاذاة الزاوية
                const characterAngle = this.getCharacterAngle();
                let angleDiff = Math.abs(platform.angle - characterAngle);
                angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                
                if (angleDiff < 0.3) {
                    minDistance = distance;
                    closestPlatform = platform;
                }
            }
        }
        
        if (closestPlatform && !closestPlatform.isPassed) {
            if (this.character.currentPlatform !== closestPlatform) {
                this.onPlatformPassed(closestPlatform);
            }
            this.character.currentPlatform = closestPlatform;
        }
    }
    
    getCharacterAngle() {
        const centerX = this.canvas.width / 2;
        const dx = this.character.x - centerX;
        const helixRadius = GameConfig.HELIX.RADIUS;
        let angle = Math.atan2(dx, helixRadius) + this.helixRotation;
        if (angle < 0) angle += Math.PI * 2;
        if (angle > Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }
    
    onPlatformPassed(platform) {
        platform.isPassed = true;
        this.stats.platformsPassed++;
        
        // إضافة النقاط
        this.addScore(10);
        
        // زيادة الكومبو
        this.combo++;
        this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
        
        // عرض الكومبو
        if (this.combo > 3) {
            this.showCombo(this.combo);
        }
        
        // تجديد نطة كل 5 منصات
        if (this.stats.platformsPassed % 5 === 0 && this.jumpsRemaining < this.maxJumps) {
            this.jumpsRemaining++;
            this.updateJumpsUI();
        }
        
        // زيادة السرعة كل 10 منصات
        if (this.stats.platformsPassed % 10 === 0) {
            this.platformSpeed += 0.1;
            this.rotationSpeed += 0.001;
        }
    }
    
    updatePlatforms(deltaTime) {
        const speed = this.platformSpeed * (deltaTime / 16.67);
        
        this.platforms.forEach(platform => {
            platform.y -= speed;
            
            // إعادة تدوير المنصة عندما تخرج من الأسفل
            if (platform.y < -200) {
                this.recyclePlatform(platform);
            }
        });
        
        // تحديث الفخاخ والعملات
        this.updateTraps(deltaTime);
        this.updateCoins(deltaTime);
    }
    
    recyclePlatform(platform) {
        // نقل المنصة للأعلى
        const highestY = Math.max(...this.platforms.map(p => p.y));
        platform.y = highestY + GameConfig.PLATFORM_SPACING;
        platform.isPassed = false;
        
        // تحديث الفجوة
        platform.hasGap = Math.random() < this.gapChance;
        
        if (platform.hasGap) {
            platform.gapWidth = GameConfig.GAP_WIDTH_MIN + 
                Math.random() * (GameConfig.GAP_WIDTH_MAX - GameConfig.GAP_WIDTH_MIN);
            platform.gapPos = Math.random() * (GameConfig.HELIX.PLATFORM_WIDTH - platform.gapWidth);
        }
        
        // تحديث الزاوية (تناوب الأعمدة)
        platform.column = (platform.column + 1) % GameConfig.HELIX.COLUMNS;
        platform.angle = (platform.column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
        platform.color = GameConfig.COLORS.PLATFORM[platform.column % GameConfig.COLORS.PLATFORM.length];
        
        // تحديث العناصر
        this.updatePlatformElements(platform);
    }
    
    updatePlatformElements(platform) {
        // إزالة العناصر القديمة
        this.traps = this.traps.filter(t => t.platformId !== platform.id);
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        
        // إضافة فخ جديد
        if (Math.random() < this.trapChance) {
            this.traps.push({
                id: this.traps.length,
                platformId: platform.id,
                angle: platform.angle,
                type: 'spike',
                active: true,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // إضافة عملة جديدة
        if (Math.random() < 0.4) {
            this.coins.push({
                id: this.coins.length,
                platformId: platform.id,
                angle: platform.angle + (Math.random() * 0.5 - 0.25),
                collected: false,
                value: 10,
                rotation: 0,
                scale: 1
            });
        }
    }
    
    updateTraps(deltaTime) {
        this.traps.forEach(trap => {
            trap.rotation += 0.05 * (deltaTime / 16.67);
        });
    }
    
    updateCoins(deltaTime) {
        this.coins.forEach(coin => {
            coin.rotation += 0.03 * (deltaTime / 16.67);
            coin.scale = 1 + Math.sin(this.time * 3) * 0.2;
        });
    }
    
    // ===== التحقق من الاصطدامات =====
    checkCollisions() {
        // التحقق من الفجوات
        this.checkGapCollision();
        
        // التحقق من الفخاخ
        this.checkTrapCollision();
        
        // التحقق من العملات
        this.checkCoinCollision();
        
        // التحقق من السقوط
        this.checkFall();
    }
    
    checkGapCollision() {
        if (!this.character.currentPlatform || !this.character.currentPlatform.hasGap) return;
        
        const platform = this.character.currentPlatform;
        const characterAngle = this.getCharacterAngle();
        
        // حساب حدود الفجوة
        let angleDiff = Math.abs(platform.angle - characterAngle);
        angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        
        if (angleDiff < 0.2) { // الشخصية فوق الفجوة
            this.fallIntoGap();
        }
    }
    
    checkTrapCollision() {
        const characterAngle = this.getCharacterAngle();
        const characterY = this.character.y;
        
        for (const trap of this.traps) {
            if (!trap.active) continue;
            
            const platform = this.platforms.find(p => p.id === trap.platformId);
            if (!platform) continue;
            
            // التحقق من المسافة العمودية
            if (Math.abs(platform.y - characterY) < 50) {
                // التحقق من الزاوية
                let angleDiff = Math.abs(trap.angle - characterAngle);
                angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                
                if (angleDiff < 0.15) {
                    this.hitTrap(trap);
                }
            }
        }
    }
    
    checkCoinCollision() {
        const characterAngle = this.getCharacterAngle();
        const characterY = this.character.y;
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (!platform) continue;
            
            // التحقق من المسافة العمودية
            if (Math.abs(platform.y - characterY) < 60) {
                // التحقق من الزاوية
                let angleDiff = Math.abs(coin.angle - characterAngle);
                angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                
                if (angleDiff < 0.15) {
                    this.collectCoin(coin);
                }
            }
        }
    }
    
    checkFall() {
        // السقوط إذا كان تحت الشاشة
        if (this.character.y > this.canvas.height + 100) {
            this.endGame();
        }
    }
    
    // ===== الأحداث =====
    fallIntoGap() {
        console.log('💀 سقوط في الفجوة!');
        this.createParticles(
            this.character.x,
            this.character.y,
            GameConfig.PARTICLES.FALL
        );
        this.endGame();
    }
    
    hitTrap(trap) {
        console.log('⚠️ اصطدام بفخ!');
        trap.active = false;
        this.stats.trapsAvoided++;
        
        // خسارة نقاط
        this.addScore(-20);
        this.combo = 0;
        
        // اهتزاز الشاشة
        this.shakeScreen();
        
        // جسيمات
        this.createParticles(
            this.character.x,
            this.character.y,
            GameConfig.PARTICLES.FALL
        );
    }
    
    collectCoin(coin) {
        console.log('💰 جمع عملة!');
        coin.collected = true;
        this.stats.coinsCollected++;
        this.totalCoins += coin.value;
        
        // إضافة النقاط مع مكافأة الكومبو
        const bonus = Math.floor(coin.value * (1 + this.combo * 0.1));
        this.addScore(bonus);
        
        // جسيمات
        this.createParticles(
            this.character.x,
            this.character.y,
            GameConfig.PARTICLES.COIN
        );
        
        // حفظ العملات
        localStorage.setItem('totalCoins', this.totalCoins);
        
        // صوت العملة
        if (this.soundEnabled) {
            this.playSound('coin');
        }
    }
    
    // ===== النظام البصري =====
    createParticles(x, y, config) {
        for (let i = 0; i < config.COUNT; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
                size: config.SIZE + Math.random() * 4,
                color: config.COLOR,
                life: 1,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // ===== الرسم =====
    draw() {
        if (!this.ctx) return;
        
        // مسح الشاشة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم الأسطوانة
        this.drawHelix();
        
        // رسم المنصات
        this.drawPlatforms();
        
        // رسم الفخاخ
        this.drawTraps();
        
        // رسم العملات
        this.drawCoins();
        
        // رسم الجسيمات
        this.drawParticles();
        
        // رسم الشخصية
        this.drawCharacter();
        
        // رسم الواجهة
        this.drawUI();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, GameConfig.COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND.BOTTOM);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // نجوم خلفية
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 23) % this.canvas.height;
            const size = (Math.sin(this.time + i) + 1) * 0.5 + 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        const columns = GameConfig.HELIX.COLUMNS;
        
        // العمود المركزي
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(centerX - 10, 0, 20, this.canvas.height);
        
        // الخطوط الحلزونية
        for (let i = 0; i < columns; i++) {
            const angle = (i * Math.PI * 2) / columns + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 20;
            const x2 = centerX + Math.cos(angle) * helixRadius;
            
            // تدرج اللون
            const gradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            gradient.addColorStop(0, `rgba(33, 150, 243, ${0.3 + Math.sin(this.time + i) * 0.2})`);
            gradient.addColorStop(1, `rgba(33, 150, 243, ${0.1 + Math.sin(this.time + i) * 0.1})`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // الحلقة الخارجية
        this.ctx.strokeStyle = `rgba(33, 150, 243, 0.6)`;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, helixRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // تأثيرات إضافية
        this.ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, helixRadius + 10, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 200 || platform.y < -200) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * helixRadius;
            const y = platform.y;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(-angle);
            
            // تأثير ثلاثي الأبعاد
            const depth = platform.depth;
            
            // الجانب السفلي
            this.ctx.fillStyle = this.darkenColor(platform.color, 40);
            this.ctx.fillRect(
                -platform.width / 2,
                platform.height / 2,
                platform.width,
                depth
            );
            
            // الجانب الجانبي
            this.ctx.fillStyle = this.darkenColor(platform.color, 20);
            this.ctx.fillRect(
                platform.width / 2,
                -platform.height / 2,
                depth,
                platform.height + depth
            );
            
            // السطح العلوي
            if (platform.hasGap) {
                // الجزء الأيسر
                this.ctx.fillStyle = platform.color;
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
                this.ctx.fillStyle = GameConfig.COLORS.GAP;
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos,
                    -platform.height / 2,
                    platform.gapWidth,
                    platform.height
                );
                
                // تأثير الفجوة
                const gapGradient = this.ctx.createLinearGradient(
                    -platform.width / 2 + platform.gapPos,
                    0,
                    -platform.width / 2 + platform.gapPos + platform.gapWidth,
                    0
                );
                gapGradient.addColorStop(0, 'rgba(255, 82, 82, 0.8)');
                gapGradient.addColorStop(0.5, 'rgba(255, 82, 82, 1)');
                gapGradient.addColorStop(1, 'rgba(255, 82, 82, 0.8)');
                
                this.ctx.fillStyle = gapGradient;
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos,
                    -platform.height / 2,
                    platform.gapWidth,
                    platform.height
                );
            } else {
                // منصة كاملة
                this.ctx.fillStyle = platform.color;
                this.ctx.fillRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.width,
                    platform.height
                );
                
                // تأثير التوهج للمنصات الصلبة
                if (platform === this.character.currentPlatform) {
                    this.ctx.shadowColor = platform.color;
                    this.ctx.shadowBlur = 15;
                    this.ctx.fillRect(
                        -platform.width / 2,
                        -platform.height / 2,
                        platform.width,
                        platform.height
                    );
                    this.ctx.shadowBlur = 0;
                }
            }
            
            // الحواف
            this.ctx.strokeStyle = GameConfig.COLORS.PLATFORM_EDGE;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.width,
                platform.height
            );
            
            // تأثيرات إضافية
            if (platform.isPassed) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.width,
                    3
                );
            }
            
            this.ctx.restore();
        });
    }
    
    drawTraps() {
        const centerX = this.canvas.width / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        this.traps.forEach(trap => {
            if (!trap.active) return;
            
            const platform = this.platforms.find(p => p.id === trap.platformId);
            if (!platform) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (helixRadius - 30);
            const y = platform.y - 25;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(trap.rotation);
            
            // رسم الفخ
            this.ctx.fillStyle = GameConfig.COLORS.TRAP;
            this.ctx.beginPath();
            
            // شكل شوكة ثلاثية
            for (let i = 0; i < 3; i++) {
                const spikeAngle = (i * Math.PI * 2) / 3;
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(
                    Math.cos(spikeAngle) * 20,
                    Math.sin(spikeAngle) * 20
                );
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // تأثير التوهج
            this.ctx.shadowColor = GameConfig.COLORS.TRAP;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (!platform) return;
            
            const angle = coin.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (helixRadius + 25);
            const y = platform.y - 40;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(coin.rotation);
            this.ctx.scale(coin.scale, coin.scale);
            
            // رسم العملة
            this.ctx.fillStyle = GameConfig.COLORS.COIN;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // تأثير التوهج
            this.ctx.shadowColor = GameConfig.COLORS.COIN;
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // تفاصيل العملة
            this.ctx.fillStyle = '#B8860B';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('$', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawCharacter() {
        this.ctx.save();
        
        // موقع الشخصية مع التأثيرات
        const x = this.character.x;
        const y = this.character.y;
        const size = this.character.size * this.character.scale;
        
        this.ctx.translate(x, y);
        this.ctx.rotate(this.character.rotation);
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, size * 0.6, size * 0.7, size * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // استخدام الصورة إذا كانت متاحة
        if (this.currentCharacterImage.complete && this.currentCharacterImage.naturalWidth > 0) {
            this.ctx.drawImage(
                this.currentCharacterImage,
                -size / 2,
                -size / 2,
                size,
                size
            );
        } else {
            // رسم دائرة احتياطية
            this.ctx.fillStyle = this.character.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // تأثير التحديد
        if (this.character.currentPlatform) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size / 2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawUI() {
        // عرض الكومبو
        if (this.combo > 3) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Cairo';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`x${this.combo} كومبو!`, this.canvas.width / 2, 40);
        }
        
        // عرض السرعة
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Cairo';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`السرعة: ${this.platformSpeed.toFixed(1)}`, 10, 30);
        
        // عرض الدوران
        const rotationDeg = Math.round((this.helixRotation * 180 / Math.PI) % 360);
        this.ctx.fillText(`الدوران: ${rotationDeg}°`, 10, 55);
    }
    
    // ===== أدوات مساعدة =====
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
    
    resizeCanvas() {
        try {
            const container = document.querySelector('.game-area');
            if (!container || !this.canvas) return;
            
            const rect = container.getBoundingClientRect();
            this.canvas.width = Math.min(500, rect.width);
            this.canvas.height = Math.min(700, rect.height);
            
            // تحديث موقع الشخصية
            this.character.x = this.canvas.width / 2;
            this.character.y = this.canvas.height * 0.75;
        } catch (error) {
            console.error('❌ خطأ في تغيير حجم الكانفاس:', error);
        }
    }
    
    // ===== إدارة النقاط =====
    addScore(points) {
        const oldScore = this.score;
        this.score += points;
        if (this.score < 0) this.score = 0;
        
        // تحديث المستوى
        const newLevel = Math.floor(this.score / 500) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.onLevelUp();
        }
        
        // تحديث واجهة المستخدم
        this.updateUI();
        
        // حفظ أعلى نتيجة
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
    }
    
    onLevelUp() {
        console.log(`🎉 مستوى جديد: ${this.level}`);
        
        // تأثيرات بصرية
        this.createParticles(
            this.canvas.width / 2,
            this.canvas.height / 2,
            { COUNT: 30, COLOR: '#FFD700', SIZE: 8 }
        );
        
        // عرض رسالة المستوى
        this.showCombo(`المستوى ${this.level}!`);
    }
    
    updateUI() {
        if (this.scoreElement) this.scoreElement.textContent = this.score;
        if (this.levelElement) this.levelElement.textContent = this.level;
        if (this.jumpsCountElement) this.jumpsCountElement.textContent = this.jumpsRemaining;
    }
    
    updateJumpsUI() {
        if (this.jumpsCountElement) {
            this.jumpsCountElement.textContent = this.jumpsRemaining;
            this.jumpsCountElement.classList.add('glow-effect');
            setTimeout(() => {
                this.jumpsCountElement.classList.remove('glow-effect');
            }, 1000);
        }
    }
    
    // ===== النط =====
    jump() {
        const now = Date.now();
        if (now - this.lastJumpTime < this.jumpCooldown) return;
        if (this.jumpsRemaining <= 0) return;
        
        this.isJumping = true;
        this.jumpsRemaining--;
        this.stats.jumpsMade++;
        this.lastJumpTime = now;
        
        // جسيمات النط
        this.createParticles(
            this.character.x,
            this.character.y,
            GameConfig.PARTICLES.JUMP
        );
        
        // تحديث الواجهة
        this.updateJumpsUI();
        
        // صوت النط
        if (this.soundEnabled) {
            this.playSound('jump');
        }
    }
    
    // ===== تحديث الصعوبة =====
    updateDifficulty() {
        const newSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED + 
                        (this.level - 1) * 0.1;
        this.platformSpeed = Math.min(newSpeed, 5);
        
        const newRotation = GameConfig.DIFFICULTY[this.difficulty].ROTATION_SPEED + 
                          (this.level - 1) * 0.001;
        this.rotationSpeed = Math.min(newRotation, 0.05);
    }
    
    // ===== الأحداث =====
    initEventListeners() {
        // تدوير بالسحب
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastTouchX = e.clientX;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.gameActive || this.isPaused) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotationVelocity = deltaX * this.dragSensitivity;
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // تدوير باللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || !this.gameActive || this.isPaused) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotationVelocity = deltaX * this.dragSensitivity;
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive || this.isPaused) return;
            
            switch(e.key) {
                case ' ':
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.jump();
                    break;
                case 'ArrowLeft':
                    this.rotationVelocity = -0.05;
                    break;
                case 'ArrowRight':
                    this.rotationVelocity = 0.05;
                    break;
                case 'r':
                case 'R':
                    this.restartGame();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case 'Escape':
                    this.showStats();
                    break;
            }
        });
        
        // أزرار التحكم
        document.getElementById('jumpBtn').addEventListener('click', () => this.jump());
        document.getElementById('leftBtn').addEventListener('click', () => this.rotationVelocity = -0.05);
        document.getElementById('rightBtn').addEventListener('click', () => this.rotationVelocity = 0.05);
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        // شاشة البداية
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
    }
    
    // ===== التحكم في اللعبة =====
    startGame() {
        this.gameActive = true;
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        this.gameStartTime = Date.now();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.innerHTML = this.isPaused ? 
            '<i class="fas fa-play"></i>' : 
            '<i class="fas fa-pause"></i>';
    }
    
    showStats() {
        this.isPaused = true;
        const statsScreen = document.getElementById('statsScreen');
        const statsContainer = document.getElementById('advancedStats');
        
        statsContainer.innerHTML = `
            <div class="advanced-stat">
                <div class="advanced-stat-value">${this.stats.platformsPassed}</div>
                <div class="advanced-stat-label">منصة تم تجاوزها</div>
            </div>
            <div class="advanced-stat">
                <div class="advanced-stat-value">${this.stats.coinsCollected}</div>
                <div class="advanced-stat-label">عملة مجمعة</div>
            </div>
            <div class="advanced-stat">
                <div class="advanced-stat-value">${this.stats.trapsAvoided}</div>
                <div class="advanced-stat-label">فخ تم تجنبه</div>
            </div>
            <div class="advanced-stat">
                <div class="advanced-stat-value">${this.stats.jumpsMade}</div>
                <div class="advanced-stat-label">نطة</div>
            </div>
            <div class="advanced-stat">
                <div class="advanced-stat-value">${Math.floor(this.stats.playTime)}s</div>
                <div class="advanced-stat-label">وقت اللعب</div>
            </div>
            <div class="advanced-stat">
                <div class="advanced-stat-value">${this.stats.bestCombo}</div>
                <div class="advanced-stat-label">أفضل كومبو</div>
            </div>
        `;
        
        statsScreen.style.display = 'flex';
    }
    
    restartGame() {
        this.initGameState();
        this.createInitialPlatforms();
        this.updateUI();
        
        // إخفاء الشاشات
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('statsScreen').style.display = 'none';
        
        this.gameActive = true;
        this.isPaused = false;
    }
    
    endGame() {
        this.gameActive = false;
        
        // حساب النتائج النهائية
        const totalScore = this.score;
        const coinsEarned = this.stats.coinsCollected * 10;
        const timeBonus = Math.floor(this.stats.playTime) * 5;
        const finalScore = totalScore + coinsEarned + timeBonus;
        
        // تحديث أعلى نتيجة
        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            localStorage.setItem('helixHighScore', this.highScore);
        }
        
        // عرض شاشة نهاية اللعبة
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalStats = document.getElementById('finalStats');
        const achievementBadge = document.getElementById('achievementBadge');
        
        // تحديد الإنجاز
        let achievement = '';
        if (finalScore >= 5000) {
            achievement = '🏆 بطل الأسطوانة!';
        } else if (finalScore >= 2000) {
            achievement = '🥈 لاعب محترف';
        } else if (finalScore >= 1000) {
            achievement = '🥉 لاعب متمرس';
        } else {
            achievement = '🎮 لاعب مبتدئ';
        }
        
        finalStats.innerHTML = `
            <div class="final-stat">
                <div class="final-label">
                    <i class="fas fa-star"></i>
                    النقاط الأساسية
                </div>
                <div class="final-value">${totalScore}</div>
            </div>
            <div class="final-stat">
                <div class="final-label">
                    <i class="fas fa-coins"></i>
                    مكافأة العملات
                </div>
                <div class="final-value">+${coinsEarned}</div>
            </div>
            <div class="final-stat">
                <div class="final-label">
                    <i class="fas fa-clock"></i>
                    مكافأة الوقت
                </div>
                <div class="final-value">+${timeBonus}</div>
            </div>
            <div class="final-stat">
                <div class="final-label">
                    <i class="fas fa-trophy"></i>
                    النتيجة النهائية
                </div>
                <div class="final-value">${finalScore}</div>
            </div>
        `;
        
        achievementBadge.innerHTML = achievement;
        achievementBadge.style.display = 'block';
        
        gameOverScreen.style.display = 'flex';
        
        // إضافة مستمعات الأزرار
        document.getElementById('gameOverRestartBtn').onclick = () => this.restartGame();
        document.getElementById('shareBtn').onclick = () => this.shareScore(finalScore);
    }
    
    // ===== أدوات مساعدة =====
    showCombo(text) {
        this.comboDisplay.textContent = text;
        this.comboDisplay.style.display = 'block';
        this.comboDisplay.classList.add('combo-effect');
        
        setTimeout(() => {
            this.comboDisplay.style.display = 'none';
            this.comboDisplay.classList.remove('combo-effect');
        }, 1500);
    }
    
    shakeScreen() {
        this.canvas.classList.add('shake-effect');
        setTimeout(() => {
            this.canvas.classList.remove('shake-effect');
        }, 500);
    }
    
    playSound(type) {
        // تنفيذ بسيط للصوت
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch(type) {
                case 'jump':
                    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                    break;
                case 'coin':
                    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('⚠️ الصوت غير مدعوم في هذا المتصفح');
        }
    }
    
    shareScore(score) {
        const text = `🏆 حصلت على ${score} نقطة في لعبة مهندس الأسطوانة! جربها الآن!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'مهندس الأسطوانة',
                text: text,
                url: window.location.href
            });
        } else {
            // نسخ إلى الحافظة
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ تم نسخ النتيجة إلى الحافظة!');
            });
        }
    }
    
    setupShop() {
        const shopItems = [
            { id: 1, name: 'نطة إضافية', price: 100, icon: '🦘' },
            { id: 2, name: 'درع الحماية', price: 200, icon: '🛡️' },
            { id: 3, name: 'مغناطيس العملات', price: 300, icon: '🧲' },
            { id: 4, name: 'شخصية خاصة', price: 500, icon: '👨‍💻' },
            { id: 5, name: 'تسريع اللعبة', price: 400, icon: '⚡' },
            { id: 6, name: 'تجميد الفخاخ', price: 600, icon: '❄️' }
        ];
        
        const shopContainer = document.getElementById('shopItems');
        shopContainer.innerHTML = shopItems.map(item => `
            <div class="shop-item ${this.totalCoins >= item.price ? '' : 'locked'}" 
                 data-id="${item.id}" 
                 data-price="${item.price}">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">
                    <i class="fas fa-coins"></i>
                    ${item.price}
                </div>
            </div>
        `).join('');
        
        // إضافة مستمعات الأحداث
        document.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const price = parseInt(e.currentTarget.dataset.price);
                
                if (this.totalCoins >= price) {
                    this.buyItem(id, price);
                } else {
                    alert('❌ ليس لديك عملات كافية!');
                }
            });
        });
    }
    
    buyItem(id, price) {
        this.totalCoins -= price;
        localStorage.setItem('totalCoins', this.totalCoins);
        
        switch(id) {
            case 1: // نطة إضافية
                this.maxJumps++;
                this.jumpsRemaining = this.maxJumps;
                this.updateJumpsUI();
                break;
            case 2: // درع الحماية
                // تنفيذ الدرع
                break;
            case 3: // مغناطيس العملات
                // تنفيذ المغناطيس
                break;
        }
        
        alert(`✅ تم شراء العنصر بنجاح!`);
        this.setupShop(); // تحديث المتجر
    }
    
    showError(message) {
        console.error('❌ ' + message);
        alert('❌ حدث خطأ: ' + message);
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        this.updatePhysics(deltaTime);
        this.draw();
        
        this.lastFrameTime = currentTime;
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== بدء اللعبة =====
window.addEventListener('load', () => {
    console.log('🚀 تحميل اللعبة...');
    
    // إخفاء شاشة التحميل بعد 2 ثانية
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // إظهار شاشة البداية
        document.getElementById('startScreen').style.display = 'flex';
        
        // تهيئة اللعبة
        try {
            const game = new UltimateHelixJump();
            window.game = game; // لجعل اللعبة متاحة من وحدة التحكم
            console.log('✅ اللعبة جاهزة! استمتع!');
        } catch (error) {
            console.error('❌ خطأ في بدء اللعبة:', error);
            alert('حدث خطأ في تحميل اللعبة. يرجى تحديث الصفحة.');
        }
    }, 2000);
});

// ===== وظائف إضافية للتحكم من وحدة التحكم =====
window.cheats = {
    addCoins: (amount) => {
        if (window.game) {
            window.game.totalCoins += amount;
            localStorage.setItem('totalCoins', window.game.totalCoins);
            window.game.setupShop();
            console.log(`💰 تمت إضافة ${amount} عملة`);
        }
    },
    addScore: (amount) => {
        if (window.game) {
            window.game.addScore(amount);
            console.log(`🎯 تمت إضافة ${amount} نقطة`);
        }
    },
    unlockAll: () => {
        if (window.game) {
            window.game.maxJumps = 10;
            window.game.jumpsRemaining = 10;
            window.game.updateJumpsUI();
            console.log('🔓 تم فتح كل القدرات');
        }
    }
};
