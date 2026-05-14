//слайдер фото главная//
let index = 0;
let autoSlide;

function showSlide() {
  const slides = document.getElementById("slides");
  const windowEl = document.querySelector(".slider-window");

  const width = windowEl.clientWidth;

  slides.style.transform = `translateX(${-index * width}px)`;
}

function nextSlide() {
  const count = document.querySelectorAll(".slides img").length;
  index = (index + 1) % count;
  showSlide();
}

function prevSlide() {
  const count = document.querySelectorAll(".slides img").length;
  index = (index - 1 + count) % count;
  showSlide();
}

function startAutoSlide() {
  autoSlide = setInterval(nextSlide, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  startAutoSlide();
  showSlide(); 

  const slider = document.querySelector(".slider");

  slider.addEventListener("mouseenter", () => clearInterval(autoSlide));
  slider.addEventListener("mouseleave", startAutoSlide);

  window.addEventListener("resize", showSlide);
});

// =========================
// STATE (единственный источник правды)
// =========================

const booking = {
  service: null,
  subservice: null,
  master: null,
  date: null,
  time: null
};


// =========================
// DATA
// =========================

const masters = {
  tatyana: {
    name: "Татьяна Агламутдинова",
    services: {
      coloring: ["Airtouch", "Блонд", "Тонирование"],
      haircut: ["Женская стрижка", "Мужская стрижка"],
      care: ["Ботокс", "Кератин"]
    }
  },

  angelina: {
    name: "Ангелина Гилязутдинова",
    services: {
      coloring: ["Окрашивание"],
      haircut: ["Стрижка"],
      care: ["Уход"]
    }
  },

  anastasia: {
    name: "Анастасия Буторина",
    services: {
      coloring: [],
      haircut: [],
      care: []
    }
  }
};


// =========================
// ELEMENTS
// =========================

const title = document.getElementById("booking-title");
const serviceCards = document.querySelectorAll(".service-card");
const masterCards = document.querySelectorAll(".master-card");
const timeBtns = document.querySelectorAll(".time-btn");

const subservicesContainer = document.getElementById("subservices");


// =========================
// INIT MASTER (URL ONLY)
// =========================

const params = new URLSearchParams(window.location.search);
const urlMaster = params.get("master");

if (urlMaster && masters[urlMaster]) {
  booking.master = urlMaster;
}


// =========================
// RENDER UI (ОДНА ФУНКЦИЯ СИНХРОНИЗАЦИИ)
// =========================

function syncUI() {

  // ----- TITLE -----
  if (booking.master && masters[booking.master]) {
    title.textContent = `Онлайн запись — ${masters[booking.master].name}`;
  } else {
    title.textContent = "Онлайн запись";
  }

  // ----- MASTER ACTIVE -----
  masterCards.forEach(card => {
    card.classList.toggle("active", card.dataset.master === booking.master);
  });

  // ----- SERVICE ACTIVE -----
  serviceCards.forEach(card => {
    card.classList.toggle("active", card.dataset.service === booking.service);
  });

  // ----- TIME ACTIVE -----
  timeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.textContent === booking.time);
  });
}


// =========================
// SERVICES
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
// MASTERS
// =========================

masterCards.forEach(card => {
  card.addEventListener("click", () => {

    booking.master = card.dataset.master;

    renderSubservices();
    syncUI();
  });
});


// =========================
// SUBSERVICES
// =========================

function renderSubservices() {

  subservicesContainer.innerHTML = "";

  // ❗ КОНСУЛЬТАЦИЯ — БЕЗ ПОДУСЛУГ
  if (booking.service === "consultation") {
    subservicesContainer.innerHTML = "<p>Консультация не требует выбора дополнительной услуги</p>";
    booking.subservice = "Консультация";
    return;
  }

  if (!booking.master || !booking.service) {
    subservicesContainer.innerHTML = "<p>Выберите мастера и услугу</p>";
    return;
  }

  const list = masters?.[booking.master]?.services?.[booking.service];

  if (!list || list.length === 0) {
    subservicesContainer.innerHTML = "<p>Нет доступных услуг</p>";
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
const dateInput = document.getElementById("dateInput");

if (dateInput) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const minDate = `${yyyy}-${mm}-${dd}`;

  dateInput.min = minDate;

  dateInput.addEventListener("input", () => {
  console.log("DATE:", dateInput.value);
});
}

// =========================
// TIME
// =========================

timeBtns.forEach(btn => {
  btn.addEventListener("click", () => {

    booking.time = btn.textContent;
    syncUI();
  });
});


// =========================
// SUBMIT
// =========================

document.querySelector(".submit-btn").addEventListener("click", () => {

  const name = document.querySelector('input[type="text"]').value;
  const phone = document.querySelector('input[type="tel"]').value;

  if (
    !booking.service ||
    !booking.master ||
    !booking.date ||
    !booking.time ||
    !name ||
    !phone
  ) {
    alert("Заполните все поля");
    return;
  }

  console.log("📌 BOOKING:", {
    ...booking,
    name,
    phone
  });

  alert("Вы успешно записались!");
});


// =========================
// FIRST SYNC
// =========================

syncUI();