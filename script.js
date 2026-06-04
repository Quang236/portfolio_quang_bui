const cards = document.querySelectorAll(".project-card");

cards.forEach((card, index) => {
  card.style.setProperty("--delay", `${index * 70}ms`);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".section, .project-card").forEach((element) => {
  observer.observe(element);
});

const evidenceViewer = document.querySelector(".evidence-viewer");
const evidenceFrame = document.querySelector("#evidence-viewer-frame");
const evidenceTitle = document.querySelector("#evidence-viewer-title");
const evidenceDownload = document.querySelector("#evidence-viewer-download");
const evidenceClose = document.querySelector(".evidence-viewer-close");

const openEvidenceViewer = (link) => {
  if (!evidenceViewer || !evidenceFrame || !evidenceTitle || !evidenceDownload) {
    return;
  }

  const card = link.closest(".project-card");
  const title = card?.querySelector("h3")?.textContent?.trim() || "Minh chứng bài tập";
  const viewUrl = link.getAttribute("href");
  const downloadUrl = viewUrl?.replace(".html", ".docx");

  if (!viewUrl || !downloadUrl) {
    return;
  }

  evidenceTitle.textContent = title;
  evidenceFrame.src = `${viewUrl}?embed=1`;
  evidenceDownload.href = downloadUrl;
  evidenceViewer.classList.add("is-open");
  evidenceViewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("viewer-open");
};

const closeEvidenceViewer = () => {
  if (!evidenceViewer || !evidenceFrame) {
    return;
  }

  evidenceViewer.classList.remove("is-open");
  evidenceViewer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("viewer-open");
  evidenceFrame.src = "";
};

document.querySelectorAll(".view-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openEvidenceViewer(link);
  });
});

evidenceClose?.addEventListener("click", closeEvidenceViewer);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && evidenceViewer?.classList.contains("is-open")) {
    closeEvidenceViewer();
  }
});

const musicToggle = document.querySelector(".music-toggle");
const musicLabel = document.querySelector(".music-label");
const backgroundMusic = document.querySelector("#background-music");
const openingScene = document.querySelector(".opening-scene");
const openingVideo = document.querySelector(".opening-video");
const openingEnter = document.querySelector(".opening-enter");
let musicPlaying = false;
let hasTriedInteractionAutoplay = false;
const interactionEvents = ["click", "touchstart", "keydown", "wheel"];
let introFallbackTimer;
let introPauseTimer;
let introStarted = false;
let introFinished = false;
const introFadeMs = 1800;

const updateMusicButton = (shouldPlay) => {
  if (!musicToggle || !musicLabel) {
    return;
  }

  musicPlaying = shouldPlay;
  musicToggle.setAttribute("aria-pressed", String(shouldPlay));
  musicToggle.setAttribute("aria-label", shouldPlay ? "Tắt nhạc nền" : "Bật nhạc nền");
  musicLabel.textContent = shouldPlay ? "Tắt nhạc" : "Bật nhạc";
};

const playMusic = async () => {
  if (!backgroundMusic) {
    return false;
  }

  backgroundMusic.muted = false;
  backgroundMusic.volume = 0.42;

  try {
    await backgroundMusic.play();
    updateMusicButton(true);
    return true;
  } catch {
    updateMusicButton(false);
    return false;
  }
};

const unmutePrimedMusic = () => {
  if (!backgroundMusic || backgroundMusic.paused) {
    return false;
  }

  backgroundMusic.muted = false;
  backgroundMusic.volume = 0.42;
  updateMusicButton(true);
  return true;
};

const primeMutedMusic = async () => {
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.muted = true;
  backgroundMusic.volume = 0;

  try {
    await backgroundMusic.play();
  } catch {
    // Browser autoplay policy may block this; user interaction will retry.
  }
};

const pauseMusic = () => {
  backgroundMusic?.pause();
  updateMusicButton(false);
};

