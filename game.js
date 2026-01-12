// ===== إعدادات اللعبة البسيطة =====
const GameConfig = {
    VERSION: "1.0 - النسخة المستقرة",
    
    // إعدادات المنصة
    PLATFORM_SPACING: 120,
    PLATFORM_HEIGHT: 25,
    GAP_WIDTH_MIN: 40,
    GAP_WIDTH_MAX: 60,
    
    // إعدادات الشخصية
    CHARACTER: {
        SIZE: 50,
        JUMP_FORCE: -15,
        GRAVITY: 0.8,
        MOVE_SPEED: 5
    },
    
    // الألوان
    COLORS: {
        PLATFORM: '#4CAF50',
        PLATFORM_GAP: '#FF5252',
        PLATFORM_EDGE: '#2E7D32',
        COIN: '#FFD700',
        BACKGROUND: ['#0D47A1', '#1976D2'],
        CHARACTER: '#FF4081',
        HELIX: 'rgba(33, 150, 243, 0.6)'
    },
    
    // الصعوبة
    DIFFICULTY: {
        EASY: { SPEED: 1.5, GAP_CHANCE: 0.2 },
        NORMAL: { SPEED: 2.0, GAP_CHANCE: 0.3 },
        HARD: { SPEED: 2.5, GAP_CHANCE: 0.4 }
    },
    
    // الأسطوانة
    HELIX: {
        RADIUS: 180,
        COLUMNS: 8,
        PLATFORM_WIDTH: 120
    }
};

// ===== فئة اللعبة - النسخة المصححة =====
class HelixGame {
    constructor() {
        console.log('🎮 بدء اللعبة...');
        
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
        this.jumps = 3;
        this.level = 1;
        
        // الحصول على الصعوبة
        const difficultySelect = document.getElementById('difficultySelect');
        this.difficulty = difficultySelect ? difficultySelect.value : 'EASY';
        this.gameSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.gapChance = GameConfig.DIFFICULTY[this.difficulty].GAP_CHANCE;
        
        // تهيئة الشخصية
        this.initCharacter();
        
        // تهيئة المنصات
        this.platforms = [];
        this.coins = [];
        this.particles = [];
        
        // الأسطوانة
        this.helixRotation = 0;
        this.rotationSpeed = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        
        // الأحداث
        this.initEventListeners();
        
        // تحديث الواجهة
        this.updateUI();
    }
    
    // ===== تهيئة الشخصية =====
    initCharacter() {
        this.character = {
            x: 0, // سيتم ضبطه بعد resizeCanvas
            y: 0, // سيتم ضبطه بعد إنشاء المنصات
            size: GameConfig.CHARACTER.SIZE,
            color: GameConfig.COLORS.CHARACTER,
            velocityY: 0,
            isJumping: false,
            isOnPlatform: true,
            currentPlatform: null,
            rotation: 0
        };
    }
    
    // ===== تغيير حجم الكانفاس =====
    resizeCanvas() {
        const container = document.querySelector('.game-area');
        if (!container || !this.canvas) return;
        
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // ضبط موقع الشخصية في المنتصف
        if (this.character) {
            this.character.x = this.canvas.width / 2;
        }
    }
    
    // ===== إنشاء المنصات الأولية =====
    createPlatforms() {
        this.platforms = [];
        this.coins = [];
        
        const platformCount = 25;
        
        for (let i = 0; i < platformCount; i++) {
            const y = 100 + i * GameConfig.PLATFORM_SPACING;
            const column = i % GameConfig.HELIX.COLUMNS;
            const angle = (column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
            
            // المنصات الـ 5 الأولى بدون فجوات للتسهيل
            const hasGap = i > 4 && Math.random() < this.gapChance;
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
                isPassed: false
            };
            
            this.platforms.push(platform);
            
            // إضافة عملات (30% فرصة)
            if (i > 2 && Math.random() < 0.3 && !hasGap) {
                this.coins.push({
                    platformId: i,
                    angle: angle,
                    collected: false,
                    value: 10,
                    y: y - 40
                });
            }
        }
        
        // ضبط الشخصية على المنصة الأولى
        if (this.platforms.length > 0) {
            this.character.currentPlatform = this.platforms[0];
            this.character.y = this.platforms[0].y - 60;
            this.character.x = this.canvas.width / 2;
            this.character.isOnPlatform = true;
            this.character.velocityY = 0;
        }
        
        console.log(`✅ تم إنشاء ${platformCount} منصة`);
    }
    
