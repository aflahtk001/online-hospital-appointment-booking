const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testDetail() {
    const sessionUrl = "https://www.nmc.org.in/information-desk/indian-medical-register/";
    const cookiesRes = await axios.get(sessionUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, httpsAgent: agent });
    const cookies = cookiesRes.headers['set-cookie'];
    
    // Test multiple possible service names
    const services = ['getDoctorDetails', 'getDoctorDetailsnew'];
    
    for (const service of services) {
        console.log(`Testing service: ${service}`);
        const url = `https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=${service}&id=629042&registrationNo=12345&draw=1&start=0&length=1`;
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookies ? cookies.join('; ') : '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': sessionUrl
                },
                httpsAgent: agent,
                timeout: 10000
            });
            console.log(`Service: ${service} Status: ${res.status}`);
            console.log(`Data: ${JSON.stringify(res.data).substring(0, 500)}`);
        } catch (e) {
            console.log(`Service: ${service} failed: ${e.message}`);
        }
    }
}

testDetail();
