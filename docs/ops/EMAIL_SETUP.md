# EMAIL_SETUP (Resend + Supabase Auth Emails)

## Purpose
Enable reliable transactional emails for RNA-Pathology.com:
- Signup confirmation
- Password reset
- Magic link (if enabled)

## Architecture
Supabase Auth -> Custom SMTP -> Resend -> Recipient mailbox

## Domains
Sending subdomain: mail.rna-pathology.com
Sender address: no-reply@mail.rna-pathology.com

## DNS (Route53)
Hosted zone: rna-pathology.com

Records added for Resend (DO NOT change unless rotating provider):
1) DKIM
- Type: TXT
- Name: resend._domainkey.mail
- Value: (see Resend Domains page; public DKIM key)
- TTL: 300

2) SPF (subdomain send.mail)
- Type: MX
- Name: send.mail
- Value: priority 10 feedback-smtp.eu-west-1.amazonses.com (check Resend)
- TTL: 300

- Type: TXT
- Name: send.mail
- Value: v=spf1 include:amazonses.com ~all (check Resend)
- TTL: 300

Optional (recommended):
- DMARC
- Type: TXT
- Name: _dmarc.mail
- Value: v=DMARC1; p=none; adkim=s; aspf=s; rua=mailto:dmarc@rna-pathology.com

## Resend
- Domain verified: mail.rna-pathology.com (Resend -> Domains should show "Verified")
- SMTP settings:
  - Host: smtp.resend.com
  - Port: 587 (preferred) or 2465/2587
  - Username: resend
  - Password: Resend API Key (starts with re_) stored in password manager (NOT in git)

## Supabase Configuration
Supabase project: RNA-Pathology.com (Production)

Path:
Authentication -> Email -> SMTP provider settings

Values:
- Sender email: no-reply@mail.rna-pathology.com
- Sender name: RNA-Pathology.com
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: Resend API Key (re_...) [stored securely]

## Verification Checklist
1) Resend -> Domains shows DKIM/SPF Verified
2) Supabase -> Authentication -> Logs:
   - signup confirmation email: SUCCESS
   - password reset email: SUCCESS
3) Resend -> Logs shows Delivered for test emails
4) Test recipients:
   - Gmail
   - Outlook
   - SciLifeLab email

## Troubleshooting (quick)
- UI shows "Error sending confirmation email":
  -> Check Supabase Auth Logs for SMTP error details
  -> Common fixes: wrong password (not re_), wrong port (use 587), TLS handshake issues

- Resend Logs show Delivered but recipient not received:
  -> Check spam/quarantine
  -> Add/verify DMARC
  -> Review sender name/content
