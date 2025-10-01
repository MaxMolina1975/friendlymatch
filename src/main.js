import { GameEngine } from './game/GameEngine.js';
import { AudioManager } from './audio/AudioManager.js';
import { I18nManager } from './i18n/translations.js';
import { ProgressManager } from './storage/ProgressManager.js';
import { ParentalDashboard } from './components/ParentalDashboard.js';
import { TherapyMode } from './components/TherapyMode.js';
import { SocialFeatures } from './components/SocialFeatures.js';

class FriendlyMatchGame {
    constructor() {
        this.gameEngine = new GameEngine();
        this.audioManager = new AudioManager();
        this.i18nManager = new I18nManager();
        this.progressManager = new ProgressManager();
        this.parentalDashboard = new ParentalDashboard(this.progressManager, this.i18nManager);
        this.therapyMode = new TherapyMode(this.gameEngine, this.audioManager, this.i18nManager);
        this.socialFeatures = new SocialFeatures(this.progressManager, this.i18nManager, this.audioManager);
        
        this.currentScreen = 'loading';
        this.gameState = 'menu';
        this.currentRound = null;
        this.gameStartTime = null;
        this.roundStartTime = null;
        this.isColorBlindMode = false;
        this.sessionTimeLimit = 0;
        this.sessionStartTime = null;
        
        this.init();
    }

    async init() {
        // Show loading screen briefly
        await this.showLoadingScreen();
        
        // Initialize components
        this.setupEventListeners();
        this.loadSettings();
        this.i18nManager.loadLanguage();
        this.updateProgressDisplay();
        
        // Show main menu
        this.showScreen('main-menu');
        
        // Initialize audio context on first user interaction
        this.setupAudioInitialization();
    }