const removeInteractionMusicListeners = () => {
  interactionEvents.forEach((eventName) => {
    document.removeEventListener(eventName, playMusicAfterFirstInteraction);
  });
  window.removeEventListener("scroll", playMusicAfterFirstInteraction);
};

const playMusicAfterFirstInteraction = async (event) => {
  if (hasTriedInteractionAutoplay || musicPlaying) {
    return;
  }

  if (event.target?.closest?.(".music-toggle, .opening-scene")) {
    return;
  }

  const started = unmutePrimedMusic() || (await playMusic());

  if (started) {
    hasTriedInteractionAutoplay = true;
    removeInteractionMusicListeners();
  }
};

const finishOpeningScene = () => {
  if (introFinished) {
    return;
  }

  introFinished = true;
  window.clearTimeout(introFallbackTimer);
  window.clearTimeout(introPauseTimer);
  openingScene?.classList.add("is-finished");
  document.body.classList.remove("intro-lock");
  document.body.classList.add("intro-revealed");
  introPauseTimer = window.setTimeout(() => {
    openingVideo?.pause();
  }, introFadeMs);
};

const getOpeningDurationMs = () => {
  if (!openingVideo || !Number.isFinite(openingVideo.duration) || openingVideo.duration <= 0) {
    return 30000;
  }

  return Math.max(1800, openingVideo.duration * 1000 - introFadeMs);
};

const startOpeningIntro = async () => {
  if (introStarted || !openingScene) {
    return;
  }

  introStarted = true;
  openingScene.classList.add("is-playing");

  if (openingVideo) {
    openingVideo.currentTime = 0;
    openingVideo.muted = false;
    openingVideo.volume = 0.78;

    try {
      await openingVideo.play();
    } catch {
      finishOpeningScene();
      return;
    }
  }

  window.clearTimeout(introFallbackTimer);
  introFallbackTimer = window.setTimeout(finishOpeningScene, getOpeningDurationMs());
};

const startOpeningIntroFromKeyboard = (event) => {
  if (introStarted || !openingScene || openingScene.classList.contains("is-finished")) {
    return;
  }

  if (event.key === "Tab" || event.key === "Escape") {
    return;
  }

  startOpeningIntro();
};

backgroundMusic?.addEventListener("canplay", () => {
  if (musicLabel && !musicPlaying) {
    musicLabel.textContent = "Bật nhạc";
  }

  if (backgroundMusic.paused) {
    primeMutedMusic();
  }
});

backgroundMusic?.addEventListener("error", () => {
  if (!musicToggle || !musicLabel) {
    return;
  }

  musicToggle.disabled = true;
  musicToggle.setAttribute("aria-label", "Không tìm thấy file nhạc nền");
  musicLabel.textContent = "Thiếu nhạc";
});

interactionEvents.forEach((eventName) => {
  document.addEventListener(eventName, playMusicAfterFirstInteraction, {
    passive: true,
  });
});

window.addEventListener("scroll", playMusicAfterFirstInteraction, {
  passive: true,
});

primeMutedMusic();

if (openingScene) {
  document.body.classList.add("intro-lock");
  openingScene.focus({ preventScroll: true });

  openingVideo?.addEventListener("ended", finishOpeningScene, { once: true });
  openingVideo?.addEventListener("loadedmetadata", () => {
    if (!introStarted || introFinished) {
      return;
    }

    window.clearTimeout(introFallbackTimer);
    introFallbackTimer = window.setTimeout(finishOpeningScene, getOpeningDurationMs());
  });
  openingScene.addEventListener("click", startOpeningIntro, { once: true });
  openingEnter?.addEventListener("click", startOpeningIntro, { once: true });
  document.addEventListener("keydown", startOpeningIntroFromKeyboard, { once: true });
} else {
  document.body.classList.add("intro-revealed");
}

musicToggle?.addEventListener("click", () => {
  if (musicPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
});
