// ==================== إعدادات اللعبة الرئيسية ====================
const GameConfig = {
    VERSION: "2.0.0",
    DEBUG: false,
    INITIAL_SETTINGS: {
        sound: true,
        music: true,
        vibration: true,
        sensitivity: 5,
        jumpPower: 14,
        theme: 'default'
    },
    DIFFICULTY: {
        easy: { speed: 0.02, trapChance: 0.2, gapChance: 0.3 },
        medium: { speed: 0.03, trapChance: 0.3, gapChance: 0.4 },
        hard: { speed: 0.04, trapChance: 0.4, gapChance: 0.5 }
    },
    ACHIEVEMENTS: [
        { id: 'first_play', name: 'البداية', desc: 'ابدأ اللعبة لأول مرة', reward: 100 },
        { id: 'jump_master', name: 'القافز المحترف', desc: 'اقفز 50 قفزة ناجحة', reward: 500, target: 50 },
        { id: 'coin_collector', name: 'جامع الكنوز', desc: 'اجمع 100 عملة ذهبية', reward: 1000, target: 100 }
    ]
};

// ==================== فئة اللعبة الرئيسية ====================
class HelixJumpPro {
    constructor() {
        // العناصر الأساسية
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // عناصر واجهة المستخدم
        this.uiElements = this.initUIElements();
        
        // إعدادات اللعبة
        this.settings = this.loadSettings();
        this.gameState = {
            active: false,
            paused: false,
            gameOver: false,
            score: 0,
            level: 1,
            highScore: localStorage.getItem('helixJumpHighScore') || 0,
            coins: 150,
            jumps: 0,
            collectedCoins: 0,
            achievements: JSON.parse(localStorage.getItem('helixJumpAchievements')) || []
        };
        
        // إعدادات الفيزياء
        this.physics = {
            helixRotation: 0,
            helixSpeed: 0.03,
            platformGap: 200,
            gravity: 0.8,
            platformSpeed: 2, // المنصات تتحرك الآن
            platformTypes: 4
        };
        
        // إعدادات الشخصية (الكبير مع تصادم صغير)
        this.character = {
            x: this.canvas.width / 2,
            y: 150,
            size: 15, // حجم التصادم الصغير
            displaySize: 35, // حجم العرض الكبير
            radius: 15, // نصف قطر التصادم
            jumpPower: this.settings.jumpPower,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            color: '#4dccff',
            trail: [],
            powers: {
                shield: { active: false, duration: 0 },
                magnet: { active: false, duration: 0 },
                doubleJump: { active: false, jumpsLeft: 0 }
            }
        };
        
        // عناصر اللعبة
        this.elements = {
            platforms: [],
            traps: [],
            coins: [],
            particles: [],
            powerUps: []
        };
        
        // التحكم
        this.control = {
            isDragging: false,
            lastTouchX: 0,
            rotationSensitivity: this.settings.sensitivity / 10
        };
        
        // الصوتيات
        this.audio = this.initAudio();
        
        // التهيئة
        this.init();
    }
    
