const fs = require('fs');
const https = require('https');

// Function to fetch data from GitHub
function fetchFromGitHub(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Function to parse CSV text
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

// Function to check for enrollment mismatches
async function checkEnrollmentMismatches() {
  try {
    console.log('🔄 Fetching latest CSV data from GitHub...');
    
    // Fetch CSV data
    const mapExportText = await fetchFromGitHub('https://raw.githubusercontent.com/DWieberdink/NHPS/main/Map_Export.csv');
    const mapData = parseCSV(mapExportText);
    
    console.log('✅ CSV data fetched successfully');
    
    // Read current GeoJSON
    const currentGeoJSON = JSON.parse(fs.readFileSync('NHPSSchools.geojson', 'utf8'));
    
    console.log('\n🔍 Checking for enrollment mismatches...\n');
    
    const mismatches = [];
    const matches = [];
    
    // Compare each school
    currentGeoJSON.features.forEach(feature => {
      const schoolName = feature.properties['Building Name'];
      const geojsonEnrollment = feature.properties['Enrollment'];
      
      const csvRow = mapData.find(row => row['Building Name'] === schoolName);
      
      if (csvRow) {
        const csvEnrollment = parseFloat(csvRow['Enrollment']) || 0;
        
        if (geojsonEnrollment !== csvEnrollment) {
          mismatches.push({
            school: schoolName,
            geojson: geojsonEnrollment,
            csv: csvEnrollment,
            difference: csvEnrollment - geojsonEnrollment
          });
        } else {
          matches.push({
            school: schoolName,
            enrollment: geojsonEnrollment
          });
        }
      } else {
        console.log(`⚠️  Warning: ${schoolName} not found in CSV data`);
      }
    });
    
    // Display results
    if (mismatches.length > 0) {
      console.log(`❌ Found ${mismatches.length} enrollment mismatches:\n`);
      mismatches.forEach(mismatch => {
        const change = mismatch.difference > 0 ? '↗️' : '↘️';
        console.log(`${change} ${mismatch.school}`);
        console.log(`   GeoJSON: ${mismatch.geojson} → CSV: ${mismatch.csv} (${mismatch.difference > 0 ? '+' : ''}${mismatch.difference})`);
        console.log('');
      });
    } else {
      console.log('✅ All enrollments match between GeoJSON and CSV!');
    }
    
    console.log(`📊 Summary:`);
    console.log(`   Total schools: ${currentGeoJSON.features.length}`);
    console.log(`   Matches: ${matches.length}`);
    console.log(`   Mismatches: ${mismatches.length}`);
    
    // Show some examples of matches
    if (matches.length > 0) {
      console.log(`\n✅ Sample of matching enrollments:`);
      matches.slice(0, 5).forEach(match => {
        console.log(`   ${match.school}: ${match.enrollment}`);
      });
      if (matches.length > 5) {
        console.log(`   ... and ${matches.length - 5} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking mismatches:', error.message);
  }
}

// Run the check
checkEnrollmentMismatches();
