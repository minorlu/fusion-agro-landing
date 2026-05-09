window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  document.getElementById("progressbar").style.width = scrollPercent + "%";
});

function setNavHeight() {
  const nav = document.getElementById('nav-container');
  document.documentElement.style.setProperty(
    '--nav-height',
    `${nav.offsetHeight}px`
  );
}

window.addEventListener('load', setNavHeight);
window.addEventListener('resize', setNavHeight);

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector("#hero-block");
  const bg = hero.querySelector(".about-bg");

  function updateParallax() {
    const rect = hero.getBoundingClientRect();

    // двигаем фон медленнее, чем основной контент
    const offset = rect.top * -0.8;

    bg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.15)`;
  }

  updateParallax();
  window.addEventListener("scroll", updateParallax);
  window.addEventListener("resize", updateParallax);
});

const phoneInput = document.getElementById("phone");

phoneInput.addEventListener("input", () => {
  let digits = phoneInput.value.replace(/\D/g, "");

  // Если поле полностью пустое, ничего не показываем
  if (digits.length === 0) {
    phoneInput.value = "";
    return;
  }
  
  if (digits.startsWith("7")) {
    digits = digits.slice(1);
  }

  // Оставляем только 10 цифр номера
  digits = digits.slice(0, 10);

  // Если после удаления 7/8 ничего не осталось
  if (digits.length === 0) {
    phoneInput.value = "";
    return;
  }

  let formatted = "+7";

  if (digits.length > 0) {
    formatted += " " + digits.slice(0, 3);
  }

  if (digits.length >= 4) {
    formatted += " " + digits.slice(3, 6);
  }

  if (digits.length >= 7) {
    formatted += " " + digits.slice(6, 8);
  }

  if (digits.length >= 9) {
    formatted += " " + digits.slice(8, 10);
  }

  phoneInput.value = formatted;
});

const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");
const formStartedAt = document.querySelector("#formStartedAt");

if (contactForm && formStatus && formStartedAt) {
  formStartedAt.value = Date.now().toString();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formStatus.textContent = "Отправляем...";

    try {
      const formData = new FormData(contactForm);
      const body = new URLSearchParams(formData);

      const response = await fetch(contactForm.action, {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Не удалось отправить заявку.");
      }

      contactForm.reset();
      formStartedAt.value = Date.now().toString();

      formStatus.textContent = "Заявка отправлена. Мы свяжемся с вами.";
    } catch (error) {
      formStatus.textContent = error.message;
    }
  });
}