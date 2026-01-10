// لعبة Helix Jump - النسخة المحسنة
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
        this.isJumping = false;
        this.helixRotation = 0;
        this.helixRotationSpeed = 0.04;
        this.platformGap = 180;
        
        // الشخصية - أكبر حجماً
        this.character = {
            x: this.canvas.width / 2,
            y: 150,
            radius: 25, // حجم أكبر
            imageRadius: 35, // حجم الصورة أكبر
            jumpHeight: 18,
            gravity: 0.8,
            velocityY: 0,
            isOnPlatform: false,
            rotation: 0,
            image: null,
            loaded: false
        };
        
        // عناصر اللعبة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.movingTraps = [];
        this.particles = [];
        
        // التحكم باللمس
        this.touchStartX = 0;
        this.isDragging = false;
        this.lastRotation = 0;
        
        // الألوان الجذابة
        this.colors = {
            helix: '#4a4a8a',
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
            particle3: '#ccff4d',
            background: '#0a0a1a',
            glow: '#ffffff'
        };
        
        // تحميل الصورة
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
            this.createDefaultCharacter();
            this.character.loaded = true;
        };
    }
    
    // إنشاء شكل افتراضي للشخصية
    createDefaultCharacter() {
        const canvas = document.createElement('canvas');
        canvas.width = 70;
        canvas.height = 70;
        const ctx = canvas.getContext('2d');
        
        // رسم شخصية جذابة
        // الجسم
        ctx.fillStyle = '#4dccff';
        ctx.beginPath();
        ctx.arc(35, 35, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // تفاصيل الجسم
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(35, 35, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // العيون
        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath();
        ctx.arc(25, 25, 6, 0, Math.PI * 2);
        ctx.arc(45, 25, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // الابتسامة
        ctx.beginPath();
        ctx.arc(35, 40, 10, 0, Math.PI, false);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0a0a1a';
        ctx.stroke();
        
        this.character.image = new Image();
        this.character.image.src = canvas.toDataURL();
    }
    
    // تهيئة اللعبة
    initGame() {
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isJumping = false;
        this.helixRotation = 0;
        this.character.x = this.canvas.width / 2;
        this.character.y = 150;
        this.character.velocityY = 0;
        this.character.isOnPlatform = false;
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.movingTraps = [];
        this.particles = [];
        
        // تحديث واجهة المستخدم
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.gameOverScreen.style.display = 'none';
        
        // إنشاء المنصات
        this.createPlatforms();
    }
    
    // إنشاء منصات متنوعة
    createPlatforms() {
        const platformCount = 25; // زيادة عدد المنصات
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const radius = 140;
            const y = i * this.platformGap + 300;
            
            // أنواع مختلفة من المنصات
            const platformType = Math.floor(Math.random() * 4);
            let width, height, color;
            
            switch(platformType) {
                case 0: // منصة عادية
                    width = 100;
                    height = 20;
                    color = this.colors.platform1;
                    break;
                case 1: // منصة متوسطة
                    width = 80;
                    height = 18;
                    color = this.colors.platform2;
                    break;
                case 2: // منصة صغيرة
                    width = 60;
                    height = 16;
                    color = this.colors.platform3;
                    break;
                case 3: // منصة كبيرة
                    width = 120;
                    height = 22;
                    color = this.colors.platform4;
                    break;
            }
            
            // تحديد إذا كانت المنصة سليمة أم بها فتحة
            const hasGap = Math.random() < 0.4; // 40% فرصة لوجود فجوة
            
            this.platforms.push({
                x: 0, // سيتم حسابها لاحقاً
                y: y,
                width: width,
                height: height,
                angle: angle,
                radius: radius,
                color: color,
                hasGap: hasGap,
                gapPosition: hasGap ? Math.random() * (width - 40) + 20 : 0,
                gapWidth: hasGap ? 40 : 0
            });
            
            // إضافة فخاخ عشوائية (30% فرصة)
            if (Math.random() < 0.3) {
                const trapType = Math.floor(Math.random() * 3);
                
                switch(trapType) {
                    case 0: // فخ ثابت
                        this.traps.push({
                            x: 0,
                            y: y - 10,
                            width: 25,
                            height: 12,
                            angle: angle,
                            type: 'static',
                            active: true,
                            pulse: 0
                        });
                        break;
                    case 1: // فخ متحرك
                        this.movingTraps.push({
                            x: 0,
                            y: y - 10,
                            width: 20,
                            height: 10,
                            angle: angle,
                            type: 'moving',
                            active: true,
                            speed: Math.random() * 2 + 1,
                            direction: Math.random() > 0.5 ? 1 : -1,
                            offset: 0
                        });
                        break;
                    case 2: // فخ مخفي
                        this.traps.push({
                            x: 0,
                            y: y - 10,
                            width: 22,
                            height: 8,
                            angle: angle,
                            type: 'hidden',
                            active: Math.random() < 0.5, // 50% فرصة أن يكون مخفياً
                            pulse: 0,
                            hidden: Math.random() < 0.5
                        });
                        break;
                }
            }
            
            // إضافة عملات (25% فرصة)
            if (Math.random() < 0.25) {
                this.coins.push({
                    x: 0,
                    y: y - 40,
                    radius: 12,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    glow: 0
                });
            }
        }
    }
    
    // رسم البرج الحلزوني الجذاب
    drawHelix() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // خلفية متدرجة للبرج
        const helixGradient = ctx.createRadialGradient(
            centerX, centerY, 100,
            centerX, centerY, 200
        );
        helixGradient.addColorStop(0, 'rgba(74, 74, 138, 0.8)');
        helixGradient.addColorStop(1, 'rgba(42, 42, 85, 0.4)');
        
        // رسم الخطوط الحلزونية مع تدرج لوني
        for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI * 2) / 16 + this.helixRotation;
            
            // تدرج لوني للخطوط
            const lineGradient = ctx.createLinearGradient(
                centerX + Math.cos(angle) * 30,
                0,
                centerX + Math.cos(angle) * 200,
                this.canvas.height
            );
            
            const colorValue = Math.sin(Date.now() / 1000 + i) * 0.3 + 0.7;
            lineGradient.addColorStop(0, `rgba(255, ${Math.floor(107 * colorValue)}, ${Math.floor(157 * colorValue)}, 0.4)`);
            lineGradient.addColorStop(1, `rgba(107, ${Math.floor(157 * colorValue)}, 255, 0.2)`);
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * 40, 0);
            ctx.lineTo(centerX + Math.cos(angle) * 180, this.canvas.height);
            ctx.stroke();
        }
        
        // رسم المركز مع تأثير glow
        ctx.shadowColor = this.colors.glow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    // رسم المنصات مع فتحات
    drawPlatforms() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        this.platforms.forEach((platform, index) => {
            // حساب موضع المنصة مع الدوران
            const rotatedAngle = platform.angle + this.helixRotation;
            const x = centerX + Math.cos(rotatedAngle) * platform.radius;
            
            // رسم المنصة
            ctx.save();
            
            // تأثير تدرج لوني للمنصة
            const platformGradient = ctx.createLinearGradient(
                x - platform.width/2, platform.y,
                x + platform.width/2, platform.y + platform.height
            );
            platformGradient.addColorStop(0, platform.color);
            platformGradient.addColorStop(1, this.darkenColor(platform.color, 40));
            
            ctx.fillStyle = platformGradient;
            
            if (platform.hasGap) {
                // رسم المنصة مع فجوة
                ctx.beginPath();
                
                // الجزء الأيسر من المنصة
                ctx.rect(
                    x - platform.width/2,
                    platform.y,
                    platform.gapPosition,
                    platform.height
                );
                
                // الجزء الأيمن من المنصة
                ctx.rect(
                    x - platform.width/2 + platform.gapPosition + platform.gapWidth,
                    platform.y,
                    platform.width - platform.gapPosition - platform.gapWidth,
                    platform.height
                );
                
                ctx.fill();
                
                // تأثير الجاذبية في الفجوة
                ctx.fillStyle = 'rgba(77, 204, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(
                    x - platform.width/2 + platform.gapPosition + platform.gapWidth/2,
                    platform.y + platform.height/2,
                    15, 0, Math.PI * 2
                );
                ctx.fill();
            } else {
                // منصة كاملة
                ctx.fillRect(
                    x - platform.width/2,
                    platform.y,
                    platform.width,
                    platform.height
                );
            }
            
            // تأثير ثلاثي الأبعاد للحواف
            ctx.strokeStyle = this.lightenColor(platform.color, 60);
            ctx.lineWidth = 2;
            ctx.strokeRect(
                x - platform.width/2,
                platform.y,
                platform.width,
                platform.height
            );
            
            // تأثير glow للمنصات القريبة
            if (Math.abs(platform.y - this.character.y) < 200) {
                ctx.shadowColor = platform.color;
                ctx.shadowBlur = 15;
                ctx.strokeRect(
                    x - platform.width/2,
                    platform.y,
                    platform.width,
                    platform.height
                );
                ctx.shadowBlur = 0;
            }
            
            ctx.restore();
        });
    }
    
    // رسم الفخاخ بأنواعها
    drawTraps() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        // رسم الفخاخ الثابتة والمخفية
        this.traps.forEach(trap => {
            if (!trap.active) return;
            
            const rotatedAngle = trap.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(trap.x - centerX, 2) + 
                Math.pow(trap.y - this.canvas.height/2, 2)
            );
            
            const x = centerX + Math.cos(rotatedAngle) * distance;
            const y = trap.y;
            
            trap.pulse += 0.1;
            const pulseSize = Math.sin(trap.pulse) * 3;
            
            ctx.save();
            
            if (trap.type === 'hidden' && trap.hidden) {
                // فخ مخفي (شفاف)
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = 'rgba(255, 102, 102, 0.5)';
            } else {
                // فخ عادي
                ctx.fillStyle = trap.type === 'static' ? this.colors.trap : this.colors.hiddenTrap;
            }
            
            // رسم الفخ مع تأثير النبض
            ctx.beginPath();
            ctx.roundRect(
                x - trap.width/2 - pulseSize/2,
                y - pulseSize/2,
                trap.width + pulseSize,
                trap.height + pulseSize,
                5
            );
            ctx.fill();
            
            // تفاصيل الفخ
            ctx.fillStyle = '#ff9999';
            ctx.fillRect(x - trap.width/2, y, trap.width, 3);
            
            // تأثير glow للفخاخ
            if (Math.abs(y - this.character.y) < 100) {
                ctx.shadowColor = '#ff4d4d';
                ctx.shadowBlur = 15;
                ctx.fillRect(x - trap.width/2, y, trap.width, trap.height);
                ctx.shadowBlur = 0;
            }
            
            ctx.restore();
        });
        
        // رسم الفخاخ المتحركة وتحديث حركتها
        this.movingTraps.forEach(trap => {
            if (!trap.active) return;
            
            trap.offset += trap.speed * trap.direction;
            if (Math.abs(trap.offset) > 30) {
                trap.direction *= -1;
            }
            
            const rotatedAngle = trap.angle + this.helixRotation;
            const x = centerX + Math.cos(rotatedAngle) * (140 + trap.offset);
            const y = trap.y;
            
            ctx.save();
            
            // تأثير متحرك
            const wave = Math.sin(Date.now() / 200 + trap.offset) * 2;
            
            ctx.fillStyle = this.colors.movingTrap;
            ctx.beginPath();
            ctx.roundRect(
                x - trap.width/2 + wave,
                y - 2,
                trap.width,
                trap.height + 4,
                4
            );
            ctx.fill();
            
            // تأثير الحركة
            ctx.fillStyle = '#ff6666';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    x - trap.width/2 + i * (trap.width/2) + wave,
                    y,
                    3,
                    trap.height
                );
            }
            
            ctx.restore();
        });
    }
    
    // رسم العملات
    drawCoins() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        
        this.coins.forEach(coin => {
            if (coin.collected) return;
            
            coin.rotation += 0.05;
            coin.glow = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            
            const rotatedAngle = coin.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(coin.x - centerX, 2) + 
                Math.pow(coin.y - this.canvas.height/2, 2)
            );
            
            const x = centerX + Math.cos(rotatedAngle) * distance;
            const y = coin.y;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(coin.rotation);
            
            // تأثير glow
            ctx.shadowColor = this.colors.coin;
            ctx.shadowBlur = 10 + coin.glow * 10;
            
            // العملة الخارجية
            ctx.fillStyle = this.colors.coin;
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // العملة الداخلية
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // تفاصيل العملة
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
            
            ctx.restore();
        });
    }
    
    // رسم الشخصية الكبيرة
    drawCharacter() {
        const ctx = this.ctx;
        
        ctx.save();
        
        // تأثير القفز
        if (this.isJumping) {
            ctx.shadowColor = this.colors.particle1;
            ctx.shadowBlur = 30;
            
            // تأثير تموج أثناء القفز
            const wave = Math.sin(Date.now() / 100) * 2;
            ctx.filter = `drop-shadow(0 0 10px rgba(77, 204, 255, 0.7))`;
        }
        
        // تدوير الشخصية أثناء القفز
        if (this.isJumping) {
            ctx.translate(this.character.x, this.character.y);
            this.character.rotation += 0.15;
            ctx.rotate(this.character.rotation);
            
            if (this.character.loaded && this.character.image) {
                ctx.drawImage(
                    this.character.image,
                    -this.character.imageRadius,
                    -this.character.imageRadius,
                    this.character.imageRadius * 2,
                    this.character.imageRadius * 2
                );
            } else {
                // شكل افتراضي
                ctx.fillStyle = this.colors.particle1;
                ctx.beginPath();
                ctx.arc(0, 0, this.character.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // الشخصية ثابتة (لا دوران)
            if (this.character.loaded && this.character.image) {
                ctx.drawImage(
                    this.character.image,
                    this.character.x - this.character.imageRadius,
                    this.character.y - this.character.imageRadius,
                    this.character.imageRadius * 2,
                    this.character.imageRadius * 2
                );
            } else {
                // شكل افتراضي
                ctx.fillStyle = this.colors.particle1;
                ctx.beginPath();
                ctx.arc(this.character.x, this.character.y, this.character.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // تأثير الهالة حول الشخصية
        ctx.shadowColor = this.colors.particle1;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            this.character.x,
            this.character.y,
            this.character.radius + 5,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        ctx.restore();
    }
    
    // رسم الجسيمات
    drawParticles() {
        this.particles.forEach((particle, index) => {
            particle.life -= 0.015;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.08;
            particle.rotation += 0.1;
            
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            
            if (particle.shape === 'star') {
                // شكل نجمة
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 72) * Math.PI / 180;
                    const x = Math.cos(angle) * particle.radius;
                    const y = Math.sin(angle) * particle.radius;
                    
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
            } else {
                // شكل دائرة
                this.ctx.arc(0, 0, particle.radius, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            this.ctx.restore();
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    // إنشاء جسيمات تأثير
    createParticles(x, y, count, color, shape = 'circle') {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                radius: Math.random() * 4 + 2,
                color: color,
                life: 1,
                shape: shape,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    // تحديث حركة الشخصية (قفزات صغيرة)
    updateCharacter() {
        if (this.gameOver) return;
        
        if (this.isJumping) {
            this.character.velocityY += this.character.gravity;
            this.character.y += this.character.velocityY;
            
            // التحقق من الاصطدام بالمنصات
            this.checkPlatformCollision();
            
            // التحقق من جمع العملات
            this.checkCoinCollection();
            
            // التحقق من الاصطدام بالفخاخ
            this.checkTrapCollision();
            
            // التحقق من خروج الشخصية من الشاشة
            if (this.character.y > this.canvas.height + 100) {
                this.gameOver = true;
                this.showGameOver();
            }
            
            // التحقق من وصول الشخصية للأسفل (المستوى التالي)
            if (this.character.y > this.canvas.height - 50 && !this.isJumping) {
                this.nextLevel();
            }
            
            // إضافة جسيمات أثناء القفز
            if (Math.random() < 0.3) {
                this.createParticles(
                    this.character.x,
                    this.character.y + this.character.radius,
                    1,
                    this.colors.particle1,
                    'star'
                );
            }
        }
    }
    
    // جعل الشخصية تقفز (قفزة صغيرة)
    jump() {
        if (!this.isJumping && !this.gameOver) {
            this.isJumping = true;
            this.character.velocityY = -this.character.jumpHeight;
            
            // تأثير القفز
            this.createParticles(
                this.character.x,
                this.character.y + this.character.radius,
                8,
                this.colors.particle1,
                'circle'
            );
        }
    }
    
    // التحقق من الاصطدام بالمنصات (مع مراعاة الفتحات)
    checkPlatformCollision() {
        const centerX = this.canvas.width / 2;
        
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            
            const rotatedAngle = platform.angle + this.helixRotation;
            const platformX = centerX + Math.cos(rotatedAngle) * platform.radius;
            
            // التحقق إذا كانت الشخصية فوق المنصة
            if (
                this.character.y + this.character.radius > platform.y &&
                this.character.y + this.character.radius < platform.y + platform.height + this.character.velocityY &&
                this.character.velocityY > 0
            ) {
                let isInGap = false;
                
                // التحقق إذا كانت الشخصية في الفجوة
                if (platform.hasGap) {
                    const charLeft = this.character.x - this.character.radius;
                    const charRight = this.character.x + this.character.radius;
                    const gapLeft = platformX - platform.width/2 + platform.gapPosition;
                    const gapRight = gapLeft + platform.gapWidth;
                    
                    if (charRight > gapLeft && charLeft < gapRight) {
                        isInGap = true;
                    }
                }
                
                // التحقق من الاصطدام بالجزء الصلب من المنصة
                if (!isInGap &&
                    this.character.x + this.character.radius > platformX - platform.width/2 &&
                    this.character.x - this.character.radius < platformX + platform.width/2) {
                    
                    // الهبوط على المنصة
                    this.isJumping = false;
                    this.character.y = platform.y - this.character.radius;
                    this.character.velocityY = 0;
                    this.character.rotation = 0;
                    
                    // زيادة النقاط
                    this.score += 10;
                    this.scoreElement.textContent = this.score;
                    
                    // تأثير الهبوط
                    this.createParticles(
                        this.character.x,
                        this.character.y + this.character.radius,
                        6,
                        platform.color,
                        'circle'
                    );
                    
                    break;
                }
            }
        }
    }
    
    // التحقق من جمع العملات
    checkCoinCollection() {
        const centerX = this.canvas.width / 2;
        
        for (let i = 0; i < this.coins.length; i++) {
            const coin = this.coins[i];
            
            if (coin.collected) continue;
            
            const rotatedAngle = coin.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(coin.x - centerX, 2) + 
                Math.pow(coin.y - this.canvas.height/2, 2)
            );
            
            const coinX = centerX + Math.cos(rotatedAngle) * distance;
            const coinY = coin.y;
            
            const dx = this.character.x - coinX;
            const dy = this.character.y - coinY;
            const distanceToCoin = Math.sqrt(dx * dx + dy * dy);
            
            if (distanceToCoin < this.character.radius + coin.radius) {
                coin.collected = true;
                this.score += 50;
                this.scoreElement.textContent = this.score;
                
                // تأثير جمع العملة
                this.createParticles(coinX, coinY, 15, this.colors.coin, 'star');
            }
        }
    }
    
    // التحقق من الاصطدام بالفخاخ
    checkTrapCollision() {
        const centerX = this.canvas.width / 2;
        
        // التحقق من الفخاخ الثابتة والمخفية
        for (let i = 0; i < this.traps.length; i++) {
            const trap = this.traps[i];
            
            if (!trap.active) continue;
            
            const rotatedAngle = trap.angle + this.helixRotation;
            const distance = Math.sqrt(
                Math.pow(trap.x - centerX, 2) + 
                Math.pow(trap.y - this.canvas.height/2, 2)
            );
            
            const trapX = centerX + Math.cos(rotatedAngle) * distance;
            const trapY = trap.y;
            
            if (this.checkTrapHit(trapX, trapY, trap.width, trap.height)) {
                this.handleTrapCollision(trapX, trapY);
                return;
            }
        }
        
        // التحقق من الفخاخ المتحركة
        for (let i = 0; i < this.movingTraps.length; i++) {
            const trap = this.movingTraps[i];
            
            if (!trap.active) continue;
            
            trap.offset += trap.speed * trap.direction;
            if (Math.abs(trap.offset) > 30) {
                trap.direction *= -1;
            }
            
            const rotatedAngle = trap.angle + this.helixRotation;
            const trapX = centerX + Math.cos(rotatedAngle) * (140 + trap.offset);
            const trapY = trap.y;
            
            if (this.checkTrapHit(trapX, trapY, trap.width, trap.height)) {
                this.handleTrapCollision(trapX, trapY);
                return;
            }
        }
    }
    
    // التحقق من ضربة الفخ
    checkTrapHit(trapX, trapY, trapWidth, trapHeight) {
        return (
            this.character.x + this.character.radius > trapX - trapWidth/2 &&
            this.character.x - this.character.radius < trapX + trapWidth/2 &&
            this.character.y + this.character.radius > trapY &&
            this.character.y - this.character.radius < trapY + trapHeight
        );
    }
    
    // معالجة الاصطدام بالفخ
    handleTrapCollision(trapX, trapY) {
        this.gameOver = true;
        
        // تأثير الانفجار
        this.createParticles(trapX, trapY, 25, this.colors.trap, 'star');
        this.createParticles(this.character.x, this.character.y, 20, this.colors.particle1, 'circle');
        
        this.showGameOver();
    }
    
    // الانتقال للمستوى التالي
    nextLevel() {
        this.level++;
        this.levelElement.textContent = this.level;
        
        // زيادة الصعوبة
        this.helixRotationSpeed = Math.min(0.06, this.helixRotationSpeed + 0.002);
        this.platformGap = Math.max(120, this.platformGap - 5);
        
        // إعادة تعيين موقع الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 150;
        this.isJumping = false;
        this.character.velocityY = 0;
        this.character.rotation = 0;
        
        // إنشاء منصات جديدة
        this.platforms = [];
        this.traps = [];
        this.coins = [];
        this.movingTraps = [];
        this.createPlatforms();
        
        // تأثير المستوى الجديد
        this.createParticles(
            this.canvas.width/2,
            this.canvas.height/2,
            30,
            this.colors.particle1,
            'star'
        );
    }
    
    // تدوير الأسطوانة
    rotateHelix(deltaX) {
        if (!this.gameOver) {
            this.helixRotation += deltaX * this.helixRotationSpeed;
            
            // إضافة جسيمات أثناء الدوران
            if (Math.abs(deltaX) > 0.5 && Math.random() < 0.1) {
                this.createParticles(
                    this.canvas.width/2 + Math.cos(this.helixRotation) * 160,
                    this.character.y,
                    1,
                    this.colors.particle2,
                    'circle'
                );
            }
        }
    }
    
    // التحكم باللمس
    handleTouchStart(e) {
        e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
        this.lastRotation = this.helixRotation;
    }
    
    handleTouchMove(e) {
        if (this.gameOver) return;
        e.preventDefault();
        
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - this.touchStartX;
        
        this.rotateHelix(deltaX * 0.01);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        // لا شيء - القفز يتم باللمس المنفصل
    }
    
    // معالجة اللمس للقفز
    handleJumpTouch(e) {
        if (this.gameOver) return;
        e.preventDefault();
        
        if (!this.isJumping) {
            this.jump();
        }
    }
    
    // التحكم بالفأرة
    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.lastRotation = this.helixRotation;
    }
    
    handleMouseMove(e) {
        if (!this.gameOver && e.buttons === 1) {
            const mouseX = e.clientX;
            const deltaX = mouseX - this.touchStartX;
            
            this.rotateHelix(deltaX * 0.01);
        }
    }
    
    handleMouseUp(e) {
        // لا شيء - القفز يتم بالنقر المنفصل
    }
    
    // معالجة النقر للقفز
    handleJumpClick(e) {
        if (this.gameOver) return;
        
        if (!this.isJumping) {
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.updateCharacter();
            
            this.particles.forEach(p => {
                p.life -= 0.01;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.06;
            });
            this.particles = this.particles.filter(p => p.life > 0);
            
            this.drawHelix();
            this.drawPlatforms();
            this.drawTraps();
            this.drawCoins();
            this.drawCharacter();
            this.drawParticles();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // دوال مساعدة للون
    darkenColor(color, amount) {
        let usePound = false;
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        const num = parseInt(color, 16);
        let r = (num >> 16) - amount;
        let g = ((num >> 8) & 0x00FF) - amount;
        let b = (num & 0x0000FF) - amount;
        
        r = r < 0 ? 0 : r;
        g = g < 0 ? 0 : g;
        b = b < 0 ? 0 : b;
        
        return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
    
    lightenColor(color, amount) {
        let usePound = false;
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        
        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;
        
        return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
    
    // تهيئة الأحداث
    initEvents() {
        // أحداث اللمس للتدوير
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // لمس منفصل للقفز (النقر في أي مكان)
        document.addEventListener('touchstart', (e) => {
            if (e.target === this.canvas) {
                this.handleJumpTouch(e);
            }
        });
        
        // أحداث الفأرة للتدوير
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // نقر منفصل للقفز
        this.canvas.addEventListener('click', (e) => this.handleJumpClick(e));
        
        // منع السياق الافتراضي
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // زر إعادة اللعب
        this.restartBtn.addEventListener('click', () => {
            this.initGame();
        });
        
        // أحداث لوحة المفاتيح (اختيارية)
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.rotateHelix(-10);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.rotateHelix(10);
                    break;
                case ' ':
                case 'ArrowUp':
                case 'w':
                    if (!this.isJumping) this.jump();
                    e.preventDefault();
                    break;
            }
        });
    }
}

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('load', () => {
    new HelixJumpGame();
    
    // إضافة دالة roundRect للكانفاس إذا لم تكن موجودة
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            this.beginPath();
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            this.closePath();
            return this;
        };
    }
});
