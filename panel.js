// panel.js
import { db, auth } from "./firebase.js";
import { 
  collection, doc, setDoc, getDoc, onSnapshot, 
  query, where, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { 
  onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

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

// Глобальные переменные
let masterId = null;
let master = null;
let selectedDate = new Date().toISOString().split("T")[0];
let dateInput = null;

// Firebase references
let scheduleRef, servicesRef, notificationsRef, bookingsRef;
let unsubscribeBookings = null;
let unsubscribeNotifications = null;

// Данные
let schedule = {};
let services = { coloring: [], haircut: [], care: [] };
let notifications = [];
let allBookings = [];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

window.addEventListener("DOMContentLoaded", async () => {
  
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("Пользователь не авторизован");
      window.location.href = "master-login.html";
      return;
    }

    console.log("Авторизован:", user.email);

    // Определяем masterId по email
    masterId = getMasterIdByEmail(user.email);
    
    if (!masterId || !MASTERS[masterId]) {
      console.error("Мастер не найден для email:", user.email);
      alert("Мастер не найден");
      await signOut(auth);
      window.location.href = "master-login.html";
      return;
    }

    master = MASTERS[masterId];
    console.log("Мастер:", master);

    // Инициализируем Firebase ссылки
    scheduleRef = doc(db, "masters", masterId, "settings", "schedule");
    servicesRef = doc(db, "masters", masterId, "settings", "services");
    notificationsRef = collection(db, "masters", masterId, "notifications");
    bookingsRef = collection(db, "bookings");

    // Загружаем данные и инициализируем интерфейс
    await initPanel();
  });
});

// Получение masterId по email (синхронная, без запроса к Firestore)
function getMasterIdByEmail(email) {
  const emailMap = {
    "tatyana@test.com": "tatyana",
    "angelina@test.com": "angelina",
    "anastasia@test.com": "anastasia"
  };
  
  return emailMap[email] || null;
}

// ==================== ПАНЕЛЬ ====================

async function initPanel() {
  
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

  // Загружаем данные из Firebase
  await Promise.all([
    loadSchedule(),
    loadServices()
  ]);

  // Подписываемся на реальное время
  subscribeToBookings();
  subscribeToNotifications();

  // Рендерим интерфейс
  renderSchedule();
  renderServices();
  renderNotif();
  initTabs();
}

// ==================== РАСПИСАНИЕ ====================

async function loadSchedule() {
  try {
    const docSnap = await getDoc(scheduleRef);
    if (docSnap.exists()) {
      schedule = docSnap.data();
    } else {
      console.log("Расписание не найдено, создаем пустое");
      schedule = {};
    }
  } catch (error) {
    console.error("Ошибка загрузки расписания:", error);
    schedule = {};
  }
}

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
        <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #eee;">
          <div style="width:140px; font-weight:600;">${DAYS_RU[day]}</div>
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="checkbox" class="closed-check" data-day="${day}" ${schedule[day].closed ? "checked" : ""}>
            <span>Не рабочий день.</span>
          </label>
          <input type="time" data-day="${day}" data-type="start" value="${schedule[day].start}" style="padding:4px;">
          <span>—</span>
          <input type="time" data-day="${day}" data-type="end" value="${schedule[day].end}" style="padding:4px;">
        </div>
      `;
    }).join("")}
    <button id="saveSchedule">Сохранить</button>
  `;

  el.onclick = async (e) => {
    const target = e.target;
    if (!target) return;

    const day = target.dataset?.day;

    if (target.classList.contains("closed-check") && day) {
      schedule[day].closed = target.checked;
      if (schedule[day].closed) {
        schedule[day].start = "";
        schedule[day].end = "";
      }
      renderSchedule();
      return;
    }

    if (target.id === "saveSchedule") {
      el.querySelectorAll("input[data-type]").forEach(inp => {
        const d = inp.dataset.day;
        const t = inp.dataset.type;
        schedule[d][t] = inp.value;
      });

      try {
        await setDoc(scheduleRef, schedule);
        alert("Сохранено");
      } catch (error) {
        console.error("Ошибка сохранения расписания:", error);
        alert("Ошибка сохранения: " + error.message);
      }
    }
  };
}

// ==================== УСЛУГИ ====================

async function loadServices() {
  try {
    const docSnap = await getDoc(servicesRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      services = {
        coloring: Array.isArray(data?.coloring) ? data.coloring : [],
        haircut: Array.isArray(data?.haircut) ? data.haircut : [],
        care: Array.isArray(data?.care) ? data.care : []
      };
    } else {
      console.log("Услуги не найдены, создаем пустые");
    }
  } catch (error) {
    console.error("Ошибка загрузки услуг:", error);
  }
}

