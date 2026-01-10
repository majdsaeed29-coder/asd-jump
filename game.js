// ===== تهيئة اللعبة =====
class HelixJump {
    constructor() {
        // إعداد العناصر الأساسية
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // عناصر واجهة المستخدم
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('highScore');
        this.doubleJumpElement = document.getElementById('doubleJumpCount');
        
        // شاشات
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.container = document.querySelector('.container');
        
        // أزرار
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.restartGameBtn = document.getElementById('restartGameBtn');
        
        // إعدادات اللعبة
        this.score = 0;
        this.level = 1;
        this.highScore = localStorage.getItem('helixJumpHighScore') || 0;
        this.gameActive = false;
        this.paused = false;
        this.gameOver = false;
        
        // إعدادات الفيزياء
        this.helixRotation = 0;
        this.helixSpeed = 0.03;
        this.platformSpeed = 2;
        this.platformGap = 200;
        this.gravity = 0.8;
        
        // الشخصية (المهندس - شخصيتك)
        this.character = {
            x: this.canvas.width / 2,
            y: 150,
            size: 15,         // حجم التصادم
            displaySize: 35,  // حجم العرض
            jumpPower: 14,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            color: '#4dccff',
            doubleJumps: 0,
            trail: []
        };
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        // التحكم
        this.isDragging = false;
        this.lastTouchX = 0;
        
        // الألوان
        this.colors = {
            platform1: '#ff6b9d',
            platform2: '#6b9dff',
            platform3: '#9dff6b',
            platform4: '#ff9d6b',
            trap: '#ff4d4d',
            movingTrap: '#ff3333',
            coin: '#ffcc00',
            helixLine: 'rgba(77, 204, 255, 0.2)'
        };
        
        // الصوت
        this.audio = {
            jump: document.getElementById('jumpSound'),
            coin: document.getElementById('coinSound'),
            gameOver: document.getElementById('gameOverSound'),
            bgMusic: document.getElementById('bgMusic'),
            
            play: function(sound, volume = 0.7) {
                if (!this[sound]) return;
                this[sound].currentTime = 0;
                this[sound].volume = volume;
                this[sound].play().catch(e => console.log('خطأ صوت:', e));
            }
        };
        
        // التهيئة
        this.init();
    }
    
