// app.js - Hardcoded Firebase Loader for Regional Database

// 1. YOUR ACTUAL CONFIG - Paste your keys here from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Get this from Project Settings
    authDomain: "ny-bmw-wt-project2024.firebaseapp.com",
    databaseURL: "https://ny-bmw-wt-project2024-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ny-bmw-wt-project2024",
    storageBucket: "ny-bmw-wt-project2024.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Global State
let db;
let allApps = [];

// Helper to hide loader
function hideLoadingScreen() {
    const loader = document.getElementById('loadingScreen');
    if (loader) loader.style.display = 'none';
}

// Validation check
function isFirebaseConfigValid(config) {
    // Checks if you actually replaced the placeholder
    return config.apiKey && config.apiKey !== "YOUR_API_KEY";
}

// Main Initialization
async function initializeFirebase() {
    try {
        if (!isFirebaseConfigValid(firebaseConfig)) {
            console.warn("API Key missing. Showing demo data.");
            showDemoData();
            return;
        }

        // Initialize Firebase Compat
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();

        console.log("Connected to Europe Database...");

        // Load data
        await Promise.all([
            loadApps(),
            loadStats(),
            loadUpdates()
        ]);

        hideLoadingScreen();
        initializeEventListeners();

    } catch (error) {
        console.error("Connection failed:", error);
        showDemoData();
    }
}

// Load apps from your specific structure
async function loadApps() {
    try {
        const snapshot = await db.ref('apps').once('value');
        const apps = [];
        
        snapshot.forEach(child => {
            const data = child.val();
            // This handles your 'app1', 'app2' structure
            apps.push({
                id: child.key,
                name: data.name || "Unnamed App",
                version: data.version || "v1.0",
                description: data.description || "",
                icon: data.icon || "fas fa-box",
                color: data.color || "#00A884",
                downloadUrl: data.downloadUrl || "#"
            });
        });

        allApps = apps;
        displayApps(apps);
    } catch (e) {
        console.error("Apps load error:", e);
    }
}

function displayApps(apps) {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;

    if (apps.length === 0) {
        grid.innerHTML = `<h3>No apps found in database</h3>`;
        return;
    }

    grid.innerHTML = apps.map(app => `
        <div class="app-card">
            <div class="app-icon" style="background: ${app.color};">
                <i class="${app.icon}"></i>
            </div>
            <h3 class="app-title">${app.name}</h3>
            <div class="app-version">${app.version}</div>
            <p class="app-description">${app.description}</p>
            <a href="${app.downloadUrl}" class="download-btn" target="_blank">
                <i class="fas fa-download"></i> Download APK
            </a>
        </div>
    `).join('');
}

// Stats and Updates (Optional based on your DB)
async function loadStats() {
    const snap = await db.ref('website/stats').once('value');
    const stats = snap.val() || {};
    if(document.getElementById('totalAppsCount')) 
        document.getElementById('totalAppsCount').textContent = allApps.length;
}

async function loadUpdates() {
    const snap = await db.ref('updates').limitToLast(5).once('value');
    const updates = [];
    snap.forEach(c => updates.push(c.val()));
    const drawer = document.getElementById('drawerContent');
    if (drawer) {
        drawer.innerHTML = updates.map(u => `
            <div class="update-item">
                <h4>${u.appName || 'Update'}</h4>
                <p>${u.message || 'Fixed bugs'}</p>
            </div>
        `).join('');
    }
}

function initializeEventListeners() {
    const searchInput = document.getElementById('appSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.app-card');
            cards.forEach(card => {
                card.style.display = card.textContent.toLowerCase().includes(term) ? 'block' : 'none';
            });
        });
    }
}

function showDemoData() {
    allApps = [{name: "Setup Required", version: "v0.0", description: "Add your Firebase API Key to app.js", color: "#666", icon: "fas fa-exclamation-triangle"}];
    displayApps(allApps);
    hideLoadingScreen();
}

// Start
document.addEventListener('DOMContentLoaded', initializeFirebase);
