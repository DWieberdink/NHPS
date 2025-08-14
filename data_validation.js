// NHPS Dashboard Data Validation Script
// Compares Decision Data Export.csv and Map_Export.csv for consistency

const fs = require('fs');
const path = require('path');

class DataValidator {
    constructor() {
        this.decisionData = [];
        this.mapData = [];
        this.issues = [];
        this.warnings = [];
        this.stats = {
            totalSchools: 0,
            matchingSchools: 0,
            missingSchools: 0,
            dataMismatches: 0
        };
    }

    // Load and parse CSV files
    loadData() {
        try {
            console.log('📊 Loading CSV files...');
            
            // Load Decision Data Export.csv
            const decisionCsv = fs.readFileSync('Decision Data Export.csv', 'utf8');
            this.decisionData = this.parseCSV(decisionCsv);
            console.log(`✅ Loaded ${this.decisionData.length} schools from Decision Data Export.csv`);
            
            // Load Map_Export.csv
            const mapCsv = fs.readFileSync('Map_Export.csv', 'utf8');
            this.mapData = this.parseCSV(mapCsv);
            console.log(`✅ Loaded ${this.mapData.length} schools from Map_Export.csv`);
            
        } catch (error) {
            console.error('❌ Error loading CSV files:', error.message);
            process.exit(1);
        }
    }

