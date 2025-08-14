# NHPS Dashboard Data Validation

This validation script checks for consistency between the `Decision Data Export.csv` and `Map_Export.csv` files used by the NHPS Dashboard.

## 🚀 Quick Start

### Option 1: Using the batch file (Windows)
```bash
validate_data.bat
```

### Option 2: Using Node.js directly
```bash
node data_validation.js
```

## 📋 What the Script Validates

### Critical Issues (❌)
- **Missing Schools**: Schools present in one file but not the other
- **Enrollment Mismatches**: Different enrollment numbers between files
- **Building Score Mismatches**: Different building scores between files
- **School Level Mismatches**: Different school level classifications

### Warnings (⚠️)
- **Missing Geographic Data**: Schools without latitude/longitude coordinates
- **Missing Capacity Data**: Schools without capacity information
- **Missing Utilization Data**: Schools without utilization percentages
- **Missing Building Scores**: Schools without building condition scores

## 📊 Output

The script provides:

1. **Console Report**: Detailed validation results in the terminal
2. **JSON Report**: `data_validation_report.json` with structured data for further analysis

### Sample Output
```
🚀 NHPS Dashboard Data Validation
========================================
📊 Loading CSV files...
✅ Loaded 40 schools from Decision Data Export.csv
✅ Loaded 40 schools from Map_Export.csv

🔍 Starting data validation...

📋 DATA VALIDATION REPORT
==================================================

📊 SUMMARY STATISTICS:
Total unique schools: 40
Schools in both files: 38
Schools missing from one file: 2
Data mismatches found: 3

❌ CRITICAL ISSUES:
1. ENROLLMENT_MISMATCH: mauro sheridan science technology communications school
   Enrollment mismatch: Decision Data (482) vs Map Data (482)
   Decision Data: 482
   Map Data: 482

💡 RECOMMENDATIONS:
• Fix 1 enrollment mismatches between files
• Add 2 missing schools to the appropriate file(s)
• Consider implementing automated data validation in your workflow
```

## 🔧 How It Works

1. **Loads both CSV files** with proper handling of quoted fields containing commas
2. **Normalizes school names** for comparison (removes special characters, normalizes spacing)
3. **Compares matching schools** for data consistency
4. **Identifies missing schools** in either file
5. **Generates detailed report** with specific recommendations

## 📁 Files

- `data_validation.js` - Main validation script
- `validate_data.bat` - Windows batch file for easy execution
- `data_validation_report.json` - Generated validation report (created after running)

## 🛠️ Requirements

- Node.js installed on your system
- Both CSV files in the same directory as the script

## 🔄 Integration

You can integrate this validation into your workflow:

1. **Pre-deployment**: Run before updating the dashboard
2. **Automated checks**: Add to CI/CD pipeline
3. **Data quality monitoring**: Run periodically to catch issues early

## 📈 Benefits

- **Data Consistency**: Ensures both files have matching information
- **Error Prevention**: Catches issues before they affect the dashboard
- **Quality Assurance**: Maintains data integrity across the system
- **Documentation**: Provides clear record of data quality status

## 🚨 Exit Codes

- **Exit 0**: No critical issues found
- **Exit 1**: Critical issues detected (missing schools, data mismatches)

## 💡 Best Practices

1. **Run regularly**: Validate data before each dashboard update
2. **Address issues promptly**: Fix critical issues before using the data
3. **Document changes**: Keep track of what was fixed and when
4. **Automate**: Consider running this as part of your data update process

## 🔍 Customization

You can modify the validation script to:

- Add new validation rules
- Adjust tolerance levels for numeric comparisons
- Include additional data quality checks
- Customize the output format

## 📞 Support

If you encounter issues with the validation script:

1. Check that both CSV files are in the correct location
2. Ensure Node.js is properly installed
3. Review the console output for specific error messages
4. Check the generated JSON report for detailed information

