const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testScraper(registrationNo) {
    const apiUrl = `https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=getPaginatedDoctor&registrationNo=${registrationNo}&draw=1&start=0&length=10`;
    
    try {
        console.log(`\n--- Testing Reg No: ${registrationNo} ---`);
        const response = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            httpsAgent: agent,
            timeout: 10000
        });
        
        if (response.data.data && response.data.data.length > 0) {
            const doc = response.data.data[0];
            doc.forEach((val, idx) => {
                console.log(`Index ${idx}: ${val}`);
            });
        } else {
            console.log('No data found.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function runTests() {
    await testScraper('44123');
    await testScraper('12345');
    await testScraper('88567');
}

runTests();