    // Parse CSV with proper handling of quoted fields
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = this.parseCSVRow(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVRow(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
        
        return data;
    }

    // Parse CSV row handling quoted fields with commas
    parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Normalize school names for comparison
    normalizeSchoolName(name) {
        return name.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
    }

    // Find matching schools between datasets
    findMatchingSchools() {
        const decisionSchools = new Map();
        const mapSchools = new Map();
        
        // Create maps with normalized names
        this.decisionData.forEach(school => {
            const normalizedName = this.normalizeSchoolName(school['Building Name']);
            decisionSchools.set(normalizedName, school);
        });
        
        this.mapData.forEach(school => {
            const normalizedName = this.normalizeSchoolName(school['Building Name']);
            mapSchools.set(normalizedName, school);
        });
        
        return { decisionSchools, mapSchools };
    }

    // Validate data consistency
    validateData() {
        console.log('\n🔍 Starting data validation...');
        
        const { decisionSchools, mapSchools } = this.findMatchingSchools();
        const allSchoolNames = new Set([...decisionSchools.keys(), ...mapSchools.keys()]);
        
        this.stats.totalSchools = allSchoolNames.size;
        
        allSchoolNames.forEach(schoolName => {
            const decisionSchool = decisionSchools.get(schoolName);
            const mapSchool = mapSchools.get(schoolName);
            
            if (decisionSchool && mapSchool) {
                this.stats.matchingSchools++;
                this.validateSchoolData(decisionSchool, mapSchool, schoolName);
            } else {
                this.stats.missingSchools++;
                if (!decisionSchool) {
                    this.issues.push({
                        type: 'MISSING_IN_DECISION',
                        school: schoolName,
                        message: `School found in Map_Export.csv but missing from Decision Data Export.csv`
                    });
                } else {
                    this.issues.push({
                        type: 'MISSING_IN_MAP',
                        school: schoolName,
                        message: `School found in Decision Data Export.csv but missing from Map_Export.csv`
                    });
                }
            }
        });
    }

    // Validate individual school data
    validateSchoolData(decisionSchool, mapSchool, schoolName) {
        // Check enrollment consistency
        const decisionEnrollment = parseFloat(decisionSchool['Enrollment']) || 0;
        const mapEnrollment = parseFloat(mapSchool['Enrollment']) || 0;
        
        if (Math.abs(decisionEnrollment - mapEnrollment) > 1) { // Allow for small rounding differences
            this.stats.dataMismatches++;
            this.issues.push({
                type: 'ENROLLMENT_MISMATCH',
                school: schoolName,
                message: `Enrollment mismatch: Decision Data (${decisionEnrollment}) vs Map Data (${mapEnrollment})`,
                decisionValue: decisionEnrollment,
                mapValue: mapEnrollment
            });
        }

        // Check building score consistency
        const decisionScore = parseFloat(decisionSchool['BuildingScore']) || 0;
        const mapScore = parseFloat(mapSchool['BuildingScore']) || 0;
        
        if (Math.abs(decisionScore - mapScore) > 0.001) {
            this.stats.dataMismatches++;
            this.issues.push({
                type: 'BUILDING_SCORE_MISMATCH',
                school: schoolName,
                message: `Building score mismatch: Decision Data (${decisionScore}) vs Map Data (${mapScore})`,
                decisionValue: decisionScore,
                mapValue: mapScore
            });
        }

        // Check school level consistency
        const decisionLevel = decisionSchool['School Level'] || '';
        const mapLevel = mapSchool['School Level'] || '';
        
        if (decisionLevel !== mapLevel) {
            this.stats.dataMismatches++;
            this.issues.push({
                type: 'SCHOOL_LEVEL_MISMATCH',
                school: schoolName,
                message: `School level mismatch: Decision Data ("${decisionLevel}") vs Map Data ("${mapLevel}")`,
                decisionValue: decisionLevel,
                mapValue: mapLevel
            });
        }

        // Check for missing geographic data
        if (!mapSchool['Latitude'] || !mapSchool['Longitude']) {
            this.warnings.push({
                type: 'MISSING_GEOGRAPHIC_DATA',
                school: schoolName,
                message: `Missing latitude/longitude coordinates`
            });
        }

        // Check for missing capacity data
        if (!mapSchool['Capacity']) {
            this.warnings.push({
                type: 'MISSING_CAPACITY',
                school: schoolName,
                message: `Missing capacity data in Map_Export.csv`
            });
        }

        // Check for missing utilization data
        if (!decisionSchool['Utilization']) {
            this.warnings.push({
                type: 'MISSING_UTILIZATION',
                school: schoolName,
                message: `Missing utilization data in Decision Data Export.csv`
            });
        }

        // Check for missing building score
        if (!decisionSchool['BuildingScore'] || !mapSchool['BuildingScore']) {
            this.warnings.push({
                type: 'MISSING_BUILDING_SCORE',
                school: schoolName,
                message: `Missing building score data`
            });
        }
    }

    // Generate validation report
    generateReport() {
        console.log('\n📋 DATA VALIDATION REPORT');
        console.log('=' .repeat(50));
        
        // Summary statistics
        console.log('\n📊 SUMMARY STATISTICS:');
        console.log(`Total unique schools: ${this.stats.totalSchools}`);
        console.log(`Schools in both files: ${this.stats.matchingSchools}`);
        console.log(`Schools missing from one file: ${this.stats.missingSchools}`);
        console.log(`Data mismatches found: ${this.stats.dataMismatches}`);
        
        // Issues report
        if (this.issues.length > 0) {
            console.log('\n❌ CRITICAL ISSUES:');
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type}: ${issue.school}`);
                console.log(`   ${issue.message}`);
                if (issue.decisionValue !== undefined) {
                    console.log(`   Decision Data: ${issue.decisionValue}`);
                    console.log(`   Map Data: ${issue.mapValue}`);
                }
                console.log('');
            });
        } else {
            console.log('\n✅ No critical issues found!');
        }
        
        // Warnings report
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.type}: ${warning.school}`);
                console.log(`   ${warning.message}`);
                console.log('');
            });
        } else {
            console.log('\n✅ No warnings found!');
        }
        
        // Recommendations
        this.generateRecommendations();
    }

    // Generate recommendations based on findings
    generateRecommendations() {
        console.log('\n💡 RECOMMENDATIONS:');
        
        const enrollmentMismatches = this.issues.filter(i => i.type === 'ENROLLMENT_MISMATCH').length;
        const buildingScoreMismatches = this.issues.filter(i => i.type === 'BUILDING_SCORE_MISMATCH').length;
        const missingSchools = this.issues.filter(i => i.type.includes('MISSING_IN')).length;
        
        if (enrollmentMismatches > 0) {
            console.log(`• Fix ${enrollmentMismatches} enrollment mismatches between files`);
        }
        
        if (buildingScoreMismatches > 0) {
            console.log(`• Fix ${buildingScoreMismatches} building score mismatches between files`);
        }
        
        if (missingSchools > 0) {
            console.log(`• Add ${missingSchools} missing schools to the appropriate file(s)`);
        }
        
        if (this.warnings.length > 0) {
            console.log(`• Address ${this.warnings.length} data quality warnings`);
        }
        
        if (this.issues.length === 0 && this.warnings.length === 0) {
            console.log('• Data files are consistent and ready for use!');
        }
        
        console.log('\n• Consider implementing automated data validation in your workflow');
        console.log('• Establish data update procedures to maintain consistency');
    }

    // Export issues to JSON file
    exportIssues() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.stats,
            issues: this.issues,
            warnings: this.warnings
        };
        
        fs.writeFileSync('data_validation_report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Validation report exported to data_validation_report.json');
    }

    // Run complete validation
    run() {
        console.log('🚀 NHPS Dashboard Data Validation');
        console.log('=' .repeat(40));
        
        this.loadData();
        this.validateData();
        this.generateReport();
        this.exportIssues();
        
        console.log('\n✅ Validation complete!');
        
        // Exit with error code if critical issues found
        if (this.issues.length > 0) {
            console.log(`\n⚠️  ${this.issues.length} critical issues found. Please address before using the data.`);
            process.exit(1);
        }
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    const validator = new DataValidator();
    validator.run();
}

module.exports = DataValidator;



