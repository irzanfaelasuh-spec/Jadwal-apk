/* =========================
   SCHEDULE
========================= */

const SCHEDULE = {
  Senin: [
    "Informatika",
    "Informatika",
    "Informatika",
    "IPS",
    "IPS",
    "B. Inggris",
    "B. Inggris",
    "BTQ",
    "BTQ"
  ],

  Selasa: [
    "PKN",
    "PKN",
    "PKN",
    "PAI",
    "PAI",
    "PAI",
    "MTK",
    "MTK",
    "MTK",
    "BK"
  ],

  Rabu: [
    "B. Indonesia",
    "B. Indonesia",
    "Coding",
    "PJOK",
    "PJOK",
    "PJOK",
    "Prakarya",
    "Prakarya",
    "Prakarya"
  ],

  Kamis: [
    "B. Inggris",
    "B. Inggris",
    "B. Indonesia",
    "B. Korea",
    "IPS",
    "IPS",
    "IPA",
    "IPA",
    "IPA"
  ],

  Jumat: [
    "MTK",
    "MTK",
    "B. Indonesia",
    "B. Indonesia",
    "IPA",
    "IPA"
  ]
};


/* =========================
   DAY CONFIG
========================= */

const DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu"
];


/* =========================
   SETTINGS
========================= */

let enabled = JSON.parse(
  localStorage.getItem("enabled") ?? "true"
);

let sound = JSON.parse(
  localStorage.getItem("sound") ?? "true"
);

let lastReminder = "";


/* =========================
   DOM HELPER
========================= */

const $ = id => document.getElementById(id);


/* =========================
   DATE / DAY
========================= */

function nowDay() {
  return DAYS[new Date().getDay()];
}

function isWeekday() {
  const day = new Date().getDay();

  return day >= 1 && day <= 5;
}


/* =========================
   RENDER UI
========================= */

function render() {
  const day = nowDay();
  const active = isWeekday() && enabled;

  $("dayName").textContent = day;

  $("scheduleTitle").textContent = day;

  $("activeBadge").textContent = active
    ? "AKTIF"
    : "NONAKTIF";

  $("activeBadge").classList.toggle(
    "off",
    !active
  );

  if (active) {
    $("reminderState").textContent =
      "Menunggu pukul 20:00";
  } else if (
    day === "Sabtu" ||
    day === "Minggu"
  ) {
    $("reminderState").textContent =
      "Weekend — reminder nonaktif";
  } else {
    $("reminderState").textContent =
      "Reminder dimatikan";
  }

  $("toggleBtn").classList.toggle(
    "on",
    enabled
  );

  $("soundToggle").classList.toggle(
    "on",
    sound
  );

  $("soundBtn").textContent = sound
    ? "🔔"
    : "🔕";


  /* =========================
     SUBJECT LIST
  ========================= */

  const list = SCHEDULE[day] || [];

  if (!list.length) {
    $("subjects").innerHTML = `
      <div class="subject">
        <span class="num">—</span>

        <div>
          <b>Weekend</b>
          <small>Tidak ada reminder</small>
        </div>
      </div>
    `;

    return;
  }

  $("subjects").innerHTML = list
    .map((subject, index) => `
      <div
        class="subject"
        style="animation-delay:${index * 35}ms"
      >
        <span class="num">
          ${index + 1}
        </span>

        <div>
          <b>${subject}</b>
          <small>
            Pelajaran ${index + 1}
          </small>
        </div>
      </div>
    `)
    .join("");
}


/* =========================
   REAL-TIME CLOCK
========================= */

function clock() {
  const date = new Date();

  $("clock").textContent =
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });


  /* =========================
     20:00 REMINDER CHECK
  ========================= */

  if (
    date.getHours() === 20 &&
    date.getMinutes() === 0 &&
    date.getSeconds() < 5
  ) {
    trigger("auto");
  }
}


/* =========================
   TRIGGER REMINDER
========================= */

