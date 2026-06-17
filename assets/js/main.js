/* ============================================================
   RemontPro — основной JS.
   Мобильное меню, FAQ-аккордеон, обработка форм заявок,
   плавный скролл, год в футере.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Мобильное меню ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Закрывать меню при клике по ссылке
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- FAQ-аккордеон ---------- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    var btn = item.querySelector(".faq-item__q");
    var answer = item.querySelector(".faq-item__a");
    if (!btn || !answer) return;

    btn.addEventListener("click", function () {
      var isOpen = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      answer.style.maxHeight = isOpen ? answer.scrollHeight + "px" : null;
    });
  });

  /* ---------- Маска / валидация телефона (мягкая) ---------- */
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.addEventListener("input", function () {
      var cleaned = input.value.replace(/[^\d+\-()\s]/g, "");
      if (cleaned !== input.value) {
        input.value = cleaned;
      }
    });
  });

  /* ---------- Обработка форм заявки ---------- */
  // Демонстрационная отправка: показываем сообщение об успехе.
  // Для боевого режима подключите бэкенд или сервис форм (Formspree, и т.п.).
  document.querySelectorAll(".js-lead-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = (form.querySelector('[name="name"]') || {}).value || "";
      var phone = (form.querySelector('[name="phone"]') || {}).value || "";

      if (name.trim().length < 2) {
        alert("Пожалуйста, укажите ваше имя.");
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        alert("Пожалуйста, укажите корректный номер телефона.");
        return;
      }

      var success = form.querySelector(".form__success");
      if (success) {
        success.classList.add("is-visible");
      }
      form.reset();

      // Скрыть сообщение через 6 секунд
      if (success) {
        setTimeout(function () {
          success.classList.remove("is-visible");
        }, 6000);
      }
    });
  });

  /* ---------- Год в футере ---------- */
  var yearEl = document.querySelector(".js-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Тень шапки при скролле ---------- */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) {
        header.style.boxShadow = "0 6px 20px rgba(27, 34, 48, 0.08)";
      } else {
        header.style.boxShadow = "none";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
