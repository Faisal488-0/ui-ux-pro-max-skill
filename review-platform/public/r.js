// Progressive enhancement only: the button is a plain <a href> and works with JS disabled.
(function () {
  var a = document.querySelector('[data-review]');
  var s = document.querySelector('[data-status]');
  var mark = document.querySelector('[data-mark]');
  var logo = document.querySelector('[data-logo]');
  var timer;
  function say(t) { if (s) s.textContent = t; }
  function reset() { clearTimeout(timer); if (a) a.removeAttribute('aria-busy'); }
  if (logo && mark) {
    var fallback = function () { mark.setAttribute('data-fallback', ''); };
    logo.addEventListener('error', fallback);
    if (logo.complete && logo.naturalWidth === 0) fallback(); // failed before this script ran
  }
  if (!a) return;
  a.addEventListener('click', function (e) {
    if (a.getAttribute('aria-busy') === 'true') { e.preventDefault(); return; } // no double-taps
    if (navigator.onLine === false) { e.preventDefault(); say('لا يوجد اتصال بالإنترنت. تحقق من الشبكة ثم حاول مجدداً.'); return; }
    a.setAttribute('aria-busy', 'true');
    say('جارٍ فتح Google…');
    timer = setTimeout(function () { reset(); say('تأخّر الفتح. اضغط الزر مرة أخرى.'); }, 6000);
  });
  window.addEventListener('pageshow', function () { reset(); say(''); }); // back/forward cache
})();
