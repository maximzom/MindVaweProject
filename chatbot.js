// ===== chatbot.js: МОЗОК (ЛОГІКА ТА API) =====
console.log("Chatbot logic loaded");

const MW_SESSION_KEY = "mw_session";
const MW_STATS_KEY = "mw_stats";

// !!! ВСТАВТЕ СЮДИ ВАШ НОВИЙ КЛЮЧ API !!!
// (Старий ключ краще видалити і створити новий, бо ви його засвітили)
const MW_GEMINI_API_KEY = "AIzaSyBOTVVC5GiQfQdJj97t2Z5NbKIiyrfTItc"; 

// Використовуємо -latest або -001, це часто виправляє помилку 404
const MW_GEMINI_MODEL = "gemini-2.5-flash"; 
const MW_GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MW_GEMINI_MODEL}:generateContent`;

// --- 1. Робота з сесією ---
window.mwLoadSession = function() {
  try {
    const raw = sessionStorage.getItem(MW_SESSION_KEY);
    if (!raw) return { history: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { history: [] };
  }
};

window.mwSaveSession = function(session) {
  sessionStorage.setItem(MW_SESSION_KEY, JSON.stringify(session));
};

// --- 2. Робота зі статистикою ---
window.mwUpdateStats = function(text, isBot = false) {
  let stats;
  try {
    stats = JSON.parse(localStorage.getItem(MW_STATS_KEY)) || { totalMessages: 0, userMessages: 0, botMessages: 0, categories: {} };
  } catch {
    stats = { totalMessages: 0, userMessages: 0, botMessages: 0, categories: {} };
  }

  stats.totalMessages += 1;
  if (isBot) {
    stats.botMessages += 1;
  } else {
    stats.userMessages += 1;
    const lower = text.toLowerCase();
    
    let cat = null;
    if (lower.includes("фокус") || lower.includes("концентрац")) cat = "Фокус";
    else if (lower.includes("сон") || lower.includes("заснути")) cat = "Сон";
    else if (lower.includes("перерва") || lower.includes("пауза")) cat = "Перерва";
    else if (lower.includes("тривог") || lower.includes("хвил")) cat = "Тривожність";
    else if (lower.includes("вигоран") || lower.includes("перевтом")) cat = "Перевтома";

    if (cat) {
      if (!stats.categories[cat]) stats.categories[cat] = 0;
      stats.categories[cat] += 1;
    }
  }
  mwSaveStats(stats);
};

function mwSaveStats(stats) {
  localStorage.setItem(MW_STATS_KEY, JSON.stringify(stats));
}

// --- 3. Запит до Gemini ---
window.mwAskGemini = async function(session) {
  const systemInstruction = {
    parts: [{
      text: "Ти — асистент MindWave. Допомагай з режимом дня. Відповідай українською. Використовуй списки."
    }]
  };

  const contents = session.history.map(item => ({
    role: item.role === "user" ? "user" : "model",
    parts: [{ text: item.text }]
  }));

  const payload = {
    system_instruction: systemInstruction,
    contents: contents
  };

  try {
    const response = await fetch(MW_GEMINI_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": MW_GEMINI_API_KEY
    },
    body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Логуємо деталі помилки, якщо вона сталася
        const errorText = await response.text();
        console.error("Gemini API Error Details:", response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Fetch error:", error);
    return "Вибач, я зараз не можу зв'язатися з сервером. Перевір консоль (F12) для деталей.";
  }
};