    // ===== التهيئة =====
    init() {
        // إخفاء شاشة التحميل وإظهار اللعبة
        setTimeout(() => {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.container.style.display = 'block';
                this.startGame();
            }, 500);
        }, 1000);
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        // تحديث أعلى نتيجة
        this.highScoreElement.textContent = this.highScore;
        
        // إنشاء العناصر
        this.createGameElements();
        
        // بدء حلقة اللعبة
        this.gameLoop();
    }
    
    // ===== بدء اللعبة =====
    startGame() {
        this.gameActive = true;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        
        // إعادة تعيين الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 150;
        this.character.velocityY = 0;
        this.character.isJumping = false;
        this.character.rotation = 0;
        this.character.doubleJumps = 0;
        this.character.trail = [];
        
        // إعادة تعيين العناصر
        this.createGameElements();
        
        // تحديث الواجهة
        this.updateUI();
        
        // بدء الموسيقى
        this.audio.bgMusic.volume = 0.5;
        this.audio.bgMusic.loop = true;
        this.audio.bgMusic.play().catch(e => console.log('الموسيقى:', e));
        
        // إظهار رسالة الترحيب
        this.showMessage('🚀 ابدأ اللعب!');
    }
    
    // ===== إنشاء العناصر =====
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        const platformCount = 20;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * this.platformGap;
            
            // إنشاء منصة
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
                moveOffset: 0
            });
            
            // إنشاء فخ (40% فرصة)
            if (Math.random() < 0.4) {
                const trapType = Math.random() < 0.5 ? 'static' : 'moving';
                const trap = {
                    x: 0,
                    y: y - 15,
                    width: 30,
                    height: 18,
                    angle: angle,
                    type: trapType,
                    active: true
                };
                
                if (trapType === 'moving') {
                    trap.speed = Math.random() * 2 + 1;
                    trap.direction = Math.random() > 0.5 ? 1 : -1;
                    trap.offset = 0;
                }
                
                this.traps.push(trap);
            }
            
            // إنشاء عملة (30% فرصة)
            if (Math.random() < 0.3) {
                this.coins.push({
                    x: 0,
                    y: y - 50,
                    radius: 14,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: Math.random() < 0.2 ? 50 : 10 // 20% فرصة لعملة خاصة
                });
            }
        }
    }
    
    // ===== الأحداث =====
    setupEventListeners() {
        // التحكم باللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.paused || this.gameOver) return;
            
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
            
            // إذا كان لمس سريع (ليس سحب) - قفز
            this.jump();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || this.paused) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotateHelix(deltaX * 0.02);
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // التحكم بالفأرة
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.paused || this.gameOver) return;
            
            this.isDragging = true;
            this.lastTouchX = e.clientX;
            this.jump();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || this.paused) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotateHelix(deltaX * 0.02);
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // النقر للقفز
        this.canvas.addEventListener('click', () => {
            if (!this.isDragging && this.gameActive) {
                this.jump();
            }
        });
        
        // لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (this.paused || this.gameOver) return;
            
            switch(e.key) {
                case ' ':
                case 'ArrowUp':
                    e.preventDefault();
                    this.jump();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.rotateHelix(-20);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.rotateHelix(20);
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // أزرار التحكم
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.restartGameBtn.addEventListener('click', () => this.restartGame());
    }
    
    // ===== الفيزياء والحركة =====
    update() {
        if (!this.gameActive || this.paused || this.gameOver) return;
        
        // تحديث الشخصية
        if (this.character.isJumping) {
            this.character.velocityY += this.gravity;
            this.character.y += this.character.velocityY;
            this.character.rotation += 0.15;
            
            // إضافة أثر
            this.character.trail.push({
                x: this.character.x,
                y: this.character.y,
                life: 1
            });
            
            // تحديث الأثر
            this.character.trail = this.character.trail.filter(p => {
                p.life -= 0.05;
                return p.life > 0;
            });
            
            // جسيمات القفز
            if (Math.random() < 0.2) {
                this.createParticle(
                    this.character.x,
                    this.character.y + this.character.size,
                    this.character.color,
                    2
                );
            }
        }
        
        // تحريك المنصات للأسفل
        this.platforms.forEach(platform => {
            platform.y -= this.platformSpeed;
            
            // إعادة المنصات
            if (platform.y < -100) {
                platform.y = this.canvas.height + 100;
                platform.angle = Math.random() * Math.PI * 2;
                platform.hasGap = Math.random() < 0.4;
                platform.gapPos = platform.hasGap ? Math.random() * 60 + 20 : 0;
                platform.moving = Math.random() < 0.3;
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
        this.coins.forEach(coin => coin.y -= this.platformSpeed);
        
        // تحديث الفخاخ المتحركة
        this.traps.forEach(trap => {
            if (trap.type === 'moving') {
                trap.offset += trap.speed * trap.direction;
                if (Math.abs(trap.offset) > 40) trap.direction *= -1;
            }
        });
        
        // تحديث العملات
        this.coins.forEach(coin => {
            coin.rotation += 0.05;
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
    }
    
    // ===== التصادمات =====
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        // التصادم مع المنصات
        for (let platform of this.platforms) {
            let platformX = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            if (platform.moving) {
                platformX += platform.moveOffset;
            }
            
            // التحقق من الهبوط
            if (this.character.y + this.character.size > platform.y &&
                this.character.y + this.character.size < platform.y + platform.height + this.character.velocityY &&
                this.character.velocityY > 0) {
                
                // التحقق من الموضع الأفقي
                if (this.character.x + this.character.size > platformX - platform.width / 2 &&
                    this.character.x - this.character.size < platformX + platform.width / 2) {
                    
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
                        this.character.y = platform.y - this.character.size;
                        this.character.velocityY = 0;
                        this.character.isJumping = false;
                        this.character.rotation = 0;
                        
                        // إضافة نقاط
                        this.addScore(10);
                        
                        // جسيمات الهبوط
                        this.createParticle(
                            this.character.x,
                            this.character.y + this.character.size,
                            platform.color,
                            5
                        );
                        
                        // 10% فرصة للحصول على قفزة مزدوجة
                        if (Math.random() < 0.1 && this.character.doubleJumps < 3) {
                            this.character.doubleJumps++;
                            this.doubleJumpElement.textContent = this.character.doubleJumps;
                            this.showMessage('⚡ قفزة مزدوجة!');
                        }
                        
                        break;
                    }
                }
            }
        }
        
        // التصادم مع الفخاخ
        for (let trap of this.traps) {
            if (!trap.active) continue;
            
            let trapX = centerX + Math.cos(trap.angle + this.helixRotation) * 145;
            if (trap.type === 'moving') {
                trapX += trap.offset;
            }
            
            const dx = this.character.x - trapX;
            const dy = this.character.y - trap.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // استخدام حجم التصادم الصغير للفخاخ
            if (distance < this.character.size + Math.max(trap.width, trap.height) / 2) {
                this.endGame();
                break;
            }
        }
        
        // جمع العملات
        for (let coin of this.coins) {
            if (coin.collected) continue;
            
            const coinX = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const dx = this.character.x - coinX;
            const dy = this.character.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // استخدام حجم العرض الكبير لجمع العملات
            if (distance < this.character.displaySize + coin.radius) {
                coin.collected = true;
                this.addScore(coin.value);
                
                // جسيمات العملة
                for (let i = 0; i < 8; i++) {
                    this.createParticle(
                        coinX,
                        coin.y,
                        '#ffcc00',
                        2
                    );
                }
                
                // صوت العملة
                this.audio.play('coin', 0.5);
                
                // رسالة العملة الخاصة
                if (coin.value === 50) {
                    this.showMessage('💎 عملة خاصة! +50 نقطة');
                }
            }
        }
    }
    
    // ===== الرسم =====
    draw() {
        if (!this.gameActive) return;
        
        // مسح الشاشة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم الخطوط الحلزونية
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
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#151530');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        
        this.ctx.strokeStyle = this.colors.helixLine;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 50;
            const x2 = centerX + Math.cos(angle) * 200;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
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
            } else {
                this.ctx.fillRect(
                    x - platform.width / 2,
                    platform.y,
                    platform.width,
                    platform.height
                );
            }
            
            // حدود المنصة
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                x - platform.width / 2,
                platform.y,
                platform.width,
                platform.height
            );
        });
    }
    
    drawTraps() {
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active) return;
            
            let x = centerX + Math.cos(trap.angle + this.helixRotation) * 145;
            if (trap.type === 'moving') {
                x += trap.offset;
            }
            
            // الفخ
            this.ctx.fillStyle = trap.type === 'moving' ? this.colors.movingTrap : this.colors.trap;
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, trap.height);
            
            // تفاصيل الفخ
            this.ctx.fillStyle = '#ff7777';
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, 4);
            
            // أشواك
            this.ctx.fillStyle = '#ff5555';
            this.ctx.beginPath();
            this.ctx.moveTo(x - trap.width / 2, trap.y);
            this.ctx.lineTo(x - trap.width / 2 + 6, trap.y - 6);
            this.ctx.lineTo(x - trap.width / 2 + 12, trap.y);
            this.ctx.fill();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            
            this.ctx.save();
            this.ctx.translate(x, coin.y);
            this.ctx.rotate(coin.rotation);
            
            // العملة
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(1, '#ff9900');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // النجمة
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawTrail() {
        this.character.trail.forEach(point => {
            const alpha = point.life;
            const size = this.character.displaySize * alpha * 0.3;
            
            this.ctx.fillStyle = `rgba(77, 204, 255, ${alpha})`;
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
            this.ctx.shadowBlur = 20;
        }
        
        this.ctx.translate(this.character.x, this.character.y);
        this.ctx.rotate(this.character.rotation);
        
        // جسم الشخصية (الكبير)
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.character.displaySize);
        gradient.addColorStop(0, this.character.color);
        gradient.addColorStop(1, '#0099cc');
        this.ctx.fillStyle = gradient;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.character.displaySize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الوجه
        this.ctx.fillStyle = '#ffffff';
        
        // العينين
        this.ctx.beginPath();
        this.ctx.arc(-10, -8, 5, 0, Math.PI * 2);
        this.ctx.arc(10, -8, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // التلاميذ
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-8, -8, 2, 0, Math.PI * 2);
        this.ctx.arc(8, -8, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الفم
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 3, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // خوذة المهندس
        this.ctx.fillStyle = '#4dccff';
        this.ctx.fillRect(-15, -this.character.displaySize, 30, 10);
        
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
    
    // ===== دوال التحكم =====
    jump() {
        if (!this.gameActive || this.paused || this.gameOver) return;
        
        if (!this.character.isJumping || this.character.doubleJumps > 0) {
            this.character.isJumping = true;
            this.character.velocityY = -this.character.jumpPower;
            
            // استخدام القفزة المزدوجة
            if (this.character.isJumping && this.character.doubleJumps > 0) {
                this.character.doubleJumps--;
                this.doubleJumpElement.textContent = this.character.doubleJumps;
            }
            
            // الصوت
            this.audio.play('jump', 0.5);
            
            // جسيمات القفز
            for (let i = 0; i < 3; i++) {
                this.createParticle(
                    this.character.x,
                    this.character.y + this.character.size,
                    this.character.color,
                    2
                );
            }
        }
    }
    
    rotateHelix(delta) {
        if (!this.gameActive || this.paused) return;
        this.helixRotation += delta * 0.02;
    }
    
    // ===== دوال المساعدة =====
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('helixJumpHighScore', this.highScore);
        }
        
        // تحديث المستوى كل 200 نقطة
        const newLevel = Math.floor(this.score / 200) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.levelElement.textContent = this.level;
            this.platformSpeed += 0.2;
            this.showMessage(`🚀 المستوى ${this.level}!`);
        }
        
        this.updateUI();
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.highScoreElement.textContent = this.highScore;
        
        // تحديث شاشة الإيقاف المؤقت
        document.getElementById('pauseScore').textContent = this.score;
        document.getElementById('pauseLevel').textContent = this.level;
        
        // تحديث شاشة نهاية اللعبة
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('finalLevel').textContent = this.level;
    }
    
    createParticle(x, y, color, size) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            size: size,
            color: color,
            life: 1
        });
    }
    
    showMessage(text) {
        const popup = document.getElementById('messagePopup');
        const messageText = document.getElementById('messageText');
        
        messageText.textContent = text;
        popup.style.display = 'block';
        
        setTimeout(() => {
            popup.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300);
        }, 2000);
    }
    
    // ===== إدارة اللعبة =====
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            this.pauseScreen.style.display = 'flex';
            this.audio.bgMusic.pause();
        } else {
            this.pauseScreen.style.display = 'none';
            this.audio.bgMusic.play().catch(e => console.log('الموسيقى:', e));
        }
    }
    
    endGame() {
        this.gameActive = false;
        this.gameOver = true;
        
        // تحديث النتائج النهائية
        this.updateUI();
        
        // إظهار شاشة نهاية اللعبة
        this.gameOverScreen.style.display = 'flex';
        
        // الصوت
        this.audio.bgMusic.pause();
        this.audio.play('gameOver', 0.8);
        
        // جسيمات الانفجار
        for (let i = 0; i < 15; i++) {
            this.createParticle(
                this.character.x,
                this.character.y,
                '#ff3333',
                3
            );
        }
    }
    
    restartGame() {
        // إغلاق الشاشات
        this.pauseScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        
        // إعادة تشغيل اللعبة
        this.startGame();
    }
    
    // ===== حلقة اللعبة الرئيسية =====
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== بدء اللعبة =====
window.addEventListener('load', () => {
    const game = new HelixJump();
    console.log('🎮 Helix Jump - جاهز للعب!');
});
