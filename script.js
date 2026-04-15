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