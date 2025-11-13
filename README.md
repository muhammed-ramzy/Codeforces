# Codeforces Email Fetcher (Chrome Extension)

A small Chrome extension to extract Codeforces standings handles, fetch associated emails from a Google Apps Script-backed sheet, and show them in a popup and directly in the standings table. It adds an "Email" column and a checkbox column so you can select users. Clicking an email opens Gmail compose with pre-filled fields.

## Features

- Extract participant handles from a Codeforces standings page.
- Fetch emails for those handles from a configured Google Apps Script endpoint.
- Popup UI that shows found emails and handles without emails.
- Adds an `Email` column to the standings table (second column) with clickable Gmail compose links.
- Adds a checkbox column next to each email for selection.
- Gmail compose opens with BCC pre-filled to `route.cs.diploma@gmail.com` and (optionally) subject/body.
- Arabic (RTL) body support included (see notes).

## Project structure

- `manifest.json` — extension manifest (permissions, content scripts, etc.).
- `popup.html`, `popup.js` — UI shown when clicking the extension icon.
- `content.js` — content script injected into Codeforces pages. Adds columns, populates emails, and wires checkboxes.
- `background.js` — optional background script (if present).

> Current workspace root contains the files above. If you add files, keep the same manifest references.

---

## Installation (developer / local)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in top-right).
3. Click **Load unpacked** and choose the repository folder (the folder that contains `manifest.json`).
4. The extension icon will appear in the toolbar. Open a Codeforces standings page to test.

Note: As you edit files, refresh the extension on the extensions page or reload the active tab to see content script changes.

---

## Configuration

### Google Apps Script endpoint

The popup uses a Sheet/GAS web app to map handles -> emails. In `popup.js` set the `SHEET_API_URL` to your deployed Apps Script web app URL. Example:

```js
const SHEET_API_URL = "https://script.google.com/macros/s/AKfy.../exec";
```

The endpoint should accept a `handles` query parameter (comma-separated handles) and return JSON of shape:

```json
[
  { "handle": "alice", "email": "alice@example.com" },
  { "handle": "bob", "email": "bob@example.com" }
]
```

### Gmail compose parameters

The extension builds a Gmail compose URL of the form:

```
https://mail.google.com/mail/?view=cm&fs=1&to=<email>&bcc=route.cs.diploma@gmail.com&su=<subject>&body=<body>
```

- `to` is the clicked email.
- `bcc` is set to `route.cs.diploma@gmail.com` by default.
- `su` and `body` may be populated when available (subject extraction from `.contest-name a` and a fixed Arabic body are implemented in some versions).

Because compose is opened via URL, Gmail limits how much advanced formatting you can prefill. Plain-text and encoded unicode characters are supported.

---

## Usage

1. Open the Codeforces standings page for a contest/group.
2. Click the extension icon to open the popup.
3. Click **Fetch Emails**.
   - The extension will scan the page for handles, request the emails from the configured Apps Script, then populate the popup sections and the standings table.
4. In the standings, the `Email` column will show clickable emails. Click a link to open Gmail compose.
5. Use the checkbox next to each email to select users (checkboxes are local DOM inputs — no persistence).

---

## Troubleshooting & Common Issues

This section documents issues seen while developing and how to fix them.

- `Uncaught (in promise) TypeError: Cannot read properties of null (reading 'style')` — spinner is null

  - Cause: Popup script attempted to access `.spinner` before it existed in `popup.html`.
  - Fix: Ensure `popup.html` contains an element with class `spinner`. If you changed `popup.html`, add:
    ```html
    <div class="spinner"></div>
    ```
  - Also confirm `popup.js` queries the element after DOM is loaded (scripts are loaded at the end of `popup.html` in this project).

- `Uncaught ReferenceError: msg is not defined` in `content.js`

  - Cause: stray `if (msg.action...)` block outside of the message listener.
  - Fix: Ensure the only code referencing `msg` is inside the `chrome.runtime.onMessage.addListener((msg,...) => { ... })` callback. The repository version should already have this fixed.

- Gmail compose not showing RTL or incorrect direction

  - Cause: Gmail/browser may ignore embedding marks or display differently depending on settings.
  - Workarounds:
    - Prefix the body with Unicode Right-to-Left Embedding (U+202B) and end with Pop Directional Formatting (U+202C). The project may include this behavior in some versions.
    - If embedding is ignored, consider manual copy/paste or switch to composing from an email client that respects direction markers.

- Columns duplicated when clicking Fetch multiple times
  - Cause: earlier versions didn't guard against adding columns multiple times.
  - Fix: The content script uses a `columnsAdded` guard to avoid duplicates. If you still see duplicates, refresh the page and retry.

---

## Development notes

- Files to edit for behavior:

  - `popup.js` — controls the popup and calls the content script to get handles and push email updates.
  - `content.js` — injects columns into the standings table and updates rows when email data arrives.

- To debug content scripts, open Chrome DevTools for the page (right-click -> Inspect) and view the Console. Content script logs will appear there.
- To debug popup scripts, right-click the popup and choose "Inspect" while the popup is open.

---

## Next steps / Enhancements

Here are some suggested improvements you can implement:

- Add a toolbar in the popup with actions for selected checkboxes, e.g.:
  - "Email selected" — compose a single email with selected addresses in BCC.
  - "Open selected" — open individual compose tabs for each selected email.
  - "Copy selected" — copy selected emails to clipboard.
- Persist checkbox selection across page reloads using `chrome.storage.local`.
- Add user settings to configure `bcc` address, default subject template, or default body.
- Add unit tests for the Apps Script endpoint mapping and a small integration test harness.

---

## License

Choose a license for your project. No license is added by default in this repository.

---

If you'd like, I can:

- Add a small popup toolbar and implement "Email selected" (single compose with all selected in BCC).
- Add persistence for checkbox states.
- Create a backup of current `content.js` before making risky edits.

Tell me which of the above you'd like next and I'll implement it.
