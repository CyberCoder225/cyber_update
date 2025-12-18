// Initialize Firebase
let db;
let storage;
let siteConfig = {};
let allApps = [];
let allUpdates = [];

// Initialize Firebase and load data
async function initializeFirebase() {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        storage = firebase.storage();
        
        console.log("Firebase initialized successfully");
        
        // Load site configuration
        await loadSiteConfig();
        
        // Load all data
        await Promise.all([
            loadApps(),
            loadUpdates(),
            loadStats()
        ]);
        
        // Hide loading screen
        document.getElementById('loadingScreen').style.display = 'none';
        
        // Initialize event listeners
        initializeEventListeners();
        
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        showError("Failed to connect to server. Please refresh the page.");
    }
}

// Load site configuration from Firebase
async function loadSiteConfig() {
    try {
        const snapshot = await db.ref('website/config').once('value');
        siteConfig = snapshot.val() || {};
        
        // Update page with config
        updatePageWithConfig();
        
    } catch (error) {
        console.error("Error loading site config:", error);
        // Use defaults
        siteConfig = {
            title: "App Collection",
            description: "All my apps in one place",
            telegram: "https://t.me/yourchannel",
            copyright: "© 2024 App Collection"
        };
        updatePageWithConfig();
    }
}

// Update page with configuration
function updatePageWithConfig() {
    // Update title
    document.title = siteConfig.title || "App Collection";
    document.getElementById('siteTitle').textContent = siteConfig.title || "App Collection";
    document.getElementById('heroTitle').innerHTML = siteConfig.heroTitle || 
        `Welcome to <span class="highlight">${siteConfig.title || "App Collection"}</span>`;
    
    // Update description
    document.getElementById('heroSubtitle').textContent = 
        siteConfig.description || "All my apps in one place";
    
    // Update Telegram link
    const telegramLink = document.getElementById('telegramLink');
    if (siteConfig.telegram) {
        telegramLink.href = siteConfig.telegram;
        telegramLink.target = "_blank";
    }
    
    // Update copyright
    document.getElementById('copyrightText').textContent = 
        siteConfig.copyright || "© 2024 App Collection";
}

// Load all apps from Firebase
async function loadApps() {
    try {
        const snapshot = await db.ref('apps').once('value');
        const apps = [];
        
        snapshot.forEach(child => {
            const app = child.val();
            apps.push({
                id: child.key,
                ...app,
                // Ensure required fields
                name: app.name || "Unnamed App",
                version: app.version || "v1.0.0",
                description: app.description || "No description available",
                category: app.category || "general",
                features: app.features || [],
                downloadUrl: app.downloadUrl || "#",
                icon: app.icon || "fas fa-mobile-alt",
                color: app.color || "#00A884",
                size: app.size || "N/A",
                timestamp: app.timestamp || Date.now(),
                isNew: app.isNew || false,
                isPopular: app.isPopular || false,
                isUpdated: app.isUpdated || false,
                downloads: app.downloads || 0
            });
        });
        
        allApps = apps;
        displayApps(apps);
        updateAppStats(apps);
        
    } catch (error) {
        console.error("Error loading apps:", error);
        showError("Failed to load apps. Please try again.");
    }
}

