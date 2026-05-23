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


// =========================
// BOOKING STATE
// =========================

const booking = {
  master: null,
  service: null,
  subservice: null,
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
// =========================
  // MASTERS DATA (TEMP ONLY)
  // =========================

  const masters = {
    tatyana: {
      name: "Татьяна Агламутдинова",
      services: {
        coloring: ["Выход из цвета в технику", "Коррекция техники в топовой зоне", "Мелирование корней до 5 см", 
          "Обесцвечивание корней до 3 см (длинные волосы)", "Обесцвечивание корней до 3см (средние волосы до плеч)", "Обесцвечивание корней до 3 см (короткие влоосы)",
           "Однотонное окрашивание (длинные волосы)", "Однотонное окрашивание (средние волосы до плеч)", "Однотонное окрашивание (короткие волосы)",
          "Окрашивание корней до 3 см, однотонное окрашивание", "Осветление без порошка (спец блонд, корни до 1 см)","Рельефное окрашивание (средние волосы до плеч)", "Рельефное окрашивание (длинные волосы)",
        "AirTouch техника (длинные волосы)", "AirTouch техника (средние волосы до плеч)", "Мелирование (короткие волосы)", "Тотал блонд (длинные волосы)", "Тотал блонд (средние волосы до плеч)",
      "Химическая завивка (средние волосы до плеч)"],
        haircut: ["Женская стрижка + уход", "Стрижка челки"],
        care: ["4D-протезирование", "Ревитализация", "Шёлк-эффект"]
      }
    },
    angelina: {
      name: "Ангелина Гилязутдинова",
      services: {
        coloring: ["Выход из темного в технику", "Снятие оттенка на 1-2 тона (из темного в светлый)",
           "Обесцвечивание корней до 3 см", "Окрашивание корней в тон", "Осветление корней до 1 см (спец блонд)",
          "Тотал блонд (длинные волосы)", "Тотал блонд (средние волосы до плеч)", "Тотал блонд (короткие волосы)",
          "AirTouch (длинные волосы)", "AirTouch (средние волосы до плеч)","Комуфляж седины + осветление прядей", 
          "Мелирование (короткие волосы)", "Матирование", "Контуринг", "Контуринг + техника на макушке", "Тонирование",
          "Однотонное окрашивание (средние волосы до плеч)", "Рельефное окрашивание", "Скрытое окрашивание"],
        haircut: ["Подравнивание длины одним срезом + уход (длинные волосы)", "Мужская стрижка", "Стрижка челки"],
        care: ["Трихоскопия + пилинг", "4D протезирование", "Ревитализация", "Шёлк-эффект"]
      }
    },
    anastasia: {
      name: "Анастасия Буторина",
      services: {
        coloring:["Снятие оттенка на 1-2 тона (из темного в светлый)",
           "Обесцвечивание корней до 3 см", "Окрашивание корней в тон", "Осветление корней до 1 см (спец блонд)",
          "Тотал блонд (длинные волосы)", "Тотал блонд (средние волосы до плеч)", "Тотал блонд (короткие волосы)",
          "AirTouch (длинные волосы)", "AirTouch (средние волосы до плеч)","Комуфляж седины + осветление прядей", 
          "Мелирование (короткие волосы)", "Матирование", "Контуринг", "Контуринг + техника на макушке", "Тонирование",
          "Однотонное окрашивание (средние волосы до плеч)", "Рельефное окрашивание", "Скрытое окрашивание"],
        haircut: ["Подравнивание длины одним срезом + уход (длинные волосы)", "Мужская стрижка"],
        care: ["Ботокс", "Кератин", "4D-протезирование", "Ревитализация", "Шёлк-эффект", "Укладка + прическа", "Макияж"]
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
const timeBtns = document.querySelectorAll(".time-btn");


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

  timeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim() === booking.time);
  });
}


// =========================
// SERVICE CLICK
// =========================

serviceCards.forEach(card => {
  card.addEventListener("click", () => {

    booking.service = card.dataset.service;
    booking.subservice = null;

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

    renderSubservices();
    syncUI(); // ← это важно

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

    subservicesContainer.innerHTML =
      "<p style='opacity:.6'>Консультация не требует выбора подуслуг</p>";

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
    btn.textContent = item;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".subservice-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      booking.subservice = item;
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
  });
}


// =========================
// TIME
// =========================

timeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    booking.time = btn.textContent.trim();
    syncUI();
  });
});


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
    serviceId: booking.service,
    subservice: booking.subservice || null,

    date: booking.date,
    time: booking.time,

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

  alert("Запись создана!");
});
