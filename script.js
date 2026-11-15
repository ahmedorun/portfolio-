const hero = document.querySelector('.hero-frame');
const portrait = document.querySelector('.portrait-control');
const portraitWrap = document.querySelector('.portrait-wrap');
const portraitImage = document.querySelector('.portrait-image');
const eyeCanvas = document.querySelector('.eye-tracker');
const portraitHint = document.querySelector('.portrait-hint');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (portraitHint && window.matchMedia('(pointer: coarse)').matches) {
  portraitHint.textContent = 'TAP THE PORTRAIT TO SAY HI ✳';
}

if (hero && portraitWrap && portraitImage && eyeCanvas) {
  const context = eyeCanvas.getContext('2d', { alpha: true });
  const eyes = [
    { x: 531, y: 491, radiusX: 22, radiusY: 16 },
    { x: 704, y: 491, radiusX: 22, radiusY: 16 },
  ];

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = 0;
  let lastFrameTime = 0;
  let greetingTimer = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function drawEyePatches() {
    if (!context || !portraitImage.complete || !portraitImage.naturalWidth) return;

    const width = portraitImage.naturalWidth;
    const height = portraitImage.naturalHeight;
    if (eyeCanvas.width !== width || eyeCanvas.height !== height) {
      eyeCanvas.width = width;
      eyeCanvas.height = height;
    }

    for (const eye of eyes) {
      const patchWidth = eye.radiusX * 2;
      const patchHeight = eye.radiusY * 2;
      const patchLeft = eye.x - eye.radiusX;
      const patchTop = eye.y - eye.radiusY;

      context.clearRect(patchLeft - 1, patchTop - 1, patchWidth + 2, patchHeight + 2);
      context.save();
      context.beginPath();
      context.ellipse(eye.x, eye.y, eye.radiusX, eye.radiusY, 0, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        portraitImage,
        patchLeft - currentX,
        patchTop - currentY,
        patchWidth,
        patchHeight,
        patchLeft,
        patchTop,
        patchWidth,
        patchHeight,
      );
      context.restore();
    }
  }

  function animateEyes(timestamp) {
    const elapsed = lastFrameTime ? Math.min(32, timestamp - lastFrameTime) : 16.67;
    lastFrameTime = timestamp;
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 28);
    currentX += (targetX - currentX) * smoothing;
    currentY += (targetY - currentY) * smoothing;
    drawEyePatches();

    if (Math.abs(targetX - currentX) > 0.04 || Math.abs(targetY - currentY) > 0.04) {
      frame = requestAnimationFrame(animateEyes);
    } else {
      currentX = targetX;
      currentY = targetY;
      drawEyePatches();
      frame = 0;
      lastFrameTime = 0;
    }
  }

  function requestEyeFrame() {
    if (!frame) frame = requestAnimationFrame(animateEyes);
  }

  function trackPointer(event) {
    if (event.pointerType === 'touch') return;
    const bounds = portraitImage.getBoundingClientRect();
    const scaleX = bounds.width / portraitImage.naturalWidth;
    const scaleY = bounds.height / portraitImage.naturalHeight;
    if (!scaleX || !scaleY) return;

    const eyeCenterX = ((eyes[0].x + eyes[1].x) / 2) * scaleX + bounds.left;
    const eyeCenterY = ((eyes[0].y + eyes[1].y) / 2) * scaleY + bounds.top;
    const normalizedX = clamp((event.clientX - eyeCenterX) / (bounds.width * 0.3), -1, 1);
    const normalizedY = clamp((event.clientY - eyeCenterY) / (bounds.height * 0.22), -1, 1);

    targetX = normalizedX * (2.2 / scaleX);
    targetY = normalizedY * (2.2 / scaleY);
    requestEyeFrame();
  }

  function resetEyes() {
    targetX = 0;
    targetY = 0;
    requestEyeFrame();
  }

  hero.addEventListener('pointermove', trackPointer, { passive: true });
  hero.addEventListener('pointerleave', resetEyes);
  window.addEventListener('resize', resetEyes, { passive: true });
  portraitImage.addEventListener('load', drawEyePatches, { once: true });
  if (portraitImage.complete && portraitImage.naturalWidth) drawEyePatches();

  portrait?.addEventListener('click', () => {
    portraitHint?.classList.add('is-active');
    if (portraitHint) portraitHint.textContent = 'HEY, NICE TO MEET YOU ✳';
    window.clearTimeout(greetingTimer);
    greetingTimer = window.setTimeout(() => {
      portraitHint?.classList.remove('is-active');
      if (portraitHint) {
        portraitHint.textContent = window.matchMedia('(pointer: coarse)').matches
          ? 'TAP THE PORTRAIT TO SAY HI ✳'
          : 'MOVE YOUR CURSOR TO INTERACT ↗';
      }
    }, 1500);
  });
}

if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealItems = document.querySelectorAll('.section-heading, .about-grid, .skills-layout, .project-card');
  revealItems.forEach((item) => item.classList.add('reveal-item'));

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
}
