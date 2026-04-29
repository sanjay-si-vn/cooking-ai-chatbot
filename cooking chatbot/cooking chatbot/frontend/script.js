const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("prompt");
const messagesDiv = document.getElementById("messages");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

function formatBotResponse(text) {
  // Replace **bold** with <b>bold</b>
  text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Try to split into sections by keywords
  let ingredients = [];
  let instructions = [];
  let other = [];
  let currentSection = "";

  // Normalize and split by lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);

  // Find section indices
  let ingIdx = lines.findIndex(line => /ingredient/i.test(line));
  let instrIdx = lines.findIndex(line => /instruction|method|process|steps/i.test(line));

  if (ingIdx !== -1 && instrIdx !== -1) {
    ingredients = lines.slice(ingIdx + 1, instrIdx);
    instructions = lines.slice(instrIdx + 1);
    other = lines.slice(0, ingIdx);
  } else if (ingIdx !== -1) {
    ingredients = lines.slice(ingIdx + 1);
    other = lines.slice(0, ingIdx);
  } else if (instrIdx !== -1) {
    instructions = lines.slice(instrIdx + 1);
    other = lines.slice(0, instrIdx);
  } else {
    // Fallback: try to split by numbers/dashes
    ingredients = lines.filter(line => /^(-|\*)\s/.test(line));
    instructions = lines.filter(line => /^\d+\./.test(line));
    if (!ingredients.length && !instructions.length) {
      // Fallback: treat all as instructions
      instructions = lines;
    }
  }

  let html = "";
  if (other.length) {
    html += `<p>${other.join(" ")}</p>`;
  }
  if (ingredients.length) {
    html += `<div><strong>Ingredients:</strong><ul>${ingredients.map(line => `<li>${line.replace(/^(-|\*)\s*/, "")}</li>`).join("")}</ul></div>`;
  }
  if (instructions.length) {
    html += `<div><strong>Instructions:</strong><ol>${instructions.map(line => `<li>${line.replace(/^\d+\.\s*/, "")}</li>`).join("")}</ol></div>`;
  }
  return html || `<p>${text}</p>`;
}

function addMessage(content, sender, save = true) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  if (sender === "bot") {
    msgDiv.innerHTML = formatBotResponse(content);
  } else {
    msgDiv.textContent = content;
  }
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Save message to localStorage
  if (save) {
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    chatHistory.push({ content, sender });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }
}

function loadChatHistory() {
  let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  chatHistory.forEach(msg => addMessage(msg.content, msg.sender, false));
}

window.onload = loadChatHistory;

generateBtn.onclick = async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user");
  promptInput.value = "";
  addMessage("Generating...", "bot");

  try {
    const response = await fetch("http://127.0.0.1:8080/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();
    // Remove the "Generating..." message
    const lastBotMsg = messagesDiv.querySelector(".message.bot:last-child");
    if (lastBotMsg && lastBotMsg.textContent === "Generating...") {
      lastBotMsg.remove();
    }
    addMessage(data.response, "bot");
  } catch (err) {
    const lastBotMsg = messagesDiv.querySelector(".message.bot:last-child");
    if (lastBotMsg && lastBotMsg.textContent === "Generating...") {
      lastBotMsg.remove();
    }
    addMessage("Error: Could not generate recipe.", "bot");
  }
};

// Add this event listener for Enter key in textarea
promptInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generateBtn.click();
  }
});

function clearChatHistory() {
  localStorage.removeItem("chatHistory");
  messagesDiv.innerHTML = "";
}

newChatBtn.onclick = () => {
  clearChatHistory();
  promptInput.value = "";
};

clearChatBtn.onclick = () => {
  clearChatHistory();
};