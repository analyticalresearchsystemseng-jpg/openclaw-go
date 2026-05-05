# OpenClaw Go — TestFlight Setup Guide

**Repo:** https://github.com/analyticalresearchsystemseng-jpg/openclaw-go

---

## What I've Done

✅ **iOS App Created**
- App Name: OpenClaw Go
- Bundle ID: `com.neilross.openclaw`
- Features: Sensors, Cron editing, Gateway monitoring

✅ **GitHub Actions Workflow**
- Auto-builds on push to master
- Manual trigger with version/build number
- Fastlane configured for TestFlight upload

✅ **Fastlane Setup**
- Build lane: `fastlane build`
- Auto-increments build number
- Uploads to TestFlight

---

## What YOU Need to Do

### 1. Add GitHub Secrets (Required)

Go to: `https://github.com/analyticalresearchsystemseng-jpg/openclaw-go/settings/secrets/actions`

Add these secrets:

| Secret Name | What It Is | Where to Find |
|------------|-----------|--------------|
| `ASC_KEY_P8` | App Store Connect API key (base64 encoded) | App Store Connect → Users → Keys |
| `ASC_KEY_ID` | Key ID (e.g., `A1B2C3D4E5`) | Same as above |
| `ASC_ISSUER_ID` | Issuer ID (UUID format) | Same as above |
| `ASC_TEAM_ID` | Apple Developer Team ID | Apple Developer → Membership |
| `APPLE_ID` | Your Apple ID email | Your Apple login |
| `MATCH_PASSWORD` | Match passphrase (if using match) | You create this |

### 2. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** OpenClaw Go
   - **Bundle ID:** `com.neilross.openclaw` (must match exactly)
   - **SKU:** openclaw-go-001
   - **Primary Language:** English (UK)
4. Click **Create**

### 3. Create App Store Connect API Key

1. App Store Connect → Users and Access → Keys
2. Click **"+"** to create new key
3. Name: `GitHub Actions`
4. Role: `App Manager`
5. Download the `.p8` file (you only get to do this ONCE)
6. Base64 encode it: `base64 -w0 AuthKey_XXXXXXXXXX.p8`
7. Add to GitHub secrets as `ASC_KEY_P8`

### 4. Trigger First Build

After adding secrets:

1. Go to: `https://github.com/analyticalresearchsystemseng-jpg/openclaw-go/actions`
2. Click **"iOS Build and Deploy"**
3. Click **"Run workflow"**
4. Set:
   - **Version:** `1.0.0`
   - **Build Number:** `1`
   - **Deploy:** `true`
5. Click **"Run workflow"**

### 5. TestFlight

1. Build appears in App Store Connect → TestFlight
2. Add yourself as internal tester
3. Install via TestFlight app on your iPhone

---

## App Features

### Sensors Tab
- 📍 GPS Location (with map link)
- 🔋 Battery level + charging status
- 📱 Device info (model, OS, platform)
- 📊 Accelerometer stream
- 📸 Camera test
- 🔔 Push notification setup

### Cron Tab
- View all cron jobs
- Edit name and schedule
- Enable/disable jobs
- Run jobs immediately
- Delete jobs

### Monitor Tab
- Gateway status
- Session management
- Channel status
- Log viewing

---

## Privacy Policy

**Required for App Store.** I've created a basic privacy policy at:
`docs/privacy-policy.html`

You'll need to host this somewhere and add the URL to App Store Connect.

---

## Next Steps After You're Set Up

1. ✅ Add GitHub secrets
2. ✅ Create App Store Connect app entry
3. ✅ Trigger first build
4. ✅ Test on TestFlight
5. ✅ Submit for review (if happy)

**Questions? Just ask!** 🧐
