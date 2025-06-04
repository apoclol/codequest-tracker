class CodeQuestTracker {
    constructor() {
        this.activeChallenges = JSON.parse(localStorage.getItem('activeChallenges')) || [];
        this.completedChallenges = JSON.parse(localStorage.getItem('completedChallenges')) || [];
        this.stats = JSON.parse(localStorage.getItem('stats')) || {
            totalPoints: 0,
            totalChallenges: 0,
            level: 'Beginner'
        };
        this.achievements = JSON.parse(localStorage.getItem('achievements')) || [];
        
        this.achievementDefinitions = [
            { id: 'first_challenge', name: 'First Steps', description: 'Complete your first challenge', icon: '🎯', condition: () => this.stats.totalChallenges >= 1 },
            { id: 'five_challenges', name: 'Getting Started', description: 'Complete 5 challenges', icon: '🚀', condition: () => this.stats.totalChallenges >= 5 },
            { id: 'ten_challenges', name: 'Committed', description: 'Complete 10 challenges', icon: '💪', condition: () => this.stats.totalChallenges >= 10 },
            { id: 'twenty_five_challenges', name: 'Dedicated', description: 'Complete 25 challenges', icon: '🔥', condition: () => this.stats.totalChallenges >= 25 },
            { id: 'fifty_challenges', name: 'Unstoppable', description: 'Complete 50 challenges', icon: '⚡', condition: () => this.stats.totalChallenges >= 50 },
            { id: 'hundred_challenges', name: 'Legendary', description: 'Complete 100 challenges', icon: '👑', condition: () => this.stats.totalChallenges >= 100 },
            { id: 'week_streak', name: 'Weekly Warrior', description: 'Complete challenges 7 days in a row', icon: '📅', condition: () => this.checkWeekStreak() },
            { id: 'daily_grind', name: 'Daily Grind', description: 'Complete 5 challenges in one day', icon: '🌟', condition: () => this.checkDailyGrind() },
            { id: 'point_collector', name: 'Point Collector', description: 'Earn 500 total points', icon: '💎', condition: () => this.stats.totalPoints >= 500 },
            { id: 'hard_mode', name: 'Hard Mode', description: 'Complete 10 hard challenges', icon: '🎖️', condition: () => this.countDifficultyCompleted('hard') >= 10 },
            { id: 'balanced', name: 'Well Balanced', description: 'Complete at least 5 of each difficulty', icon: '⚖️', condition: () => this.checkBalanced() },
            { id: 'speed_demon', name: 'Speed Demon', description: 'Complete 3 challenges in 1 hour', icon: '⚡', condition: () => this.checkSpeedDemon() }
        ];
        
        this.levelThresholds = [
            { name: 'Beginner', points: 0, color: 'gray' },
            { name: 'Novice', points: 50, color: 'green' },
            { name: 'Intermediate', points: 100, color: 'blue' },
            { name: 'Advanced', points: 200, color: 'orange' },
            { name: 'Expert', points: 350, color: 'purple' }
        ];
        
        this.init();
    }

    init() {
        this.updateStats();
        this.renderActiveChallenges();
        this.renderCompletedChallenges();
        this.renderAchievements();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('challengeForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addChallenge();
        });
    }

    addChallenge() {
    const name = document.getElementById('challengeName').value;
    const difficulty = document.getElementById('difficulty').value;
    
    if (!name.trim()) return;

    const challenge = {
        id: Date.now(),
        name: name.trim(),
        difficulty: difficulty,
        points: this.getPointsForDifficulty(difficulty),
        dateCreated: new Date().toISOString(),
        status: 'active'
    };

    this.activeChallenges.push(challenge);
    this.saveData();
    
    // Update displays immediately
    this.renderActiveChallenges();
    this.updateStats();
    
    // Clear form
    document.getElementById('challengeName').value = '';
    
    // Show success animation
    this.showAddMessage();
    }

    completeChallenge(challengeId) {
        const challengeIndex = this.activeChallenges.findIndex(c => c.id === challengeId);
        if (challengeIndex === -1) return;
        
        const challenge = this.activeChallenges[challengeIndex];
        challenge.status = 'completed';
        challenge.dateCompleted = new Date().toISOString();
        challenge.completedTime = new Date().toLocaleString();
        
        // Add to completed challenges
        this.completedChallenges.unshift(challenge);
        
        // Remove from active challenges
        this.activeChallenges.splice(challengeIndex, 1);
        
        // Update stats
        this.stats.totalPoints += challenge.points;
        this.stats.totalChallenges += 1;
        
        // Check for level up
        this.checkLevelUp();
        
        // Check for new achievements
        this.checkAchievements();
        
        this.saveData();
        this.updateStats();
        this.renderActiveChallenges();
        this.renderCompletedChallenges();
        this.renderAchievements();
        
        // Show completion animation
        this.showCompletionEffect(challenge);
    }

    getPointsForDifficulty(difficulty) {
        const points = { easy: 5, medium: 10, hard: 20 };
        return points[difficulty] || 5;
    }

    checkLevelUp() {
        const currentLevel = this.getCurrentLevel();
        if (currentLevel.name !== this.stats.level) {
            this.stats.level = currentLevel.name;
            this.showLevelUpNotification(currentLevel);
        }
    }

    getCurrentLevel() {
        let currentLevel = this.levelThresholds[0];
        for (let level of this.levelThresholds) {
            if (this.stats.totalPoints >= level.points) {
                currentLevel = level;
            }
        }
        return currentLevel;
    }

    getNextLevel() {
        const currentLevel = this.getCurrentLevel();
        const currentIndex = this.levelThresholds.findIndex(l => l.name === currentLevel.name);
        return this.levelThresholds[currentIndex + 1] || null;
    }

    checkAchievements() {
        const newAchievements = [];
        
        for (let achievement of this.achievementDefinitions) {
            if (!this.achievements.includes(achievement.id) && achievement.condition()) {
                this.achievements.push(achievement.id);
                this.stats.totalPoints += 10; // Bonus points for achievement
                newAchievements.push(achievement);
            }
        }
        
        // Show achievement notifications
        newAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showAchievementNotification(achievement);
            }, index * 1000);
        });
    }

    // Achievement condition helpers
    checkWeekStreak() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentChallenges = this.completedChallenges.filter(c => 
            new Date(c.dateCompleted) >= oneWeekAgo
        );
        
        const dates = [...new Set(recentChallenges.map(c => 
            new Date(c.dateCompleted).toDateString()
        ))];
        
        return dates.length >= 7;
    }

    checkDailyGrind() {
        const today = new Date().toDateString();
        const todaysChallenges = this.completedChallenges.filter(c => 
            new Date(c.dateCompleted).toDateString() === today
        );
        return todaysChallenges.length >= 5;
    }

    checkBalanced() {
        const easyCount = this.countDifficultyCompleted('easy');
        const mediumCount = this.countDifficultyCompleted('medium');
        const hardCount = this.countDifficultyCompleted('hard');
        
        return easyCount >= 5 && mediumCount >= 5 && hardCount >= 5;
    }

    checkSpeedDemon() {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        const recentChallenges = this.completedChallenges.filter(c => 
            new Date(c.dateCompleted) >= oneHourAgo
        );
        
        return recentChallenges.length >= 3;
    }

    countDifficultyCompleted(difficulty) {
        return this.completedChallenges.filter(c => c.difficulty === difficulty).length;
    }

    updateStats() {
    // Update basic stats
    document.getElementById('totalPoints').textContent = this.stats.totalPoints;
    document.getElementById('totalChallenges').textContent = this.stats.totalChallenges;
    
    // Today's challenges
    const today = new Date().toDateString();
    const todaysCount = this.completedChallenges.filter(c => 
        new Date(c.dateCompleted).toDateString() === today
    ).length;
    document.getElementById('todayChallenges').textContent = todaysCount;
    
    // This week's challenges
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekCount = this.completedChallenges.filter(c => 
        new Date(c.dateCompleted) >= oneWeekAgo
    ).length;
    document.getElementById('weekChallenges').textContent = weekCount;
    
    // Level display
    const currentLevel = this.getCurrentLevel();
    const nextLevel = this.getNextLevel();
    
    const levelElement = document.getElementById('currentLevel');
    levelElement.textContent = currentLevel.name;
    levelElement.className = `level-text level-${currentLevel.color}`;
    levelElement.textContent = currentLevel.name;
    levelElement.className = `level-text level-${currentLevel.color}`;
    
    // Sparkle effect for advanced levels
    const sparkleElement = document.getElementById('levelSparkle');
    if (currentLevel.name === 'Advanced' || currentLevel.name === 'Expert') {
        sparkleElement.classList.add('active');
    } else {
        sparkleElement.classList.remove('active');
    }
        
        // Progress bar
        if (nextLevel) {
            const progress = (this.stats.totalPoints - currentLevel.points) / (nextLevel.points - currentLevel.points);
            const progressPercent = Math.min(progress * 100, 100);
            document.getElementById('progressFill').style.width = `${progressPercent}%`;
            document.getElementById('progressText').textContent = 
                `${this.stats.totalPoints - currentLevel.points}/${nextLevel.points - currentLevel.points} to ${nextLevel.name}`;
        } else {
            document.getElementById('progressFill').style.width = '100%';
            document.getElementById('progressText').textContent = 'Max Level Reached!';
        }
    }

    renderActiveChallenges() {
        const container = document.getElementById('activeChallengesList');
        
        if (this.activeChallenges.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No active challenges. Add one above! 🎯</p>';
            return;
        }

        const challengesHTML = this.activeChallenges.map(challenge => `
            <div class="challenge-item difficulty-${challenge.difficulty}">
                <div class="challenge-info">
                    <strong>${challenge.name}</strong>
                    <div class="challenge-meta">
                        <span class="difficulty-badge">${challenge.difficulty.toUpperCase()}</span>
                        <span>${challenge.points} pts</span>
                        <span>Added: ${new Date(challenge.dateCreated).toLocaleDateString()}</span>
                    </div>
                </div>
                <button class="complete-btn" onclick="tracker.completeChallenge(${challenge.id})">
                    Complete
                </button>
            </div>
        `).join('');

        container.innerHTML = challengesHTML;
    }

    renderCompletedChallenges() {
        const container = document.getElementById('completedChallengesList');
        
        if (this.completedChallenges.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No completed challenges yet. Keep going! 💪</p>';
            return;
        }

        const challengesHTML = this.completedChallenges
            .slice(0, 10) // Show only last 10 challenges
            .map(challenge => `
                <div class="challenge-item difficulty-${challenge.difficulty}">
                    <div class="challenge-info">
                        <strong>${challenge.name}</strong>
                        <div class="challenge-meta">
                            <span class="difficulty-badge">${challenge.difficulty.toUpperCase()}</span>
                            <span>+${challenge.points} pts</span>
                            <span>Completed: ${challenge.completedTime}</span>
                        </div>
                    </div>
                    <span style="color: #28a745; font-weight: bold;">✓</span>
                </div>
            `).join('');

        container.innerHTML = challengesHTML;
    }

    renderAchievements() {
        const container = document.getElementById('achievementsList');
        
        const achievementsHTML = this.achievementDefinitions.map(achievement => {
            const isUnlocked = this.achievements.includes(achievement.id);
            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <strong>${achievement.name}</strong>
                    <p>${achievement.description}</p>
                    ${isUnlocked ? '<small style="color: #28a745;">✓ Unlocked (+10 pts)</small>' : '<small>Locked</small>'}
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="achievements-grid">${achievementsHTML}</div>`;
    }

    showAddMessage() {
        const button = document.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        button.textContent = '✓ Added!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 1500);
    }

    showCompletionEffect(challenge) {
        // Create floating points animation
        const pointsDiv = document.createElement('div');
        pointsDiv.textContent = `+${challenge.points} pts`;
        pointsDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #28a745;
            font-size: 2rem;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: floatUp 2s ease-out forwards;
        `;
        
        document.body.appendChild(pointsDiv);
        
        setTimeout(() => {
            document.body.removeChild(pointsDiv);
        }, 2000);
    }

    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        document.getElementById('achievementTitle').textContent = achievement.name;
        document.getElementById('achievementDescription').textContent = achievement.description + ' (+10 pts)';
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    showLevelUpNotification(level) {
        // Create a special level up notification
        const levelUpDiv = document.createElement('div');
        levelUpDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                    <h1 style="color: #667eea; margin-bottom: 20px;">🎉 LEVEL UP! 🎉</h1>
                    <h2 style="color: #333; margin-bottom: 10px;">You are now ${level.name}!</h2>
                    <p style="color: #666;">Keep up the amazing work!</p>
                    <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Continue
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(levelUpDiv);
    }

    saveData() {
        localStorage.setItem('activeChallenges', JSON.stringify(this.activeChallenges));
        localStorage.setItem('completedChallenges', JSON.stringify(this.completedChallenges));
        localStorage.setItem('stats', JSON.stringify(this.stats));
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    // Export data method
    exportData() {
        const data = {
            activeChallenges: this.activeChallenges,
            completedChallenges: this.completedChallenges,
            stats: this.stats,
            achievements: this.achievements,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codequest-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Add CSS for floating animation
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -70%) scale(1.2);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new CodeQuestTracker();
});

// Update the card border
document.querySelector('.level-card').className = `stat-card level-card level-${currentLevel.color}`;

// Add some fun console messages
console.log('🚀 CodeQuest Tracker 2.0 loaded!');
console.log('💡 Try: tracker.exportData() to export your progress');
console.log('🎮 New features: Points, Achievements, and Level progression!');