    async showLoadingScreen() {
        return new Promise(resolve => {
            setTimeout(() => {
                document.getElementById('loading-screen').classList.remove('active');
                resolve();
            }, 2000);
        });
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.startGame();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.showScreen('settings-screen');
        });

        document.getElementById('progress-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.showScreen('progress-screen');
            this.updateProgressDisplay();
        });

        // Settings
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.audioManager.playClick();
            this.showScreen('main-menu');
        });

        document.getElementById('back-to-menu-progress').addEventListener('click', () => {
            this.audioManager.playClick();
            this.showScreen('main-menu');
        });

        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.audioManager.setEnabled(e.target.checked);
            this.saveSettings();
        });

        document.getElementById('colorblind-toggle').addEventListener('change', (e) => {
            this.isColorBlindMode = e.target.checked;
            document.body.classList.toggle('colorblind-mode', this.isColorBlindMode);
            this.saveSettings();
        });

        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.gameEngine.setDifficulty(e.target.value);
            this.saveSettings();
        });

        // Therapy mode toggle (hidden feature)
        let therapyClickCount = 0;
        document.getElementById('settings-btn').addEventListener('dblclick', () => {
            therapyClickCount++;
            if (therapyClickCount >= 3) {
                this.showTherapyModeOption();
                therapyClickCount = 0;
            }
        });

        // Language selection
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audioManager.playClick();
                const lang = btn.dataset.lang;
                this.i18nManager.setLanguage(lang);
                
                // Update active state
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.pauseGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.restartGame();
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            this.audioManager.playClick();
            this.endGame();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.pauseGame();
            } else if (e.code === 'Escape') {
                if (this.gameState === 'paused') {
                    this.resumeGame();
                } else if (this.gameState === 'playing') {
                    this.pauseGame();
                }
            }
        });

        // Touch/click prevention for better mobile experience
        document.addEventListener('selectstart', e => e.preventDefault());
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Session time monitoring
        this.startSessionMonitoring();
    }

    showTherapyModeOption() {
        const therapyOption = document.createElement('div');
        therapyOption.className = 'therapy-mode-option';
        therapyOption.innerHTML = `
            <div class="therapy-option-content">
                <h3>🎯 Therapy Mode</h3>
                <p>Enable enhanced data collection and therapeutic features?</p>
                <div class="therapy-option-buttons">
                    <button id="enable-therapy" class="therapy-option-btn primary">Enable</button>
                    <button id="cancel-therapy" class="therapy-option-btn secondary">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(therapyOption);
        
        document.getElementById('enable-therapy').addEventListener('click', () => {
            this.therapyMode.activateTherapyMode();
            therapyOption.remove();
        });
        
        document.getElementById('cancel-therapy').addEventListener('click', () => {
            therapyOption.remove();
        });
    }

    startSessionMonitoring() {
        this.sessionStartTime = Date.now();
        
        // Check session time every minute
        setInterval(() => {
            this.checkSessionTime();
        }, 60000);
    }

    checkSessionTime() {
        if (this.sessionTimeLimit === 0) return;
        
        const sessionDuration = Date.now() - this.sessionStartTime;
        const sessionMinutes = sessionDuration / 60000;
        
        if (sessionMinutes >= this.sessionTimeLimit) {
            this.suggestSessionBreak();
        }
    }

    suggestSessionBreak() {
        if (this.gameState !== 'playing') return;
        
        const breakSuggestion = document.createElement('div');
        breakSuggestion.className = 'session-break-suggestion';
        breakSuggestion.innerHTML = `
            <div class="break-suggestion-content">
                <h3>🌟 Great Playing!</h3>
                <p>You've been playing for ${this.sessionTimeLimit} minutes. Time for a break?</p>
                <div class="break-suggestion-buttons">
                    <button id="take-session-break" class="break-suggestion-btn primary">Take Break</button>
                    <button id="continue-session" class="break-suggestion-btn secondary">5 More Minutes</button>
                </div>
            </div>
        `;
        document.body.appendChild(breakSuggestion);
        
        document.getElementById('take-session-break').addEventListener('click', () => {
            this.endGame();
            breakSuggestion.remove();
        });
        
        document.getElementById('continue-session').addEventListener('click', () => {
            this.sessionTimeLimit += 5;
            breakSuggestion.remove();
        });
    }

    setupAudioInitialization() {
        const initAudio = () => {
            this.audioManager.initAudioContext();
            document.removeEventListener('touchstart', initAudio);
            document.removeEventListener('click', initAudio);
        };
        
        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('click', initAudio, { once: true });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    startGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.gameEngine.startTime = this.gameStartTime;
        
        // Start new game
        this.currentRound = this.gameEngine.startNewGame();
        
        this.showScreen('game-screen');
        this.updateGameDisplay();
        this.renderGameRound();
        
        // Speak initial instruction
        const instruction = this.i18nManager.translate('tap-instruction');
        setTimeout(() => {
            this.audioManager.speak(instruction, this.i18nManager.getCurrentLanguage());
        }, 1000);
    }

    renderGameRound() {
        if (!this.currentRound) return;

        const targetDisplay = document.getElementById('target-display');
        const gameGrid = document.getElementById('game-grid');
        const instruction = document.getElementById('instruction');

        // Clear previous content
        targetDisplay.innerHTML = '';
        gameGrid.innerHTML = '';

        // Update instruction based on round type
        const typeInstruction = this.i18nManager.translate(`find-${this.currentRound.type}`);
        instruction.textContent = typeInstruction || this.i18nManager.translate('instruction');

        // Display target item
        this.renderGameItem(targetDisplay, this.currentRound.target, 'target');

        // Display game items
        this.currentRound.items.forEach((item, index) => {
            const gameItem = this.renderGameItem(gameGrid, item, 'game', index);
            this.setupGameItemInteraction(gameItem, item, index);
        });

        // Start round timer
        this.roundStartTime = Date.now();
    }

    renderGameItem(container, item, type, index = 0) {
        const element = document.createElement('div');
        element.className = type === 'target' ? 'target-item-content' : 'game-item';
        
        if (type === 'game') {
            element.dataset.index = index;
            element.dataset.type = this.currentRound.type;
            
            // Add color-blind friendly attributes
            if (this.currentRound.type === 'colors' && item.pattern) {
                element.dataset.pattern = item.pattern;
            }
        }

        // Render based on item type
        if (this.currentRound.type === 'colors') {
            element.style.backgroundColor = item.hex;
            element.style.color = this.getContrastColor(item.hex);
            element.innerHTML = `<div class="color-indicator">${item.emoji}</div>`;
        } else {
            element.innerHTML = item.emoji;
        }

        container.appendChild(element);
        return element;
    }

    setupGameItemInteraction(element, item, index) {
        const handleInteraction = (e) => {
            e.preventDefault();
            if (element.classList.contains('correct') || element.classList.contains('wrong')) {
                return; // Already processed
            }

            this.processItemTap(element, item, index);
        };

        element.addEventListener('click', handleInteraction);
        element.addEventListener('touchstart', handleInteraction, { passive: false });
    }

    processItemTap(element, item, index) {
        this.audioManager.playTap();
        
        const responseTime = Date.now() - this.roundStartTime;
        const isCorrect = item.isCorrect;
        
        // Visual feedback
        element.classList.add(isCorrect ? 'correct' : 'wrong');
        
        // Audio feedback
        if (isCorrect) {
            this.audioManager.playSuccess();
            this.showCelebration();
            
            // Show random social celebration
            if (Math.random() < 0.3) {
                this.socialFeatures.showRandomCelebration();
            }
        } else {
            this.audioManager.playError();
        }

        // Process answer with game engine
        const result = this.gameEngine.processAnswer(isCorrect, responseTime);
        
        // Update display
        this.updateGameDisplay();
        
        // Handle game flow
        if (result.gameOver) {
            this.endGame(result);
        } else if (result.levelComplete) {
            this.handleLevelComplete(result);
        } else if (result.roundComplete) {
            this.handleRoundComplete(result);
        }
    }

    showCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        const messages = [
            this.i18nManager.translate('great-job'),
            this.i18nManager.translate('excellent'),
            this.i18nManager.translate('wonderful'),
            this.i18nManager.translate('amazing'),
            this.i18nManager.translate('fantastic')
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('celebration-title').textContent = randomMessage + ' 🎉';
        document.getElementById('celebration-message').textContent = 
            this.i18nManager.translate('you-found-match');

        overlay.classList.add('active');
        this.createConfetti();
        
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 2000);
    }

    createConfetti() {
        const overlay = document.getElementById('celebration-overlay');
        const colors = ['#FFD93D', '#90EE90', '#FFB6C1', '#87CEEB', '#DDA0DD'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (3 + Math.random() * 2) + 's';
            
            overlay.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    handleRoundComplete(result) {
        setTimeout(() => {
            this.currentRound = result.nextRound;
            this.renderGameRound();
        }, 1500);
    }

    handleLevelComplete(result) {
        this.audioManager.playLevelComplete();
        
        // Update score with bonus
        this.gameEngine.score += result.bonusScore;
        this.updateGameDisplay();
        
        // Show level complete message
        const celebration = document.getElementById('celebration-overlay');
        document.getElementById('celebration-title').textContent = 
            `🎉 ${this.i18nManager.translate('level')} ${result.newLevel}! 🎉`;
        document.getElementById('celebration-message').textContent = 
            `+${result.bonusScore} ${this.i18nManager.translate('score')}!`;
            
        celebration.classList.add('active');
        
        setTimeout(() => {
            celebration.classList.remove('active');
            this.currentRound = this.gameEngine.generateRound();
            this.renderGameRound();
        }, 3000);
    }

    updateGameDisplay() {
        const gameState = this.gameEngine.getGameState();
        
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('level').textContent = gameState.level;
        document.getElementById('stars').textContent = '⭐'.repeat(gameState.stars);
        document.getElementById('progress-fill').style.width = gameState.progress + '%';
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pause-screen');
            this.audioManager.stopSpeech();
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('game-screen');
        }
    }

    restartGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.currentRound = this.gameEngine.startNewGame();
        this.showScreen('game-screen');
        this.updateGameDisplay();
        this.renderGameRound();
    }

    endGame(result = null) {
        const gameData = {
            score: this.gameEngine.score,
            level: this.gameEngine.level,
            starsEarned: this.gameEngine.stars,
            playTime: Date.now() - this.gameStartTime,
            gameType: this.currentRound?.type,
            perfectRound: result?.accuracy === 100,
            fastMatches: 0 // This would need to be tracked during gameplay
        };
        
        // Update progress
        this.progressManager.updateGameStats(gameData);
        
        // Check for new achievements
        const newAchievements = this.progressManager.checkAchievements();
        if (newAchievements.length > 0) {
            this.audioManager.playAchievement();
            // Show share button after achievements
            const shareBtn = document.getElementById('share-achievement');
            if (shareBtn) {
                shareBtn.classList.remove('hidden');
                setTimeout(() => shareBtn.classList.add('hidden'), 10000);
            }
        }
        
        this.gameState = 'menu';
        this.showScreen('main-menu');
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        const stats = this.progressManager.getStats();
        const achievements = this.progressManager.getAchievements();
        
        document.getElementById('total-score').textContent = stats.totalScore.toLocaleString();
        document.getElementById('games-played').textContent = stats.gamesPlayed;
        document.getElementById('total-stars').textContent = stats.totalStars;
        
        // Update achievements display
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        
        achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            item.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h4 data-translate="${achievement.id}">${this.i18nManager.translate(achievement.id)}</h4>
                    <p data-translate="${achievement.id}-desc">${this.i18nManager.translate(achievement.id + '-desc')}</p>
                </div>
            `;
            
            achievementsList.appendChild(item);
        });
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#2D3748' : '#FFFFFF';
    }

    saveSettings() {
        const settings = {
            soundEnabled: this.audioManager.enabled,
            colorBlindMode: this.isColorBlindMode,
            difficulty: this.gameEngine.difficulty,
            language: this.i18nManager.getCurrentLanguage()
        };
        
        // Add session time limit if set
        if (this.sessionTimeLimit > 0) {
            settings.sessionTimeLimit = this.sessionTimeLimit;
        }
        
        localStorage.setItem('friendlyMatch_settings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('friendlyMatch_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Apply sound setting
                if (typeof settings.soundEnabled === 'boolean') {
                    this.audioManager.setEnabled(settings.soundEnabled);
                    document.getElementById('sound-toggle').checked = settings.soundEnabled;
                }
                
                // Apply color-blind mode
                if (typeof settings.colorBlindMode === 'boolean') {
                    this.isColorBlindMode = settings.colorBlindMode;
                    document.body.classList.toggle('colorblind-mode', this.isColorBlindMode);
                    document.getElementById('colorblind-toggle').checked = settings.colorBlindMode;
                }
                
                // Apply difficulty
                if (settings.difficulty) {
                    this.gameEngine.setDifficulty(settings.difficulty);
                    document.getElementById('difficulty-select').value = settings.difficulty;
                }
                
                // Apply session time limit
                if (settings.sessionTimeLimit) {
                    this.sessionTimeLimit = settings.sessionTimeLimit;
                }
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
        }
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FriendlyMatchGame();
});

// Service Worker registration for offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    });
}