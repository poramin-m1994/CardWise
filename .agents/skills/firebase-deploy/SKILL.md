---
name: firebase-deploy
description: Automatically verify public web assets and deploy the CardWise web application to Firebase Hosting (cardwise-d7be7).
---

# Firebase Deploy Skill 🚀

Automate the deployment of the CardWise web application to Firebase Hosting with automated pre-checks, execution, and link reporting.

## Workflow

When the user calls `/firebase-deploy` or asks to deploy the application to Firebase, follow these exact steps:

### Step 1: Pre-deployment Verification
1. Verify that `firebase.json` and `.firebaserc` exist in the workspace root.
2. Verify that key files in `public/` exist:
   - `public/index.html`
   - `public/landing.html`
   - `public/manage.html`
   - `public/js/` scripts (`landing.js`, `manage.js`, `sheets.js`, `theme.js`, `auth.js`)

### Step 2: Execute Deployment Command
Run the Firebase Hosting deployment command in the workspace directory:

```powershell
firebase deploy --only hosting
```

### Step 3: Parse Output & Handle Edge Cases
- **Success (`+ Deploy complete!`)**:
  - Extract and present the live Hosting URL: `https://cardwise-d7be7.web.app`
  - Present the Project Console link: `https://console.firebase.google.com/project/cardwise-d7be7/overview`
- **Authentication Error (`Firebase login required` / `Token expired`)**:
  - Advise the user to run `firebase login` in their terminal to re-authenticate.
- **Project Target Mismatch**:
  - Verify that `.firebaserc` targets `cardwise-d7be7`.

### Step 4: Summary Response
Provide a clean, user-friendly Thai summary confirming the deployment with clickable links to the live site.
