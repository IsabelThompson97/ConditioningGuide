# Setup — Conditioning Guide

A one-time setup that takes ~10 minutes. After this, the app on her iPad just works: she logs entries, they save offline first, then sync to a Google Sheet you both can see.

---

## What you'll end up with

- **A Google Sheet** you own, with a tab for each kind of entry (Vitals, Activity, EKG, BloodSugar, StageDecisions, Config). She writes to it from the app; you can open it any time to read or edit.
- **A Google Apps Script** attached to that sheet, deployed as a tiny web app. The app sends entries to it over HTTPS.
- **`index.html`** hosted somewhere (anywhere — GitHub Pages, your own server, even AirDropped to her iPad once and opened from Files). She opens it, taps "Add to Home Screen," and she has an app icon.

Everything lives in **your** Google account. No third parties. The web-app URL is the only way in.

---

## Step 1 — Create the Google Sheet

1. Open <https://sheets.new>. You'll get a blank spreadsheet.
2. Rename it to something like **"Aunt — Conditioning Log"** (top-left, click the title).
3. That's it. You don't need to add tabs or headers — the script creates them on first write.

If you want her to see it too, share the sheet with her email (top-right **Share**, give her **Viewer** access — Editor only if you want her able to edit cells directly, which is rarely useful since the app does all the writing).

---

## Step 2 — Add the Apps Script

1. In the sheet, go to **Extensions → Apps Script**. A code editor opens in a new tab.
2. Delete the empty `function myFunction() {}` stub.
3. Open `Code.gs` from this folder, **select all**, copy.
4. Paste into the Apps Script editor.
5. Click the **disk icon** (or `Cmd+S`) to save. Name the project anything, e.g., "Conditioning Sync."

---

## Step 3 — Deploy as a web app

1. Top-right of the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description:** anything, e.g., `v1`
   - **Execute as:** **Me** (your Google account — important, this is what gives the script permission to write to the sheet)
   - **Who has access:** **Anyone**
     - This sounds scary but is fine: the URL is unguessable (a long random string) and the script only does what's in `Code.gs` (read/write your sheet). Anyone with the URL can write entries to *your* sheet — so don't post the URL publicly, but sharing it with her iPad is perfectly safe.
4. Click **Deploy**.
5. Google will ask you to **authorize**:
   - "Authorize access" → pick your Google account.
   - You'll see "Google hasn't verified this app." Click **Advanced** → **Go to [your project name] (unsafe)**. This warning exists because the script is private and unsigned; it's the standard hoop for any personal Apps Script.
   - Click **Allow** for the requested permissions (read/write spreadsheets).
6. Google gives you a **Web app URL** ending in `/exec`. **Copy it.** Looks like:

   ```
   https://script.google.com/macros/s/AKfycb…long…random…/exec
   ```

---

## Step 4 — Connect the app