function trigger(source) {
  const todayKey =
    new Date().toDateString();

  /*
   * Jangan trigger dua kali
   * pada hari yang sama.
   */

  if (
    source === "auto" &&
    lastReminder === todayKey
  ) {
    return;
  }

  lastReminder = todayKey;


  /*
   * Weekend atau reminder OFF
   */

  if (!isWeekday() || !enabled) {
    return;
  }


  const day = nowDay();

  const books =
    SCHEDULE[day] || [];


  showReminder(
    day,
    books
  );
}


/* =========================
   SHOW REMINDER
========================= */

function showReminder(day, books) {
  /*
   * Hilangkan mapel yang sama
   * supaya tidak muncul:
   *
   * Informatika, Informatika...
   */

  const uniqueBooks = [
    ...new Set(books)
  ];


  $("modalTitle").textContent =
    "Beresin buku!";


  $("modalText").innerHTML = `
    Besok
    <b>${nextWeekday(day)}</b>.
    Siapkan:
    <b>${uniqueBooks.join(", ")}</b>.
  `;


  /*
   * Tampilkan modal
   */

  $("modal").classList.add("show");


  /*
   * SFX
   */

  if (sound) {
    beep();
  }


  /*
   * Android native bridge
   */

  notifyNative(
    day,
    uniqueBooks
  );
}


/* =========================
   NEXT WEEKDAY
========================= */

function nextWeekday(day) {
  const index =
    DAYS.indexOf(day);

  return DAYS[
    (index + 1) % DAYS.length
  ];
}


/* =========================
   SOUND EFFECT
========================= */

function beep() {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }


    const context =
      new AudioContext();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();


    oscillator.type = "sine";

    oscillator.frequency.value =
      880;


    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.12,
      context.currentTime + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.5
    );


    oscillator.connect(gain);

    gain.connect(
      context.destination
    );


    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.55
    );

  } catch (error) {
    // Audio tidak tersedia.
  }
}


/* =========================
   ANDROID NATIVE BRIDGE
========================= */

function notifyNative(day, books) {
  if (
    window.AndroidReminder?.scheduleNotification
  ) {
    window.AndroidReminder.scheduleNotification(
      day,
      books.join(", ")
    );
  }
}


/* =========================
   TOAST
========================= */

function toast(message) {
  const element =
    $("toast");

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

  setTimeout(() => {
    element.classList.remove(
      "show"
    );
  }, 2200);
}


/* =========================
   REMINDER TOGGLE
========================= */

$("toggleBtn").onclick = () => {
  enabled = !enabled;

  localStorage.setItem(
    "enabled",
    enabled
  );

  render();

  toast(
    enabled
      ? "Reminder diaktifkan"
      : "Reminder dimatikan"
  );
};


/* =========================
   SOUND TOGGLE
========================= */

$("soundToggle").onclick = () => {
  sound = !sound;

  localStorage.setItem(
    "sound",
    sound
  );

  render();

  toast(
    sound
      ? "Nada dering aktif"
      : "Nada dering dimatikan"
  );
};


/* =========================
   SOUND HEADER BUTTON
========================= */

$("soundBtn").onclick = () => {
  $("soundToggle").click();
};


/* =========================
   TEST REMINDER
========================= */

$("testBtn").onclick = () => {
  if (!isWeekday()) {
    toast(
      "Weekend — reminder memang nonaktif."
    );

    return;
  }

  showReminder(
    nowDay(),
    SCHEDULE[nowDay()] || []
  );
};


/* =========================
   CLOSE MODAL
========================= */

$("closeModal").onclick = () => {
  $("modal").classList.remove(
    "show"
  );
};


/* =========================
   INITIALIZATION
========================= */

function init() {
  render();

  clock();


  /*
   * Update jam setiap detik.
   */

  setInterval(
    clock,
    1000
  );


  /*
   * Refresh UI ketika
   * menit berubah.
   */

  setInterval(() => {
    if (
      new Date().getSeconds() === 0
    ) {
      render();
    }
  }, 1000);


  /*
   * Minta izin notifikasi
   * jika browser mendukung.
   */

  if (
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    Notification.requestPermission();
  }
}


/* =========================
   START APP
========================= */

init();
