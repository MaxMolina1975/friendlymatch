export class ProgressManager {
    constructor() {
        this.storageKey = 'friendlyMatch_progress';
        this.achievements = this.initializeAchievements();
        this.stats = this.loadProgress();
    }

    initializeAchievements() {
        return {
            'first-match': {
                id: 'first-match',
                icon: '🎯',
                unlocked: false,
                unlockedAt: null
            },
            'star-collector': {
                id: 'star-collector',
                icon: '⭐',
                unlocked: false,
                unlockedAt: null,
                requirement: 10
            },
            'level-master': {
                id: 'level-master',
                icon: '🏆',
                unlocked: false,
                unlockedAt: null,
                requirement: 5
            },
            'perfect-round': {
                id: 'perfect-round',
                icon: '💎',
                unlocked: false,
                unlockedAt: null
            },
            'speed-demon': {
                id: 'speed-demon',
                icon: '⚡',
                unlocked: false,
                unlockedAt: null,
                requirement: 5
            },
            'explorer': {
                id: 'explorer',
                icon: '🗺️',
                unlocked: false,
                unlockedAt: null
            },
            'persistent': {
                id: 'persistent',
                icon: '🎮',
                unlocked: false,
                unlockedAt: null,
                requirement: 20
            }
        };
    }

    loadProgress() {
        const defaultStats = {
            totalScore: 0,
            gamesPlayed: 0,
            totalStars: 0,
            highestLevel: 1,
            totalPlayTime: 0,
            perfectRounds: 0,
            fastMatches: 0,
            gameTypesPlayed: new Set(),
            lastPlayed: null,
            achievements: {}
        };

        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert gameTypesPlayed back to Set
                if (parsed.gameTypesPlayed && Array.isArray(parsed.gameTypesPlayed)) {
                    parsed.gameTypesPlayed = new Set(parsed.gameTypesPlayed);
                }
                
                // Merge achievements
                if (parsed.achievements) {
                    Object.keys(this.achievements).forEach(key => {
                        if (parsed.achievements[key]) {
                            this.achievements[key] = { ...this.achievements[key], ...parsed.achievements[key] };
                        }
                    });
                }
                
                return { ...defaultStats, ...parsed, achievements: this.achievements };
            }
        } catch (error) {
            console.warn('Could not load progress:', error);
        }

        return { ...defaultStats, achievements: this.achievements };
    }

    saveProgress() {
        try {
            const toSave = {
                ...this.stats,
                gameTypesPlayed: Array.from(this.stats.gameTypesPlayed),
                achievements: this.achievements
            };
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
    }

    updateGameStats(gameData) {
        this.stats.totalScore += gameData.score || 0;
        this.stats.gamesPlayed += 1;
        this.stats.totalStars += gameData.starsEarned || 0;
        this.stats.highestLevel = Math.max(this.stats.highestLevel, gameData.level || 1);
        this.stats.totalPlayTime += gameData.playTime || 0;
        this.stats.lastPlayed = Date.now();

        if (gameData.gameType) {
            this.stats.gameTypesPlayed.add(gameData.gameType);
        }

        if (gameData.perfectRound) {
            this.stats.perfectRounds += 1;
        }

        if (gameData.fastMatches) {
            this.stats.fastMatches += gameData.fastMatches;
        }

        this.checkAchievements();
        this.saveProgress();
    }

    checkAchievements() {
        const newAchievements = [];

        // First Match
        if (!this.achievements['first-match'].unlocked && this.stats.gamesPlayed >= 1) {
            this.unlockAchievement('first-match');
            newAchievements.push('first-match');
        }

        // Star Collector
        if (!this.achievements['star-collector'].unlocked && 
            this.stats.totalStars >= this.achievements['star-collector'].requirement) {
            this.unlockAchievement('star-collector');
            newAchievements.push('star-collector');
        }

        // Level Master
        if (!this.achievements['level-master'].unlocked && 
            this.stats.highestLevel >= this.achievements['level-master'].requirement) {
            this.unlockAchievement('level-master');
            newAchievements.push('level-master');
        }

        // Perfect Round
        if (!this.achievements['perfect-round'].unlocked && this.stats.perfectRounds >= 1) {
            this.unlockAchievement('perfect-round');
            newAchievements.push('perfect-round');
        }

        // Speed Demon
        if (!this.achievements['speed-demon'].unlocked && 
            this.stats.fastMatches >= this.achievements['speed-demon'].requirement) {
            this.unlockAchievement('speed-demon');
            newAchievements.push('speed-demon');
        }

        // Explorer
        if (!this.achievements['explorer'].unlocked && this.stats.gameTypesPlayed.size >= 3) {
            this.unlockAchievement('explorer');
            newAchievements.push('explorer');
        }

        // Persistent
        if (!this.achievements['persistent'].unlocked && 
            this.stats.gamesPlayed >= this.achievements['persistent'].requirement) {
            this.unlockAchievement('persistent');
            newAchievements.push('persistent');
        }

        return newAchievements;
    }

    unlockAchievement(achievementId) {
        if (this.achievements[achievementId]) {
            this.achievements[achievementId].unlocked = true;
            this.achievements[achievementId].unlockedAt = Date.now();
        }
    }

    getStats() {
        return {
            totalScore: this.stats.totalScore,
            gamesPlayed: this.stats.gamesPlayed,
            totalStars: this.stats.totalStars,
            highestLevel: this.stats.highestLevel,
            totalPlayTime: this.stats.totalPlayTime,
            accuracy: this.calculateAccuracy(),
            averageScore: this.calculateAverageScore()
        };
    }

    getAchievements() {
        return Object.values(this.achievements).map(achievement => ({
            ...achievement,
            progress: this.getAchievementProgress(achievement)
        }));
    }

    getAchievementProgress(achievement) {
        switch (achievement.id) {
            case 'first-match':
                return Math.min(100, (this.stats.gamesPlayed / 1) * 100);
            case 'star-collector':
                return Math.min(100, (this.stats.totalStars / achievement.requirement) * 100);
            case 'level-master':
                return Math.min(100, (this.stats.highestLevel / achievement.requirement) * 100);
            case 'perfect-round':
                return Math.min(100, (this.stats.perfectRounds / 1) * 100);
            case 'speed-demon':
                return Math.min(100, (this.stats.fastMatches / achievement.requirement) * 100);
            case 'explorer':
                return Math.min(100, (this.stats.gameTypesPlayed.size / 3) * 100);
            case 'persistent':
                return Math.min(100, (this.stats.gamesPlayed / achievement.requirement) * 100);
            default:
                return 0;
        }
    }

    calculateAccuracy() {
        // This would need to be tracked during gameplay
        // For now, return a placeholder
        return 85;
    }

    calculateAverageScore() {
        return this.stats.gamesPlayed > 0 ? Math.round(this.stats.totalScore / this.stats.gamesPlayed) : 0;
    }

    resetProgress() {
        this.stats = {
            totalScore: 0,
            gamesPlayed: 0,
            totalStars: 0,
            highestLevel: 1,
            totalPlayTime: 0,
            perfectRounds: 0,
            fastMatches: 0,
            gameTypesPlayed: new Set(),
            lastPlayed: null
        };
        this.achievements = this.initializeAchievements();
        this.saveProgress();
    }

    exportProgress() {
        return JSON.stringify({
            stats: {
                ...this.stats,
                gameTypesPlayed: Array.from(this.stats.gameTypesPlayed)
            },
            achievements: this.achievements,
            exportDate: Date.now(),
            version: '1.0'
        });
    }

    importProgress(progressData) {
        try {
            const data = JSON.parse(progressData);
            if (data.stats) {
                this.stats = {
                    ...data.stats,
                    gameTypesPlayed: new Set(data.stats.gameTypesPlayed || [])
                };
            }
            if (data.achievements) {
                this.achievements = { ...this.achievements, ...data.achievements };
            }
            this.saveProgress();
            return true;
        } catch (error) {
            console.error('Could not import progress:', error);
            return false;
        }
    }
}