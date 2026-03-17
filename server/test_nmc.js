const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testScraper() {
    const registrationNo = '44123'; // Example registration number
    const apiUrl = `https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=getPaginatedDoctor&registrationNo=${registrationNo}&draw=1&start=0&length=10`;
    
    try {
        console.log(`Fetching from: ${apiUrl}`);
        const response = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            httpsAgent: agent,
            timeout: 10000
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Data Structure:', Object.keys(response.data));
        if (response.data.data && response.data.data.length > 0) {
            console.log('First Record Keys:', Object.keys(response.data.data[0]));
            console.log('First Record Data:', JSON.stringify(response.data.data[0], null, 2));
        } else {
            console.log('No data found in response.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
        }
    }
}

testScraper();
