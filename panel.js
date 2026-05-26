// INIT
const params = new URLSearchParams(window.location.search);
const masterId = params.get("master");

// CONSTANTS
const SERVICES_MAP = {
  consultation: "Консультация",
  coloring: "Окрашивание",
  haircut: "Стрижка",
  care: "Уход"
};

const MASTERS = {
  tatyana: { name: "Татьяна Агламутдинова", avatar: "img/tatyana.jpg" },
  angelina: { name: "Ангелина Гилязутдинова", avatar: "img/angelina.jpg" },
  anastasia: { name: "Анастасия Буторина", avatar: "img/anastasia.jpg" }
};

// STORAGE
const store = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// CHECK MASTER
if (!masterId || !MASTERS[masterId]) {
  alert("Мастер не найден");
  window.location.href = "master-login.html";
}

const master = MASTERS[masterId];

// STATE
let selectedDate = new Date().toISOString().split("T")[0];

let schedule = {};
function safeServices(data) {
  return {
    coloring: Array.isArray(data?.coloring) ? data.coloring : [],
    haircut: Array.isArray(data?.haircut) ? data.haircut : [],
    care: Array.isArray(data?.care) ? data.care : []
  };
}
let notifications = [];

let dateInput = null;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {

  dateInput = document.querySelector(".date-bar input");

  const nameEl = document.getElementById("masterName");
  if (nameEl) nameEl.textContent = master.name;

  const nameTop = document.getElementById("masterNameTop");
  if (nameTop) nameTop.textContent = master.name;

  const avatar = document.getElementById("masterAvatar");
  if (avatar) avatar.src = master.avatar;

  if (dateInput) {
    dateInput.value = selectedDate;

    dateInput.addEventListener("change", (e) => {
      selectedDate = e.target.value;
      renderBookings();
      renderNextBookings();
    });
  }

  schedule = store.get(`schedule_${masterId}`) || {};
  services = safeServices(store.get(`services_${masterId}`));
  notifications = store.get(`notif_${masterId}`) || [];

  renderBookings();
  renderNextBookings();
  renderSchedule();
  renderServices();
  renderNotif();
  initTabs();
});

// ================= BOOKINGS =================
function renderBookings() {

  const body = document.getElementById("bookingsBody");
  if (!body) return;

  const all = store.get("bookings") || [];

  const filtered = all
    .filter(b => b.masterId === masterId && b.date === selectedDate)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  body.innerHTML = filtered.length
    ? filtered.map(b => {

        const baseService =
          SERVICES_MAP[b.serviceId] || b.serviceId || "Услуга удалена";

        const full = b.subservice
          ? `${baseService} (${b.subservice})`
          : baseService;

        return `
          <tr>
            <td>${b.time}</td>
            <td>${b.client?.name || ""}</td>
            <td>${full}</td>
            <td>${b.client?.phone || ""}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4">Нет записей на эту дату</td></tr>`;

  const count = document.getElementById("todayCount");
  if (count) count.textContent = filtered.length;
}

// ================= NEXT =================
function renderNextBookings() {

  const el = document.getElementById("nextBookings");
  if (!el) return;

  const all = store.get("bookings") || [];

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayBookings = all
    .filter(b => b.masterId === masterId && b.date === today)
    .map(b => {
      const [h, m] = (b.time || "00:00").split(":").map(Number);
      return { ...b, minutes: h * 60 + m };
    })
    .filter(b => b.minutes >= currentMinutes)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 5);

  el.innerHTML = todayBookings.length
    ? todayBookings.map(b => `
        <div class="next-item">
          <div>${b.date} • ${b.time}</div>
          <div>${b.client?.name || "Без имени"}</div>
          <div>${SERVICES_MAP[b.serviceId] || "Услуга"}${b.subservice ? " • " + b.subservice : ""}</div>
        </div>
      `).join("")
    : `<p style="opacity:.6">На сегодня больше записей нет</p>`;
}

// SCHEDULE 
function renderSchedule() {

  const el = document.getElementById("scheduleContainer");
  if (!el) return;

  const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];

  const DAYS_RU = {
    mon: "Понедельник",
    tue: "Вторник",
    wed: "Среда",
    thu: "Четверг",
    fri: "Пятница",
    sat: "Суббота",
    sun: "Воскресенье"
  };

  el.innerHTML = `
    <h3>График работы</h3>

    ${DAYS.map(day => {

      if (!schedule[day]) {
        schedule[day] = { start: "", end: "", closed: false };
      }

      return `
        <div style="
    display:flex;
    align-items:center;
    gap:10px;
    padding:8px 0;
    border-bottom:1px solid #eee;
  ">

    <div style="width:140px; font-weight:600;">
      ${DAYS_RU[day]}
    </div>

    <label style="display:flex; align-items:center; gap:6px;">
      <input type="checkbox"
        class="closed-check"
        data-day="${day}"
        ${schedule[day].closed ? "checked" : ""}>
      <span>Не рабочий день.</span>
    </label>

    <input
  type="time"
  data-day="${day}"
  data-type="start"
  value="${schedule[day].start}"
  style="padding:4px;">

<span>—</span>

<input
  type="time"
  data-day="${day}"
  data-type="end"
  value="${schedule[day].end}"
  style="padding:4px;">

  </div>
      `;
    }).join("")}

    <button id="saveSchedule">Сохранить</button>
  `;

  el.onclick = (e) => {

    const target = e.target;

    if (!target) return;

    const day = target.dataset?.day;

    // checkbox click
    if (target.classList.contains("closed-check") && day) {

      schedule[day].closed = target.checked;

      if (schedule[day].closed) {
        schedule[day].start = "";
        schedule[day].end = "";
      }

      renderSchedule();
      return;
    }

    // save button
    if (target.id === "saveSchedule") {

      el.querySelectorAll("input[data-type]").forEach(inp => {
        const d = inp.dataset.day;
        const t = inp.dataset.type;
        schedule[d][t] = inp.value;
      });

      store.set(`schedule_${masterId}`, schedule);
      alert("Сохранено");
    }
  };
}

