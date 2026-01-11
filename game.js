// ===== إعدادات اللعبة المبسطة =====
const GameConfig = {
    VERSION: "1.0 - النسخة المستقرة",
    
    // إعدادات المنصة
    PLATFORM_SPACING: 120,
    PLATFORM_HEIGHT: 20,
    GAP_WIDTH_MIN: 40,
    GAP_WIDTH_MAX: 70,
    
    // إعدادات الشخصية
    CHARACTER: {
        SIZE: 50,
        JUMP_HEIGHT: 100,
        FALL_SPEED: 0.5,
        GRAVITY: 0.8
    },
    
    // الألوان
    COLORS: {
        PLATFORM: '#4CAF50',
        PLATFORM_GAP: '#FF5252',
        PLATFORM_EDGE: '#2E7D32',
        COIN: '#FFD700',
        BACKGROUND_TOP: '#0D47A1',
        BACKGROUND_BOTTOM: '#1976D2',
        CHARACTER: '#FF4081',
        HELIX: 'rgba(33, 150, 243, 0.6)'
    },
    
    // الصعوبة
    DIFFICULTY: {
        EASY: {
            SPEED: 1.5,
            GAP_CHANCE: 0.2,
            ROTATION_SPEED: 0.01
        },
        NORMAL: {
            SPEED: 2.0,
            GAP_CHANCE: 0.3,
            ROTATION_SPEED: 0.015
        },
        HARD: {
            SPEED: 2.5,
            GAP_CHANCE: 0.4,
            ROTATION_SPEED: 0.02
        }
    },
    
    // الأسطوانة
    HELIX: {
        RADIUS: 180,
        COLUMNS: 8,
        PLATFORM_WIDTH: 100
    }
};

// ===== فئة اللعبة الأساسية =====
class SimpleHelixGame {
    constructor() {
        console.log('🎮 بدء اللعبة...');
        
        try {
            // تهيئة العناصر الأساسية
            this.initCanvas();
            this.initGameState();
            this.initPlatforms();
            this.initEventListeners();
            
            // بدء اللعبة
            this.gameActive = true;
            this.lastTime = performance.now();
            this.gameLoop();
            
            console.log('✅ اللعبة بدأت بنجاح!');
            
        } catch (error) {
            console.error('❌ خطأ:', error);
            this.showError(error.message);
        }
    }
    
