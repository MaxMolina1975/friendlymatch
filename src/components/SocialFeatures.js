export class SocialFeatures {
    constructor(progressManager, i18nManager, audioManager) {
        this.progressManager = progressManager;
        this.i18nManager = i18nManager;
        this.audioManager = audioManager;
        this.achievements = [];
        this.celebrations = [];
        this.setupSocialElements();
    }

    setupSocialElements() {
        this.createAchievementNotifications();
        this.createCelebrationSystem();
        this.createSharingFeatures();
    }

    createAchievementNotifications() {
        // Listen for new achievements
        const originalCheckAchievements = this.progressManager.checkAchievements.bind(this.progressManager);
        this.progressManager.checkAchievements = () => {
            const newAchievements = originalCheckAchievements();
            newAchievements.forEach(achievementId => {
                this.showAchievementNotification(achievementId);
            });
            return newAchievements;
        };
    }

    showAchievementNotification(achievementId) {
        const achievement = this.progressManager.achievements[achievementId];
        if (!achievement) return;

        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-badge">
                    <div class="badge-icon">${achievement.icon}</div>
                    <div class="badge-shine"></div>
                </div>
                <div class="achievement-text">
                    <h3>🎉 Achievement Unlocked!</h3>
                    <h4 data-translate="${achievement.id}">${this.i18nManager.translate(achievement.id)}</h4>
                    <p data-translate="${achievement.id}-desc">${this.i18nManager.translate(achievement.id + '-desc')}</p>
                </div>
            </div>
            <button class="achievement-close">×</button>
        `;

        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Play achievement sound
        this.audioManager.playAchievement();
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideAchievementNotification(notification);
        }, 5000);
        
        // Manual close
        notification.querySelector('.achievement-close').addEventListener('click', () => {
            this.hideAchievementNotification(notification);
        });
    }

    hideAchievementNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    createCelebrationSystem() {
        this.celebrationMessages = {
            en: [
                "Amazing work! 🌟", "You're doing great! 🎉", "Fantastic job! ✨",
                "Keep it up! 🚀", "Wonderful! 🌈", "Excellent! 🎯",
                "You're a star! ⭐", "Brilliant! 💫", "Outstanding! 🏆"
            ],
            de: [
                "Fantastische Arbeit! 🌟", "Du machst das toll! 🎉", "Großartig! ✨",
                "Weiter so! 🚀", "Wunderbar! 🌈", "Ausgezeichnet! 🎯"
            ],
            fr: [
                "Travail fantastique! 🌟", "Tu fais du super travail! 🎉", "Formidable! ✨",
                "Continue! 🚀", "Merveilleux! 🌈", "Excellent! 🎯"
            ],
            es: [
                "¡Trabajo fantástico! 🌟", "¡Lo estás haciendo genial! 🎉", "¡Fantástico! ✨",
                "¡Sigue así! 🚀", "¡Maravilloso! 🌈", "¡Excelente! 🎯"
            ]
        };
    }

    showRandomCelebration() {
        const lang = this.i18nManager.getCurrentLanguage();
        const messages = this.celebrationMessages[lang] || this.celebrationMessages.en;
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        this.showFloatingMessage(message);
    }

    showFloatingMessage(message) {
        const floatingMsg = document.createElement('div');
        floatingMsg.className = 'floating-message';
        floatingMsg.textContent = message;
        
        // Random position
        floatingMsg.style.left = Math.random() * 80 + 10 + '%';
        floatingMsg.style.top = Math.random() * 60 + 20 + '%';
        
        document.body.appendChild(floatingMsg);
        
        // Animate and remove
        setTimeout(() => {
            floatingMsg.classList.add('fade-out');
            setTimeout(() => {
                if (floatingMsg.parentNode) {
                    floatingMsg.parentNode.removeChild(floatingMsg);
                }
            }, 1000);
        }, 2000);
    }

    createSharingFeatures() {
        // Create share button (appears after achievements)
        this.shareButton = document.createElement('button');
        this.shareButton.id = 'share-achievement';
        this.shareButton.className = 'share-btn hidden';
        this.shareButton.innerHTML = '📤 Share';
        this.shareButton.addEventListener('click', () => this.showShareDialog());
        
        // Add to game screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(this.shareButton);
        }
    }

    showShareDialog() {
        const stats = this.progressManager.getStats();
        const shareDialog = document.createElement('div');
        shareDialog.className = 'share-dialog';
        shareDialog.innerHTML = `
            <div class="share-content">
                <h3>🎉 Share Your Progress!</h3>
                <div class="share-preview">
                    <div class="share-card">
                        <h4>My Friendly Match Progress</h4>
                        <div class="share-stats">
                            <div class="share-stat">
                                <span class="stat-icon">🏆</span>
                                <span>Level ${stats.highestLevel}</span>
                            </div>
                            <div class="share-stat">
                                <span class="stat-icon">⭐</span>
                                <span>${stats.totalStars} Stars</span>
                            </div>
                            <div class="share-stat">
                                <span class="stat-icon">🎮</span>
                                <span>${stats.gamesPlayed} Games</span>
                            </div>
                        </div>
                        <p class="share-message">Playing and learning with Friendly Match! 🌟</p>
                    </div>
                </div>
                <div class="share-options">
                    <button class="share-option" data-type="image">📷 Save Image</button>
                    <button class="share-option" data-type="text">📝 Copy Text</button>
                    <button class="share-option" data-type="link">🔗 Share Link</button>
                </div>
                <button class="share-close">Close</button>
            </div>
        `;
        
        document.body.appendChild(shareDialog);
        
        // Handle share options
        shareDialog.addEventListener('click', (e) => {
            if (e.target.dataset.type) {
                this.handleShare(e.target.dataset.type, stats);
            }
        });
        
        shareDialog.querySelector('.share-close').addEventListener('click', () => {
            shareDialog.remove();
        });
    }

    handleShare(type, stats) {
        switch (type) {
            case 'image':
                this.generateShareImage(stats);
                break;
            case 'text':
                this.copyShareText(stats);
                break;
            case 'link':
                this.shareLink();
                break;
        }
    }

    generateShareImage(stats) {
        // Create canvas for share image
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98E4D6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // Title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('My Friendly Match Progress', 200, 50);
        
        // Stats
        ctx.font = '18px Arial';
        ctx.fillText(`🏆 Level ${stats.highestLevel}`, 200, 100);
        ctx.fillText(`⭐ ${stats.totalStars} Stars Earned`, 200, 130);
        ctx.fillText(`🎮 ${stats.gamesPlayed} Games Played`, 200, 160);
        
        // Message
        ctx.font = '16px Arial';
        ctx.fillText('Playing and learning with Friendly Match! 🌟', 200, 220);
        
        // Download image
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'friendly-match-progress.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    copyShareText(stats) {
        const text = `🎉 Check out my progress in Friendly Match!
        
🏆 Level: ${stats.highestLevel}
⭐ Stars: ${stats.totalStars}
🎮 Games: ${stats.gamesPlayed}

Playing and learning with this amazing autism-friendly game! 🌟

#FriendlyMatch #AutismFriendly #LearningThroughPlay`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Text copied to clipboard!');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Text copied to clipboard!');
        }
    }

    shareLink() {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'Friendly Match - Autism-Friendly Kids Game',
                text: 'Check out this amazing learning game designed for children with autism!',
                url: url
            });
        } else {
            // Fallback - copy URL
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    this.showToast('Link copied to clipboard!');
                });
            }
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    createVirtualPetSystem() {
        // Virtual pet that grows with progress
        this.pet = {
            name: 'Friendly',
            type: 'star',
            level: 1,
            happiness: 100,
            energy: 100,
            lastFed: Date.now()
        };
        
        this.loadPetData();
        this.createPetUI();
    }

    loadPetData() {
        try {
            const saved = localStorage.getItem('friendlyMatch_pet');
            if (saved) {
                this.pet = { ...this.pet, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Could not load pet data');
        }
    }

    savePetData() {
        localStorage.setItem('friendlyMatch_pet', JSON.stringify(this.pet));
    }

    createPetUI() {
        const petContainer = document.createElement('div');
        petContainer.id = 'virtual-pet';
        petContainer.className = 'virtual-pet';
        petContainer.innerHTML = `
            <div class="pet-display">
                <div class="pet-character" id="pet-character">⭐</div>
                <div class="pet-name">${this.pet.name}</div>
                <div class="pet-level">Level ${this.pet.level}</div>
            </div>
            <div class="pet-stats">
                <div class="pet-stat">
                    <span class="stat-label">😊</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${this.pet.happiness}%"></div>
                    </div>
                </div>
                <div class="pet-stat">
                    <span class="stat-label">⚡</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${this.pet.energy}%"></div>
                    </div>
                </div>
            </div>
            <div class="pet-actions">
                <button class="pet-btn" id="feed-pet">🍎 Feed</button>
                <button class="pet-btn" id="play-pet">🎾 Play</button>
                <button class="pet-btn" id="pet-info">ℹ️ Info</button>
            </div>
        `;
        
        // Add to main menu
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.appendChild(petContainer);
        }
        
        this.setupPetInteractions();
        this.updatePetStatus();
    }

    setupPetInteractions() {
        document.getElementById('feed-pet').addEventListener('click', () => {
            this.feedPet();
        });
        
        document.getElementById('play-pet').addEventListener('click', () => {
            this.playWithPet();
        });
        
        document.getElementById('pet-info').addEventListener('click', () => {
            this.showPetInfo();
        });
    }

    feedPet() {
        if (this.pet.happiness < 100) {
            this.pet.happiness = Math.min(100, this.pet.happiness + 20);
            this.pet.lastFed = Date.now();
            this.showPetReaction('😋 Yummy!');
            this.savePetData();
            this.updatePetDisplay();
        } else {
            this.showPetReaction('😊 I\'m full!');
        }
    }

    playWithPet() {
        if (this.pet.energy > 20) {
            this.pet.energy -= 20;
            this.pet.happiness = Math.min(100, this.pet.happiness + 15);
            this.showPetReaction('🎉 Fun!');
            this.savePetData();
            this.updatePetDisplay();
        } else {
            this.showPetReaction('😴 Too tired...');
        }
    }

    showPetReaction(message) {
        const reaction = document.createElement('div');
        reaction.className = 'pet-reaction';
        reaction.textContent = message;
        
        const petContainer = document.getElementById('virtual-pet');
        petContainer.appendChild(reaction);
        
        setTimeout(() => {
            reaction.classList.add('fade-out');
            setTimeout(() => {
                if (reaction.parentNode) {
                    reaction.parentNode.removeChild(reaction);
                }
            }, 500);
        }, 2000);
    }

    updatePetStatus() {
        // Update pet stats over time
        const now = Date.now();
        const timeSinceLastFed = now - this.pet.lastFed;
        const hoursSinceLastFed = timeSinceLastFed / (1000 * 60 * 60);
        
        // Decrease happiness over time if not fed
        if (hoursSinceLastFed > 24) {
            this.pet.happiness = Math.max(0, this.pet.happiness - 10);
        }
        
        // Restore energy over time
        this.pet.energy = Math.min(100, this.pet.energy + 1);
        
        this.updatePetDisplay();
        this.savePetData();
        
        // Schedule next update
        setTimeout(() => this.updatePetStatus(), 60000); // Update every minute
    }

    updatePetDisplay() {
        const happinessBar = document.querySelector('#virtual-pet .pet-stat:first-child .stat-fill');
        const energyBar = document.querySelector('#virtual-pet .pet-stat:last-child .stat-fill');
        
        if (happinessBar) happinessBar.style.width = this.pet.happiness + '%';
        if (energyBar) energyBar.style.width = this.pet.energy + '%';
        
        // Update pet character based on happiness
        const petCharacter = document.getElementById('pet-character');
        if (petCharacter) {
            if (this.pet.happiness > 80) {
                petCharacter.textContent = '🌟';
            } else if (this.pet.happiness > 50) {
                petCharacter.textContent = '⭐';
            } else {
                petCharacter.textContent = '💫';
            }
        }
    }

    showPetInfo() {
        const info = document.createElement('div');
        info.className = 'pet-info-dialog';
        info.innerHTML = `
            <div class="pet-info-content">
                <h3>Meet ${this.pet.name}! ⭐</h3>
                <p>Your virtual companion grows happier as you play and learn!</p>
                <div class="pet-details">
                    <p><strong>Level:</strong> ${this.pet.level}</p>
                    <p><strong>Happiness:</strong> ${this.pet.happiness}%</p>
                    <p><strong>Energy:</strong> ${this.pet.energy}%</p>
                </div>
                <div class="pet-tips">
                    <h4>Care Tips:</h4>
                    <ul>
                        <li>🍎 Feed your pet to keep it happy</li>
                        <li>🎾 Play together to build friendship</li>
                        <li>🎮 Complete games to help it grow</li>
                        <li>⭐ Earn achievements to unlock new features</li>
                    </ul>
                </div>
                <button class="pet-info-close">Close</button>
            </div>
        `;
        
        document.body.appendChild(info);
        
        info.querySelector('.pet-info-close').addEventListener('click', () => {
            info.remove();
        });
    }

    levelUpPet() {
        this.pet.level++;
        this.pet.happiness = 100;
        this.pet.energy = 100;
        this.showPetReaction(`🎉 Level ${this.pet.level}!`);
        this.savePetData();
        this.updatePetDisplay();
    }
}