// =========================
// СЛАЙДЕР
// =========================

let index = 0;
let autoSlide;

function showSlide() {
  const slides = document.getElementById("slides");
  const windowEl = document.querySelector(".slider-window");
  if (!slides || !windowEl) return;

  const width = windowEl.clientWidth;
  slides.style.transform = `translateX(${-index * width}px)`;
}

function nextSlide() {
  const count = document.querySelectorAll(".slides img").length;
  if (count === 0) return;

  index = (index + 1) % count;
  showSlide();
}

function startAutoSlide() {
  autoSlide = setInterval(nextSlide, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  startAutoSlide();
  showSlide();

  const slider = document.querySelector(".slider");

  if (slider) {
    slider.addEventListener("mouseenter", () => clearInterval(autoSlide));
    slider.addEventListener("mouseleave", startAutoSlide);
  }

  window.addEventListener("resize", showSlide);
});


// =========================
// SERVICES MAP (UI названия)
// =========================

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

// =========================
// BOOKING STATE
// =========================

const booking = {
  master: null,
  service: null,
  subservice: null,
  duration: null,
  date: null,
  time: null,
  client: {
    name: "",
    phone: ""
  }
};


// =========================
// MASTERS DATA
// =========================
  const masters = {
    tatyana: {
      name: "Татьяна Агламутдинова",
      services: {
        coloring: [{name:"Выход из цвета в технику", duration: 480}, {name:"Коррекция техники в топовой зоне", duration: 180},{name:"Мелирование корней до 5 см", duration: 210},
        {name:"Обесцвечивание корней до 3 см (длинные волосы)", duration: 300},{name:"Обесцвечивание корней до 3см (средние волосы до плеч)", duration: 270}, 
        {name:"Обесцвечивание корней до 3 см (короткие волосы)", duration: 270},{name:"Однотонное окрашивание (длинные волосы)", duration: 120},{name:"Однотонное окрашивание (средние волосы до плеч)", duration: 120},
        {name:"Однотонное окрашивание (короткие волосы)", duration: 90}, {name:"Окрашивание корней до 3 см, однотонное окрашивание", duration: 90},
        {name:"Осветление без порошка (спец блонд, корни до 1 см)", duration: 90},{name:"Рельефное окрашивание (средние волосы до плеч)", duration: 300},
        {name:"Рельефное окрашивание (длинные волосы)", duration: 360},{name:"AirTouch техника (длинные волосы)", duration: 390},{name:"AirTouch техника (средние волосы до плеч)", duration: 360},
        {name:"Мелирование (короткие волосы)", duration: 210},{name:"Тотал блонд (длинные волосы)", duration: 360},{name:"Тотал блонд (средние волосы до плеч)", duration: 330},
        {name:"Химическая завивка (средние волосы до плеч)", duration: 150},], 
        haircut: [{name:"Женская стрижка + уход", duration: 60}, {name: "Стрижка челки", duration: 15}],
        care: [{ name:"4D-протезирование", duration: 90}, {name:"Ревитализация", duration: 90}, {name:"Шёлк-эффект", duration: 60}]
      }
    },
    angelina: {
      name: "Ангелина Гилязутдинова",
      services: {
        coloring: [{name:"Выход из темного в технику", duration: 480}, {name:"Снятие оттенка на 1-2 тона (из темного в светлый)", duration:300},{name:"Обесцвечивание корней до 3 см", duration:180},{name:"Окрашивание корней в тон", duration:120},
        {name:"Осветление корней до 1 см (спец блонд)", duration:150},{name:"Тотал блонд (длинные волосы)", duration:360},{name:"Тотал блонд (средние волосы до плеч)", duration:300},{name:"Тотал блонд (короткие волосы)", duration:210},
        {name:"AirTouch (длинные волосы)", duration:360},{name:"AirTouch (средние волосы до плеч)", duration:300},{name:"Комуфляж седины + осветление прядей", duration:180},{name:"Мелирование (средние волосы)", duration:240},
        {name:"Матирование", duration:150},{name:"Контуринг", duration:180},{name:"Контуринг + техника на макушке", duration:270},{name:"Тонирование", duration:90},
        {name:"Однотонное окрашивание (средние волосы до плеч)", duration:150},{name:"Рельефное окрашивание", duration:300},{name:"Скрытое окрашивание", duration:180},],
        haircut: [{name:"Подравнивание длины одним срезом + уход (длинные волосы)", duration: 60}, {name:"Мужская стрижка", duration: 60}, {name: "Стрижка челки", duration: 30}],
        care: [{name:"Трихоскопия + пилинг", duration: 90}, { name:"4D-протезирование", duration: 90}, {name:"Ревитализация", duration: 90}, {name:"Шёлк-эффект", duration: 60}]
      }
    },
    anastasia: {
      name: "Анастасия Буторина",
      services: {
        coloring:[{name:"Снятие оттенка на 1-2 тона (из темного в светлый)", duration:300},{name:"Обесцвечивание корней до 3 см", duration:180},{name:"Окрашивание корней в тон", duration:120},
        {name:"Осветление корней до 1 см (спец блонд)", duration:150},{name:"Тотал блонд (длинные волосы)", duration:360},{name:"Тотал блонд (средние волосы до плеч)", duration:300},{name:"Тотал блонд (короткие волосы)", duration:210},
        {name:"AirTouch (длинные волосы)", duration:360},{name:"AirTouch (средние волосы до плеч)", duration:300},{name:"Комуфляж седины + осветление прядей", duration:180},{name:"Мелирование (средние волосы)", duration:240},
        {name:"Матирование", duration:150},{name:"Контуринг", duration:180},{name:"Контуринг + техника на макушке", duration:270},{name:"Тонирование", duration:90},
        {name:"Однотонное окрашивание (средние волосы до плеч)", duration:150},{name:"Рельефное окрашивание", duration:300},{name:"Скрытое окрашивание", duration:180},],
        haircut: [{name:"Подравнивание длины одним срезом + уход (длинные волосы)", duration: 60}, {name:"Мужская стрижка", duration: 60}],
        care: [{name:"Ботокс", duration: 180}, {name:"Кератин", duration: 180}, { name:"4D-протезирование", duration: 90}, {name:"Ревитализация", duration: 90}, {name:"Шёлк-эффект", duration: 60}, {name:"Укладка + прическа", duration: 60},
          {name:"Макияж", duration: 75} ]
      }
    }
  };

