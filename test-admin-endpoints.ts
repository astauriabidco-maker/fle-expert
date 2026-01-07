
const fetch = require('node-fetch');

async function main() {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await fetch('http://localhost:3333/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@preptef.com', password: 'admin123' })
    });

    if (!loginRes.ok) {
        console.error("Login failed:", await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log("Login successful. Token acquired.");

    // 2. Test Endpoints
    const endpoints = [
        'http://localhost:3333/admin/stats',
        'http://localhost:3333/admin/organizations',
        'http://localhost:3333/admin/users',
        'http://localhost:3333/admin/sessions',
        'http://localhost:3333/admin/ai-monitoring',
        'http://localhost:3333/admin/audit-logs'
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`[${res.status}] ${url}`);
            if (!res.ok) {
                console.error(`Error body for ${url}:`, await res.text());
            }
        } catch (e) {
            console.error(`Failed to fetch ${url}:`, e);
        }
    }
}

main();
