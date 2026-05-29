// booking.js
import { db } from "./firebase.js";
import { 
  collection, addDoc, getDocs, query, where, getDoc, doc 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// SERVICES MAP (UI названия)
const SERVICES_MAP = {
  consultation: "Консультация",
  coloring: "Окрашивание",
  haircut: "Стрижка",
  care: "Уход"
};

const CONSULTATION = {
  id: "consultation",
  name: "Консультация",
  duration: 15
};

const MASTERS = {
  tatyana: { name: "Татьяна Агламутдинова" },
  angelina: { name: "Ангелина Гилязутдинова" },
  anastasia: { name: "Анастасия Буторина" }
};

// BOOKING STATE
const booking = {
  master: null,
  service: null,
  subservice: null,
  duration: null,
  date: null,
  time: null,
  client: { name: "", phone: "" }
};

// normalize
const norm = v => (v || "").toLowerCase().trim();

// ==================== ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE ====================

async function getMasterServices(masterId) {
  try {
    const servicesDoc = await getDoc(doc(db, "masters", masterId, "settings", "services"));
    if (servicesDoc.exists()) {
      const data = servicesDoc.data();
      return {
        coloring: Array.isArray(data?.coloring) ? data.coloring : [],
        haircut: Array.isArray(data?.haircut) ? data.haircut : [],
        care: Array.isArray(data?.care) ? data.care : []
      };
    }
  } catch (error) {
    console.error("Ошибка загрузки услуг мастера:", error);
  }
  
  return {
    coloring: [],
    haircut: [],
    care: []
  };
}

async function getMasterSchedule(masterId) {
  try {
    const scheduleDoc = await getDoc(doc(db, "masters", masterId, "settings", "schedule"));
    if (scheduleDoc.exists()) {
      return scheduleDoc.data();
    }
  } catch (error) {
    console.error("Ошибка загрузки расписания:", error);
  }
  return {};
}

async function getBookingsForDate(masterId, date) {
  try {
    const q = query(
      collection(db, "bookings"),
      where("masterId", "==", masterId),
      where("date", "==", date)
    );
    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    return bookings;
  } catch (error) {
    console.error("Ошибка загрузки бронирований:", error);
    return [];
  }
}

// ==================== DOM (ВАЖНО: только после загрузки) ====================
window.addEventListener("DOMContentLoaded", () => {

  const title = document.getElementById("booking-title");
  const subservicesContainer = document.getElementById("subservices");
  const dateInput = document.getElementById("dateInput");
  const timeContainer = document.getElementById("timeSlots");

  const serviceCards = document.querySelectorAll(".booking-service");
  const masterCards = document.querySelectorAll(".master-card");

  const params = new URLSearchParams(window.location.search);
  const urlMaster = params.get("master");

  if (urlMaster) {
    booking.master = urlMaster;
  }

  // ================= UI =================
  function syncUI() {

    if (title && booking.master && MASTERS[booking.master]) {
      title.textContent = `Онлайн запись — ${MASTERS[booking.master].name}`;
    }

    masterCards.forEach(card => {
      card.classList.toggle(
        "active",
        norm(card.dataset.master) === norm(booking.master)
      );
    });

    serviceCards.forEach(card => {
      card.classList.toggle(
        "active",
        norm(card.dataset.service) === norm(booking.service)
      );
    });

    document.querySelectorAll(".subservice-btn").forEach(btn => {
      btn.classList.toggle("active", btn.textContent === booking.subservice);
    });

    document.querySelectorAll(".time-btn").forEach(btn => {
      btn.classList.toggle("active", btn.textContent === booking.time);
    });
  }

  // ================= CLICK SERVICES =================
  serviceCards.forEach(card => {
    card.addEventListener("click", () => {

      booking.service = card.dataset.service;
      booking.subservice = null;
      booking.duration = null;
      booking.time = null;

      renderSubservices();
      syncUI();
    });
  });

  // ================= CLICK MASTER =================
  masterCards.forEach(card => {
    card.addEventListener("click", () => {

      booking.master = card.dataset.master;

      booking.service = null;
      booking.subservice = null;
      booking.duration = null;
      booking.time = null;

      renderSubservices();
      syncUI();
    });
  });

  // ================= SUBSERVICES =================
  async function renderSubservices() {

    if (!subservicesContainer) return;

    subservicesContainer.innerHTML = "";

    if (!booking.master || !booking.service) {
      subservicesContainer.innerHTML =
        "<p style='opacity:.6'>Сначала выберите мастера и услугу</p>";
      return;
    }

    if (booking.service === "consultation") {
      booking.subservice = null;
      booking.duration = CONSULTATION.duration;

      subservicesContainer.innerHTML =
        "<p style='opacity:.6'>Консультация не требует выбора</p>";

      generateTimeSlots();
      return;
    }

    // Загружаем услуги из Firebase
    subservicesContainer.innerHTML = "<p style='opacity:.6'>Загрузка услуг...</p>";
    
    const data = await getMasterServices(booking.master);
    const list = data?.[booking.service] || [];

    if (!list.length) {
      subservicesContainer.innerHTML =
        "<p style='opacity:.6'>Нет доступных услуг</p>";
      return;
    }

    subservicesContainer.innerHTML = "";

    list.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "subservice-btn";
      btn.textContent = item.name;

      if (booking.subservice === item.name) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", () => {

        booking.subservice = item.name;
        booking.duration = item.duration;
        booking.time = null;

        document.querySelectorAll(".subservice-btn").forEach(b =>
          b.classList.toggle("active", b.textContent === booking.subservice)
        );

        generateTimeSlots();
        syncUI();
      });

      subservicesContainer.appendChild(btn);
    });
  }

  // ================= DATE =================
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;

    dateInput.addEventListener("input", async (e) => {
      booking.date = e.target.value;
      booking.time = null;
      await generateTimeSlots();
    });
  }

  // ================= TIME =================
