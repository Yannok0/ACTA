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
const store = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// normalize
const norm = v => (v || "").toLowerCase().trim();

// safe parse
function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return [];
  }
}

function getMasterServices(masterId) {
  const saved = safeParse(`services_${masterId}`);
  if (saved && typeof saved === "object") return saved;

  return {
    coloring: [],
    haircut: [],
    care: []
  };
}

// DOM (ВАЖНО: только после загрузки)
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
  function renderSubservices() {

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

    const data = getMasterServices(booking.master);
    const list = data?.[booking.service] || [];

    if (!list.length) {
      subservicesContainer.innerHTML =
        "<p style='opacity:.6'>Нет доступных услуг</p>";
      return;
    }

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

    dateInput.addEventListener("input", e => {
      booking.date = e.target.value;
      booking.time = null;
      generateTimeSlots();
    });
  }

  // ================= TIME =================
  function generateTimeSlots() {

    if (!timeContainer) return;

    timeContainer.innerHTML = "";

    if (!booking.master || !booking.date || !booking.service || !booking.duration) {
      timeContainer.innerHTML =
        "<p style='opacity:.6'>Выберите услугу и дату</p>";
      return;
    }

    const schedule = safeParse(`schedule_${booking.master}`) || {};

    const date = new Date(booking.date);
    const dayKey = ["sun","mon","tue","wed","thu","fri","sat"][date.getDay()];

    const daySchedule = schedule[dayKey];

    if (!daySchedule || daySchedule.closed) {
      timeContainer.innerHTML =
        "<p style='opacity:.6'>Мастер не работает</p>";
      return;
    }

    const [sh, sm] = daySchedule.start.split(":").map(Number);
    const [eh, em] = daySchedule.end.split(":").map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    const bookings = safeParse("bookings") || [];

    const busy = bookings.filter(
      b => b.masterId === booking.master && b.date === booking.date
    );

    const now = new Date();
    const isToday = booking.date === now.toISOString().split("T")[0];

    for (let t = start; t + booking.duration <= end; t += 30) {

      if (isToday && t <= now.getHours() * 60 + now.getMinutes()) continue;

      const conflict = busy.some(b => {
        const [bh, bm] = b.time.split(":").map(Number);
        const s = bh * 60 + bm;
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
document.querySelector(".submit-btn")?.addEventListener("click", () => {

  const name = document.querySelector('input[type="text"]')?.value?.trim();
  const phone = document.querySelector('input[type="tel"]')?.value?.trim();

  if (!booking.service || !booking.master || !booking.date || !booking.time || !name || !phone) {
    alert("Заполните все поля");
    return;
  }

  const newBooking = {
    id: String(Date.now()),
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

  // ================= BOOKING SAVE (FIXED) =================
  const all = safeParse("bookings") || [];
  all.push(newBooking);
  localStorage.setItem("bookings", JSON.stringify(all));

  // ================= NOTIFICATION SAVE (FIXED) =================
  const notifKey = `notif_${newBooking.masterId}`;
  const notifications = safeParse(notifKey) || [];

  notifications.unshift({
    text: `Новая запись: ${SERVICES_MAP[newBooking.serviceId] || newBooking.serviceId}`,
    time: new Date().toLocaleString(),
    bookingId: newBooking.id,
    read: false
  });

  localStorage.setItem(notifKey, JSON.stringify(notifications));

  showBookingSuccess(newBooking);

  Object.assign(booking, {
    master: null,
    service: null,
    subservice: null,
    duration: null,
    date: null,
    time: null
  });

  dateInput.value = "";
  document.querySelector('input[type="text"]').value = "";
  document.querySelector('input[type="tel"]').value = "";

  renderSubservices();
  generateTimeSlots();
  syncUI();
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
      <div style="background:white;padding:20px;border-radius:12px;text-align:center;max-width:340px">
        <h3>Запись подтверждена!</h3>
        <p>
          <b>Вы записаны к мастеру ${MASTERS?.[b.masterId]?.name || ""}</b><br><br>
          Услуга: <b>${serviceName}</b><br>
          ${b.subservice ? `(${b.subservice})<br>` : ""}
          <br>
          Дата: ${b.date}<br>
          Время: ${b.time}
        </p>
        <button id="closePopup">OK</button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#closePopup").onclick = () => modal.remove();
  }

  // init render
  renderSubservices();
});