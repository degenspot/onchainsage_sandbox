// Tournament System Frontend JavaScript

// Global variables
let currentTournaments = [];
let globalStats = {};
let topPerformers = [];

// API Base URL
const API_BASE = '/api/tournaments';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGlobalStats();
    loadTournaments();
    loadTopPerformers();
    loadTournamentTrends();
});

// Load global statistics
async function loadGlobalStats() {
    try {
        const response = await fetch(`${API_BASE}/analytics/global`);
        const stats = await response.json();
        globalStats = stats;
        updateGlobalStatsDisplay(stats);
    } catch (error) {
        console.error('Error loading global stats:', error);
    }
}

// Update global stats display
function updateGlobalStatsDisplay(stats) {
    document.getElementById('totalTournaments').textContent = stats.totalTournaments || 0;
    document.getElementById('totalParticipants').textContent = stats.totalParticipants || 0;
    document.getElementById('totalPredictions').textContent = stats.totalPredictions || 0;
    document.getElementById('totalRewards').textContent = stats.totalRewards || 0;
}

// Load tournaments
async function loadTournaments() {
    try {
        const response = await fetch(`${API_BASE}`);
        const data = await response.json();
        currentTournaments = data.tournaments || data;
        displayTournaments(currentTournaments);
    } catch (error) {
        console.error('Error loading tournaments:', error);
    }
}

// Display tournaments
function displayTournaments(tournaments) {
    const container = document.getElementById('tournamentsList');
    container.innerHTML = '';

    if (tournaments.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No tournaments found</p></div>';
        return;
    }

    tournaments.forEach(tournament => {
        const card = createTournamentCard(tournament);
        container.appendChild(card);
    });
}

// Create tournament card
function createTournamentCard(tournament) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    const statusClass = getStatusClass(tournament.status);
    const statusText = tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1);

    col.innerHTML = `
        <div class="card tournament-card h-100">
            <div class="card-body position-relative">
                <span class="badge ${statusClass} status-badge">${statusText}</span>
                <h5 class="card-title">${tournament.title}</h5>
                <p class="card-text text-muted">${tournament.description}</p>
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Type</small><br>
                        <strong>${tournament.tournamentType}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Format</small><br>
                        <strong>${tournament.format}</strong>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Participants</small><br>
                        <strong>${tournament.currentParticipants}/${tournament.maxParticipants}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Rounds</small><br>
                        <strong>${tournament.currentRound}/${tournament.totalRounds}</strong>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Start Date</small><br>
                        <strong>${new Date(tournament.startDate).toLocaleDateString()}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Entry Fee</small><br>
                        <strong>${tournament.entryFee || 0} tokens</strong>
                    </div>
                </div>
                <div class="d-grid gap-2">
                    <button class="btn btn-tournament" onclick="viewTournament('${tournament.id}')">
                        <i class="fas fa-eye me-2"></i>View Details
                    </button>
                    ${tournament.status === 'upcoming' ? `
                        <button class="btn btn-outline-primary" onclick="joinTournamentModal('${tournament.id}')">
                            <i class="fas fa-sign-in-alt me-2"></i>Join Tournament
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    return col;
}

