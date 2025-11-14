let columnsAdded = false;
let lastClickedCheckbox = null;
let lastClickedRow = null;

function getHandlesFromPage() {
  const elements = Array.from(
    document.querySelectorAll('a[href*="/profile/"]')
  );
  const handles = elements.map((a) => a.textContent.trim());
  return [...new Set(handles)];
}

function addEmailColumn() {
  if (columnsAdded) return;

  // Find the standings table
  const table = document.querySelector("table.standings");
  if (!table) return;

  // Add header as second column
  const headerRow = table.querySelector("tr");
  const emailHeader = document.createElement("th");
  emailHeader.textContent = "Email";
  emailHeader.className = "top"; // Match Codeforces style
  const secondCell = headerRow.children[1];
  headerRow.insertBefore(emailHeader, secondCell);

  // Add email cells as second column
  const rows = table.querySelectorAll("tr");
  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header row
    const emailCell = document.createElement("td");
    emailCell.className = "email-cell";
    emailCell.textContent = "Loading...";
    const secondCell = row.children[1];
    row.insertBefore(emailCell, secondCell);
  });

  columnsAdded = true;
  // restore persisted checkbox state after creating columns
  loadSelections();
}
function addEmailAndCheckboxColumns() {
  if (columnsAdded) return;

  const table = document.querySelector("table.standings");
  if (!table) return;

  const headerRow = table.querySelector("tr");
  if (!headerRow) return;

  // Make the header row sticky
  headerRow.style.position = "sticky";
  headerRow.style.top = "0"; // stick to top edge
  headerRow.style.zIndex = "100";
  headerRow.style.backgroundColor = "#ffffff";
  headerRow.style.boxShadow = "0 5px 8px rgba(59, 119, 224, 1)";
  headerRow.style.backdropFilter = "blur(4px)"; // subtle glass effect
  headerRow.style.borderBottom = "1px solid #e0e0e0";
  headerRow.style.transition =
    "box-shadow 0.3s ease, background-color 0.3s ease";

  // Insert Email header as second column
  const emailHeader = document.createElement("th");
  emailHeader.textContent = "Email";
  emailHeader.className = "top";
  const refCell = headerRow.children[1] || null;
  headerRow.insertBefore(emailHeader, refCell);

  // Insert Checkbox header as third column (after email)
  const checkboxHeader = document.createElement("th");
  checkboxHeader.textContent = "";
  checkboxHeader.className = "top";
  const refCell2 = headerRow.children[2] || null;
  headerRow.insertBefore(checkboxHeader, refCell2);

  // Add cells for each body row
  const rows = table.querySelectorAll("tr");
  rows.forEach((row, index) => {
    if (index === 0) return; // skip header

    // Email cell (second column)
    const emailCell = document.createElement("td");
    emailCell.className = "email-cell";
    emailCell.textContent = "Loading...";
    const rowRef = row.children[1] || null;
    row.insertBefore(emailCell, rowRef);

    // Checkbox cell (third column)
    const checkboxCell = document.createElement("td");
    checkboxCell.className = "email-checkbox-cell";
    checkboxCell.style.textAlign = "center";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "email-select";
    // attach change handler to persist selection
    checkbox.addEventListener("change", () => {
      const handleEl = row.querySelector('a[href*="/profile/"]');
      const handle = handleEl ? handleEl.textContent.trim() : null;
      if (handle) {
        saveSelection(handle, checkbox.checked);
        saveLastClickedHandle(handle);
      }

      // Clear previous last-clicked row styling
      if (lastClickedRow && lastClickedRow !== row) {
        clearRowGlow(lastClickedRow);
      }

      // Apply glowing style to the clicked row
      lastClickedRow = row;
      applyRowGlow(row);
    });
    checkboxCell.appendChild(checkbox);
    const rowRef2 = row.children[2] || null;
    row.insertBefore(checkboxCell, rowRef2);
  });

  columnsAdded = true;
  // restore persisted checkbox state after creating columns
  loadSelections();
}

function getContestKey() {
  // Try to extract a stable contest identifier from the contest-name link
  const contestLink = document.querySelector(".contest-name a");
  if (contestLink && contestLink.getAttribute("href")) {
    // use the path part as key
    try {
      const url = new URL(contestLink.href, location.origin);
      return "cf_selected_" + url.pathname;
    } catch (e) {
      return "cf_selected_" + contestLink.getAttribute("href");
    }
  }
  return "cf_selected_" + location.pathname;
}

function applyRowGlow(row) {
  /**
   * Apply glow effect to a row using CSS class
   */
  if (!row) return;
  row.classList.add("row-glow");
}

