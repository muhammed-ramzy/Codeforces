let columnsAdded = false;

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
}
function addEmailAndCheckboxColumns() {
  if (columnsAdded) return;

  const table = document.querySelector("table.standings");
  if (!table) return;

  const headerRow = table.querySelector("tr");
  if (!headerRow) return;

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
    checkboxCell.appendChild(checkbox);
    const rowRef2 = row.children[2] || null;
    row.insertBefore(checkboxCell, rowRef2);
  });

  columnsAdded = true;
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
      emailLink.target = "_blank"; // Open in new tab
      emailLink.style.textDecoration = "none";
      emailLink.style.color = "#4285f4"; // Google blue color
      emailLink.onmouseover = () => {
        emailLink.style.textDecoration = "underline";
      };
      emailLink.onmouseout = () => {
        emailLink.style.textDecoration = "none";
      };
      emailCell.textContent = ""; // Clear the cell
      emailCell.appendChild(emailLink);
    } else {
      emailCell.textContent = "Not found";
      emailCell.style.color = "#999";
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
  }
});
