// app.js - Load Firebase config from environment variables

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || process.env?.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || process.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || process.env?.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || process.env?.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || process.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || process.env?.VITE_FIREBASE_APP_ID || ""
};

// Check if Firebase config is valid
function isFirebaseConfigValid(config) {
    return config.apiKey && 
           config.projectId && 
           config.databaseURL &&
           config.apiKey !== "YOUR_API_KEY_HERE";
}

// Initialize Firebase
let db;
let siteConfig = {};
let allApps = [];
let allUpdates = [];

async function initializeFirebase() {
    try {
        // Check if config is valid
        if (!isFirebaseConfigValid(firebaseConfig)) {
            console.warn("Firebase config not found. Using demo mode.");
            showDemoData();
            return;
        }

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        
        console.log("Firebase initialized successfully");
        
        // Load all data
        await Promise.all([
            loadSiteConfig(),
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
        showDemoData();
    }
}

// Load site configuration
async function loadSiteConfig() {
    try {
        const snapshot = await db.ref('website/config').once('value');
        siteConfig = snapshot.val() || getDefaultConfig();
        updatePageWithConfig();
    } catch (error) {
        console.error("Error loading config:", error);
        siteConfig = getDefaultConfig();
        updatePageWithConfig();
    }
}

function getDefaultConfig() {
    return {
        title: "App Collection",
        description: "All my premium apps in one place",
        heroTitle: "Welcome to <span class='highlight'>App Collection</span>",
        telegram: "https://t.me/yourchannel",
        copyright: "© 2024 App Collection"
    };
}

function updatePageWithConfig() {
    document.title = siteConfig.title;
    document.getElementById('siteTitle').textContent = siteConfig.title;
    document.getElementById('heroTitle').innerHTML = siteConfig.heroTitle;
    document.getElementById('heroSubtitle').textContent = siteConfig.description;
    document.getElementById('copyrightText').textContent = siteConfig.copyright;
    
    const telegramLink = document.getElementById('telegramLink');
    if (siteConfig.telegram) {
        telegramLink.href = siteConfig.telegram;
        telegramLink.target = "_blank";
    }
}

// Load apps from Firebase
async function loadApps() {
    try {
        const snapshot = await db.ref('apps').once('value');
        const apps = [];
        
        snapshot.forEach(child => {
            const app = child.val();
            apps.push({
                id: child.key,
                ...app,
                name: app.name || "Unnamed App",
                version: app.version || "v1.0.0",
                description: app.description || "No description",
                downloadUrl: app.downloadUrl || "#"
            });
        });
        
        allApps = apps;
        displayApps(apps);
        updateAppStats(apps);
        
    } catch (error) {
        console.error("Error loading apps:", error);
        showDemoApps();
    }
}

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
        html += `
        <div class="app-card">
            <div class="app-icon" style="background: ${app.color || '#00A884'};">
                <i class="${app.icon || 'fas fa-mobile-alt'}"></i>
            </div>
            <h3 class="app-title">${app.name}</h3>
            <div class="app-version">${app.version}</div>
            <p class="app-description">${app.description}</p>
            <a href="${app.downloadUrl}" class="download-btn" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-download"></i> Download APK
            </a>
        </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Load updates
async function loadUpdates() {
    try {
        const snapshot = await db.ref('updates').orderByChild('timestamp').limitToLast(10).once('value');
        const updates = [];
        
        snapshot.forEach(child => {
            updates.push({
                id: child.key,
                ...child.val()
            });
        });
        
        allUpdates = updates.reverse();
        updateUpdatesDrawer(updates);
        
    } catch (error) {
        console.error("Error loading updates:", error);
        showDemoUpdates();
    }
}

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
    
    updateCount.textContent = updates.length;
    
    let html = '';
    updates.forEach(update => {
        const date = new Date(update.timestamp || Date.now()).toLocaleDateString();
        
        html += `
        <div class="update-item">
            <h4>${update.appName || 'App Update'}</h4>
            <div class="update-version">${update.version || 'v1.0.0'}</div>
            <div class="update-date">${date}</div>
            <p>${update.message || 'Bug fixes and improvements'}</p>
        </div>
        `;
    });
    
    drawerContent.innerHTML = html;
}

// Load stats
async function loadStats() {
    try {
        const snapshot = await db.ref('website/stats').once('value');
        const stats = snapshot.val() || {};
        
        document.getElementById('totalAppsCount').textContent = stats.totalApps || allApps.length;
        document.getElementById('totalDownloads').textContent = formatNumber(stats.totalDownloads || 0);
        document.getElementById('activeUsers').textContent = formatNumber(stats.activeUsers || 0);
        document.getElementById('latestVersion').textContent = stats.latestVersion || 'v1.0.0';
        document.getElementById('totalUpdates').textContent = stats.totalUpdates || allUpdates.length;
        
    } catch (error) {
        console.error("Error loading stats:", error);
        showDemoStats();
    }
}

function updateAppStats(apps) {
    document.getElementById('totalAppsCount').textContent = apps.length;
    const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
    document.getElementById('totalDownloads').textContent = formatNumber(totalDownloads);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

// Demo data for when Firebase is not available
function showDemoData() {
    console.log("Showing demo data");
    
    // Demo config
    siteConfig = getDefaultConfig();
    updatePageWithConfig();
    
    // Demo apps
    showDemoApps();
    
    // Demo updates
    showDemoUpdates();
    
    // Demo stats
    showDemoStats();
    
    // Hide loading screen
    document.getElementById('loadingScreen').style.display = 'none';
    initializeEventListeners();
}

function showDemoApps() {
    const demoApps = [
        {
            name: "Cyber Links Pro",
            version: "v2.5.0",
            description: "Premium security and connectivity app",
            downloadUrl: "#",
            color: "#00A884",
            icon: "fas fa-shield-alt",
            downloads: 2500
        },
        {
            name: "Video Downloader",
            version: "v1.8.2",
            description: "Download videos from all platforms",
            downloadUrl: "#",
            color: "#FF4444",
            icon: "fas fa-video",
            downloads: 1800
        },
        {
            name: "Music Stream Pro",
            version: "v3.1.0",
            description: "Premium music streaming app",
            downloadUrl: "#",
            color: "#2196F3",
            icon: "fas fa-music",
            downloads: 3200
        }
    ];
    
    allApps = demoApps;
    displayApps(demoApps);
    updateAppStats(demoApps);
}

function showDemoUpdates() {
    const demoUpdates = [
        {
            appName: "Cyber Links Pro",
            version: "v2.5.0",
            message: "Added new features and security improvements",
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
        },
        {
            appName: "Video Downloader",
            version: "v1.8.2",
            message: "Fixed download issues and added new platforms",
            timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 // 1 week ago
        }
    ];
    
    allUpdates = demoUpdates;
    updateUpdatesDrawer(demoUpdates);
}

function showDemoStats() {
    document.getElementById('totalAppsCount').textContent = allApps.length;
    document.getElementById('totalDownloads').textContent = formatNumber(
        allApps.reduce((sum, app) => sum + (app.downloads || 1000), 0)
    );
    document.getElementById('activeUsers').textContent = "5K+";
    document.getElementById('latestVersion').textContent = "v2.5.0";
    document.getElementById('totalUpdates').textContent = allUpdates.length;
    document.getElementById('lastUpdate').textContent = "Today";
    document.getElementById('verifiedApps').textContent = "All";
}

// Event listeners
function initializeEventListeners() {
    // Search
    const searchInput = document.getElementById('appSearch');
    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        filterApps(term);
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyFilter(this.dataset.filter);
        });
    });
    
    // Updates button
    document.getElementById('updatesBtn').addEventListener('click', openDrawer);
    
    // Mobile menu
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        document.querySelector('.nav-menu').classList.toggle('active');
    });
}

function filterApps(term) {
    const cards = document.querySelectorAll('.app-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
}

function applyFilter(filter) {
    const cards = document.querySelectorAll('.app-card');
    cards.forEach(card => {
        card.style.display = 'block'; // Reset
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    
    // Close drawer on overlay click
    document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
    
    // Close drawer with ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeDrawer();
    });
    
    // Update sync time
    setInterval(() => {
        const now = new Date();
        document.getElementById('lastSync').textContent = 
            now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 60000);
    
    // Initial sync time
    document.getElementById('lastSync').textContent = "Just now";
});
