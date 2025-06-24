function fetchFromServerAndSync() {
  fetch("https://jsonplaceholder.typicode.com/posts?_limit=5")
    .then(response => response.json())
    .then(serverQuotes => {
      const formattedQuotes = serverQuotes.map(post => ({
        text: post.title,
        category: "Server"
      }));

      const localSnapshot = localStorage.getItem("quotes");
      const localQuotes = localSnapshot ? JSON.parse(localSnapshot) : [];
      
      // Basic conflict resolution: Replace local with server
      const conflictDetected = JSON.stringify(localQuotes.slice(0, 5)) !== JSON.stringify(formattedQuotes);
      if (conflictDetected) {
        const merged = [...formattedQuotes, ...localQuotes.slice(5)];
        quotes = merged;
        saveQuotes();
        populateCategories();
        notifyUser("Quotes synced with server. Server data took precedence.");
      }
    })
    .catch(err => {
      console.error("Failed to fetch server data:", err);
      notifyUser("Server sync failed. Working with local data.");
    });
}
let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");

function loadQuotes() {
  const saved = localStorage.getItem('quotes');
  quotes = saved ? JSON.parse(saved) : [
    { text: "Believe you can and you're halfway there.", category: "Motivation" },
    { text: "Do not be afraid to give up the good for the great.", category: "Success" },
    { text: "Act justly, love mercy, walk humbly with your God.", category: "Faith" }
  ];
  saveQuotes();
}

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Save selected filter to local storage
function saveFilterPreference(selected) {
  localStorage.setItem('lastFilter', selected);
}

// Load saved filter preference
function loadFilterPreference() {
  return localStorage.getItem('lastFilter') || 'all';
}

function notifyUser(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style = `
    background: #e0ffe0;
    color: #333;
    padding: 10px;
    margin-top: 10px;
    border-left: 5px solid green;
  `;
  document.body.prepend(notification);

  setTimeout(() => notification.remove(), 5000);
}

// Periodic sync every 60 seconds
setInterval(fetchFromServerAndSync, 60000);

// Trigger sync at launch
fetchFromServerAndSync();


// Populate both dropdowns
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  const addOptions = (select, selectedValue) => {
    select.innerHTML = `<option value="all">All</option>`;
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (cat === selectedValue) option.selected = true;
      select.appendChild(option);
    });
  };

  addOptions(categorySelect);
  addOptions(categoryFilter, loadFilterPreference());
}

// Show random quote
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }

  const quote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Show all quotes by filter
function filterQuotes() {
  const selected = categoryFilter.value;
  saveFilterPreference(selected);

  const filtered = selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }

  const list = filtered.map(q => `• "${q.text}" — ${q.category}`).join("<br>");
  quoteDisplay.innerHTML = list;
}

// Add new quote and refresh dropdowns
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Fill in both fields.");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added!");
}

// Export JSON
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error();

      imported.forEach(q => {
        if (q.text && q.category) quotes.push(q);
      });

      saveQuotes();
      populateCategories();
      alert("Quotes imported!");
    } catch {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Initialize
loadQuotes();
populateCategories();
newQuoteButton.addEventListener("click", showRandomQuote);

// Show last quote or filtered list on load
const last = sessionStorage.getItem("lastQuote");
const lastFilter = loadFilterPreference();

if (last) {
  const q = JSON.parse(last);
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
} else {
  categoryFilter.value = lastFilter;
  filterQuotes();
}
