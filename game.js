// ===== إعدادات اللعبة - الشخصية ثابتة =====
const GameConfig = {
    VERSION: "9.0 - الشخصية ثابتة",
    PLATFORM_SPACING: 120,
    PLATFORM_HEIGHT: 20,
    GAP_WIDTH: 40,
    CHARACTER: {
        DISPLAY_SIZE: 45,
        COLLISION_SIZE: 20,
        COLOR: '#FF4081',
        STATIC_Y: 0.7, // نسبة ثابتة من ارتفاع الشاشة
        JUMP_ANIMATION: {
            HEIGHT: 15,
            DURATION: 400, // ميللي ثانية
            BOUNCE: 0.8
        }
    },
    COLORS: {
        PLATFORM: '#4CAF50',
        PLATFORM_EDGE: '#2E7D32',
        GAP: '#1A237E',
        TRAP: '#FF5252',
        COIN: '#FFD600',
        HELIX: 'rgba(33, 150, 243, 0.8)',
        BACKGROUND: {
            TOP: '#0D47A1',
            BOTTOM: '#1976D2'
        }
    },
    DIFFICULTY: {
        EASY: { SPEED: 2, ROTATION_SPEED: 0.02 },
        NORMAL: { SPEED: 2.5, ROTATION_SPEED: 0.025 },
        HARD: { SPEED: 3, ROTATION_SPEED: 0.03 },
        EXTREME: { SPEED: 3.5, ROTATION_SPEED: 0.035 }
    },
    HELIX: {
        RADIUS: 180,
        COLUMNS: 8,
        PLATFORM_WIDTH: 100
    }
};

// ===== فئة اللعبة - الشخصية ثابتة =====
class StaticHelixJump {
    constructor() {
        console.log('🎮 بدء تحميل اللعبة - الشخصية ثابتة');
        
        try {
            // الحصول على العناصر الأساسية
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('❌ لم يتم العثور على canvas');
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.gameActive = true;
            this.isPaused = false;
            
            // تعديل الحجم
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // تهيئة العناصر الأساسية
            this.scoreElement = this.getElement('score');
            this.levelElement = this.getElement('level');
            this.highScoreElement = this.getElement('highScore');
            
            // إعدادات اللعبة
            this.score = 0;
            this.level = 1;
            this.highScore = parseInt(localStorage.getItem('helixJumpHighScore')) || 0;
            this.difficulty = 'NORMAL';
            this.platformSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
            this.rotationSpeed = GameConfig.DIFFICULTY[this.difficulty].ROTATION_SPEED;
            
            // الشخصية الثابتة تماماً
            this.character = {
                x: this.canvas.width / 2, // ثابت في المنتصف
                y: this.canvas.height * GameConfig.CHARACTER.STATIC_Y, // ثابت في 70% من الأسفل
                displaySize: GameConfig.CHARACTER.DISPLAY_SIZE,
                color: GameConfig.CHARACTER.COLOR,
                isJumping: false,
                jumpProgress: 0, // 0 إلى 1
                jumpStartTime: 0,
                rotation: 0,
                scale: 1,
                bounce: 0
            };
            
            // نظام النطات الخفيفة
            this.lightJumps = {
                count: 0,
                max: 3,
                lastJumpTime: 0,
                cooldown: 300 // ميللي ثانية بين النطات
            };
            
            // المنصات
            this.platforms = [];
            this.traps = [];
            this.coins = [];
            
            // الأسطوانة
            this.helixRotation = 0;
            this.targetRotation = 0;
            this.rotationVelocity = 0;
            this.isDragging = false;
            this.lastTouchX = 0;
            
            // الوقت
            this.time = 0;
            this.lastFrameTime = Date.now();
            
            // تهيئة اللعبة
            this.createGameElements();
            this.setupEventListeners();
            this.updateUI();
            
            console.log('✅ اللعبة مهيأة بنجاح - الشخصية ثابتة');
            
            // بدء اللعبة
            this.gameLoop();
            
        } catch (error) {
            console.error('❌ خطأ في التهيئة:', error);
            this.showError(error.message);
        }
    }
    
