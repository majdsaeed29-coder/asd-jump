// ===== إعدادات اللعبة =====
const GameConfig = {
    // المنصات
    PLATFORM_SPACING: 140,
    PLATFORM_HEIGHT: 20,
    GAP_WIDTH_MIN: 45,
    GAP_WIDTH_MAX: 65,
    
    // الشخصية
    CHARACTER: {
        SIZE: 60,
        JUMP_FORCE: -15,
        GRAVITY: 0.8,
        START_Y_PERCENT: 0.7 // 70% من أسفل الشاشة
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
        HELIX: 'rgba(33, 150, 243, 0.8)'
    },
    
    // الصعوبة
    DIFFICULTY: {
        SPEED: 2.0,
        GAP_CHANCE: 0.3, // 30% فرصة فجوة
        ROTATION_SPEED: 0.02
    },
    
    // الأسطوانة
    HELIX: {
        RADIUS: 200,
        COLUMNS: 8,
        PLATFORM_WIDTH: 120
    }
};

// ===== فئة اللعبة الرئيسية =====
class HelixJumpGame {
    constructor() {
        console.log('🎮 تهيئة اللعبة...');
        
        this.initGame();
        this.setupEventListeners();
        
        console.log('✅ اللعبة جاهزة!');
    }
    
    // ===== تهيئة اللعبة =====
    initGame() {
        // الحصول على العناصر
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // ضبط حجم الكانفاس
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // حالة اللعبة
        this.gameActive = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('helixHighScore')) || 0;
        this.jumps = 3;
        this.platformSpeed = GameConfig.DIFFICULTY.SPEED;
        this.rotationSpeed = GameConfig.DIFFICULTY.ROTATION_SPEED;
        this.gapChance = GameConfig.DIFFICULTY.GAP_CHANCE;
        
        // الشخصية
        this.character = {
            x: this.canvas.width / 2,
            y: this.canvas.height * GameConfig.CHARACTER.START_Y_PERCENT,
            size: GameConfig.CHARACTER.SIZE,
            color: GameConfig.COLORS.CHARACTER,
            velocityY: 0,
            isJumping: false,
            isOnPlatform: true,
            currentPlatform: null,
            rotation: 0,
            // صورة الشخصية
            image: null
        };
        
        // تحميل صورة الشخصية
        this.loadCharacterImage();
        
        // الأسطوانة
        this.helixRotation = 0;
        this.rotationVelocity = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        
        // المنصات والعناصر
        this.platforms = [];
        this.coins = [];
        this.particles = [];
        
