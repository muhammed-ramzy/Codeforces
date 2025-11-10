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
        "https://script.google.com/macros/s/AKfycbwrGx0MmpfGf9ukIbmhGV_LnxZV2hJl99GGIMC8t-FUfE8izEoKIR2HajZx45RT5i04/exec";

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
