# Production Release Checklist

## ✅ Current Status
- ✅ Backend deployed on Railway
- ✅ Admin dashboard accessible
- ✅ Mobile app working with Railway API
- ✅ Admin verification system in place
- ✅ Database migrations complete

## 📱 Mobile App Distribution

### Option 1: Direct APK Distribution (Android - Easiest)
**Best for:** Quick internal distribution, testing with employees

1. **Build APK:**
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```

2. **Download & Share:**
   - EAS will provide a download link
   - Share the link with employees
   - They install directly on Android phones

3. **Advantages:**
   - No app store approval needed
   - Instant distribution
   - Free

### Option 2: Google Play Store (Android)
**Best for:** Professional distribution, automatic updates

1. **Requirements:**
   - Google Play Developer account ($25 one-time fee)
   - App signing key

2. **Build for Production:**
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```

3. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

### Option 3: Apple App Store (iOS)
**Best for:** iPhone users, professional distribution

1. **Requirements:**
   - Apple Developer account ($99/year)
   - App Store Connect setup

2. **Build for Production:**
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

3. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

## 🔒 Production Security Checklist

### Railway Environment Variables
Verify these are set in Railway dashboard:

- ✅ `DATABASE_URL` - PostgreSQL connection (auto-linked)
- ✅ `JWT_SECRET` - Strong random string (min 32 chars)
- ✅ `VALID_QR_CODE` - Your company QR code value
- ✅ `NODE_ENV` - Set to `production`
- ⚠️ `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Optional (not needed with admin verification)

### Security Best Practices
- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (generate with: `openssl rand -base64 32`)
- [ ] Keep Railway dashboard access secure
- [ ] Regularly backup database
- [ ] Monitor Railway logs for suspicious activity

## 🧪 Pre-Release Testing

### End-to-End Test Flow
1. [ ] **Registration Test:**
   - Register new employee from mobile app
   - Verify account appears in admin dashboard as "pending"

2. [ ] **Admin Verification Test:**
   - Log into admin dashboard
   - Click "Overiť" button for pending employee
   - Verify status changes to "Overený"

3. [ ] **Login Test:**
   - Log in with verified account on mobile app
   - Verify successful login

4. [ ] **QR Scan Test:**
   - Scan valid QR code
   - Verify attendance record created
   - Check record appears in history

5. [ ] **Admin Dashboard Test:**
   - View employee stats
   - Export CSV
   - Update hourly rates
   - Verify calculations are correct

### Load Testing
- [ ] Test with multiple simultaneous users
- [ ] Verify database performance
- [ ] Check Railway resource usage

## 📊 Monitoring & Maintenance

### Railway Monitoring
- [ ] Set up Railway alerts for:
  - High error rates
  - Database connection issues
  - Deployment failures

### Database Backups
Railway provides automatic backups, but verify:
- [ ] Backup retention period is set
- [ ] You know how to restore from backup

### Regular Maintenance Tasks
- [ ] Review employee accounts monthly
- [ ] Clean up old attendance records (optional)
- [ ] Monitor storage usage
- [ ] Update dependencies quarterly

## 📝 User Documentation

### For Employees
Create a simple guide:
1. How to download/install the app
2. How to register
3. How to scan QR code
4. What to do if login fails

### For Admins
1. How to access admin dashboard
2. How to verify new employees
3. How to export data
4. How to update hourly rates
5. How to view employee stats

## 🚀 Quick Start Commands

### Build Android APK (Preview - for testing)
```bash
cd mobile
eas build --platform android --profile preview
```

### Build Android APK (Production - for distribution)
```bash
cd mobile
eas build --platform android --profile production
```

### Check Railway Deployment
```bash
# Check if server is running
curl https://web-production-65f2b.up.railway.app/api/health
```

### View Railway Logs
- Go to Railway dashboard → Your service → Deployments → View logs

## 🎯 Recommended Release Path

### Phase 1: Internal Testing (Week 1)
1. Build preview APK
2. Install on 2-3 test devices
3. Test all features
4. Fix any issues

### Phase 2: Pilot Launch (Week 2)
1. Build production APK
2. Distribute to 5-10 employees
3. Monitor for issues
4. Gather feedback

### Phase 3: Full Rollout (Week 3+)
1. Distribute to all employees
2. Provide training/support
3. Monitor usage and performance

## ⚠️ Important Notes

1. **QR Code:** Make sure you have a physical QR code printed with the value from `VALID_QR_CODE` environment variable

2. **Admin Access:** Keep admin credentials secure. First admin should verify all other employees.

3. **Network:** Employees need internet connection to use the app (for login and scanning)

4. **Updates:** When you update the app, employees will need to download the new APK

5. **Railway Costs:** Monitor your Railway usage. Free tier has limits.

## 🆘 Troubleshooting

### Mobile App Issues
- **Can't connect to server:** Check Railway URL in `mobile/src/config/api.ts`
- **Login fails:** Verify employee is approved by admin
- **QR scan doesn't work:** Check camera permissions

### Admin Dashboard Issues
- **Can't log in:** Verify admin account exists and is verified
- **No employees showing:** Check database connection
- **Export fails:** Check browser console for errors

### Railway Issues
- **Deployment fails:** Check build logs in Railway
- **Database errors:** Verify `DATABASE_URL` is set correctly
- **App not accessible:** Check Railway service status

## 📞 Support

For issues:
1. Check Railway deployment logs
2. Check mobile app console (Expo Go)
3. Review this checklist
4. Check GitHub issues

---

**Last Updated:** 2024-12-30
**Version:** 1.0.0

