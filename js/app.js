gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   LENIS SMOOTH SCROLL
   ============================================================ */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ============================================================
   LOADER
   (runs as soon as the DOM is parsed — does NOT wait for
   window "load", which would otherwise block on every single
   background video finishing its full download, including
   ones far below the fold. That's what caused the loader to
   hang for a long time on mobile connections.)
   ============================================================ */
(function () {
  const bar = document.getElementById("loader-bar-fill");
  const pct = document.getElementById("loader-percent");
  let p = 0;
  const t = setInterval(() => {
    p = Math.min(100, p + Math.random() * 18);
    bar.style.width = p + "%";
    pct.textContent = Math.floor(p) + "%";
    if (p >= 100) {
      clearInterval(t);
      setTimeout(() => {
        document.getElementById("loader").classList.add("loaded");
        playHeroIntro();
      }, 300);
    }
  }, 120);
})();

/* ============================================================
   LAZY-LOAD BACKGROUND VIDEOS
   Every video except the hero's ships with preload="none" and
   its real file on a data-src attribute instead of src, so nothing
   downloads until the section is actually about to be seen —
   otherwise all 17 clips would start fetching at once on load,
   which is what made the site so heavy on mobile.
   ============================================================ */
(function lazyLoadVideos() {
  const videos = Array.from(document.querySelectorAll("video")).filter((v) =>
    v.querySelector("source[data-src]")
  );
  if (!videos.length) return;

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      const source = video.querySelector("source[data-src]");
      if (source) {
        source.src = source.dataset.src;
        source.removeAttribute("data-src");
        video.load();
        video.play().catch(() => {});
      }
      observer.unobserve(video);
    });
  }, { rootMargin: "150% 0px 150% 0px" });

  videos.forEach((video) => io.observe(video));
})();

/* ============================================================
   HEADER SCROLL STATE
   ============================================================ */
ScrollTrigger.create({
  start: 100,
  onUpdate: (self) => {
    document.querySelector(".site-header").classList.toggle("scrolled", self.scroll() > 80);
  }
});

/* ============================================================
   CURSOR GLOW
   ============================================================ */
const glow = document.getElementById("cursor-glow");
window.addEventListener("mousemove", (e) => {
  glow.classList.add("active");
  gsap.to(glow, { x: e.clientX, y: e.clientY, duration: 0.6, ease: "power3.out" });
});
document.addEventListener("mouseleave", () => glow.classList.remove("active"));

/* ============================================================
   HERO INTRO — word reveal
   ============================================================ */
function playHeroIntro() {
  gsap.to(".hero-heading .word", {
    y: "0%", duration: 1.1, stagger: 0.06, ease: "power4.out", delay: 0.1
  });
  gsap.from(".hero-tagline, .hero-actions, .hero-trust, .scroll-indicator", {
    opacity: 0, y: 24, duration: 1, stagger: 0.12, ease: "power3.out", delay: 0.7
  });
}

/* ============================================================
   WORD-BY-WORD SCROLL REVEAL
   Splits text into masked words that slide up into place as
   the element scrolls into view — used on headings/copy.
   ============================================================ */
function splitIntoWords(el) {
  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((chunk) => {
        const piece = chunk.trim() === ""
          ? document.createTextNode(chunk)
          : (() => {
              const mask = document.createElement("span");
              mask.className = "word-mask";
              const inner = document.createElement("span");
              inner.className = "word-inner";
              inner.textContent = chunk;
              mask.appendChild(inner);
              return mask;
            })();
        el.insertBefore(piece, node);
      });
      el.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
      splitIntoWords(node);
    }
  });
}

function revealWords(el, opts = {}) {
  splitIntoWords(el);
  const words = el.querySelectorAll(".word-inner");
  gsap.set(words, { yPercent: 115 });
  gsap.to(words, {
    yPercent: 0,
    duration: 0.9,
    stagger: 0.03,
    ease: "power4.out",
    delay: opts.delay || 0,
    scrollTrigger: {
      trigger: opts.trigger || el,
      start: opts.start || "top 80%",
      toggleActions: "play none none reverse"
    }
  });
}

/* headings that reveal on their own scroll position */
gsap.utils.toArray(".reveal-heading").forEach((el) => revealWords(el, { start: "top 78%" }));

/* feature block headings — timed to land between the label and paragraph */
document.querySelectorAll(".feature-block").forEach((section) => {
  const heading = section.querySelector(".feature-copy h2");
  if (heading) {
    revealWords(heading, { trigger: section, start: "top 65%", delay: 0.15 });
  }
});

/* testimonial quotes */
gsap.utils.toArray(".testimonial p").forEach((p) => {
  revealWords(p, { trigger: p.closest(".testimonial"), start: "top 85%" });
});

/* ============================================================
   COUNTER ANIMATIONS
   ============================================================ */
