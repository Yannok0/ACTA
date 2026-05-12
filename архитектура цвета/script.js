let index = 0;
let autoSlide;

function showSlide() {
  const slides = document.getElementById("slides");
  const windowEl = document.querySelector(".slider-window");

  const width = windowEl.clientWidth; // ВАЖНО: не offsetWidth

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