// =========================
// ELEMENTS
// =========================

const title = document.getElementById("booking-title");
const subservicesContainer = document.getElementById("subservices");
const dateInput = document.getElementById("dateInput");

const serviceCards = document.querySelectorAll(".booking-service")
const masterCards = document.querySelectorAll(".master-card");

// =========================
// URL MASTER
// =========================

const params = new URLSearchParams(window.location.search);
const urlMaster = params.get("master");

if (urlMaster) {
  booking.master = urlMaster;
  renderSubservices(); 
  syncUI();
}

// =========================
// UI UPDATE
// =========================

function syncUI() {
  if (title && booking.master && masters[booking.master]) {
    title.textContent = `Онлайн запись — ${masters[booking.master].name}`;
  }

  masterCards.forEach(card => {
    card.classList.toggle("active", card.dataset.master === booking.master);
  });

  serviceCards.forEach(card => {
    card.classList.toggle("active", card.dataset.service === booking.service);
  });

}


// =========================
// SERVICE CLICK
// =========================

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

// =========================
// MASTER CLICK
// =========================

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

// =========================
// SUBSERVICES
// =========================

function renderSubservices() {
  if (!subservicesContainer) return;

  subservicesContainer.innerHTML = "";

  if (!booking.master || !booking.service) {
    subservicesContainer.innerHTML =
      "<p style='opacity:.6'>Сначала выберите мастера и услугу</p>";
    return;
  }

  // Консультация без подуслуг
  if (booking.service === "consultation") {
    
    booking.subservice = null;
      booking.duration = CONSULTATION.duration;
    subservicesContainer.innerHTML =
      "<p style='opacity:.6'>Консультация не требует выбора подуслуг</p>";

        generateTimeSlots();
    return;
  }


  const list = masters?.[booking.master]?.services?.[booking.service];

  if (!list || list.length === 0) {
    subservicesContainer.innerHTML =
      "<p style='opacity:.6'>Нет доступных услуг</p>";
    return;
  }

 list.forEach(item => {

  const btn = document.createElement("button");

  btn.className = "subservice-btn";

  btn.textContent = item.name;

  btn.addEventListener("click", () => {

    document
      .querySelectorAll(".subservice-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    booking.subservice = item.name;

    booking.duration = item.duration;

    booking.time = null;

    generateTimeSlots(); 
  });
  subservicesContainer.appendChild(btn);

});
}


// =========================
// DATE
// =========================

if (dateInput) {
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  dateInput.addEventListener("input", e => {
    booking.date = e.target.value;
    booking.time = null;
    generateTimeSlots();
  });
}


// =========================
// TIME
// =========================
const timeContainer = document.getElementById("timeSlots");

function generateTimeSlots() {
  if (!timeContainer) return;

  timeContainer.innerHTML = "";

  if (
    !booking.master ||
    !booking.date ||
    !booking.service ||
    !booking.duration
  ) {
    timeContainer.innerHTML =
      "<p style='opacity:.6'>Выберите услугу и дату</p>";
    return;
  }

  const schedule =
    JSON.parse(localStorage.getItem(`schedule_${booking.master}`)) || {};

  const date = new Date(booking.date);
  const dayIndex = date.getDay();

  const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = DAYS[dayIndex];

  const daySchedule = schedule[dayKey];

  if (!daySchedule || daySchedule.closed) {
    timeContainer.innerHTML =
      "<p style='opacity:.6'>Мастер не работает</p>";
    return;
  }

  const [startHour, startMinute] = daySchedule.start.split(":").map(Number);
  const [endHour, endMinute] = daySchedule.end.split(":").map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

  const masterBookings = bookings.filter(
    b => b.masterId === booking.master && b.date === booking.date
  );

  const now = new Date();
  const isToday = booking.date === now.toISOString().split("T")[0];

  for (let time = startTotal; time + booking.duration <= endTotal; time += 30) {

    // ❗️ УБИРАЕМ ПРОШЕДШЕЕ ВРЕМЯ
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (time <= currentMinutes) continue;
    }

    // ❗️ КОНФЛИКТЫ
    const hasConflict = masterBookings.some(b => {
      const [bh, bm] = b.time.split(":").map(Number);
      const start = bh * 60 + bm;
      const end = start + (b.duration || 60);

      return time < end && time + booking.duration > start;
    });

    if (hasConflict) continue;

    const hours = String(Math.floor(time / 60)).padStart(2, "0");
    const minutes = String(time % 60).padStart(2, "0");
    const formatted = `${hours}:${minutes}`;

    const btn = document.createElement("button");
    btn.className = "time-btn";
    btn.textContent = formatted;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-btn").forEach(b =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      booking.time = formatted;
    });

    timeContainer.appendChild(btn);
  }

  if (!timeContainer.innerHTML.trim()) {
    timeContainer.innerHTML =
      "<p style='opacity:.6'>Нет свободных окон</p>";
  }
}
// =========================
// SUBMIT
// =========================

