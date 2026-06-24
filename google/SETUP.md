# Admin backend setup — Google Sheet as the database

The admin dashboard (`/#/admin` on the site) reads and writes a Google Sheet
through a **Google Apps Script Web App**. You do this once; after that the
dashboard, the Add button, the Move button, and the public brief form all sync
to the Sheet automatically — you never need to open the Sheet again.

## 1. Create the Sheet

1. Go to [sheets.new](https://sheets.new) and name it e.g. **TycheAS — Pipeline**.
2. You don't need to add tabs or headers by hand — the script builds them.

## 2. Add the script

1. In the Sheet: **Extensions ▸ Apps Script**.
2. Delete the placeholder `function myFunction() {}`.
3. Open `google/Code.gs` from this repo, copy **all** of it, and paste it in.
4. Near the top, change:
   ```js
   var API_TOKEN = 'CHANGE_ME_to_a_long_random_string';
   ```
   to a long random string (e.g. a password-manager-generated 32+ chars).
   **Remember this value** — it goes into the site config in step 5.
5. Save (⌘/Ctrl + S).

## 3. Create the tabs

1. In the Apps Script editor, pick the function **`setup`** in the toolbar dropdown.
2. Click **Run**. Approve the permission prompt (it's your own script on your own Sheet).
3. Switch back to the Sheet — you'll see two tabs: **Potential deals** and
   **Closed deals**, each with a bold header row.

## 4. Deploy as a Web App

1. In the Apps Script editor: **Deploy ▸ New deployment**.
2. Click the gear ▸ **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. **Deploy**, approve again, and **copy the Web app URL** (ends in `/exec`).

> Editing `Code.gs` later? Re-deploy with **Manage deployments ▸ (edit) ▸
> Version: New version ▸ Deploy**, or the URL keeps serving the old code.

## 5. Point the site at it

Open `src/admin/config.js` in this repo and fill in:

```js
export const APPS_SCRIPT_URL = 'https://script.google.com/.../exec'  // step 4
export const API_TOKEN       = 'the same long random string'          // step 2
export const ADMIN_PASSWORD  = 'pick a dashboard password'            // your choice
```

Save, rebuild/redeploy the site, and open `/#/admin`. Enter the dashboard
password and you're live.

## Notes

- **What syncs:** the brief form on the site → *Potential deals*. The dashboard's
  **Add prospect** → *Potential deals*. **Move to closed** → flips that prospect's
  status to `Completed` and appends a row to *Closed deals*.
- **Security:** the token + password keep out casual access from the public URL.
  This is intentionally lightweight, not bank-grade — fine for an internal pipeline
  board. Don't commit real values to a public repo.
- **Columns** (managed by the script, don't rename):
  - *Potential deals*: Client Name · Client ID · Industry · Interest in Package ·
    Need (prototype) · Receive/Due Date · Status
  - *Closed deals*: Client Name · Client ID · Industry · Package Bought ·
    Duration · Closer · Activation Date · End Date
