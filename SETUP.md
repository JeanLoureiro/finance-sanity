# Email Setup Guide

This project uses **Resend** with **React Email** for sending authentication emails and invitations, bypassing Supabase's 2 emails/hour rate limit on the free tier.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Resend API Key
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email sender address (optional)
# For development, you can use the default: onboarding@resend.dev
# For production, use your verified domain: noreply@yourdomain.com
EMAIL_FROM="Financial Sanity <noreply@financialsanity.app"

# Mock emails in development (optional)
# Set to "true" to log emails to console instead of sending
# Useful for testing invitations to multiple emails without domain verification
MOCK_EMAILS=true
```

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Navigate to **API Keys** in the dashboard
4. Create a new API key
5. Copy the key and add it to your `.env.local` as `RESEND_API_KEY`

### 2. Configure Email Sender

**For Development:**
- Use the default sender: `onboarding@resend.dev`
- No domain verification needed
- Emails will only be sent to your verified email address

**For Production:**
1. Add and verify your domain in Resend dashboard
2. Update `EMAIL_FROM` with your domain email
3. Example: `EMAIL_FROM="Financial Sanity <noreply@financialsanity.app>"`

### 3. Run Database Migration

```bash
npx prisma migrate dev
```

### 4. Test the Setup

**Option A: Mock Emails (Recommended for Testing Invitations)**

1. Add to `.env.local`:
   ```bash
   MOCK_EMAILS=true
   EMAIL_FROM="Financial Sanity <noreply@financialsanity.app"
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Test invitations to any email — they'll be logged to console instead of sent
4. Check server logs for invitation links and password-reset links

**Option B: Real Emails (Limited to Verified Addresses)**

1. Remove or set `MOCK_EMAILS=false` in `.env.local`
2. Add test email addresses in Resend dashboard
3. Navigate to `/login`, register, and test the forgot-password flow
4. Check your inbox for the password-reset email

## Email Templates

Email templates are located in the `emails/` directory:

- **`emails/invitation.tsx`** - User invitation email

These are React components that you can customize with your branding.

## How It Works

### Email + Password Authentication

1. User registers at `/login` with email and password (Supabase `signUp`)
2. Supabase sends a confirmation email; after confirmation the user can sign in
3. On sign-in (`signInWithPassword`), the session is established server-side via the SSR client
4. Every authenticated page route enforces `aal2` — the user must complete TOTP MFA before accessing the app
5. New users are redirected to `/auth/mfa` to enroll an authenticator app; returning users verify their TOTP code there
6. Forgot-password flow: user submits email → Supabase sends a reset link → `/api/auth/callback` exchanges the PKCE code for a session server-side → `/auth/reset-password` verifies the session and lets them set a new password → redirected back through MFA

### Invitations

1. Owner sends invitation via `/settings`
2. Invitation record created in database
3. Email sent via Resend with invitation link
4. Invitee clicks link → redirected to `/accept-invite?token=xxx`
5. Invitee creates account and accepts invitation

## Troubleshooting

### Emails not sending

- Check that `RESEND_API_KEY` is set correctly
- Verify your Resend account is active
- Check server logs for error messages

### Rate limiting

- Free tier: 100 emails/day, 3,000 emails/month
- Upgrade to paid plan for higher limits

### Email not received

- Check spam folder
- Verify email address is correct
- In development, emails only sent to verified addresses in Resend

## Cost Comparison

| Provider | Free Tier | Cost |
|----------|-----------|------|
| Supabase | 2 emails/hour | $25/month for Pro |
| Resend | 100 emails/day | Free (3,000/month) |
| Resend Pro | Unlimited | $20/month (50,000 emails) |

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [React Email Components](https://react.email/docs/components)
