# AI ஜோதிடர் v0.7 — Professional Full App UI

இந்த பதிப்பு v0.6-ஐ அடிப்படையாக கொண்டு முழு mobile app-style navigation மற்றும் கணக்கீட்டு முடிவுகளை ஒரே project-ல் இணைக்கிறது.

## இதில் வேலை செய்கிறது
- Home dashboard
- Birth details
- Sidereal planetary positions
- Approximate Lagna
- Moon Rasi
- Nakshatra + Pada
- South Indian style Rasi chart
- D9 Navamsa chart
- 12 whole-sign houses
- Planet table
- Vimshottari Mahadasha timeline
- Basic current transit
- AI astrologer chat UI shell
- Profile + localStorage saved chart
- Tamil-first UI + English toggle foundation
- PWA manifest + service worker
- Capacitor-ready Android project metadata

## முக்கிய குறிப்பு
இது இன்னும் MVP. Lagna, Rahu/Ketu, ayanamsa, D9 mapping மற்றும் dasha timing ஆகியவை production-grade Vedic astrology engine மூலம் cross-check செய்யப்பட வேண்டும். AI chat தற்போது frontend demo மட்டுமே; API/backend இணைப்பு அடுத்த கட்டம்.

## Android APK
Node.js + Android Studio உள்ள computer-ல்:
1. `npm install`
2. `npx cap add android`
3. `npx cap sync`
4. `npx cap open android`
5. Android Studio → Build → Build APK(s)

## Zero-cost testing
இந்த project-ஐ HTTPS hosting-ல் PWA ஆகவும் test செய்யலாம். Direct `file://` திறப்பதை விட local server அல்லது HTTPS பயன்படுத்துவது சிறந்தது.

## அடுத்த production கட்டம்
- Place-name search + geocoding
- Swiss Ephemeris / verified ephemeris backend
- Bhava chart refinement
- D9 standard mapping verification
- Full Antardasha/Pratyantardasha
- Gocharam for all planets
- Porutham / marriage compatibility
- Career & finance reports
- Real AI backend
- Login + cloud saved charts
- Paid/free plans


## Phone-only APK build
See `PHONE_TO_APK.md`. GitHub Actions workflow: `.github/workflows/build-apk.yml`.