// Display apps in grid
function displayApps(apps) {
    const grid = document.getElementById('appsGrid');
    
    if (apps.length === 0) {
        grid.innerHTML = `
            <div class="no-apps">
                <i class="fas fa-box-open"></i>
                <h3>No Apps Available</h3>
                <p>Check back later for new apps</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    apps.forEach(app => {
        // Format date
        const date = new Date(app.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Get badges
        const badges = [];
        if (app.isNew) badges.push('NEW');
        if (app.isPopular) badges.push('POPULAR');
        if (app.isUpdated) badges.push('UPDATED');
        
        html += `
        <div class="app-card" data-category="${app.category}" data-search="${app.name.toLowerCase()} ${app.description.toLowerCase()} ${app.features.join(' ').toLowerCase()}">
            <div class="app-header">
                <div class="app-icon" style="background: ${app.color};">
                    <i class="${app.icon}"></i>
                </div>
                ${badges.length > 0 ? `
                <div class="app-badges">
                    ${badges.map(badge => `<span class="app-badge ${badge.toLowerCase()}">${badge}</span>`).join('')}
                </div>
                ` : ''}
            </div>
            <div class="app-content">
                <h3 class="app-title">${app.name}</h3>
                <div class="app-meta">
                    <span class="app-version"><i class="fas fa-code-branch"></i> ${app.version}</span>
                    <span class="app-category"><i class="fas fa-tag"></i> ${app.category}</span>
                </div>
                <p class="app-description">${app.description}</p>
                
                <div class="app-features">
                    <h4><i class="fas fa-star"></i> Features:</h4>
                    <ul>
                        ${app.features.slice(0, 3).map(feature => 
                            `<li><i class="fas fa-check"></i> ${feature}</li>`
                        ).join('')}
                        ${app.features.length > 3 ? 
                            `<li class="more-features">+${app.features.length - 3} more features</li>` : ''
                        }
                    </ul>
                </div>
            </div>
            <div class="app-footer">
                <div class="app-stats">
                    <span class="stat">
                        <i class="fas fa-download"></i>
                        <span>${formatNumber(app.downloads)}</span>
                    </span>
                    <span class="stat">
                        <i class="far fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </span>
                    <span class="stat">
                        <i class="fas fa-hdd"></i>
                        <span>${app.size}</span>
                    </span>
                </div>
                <a href="${app.downloadUrl}" class="download-btn" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-download"></i> Download APK
                </a>
            </div>
        </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Load updates from Firebase
async function loadUpdates() {
    try {
        const snapshot = await db.ref('updates').orderByChild('timestamp').limitToLast(20).once('value');
        const updates = [];
        
        snapshot.forEach(child => {
            const update = child.val();
            updates.push({
                id: child.key,
                ...update,
                timestamp: update.timestamp || Date.now(),
                isCritical: update.isCritical || false
            });
        });
        
        allUpdates = updates.reverse(); // Newest first
        updateUpdatesDrawer(updates);
        updateUpdateStats(updates);
        
    } catch (error) {
        console.error("Error loading updates:", error);
    }
}

// Update updates drawer
function updateUpdatesDrawer(updates) {
    const drawerContent = document.getElementById('drawerContent');
    const updateCount = document.getElementById('updateCount');
    
    if (updates.length === 0) {
        drawerContent.innerHTML = `
            <div class="no-updates">
                <i class="fas fa-inbox"></i>
                <h4>No Updates Yet</h4>
                <p>Check back later for new updates</p>
            </div>
        `;
        updateCount.textContent = '0';
        return;
    }
    
    // Count critical updates for badge
    const criticalCount = updates.filter(u => u.isCritical).length;
    updateCount.textContent = criticalCount > 0 ? criticalCount : updates.length;
    if (criticalCount > 0) {
        updateCount.classList.add('critical');
    }
    
    let html = '';
    updates.forEach(update => {
        const date = new Date(update.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
        <div class="update-item ${update.isCritical ? 'critical' : ''}">
            <div class="update-header">
                <h4>${update.appName || 'App Update'}</h4>
                <span class="update-version">${update.version || 'v1.0.0'}</span>
            </div>
            <div class="update-meta">
                <span class="update-date"><i class="far fa-clock"></i> ${formattedDate}</span>
                ${update.isCritical ? '<span class="critical-tag"><i class="fas fa-exclamation-triangle"></i> Critical</span>' : ''}
            </div>
            <p class="update-description">${update.message || 'Bug fixes and improvements'}</p>
            ${update.changes ? `
            <div class="update-changes">
                <h5><i class="fas fa-list"></i> Changes:</h5>
                <ul>
                    ${update.changes.map(change => `<li><i class="fas fa-check"></i> ${change}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        `;
    });
    
    drawerContent.innerHTML = html;
}

// Load stats from Firebase
async function loadStats() {
    try {
        const snapshot = await db.ref('website/stats').once('value');
        const stats = snapshot.val() || {};
        
        // Update stats display
        document.getElementById('totalAppsCount').textContent = stats.totalApps || allApps.length;
        document.getElementById('totalDownloads').textContent = formatNumber(stats.totalDownloads || 0);
        document.getElementById('activeUsers').textContent = formatNumber(stats.activeUsers || 0);
        document.getElementById('latestVersion').textContent = stats.latestVersion || 'v1.0.0';
        document.getElementById('totalUpdates').textContent = stats.totalUpdates || allUpdates.length;
        document.getElementById('verifiedApps').textContent = stats.verifiedApps || 'All';
        
        // Calculate last update date
        if (allUpdates.length > 0) {
            const latestUpdate = allUpdates[0];
            const date = new Date(latestUpdate.timestamp);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            let lastUpdateText;
            if (diffDays === 0) lastUpdateText = 'Today';
            else if (diffDays === 1) lastUpdateText = 'Yesterday';
            else if (diffDays < 7) lastUpdateText = `${diffDays} days ago`;
            else if (diffDays < 30) lastUpdateText = `${Math.floor(diffDays/7)} weeks ago`;
            else lastUpdateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            document.getElementById('lastUpdate').textContent = lastUpdateText;
        }
        
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// Update app-specific stats
function updateAppStats(apps) {
    // Update total apps count
    document.getElementById('totalAppsCount').textContent = apps.length;
    
    // Calculate total downloads
    const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
    document.getElementById('totalDownloads').textContent = formatNumber(totalDownloads);
}

// Update update-specific stats
function updateUpdateStats(updates) {
    document.getElementById('totalUpdates').textContent = updates.length;
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Search and filter functionality
function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('appSearch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterApps(searchTerm);
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Filter apps
            const filter = this.dataset.filter;
            applyFilter(filter);
        });
    });
    
    // Updates button
    document.getElementById('updatesBtn').addEventListener('click', openDrawer);
    
    // Mobile menu
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.toggle('active');
    });
}

// Filter apps based on search term
function filterApps(searchTerm) {
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        const searchData = card.dataset.search;
        if (searchData.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Apply filter to apps
function applyFilter(filter) {
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        switch(filter) {
            case 'new':
                card.style.display = card.dataset.search.includes('new') ? 'block' : 'none';
                break;
            case 'popular':
                card.style.display = card.dataset.search.includes('popular') ? 'block' : 'none';
                break;
            case 'updated':
                card.style.display = card.dataset.search.includes('updated') ? 'block' : 'none';
                break;
            default: // 'all'
                card.style.display = 'block';
        }
    });
}

// Drawer functions
function openDrawer() {
    document.getElementById('drawerOverlay').style.display = 'block';
    document.getElementById('updatesDrawer').classList.add('active');
}

function closeDrawer() {
    document.getElementById('drawerOverlay').style.display = 'none';
    document.getElementById('updatesDrawer').classList.remove('active');
}

// Show error message
function showError(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.innerHTML = `
        <div class="loading-content error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

// Update last sync time
function updateLastSync() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastSync').textContent = timeString;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    
    // Update sync time every minute
    setInterval(updateLastSync, 60000);
    updateLastSync();
    
    // Close drawer when clicking outside
    document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
    
    // Close drawer with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeDrawer();
    });
});
