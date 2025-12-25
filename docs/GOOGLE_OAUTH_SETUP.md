# Google OAuth Setup Guide

Complete guide to configure Google OAuth for FTE authentication in the Outbound Internal Tool.

## Prerequisites

- Google Workspace account with admin access
- Access to Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `Outbound Internal Tool`
4. Click **Create**

## Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (for Google Workspace users only)
3. Click **Create**

### Fill in Application Information:
- **App name**: `Outbound Internal Tool`
- **User support email**: Your email
- **App logo**: (Optional) Upload company logo
- **Application home page**: `http://localhost:5173` (development)
- **Authorized domains**: Add your production domain
   - `openid`
   - `email`
   - `profile`
7. Click **Update** → **Save and Continue**

### Test Users (if using External):
8. Skip this for Internal apps
9. Click **Save and Continue**

## Step 4: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: `Web application`
4. **Name**: `Outbound Tool Web Client`

### Authorized JavaScript Origins:
Add these URLs:
```
http://localhost:5173
http://localhost:5174
http://localhost:3000
https://yourdomain.com
```

### Authorized Redirect URIs:
Add these URLs:
```
http://localhost:5173
http://localhost:5173/auth/callback
https://yourdomain.com
https://yourdomain.com/auth/callback
```

5. Click **Create**
6. **Copy the Client ID** (format: `xxxxx.apps.googleusercontent.com`)

## Step 5: Configure Environment Variables

1. Open `.env` file in your project root
2. Update the Google Client ID:
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
```

3. Save the file

## Step 6: Test OAuth Login

1. Start development server:
```bash
npm run dev
```

2. Open `http://localhost:5173`
3. Select **FTE** role
4. Click **Sign in with Google**
5. Authenticate with your Google Workspace account
6. Verify successful login

## Production Deployment

### Update OAuth Client Settings:

1. Go back to **Credentials** in Google Cloud Console
2. Edit your OAuth client
3. Add production URLs to:
   - **Authorized JavaScript origins**:
     ```
     https://yourdomain.com
     https://www.yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://yourdomain.com
     https://yourdomain.com/auth/callback
     ```

4. Update production `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verify redirect URI in Google Cloud Console matches exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Error: "access_denied"
- Verify OAuth consent screen is configured
- Check user has access (Internal vs External)
- Ensure required scopes are added

### Error: "invalid_client"
- Verify Client ID is correct in `.env`
- Check Client ID format includes `.apps.googleusercontent.com`
- Ensure OAuth client is not deleted

### Login popup blocked
- Allow popups for localhost/your domain
- Check browser popup settings

## Security Best Practices

1. **Never commit** `.env` file to version control
2. Use **Internal** consent screen for company-only access
3. Regularly **rotate** Client Secrets (if using server-side flow)
4. **Restrict** authorized domains to your actual domains
5. **Monitor** OAuth usage in Google Cloud Console

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## Support

For issues with Google OAuth setup, contact your IT administrator or development team.