// Get status class for badges
function getStatusClass(status) {
    switch (status) {
        case 'active': return 'bg-success';
        case 'upcoming': return 'bg-primary';
        case 'completed': return 'bg-secondary';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Filter tournaments
function filterTournaments(filter) {
    let filteredTournaments = [];
    
    switch (filter) {
        case 'active':
            filteredTournaments = currentTournaments.filter(t => t.status === 'active');
            break;
        case 'upcoming':
            filteredTournaments = currentTournaments.filter(t => t.status === 'upcoming');
            break;
        case 'completed':
            filteredTournaments = currentTournaments.filter(t => t.status === 'completed');
            break;
        default:
            filteredTournaments = currentTournaments;
    }
    
    displayTournaments(filteredTournaments);
}

// Load active tournaments
async function loadActiveTournaments() {
    try {
        const response = await fetch(`${API_BASE}/active`);
        const tournaments = await response.json();
        displayTournaments(tournaments);
    } catch (error) {
        console.error('Error loading active tournaments:', error);
    }
}

// Show create tournament modal
function showCreateTournamentModal() {
    const modal = new bootstrap.Modal(document.getElementById('createTournamentModal'));
    modal.show();
}

// Create tournament
async function createTournament() {
    const form = document.getElementById('createTournamentForm');
    const formData = new FormData(form);
    
    const tournamentData = {
        title: document.getElementById('tournamentTitle').value,
        description: document.getElementById('tournamentDescription').value,
        tournamentType: document.getElementById('tournamentType').value,
        format: document.getElementById('tournamentFormat').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        maxParticipants: parseInt(document.getElementById('maxParticipants').value),
        totalRounds: parseInt(document.getElementById('totalRounds').value),
        entryFee: parseFloat(document.getElementById('entryFee').value) || 0,
        isPublic: document.getElementById('isPublic').checked,
        requiresApproval: document.getElementById('requiresApproval').checked
    };

    try {
        const response = await fetch(`${API_BASE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tournamentData)
        });

        if (response.ok) {
            const tournament = await response.json();
            alert('Tournament created successfully!');
            bootstrap.Modal.getInstance(document.getElementById('createTournamentModal')).hide();
            loadTournaments();
        } else {
            const error = await response.json();
            alert('Error creating tournament: ' + error.message);
        }
    } catch (error) {
        console.error('Error creating tournament:', error);
        alert('Error creating tournament');
    }
}

// Join tournament modal
function joinTournamentModal(tournamentId = '') {
    if (tournamentId) {
        document.getElementById('joinTournamentId').value = tournamentId;
    }
    const modal = new bootstrap.Modal(document.getElementById('joinTournamentModal'));
    modal.show();
}

// Join tournament
async function joinTournament() {
    const tournamentId = document.getElementById('joinTournamentId').value;
    const userAddress = document.getElementById('userAddress').value;

    const joinData = {
        tournamentId: tournamentId,
        userAddress: userAddress || undefined
    };

    try {
        const response = await fetch(`${API_BASE}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(joinData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Successfully joined tournament!');
            bootstrap.Modal.getInstance(document.getElementById('joinTournamentModal')).hide();
        } else {
            const error = await response.json();
            alert('Error joining tournament: ' + error.message);
        }
    } catch (error) {
        console.error('Error joining tournament:', error);
        alert('Error joining tournament');
    }
}

// Submit prediction modal
function submitPredictionModal(tournamentId = '', roundId = '', marketId = '') {
    if (tournamentId) {
        document.getElementById('predictionTournamentId').value = tournamentId;
    }
    if (roundId) {
        document.getElementById('predictionRoundId').value = roundId;
    }
    if (marketId) {
        document.getElementById('predictionMarketId').value = marketId;
    }
    const modal = new bootstrap.Modal(document.getElementById('submitPredictionModal'));
    modal.show();
}

// Submit prediction
async function submitPrediction() {
    const predictionData = {
        tournamentId: document.getElementById('predictionTournamentId').value,
        roundId: document.getElementById('predictionRoundId').value,
        marketId: document.getElementById('predictionMarketId').value,
        predictionType: document.getElementById('predictionType').value,
        prediction: document.getElementById('predictionValue').value,
        confidence: parseFloat(document.getElementById('predictionConfidence').value),
        stakeAmount: parseFloat(document.getElementById('predictionStake').value) || 0
    };

    try {
        const response = await fetch(`${API_BASE}/submit-prediction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(predictionData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Prediction submitted successfully!');
            bootstrap.Modal.getInstance(document.getElementById('submitPredictionModal')).hide();
        } else {
            const error = await response.json();
            alert('Error submitting prediction: ' + error.message);
        }
    } catch (error) {
        console.error('Error submitting prediction:', error);
        alert('Error submitting prediction');
    }
}

// View tournament details
async function viewTournament(tournamentId) {
    try {
        const response = await fetch(`${API_BASE}/${tournamentId}`);
        const tournament = await response.json();
        
        // Load tournament analytics
        const analyticsResponse = await fetch(`${API_BASE}/${tournamentId}/analytics`);
        const analytics = await analyticsResponse.json();
        
        // Load leaderboard
        const leaderboardResponse = await fetch(`${API_BASE}/${tournamentId}/leaderboard`);
        const leaderboard = await leaderboardResponse.json();
        
        showTournamentDetails(tournament, analytics, leaderboard);
    } catch (error) {
        console.error('Error loading tournament details:', error);
    }
}

// Show tournament details
function showTournamentDetails(tournament, analytics, leaderboard) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'tournamentDetailsModal';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${tournament.title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6>Description</h6>
                            <p>${tournament.description}</p>
                            
                            <h6>Tournament Info</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Type:</strong> ${tournament.tournamentType}</p>
                                    <p><strong>Format:</strong> ${tournament.format}</p>
                                    <p><strong>Status:</strong> ${tournament.status}</p>
                                    <p><strong>Current Round:</strong> ${tournament.currentRound}/${tournament.totalRounds}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Participants:</strong> ${tournament.currentParticipants}/${tournament.maxParticipants}</p>
                                    <p><strong>Entry Fee:</strong> ${tournament.entryFee} tokens</p>
                                    <p><strong>Prize Pool:</strong> ${tournament.prizePool} tokens</p>
                                    <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <h6>Analytics</h6>
                            <div class="stats-card mb-3">
                                <p><strong>Total Participants:</strong> ${analytics.participants?.total || 0}</p>
                                <p><strong>Active Participants:</strong> ${analytics.participants?.active || 0}</p>
                                <p><strong>Total Predictions:</strong> ${analytics.predictions?.total || 0}</p>
                                <p><strong>Accuracy Rate:</strong> ${analytics.predictions?.accuracyRate?.toFixed(2) || 0}%</p>
                            </div>
                        </div>
                    </div>
                    
                    <h6>Leaderboard</h6>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>User</th>
                                    <th>Score</th>
                                    <th>Accuracy</th>
                                    <th>Predictions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${leaderboard.slice(0, 10).map((entry, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${entry.participant?.userId || 'Unknown'}</td>
                                        <td>${entry.totalScore}</td>
                                        <td>${entry.accuracyRate?.toFixed(2) || 0}%</td>
                                        <td>${entry.totalPredictions}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    ${tournament.status === 'upcoming' ? `
                        <button type="button" class="btn btn-primary" onclick="joinTournamentModal('${tournament.id}')">Join Tournament</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}

// Load top performers
async function loadTopPerformers() {
    try {
        const response = await fetch(`${API_BASE}/analytics/top-performers?limit=10`);
        topPerformers = await response.json();
        displayTopPerformers(topPerformers);
    } catch (error) {
        console.error('Error loading top performers:', error);
    }
}

// Display top performers
function displayTopPerformers(performers) {
    const container = document.getElementById('topPerformers');
    
    if (performers.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No performers found</p>';
        return;
    }
    
    const performersList = performers.map((performer, index) => `
        <div class="leaderboard-item d-flex justify-content-between align-items-center p-3 border-bottom">
            <div class="d-flex align-items-center">
                <div class="me-3">
                    ${index < 3 ? `<i class="fas fa-trophy text-warning"></i>` : `<strong>${index + 1}</strong>`}
                </div>
                <div>
                    <strong>${performer.userId}</strong>
                    <br>
                    <small class="text-muted">${performer.tournamentTitle}</small>
                </div>
            </div>
            <div class="text-end">
                <div><strong>${performer.totalScore}</strong> points</div>
                <small class="text-muted">${performer.accuracyRate?.toFixed(2) || 0}% accuracy</small>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = performersList;
}

// Load tournament trends
async function loadTournamentTrends() {
    try {
        const response = await fetch(`${API_BASE}/analytics/trends?days=30`);
        const trends = await response.json();
        createTrendsChart(trends);
    } catch (error) {
        console.error('Error loading trends:', error);
    }
}

// Create trends chart
function createTrendsChart(trends) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    const dates = Object.keys(trends.dailyStats).reverse();
    const tournamentData = dates.map(date => trends.dailyStats[date].tournaments);
    const participantData = dates.map(date => trends.dailyStats[date].participants);
    const predictionData = dates.map(date => trends.dailyStats[date].predictions);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Tournaments',
                    data: tournamentData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Participants',
                    data: participantData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Predictions',
                    data: predictionData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Tournament Activity Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Search tournaments
async function searchTournaments(query) {
    try {
        const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
        const tournaments = await response.json();
        displayTournaments(tournaments);
    } catch (error) {
        console.error('Error searching tournaments:', error);
    }
}

// Export functions for global access
window.showCreateTournamentModal = showCreateTournamentModal;
window.loadActiveTournaments = loadActiveTournaments;
window.filterTournaments = filterTournaments;
window.createTournament = createTournament;
window.joinTournamentModal = joinTournamentModal;
window.joinTournament = joinTournament;
window.submitPredictionModal = submitPredictionModal;
window.submitPrediction = submitPrediction;
window.viewTournament = viewTournament;
window.searchTournaments = searchTournaments; 