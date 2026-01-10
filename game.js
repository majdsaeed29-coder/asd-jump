// تهيئة اللعبة
class HelixJumpGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        // إعدادات اللعبة
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.helixRotation = 0;
        this.helixRotationSpeed = 0.03;
        this.platformGap = 150;
        this.trapProbability = 0.3;
        this.coinProbability = 0.2;
        
        // الشخصية
        this.character = {
            x: this.canvas.width / 2,
            y: 100,
            radius: 20,
            isJumping: false,
            jumpSpeed: 0,
            gravity: 0.25,
            rotation: 0,
            image: null,
            loaded: false
        };
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        // التحكم باللمس
        this.touchStartX = 0;
        this.isTouching = false;
        this.touchRotation = 0;
        
        // تهيئة الصورة
        this.loadCharacterImage();
        
        // تهيئة الأحداث
        this.initEvents();
        
        // بدء اللعبة
        this.initGame();
        this.gameLoop();
    }
    
    // تحميل صورة الشخصية
    loadCharacterImage() {
        this.character.image = new Image();
        this.character.image.src = 'assets/engineer.png';
        this.character.image.onload = () => {
            this.character.loaded = true;
        };
        this.character.image.onerror = () => {
            // إذا فشل تحميل الصورة، نستخدم شكل افتراضي
            this.createDefaultCharacter();
            this.character.loaded = true;
        };
    }
    
    // إنشاء شكل افتراضي للشخصية
    createDefaultCharacter() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // رسم شخصية بسيطة
        ctx.fillStyle = '#4dccff';
        ctx.beginPath();
        ctx.arc(20, 20, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // رسم تفاصيل
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(15, 15, 4, 0, Math.PI * 2);
        ctx.arc(25, 15, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(20, 25, 6, 0, Math.PI);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        this.character.image = new Image();
        this.character.image.src = canvas.toDataURL();
    }
    
    // تهيئة اللعبة
    initGame() {
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.helixRotation = 0;
        this.character.x = this.canvas.width / 2;
        this.character.y = 100;
        this.character.isJumping = false;
        this.character.jumpSpeed = 0;
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.particles = [];
        
        // تحديث واجهة المستخدم
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.gameOverScreen.style.display = 'none';
        
        // إنشاء المنصات
        this.createPlatforms();
    }
    
    // إنشاء المنصات
    createPlatforms() {
        const platformCount = 20;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const radius = 120;
            const x = this.canvas.width / 2 + Math.cos(angle) * radius;
            const y = i * this.platformGap + 200;
            const width = 80;
            const height = 15;
            
            this.platforms.push({
                x, y, width, height, angle, radius,
                color: i % 2 === 0 ? '#2a2a5a' : '#3a3a6a'
            });
            
            // إضافة فخاخ بشكل عشوائي
            if (Math.random() < this.trapProbability) {
                const trapWidth = 20;
                const trapX = x + Math.random() * (width - trapWidth);
                this.traps.push({
                    x: trapX,
                    y: y - 5,
                    width: trapWidth,
                    height: 10,
                    angle: angle,
                    active: true
                });
            }
            
            // إضافة عملات بشكل عشوائي
            if (Math.random() < this.coinProbability) {
                const coinX = x + Math.random() * (width - 20);
                this.coins.push({
                    x: coinX,
                    y: y - 30,
                    radius: 10,
                    collected: false,
                    angle: angle
                });
            }
        }
    }
    
    // رسم البرج الحلزوني
    drawHelix() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        // رسم العمود المركزي
        const gradient = ctx.createLinearGradient(centerX - 10, 0, centerX + 10, 0);
        gradient.addColorStop(0, '#222255');
        gradient.addColorStop(0.5, '#333366');
        gradient.addColorStop(1, '#222255');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 10, 0, 20, this.canvas.height);
        
        // رسم الخطوط الحلزونية
        ctx.strokeStyle = 'rgba(77, 204, 255, 0.3)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.helixRotation;
            const x1 = centerX + Math.cos(angle) * 30;
            const x2 = centerX + Math.cos(angle) * 200;
            
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x2, this.canvas.height);
            ctx.stroke();
        }
    }
    
    // رسم المنصات
    drawPlatforms() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach(platform => {
            // حساب موضع المنصة مع الدوران
            const rotatedAngle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(rotatedAngle) * platform.radius;
            
            // رسم المنصة
            ctx.fillStyle = platform.color;
            ctx.fillRect(x - platform.width/2, platform.y, platform.width, platform.height);
            
            // إضافة تأثير ثلاثي الأبعاد
            ctx.fillStyle = platform.color === '#2a2a5a' ? '#3a3a7a' : '#4a4a8a';
            ctx.fillRect(x - platform.width/2, platform.y, platform.width, 5);
            
            // رسم حواف المنصة
            ctx.strokeStyle = '#4dccff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - platform.width/2, platform.y, platform.width, platform.height);
        });
    }
    
    // رسم الفخاخ
    drawTraps() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active) return;
            
            // حساب موضع الفخ مع الدوران
            const rotatedAngle = trap.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(trap.x - centerX, 2) + 
                Math.pow(trap.y - this.canvas.height/2, 2)
            );
            
            const x = centerX + Math.cos(rotatedAngle) * distance;
            const y = trap.y;
            
            // رسم الفخ مع تأثير نبض
            const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
            
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(
                x - trap.width/2 * pulse, 
                y - 2 * pulse, 
                trap.width * pulse, 
                trap.height * pulse
            );
            
            // إضافة تفاصيل الفخ
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(x - trap.width/2, y, trap.width, 3);
        });
    }
    
    // رسم العملات
    drawCoins() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            // حساب موضع العملة مع الدوران
            const rotatedAngle = coin.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(coin.x - centerX, 2) + 
                Math.pow(coin.y - this.canvas.height/2, 2)
            );
            
            const x = centerX + Math.cos(rotatedAngle) * distance;
            const y = coin.y;
            
            // رسم العملة مع تأثير الدوران
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Date.now() / 500);
            
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // رسم الشخصية
    drawCharacter() {
        const ctx = this.ctx;
        
        // تأثير القفز
        if (this.character.isJumping) {
            ctx.shadowColor = '#4dccff';
            ctx.shadowBlur = 20;
        }
        
        // رسم الشخصية
        if (this.character.loaded && this.character.image) {
            ctx.save();
            ctx.translate(this.character.x, this.character.y);
            
            // تأثير القفز
            if (this.character.isJumping) {
                const stretch = 1 + Math.abs(this.character.jumpSpeed) * 0.02;
                ctx.scale(1, stretch);
            }
            
            // تدوير الشخصية أثناء القفز
            if (this.character.isJumping) {
                ctx.rotate(this.character.rotation);
                this.character.rotation += 0.1;
            }
            
            ctx.drawImage(
                this.character.image,
                -this.character.radius,
                -this.character.radius,
                this.character.radius * 2,
                this.character.radius * 2
            );
            ctx.restore();
        } else {
            // رسم شكل افتراضي مؤقت
            ctx.fillStyle = '#4dccff';
            ctx.beginPath();
            ctx.arc(this.character.x, this.character.y, this.character.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // إعادة ضبط الظل
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
    
    // رسم الجسيمات
    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach((particle, index) => {
            particle.life -= 0.02;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.05;
            
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        ctx.globalAlpha = 1;
    }
    
    // إنشاء جسيمات تأثير
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                radius: Math.random() * 3 + 1,
                color: color,
                life: 1
            });
        }
    }
    
    // تحديث حركة الشخصية
    updateCharacter() {
        if (this.gameOver) return;
        
        if (this.character.isJumping) {
            this.character.y += this.character.jumpSpeed;
            this.character.jumpSpeed += this.character.gravity;
            
            // التحقق من الاصطدام بالمنصات
            this.checkPlatformCollision();
            
            // التحقق من جمع العملات
            this.checkCoinCollection();
            
            // التحقق من الاصطدام بالفخاخ
            this.checkTrapCollision();
            
            // التحقق من خروج الشخصية من الشاشة
            if (this.character.y > this.canvas.height + 50) {
                this.gameOver = true;
                this.showGameOver();
            }
            
            // التحقق من وصول الشخصية للأسفل (المستوى التالي)
            if (this.character.y > this.canvas.height - 100 && !this.character.isJumping) {
                this.nextLevel();
            }
        }
    }
    
    // التحقق من الاصطدام بالمنصات
    checkPlatformCollision() {
        const centerX = this.canvas.width / 2;
        
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            
            // حساب موضع المنصة مع الدوران
            const rotatedAngle = platform.angle + this.helixRotation;
            const platformX = centerX + Math.cos(rotatedAngle) * platform.radius;
            
            // التحقق من الاصطدام
            if (
                this.character.x + this.character.radius > platformX - platform.width/2 &&
                this.character.x - this.character.radius < platformX + platform.width/2 &&
                this.character.y + this.character.radius > platform.y &&
                this.character.y + this.character.radius < platform.y + platform.height + this.character.jumpSpeed
            ) {
                // الهبوط على المنصة
                this.character.isJumping = false;
                this.character.y = platform.y - this.character.radius;
                this.character.jumpSpeed = 0;
                this.character.rotation = 0;
                
                // زيادة النقاط
                this.score += 10;
                this.scoreElement.textContent = this.score;
                
                // تأثير الهبوط
                this.createParticles(this.character.x, this.character.y, 8, '#4dccff');
                break;
            }
        }
    }
    
    // التحقق من جمع العملات
    checkCoinCollection() {
        const centerX = this.canvas.width / 2;
        
        for (let i = 0; i < this.coins.length; i++) {
            const coin = this.coins[i];
            
            if (coin.collected) continue;
            
            // حساب موضع العملة مع الدوران
            const rotatedAngle = coin.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(coin.x - centerX, 2) + 
                Math.pow(coin.y - this.canvas.height/2, 2)
            );
            
            const coinX = centerX + Math.cos(rotatedAngle) * distance;
            const coinY = coin.y;
            
            // حساب المسافة
            const dx = this.character.x - coinX;
            const dy = this.character.y - coinY;
            const distanceToCoin = Math.sqrt(dx * dx + dy * dy);
            
            // إذا التقطت العملة
            if (distanceToCoin < this.character.radius + coin.radius) {
                coin.collected = true;
                this.score += 50;
                this.scoreElement.textContent = this.score;
                
                // تأثير جمع العملة
                this.createParticles(coinX, coinY, 12, '#ffcc00');
            }
        }
    }
    
    // التحقق من الاصطدام بالفخاخ
    checkTrapCollision() {
        const centerX = this.canvas.width / 2;
        
        for (let i = 0; i < this.traps.length; i++) {
            const trap = this.traps[i];
            
            if (!trap.active) continue;
            
            // حساب موضع الفخ مع الدوران
            const rotatedAngle = trap.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(trap.x - centerX, 2) + 
                Math.pow(trap.y - this.canvas.height/2, 2)
            );
            
            const trapX = centerX + Math.cos(rotatedAngle) * distance;
            const trapY = trap.y;
            
            // التحقق من الاصطدام
            if (
                this.character.x + this.character.radius > trapX - trap.width/2 &&
                this.character.x - this.character.radius < trapX + trap.width/2 &&
                this.character.y + this.character.radius > trapY &&
                this.character.y - this.character.radius < trapY + trap.height
            ) {
                trap.active = false;
                this.gameOver = true;
                this.showGameOver();
                
                // تأثير الاصطدام
                this.createParticles(this.character.x, this.character.y, 20, '#ff3333');
                break;
            }
        }
    }
    
    // الانتقال للمستوى التالي
    nextLevel() {
        this.level++;
        this.levelElement.textContent = this.level;
        
        // زيادة الصعوبة
        this.trapProbability = Math.min(0.5, this.trapProbability + 0.05);
        this.helixRotationSpeed += 0.005;
        
        // إعادة تعيين موقع الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 100;
        this.character.isJumping = false;
        this.character.jumpSpeed = 0;
        this.character.rotation = 0;
        
        // إنشاء منصات جديدة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.createPlatforms();
        
        // تأثير المستوى الجديد
        this.createParticles(this.canvas.width/2, this.canvas.height/2, 25, '#4dccff');
    }
    
    // جعل الشخصية تقفز
    jump() {
        if (!this.character.isJumping && !this.gameOver) {
            this.character.isJumping = true;
            this.character.jumpSpeed = -12;
            
            // تأثير القفز
            this.createParticles(this.character.x, this.character.y + this.character.radius, 6, '#4dccff');
        }
    }
    
    // دوران البرج
    rotateHelix(direction) {
        if (!this.gameOver) {
            this.helixRotation += direction * this.helixRotationSpeed;
        }
    }
    
    // التحكم باللمس
    handleTouchStart(e) {
        e.preventDefault();
        this.isTouching = true;
        this.touchStartX = e.touches[0].clientX;
        this.touchRotation = this.helixRotation;
    }
    
    handleTouchMove(e) {
        if (!this.isTouching || this.gameOver) return;
        e.preventDefault();
        
        const touchX = e.touches[0].clientX;
        const diff = touchX - this.touchStartX;
        
        // حساب الدوران بناء على حركة الإصبع
        const rotationAmount = diff * 0.01;
        this.helixRotation = this.touchRotation + rotationAmount;
    }
    
    handleTouchEnd(e) {
        if (!this.isTouching) return;
        e.preventDefault();
        
        this.isTouching = false;
        
        // إذا كانت الشخصية لا تقفز، اجعلها تقفز
        if (!this.character.isJumping && !this.gameOver) {
            this.jump();
        }
    }
    
    // التحكم بالفأرة
    handleMouseDown(e) {
        this.isTouching = true;
        this.touchStartX = e.clientX;
        this.touchRotation = this.helixRotation;
    }
    
    handleMouseMove(e) {
        if (!this.isTouching || this.gameOver) return;
        
        const mouseX = e.clientX;
        const diff = mouseX - this.touchStartX;
        
        // حساب الدوران بناء على حركة الفأرة
        const rotationAmount = diff * 0.01;
        this.helixRotation = this.touchRotation + rotationAmount;
    }
    
    handleMouseUp(e) {
        if (!this.isTouching) return;
        
        this.isTouching = false;
        
        // إذا كانت الشخصية لا تقفز، اجعلها تقفز
        if (!this.character.isJumping && !this.gameOver) {
            this.jump();
        }
    }
    
    // عرض شاشة نهاية اللعبة
    showGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.style.display = 'flex';
    }
    
    // حلقة اللعبة الرئيسية
    gameLoop() {
        if (!this.gameOver) {
            // مسح الشاشة
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // تحديث حركة الشخصية
            this.updateCharacter();
            
            // تحديث الجسيمات
            this.particles.forEach(p => {
                p.life -= 0.01;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
            });
            this.particles = this.particles.filter(p => p.life > 0);
            
            // رسم عناصر اللعبة
            this.drawHelix();
            this.drawPlatforms();
            this.drawTraps();
            this.drawCoins();
            this.drawCharacter();
            this.drawParticles();
        }
        
        // استمرار حلقة اللعبة
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // تهيئة الأحداث
    initEvents() {
        // أحداث اللمس
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // أحداث الفأرة
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // منع السياق الافتراضي لللمس
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // زر إعادة اللعب
        this.restartBtn.addEventListener('click', () => {
            this.initGame();
        });
        
        // أحداث لوحة المفاتيح (للتجربة على الحاسوب)
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.rotateHelix(-1);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.rotateHelix(1);
                    break;
                case ' ':
                case 'ArrowUp':
                case 'w':
                    this.jump();
                    e.preventDefault();
                    break;
            }
        });
    }
}

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('load', () => {
    new HelixJumpGame();
});
