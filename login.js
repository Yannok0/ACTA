console.log("LOGIN PAGE");

import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const EMAIL_MAP = {
  tatyana: "aglamutdinova@yandex.ru",
  angelina: "yvoroxova@mail.ru",
  anastasia: "nastena.prokhorova.1999@inbox.ru"
};

async function loginUser(email, password, masterId) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Вход успешен:", userCredential.user);

    // фиксация пользователя
    localStorage.setItem("masterId", masterId);

    // редирект
    window.location.href = "master-panel.html";

  } catch (error) {
    console.log("CODE:", error.code);
    console.log("MESSAGE:", error.message);

    alert("Неверный логин или пароль");
  }
}

const form = document.getElementById("loginForm");
const errorText = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const loginValue = document
    .getElementById("login")
    .value
    .replace(/\u00A0/g, "")
    .trim()
    .toLowerCase();

  const password = document.getElementById("password").value.trim();

  console.log("INPUT RAW:", document.getElementById("login").value);
  console.log("NORMALIZED:", loginValue);

  const email = EMAIL_MAP[loginValue];

  if (!email) {
    errorText.textContent = "Неверный логин";
    return;
  }

  errorText.textContent = "";

  await loginUser(email, password, loginValue);
});
//забыли пароль
const forgotLink = document.getElementById("forgotPassword");
const resetModal = document.getElementById("resetModal");
const resetEmail = document.getElementById("resetEmail");
const sendResetBtn = document.getElementById("sendReset");
const closeResetBtn = document.getElementById("closeReset");

// Открыть модальное окно
forgotLink?.addEventListener("click", (e) => {
  e.preventDefault();
  resetModal.style.display = "flex";
  
  // Автозаполнение email если уже введен логин
  const loginValue = document.getElementById("login").value.trim().toLowerCase();
  const email = EMAIL_MAP[loginValue];
  if (email && resetEmail) {
    resetEmail.value = email;
  }
});

// Закрыть модальное окно
closeResetBtn?.addEventListener("click", () => {
  resetModal.style.display = "none";
});

// Закрытие по клику вне окна
resetModal?.addEventListener("click", (e) => {
  if (e.target === resetModal) {
    resetModal.style.display = "none";
  }
});

// Отправить письмо для сброса
sendResetBtn?.addEventListener("click", async () => {
  const email = resetEmail.value.trim();
  
  if (!email) {
    alert("Введите email");
    return;
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Письмо для сброса пароля отправлено! Проверьте почту.");
    resetModal.style.display = "none";
  } catch (error) {
    console.error("Ошибка сброса:", error);
    
    // Переводим ошибки на русский
    const errors = {
      "auth/user-not-found": "Пользователь с таким email не найден",
      "auth/invalid-email": "Некорректный email",
      "auth/too-many-requests": "Слишком много попыток. Попробуйте позже"
    };
    
    alert(errors[error.code] || "Ошибка отправки. Попробуйте позже");
  }
});


// инпуты
const toggle = document.getElementById("togglePassword");
const input = document.getElementById("password");

toggle?.addEventListener("click", () => {
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  toggle.textContent = hidden ? "⌣" : "👁";
});