function clearRowGlow(row) {
  /**
   * Remove glow styling from a row using CSS class
   */
  if (!row) return;
  row.classList.remove("row-glow");
}

function saveSelection(handle, checked) {
  const key = getContestKey();
  chrome.storage.local.get([key], (res) => {
    const map = res[key] || {};
    if (checked) map[handle] = true;
    else delete map[handle];
    const toSave = {};
    toSave[key] = map;
    chrome.storage.local.set(toSave);
  });
}

function saveLastClickedHandle(handle) {
  const key = getContestKey();
  const lastKey = key + "_lastClicked";
  chrome.storage.local.set({ [lastKey]: handle });
}

function loadSelections() {
  const key = getContestKey();
  const lastKey = key + "_lastClicked";
  chrome.storage.local.get([key, lastKey], (res) => {
    const map = res[key] || {};
    const lastClickedHandle = res[lastKey] || null;

    // apply to checkboxes
    const rows = document.querySelectorAll("table.standings tr");
    rows.forEach((row, index) => {
      if (index === 0) return;
      const handleEl = row.querySelector('a[href*="/profile/"]');
      if (!handleEl) return;
      const handle = handleEl.textContent.trim();
      const checkbox = row.querySelector(".email-select");
      if (checkbox) checkbox.checked = !!map[handle];

      // Restore last-clicked row with shadow and glow effect
      if (handle === lastClickedHandle) {
        lastClickedRow = row;
        applyRowGlow(row);
      }
    });
  });
}

function updateEmailsInTable(emailMap) {
  const table = document.querySelector("table.standings");
  if (!table) return;

  // Extract assignment name from the contest-name div
  let subject = "";
  const contestNameDiv = document.querySelector(".contest-name a");
  if (contestNameDiv) {
    // Extract up to the first ' -' or use the whole text
    const match = contestNameDiv.textContent.trim().match(/^(.*?)(\s*-|$)/);
    subject = match ? match[1].trim() : contestNameDiv.textContent.trim();
  }

  // Fixed Arabic message for the body
  const fixedBody =
    "السلام عليكم ازيك ي هندسة \nلو في حاجه مش واضحه في الفيد\u00A0باك او لو محتاجين اي سؤال ع ال whatsapp هيكون اسرع \n\n\n";

  const rows = table.querySelectorAll("tr");
  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header row

    const handleElement = row.querySelector('a[href*="/profile/"]');
    if (!handleElement) return;

    const handle = handleElement.textContent.trim();
    const emailCell = row.querySelector(".email-cell");
    if (!emailCell) return;

    const email = emailMap[handle.toLowerCase()];
    if (email) {
      const emailLink = document.createElement("a");
      // Compose Gmail URL with subject and body
      emailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        email
      )}&bcc=${encodeURIComponent(
        "route.cs.diploma@gmail.com"
      )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        fixedBody
      )}`;
      emailLink.textContent = email;
      emailLink.target = "_blank";
      emailCell.textContent = "";
      emailCell.appendChild(emailLink);
    } else {
      emailCell.textContent = "Not found";
      emailCell.classList.add("email-not-found");
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getHandles") {
    const handles = getHandlesFromPage();
    addEmailAndCheckboxColumns();
    sendResponse({ handles });
  } else if (msg.action === "updateEmails") {
    addEmailAndCheckboxColumns();
    updateEmailsInTable(msg.emailMap);
    sendResponse({ success: true });
  } else if (msg.action === "getSelectedEmails") {
    // return selected emails (array), subject and body
    const table = document.querySelector("table.standings");
    if (!table) {
      sendResponse({ emails: [], subject: "", body: "" });
      return;
    }
    const rows = table.querySelectorAll("tr");
    const emails = [];
    rows.forEach((row, index) => {
      if (index === 0) return;
      const checkbox = row.querySelector(".email-select");
      if (!checkbox || !checkbox.checked) return;
      const emailAnchor = row.querySelector(".email-cell a");
      if (emailAnchor) emails.push(emailAnchor.textContent.trim());
    });
    // include subject and body (same extraction as updateEmailsInTable)
    let subject = "";
    const contestNameDiv = document.querySelector(".contest-name a");
    if (contestNameDiv) {
      const match = contestNameDiv.textContent.trim().match(/^(.*?)(\s*-|$)/);
      subject = match ? match[1].trim() : contestNameDiv.textContent.trim();
    }
    const body = typeof fixedBody !== "undefined" ? fixedBody : "";
    sendResponse({ emails, subject, body });
  }
});