document.querySelector(".submit-btn")?.addEventListener("click", () => {

  const name = document.querySelector('input[type="text"]')?.value?.trim();
  const phone = document.querySelector('input[type="tel"]')?.value?.trim();

  if (!booking.service || !booking.master || !booking.date || !booking.time || !name || !phone) {
    alert("Заполните все поля");
    return;
  }

  const newBooking = {
    id: Date.now(),

    masterId: booking.master,
    serviceId: typeof booking.service === "object"
  ? booking.service.id || booking.service.name
  : booking.service,
    subservice: booking.subservice || null,

    date: booking.date,
    time: booking.time,
    duration: booking.duration,

    client: {
      name,
      phone
    },

    status: "new",
    createdAt: new Date().toISOString()
  };

const all = JSON.parse(localStorage.getItem("bookings")) || [];
all.push(newBooking);

localStorage.setItem("bookings", JSON.stringify(all));

showBookingSuccess(newBooking);
booking.service = null;
booking.subservice = null;
booking.duration = null;
booking.date = null;
booking.time = null;
dateInput.value = ""; 
document.querySelector('input[type="text"]').value = "";
document.querySelector('input[type="tel"]').value = "";

generateTimeSlots();
renderSubservices();
syncUI();

function showBookingSuccess(booking) {

  const serviceName =
    SERVICES_MAP[booking.serviceId] || booking.serviceId;

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
    <div style="
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      max-width: 340px;
    ">
      <h3>Запись подтверждена</h3>

      <p>
        Вы успешно записались к <b>${masters?.[booking.masterId]?.name || ""}</b><br><br>

        Услуга: <b>${serviceName}</b><br>
        ${booking.subservice ? `(${booking.subservice})<br>` : ""}

        <br>
        Дата: ${booking.date}<br>
        Время: ${booking.time}
      </p>

      <p>
        Ждём вас по адресу: Полевской, Ялунина 15
      </p>

      <button id="closePopup">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#closePopup").onclick = () => {
    modal.remove();
  };
}})
