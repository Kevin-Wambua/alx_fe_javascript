async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });

    const data = await response.json();
    console.log("Quote posted to server:", data);
  } catch (error) {
    console.error("Failed to post quote to server:", error);
  }
}

let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");

// For filtering and random selection
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");

// Load from localStorage or fallback
function loadQuotes() {
  const saved = localStorage.getItem('quotes');
  quotes = saved ? JSON.parse(saved) : [
    { text: "Believe you can and you're halfway there.", category: "Motivation" },
    { text: "Do not be afraid to give up the good for the great.", category: "Success" },
    { text: "Act justly, love mercy, walk humbly with your God.", category: "Faith" }
  ];
  saveQuotes();
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Save selected filter to localStorage
function saveFilterPreference(selected) {
  localStorage.setItem('lastFilter', selected);
}

// Load saved filter
function loadFilterPreference() {
  return localStorage.getItem('lastFilter') || 'all';
}

// Populate dropdowns
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  const addOptions = (select, selectedValue) => {
    select.innerHTML = `<option value="all">All</option>`;
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (selectedValue && cat === selectedValue) option.selected = true;
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

// Filter quotes by category
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

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill in both fields.");
    return;
  }

 quotes.push({ text, category });
saveQuotes();
populateCategories();

// Post to server (simulate sync)
postQuoteToServer({ text, category });

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added!");
}

// Dynamically create add quote form
function createAddQuoteForm() {
  const formSection = document.createElement('div');
  formSection.className = 'form-section';

  const heading = document.createElement('h3');
  heading.textContent = 'Add a New Quote';

  const inputText = document.createElement('input');
  inputText.id = 'newQuoteText';
  inputText.type = 'text';
  inputText.placeholder = 'Enter a new quote';

  const inputCategory = document.createElement('input');
  inputCategory.id = 'newQuoteCategory';
  inputCategory.type = 'text';
  inputCategory.placeholder = 'Enter quote category';

  const button = document.createElement('button');
  button.textContent = 'Add Quote';
  button.onclick = addQuote;

  formSection.appendChild(heading);
  formSection.appendChild(inputText);
  formSection.appendChild(inputCategory);
  formSection.appendChild(button);

  document.body.appendChild(formSection);
}

// Notify user of sync or conflict
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

// Simulated fetch from mock server + conflict resolution
async function syncQuotes() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const serverQuotes = await response.json();

    const formatted = serverQuotes.map(post => ({
      text: post.title,
      category: "Server"
    }));

    const current = quotes.slice(0, 5);
    const conflict = JSON.stringify(current) !== JSON.stringify(formatted);

    if (conflict) {
      quotes = [...formatted, ...quotes.slice(5)];
      saveQuotes();
      populateCategories();
      notifyUser("Synced with server. Server data took priority.");
    }
  } catch (error) {
    console.error("Failed to sync with server:", error);
    notifyUser("Failed to sync with server.");
  }
}

// Export quotes to JSON file
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
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
      notifyUser("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Init
loadQuotes();
populateCategories();
createAddQuoteForm();
newQuoteButton.addEventListener("click", showRandomQuote);

// Show last viewed quote or filter
const last = sessionStorage.getItem("lastQuote");
if (last) {
  const q = JSON.parse(last);
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
} else {
  categoryFilter.value = loadFilterPreference();
  filterQuotes();
}

// Start periodic sync
setInterval(syncQuotes, 60000);
fetchQuotesFromServer(); // On page load
