export class GameEngine {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.stars = 3;
        this.currentRound = 0;
        this.maxRounds = 10;
        this.difficulty = 'normal';
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        this.gameData = this.initializeGameData();
        this.adaptiveSystem = new AdaptiveSystem();
    }

    initializeGameData() {
        return {
            animals: [
                { emoji: '🐶', name: 'dog', sound: 'woof' },
                { emoji: '🐱', name: 'cat', sound: 'meow' },
                { emoji: '🐰', name: 'rabbit', sound: 'hop' },
                { emoji: '🐸', name: 'frog', sound: 'ribbit' },
                { emoji: '🐷', name: 'pig', sound: 'oink' },
                { emoji: '🐮', name: 'cow', sound: 'moo' },
                { emoji: '🐯', name: 'tiger', sound: 'roar' },
                { emoji: '🐻', name: 'bear', sound: 'growl' },
                { emoji: '🦊', name: 'fox', sound: 'yip' },
                { emoji: '🐨', name: 'koala', sound: 'chirp' }
            ],
            colors: [
                { emoji: '🔴', name: 'red', hex: '#FF6B6B', pattern: '●' },
                { emoji: '🔵', name: 'blue', hex: '#4ECDC4', pattern: '▲' },
                { emoji: '🟡', name: 'yellow', hex: '#FFD93D', pattern: '■' },
                { emoji: '🟢', name: 'green', hex: '#6BCF7F', pattern: '◆' },
                { emoji: '🟠', name: 'orange', hex: '#FFB347', pattern: '★' },
                { emoji: '🟣', name: 'purple', hex: '#B19CD9', pattern: '♦' },
                { emoji: '🟤', name: 'brown', hex: '#D2B48C', pattern: '▼' },
                { emoji: '⚫', name: 'black', hex: '#4A5568', pattern: '●' }
            ],
            shapes: [
                { emoji: '⭐', name: 'star', sides: 5 },
                { emoji: '❤️', name: 'heart', sides: 0 },
                { emoji: '⚡', name: 'lightning', sides: 0 },
                { emoji: '🌙', name: 'moon', sides: 0 },
                { emoji: '☀️', name: 'sun', sides: 0 },
                { emoji: '🔸', name: 'diamond', sides: 4 },
                { emoji: '🔹', name: 'diamond-blue', sides: 4 },
                { emoji: '🔶', name: 'diamond-orange', sides: 4 }
            ]
        };
    }

    startNewGame() {
        this.score = 0;
        this.level = 1;
        this.stars = 3;
        this.currentRound = 0;
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        this.adaptiveSystem.reset();
        return this.generateRound();
    }

    generateRound() {
        this.currentRound++;
        const roundType = this.selectRoundType();
        const roundData = this.createRoundData(roundType);
        
        return {
            round: this.currentRound,
            type: roundType,
            target: roundData.target,
            items: roundData.items,
            correctAnswer: roundData.correctAnswer
        };
    }

    selectRoundType() {
        const types = ['animals', 'colors', 'shapes'];
        
        // Adaptive difficulty selection
        if (this.difficulty === 'adaptive') {
            return this.adaptiveSystem.selectOptimalType(types, this.level);
        }
        
        // Progressive introduction for easy mode
        if (this.difficulty === 'easy') {
            if (this.level <= 2) return 'animals';
            if (this.level <= 4) return Math.random() < 0.7 ? 'animals' : 'colors';
            return types[Math.floor(Math.random() * types.length)];
        }
        
        // Random selection for normal mode
        return types[Math.floor(Math.random() * types.length)];
    }

    createRoundData(type) {
        const data = this.gameData[type];
        const gridSize = this.calculateGridSize();
        const targetIndex = Math.floor(Math.random() * data.length);
        const target = data[targetIndex];
        
        // Create items array with duplicates and distractors
        const items = this.generateItems(type, target, gridSize);
        
        return {
            target,
            items,
            correctAnswer: targetIndex
        };
    }

    calculateGridSize() {
        // Adaptive grid size based on level and difficulty
        const baseSize = this.difficulty === 'easy' ? 4 : 6;
        const levelBonus = Math.floor(this.level / 3);
        const maxSize = this.difficulty === 'easy' ? 6 : 9;
        
        return Math.min(baseSize + levelBonus, maxSize);
    }

    generateItems(type, target, gridSize) {
        const data = this.gameData[type];
        const items = [];
        
        // Add correct answers (2-3 for easier matching)
        const correctCount = this.difficulty === 'easy' ? 3 : 2;
        for (let i = 0; i < correctCount; i++) {
            items.push({ ...target, isCorrect: true });
        }
        
        // Add distractors
        while (items.length < gridSize) {
            const distractor = data[Math.floor(Math.random() * data.length)];
            if (distractor !== target) {
                items.push({ ...distractor, isCorrect: false });
            }
        }
        
        // Shuffle items
        return this.shuffleArray(items);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    processAnswer(isCorrect, responseTime) {
        this.totalAnswers++;
        
        if (isCorrect) {
            this.correctAnswers++;
            this.score += this.calculateScore(responseTime);
            this.adaptiveSystem.recordSuccess(responseTime);
            
            // Check if round is complete
            if (this.isRoundComplete()) {
                return this.completeRound();
            }
            
            return { success: true, continue: true };
        } else {
            this.stars = Math.max(0, this.stars - 1);
            this.adaptiveSystem.recordFailure();
            
            // Game over if no stars left
            if (this.stars === 0) {
                return this.gameOver();
            }
            
            return { success: false, continue: true };
        }
    }

    calculateScore(responseTime) {
        const baseScore = 100;
        const timeBonus = Math.max(0, 1000 - responseTime) / 10;
        const levelMultiplier = this.level * 0.1 + 1;
        
        return Math.floor((baseScore + timeBonus) * levelMultiplier);
    }

    isRoundComplete() {
        // Round is complete when all correct items are found
        const targetItems = document.querySelectorAll('.game-item.correct');
        const correctCount = this.difficulty === 'easy' ? 3 : 2;
        return targetItems.length >= correctCount;
    }

    completeRound() {
        if (this.currentRound >= this.maxRounds) {
            return this.completeLevel();
        }
        
        return {
            roundComplete: true,
            nextRound: this.generateRound()
        };
    }

    completeLevel() {
        this.level++;
        this.currentRound = 0;
        this.stars = Math.min(3, this.stars + 1); // Bonus star for level completion
        
        // Increase difficulty progressively
        this.maxRounds = Math.min(15, this.maxRounds + 1);
        
        return {
            levelComplete: true,
            newLevel: this.level,
            bonusScore: this.level * 500
        };
    }

    gameOver() {
        const accuracy = this.totalAnswers > 0 ? (this.correctAnswers / this.totalAnswers) * 100 : 0;
        
        return {
            gameOver: true,
            finalScore: this.score,
            level: this.level,
            accuracy: Math.round(accuracy),
            playTime: Date.now() - this.startTime
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.adaptiveSystem.setDifficulty(difficulty);
    }

    getGameState() {
        return {
            score: this.score,
            level: this.level,
            stars: this.stars,
            round: this.currentRound,
            maxRounds: this.maxRounds,
            progress: (this.currentRound / this.maxRounds) * 100
        };
    }
}

class AdaptiveSystem {
    constructor() {
        this.playerProfile = {
            responseTime: [],
            accuracy: [],
            preferredTypes: { animals: 0, colors: 0, shapes: 0 },
            difficultyLevel: 1
        };
        this.adaptationThreshold = 5; // Minimum attempts before adapting
    }

    recordSuccess(responseTime) {
        this.playerProfile.responseTime.push(responseTime);
        this.playerProfile.accuracy.push(1);
        
        if (this.shouldAdaptUp()) {
            this.playerProfile.difficultyLevel = Math.min(5, this.playerProfile.difficultyLevel + 0.1);
        }
    }

    recordFailure() {
        this.playerProfile.accuracy.push(0);
        
        if (this.shouldAdaptDown()) {
            this.playerProfile.difficultyLevel = Math.max(1, this.playerProfile.difficultyLevel - 0.2);
        }
    }

    shouldAdaptUp() {
        if (this.playerProfile.accuracy.length < this.adaptationThreshold) return false;
        
        const recentAccuracy = this.getRecentAccuracy();
        const avgResponseTime = this.getAverageResponseTime();
        
        return recentAccuracy > 0.8 && avgResponseTime < 2000;
    }

    shouldAdaptDown() {
        if (this.playerProfile.accuracy.length < this.adaptationThreshold) return false;
        
        const recentAccuracy = this.getRecentAccuracy();
        return recentAccuracy < 0.5;
    }

    getRecentAccuracy() {
        const recent = this.playerProfile.accuracy.slice(-this.adaptationThreshold);
        return recent.reduce((sum, val) => sum + val, 0) / recent.length;
    }

    getAverageResponseTime() {
        if (this.playerProfile.responseTime.length === 0) return 0;
        
        const recent = this.playerProfile.responseTime.slice(-this.adaptationThreshold);
        return recent.reduce((sum, val) => sum + val, 0) / recent.length;
    }

    selectOptimalType(types, level) {
        // For early levels, prefer animals (most engaging for children)
        if (level <= 2) return 'animals';
        
        // Use performance data to select optimal type
        const preferences = this.playerProfile.preferredTypes;
        const total = Object.values(preferences).reduce((sum, val) => sum + val, 0);
        
        if (total === 0) {
            return types[Math.floor(Math.random() * types.length)];
        }
        
        // Weight selection based on past performance
        const weights = types.map(type => preferences[type] / total);
        return this.weightedRandomSelect(types, weights);
    }

    weightedRandomSelect(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    setDifficulty(difficulty) {
        if (difficulty === 'easy') {
            this.playerProfile.difficultyLevel = 1;
        } else if (difficulty === 'normal') {
            this.playerProfile.difficultyLevel = 2;
        }
    }

    reset() {
        this.playerProfile = {
            responseTime: [],
            accuracy: [],
            preferredTypes: { animals: 0, colors: 0, shapes: 0 },
            difficultyLevel: 1
        };
    }
}