1. Open `index.html` in any browser (double-click it, or host it — see Step 5).
2. The first-run wizard appears. Walk through:
   - Pick her current stage (Stage 0 is the right default if you're starting fresh).
   - A comfortable starting "minutes per round" for her pool walking.
   - Paste the **Web app URL** from Step 3 into the last field, tap **Test connection**. You should see a green check.
   - Tap **Finish**.
3. The app now syncs every entry automatically. The little dot at the top corner shows sync status: ● green = synced, ● amber = sending, ● gray = offline (entries are still saved locally and will sync next time).

If you ever need to change the URL or other settings: tap **Settings** (gear icon in the Today header) → **Google Sheet sync**.

---

## Step 5 — Get it on her iPad

You have three good options. Pick whichever is easiest for you.

### Option A — Host on GitHub Pages (free, gives you a URL she can bookmark)

1. Create a new GitHub repo (private is fine).
2. Add `index.html` to it.
3. Settings → Pages → Source: **Deploy from a branch**, branch: `main`, folder: `/ (root)`. Save.
4. Wait ~1 minute. GitHub gives you a URL like `https://<you>.github.io/<repo>/`.
5. On her iPad, open the URL in Safari → tap the **Share** button → **Add to Home Screen**. Now it's a tap-to-open app icon on her home screen.

### Option B — Run it locally over your home Wi-Fi (no internet needed for the app itself)

Useful if she's mostly home and you want zero hosting. The app still talks to Google Sheets over the internet, but the HTML itself is served from your Mac.

```bash
cd /Users/isabelthompson/CLAUDE/personal/ConditioningGuide
python3 -m http.server 8000
```

Then on her iPad (on the same Wi-Fi), open `http://<your-mac's-IP>:8000/index.html` in Safari → Add to Home Screen.

### Option C — AirDrop the file to her iPad

1. AirDrop `index.html` from your Mac to her iPad.
2. It opens in Files. Tap **Share → Open in Safari** (or tap it from Files → "View in browser").
3. Add to Home Screen.

   Caveat: the app icon will reopen the local copy. To update later you'd AirDrop again.

---

## Step 6 — Updating the app later

When I (or you) edit `index.html` and want her copy to reflect the change:

- **GitHub Pages hosting (Option A):** just commit and push. The Pages URL serves the new file; her home-screen icon will load the update on next open. No need to redeploy the Apps Script.
- **Local server (Option B):** her iPad re-fetches from your Mac on next open. No deploy needed.
- **AirDrop (Option C):** re-AirDrop, re-add to home screen.

**You only need to redeploy the Apps Script if you change `Code.gs`.** And when you do:
- Open the Apps Script editor → **Deploy → Manage deployments** → click the pencil → **Version: New version** → **Deploy**.
- The URL stays the same. Don't make a "New deployment" — that creates a *new* URL and the app would have to be reconnected.

The schema auto-extends — when the app starts sending a new field (e.g., the `tookMeds` column), the script appends the column on first write. You don't have to touch the sheet or the script for new fields. Only if you actually change the action handlers does `Code.gs` need a redeploy.

---

## Troubleshooting

**"Sync failed" / amber dot won't go green.**
- Check the URL in Settings — it must end in `/exec`, not `/dev`.
- In the Apps Script editor, **Deploy → Manage deployments** → confirm a deployment exists, "Execute as" is **Me**, "Who has access" is **Anyone**.
- Open the `/exec` URL directly in a browser. You should see a JSON blob like `{"ok":true,"vitals":[...]}`. If you get an HTML error page, the deployment isn't right.

**"Authorization required" error in console.**
- You need to re-authorize. Open the Apps Script editor, run any function once (e.g., paste `function test(){doGet({})}` and hit Run), accept the permissions.

**Entries showing in the app but not in the sheet.**
- Almost always means the sync URL is wrong or unreachable. Entries are safe in the iPad's local storage; once you fix the URL and tap **Sync now** in Settings, the queue flushes.

**She accidentally deleted the sheet.**
- Open the sheet's revision history (**File → Version history**) and restore. Or just re-create the sheet, re-deploy a new Apps Script attached to it, paste the new URL. Her iPad data is still local — once you reconnect, the app re-syncs everything to the new sheet.

**Want a fresh start.**
- Delete every row in each tab (keep the header row). The app will keep its local copy; the next "Sync now" repopulates the sheet from local. Alternatively, use the app's **Settings → Export → JSON backup** before doing anything destructive.

---

## What gets saved where

Each tab is one entry type; columns are the entry's fields. `id` is a UUID the app generates so updates and deletes find the same row. The `Config` tab is plain `key, value` pairs (current stage, weekly plan JSON, doctor-provided ranges, etc.).

If you ever want to do a one-shot analysis in the sheet itself (pivot table of activity minutes by week, etc.), each tab is just normal tabular data — go for it. The app doesn't depend on column order or anything fancy; it reads by header name.
