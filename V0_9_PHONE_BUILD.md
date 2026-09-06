# AI ஜோதிடர் v0.9 — Real Jathagam Engine

இந்த build existing app-ஐ edit செய்த version; UI-ஐ rebuild செய்யவில்லை.

## Fixes
- Remote CDN astronomy dependency நீக்கப்பட்டது.
- GitHub Actions build நேரத்தில் `astronomy-engine@2.1.19` install செய்து APK-க்குள் local asset ஆக bundle செய்யப்படும்.
- Planet positions: geocentric apparent ecliptic calculation.
- Lahiri / Chitrapaksha sidereal conversion.
- Mean Rahu / Ketu.
- GAST + longitude அடிப்படையிலான Lagna.
- Whole-sign houses.
- Moon Nakshatra + Pada.
- Existing Vimshottari Mahadasha display தொடர்கிறது.
- Calculation errors status area-ல் காட்டப்படும்.

## Phone build
1. ZIP-ஐ extract செய்யவும்.
2. Files-ஐ GitHub `AI-Jothidar` repository root-ல் upload/replace செய்யவும்.
3. GitHub → Actions → Build Android APK → Run workflow.
4. Build success ஆனதும் `AI-Jothidar-v0.9-debug-apk` artifact-ஐ install செய்யவும்.

Runtime calculation-க்கு remote astrology API தேவையில்லை; Astronomy Engine APK build-ல் bundle ஆகும்.
