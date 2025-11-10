let emailColumnAdded = false;

function getHandlesFromPage() {
  const elements = Array.from(
    document.querySelectorAll('a[href*="/profile/"]')
  );
  const handles = elements.map((a) => a.textContent.trim());
  return [...new Set(handles)];
}

function addEmailColumn() {
  if (emailColumnAdded) return;

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

  emailColumnAdded = true;
}

function updateEmailsInTable(emailMap) {
  const table = document.querySelector("table.standings");
  if (!table) return;

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
      emailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        email
      )}&bcc=${encodeURIComponent("route.cs.diploma@gmail.com")}`;
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
    addEmailColumn(); // Add the column when fetching handles
    sendResponse({ handles });
  } else if (msg.action === "updateEmails") {
    updateEmailsInTable(msg.emailMap);
    sendResponse({ success: true });
  }
});