function renderServices() {
  const el = document.getElementById("servicesContainer");
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
      <input id="sName" placeholder="Название услуги" style="flex:1; min-width:150px;">
      <input id="sPrice" placeholder="Цена" type="number" style="width:120px;">
      <input id="sDuration" placeholder="Длительность (мин)" type="number" value="60" style="width:120px;">
      <select id="sCat" style="width:150px;">
        <option value="coloring">Окрашивание</option>
        <option value="haircut">Стрижка</option>
        <option value="care">Уход</option>
      </select>
      <button id="addService" style="padding:8px 16px;">Добавить</button>
    </div>

    <!-- Фильтр по категориям -->
    <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
      <button class="filter-btn active" data-filter="all" style="
        padding:8px 16px;
        border:1px solid #ddd;
        border-radius:8px;
        background:#f0f0f0;
        cursor:pointer;
        font-family:inherit;
        font-size:14px;
      ">Все услуги</button>
      <button class="filter-btn" data-filter="coloring" style="
        padding:8px 16px;
        border:1px solid #ddd;
        border-radius:8px;
        background:#fff;
        cursor:pointer;
        font-family:inherit;
        font-size:14px;
      ">👩🏻‍🦰 Окрашивание</button>
      <button class="filter-btn" data-filter="haircut" style="
        padding:8px 16px;
        border:1px solid #ddd;
        border-radius:8px;
        background:#fff;
        cursor:pointer;
        font-family:inherit;
        font-size:14px;
      ">💇🏻 Стрижка</button>
      <button class="filter-btn" data-filter="care" style="
        padding:8px 16px;
        border:1px solid #ddd;
        border-radius:8px;
        background:#fff;
        cursor:pointer;
        font-family:inherit;
        font-size:14px;
      ">💆🏻 Уход</button>
    </div>

    <!-- Контейнер для списка услуг -->
    <div id="servicesList"></div>
  `;

  // Функция рендера отфильтрованного списка
  function renderFilteredServices(filter = "all") {
    const listEl = document.getElementById("servicesList");
    if (!listEl) return;

    let html = "";

    Object.entries(services).forEach(([cat, arr]) => {
      // Пропускаем категории не по фильтру
      if (filter !== "all" && cat !== filter) return;
      
      if (!arr || arr.length === 0) {
        if (filter === "all") {
          html += `
            <div style="margin-bottom:20px;">
              <h4 style="margin:10px 0; color:#999;">${SERVICES_MAP[cat] || cat}</h4>
              <p style="opacity:0.4; font-size:13px; padding:10px;">Нет услуг</p>
            </div>
          `;
        }
        return;
      }

      html += `
        <div style="margin-bottom:20px;">
          <h4 style="margin:10px 0; color:#555;">${SERVICES_MAP[cat] || cat} (${arr.length})</h4>
          ${arr.map((s, i) => `
            <div style="display:flex; gap:10px; align-items:center; margin:5px 0;">
              <input value="${s.name || ''}" data-cat="${cat}" data-i="${i}" data-field="name" style="flex:1;">
              <input value="${s.price || ''}" data-cat="${cat}" data-i="${i}" data-field="price" type="number" style="width:100px;">
              <input value="${s.duration || 60}" data-cat="${cat}" data-i="${i}" data-field="duration" type="number" style="width:80px;" placeholder="Мин">
              <button class="update-service" data-cat="${cat}" data-i="${i}" style="padding:4px 8px; cursor:pointer;">💾</button>
              <button class="del-service" data-cat="${cat}" data-i="${i}" style="padding:4px 8px; cursor:pointer; color:red;">✕</button>
            </div>
          `).join("")}
        </div>
      `;
    });

    if (!html) {
      html = '<p style="opacity:0.6; text-align:center; padding:20px;">Нет услуг в этой категории</p>';
    }

    listEl.innerHTML = html;
  }

  // Инициализация фильтров
  const filterBtns = el.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Обновляем активную кнопку
      filterBtns.forEach(b => {
        b.style.background = "#fff";
        b.style.fontWeight = "normal";
        b.classList.remove("active");
      });
      btn.style.background = "#e5c96b";
      btn.style.fontWeight = "bold";
      btn.classList.add("active");

      // Фильтруем
      const filter = btn.dataset.filter;
      renderFilteredServices(filter);
    });
  });

  // Первый рендер — все услуги
  renderFilteredServices("all");

  // Обработчики кликов
  el.onclick = async (e) => {
    // Добавление услуги
  if (e.target.id === "addService") {
  const nameInput = document.getElementById("sName");
  const priceInput = document.getElementById("sPrice");
  const durationInput = document.getElementById("sDuration");
  const catSelect = document.getElementById("sCat");
  
  const name = nameInput.value.trim();
  const price = priceInput.value.trim();
  const duration = durationInput.value;
  const cat = catSelect.value;

  if (!name || !price) {
    alert("Заполните название и цену");
    return;
  }

  if (!services[cat]) services[cat] = [];

  services[cat].push({
    name,
    price,
    duration: Number(duration) || 60
  });

  await saveServices();
  
  // Очищаем инпуты после добавления
  nameInput.value = "";
  priceInput.value = "";
  durationInput.value = "60"; // возвращаем значение по умолчанию
  catSelect.value = "coloring"; // возвращаем первую категорию
  
  // Фокус на первый инпут для удобства
  nameInput.focus();
  
  // Определяем активный фильтр
  const activeFilter = el.querySelector(".filter-btn.active")?.dataset?.filter || "all";
  renderFilteredServices(activeFilter);
  return;
}

    // Обновление услуги
    if (e.target.classList.contains("update-service")) {
      const cat = e.target.dataset.cat;
      const i = parseInt(e.target.dataset.i);
      
      const nameInput = el.querySelector(`input[data-cat="${cat}"][data-i="${i}"][data-field="name"]`);
      const priceInput = el.querySelector(`input[data-cat="${cat}"][data-i="${i}"][data-field="price"]`);
      const durationInput = el.querySelector(`input[data-cat="${cat}"][data-i="${i}"][data-field="duration"]`);

      if (nameInput && priceInput) {
        services[cat][i] = {
          name: nameInput.value.trim(),
          price: priceInput.value.trim(),
          duration: Number(durationInput?.value) || 60
        };

        await saveServices();
        alert("Услуга обновлена");
      }
      return;
    }

    // Удаление услуги
    const btn = e.target.closest(".del-service");
    if (btn) {
      const cat = btn.dataset.cat;
      const i = parseInt(btn.dataset.i);

      if (confirm("Удалить услугу?")) {
        services[cat].splice(i, 1);
        await saveServices();
        
        // Определяем активный фильтр
        const activeFilter = el.querySelector(".filter-btn.active")?.dataset?.filter || "all";
        renderFilteredServices(activeFilter);
      }
    }
  };
}

async function saveServices() {
  try {
    await setDoc(servicesRef, services);
  } catch (error) {
    console.error("Ошибка сохранения услуг:", error);
    alert("Ошибка сохранения: " + error.message);
  }
}

// ==================== БРОНИРОВАНИЯ ====================

function subscribeToBookings() {
  if (unsubscribeBookings) unsubscribeBookings();

  // Запрос без orderBy (чтобы не требовался составной индекс)
  const q = query(
    bookingsRef, 
    where("masterId", "==", masterId)
  );
  
  unsubscribeBookings = onSnapshot(q, (snapshot) => {
    allBookings = [];
    snapshot.forEach((doc) => {
      allBookings.push({ id: doc.id, ...doc.data() });
    });
    
    // Сортируем на клиенте
    allBookings.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      return dateA.localeCompare(dateB) || (a.time || "").localeCompare(b.time || "");
    });
    
    renderBookings();
    renderNextBookings();
  }, (error) => {
    console.error("Ошибка подписки на бронирования:", error);
    allBookings = [];
    renderBookings();
    renderNextBookings();
  });
}

function renderBookings() {
  const body = document.getElementById("bookingsBody");
  if (!body) return;

  const filtered = allBookings
    .filter(b => b.date === selectedDate)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  body.innerHTML = filtered.length
    ? filtered.map(b => {
        const baseService = SERVICES_MAP[b.serviceId] || b.serviceId || "Услуга удалена";
        const full = b.subservice ? `${baseService} (${b.subservice})` : baseService;

        return `
          <tr>
            <td>${b.time || "-"}</td>
            <td>${b.client?.name || "-"}</td>
            <td>${full}</td>
            <td>${b.client?.phone || "-"}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4">Нет записей на эту дату</td></tr>`;

  const count = document.getElementById("todayCount");
  if (count) count.textContent = filtered.length;
}

