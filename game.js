// ==================== تهيئة اللعبة ====================
class HelixJumpGame {
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
        this.helixRotationSpeed = 0.03;
        this.platformGap = 180;
        
        // الشخصية
        this.character = {
            x: this.canvas.width / 2,
            y: 150,
            size: 25,
            displaySize: 35, // حجم العرض أكبر من حجم الاصطدام
            jumpPower: 14,
            gravity: 0.7,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            image: new Image()
        };
        
        // الصورة
        this.character.image.src = 'assets/engineer.png';
        
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
            hiddenTrap: '#ff6666',
            coin: '#ffcc00',
            particle1: '#4dccff',
            particle2: '#ff4dcc',
            helixLine: 'rgba(0, 255, 255, 0.3)'
        };
        
        // تهيئة
        this.init();
    }
    
    init() {
        // تحديث أعلى نتيجة
        this.highScoreElement.textContent = this.highScore;
        
        // إنشاء العناصر
        this.createGameElements();
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        // بدء اللعبة
        this.gameLoop();
    }
    
    // ==================== إنشاء العناصر ====================
    createGameElements() {
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        
        const platformCount = 20;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * this.platformGap;
            
            // منصة مع فتحة (40% فرصة)
            const hasGap = Math.random() < 0.4;
            const platformType = Math.floor(Math.random() * 4);
            
            this.platforms.push({
                x: 0,
                y: y,
                width: 90,
                height: 22,
                angle: angle,
                hasGap: hasGap,
                gapPos: hasGap ? Math.random() * 50 + 20 : 0,
                gapWidth: 45,
                color: this.colors[`platform${platformType + 1}`],
                type: platformType
            });
            
            // فخاخ (30% فرصة)
            if (Math.random() < 0.3) {
                const trapType = Math.floor(Math.random() * 3);
                let trapData = {
                    x: 0,
                    y: y - 12,
                    width: 26,
                    height: 14,
                    angle: angle,
                    type: trapType === 0 ? 'static' : trapType === 1 ? 'moving' : 'hidden',
                    active: true
                };
                
                if (trapType === 1) {
                    // فخ متحرك
                    trapData.speed = Math.random() * 1.5 + 0.5;
                    trapData.direction = Math.random() > 0.5 ? 1 : -1;
                    trapData.offset = 0;
                }
                
                if (trapType === 2) {
                    // فخ مخفي
                    trapData.hidden = Math.random() < 0.5;
                }
                
                this.traps.push(trapData);
            }
            
            // عملات (25% فرصة)
            if (Math.random() < 0.25) {
                this.coins.push({
                    x: 0,
                    y: y - 45,
                    radius: 13,
                    angle: angle,
                    collected: false,
                    rotation: 0
                });
            }
        }
    }
    
    // ==================== الرسم ====================
    drawHelix() {
        const centerX = this.canvas.width / 2;
        
        // الخطوط الحلزونية
        this.ctx.strokeStyle = this.colors.helixLine;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 45;
            const x2 = centerX + Math.cos(angle) * 185;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // المركز
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, this.canvas.height / 2, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            const x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            
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
                
                // الفجوة (شفافة)
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
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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
            
            // الفخاخ المتحركة
            if (trap.type === 'moving') {
                trap.offset += trap.speed * trap.direction;
                if (Math.abs(trap.offset) > 35) trap.direction *= -1;
                x += trap.offset;
            }
            
            // الفخاخ المخفية
            if (trap.type === 'hidden' && trap.hidden) {
                this.ctx.globalAlpha = 0.3;
            }
            
            // رسم الفخ
            this.ctx.fillStyle = trap.type === 'static' ? this.colors.trap : 
                                trap.type === 'moving' ? this.colors.movingTrap : 
                                this.colors.hiddenTrap;
            
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, trap.height);
            
            // تفاصيل الفخ
            this.ctx.fillStyle = trap.type === 'hidden' ? '#ff9999' : '#ff7777';
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, 4);
            
            // أشواك
            this.ctx.fillStyle = '#ff5555';
            this.ctx.beginPath();
            this.ctx.moveTo(x - trap.width / 2, trap.y);
            this.ctx.lineTo(x - trap.width / 2 + 6, trap.y - 6);
            this.ctx.lineTo(x - trap.width / 2 + 12, trap.y);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + trap.width / 2, trap.y);
            this.ctx.lineTo(x + trap.width / 2 - 6, trap.y - 6);
            this.ctx.lineTo(x + trap.width / 2 - 12, trap.y);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            coin.rotation += 0.04;
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            
            this.ctx.save();
            this.ctx.translate(x, coin.y);
            this.ctx.rotate(coin.rotation);
            
            // العملة
            this.ctx.fillStyle = this.colors.coin;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // التفاصيل
            this.ctx.fillStyle = '#ff9900';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawCharacter() {
        this.ctx.save();
        
        if (this.character.isJumping) {
            this.character.rotation += 0.15;
            this.ctx.shadowColor = this.colors.particle1;
            this.ctx.shadowBlur = 25;
        }
        
        this.ctx.translate(this.character.x, this.character.y);
        this.ctx.rotate(this.character.rotation);
        
        // رسم الصورة أو البديل
        if (this.character.image.complete) {
            this.ctx.drawImage(
                this.character.image,
                -this.character.displaySize,
                -this.character.displaySize,
                this.character.displaySize * 2,
                this.character.displaySize * 2
            );
        } else {
            // رسم بديل
            this.ctx.fillStyle = this.colors.particle1;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.character.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // الوجه
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(-10, -10, 5, 0, Math.PI * 2);
            this.ctx.arc(10, -10, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(0, 5, 8, 0, Math.PI);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }
    
    drawParticles() {
        this.particles.forEach((particle, index) => {
            particle.life -= 0.02;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            
            if (particle.shape === 'star') {
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 72) * Math.PI / 180;
                    const x = Math.cos(angle) * particle.size;
                    const y = Math.sin(angle) * particle.size;
                    if (i === 0) this.ctx.moveTo(x + particle.x, y + particle.y);
                    else this.ctx.lineTo(x + particle.x, y + particle.y);
                }
                this.ctx.closePath();
            } else {
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // ==================== الحركة والفيزياء ====================
    updateCharacter() {
        if (!this.character.isJumping) return;
        
        this.character.velocityY += this.character.gravity;
        this.character.y += this.character.velocityY;
        
        this.checkPlatformCollision();
        this.checkTrapCollision();
        this.checkCoinCollection();
        
        // جسيمات أثناء القفز
        if (Math.random() < 0.2) {
            this.createParticle(
                this.character.x,
                this.character.y + this.character.size,
                this.colors.particle1,
                'circle'
            );
        }
        
        // خروج من الشاشة
        if (this.character.y > this.canvas.height + 100) {
            this.endGame();
        }
        
        // نهاية المستوى
        if (this.character.y > this.canvas.height - 60 && !this.character.isJumping) {
            this.nextLevel();
        }
    }
    
    checkPlatformCollision() {
        const centerX = this.canvas.width / 2;
        
        for (let platform of this.platforms) {
            const x = centerX + Math.cos(platform.angle + this.helixRotation) * 145;
            
            // التحقق من الموضع العمودي
            if (this.character.y + this.character.size > platform.y &&
                this.character.y + this.character.size < platform.y + platform.height + this.character.velocityY &&
                this.character.velocityY > 0) {
                
                // التحقق من الموضع الأفقي
                if (this.character.x + this.character.size > x - platform.width / 2 &&
                    this.character.x - this.character.size < x + platform.width / 2) {
                    
                    // التحقق من الفجوة
                    let inGap = false;
                    if (platform.hasGap) {
                        const gapStart = x - platform.width / 2 + platform.gapPos;
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
                        
                        // إضافة النقاط
                        this.addScore(10);
                        this.createParticle(
                            this.character.x,
                            this.character.y + this.character.size,
                            platform.color,
                            'circle',
                            5
                        );
                        break;
                    }
                }
            }
        }
    }
    
    checkTrapCollision() {
        const centerX = this.canvas.width / 2;
        
        for (let trap of this.traps) {
            if (!trap.active) continue;
            
            let x = centerX + Math.cos(trap.angle + this.helixRotation) * 145;
            if (trap.type === 'moving') x += trap.offset;
            
            if (this.character.x + this.character.size > x - trap.width / 2 &&
                this.character.x - this.character.size < x + trap.width / 2 &&
                this.character.y + this.character.size > trap.y &&
                this.character.y - this.character.size < trap.y + trap.height) {
                
                this.createParticle(x, trap.y, this.colors.trap, 'star', 20);
                this.endGame();
                break;
            }
        }
    }
    
    checkCoinCollection() {
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            const x = centerX + Math.cos(coin.angle + this.helixRotation) * 145;
            const dx = this.character.x - x;
            const dy = this.character.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.size + coin.radius) {
                coin.collected = true;
                this.addScore(50);
                this.createParticle(x, coin.y, this.colors.coin, 'star', 12);
            }
        });
    }
    
    // ==================== التحكم ====================
    jump() {
        if (!this.character.isJumping && this.gameActive) {
            this.character.isJumping = true;
            this.character.velocityY = -this.character.jumpPower;
            
            this.createParticle(
                this.character.x,
                this.character.y + this.character.size,
                this.colors.particle1,
                'circle',
                8
            );
        }
    }
    
    rotateHelix(deltaX) {
        if (this.gameActive) {
            this.helixRotation += deltaX * this.helixRotationSpeed;
        }
    }
    
    // ==================== الأحداث ====================
    setupEventListeners() {
        // اللمس للتدوير
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
            
            this.rotateHelix(deltaX * 0.02);
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // الفأرة للتدوير
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastTouchX = e.clientX;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.gameActive) return;
            
            const currentX = e.clientX;
            const deltaX = currentX - this.lastTouchX;
            
            this.rotateHelix(deltaX * 0.02);
            this.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // النقر للقفز
        this.canvas.addEventListener('click', () => this.jump());
        
        // إعادة التشغيل
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // لوحة المفاتيح (اختياري)
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case ' ':
                case 'ArrowUp':
                    this.jump();
                    break;
                case 'ArrowLeft':
                    this.rotateHelix(-20);
                    break;
                case 'ArrowRight':
                    this.rotateHelix(20);
                    break;
            }
        });
    }
    
    // ==================== دوال المساعدة ====================
    addScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('helixJumpHighScore', this.highScore);
        }
    }
    
    nextLevel() {
        this.level++;
        this.levelElement.textContent = this.level;
        
        // زيادة الصعوبة
        this.helixRotationSpeed = Math.min(0.05, this.helixRotationSpeed + 0.001);
        
        // إعادة تعيين الشخصية
        this.character.y = 150;
        this.character.isJumping = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        
        // إنشاء عناصر جديدة
        this.createGameElements();
        
        // تأثير
        for (let i = 0; i < 30; i++) {
            this.createParticle(
                this.canvas.width / 2,
                this.canvas.height / 2,
                this.colors.particle1,
                'star'
            );
        }
    }
    
    endGame() {
        this.gameActive = false;
        
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.finalLevelElement.textContent = this.level;
        
        this.gameOverScreen.style.display = 'flex';
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.gameActive = true;
        this.helixRotation = 0;
        
        this.character.x = this.canvas.width / 2;
        this.character.y = 150;
        this.character.isJumping = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        
        this.scoreElement.textContent = '0';
        this.levelElement.textContent = '1';
        
        this.createGameElements();
        this.gameOverScreen.style.display = 'none';
    }
    
    createParticle(x, y, color, shape = 'circle', count = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                size: Math.random() * 3 + 1,
                color: color,
                life: 1,
                shape: shape
            });
        }
    }
    
    // ==================== حلقة اللعبة ====================
    gameLoop() {
        if (this.gameActive) {
            this.updateCharacter();
            
            // تحديث الجسيمات
            this.particles.forEach(p => {
                p.life -= 0.01;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08;
            });
            this.particles = this.particles.filter(p => p.life > 0);
            
            // الرسم
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.drawHelix();
            this.drawPlatforms();
            this.drawTraps();
            this.drawCoins();
            this.drawCharacter();
            this.drawParticles();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('load', () => {
    new HelixJumpGame();
});
