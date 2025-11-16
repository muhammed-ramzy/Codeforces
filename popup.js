document.getElementById("getEmails").addEventListener("click", async () => {
  const button = document.getElementById("getEmails");
  const spinner = document.querySelector(".spinner");
  const resultsContainer = document.querySelector(".results-container");
  const foundEmails = document.getElementById("foundEmails");
  const notFoundEmails = document.getElementById("notFoundEmails");

  // Show loading state
  button.disabled = true;
  spinner.style.display = "block";
  resultsContainer.style.display = "none";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(
    tab.id,
    { action: "getHandles" },
    async (response) => {
      if (!response || !response.handles) {
        alert("Couldn't find any handles on this page.");
        button.disabled = false;
        spinner.style.display = "none";
        return;
      }

      const handles = response.handles.join(",");
      const SHEET_API_URL =
        "https://script.google.com/macros/s/AKfycbyEj0LBJ4P-3MbKW_eGbzKe4ddxV9r9zA1wH33fOcIvlAAGMD5N7QRtpO9A-otnvCE6/exec";

      try {
        const res = await fetch(`${SHEET_API_URL}?handles=${handles}`);
        const data = await res.json();

        // Create a map of handle to email
        const emailMap = data.reduce((map, d) => {
          map[d.handle.toLowerCase()] = d.email;
          return map;
        }, {});

        // Separate found and not found emails
        const found = [];
        const notFound = [];

        response.handles.forEach((handle) => {
          const email = emailMap[handle.toLowerCase()];
          if (email) {
            found.push(email);
          } else {
            notFound.push(handle);
          }
        });

        // Update UI
        foundEmails.value = found.join("\n");
        notFoundEmails.value = notFound.join("\n");
        resultsContainer.style.display = "block";

        // Update the emails in the page
        chrome.tabs.sendMessage(tab.id, {
          action: "updateEmails",
          emailMap: emailMap,
        });
        // Refresh emailSelected button state based on persisted selections
        chrome.tabs.sendMessage(
          tab.id,
          { action: "getSelectedEmails" },
          (resp) => {
            const btn = document.getElementById("emailSelected");
            if (resp && resp.emails && resp.emails.length > 0)
              btn.disabled = false;
            else btn.disabled = true;
          }
        );
      } catch (err) {
        alert("Error fetching emails: " + err.message);
      } finally {
        // Hide loading state
        button.disabled = false;
        spinner.style.display = "none";
      }
    }
  );
});

// Email selected button
document.getElementById("emailSelected").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(
    tab.id,
    { action: "getSelectedEmails" },
    (response) => {
      if (!response || !response.emails || response.emails.length === 0) {
        alert("No emails selected.");
        return;
      }

      // Always include route.cs.diploma@gmail.com in BCC
      const selectedBcc = response.emails.slice();
      const alwaysBcc = "route.cs.diploma@gmail.com";
      if (!selectedBcc.includes(alwaysBcc)) selectedBcc.push(alwaysBcc);

      const subject = response.subject || "";
      const body = response.body || "";

      // if multiple selected, send To: user's email (saved in storage)
      if (response.emails.length > 1) {
        chrome.storage.sync.get(["myEmail"], (res) => {
          const myEmail = res.myEmail;
          if (!myEmail) {
            alert(
              'Please set your email in the popup ("Your email") to send To yourself when multiple recipients are selected.'
            );
            return;
          }
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
            myEmail
          )}&bcc=${encodeURIComponent(
            selectedBcc.join(",")
          )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(
            body
          )}`;
          chrome.tabs.create({ url: gmailUrl });
        });
      } else {
        // single selected: open compose to that recipient, but still BCC the alwaysBcc
        const to = response.emails[0];
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
          to
        )}&bcc=${encodeURIComponent(
          selectedBcc.join(",")
        )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        chrome.tabs.create({ url: gmailUrl });
      }
    }
  );
});

// Initialize Email selected button state when popup opens
(async function initSelectedButton() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedEmails" }, (resp) => {
      const btn = document.getElementById("emailSelected");
      if (resp && resp.emails && resp.emails.length > 0) btn.disabled = false;
      else btn.disabled = true;
    });
  } catch (e) {
    // ignore
  }
})();

// load and save user's email for multi-send
document.getElementById("saveMyEmail").addEventListener("click", () => {
  const val = document.getElementById("myEmail").value.trim();
  if (!val) {
    chrome.storage.sync.remove(["myEmail"], () => {
      alert("Saved email cleared");
    });
    return;
  }
  chrome.storage.sync.set({ myEmail: val }, () => {
    alert("Your email saved");
  });
});

// populate myEmail input from storage
chrome.storage.sync.get(["myEmail"], (res) => {
  if (res && res.myEmail)
    document.getElementById("myEmail").value = res.myEmail;
});
