document.oncontextmenu=function(){return!1},document.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelectorAll(".map-placeholder"),t=new IntersectionObserver(((e,t)=>{e.forEach((e=>{if(e.isIntersecting){const r=e.target.querySelector("iframe");r.src||(r.src=r.dataset.src),t.unobserve(e.target)}}))}),{threshold:0,rootMargin:"300px 0px"});e.forEach((e=>t.observe(e)))})),document.getElementById("year").textContent=(new Date).getFullYear(),document.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right"),t=new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting&&(e.target.classList.add("show"),t.unobserve(e.target))}))}),{threshold:.1,rootMargin:"0px 0px -50px 0px"});e.forEach((e=>t.observe(e)))}));

(function () {
  const toggles = document.querySelectorAll('.lang-toggle');

  toggles.forEach(toggle => {
    const menu = document.getElementById(toggle.getAttribute('aria-controls'));

    function openMenu() {
      menu.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
    }

    function closeMenu() {
      menu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    }

    function toggleMenu(e) {
      e.stopPropagation();
      menu.classList.contains('show') ? closeMenu() : openMenu();
    }

    function onDocClick(e) {
      if (!menu.contains(e.target) && e.target !== toggle) closeMenu();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closeMenu();
    }

    toggle.addEventListener('click', toggleMenu);
  });
})();
