/**
 * APP COLLECTION - SECURE VITE VERSION
 */

// 1. CONFIGURATION
// These variables are pulled from your .env file
// Vite will "bake" these into the code when you run 'npm run dev' or 'build'
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let db;
let allApps = [];

/**
 * INITIALIZATION
 */
async function initializeApp() {
    console.log("🚀 Initializing App...");

    // Check if we have the minimum required keys
    if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
        console.warn("⚠️ Firebase keys missing in .env. Switching to Demo Mode.");
        return showDemoData();
    }

    try {
        // Initialize Firebase (Compat mode)
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();

        // Load your data
        await Promise.all([
            fetchApps(),
            fetchStats()
        ]);

        hideLoader();
        setupSearch();

    } catch (error) {
        console.error("❌ Firebase Error:", error);
        showDemoData();
    }
}

/**
 * FETCH DATA
 */
async function fetchApps() {
    const snapshot = await db.ref('apps').once('value');
    const data = snapshot.val();

    if (data) {
        // Convert the 'app1', 'app2' object structure into an array
        allApps = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        renderApps(allApps);
    }
}

function renderApps(apps) {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;

    grid.innerHTML = apps.map(app => `
        <div class="app-card">
            <div class="app-icon" style="background: ${app.color || '#00A884'}">
                <i class="${app.icon || 'fas fa-mobile-alt'}"></i>
            </div>
            <div class="app-info">
                <h3>${app.name}</h3>
                <span class="version">${app.version}</span>
                <p>${app.description}</p>
                <a href="${app.downloadUrl}" class="download-btn" target="_blank">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `).join('');
}

/**
 * UI HELPERS
 */
function hideLoader() {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('appSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allApps.filter(a => 
                a.name.toLowerCase().includes(term) || 
                a.description.toLowerCase().includes(term)
            );
            renderApps(filtered);
        });
    }
}

async function fetchStats() {
    const countEl = document.getElementById('totalAppsCount');
    if (countEl) countEl.textContent = allApps.length;
}

function showDemoData() {
    console.log("✨ Showing Demo Apps");
    allApps = [
        { name: "Cyber Links Pro (Demo)", version: "v2.5.0", description: "This is demo data. Add your .env keys to see real data.", color: "#00A884", icon: "fas fa-shield-alt", downloadUrl: "#" }
    ];
    renderApps(allApps);
    hideLoader();
    setupSearch();
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);