async function generateTimeSlots() {

    if (!timeContainer) return;

    timeContainer.innerHTML = "";

    if (!booking.master || !booking.date || !booking.service || !booking.duration) {
      timeContainer.innerHTML =
        "<p style='opacity:.6'>Выберите услугу и дату</p>";
      return;
    }

    // Загружаем расписание и бронирования из Firebase
    timeContainer.innerHTML = "<p style='opacity:.6'>Загрузка расписания...</p>";

    const [schedule, busy] = await Promise.all([
      getMasterSchedule(booking.master),
      getBookingsForDate(booking.master, booking.date)
    ]);

    const date = new Date(booking.date);
    const dayKey = ["sun","mon","tue","wed","thu","fri","sat"][date.getDay()];

    const daySchedule = schedule[dayKey];

    if (!daySchedule || daySchedule.closed || !daySchedule.start || !daySchedule.end) {
      timeContainer.innerHTML =
        "<p style='opacity:.6'>Мастер не работает в этот день</p>";
      return;
    }

    const [sh, sm] = daySchedule.start.split(":").map(Number);
    const [eh, em] = daySchedule.end.split(":").map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    const now = new Date();
    const isToday = booking.date === now.toISOString().split("T")[0];

    timeContainer.innerHTML = "";

    // Динамический шаг: минимум 15 минут или длительность услуги
    const step = Math.min(30, booking.duration);

    for (let t = start; t + booking.duration <= end; t += step) {

      if (isToday && t <= now.getHours() * 60 + now.getMinutes()) continue;

      const conflict = busy.some(b => {
        const [bh, bm] = (b.time || "00:00").split(":").map(Number);
        const s = (bh || 0) * 60 + (bm || 0);
        const e = s + (b.duration || 60);
        return t < e && t + booking.duration > s;
      });

      if (conflict) continue;

      const formatted =
        `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;

      const btn = document.createElement("button");
      btn.className = "time-btn";
      btn.textContent = formatted;

      btn.addEventListener("click", () => {

        booking.time = formatted;

        document.querySelectorAll(".time-btn").forEach(b =>
          b.classList.toggle("active", b.textContent === booking.time)
        );

        syncUI();
      });

      timeContainer.appendChild(btn);
    }

    if (!timeContainer.innerHTML.trim()) {
      timeContainer.innerHTML = "<p style='opacity:.6'>Нет свободных окон</p>";
    }
  }
  // ================= SUBMIT =================
  document.querySelector(".submit-btn")?.addEventListener("click", async () => {

    const name = document.querySelector('input[type="text"]')?.value?.trim();
    const phone = document.querySelector('input[type="tel"]')?.value?.trim();

    if (!booking.service || !booking.master || !booking.date || !booking.time || !name || !phone) {
      alert("Заполните все поля");
      return;
    }

    const newBooking = {
      masterId: booking.master,
      serviceId: booking.service,
      subservice: booking.subservice || null,
      date: booking.date,
      time: booking.time,
      duration: booking.duration || 60,
      client: { name, phone },
      status: "new",
      createdAt: new Date().toISOString()
    };

    try {
      // Сохраняем бронирование в Firebase
      const bookingRef = await addDoc(collection(db, "bookings"), newBooking);
      
      // Создаем уведомление для мастера
      const notificationData = {
        text: `Новая запись: ${SERVICES_MAP[newBooking.serviceId] || newBooking.serviceId}`,
        time: new Date().toLocaleString("ru-RU"),
        bookingId: bookingRef.id,
        read: false,
        createdAt: new Date().toISOString()
      };

      await addDoc(
        collection(db, "masters", newBooking.masterId, "notifications"),
        notificationData
      );

      showBookingSuccess(newBooking);

      // Очищаем форму
      Object.assign(booking, {
        master: urlMaster || null,
        service: null,
        subservice: null,
        duration: null,
        date: null,
        time: null
      });

      if (dateInput) dateInput.value = "";
      const nameInput = document.querySelector('input[type="text"]');
      const phoneInput = document.querySelector('input[type="tel"]');
      if (nameInput) nameInput.value = "";
      if (phoneInput) phoneInput.value = "";

      await renderSubservices();
      await generateTimeSlots();
      syncUI();

    } catch (error) {
      console.error("Ошибка сохранения бронирования:", error);
      alert("Ошибка при создании записи. Попробуйте еще раз.");
    }
  });

  // ================= MODAL =================
  function showBookingSuccess(b) {

    const serviceName = SERVICES_MAP[b.serviceId] || b.serviceId;

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    modal.innerHTML = `
      <div style="background:white;padding:30px;border-radius:16px;text-align:center;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <h3 style="margin:0 0 15px;color:#333;">✅ Запись подтверждена!</h3>
        <p style="line-height:1.6;color:#555;">
          <b>Вы записаны к мастеру ${MASTERS?.[b.masterId]?.name || ""}</b><br><br>
          Услуга: <b>${serviceName}</b><br>
          ${b.subservice ? `(${b.subservice})<br>` : ""}
          <br>
          Дата: <b>${b.date}</b><br>
          Время: <b>${b.time}</b>
        </p>
        <button id="closePopup" style="
          margin-top:20px;
          padding:12px 30px;
          background:#e5c96b;
          border:none;
          border-radius:10px;
          font-size:16px;
          cursor:pointer;
          font-family:inherit;
        ">OK</button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#closePopup").onclick = () => modal.remove();
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // init render
  renderSubservices();
});