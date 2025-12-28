/**
 * Diagnostic: Check what role values exist in your Google Sheet
 * Run this to see what roles need to be allowed in Supabase
 */

function checkRolesInSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users')
  if (!sheet) {
    Logger.log('❌ Users sheet not found')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const roleIndex = headers.indexOf('role')
  
  if (roleIndex === -1) {
    Logger.log('❌ "role" column not found')
    Logger.log('Available columns: ' + headers.join(', '))
    return
  }
  
  // Get all unique roles
  const roles = new Set()
  for (let i = 1; i < data.length; i++) {
    const role = data[i][roleIndex]
    if (role) {
      roles.add(role)
    }
  }
  
  Logger.log('📋 Unique roles found in Google Sheet:')
  Array.from(roles).sort().forEach(role => {
    Logger.log(`   - "${role}"`)
  })
  
  Logger.log('\n✅ Copy these roles and add them to the Supabase constraint')
  Logger.log('SQL: ALTER TABLE users ADD CONSTRAINT users_role_check')
  Logger.log(`CHECK (role IN (${Array.from(roles).map(r => `'${r}'`).join(', ')}));`)
}

/**
 * Check for any data issues before syncing
 */
function validateSheetData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users')
  if (!sheet) {
    Logger.log('❌ Users sheet not found')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  
  Logger.log('=== Data Validation ===')
  Logger.log(`Total rows: ${data.length - 1}`)
  Logger.log(`Headers: ${headers.join(', ')}`)
  
  // Check for required columns
  const requiredColumns = ['ops_id', 'name', 'role']
  const missingColumns = requiredColumns.filter(col => !headers.includes(col))
  
  if (missingColumns.length > 0) {
    Logger.log(`\n❌ Missing required columns: ${missingColumns.join(', ')}`)
  } else {
    Logger.log('\n✅ All required columns present')
  }
  
  // Check for empty ops_id
  const opsIdIndex = headers.indexOf('ops_id')
  let emptyOpsId = 0
  for (let i = 1; i < data.length; i++) {
    if (!data[i][opsIdIndex]) {
      emptyOpsId++
    }
  }
  
  if (emptyOpsId > 0) {
    Logger.log(`⚠️ Found ${emptyOpsId} rows with empty ops_id (will be skipped)`)
  } else {
    Logger.log('✅ All rows have ops_id')
  }
  
  // Check unique roles
  checkRolesInSheet()
}
