console.log("LOGIN PAGE");

import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const EMAIL_MAP = {
  tatyana: "tatyana@test.com",
  angelina: "angelina@test.com",
  anastasia: "anastasia@test.com"
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

// инпуты
const toggle = document.getElementById("togglePassword");
const input = document.getElementById("password");

toggle?.addEventListener("click", () => {
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  toggle.textContent = hidden ? "⌣" : "👁";
});