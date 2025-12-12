// ===== script.js: ІНТЕРФЕЙС (UI) =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("UI Script loaded");

  const toggleBtn = document.getElementById("chatbot-toggle");
  const chatWindow = document.getElementById("chatbot-window");
  const closeBtn = document.getElementById("chatbot-close");
  const messagesBox = document.getElementById("chatbot-messages");
  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");
  
  // Знаходимо кнопку "Почати з режиму фокусу" (вона є тільки на index.html)
  const startFocusBtn = document.getElementById("start-focus-btn");

  // Перевірка наявності основних елементів. 
  // Якщо немає кнопки toggle (наприклад, помилка в HTML), скрипт зупиниться.
  if (!toggleBtn || !chatWindow || !messagesBox || !form || !input) return;

  // 1. Завантаження сесії
  let session = window.mwLoadSession ? window.mwLoadSession() : { history: [] };

  // 2. Функція малювання
  function renderUI() {
    messagesBox.innerHTML = "";
    session.history.forEach(item => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("message");
      wrapper.classList.add(item.role === "user" ? "user" : "bot");

      const bubble = document.createElement("div");
      bubble.classList.add("message-bubble");
      bubble.textContent = item.text;

      wrapper.appendChild(bubble);
      messagesBox.appendChild(wrapper);
    });
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function addMsg(role, text) {
    session.history.push({ role, text, time: new Date().toISOString() });
    if (window.mwSaveSession) window.mwSaveSession(session);
    renderUI();
  }

  // === ПОДІЇ ===

  // Функція відкриття чату
  function openChat() {
    // ВИПРАВЛЕНО: Було "open", стало "active" (щоб відповідати style.css)
    chatWindow.classList.add("active"); 
    input.focus();
  }

  // Кнопка в кутку екрану
  toggleBtn.addEventListener("click", () => {
    // ВИПРАВЛЕНО: Було "open", стало "active"
    chatWindow.classList.toggle("active");
    if (chatWindow.classList.contains("active")) {
      input.focus();
    }
  });

  // Велика кнопка "Почати з режиму фокусу"
  if (startFocusBtn) {
    startFocusBtn.addEventListener("click", () => {
      openChat();
      // За бажанням: можна відправити автоматичне повідомлення
      // input.value = "Налаштуй мені фокус";
    });
  }

  // Кнопка закриття (хрестик)
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      // ВИПРАВЛЕНО: Було "open", стало "active"
      chatWindow.classList.remove("active");
    });
  }

  // Привітання
  if (session.history.length === 0) {
    addMsg("bot", "Привіт! Я асистент MindWave. Напиши, що налаштувати: фокус чи відпочинок?");
  } else {
    renderUI();
  }

  // Відправка форми
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMsg("user", text);
    if(window.mwUpdateStats) window.mwUpdateStats(text, false);
    input.value = "";

    try {
      if (window.mwAskGemini) {
        const reply = await window.mwAskGemini(session);
        addMsg("bot", reply);
        if(window.mwUpdateStats) window.mwUpdateStats(reply, true);
      } else {
        addMsg("bot", "Помилка: логіка бота не підключена.");
      }
    } catch (err) {
      console.error(err);
      addMsg("bot", "Вибач, помилка з'єднання.");
    }
  });
});