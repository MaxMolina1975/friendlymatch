export class TherapyMode {
    constructor(gameEngine, audioManager, i18nManager) {
        this.gameEngine = gameEngine;
        this.audioManager = audioManager;
        this.i18nManager = i18nManager;
        this.isActive = false;
        this.therapySettings = this.loadTherapySettings();
        this.sessionData = {
            startTime: null,
            responses: [],
            breaks: [],
            currentFocus: null
        };
    }

    loadTherapySettings() {
        const defaults = {
            sessionLength: 15, // minutes
            breakInterval: 5, // minutes
            focusAreas: ['attention', 'motor', 'pattern', 'social'],
            reinforcementSchedule: 'variable', // fixed, variable, continuous
            adaptiveSpeed: 'slow', // slow, medium, fast
            sensoryProfile: 'standard' // standard, hyposensitive, hypersensitive
        };

        try {
            const saved = localStorage.getItem('friendlyMatch_therapy');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }

    saveTherapySettings() {
        localStorage.setItem('friendlyMatch_therapy', JSON.stringify(this.therapySettings));
    }

    activateTherapyMode() {
        this.isActive = true;
        this.sessionData.startTime = Date.now();
        this.setupTherapyUI();
        this.startTherapySession();
    }

    setupTherapyUI() {
        // Add therapy mode indicator
        const indicator = document.createElement('div');
        indicator.id = 'therapy-indicator';
        indicator.className = 'therapy-indicator';
        indicator.innerHTML = `
            <div class="therapy-status">
                <span class="therapy-icon">🎯</span>
                <span class="therapy-text">Therapy Mode</span>
                <div class="session-timer" id="session-timer">15:00</div>
            </div>
            <div class="focus-area" id="current-focus">
                Focus: Pattern Recognition
            </div>
        `;
        document.body.appendChild(indicator);

        // Add therapy controls
        this.addTherapyControls();
    }

    addTherapyControls() {
        const controls = document.createElement('div');
        controls.id = 'therapy-controls';
        controls.className = 'therapy-controls';
        controls.innerHTML = `
            <button id="therapy-break" class="therapy-btn">Take Break</button>
            <button id="therapy-note" class="therapy-btn">Add Note</button>
            <button id="therapy-adjust" class="therapy-btn">Adjust</button>
        `;
        document.body.appendChild(controls);

        // Setup control events
        document.getElementById('therapy-break').addEventListener('click', () => {
            this.initiateBreak();
        });

        document.getElementById('therapy-note').addEventListener('click', () => {
            this.addTherapyNote();
        });

        document.getElementById('therapy-adjust').addEventListener('click', () => {
            this.showTherapyAdjustments();
        });
    }

    startTherapySession() {
        this.updateSessionTimer();
        this.setCurrentFocus();
        this.scheduleBreakReminder();
        
        // Enhanced data collection for therapy
        this.startDataCollection();
    }

    updateSessionTimer() {
        const timer = document.getElementById('session-timer');
        if (!timer || !this.isActive) return;

        const elapsed = Date.now() - this.sessionData.startTime;
        const remaining = (this.therapySettings.sessionLength * 60000) - elapsed;
        
        if (remaining <= 0) {
            this.endTherapySession();
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        setTimeout(() => this.updateSessionTimer(), 1000);
    }

    setCurrentFocus() {
        const focusAreas = {
            attention: 'Sustained Attention',
            motor: 'Fine Motor Skills',
            pattern: 'Pattern Recognition',
            social: 'Social Interaction'
        };

        const currentArea = this.therapySettings.focusAreas[
            Math.floor(Math.random() * this.therapySettings.focusAreas.length)
        ];
        
        this.sessionData.currentFocus = currentArea;
        const focusElement = document.getElementById('current-focus');
        if (focusElement) {
            focusElement.textContent = `Focus: ${focusAreas[currentArea]}`;
        }
    }

    scheduleBreakReminder() {
        if (this.therapySettings.breakInterval > 0) {
            setTimeout(() => {
                if (this.isActive) {
                    this.suggestBreak();
                }
            }, this.therapySettings.breakInterval * 60000);
        }
    }

    suggestBreak() {
        const breakSuggestion = document.createElement('div');
        breakSuggestion.className = 'break-suggestion';
        breakSuggestion.innerHTML = `
            <div class="break-content">
                <h3>🌟 Great Work!</h3>
                <p>Time for a little break?</p>
                <div class="break-buttons">
                    <button id="take-break" class="break-btn primary">Take Break</button>
                    <button id="continue-playing" class="break-btn secondary">Keep Playing</button>
                </div>
            </div>
        `;
        document.body.appendChild(breakSuggestion);

        document.getElementById('take-break').addEventListener('click', () => {
            this.initiateBreak();
            breakSuggestion.remove();
        });

        document.getElementById('continue-playing').addEventListener('click', () => {
            breakSuggestion.remove();
            this.scheduleBreakReminder();
        });
    }

    initiateBreak() {
        const breakTime = Date.now();
        this.sessionData.breaks.push({ startTime: breakTime });
        
        const breakScreen = document.createElement('div');
        breakScreen.id = 'therapy-break';
        breakScreen.className = 'therapy-break-screen';
        breakScreen.innerHTML = `
            <div class="break-content">
                <div class="break-animation">
                    <div class="breathing-circle"></div>
                </div>
                <h2>Take a Deep Breath</h2>
                <p>Relax and breathe slowly...</p>
                <div class="break-timer" id="break-timer">2:00</div>
                <button id="end-break" class="break-btn">I'm Ready!</button>
            </div>
        `;
        document.body.appendChild(breakScreen);

        this.startBreakTimer();
    }

    startBreakTimer() {
        const breakDuration = 120000; // 2 minutes
        const startTime = Date.now();
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = breakDuration - elapsed;
            
            if (remaining <= 0) {
                this.endBreak();
                return;
            }
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            const timer = document.getElementById('break-timer');
            if (timer) {
                timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            setTimeout(updateTimer, 1000);
        };
        
        updateTimer();
        
        document.getElementById('end-break').addEventListener('click', () => {
            this.endBreak();
        });
    }

    endBreak() {
        const breakScreen = document.getElementById('therapy-break');
        if (breakScreen) {
            breakScreen.remove();
        }
        
        // Record break end time
        const lastBreak = this.sessionData.breaks[this.sessionData.breaks.length - 1];
        if (lastBreak) {
            lastBreak.endTime = Date.now();
            lastBreak.duration = lastBreak.endTime - lastBreak.startTime;
        }
        
        this.scheduleBreakReminder();
    }

    addTherapyNote() {
        const noteDialog = document.createElement('div');
        noteDialog.className = 'therapy-note-dialog';
        noteDialog.innerHTML = `
            <div class="note-content">
                <h3>Add Therapy Note</h3>
                <textarea id="therapy-note-text" placeholder="Observations, behaviors, progress notes..."></textarea>
                <div class="note-buttons">
                    <button id="save-note" class="note-btn primary">Save Note</button>
                    <button id="cancel-note" class="note-btn secondary">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(noteDialog);

        document.getElementById('save-note').addEventListener('click', () => {
            const noteText = document.getElementById('therapy-note-text').value;
            if (noteText.trim()) {
                this.sessionData.responses.push({
                    type: 'note',
                    timestamp: Date.now(),
                    content: noteText,
                    focus: this.sessionData.currentFocus
                });
            }
            noteDialog.remove();
        });

        document.getElementById('cancel-note').addEventListener('click', () => {
            noteDialog.remove();
        });
    }

    showTherapyAdjustments() {
        const adjustDialog = document.createElement('div');
        adjustDialog.className = 'therapy-adjust-dialog';
        adjustDialog.innerHTML = `
            <div class="adjust-content">
                <h3>Therapy Adjustments</h3>
                <div class="adjust-options">
                    <div class="adjust-group">
                        <label>Difficulty Level</label>
                        <div class="adjust-buttons">
                            <button class="adjust-btn" data-action="decrease-difficulty">Easier</button>
                            <button class="adjust-btn" data-action="increase-difficulty">Harder</button>
                        </div>
                    </div>
                    <div class="adjust-group">
                        <label>Response Time</label>
                        <div class="adjust-buttons">
                            <button class="adjust-btn" data-action="slower-pace">Slower</button>
                            <button class="adjust-btn" data-action="faster-pace">Faster</button>
                        </div>
                    </div>
                    <div class="adjust-group">
                        <label>Sensory Input</label>
                        <div class="adjust-buttons">
                            <button class="adjust-btn" data-action="reduce-stimulation">Less</button>
                            <button class="adjust-btn" data-action="increase-stimulation">More</button>
                        </div>
                    </div>
                </div>
                <button id="close-adjust" class="adjust-btn close">Close</button>
            </div>
        `;
        document.body.appendChild(adjustDialog);

        // Handle adjustments
        adjustDialog.addEventListener('click', (e) => {
            if (e.target.dataset.action) {
                this.applyTherapyAdjustment(e.target.dataset.action);
            }
        });

        document.getElementById('close-adjust').addEventListener('click', () => {
            adjustDialog.remove();
        });
    }

    applyTherapyAdjustment(action) {
        switch (action) {
            case 'decrease-difficulty':
                this.gameEngine.adaptiveSystem.playerProfile.difficultyLevel = 
                    Math.max(1, this.gameEngine.adaptiveSystem.playerProfile.difficultyLevel - 0.5);
                break;
            case 'increase-difficulty':
                this.gameEngine.adaptiveSystem.playerProfile.difficultyLevel = 
                    Math.min(5, this.gameEngine.adaptiveSystem.playerProfile.difficultyLevel + 0.5);
                break;
            case 'slower-pace':
                this.therapySettings.adaptiveSpeed = 'slow';
                break;
            case 'faster-pace':
                this.therapySettings.adaptiveSpeed = 'fast';
                break;
            case 'reduce-stimulation':
                this.therapySettings.sensoryProfile = 'hypersensitive';
                this.audioManager.setVolume(0.3);
                break;
            case 'increase-stimulation':
                this.therapySettings.sensoryProfile = 'hyposensitive';
                this.audioManager.setVolume(0.9);
                break;
        }
        
        this.saveTherapySettings();
        this.recordAdjustment(action);
    }

    recordAdjustment(action) {
        this.sessionData.responses.push({
            type: 'adjustment',
            timestamp: Date.now(),
            action: action,
            focus: this.sessionData.currentFocus
        });
    }

    startDataCollection() {
        // Enhanced data collection for therapeutic analysis
        this.originalProcessAnswer = this.gameEngine.processAnswer.bind(this.gameEngine);
        
        this.gameEngine.processAnswer = (isCorrect, responseTime) => {
            // Record detailed response data
            this.sessionData.responses.push({
                type: 'game_response',
                timestamp: Date.now(),
                correct: isCorrect,
                responseTime: responseTime,
                focus: this.sessionData.currentFocus,
                gameType: this.gameEngine.currentRound?.type,
                level: this.gameEngine.level,
                attempt: this.sessionData.responses.filter(r => r.type === 'game_response').length + 1
            });
            
            return this.originalProcessAnswer(isCorrect, responseTime);
        };
    }

    endTherapySession() {
        this.isActive = false;
        
        // Restore original game function
        if (this.originalProcessAnswer) {
            this.gameEngine.processAnswer = this.originalProcessAnswer;
        }
        
        // Generate therapy report
        this.generateTherapyReport();
        
        // Clean up UI
        this.cleanupTherapyUI();
    }

    generateTherapyReport() {
        const sessionDuration = Date.now() - this.sessionData.startTime;
        const gameResponses = this.sessionData.responses.filter(r => r.type === 'game_response');
        const correctResponses = gameResponses.filter(r => r.correct);
        
        const report = {
            sessionDate: new Date().toISOString(),
            duration: sessionDuration,
            totalResponses: gameResponses.length,
            correctResponses: correctResponses.length,
            accuracy: gameResponses.length > 0 ? (correctResponses.length / gameResponses.length) * 100 : 0,
            averageResponseTime: gameResponses.length > 0 ? 
                gameResponses.reduce((sum, r) => sum + r.responseTime, 0) / gameResponses.length : 0,
            focusAreas: this.therapySettings.focusAreas,
            breaks: this.sessionData.breaks,
            notes: this.sessionData.responses.filter(r => r.type === 'note'),
            adjustments: this.sessionData.responses.filter(r => r.type === 'adjustment'),
            recommendations: this.generateRecommendations(gameResponses)
        };
        
        // Save therapy report
        this.saveTherapyReport(report);
        
        // Show summary to user
        this.showSessionSummary(report);
    }

    generateRecommendations(responses) {
        const recommendations = [];
        
        if (responses.length === 0) {
            return ['Session too short for meaningful analysis'];
        }
        
        const accuracy = responses.filter(r => r.correct).length / responses.length;
        const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
        
        if (accuracy < 0.5) {
            recommendations.push('Consider reducing difficulty level');
            recommendations.push('Provide more encouragement and positive reinforcement');
        } else if (accuracy > 0.9) {
            recommendations.push('Child is ready for increased difficulty');
            recommendations.push('Introduce new game types for variety');
        }
        
        if (avgResponseTime > 5000) {
            recommendations.push('Allow more processing time');
            recommendations.push('Consider breaking tasks into smaller steps');
        } else if (avgResponseTime < 1000) {
            recommendations.push('Child shows quick processing - can handle faster pace');
        }
        
        if (this.sessionData.breaks.length === 0) {
            recommendations.push('Consider incorporating regular breaks');
        }
        
        return recommendations;
    }

    saveTherapyReport(report) {
        const reports = JSON.parse(localStorage.getItem('friendlyMatch_therapyReports') || '[]');
        reports.push(report);
        localStorage.setItem('friendlyMatch_therapyReports', JSON.stringify(reports));
    }

    showSessionSummary(report) {
        const summary = document.createElement('div');
        summary.className = 'therapy-summary';
        summary.innerHTML = `
            <div class="summary-content">
                <h2>🎯 Therapy Session Complete!</h2>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-value">${Math.round(report.duration / 60000)}</span>
                        <span class="stat-label">Minutes</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${report.totalResponses}</span>
                        <span class="stat-label">Responses</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${Math.round(report.accuracy)}%</span>
                        <span class="stat-label">Accuracy</span>
                    </div>
                </div>
                <div class="recommendations">
                    <h3>Recommendations:</h3>
                    <ul>
                        ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                <button id="close-summary" class="summary-btn">Continue</button>
            </div>
        `;
        document.body.appendChild(summary);
        
        document.getElementById('close-summary').addEventListener('click', () => {
            summary.remove();
        });
    }

    cleanupTherapyUI() {
        const elements = ['therapy-indicator', 'therapy-controls'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    deactivateTherapyMode() {
        if (this.isActive) {
            this.endTherapySession();
        }
    }
}