    // ==================== تهيئة العناصر ====================
    initUIElements() {
        return {
            // الشاشات
            startScreen: document.getElementById('startScreen'),
            settingsScreen: document.getElementById('settingsScreen'),
            achievementsScreen: document.getElementById('achievementsScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            shopScreen: document.getElementById('shopScreen'),
            
            // الأزرار
            startBtn: document.getElementById('startGameBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            achievementsBtn: document.getElementById('achievementsBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            mainMenuBtn: document.getElementById('mainMenuBtn'),
            restartGameBtn: document.getElementById('restartGameBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            backToMenuBtn: document.getElementById('backToMenuBtn'),
            backToMenuBtn2: document.getElementById('backToMenuBtn2'),
            shareScoreBtn: document.getElementById('shareScoreBtn'),
            continueBtn: document.getElementById('continueBtn'),
            closeShopBtn: document.getElementById('closeShopBtn'),
            shopBtn: document.getElementById('shopBtn'),
            
            // العناصر
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            highScore: document.getElementById('highScore'),
            finalScore: document.getElementById('finalScore'),
            finalHighScore: document.getElementById('finalHighScore'),
            finalLevel: document.getElementById('finalLevel'),
            finalCoins: document.getElementById('finalCoins'),
            shopCoins: document.getElementById('shopCoins'),
            
            // الإعدادات
            musicToggle: document.getElementById('musicToggle'),
            soundToggle: document.getElementById('soundToggle'),
            vibrationToggle: document.getElementById('vibrationToggle'),
            rotationSensitivity: document.getElementById('rotationSensitivity'),
            jumpPower: document.getElementById('jumpPower'),
            sensitivityValue: document.getElementById('sensitivityValue'),
            jumpValue: document.getElementById('jumpValue')
        };
    }
    
    initAudio() {
        return {
            jump: document.getElementById('jumpSound'),
            coin: document.getElementById('coinSound'),
            gameOver: document.getElementById('gameOverSound'),
            bgMusic: document.getElementById('bgMusic'),
            power: document.getElementById('powerSound'),
            
            play: function(sound, volume = 1.0) {
                if (!this[sound] || !game.settings.sound) return;
                this[sound].currentTime = 0;
                this[sound].volume = volume;
                this[sound].play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
            },
            
            playMusic: function() {
                if (!this.bgMusic || !game.settings.music) return;
                this.bgMusic.volume = 0.5;
                this.bgMusic.loop = true;
                this.bgMusic.play().catch(e => console.log('خطأ في تشغيل الموسيقى:', e));
            },
            
            stopMusic: function() {
                if (this.bgMusic) this.bgMusic.pause();
            }
        };
    }
    
    // ==================== دوال التحميل والحفظ ====================
    loadSettings() {
        const saved = JSON.parse(localStorage.getItem('helixJumpSettings'));
        return { ...GameConfig.INITIAL_SETTINGS, ...saved };
    }
    
    saveSettings() {
        localStorage.setItem('helixJumpSettings', JSON.stringify(this.settings));
        localStorage.setItem('helixJumpHighScore', this.gameState.highScore);
        localStorage.setItem('helixJumpCoins', this.gameState.coins);
        localStorage.setItem('helixJumpAchievements', JSON.stringify(this.gameState.achievements));
    }
    
    // ==================== التهيئة والإعداد ====================
    init() {
        // تحديث الواجهة
        this.updateUI();
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        // بدء الموسيقى
        if (this.settings.music) {
            this.audio.playMusic();
        }
        
        // عرض شاشة البداية
        this.uiElements.startScreen.classList.add('active');
        
        // التحديث الأولي
        this.updateSettingsUI();
        
        // بدء حلقة اللعبة
        this.gameLoop();
    }
    
    setupEventListeners() {
        // أحداث الشاشات
        this.uiElements.startBtn.addEventListener('click', () => this.startGame());
        this.uiElements.settingsBtn.addEventListener('click', () => this.showScreen('settings'));
        this.uiElements.achievementsBtn.addEventListener('click', () => this.showScreen('achievements'));
        this.uiElements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.uiElements.backToMenuBtn.addEventListener('click', () => this.showScreen('start'));
        this.uiElements.backToMenuBtn2.addEventListener('click', () => this.showScreen('start'));
        
        // أحداث اللعبة
        this.uiElements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.uiElements.resumeBtn.addEventListener('click', () => this.togglePause());
        this.uiElements.restartBtn.addEventListener('click', () => this.restartGame());
        this.uiElements.restartGameBtn.addEventListener('click', () => this.restartGame());
        this.uiElements.mainMenuBtn.addEventListener('click', () => this.showMainMenu());
        this.uiElements.shareScoreBtn.addEventListener('click', () => this.shareScore());
        this.uiElements.continueBtn.addEventListener('click', () => this.continueGame());
        this.uiElements.shopBtn.addEventListener('click', () => this.showScreen('shop'));
        this.uiElements.closeShopBtn.addEventListener('click', () => this.hideScreen('shop'));
        
        // أحداث الإعدادات
        this.uiElements.musicToggle.addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            e.target.checked ? this.audio.playMusic() : this.audio.stopMusic();
        });
        
        this.uiElements.soundToggle.addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
        });
        
        this.uiElements.vibrationToggle.addEventListener('change', (e) => {
            this.settings.vibration = e.target.checked;
        });
        
        this.uiElements.rotationSensitivity.addEventListener('input', (e) => {
            this.settings.sensitivity = parseInt(e.target.value);
            this.control.rotationSensitivity = this.settings.sensitivity / 10;
            this.uiElements.sensitivityValue.textContent = 
                this.settings.sensitivity < 4 ? 'بطيء' : 
                this.settings.sensitivity > 7 ? 'سريع' : 'متوسط';
        });
        
        this.uiElements.jumpPower.addEventListener('input', (e) => {
            this.settings.jumpPower = parseInt(e.target.value);
            this.character.jumpPower = this.settings.jumpPower;
            this.uiElements.jumpValue.textContent = this.settings.jumpPower;
        });
        
        // أحداث التحكم
        this.setupControlEvents();
        