document.querySelectorAll(".stat-number").forEach((el) => {
  const target = parseFloat(el.dataset.value);
  const decimals = parseInt(el.dataset.decimals || "0");
  gsap.fromTo(el, { textContent: 0 }, {
    textContent: target,
    duration: 1.8,
    ease: "power1.out",
    snap: { textContent: decimals === 0 ? 1 : 0.01 },
    scrollTrigger: { trigger: el.closest(".scroll-block"), start: "top 70%", toggleActions: "play none none reverse" }
  });
});

/* ============================================================
   SECTION REVEALS — feature blocks (choreographed per data-animation)
   ============================================================ */
document.querySelectorAll(".feature-block").forEach((section) => {
  const type = section.dataset.animation;
  const children = section.querySelectorAll(".feature-copy .section-label, .feature-copy p");
  const from = {
    "clip-reveal": { clipPath: "inset(100% 0 0 0)", opacity: 0 },
    "slide-right": { x: 80, opacity: 0 },
    "scale-up": { scale: 0.9, opacity: 0 },
    "fade-up": { y: 50, opacity: 0 },
    "rotate-in": { y: 40, rotation: 3, opacity: 0 }
  }[type] || { y: 40, opacity: 0 };

  gsap.from(children, {
    ...from,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: { trigger: section, start: "top 65%", toggleActions: "play none none reverse" }
  });
});

/* solution phone parallax */
gsap.to(".phone-mockup", {
  y: -60,
  scrollTrigger: { trigger: ".solution-block", start: "top bottom", end: "bottom top", scrub: true }
});

/* ============================================================
   VEHICLE TYPES — pinned one-at-a-time carousel
   (same sticky-CSS + scrub-only pattern as the Como Funciona
   timeline — a real GSAP pin here would double up with the CSS
   sticky and create a dead scroll stretch, as it did before)
   ============================================================ */
(function vehicleCarousel() {
  const wrap = document.querySelector(".vehicle-types");
  const slides = document.querySelectorAll(".vehicle-slide");
  const dots = document.querySelectorAll(".vehicle-dot");
  if (!wrap || !slides.length) return;

  let current = 0;
  function setActive(i) {
    if (i === current && slides[i].classList.contains("active")) return;
    current = i;
    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === i);
    });
    dots.forEach((dot, idx) => dot.classList.toggle("active", idx === i));
  }

  ScrollTrigger.create({
    trigger: wrap,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    snap: {
      snapTo: [0, 0.5, 1],
      duration: 0.4,
      ease: "power2.inOut"
    },
    onUpdate: (self) => {
      const idx = Math.min(slides.length - 1, Math.floor(self.progress * slides.length));
      setActive(idx);
    }
  });
})();

/* plans stagger-in */
gsap.from(".plan-column", {
  y: 60, opacity: 0, duration: 0.9, stagger: 0.15, ease: "power3.out",
  scrollTrigger: { trigger: ".plans-row", start: "top 75%" }
});

/* app tiles stagger-in */
gsap.from(".app-tile", {
  scale: 0.85, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power2.out",
  scrollTrigger: { trigger: ".app-grid", start: "top 80%" }
});

/* testimonials fade-up individually */
gsap.utils.toArray(".testimonial").forEach((t) => {
  gsap.from(t, {
    y: 40, opacity: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: t, start: "top 85%" }
  });
});

/* ============================================================
   HORIZONTAL MARQUEE
   ============================================================ */
document.querySelectorAll(".marquee-wrap").forEach((wrap) => {
  const text = wrap.querySelector(".marquee-text");
  const speed = parseFloat(wrap.dataset.scrollSpeed) || -20;
  gsap.to(text, {
    xPercent: speed,
    ease: "none",
    scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 1 }
  });
});

/* ============================================================
   COMO FUNCIONA — pinned horizontal timeline
   ============================================================ */
(function horizontalTimeline() {
  const track = document.querySelector(".timeline-track");
  const section = document.querySelector(".how-it-works");
  if (!track || !section) return;

  function getScrollAmount() {
    return -(track.scrollWidth - window.innerWidth + window.innerWidth * 0.1);
  }

  /* .how-pin is already pinned via CSS position:sticky for the section's
     full 300vh — GSAP only needs to drive the horizontal scrub in sync
     with that same range, not pin anything itself (that caused a dead
     scroll stretch with a mismatched distance). */
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      gsap.set(track, { x: self.progress * getScrollAmount() });
    }
  });
})();

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const answer = item.querySelector(".faq-answer");
    const isOpen = item.classList.contains("open");

    document.querySelectorAll(".faq-item.open").forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove("open");
        openItem.querySelector(".faq-answer").style.maxHeight = null;
      }
    });

    item.classList.toggle("open", !isOpen);
    answer.style.maxHeight = isOpen ? null : answer.scrollHeight + "px";
  });
});

/* refresh ScrollTrigger after all layout settles */
window.addEventListener("load", () => ScrollTrigger.refresh());

/* web fonts swap in asynchronously and reflow text height/line-wrapping,
   which shifts every trigger position below the reflowed text — refresh
   again once the real fonts are actually in place */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
