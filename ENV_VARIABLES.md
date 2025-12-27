# Environment Variables Documentation

Complete reference for all environment variables used in the Outbound Internal Tool.

---

## Quick Setup

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

---

## Required Variables

### Supabase (Required)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
- Get from: [Supabase Dashboard](https://supabase.com) → Project Settings → API

### Google OAuth (Required for FTE Login)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```
- Get from: [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials

---

## Optional Variables

### Seatalk Integration
```env
VITE_SEATALK_APP_ID=your_seatalk_app_id
SEATALK_APP_SECRET=your_seatalk_app_secret
SEATALK_WEBHOOK_URL=https://your-domain.com/api/seatalk/webhook
```
- Required for: QR code authentication
- Get from: Seatalk Developer Portal

### Gmail OTP
```env
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
GMAIL_SENDER_EMAIL=noreply@shopeemobile-external.com
OTP_EXPIRY_MINUTES=5
```
- Required for: Email OTP authentication
- Get from: Google Cloud Console → Service Accounts

### Google Sheets Sync
```env
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_SHEETS_API_KEY=your_sheets_api_key
```
- Required for: Master data synchronization
- Get from: Google Sheets URL and API Console

### Development Mode
```env
VITE_USE_MOCK_API=true
NODE_ENV=development
```
- Set `VITE_USE_MOCK_API=true` to use mock data without backend

---

## Variable Categories

### 1. Supabase Configuration
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| VITE_SUPABASE_URL | Supabase project URL | Yes | - |
| VITE_SUPABASE_ANON_KEY | Public anon key | Yes | - |
| VITE_SUPABASE_SERVICE_ROLE_KEY | Service role key (backend only) | No | - |

### 2. Authentication
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| VITE_GOOGLE_CLIENT_ID | Google OAuth client ID | Yes | - |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | No | - |
| VITE_SEATALK_APP_ID | Seatalk app ID | No | - |
| SEATALK_APP_SECRET | Seatalk app secret | No | - |
| SESSION_SECRET | Session encryption key | No | auto-generated |
| JWT_SECRET | JWT signing key | No | auto-generated |
| JWT_EXPIRY | Token expiration time | No | 24h |

### 3. Email & OTP
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| GOOGLE_SERVICE_ACCOUNT_KEY | Service account JSON path | No | - |
| GMAIL_SENDER_EMAIL | Sender email address | No | - |
| OTP_EXPIRY_MINUTES | OTP validity duration | No | 5 |
| MAX_OTP_ATTEMPTS | Max verification attempts | No | 3 |
| SMTP_HOST | SMTP server host | No | smtp.gmail.com |
| SMTP_PORT | SMTP server port | No | 587 |

### 4. Application Settings
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| VITE_APP_URL | Application base URL | No | http://localhost:5173 |
| VITE_APP_NAME | Application name | No | Outbound Internal Tool |
| VITE_APP_VERSION | Application version | No | 1.0.0 |
| NODE_ENV | Environment mode | No | development |
| VITE_USE_MOCK_API | Use mock data | No | false |

### 5. Google Sheets
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| GOOGLE_SHEETS_ID | Spreadsheet ID | No | - |
| GOOGLE_SHEETS_API_KEY | Sheets API key | No | - |
| SHEETS_SYNC_INTERVAL_HOURS | Sync frequency | No | 1 |

### 6. Security & Rate Limiting
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| RATE_LIMIT_WINDOW_MS | Rate limit window | No | 900000 (15 min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | No | 100 |
| OTP_RATE_LIMIT_PER_HOUR | OTP requests per hour | No | 5 |
| COOKIE_DOMAIN | Cookie domain | No | localhost |
| COOKIE_SECURE | Use secure cookies | No | false |

### 7. File Storage
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| SUPABASE_STORAGE_BUCKET | Storage bucket name | No | dispatch-reports |
| MAX_FILE_SIZE_MB | Max upload size | No | 10 |
| ALLOWED_FILE_TYPES | Allowed file extensions | No | .xlsx,.csv,.pdf |

### 8. Notifications
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| SEATALK_BOT_TOKEN | Seatalk bot token | No | - |
| SEATALK_GROUP_CHAT_IDS | Group chat IDs (comma-separated) | No | - |
| ENABLE_EMAIL_NOTIFICATIONS | Enable email alerts | No | true |
| ENABLE_AUDIO_ALERTS | Enable audio notifications | No | true |

### 9. Monitoring & Logging
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| SENTRY_DSN | Sentry error tracking DSN | No | - |
| LOG_LEVEL | Logging level | No | info |
| ENABLE_ANALYTICS | Enable analytics | No | true |

### 10. Webhooks
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| WEBHOOK_SECRET | Webhook signature secret | No | - |
| GOOGLE_APPS_SCRIPT_WEBHOOK_URL | Apps Script webhook URL | No | - |

### 11. Feature Flags
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| FEATURE_QR_AUTH | Enable QR authentication | No | true |
| FEATURE_OTP_AUTH | Enable OTP authentication | No | true |
| FEATURE_GOOGLE_SHEETS_SYNC | Enable Sheets sync | No | true |
| FEATURE_AUDIO_NOTIFICATIONS | Enable audio alerts | No | true |
| FEATURE_DARK_MODE | Enable dark mode | No | true |

### 12. CORS
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| CORS_ORIGIN | Allowed origins (comma-separated) | No | http://localhost:5173 |
| CORS_CREDENTIALS | Allow credentials | No | true |

### 13. Caching (Optional)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| REDIS_URL | Redis connection URL | No | - |
| REDIS_PASSWORD | Redis password | No | - |
| CACHE_TTL_SECONDS | Cache TTL | No | 3600 |

### 14. Third-Party Integrations (Future)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| TEAMS_WEBHOOK_URL | Microsoft Teams webhook | No | - |
| SLACK_WEBHOOK_URL | Slack webhook | No | - |
| WHATSAPP_API_KEY | WhatsApp API key | No | - |
| SMS_API_KEY | SMS gateway API key | No | - |

---

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_USE_MOCK_API=true
COOKIE_SECURE=false
LOG_LEVEL=debug
```

### Staging
```env
NODE_ENV=staging
VITE_APP_URL=https://staging.your-domain.com
VITE_USE_MOCK_API=false
COOKIE_SECURE=true
LOG_LEVEL=info
```

### Production
```env
NODE_ENV=production
VITE_APP_URL=https://your-domain.com
VITE_USE_MOCK_API=false
COOKIE_SECURE=true
COOKIE_DOMAIN=your-domain.com
LOG_LEVEL=error
ENABLE_ANALYTICS=true
```

---

## Security Best Practices

1. **Never commit `.env` file** - Only commit `.env.example`
2. **Use strong secrets** - Generate random strings for secrets
3. **Rotate keys regularly** - Update API keys periodically
4. **Restrict access** - Limit who can view production secrets
5. **Use environment-specific keys** - Different keys for dev/staging/prod

### Generate Secure Secrets
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

---

## Troubleshooting

### Variables not loading
- Ensure `.env` file is in project root
- Restart development server after changes
- Check for typos in variable names
- Verify `VITE_` prefix for frontend variables

### CORS errors
- Add your domain to `CORS_ORIGIN`
- Set `CORS_CREDENTIALS=true` if using cookies

### Authentication issues
- Verify Supabase keys are correct
- Check Google OAuth redirect URIs
- Ensure email domain matches restrictions

---

## Auto-Update Notice

This file is automatically updated when new environment variables are added to the project. Always refer to `.env.example` for the latest variable list.

**Last Updated**: January 2025
