/**
 * SeaTalk QR Authentication Webhook Handler
 * Deploy as Web App in Google Apps Script
 * This receives the authentication callback from SeaTalk mobile app
 */

const SUPABASE_URL = 'https://odhwninwonguhkbbeeza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHduaW53b25ndWhrYmJlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTMyMjEsImV4cCI6MjA4MjE2OTIyMX0.F41DUv8hBdE08H5i09ofkvTywa8t7OnbrpdHW9Hjb-A';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { session_id, email } = payload;
    
    if (!session_id || !email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing session_id or email'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate email domain
    if (!email.endsWith('@shopeemobile-external.com')) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid email domain'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update session in Supabase
    const response = updateSeatalkSession(session_id, email);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Authentication successful'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSeatalkSession(sessionId, email) {
  const url = `${SUPABASE_URL}/rest/v1/seatalk_sessions?session_id=eq.${sessionId}`;
  
  const options = {
    method: 'patch',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify({
      email: email,
      authenticated: true
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SeaTalk Auth Webhook is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
