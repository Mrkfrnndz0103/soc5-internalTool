/**
 * Google Apps Script: Sync Google Sheets to Supabase (IMPROVED)
 * 
 * This script syncs Users and Outbound Map data from Google Sheets to Supabase
 * Run this script on edit or on a time-based trigger
 */

// Configuration
const SUPABASE_URL = 'https://odhwninwonguhkbbeeza.supabase.co'
// Use SERVICE_ROLE key for sync (bypasses RLS) - Get from Supabase Settings > API
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHduaW53b25ndWhrYmJlZXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzIyMSwiZXhwIjoyMDgyMTY5MjIxfQ.HLs02XfN2H69DGOxLYLMq5XQbgZAkNRee6_Nvy2MhSg'
// Or use ANON key with RLS policy: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHduaW53b25ndWhrYmJlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTMyMjEsImV4cCI6MjA4MjE2OTIyMX0.F41DUv8hBdE08H5i09ofkvTywa8t7OnbrpdHW9Hjb-A'

// Sheet names
const USERS_SHEET = 'Users'
const OUTBOUND_MAP_SHEET = 'Outbound Map'

/**
 * Sync users from Google Sheets to Supabase
 */
function syncUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET)
  if (!sheet) {
    Logger.log('❌ Users sheet not found')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const rows = data.slice(1)
  
  Logger.log(`📊 Found ${rows.length} rows in Users sheet`)
  Logger.log(`📋 Headers: ${headers.join(', ')}`)
  
  const users = rows.map(row => {
    const user = {}
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/ /g, '_')
      user[key] = row[index]
    })
    return user
  }).filter(user => user.ops_id) // Filter out empty rows
  
  Logger.log(`✅ Processed ${users.length} valid users`)
  
  if (users.length === 0) {
    Logger.log('⚠️ No valid users to sync')
    return
  }
  
  // Upsert to Supabase with proper on_conflict parameter
  const url = `${SUPABASE_URL}/rest/v1/users?on_conflict=ops_id`
  const options = {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    payload: JSON.stringify(users),
    muteHttpExceptions: true
  }
  
  try {
    const response = UrlFetchApp.fetch(url, options)
    const responseCode = response.getResponseCode()
    const responseText = response.getContentText()
    
    Logger.log(`📡 Users sync response: ${responseCode}`)
    Logger.log(`📄 Response body: ${responseText}`)
    
    if (responseCode === 201 || responseCode === 200) {
      Logger.log('✅ Users synced successfully!')
    } else {
      Logger.log(`❌ Sync failed with code ${responseCode}`)
    }
  } catch (error) {
    Logger.log(`❌ Error syncing users: ${error.toString()}`)
  }
}

/**
 * Sync outbound map from Google Sheets to Supabase
 */
function syncOutboundMap() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(OUTBOUND_MAP_SHEET)
  if (!sheet) {
    Logger.log('❌ Outbound Map sheet not found')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const rows = data.slice(1)
  
  Logger.log(`📊 Found ${rows.length} rows in Outbound Map sheet`)
  Logger.log(`📋 Headers: ${headers.join(', ')}`)
  
  const outboundData = rows.map(row => {
    const item = {}
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/ /g, '_')
      item[key] = row[index]
    })
    return item
  }).filter(item => item.cluster_name) // Filter out empty rows
  
  Logger.log(`✅ Processed ${outboundData.length} valid outbound map entries`)
  
  if (outboundData.length === 0) {
    Logger.log('⚠️ No valid outbound map data to sync')
    return
  }
  
  // Upsert to Supabase with proper on_conflict parameter
  const url = `${SUPABASE_URL}/rest/v1/outbound_map?on_conflict=cluster_name`
  const options = {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    payload: JSON.stringify(outboundData),
    muteHttpExceptions: true
  }
  
  try {
    const response = UrlFetchApp.fetch(url, options)
    const responseCode = response.getResponseCode()
    const responseText = response.getContentText()
    
    Logger.log(`📡 Outbound Map sync response: ${responseCode}`)
    Logger.log(`📄 Response body: ${responseText}`)
    
    if (responseCode === 201 || responseCode === 200) {
      Logger.log('✅ Outbound Map synced successfully!')
    } else {
      Logger.log(`❌ Sync failed with code ${responseCode}`)
    }
  } catch (error) {
    Logger.log(`❌ Error syncing outbound map: ${error.toString()}`)
  }
}

/**
 * Main sync function - call this from triggers
 */
function syncAllData() {
  Logger.log('🚀 Starting sync at ' + new Date())
  syncUsers()
  syncOutboundMap()
  Logger.log('✅ Sync completed at ' + new Date())
}

/**
 * Setup time-based trigger (run once)
 * Syncs every 1 minute
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger))
  
  // Create new trigger - sync every 1 minute
  ScriptApp.newTrigger('syncAllData')
    .timeBased()
    .everyMinutes(1)
    .create()
  
  Logger.log('✅ Triggers setup complete - syncing every 1 minute')
}

/**
 * Test function to check sheet structure
 */
function testSheetStructure() {
  Logger.log('=== Testing Sheet Structure ===')
  
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheets = ss.getSheets()
  
  Logger.log(`📚 Total sheets: ${sheets.length}`)
  sheets.forEach(sheet => {
    Logger.log(`  - ${sheet.getName()}`)
  })
  
  // Check Users sheet
  const usersSheet = ss.getSheetByName(USERS_SHEET)
  if (usersSheet) {
    const data = usersSheet.getDataRange().getValues()
    Logger.log(`\n✅ Users sheet found`)
    Logger.log(`   Rows: ${data.length}`)
    Logger.log(`   Headers: ${data[0].join(', ')}`)
  } else {
    Logger.log(`\n❌ Users sheet NOT found`)
  }
  
  // Check Outbound Map sheet
  const mapSheet = ss.getSheetByName(OUTBOUND_MAP_SHEET)
  if (mapSheet) {
    const data = mapSheet.getDataRange().getValues()
    Logger.log(`\n✅ Outbound Map sheet found`)
    Logger.log(`   Rows: ${data.length}`)
    Logger.log(`   Headers: ${data[0].join(', ')}`)
  } else {
    Logger.log(`\n❌ Outbound Map sheet NOT found`)
  }
}
