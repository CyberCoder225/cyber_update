// app.js
async function initializeApp() {
    // 1. Check if config loaded
    if (typeof SECRETS === 'undefined') {
        console.error("config.js is missing!");
        showDemoData();
        return;
    }

    try {
        // 2. Initialize
        if (!firebase.apps.length) {
            firebase.initializeApp(SECRETS);
        }
        const db = firebase.database();

        // 3. Load Apps
        const snapshot = await db.ref('apps').once('value');
        const data = snapshot.val();

        if (data) {
            const allApps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            renderApps(allApps); // Use your existing render function
        }
        
        hideLoader(); // Hide the "Loading Apps" screen
    } catch (error) {
        console.error(error);
        showDemoData();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
