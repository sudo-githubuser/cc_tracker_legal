/* ==========================================================================
   Cracker — shared page behaviour

   Everything here is progressive: the pages are readable and navigable with
   this file missing or blocked. The FAQ is built on <details>, the theme has
   a working default, and nothing is hidden until something is typed.
   ========================================================================== */
(function () {
  "use strict";

  var THEME_KEY = "cracker-theme";

  /* --- Theme -------------------------------------------------------------
     The stored choice is applied by a small inline script in <head> so the
     page never paints the wrong colour first. This only wires the button. */
  function currentTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (e) {
      /* Private mode, or storage disabled. The toggle still works for the
         session; it just will not be remembered. */
    }
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* See above. */
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.textContent = theme === "dark" ? "☀" : "☾";
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    });
  }

  function initTheme() {
    applyTheme(currentTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTheme(currentTheme() === "dark" ? "light" : "dark");
      });
    });
  }

  /* --- Mobile navigation -------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Tapping a link on a phone should close the menu behind it.
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- Back to top -------------------------------------------------------- */
  function initToTop() {
    var btn = document.querySelector("[data-to-top]");
    if (!btn) return;

    var onScroll = function () {
      btn.classList.toggle("show", window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    btn.addEventListener("click", function () {
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* --- FAQ search --------------------------------------------------------- */
  function initFaq() {
    var input = document.getElementById("faq-search");
    var list = document.getElementById("faq-list");
    if (!list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll(".faq-item"));
    var groups = Array.prototype.slice.call(
      list.querySelectorAll(".faq-category")
    );
    var count = document.getElementById("faq-count");
    var empty = document.getElementById("faq-empty");
    var toggleAll = document.querySelector("[data-faq-toggle-all]");

    // Searched once, up front: the question plus its whole answer, lowercased.
    items.forEach(function (item) {
      item._haystack = (item.textContent || "").toLowerCase();
    });

    function announce(shown, query) {
      if (!count) return;
      if (!query) {
        count.textContent = items.length + " questions answered";
        return;
      }
      count.textContent =
        shown === 0
          ? "No matches"
          : shown + (shown === 1 ? " match" : " matches") + ' for "' + query + '"';
    }

    function run(raw) {
      var query = raw.trim().toLowerCase();
      // Every word must appear, so "backup passphrase" does not return
      // everything mentioning either one.
      var words = query.split(/\s+/).filter(Boolean);
      var shown = 0;

      items.forEach(function (item) {
        var hit =
          words.length === 0 ||
          words.every(function (w) {
            return item._haystack.indexOf(w) !== -1;
          });
        item.hidden = !hit;
        // A match is worth nothing if the answer is still folded away.
        if (words.length) item.open = hit;
        if (hit) shown++;
      });

      groups.forEach(function (group) {
        var any = Array.prototype.slice
          .call(group.querySelectorAll(".faq-item"))
          .some(function (item) {
            return !item.hidden;
          });
        group.hidden = !any;
      });

      if (empty) empty.hidden = shown !== 0;
      announce(shown, raw.trim());
    }

    if (input) {
      input.addEventListener("input", function () {
        run(input.value);
      });
      // Escape clears, which is what the field looks like it should do.
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && input.value) {
          input.value = "";
          run("");
        }
      });
    }

    if (toggleAll) {
      toggleAll.addEventListener("click", function () {
        var anyClosed = items.some(function (item) {
          return !item.hidden && !item.open;
        });
        items.forEach(function (item) {
          if (!item.hidden) item.open = anyClosed;
        });
        toggleAll.textContent = anyClosed ? "Collapse all" : "Expand all";
      });
    }

    // Arriving on a link to one question should leave it open and in view.
    if (window.location.hash) {
      var target = document.getElementById(window.location.hash.slice(1));
      if (target && target.classList.contains("faq-item")) target.open = true;
    }

    announce(items.length, "");
  }

  function init() {
    initTheme();
    initNav();
    initToTop();
    initFaq();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
