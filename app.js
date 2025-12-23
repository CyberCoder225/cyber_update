// app.js - Optimized Firebase Loader

const firebaseConfig = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || ""
};

// State
let db;
let siteConfig = {};
let allApps = [];
let allUpdates = [];

// Helper to hide loader
function hideLoadingScreen() {
    const loader = document.getElementById('loadingScreen');
    if (loader) loader.style.display = 'none';
}

// 1. IMPROVED: Validation check
function isFirebaseConfigValid(config) {
    return config.apiKey && config.apiKey.length > 10 && config.projectId;
}

// 2. IMPROVED: Initialize with a safety timeout
async function initializeFirebase() {
    // Safety Net: If nothing happens in 5 seconds, show demo data anyway
    const safetyTimeout = setTimeout(() => {
        if (!db) {
            console.warn("Firebase taking too long... switching to demo mode.");
            showDemoData();
        }
    }, 5000);

    try {
        if (!isFirebaseConfigValid(firebaseConfig)) {
            throw new Error("Invalid Config");
        }

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();

        // Load data with error catching for each
        await Promise.all([
            loadSiteConfig().catch(e => console.error("Config failed", e)),
            loadApps().catch(e => console.error("Apps failed", e)),
            loadUpdates().catch(e => console.error("Updates failed", e)),
            loadStats().catch(e => console.error("Stats failed", e))
        ]);

        clearTimeout(safetyTimeout);
        hideLoadingScreen();
        initializeEventListeners();

    } catch (error) {
        console.error("Initialization error:", error);
        clearTimeout(safetyTimeout);
        showDemoData();
    }
}

// 3. IMPROVED: Site Config Loader
async function loadSiteConfig() {
    try {
        const snapshot = await db.ref('website/config').once('value');
        siteConfig = snapshot.val() || getDefaultConfig();
        updatePageWithConfig();
    } catch (error) {
        siteConfig = getDefaultConfig();
        updatePageWithConfig();
    }
}

function getDefaultConfig() {
    return {
        title: "App Collection",
        description: "Premium Android applications",
        heroTitle: "Welcome to <span class='highlight'>App Collection</span>",
        telegram: "#",
        copyright: "© 2024 App Collection"
    };
}

function updatePageWithConfig() {
    document.title = siteConfig.title;
    if(document.getElementById('siteTitle')) document.getElementById('siteTitle').textContent = siteConfig.title;
    if(document.getElementById('heroTitle')) document.getElementById('heroTitle').innerHTML = siteConfig.heroTitle;
    if(document.getElementById('heroSubtitle')) document.getElementById('heroSubtitle').textContent = siteConfig.description;
    if(document.getElementById('copyrightText')) document.getElementById('copyrightText').textContent = siteConfig.copyright;
}

// 4. IMPROVED: App Loader
async function loadApps() {
    const snapshot = await db.ref('apps').once('value');
    const apps = [];
    snapshot.forEach(child => {
        apps.push({ id: child.key, ...child.val() });
    });
    allApps = apps;
    displayApps(apps);
}

function displayApps(apps) {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;

    if (!apps || apps.length === 0) {
        grid.innerHTML = `<div class="no-apps"><h3>No Apps Found</h3></div>`;
        return;
    }

    grid.innerHTML = apps.map(app => `
        <div class="app-card">
            <div class="app-icon" style="background: ${app.color || '#00A884'};">
                <i class="${app.icon || 'fas fa-mobile-alt'}"></i>
            </div>
            <h3 class="app-title">${app.name}</h3>
            <div class="app-version">${app.version || 'v1.0'}</div>
            <p class="app-description">${app.description || ''}</p>
            <a href="${app.downloadUrl || '#'}" class="download-btn" target="_blank">
                <i class="fas fa-download"></i> Download APK
            </a>
        </div>
    `).join('');
}

// 5. Drawer & Updates
async function loadUpdates() {
    const snapshot = await db.ref('updates').limitToLast(10).once('value');
    const updates = [];
    snapshot.forEach(child => { updates.push(child.val()); });
    allUpdates = updates.reverse();
    updateUpdatesDrawer(allUpdates);
}

function updateUpdatesDrawer(updates) {
    const drawer = document.getElementById('drawerContent');
    const count = document.getElementById('updateCount');
    if (count) count.textContent = updates.length;
    if (!drawer) return;

    drawer.innerHTML = updates.map(u => `
        <div class="update-item">
            <h4>${u.appName}</h4>
            <div class="update-version">${u.version}</div>
            <p>${u.message}</p>
        </div>
    `).join('');
}

async function loadStats() {
    const snapshot = await db.ref('website/stats').once('value');
    const stats = snapshot.val() || {};
    if(document.getElementById('totalAppsCount')) document.getElementById('totalAppsCount').textContent = stats.totalApps || 0;
    if(document.getElementById('totalDownloads')) document.getElementById('totalDownloads').textContent = stats.totalDownloads || 0;
}

// Event Listeners
function initializeEventListeners() {
    const searchInput = document.getElementById('appSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.app-card');
            cards.forEach(card => {
                const isMatch = card.textContent.toLowerCase().includes(term);
                card.style.display = isMatch ? 'block' : 'none';
            });
        });
    }

    const updatesBtn = document.getElementById('updatesBtn');
    if (updatesBtn) updatesBtn.addEventListener('click', openDrawer);
    
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }
}

// Demo Data Fallback
function showDemoData() {
    siteConfig = getDefaultConfig();
    updatePageWithConfig();
    
    allApps = [
        { name: "Demo App 1", version: "v1.0", description: "Demo description", color: "#2196F3", icon: "fas fa-star" }
    ];
    displayApps(allApps);
    
    hideLoadingScreen();
    initializeEventListeners();
}

function openDrawer() {
    document.getElementById('drawerOverlay').style.display = 'block';
    document.getElementById('updatesDrawer').classList.add('active');
}

function closeDrawer() {
    document.getElementById('drawerOverlay').style.display = 'none';
    document.getElementById('updatesDrawer').classList.remove('active');
}

// Boot
document.addEventListener('DOMContentLoaded', initializeFirebase);
