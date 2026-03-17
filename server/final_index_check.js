const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function run() {
    try {
        const r = await axios.get('https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=getPaginatedDoctor&registrationNo=12345&draw=1&start=0&length=1', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            httpsAgent: agent
        });
        const doc = r.data.data[0];
        if (!doc) return console.log('No data');
        doc.forEach((val, i) => {
            console.log(`INDEX_${i}:: ${val}`);
        });
    } catch (e) {
        console.error(e.message);
    }
}
run();
