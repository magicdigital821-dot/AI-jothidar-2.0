# AI ஜோதிடர் — Phone → APK

இந்த project phone மட்டும் வைத்து APK build செய்ய cloud GitHub Actions workflow உடன் தயாரிக்கப்பட்டது.

## செய்வது

1. GitHub account-ல் sign in செய்யவும்.
2. புதிய repository உருவாக்கவும்.
3. இந்த ZIP-ல் உள்ள எல்லா files-ஐ repository-க்கு upload செய்யவும்.
4. `.github/workflows/build-apk.yml` file அதே folder path-ல் இருக்க வேண்டும்.
5. Repository → **Actions** → **Build Android APK** செல்லவும்.
6. **Run workflow** அழுத்தவும்.
7. Build முடிந்ததும் workflow run-ஐ திறக்கவும்.
8. `AI-Jothidar-debug-apk` என்ற artifact-ஐ download செய்யவும்.
9. Download செய்த artifact-ஐ extract செய்து `app-debug.apk`-ஐ Android phone-ல் install செய்யவும்.

## குறிப்பு

இது testing/debug APK. Play Store release build அல்ல.