        // أحداث الشراء من المتجر
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.shop-item').dataset.item;
                this.buyPowerUp(item);
            });
        });
        
        // اختيار الشخصية
        document.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.character-option').forEach(o => o.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.character.color = this.getCharacterColor(e.currentTarget.dataset.character);
            });
        });
        
        // اختيار مستوى الصعوبة
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.setDifficulty(e.currentTarget.dataset.difficulty);
            });
        });
        
        // اختيار السمة
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.changeTheme(e.currentTarget.dataset.theme);
            });
        });
    }
    
    setupControlEvents() {
        // التحكم باللمس
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState.paused || this.gameState.gameOver) return;
            
            this.control.isDragging = true;
            this.control.lastTouchX = e.touches[0].clientX;
            
            // القفز إذا لم يكن سحب
            if (!this.control.isDragging) {
                this.jump();
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.control.isDragging || this.gameState.paused) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.control.lastTouchX;
            
            this.rotateHelix(deltaX);
            this.control.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.control.isDragging = false;
            
            // إذا لم يكن هناك سحب، قفز
            if (!this.control.wasDragging) {
                this.jump();
            }
            this.control.wasDragging = false;
        });
        
        // التحكم بالفأرة
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState.paused || this.gameState.gameOver) return;
            
            this.control.isDragging = true;
            this.control.lastTouchX = e.clientX;
            this.control.wasDragging = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.control.isDragging || this.gameState.paused) return;
            
            this.control.wasDragging = true;
            const currentX = e.clientX;
            const deltaX = currentX - this.control.lastTouchX;
            
            this.rotateHelix(deltaX);
            this.control.lastTouchX = currentX;
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (!this.control.wasDragging && this.gameState.active) {
                this.jump();
            }
            this.control.isDragging = false;
        });
        
        // التحكم بلوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (this.gameState.paused || this.gameState.gameOver) return;
            
            switch(e.key) {
                case ' ':
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.jump();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.rotateHelix(-20);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.rotateHelix(20);
                    break;
                case 'Escape':
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
    }
    
    // ==================== دوال اللعبة الأساسية ====================
    startGame() {
        this.gameState.active = true;
        this.gameState.paused = false;
        this.gameState.gameOver = false;
        this.gameState.score = 0;
        this.gameState.level = 1;
        
        // إخفاء شاشة البداية وإظهار اللعبة
        this.hideScreen('start');
        document.querySelector('.container').style.display = 'block';
        
        // إنشاء العناصر
        this.createGameElements();
        
        // تحديث الواجهة
        this.updateUI();
        
        // تشغيل الموسيقى
        if (this.settings.music) {
            this.audio.playMusic();
        }
        
        // تسجيل الإنجاز الأول
        this.unlockAchievement('first_play');
        
        // إظهار رسالة الترحيب
        this.showMessage('حظاً موفقاً! 🚀');
    }
    
    createGameElements() {
        this.elements.platforms = [];
        this.elements.traps = [];
        this.elements.coins = [];
        this.elements.particles = [];
        this.elements.powerUps = [];
        
        const platformCount = 25;
        
        for (let i = 0; i < platformCount; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const y = 300 + i * this.physics.platformGap;
            
            // إنشاء المنصة
            const platformType = Math.floor(Math.random() * this.physics.platformTypes);
            const hasGap = Math.random() < 0.4;
            
            this.elements.platforms.push({
                x: 0,
                y: y,
                width: 100,
                height: 25,
                angle: angle,
                hasGap: hasGap,
                gapPos: hasGap ? Math.random() * 60 + 20 : 0,
                gapWidth: 55,
                color: this.getPlatformColor(platformType),
                type: platformType,
                speed: this.physics.platformSpeed,
                moving: Math.random() < 0.3,
                moveDirection: Math.random() > 0.5 ? 1 : -1,
                moveOffset: 0
            });
            
            // إنشاء الفخاخ
            if (Math.random() < 0.3) {
                const trapType = Math.floor(Math.random() * 4);
                const trap = {
                    x: 0,
                    y: y - 15,
                    width: 30,
                    height: 18,
                    angle: angle,
                    type: ['static', 'moving', 'hidden', 'spinning'][trapType],
                    active: true,
                    rotation: 0
                };
                
                if (trap.type === 'moving') {
                    trap.speed = Math.random() * 2 + 1;
                    trap.direction = Math.random() > 0.5 ? 1 : -1;
                    trap.offset = 0;
                }
                
                if (trap.type === 'spinning') {
                    trap.speed = Math.random() * 0.05 + 0.02;
                }
                
                this.elements.traps.push(trap);
            }
            
            // إنشاء العملات
            if (Math.random() < 0.25) {
                this.elements.coins.push({
                    x: 0,
                    y: y - 50,
                    radius: 16,
                    angle: angle,
                    collected: false,
                    rotation: 0,
                    value: 10,
                    type: Math.random() < 0.1 ? 'special' : 'normal'
                });
            }
            
            // إنشاء القوى الخاصة
            if (Math.random() < 0.1) {
                const powerTypes = ['shield', 'magnet', 'doublejump'];
                const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
                
                this.elements.powerUps.push({
                    x: 0,
                    y: y - 80,
                    radius: 20,
                    angle: angle,
                    collected: false,
                    type: powerType,
                    rotation: 0
                });
            }
        }
    }
    
    // ==================== الفيزياء والحركة ====================
    updatePhysics() {
        if (!this.gameState.active || this.gameState.paused || this.gameState.gameOver) return;
        
        // تحديث دوران الشخصية
        if (this.character.isJumping) {
            this.character.rotation += 0.15;
        }
        
        // تطبيق الجاذبية
        if (this.character.isJumping) {
            this.character.velocityY += this.physics.gravity;
            this.character.y += this.character.velocityY;
            
            // إضافة أثر القفز
            if (Math.random() < 0.3) {
                this.createParticle(
                    this.character.x,
                    this.character.y + this.character.size,
                    this.character.color,
                    'circle',
                    3
                );
            }
            
            // تحديث الأثر
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
        }
        
        // تحريك المنصات للأسفل
        this.elements.platforms.forEach(platform => {
            platform.y -= platform.speed;
            
            // إعادة المنصات التي خرجت من الأعلى
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
        
        // تحريك الفخاخ والعملات مع المنصات
        this.elements.traps.forEach(trap => {
            trap.y -= this.physics.platformSpeed;
            if (trap.y < -100) {
                trap.y = this.canvas.height + 100;
                trap.angle = Math.random() * Math.PI * 2;
            }
        });
        
        this.elements.coins.forEach(coin => {
            coin.y -= this.physics.platformSpeed;
            if (coin.y < -100) {
                coin.y = this.canvas.height + 100;
                coin.angle = Math.random() * Math.PI * 2;
            }
        });
        
        this.elements.powerUps.forEach(power => {
            power.y -= this.physics.platformSpeed;
            if (power.y < -100) {
                power.y = this.canvas.height + 100;
                power.angle = Math.random() * Math.PI * 2;
            }
        });
        
        // تحديث الفخاخ المتحركة والدوارة
        this.elements.traps.forEach(trap => {
            if (trap.type === 'moving') {
                trap.offset += trap.speed * trap.direction;
                if (Math.abs(trap.offset) > 40) trap.direction *= -1;
            }
            if (trap.type === 'spinning') {
                trap.rotation += trap.speed;
            }
        });
        
        // تحديث دوران العملات
        this.elements.coins.forEach(coin => {
            coin.rotation += 0.05;
        });
        
        // تحديث دوران القوى
        this.elements.powerUps.forEach(power => {
            power.rotation += 0.03;
        });
        
        // تحديث الجسيمات
        this.elements.particles.forEach((particle, index) => {
            particle.life -= 0.02;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            
            if (particle.life <= 0) {
                this.elements.particles.splice(index, 1);
            }
        });
        
        // تحديث القوى النشطة
        this.updateActivePowers();
        
        // التحقق من التصادمات
        this.checkCollisions();
        
        // التحقق من خروج الشخصية
        if (this.character.y > this.canvas.height + 100) {
            this.endGame();
        }
    }
    
    // ==================== التصادمات ====================
    checkCollisions() {
        const centerX = this.canvas.width / 2;
        
        // التصادم مع المنصات
        for (let platform of this.elements.platforms) {
            if (platform.y > this.canvas.height || platform.y < 0) continue;
            
            const platformX = centerX + Math.cos(platform.angle + this.physics.helixRotation) * 145;
            const actualX = platform.moving ? platformX + platform.moveOffset : platformX;
            
            // التحقق من الهبوط
            if (this.character.y + this.character.size > platform.y &&
                this.character.y + this.character.size < platform.y + platform.height + this.character.velocityY &&
                this.character.velocityY > 0) {
                
                // التحقق من الموضع الأفقي
                if (this.character.x + this.character.radius > actualX - platform.width / 2 &&
                    this.character.x - this.character.radius < actualX + platform.width / 2) {
                    
                    // التحقق من الفجوة
                    let inGap = false;
                    if (platform.hasGap) {
                        const gapStart = actualX - platform.width / 2 + platform.gapPos;
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
                        this.gameState.jumps++;
                        
                        // إنشاء جسيمات
                        this.createParticle(
                            this.character.x,
                            this.character.y + this.character.size,
                            platform.color,
                            'circle',
                            8
                        );
                        
                        // الاهتزاز
                        if (this.settings.vibration && 'vibrate' in navigator) {
                            navigator.vibrate(50);
                        }
                        
                        // التحقق من الإنجازات
                        if (this.gameState.jumps >= 50) {
                            this.unlockAchievement('jump_master');
                        }
                        
                        break;
                    }
                }
            }
        }
        
        // التصادم مع الفخاخ
        if (!this.character.powers.shield.active) {
            for (let trap of this.elements.traps) {
                if (!trap.active || trap.y > this.canvas.height || trap.y < 0) continue;
                
                let trapX = centerX + Math.cos(trap.angle + this.physics.helixRotation) * 145;
                
                if (trap.type === 'moving') {
                    trapX += trap.offset;
                }
                
                // استخدام نصف قطر التصادم الصغير للفخاخ
                const dx = this.character.x - trapX;
                const dy = this.character.y - trap.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.character.radius + Math.max(trap.width, trap.height) / 2) {
                    this.hitTrap(trap);
                    break;
                }
            }
        }
        
        // جمع العملات
        for (let coin of this.elements.coins) {
            if (coin.collected || coin.y > this.canvas.height || coin.y < 0) continue;
            
            const coinX = centerX + Math.cos(coin.angle + this.physics.helixRotation) * 145;
            const dx = this.character.x - coinX;
            const dy = this.character.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize + coin.radius) {
                this.collectCoin(coin);
            }
        }
        
        // جمع القوى
        for (let power of this.elements.powerUps) {
            if (power.collected || power.y > this.canvas.height || power.y < 0) continue;
            
            const powerX = centerX + Math.cos(power.angle + this.physics.helixRotation) * 145;
            const dx = this.character.x - powerX;
            const dy = this.character.y - power.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.character.displaySize + power.radius) {
                this.collectPowerUp(power);
            }
        }
    }
    
    hitTrap(trap) {
        // إنشاء جسيمات الانفجار
        for (let i = 0; i < 20; i++) {
            this.createParticle(
                this.character.x,
                this.character.y,
                '#ff3333',
                'star',
                3
            );
        }
        
        // الصوت
        this.audio.play('gameOver', 0.7);
        
        // الاهتزاز
        if (this.settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // نهاية اللعبة
        this.endGame();
    }
    
    collectCoin(coin) {
        coin.collected = true;
        
        // إضافة النقاط والعملات
        const coinValue = coin.type === 'special' ? 50 : 10;
        this.addScore(coinValue);
        this.gameState.coins += coinValue;
        this.gameState.collectedCoins++;
        
        // الصوت
        this.audio.play('coin', 0.5);
        
        // إنشاء جسيمات
        for (let i = 0; i < 10; i++) {
            this.createParticle(
                this.character.x,
                this.character.y,
                '#ffcc00',
                'star',
                2
            );
        }
        
        // تحديث الواجهة
        this.updateUI();
        
        // التحقق من الإنجازات
        if (this.gameState.collectedCoins >= 100) {
            this.unlockAchievement('coin_collector');
        }
        
        // إظهار رسالة
        this.showMessage(`+${coinValue} عملة! 🪙`);
    }
    
    collectPowerUp(power) {
        power.collected = true;
        
        // تفعيل القوة
        switch(power.type) {
            case 'shield':
                this.character.powers.shield = { active: true, duration: 300 };
                break;
            case 'magnet':
                this.character.powers.magnet = { active: true, duration: 200 };
                break;
            case 'doublejump':
                this.character.powers.doubleJump = { active: true, jumpsLeft: 2 };
                break;
        }
        
        // الصوت
        this.audio.play('power', 0.6);
        
        // إنشاء جسيمات
        for (let i = 0; i < 15; i++) {
            this.createParticle(
                this.character.x,
                this.character.y,
                this.getPowerColor(power.type),
                'circle',
                3
            );
        }
        
        // تحديث عرض القوى النشطة
        this.updateActivePowersDisplay();
        
        // إظهار رسالة
        this.showMessage(`قوة ${this.getPowerName(power.type)} مفعلة! ⚡`);
    }
    
    // ==================== الرسم ====================
    draw() {
        if (!this.gameState.active) return;
        
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
        this.drawPowerUps();
        
        // رسم أثر الشخصية
        this.drawTrail();
        
        // رسم الشخصية
        this.drawCharacter();
        
        // رسم الجسيمات
        this.drawParticles();
        
        // رسم الدرع إذا كان نشطاً
        if (this.character.powers.shield.active) {
            this.drawShield();
        }
    }
    
    drawBackground() {
        // خلفية متدرجة
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#151530');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // النجوم
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 17) % this.canvas.width;
            const y = (i * 23) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawHelix() {
        const centerX = this.canvas.width / 2;
        
        this.ctx.strokeStyle = 'rgba(77, 204, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + this.physics.helixRotation;
            const x1 = centerX + Math.cos(angle) * 50;
            const x2 = centerX + Math.cos(angle) * 200;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, 0);
            this.ctx.lineTo(x2, this.canvas.height);
            this.ctx.stroke();
        }
        
        // المركز
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, this.canvas.height / 2, 45, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPlatforms() {
        const centerX = this.canvas.width / 2;
        
        this.elements.platforms.forEach(platform => {
            if (platform.y > this.canvas.height || platform.y < -platform.height) return;
            
            let x = centerX + Math.cos(platform.angle + this.physics.helixRotation) * 145;
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
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
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
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
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
        
        this.elements.traps.forEach(trap => {
            if (!trap.active || trap.y > this.canvas.height || trap.y < -trap.height) return;
            
            this.ctx.save();
            
            let x = centerX + Math.cos(trap.angle + this.physics.helixRotation) * 145;
            
            if (trap.type === 'moving') {
                x += trap.offset;
            }
            
            if (trap.type === 'spinning') {
                this.ctx.translate(x, trap.y + trap.height / 2);
                this.ctx.rotate(trap.rotation);
                this.ctx.translate(-x, -(trap.y + trap.height / 2));
            }
            
            // الفخ الأساسي
            this.ctx.fillStyle = trap.type === 'hidden' ? '#ff6666' : 
                                trap.type === 'moving' ? '#ff3333' : 
                                trap.type === 'spinning' ? '#ff5555' : '#ff4d4d';
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, trap.height);
            
            // تفاصيل الفخ
            this.ctx.fillStyle = '#ff7777';
            this.ctx.fillRect(x - trap.width / 2, trap.y, trap.width, 4);
            
            // أشواك
            this.ctx.fillStyle = '#ff5555';
            for (let i = 0; i < 3; i++) {
                const spikeX = x - trap.width / 2 + (i + 1) * (trap.width / 4);
                this.ctx.beginPath();
                this.ctx.moveTo(spikeX, trap.y);
                this.ctx.lineTo(spikeX - 5, trap.y - 8);
                this.ctx.lineTo(spikeX + 5, trap.y);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawCoins() {
        const centerX = this.canvas.width / 2;
        
        this.elements.coins.forEach(coin => {
            if (coin.collected || coin.y > this.canvas.height || coin.y < -50) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(coin.angle + this.physics.helixRotation) * 145;
            this.ctx.translate(x, coin.y);
            this.ctx.rotate(coin.rotation);
            
            // العملة الذهبية
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(1, '#ff9900');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // النجمة
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('★', 0, 0);
            
            // توهج العملات الخاصة
            if (coin.type === 'special') {
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        });
    }
    
    drawPowerUps() {
        const centerX = this.canvas.width / 2;
        
        this.elements.powerUps.forEach(power => {
            if (power.collected || power.y > this.canvas.height || power.y < -50) return;
            
            this.ctx.save();
            
            const x = centerX + Math.cos(power.angle + this.physics.helixRotation) * 145;
            this.ctx.translate(x, power.y);
            this.ctx.rotate(power.rotation);
            
            // خلفية القوة
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, power.radius);
            gradient.addColorStop(0, this.getPowerColor(power.type));
            gradient.addColorStop(1, this.getPowerDarkColor(power.type));
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, power.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // رمز القوة
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let icon = '';
            switch(power.type) {
                case 'shield': icon = '🛡️'; break;
                case 'magnet': icon = '🧲'; break;
                case 'doublejump': icon = '↕️'; break;
            }
            
            this.ctx.fillText(icon, 0, 0);
            
            // توهج
            this.ctx.shadowColor = this.getPowerColor(power.type);
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, power.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            this.ctx.restore();
        });
    }
    
    drawCharacter() {
        this.ctx.save();
        
        // تأثير التوهج أثناء القفز
        if (this.character.isJumping) {
            this.ctx.shadowColor = this.character.color;
            this.ctx.shadowBlur = 25;
        }
        
        this.ctx.translate(this.character.x, this.character.y);
        this.ctx.rotate(this.character.rotation);
        
        // جسم الشخصية (الكبير للعرض)
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.character.displaySize);
        gradient.addColorStop(0, this.character.color);
        gradient.addColorStop(1, this.darkenColor(this.character.color, 40));
        this.ctx.fillStyle = gradient;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.character.displaySize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الوجه
        this.ctx.fillStyle = '#ffffff';
        
        // العينين
        this.ctx.beginPath();
        this.ctx.arc(-12, -10, 6, 0, Math.PI * 2);
        this.ctx.arc(12, -10, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // التلاميذ
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-10, -10, 3, 0, Math.PI * 2);
        this.ctx.arc(10, -10, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // الفم
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 5, 10, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // تأثير الحزن عند نهاية اللعبة
        if (this.gameState.gameOver) {
            this.ctx.beginPath();
            this.ctx.arc(0, 5, 10, 1.2 * Math.PI, 1.8 * Math.PI);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
        
        // رسم دائرة التصادم للتصحيح (للتطوير فقط)
        if (GameConfig.DEBUG) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.character.x, this.character.y, this.character.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawTrail() {
        this.character.trail.forEach((point, index) => {
            const alpha = point.life;
            const size = this.character.displaySize * alpha * 0.5;
            
            this.ctx.fillStyle = `rgba(77, 204, 255, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawShield() {
        this.ctx.strokeStyle = 'rgba(77, 204, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.character.x, this.character.y, this.character.displaySize + 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // تأثير الدرع
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(this.character.x, this.character.y, this.character.displaySize + 12, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawParticles() {
        this.elements.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            if (particle.shape === 'star') {
                this.drawStar(particle.x, particle.y, particle.size);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawStar(x, y, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const radius = i % 2 === 0 ? size : size / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    // ==================== دوال المساعدة ====================
    jump() {
        if (!this.gameState.active || this.gameState.paused || this.gameState.gameOver) return;
        
        if (!this.character.isJumping || this.character.powers.doubleJump.active) {
            this.character.isJumping = true;
            this.character.velocityY = -this.character.jumpPower;
            
            // استخدام القفز المزدوج
            if (this.character.powers.doubleJump.active) {
                this.character.powers.doubleJump.jumpsLeft--;
                if (this.character.powers.doubleJump.jumpsLeft <= 0) {
                    this.character.powers.doubleJump.active = false;
                    this.updateActivePowersDisplay();
                }
            }
            
            // الصوت
            this.audio.play('jump', 0.3);
            
            // إنشاء جسيمات القفز
            for (let i = 0; i < 5; i++) {
                this.createParticle(
                    this.character.x,
                    this.character.y + this.character.size,
                    this.character.color,
                    'circle',
                    2
                );
            }
        }
    }
    
    rotateHelix(deltaX) {
        if (!this.gameState.active || this.gameState.paused) return;
        
        this.physics.helixRotation += deltaX * this.control.rotationSensitivity * 0.02;
    }
    
    addScore(points) {
        this.gameState.score += points;
        if (this.gameState.score > this.gameState.highScore) {
            this.gameState.highScore = this.gameState.score;
        }
        this.updateUI();
    }
    
    updateUI() {
        this.uiElements.score.textContent = this.gameState.score;
        this.uiElements.level.textContent = this.gameState.level;
        this.uiElements.highScore.textContent = this.gameState.highScore;
        this.uiElements.shopCoins.textContent = this.gameState.coins;
    }
    
    updateSettingsUI() {
        this.uiElements.musicToggle.checked = this.settings.music;
        this.uiElements.soundToggle.checked = this.settings.sound;
        this.uiElements.vibrationToggle.checked = this.settings.vibration;
        this.uiElements.rotationSensitivity.value = this.settings.sensitivity;
        this.uiElements.jumpPower.value = this.settings.jumpPower;
        this.uiElements.sensitivityValue.textContent = 
            this.settings.sensitivity < 4 ? 'بطيء' : 
            this.settings.sensitivity > 7 ? 'سريع' : 'متوسط';
        this.uiElements.jumpValue.textContent = this.settings.jumpPower;
    }
    
    createParticle(x, y, color, shape = 'circle', count = 1) {
        for (let i = 0; i < count; i++) {
            this.elements.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                size: Math.random() * 4 + 1,
                color: color,
                life: 1,
                shape: shape
            });
        }
    }
    
    updateActivePowers() {
        // تحديث الدرع
        if (this.character.powers.shield.active) {
            this.character.powers.shield.duration--;
            if (this.character.powers.shield.duration <= 0) {
                this.character.powers.shield.active = false;
                this.updateActivePowersDisplay();
            }
        }
        
        // تحديث المغناطيس
        if (this.character.powers.magnet.active) {
            this.character.powers.magnet.duration--;
            if (this.character.powers.magnet.duration <= 0) {
                this.character.powers.magnet.active = false;
                this.updateActivePowersDisplay();
            }
        }
    }
    
    updateActivePowersDisplay() {
        const powerElements = document.querySelectorAll('.power-item');
        
        powerElements.forEach(el => {
            const powerType = el.dataset.power;
            const timer = el.querySelector('.power-timer');
            
            if (this.character.powers[powerType]?.active) {
                el.classList.add('active');
                if (timer) {
                    const duration = this.character.powers[powerType].duration;
                    timer.textContent = Math.ceil(duration / 60);
                }
            } else {
                el.classList.remove('active');
            }
        });
    }
    
    // ==================== دوال الشاشات ====================
    showScreen(screenName) {
        // إخفاء جميع الشاشات
        document.querySelectorAll('.start-screen, .settings-screen, .achievements-screen, .shop-screen')
            .forEach(screen => {
                screen.classList.remove('active');
            });
        
        // إخفاء شاشات اللعبة
        if (screenName !== 'game') {
            document.querySelector('.container').style.display = 'none';
        }
        
        // إظهار الشاشة المطلوبة
        switch(screenName) {
            case 'start':
                this.uiElements.startScreen.classList.add('active');
                break;
            case 'settings':
                this.uiElements.settingsScreen.classList.add('active');
                break;
            case 'achievements':
                this.uiElements.achievementsScreen.classList.add('active');
                break;
            case 'shop':
                this.uiElements.shopScreen.style.display = 'flex';
                setTimeout(() => this.uiElements.shopScreen.style.opacity = '1', 10);
                break;
            case 'game':
                document.querySelector('.container').style.display = 'block';
                break;
        }
    }
    
    hideScreen(screenName) {
        switch(screenName) {
            case 'shop':
                this.uiElements.shopScreen.style.opacity = '0';
                setTimeout(() => {
                    this.uiElements.shopScreen.style.display = 'none';
                }, 300);
                break;
        }
    }
    
    showMessage(text) {
        const popup = document.getElementById('messagePopup');
        const messageText = document.getElementById('messageText');
        
        messageText.textContent = text;
        popup.style.display = 'block';
        
        setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300);
        }, 2000);
    }
    
    // ==================== نهاية اللعبة والمستويات ====================
    endGame() {
        this.gameState.active = false;
        this.gameState.gameOver = true;
        
        // تحديث النتائج النهائية
        this.uiElements.finalScore.textContent = this.gameState.score;
        this.uiElements.finalHighScore.textContent = this.gameState.highScore;
        this.uiElements.finalLevel.textContent = this.gameState.level;
        this.uiElements.finalCoins.textContent = this.gameState.collectedCoins * 10;
        
        // إظهار شاشة نهاية اللعبة
        this.uiElements.gameOverScreen.style.display = 'flex';
        
        // حفظ النتائج
        this.saveSettings();
        
        // الصوت
        this.audio.stopMusic();
        this.audio.play('gameOver', 0.8);
        
        // الاهتزاز
        if (this.settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    restartGame() {
        // إعادة تعيين اللعبة
        this.gameState.active = true;
        this.gameState.paused = false;
        this.gameState.gameOver = false;
        this.gameState.score = 0;
        this.gameState.level = 1;
        
        // إعادة تعيين الشخصية
        this.character.x = this.canvas.width / 2;
        this.character.y = 150;
        this.character.velocityY = 0;
        this.character.isJumping = false;
        this.character.rotation = 0;
        this.character.trail = [];
        this.character.powers = {
            shield: { active: false, duration: 0 },
            magnet: { active: false, duration: 0 },
            doubleJump: { active: false, jumpsLeft: 0 }
        };
        
        // إعادة تعيين العناصر
        this.createGameElements();
        
        // إعادة تعيين الفيزياء
        this.physics.helixRotation = 0;
        
        // إخفاء الشاشات
        this.uiElements.gameOverScreen.style.display = 'none';
        this.uiElements.pauseScreen.style.display = 'none';
        
        // تحديث الواجهة
        this.updateUI();
        this.updateActivePowersDisplay();
        
        // تشغيل الموسيقى
        if (this.settings.music) {
            this.audio.playMusic();
        }
    }
    
    continueGame() {
        if (this.gameState.coins >= 50) {
            this.gameState.coins -= 50;
            this.gameState.active = true;
            this.gameState.gameOver = false;
            
            // إعادة تعيين الشخصية
            this.character.y = 150;
            this.character.velocityY = 0;
            this.character.isJumping = false;
            
            // إخفاء شاشة نهاية اللعبة
            this.uiElements.gameOverScreen.style.display = 'none';
            
            // تحديث الواجهة
            this.updateUI();
            
            // إظهار رسالة
            this.showMessage('مواصلة اللعب! 🎮');
        } else {
            this.showMessage('ليس لديك عملات كافية! 💰');
        }
    }
    
    nextLevel() {
        this.gameState.level++;
        this.physics.helixSpeed = Math.min(0.06, this.physics.helixSpeed + 0.002);
        this.physics.platformSpeed += 0.2;
        
        // تحديث الواجهة
        this.updateUI();
        
        // إنشاء جسيمات المستوى الجديد
        for (let i = 0; i < 30; i++) {
            this.createParticle(
                this.canvas.width / 2,
                this.canvas.height / 2,
                '#4dccff',
                'star'
            );
        }
        
        // إظهار رسالة
        this.showMessage(`المستوى ${this.gameState.level}! 🚀`);
    }
    
    // ==================== المتجر والشراء ====================
    buyPowerUp(itemType) {
        const prices = { shield: 50, magnet: 75, doublejump: 100 };
        const price = prices[itemType];
        
        if (this.gameState.coins >= price) {
            this.gameState.coins -= price;
            
            // تفعيل القوة
            switch(itemType) {
                case 'shield':
                    this.character.powers.shield = { active: true, duration: 300 };
                    break;
                case 'magnet':
                    this.character.powers.magnet = { active: true, duration: 200 };
                    break;
                case 'doublejump':
                    this.character.powers.doubleJump = { active: true, jumpsLeft: 2 };
                    break;
            }
            
            // تحديث الواجهة
            this.updateUI();
            this.updateActivePowersDisplay();
            
            // الصوت
            this.audio.play('power', 0.6);
            
            // إظهار رسالة
            this.showMessage(`تم شراء ${this.getPowerName(itemType)}! 🛍️`);
            
            // إخفاء المتجر بعد ثانية
            setTimeout(() => this.hideScreen('shop'), 1000);
        } else {
            this.showMessage('عملات غير كافية! 💰');
        }
    }
    
    // ==================== الإنجازات ====================
    unlockAchievement(achievementId) {
        const achievement = GameConfig.ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement || this.gameState.achievements.includes(achievementId)) return;
        
        this.gameState.achievements.push(achievementId);
        this.gameState.score += achievement.reward;
        
        // تحديث الواجهة
        this.updateUI();
        this.saveSettings();
        
        // إظهار رسالة الإنجاز
        this.showMessage(`إنجاز جديد: ${achievement.name}! 🏆 +${achievement.reward} نقطة`);
    }
    
    // ==================== دوال المساعدة ====================
    getPlatformColor(type) {
        const colors = ['#ff6b9d', '#6b9dff', '#9dff6b', '#ff9d6b'];
        return colors[type % colors.length];
    }
    
    getCharacterColor(character) {
        const colors = {
            engineer: '#4dccff',
            ninja: '#9d6bff',
            robot: '#ff6b9d'
        };
        return colors[character] || '#4dccff';
    }
    
    getPowerColor(powerType) {
        const colors = {
            shield: '#4dccff',
            magnet: '#ff9d6b',
            doublejump: '#9dff6b'
        };
        return colors[powerType] || '#4dccff';
    }
    
    getPowerDarkColor(powerType) {
        const colors = {
            shield: '#0099cc',
            magnet: '#cc7b4d',
            doublejump: '#6bcc4d'
        };
        return colors[powerType] || '#0099cc';
    }
    
    getPowerName(powerType) {
        const names = {
            shield: 'الدرع',
            magnet: 'المغناطيس',
            doublejump: 'القفز المزدوج'
        };
        return names[powerType] || 'قوة';
    }
    
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
    
    setDifficulty(level) {
        const difficulty = GameConfig.DIFFICULTY[level];
        if (difficulty) {
            this.physics.helixSpeed = difficulty.speed;
            // يمكن تعديل إعدادات أخرى حسب الصعوبة
        }
    }
    
    changeTheme(theme) {
        document.body.classList.remove('default-theme', 'dark-theme', 'neon-theme');
        document.body.classList.add(`${theme}-theme`);
        this.settings.theme = theme;
    }
    
    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        
        if (this.gameState.paused) {
            this.uiElements.pauseScreen.style.display = 'flex';
            this.audio.stopMusic();
        } else {
            this.uiElements.pauseScreen.style.display = 'none';
            if (this.settings.music) {
                this.audio.playMusic();
            }
        }
    }
    
    showMainMenu() {
        this.gameState.active = false;
        this.uiElements.pauseScreen.style.display = 'none';
        this.uiElements.gameOverScreen.style.display = 'none';
        document.querySelector('.container').style.display = 'none';
        this.showScreen('start');
    }
    
    shareScore() {
        const text = `🎮 حصلت على ${this.gameState.score} نقطة في لعبة Helix Jump Pro! جربها الآن!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Helix Jump Pro',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text);
            this.showMessage('تم نسخ النتيجة إلى الحافظة! 📋');
        }
    }
    
    // ==================== حلقة اللعبة الرئيسية ====================
    gameLoop() {
        this.updatePhysics();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ==================== بدء اللعبة عند تحميل الصفحة ====================
let game;

window.addEventListener('load', () => {
    game = new HelixJumpPro();
    console.log('Helix Jump Pro v' + GameConfig.VERSION + ' - جاهز للعب!');
});

// دعم وضع ملء الشاشة
document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`خطأ في تشغيل وضع ملء الشاشة: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
});
