const USER_ID = "cm5kn2onx000j9c8z8v2h8j0v"; // ID cible (admin@fle.expert typiquement)
const TOKEN = "VOTRE_TOKEN_ICI"; // Sera remplacé manuellement ou via script si besoin

async function testProfile() {
    console.log("Testing profile for ID:", USER_ID);
    try {
        const response = await fetch(`http://localhost:3333/admin/users/${USER_ID}/profile`, {
            headers: {
                'Authorization': `Bearer ${process.argv[2]}`
            }
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Data Keys:", Object.keys(data));
        if (data.examSessions) {
            console.log("ExamSessions Length:", data.examSessions.length);
        } else {
            console.log("ATTENTION: examSessions est ABSENT");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testProfile();