    // ===== الأحداث =====
    initEventListeners() {
        // السحب لتدوير الأسطوانة
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('mouseleave', () => this.endDrag());
        
        // اللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.drag(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endDrag());
        
        // النط
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
                e.preventDefault();
                this.jump();
            }
            
            if (e.key === 'r' || e.key === 'R') {
                this.restartGame();
            }
        });
        
        // أزرار التحكم
        document.getElementById('jumpBtn').addEventListener('click', () => this.jump());
        document.getElementById('leftBtn').addEventListener('click', () => this.rotationSpeed = -0.03);
        document.getElementById('rightBtn').addEventListener('click', () => this.rotationSpeed = 0.03);
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
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
        
        // تطبيق سرعة الدوران
        this.rotationSpeed = deltaX * 0.02;
        this.lastMouseX = currentX;
    }
    
    endDrag() {
        this.isDragging = false;
        // تخفيف السرعة تدريجياً
        this.rotationSpeed *= 0.9;
    }
    
    // ===== تحديث اللعبة =====
    update(deltaTime) {
        if (!this.gameActive) return;
        
        // تحديث الدوران
        this.updateRotation();
        
        // تحديث الشخصية
        this.updateCharacter(deltaTime);
        
        // تحديث المنصات
        this.updatePlatforms(deltaTime);
        
        // التحقق من الاصطدامات
        this.checkCollisions();
        
        // تحديث الجسيمات
        this.updateParticles(deltaTime);
    }
    
    updateRotation() {
        this.helixRotation += this.rotationSpeed;
        
        // الحفاظ على النطاق
        if (this.helixRotation > Math.PI * 2) this.helixRotation -= Math.PI * 2;
        if (this.helixRotation < 0) this.helixRotation += Math.PI * 2;
        
        // تخفيف السرعة
        this.rotationSpeed *= 0.95;
    }
    
    updateCharacter(deltaTime) {
        // تطبيق الجاذبية
        this.character.velocityY += GameConfig.CHARACTER.GRAVITY;
        this.character.y += this.character.velocityY;
        
        // تحديث الدوران
        this.character.rotation += 0.1;
        
        // البحث عن المنصة الحالية
        this.findCurrentPlatform();
        
        // التحقق من السقوط خارج الشاشة
        if (this.character.y > this.canvas.height + 100) {
            this.endGame();
        }
    }
    
    findCurrentPlatform() {
        let closestPlatform = null;
        let minDistance = Infinity;
        const centerX = this.canvas.width / 2;
        
        for (const platform of this.platforms) {
            if (!platform.isActive) continue;
            
            // المسافة العمودية
            const verticalDistance = platform.y - this.character.y;
            
            // إذا كانت الشخصية قريبة من المنصة (فوقها أو تحتها قليلاً)
            if (verticalDistance >= -20 && verticalDistance < 100) {
                // حساب موقع المنصة على الشاشة
                const platformAngle = platform.angle + this.helixRotation;
                const platformX = centerX + Math.cos(platformAngle) * GameConfig.HELIX.RADIUS;
                
                // المسافة الأفقية
                const horizontalDistance = Math.abs(this.character.x - platformX);
                
                // إذا كانت داخل عرض المنصة
                if (horizontalDistance < platform.width / 2 + 10) {
                    // التحقق من الفجوة
                    if (!this.isOverGap(platform, platformX)) {
                        if (verticalDistance < minDistance && verticalDistance >= -10) {
                            minDistance = verticalDistance;
                            closestPlatform = platform;
                        }
                    }
                }
            }
        }
        
        if (closestPlatform) {
            // الهبوط على المنصة
            if (this.character.velocityY > 0 && !this.character.isOnPlatform) {
                // ضبط الارتفاع فوق المنصة
                this.character.y = closestPlatform.y - 60;
                this.character.velocityY = 0;
                this.character.isOnPlatform = true;
                
                // حدث عبور المنصة
                if (this.character.currentPlatform !== closestPlatform) {
                    this.onPlatformPassed(closestPlatform);
                }
            }
            
            this.character.currentPlatform = closestPlatform;
            this.character.isOnPlatform = true;
        } else {
            // الشخصية ليست على منصة
            this.character.isOnPlatform = false;
            this.character.currentPlatform = null;
        }
    }
    
    isOverGap(platform, platformX) {
        if (!platform.hasGap) return false;
        
        // حساب موقع الفجوة على الشاشة
        const gapStart = platformX - (platform.width / 2) + platform.gapPos;
        const gapEnd = gapStart + platform.gapWidth;
        
        // إذا كانت الشخصية فوق الفجوة
        return this.character.x >= gapStart && this.character.x <= gapEnd;
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
        
        // تحديث موقع العملات
        this.coins.forEach(coin => {
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (platform) {
                coin.y = platform.y - 40;
            }
        });
    }
    
    recyclePlatform(platform) {
        // العثور على أدنى منصة ونقل هذه المنصة أسفلها
        const lowestY = Math.min(...this.platforms.map(p => p.y));
        platform.y = lowestY + GameConfig.PLATFORM_SPACING;
        platform.isPassed = false;
        
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
        
        // إضافة عملة جديدة (40% فرصة إذا لم يكن هناك فجوة)
        if (!platform.hasGap && Math.random() < 0.4) {
            this.coins.push({
                platformId: platform.id,
                angle: platform.angle,
                collected: false,
                value: 10,
                y: platform.y - 40
            });
        }
    }
    
    checkCollisions() {
        // التحقق من العملات
        this.checkCoinCollision();
        
        // التحقق من الفجوات (فقط إذا كانت الشخصية على منصة)
        if (this.character.isOnPlatform && this.character.currentPlatform) {
            const centerX = this.canvas.width / 2;
            const platform = this.character.currentPlatform;
            const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * GameConfig.HELIX.RADIUS;
            
            if (platform.hasGap && this.isOverGap(platform, platformX)) {
                this.fallIntoGap();
            }
        }
    }
    
    checkCoinCollision() {
        const centerX = this.canvas.width / 2;
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            // موقع العملة على الشاشة
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * (GameConfig.HELIX.RADIUS + 25);
            const coinY = coin.y;
            
            // حساب المسافة إلى الشخصية
            const dx = this.character.x - coinX;
            const dy = this.character.y - coinY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // إذا كانت المسافة أقل من نصف حجم الشخصية + نصف حجم العملة
            if (distance < (this.character.size / 2) + 15) {
                this.collectCoin(coin);
            }
        }
    }
    
    // ===== الأحداث =====
    jump() {
        if (!this.gameActive) return;
        if (this.jumps <= 0) return;
        if (!this.character.isOnPlatform) return;
        
        this.character.velocityY = GameConfig.CHARACTER.JUMP_FORCE;
        this.character.isOnPlatform = false;
        this.jumps--;
        this.updateJumpsUI();
        
        // جسيمات النط
        this.createParticles(this.character.x, this.character.y, 8, '#FF4081');
        
        console.log('🦘 نطة! النطات المتبقية:', this.jumps);
    }
    
    onPlatformPassed(platform) {
        if (platform.isPassed) return;
        
        platform.isPassed = true;
        this.addScore(10);
        
        // تجديد نطة كل 5 منصات
        if (this.score % 50 === 0 && this.jumps < 3) {
            this.jumps++;
            this.updateJumpsUI();
            console.log('✨ تم تجديد نطة!');
        }
        
        // زيادة المستوى كل 100 نقطة
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.gameSpeed += 0.1;
            console.log(`🎉 المستوى ${this.level}! السرعة: ${this.gameSpeed.toFixed(1)}`);
        }
    }
    
    collectCoin(coin) {
        coin.collected = true;
        this.addScore(coin.value);
        this.createParticles(this.character.x, this.character.y, 12, '#FFD700');
        console.log('💰 جمع عملة! +' + coin.value + ' نقطة');
    }
    
    fallIntoGap() {
        console.log('💀 سقوط في فجوة!');
        this.createParticles(this.character.x, this.character.y, 20, '#FF5252');
        this.endGame();
    }
    
    // ===== نظام الجسيمات =====
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: 3 + Math.random() * 4,
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
    
    // ===== الرسم =====
    draw() {
        if (!this.ctx || !this.gameActive) return;
        
        // مسح الشاشة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم الأسطوانة
        this.drawHelix();
        
        // رسم المنصات
        this.drawPlatforms();
        
        // رسم العملات
        this.drawCoins();
        
        // رسم الجسيمات
        this.drawParticles();
        
        // رسم الشخصية
        this.drawCharacter();
        
        // رسم معلومات التصحيح (اختياري)
        if (window.showDebug) {
            this.drawDebugInfo();
        }
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND[0]);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // نجوم خلفية
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 47) % this.canvas.width;
            const y = (i * 31) % this.canvas.height;
            const size = (Math.sin(Date.now() / 1000 + i) + 1) * 0.5 + 1;
            
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
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(centerX - 3, 0, 6, this.canvas.height);
        
        // الخطوط الحلزونية
        for (let i = 0; i < columns; i++) {
            const angle = (i * Math.PI * 2) / columns + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 15;
            const x2 = centerX + Math.cos(angle) * radius;
            
            const gradient = this.ctx.createLinearGradient(x1, 0, x2, this.canvas.height);
            gradient.addColorStop(0, `rgba(33, 150, 243, 0.3)`);
            gradient.addColorStop(1, `rgba(33, 150, 243, 0.1)`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // الحلقة الخارجية
        this.ctx.strokeStyle = GameConfig.COLORS.HELIX;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * GameConfig.HELIX.RADIUS;
            const y = platform.y;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // لون المنصة
            const platformColor = platform.hasGap ? '#888' : platform.color;
            
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
                
                // الفجوة
                this.ctx.fillStyle = GameConfig.COLORS.PLATFORM_GAP;
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
                gapGradient.addColorStop(0, 'rgba(255, 82, 82, 0.7)');
                gapGradient.addColorStop(0.5, 'rgba(255, 82, 82, 1)');
                gapGradient.addColorStop(1, 'rgba(255, 82, 82, 0.7)');
                
                this.ctx.fillStyle = gapGradient;
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos,
                    -platform.height / 2,
                    platform.gapWidth,
                    platform.height
                );
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
                if (platform === this.character.currentPlatform) {
                    this.ctx.shadowColor = platform.color;
                    this.ctx.shadowBlur = 20;
                    this.ctx.fillRect(
                        -platform.width / 2,
                        -platform.height / 2,
                        platform.width,
                        platform.height
                    );
                    this.ctx.shadowBlur = 0;
                }
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
            
            // توهج للأطراف
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.width,
                3
            );
            
            this.ctx.restore();
            
            // خط من المركز للمنصة (للتشخيص)
            if (window.showDebug && platform === this.character.currentPlatform) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, y);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const angle = coin.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (GameConfig.HELIX.RADIUS + 25);
            const y = coin.y;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // رسم العملة
            this.ctx.fillStyle = GameConfig.COLORS.COIN;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // توهج
            this.ctx.shadowColor = GameConfig.COLORS.COIN;
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // علامة الدولار
            this.ctx.fillStyle = '#B8860B';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('$', 0, 0);
            
            // حركة طفيفة
            const float = Math.sin(Date.now() / 200) * 3;
            this.ctx.translate(0, float);
            
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
    
    drawCharacter() {
        this.ctx.save();
        this.ctx.translate(this.character.x, this.character.y);
        
        // دوران الشخصية
        this.ctx.rotate(this.character.rotation * 0.1);
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 25, 20, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الجسم
        this.ctx.fillStyle = this.character.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.character.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // عيون
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        this.ctx.arc(8, -8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // بؤبؤ
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-6, -8, 3, 0, Math.PI * 2);
        this.ctx.arc(6, -8, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // فم
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 2, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // قبعة المهندس
        this.ctx.fillStyle = '#3F51B5';
        this.ctx.fillRect(-15, -25, 30, 5);
        this.ctx.beginPath();
        this.ctx.ellipse(0, -25, 15, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // توهج إذا كان على منصة
        if (this.character.isOnPlatform) {
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.size / 2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 130);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = [
            `النقاط: ${this.score}`,
            `النطات: ${this.jumps}`,
            `المستوى: ${this.level}`,
            `السرعة: ${this.gameSpeed.toFixed(1)}`,
            `الدوران: ${(this.helixRotation * 180 / Math.PI).toFixed(1)}°`,
            `الموقع: (${Math.round(this.character.x)}, ${Math.round(this.character.y)})`,
            `السرعة Y: ${this.character.velocityY.toFixed(1)}`,
            `على منصة: ${this.character.isOnPlatform ? 'نعم' : 'لا'}`,
            `منصة حالية: ${this.character.currentPlatform ? '#' + this.character.currentPlatform.id : 'لا شيء'}`
        ];
        
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 15, 30 + i * 14);
        });
    }
    
    // ===== واجهة المستخدم =====
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('jumpsCount').textContent = this.jumps;
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    updateJumpsUI() {
        const jumpsElement = document.getElementById('jumpsCount');
        jumpsElement.textContent = this.jumps;
        
        // تأثير عند تغيير عدد النطات
        jumpsElement.style.transform = 'scale(1.2)';
        jumpsElement.style.color = '#FF4081';
        setTimeout(() => {
            jumpsElement.style.transform = 'scale(1)';
            jumpsElement.style.color = '';
        }, 300);
    }
    
    addScore(points) {
        this.score += points;
        
        // حفظ أعلى نتيجة
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixHighScore', this.highScore);
        }
        
        this.updateUI();
    }
    
    // ===== نهاية اللعبة =====
    endGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        console.log('🛑 انتهت اللعبة! النقاط:', this.score);
        
        // حساب الإنجاز
        let achievement = '🎮 لاعب مبتدئ';
        if (this.score >= 500) achievement = '🏆 بطل الأسطوانة!';
        else if (this.score >= 200) achievement = '🥈 لاعب محترف';
        else if (this.score >= 100) achievement = '🥉 لاعب جيد';
        
        // عرض شاشة النهاية
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
        `;
        
        document.getElementById('achievementBadge').textContent = achievement;
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        // إعادة تعيين حدث إعادة التشغيل
        const restartBtn = document.getElementById('gameOverRestartBtn');
        restartBtn.onclick = () => this.restartGame();
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
        this.jumps = 3;
        this.level = 1;
        this.gameSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        
        // تحديث الواجهة
        this.updateUI();
        
        // بدء حلقة اللعبة
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('🎮 اللعبة بدأت! الصعوبة:', this.difficulty);
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
    console.log('🚀 جاهز لبدء اللعبة...');
    
    // إخفاء شاشة التحميل
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
    }, 1000);
    
    // بدء اللعبة عند النقر على زر البدء
    document.getElementById('startButton').addEventListener('click', function() {
        try {
            // إنشاء وبدء اللعبة
            window.game = new HelixGame();
            window.game.startGame();
            
            // إظهار لوحة التصحيح
            document.getElementById('debugPanel').style.display = 'block';
            
            // تحديث معلومات التصحيح
            setInterval(() => {
                if (window.game && window.game.gameActive) {
                    const state = window.game.character.isOnPlatform ? 
                        `على منصة ${window.game.character.currentPlatform ? '#' + window.game.character.currentPlatform.id : ''}` : 
                        'في الهواء';
                    
                    document.getElementById('debugState').textContent = state;
                    document.getElementById('debugPosition').textContent = 
                        `${Math.round(window.game.character.x)}, ${Math.round(window.game.character.y)}`;
                    document.getElementById('debugPlatform').textContent = 
                        window.game.character.currentPlatform ? 
                        `منصة ${window.game.character.currentPlatform.id}` : 'لا شيء';
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ خطأ في بدء اللعبة:', error);
            alert('حدث خطأ في بدء اللعبة. يرجى تحديث الصفحة.');
        }
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        // D لتفعيل/تعطيل التصحيح
        if (e.key === 'd' || e.key === 'D') {
            window.showDebug = !window.showDebug;
            console.log('🐛 وضع التصحيح:', window.showDebug ? 'مفعل' : 'معطل');
        }
        
        // I لإضافة نقاط (للاختبار)
        if (e.key === 'i' || e.key === 'I') {
            if (window.game) {
                window.game.addScore(100);
                console.log('✨ +100 نقطة!');
            }
        }
        
        // R لإعادة التشغيل
        if (e.key === 'r' || e.key === 'R') {
            if (window.game) {
                window.game.restartGame();
            }
        }
    });
    
    // زر لإخفاء لوحة التصحيح
    window.toggleDebug = function() {
        const panel = document.getElementById('debugPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
});

// وظائف مساعدة للاختبار
window.help = {
    addJumps: function(count = 1) {
        if (window.game) {
            window.game.jumps += count;
            window.game.updateJumpsUI();
            console.log(`✨ تمت إضافة ${count} نطة`);
        }
    },
    
    slowMotion: function() {
        if (window.game) {
            window.game.gameSpeed = 1.0;
            console.log('🐌 تم تفعيل الحركة البطيئة');
        }
    },
    
    noGaps: function() {
        if (window.game) {
            window.game.gapChance = 0;
            console.log('🛡️ تم إزالة الفجوات');
        }
    }
};