        // تحديث الواجهة
        this.updateUI();
    }
    
    // ===== تحميل صورة الشخصية =====
    loadCharacterImage() {
        this.character.image = new Image();
        this.character.image.onload = () => {
            console.log('✅ تم تحميل صورة الشخصية');
        };
        this.character.image.onerror = () => {
            console.log('⚠️ لم يتم تحميل صورة الشخصية، سيتم استخدام رسم بديل');
        };
        
        // جرب تحميل الصورة من عدة مصادر
        const imageSources = [
            './assets/engineer.png',
            './assets/engineer2.png', 
            './assets/engineer3.png',
            'https://cdn-icons-png.flaticon.com/512/3067/3067256.png' // بديل
        ];
        
        let currentSource = 0;
        const tryLoadImage = () => {
            if (currentSource < imageSources.length) {
                this.character.image.src = imageSources[currentSource];
                currentSource++;
            }
        };
        
        this.character.image.onerror = tryLoadImage;
        tryLoadImage();
    }
    
    // ===== ضبط حجم الكانفاس =====
    resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const rect = gameArea.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // تحديث موقع الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = this.canvas.height * GameConfig.CHARACTER.START_Y_PERCENT;
    }
    
    // ===== إنشاء المنصات =====
    createPlatforms() {
        this.platforms = [];
        this.coins = [];
        
        const platformCount = 25; // عدد أقل للمنصات
        
        for (let i = 0; i < platformCount; i++) {
            const y = 100 + i * GameConfig.PLATFORM_SPACING;
            const column = i % GameConfig.HELIX.COLUMNS;
            const angle = (column * Math.PI * 2) / GameConfig.HELIX.COLUMNS;
            
            // المنصات الأولى (0-3) بدون فجوات
            const hasGap = i >= 4 && Math.random() < this.gapChance;
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
            
            // إضافة عملات (25% فرصة، ولا تكون على فجوات)
            if (i >= 3 && !hasGap && Math.random() < 0.25) {
                this.coins.push({
                    platformId: i,
                    angle: angle,
                    collected: false,
                    value: 10,
                    y: platform.y - 40,
                    rotation: 0
                });
            }
        }
        
        // وضع الشخصية على المنصة الأولى
        if (this.platforms.length > 0) {
            this.character.currentPlatform = this.platforms[0];
            this.character.isOnPlatform = true;
            this.character.velocityY = 0;
        }
        
        console.log(`✅ تم إنشاء ${platformCount} منصة`);
    }
    
    // ===== أحداث التحكم =====
    setupEventListeners() {
        // تدوير بالسحب
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('mouseleave', () => this.endDrag());
        
        // تدوير باللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.drag(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endDrag());
        
        // النط بالمسافة
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            }
        });
        
        // أزرار التحكم على الشاشة
        document.getElementById('jumpBtn').addEventListener('click', () => this.jump());
        document.getElementById('leftBtn').addEventListener('click', () => this.rotateLeft());
        document.getElementById('rightBtn').addEventListener('click', () => this.rotateRight());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // بدء اللعبة
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        
        // إعادة اللعبة
        document.getElementById('restartGameBtn').addEventListener('click', () => this.restartGame());
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
        
        // سرعة الدوران حسب سرعة السحب
        this.rotationVelocity = deltaX * 0.015;
        this.lastMouseX = currentX;
    }
    
    endDrag() {
        this.isDragging = false;
    }
    
    rotateLeft() {
        this.rotationVelocity = -0.03;
    }
    
    rotateRight() {
        this.rotationVelocity = 0.03;
    }
    
    // ===== فيزياء اللعبة =====
    update(deltaTime) {
        if (!this.gameActive) return;
        
        // تحديث الدوران
        this.updateRotation(deltaTime);
        
        // تحديث الشخصية
        this.updateCharacter(deltaTime);
        
        // تحديث المنصات
        this.updatePlatforms(deltaTime);
        
        // تحديث العملات
        this.updateCoins(deltaTime);
        
        // التحقق من الاصطدامات
        this.checkCollisions();
        
        // تحديث الجسيمات
        this.updateParticles(deltaTime);
    }
    
    updateRotation(deltaTime) {
        // تطبيق الدوران
        this.helixRotation += this.rotationSpeed * (deltaTime / 16.67);
        this.helixRotation += this.rotationVelocity;
        
        // تخفيف سرعة السحب
        this.rotationVelocity *= 0.92;
        
        // تطبيع الدوران
        if (this.helixRotation > Math.PI * 2) this.helixRotation -= Math.PI * 2;
        if (this.helixRotation < 0) this.helixRotation += Math.PI * 2;
    }
    
    updateCharacter(deltaTime) {
        // تطبيق الجاذبية
        if (!this.character.isOnPlatform) {
            this.character.velocityY += GameConfig.CHARACTER.GRAVITY;
        }
        
        // تحديث الموقع العمودي
        this.character.y += this.character.velocityY;
        
        // تحديث الدوران
        this.character.rotation += 0.05;
        
        // البحث عن المنصة الحالية
        this.findCurrentPlatform();
        
        // التحقق من السقوط
        if (this.character.y > this.canvas.height + 100) {
            this.endGame();
        }
    }
    
    findCurrentPlatform() {
        const centerX = this.canvas.width / 2;
        let closestPlatform = null;
        let minDistance = Infinity;
        
        for (const platform of this.platforms) {
            if (!platform.isActive) continue;
            
            // المسافة العمودية بين الشخصية والمنصة
            const verticalDistance = platform.y - this.character.y;
            
            // إذا كانت الشخصية في نطاق المنصة (فوقها أو تحتها قليلاً)
            if (verticalDistance >= -20 && verticalDistance < 100) {
                // حساب موقع المنصة على الشاشة
                const platformAngle = platform.angle + this.helixRotation;
                const platformX = centerX + Math.cos(platformAngle) * GameConfig.HELIX.RADIUS;
                
                // إذا كانت الشخصية فوق المنصة (ضمن النطاق الأفقي)
                if (Math.abs(this.character.x - platformX) < platform.width / 2 + 15) {
                    // التحقق من الفجوة
                    if (!this.isOverGap(platform, platformX)) {
                        if (verticalDistance < minDistance) {
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
                this.character.y = closestPlatform.y - 50;
                this.character.velocityY = 0;
                this.character.isOnPlatform = true;
                
                // حدث عبور منصة جديدة
                if (this.character.currentPlatform !== closestPlatform) {
                    this.onPlatformPassed(closestPlatform);
                }
            }
            
            this.character.currentPlatform = closestPlatform;
            this.character.isOnPlatform = true;
        } else {
            this.character.isOnPlatform = false;
            this.character.currentPlatform = null;
        }
    }
    
    isOverGap(platform, platformX) {
        if (!platform.hasGap) return false;
        
        // حساب موقع الفجوة على الشاشة
        const gapStart = platformX - (platform.width / 2) + platform.gapPos;
        const gapEnd = gapStart + platform.gapWidth;
        
        // التحقق إذا كانت الشخصية فوق الفجوة
        return this.character.x >= gapStart && this.character.x <= gapEnd;
    }
    
    updatePlatforms(deltaTime) {
        const speed = this.platformSpeed * (deltaTime / 16.67);
        
        // تحريك المنصات للأعلى
        this.platforms.forEach(platform => {
            platform.y -= speed;
            
            // إعادة تدوير المنصات
            if (platform.y < -100) {
                this.recyclePlatform(platform);
            }
        });
    }
    
    recyclePlatform(platform) {
        // نقل المنصة لأسفل الشاشة
        const highestY = Math.min(...this.platforms.map(p => p.y));
        platform.y = highestY + GameConfig.PLATFORM_SPACING;
        platform.isPassed = false;
        
        // تحديث الفجوة
        platform.hasGap = Math.random() < this.gapChance;
        
        if (platform.hasGap) {
            platform.gapWidth = GameConfig.GAP_WIDTH_MIN + 
                Math.random() * (GameConfig.GAP_WIDTH_MAX - GameConfig.GAP_WIDTH_MIN);
            platform.gapPos = Math.random() * (platform.width - platform.gapWidth);
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
        
        // إضافة عملة جديدة (25% فرصة إذا لم يكن هناك فجوة)
        if (!platform.hasGap && Math.random() < 0.25) {
            this.coins.push({
                platformId: platform.id,
                angle: platform.angle,
                collected: false,
                value: 10,
                y: platform.y - 40,
                rotation: 0
            });
        }
    }
    
    updateCoins(deltaTime) {
        this.coins.forEach(coin => {
            coin.rotation += 0.05;
            
            // تحديث موقع العملة مع المنصة
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (platform) {
                coin.y = platform.y - 40;
            }
        });
    }
    
    checkCollisions() {
        // العملات
        this.checkCoinCollision();
        
        // الفجوات (فقط إذا كانت الشخصية على منصة)
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
            
            // حساب موقع العملة على الشاشة
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * (GameConfig.HELIX.RADIUS + 30);
            const coinY = coin.y;
            
            // حساب المسافة إلى الشخصية
            const dx = this.character.x - coinX;
            const dy = this.character.y - coinY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // إذا كانت المسافة صغيرة (اصطدام)
            if (distance < 40) {
                this.collectCoin(coin);
            }
        }
    }
    
    // ===== أحداث اللعبة =====
    jump() {
        if (!this.gameActive) return;
        if (this.jumps <= 0) return;
        if (!this.character.isOnPlatform) return;
        
        this.character.velocityY = GameConfig.CHARACTER.JUMP_FORCE;
        this.character.isOnPlatform = false;
        this.jumps--;
        this.updateJumpsUI();
        
        // جسيمات النط
        this.createParticles(this.character.x, this.character.y, 10, '#FF4081');
        
        console.log('🦘 نطة! النطات المتبقية:', this.jumps);
    }
    
    onPlatformPassed(platform) {
        if (platform.isPassed) return;
        
        platform.isPassed = true;
        this.addScore(5);
        
        // تجديد نطة كل 10 منصات
        if (this.platforms.filter(p => p.isPassed).length % 10 === 0) {
            if (this.jumps < 3) {
                this.jumps++;
                this.updateJumpsUI();
                console.log('✨ تم تجديد نطة!');
            }
        }
        
        // زيادة الصعوبة كل 50 نقطة
        if (this.score % 50 === 0) {
            this.platformSpeed += 0.1;
            console.log(`⚡ زيادة السرعة: ${this.platformSpeed.toFixed(1)}`);
        }
    }
    
    collectCoin(coin) {
        coin.collected = true;
        this.addScore(coin.value);
        this.createParticles(this.character.x, this.character.y, 15, '#FFD700');
        console.log('💰 جمع عملة! +' + coin.value + ' نقطة');
    }
    
    fallIntoGap() {
        console.log('💀 سقوط في فجوة!');
        this.createParticles(this.character.x, this.character.y, 25, '#FF5252');
        this.endGame();
    }
    
    // ===== نظام الجسيمات =====
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: 4 + Math.random() * 6,
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
        if (!this.ctx || !this.gameActive) return;
        
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
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND_TOP);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND_BOTTOM);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // نجوم خلفية
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 29) % this.canvas.height;
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
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.fillRect(centerX - 4, 0, 8, this.canvas.height);
        
        // الخطوط الحلزونية
        for (let i = 0; i < columns; i++) {
            const angle = (i * Math.PI * 2) / columns + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 20;
            const x2 = centerX + Math.cos(angle) * radius;
            
            this.ctx.strokeStyle = GameConfig.COLORS.HELIX;
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
                const gradient = this.ctx.createLinearGradient(
                    -platform.width / 2 + platform.gapPos,
                    0,
                    -platform.width / 2 + platform.gapPos + platform.gapWidth,
                    0
                );
                gradient.addColorStop(0, '#FF5252');
                gradient.addColorStop(0.5, '#FF1744');
                gradient.addColorStop(1, '#FF5252');
                
                this.ctx.fillStyle = gradient;
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
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const angle = coin.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (GameConfig.HELIX.RADIUS + 35);
            const y = coin.y;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(coin.rotation);
            
            // توهج
            this.ctx.shadowColor = GameConfig.COLORS.COIN;
            this.ctx.shadowBlur = 15;
            
            // رسم العملة
            this.ctx.fillStyle = GameConfig.COLORS.COIN;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            // علامة الدولار
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
        
        // دوران الشخصية أثناء النط
        if (!this.character.isOnPlatform) {
            this.ctx.rotate(this.character.rotation * 0.2);
        }
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 35, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // محاولة رسم الصورة
        if (this.character.image.complete && this.character.image.naturalWidth > 0) {
            // استخدام الصورة
            this.ctx.drawImage(
                this.character.image,
                -this.character.size / 2,
                -this.character.size / 2,
                this.character.size,
                this.character.size
            );
        } else {
            // رسم بديل إذا لم تتحمل الصورة
            this.ctx.fillStyle = this.character.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // تفاصيل الوجه
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-10, -5, 8, 0, Math.PI * 2);
            this.ctx.arc(10, -5, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-8, -5, 4, 0, Math.PI * 2);
            this.ctx.arc(8, -5, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // قبعة المهندس
            this.ctx.fillStyle = '#3F51B5';
            this.ctx.fillRect(-20, -35, 40, 10);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -35, 20, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // توهج إذا كان على منصة
        if (this.character.isOnPlatform) {
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 25;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.size / 2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
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
        
        // تأثير
        jumpsElement.style.transform = 'scale(1.3)';
        jumpsElement.style.color = '#FF9800';
        setTimeout(() => {
            jumpsElement.style.transform = 'scale(1)';
            jumpsElement.style.color = '#FF9800';
        }, 300);
    }
    
    addScore(points) {
        this.score += points;
        
        // حفظ أعلى نتيجة
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
        
        document.getElementById('score').textContent = this.score;
    }
    
    // ===== التحكم في اللعبة =====
    startGame() {
        // إخفاء شاشة البداية
        document.getElementById('startScreen').style.display = 'none';
        
        // إظهار شاشة اللعبة
        document.getElementById('gameScreen').style.display = 'block';
        
        // إعادة تعيين اللعبة
        this.initGame();
        this.createPlatforms();
        this.gameActive = true;
        
        // بدء حلقة اللعبة
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('🎮 اللعبة بدأت!');
    }
    
    restartGame() {
        // إخفاء شاشة النهاية
        document.getElementById('gameOverScreen').style.display = 'none';
        
        // إعادة تعيين اللعبة
        this.initGame();
        this.createPlatforms();
        this.gameActive = true;
        
        // إظهار شاشة اللعبة
        document.getElementById('gameScreen').style.display = 'block';
        
        console.log('🔄 إعادة تشغيل اللعبة');
    }
    
    endGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        console.log('🛑 انتهت اللعبة! النقاط:', this.score);
        
        // حساب الإنجاز
        let achievement = '';
        if (this.score >= 300) achievement = '🏆 بطل الأسطوانة!';
        else if (this.score >= 150) achievement = '🥈 لاعب محترف';
        else if (this.score >= 50) achievement = '🥉 لاعب جيد';
        else achievement = '🎮 جرب مرة أخرى!';
        
        // إعداد شاشة النهاية
        const finalStats = document.getElementById('finalStats');
        finalStats.innerHTML = `
            <div style="margin: 20px 0;">
                <div style="color: rgba(255,255,255,0.8); font-size: 18px; margin-bottom: 10px;">
                    النقاط النهائية
                </div>
                <div style="font-size: 48px; color: #FFD700; font-weight: bold;">
                    ${this.score}
                </div>
            </div>
            <div style="margin: 20px 0;">
                <div style="color: rgba(255,255,255,0.8); font-size: 18px; margin-bottom: 10px;">
                    أعلى نتيجة
                </div>
                <div style="font-size: 36px; color: #4CAF50;">
                    ${this.highScore}
                </div>
            </div>
            <div style="margin: 20px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                <div style="color: #00BCD4; font-size: 20px; font-weight: bold;">
                    ${achievement}
                </div>
            </div>
        `;
        
        // إخفاء شاشة اللعبة
        document.getElementById('gameScreen').style.display = 'none';
        
        // إظهار شاشة النهاية
        document.getElementById('gameOverScreen').style.display = 'flex';
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
}

// ===== بدء اللعبة عند تحميل الصفحة =====
window.addEventListener('load', () => {
    console.log('🚀 تهيئة اللعبة...');
    
    // إنشاء اللعبة
    window.game = new HelixJumpGame();
    
    // إخفاء شاشة التحميل وإظهار شاشة البداية
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
    }, 1500);
});
