class CodeQuestTracker {
    constructor() {
        this.challenges = JSON.parse(localStorage.getItem('challenges')) || [];
        this.stats = JSON.parse(localStorage.getItem('stats')) || {
            totalChallenges: 0,
            currentStreak: 0,
            lastChallengeDate: null
        };
        
        this.init();
    }

    init() {
        this.updateStats();
        this.renderChallenges();
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
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toLocaleString()
        };

        this.challenges.unshift(challenge);
        this.updateChallengeStats();
        this.saveData();
        this.renderChallenges();
        this.updateStats();
        
        // Clear form
        document.getElementById('challengeName').value = '';
        
        // Show success animation
        this.showSuccessMessage();
    }

    updateChallengeStats() {
        this.stats.totalChallenges = this.challenges.length;
        
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const sortedDates = [...new Set(this.challenges.map(c => c.date))].sort().reverse();
        
        let streak = 0;
        let currentDate = new Date();
        
        for (let date of sortedDates) {
            const challengeDate = new Date(date + 'T00:00:00');
            const daysDiff = Math.floor((currentDate - challengeDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
                currentDate = challengeDate;
            } else if (daysDiff === streak + 1 && streak === 0) {
                // Allow for yesterday if today is the first day
                streak++;
                currentDate = challengeDate;
            } else {
                break;
            }
        }
        
        this.stats.currentStreak = streak;
        this.stats.lastChallengeDate = today;
    }

    getCurrentLevel() {
        const total = this.stats.totalChallenges;
        if (total >= 100) return 'Master';
        if (total >= 50) return 'Expert';
        if (total >= 25) return 'Advanced';
        if (total >= 10) return 'Intermediate';
        return 'Beginner';
    }

    updateStats() {
        document.getElementById('totalChallenges').textContent = this.stats.totalChallenges;
        document.getElementById('currentStreak').textContent = this.stats.currentStreak;
        document.getElementById('currentLevel').textContent = this.getCurrentLevel();
    }

    renderChallenges() {
        const container = document.getElementById('challengesList');
        
        if (this.challenges.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No challenges completed yet. Add your first one above! 🚀</p>';
            return;
        }

        const challengesHTML = this.challenges
            .slice(0, 10) // Show only last 10 challenges
            .map(challenge => `
                <div class="challenge-item difficulty-${challenge.difficulty}">
                    <strong>${challenge.name}</strong>
                    <div class="challenge-meta">
                        <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty.toUpperCase()}</span>
                        <span>${challenge.timestamp}</span>
                    </div>
                </div>
            `).join('');

        container.innerHTML = challengesHTML;
    }

    showSuccessMessage() {
        const button = document.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        button.textContent = '🎉 Great job!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 2000);
    }

    saveData() {
        localStorage.setItem('challenges', JSON.stringify(this.challenges));
        localStorage.setItem('stats', JSON.stringify(this.stats));
    }

    // Bonus: Export data method
    exportData() {
        const data = {
            challenges: this.challenges,
            stats: this.stats,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codequest-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new CodeQuestTracker();
});

// Add some fun console messages
console.log('🚀 CodeQuest Tracker loaded!');
console.log('💡 Try: tracker.exportData() to export your progress');
