const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches doctor registry data from NMC using their internal JSON API
 * @param {string} registrationNumber 
 * @returns {Promise<Object>} Extracted registry data
 */
async function fetchDoctorRegistryData(registrationNumber) {
    const sessionUrl = "https://www.nmc.org.in/information-desk/indian-medical-register/";
    const apiUrl = "https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=getPaginatedDoctor";
    
    try {
        // 1. Initialize session to get cookies
        const sessionResponse = await axios.get(sessionUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const cookies = sessionResponse.headers['set-cookie'];

        // 2. Call the actual DataTables API used by NMC
        // Construct parameters as expected by their backend
        const searchParams = new URLSearchParams();
        searchParams.append('draw', '1');
        searchParams.append('start', '0');
        searchParams.append('length', '10');
        searchParams.append('registrationNo', registrationNumber);
        // Add other required boilerplate params if needed, but registrationNo is the key

        const apiResponse = await axios.get(`${apiUrl}&registrationNo=${registrationNumber}&draw=1&start=0&length=10`, {
            headers: {
                'Referer': sessionUrl,
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            timeout: 15000
        });

        if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.length > 0) {
            const doc = apiResponse.data.data[0];
            return {
                name: doc.doctorName || doc.name,
                qualification: doc.qualification || 'MBBS',
                council: doc.medicalCouncil || doc.council
            };
        }
        
        return null; // No match found
    } catch (error) {
        console.error("NMC API Error:", error.message);
        throw new Error("NMC Registry API unreachable.");
    }
}

/**
 * Parses doctor data (Placeholder for backward compatibility or future use)
 */
function parseDoctorData(data) {
    // If we get an object (JSON API), return as is
    if (typeof data === 'object' && data !== null) return data;
    return { name: '', qualification: '', council: '' };
}

/**
 * Calculates a trust score based on input vs registry data
 * @param {Object} input - Data provided by the doctor
 * @param {Object} registry - Data fetched from the registry
 * @returns {number} Score (0-100)
 */
function calculateTrustScore(input, registry) {
    if (!registry || !registry.name) return 0;

    let score = 0;

    // Registry exists (Base points)
    score += 40;

    // Name Match (Case-insensitive)
    if (input.name && registry.name && input.name.toLowerCase() === registry.name.toLowerCase()) {
        score += 25;
    }

    // Qualification Match (Partial match)
    if (input.qualification && registry.qualification && input.qualification.toLowerCase().includes(registry.qualification.toLowerCase())) {
        score += 15;
    }

    // Council Match
    if (input.council && registry.council && input.council.toLowerCase() === registry.council.toLowerCase()) {
        score += 10;
    }

    // Professional Status / Bonus
    score += 10;

    return Math.min(score, 100);
}

module.exports = {
    fetchDoctorRegistryData,
    parseDoctorData,
    calculateTrustScore
};