    // ===== تهيئة العناصر =====
    resizeCanvas() {
        try {
            const container = document.querySelector('.game-area');
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            this.canvas.width = Math.min(400, rect.width - 40);
            this.canvas.height = Math.min(650, window.innerHeight * 0.7);
            
            // تحديث موقع الشخصية الثابت
            this.character.x = this.canvas.width / 2;
            this.character.y = this.canvas.height * GameConfig.CHARACTER.STATIC_Y;
        } catch (error) {
            console.error('❌ خطأ في تغيير حجم الكانفاس:', error);
        }
    }
    
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ العنصر ${id} غير موجود`);
        }
        return element;
    }
    
    showError(message) {
        console.error('❌ ' + message);
        if (this.canvas) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(message, 10, 30);
        }
    }
    
    // ===== إنشاء عناصر اللعبة =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        
        const platformCount = 30;
        const helixRadius = GameConfig.HELIX.RADIUS;
        const columns = GameConfig.HELIX.COLUMNS;
        
        for (let i = 0; i < platformCount; i++) {
            const y = 200 + i * GameConfig.PLATFORM_SPACING;
            const column = i % columns; // منصات مرتبة
            const angle = (column * Math.PI * 2) / columns;
            
            // إنشاء المنصة
            const platform = {
                id: i,
                x: Math.cos(angle) * helixRadius,
                y: y,
                z: Math.sin(angle) * helixRadius,
                angle: angle,
                column: column,
                width: GameConfig.HELIX.PLATFORM_WIDTH,
                height: GameConfig.PLATFORM_HEIGHT,
                hasGap: i > 0, // أول منصة بدون فجوة
                gapPos: GameConfig.HELIX.PLATFORM_WIDTH * 0.4,
                gapWidth: GameConfig.GAP_WIDTH,
                isActive: true,
                isSolid: true // المنصة صلبة (ليست فجوة)
            };
            
            this.platforms.push(platform);
            
            // إضافة فخ كل 5 منصات
            if (i > 0 && i % 5 === 0) {
                this.traps.push({
                    platformId: i,
                    angle: angle,
                    type: 'spike',
                    active: true
                });
            }
            
            // إضافة عملة كل 3 منصات
            if (i > 0 && i % 3 === 0) {
                this.coins.push({
                    platformId: i,
                    angle: angle,
                    collected: false,
                    value: 10
                });
            }
        }
    }
    
    // ===== تحديث اللعبة =====
    updatePhysics() {
        if (!this.gameActive || this.isPaused) return;
        
        const currentTime = Date.now();
        const deltaTime = Math.min(1000 / 60, currentTime - this.lastFrameTime);
        this.lastFrameTime = currentTime;
        this.time += deltaTime / 1000;
        
        // تحديث النطات الخفيفة
        this.updateLightJumps();
        
        // تحديث دوران الأسطوانة
        this.updateHelixRotation();
        
        // تحريك المنصات للأعلى
        this.updatePlatforms(deltaTime);
        
        // التحقق من السقوط في الفجوة
        this.checkForFall();
        
        // زيادة الصعوبة
        this.updateDifficulty();
    }
    
    // ===== تحديث النطات الخفيفة =====
    updateLightJumps() {
        if (this.character.isJumping) {
            const jumpTime = Date.now() - this.character.jumpStartTime;
            const progress = jumpTime / GameConfig.CHARACTER.JUMP_ANIMATION.DURATION;
            
            if (progress >= 1) {
                // انتهت النطة
                this.character.isJumping = false;
                this.character.jumpProgress = 0;
                this.character.scale = 1;
                this.character.bounce = 0;
            } else {
                // استمرار النطة
                this.character.jumpProgress = progress;
                
                // تأثير النط (حركة جيبية بسيطة)
                const jumpHeight = GameConfig.CHARACTER.JUMP_ANIMATION.HEIGHT;
                this.character.bounce = Math.sin(progress * Math.PI) * jumpHeight;
                
                // تأثير التكبير/التصغير
                this.character.scale = 1 - (0.15 * Math.sin(progress * Math.PI));
                
                // دوران بسيط
                this.character.rotation = progress * Math.PI * 2;
            }
        }
    }
    
    // ===== تدوير الأسطوانة =====
    updateHelixRotation() {
        // تطبيق السرعة الأساسية
        this.helixRotation += this.rotationSpeed;
        
        // إضافة السرعة من السحب
        this.helixRotation += this.rotationVelocity;
        
        // تخفيف السرعة تدريجياً
        this.rotationVelocity *= 0.95;
        
        // الحفاظ على الدوران ضمن النطاق
        this.helixRotation %= Math.PI * 2;
    }
    
    // ===== تحريك المنصات =====
    updatePlatforms(deltaTime) {
        const speed = this.platformSpeed * (deltaTime / 16.67); // تطبيع السرعة
        
        this.platforms.forEach(platform => {
            platform.y -= speed;
            
            // إعادة تدوير المنصة عندما تخرج من الأسفل
            if (platform.y < -100) {
                this.recyclePlatform(platform);
            }
        });
    }
    
    // ===== إعادة تدوير المنصة =====
    recyclePlatform(platform) {
        // نقل المنصة للأعلى
        platform.y = this.canvas.height + 300;
        
        // تحديث الفجوة
        platform.hasGap = Math.random() > 0.3; // 70% فرصة لفجوة
        
        // تحديث الفخاخ والعملات
        this.updatePlatformElements(platform);
    }
    
    updatePlatformElements(platform) {
        // إزالة الفخاخ والعملات القديمة
        this.traps = this.traps.filter(t => t.platformId !== platform.id);
        this.coins = this.coins.filter(c => c.platformId !== platform.id);
        
        // إضافة فخ جديد (20% فرصة)
        if (Math.random() < 0.2) {
            this.traps.push({
                platformId: platform.id,
                angle: platform.angle,
                type: 'spike',
                active: true
            });
        }
        
        // إضافة عملة جديدة (30% فرصة)
        if (Math.random() < 0.3) {
            this.coins.push({
                platformId: platform.id,
                angle: platform.angle,
                collected: false,
                value: 10
            });
        }
    }
    
    // ===== التحقق من السقوط في الفجوة =====
    checkForFall() {
        const characterScreenX = this.character.x;
        const characterScreenY = this.character.y;
        
        // تحويل موقع الشخصية إلى زاوية في الأسطوانة
        const centerX = this.canvas.width / 2;
        const dx = characterScreenX - centerX;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        // حساب الزاوية المقابلة للشخصية
        let characterAngle = Math.atan2(dx, helixRadius);
        characterAngle = (characterAngle + this.helixRotation) % (Math.PI * 2);
        if (characterAngle < 0) characterAngle += Math.PI * 2;
        
        // البحث عن المنصة الأقرب للشخصية
        let closestPlatform = null;
        let minVerticalDistance = Infinity;
        
        for (const platform of this.platforms) {
            if (!platform.isActive) continue;
            
            // حساب المسافة العمودية
            const verticalDistance = platform.y - characterScreenY;
            
            // إذا كانت المنصة قريبة عمودياً
            if (verticalDistance > -50 && verticalDistance < 100) {
                // حساب الفرق بين زاوية المنصة وزاوية الشخصية
                let angleDiff = Math.abs(platform.angle - characterAngle);
                angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                
                // إذا كانت الزوايا متقاربة
                if (angleDiff < 0.3) { // حوالي 17 درجة
                    if (verticalDistance < minVerticalDistance) {
                        minVerticalDistance = verticalDistance;
                        closestPlatform = platform;
                    }
                }
            }
        }
        
        // إذا كانت الشخصية فوق فجوة
        if (closestPlatform && closestPlatform.hasGap) {
            // حساب موقع الفجوة على الشاشة
            const platformAngle = closestPlatform.angle + this.helixRotation;
            const platformScreenX = centerX + Math.cos(platformAngle) * helixRadius;
            
            // حدود الفجوة
            const gapStart = platformScreenX - (closestPlatform.width / 2) + closestPlatform.gapPos;
            const gapEnd = gapStart + closestPlatform.gapWidth;
            
            // إذا كانت الشخصية داخل الفجوة
            if (characterScreenX >= gapStart && characterScreenX <= gapEnd) {
                this.fallIntoGap();
            }
        }
    }
    
    // ===== السقوط في الفجوة =====
    fallIntoGap() {
        console.log('💀 سقوط في الفجوة!');
        this.endGame();
    }
    
    // ===== تحديث الصعوبة =====
    updateDifficulty() {
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            if (this.levelElement) this.levelElement.textContent = this.level;
            
            // زيادة السرعة تدريجياً
            this.platformSpeed += 0.1;
            
            // زيادة سرعة الدوران
            this.rotationSpeed += 0.001;
        }
    }
    
    // ===== الرسم =====
    draw() {
        if (!this.gameActive || !this.ctx) return;
        
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
        
        // رسم الشخصية
        this.drawCharacter();
        
        // رسم الواجهة
        this.drawUI();
    }
    
    // ===== رسم الخلفية =====
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, GameConfig.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(1, GameConfig.COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // ===== رسم الأسطوانة =====
    drawHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        const columns = GameConfig.HELIX.COLUMNS;
        
        // الخطوط الحلزونية
        for (let i = 0; i < columns; i++) {
            const angle = (i * Math.PI * 2) / columns + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * (helixRadius * 0.3);
            const x2 = centerX + Math.cos(angle) * helixRadius;
            
            this.ctx.strokeStyle = `rgba(33, 150, 243, 0.4)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // الحلقة الخارجية
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, helixRadius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    // ===== رسم المنصات =====
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height + 100 || platform.y < -100) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * helixRadius;
            const y = platform.y;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // لون المنصة
            const platformColor = platform.hasGap ? 
                GameConfig.COLORS.PLATFORM : '#888888'; // لون مختلف للمنصات بالفجوات
            
            // الجزء الأيسر من المنصة
            this.ctx.fillStyle = platformColor;
            this.ctx.fillRect(
                -platform.width / 2,
                -platform.height / 2,
                platform.gapPos,
                platform.height
            );
            
            // الجزء الأيمن من المنصة (إذا كانت هناك فجوة)
            if (platform.hasGap) {
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos + platform.gapWidth,
                    -platform.height / 2,
                    platform.width - platform.gapPos - platform.gapWidth,
                    platform.height
                );
                
                // رسم الفجوة
                this.ctx.fillStyle = GameConfig.COLORS.GAP;
                this.ctx.fillRect(
                    -platform.width / 2 + platform.gapPos,
                    -platform.height / 2,
                    platform.gapWidth,
                    platform.height
                );
            } else {
                // رسم المنصة الكاملة بدون فجوة
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
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم الفخاخ =====
    drawTraps() {
        const centerX = this.canvas.width / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        this.traps.forEach(trap => {
            if (!trap.active) return;
            
            const platform = this.platforms.find(p => p.id === trap.platformId);
            if (!platform) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (helixRadius - 25);
            const y = platform.y - 15;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // رسم الفخ
            this.ctx.fillStyle = GameConfig.COLORS.TRAP;
            this.ctx.beginPath();
            
            // شكل شوكة
            this.ctx.moveTo(0, -10);
            this.ctx.lineTo(8, 0);
            this.ctx.lineTo(0, 10);
            this.ctx.lineTo(-8, 0);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم العملات =====
    drawCoins() {
        const centerX = this.canvas.width / 2;
        const helixRadius = GameConfig.HELIX.RADIUS;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const platform = this.platforms.find(p => p.id === coin.platformId);
            if (!platform) return;
            
            const angle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(angle) * (helixRadius + 20);
            const y = platform.y - 30;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // رسم العملة
            this.ctx.fillStyle = GameConfig.COLORS.COIN;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // تفاصيل العملة
            this.ctx.fillStyle = '#FFA000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('$', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    // ===== رسم الشخصية =====
    drawCharacter() {
        this.ctx.save();
        
        // موقع الشخصية الثابت مع تأثير النط
        const x = this.character.x;
        const y = this.character.y - this.character.bounce; // النط لأعلى
        const size = this.character.displaySize * this.character.scale;
        
        this.ctx.translate(x, y);
        this.ctx.rotate(this.character.rotation * 0.3); // دوران خفيف
        
        // ظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, size * 0.5, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الجسم الرئيسي
        this.ctx.fillStyle = this.character.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // العيون
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.25, -size * 0.15, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(size * 0.25, -size * 0.15, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // بؤبؤ العين
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.2, -size * 0.15, size * 0.07, 0, Math.PI * 2);
        this.ctx.arc(size * 0.2, -size * 0.15, size * 0.07, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الفم
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, size * 0.1, size * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // قبعة المهندس
        this.ctx.fillStyle = '#3F51B5';
        this.ctx.fillRect(-size * 0.5, -size * 1.1, size, size * 0.2);
        this.ctx.beginPath();
        this.ctx.ellipse(0, -size * 1.1, size * 0.5, size * 0.1, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // ===== رسم الواجهة =====
    drawUI() {
        // عرض النطات المتبقية
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`النطات: ${this.lightJumps.max - this.lightJumps.count}`, 10, 25);
        
        // عرض الدوران
        const rotationDeg = Math.round((this.helixRotation * 180 / Math.PI) % 360);
        this.ctx.fillText(`الدوران: ${rotationDeg}°`, 10, 50);
    }
    
    // ===== تحديث واجهة المستخدم =====
    updateUI() {
        if (this.scoreElement) this.scoreElement.textContent = this.score;
        if (this.levelElement) this.levelElement.textContent = this.level;
        if (this.highScoreElement) this.highScoreElement.textContent = this.highScore;
    }
    
    // ===== النطات الخفيفة =====
    performLightJump() {
        const now = Date.now();
        
        // التحقق من التبريد
        if (now - this.lightJumps.lastJumpTime < this.lightJumps.cooldown) {
            return;
        }
        
        // التحقق من الحد الأقصى للنطات
        if (this.lightJumps.count >= this.lightJumps.max) {
            console.log('⚠️ لقد استخدمت جميع النطات!');
            return;
        }
        
        // بدء النطة
        this.character.isJumping = true;
        this.character.jumpStartTime = now;
        this.lightJumps.count++;
        this.lightJumps.lastJumpTime = now;
        
        // إضافة النقاط للنطة
        this.addScore(5);
        
        console.log(`🦘 نطة خفيفة #${this.lightJumps.count}`);
    }
    
    // ===== إضافة النقاط =====
    addScore(points) {
        this.score += points;
        this.updateUI();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixJumpHighScore', this.highScore);
            this.updateUI();
        }
    }
    
    // ===== الأحداث =====
    setupEventListeners() {
        // تدوير الأسطوانة بالسحب
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastTouchX = e.clientX;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.gameActive || this.isPaused) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastTouchX;
            
            // تطبيق السرعة بناءً على سرعة السحب
            this.rotationVelocity = deltaX * 0.01;
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // تدوير الأسطوانة باللمس
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
            
            this.rotationVelocity = deltaX * 0.01;
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case ' ':
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.performLightJump();
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
            }
        });
        
        // إزالة حدث اللمس للنط (الشخصية لا تنط باللمس)
        // لا نضيف أي event listeners للنط باللمس
        
        // أزرار التحكم السريع
        const jumpBtn = document.querySelector('[data-action="jump"]');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', () => {
                this.performLightJump();
            });
        }
        
        const restartBtn = document.querySelector('[data-action="restart"]');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
    }
    
    // ===== دوال التحكم =====
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.gameActive = true;
        this.isPaused = false;
        
        this.character.isJumping = false;
        this.character.jumpProgress = 0;
        this.character.scale = 1;
        this.character.bounce = 0;
        
        this.lightJumps.count = 0;
        this.lightJumps.lastJumpTime = 0;
        
        this.helixRotation = 0;
        this.rotationVelocity = 0;
        this.platformSpeed = GameConfig.DIFFICULTY[this.difficulty].SPEED;
        
        this.createGameElements();
        this.updateUI();
    }
    
    endGame() {
        this.gameActive = false;
        
        // رسالة نهاية اللعبة
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FF4081';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`النقاط: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.fillText(`أعلى نتيجة: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 90);
        
        this.ctx.fillStyle = '#FFD600';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('انقر أو المس لإعادة اللعب', this.canvas.width / 2, this.canvas.height / 2 + 140);
        
        // إعادة اللعبة بالنقر
        const restartHandler = () => {
            this.restartGame();
            this.canvas.removeEventListener('click', restartHandler);
            this.canvas.removeEventListener('touchstart', restartHandler);
        };
        
        this.canvas.addEventListener('click', restartHandler);
        this.canvas.addEventListener('touchstart', restartHandler);
    }
    
    // ===== حلقة اللعبة =====
    gameLoop() {
        this.updatePhysics();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== بدء اللعبة =====
window.addEventListener('load', () => {
    console.log('🚀 تحميل اللعبة...');
    
    // إخفاء شاشة التحميل
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        try {
            const game = new StaticHelixJump();
            window.game = game;
            console.log('✅ اللعبة بدأت بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في بدء اللعبة:', error);
        }
    }, 1000);
});
