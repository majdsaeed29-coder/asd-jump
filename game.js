// ===== إعدادات اللعبة =====
const GameConfig = {
    VERSION: "2.0",
    INITIAL_SPEED: 0.03,
    PLATFORM_GAP: 200,
    GRAVITY: 0.8,
    JUMP_POWER: 14,
    CHARACTER: {
        DISPLAY_SIZE: 35,
        COLLISION_SIZE: 15,
        COLOR: '#4dccff'
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
        this.platformSpeed = 2;
        this.gravity = GameConfig.GRAVITY;
        
        // الشخصية (تنط تلقائياً)
        this.character = {
            x: this.canvas.width / 2,
            y: 150,
            displaySize: GameConfig.CHARACTER.DISPLAY_SIZE,
            collisionSize: GameConfig.CHARACTER.COLLISION_SIZE,
            jumpPower: GameConfig.JUMP_POWER,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            color: GameConfig.CHARACTER.COLOR,
            image: null,
            imageLoaded: false,
            jumpTimer: 0,
            autoJumpDelay: 60 // إطار كل قفزة (يقل مع المستوى)
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
        
        // الألوان الفاتحة والواضحة
        this.colors = {
            helixLine: 'rgba(255, 235, 59, 0.3)',
            helixCenter: 'rgba(255, 235, 59, 0.1)',
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
        
        // بدء اللعبة
        this.gameLoop();
        
        // بدء النط التلقائي
        this.startAutoJump();
    }
    
    // ===== إنشاء عناصر اللعبة =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        const platformCount = 20;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * GameConfig.PLATFORM_GAP;
            
            // منصة
            const platformType = Math.floor(Math.random() * 4);
            const hasGap = Math.random() < 0.4;
            
            this.platforms.push({
                x: 0,
                y: y,
                width: 100,
                height: 25,
                angle: angle,
                hasGap: hasGap,
                gapPos: hasGap ? Math.random() * 60 + 20 : 0,
                gapWidth: 50,
                color: this.colors[`platform${platformType + 1}`],
                type: platformType,
                moving: Math.random() < 0.3,
                moveDirection: Math.random() > 0.5 ? 1 : -1,
                moveOffset: 0,
                speed: this.platformSpeed
            });
            
            // فخ (30% فرصة)
            if (Math.random() < 0.3) {
                const trapType = Math.random() < 0.5 ? 'static' : 'moving';
                const trap = {
                    x: 0,
                    y: y - 15,
                    width: 30,
                    height: 18,
                    angle: angle,
                    type: trapType,
                    active: true,
                    rotation: 0
                };
                
                if (trapType === 'moving') {
                    trap.speed = Math.random() * 2 + 1;
                    trap.direction = Math.random() > 0.5 ? 1 : -1;
                    trap.offset = 0;
                }
                
                this.traps.push(trap);
            }
            
            // عملة (25% فرصة)
            if (Math.random() < 0.25) {
                this.coins.push({
                    x: 0,
                    y: y - 50,
                    radius: 15,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: Math.random() < 0.2 ? 50 : 10
                });
            }
        }
    }
    
    // ===== بدء النط التلقائي =====
    startAutoJump() {
        setInterval(() => {
            if (this.gameActive && !this.character.isJumping) {
                this.character.jumpTimer++;
                if (this.character.jumpTimer >= this.character.autoJumpDelay) {
                    this.character.jumpTimer = 0;
                    this.jump();
                }
            }
        }, 1000 / 60); // 60 إطار في الثانية
    }
    
    // ===== دوال الحركة =====
    jump() {
        if (!this.gameActive || this.character.isJumping) return;
        
        this.character.isJumping = true;
        this.character.velocityY = -this.character.jumpPower;
        
        // الصوت
        this.audio.play('jump', 0.5);
        
        // جسيمات القفز
        this.createParticles(
            this.character.x,
            this.character.y + this.character.displaySize,
            this.character.color,
            5
        );
    }
    
    rotateHelix(deltaX) {
        if (!this.gameActive) return;
        
        // تدوير الأسطوانة حسب سحب المستخدم
        this.helixRotation += deltaX * this.helixSpeed * 0.5;
    }
    
    // ===== تحديث الفيزياء =====
    updatePhysics() {
        if (!this.gameActive) return;
        
        // تحديث دوران الشخصية
        if (this.character.isJumping) {
            this.character.rotation += 0.1;
        }
        
        // تطبيق الجاذبية
        if (this.character.isJumping) {
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
        }
        
        // تحريك المنصات للأسفل
        this.platforms.forEach(platform => {
            platform.y -= platform.speed;
            
            // إعادة تدوير المنصات
            if (platform.y < -100) {
                platform.y = this.canvas.height + 100;
                platform.angle = Math.random() * Math.PI * 2;
                
                // تحديث خصائص المنصة
                platform.hasGap = Math.random() < 0.4;
                platform.gapPos = platform.hasGap ? Math.random() * 60 + 20 : 0;
                platform.moving = Math.random() < 0.3;
                platform.moveDirection = Math.random() > 0.5 ? 1 : -1;
            }
            
            // حركة المنصات المتحركة
            if (platform.moving) {
                platform.moveOffset += 0.5 * platform.moveDirection;
                if (Math.abs(platform.moveOffset) > 40) {
                    platform.moveDirection *= -1;
                }
            }
        });
        
        // تحريك العناصر الأخرى
        this.traps.forEach(trap => trap.y -= this.platformSpeed);
        this.coins.forEach(coin => {
            coin.y -= this.platformSpeed;
            coin.rotation += 0.05;
        });
        
        // تحديث الفخاخ المتحركة
        this.traps.forEach(trap => {
            if (trap.type === 'moving') {
                trap.offset += trap.speed * trap.direction;
                if (Math.abs(trap.offset) > 40) trap.direction *= -1;
            }
            if (trap.type === 'spinning') {
                trap.rotation += 0.05;
            }
        });
        
        // تحديث الجسيمات
        this.particles.forEach((particle, index) => {
            particle.life -= 0.02;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // التحقق من التصادمات
        this.checkCollisions();
        
        // التحقق من خروج الشخصية
        if (this.character.y > this.canvas.height + 100) {
            this.endGame();
        }
        
        // زيادة الصعوبة مع النقاط
        if (this.score > this.level * 200) {
            this.level++;
            this.levelElement.textContent = this.level;
            this.platformSpeed += 0.2;
            this.character.autoJumpDelay = Math.max(30, 60 - this.level * 5);
        }
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        // التصادم مع المنصات
        for (let platform of this.platforms) {
            if (platform.y > this.canvas.height || platform.y < 0) continue;
            
            let platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            if (platform.moving) {
                platformX += platform.moveOffset;
            }
            
            // التحقق من الهبوط
            if (this.character.y + this.character.collisionSize > platform.y &&
                this.character.y + this.character.collisionSize < platform.y + platform.height + this.character.velocityY &&
                this.character.velocityY > 0) {
                
                // التحقق من الموضع الأفقي (باستخدام حجم التصادم الصغير)
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
                    
                    if (!inGap) {
                        // هبوط ناجح
                        this.character.y = platform.y - this.character.collisionSize;
                        this.character.velocityY = 0;
                        this.character.isJumping = false;
                        this.character.rotation = 0;
                        
                        // إضافة النقاط
                        this.addScore(10);
                        
                        // جسيمات الهبوط
                        this.createParticles(
                            this.character.x,
                            this.character.y + this.character.collisionSize,
                            platform.color,
                            8
                        );
                        
                        break;
                    }
                }
            }
        }
        
        // التصادم مع الفخاخ
        for (let trap of this.traps) {
            if (!trap.active || trap.y > this.canvas.height || trap.y < 0) continue;
            
            let trapX = centerX + Math.cos(trap.angle + this.helixRotation) * 145;
            if (trap.type === 'moving') {
                trapX += trap.offset;
            }
            
            const dx = this.character.x - trapX;
            const dy = this.character.y - trap.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // استخدام حجم التصادم الصغير للفخاخ
            if (distance < this.character.collisionSize + Math.max(trap.width, trap.height) / 2) {
                this.hitTrap(trap);
                break;
            }
        }
        
        // جمع العملات
        for (let coin of this.coins) {
            if (coin.collected || coin.y > this.canvas.height || coin.y < 0) continue;
            
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const dx = this.character.x - coinX;
            const dy = this.character.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // استخدام حجم العرض الكبير لجمع العملات
            if (distance < this.character.displaySize + coin.radius) {
                this.collectCoin(coin, coinX);
            }
        }
    }
    
    hitTrap(trap) {
        // إنشاء جسيمات الانفجار
        for (let i = 0; i < 20; i++) {
            this.createParticles(
                this.character.x,
                this.character.y,
                this.colors.trap,
                3
            );
        }
        
        // الصوت
        this.audio.play('gameOver', 0.8);
        
        // نهاية اللعبة
        this.endGame();
    }
    
    collectCoin(coin, coinX) {
        coin.collected = true;
        
        // إضافة النقاط
        this.addScore(coin.value);
        
        // الصوت
        this.audio.play('coin', 0.5);
        
        // جسيمات العملة
        for (let i = 0; i < 10; i++) {
            this.createParticles(
                coinX,
                coin.y,
                this.colors.coin,
                2
            );
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
        
        // النجوم
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 23) % this.canvas.width;
            const y = (i * 17) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // مركز الأسطوانة
        this.ctx.fillStyle = this.colors.helixCenter;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الخطوط الحلزونية
        this.ctx.strokeStyle = this.colors.helixLine;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 50;
            const x2 = centerX + Math.cos(angle) * 200;
            const y1 = 0;
            const y2 = this.canvas.height;
            
            // تدرج الخط
            const lineGradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            lineGradient.addColorStop(0, 'rgba(255, 235, 59, 0.5)');
            lineGradient.addColorStop(1, 'rgba(255, 235, 59, 0.2)');
            this.ctx.strokeStyle = lineGradient;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        
        // حدود الأسطوانة
        this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            if (platform.y > this.canvas.height || platform.y < -platform.height) return;
            
            let x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            if (platform.moving) {
                x += platform.moveOffset;
            }
            
            this.ctx.fillStyle = platform.color;
            
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
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
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
            
            // حدود وتأثيرات
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                x - platform.width / 2,
                platform.y,
                platform.width,
                platform.height
            );
            
            // تأثير التوهج للمنصات المتحركة
            if (platform.moving) {
                this.ctx.shadowColor = platform.color;
                this.ctx.shadowBlur = 15;
                this.ctx.strokeRect(
                    x - platform.width / 2,
                    platform.y,
                    platform.width,
                    platform.height
                );
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawTraps() {
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active || trap.y > this.canvas.height || trap.y < -trap.height) return;
            
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
            
            // الفخ
            const trapGradient = this.ctx.createLinearGradient(
                x - trap.width / 2, trap.y,
                x + trap.width / 2, trap.y + trap.height
            );
            trapGradient.addColorStop(0, trap.type === 'moving' ? this.colors.movingTrap : this.colors.trap);
            trapGradient.addColorStop(1, '#FF5252');
            
            this.ctx.fillStyle = trapGradient;
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, trap.height);
            
            // تفاصيل الفخ
            this.ctx.fillStyle = '#FF8A80';
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, 4);
            
            // أشواك
            this.ctx.fillStyle = '#FF5252';
            for (let i = 0; i < 3; i++) {
                const spikeX = x - trap.width / 2 + (i + 1) * (trap.width / 4);
                this.ctx.beginPath();
                this.ctx.moveTo(spikeX, trap.y);
                this.ctx.lineTo(spikeX - 6, trap.y - 10);
                this.ctx.lineTo(spikeX + 6, trap.y);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height || coin.y < -50) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            this.ctx.translate(x, coin.y);
            this.ctx.rotate(coin.rotation);
            
            // العملة الذهبية
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
            gradient.addColorStop(0, '#FFEA00');
            gradient.addColorStop(0.7, '#FFD600');
            gradient.addColorStop(1, '#FFAB00');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // النجمة
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            // توهج العملات الخاصة
            if (coin.value === 50) {
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 25;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        });
    }
    
    drawCharacter() {
        this.ctx.save();
        
        // تأثير التوهج أثناء القفز
        if (this.character.isJumping) {
            this.ctx.shadowColor = this.character.color;
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
            // رسم بديل (كرة ملونة)
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.character.displaySize);
            gradient.addColorStop(0, '#4FC3F7');
            gradient.addColorStop(0.7, '#039BE5');
            gradient.addColorStop(1, '#0277BD');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.displaySize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // العينان
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-10, -10, 6, 0, Math.PI * 2);
            this.ctx.arc(10, -10, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(-8, -10, 3, 0, Math.PI * 2);
            this.ctx.arc(8, -10, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الفم
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 5, 10, 0.2 * Math.PI, 0.8 * Math.PI);
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
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1
            });
        }
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
        
        // إعادة التشغيل
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // لوحة المفاتيح (للتجربة)
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.rotateHelix(-30);
                    break;
                case 'ArrowRight':
                    this.rotateHelix(30);
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
        this.gameActive = false;
        
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.finalLevelElement.textContent = this.level;
        
        this.gameOverScreen.style.display = 'flex';
        
        this.audio.play('gameOver', 0.8);
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.gameActive = true;
        this.helixRotation = 0;
        this.platformSpeed = 2;
        this.character.autoJumpDelay = 60;
        
        this.character.x = this.canvas.width / 2;
        this.character.y = 150;
        this.character.isJumping = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        this.character.jumpTimer = 0;
        
        this.scoreElement.textContent = '0';
        this.levelElement.textContent = '1';
        
        this.createGameElements();
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
    console.log('🎮 Helix Jump - النسخة المحسنة جاهزة!');
    console.log('🔄 اسحب لتدوير الأسطوانة');
    console.log('👤 الشخصية تنط تلقائياً');
});
