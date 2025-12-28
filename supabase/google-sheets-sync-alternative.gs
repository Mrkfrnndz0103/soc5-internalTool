/**
 * Google Apps Script: Sync with DELETE and INSERT approach
 * This clears existing data and inserts fresh data from Google Sheets
 */

// Configuration
const SUPABASE_URL = 'https://odhwninwonguhkbbeeza.supabase.co'
// Use SERVICE_ROLE key for this approach (bypasses RLS)
const SUPABASE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'

const USERS_SHEET = 'Users'
const OUTBOUND_MAP_SHEET = 'Outbound Map'

/**
 * Sync users - DELETE ALL then INSERT
 */
function syncUsersWithReplace() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET)
  if (!sheet) {
    Logger.log('❌ Users sheet not found')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const rows = data.slice(1)
  
  Logger.log(`📊 Found ${rows.length} rows in Users sheet`)
  
  const users = rows.map(row => {
    const user = {}
    headers.forEach((header, index) => {
      user[header.toLowerCase().replace(/ /g, '_')] = row[index]
    })
    return user
  }).filter(user => user.ops_id)
  
  Logger.log(`✅ Processed ${users.length} valid users`)
  
  if (users.length === 0) {
    Logger.log('⚠️ No valid users to sync')
    return
  }
  
  // Step 1: Delete all existing users
  Logger.log('🗑️ Deleting existing users...')
  const deleteUrl = `${SUPABASE_URL}/rest/v1/users?ops_id=neq.`
  const deleteOptions = {
    method: 'delete',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  }
  
  try {
    const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions)
    Logger.log(`🗑️ Delete response: ${deleteResponse.getResponseCode()}`)
  } catch (error) {
    Logger.log(`❌ Error deleting: ${error.toString()}`)
    return
  }
  
  // Step 2: Insert all users
  Logger.log('📥 Inserting users...')
  const insertUrl = `${SUPABASE_URL}/rest/v1/users`
  const insertOptions = {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(users),
    muteHttpExceptions: true
  }
  
  try {
    const response = UrlFetchApp.fetch(insertUrl, insertOptions)
    const responseCode = response.getResponseCode()
    const responseText = response.getContentText()
    
    Logger.log(`📡 Insert response: ${responseCode}`)
    
    if (responseCode === 201) {
      Logger.log('✅ Users synced successfully!')
    } else {
      Logger.log(`❌ Sync failed with code ${responseCode}`)
      Logger.log(`📄 Response: ${responseText}`)
    }
  } catch (error) {
    Logger.log(`❌ Error inserting: ${error.toString()}`)
  }
}

/**
 * Sync users - UPSERT one by one (slower but more reliable)
 */
function syncUsersOneByOne() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET)
  if (!sheet) {
    Logger.log('❌ Users sheet not found')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const rows = data.slice(1)
  
  Logger.log(`📊 Processing ${rows.length} rows`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const user = {}
    
    headers.forEach((header, index) => {
      user[header.toLowerCase().replace(/ /g, '_')] = row[index]
    })
    
    if (!user.ops_id) continue
    
    // Upsert individual user
    const url = `${SUPABASE_URL}/rest/v1/users?ops_id=eq.${user.ops_id}`
    const options = {
      method: 'post',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      payload: JSON.stringify(user),
      muteHttpExceptions: true
    }
    
    try {
      const response = UrlFetchApp.fetch(url, options)
      const responseCode = response.getResponseCode()
      
      if (responseCode === 201 || responseCode === 200) {
        successCount++
      } else {
        errorCount++
        Logger.log(`❌ Failed for ${user.ops_id}: ${responseCode}`)
      }
    } catch (error) {
      errorCount++
      Logger.log(`❌ Error for ${user.ops_id}: ${error.toString()}`)
    }
    
    // Add small delay to avoid rate limiting
    if (i % 10 === 0) {
      Utilities.sleep(100)
    }
  }
  
  Logger.log(`✅ Sync complete: ${successCount} success, ${errorCount} errors`)
}
