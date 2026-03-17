const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'verification.log');

function logTo(msg) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(logFile, entry);
}

const agent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Fetches doctor registry data from NMC using their internal JSON API
 * @param {string} registrationNumber 
 * @returns {Promise<Object>} Extracted registry data
 */
async function fetchDoctorRegistryData(registrationNumber, councilName = null) {
    const sessionUrl = "https://www.nmc.org.in/information-desk/indian-medical-register/";
    const apiUrl = "https://www.nmc.org.in/MCIRest/open/getPaginatedData?service=getPaginatedDoctor";
    
    try {
        logTo(`[VerifService] Initializing session: ${sessionUrl}`);
        const sessionResponse = await axios.get(sessionUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
            httpsAgent: agent
        });
        logTo(`[VerifService] Session init status: ${sessionResponse.status}`);
        const cookies = sessionResponse.headers['set-cookie'];

        // 2. Call the actual DataTables API used by NMC
        // Construct parameters as expected by their backend
        const searchParams = new URLSearchParams();
        searchParams.append('draw', '1');
        searchParams.append('start', '0');
        searchParams.append('length', '10');
        searchParams.append('registrationNo', registrationNumber);
        // Add other required boilerplate params if needed, but registrationNo is the key

        logTo(`[VerifService] Calling API: ${apiUrl} for RegNo: ${registrationNumber}`);
        const apiResponse = await axios.get(`${apiUrl}&registrationNo=${registrationNumber}&draw=1&start=0&length=10`, {
            headers: {
                'Referer': sessionUrl,
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            timeout: 15000,
            httpsAgent: agent
        });
        logTo(`[VerifService] API response status: ${apiResponse.status}`);

        if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.length > 0) {
            let docRow = apiResponse.data.data[0];
            
            // If councilName is provided, find the matching row
            if (councilName) {
                const matchingRow = apiResponse.data.data.find(row => 
                    (row[3] || "").toLowerCase().trim() === councilName.toLowerCase().trim()
                );
                if (matchingRow) {
                    docRow = matchingRow;
                    logTo(`[VerifService] Found exact match for council: ${councilName}`);
                } else {
                    logTo(`[VerifService] No exact match for council ${councilName}, falling back to top result`);
                }
            }

            // Extract doctorId from the "View" link (Index 6)
            const viewLink = docRow[6] || '';
            const idMatch = viewLink.match(/openDoctorDetailsnew\('(\d+)'/);
            const doctorId = idMatch ? idMatch[1] : null;

            if (doctorId) {
                logTo(`[VerifService] Fetching full details for doctorId: ${doctorId}`);
                const detailUrl = "https://www.nmc.org.in/MCIRest/open/getDataFromService?service=getDoctorDetailsByIdImrExt";
                
                const detailResponse = await axios.post(detailUrl, 
                    { doctorId: doctorId, regdNoValue: registrationNumber },
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Cookie': cookies ? cookies.join('; ') : ''
                        },
                        httpsAgent: agent,
                        timeout: 10000
                    }
                );

                if (detailResponse.data) {
                    const d = detailResponse.data;
                    
                    // Combine qualifications
                    let qualifications = [d.doctorDegree];
                    if (d.addlqual1 && d.addlqual1.trim()) qualifications.push(d.addlqual1.trim());
                    if (d.addlqual2 && d.addlqual2.trim()) qualifications.push(d.addlqual2.trim());
                    if (d.addlqual3 && d.addlqual3.trim()) qualifications.push(d.addlqual3.trim());
                    
                    const qualString = qualifications.filter(q => q && q.length > 1).join(', ');

                    return {
                        name: d.firstName || 'Unknown',
                        dateOfBirth: d.birthDateStr || 'N/A',
                        qualification: qualString || 'MBBS',
                        council: d.smcName || 'N/A'
                    };
                }
            }

            // Fallback to basic row data if detail fetch fails
            const $name = cheerio.load(docRow[4] || '');
            return {
                name: $name.text().trim() || 'Unknown',
                dateOfBirth: 'Detail fetch failed',
                qualification: 'MBBS',
                council: docRow[3] || 'N/A'
            };
        }
        
        logTo(`[VerifService] No match found for RegNo: ${registrationNumber}`);
        return null; // No match found
    } catch (error) {
        logTo(`[VerifService] NMC API Error: ${error.message}`);
        if (error.response) {
            logTo(`[VerifService] Error Response: ${error.response.status} ${JSON.stringify(error.response.data)}`);
        }
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

    // Date of Birth Match (Bonus points if DOB matches)
    if (input.dateOfBirth && registry.dateOfBirth) {
        // Handle potential format differences (registry usually returns DD/MM/YYYY)
        const normalizeDate = (d) => {
            if (!d) return "";
            if (d.includes('/')) return d; // Already DD/MM/YYYY
            const dateObj = new Date(d);
            if (isNaN(dateObj)) return d;
            return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
        };
        
        if (normalizeDate(input.dateOfBirth) === registry.dateOfBirth) {
            score += 10;
        }
    }

    // Professional Status / Bonus
    score += 5; // Reduced from 10 to keep total balance

    return Math.min(score, 100);
}

module.exports = {
    fetchDoctorRegistryData,
    parseDoctorData,
    calculateTrustScore
};