// ================= SERVICES =================
function renderServices() {

  const el = document.getElementById("servicesContainer");
  if (!el) return;

  el.innerHTML = `
    <input id="sName" placeholder="Название">
    <input id="sPrice" placeholder="Цена">
    <button id="addService">Добавить</button>

    ${Object.entries(services).map(([cat, arr]) =>
      arr.map((s, i) => `
        <div>
          <b>${SERVICES_MAP[cat] || cat}</b>
          <input value="${s.name}">
          <input value="${s.price}">
          <button class="del-service" data-cat="${cat}" data-i="${i}">✕</button>
        </div>
      `).join("")
    ).join("")}
  `;

  el.onclick = (e) => {

    if (e.target.id === "addService") {

      const name = document.getElementById("sName").value.trim();
      const price = document.getElementById("sPrice").value.trim();

      if (!name || !price) return;

      const cat = document.getElementById("sCat").value;

if (!services[cat]) services[cat] = [];

const durationInput = document.getElementById("sDuration");

services[cat].push({
  name,
  price,
  duration: durationInput?.value ? Number(durationInput.value) : 60
});

services[category].push({
  name,
  price,
  duration: Number(duration) || 60
});

      store.set(`services_${masterId}`, safeServices(services));
      renderServices();
    }

    const btn = e.target.closest(".del-service");
    if (btn) {

      const cat = btn.dataset.cat;
      const i = btn.dataset.i;

      services[cat].splice(i, 1);

      store.set(`services_${masterId}`, services);
      renderServices();
    }
  };
}

// ================= NOTIFICATIONS =================
function renderNotif() {

  const el = document.getElementById("notificationsContainer");
  const badge = document.getElementById("notifCount");

  const unread = notifications.filter(n => !n.read).length;

  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread ? "inline-block" : "none";
  }

  if (!el) return;

  el.innerHTML = notifications.length
    ? notifications.map((n, i) => `
        <div>
          <p>${n.text}</p>
          <small>${n.time}</small>
          <button data-i="${i}">✔</button>
        </div>
      `).join("")
    : "<p>Пусто</p>";

  el.onclick = (e) => {
    const btn = e.target.closest("[data-i]");
    if (!btn) return;

    notifications[btn.dataset.i].read = true;
    store.set(`notif_${masterId}`, notifications);
    renderNotif();
  };
}

// ================= MENU =================
document.getElementById("menuBtn")?.addEventListener("click", () => {
  document.getElementById("menuDropdown")?.classList.toggle("open");
});

document.getElementById("logoutBtnMenu")?.addEventListener("click", () => {
  localStorage.removeItem("master");
  window.location.href = "master-login.html";
});
function initTabs() {

  const buttons = document.querySelectorAll(".master-sidebar .side-btn");
  const tabs = document.querySelectorAll(".tab");

  if (!buttons.length || !tabs.length) return;

  buttons.forEach(btn => {

    btn.addEventListener("click", () => {

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.tab;

      tabs.forEach(tab => {
        tab.classList.toggle("active", tab.id === target);
      });

    });

  });
}