
const BASE_URL = 'http://localhost:3333';

async function run() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@preptef.com',
                password: 'admin123'
            })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error("Login failed:", loginData);
            return;
        }

        const token = loginData.access_token;
        console.log("Token acquired.");

        // 2. Get Users
        console.log("Fetching users...");
        const usersRes = await fetch(`${BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const users = await usersRes.json();
        if (!Array.isArray(users) || users.length === 0) {
            console.error("No users found.", users);
            return;
        }

        const targetUser = users[0];
        console.log(`Testing profile for user: ${targetUser.id} (${targetUser.email})`);

        // 3. Get Profile
        console.log(`Fetching profile from ${BASE_URL}/admin/users/${targetUser.id}/profile ...`);
        const profileRes = await fetch(`${BASE_URL}/admin/users/${targetUser.id}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!profileRes.ok) {
            console.error("Profile fetch error:", profileRes.status, await profileRes.text());
            return;
        }

        const profileData = await profileRes.json();
        console.log("--- PROFILE DATA RESPONSE ---");
        console.log(JSON.stringify(profileData, null, 2));
        console.log("-----------------------------");

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
