// Global variables
let currentMarkets = [];
let currentFilter = 'all';
let selectedMarketId = null;

// API base URL
const API_BASE_URL = '/prediction-markets';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGlobalStats();
    loadMarkets();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Market type change handler
    document.getElementById('marketType').addEventListener('change', function() {
        const tokenPriceFields = document.getElementById('tokenPriceFields');
        if (this.value === 'token_price') {
            tokenPriceFields.style.display = 'block';
        } else {
            tokenPriceFields.style.display = 'none';
        }
    });

    // Search input handler
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMarkets();
        }
    });
}

// Load global statistics
async function loadGlobalStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/global`);
        const stats = await response.json();
        
        document.getElementById('totalMarkets').textContent = stats.totalMarkets;
        document.getElementById('openMarkets').textContent = stats.openMarkets;
        document.getElementById('totalVolume').textContent = `$${stats.totalVolume.toLocaleString()}`;
        document.getElementById('totalWinnings').textContent = `$${stats.totalWinnings.toLocaleString()}`;
    } catch (error) {
        console.error('Error loading global stats:', error);
    }
}

// Load markets
async function loadMarkets() {
    try {
        const response = await fetch(`${API_BASE_URL}`);
        const data = await response.json();
        currentMarkets = data.markets || data;
        displayMarkets(currentMarkets);
    } catch (error) {
        console.error('Error loading markets:', error);
        displayError('Failed to load markets');
    }
}

// Display markets in the UI
function displayMarkets(markets) {
    const marketsList = document.getElementById('marketsList');
    marketsList.innerHTML = '';

    if (markets.length === 0) {
        marketsList.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No markets found. Create the first prediction market!
                </div>
            </div>
        `;
        return;
    }

    markets.forEach(market => {
        const marketCard = createMarketCard(market);
        marketsList.appendChild(marketCard);
    });
}

// Create a market card
function createMarketCard(market) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    const statusClass = getStatusClass(market.status);
    const timeRemaining = getTimeRemaining(market.endDate);
    
    col.innerHTML = `
        <div class="card market-card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span class="badge ${statusClass}">${market.status.toUpperCase()}</span>
                <small class="text-muted">${market.marketType.replace('_', ' ').toUpperCase()}</small>
            </div>
            <div class="card-body">
                <h5 class="card-title">${market.title}</h5>
                <p class="card-text">${market.description}</p>
                
                <div class="row mb-3">
                    <div class="col-6">
                        <small class="text-muted">Total Staked</small>
                        <div class="fw-bold">$${market.totalStaked.toLocaleString()}</div>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Participants</small>
                        <div class="fw-bold">${market.participants?.length || 0}</div>
                    </div>
                </div>
                
                ${market.tokenSymbol ? `
                    <div class="mb-2">
                        <small class="text-muted">Token: ${market.tokenSymbol}</small>
                        ${market.targetPrice ? `<br><small class="text-muted">Target: $${market.targetPrice}</small>` : ''}
                    </div>
                ` : ''}
                
                <div class="mb-3">
                    <small class="text-muted">Ends: ${new Date(market.endDate).toLocaleDateString()}</small>
                    <br>
                    <small class="text-muted">${timeRemaining}</small>
                </div>
                
                <div class="d-grid gap-2">
                    ${market.status === 'open' ? `
                        <button class="btn btn-primary participation-btn" onclick="showParticipateModal('${market.id}')">
                            <i class="fas fa-coins me-1"></i>Participate
                        </button>
                    ` : `
                        <button class="btn btn-outline-secondary participation-btn" disabled>
                            <i class="fas fa-lock me-1"></i>Closed
                        </button>
                    `}
                    <button class="btn btn-outline-info btn-sm" onclick="viewMarketDetails('${market.id}')">
                        <i class="fas fa-eye me-1"></i>View Details
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Get status class for styling
function getStatusClass(status) {
    switch (status) {
        case 'open': return 'bg-success';
        case 'closed': return 'bg-warning';
        case 'resolved': return 'bg-info';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Get time remaining
function getTimeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) {
        return 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return `${days}d ${hours}h remaining`;
    } else {
        return `${hours}h remaining`;
    }
}

// Show create market modal
function showCreateMarket() {
    const modal = new bootstrap.Modal(document.getElementById('createMarketModal'));
    modal.show();
}

// Create market
async function createMarket() {
    const form = document.getElementById('createMarketForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const marketData = {
        title: document.getElementById('marketTitle').value,
        description: document.getElementById('marketDescription').value,
        marketType: document.getElementById('marketType').value,
        resolutionType: document.getElementById('resolutionType').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        tokenSymbol: document.getElementById('tokenSymbol').value || null,
        targetPrice: parseFloat(document.getElementById('targetPrice').value) || null,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(marketData),
        });
        
        if (response.ok) {
            const market = await response.json();
            showSuccess('Market created successfully!');
            bootstrap.Modal.getInstance(document.getElementById('createMarketModal')).hide();
            form.reset();
            loadMarkets();
            loadGlobalStats();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to create market');
        }
    } catch (error) {
        console.error('Error creating market:', error);
        showError('Failed to create market');
    }
}

// Show participate modal
function showParticipateModal(marketId) {
    selectedMarketId = marketId;
    const modal = new bootstrap.Modal(document.getElementById('participateModal'));
    modal.show();
}

// Participate in market
async function participateInMarket() {
    const form = document.getElementById('participateForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const participationData = {
        marketId: selectedMarketId,
        participationType: document.getElementById('participationType').value,
        amountStaked: parseFloat(document.getElementById('stakeAmount').value),
        userAddress: document.getElementById('userAddress').value || null,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/${selectedMarketId}/participate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(participationData),
        });
        
        if (response.ok) {
            const participation = await response.json();
            showSuccess('Participation successful!');
            bootstrap.Modal.getInstance(document.getElementById('participateModal')).hide();
            form.reset();
            loadMarkets();
            loadGlobalStats();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to participate');
        }
    } catch (error) {
        console.error('Error participating in market:', error);
        showError('Failed to participate in market');
    }
}

// Search markets
async function searchMarkets() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        loadMarkets();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const markets = await response.json();
        displayMarkets(markets);
    } catch (error) {
        console.error('Error searching markets:', error);
        showError('Failed to search markets');
    }
}

// Filter markets
function filterMarkets(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (filter === 'all') {
        displayMarkets(currentMarkets);
    } else {
        const filtered = currentMarkets.filter(market => market.status === filter);
        displayMarkets(filtered);
    }
}

// View market details
function viewMarketDetails(marketId) {
    // This would open a detailed view modal or navigate to a detail page
    alert(`Viewing details for market ${marketId}`);
}

// Show my participations
function showMyParticipations() {
    // This would show a modal or navigate to participations page
    alert('My Participations feature coming soon!');
}

// Show analytics
function showAnalytics() {
    // This would show analytics modal or navigate to analytics page
    alert('Analytics feature coming soon!');
}

// Utility functions
function showSuccess(message) {
    // You could use a toast library or create a simple alert
    alert('Success: ' + message);
}

function showError(message) {
    // You could use a toast library or create a simple alert
    alert('Error: ' + message);
}

function displayError(message) {
    const marketsList = document.getElementById('marketsList');
    marketsList.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        </div>
    `;
} 