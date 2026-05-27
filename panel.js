// обработка
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

// локалка память
const store = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// проверка мастера после логина
if (!masterId || !MASTERS[masterId]) {
  alert("Мастер не найден");
  window.location.href = "master-login.html";
}

const master = MASTERS[masterId];

// вывод записей
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

//обработка панели инфы
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
if (!notifications) notifications = [];

  renderBookings();
  renderNextBookings();
  renderSchedule();
  renderServices();
  renderNotif();
  initTabs();
});

// записи
function renderBookings() {

  const body = document.getElementById("bookingsBody");
  if (!body) return;

  const all = store.get("bookings") || [];

  const filtered = all
    .filter(b => b.masterId === masterId && b.date === selectedDate)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${formatDate(b.date)}T${b.time}`));

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

// ближайшие
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
          <div>${formatDate(b.date)} • ${b.time}</div>
          <div>${b.client?.name || "Без имени"}</div>
          <div><b>${SERVICES_MAP[b.serviceId] || "Услуга"}${b.subservice ? " • " + b.subservice : ""}</b</div>
        </div>
      `).join("")
    : `<p style="opacity:.6">На сегодня больше записей нет</p>`;
}

// расписание
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

// услуги
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

// уведомления
function renderNotif() {
  notifications = store.get(`notif_${masterId}`) || [];
  const dropdown = document.getElementById("notificationsContainer");
  const tab = document.getElementById("notifications");
  const badge = document.getElementById("notifCount");

  const unread = notifications.filter(n => !n.read).length;

  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread ? "inline-block" : "none";
  }

  // DROPDOWN (ТОЛЬКО СВОДКА) 
const last = notifications.slice(0, 3);

dropdown.innerHTML = last.length
  ? last.map(n => `
    <div class="notif-item ${n.read ? "read" : ""}">

      <div>🔔 ${n.text}</div>

      <small>${n.time}</small>

      <button class="notif-more" data-id="${n.bookingId}">
        Подробнее
      </button>

    </div>
  `).join("")
  : "<p>Нет уведомлений</p>";

  // настройка для TAB 
  if (tab) {

tab.innerHTML = notifications.length
  ? notifications.map(n => {

      const bookings = safeParse("bookings") || [];
      const b = bookings.find(x => x.id === n.bookingId) || {};

      return `
        <div class="notif-full ${n.read ? "read" : ""}">

          <h4>🔔 ${n.text}</h4>
          <div>${n.time}</div>

          <div class="notif-details">
            <div><b>Услуга:</b> ${SERVICES_MAP[b.serviceId] || b.serviceId || "-"}</div>
            <div><b>Подуслуга:</b> ${b.subservice || "-"}</div>
            <div><b>Дата:</b> ${formatDate(b.date)}</div>
            <div><b>Время:</b> ${b.time || "-"}</div>
            <div><b>Клиент:</b> ${b.client?.name || "-"}</div>
            <div><b>Телефон:</b> ${b.client?.phone || "-"}</div>
          </div>

        </div>
      `;
    }).join("")
  : "<p>Нет уведомлений</p>";
  }
}

// TAB SWITCH 
function setTab(tabId) {

  const tabs = document.querySelectorAll(".tab");
  const buttons = document.querySelectorAll(".side-btn");

  tabs.forEach(tab => {
    tab.classList.remove("active");
  });

  buttons.forEach(btn => {
    btn.classList.remove("active");
  });

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.add("active");
  }

  const activeBtn = document.querySelector(`.side-btn[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

//  PANEL 
function openNotifPanel() {
  document.getElementById("notifPanel")?.classList.add("open");
  renderNotif();
}

function closeNotifPanel() {
  document.getElementById("notifPanel")?.classList.remove("open");
}

//  EVENTS 
document.getElementById("openNotifBtn")?.addEventListener("click", () => {
  openNotifPanel();
});

document.getElementById("closeNotifPanel")?.addEventListener("click", () => {
  closeNotifPanel();
});


// "ПОДРОБНЕЕ" 
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".notif-more");
  if (!btn) return;

  const bookingId = Number(btn.dataset.id);

  let notificationsData = store.get(`notif_${masterId}`) || [];
  if (!Array.isArray(notificationsData)) return;

  notificationsData = notificationsData.map(n =>
    Number(n.bookingId) === bookingId
      ? { ...n, read: true }
      : n
  );

  store.set(`notif_${masterId}`, notificationsData);

  // синхронизация GLOBAL STATE
  notifications = notificationsData;

  renderNotif();
  closeNotifPanel();
  setTab("notifications");

  const bookings = safeParse("bookings") || [];
  const fullBooking = bookings.find(b => Number(b.id) === bookingId);

  console.log("BOOKING:", fullBooking);
});
function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function formatDate(dateString) {
  if (!dateString) return "-";

  const [y, m, d] = dateString.split("-");

  return `${d}.${m}.${y}`;
}

// бургер шапка
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
// закрытие дропдауна вне 
document.addEventListener("click", (e) => {
  //  MENU 
  const menu = document.getElementById("menuDropdown");
  const menuBtn = document.getElementById("menuBtn");

  if (menu && menuBtn) {
    const insideMenu = menu.contains(e.target) || menuBtn.contains(e.target);
    if (!insideMenu) menu.classList.remove("open");
  }

  //  NOTIF PANEL 
  const notifPanel = document.getElementById("notifPanel");
  const openNotifBtn = document.getElementById("openNotifBtn");

  if (notifPanel && openNotifBtn) {
    const insideNotif =
      notifPanel.contains(e.target) || openNotifBtn.contains(e.target);

    if (!insideNotif) {
      notifPanel.classList.remove("open");
    }
  }
});