    // ===== تهيئة العناصر =====
    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error('لم يتم العثور على Canvas');
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.querySelector('.game-area');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // تحديث موقع الشخصية
        if (this.character) {
            this.character.x = this.canvas.width / 2;
        }
    }
    
    // ===== تهيئة حالة اللعبة =====
    initGameState() {
        // الحصول على الصعوبة المختارة
        const difficultySelect = document.getElementById('difficultySelect');
        this.difficulty = difficultySelect ? difficultySelect.value : 'EASY';
        
        // إعدادات اللعبة
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('helixHighScore')) || 0;
        this.jumpsRemaining = 3;
        this.gameSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        this.gapChance = GameConfig.DIFFICULTY[this.difficulty].GAP_CHANCE;
        this.rotationSpeed = GameConfig.DIFFICULTY[this.difficulty].ROTATION_SPEED;
        
        // الشخصية
        this.character = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.7,
            size: GameConfig.CHARACTER.SIZE,
            color: GameConfig.COLORS.CHARACTER,
            velocityY: 0,
            isJumping: false,
            jumpPower: GameConfig.CHARACTER.JUMP_HEIGHT,
            isOnPlatform: true,
            currentPlatform: null
        };
        
        // الأسطوانة
        this.helixRotation = 0;
        this.rotationVelocity = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        
        // المنصات والعناصر
        this.platforms = [];
        this.coins = [];
        
        // الجسيمات
        this.particles = [];
        
        // تحديث الواجهة
        this.updateUI();
    }
    
    // ===== إنشاء المنصات =====
    initPlatforms() {
        this.platforms = [];
        const platformCount = 20;
        
        for (let i = 0; i < platformCount; i++) {
            const y = 100 + i * GameConfig.PLATFORM_SPACING;
            const column = i % GameConfig.HELIX.COLUMNS;
            const angle = (column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
            
            // المنصات الأولى بدون فجوات
            const hasGap = i > 3 && Math.random() < this.gapChance;
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
            
            // إضافة عملات
            if (i > 2 && Math.random() < 0.4 && !hasGap) {
                this.coins.push({
                    platformId: i,
                    angle: angle,
                    collected: false,
                    value: 10
                });
            }
        }
        
        // تعيين المنصة الأولى للشخصية
        this.character.currentPlatform = this.platforms[0];
        this.character.y = this.platforms[0].y - 50;
    }
    
    // ===== الأحداث =====
    initEventListeners() {
        // تدوير بالسحب
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.gameActive) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastMouseX;
            
            this.rotationVelocity = deltaX * 0.02;
            this.lastMouseX = currentX;
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
            this.lastMouseX = e.touches[0].clientX;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || !this.gameActive) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.lastMouseX;
            
            this.rotationVelocity = deltaX * 0.02;
            this.lastMouseX = currentX;
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
        
        // النط
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
                this.jump();
            }
            
            if (e.key === 'r' || e.key === 'R') {
                this.restartGame();
            }
        });
        
        // أزرار التحكم
        document.getElementById('jumpBtn').addEventListener('click', () => this.jump());
        document.getElementById('leftBtn').addEventListener('click', () => this.rotationVelocity = -0.05);
        document.getElementById('rightBtn').addEventListener('click', () => this.rotationVelocity = 0.05);
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    // ===== الفيزياء والتحديث =====
    update(deltaTime) {
        if (!this.gameActive) return;
        
        // تحديث دوران الأسطوانة
        this.updateHelix(deltaTime);
        
        // تحديث حركة الشخصية
        this.updateCharacter(deltaTime);
        
        // تحريك المنصات
        this.updatePlatforms(deltaTime);
        
        // التحقق من الاصطدامات
        this.checkCollisions();
        
        // تحديث الجسيمات
        this.updateParticles(deltaTime);
    }
    
    updateHelix(deltaTime) {
        // تطبيق السرعة
        this.helixRotation += this.rotationSpeed;
        this.helixRotation += this.rotationVelocity;
        
        // تخفيف السرعة
        this.rotationVelocity *= 0.9;
        
        // الحفاظ على النطاق
        if (this.helixRotation > Math.PI * 2) this.helixRotation -= Math.PI * 2;
        if (this.helixRotation < 0) this.helixRotation += Math.PI * 2;
    }
    
    updateCharacter(deltaTime) {
        // تطبيق الجاذبية
        this.character.velocityY += GameConfig.CHARACTER.GRAVITY;
        this.character.y += this.character.velocityY * (deltaTime / 16.67);
        
        // النط
        if (this.character.isJumping) {
            this.character.velocityY = -this.character.jumpPower;
            this.character.isJumping = false;
            this.character.isOnPlatform = false;
        }
        
        // تحديد المنصة الحالية
        this.findCurrentPlatform();
    }
    
    findCurrentPlatform() {
        let closestPlatform = null;
        let minDistance = Infinity;
        
        for (const platform of this.platforms) {
            if (!platform.isActive) continue;
            
            // المسافة العمودية
            const verticalDistance = platform.y - this.character.y;
            
            // إذا كانت الشخصية فوق المنصة
            if (verticalDistance >= -10 && verticalDistance < 100) {
                // حساب موقع المنصة على الشاشة
                const centerX = this.canvas.width / 2;
                const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * GameConfig.HELIX.RADIUS;
                
                // المسافة الأفقية
                const horizontalDistance = Math.abs(this.character.x - platformX);
                
                // إذا كانت داخل عرض المنصة
                if (horizontalDistance < platform.width / 2) {
                    if (Math.abs(verticalDistance) < minDistance) {
                        // التحقق من الفجوة
                        if (!this.isOverGap(platform)) {
                            minDistance = Math.abs(verticalDistance);
                            closestPlatform = platform;
                        }
                    }
                }
            }
        }
        
        if (closestPlatform) {
            // الهبوط على المنصة
            if (this.character.velocityY > 0 && !this.character.isOnPlatform) {
                this.character.y = closestPlatform.y - 50;
                this.character.velocityY = 0;
                this.character.isOnPlatform = true;
                
                if (this.character.currentPlatform !== closestPlatform) {
                    this.onPlatformPassed(closestPlatform);
                }
            }
            this.character.currentPlatform = closestPlatform;
        } else {
            this.character.isOnPlatform = false;
            this.character.currentPlatform = null;
            
            // التحقق من السقوط
            if (this.character.y > this.canvas.height + 100) {
                this.endGame();
            }
        }
    }
    
    isOverGap(platform) {
        if (!platform.hasGap) return false;
        
        const centerX = this.canvas.width / 2;
        const platformX = centerX + Math.cos(platform.angle + this.helixRotation) * GameConfig.HELIX.RADIUS;
        
        // موقع الفجوة على الشاشة
        const gapStart = platformX - (platform.width / 2) + platform.gapPos;
        const gapEnd = gapStart + platform.gapWidth;
        
        // إذا كانت الشخصية فوق الفجوة
        return this.character.x >= gapStart && this.character.x <= gapEnd;
    }
    
    updatePlatforms(deltaTime) {
        const speed = this.gameSpeed * (deltaTime / 16.67);
        
        // تحريك المنصات للأعلى
        this.platforms.forEach(platform => {
            platform.y -= speed;
            
            // إعادة تدوير المنصات
            if (platform.y < -100) {
                this.recyclePlatform(platform);
            }
        });
        
        // تحديث العملات
        this.coins.forEach(coin => {
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (platform) {
                coin.y = platform.y - 30;
            }
        });
    }
    
    recyclePlatform(platform) {
        // نقل المنصة لأسفل الشاشة
        const highestY = Math.max(...this.platforms.map(p => p.y));
        platform.y = highestY + GameConfig.PLATFORM_SPACING;
        platform.isPassed = false;
        
        // تحديث الفجوة
        platform.hasGap = Math.random() < this.gapChance;
        
        if (platform.hasGap) {
            platform.gapWidth = GameConfig.GAP_WIDTH_MIN + 
                Math.random() * (GameConfig.GAP_WIDTH_MAX - GameConfig.GAP_WIDTH_MIN);
            platform.gapPos = Math.random() * (platform.width - platform.gapWidth);
        }
        
        // تغيير الزاوية
        platform.column = (platform.column + 1) % GameConfig.HELIX.COLUMNS;
        platform.angle = (platform.column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
        
        // تحديث العملات
        this.updatePlatformCoins(platform);
    }
    
    updatePlatformCoins(platform) {
        // إزالة العملات القديمة
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        
        // إضافة عملة جديدة (40% فرصة)
        if (Math.random() < 0.4 && !platform.hasGap) {
            this.coins.push({
                platformId: platform.id,
                angle: platform.angle,
                collected: false,
                value: 10,
                y: platform.y - 30
            });
        }
    }
    
    checkCollisions() {
        // العملات
        this.checkCoinCollision();
        
        // الفجوات (فقط إذا كانت الشخصية على منصة)
        if (this.character.isOnPlatform && this.character.currentPlatform) {
            if (this.character.currentPlatform.hasGap && this.isOverGap(this.character.currentPlatform)) {
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
            
            // موقع العملة على الشاشة
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * (GameConfig.HELIX.RADIUS + 20);
            const coinY = coin.y;
            
            // المسافة إلى الشخصية
            const dx = this.character.x - coinX;
            const dy = this.character.y - coinY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                this.collectCoin(coin);
            }
        }
    }
    
    // ===== الأحداث =====
    jump() {
        if (this.jumpsRemaining <= 0) return;
        if (!this.character.isOnPlatform) return;
        
        this.character.isJumping = true;
        this.jumpsRemaining--;
        this.updateJumpsUI();
        
        // جسيمات
        this.createParticles(this.character.x, this.character.y, 8, '#FF4081');
    }
    
    onPlatformPassed(platform) {
        if (platform.isPassed) return;
        
        platform.isPassed = true;
        this.addScore(10);
        
        // تجديد النطات كل 5 منصات
        if (this.score % 50 === 0 && this.jumpsRemaining < 3) {
            this.jumpsRemaining++;
            this.updateJumpsUI();
        }
    }
    
    collectCoin(coin) {
        coin.collected = true;
        this.addScore(coin.value);
        this.createParticles(this.character.x, this.character.y, 12, '#FFD700');
    }
    
    fallIntoGap() {
        this.createParticles(this.character.x, this.character.y, 20, '#FF5252');
        this.endGame();
    }
    
    // ===== نظام الجسيمات =====
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                size: 4 + Math.random() * 4,
                color: color,
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
        
        // الخلفية
        this.drawBackground();
        
        // الأسطوانة
        this.drawHelix();
        
        // المنصات
        this.drawPlatforms();
        
        // العملات
        this.drawCoins();
        
        // الجسيمات
        this.drawParticles();
        
        // الشخصية
        this.drawCharacter();
        
        // معلومات التصحيح
        this.drawDebugInfo();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND_TOP);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND_BOTTOM);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = GameConfig.HELIX.RADIUS;
        
        // العمود المركزي
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(centerX - 5, 0, 10, this.canvas.height);
        
        // الخطوط الحلزونية
        for (let i = 0; i < GameConfig.HELIX.COLUMNS; i++) {
            const angle = (i * Math.PI * 2) / GameConfig.HELIX.COLUMNS + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 20;
            const x2 = centerX + Math.cos(angle) * radius;
            
            this.ctx.strokeStyle = `rgba(33, 150, 243, 0.3)`;
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
            
            // رسم المنصة
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
                this.ctx.fillStyle = GameConfig.COLORS.PLATFORM_GAP;
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
            
            // توهج للمنصة الحالية
            if (platform === this.character.currentPlatform) {
                this.ctx.shadowColor = platform.color;
                this.ctx.shadowBlur = 15;
                this.ctx.strokeRect(
                    -platform.width / 2,
                    -platform.height / 2,
                    platform.width,
                    platform.height
                );
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (!platform) return;
            
            const angle = coin.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (GameConfig.HELIX.RADIUS + 25);
            const y = platform.y - 30;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // رسم العملة
            this.ctx.fillStyle = GameConfig.COLORS.COIN;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // توهج
            this.ctx.shadowColor = GameConfig.COLORS.COIN;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // علامة الدولار
            this.ctx.fillStyle = '#B8860B';
            this.ctx.font = 'bold 14px Arial';
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
        this.ctx.translate(this.character.x, this.character.y);
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 30, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الجسم
        this.ctx.fillStyle = this.character.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.character.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // العيون
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-10, -5, 8, 0, Math.PI * 2);
        this.ctx.arc(10, -5, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // البؤبؤ
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-8, -5, 4, 0, Math.PI * 2);
        this.ctx.arc(8, -5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الفم
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 5, 10, 0.2, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // قبعة المهندس
        this.ctx.fillStyle = '#3F51B5';
        this.ctx.fillRect(-20, -35, 40, 10);
        this.ctx.beginPath();
        this.ctx.ellipse(0, -35, 20, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // توهج إذا كان على منصة
        if (this.character.isOnPlatform) {
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.size / 2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
    }
    
    drawDebugInfo() {
        if (!window.showDebug) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 120);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = [
            `النقاط: ${this.score}`,
            `النطات: ${this.jumpsRemaining}`,
            `السرعة: ${this.gameSpeed.toFixed(1)}`,
            `الموقع: (${Math.round(this.character.x)}, ${Math.round(this.character.y)})`,
            `السرعة Y: ${this.character.velocityY.toFixed(1)}`,
            `على منصة: ${this.character.isOnPlatform ? 'نعم' : 'لا'}`,
            `المنصة: ${this.character.currentPlatform ? this.character.currentPlatform.id : 'لا شيء'}`,
            `الدوران: ${(this.helixRotation * 180 / Math.PI).toFixed(1)}°`
        ];
        
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 15, 30 + i * 15);
        });
    }
    
    // ===== واجهة المستخدم =====
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('jumpsCount').textContent = this.jumpsRemaining;
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    updateJumpsUI() {
        const jumpsElement = document.getElementById('jumpsCount');
        jumpsElement.textContent = this.jumpsRemaining;
        jumpsElement.style.animation = 'bounce 0.3s';
        setTimeout(() => jumpsElement.style.animation = '', 300);
    }
    
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixHighScore', this.highScore);
        }
        this.updateUI();
    }
    
    // ===== نهاية اللعبة =====
    endGame() {
        this.gameActive = false;
        
        // حساب النتيجة النهائية
        const finalScore = this.score;
        let achievement = '';
        
        if (finalScore >= 500) achievement = '🏆 بطل الأسطوانة!';
        else if (finalScore >= 200) achievement = '🥈 لاعب محترف';
        else if (finalScore >= 100) achievement = '🥉 لاعب جيد';
        else achievement = '🎮 لاعب مبتدئ';
        
        // عرض شاشة النهاية
        const finalStats = document.getElementById('finalStats');
        finalStats.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="color: rgba(255,255,255,0.8); font-size: 16px;">النقاط النهائية</div>
                <div style="font-size: 40px; color: #FFD700; font-weight: bold;">${finalScore}</div>
            </div>
            <div>
                <div style="color: rgba(255,255,255,0.8); font-size: 16px;">أعلى نتيجة</div>
                <div style="font-size: 24px; color: #4CAF50;">${this.highScore}</div>
            </div>
        `;
        
        document.getElementById('achievementBadge').textContent = achievement;
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        // إعادة تشغيل اللعبة عند النقر
        document.getElementById('gameOverRestartBtn').onclick = () => this.restartGame();
    }
    
    // ===== التحكم في اللعبة =====
    startGame() {
        this.gameActive = true;
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        this.initGameState();
        this.initPlatforms();
    }
    
    restartGame() {
        this.initGameState();
        this.initPlatforms();
        this.gameActive = true;
        document.getElementById('gameOverScreen').style.display = 'none';
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
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
    }, 1500);
    
    // بدء اللعبة عند النقر على زر البدء
    document.getElementById('startButton').addEventListener('click', function() {
        try {
            // إخفاء شاشة البداية
            document.getElementById('startScreen').style.display = 'none';
            
            // إنشاء وبدء اللعبة
            window.game = new SimpleHelixGame();
            window.game.startGame();
            
            // إظهار لوحة التصحيح
            document.getElementById('debugPanel').style.display = 'block';
            
            // تحديث معلومات التصحيح
            setInterval(() => {
                if (window.game && window.game.gameActive) {
                    document.getElementById('debugState').textContent = 
                        window.game.character.isOnPlatform ? 'على منصة' : 'في الهواء';
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
    
    // اختصار لوحة المفاتيح لعرض التصحيح
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            window.showDebug = !window.showDebug;
            console.log('وضع التصحيح:', window.showDebug ? 'مفعل' : 'معطل');
        }
    });
});