function renderNextBookings() {
  const el = document.getElementById("nextBookings");
  if (!el) return;

  // Эмодзи для услуг
  const SERVICE_EMOJI = {
    consultation: "✍🏻",
    coloring: "👩🏻‍🦰",
    haircut: "💇🏻",
    care: "💆🏻"
  };

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayBookings = allBookings
    .filter(b => b.date === today)
    .map(b => {
      const [h, m] = (b.time || "00:00").split(":").map(Number);
      return { ...b, minutes: (h || 0) * 60 + (m || 0) };
    })
    .filter(b => b.minutes >= currentMinutes)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 5);

  el.innerHTML = todayBookings.length
    ? todayBookings.map(b => {
        const emoji = SERVICE_EMOJI[b.serviceId] || "📋";
        const serviceName = SERVICES_MAP[b.serviceId] || "Услуга";
        
        return `
          <div class="next-item">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:24px;">${emoji}</span>
              <div>
                <div class="next-time">${formatDate(b.date)} • ${b.time}</div>
                <div class="next-name">${b.client?.name || "Без имени"}</div>
                <div class="next-service">
                  <b>${serviceName}${b.subservice ? " • " + b.subservice : ""}</b>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("")
    : `<p style="opacity:.6">На сегодня больше записей нет</p>`;
}

// ==================== УВЕДОМЛЕНИЯ ====================

function subscribeToNotifications() {
  if (unsubscribeNotifications) unsubscribeNotifications();

  const q = query(notificationsRef);
  
  unsubscribeNotifications = onSnapshot(q, (snapshot) => {
    notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    
    // Сортируем на клиенте
    notifications.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
    
    renderNotif();
  }, (error) => {
    console.error("Ошибка подписки на уведомления:", error);
    notifications = [];
    renderNotif();
  });
}

function renderNotif() {
  const dropdown = document.getElementById("notificationsContainer");
  const tab = document.getElementById("notifications");
  const badge = document.getElementById("notifCount");

  const unread = notifications.filter(n => !n.read).length;

  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread ? "inline-block" : "none";
  }

  if (dropdown) {
    const last = notifications.slice(0, 3);
    dropdown.innerHTML = last.length
      ? last.map(n => `
        <div class="notif-item ${n.read ? "read" : ""}">
          <div>🔔 ${n.text}</div>
          <small>${n.time || ""}</small>
          <button class="notif-more" data-id="${n.id}">Подробнее</button>
        </div>
      `).join("")
      : "<p>Нет уведомлений</p>";
  }

  if (tab) {
    tab.innerHTML = notifications.length
      ? notifications.map(n => {
          const booking = allBookings.find(b => b.id === n.bookingId);
          
          return `
            <div class="notif-full ${n.read ? "read" : ""}">
              <h4>🔔 ${n.text}</h4>
              <div>${n.time || ""}</div>
              ${booking ? `
                <div class="notif-details">
                  <div><b>Услуга:</b> ${SERVICES_MAP[booking.serviceId] || booking.serviceId || "-"}</div>
                  <div><b>Подуслуга:</b> ${booking.subservice || "-"}</div>
                  <div><b>Дата:</b> ${formatDate(booking.date)}</div>
                  <div><b>Время:</b> ${booking.time || "-"}</div>
                  <div><b>Клиент:</b> ${booking.client?.name || "-"}</div>
                  <div><b>Телефон:</b> ${booking.client?.phone || "-"}</div>
                </div>
              ` : '<p>Бронирование не найдено</p>'}
            </div>
          `;
        }).join("")
      : "<p>Нет уведомлений</p>";
  }
}

async function markNotificationAsRead(notificationId) {
  try {
    const notifRef = doc(db, "masters", masterId, "notifications", notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error("Ошибка обновления уведомления:", error);
  }
}

// ==================== UI СОБЫТИЯ ====================

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

function setTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  const buttons = document.querySelectorAll(".side-btn");

  tabs.forEach(tab => tab.classList.remove("active"));
  buttons.forEach(btn => btn.classList.remove("active"));

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.add("active");

  const activeBtn = document.querySelector(`.side-btn[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

function openNotifPanel() {
  document.getElementById("notifPanel")?.classList.add("open");
}

function closeNotifPanel() {
  document.getElementById("notifPanel")?.classList.remove("open");
}

// ==================== ОБРАБОТЧИКИ ====================

document.getElementById("openNotifBtn")?.addEventListener("click", openNotifPanel);
document.getElementById("closeNotifPanel")?.addEventListener("click", closeNotifPanel);

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".notif-more");
  if (!btn) return;

  const notificationId = btn.dataset.id;
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    await markNotificationAsRead(notification.id);
  }

  closeNotifPanel();
  setTab("notifications");
});

document.getElementById("menuBtn")?.addEventListener("click", () => {
  document.getElementById("menuDropdown")?.classList.toggle("open");
});

document.getElementById("logoutBtnMenu")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "master-login.html";
  } catch (error) {
    console.error("Ошибка выхода:", error);
  }
});

document.addEventListener("click", (e) => {
  const menu = document.getElementById("menuDropdown");
  const menuBtn = document.getElementById("menuBtn");

  if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove("open");
  }

  const notifPanel = document.getElementById("notifPanel");
  const openNotifBtn = document.getElementById("openNotifBtn");

  if (notifPanel && openNotifBtn && !notifPanel.contains(e.target) && !openNotifBtn.contains(e.target)) {
    notifPanel.classList.remove("open");
  }
});

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function formatDate(dateString) {
  if (!dateString) return "-";
  const [y, m, d] = dateString.split("-");
  return `${d}.${m}.${y}`;
}

window.addEventListener("beforeunload", () => {
  if (unsubscribeBookings) unsubscribeBookings();
  if (unsubscribeNotifications) unsubscribeNotifications();
});