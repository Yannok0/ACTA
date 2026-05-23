const SERVICES_MAP = {
  consultation: { name: "Консультация" },
  coloring: { name: "Окрашивание" },
  haircut: { name: "Стрижка" },
  care: { name: "Уход" }
};

// =========================
// INIT
// =========================

console.log("SCRIPT2 CLEAN");

const page = document.body.dataset.page;
const params = new URLSearchParams(window.location.search);
const masterId = params.get("master");

// =========================
// CONSTANTS (LOGIN НЕ ТРОГАЕМ)
// =========================

const USERS = {
  tatyana: "architec.color1",
  angelina: "architec.color1",
  anastasia: "architec.color1"
};

const MASTERS = {
  tatyana: { name: "Татьяна Агламутдинова", avatar: "img/tatyana.jpg" },
  angelina: { name: "Ангелина Гилязутдинова", avatar: "img/angelina.jpg" },
  anastasia: { name: "Анастасия Буторина", avatar: "img/anastasia.jpg" }
};

// =========================
// STORAGE
// =========================

const store = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || [],
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// =========================
// LOGIN (НЕ МЕНЯЛ)
// =========================

if (page === "login") {
  const form = document.getElementById("loginForm");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const login = document.getElementById("login").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (USERS[login] === pass) {
      window.location.href = `master-panel.html?master=${login}`;
    } else {
      document.getElementById("error").textContent =
        "Неверный логин или пароль";
    }
  });

  const toggle = document.getElementById("togglePassword");
  const input = document.getElementById("password");

  toggle?.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    toggle.textContent = hidden ? "⌣" : "👁";
  });
}

// =========================
// PANEL INIT
// =========================

if (page === "panel") {

  if (!masterId || !MASTERS[masterId]) {
    alert("Мастер не найден");
  }

  const master = MASTERS[masterId];

  // header
  const nameEl = document.getElementById("masterName");
  if (nameEl) nameEl.textContent = master.name;

  const nameTop = document.getElementById("masterNameTop");
  if (nameTop) nameTop.textContent = master.name;

  const avatar = document.getElementById("masterAvatar");
  if (avatar) avatar.src = master.avatar;

  // logout (главная кнопка)
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    window.location.href = "master-login.html";
  });

  // =========================
  // TABS
  // =========================

  const tabs = document.querySelectorAll(".tab");
  const buttons = document.querySelectorAll(".side-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      tabs.forEach(t =>
        t.classList.toggle("active", t.id === btn.dataset.tab)
      );
    });
  });

  // =========================
  // BOOKINGS
  // =========================

  function renderBookings() {
    const body = document.getElementById("bookingsBody");
    if (!body) return;

    const all = store.get("bookings")
      .filter(b => b.masterId === masterId)
      .sort((a,b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time));

    body.innerHTML = all.map(b => `
      <tr>
        <td>${b.time}</td>
        <td>${b.client?.name}</td>
        <td>${SERVICES_MAP[b.serviceId]?.name || b.serviceId}</td>
        <td>${b.client?.phone}</td>
      </tr>
    `).join("");

    const count = document.getElementById("todayCount");
    if (count) count.textContent = all.length;
  }

  renderBookings();

  // =========================
  // SCHEDULE (FIXED UI)
  // =========================

  let schedule = store.get(`schedule_${masterId}`) || {
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
  };

  function renderSchedule() {
    const el = document.getElementById("scheduleContainer");
    if (!el) return;

    const days = Object.keys(schedule);

    el.innerHTML = `
      <h3>Редактирование расписания</h3>
      ${days.map(d => `
        <div style="margin-bottom:10px">
          <strong>${d}</strong>
          <input data-day="${d}" placeholder="10:00, 12:00" 
            value="${schedule[d].join(", ")}"
            style="margin-left:10px;padding:6px">
        </div>
      `).join("")}

      <button id="saveSchedule" class="add-btn">Сохранить</button>
    `;

    document.getElementById("saveSchedule").onclick = () => {
      document.querySelectorAll("#scheduleContainer input").forEach(inp => {
        const day = inp.dataset.day;
        schedule[day] = inp.value
          .split(",")
          .map(t => t.trim())
          .filter(Boolean);
      });

      store.set(`schedule_${masterId}`, schedule);
      alert("Расписание сохранено");
    };
  }

  renderSchedule();

  // =========================
  // SERVICES (без изменений логики)
  // =========================

  let services = store.get(`services_${masterId}`) || [];

  function renderServices() {
    const el = document.getElementById("servicesContainer");
    if (!el) return;

    el.innerHTML = `
      <div class="service-form">
        <input id="sName" placeholder="Название">
        <input id="sPrice" placeholder="Цена">
        <button id="addService" class="gold-btn">Добавить</button>
      </div>

      ${services.map((s,i)=>`
        <div class="service-card">
          <input value="${s.name}" data-i="${i}" class="name">
          <input value="${s.price}" data-i="${i}" class="price">
          <button data-del="${i}">✕</button>
        </div>
      `).join("")}
    `;

    document.getElementById("addService").onclick = () => {
      services.push({
        name: sName.value,
        price: sPrice.value
      });

      store.set(`services_${masterId}`, services);
      renderServices();
    };

    document.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = () => {
        services.splice(btn.dataset.del, 1);
        store.set(`services_${masterId}`, services);
        renderServices();
      };
    });
  }

  renderServices();

  // =========================
  // NOTIFICATIONS (FIX)
  // =========================

  let notifications = store.get(`notif_${masterId}`) || [];

  function renderNotif() {
    const el = document.getElementById("notificationsContainer");
    const badge = document.getElementById("notifCount");

    const unread = notifications.filter(n => !n.read).length;

    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread ? "inline-block" : "none";
    }

    if (!el) return;

    el.innerHTML = `
      <h3>Уведомления</h3>

      ${notifications.length === 0 ? "<p>Пусто</p>" : ""}

      ${notifications.map((n,i)=>`
        <div style="margin-bottom:10px">
          <p>${n.text}</p>
          <small>${n.time}</small>
          <button data-i="${i}">✔</button>
        </div>
      `).join("")}
    `;

    document.querySelectorAll("[data-i]").forEach(btn => {
      btn.onclick = () => {
        notifications[btn.dataset.i].read = true;
        store.set(`notif_${masterId}`, notifications);
        renderNotif();
      };
    });
  }

  renderNotif();

  // MENU 
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menuDropdown");

if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => {
    menu.classList.toggle("open");
  });
}
}

document.getElementById("logoutBtnMenu").addEventListener("click", () => {

  localStorage.removeItem("master");

  window.location.href = "master-login.html";

});