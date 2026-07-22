/**
 * SiGrade V5 - Application Logic
 * Supports dynamic Teacher and Subject registers, custom KKM thresholds,
 * dynamic Chapter addition per subject, granular Bab & UH grades,
 * and calculations for "Nilai Asli" vs "Nilai Akhir" (Katrol).
 * 
 * V5 updates:
 * - Direct Inline Grade Editing: All edit buttons/modals are removed. Grades are fully 
 *   editable inline inside expandable rows, updating calculations in real-time.
 * - Grades Publication Toggles: Teachers can toggle grade publication. When hidden,
 *   students see a task completeness checklist (✔ Selesai / ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Belum) instead of numeric grades.
 * - Terms Isolation: Students never see "Nilai Asli" or "Katrol" terms.
 * - In-Chapter Task/Ulangan Structure: Chapters (Bab) hold dynamic Tasks and Ulangan (UH).
 * 
 * Data is fully persistent via LocalStorage.
 */

// Helper for Title Case and Titles
function formatTeacherNameTitleCase(name) {
  if (!name) return "";
  let formatted = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  formatted = formatted.replace(/M\.pd/gi, "M.Pd");
  formatted = formatted.replace(/S\.pd/gi, "S.Pd");
  formatted = formatted.replace(/S\.kom/gi, "S.Kom");
  formatted = formatted.replace(/S\.si/gi, "S.Si");
  formatted = formatted.replace(/M\.t/gi, "M.T");
  return formatted;
}

// Initial Seed Data 
const INITIAL_TEACHERS = [
  { id: "t-2", name: "Wahyudha Tri Setiyoaji, M.Pd", subjectDesc: "IPA", classes: "7A, 7B, 7C, 7D, 7E, 7F, 7G, 8A, 8B, 8C, 8D, 8E, 8F, 8G, 9A, 9B, 9C, 9D, 9E, 9F, 9G" }
];

const INITIAL_SUBJECTS = [
  { 
    id: "sub-2-7", 
    name: "IPA (Kelas 7)", 
    teacherId: "t-2", 
    kkm: 70, 
    chapters: [
      { name: "Bab 1", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 2", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 3", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 4", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } }
    ],
    onlineAssignments: [],
    onlineExams: []
  },
  { 
    id: "sub-2-8", 
    name: "IPA (Kelas 8)", 
    teacherId: "t-2", 
    kkm: 70, 
    chapters: [
      { name: "Bab 1", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 2", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 3", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 4", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } }
    ],
    onlineAssignments: [],
    onlineExams: []
  },
  { 
    id: "sub-2-9", 
    name: "IPA (Kelas 9)", 
    teacherId: "t-2", 
    kkm: 70, 
    chapters: [
      { name: "Bab 1", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 2", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 3", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } },
      { name: "Bab 4", tasks: ["Tugas 1", "Tugas 2"], targetMaxWeight: 30, weights: { "Tugas 1": 10, "Tugas 2": 10, "ulangan": 10 } }
    ],
    onlineAssignments: [],
    onlineExams: []
  }
];

const INITIAL_STUDENTS = [];

// SMP Study Materials Bank V7
const STUDY_MATERIALS = {
  "IPA": {
    "Bab 1": {
      "Tugas 1": {
        theory: "Sel adalah satuan unit kehidupan terkecil yang menyusun tubuh makhluk hidup. Struktur sel tumbuhan memiliki beberapa organel khusus seperti Dinding Sel (pelindung & penegak) dan Plastida/Kloroplas (tempat fotosintesis), yang tidak dimiliki oleh sel hewan.",
        instruction: "Tuliskan 3 perbedaan mendasar antara sel hewan dan sel tumbuhan beserta penjelasan fungsinya secara ringkas!"
      },
      "Tugas 2": {
        theory: "Membran sel bersifat semipermeabel. Proses perpindahan molekul melewati membran sel dapat terjadi secara pasif melalui difusi dan osmosis. Osmosis adalah perpindahan molekul pelarut (air) dari larutan berkonsentrasi rendah (encer) ke konsentrasi tinggi (pekat) melalui membran semipermeabel.",
        instruction: "Jelaskan pengertian osmosis dan sebutkan 1 contoh peristiwa osmosis nyata yang terjadi pada sel hewan atau tumbuhan di sekitar kita!"
      },"Ulangan": {
        theory: "Ulangan Harian Sel menguji wawasan struktur mikroskopis sel, fungsi organel sel, mekanisme transport sel, dan konsep organisasi kehidupan.",
        instruction: "Tuliskan jawaban Anda dengan jelas."
      }
    },
    "Bab 2": {
      "Tugas 1": {
        theory: "Sistem pencernaan manusia berfungsi untuk memecah makanan menjadi nutrisi yang dapat diserap tubuh. Terdiri dari organ pencernaan utama (mulut, kerongkongan, lambung, usus halus, usus besar) dan organ pencernaan tambahan.",
        instruction: "Sebutkan urutan organ saluran pencernaan manusia dan jelaskan fungsi asam klorida (HCl) di dalam lambung!"
      },
      "Tugas 2": {
        theory: "Sistem peredaran darah manusia bersifat tertutup dan ganda. Jantung berfungsi memompa darah ke seluruh tubuh, terdiri dari 4 ruang: serambi kanan, serambi kiri, bilik kanan, dan bilik kiri.",
        instruction: "Jelaskan perbedaan fungsi antara pembuluh nadi (arteri) dan pembuluh balik (vena)!"
      },"Ulangan": {
        theory: "Ulangan Harian Bab 2 menguji materi sistem pencernaan, peredaran darah, pernapasan, dan ekskresi pada manusia.",
        instruction: "Jawablah dengan tepat dan jelas."
      }
    },
    "Bab 3": {
      "Tugas 1": {
        theory: "Usaha dalam fisika didefinisikan sebagai perkalian antara gaya yang bekerja pada benda dengan perpindahan benda tersebut (W = F x s). Usaha hanya terjadi jika benda mengalami perpindahan akibat gaya.",
        instruction: "Sebuah balok ditarik dengan gaya 50 N sehingga berpindah sejauh 4 meter. Hitunglah usaha yang dilakukan pada balok tersebut!"
      },
      "Tugas 2": {
        theory: "Energi adalah kemampuan untuk melakukan usaha. Energi mekanik terdiri dari energi potensial (energi kedudukan, Ep = m.g.h) dan energi kinetik (energi gerak, Ek = 1/2 m.v^2).",
        instruction: "Jelaskan hukum kekekalan energi mekanik dan berikan contoh penerapannya dalam kehidupan sehari-hari!"
      },"Ulangan": {
        theory: "Ulangan Harian Bab 3 mencakup konsep usaha, energi potensial/kinetik, daya, dan jenis-jenis pesawat sederhana.",
        instruction: "Kerjakan dengan teliti."
      }
    },
    "Bab 4": {
      "Tugas 1": {
        theory: "Getaran adalah gerak bolak-balik secara berkala melalui titik kesetimbangan. Gelombang adalah getaran yang merambat dengan membawa energi. Berdasarkan medium rambatnya, ada gelombang mekanik dan elektromagnetik.",
        instruction: "Jelaskan perbedaan antara gelombang transversal dan gelombang longitudinal, serta gambarkan arah rambatnya!"
      },
      "Tugas 2": {
        theory: "Bunyi merupakan gelombang longitudinal mekanik yang merambat melalui medium (padat, cair, gas). Bunyi tidak dapat merambat di ruang hampa udara. Kecepatan bunyi dipengaruhi suhu dan jenis medium.",
        instruction: "Jelaskan apa yang dimaksud dengan resonansi bunyi dan sebutkan 1 contoh peristiwa resonansi yang menguntungkan!"
      },"Ulangan": {
        theory: "Ulangan Harian Bab 4 menguji pemahaman getaran, frekuensi, periode, cepat rambat gelombang, karakteristik bunyi, cahaya, cermin/lensa, dan alat optik.",
        instruction: "Selesaikan semua soal dengan cermat."
      }
    }
  }
};

let appState = {
  currentView: "siswa", 
  teacherActiveTab: "dashboard", 
  activeTeacherId: null, 
  publishGrades: true, // Controlled dynamically by teacher
  teachers: [],
  subjects: [],
  students: [],
  selectedStudentId: null,
  teacherFilter: "all",
  teacherSearch: "",
  teacherClassFilter: "8C",
  kesiswaanClassFilter: "8C",
  katrolClassFilter: "8C",
  classes: [],
  
  // Active Term Settings
  academicYear: "2026/2027",
  semester: "Ganjil (I)",
  
  // V7 CBT & LMS states
  activeStudentSubTab: "laporan",
  currentCbtExam: null,
  currentCbtExamSubjectId: null,
  currentCbtStudentId: null,
  cbtQuestions: [],
  cbtAnswers: {},
  cbtCurrentQuestionIndex: 0,
  cbtTimerInterval: null,
  cbtTimeRemaining: 0,
  currSelectedClass: "8",
  currSelectedChapterIdx: 0,
  currSelectedMaterialIdx: 0,
  reportGradeFilter: "8",
  reportClassFilter: "8C",
};

// --- CORE UTILITY FUNCTIONS ---
function isSubjectValidForStudentClass(subjectName, className) {
  if (!className) return true;
  if (subjectName.includes("(Kelas 7)") && !className.startsWith("7")) return false;
  if (subjectName.includes("(Kelas 8)") && !className.startsWith("8")) return false;
  if (subjectName.includes("(Kelas 9)") && !className.startsWith("9")) return false;
  return true;
}

function getGradeFromClassName(className) {
  if (!className) return '';
  if (className.startsWith('7')) return '7';
  if (className.startsWith('8')) return '8';
  if (className.startsWith('9')) return '9';
  return '';
}

function normalizeSemesterValue(semester) {
  if (!semester) return 'Ganjil (I)';
  const s = String(semester).trim();
  if (s === 'Ganjil' || s.toLowerCase() === 'ganjil') return 'Ganjil (I)';
  if (s === 'Genap' || s.toLowerCase() === 'genap') return 'Genap (II)';
  return s;
}

function getSubjectForClassName(className) {
  const grade = getGradeFromClassName(className);
  if (!grade) return appState.subjects[0] || null;
  return appState.subjects.find((s) => s.name.includes(`(Kelas ${grade})`)) || null;
}

function getSubjectsForTeacherScope() {
  const isWali = appState.activeTeacherId === 'wali-kelas' || appState.activeTeacherId === 't-2';
  return appState.subjects.filter((s) => isWali || s.teacherId === appState.activeTeacherId);
}

function getReportSubjectForClass(className) {
  const grade = getGradeFromClassName(className);
  const mySubjects = getSubjectsForTeacherScope();
  if (!grade) return mySubjects[0] || null;
  return mySubjects.find((s) => s.name.includes(`(Kelas ${grade})`)) || mySubjects[0] || null;
}

function getSubjectsForStudent(student) {
  if (!student) return [];
  const studentClass = (student.class || "").toString().toLowerCase();
  return appState.subjects.filter((sub) => {
    if (!isSubjectValidForStudentClass(sub.name, student.class)) return false;
    const rawTeacher = appState.teachers.find((t) => t.id === sub.teacherId);
    if (!rawTeacher || !rawTeacher.classes) return false;
    const classesStr = typeof rawTeacher.classes === "string"
      ? rawTeacher.classes
      : String(rawTeacher.classes || "");
    const classesList = classesStr.split(",").map((c) => c.trim().toLowerCase());
    return classesList.includes(studentClass);
  });
}

function getActiveStudent() {
  if (appState.selectedStudentId) {
    const byId = appState.students.find((s) => s.id === appState.selectedStudentId);
    if (byId) return byId;
  }
  const query = document.getElementById("student-search-input")?.value.trim().toLowerCase();
  if (!query) return null;
  return appState.students.find((s) => (s.name || "").toLowerCase() === query) || null;
}

function mergeOnlineAssignments(existing = [], incoming = []) {
  const byId = new Map((existing || []).map((a) => [a.id, a]));
  (incoming || []).forEach((a) => {
    const prev = byId.get(a.id) || {};
    byId.set(a.id, {
      ...prev,
      ...a,
      submissions: { ...(prev.submissions || {}), ...(a.submissions || {}) },
    });
  });
  return Array.from(byId.values());
}

function mergeOnlineExams(existing = [], incoming = []) {
  const byId = new Map((existing || []).map((e) => [e.id, e]));
  (incoming || []).forEach((e) => {
    const prev = byId.get(e.id) || {};
    byId.set(e.id, {
      ...prev,
      ...e,
      submissions: { ...(prev.submissions || {}), ...(e.submissions || {}) },
    });
  });
  return Array.from(byId.values());
}

function mergeSubjectsIntoAppState(incomingSubjects) {
  if (!incomingSubjects?.length) return;
  incomingSubjects.forEach((incoming) => {
    const idx = appState.subjects.findIndex((s) => s.id === incoming.id);
    if (idx === -1) {
      appState.subjects.push(incoming);
      return;
    }
    const existing = appState.subjects[idx];
    appState.subjects[idx] = {
      ...existing,
      ...incoming,
      tasksDirectory: { ...(existing.tasksDirectory || {}), ...(incoming.tasksDirectory || {}) },
      onlineAssignments: mergeOnlineAssignments(existing.onlineAssignments, incoming.onlineAssignments),
      onlineExams: mergeOnlineExams(existing.onlineExams, incoming.onlineExams),
    };
  });
}

function getStudyMaterialsForSubject(subjectName) {
  if (STUDY_MATERIALS[subjectName]) return STUDY_MATERIALS[subjectName];
  const ipaMatch = Object.keys(STUDY_MATERIALS).find((key) =>
    subjectName.includes(key) || key.includes((subjectName || "").split(" ")[0])
  );
  return ipaMatch ? STUDY_MATERIALS[ipaMatch] : {};
}

function isRecordedScore(score) {
  return score !== null && score !== undefined && score !== "";
}

function isScoreLacking(score, kkm) {
  if (!isRecordedScore(score)) return true;
  return Number(score) < Number(kkm);
}

function getDefaultTaskHiddenClasses() {
  return [...(appState.classes || [])];
}

function isDirectoryTaskReleased(tDir, className) {
  if (!tDir || !Array.isArray(tDir.hiddenClasses)) return false;
  if (tDir.hiddenClasses.length === 0) return true;
  if (!className || className === "ALL") {
    return tDir.hiddenClasses.length < appState.classes.length;
  }
  return !tDir.hiddenClasses.includes(className);
}

function isDirectoryTaskHidden(tDir, className) {
  return !isDirectoryTaskReleased(tDir, className);
}

function getSubjectGradePrefix(subject) {
  if (!subject?.name) return null;
  if (subject.name.includes("(Kelas 7)")) return "7";
  if (subject.name.includes("(Kelas 8)")) return "8";
  if (subject.name.includes("(Kelas 9)")) return "9";
  return null;
}

function getClassesForSubjectScope(subject, selectedClass = "ALL") {
  const prefix = getSubjectGradePrefix(subject);
  let classes = [...(appState.classes || [])];
  if (prefix) {
    classes = classes.filter((c) => c.startsWith(prefix));
  }
  if (selectedClass && selectedClass !== "ALL") {
    return classes.includes(selectedClass) ? [selectedClass] : [];
  }
  return classes;
}

function groupClassesByGradeLevel(classes) {
  const groups = [
    { label: "Kelas 7", prefix: "7", classes: [] },
    { label: "Kelas 8", prefix: "8", classes: [] },
    { label: "Kelas 9", prefix: "9", classes: [] },
  ];
  classes.forEach((className) => {
    const group = groups.find((g) => className.startsWith(g.prefix));
    if (group) group.classes.push(className);
  });
  return groups.filter((g) => g.classes.length > 0);
}

function renderTaskDirectoryClassToggles(subject, subjectId, itemKey, tDir, selectedClass) {
  const classes = getClassesForSubjectScope(subject, selectedClass);
  const groups = groupClassesByGradeLevel(classes);
  const showGradeLabels = groups.length > 1;

  let html = "";
  groups.forEach((group, groupIndex) => {
    html += `<div class="task-dir-grade-group">`;
    if (showGradeLabels) {
      html += `<span class="task-dir-grade-label" title="${escapeHTML(group.label)}">${escapeHTML(group.prefix)}</span>`;
    }
    html += `<div class="task-dir-class-chips">`;
    group.classes.forEach((className) => {
      const isHidden = isDirectoryTaskHidden(tDir, className);
      html += `
        <button type="button" class="toggle-btn ${!isHidden ? "active" : ""}"
                onclick="toggleItemVisibility('${escapeJSAttr(subjectId)}', '${escapeJSAttr(itemKey)}', 'directory', '${escapeJSAttr(className)}', ${!isHidden}); event.stopPropagation();"
                title="${!isHidden ? "Dirilis untuk " + className : "Belum dirilis untuk " + className}">
          ${escapeHTML(className)}
        </button>
      `;
    });
    html += `</div></div>`;
    if (showGradeLabels && groupIndex < groups.length - 1) {
      html += `<div class="task-dir-grade-divider" aria-hidden="true"></div>`;
    }
  });
  return html;
}

const TASK_DIRECTORY_MODE_META = {
  pg: {
    short: "PG",
    label: "Pilihan Ganda",
    icon: "radio_button_checked",
    description: "Soal otomatis dengan kunci jawaban dan opsi A–D.",
  },
  essay: {
    short: "Essay",
    label: "Essay",
    icon: "edit_note",
    description: "Jawaban tertulis yang dinilai manual oleh guru.",
  },
  buku: {
    short: "Buku",
    label: "Tugas Buku",
    icon: "menu_book",
    description: "Petunjuk kerja dari buku paket beserta halaman rujukan.",
  },
};

function isTaskDirectoryContentComplete(tDir) {
  if (!tDir?.mode) return false;
  if (tDir.mode === "buku") {
    const hasText = !!(tDir.bukuTitle?.trim() || tDir.instruction?.trim());
    const hasPages = !!(String(tDir.bukuPageStart || "").trim() && String(tDir.bukuPageEnd || "").trim());
    return hasText && hasPages;
  }
  if (tDir.mode === "pg" || tDir.mode === "essay") {
    return Array.isArray(tDir.questions) && tDir.questions.some((q) => q.questionText?.trim());
  }
  return false;
}

function getTaskDirectoryStatus(subject, tDir, selectedClass = "ALL") {
  const scopedClasses = getClassesForSubjectScope(subject, selectedClass);
  const isReleased = selectedClass === "ALL"
    ? scopedClasses.length > 0 && scopedClasses.some((className) => isDirectoryTaskReleased(tDir, className))
    : isDirectoryTaskReleased(tDir, selectedClass);
  const hasMode = !!tDir?.mode;
  const isComplete = isTaskDirectoryContentComplete(tDir);

  if (!hasMode) {
    return { kind: "unset", label: "Belum diatur", badgeClass: "unset", hint: "Pilih jenis tugas di panel kanan" };
  }
  if (!isComplete) {
    return {
      kind: "draft",
      label: "Draft",
      badgeClass: "draft",
      hint: "Lengkapi konten tugas lalu simpan",
      mode: tDir.mode,
    };
  }
  if (isReleased) {
    return {
      kind: "released",
      label: "Dirilis",
      badgeClass: "released",
      hint: "Sudah dibuka ke siswa",
      mode: tDir.mode,
    };
  }
  return {
    kind: "ready",
    label: "Siap",
    badgeClass: "ready",
    hint: "Konten lengkap, aktifkan Rilis di kiri untuk membuka ke siswa",
    mode: tDir.mode,
  };
}

function renderTaskDirectoryModeBadge(mode) {
  if (!mode || !TASK_DIRECTORY_MODE_META[mode]) return "";
  const meta = TASK_DIRECTORY_MODE_META[mode];
  return `<span class="task-dir-mode-badge task-dir-mode-badge--${mode}">${escapeHTML(meta.short)}</span>`;
}

function renderTaskDirectoryModePicker(subjectId, chapterName, taskName, activeMode, variant = "segmented") {
  const modes = ["pg", "essay", "buku"];
  if (variant === "cards" && !activeMode) {
    return `
      <div class="task-dir-mode-cards">
        ${modes.map((mode) => {
          const meta = TASK_DIRECTORY_MODE_META[mode];
          return `
            <button type="button" class="task-dir-mode-card task-dir-mode-card--${mode}"
              onclick="selectTaskDirectoryMode('${escapeJSAttr(subjectId)}', '${escapeJSAttr(chapterName)}', '${escapeJSAttr(taskName)}', '${mode}')">
              <span class="material-symbols-rounded">${meta.icon}</span>
              <strong>${escapeHTML(meta.label)}</strong>
              <span>${escapeHTML(meta.description)}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  return `
    <div class="task-dir-mode-segmented" role="group" aria-label="Jenis tugas">
      ${modes.map((mode) => {
        const meta = TASK_DIRECTORY_MODE_META[mode];
        return `
          <button type="button"
            class="task-dir-mode-seg task-dir-mode-seg--${mode} ${activeMode === mode ? "active" : ""}"
            onclick="selectTaskDirectoryMode('${escapeJSAttr(subjectId)}', '${escapeJSAttr(chapterName)}', '${escapeJSAttr(taskName)}', '${mode}')">
            <span class="material-symbols-rounded">${meta.icon}</span>
            ${escapeHTML(meta.short)}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderTaskDirectoryStatusStrip(subject, tDir, selectedClass = "ALL") {
  const status = getTaskDirectoryStatus(subject, tDir, selectedClass);
  const modeBadge = status.mode ? renderTaskDirectoryModeBadge(status.mode) : "";
  return `
    <div class="task-dir-status-strip task-dir-status-strip--${status.badgeClass}">
      ${modeBadge}
      <span class="task-dir-status-badge task-dir-status-badge--${status.badgeClass}">${escapeHTML(status.label)}</span>
      <span class="task-dir-status-hint">${escapeHTML(status.hint)}</span>
    </div>
  `;
}

function ensureTaskDirectoryEntry(subject, key) {
  if (!subject.tasksDirectory) subject.tasksDirectory = {};
  if (!subject.tasksDirectory[key]) {
    subject.tasksDirectory[key] = { hiddenClasses: getDefaultTaskHiddenClasses() };
  } else if (!Array.isArray(subject.tasksDirectory[key].hiddenClasses)) {
    subject.tasksDirectory[key].hiddenClasses = getDefaultTaskHiddenClasses();
  }
  return subject.tasksDirectory[key];
}

function normalizeTaskDirectories() {
  const allHidden = getDefaultTaskHiddenClasses();
  appState.subjects.forEach((sub) => {
    if (!sub.tasksDirectory) return;
    Object.keys(sub.tasksDirectory).forEach((key) => {
      const entry = sub.tasksDirectory[key];
      if (!entry || typeof entry !== "object") return;
      if (!Array.isArray(entry.hiddenClasses)) {
        entry.hiddenClasses = [...allHidden];
      }
    });
  });
}

function migrateTaskDirectoryReleaseDefaults() {
  if (localStorage.getItem("sigrade_task_default_unreleased_v1") === "true") return;
  const allHidden = getDefaultTaskHiddenClasses();
  let changed = false;
  appState.subjects.forEach((sub) => {
    if (!sub.tasksDirectory) return;
    Object.keys(sub.tasksDirectory).forEach((key) => {
      const entry = sub.tasksDirectory[key];
      if (!entry || !Array.isArray(entry.hiddenClasses)) return;
      if (entry.hiddenClasses.length === 0) {
        entry.hiddenClasses = [...allHidden];
        changed = true;
      }
    });
  });
  localStorage.setItem("sigrade_task_default_unreleased_v1", "true");
  if (changed) saveData({ silent: true });
  recalculateAllStudentsCompleteness();
}

function createEmptyChapterGrades() {
  return { tasks: {} };
}

function createEmptySubjectGrades() {
  return { chapters: {} };
}

function ensureChapterGrades(student, subjectId, chapterName) {
  if (!student.grades) student.grades = {};
  if (!student.grades[subjectId]) student.grades[subjectId] = createEmptySubjectGrades();
  if (!student.grades[subjectId].chapters[chapterName]) {
    student.grades[subjectId].chapters[chapterName] = createEmptyChapterGrades();
  }
  return student.grades[subjectId].chapters[chapterName];
}

function buildEmptyStudentGrades() {
  const grades = {};
  const completeness = {};
  appState.subjects.forEach((sub) => {
    completeness[sub.id] = false;
    grades[sub.id] = createEmptySubjectGrades();
  });
  return { grades, completeness };
}

function recalculateSubjectCompleteness(student, subjectId) {
  const subject = appState.subjects.find((s) => s.id === subjectId);
  if (!subject) return;
  if (!student.completeness) student.completeness = {};

  const className = student.class;
  let hasReleasedWork = false;
  let allReleasedComplete = true;

  (subject.chapters || []).forEach((ch) => {
    const sCh = student.grades?.[subjectId]?.chapters?.[ch.name] || { tasks: {} };

    (ch.tasks || []).forEach((taskName) => {
      const dirKey = `${ch.name}_${taskName}`;
      const tDir = subject.tasksDirectory?.[dirKey];
      if (!isDirectoryTaskReleased(tDir, className)) return;
      hasReleasedWork = true;
      if (isScoreLacking(sCh.tasks?.[taskName], subject.kkm)) allReleasedComplete = false;
    });

    const ulDirKey = `${ch.name}_Ulangan`;
    const ulDir = subject.tasksDirectory?.[ulDirKey];
    if (isDirectoryTaskReleased(ulDir, className)) {
      hasReleasedWork = true;
      if (isScoreLacking(sCh.ulangan, subject.kkm)) allReleasedComplete = false;
    }
  });

  student.completeness[subjectId] = !hasReleasedWork || allReleasedComplete;
}

function recalculateAllStudentsCompleteness() {
  appState.students.forEach((student) => {
    appState.subjects.forEach((sub) => {
      if (!isSubjectValidForStudentClass(sub.name, student.class)) return;
      recalculateSubjectCompleteness(student, sub.id);
    });
  });
}

function hasAnyRecordedGradesForSubject(student, subjectId) {
  const sGrades = student.grades?.[subjectId];
  if (!sGrades?.chapters) return false;

  for (const chName in sGrades.chapters) {
    const ch = sGrades.chapters[chName];
    if (!ch) continue;
    if (ch.tasks) {
      for (const taskName in ch.tasks) {
        if (isRecordedScore(ch.tasks[taskName])) return true;
      }
    }
    if (isRecordedScore(ch.ulangan) || isRecordedScore(ch.tugasAkhir)) return true;
  }
  return false;
}
window.isSubjectValidForStudentClass = isSubjectValidForStudentClass;

function getTermSuffix() {
  if (!appState.academicYear || !appState.semester) return "2026-2027_ganjil (i)";
  const yearStr = appState.academicYear.replace(/\//g, "-");
  const semStr = normalizeSemesterValue(appState.semester).toLowerCase();
  return `${yearStr}_${semStr}`;
}
window.getTermSuffix = getTermSuffix;

async function loadDataFromApi() {
  try {
    const data = await ApiClient.public.bootstrap();
    if (!data || (!data.students?.length && !data.subjects?.length)) return false;

    appState.academicYear = data.academicYear || appState.academicYear;
    appState.semester = data.semester || appState.semester;
    appState.publishGrades = data.publishGrades !== false;
    appState.classes = data.classes || [];
    appState.teachers = data.teachers || [];
    appState.subjects = data.subjects || [];
    appState.students = data.students || [];

    normalizeLoadedAppState();

    window.__apiMode = true;
    applyLoadedDataSideEffects();
    return true;
  } catch (err) {
    console.warn('Public API tidak tersedia, gunakan localStorage:', err.message);
    window.__apiMode = false;
    return false;
  }
}
window.loadDataFromApi = loadDataFromApi;

function applyLoadedDataSideEffects() {
  const suffix = getTermSuffix();
  const termLabel = document.getElementById("active-term-label");
  if (termLabel) {
    termLabel.innerText = `${appState.academicYear} - ${appState.semester}`;
  }

  populateClassSelect();

  const activeRole = sessionStorage.getItem("active_teacher_role");
  if (activeRole) {
    appState.activeTeacherId = activeRole;
  }
}

function loadData() {
  // Version key ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â bump this string to force a clean reset for all users
  if (localStorage.getItem("sigrade_csv_mode_v1") !== "true") {
    localStorage.removeItem("sigrade_subjects");
    localStorage.removeItem("sigrade_students");
    localStorage.removeItem("sigrade_classes");
    localStorage.removeItem("sigrade_teachers");
    localStorage.removeItem("sigrade_imported_kelas_c");
    localStorage.removeItem("sigrade_imported_kelas_c_reset_v4");
    localStorage.removeItem("sigrade_imported_distinct_classes_v3");
    localStorage.removeItem("sigrade_ipa_4_bab_v1");
    localStorage.setItem("sigrade_csv_mode_v1", "true");
  }

  // Load the active term settings
  const termData = localStorage.getItem("sigrade_active_term");
  if (termData) {
    try {
      const parsed = JSON.parse(termData);
      appState.academicYear = parsed.academicYear || "2026/2027";
      appState.semester = normalizeSemesterValue(parsed.semester || "Ganjil (I)");
    } catch(e) {}
  } else {
    appState.academicYear = "2026/2027";
    appState.semester = "Ganjil (I)";
  }

  // Update UI indicator
  const termLabel = document.getElementById("active-term-label");
  if (termLabel) {
    termLabel.innerText = `${appState.academicYear} - ${appState.semester}`;
  }

  const suffix = getTermSuffix();

  // MIGRATION: If suffixed keys don't exist but unsuffixed DO exist, copy them over
  if (!localStorage.getItem(`sigrade_students_${suffix}`) && localStorage.getItem("sigrade_students")) {
    localStorage.setItem(`sigrade_teachers_${suffix}`, localStorage.getItem("sigrade_teachers") || "[]");
    localStorage.setItem(`sigrade_subjects_${suffix}`, localStorage.getItem("sigrade_subjects") || "[]");
    localStorage.setItem(`sigrade_students_${suffix}`, localStorage.getItem("sigrade_students") || "[]");
    localStorage.setItem(`sigrade_classes_${suffix}`, localStorage.getItem("sigrade_classes") || "[]");
  }

  const tData = localStorage.getItem(`sigrade_teachers_${suffix}`);
  const sData = localStorage.getItem(`sigrade_subjects_${suffix}`);
  const stData = localStorage.getItem(`sigrade_students_${suffix}`);
  const pubData = localStorage.getItem("sigrade_publish_grades");

  if (tData && sData && stData) {
    try {
      appState.teachers = JSON.parse(tData);
      
      // Auto-format Teacher Names to Title Case
      appState.teachers.forEach(t => {
        if (t.name) t.name = formatTeacherNameTitleCase(t.name);
      });

      appState.subjects = JSON.parse(sData); 
      appState.students = JSON.parse(stData); 

      normalizeLoadedAppState();

    } catch (e) {
      console.error("Failed to parse LocalStorage records, resetting", e);
      resetToDefault();
    }
  } else {
    resetToDefault();
  }

  if (pubData !== null) {
    appState.publishGrades = pubData === "true";
  } else {
    appState.publishGrades = true;
  }

  const cData = localStorage.getItem(`sigrade_classes_${suffix}`);
  if (cData) {
    try {
      appState.classes = JSON.parse(cData);
    } catch(e) {
      appState.classes = [];
    }
  } else {
    appState.classes = [];
  }

  const activeRole = sessionStorage.getItem("active_teacher_role");
  if (activeRole) {
    appState.activeTeacherId = activeRole;
  }

  writeLocalState();
  normalizeTaskDirectories();
  migrateTaskDirectoryReleaseDefaults();
  recalculateAllStudentsCompleteness();
}

function saveData(options = {}) {
  const silent = options.silent === true;
  writeLocalState();
  scheduleServerSync();

  if (silent || appState.currentView !== "guru") {
    return;
  }

  updateTeacherStats();
  populateTeacherClassFilter();
  if (appState.teacherActiveTab === "nilai") {
    renderStudentTable();
    renderIncompleteStudentsList();
  } else if (appState.teacherActiveTab === "tugas-daring") {
    renderTeacherAssignmentsList();
  } else if (appState.teacherActiveTab === "ujian-cbt") {
    renderTeacherExamsList();
    renderTeacherQuestionBankList();
  } else if (appState.teacherActiveTab === "config") {
    renderConfigTab();
  } else if (appState.teacherActiveTab === "kesiswaan") {
    renderKesiswaanTab();
  } else if (appState.teacherActiveTab === "direktori-tugas") {
    renderTasksDirectoryTab();
  }
}

function writeLocalState() {
  const suffix = getTermSuffix();
  const termPayload = JSON.stringify({
    academicYear: appState.academicYear,
    semester: appState.semester,
  });
  const teachersJson = JSON.stringify(appState.teachers);
  const subjectsJson = JSON.stringify(appState.subjects);
  const studentsJson = JSON.stringify(appState.students);
  const classesJson = JSON.stringify(appState.classes || []);
  const publishStr = appState.publishGrades.toString();

  window.__isSyncing = true;
  localStorage.setItem("sigrade_active_term", termPayload);
  localStorage.setItem(`sigrade_teachers_${suffix}`, teachersJson);
  localStorage.setItem(`sigrade_subjects_${suffix}`, subjectsJson);
  localStorage.setItem(`sigrade_students_${suffix}`, studentsJson);
  localStorage.setItem(`sigrade_classes_${suffix}`, classesJson);
  localStorage.setItem("sigrade_publish_grades", publishStr);
  // Legacy keys — tetap diisi agar migrasi lama tidak pecah
  localStorage.setItem("sigrade_teachers", teachersJson);
  localStorage.setItem("sigrade_subjects", subjectsJson);
  localStorage.setItem("sigrade_students", studentsJson);
  localStorage.setItem("sigrade_classes", classesJson);
  window.__isSyncing = false;
}

function buildServerStatePayload() {
  return {
    academicYear: appState.academicYear,
    semester: appState.semester,
    publishGrades: appState.publishGrades,
    teachers: appState.teachers,
    subjects: appState.subjects,
    students: appState.students,
    classes: appState.classes,
  };
}

let saveServerTimer = null;
let saveServerInFlight = null;

function canSyncToServer() {
  if (typeof ApiClient === 'undefined') return false;
  if (ApiClient.admin.isAuthenticated()) return true;
  if (window.__apiMode && ApiClient.teacher.isAuthorized()) return true;
  return false;
}

function scheduleServerSync() {
  if (!canSyncToServer()) {
    return;
  }
  clearTimeout(saveServerTimer);
  saveServerTimer = setTimeout(() => {
    flushServerSync().catch((err) => {
      console.warn('Gagal sinkron ke server:', err.message);
    });
  }, 450);
}

async function flushServerSync() {
  if (!canSyncToServer()) {
    return;
  }
  if (typeof ApiClient === 'undefined') {
    return;
  }

  if (saveServerInFlight) {
    return saveServerInFlight;
  }

  const payload = buildServerStatePayload();

  saveServerInFlight = (async () => {
    if (ApiClient.admin.isAuthenticated()) {
      await ApiClient.admin.saveState(payload);
      return;
    }
    if (window.__apiMode && ApiClient.teacher.isAuthorized()) {
      await ApiClient.teacher.saveState(payload);
      return;
    }
  })();

  try {
    await saveServerInFlight;
  } finally {
    saveServerInFlight = null;
  }
}

window.flushServerSync = flushServerSync;
window.scheduleServerSync = scheduleServerSync;
window.writeLocalState = writeLocalState;

function resetToDefault() {
  appState.teachers = JSON.parse(JSON.stringify(INITIAL_TEACHERS));
  appState.subjects = JSON.parse(JSON.stringify(INITIAL_SUBJECTS));
  appState.students = [];
  appState.classes = [];
  appState.publishGrades = true;
  appState.teacherClassFilter = null;
  appState.kesiswaanClassFilter = null;
  appState.katrolClassFilter = null;

  writeLocalState();
  flushServerSync().catch((err) => console.warn('Gagal sinkron reset ke server:', err.message));

  populateClassSelect();

  if (appState.currentView === "guru") {
    updateTeacherStats();
    renderStudentTable();
    renderIncompleteStudentsList();
    renderConfigTab();
    renderPublishToggleState();
  }
}

// --- GRADE CALCULATION ENGINE V6 ---
function ensureStudentGradeStructures() {
  appState.students.forEach((st) => {
    if (!st.completeness) st.completeness = {};
    if (!st.grades) st.grades = {};
    appState.subjects.forEach((sub) => {
      if (st.completeness[sub.id] === undefined) st.completeness[sub.id] = false;
      if (!st.grades[sub.id]) st.grades[sub.id] = createEmptySubjectGrades();
    });
  });
}
window.ensureStudentGradeStructures = ensureStudentGradeStructures;

function migrateIpaSplitSubjects() {
  const oldIpaIndex = appState.subjects.findIndex((s) => s.id === 'sub-2');
  if (oldIpaIndex === -1) return false;

  const oldIpa = appState.subjects[oldIpaIndex];
  appState.subjects.splice(oldIpaIndex, 1);
  const newSubjects = [
    { ...JSON.parse(JSON.stringify(oldIpa)), id: 'sub-2-7', name: 'IPA (Kelas 7)' },
    { ...JSON.parse(JSON.stringify(oldIpa)), id: 'sub-2-8', name: 'IPA (Kelas 8)' },
    { ...JSON.parse(JSON.stringify(oldIpa)), id: 'sub-2-9', name: 'IPA (Kelas 9)' },
  ];
  newSubjects.forEach((newSub) => {
    if (!appState.subjects.find((s) => s.id === newSub.id)) {
      appState.subjects.push(newSub);
    }
  });

  appState.students.forEach((st) => {
    if (st.grades && st.grades['sub-2']) {
      const oldGrades = st.grades['sub-2'];
      st.grades['sub-2-7'] = JSON.parse(JSON.stringify(oldGrades));
      st.grades['sub-2-8'] = JSON.parse(JSON.stringify(oldGrades));
      st.grades['sub-2-9'] = JSON.parse(JSON.stringify(oldGrades));
      delete st.grades['sub-2'];
    }
    if (st.completeness && st.completeness['sub-2'] !== undefined) {
      const oldComp = st.completeness['sub-2'];
      st.completeness['sub-2-7'] = oldComp;
      st.completeness['sub-2-8'] = oldComp;
      st.completeness['sub-2-9'] = oldComp;
      delete st.completeness['sub-2'];
    }
  });
  return true;
}

function normalizeLoadedAppState() {
  appState.semester = normalizeSemesterValue(appState.semester);

  appState.teachers.forEach((t) => {
    if (t.name) t.name = formatTeacherNameTitleCase(t.name);
  });

  migrateIpaSplitSubjects();

  appState.students.forEach((st) => {
    if (st.gender === undefined) st.gender = '-';
    if (st.absentNo === undefined) st.absentNo = '-';
    if (st.name) st.name = st.name.toUpperCase();
  });
  appState.students = appState.students.filter((st) => st && st.name && st.name.trim() !== '');

  appState.subjects.forEach((sub) => {
    if (!sub.onlineAssignments) sub.onlineAssignments = [];
    if (!sub.onlineExams) sub.onlineExams = [];
    if (!sub.tasksDirectory) sub.tasksDirectory = {};
    if (sub.chapters) {
      sub.chapters.forEach((ch) => {
        if (ch.targetMaxWeight === undefined) ch.targetMaxWeight = 30;
      });
    }
  });

  ensureStudentGradeStructures();
  normalizeTaskDirectories();
  migrateTaskDirectoryReleaseDefaults();
  recalculateAllStudentsCompleteness();
}
window.normalizeLoadedAppState = normalizeLoadedAppState;

function hydrateAppStateFromServer(state) {
  if (!state) return;
  appState.academicYear = state.academicYear || appState.academicYear;
  appState.semester = state.semester || appState.semester;
  appState.publishGrades = state.publishGrades !== false;
  appState.teachers = state.teachers || [];
  appState.subjects = state.subjects || [];
  appState.students = state.students || [];
  appState.classes = state.classes || [];
  normalizeLoadedAppState();
  applyLoadedDataSideEffects();
}
window.hydrateAppStateFromServer = hydrateAppStateFromServer;

function calculateStudentSubjectScore(student, subjectId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return { asli: 0, akhir: 0, isKatrol: false, kkm: 0, chapters: [] };
  if (!student.grades) return { asli: 0, akhir: 0, isKatrol: false, kkm: subject.kkm || 0, chapters: [] };

  const sGrades = student.grades[subjectId] || { chapters: {} };
  const chapters = subject.chapters || [];
  
  let totalChaptersAverageSum = 0;
  let chCount = 0;

  const chDetails = chapters.map(ch => {
    const chTasks = ch.tasks || [];
    const sChGrades = sGrades.chapters && sGrades.chapters[ch.name]
      ? sGrades.chapters[ch.name]
      : createEmptyChapterGrades();
    const sTasks = sChGrades.tasks || {};
    
    if (!ch.weights) ch.weights = {};
    
    let weightedScoreSum = 0;
    let weightSum = 0;

    const taskDetails = chTasks.map(t => {
      const tScore = sTasks[t];
      const tWeight = ch.weights[t] !== undefined ? parseInt(ch.weights[t], 10) : 1;
      if (isRecordedScore(tScore)) {
        weightedScoreSum += tScore * tWeight;
        weightSum += tWeight;
      }
      return { name: t, score: isRecordedScore(tScore) ? tScore : null, weight: tWeight };
    });

    const ulScore = sChGrades.ulangan;
    const ulWeight = ch.weights['ulangan'] !== undefined ? parseInt(ch.weights['ulangan'], 10) : 1;
    if (isRecordedScore(ulScore)) {
      weightedScoreSum += ulScore * ulWeight;
      weightSum += ulWeight;
    }

    const chAvg = weightSum > 0 ? Math.round((weightedScoreSum / weightSum) * 10) / 10 : null;
    if (chAvg !== null) {
      totalChaptersAverageSum += chAvg;
      chCount++;
    }

    return {
      name: ch.name,
      tasks: taskDetails,
      ulangan: isRecordedScore(ulScore) ? ulScore : null,
      average: chAvg,
      weights: ch.weights
    };
  });

  const nilaiAsli = chCount > 0 ? Math.round((totalChaptersAverageSum / chCount) * 10) / 10 : 0;
  const hasRecordedScores = chDetails.some((ch) => ch.average !== null);
  const isKatrol = hasRecordedScores && nilaiAsli < subject.kkm;
  const nilaiAkhir = isKatrol ? subject.kkm : nilaiAsli;

  return {
    asli: nilaiAsli,
    akhir: nilaiAkhir,
    isKatrol,
    kkm: subject.kkm,
    chapters: chDetails
  };
}

function getOverallStudentCompleteness(student) {
  let activeSubjects = [];
  try {
    activeSubjects = getSubjectsForStudent(student);
  } catch (err) {
    console.error("Error in filtering active subjects:", err);
    activeSubjects = [];
  }
  
  if (activeSubjects.length === 0) return { total: 0, completed: 0, percentage: 0, isAllComplete: false, hasNoSubjects: true };

  let completed = 0;
  activeSubjects.forEach(sub => {
    const isComplete = isStudentSubjectComplete(student, sub.id);
    if (!student.completeness) student.completeness = {};
    if (student.completeness[sub.id] === true || isComplete) {
      completed++;
      student.completeness[sub.id] = true;
    } else {
      student.completeness[sub.id] = false;
    }
  });

  const percentage = Math.round((completed / activeSubjects.length) * 100);
  return {
    total: activeSubjects.length,
    completed,
    percentage,
    isAllComplete: completed === activeSubjects.length,
    hasNoSubjects: false
  };
}

function getStudentOverallAverage(student) {
  const activeSubjects = getSubjectsForStudent(student);
  if (activeSubjects.length === 0) return null;

  let sum = 0;
  let counted = 0;
  activeSubjects.forEach((sub) => {
    if (!hasAnyRecordedGradesForSubject(student, sub.id)) return;
    const grades = calculateStudentSubjectScore(student, sub.id);
    sum += grades.asli;
    counted++;
  });

  if (counted === 0) return null;
  return Math.round((sum / counted) * 10) / 10;
}

// --- SIDEBAR NAVIGATION LOGIC ---
function toggleAppSidebar(event) {
  if (event) event.stopPropagation();
  const sidebar = document.getElementById("app-sidebar");
  if (!sidebar) return;
  const isExpanded = sidebar.classList.toggle("expanded");
  localStorage.setItem("sidebar_expanded", isExpanded ? "true" : "false");
  
  // Dispatch a window resize event to trigger layout adjustments on grids
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 300);
}

function switchSidebarView(viewName, tabName) {
  if (viewName === "siswa") {
    switchView(viewName);
    syncSidebarActiveState();
    return;
  }
  
  if (viewName === "guru") {
    const isAuthenticated = sessionStorage.getItem("teacher_authenticated") === "true";
    const hasRole = sessionStorage.getItem("active_teacher_role");
    
    if (!isAuthenticated || !hasRole) {
      // Store intended redirect target
      sessionStorage.setItem("intended_sidebar_tab", tabName || "nilai");
      switchView("guru");
      return;
    }
    
    switchView("guru");
    if (tabName) {
      switchTeacherTab(tabName);
    }
    syncSidebarActiveState();
  }
}

function syncSidebarActiveState() {
  const currentView = appState.currentView;
  const activeTab = appState.teacherActiveTab;
  
  document.querySelectorAll(".sidebar-nav-item").forEach(item => {
    const itemView = item.getAttribute("data-view");
    const itemTab = item.getAttribute("data-tab");
    
    let isActive = false;
    if (!itemView || itemView === currentView) {
      if (currentView === "guru") {
        isActive = (itemTab === activeTab);
      } else {
        isActive = (itemTab === "dashboard");
      }
    }
    item.classList.toggle("active", isActive);
  });
}

// --- VIEW CONTROLLER ---
const TEACHER_PASSWORD = "guru123";

function syncModeToggleActive(viewName) {
  const mode = viewName || sessionStorage.getItem('sigrade_mode_intent') || 'siswa';
  sessionStorage.setItem('sigrade_mode_intent', mode);
  document.querySelectorAll(".mode-toggle-group .toggle-btn[data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === mode);
  });
  document.body.classList.toggle('mode-guru-intent', mode === 'guru');
}

function switchView(viewName) {
  if (viewName === "siswa") {
    syncModeToggleActive("siswa");
  }

  if (viewName === "siswa" && appState.currentView === "siswa") {
    // Jika sudah di tampilan siswa dan tombol siswa diklik lagi, reset pencarian (kembali memilih kelas & nama)
    if (typeof resetStudentSearchUI === "function") {
      resetStudentSearchUI();
    }
  }

  if (viewName === "guru") {
    syncModeToggleActive("guru");

    const isAuthenticated = sessionStorage.getItem("teacher_authenticated") === "true";
    const hasRole = sessionStorage.getItem("active_teacher_role");
    
    if (isAuthenticated && hasRole) {
      actualSwitchView(viewName);
      return;
    }

    if (!window.__adminAuthenticated && typeof window.requireAdminAuth === 'function') {
      window.requireAdminAuth();
      return;
    }
    
    if (!hasRole || !isAuthenticated) {
      openRoleSelectionModal();
      return;
    }
  }
  
  actualSwitchView(viewName);
}

// Helper to toggle tab button and its tooltip wrapper visibility V7
function toggleTabButton(tabName, show) {
  // Update both header symbol buttons AND dropdown items items
  document.querySelectorAll(`.teacher-tab-btn[data-tab="${tabName}"]`).forEach(btn => {
    btn.style.display = show ? "" : "none";
    if (btn.parentElement && btn.parentElement.classList.contains("tooltip-wrapper")) {
      btn.parentElement.style.display = show ? "inline-flex" : "none";
    }
  });

  // Update sidebar navigation items
  document.querySelectorAll(`.sidebar-nav-item[data-tab="${tabName}"]`).forEach(btn => {
    btn.style.display = show ? "flex" : "none";
  });

  // Also sync standalone dropdown item (has its own id)
  const dropItem = document.getElementById(`dropdown-item-${tabName}`);
  if (dropItem) dropItem.style.display = show ? "flex" : "none";
}

// ---- SIGRADE NAV EXPANDABLE TABS ----
function toggleSigradeDropdown(event) {
  if (!appState.activeTeacherId) return; // Only works when teacher is logged in
  event.stopPropagation();
  const logoBtn = document.getElementById("sigrade-logo-btn");
  const headerTabs = document.getElementById("header-teacher-tabs");
  if (!headerTabs) return;
  const isOpen = headerTabs.classList.contains("expanded");
  if (isOpen) {
    closeSigradeDropdown();
  } else {
    headerTabs.classList.add("expanded");
    logoBtn && logoBtn.classList.add("dropdown-open");
  }
}

function closeSigradeDropdown() {
  const logoBtn = document.getElementById("sigrade-logo-btn");
  const headerTabs = document.getElementById("header-teacher-tabs");
  if (headerTabs) {
    headerTabs.classList.remove("expanded");
  }
  logoBtn && logoBtn.classList.remove("dropdown-open");
}

function adjustLayoutForMultiPintu(viewName) {
  // Remove any existing standalone headers first
  document.querySelectorAll(".standalone-nav-bar").forEach(el => el.remove());

  // Clean body theme class
  document.body.classList.remove("clean-shop-theme", "clean-edu-theme", "clean-admin-theme");
}

function actualSwitchView(viewName) {
  appState.currentView = viewName;
  adjustLayoutForMultiPintu(viewName);
  
  // Toggle shrunken floating header style for student view only
  const headerEl = document.querySelector("header");
  if (headerEl) {
    headerEl.classList.toggle("student-header-shrink", viewName === "siswa");
  }
  
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.toggle("active", sec.id === `${viewName}-view`);
  });

  // Toggle Global Header Logout Button V6
  const logoutBtn = document.getElementById("header-logout-btn");
  if (logoutBtn) {
    logoutBtn.classList.toggle("d-none", viewName !== "guru");
  }

  // Toggle Global Header Teacher Stats Strip V6
  const headerStats = document.getElementById("header-teacher-stats");
  if (headerStats) {
    headerStats.classList.toggle("d-none", viewName !== "guru" || !appState.activeTeacherId);
  }

  // Toggle Global Header Teacher Tabs Strip V7
  const headerTabs = document.getElementById("header-teacher-tabs");
  if (headerTabs) {
    headerTabs.classList.toggle("d-none", viewName !== "guru" || !appState.activeTeacherId);
  }

  // Toggle Publish Grades Toggle in Header (Teacher View only)
  const publishToggle = document.getElementById("publish-grades-toggle-container");
  const printBtn = document.getElementById("print-grades-btn");
  if (publishToggle) {
    const showToggle = viewName === "guru" && !!appState.activeTeacherId;
    publishToggle.classList.toggle("d-none", !showToggle);
  }
  if (printBtn) {
    const showPrint = viewName === "guru" && !!appState.activeTeacherId;
    printBtn.classList.toggle("d-none", !showPrint);
  }

  const mainTag = document.querySelector("main");
  if (mainTag) {
    mainTag.classList.toggle("widescreen-mode", (viewName === "guru" && !!appState.activeTeacherId) || viewName === "siswa");
  }
  document.body.classList.toggle("teacher-view-active", viewName === "guru" && !!appState.activeTeacherId);

  if (viewName === "guru") {
    const tabNav = document.querySelector(".teacher-tab-nav");
    const delAllBtn = document.getElementById("teacher-delete-all-btn");
    if (appState.activeTeacherId === "t-2") {
      // Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd gets full admin privileges
      if (tabNav) tabNav.style.display = "flex";
      document.getElementById("teacher-add-student-btn").style.display = "inline-flex";
      if (delAllBtn) delAllBtn.style.display = "inline-flex";
      toggleTabButton("config", true);
    } else if (appState.activeTeacherId === "wali-kelas") {
      // Wali Kelas: cannot add/config
      if (tabNav) tabNav.style.display = "flex";
      document.getElementById("teacher-add-student-btn").style.display = "none";
      if (delAllBtn) delAllBtn.style.display = "none";
      toggleTabButton("config", false);
      if (appState.teacherActiveTab === "config" || appState.teacherActiveTab === "katrol") {
        appState.teacherActiveTab = "nilai";
      }
    } else {
      // Ordinary Teacher: can manage their own Tugas Daring & CBT, and configure Bobot Bab
      if (tabNav) tabNav.style.display = "flex";
      document.getElementById("teacher-add-student-btn").style.display = "none";
      if (delAllBtn) delAllBtn.style.display = "none";
      toggleTabButton("config", true);
      
      // Reset active tab to nilai if they were previously in katrol
      if (appState.teacherActiveTab === "katrol") {
        appState.teacherActiveTab = "nilai";
      }
    }

    renderProfileHeaderBadge();
    updateTeacherToggleBtn();
    renderClassTabs();
    switchTeacherTab(appState.teacherActiveTab);
    updateTeacherStats();
    renderPublishToggleState();
  }
  syncSidebarActiveState();

  // Sync URL hash for SPA routing (dengan lock untuk mencegah hashchange loop)
  const targetHash = (viewName === "siswa") ? "#/" : `#/${viewName}`;
  if (window.location.hash !== targetHash) {
    _isRoutingLocked = true;
    window.history.pushState(null, "", targetHash);
    // Release lock setelah event loop selesai (hashchange tidak akan dipicu oleh pushState,
    // tapi kita lock sebagai perlindungan ekstra)
    setTimeout(() => { _isRoutingLocked = false; }, 100);
  }
}

function switchTeacherTab(tabName) {
  appState.teacherActiveTab = tabName;
  
  document.querySelectorAll(".teacher-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.querySelectorAll(".teacher-tab-content").forEach(cont => {
    cont.classList.toggle("active", cont.id === `teacher-tab-${tabName}`);
  });

  // Close dropdown after selecting a tab
  closeSigradeDropdown();

  if (tabName === "nilai") {
    renderStudentTableHeaders();
    renderStudentTable();
    renderIncompleteStudentsList();
    renderTeacherRightPane(); // Re-sync Sisi Kanan V6
  } else if (tabName === "tugas-daring") {
    populateTeacherDashboardOptions();
    if (!appState.builderQuestions || appState.builderQuestions.length === 0) {
      appState.builderQuestions = [];
      addBuilderQuestion("pg");
    } else {
      renderBuilderQuestions();
    }
    renderTeacherAssignmentsList();
  } else if (tabName === "ujian-cbt") {
    populateTeacherDashboardOptions();
    renderTeacherExamsList();
    renderTeacherQuestionBankList();
    toggleQuestionOptions("pg");
  } else if (tabName === "config") {
    renderConfigTab();
  } else if (tabName === "kesiswaan") {
    renderKesiswaanTab();
  } else if (tabName === "direktori-tugas") {
    renderTasksDirectoryTab();
  } else if (tabName === "direktori-nilai") {
    renderReportTableOptions();
    renderReportTable();
  } else if (tabName === "dashboard") {
    renderTeacherDashboard();
  }
  syncSidebarActiveState();
  renderClassTabs(); // Update sidebar class section visibility
}

// --- SECURITY & ROLE MANAGEMENT ---
function openAuthModal() {
  document.getElementById("auth-password").value = "";
  document.getElementById("auth-error-msg").style.display = "none";
  document.getElementById("auth-modal").classList.add("active");
  setTimeout(() => {
    const pwdInput = document.getElementById("auth-password");
    if (pwdInput) pwdInput.focus();
  }, 100);
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.remove("active");
  sessionStorage.removeItem("intended_sidebar_tab");
  if (sessionStorage.getItem("teacher_authenticated") !== "true") {
    sessionStorage.removeItem("active_teacher_role");
    appState.activeTeacherId = null;
  }
  syncModeToggleActive(sessionStorage.getItem('sigrade_mode_intent') || 'siswa');
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const pwdInput = document.getElementById("auth-password").value;
  if (pwdInput === TEACHER_PASSWORD) {
    sessionStorage.setItem("teacher_authenticated", "true");
    if (typeof ApiClient !== 'undefined') {
      ApiClient.teacher.setKey(pwdInput);
    }
    document.getElementById("auth-modal").classList.remove("active");
    
    const intendedTab = sessionStorage.getItem("intended_sidebar_tab");
    if (intendedTab) {
      sessionStorage.removeItem("intended_sidebar_tab");
      appState.teacherActiveTab = intendedTab;
    }
    
    actualSwitchView("guru");
  } else {
    document.getElementById("auth-error-msg").style.display = "block";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-password").focus();
  }
}

function openRoleSelectionModal() {
  syncModeToggleActive("guru");

  const headerStats = document.getElementById("header-teacher-stats");
  if (headerStats) {
    headerStats.classList.add("d-none");
  }
  const headerTabs = document.getElementById("header-teacher-tabs");
  if (headerTabs) {
    headerTabs.classList.add("d-none");
  }

  const select = document.getElementById("role-selector-select");
  select.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';

  const label = document.getElementById("role-trigger-label");
  if (label) {
    label.textContent = '-- Pilih Nama Anda --';
    label.classList.add('placeholder');
  }
  const trigger = document.getElementById("role-dropdown-trigger");
  if (trigger) trigger.classList.add("needs-rebuild");

  appState.teachers.forEach(t => {
    const tSubjects = appState.subjects.filter(s => s.teacherId === t.id).map(s => s.name).join(", ");
    const displaySubject = t.subjectDesc ? t.subjectDesc : tSubjects;
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.innerText = `👩‍🏫 ${t.name} ${displaySubject ? `(${displaySubject})` : ""}`;
    select.appendChild(opt);
  });

  const isAuthenticated = sessionStorage.getItem("teacher_authenticated") === "true";
  const pwdGroup = document.getElementById("role-password-group");
  const pwdInput = document.getElementById("role-password-input");
  const errEl = document.getElementById("role-password-error-msg");
  
  if (errEl) errEl.style.display = "none";
  if (pwdInput) pwdInput.value = "";
  
  if (pwdGroup && pwdInput) {
    // Sembunyikan secara default sampai guru dipilih
    pwdGroup.style.display = "none";
    pwdInput.removeAttribute("required");
  }

  // Event listener untuk memunculkan password saat guru dipilih
  select.onchange = (e) => {
    if (e.target.value && !isAuthenticated) {
      if (pwdGroup) pwdGroup.style.display = "";
      if (pwdInput) {
        pwdInput.setAttribute("required", "required");
        pwdInput.focus();
      }
    } else {
      if (pwdGroup) pwdGroup.style.display = "none";
      if (pwdInput) pwdInput.removeAttribute("required");
    }
  };

  document.getElementById("role-modal").classList.add("active");
}

function closeRoleModal() {
  document.getElementById("role-modal").classList.remove("active");
  sessionStorage.removeItem("intended_sidebar_tab");
  if (!appState.activeTeacherId) {
    syncModeToggleActive(sessionStorage.getItem('sigrade_mode_intent') || 'guru');
    if (appState.currentView === "guru") {
      actualSwitchView("siswa");
    }
  }
}

function handleRoleSubmit(event) {
  event.preventDefault();
  const selectedRole = document.getElementById("role-selector-select").value;
  if (!selectedRole) return;

  const isAuthenticated = sessionStorage.getItem("teacher_authenticated") === "true";
  if (!isAuthenticated) {
    const pwdInput = document.getElementById("role-password-input").value;
    const requiredPassword = (selectedRole === "t-2") ? "guru123" : "12345";
    if (pwdInput !== requiredPassword) {
      const errEl = document.getElementById("role-password-error-msg");
      if (errEl) errEl.style.display = "block";
      const pwdIn = document.getElementById("role-password-input");
      if (pwdIn) {
        pwdIn.value = "";
        pwdIn.focus();
      }
      return;
    }
    sessionStorage.setItem("teacher_authenticated", "true");
    if (typeof ApiClient !== 'undefined') {
      ApiClient.teacher.setKey(pwdInput);
    }
  }

  sessionStorage.setItem("active_teacher_role", selectedRole);
  appState.activeTeacherId = selectedRole;
  
  document.getElementById("role-modal").classList.remove("active");
  
  // Handle automatic sidebar tab redirection V7
  const intendedTab = sessionStorage.getItem("intended_sidebar_tab");
  if (intendedTab) {
    sessionStorage.removeItem("intended_sidebar_tab");
    appState.teacherActiveTab = intendedTab;
  }
  
  actualSwitchView("guru");
}

function logoutTeacher() {
  sessionStorage.removeItem("teacher_authenticated");
  sessionStorage.removeItem("active_teacher_role");
  if (typeof ApiClient !== 'undefined') {
    ApiClient.teacher.setKey(null);
  }
  appState.activeTeacherId = null;
  appState.selectedStudentId = null;
  appState.teacherActiveTab = "dashboard";
  updateTeacherToggleBtn();
  syncModeToggleActive("siswa");
  actualSwitchView("siswa");
}

function switchTeacherRole() {
  sessionStorage.removeItem("teacher_authenticated");
  sessionStorage.removeItem("active_teacher_role");
  if (typeof ApiClient !== 'undefined') {
    ApiClient.teacher.setKey(null);
  }
  appState.activeTeacherId = null;
  appState.selectedStudentId = null; // Reset V6
  appState.teacherActiveTab = "dashboard";
  openRoleSelectionModal();
}

// Updates the Guru toggle button label in the global header to show the active teacher's short name
function updateTeacherToggleBtn() {
  const btn = document.getElementById("teacher-view-toggle-btn");
  const logoBtn = document.getElementById("sigrade-logo-btn");

  if (!appState.activeTeacherId) {
    if (btn) btn.innerHTML = `<span>👩‍🏫</span> Guru`;
    if (logoBtn) logoBtn.classList.remove("teacher-logged-in");
    closeSigradeDropdown();
    return;
  }

  let shortName = "Guru";
  if (appState.activeTeacherId === "wali-kelas") {
    shortName = "Wali Kelas";
  } else if (appState.activeTeacherId === "kesiswaan") {
    shortName = "Kesiswaan";
  } else {
    const teacher = appState.teachers.find(t => t.id === appState.activeTeacherId);
    if (teacher) {
      // Extract first name in Title Case from full name (e.g. "WAHYUDHA TRI SETIYOAJI" -> "Wahyudha")
      const firstWord = teacher.name.split(" ")[0];
      shortName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }
  }

  if (btn) btn.innerHTML = `<span>👩‍🏫</span> ${shortName}`;
  if (logoBtn) logoBtn.classList.add("teacher-logged-in");
}

function renderProfileHeaderBadge() {
  const container = document.getElementById("teacher-profile-badge");
  if (!container) return;

  if (appState.activeTeacherId === "t-2") {
    container.innerHTML = `
      <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); padding: 8px 16px; border-radius: var(--radius-md); display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:1.5rem;">👑</span>
        <div>
          <div style="font-family:var(--font-heading); font-weight:700; font-size:0.95rem; color:#f59e0b;">Masuk Sebagai: Bpk. WAHYUDHA (Wali Kelas & Admin)</div>
          <div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Akses Kontrol & Pembersihan Data Penuh</div>
        </div>
      </div>
    `;
  } else if (appState.activeTeacherId === "wali-kelas") {
    container.innerHTML = `
      <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); padding: 8px 16px; border-radius: var(--radius-md); display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:1.5rem;">👑</span>
        <div>
          <div style="font-family:var(--font-heading); font-weight:700; font-size:0.95rem; color:white;">Masuk Sebagai: Wali Kelas</div>
          <div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Akses Kontrol Penuh</div>
        </div>
      </div>
    `;
  } else if (appState.activeTeacherId === "kesiswaan") {
    container.innerHTML = `
      <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); padding: 8px 16px; border-radius: var(--radius-md); display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:1.5rem;">💼</span>
        <div>
          <div style="font-family:var(--font-heading); font-weight:700; font-size:0.95rem; color:white;">Masuk Sebagai: Tim Kesiswaan</div>
          <div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Monitoring Tugas & Penyerahan Kartu Ujian</div>
        </div>
      </div>
    `;
  } else {
    const teacher = appState.teachers.find(t => t.id === appState.activeTeacherId) || { name: "Guru Pengampu" };
    const tSubjects = appState.subjects.filter(s => s.teacherId === teacher.id).map(s => s.name).join(", ");

    container.innerHTML = `
      <div style="background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.25); padding: 8px 16px; border-radius: var(--radius-md); display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:1.5rem;">👩‍🏫</span>
        <div>
          <div style="font-family:var(--font-heading); font-weight:700; font-size:0.95rem; color:white;">Masuk Sebagai: ${teacher.name}</div>
          <div style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Mata Pelajaran: ${tSubjects || "Belum Terdaftar"}</div>
        </div>
      </div>
    `;
  }
}

function sortClassNames(classes) {
  return [...classes].sort((a, b) => {
    const gradeA = parseInt(a, 10) || 0;
    const gradeB = parseInt(b, 10) || 0;
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.localeCompare(b, "id");
  });
}

function getAllAvailableClasses() {
  const fromStudents = [];
  appState.students.forEach((st) => {
    if (st.class && !fromStudents.includes(st.class)) {
      fromStudents.push(st.class);
    }
  });
  return sortClassNames([...new Set([...(appState.classes || []), ...fromStudents])]);
}

// --- STUDENT SEARCH CLASS & NAME SELECTORS V6 ---
function populateClassSelect() {
  const classSelect = document.getElementById("student-class-select");
  if (!classSelect) return;

  classSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';

  const allAvailableClasses = getAllAvailableClasses();

  allAvailableClasses.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.innerText = c;
    classSelect.appendChild(opt);
  });

  // Populate config delete class select as well V7
  const deleteClassSelect = document.getElementById("config-delete-class-select");
  if (deleteClassSelect) {
    deleteClassSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';

    allAvailableClasses.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.innerText = c;
      deleteClassSelect.appendChild(opt);
    });
  }
}

function handleClassSelectChange() {
  const classSelect = document.getElementById("student-class-select");
  const nameSelect = document.getElementById("student-name-select");
  if (!classSelect || !nameSelect) return;

  const selectedClass = classSelect.value;
  nameSelect.innerHTML = '<option value="">-- Pilih Nama Siswa --</option>';

  if (!selectedClass) {
    nameSelect.disabled = true;
    const searchInput = document.getElementById("student-search-input");
    if (searchInput) {
      searchInput.value = "";
    }
    handleStudentSearch();
    return;
  }

  const searchInput = document.getElementById("student-search-input");
  if (searchInput) {
    searchInput.value = "";
  }
  handleStudentSearch();


  const classStudents = appState.students.filter(st => st.class === selectedClass);
  classStudents.sort((a, b) => a.name.localeCompare(b.name)).forEach(st => {
    const opt = document.createElement("option");
    opt.value = st.name;
    opt.innerText = st.name;
    nameSelect.appendChild(opt);
  });

  nameSelect.disabled = false;
}

function handleNameSelectChange() {
  const nameSelect = document.getElementById("student-name-select");
  const searchInput = document.getElementById("student-search-input");
  if (!nameSelect || !searchInput) return;

  const selectedName = nameSelect.value;
  searchInput.value = selectedName || "";
  handleStudentSearch();
}

function resetStudentSearchUI() {
  const classSelect = document.getElementById("student-class-select");
  if (classSelect) {
    classSelect.value = "";
    handleClassSelectChange();
    
    // Explicitly sync the custom dropdown triggers
    if (typeof syncClassDropdownState === 'function') syncClassDropdownState();
    if (typeof syncNameDropdownState === 'function') syncNameDropdownState();
  }
}

// --- DYNAMIC ISLAND CUSTOM DROPDOWN SYSTEM ---
let activeDiDropdown = null;

function toggleDiDropdown(type) {
  const wrapper = document.getElementById(type + '-dropdown-wrapper');
  const trigger = document.getElementById(type + '-dropdown-trigger');
  if (!wrapper || !trigger) return;
  if (trigger.classList.contains('disabled')) return;

  const bar = wrapper.closest('.student-selector-bar');

  // If this specific dropdown is already open, close it
  if (activeDiDropdown && activeDiDropdown.type === type) {
    closeDiDropdown(wrapper, trigger);
    return;
  }

  // Close any other open dropdown first
  closeAllDiDropdowns();

  // Build options from the native select
  const select = wrapper.querySelector('select.premium-select');
  if (!select) return;

  const menu = document.createElement('div');
  menu.className = 'di-dropdown-menu';
  menu.classList.add('di-menu-' + type);

  Array.from(select.options).forEach((opt, idx) => {
    if (opt.value === "") return; // skip placeholder
    const item = document.createElement('div');
    item.className = 'di-dropdown-item' + (opt.value === select.value ? ' selected' : '');
    item.style.animationDelay = `${idx * 0.03}s`;
    item.innerHTML = `
      <span>${escapeHTML(opt.textContent)}</span>
      <span class="di-item-check material-symbols-rounded">check</span>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDiItem(type, opt.value, opt.textContent, wrapper, trigger);
    });
    menu.appendChild(item);
  });

  // If no options besides placeholder, show empty state
  if (menu.children.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'di-dropdown-item';
    empty.style.opacity = '0.5';
    empty.style.cursor = 'default';
    empty.style.justifyContent = 'center';
    empty.textContent = type === 'class' ? 'Tidak ada kelas' : (type === 'name' ? 'Pilih kelas dulu' : 'Tidak ada data');
    menu.appendChild(empty);
  }

  // Append to bar for Dynamic Island relative positioning
  if (bar) {
    bar.appendChild(menu);
    bar.classList.add('menu-open');
    bar.classList.remove('menu-open-class', 'menu-open-name', 'menu-open-config-academic-year', 'menu-open-config-semester');
    bar.classList.add('menu-open-' + type);
  } else {
    wrapper.appendChild(menu);
  }

  trigger.classList.add('open');
  activeDiDropdown = { wrapper, trigger, type };

  // Animate the selector bar to "expand" like Dynamic Island
  if (bar) {
    bar.style.boxShadow = '0 12px 48px rgba(99,102,241,0.25), 0 0 0 1px rgba(99,102,241,0.25), 0 0 60px rgba(99,102,241,0.1)';
    bar.style.borderColor = 'rgba(99,102,241,0.4)';
  } else {
    trigger.style.boxShadow = '0 12px 48px rgba(99,102,241,0.25), 0 0 0 1px rgba(99,102,241,0.25), 0 0 60px rgba(99,102,241,0.1)';
    trigger.style.borderColor = 'rgba(99,102,241,0.4)';
  }
}

function selectDiItem(type, value, text, wrapper, trigger) {
  const select = wrapper.querySelector('select.premium-select');
  const label = trigger.querySelector('.di-trigger-label');
  if (!select || !label) return;

  // Set native select value
  select.value = value;

  // Update trigger label
  label.textContent = text;
  label.classList.remove('placeholder');

  // Close dropdown with animation
  closeDiDropdown(wrapper, trigger);

  // Pulse the trigger to give tactile feedback
  trigger.style.animation = 'diPulse 0.3s var(--spring-bounce)';
  setTimeout(() => trigger.style.animation = '', 350);

  // Fire the existing change handlers
  if (type === 'class') {
    handleClassSelectChange();
    syncNameDropdownState();
  } else if (type === 'name') {
    handleNameSelectChange();
  } else if (type === 'role') {
    if (typeof select.onchange === 'function') {
      select.onchange({ target: select });
    } else {
      select.dispatchEvent(new Event('change'));
    }
  }
  // For config-academic-year and config-semester, we do nothing automatically
  // because the user must click "Terapkan" to apply the changes.
}

function closeDiDropdown(wrapper, trigger) {
  const bar = wrapper.closest('.student-selector-bar');
  const menu = bar ? bar.querySelector('.di-dropdown-menu') : wrapper.querySelector('.di-dropdown-menu');
  if (!menu) return;

  menu.classList.add('closing');
  trigger.classList.remove('open');

  // Reset bar state
  if (bar) {
    bar.style.boxShadow = '';
    bar.style.borderColor = '';
    bar.classList.remove('menu-open', 'menu-open-class', 'menu-open-name', 'menu-open-config-academic-year', 'menu-open-config-semester');
  } else {
    trigger.style.boxShadow = '';
    trigger.style.borderColor = '';
  }

  setTimeout(() => {
    if (menu.parentNode) menu.parentNode.removeChild(menu);
  }, 200);

  activeDiDropdown = null;
}

function closeAllDiDropdowns() {
  document.querySelectorAll('.di-dropdown-menu').forEach(menu => {
    const bar = menu.closest('.student-selector-bar');
    let trigger = null;
    if (activeDiDropdown && activeDiDropdown.trigger) {
      trigger = activeDiDropdown.trigger;
    } else {
      trigger = document.querySelector('.di-dropdown-trigger.open');
    }
    if (trigger) trigger.classList.remove('open');
    
    menu.classList.add('closing');
    setTimeout(() => { if (menu.parentNode) menu.parentNode.removeChild(menu); }, 200);
  });

  // Reset any bar glow and classes
  document.querySelectorAll('.student-selector-bar').forEach(bar => {
    bar.style.boxShadow = '';
    bar.style.borderColor = '';
    bar.classList.remove('menu-open', 'menu-open-class', 'menu-open-name');
  });

  activeDiDropdown = null;
}

function syncNameDropdownState() {
  const nameSelect = document.getElementById('student-name-select');
  const nameTrigger = document.getElementById('name-dropdown-trigger');
  const nameLabel = document.getElementById('name-trigger-label');
  if (!nameSelect || !nameTrigger || !nameLabel) return;

  if (nameSelect.disabled) {
    nameTrigger.classList.add('disabled');
    nameLabel.textContent = 'Pilih Nama Siswa';
    nameLabel.classList.add('placeholder');
  } else {
    nameTrigger.classList.remove('disabled');
    // If has value, show it; otherwise show placeholder
    if (nameSelect.value) {
      nameLabel.textContent = nameSelect.options[nameSelect.selectedIndex]?.textContent || nameSelect.value;
      nameLabel.classList.remove('placeholder');
    } else {
      nameLabel.textContent = 'Pilih Nama Siswa';
      nameLabel.classList.add('placeholder');
    }
  }
}

function syncClassDropdownState() {
  const classSelect = document.getElementById('student-class-select');
  const classTrigger = document.getElementById('class-dropdown-trigger');
  const classLabel = document.getElementById('class-trigger-label');
  if (!classSelect || !classTrigger || !classLabel) return;

  if (classSelect.value) {
    classLabel.textContent = classSelect.options[classSelect.selectedIndex]?.textContent || classSelect.value;
    classLabel.classList.remove('placeholder');
  } else {
    classLabel.textContent = 'Pilih Kelas';
    classLabel.classList.add('placeholder');
  }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (activeDiDropdown) {
    const { wrapper } = activeDiDropdown;
    const bar = wrapper.closest('.student-selector-bar');
    if (bar && !bar.contains(e.target)) {
      closeAllDiDropdowns();
    }
  }
});

// --- STUDENT SEARCH MODULE (STUDENT VIEW V5) ---
async function handleStudentSearch() {
  const query = document.getElementById("student-search-input").value.trim().toLowerCase();
  const resultsArea = document.getElementById("student-results-area");
  const placeholderArea = document.getElementById("student-placeholder-area");
  const searchSection = document.querySelector(".student-search-section");
  
  if (!query) {
    placeholderArea.classList.remove("d-none");
    resultsArea.classList.add("d-none");
    if (searchSection) searchSection.classList.remove("d-none");
    return;
  }

  let student = appState.students.find(s => 
    (s.name || "").toLowerCase() === query
  );

  if (!student) {
    placeholderArea.innerHTML = `
      <div class="clean-placeholder-tip" style="border-color: var(--danger); background: rgba(239, 68, 68, 0.02);">
        <span class="material-symbols-rounded" style="font-size: 20px; color: var(--danger); filter: drop-shadow(0 0 6px var(--danger));">warning</span>
        <span>Maaf, data siswa dengan nama "<strong>${escapeHTML(query)}</strong>" tidak terdaftar.</span>
      </div>
    `;
    placeholderArea.classList.remove("d-none");
    resultsArea.classList.add("d-none");
    if (searchSection) searchSection.classList.remove("d-none");
    return;
  }

  if (window.__apiMode) {
    try {
      const data = await ApiClient.public.getStudent(student.id);
      const idx = appState.students.findIndex(s => s.id === student.id);
      if (idx !== -1 && data.student) {
        appState.students[idx] = { ...appState.students[idx], ...data.student };
        student = appState.students[idx];
      }
      if (data.publishGrades !== undefined) appState.publishGrades = data.publishGrades;
      if (data.subjects) mergeSubjectsIntoAppState(data.subjects);
    } catch (err) {
      console.warn("Gagal memuat data siswa dari server:", err.message);
      alert("Gagal memuat data siswa dari server. Periksa koneksi lalu coba lagi.");
      return;
    }
  }

  appState.selectedStudentId = student.id;

  // Poin 1: Collapse form pencarian utama agar tidak memakan space
  placeholderArea.classList.add("d-none");
  resultsArea.classList.remove("d-none");
  if (searchSection) searchSection.classList.add("d-none");

  const avatarContent = student.absentNo !== undefined && student.absentNo !== "-" ? student.absentNo : "-";
  document.getElementById("res-avatar").innerText = avatarContent;
  document.getElementById("res-name").innerText = student.name;

  // Sinkronisasi mini active search profile bar
  const miniResName = document.getElementById("mini-res-name");
  const miniResClass = document.getElementById("mini-res-class");
  const miniResAvatar = document.getElementById("mini-res-avatar");
  if (miniResName) miniResName.innerText = student.name;
  if (miniResAvatar) miniResAvatar.innerText = avatarContent;

  const genderLabel = student.gender === "L" ? "Laki-laki" : (student.gender === "P" ? "Perempuan" : "-");
  const absentLabel = student.absentNo !== undefined && student.absentNo !== "-" ? `No. Absen: ${student.absentNo}` : "";
  const detailsEl = document.getElementById("res-details");
  if (detailsEl) {
    detailsEl.className = "profile-meta-list";
    detailsEl.style = "";
    detailsEl.innerHTML = `
      <div class="profile-meta-item">
        <span class="profile-meta-label"><span class="material-symbols-rounded" style="font-size:14px; color:var(--text-muted);">pin</span> Absen</span>
        <span class="profile-meta-value">${student.absentNo !== undefined && student.absentNo !== "-" ? student.absentNo : "-"}</span>
      </div>
      <div class="profile-meta-item">
        <span class="profile-meta-label"><span class="material-symbols-rounded" style="font-size:14px; color:var(--text-muted);">class</span> Kelas</span>
        <span class="profile-meta-value">${student.class || '8C'}</span>
      </div>
      <div class="profile-meta-item">
        <span class="profile-meta-label"><span class="material-symbols-rounded" style="font-size:14px; color:var(--text-muted);">person</span> Gender</span>
        <span class="profile-meta-value">${genderLabel}</span>
      </div>
      <div class="profile-meta-item">
        <span class="profile-meta-label"><span class="material-symbols-rounded" style="font-size:14px; color:var(--success);">verified</span> Status</span>
        <span class="profile-meta-value" style="color: var(--success);">Aktif</span>
      </div>
    `;
  }
  if (miniResClass) {
    miniResClass.innerText = `${student.class || '8C'} ${absentLabel ? `• ${absentLabel}` : ""}`;
  }

  const compDetails = getOverallStudentCompleteness(student);
  const statusCard = document.getElementById("res-status-card");
  const progressCard = document.getElementById("res-progress-card");
  const laporanCard = document.getElementById("res-laporan-card");
  const kkmWarning = document.getElementById("res-kkm-warning");
  const todoCard = document.getElementById("res-todo-card");

  if (compDetails.hasNoSubjects) {
    if (statusCard) {
      statusCard.style.display = "block";
      statusCard.className = "status-banner-hero incomplete";
      statusCard.innerHTML = `
        <div class="status-banner-left" style="display:flex; align-items:center; gap:1rem;">
          <div class="status-banner-icon-wrapper" style="color:var(--danger); display:flex; align-items:center; justify-content:center;"><span class="material-symbols-rounded" style="font-size: 2.2rem;">error</span></div>
          <div>
            <div class="status-banner-title">Data Tidak Tersedia</div>
            <div class="status-banner-desc" style="font-size: 1.05rem; color: var(--text-secondary);">Data anda tidak termasuk dalam sistem</div>
          </div>
        </div>
      `;
    }
    if (progressCard) progressCard.style.display = "none";
    if (laporanCard) laporanCard.style.display = "none";
    if (kkmWarning) kkmWarning.style.display = "none";
    if (todoCard) todoCard.style.display = "none";
    
    // Set grid content to empty just in case
    const gridContainer = document.getElementById("res-subject-grid");
    if (gridContainer) gridContainer.innerHTML = "";
    
    // Clear online assignments list if exists
    const assignmentsList = document.getElementById("student-online-assignments-list");
    if (assignmentsList) assignmentsList.innerHTML = "";
} else {
    // Pastikan elemen-elemen ini tampil
    if (progressCard) progressCard.style.display = "block";
    if (laporanCard) laporanCard.style.display = "block";
  }
  
  // Poin 7: Prominent Alert Banner Horizontal Hero (Glassmorphism di atas)
  if (compDetails.isAllComplete) {
    if (statusCard) statusCard.style.display = "none";
  } else {
    if (statusCard) {
      statusCard.style.display = "flex";
      statusCard.className = "status-banner-hero incomplete";
      statusCard.innerHTML = `
        <div class="status-banner-left" style="display:flex; align-items:center; gap:1rem;">
          <div class="status-banner-icon-wrapper" style="color:var(--danger); display:flex; align-items:center; justify-content:center;"><span class="material-symbols-rounded" style="font-size: 2.2rem;">warning</span></div>
          <div>
            <div class="status-banner-title">Kelengkapan Tugas Belum Terpenuhi</div>
            <div class="status-banner-desc">Anda masih memiliki <strong>${compDetails.total - compDetails.completed} mata pelajaran</strong> dengan tugas yang belum lengkap.</div>
          </div>
        </div>
        <div class="status-banner-action">
          <button onclick="switchStudentSubTab('portal')" class="btn-status-action-minimal" style="display:inline-flex; align-items:center; gap:0.25rem;">
            <span>Buka Portal Tugas</span>
            <span class="material-symbols-rounded" style="font-size: 16px;">arrow_forward</span>
          </button>
        </div>
      `;
    }
  }

  // Poin 5: Progress Ring SVG Utama Berwarna Dinamis Berdasarkan Persentase (0-30% Red, 31-75% Amber, 76-100% Emerald)
  const circle = document.getElementById("res-progress-circle");
  const pctText = document.getElementById("res-progress-pct");
  const gradStop1 = document.getElementById("grad-stop-1");
  const gradStop2 = document.getElementById("grad-stop-2");
  
  pctText.innerText = `${compDetails.percentage}%`;
  const offset = 377 - (377 * compDetails.percentage) / 100;
  circle.style.strokeDashoffset = offset;

  // Sesuaikan warna gradasi SVG utama secara dinamis
  if (compDetails.percentage <= 30) {
    if (gradStop1) gradStop1.setAttribute("stop-color", "#ef4444");
    if (gradStop2) gradStop2.setAttribute("stop-color", "#f43f5e");
  } else if (compDetails.percentage <= 75) {
    if (gradStop1) gradStop1.setAttribute("stop-color", "#f59e0b");
    if (gradStop2) gradStop2.setAttribute("stop-color", "#ea580c");
  } else {
    if (gradStop1) gradStop1.setAttribute("stop-color", "#10b981");
    if (gradStop2) gradStop2.setAttribute("stop-color", "#06b6d4");
  }

  // Poin 3: Gamifikasi Progress Ring & Micro-copy Dinamis di bawah Ring
  const microcopyEl = document.getElementById("res-progress-microcopy");
  if (microcopyEl) {
    if (compDetails.hasNoSubjects) {
      microcopyEl.innerHTML = `Mata pelajaran kosong.`;
    } else if (compDetails.percentage <= 30) {
      microcopyEl.innerHTML = `Yuk mulai cicil tugasmu, kamu pasti bisa! 💪`;
    } else if (compDetails.percentage < 100) {
      microcopyEl.innerHTML = `Keren, setengah jalan lagi selesai! 🚀`;
    } else {
      microcopyEl.innerHTML = `Selamat! Tugasmu sudah lengkap 🌟`;
    }
  }

  const gridContainer = document.getElementById("res-subject-grid");
  gridContainer.innerHTML = "";

  const validSubjects = getSubjectsForStudent(student);

  gridContainer.style.display = "";

  if (validSubjects.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="empty-icon" style="font-size: 3.5rem; margin-bottom: 1rem; color: var(--danger); display: flex; justify-content: center;">
          <span class="material-symbols-rounded" style="font-size: 4rem;">error</span>
        </div>
        <h3 style="color: var(--text-primary); font-size: 1.25rem; font-family: var(--font-heading); margin-bottom: 0.5rem;">Data Tidak Tersedia</h3>
        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto; font-size: 0.85rem; line-height: 1.5;">
          Siswa terdaftar, namun saat ini tidak ada data mata pelajaran yang diajarkan untuk kelas <strong>${escapeHTML(student.class)}</strong>.
        </p>
      </div>
    `;
    
    // Clear online assignments list if exists since there are no subjects
    const assignmentsList = document.getElementById("student-online-assignments-list");
    if (assignmentsList) assignmentsList.innerHTML = "";
    
    // Hide todo card just in case
    const todoCardLocal = document.getElementById("res-todo-card");
    if (todoCardLocal) todoCardLocal.style.display = "none";
    
    return;
  }
  // Scan Tugas Belum Selesai secara global untuk FITUR "TO-DO LIST" OTOMATIS
  const todoTasks = [];

  validSubjects.forEach(sub => {
    // Poin 2: Perkecil nama guru, format Title Case, dan text-xs slate-400
    const rawTeacher = appState.teachers.find(t => t.id === sub.teacherId) || { name: "Guru Pengampu" };
    const teacherNameTitleCase = formatTeacherNameTitleCase(rawTeacher.name);

    const scoreInfo = calculateStudentSubjectScore(student, sub.id);
    const isComplete = student.completeness[sub.id] === true;

    // Hitung persentase kelengkapan tugas real-time untuk Ring Mapel Mini
    let totalTasksMapel = 0;
    let completedTasksMapel = 0;

    scoreInfo.chapters.forEach(ch => {
      ch.tasks.forEach(t => {
        totalTasksMapel++;
        const hasPassed = isRecordedScore(t.score) && t.score >= scoreInfo.kkm;
        if (hasPassed) {
          completedTasksMapel++;
        } else {
          const dirKey = `${ch.name}_${t.name}`;
          const dirConfig = sub.tasksDirectory ? sub.tasksDirectory[dirKey] : null;
          const isHidden = isDirectoryTaskHidden(dirConfig, student.class);
          if (!isHidden) {
            // Masukkan ke global To-Do List
            todoTasks.push({
              subjectId: sub.id,
              subjectName: sub.name,
              chapterName: ch.name,
              taskType: 'task',
              taskItemName: t.name
            });
          }
        }
      });
      

      // Ulangan
      totalTasksMapel++;
      const hasPassedUl = isRecordedScore(ch.ulangan) && ch.ulangan >= scoreInfo.kkm;
      if (hasPassedUl) {
        completedTasksMapel++;
      } else {
        const ulDirKey = `${ch.name}_Ulangan`;
        const ulDirConfig = sub.tasksDirectory ? sub.tasksDirectory[ulDirKey] : null;
        const isUlHidden = isDirectoryTaskHidden(ulDirConfig, student.class);
        if (!isUlHidden) {
          todoTasks.push({
            subjectId: sub.id,
            subjectName: sub.name,
            chapterName: ch.name,
            taskType: 'ulangan',
            taskItemName: 'Ulangan'
          });
        }
      }
    });

    const completionMapelPct = totalTasksMapel > 0 ? Math.round((completedTasksMapel / totalTasksMapel) * 100) : 100;

    // Render rincian Bab-Bab dengan Poin 9 (Bab Division Category)
    let chaptersListHTML = "";
    scoreInfo.chapters.forEach(ch => {
      const chKey = "__CHAP__" + ch.name;
      const chDirConfig = sub.tasksDirectory ? sub.tasksDirectory[chKey] : null;

      let tasksListHTML = "";
      
      let totalTasksCh = ch.tasks.length + 1; // + UH
      let completedTasksCh = 0;

      ch.tasks.forEach(t => {
        const isLacking = isScoreLacking(t.score, scoreInfo.kkm);
        if (!isLacking) completedTasksCh++;

        const dirKey = `${ch.name}_${t.name}`;
        const dirConfig = sub.tasksDirectory ? sub.tasksDirectory[dirKey] : null;
          const isHidden = isDirectoryTaskHidden(dirConfig, student.class);

        const lmsBtn = (!isHidden) 
          ? (isLacking ? `<button class="btn-cta-lms" onclick="openLmsModule('${escapeJSAttr(student.id)}', '${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', 'task', '${escapeJSAttr(t.name)}')">Kerjakan</button>` : ``)
          : `<span class="student-task-status locked">Belum dibuka</span>`;

        const displayScore = appState.publishGrades 
          ? `<span class="student-task-status ${isLacking ? 'pending' : 'done'}">${isLacking ? 'Belum' : t.score}</span>`
          : `<span class="status-badge ${t.score > 0 ? 'complete' : 'incomplete'}" style="font-size:0.65rem; padding:1px 6px; display:inline-flex; align-items:center; gap:0.15rem;">${t.score > 0 ? '<span class="material-symbols-rounded" style="font-size:10px;">check</span> Selesai' : '<span class="material-symbols-rounded" style="font-size:10px;">schedule</span> Belum'}</span>`;

        const checkIcon = isLacking
          ? `<span class="task-check-circle incomplete"><span class="material-symbols-rounded" style="font-size: 11px;">radio_button_unchecked</span></span>`
          : `<span class="task-check-circle complete"><span class="material-symbols-rounded" style="font-size: 11px;">check</span></span>`;

        tasksListHTML += `
          <div class="student-task-row">
            <span class="student-task-label">${checkIcon}<span class="task-name">${escapeHTML(t.name)}</span></span>
            <div class="student-task-actions">
              ${displayScore}
              ${lmsBtn}
            </div>
          </div>
        `;
      });

      const isUlLacking = isScoreLacking(ch.ulangan, scoreInfo.kkm);
      if (!isUlLacking) completedTasksCh++;

      const ulDirKey = `${ch.name}_Ulangan`;
      const ulDirConfig = sub.tasksDirectory ? sub.tasksDirectory[ulDirKey] : null;
      const isUlHidden = isDirectoryTaskHidden(ulDirConfig, student.class);

      const ulLmsBtn = (!isUlHidden) 
        ? (isUlLacking ? `<button class="btn-cta-lms" onclick="openLmsModule('${escapeJSAttr(student.id)}', '${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', 'ulangan', 'Ulangan')">Kerjakan</button>` : ``)
        : `<span class="student-task-status locked">Belum dibuka</span>`;

      const ulScoreDisplay = appState.publishGrades 
        ? `<span class="student-task-status ${isUlLacking ? 'pending' : 'done'}">${isUlLacking ? 'Belum' : ch.ulangan}</span>` 
        : `<span class="status-badge ${ch.ulangan > 0 ? 'complete' : 'incomplete'}" style="font-size:0.65rem; padding:1px 6px; display:inline-flex; align-items:center; gap:0.15rem;">${ch.ulangan > 0 ? '<span class="material-symbols-rounded" style="font-size:10px;">check</span> Selesai' : '<span class="material-symbols-rounded" style="font-size:10px;">schedule</span> Belum'}</span>`;

      const isChComplete = completedTasksCh === totalTasksCh;
      
      const ulCheckIcon = isUlLacking
        ? `<span class="task-check-circle incomplete"><span class="material-symbols-rounded" style="font-size: 11px;">radio_button_unchecked</span></span>`
        : `<span class="task-check-circle complete"><span class="material-symbols-rounded" style="font-size: 11px;">check</span></span>`;

      chaptersListHTML += `
        <div class="chapter-card-box">
          <div class="chapter-division-header" style="margin-top:0;">
            <span class="chapter-tag-premium">${escapeHTML(ch.name)}</span>
            <span class="chapter-status-tag ${isChComplete ? 'complete' : 'incomplete'}">
              ${isChComplete ? 'Tuntas' : 'Belum lengkap'}
            </span>
          </div>
          
          ${tasksListHTML}
          
          <div class="student-task-row">
            <span class="student-task-label">${ulCheckIcon}<span class="task-name">Ulangan Harian</span></span>
            <div class="student-task-actions">
              ${ulScoreDisplay}
              ${ulLmsBtn}
            </div>
          </div>
        </div>
      `;
    });

    const isFinalLacking = scoreInfo.akhir < scoreInfo.kkm;
    const finalScoreDisplay = appState.publishGrades
      ? `<span class="subject-final-score-value ${isFinalLacking ? 'fail' : 'pass'}">${isFinalLacking ? '—' : scoreInfo.akhir}</span>`
      : `<span style="font-family:var(--font-heading); font-weight:700; font-size:0.85rem; color: var(--text-secondary);">Sudah dinilai</span>`;

    // Progress Ring SVG Mapel Mini (44px) Dinamis Berdasarkan Persentase Mapel
    const dashoffsetMapel = 113 - (113 * completionMapelPct) / 100;
    
    let ringColorClass = "stroke-emerald-500";
    if (completionMapelPct <= 30) ringColorClass = "stroke-rose-500";
    else if (completionMapelPct <= 75) ringColorClass = "stroke-amber-500";

    // Poin 5: MODE ACCORDION (COLLAPSE/EXPAND CARD MAPEL)
    // Default: expanded jika belum lengkap, collapsed jika sudah lengkap
    const expandedClass = isComplete ? "" : "expanded";

    const card = document.createElement("div");
    card.className = `premium-subject-card ${expandedClass} ${isComplete ? 'complete-card' : 'incomplete-card'}`;
    card.id = `subject-card-${sub.id}`;
    
    card.innerHTML = `
      <!-- Accordion Header: Bisa di-klik untuk toggle expand/collapse -->
      <div class="accordion-header" onclick="toggleSubjectAccordion('${escapeJSAttr(sub.id)}')">
        <div>
          <span class="subject-name">${escapeHTML(sub.name)}</span>
          <span class="subject-teacher" style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">
            <span class="material-symbols-rounded" style="font-size:13px; color:var(--text-muted); vertical-align:middle;">school</span>
            ${escapeHTML(teacherNameTitleCase)}
          </span>
        </div>
        
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <!-- Progress Ring Mapel Mini -->
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <svg class="mini-progress-ring-svg">
              <circle class="mini-progress-ring-bg" cx="22" cy="22" r="18" />
              <circle class="mini-progress-ring-circle ${ringColorClass}" cx="22" cy="22" r="18" stroke-dasharray="113" stroke-dashoffset="${dashoffsetMapel}" />
            </svg>
            <span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-family:var(--font-heading); font-size:0.62rem; font-weight:800; color:var(--text-primary);">${completionMapelPct}%</span>
          </div>
          
          <!-- Accordion Indicator Icon -->
          <span class="accordion-icon material-symbols-rounded" style="font-size:18px;">expand_more</span>
        </div>
      </div>

      <!-- Accordion Body: Berisi rincian materi yang bisa slide-up/down -->
      <div class="accordion-body">
        <div style="padding: 0.5rem 0 0;">
          <span class="chapters-section-label">Rincian materi per bab</span>
          <div class="chapters-grid">
            ${chaptersListHTML}
          </div>
        </div>

        <div class="subject-final-score">
          <span class="subject-final-score-label">Nilai akhir <span style="color:var(--text-muted);">(KKM: ${scoreInfo.kkm})</span></span>
          ${finalScoreDisplay}
        </div>
      </div>
    `;
    gridContainer.appendChild(card);
  });

  // Poin 1: Render FITUR "TO-DO LIST" OTOMATIS
  const todoList = document.getElementById("res-todo-list");

  if (todoCard && todoList) {
    if (todoTasks.length > 0) {
      todoCard.style.display = "block";
      
      let todoHTML = "";
      todoTasks.forEach((item) => {
        todoHTML += `
          <div class="todo-item-minimal">
            <div class="todo-item-info">
              <span class="todo-item-subject">${escapeHTML(item.subjectName)}</span>
              <span class="todo-item-detail">${escapeHTML(item.chapterName)} · ${escapeHTML(item.taskItemName)}</span>
            </div>
            <button class="btn-todo-minimal" onclick="openLmsModule('${escapeJSAttr(student.id)}', '${escapeJSAttr(item.subjectId)}', '${escapeJSAttr(item.chapterName)}', '${escapeJSAttr(item.taskType)}', '${escapeJSAttr(item.taskItemName)}')">
              Mulai
            </button>
          </div>
        `;
      });
      todoList.innerHTML = todoHTML;
      
      const todoTitle = todoCard.querySelector("h3");
      if (todoTitle) {
        todoTitle.innerHTML = `<span class="material-symbols-rounded">checklist</span> Tugas perlu diselesaikan`;
      }
    } else {
      // Jika semua tugas lengkap, tampilkan status lengkap di card (tidak disembunyikan agar layout 3-kolom tetap seimbang)
      todoCard.style.display = "block";
      const todoTitle = todoCard.querySelector("h3");
      if (todoTitle) {
        todoTitle.innerHTML = `<span class="material-symbols-rounded">emoji_events</span> Semua tugas selesai`;
      }
          todoList.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0;">
          <span class="material-symbols-rounded" style="font-size: 24px; color: var(--success); filter: drop-shadow(0 0 6px var(--success));">emoji_events</span>
          <div>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--success); display: block;">Lengkap & Tuntas</span>
            <span style="font-size: 0.7rem; color: var(--text-secondary); display: block; margin-top: 1px;">Kamu tidak memiliki tugas tertunda.</span>
          </div>
        </div>
      `;
    }
  }

  // --- KKM WARNING BANNER ---
  const kkmWarningEl = document.getElementById("res-kkm-warning");
  if (kkmWarningEl) {
    kkmWarningEl.style.display = "none";
    kkmWarningEl.innerHTML = "";
  }

  updateStudentNotificationBadge(student);
}

function performKatrolStudent(studentId) {}
window.performKatrolStudent = performKatrolStudent;

// Poin 5: Fungsi Accordion Buka/Tutup Manual untuk Card Mapel
function toggleSubjectAccordion(subjectId) {
  const card = document.getElementById(`subject-card-${subjectId}`);
  if (card) {
    card.classList.toggle("expanded");
  }
}
window.toggleSubjectAccordion = toggleSubjectAccordion; // Daftarkan ke global window

// Poin 1: Compact Search Filter - Fungsi reset pencarian agar expand kembali
function resetStudentSearch() {
  const searchInput = document.getElementById("student-search-input");
  const resultsArea = document.getElementById("student-results-area");
  const placeholderArea = document.getElementById("student-placeholder-area");
  const searchSection = document.querySelector(".student-search-section");
  const classSelect = document.getElementById("student-class-select");
  const nameSelect = document.getElementById("student-name-select");

  if (searchInput) searchInput.value = "";
  if (classSelect) classSelect.value = "";
  if (nameSelect) {
    nameSelect.value = "";
    nameSelect.disabled = true;
  }

  if (placeholderArea) {
    placeholderArea.innerHTML = `
      <span style="font-size: 3.5rem;">📊</span>
      <h3 style="margin-top: 1.5rem; font-family: var(--font-heading); font-weight: 700; font-size: 1.25rem;">Menunggu Pencarian</h3>
      <p style="color: var(--text-secondary); max-width: 420px; margin: 0.5rem auto 0 auto;">
        Silakan masukkan nama lengkap Anda pada kolom pencarian di atas untuk memuat laporan akademik Anda.
      </p>
      <div style="margin-top: 2rem; display: inline-flex; gap: 0.5rem; justify-content: center; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 6px 16px; border-radius: var(--radius-xl); font-size: 0.8rem; color: var(--text-secondary);">
        <span>💡</span> Pilih Kelas & Nama di atas, atau ketik kata kunci contoh: <strong>Fahri (8C)</strong>, <strong>ALFIAN (8D)</strong>, atau <strong>Zacky (8G)</strong>
      </div>
    `;
    placeholderArea.classList.remove("d-none");
  }

  if (resultsArea) resultsArea.classList.add("d-none");
  if (searchSection) searchSection.classList.remove("d-none");
  
  // Sync custom dropdown triggers
  syncClassDropdownState();
  syncNameDropdownState();
  
  if (searchInput) searchInput.focus();
}

function updateStudentNotificationBadge(student) {
  const portalBtn = document.getElementById("btn-subtab-portal");
  if (!portalBtn) return;

  if (!student) {
    portalBtn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;">smartphone</span> Portal Tugas & CBT`;
    return;
  }

  const now = new Date();
  let activeCount = 0;

  getSubjectsForStudent(student).forEach(sub => {
    // Check online assignments
    const assignments = sub.onlineAssignments || [];
    assignments.forEach(as => {
      if (!as.hiddenClasses || as.hiddenClasses.includes(student.class)) return;
      const releaseTime = new Date(as.releaseTime);
      const endTime = new Date(as.endTime);
      if (now >= releaseTime && now <= endTime) {
        const submission = as.submissions && as.submissions[student.id];
        if (!submission) {
          activeCount++;
        }
      }
    });

    // Check online exams
    const exams = sub.onlineExams || [];
    exams.forEach(ex => {
      if (!ex.hiddenClasses || ex.hiddenClasses.includes(student.class)) return;
      const releaseTime = new Date(ex.releaseTime);
      const endTime = new Date(ex.endTime);
      if (now >= releaseTime && now <= endTime) {
        const submission = ex.submissions && ex.submissions[student.id];
        if (!submission) {
          activeCount++;
        }
      }
    });
  });

  if (activeCount > 0) {
    portalBtn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;">smartphone</span> Portal Tugas & CBT <span class="notification-badge-glow" style="background: var(--danger); color: white; padding: 2px 7px; border-radius: 10px; font-size: 0.7rem; font-weight: 800; margin-left: 0.35rem; box-shadow: 0 0 8px var(--danger); animation: timerPulse 1.5s infinite; display: inline-block; vertical-align: middle;">🆕 ${activeCount} Baru</span>`;
  } else {
    portalBtn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;">smartphone</span> Portal Tugas & CBT`;
  }
}

// --- LMS & CBT HP PORTAL SYSTEM V7 ---
function switchStudentSubTab(tabName) {
  appState.activeStudentSubTab = tabName;
  
  document.querySelectorAll(".student-sub-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.id === `btn-subtab-${tabName}`);
  });
  
  const laporanContent = document.getElementById("student-laporan-content");
  const portalContent = document.getElementById("student-portal-content");
  const direktoriContent = document.getElementById("student-direktori-content");
  const icebreakingContent = document.getElementById("student-icebreaking-content");
  
  if (laporanContent) laporanContent.classList.add("d-none");
  if (portalContent) portalContent.classList.add("d-none");
  if (direktoriContent) direktoriContent.classList.add("d-none");
  if (icebreakingContent) icebreakingContent.classList.add("d-none");
  
  if (tabName === "laporan") {
    if (laporanContent) laporanContent.classList.remove("d-none");
  } else if (tabName === "direktori") {
    if (direktoriContent) direktoriContent.classList.remove("d-none");
    renderStudentCurriculumDirectory();
  } else if (tabName === "icebreaking") {
    if (icebreakingContent) icebreakingContent.classList.remove("d-none");
  } else {
    if (portalContent) portalContent.classList.remove("d-none");
    renderStudentPortal();
  }
}

function openLmsModule(studentId, subjectId, chapterName, taskType, taskItemName) {
  const student = appState.students.find(s => s.id === studentId);
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!student || !subject) return;

  if (!getSubjectsForStudent(student).some((s) => s.id === subjectId)) {
    alert("Tugas ini tidak tersedia untuk kelas Anda.");
    return;
  }

  if (!isSubjectValidForStudentClass(subject.name, student.class)) {
    alert("Tugas ini tidak tersedia untuk kelas Anda.");
    return;
  }

  const releaseMaterialKey = taskType === "ulangan" ? "Ulangan" : (taskItemName || "");
  const taskKey = `${chapterName}_${releaseMaterialKey}`;
  const taskConfig = subject.tasksDirectory?.[taskKey];
  if (!taskConfig || isDirectoryTaskHidden(taskConfig, student.class)) {
    alert("Tugas ini belum dibuka oleh guru untuk kelas Anda.");
    return;
  }

  const subjectMaterials = getStudyMaterialsForSubject(subject.name);
  let chapterMaterials = subjectMaterials[chapterName];
  if (!chapterMaterials) {
    for (const key of Object.keys(subjectMaterials)) {
      if (chapterName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(chapterName.toLowerCase())) {
        chapterMaterials = subjectMaterials[key];
        break;
      }
    }
  }
  if (!chapterMaterials && subject.chapters) {
    const idx = subject.chapters.findIndex(c => c.name === chapterName);
    const keys = Object.keys(subjectMaterials);
    if (idx !== -1 && idx < keys.length) {
      chapterMaterials = subjectMaterials[keys[idx]];
    }
  }
  if (!chapterMaterials) chapterMaterials = {};
  
  let materialKey = taskItemName;
  if (taskType === "tugasAkhir") materialKey = "Tugas Akhir";
  if (taskType === "ulangan") materialKey = "Ulangan";

  const key = `${chapterName}_${materialKey}`;
  const customConfig = subject.tasksDirectory && subject.tasksDirectory[key];

  let material = chapterMaterials[materialKey] || {
    theory: `Materi pembelajaran untuk ${materialKey} pada bab ${chapterName} (${subject.name}) sedang disiapkan oleh guru pengampu Anda. Silakan baca buku paket Anda untuk penjelasan materi lengkap.`,
    instruction: `Kerjakan latihan di bawah ini untuk melengkapi tugas ${materialKey} Anda:\nSebutkan definisi ringkas mengenai topik bahasan ${materialKey} menurut pemahaman Anda!`
  };

  if (customConfig) {
    material = {
      theory: customConfig.theory || `Pelajari materi pokok untuk ${materialKey} secara seksama.`,
      instruction: customConfig.instruction || `Kerjakan soal-soal latihan di bawah ini:`
    };
  }

  document.getElementById("lms-subject-chapter").innerText = `${subject.name} - ${chapterName}`;
  document.getElementById("lms-task-name").innerText = `Bimbingan: ${materialKey}`;
  document.getElementById("lms-theory-text").innerText = material.theory;
  document.getElementById("lms-instruction-text").innerText = material.instruction;

  const bukuSection = document.getElementById("lms-buku-section");
  if (bukuSection) {
    const isBukuMode = customConfig && customConfig.mode === 'buku';
    bukuSection.style.display = isBukuMode ? 'block' : 'none';
    if (isBukuMode) {
      const bukuTitle = document.getElementById("lms-buku-title");
      const bukuPages = document.getElementById("lms-buku-pages");
      if (bukuTitle) bukuTitle.innerText = customConfig.bukuTitle || 'Buku Paket';
      if (bukuPages) bukuPages.innerText = `${customConfig.bukuPageStart || '?'} – ${customConfig.bukuPageEnd || '?'}`;
    }
  }

  const imgContainer = document.getElementById("lms-image-container");
  if (imgContainer) imgContainer.style.display = "none";

  const form = document.getElementById("lms-submission-form");
  if (form) {
    form.innerHTML = "";
    if (customConfig && customConfig.questions && customConfig.questions.length > 0) {
      customConfig.questions.forEach((q, qIdx) => {
        const qContainer = document.createElement("div");
        qContainer.className = "lms-question-item";
        qContainer.style.marginBottom = "1.25rem";
        qContainer.style.padding = "0.75rem";
        qContainer.style.background = "rgba(255,255,255,0.01)";
        qContainer.style.border = "1px solid var(--border-color)";
        qContainer.style.borderRadius = "var(--radius-sm)";

        let qInputHTML = "";
        if (q.type === "pg") {
          qInputHTML = `
            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
              ${[0, 1, 2, 3].map(optIdx => {
                const letter = ["A", "B", "C", "D"][optIdx];
                return `
                  <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:var(--text-secondary); cursor:pointer;">
                    <input type="radio" name="lms-ans-${q.id}" value="${optIdx}" required style="cursor:pointer; width:16px; height:16px; accent-color:var(--secondary);">
                    <strong style="color:var(--text-muted);">${letter}.</strong> ${escapeHTML(q.options[optIdx])}
                  </label>
                `;
              }).join("")}
            </div>
          `;
        } else {
          // No input field for essay / buku / other types as requested by user
          qInputHTML = `
            <div style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted); font-style:italic;">
              Kerjakan di buku latihan Anda. (Tidak perlu mengisi jawaban di sini)
            </div>
          `;
        }

        let imgHTML = "";
        if (q.image) {
          imgHTML = `
            <div class="lms-q-image-container">
              <img src="${q.image}" class="lms-q-image" alt="Gambar Soal">
            </div>
          `;
        }

        qContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <strong style="font-size:0.85rem; color:var(--text-primary); line-height:1.4;">Soal ${qIdx + 1}. ${escapeHTML(q.questionText)}</strong>
            <span style="font-size:0.7rem; font-weight:700; color:var(--secondary); background:rgba(6,182,212,0.1); padding:2px 8px; border-radius:4px; margin-left:0.5rem; white-space:nowrap;">${q.points} Poin</span>
          </div>
          ${imgHTML}
          ${qInputHTML}
        `;
        form.appendChild(qContainer);
      });
    } else {
      // Legacy syllabus flow with single textarea
      const formGroup = document.createElement("div");
      formGroup.className = "form-group";
      formGroup.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; text-align: center;">
          Silakan kerjakan instruksi di atas pada buku tugas Anda.
        </div>
        <input type="hidden" id="lms-answer-input" value="Selesai dibaca/dikerjakan">
      `;
      form.appendChild(formGroup);
    }

    const hiddenFields = document.createElement("div");
    hiddenFields.innerHTML = `
      <input type="hidden" id="lms-student-id" value="${escapeHTML(studentId)}">
      <input type="hidden" id="lms-subject-id" value="${escapeHTML(subjectId)}">
      <input type="hidden" id="lms-chapter-name" value="${escapeHTML(chapterName)}">
      <input type="hidden" id="lms-task-type" value="${escapeHTML(taskType)}">
      <input type="hidden" id="lms-task-item-name" value="${escapeHTML(materialKey)}">
    `;
    form.appendChild(hiddenFields);
  }

  const submitBtn = document.getElementById("lms-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = false;
    let hasPG = false;
    if (customConfig && customConfig.questions) {
      hasPG = customConfig.questions.some(q => q.type === 'pg');
    }
    const isBukuOrEssay = customConfig && (customConfig.mode === 'buku' || customConfig.mode === 'essay');
    const isLegacyNoQuestions = !customConfig || !customConfig.questions || customConfig.questions.length === 0;
    const canSubmit = hasPG || isBukuOrEssay || isLegacyNoQuestions;
    submitBtn.style.display = canSubmit ? "block" : "none";
    submitBtn.innerText = (isBukuOrEssay || isLegacyNoQuestions) && !hasPG
      ? "Tandai Selesai"
      : "Kirim Jawaban Tugas";
  }

  document.getElementById("lms-modal").classList.add("active");
}

function closeLmsModal() {
  document.getElementById("lms-modal").classList.remove("active");
}

async function submitLmsAssignment() {
  const submitBtn = document.getElementById("lms-submit-btn");
  if (submitBtn) submitBtn.disabled = true;

  const studentIdEl = document.getElementById("lms-student-id");
  const subjectIdEl = document.getElementById("lms-subject-id");
  const chapterNameEl = document.getElementById("lms-chapter-name");
  const taskTypeEl = document.getElementById("lms-task-type");
  const taskItemNameEl = document.getElementById("lms-task-item-name");

  if (!studentIdEl || !subjectIdEl || !chapterNameEl || !taskTypeEl) {
    alert("Terjadi kesalahan form. Silakan tutup dan buka kembali tugas.");
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const studentId = studentIdEl.value;
  const subjectId = subjectIdEl.value;
  const chapterName = chapterNameEl.value;
  const taskType = taskTypeEl.value;
  const taskItemName = taskItemNameEl ? taskItemNameEl.value : "";

  const student = appState.students.find(s => s.id === studentId);
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!student || !subject) {
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const key = `${chapterName}_${taskItemName}`;
  const customConfig = subject.tasksDirectory && subject.tasksDirectory[key];

  if (window.__apiMode) {
    try {
      if (chapterName === "ONLINE_ASSIGNMENT") {
        const assignmentId = taskType;
        const assignment = subject.onlineAssignments.find((a) => a.id === assignmentId);
        if (!assignment) {
          alert("Tugas daring tidak ditemukan.");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        const answers = {};
        let legacyAnswer = "";
        if (assignment.questions && assignment.questions.length > 0) {
          let validationError = false;
          assignment.questions.forEach((q) => {
            if (q.type === "pg") {
              const radio = document.querySelector(`input[name="lms-ans-${q.id}"]:checked`);
              if (!radio) {
                validationError = true;
                return;
              }
              answers[q.id] = { answer: parseInt(radio.value, 10) };
            } else {
              const textarea = document.querySelector(`textarea[name="lms-ans-${q.id}"]`);
              if (!textarea || !textarea.value.trim()) {
                validationError = true;
                return;
              }
              answers[q.id] = { answer: textarea.value.trim() };
            }
          });
          if (validationError) {
            alert("Harap lengkapi semua jawaban!");
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
        } else {
          const legacyInput = document.getElementById("lms-answer-input");
          legacyAnswer = legacyInput ? legacyInput.value.trim() : "";
          if (!legacyAnswer) {
            alert("Harap masukkan jawaban tugas Anda!");
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
        }

        const result = await ApiClient.public.submitAssignment({
          studentId,
          subjectId,
          assignmentId,
          answers,
          legacyAnswer,
        });
        closeLmsModal();
        const refresh = await ApiClient.public.getStudent(studentId);
        if (refresh.subjects) mergeSubjectsIntoAppState(refresh.subjects);
        renderStudentPortal();
        alert(result.message || "Tugas daring berhasil dikumpulkan!");
        return;
      }

      const answers = {};
      if (customConfig && customConfig.questions) {
        let validationError = false;
        customConfig.questions.forEach((q) => {
          if (q.type === "pg") {
            const radio = document.querySelector(`input[name="lms-ans-${q.id}"]:checked`);
            if (!radio) {
              validationError = true;
              return;
            }
            answers[q.id] = { answer: parseInt(radio.value, 10) };
          } else {
            answers[q.id] = { answer: "Dikerjakan di buku latihan" };
          }
        });
        if (validationError) {
          alert("Harap lengkapi semua jawaban!");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
      }

      const result = await ApiClient.public.submitLms({
        studentId,
        subjectId,
        chapterName,
        taskType,
        taskItemName,
        answers,
      });

      closeLmsModal();
      await handleStudentSearch();
      alert(result.message || "Tugas berhasil dikumpulkan!");
      return;
    } catch (err) {
      alert(err.message || "Gagal mengirim tugas ke server.");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
  }

  if (customConfig && customConfig.questions && customConfig.questions.length > 0) {
    let answersData = {};
    let autoScore = 0;
    let totalPoints = 0;
    let hasEssay = false;
    let validationError = false;

    customConfig.questions.forEach(q => {
      totalPoints += q.points;
      if (q.type === "pg") {
        const radio = document.querySelector(`input[name="lms-ans-${q.id}"]:checked`);
        if (!radio) {
          validationError = true;
          return;
        }
        const selectedIdx = parseInt(radio.value, 10);
        const isCorrect = selectedIdx === q.correctOptionIdx;
        answersData[q.id] = {
          type: "pg",
          answer: selectedIdx,
          isCorrect: isCorrect,
          pointsEarned: isCorrect ? q.points : 0
        };
        if (isCorrect) autoScore += q.points;
      } else {
        // No textarea to validate for essay/buku
        answersData[q.id] = {
          type: q.type || "essay",
          answer: "Dikerjakan di buku latihan",
          pointsEarned: null
        };
        hasEssay = true;
      }
    });

    if (validationError) {
      alert("Harap lengkapi semua jawaban!");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    let finalGrade = null;
    if (!hasEssay) {
      finalGrade = totalPoints > 0 ? Math.round((autoScore / totalPoints) * 100) : 100;
    }

    if (!customConfig.submissions) customConfig.submissions = {};
    customConfig.submissions[studentId] = {
      answers: answersData,
      submittedAt: new Date().toISOString(),
      grade: finalGrade
    };

    if (finalGrade !== null) {
      const chGrades = ensureChapterGrades(student, subjectId, chapterName);
      if (taskType === "task") {
        if (!chGrades.tasks) chGrades.tasks = {};
        chGrades.tasks[taskItemName] = finalGrade;
      } else if (taskType === "tugasAkhir") {
        chGrades.tugasAkhir = finalGrade;
      } else if (taskType === "ulangan") {
        chGrades.ulangan = finalGrade;
      }
      recalculateSubjectCompleteness(student, subjectId);
    }

    saveData();
    closeLmsModal();
    handleStudentSearch();

    if (!hasEssay) {
      alert(`Tugas bimbingan Anda berhasil dikumpulkan! Nilai otomatis: ${finalGrade}`);
    } else {
      alert("Tugas bimbingan Anda berhasil dikumpulkan! Silakan tunggu guru memeriksa dan memberikan penilaian jawaban essay Anda.");
    }
    return;
  }

  // Jika ini adalah Tugas Daring kustom
  if (chapterName === "ONLINE_ASSIGNMENT") {
    const assignmentId = taskType;
    const assignment = subject.onlineAssignments.find(a => a.id === assignmentId);
    
    if (assignment) {
      let answersData = {};
      let autoScore = 0;
      let totalPoints = 0;
      let hasEssay = false;

      if (assignment.questions && assignment.questions.length > 0) {
        // Collect answers from dynamic inputs V18
        let validationError = false;
        assignment.questions.forEach(q => {
          totalPoints += q.points;
          if (q.type === "pg") {
            const radio = document.querySelector(`input[name="lms-ans-${q.id}"]:checked`);
            if (!radio) {
              validationError = true;
              return;
            }
            const selectedIdx = parseInt(radio.value, 10);
            const isCorrect = selectedIdx === q.correctOptionIdx;
            answersData[q.id] = {
              type: "pg",
              answer: selectedIdx,
              isCorrect: isCorrect,
              pointsEarned: isCorrect ? q.points : 0
            };
            if (isCorrect) autoScore += q.points;
          } else {
            // Essay
            const textarea = document.querySelector(`textarea[name="lms-ans-${q.id}"]`);
            if (!textarea || !textarea.value.trim()) {
              validationError = true;
              return;
            }
            answersData[q.id] = {
              type: "essay",
              answer: textarea.value.trim(),
              pointsEarned: null // To be graded by teacher
            };
            hasEssay = true;
          }
        });

        if (validationError) {
          alert("Harap lengkapi semua jawaban!");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
      } else {
        // Legacy single question
        const legacyInput = document.getElementById("lms-answer-input");
        const answerVal = legacyInput ? legacyInput.value.trim() : "";
        if (!answerVal) {
          alert("Harap masukkan jawaban tugas Anda!");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        answersData = answerVal;
      }

      if (!assignment.submissions) assignment.submissions = {};
      
      // Calculate grade if PG only, else leave as null for teacher grading
      let finalGrade = null;
      if (assignment.questions && assignment.questions.length > 0) {
        if (!hasEssay) {
          finalGrade = totalPoints > 0 ? Math.round((autoScore / totalPoints) * 100) : 100;
        }
      }

      assignment.submissions[studentId] = {
        answers: answersData,
        submittedAt: new Date().toISOString(),
        grade: finalGrade // Will be null if it contains Essay, allowing manual grading
      };
      
      saveData();
      closeLmsModal();
      renderStudentPortal();
      
      if (assignment.questions && assignment.questions.length > 0) {
        if (!hasEssay) {
          alert(`Tugas daring Anda berhasil dikumpulkan! Nilai otomatis: ${finalGrade}`);
        } else {
          alert("Tugas daring Anda berhasil dikumpulkan! Nilai PG terhitung otomatis, silakan tunggu guru memeriksa jawaban essay Anda.");
        }
      } else {
        alert("Tugas daring Anda berhasil dikumpulkan! Silakan tunggu guru memberikan penilaian.");
      }
      return;
    }
  }

  if (customConfig) {
    if (!customConfig.submissions) customConfig.submissions = {};
    const isBukuMode = customConfig.mode === 'buku';
    customConfig.submissions[studentId] = {
      answers: { completed: "Selesai dibaca/dikerjakan" },
      submittedAt: new Date().toISOString(),
      grade: null,
    };
  }

  if (!student.lmsSubmissions) student.lmsSubmissions = [];
  const answerInput = document.getElementById("lms-answer-input");
  const recordedAnswer = answerInput ? answerInput.value.trim() : "";
  student.lmsSubmissions.push({
    subjectId,
    chapterName,
    taskType,
    taskItemName,
    answer: recordedAnswer,
    submittedAt: new Date().toISOString()
  });

  saveData();
  closeLmsModal();
  handleStudentSearch();
  
  alert("Tugas bimbingan Anda berhasil diserahkan! Nilai akan diinput guru setelah pemeriksaan.");
}

function formatDateTime(dateObj) {
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

function renderStudentPortal() {
  const student = getActiveStudent();
  if (!student) return;

  updateStudentNotificationBadge(student);

  const assignmentsList = document.getElementById("student-online-assignments-list");
  const examsList = document.getElementById("student-online-exams-list");
  
  if (!assignmentsList || !examsList) return;

  assignmentsList.innerHTML = "";
  examsList.innerHTML = "";

  const now = new Date();
  let hasAssignments = false;
  let hasExams = false;

  const validSubjectsPortal = getSubjectsForStudent(student);

  validSubjectsPortal.forEach(sub => {
    // Tugas Daring
    const assignments = sub.onlineAssignments || [];
    assignments.forEach(as => {
      if (!as.hiddenClasses || as.hiddenClasses.includes(student.class)) return;
      const releaseTime = new Date(as.releaseTime);
      const startTime = new Date(as.startTime || as.releaseTime);
      const endTime = new Date(as.endTime);
      
      if (now >= releaseTime) {
        hasAssignments = true;
        
        const submission = as.submissions && as.submissions[student.id];
        const isSubmitted = !!submission;
        const isExpired = now > endTime;
        const isNotStarte = now < startTime;

        let statusBadge = "";
        let actionBtn = "";

        if (isSubmitted) {
          statusBadge = `<span class="status-badge complete" style="font-size:0.7rem;">✔ Terkirim${submission.grade !== null && submission.grade !== undefined ? ` (Nilai: ${submission.grade})` : ' (Menunggu Koreksi)'}</span>`;
          actionBtn = `<button class="action-btn secondary-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; cursor:not-allowed;" disabled>Sudah Dikerjakan</button>`;
        } else if (isExpired) {
          statusBadge = `<span class="status-badge incomplete" style="font-size:0.7rem;">❌ Berakhir</span>`;
          actionBtn = `<button class="action-btn danger-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; cursor:not-allowed;" disabled>Batas Waktu Habis</button>`;
        } else if (isNotStarte) {
          statusBadge = `<span class="status-badge warning" style="font-size:0.7rem; background:rgba(245,158,11,0.1); color:var(--warning);">⏳ Buka: ${formatDateTime(startTime)}</span>`;
          actionBtn = `<button class="action-btn secondary-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; cursor:not-allowed; opacity: 0.65;" disabled>🔒 Belum Dimulai</button>`;
        } else {
          statusBadge = `<span class="status-badge warning" style="font-size:0.7rem; background:rgba(6,182,212,0.1); color:var(--secondary);">⏳ Batas: ${formatDateTime(endTime)}</span>`;
          actionBtn = `<button class="action-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; background:var(--secondary-grad);" onclick="startOnlineAssignment('${escapeJSAttr(sub.id)}', '${escapeJSAttr(as.id)}', '${escapeJSAttr(student.id)}')">Kerjakan Tugas Daring</button>`;
        }

        let imageBadgeHTML = "";
        if (as.image) {
          imageBadgeHTML = `
            <div style="width: 100%; height: 140px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); margin-top: 0.25rem; display: flex; justify-content: center; align-items: center;">
              <img src="${as.image}" alt="Gambar Tugas" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
          `;
        }

        // Poin 4: Animasi Pulse Ping bagi Tugas Baru (Dirilis < 24 jam)
        const hoursSinceRelease = (now - releaseTime) / (1000 * 60 * 60);
        const isNewTask = hoursSinceRelease < 24;
        let newBadgeHTML = isNewTask ? `<span class="status-badge incomplete animate-pulse-glow" style="font-size:0.65rem; background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.3); font-weight:800; animation: pulseGlow 1.5s infinite; margin-right:0.35rem;">🆕 BARU</span>` : '';

        const card = document.createElement("div");
        card.style.background = "rgba(255,255,255,0.015)";
        card.style.border = "1px solid var(--border-color)";
        card.style.borderRadius = "var(--radius-md)";
        card.style.padding = "1rem";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "0.75rem";

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <strong style="font-family:var(--font-heading); font-size:0.9rem; color:var(--text-primary); display:inline-flex; align-items:center; gap:0.35rem;">
                ${newBadgeHTML} ${escapeHTML(as.title)}
              </strong>
              <span style="font-size:0.7rem; color:var(--text-secondary); display:block; margin-top:2px;">${escapeHTML(sub.name)}</span>
            </div>
            ${statusBadge}
          </div>
          ${imageBadgeHTML}
          <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            Soal: ${escapeHTML(as.question)}
          </p>
          ${actionBtn}
        `;
        assignmentsList.appendChild(card);
      }
    });

    // Ujian CBT HP
    const exams = sub.onlineExams || [];
    exams.forEach(ex => {
      if (!ex.hiddenClasses || ex.hiddenClasses.includes(student.class)) return;
      const releaseTime = new Date(ex.releaseTime);
      const startTime = new Date(ex.startTime || ex.releaseTime);
      const endTime = new Date(ex.endTime);

      if (now >= releaseTime) {
        hasExams = true;
        
        const submission = ex.submissions && ex.submissions[student.id];
        const isSubmitted = !!submission;
        const isExpired = now > endTime;
        const isNotStarte = now < startTime;

        let statusBadge = "";
        let actionBtn = "";

        if (isSubmitted) {
          let cheatSuffix = submission.isCheated ? ' <strong style="color:var(--danger); font-weight:900;">[CURANG]</strong>' : '';
          statusBadge = `<span class="status-badge complete" style="font-size:0.7rem;">✔ Selesai${submission.grade !== null && submission.grade !== undefined ? ` (Nilai: ${submission.grade})` : ' (Menunggu Dinilai)'}${cheatSuffix}</span>`;
          actionBtn = `<button class="action-btn secondary-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; cursor:not-allowed;" disabled>Sudah Mengikuti Ujian</button>`;
        } else if (isExpired) {
          statusBadge = `<span class="status-badge incomplete" style="font-size:0.7rem;">❌ Sesi Berakhir</span>`;
          actionBtn = `<button class="action-btn danger-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; cursor:not-allowed;" disabled>Sesi Habis</button>`;
        } else if (isNotStarte) {
          statusBadge = `<span class="status-badge warning" style="font-size:0.7rem; background:rgba(245,158,11,0.1); color:var(--warning);">⏳ Buka: ${formatDateTime(startTime)}</span>`;
          actionBtn = `<button class="action-btn secondary-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; cursor:not-allowed; opacity: 0.65;" disabled>🔒 Belum Dimulai</button>`;
        } else {
          statusBadge = `<span class="status-badge warning" style="font-size:0.7rem; background:rgba(99,102,241,0.1); color:var(--primary);">⏳ Durasi: ${ex.duration} Menit</span>`;
          actionBtn = `<button class="action-btn" style="width:100%; font-size:0.75rem; padding:0.4rem; background:var(--primary-grad);" onclick="startOnlineCbtExam('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ex.id)}', '${escapeJSAttr(student.id)}')">Mulai Ujian CBT (HP)</button>`;
        }

        let imageBadgeHTML = "";
        if (ex.image) {
          imageBadgeHTML = `
            <div style="width: 100%; height: 140px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); margin-top: 0.25rem; display: flex; justify-content: center; align-items: center;">
              <img src="${ex.image}" alt="Gambar Ujian" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
          `;
        }

        // Poin 4: Animasi Pulse Ping bagi Ujian Baru (Dirilis < 24 jam)
        const hoursSinceRelease = (now - releaseTime) / (1000 * 60 * 60);
        const isNewTask = hoursSinceRelease < 24;
        let newBadgeHTML = isNewTask ? `<span class="status-badge incomplete animate-pulse-glow" style="font-size:0.65rem; background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.3); font-weight:800; animation: pulseGlow 1.5s infinite; margin-right:0.35rem;">🆕 BARU</span>` : '';

        const card = document.createElement("div");
        card.style.background = "rgba(255,255,255,0.015)";
        card.style.border = "1px solid var(--border-color)";
        card.style.borderRadius = "var(--radius-md)";
        card.style.padding = "1rem";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "0.75rem";

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <strong style="font-family:var(--font-heading); font-size:0.9rem; color:var(--text-primary); display:inline-flex; align-items:center; gap:0.35rem;">
                ${newBadgeHTML} ${escapeHTML(ex.title)}
              </strong>
              <span style="font-size:0.7rem; color:var(--text-secondary); display:block; margin-top:2px;">${escapeHTML(sub.name)}</span>
            </div>
            ${statusBadge}
          </div>
          ${imageBadgeHTML}
          <div style="font-size:0.7rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
            <span>Soal: ${ex.questionBank ? ex.questionBank.length : 0} Butir Soal</span>
            <span>Batas: ${formatDateTime(endTime)}</span>
          </div>
          ${actionBtn}
        `;
        examsList.appendChild(card);
      }
    });
  });

  if (!hasAssignments) {
    assignmentsList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0;">Belum ada tugas daring aktif yang dirilis untuk Anda.</div>`;
  }
  if (!hasExams) {
    examsList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0;">Belum ada sesi ujian CBT aktif yang terjadwal untuk Anda.</div>`;
  }
}

function startOnlineAssignment(subjectId, assignmentId, studentId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  const assignment = subject.onlineAssignments.find(a => a.id === assignmentId);
  const student = appState.students.find(s => s.id === studentId);

  if (!subject || !assignment || !student) return;

  document.getElementById("lms-subject-chapter").innerText = `${subject.name} - Tugas Daring`;
  document.getElementById("lms-task-name").innerText = assignment.title;
  document.getElementById("lms-theory-text").innerText = `Pelajari materi pokok ${assignment.title} secara saksama di buku paket Anda, lalu selesaikan penugasan di bawah ini.`;

  // Handle custom image rendering in LMS modal
  const imgContainer = document.getElementById("lms-image-container");
  const taskImg = document.getElementById("lms-task-image");
  const taskImgDesc = document.getElementById("lms-task-image-desc");
  if (imgContainer && taskImg && taskImgDesc) {
    if (assignment.image) {
      taskImg.src = assignment.image;
      taskImgDesc.innerText = assignment.imageDesc || "Gambar pendukung tugas.";
      imgContainer.style.display = "block";
    } else {
      taskImg.src = "";
      imgContainer.style.display = "none";
    }
  }

  document.getElementById("lms-student-id").value = studentId;
  document.getElementById("lms-subject-id").value = subjectId;
  document.getElementById("lms-chapter-name").value = "ONLINE_ASSIGNMENT";
  document.getElementById("lms-task-type").value = assignmentId;
  document.getElementById("lms-task-item-name").value = "";

  // Dynamic question rendering V18
  const form = document.getElementById("lms-submission-form");
  if (form) {
    form.innerHTML = "";
    if (assignment.questions && assignment.questions.length > 0) {
      assignment.questions.forEach((q, qIdx) => {
        const qContainer = document.createElement("div");
        qContainer.className = "lms-question-item";
        qContainer.style.marginBottom = "1.25rem";
        qContainer.style.padding = "0.75rem";
        qContainer.style.background = "rgba(255,255,255,0.01)";
        qContainer.style.border = "1px solid var(--border-color)";
        qContainer.style.borderRadius = "var(--radius-sm)";

        let qInputHTML = "";
        if (q.type === "pg") {
          qInputHTML = `
            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
              ${[0, 1, 2, 3].map(optIdx => {
                const letter = ["A", "B", "C", "D"][optIdx];
                return `
                  <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:var(--text-secondary); cursor:pointer;">
                    <input type="radio" name="lms-ans-${q.id}" value="${optIdx}" required style="cursor:pointer; width:16px; height:16px; accent-color:var(--secondary);">
                    <strong style="color:var(--text-muted);">${letter}.</strong> ${escapeHTML(q.options[optIdx])}
                  </label>
                `;
              }).join("")}
            </div>
          `;
        } else {
          qInputHTML = `
            <div class="form-group" style="margin-top:0.5rem;">
              <textarea name="lms-ans-${q.id}" class="form-control" rows="3" placeholder="Ketik jawaban singkat/essay Anda di sini..." required style="resize:vertical; font-size:0.8rem; padding:0.5rem;"></textarea>
            </div>
          `;
        }

        qContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <strong style="font-size:0.85rem; color:var(--text-primary); line-height:1.4;">Soal ${qIdx + 1}. ${escapeHTML(q.questionText)}</strong>
            <span style="font-size:0.7rem; font-weight:700; color:var(--secondary); background:rgba(6,182,212,0.1); padding:2px 8px; border-radius:4px; margin-left:0.5rem; white-space:nowrap;">${q.points} Poin</span>
          </div>
          ${qInputHTML}
        `;
        form.appendChild(qContainer);
      });
    } else {
      // Legacy fallback
      const instrLabel = document.createElement("div");
      instrLabel.style.fontSize = "0.825rem";
      instrLabel.style.color = "var(--text-secondary)";
      instrLabel.style.marginBottom = "0.75rem";
      instrLabel.style.lineHeight = "1.5";
      instrLabel.innerText = assignment.question;
      form.appendChild(instrLabel);

      const formGroup = document.createElement("div");
      formGroup.className = "form-group";
      formGroup.innerHTML = `
        <label for="lms-answer-input" style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; display: block; text-transform: uppercase; letter-spacing: 0.3px;">Tulis Jawaban Anda Di Sini *</label>
        <textarea id="lms-answer-input" class="form-control" rows="4" placeholder="Ketik jawaban, langkah-langkah, atau kesimpulan Anda di sini..." required style="resize: vertical; font-family: var(--font-body); font-size: 0.85rem; padding: 0.75rem;"></textarea>
      `;
      form.appendChild(formGroup);
    }
    
    // Re-inject hidden fields that were wiped
    const hiddenFields = document.createElement("div");
    hiddenFields.innerHTML = `
      <input type="hidden" id="lms-student-id" value="${escapeHTML(studentId)}">
      <input type="hidden" id="lms-subject-id" value="${escapeHTML(subjectId)}">
      <input type="hidden" id="lms-chapter-name" value="ONLINE_ASSIGNMENT">
      <input type="hidden" id="lms-task-type" value="${escapeHTML(assignmentId)}">
      <input type="hidden" id="lms-task-item-name" value="">
    `;
    form.appendChild(hiddenFields);
  }

  document.getElementById("lms-modal").classList.add("active");
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function playCheatAlarmSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Siren sound: sawtooth wave oscillating between 600Hz and 1100Hz
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    
    const now = ctx.currentTime;
    osc.frequency.linearRampToValueAtTime(1100, now + 0.5);
    osc.frequency.linearRampToValueAtTime(600, now + 1.0);
    osc.frequency.linearRampToValueAtTime(1100, now + 1.5);
    osc.frequency.linearRampToValueAtTime(600, now + 2.0);
    osc.frequency.linearRampToValueAtTime(1100, now + 2.5);
    osc.frequency.linearRampToValueAtTime(600, now + 3.0);
    
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 3.0);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 3.0);
  } catch (e) {
    console.error("Gagal memutar suara alarm anti-cheat:", e);
  }
}

function handleCbtCheatViolation() {
  const modal = document.getElementById("cbt-exam-modal");
  if (!modal || !modal.classList.contains("active") || !appState.currentCbtExam) return;

  appState.cbtCheatCount = (appState.cbtCheatCount || 0) + 1;

  if (appState.cbtCheatCount === 1) {
    playCheatAlarmSound();
    setTimeout(() => {
      alert("🚨 PERINGATAN KERAS (KECURANGAN TERDETEKSI)!\n\nAnda terdeteksi beralih aplikasi atau keluar dari layar ujian (1x).\n\n⚠️ JIKA ANDA BERALIH APLIKASI SEKALI LAGI, UJIAN ANDA AKAN OTOMATIS DIKUNCI DAN JAWABAN AKAN LANGSUNG DIKIRIM!");
    }, 100);
  } else if (appState.cbtCheatCount >= 2) {
    playCheatAlarmSound();
    setTimeout(() => {
      alert("🚫 UJIAN DIKUNCI & DIBATALKAN!\n\nAnda terdeteksi beralih aplikasi sebanyak 2 kali.\nSesuai instruksi guru, ujian Anda otomatis dikunci dan jawaban dikirim saat ini juga.");
      submitOnlineCbtExam(true);
    }, 100);
  }
}

function startOnlineCbtExam(subjectId, examId, studentId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  const exam = subject.onlineExams.find(e => e.id === examId);
  const student = appState.students.find(s => s.id === studentId);

  if (!subject || !exam || !student) return;

  if (!confirm("Apakah Anda yakin ingin memulai ujian CBT ini sekarang? Durasi waktu pengerjaan akan segera berjalan secara mundur.")) {
    return;
  }

  appState.currentCbtExam = exam;
  appState.currentCbtExamSubjectId = subjectId;
  appState.currentCbtStudentId = studentId;
  appState.cbtStartTime = Date.now();
  appState.cbtCheatCount = 0;

  // Handle custom image rendering in CBT modal
  const imgContainer = document.getElementById("cbt-image-container");
  const examImg = document.getElementById("cbt-exam-image");
  const examImgDesc = document.getElementById("cbt-exam-image-desc");
  if (imgContainer && examImg && examImgDesc) {
    if (exam.image) {
      examImg.src = exam.image;
      examImgDesc.innerText = exam.imageDesc || "Gambar stimulus ujian.";
      imgContainer.style.display = "block";
    } else {
      examImg.src = "";
      imgContainer.style.display = "none";
    }
  }

  // Bind proctoring listeners
  if (appState.cbtVisibilityListener) {
    document.removeEventListener("visibilitychange", appState.cbtVisibilityListener);
  }
  if (appState.cbtBlurListener) {
    window.removeEventListener("blur", appState.cbtBlurListener);
  }

  appState.cbtVisibilityListener = () => {
    if (document.visibilityState === "hidden") {
      handleCbtCheatViolation();
    }
  };
  appState.cbtBlurListener = () => {
    handleCbtCheatViolation();
  };

  document.addEventListener("visibilitychange", appState.cbtVisibilityListener);
  window.addEventListener("blur", appState.cbtBlurListener);

  if (exam.questionBank && exam.questionBank.length > 0) {
    if (exam.shuffle !== false) {
      appState.cbtQuestions = shuffleArray(exam.questionBank);
    } else {
      appState.cbtQuestions = [...exam.questionBank];
    }
  } else {
    alert("Bank soal ujian ini masih kosong! Hubungi guru pengampu Anda.");
    return;
  }

  appState.cbtAnswers = {};
  appState.cbtCurrentQuestionIndex = 0;
  appState.cbtTimeRemaining = exam.duration * 60; // detik

  document.getElementById("cbt-exam-title").innerText = exam.title;
  document.getElementById("cbt-student-info").innerText = `Peserta: ${student.name} (${student.class || '8A'}) | Mapel: ${subject.name}`;

  if (appState.cbtTimerInterval) clearInterval(appState.cbtTimerInterval);
  appState.cbtTimerInterval = setInterval(() => {
    appState.cbtTimeRemaining--;
    if (appState.cbtTimeRemaining <= 0) {
      clearInterval(appState.cbtTimerInterval);
      alert("Waktu pengerjaan ujian habis! Sistem otomatis mengirimkan seluruh berkas jawaban Anda.");
      submitOnlineCbtExam();
    } else {
      updateCbtTimerDisplay();
    }
  }, 1000);

  updateCbtTimerDisplay();
  renderCbtQuestion();
  
  document.getElementById("cbt-exam-modal").classList.add("active");
}

function updateCbtTimerDisplay() {
  const minutes = Math.floor(appState.cbtTimeRemaining / 60);
  const seconds = appState.cbtTimeRemaining % 60;
  
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const timerEl = document.getElementById("cbt-timer");
  if (timerEl) {
    timerEl.innerText = formatted;
    if (appState.cbtTimeRemaining < 300) {
      timerEl.style.color = "var(--danger)";
    } else {
      timerEl.style.color = "var(--warning)";
    }
  }
}

function renderCbtQuestion() {
  const question = appState.cbtQuestions[appState.cbtCurrentQuestionIndex];
  if (!question) return;

  document.getElementById("cbt-question-number").innerText = `Pertanyaan ${appState.cbtCurrentQuestionIndex + 1} dari ${appState.cbtQuestions.length}`;
  
  const typeTag = document.getElementById("cbt-question-type-tag");
  let typeLabel = "Pilihan Ganda";
  if (question.type === "essay") typeLabel = "Essay (Ketik Teks)";
  if (question.type === "kertas") typeLabel = "Jawab di Kertas Cakar";
  if (question.type === "kustom") typeLabel = "Soal Kustom";
  typeTag.innerText = typeLabel;

  document.getElementById("cbt-question-text").innerText = question.question;

  const answerContainer = document.getElementById("cbt-answer-container");
  answerContainer.innerHTML = "";

  const savedAnswer = appState.cbtAnswers[question.id];

  if (question.type === "pg") {
    const alphabet = ["A", "B", "C", "D"];
    question.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = `action-btn secondary-btn`;
      btn.style.width = "100%";
      btn.style.padding = "0.75rem 1rem";
      btn.style.justifyContent = "flex-start";
      btn.style.fontSize = "0.85rem";
      btn.style.borderRadius = "var(--radius-sm)";
      btn.style.border = "1px solid var(--border-color)";
      btn.style.background = "rgba(255,255,255,0.01)";
      
      const isSelected = savedAnswer !== undefined && parseInt(savedAnswer, 10) === idx;
      if (isSelected) {
        btn.style.background = "rgba(99,102,241,0.1)";
        btn.style.borderColor = "var(--primary)";
      }
      
      btn.innerHTML = `<span style="font-weight:800; color:var(--primary); margin-right:0.75rem;">${alphabet[idx]}.</span> ${escapeHTML(opt)}`;
      btn.onclick = () => selectCbtPgAnswer(question.id, idx);
      answerContainer.appendChild(btn);
    });
  } else if (question.type === "essay" || question.type === "kertas" || question.type === "kustom") {
    if (question.type === "kertas") {
      answerContainer.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-sm); padding: 0.65rem; font-size: 0.72rem; color: var(--warning); line-height: 1.4; margin-bottom: 0.25rem;">
          ⚠️ <strong>BUKTI CAKAR KERTAS:</strong> Kerjakan perhitungan rumit/cara pengerjaan soal ini di kertas cakar Anda secara teratur. Lalu ketikkan konfirmasi pengerjaan/jawaban akhir di bawah ini agar dinilai guru!
        </div>
      `;
    }
    const textarea = document.createElement("textarea");
    textarea.className = "form-control";
    textarea.rows = 4;
    textarea.placeholder = question.type === "kertas" 
      ? "Contoh: Sudah dikerjakan di kertas cakar dengan cara eliminasi. Hasil akhir x = 3 dan y = 2..." 
      : "Ketik penjelasan jawaban esai Anda secara lengkap...";
    textarea.value = savedAnswer || "";
    textarea.style.resize = "vertical";
    textarea.style.fontSize = "0.85rem";
    textarea.style.padding = "0.6rem";
    textarea.oninput = (e) => saveCbtAnswer(question.id, e.target.value);
    answerContainer.appendChild(textarea);
  }

  document.getElementById("cbt-prev-btn").disabled = appState.cbtCurrentQuestionIndex === 0;
  
  const nextBtn = document.getElementById("cbt-next-btn");
  if (appState.cbtCurrentQuestionIndex === appState.cbtQuestions.length - 1) {
    nextBtn.innerText = "💾 Selesai & Kirim Ujian";
    nextBtn.style.background = "var(--success)";
  } else {
    nextBtn.innerText = "Berikutnya ➡️";
    nextBtn.style.background = "var(--primary-grad)";
  }
}

function selectCbtPgAnswer(qId, optionIdx) {
  appState.cbtAnswers[qId] = optionIdx;
  renderCbtQuestion();
}

function saveCbtAnswer(qId, val) {
  appState.cbtAnswers[qId] = val;
}

function cbtNavigateQuestion(dir) {
  if (dir === 1 && appState.cbtCurrentQuestionIndex === appState.cbtQuestions.length - 1) {
    submitOnlineCbtExam();
    return;
  }

  const targetIdx = appState.cbtCurrentQuestionIndex + dir;
  if (targetIdx >= 0 && targetIdx < appState.cbtQuestions.length) {
    appState.cbtCurrentQuestionIndex = targetIdx;
    renderCbtQuestion();
    document.getElementById("cbt-nav-grid-overlay").style.display = "none";
  }
}

async function submitOnlineCbtExam(isCheated = false) {
  const subjectId = appState.currentCbtExamSubjectId;
  const examId = appState.currentCbtExam ? appState.currentCbtExam.id : null;
  const studentId = appState.currentCbtStudentId;
  
  if (!subjectId || !examId || !studentId) return;

  const subject = appState.subjects.find(s => s.id === subjectId);
  const exam = subject.onlineExams.find(e => e.id === examId);
  const student = appState.students.find(s => s.id === studentId);

  if (!subject || !exam || !student) return;

  // Proctoring listeners cleanup (Important!)
  if (appState.cbtVisibilityListener) {
    document.removeEventListener("visibilitychange", appState.cbtVisibilityListener);
    appState.cbtVisibilityListener = null;
  }
  if (appState.cbtBlurListener) {
    window.removeEventListener("blur", appState.cbtBlurListener);
    appState.cbtBlurListener = null;
  }

  // Minimum time checking (Only if they didn't cheat!)
  if (!isCheated) {
    const minSubmitTime = exam.minSubmitTime || 0;
    if (minSubmitTime > 0 && appState.cbtStartTime) {
      const secondsElapsed = Math.floor((Date.now() - appState.cbtStartTime) / 1000);
      const minSeconds = minSubmitTime * 60;
      if (secondsElapsed < minSeconds) {
        const remainingMinutes = Math.ceil((minSeconds - secondsElapsed) / 60);
        alert(`⚠️ ANDA BELUM DIPERBOLEHKAN MENGIRIM!\n\nGuru menetapkan batas minimal pengerjaan adalah ${minSubmitTime} menit sebelum diperbolehkan mengirim.\n\nSilakan periksa kembali jawaban Anda. Sisa waktu tunggu: ${remainingMinutes} menit.`);
        return; // BLOCK SUBMIT!
      }
    }
  }

  if (appState.cbtTimerInterval) clearInterval(appState.cbtTimerInterval);

  if (window.__apiMode) {
    try {
      const result = await ApiClient.public.submitCbt({
        studentId,
        subjectId,
        examId,
        answers: appState.cbtAnswers,
        questionPackage: appState.cbtQuestions.map((q) => q.id),
        isCheated,
        cheatCount: appState.cbtCheatCount || 0,
      });

      const refresh = await ApiClient.public.getStudent(studentId);
      if (refresh.student) {
        const idx = appState.students.findIndex((s) => s.id === studentId);
        if (idx !== -1) {
          appState.students[idx] = { ...appState.students[idx], ...refresh.student };
        }
      }
      if (refresh.subjects) mergeSubjectsIntoAppState(refresh.subjects);

      appState.currentCbtExam = null;
      appState.cbtQuestions = [];
      appState.cbtAnswers = {};

      document.getElementById("cbt-exam-modal").classList.remove("active");
      document.getElementById("cbt-nav-grid-overlay").style.display = "none";

      renderStudentPortal();

      if (isCheated) {
        alert(result.message || "🚨 Ujian Anda ditutup karena terdeteksi beralih aplikasi sebanyak 2 kali. Jawaban terkirim dengan status Pelanggaran/Curang.");
      } else {
        alert(result.message || "Terima kasih! Seluruh lembar jawaban ujian CBT Anda telah dikirim dan terekam secara aman.");
      }
      return;
    } catch (err) {
      alert(err.message || "Gagal mengirim ujian CBT ke server.");
      return;
    }
  }

  // Hitung nilai PG otomatis
  let pgCount = 0;
  let pgCorrect = 0;

  exam.questionBank.forEach(q => {
    if (q.type === "pg") {
      pgCount++;
      const ans = appState.cbtAnswers[q.id];
      if (ans !== undefined && parseInt(ans, 10) === q.correct) {
        pgCorrect++;
      }
    }
  });

  const autoGradePg = pgCount > 0 ? Math.round((pgCorrect / pgCount) * 100) : null;

  if (!exam.submissions) exam.submissions = {};
  exam.submissions[studentId] = {
    package: appState.cbtQuestions.map(q => q.id),
    answers: appState.cbtAnswers,
    submittedAt: new Date().toISOString(),
    grade: isCheated ? 0 : (autoGradePg !== null && pgCount === exam.questionBank.length ? autoGradePg : null),
    autoGradePg: isCheated ? 0 : autoGradePg,
    isCheated: isCheated,
    cheatCount: appState.cbtCheatCount || 0
  };

  // Jika 100% PG dan tidak curang, langsung suntik nilai ke database Ulangan (UH) rapor bab 1
  if (!isCheated && autoGradePg !== null && pgCount === exam.questionBank.length) {
    if (subject.chapters && subject.chapters.length > 0) {
      const targetChapter = subject.chapters[0].name;
      if (!student.grades[subjectId]) {
        student.grades[subjectId] = { chapters: {} };
      }
      if (!student.grades[subjectId].chapters[targetChapter]) {
        student.grades[subjectId].chapters[targetChapter] = createEmptyChapterGrades();
      }
      student.grades[subjectId].chapters[targetChapter].ulangan = autoGradePg;

      recalculateSubjectCompleteness(student, subjectId);
    }
  } else if (isCheated) {
    // Suntik nilai 0 karena curang!
    if (subject.chapters && subject.chapters.length > 0) {
      const targetChapter = subject.chapters[0].name;
      if (!student.grades[subjectId]) {
        student.grades[subjectId] = { chapters: {} };
      }
      if (!student.grades[subjectId].chapters[targetChapter]) {
        student.grades[subjectId].chapters[targetChapter] = createEmptyChapterGrades();
      }
      student.grades[subjectId].chapters[targetChapter].ulangan = 0; // Nilai 0 karena curang!
      student.completeness[subjectId] = false; // Gagalkan kelengkapan belajar!
    }
  }

  saveData();

  appState.currentCbtExam = null;
  appState.cbtQuestions = [];
  appState.cbtAnswers = {};
  
  document.getElementById("cbt-exam-modal").classList.remove("active");
  document.getElementById("cbt-nav-grid-overlay").style.display = "none";
  
  renderStudentPortal();
  
  if (isCheated) {
    alert("🚨 Ujian Anda ditutup karena terdeteksi beralih aplikasi sebanyak 2 kali. Jawaban terkirim dengan status Pelanggaran/Curang.");
  } else {
    alert("Terima kasih! Seluruh lembar jawaban ujian CBT Anda telah dikirim dan terekam secara aman.");
  }
}

function toggleCbtNavGrid() {
  const popover = document.getElementById("cbt-nav-grid-overlay");
  if (!popover) return;
  
  const isHidden = popover.style.display === "none";
  
  if (isHidden) {
    const buttonsContainer = document.getElementById("cbt-nav-grid-buttons");
    buttonsContainer.innerHTML = "";

    appState.cbtQuestions.forEach((q, idx) => {
      const btn = document.createElement("button");
      btn.className = `action-btn ${idx === appState.cbtCurrentQuestionIndex ? '' : 'secondary-btn'}`;
      btn.style.width = "100%";
      btn.style.padding = "0.5rem 0";
      btn.style.fontSize = "0.8rem";
      
      const hasAnswer = appState.cbtAnswers[q.id] !== undefined && appState.cbtAnswers[q.id] !== "";
      if (hasAnswer && idx !== appState.cbtCurrentQuestionIndex) {
        btn.style.background = "rgba(16, 185, 129, 0.15)";
        btn.style.borderColor = "var(--success)";
        btn.style.color = "var(--success)";
      }

      btn.innerText = (idx + 1).toString();
      btn.onclick = () => {
        appState.cbtCurrentQuestionIndex = idx;
        renderCbtQuestion();
        popover.style.display = "none";
      };
      buttonsContainer.appendChild(btn);
    });

    popover.style.display = "block";
  } else {
    popover.style.display = "none";
  }
}

function renderStudentTableHeaders() {
  const tableHead = document.querySelector(".student-table thead tr");
  if (!tableHead) return;

  if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
    tableHead.innerHTML = `
      <th class="text-center" style="width: 50px; padding: 0.75rem 0.5rem;">Absen</th>
      <th style="padding-left: 1rem;">Siswa</th>
      <th class="text-center">Rata-rata</th>
      <th class="text-center">Status</th>
    `;
  } else {
    tableHead.innerHTML = `
      <th class="text-center" style="width: 50px; padding: 0.75rem 0.5rem;">Absen</th>
      <th style="padding-left: 1rem;">Siswa</th>
      <th class="text-center">Nilai Akhir</th>
      <th class="text-center">Status</th>
    `;
  }
}

function renderStudentTable() {
  const tbody = document.getElementById("student-table-body");
  tbody.innerHTML = "";

  const filterValue = appState.teacherFilter;
  const classFilterValue = appState.teacherClassFilter || "all";
  const searchValue = (appState.teacherSearch || "").toLowerCase().trim();
  const assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);

  const filteredStudents = appState.students.filter(student => {
    const matchesSearch = (student.name || "").toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;

    // Filter by class
    if (classFilterValue !== "all" && student.class !== classFilterValue) return false;

    if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
      const details = getOverallStudentCompleteness(student);
      if (filterValue === "complete" && !details.isAllComplete) return false;
      if (filterValue === "incomplete" && details.isAllComplete) return false;
    } else {
      let allAssignedComplete = true;
      assignedSubjects.forEach(s => {
        if (student.completeness[s.id] !== true) allAssignedComplete = false;
      });
      
      if (filterValue === "complete" && !allAssignedComplete) return false;
      if (filterValue === "incomplete" && allAssignedComplete) return false;
    }

    return true;
  });

  // CEK APAKAH GURU MENGAJAR DI KELAS INI
  let isClassTaught = true;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2" && classFilterValue !== "all") {
    const rawTeacher = appState.teachers.find(t => t.id === appState.activeTeacherId);
    if (rawTeacher && rawTeacher.classes) {
      const teacherClasses = rawTeacher.classes.split(',').map(c => c.trim().toLowerCase());
      isClassTaught = teacherClasses.includes(classFilterValue.toLowerCase());
    }
  }

  if (filteredStudents.length === 0 || !isClassTaught) {
    const colSpan = 4;
    const totalInClass = classFilterValue !== "all" 
      ? appState.students.filter(s => s.class === classFilterValue).length 
      : appState.students.length;

    let emptyStateHTML = "";
    if (!isClassTaught) {
      emptyStateHTML = `
        <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.5rem; line-height: 1; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-rounded" style="font-size: 3.2rem; font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48; color: var(--danger);">error</span>
        </div>
        <h3 style="margin-bottom: 0.4rem; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">Data Tidak Tersedia</h3>
        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto 1.15rem auto; font-size: 0.75rem; line-height: 1.5;">
          Data tidak tersedia karena Anda tidak mengajar di kelas <strong>${escapeHTML(classFilterValue)}</strong>.
        </p>
      `;
    } else if (totalInClass === 0) {
      const classLabel = classFilterValue !== "all" ? `kelas <strong>${escapeHTML(classFilterValue)}</strong>` : "database SiGrade";
      emptyStateHTML = `
        <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.5rem; line-height: 1; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-rounded" style="font-size: 3.2rem; font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48; color: var(--indigo);">folder_open</span>
        </div>
        <h3 style="margin-bottom: 0.4rem; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">Siswa Belum Terdaftar</h3>
        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto 1.15rem auto; font-size: 0.75rem; line-height: 1.5;">
          Belum ada data siswa terdaftar untuk ${classLabel}. Silakan tambahkan melalui pengaturan rombel.
        </p>
        <button onclick="switchSidebarView('guru', 'config')" class="action-btn" style="background: var(--primary-grad); font-size: 0.72rem; padding: 0.4rem 0.85rem; height: 32px; display: inline-flex; align-items: center; gap: 0.35rem; margin: 0 auto; border-radius: var(--radius-sm); border: none; cursor: pointer; color: white; font-weight: 700;">
          <span class="material-symbols-rounded" style="font-size:14px;">settings</span> Atur di Pengaturan (CSV)
        </button>
      `;
    } else {
      emptyStateHTML = `
        <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.5rem; line-height: 1; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-rounded" style="font-size: 3.2rem; font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48; color: var(--danger);">error</span>
        </div>
        <h3 style="margin-bottom: 0.4rem; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">Data Tidak Tersedia</h3>
        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto 1.15rem auto; font-size: 0.75rem; line-height: 1.5;">
          Siswa dengan kata kunci pencarian tersebut tidak terdaftar di kelas ini.
        </p>
      `;
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="${colSpan}" class="table-empty-state" style="padding: 3rem 1.5rem;">
          ${emptyStateHTML}
        </td>
      </tr>
    `;
    return;
  }

  filteredStudents.forEach((student, index) => {
    const avatarContent = student.absentNo !== undefined && student.absentNo !== "-" ? student.absentNo : "-";

    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    
    // Split-View active row highlight styling V6
    const isActive = appState.selectedStudentId === student.id;
    tr.className = `clickable-student-row ${isActive ? "active-teacher-row" : ""}`;
    tr.setAttribute("onclick", `selectTeacherStudent('${escapeJSAttr(student.id)}')`);

    const genderDisplay = student.gender === "L" ? `<span style="color: #60a5fa; font-weight: 700; font-size: 0.78rem; margin-left: 0.35rem;" title="Laki-laki">♂</span>` : (student.gender === "P" ? `<span style="color: #f472b6; font-weight: 700; font-size: 0.78rem; margin-left: 0.35rem;" title="Perempuan">♀</span>` : "");
    const absenNo = student.absentNo !== undefined && student.absentNo !== "-" ? student.absentNo : "-";

    if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
      const comp = getOverallStudentCompleteness(student);
      const avg = getStudentOverallAverage(student);
      
      let hasKatrol = false;
      appState.subjects.forEach(sub => {
    if (!isSubjectValidForStudentClass(sub.name, student.class)) return;

        const calc = calculateStudentSubjectScore(student, sub.id);
        if (calc.isKatrol) hasKatrol = true;
      });

      const avgDisplay = avg === null ? '—' : avg;
      const scoreColor = avg === null ? 'var(--text-muted)' : (avg >= 85 ? '#10b981' : (avg >= 75 ? '#06b6d4' : (avg >= 70 ? '#f59e0b' : '#ef4444')));

      tr.innerHTML = `
        <td class="text-center">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.15); border-radius:6px; font-size:0.72rem; font-weight:800; color:var(--indigo); font-family:var(--font-heading);">${absenNo}</span>
        </td>
        <td>
          <span class="table-student-name" id="table-name-${student.id}" style="font-size:0.82rem;">${escapeHTML(student.name)}</span>${genderDisplay}
          <span style="font-size:0.58rem; background:rgba(99,102,241,0.08); color:var(--indigo); padding:1px 5px; border-radius:3px; margin-left:0.3rem; font-weight:700; display:inline; vertical-align:middle;">${escapeHTML(student.class || 'X-A')}</span>
        </td>
        <td class="text-center">
          <span id="table-score-${student.id}" style="font-weight:800; font-size:0.92rem; font-family:var(--font-heading); color:${hasKatrol && avg !== null ? '#ef4444' : scoreColor};">${avgDisplay}</span>
          <div class="tooltip-wrapper" id="table-katrol-tag-${student.id}" style="display:${hasKatrol && avg !== null ? 'inline' : 'none'}; margin-left:2px;">
            <span style="font-size:0.5rem; font-weight:700; color:#ef4444;">KKM</span>
          </div>
        </td>
        <td class="text-center">
          <span class="status-badge ${comp.isAllComplete ? 'complete' : 'incomplete'}" style="display:inline-flex; align-items:center; gap:0.2rem;">
            ${comp.isAllComplete 
              ? '<span class="material-symbols-rounded" style="font-size:13px; color:#34d399;">check_circle</span> Lengkap' 
              : '<span class="material-symbols-rounded" style="font-size:13px; color:#d4a053;">radio_button_unchecked</span> Belum'}
          </span>
        </td>
      `;
    } else {
      const sub = assignedSubjects[0];
      if (!sub) {
        tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem 0;">Belum mengampu mata pelajaran.</td>`;
        tbody.appendChild(tr);
        return;
      }

      const scoreInfo = calculateStudentSubjectScore(student, sub.id);
      const isComplete = student.completeness[sub.id] === true;
      const hasScores = hasAnyRecordedGradesForSubject(student, sub.id);
      const scoreDisplay = hasScores ? scoreInfo.asli : '—';

      tr.innerHTML = `
        <td class="text-center">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.15); border-radius:6px; font-size:0.72rem; font-weight:800; color:var(--indigo); font-family:var(--font-heading);">${absenNo}</span>
        </td>
        <td>
          <span class="table-student-name" id="table-name-${student.id}" style="font-size:0.82rem;">${escapeHTML(student.name)}</span>${genderDisplay}
          <span style="font-size:0.58rem; background:rgba(99,102,241,0.08); color:var(--indigo); padding:1px 5px; border-radius:3px; margin-left:0.3rem; font-weight:700; display:inline; vertical-align:middle;">${escapeHTML(student.class || 'X-A')}</span>
        </td>
        <td class="text-center">
          <span id="table-score-${student.id}" style="font-weight:800; font-size:0.92rem; font-family:var(--font-heading); color:${hasScores && scoreInfo.isKatrol ? '#ef4444' : (hasScores ? 'var(--emerald)' : 'var(--text-muted)')};">${scoreDisplay}</span>
          <div class="tooltip-wrapper" id="table-katrol-tag-${student.id}" style="display:${hasScores && scoreInfo.isKatrol ? 'inline' : 'none'}; margin-left:2px;">
            <span style="font-size:0.5rem; font-weight:700; color:#ef4444;">KKM</span>
          </div>
        </td>
        <td class="text-center">
          <span class="status-badge ${isComplete ? 'complete' : 'incomplete'}" style="display:inline-flex; align-items:center; gap:0.2rem;">
            ${isComplete 
              ? '<span class="material-symbols-rounded" style="font-size:13px; color:#34d399;">check_circle</span> Lengkap' 
              : '<span class="material-symbols-rounded" style="font-size:13px; color:#d4a053;">radio_button_unchecked</span> Belum'}
          </span>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

// Toggle Row Expansion - contains premium direct inline editable grades inputs V5
// --- SPLIT-VIEW STATE MANAGER & PANEL RENDERER V6 ---
function selectTeacherStudent(studentId) {
  // If clicked again, we keep it selected, but if on mobile we open the drawer again
  if (appState.selectedStudentId === studentId) {
    if (window.innerWidth < 1024) {
      const rightPane = document.getElementById("teacher-right-pane");
      if (rightPane) rightPane.classList.add("mobile-drawer-active");
    }
    return;
  }
  
  appState.selectedStudentId = studentId;
  
  // Highlight active row in Lef side list
  document.querySelectorAll(".clickable-student-row").forEach(row => {
    row.classList.remove("active-teacher-row");
  });
  
  // Find active row and add highlighting class
  const activeTr = document.querySelector(`tr[onclick*="selectTeacherStudent('${escapeJSAttr(studentId)}')"]`) || 
                   document.querySelector(`tr[onclick*='selectTeacherStudent("${escapeJSAttr(studentId)}")']`);
  if (activeTr) {
    activeTr.classList.add("active-teacher-row");
  }
  
  // Render Sisi Kanan detail pane
  renderTeacherRightPane();
  
  // On mobile view (< 1024px), trigger full-screen modal/drawer
  if (window.innerWidth < 1024) {
    const rightPane = document.getElementById("teacher-right-pane");
    if (rightPane) rightPane.classList.add("mobile-drawer-active");
  }
}

function closeTeacherRightPane() {
  appState.selectedStudentId = null;
  
  // Remove row highlights
  document.querySelectorAll(".clickable-student-row").forEach(row => {
    row.classList.remove("active-teacher-row");
  });
  
  // Remove mobile drawer class
  const rightPane = document.getElementById("teacher-right-pane");
  if (rightPane) {
    rightPane.classList.remove("mobile-drawer-active");
  }
  
  renderTeacherRightPane();
}

function renderTeacherRightPane() {
  const defaultPane = document.getElementById("teacher-right-default-pane");
  const detailPane = document.getElementById("teacher-right-detail-pane");
  
  if (!defaultPane || !detailPane) return;
  
  if (appState.selectedStudentId === null) {
    defaultPane.style.display = "flex";
    detailPane.style.display = "none";
    renderIncompleteStudentsList();
    return;
  }
  
  defaultPane.style.display = "none";
  detailPane.style.display = "flex";
  
  const student = appState.students.find(s => s.id === appState.selectedStudentId);
  if (!student) {
    closeTeacherRightPane();
    return;
  }
  
  const initials = student.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const isWali = appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2";
  
  // Determine subjects to edit
  let activeSubjects = appState.subjects;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    activeSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  }
  
  let subjectsHTML = "";
  activeSubjects.forEach(sub => {
    const calc = calculateStudentSubjectScore(student, sub.id);
    const teacher = appState.teachers.find(t => t.id === sub.teacherId) || { name: "Guru Pengampu" };
    const isComplete = student.completeness[sub.id] === true;
    
    // Determine selected chapter index defensively
    let chIdx = Math.min(appState.currSelectedChapterIdx || 0, calc.chapters.length - 1);
    chIdx = Math.max(0, chIdx);
    
    let babBreakdownHTML = "";
    const ch = calc.chapters[chIdx];
    if (ch) {
      const dbChapter = sub.chapters.find(c => c.name === ch.name) || { targetMaxWeight: 30, weights: {} };
      const targetMax = dbChapter.targetMaxWeight !== undefined ? dbChapter.targetMaxWeight : 30;
      
      let tasksListHTML = "";
      ch.tasks.forEach(t => {
        const weights = ch.weights || {};
        const tWeight = weights[t.name] !== undefined ? weights[t.name] : 1;
        
        tasksListHTML += `
          <div style="display:flex; align-items:center; gap:0.4rem; padding:0.35rem 0.5rem; border-bottom:1px dashed rgba(255,255,255,0.04); background:rgba(255,255,255,0.015); border-radius:4px; margin-bottom:0.25rem; flex-wrap:wrap;">
            <span style="font-weight:700; font-size:0.72rem; color:var(--text-primary); white-space:nowrap;">📚 ${escapeHTML(t.name)} <span style="font-size:0.58rem; color:var(--text-muted); font-weight:normal;">(Bobot: ${tWeight})</span></span>
            <div style="display:flex; align-items:center; gap:0.3rem; margin-left:auto;">
              <span style="font-size:0.6rem; color:var(--text-secondary); font-weight:600;">Nilai:</span>
              <input type="number" min="0" max="100" class="inline-grade-input" style="width:54px; height:24px; font-size:0.75rem; font-weight:700; padding:0 0.25rem; border-radius:4px; text-align:center;" 
                value="${t.score}"
                oninput="updateInlineGrade('${escapeJSAttr(student.id)}', '${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', 'task', '${escapeJSAttr(t.name)}', this.value)" placeholder="-">
            </div>
          </div>
        `;
      });
      
      const weights = ch.weights || {};
      
      const ulWeight = weights['ulangan'] !== undefined ? weights['ulangan'] : 1;
      const totalWeightSum = ch.tasks.reduce((acc, t) => acc + (weights[t.name] !== undefined ? parseInt(weights[t.name], 10) : 1), 0) + parseInt(ulWeight, 10);
      // Note: tugasAkhir removed — only dynamic tasks and UH remain
      
      let weightStatusColor = "var(--success)";
      if (totalWeightSum !== targetMax) {
        weightStatusColor = "var(--warning)";
      }
      
      babBreakdownHTML += `
        <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:6px; padding:0.5rem; display:flex; flex-direction:column; gap:0.4rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; font-weight:700; color:var(--text-primary); margin-bottom:0.5rem; border-bottom:1px solid var(--border); padding-bottom:0.35rem; flex-wrap:wrap; gap:0.15rem;">
            <span>📂 ${escapeHTML(ch.name)}${dbChapter.title ? ` <span style="opacity:0.6; font-weight:normal; margin:0 0.35rem;">|</span> <span style="color:var(--text-secondary);">${escapeHTML(dbChapter.title)}</span>` : ' <span style="opacity:0.6; font-weight:normal; margin:0 0.35rem;">|</span> <span style="color:var(--text-secondary); font-weight:normal;">Detail Materi / Tugas</span>'}</span>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span style="font-size:0.62rem; color:var(--text-muted); background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
                Bobot: <span id="bobot-indicator-${student.id}-${sub.id}-${ch.name.replace(/\s+/g, '')}" style="color:${weightStatusColor}; font-weight:800;">${totalWeightSum}/${targetMax}</span>
              </span>
              <span id="avg-${student.id}-${sub.id}-${ch.name.replace(/\s+/g, '')}" style="color:var(--secondary); font-size:0.68rem; font-weight:800; background:rgba(99,102,241,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(99,102,241,0.15);">Rerata: ${ch.average}</span>
            </div>
          </div>
          
          ${tasksListHTML}
          
          
          <!-- Ulangan (compact) -->
          <div style="display:flex; align-items:center; gap:0.4rem; padding:0.35rem 0.5rem; background:var(--surface-0); border-radius:4px; flex-wrap:wrap;">
            <span style="font-weight:700; font-size:0.72rem; color:var(--text-primary); white-space:nowrap;">✝ Ulangan Harian <span style="font-size:0.58rem; color:var(--text-muted); font-weight:normal;">(Bobot: ${ulWeight})</span></span>
            <div style="display:flex; align-items:center; gap:0.3rem; margin-left:auto;">
              <span style="font-size:0.6rem; color:var(--text-secondary); font-weight:600;">Nilai:</span>
              <input type="number" min="0" max="100" class="inline-grade-input" style="width:54px; height:24px; font-size:0.75rem; font-weight:700; padding:0 0.25rem; border-radius:4px; text-align:center;" 
                value="${ch.ulangan}"
                oninput="updateInlineGrade('${escapeJSAttr(student.id)}', '${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', 'ulangan', null, this.value)" placeholder="-">
            </div>
          </div>
        </div>
      `;
    }
    
    // Generate chapter tabs
    let chapterTabsHTML = `
      <div class="detail-chapter-tabs">
        ${calc.chapters.map((c, idx) => {
          const dbC = sub.chapters.find(chap => chap.name === c.name);
          return `
          <button class="detail-chapter-tab-btn ${idx === chIdx ? 'active' : ''}" 
            title="${escapeHTML(dbC && dbC.title ? dbC.title : c.name)}"
            onclick="selectChapterTab(${idx})">
            ${escapeHTML(c.name)}
          </button>
          `;
        }).join('')}
      </div>
    `;
    
    subjectsHTML += `
      <div style="border:1px solid var(--border); border-radius:6px; padding:0.6rem; background:var(--bg-card-solid); margin-bottom:0.5rem; display:flex; flex-direction:column; gap:0.35rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border); padding-bottom:0.35rem; flex-wrap:wrap; gap:0.3rem; margin-bottom:0.25rem;">
          <div>
            <strong style="font-family:var(--font-heading); font-size:0.8rem; color:var(--text-primary); display:block;">${escapeHTML(sub.name)}</strong>
            <span style="font-size:0.62rem; color:var(--text-secondary);">Guru: ${escapeHTML(teacher.name)} | KKM: ${sub.kkm}</span>
          </div>
          
          <div style="display:flex; align-items:center; gap:0.6rem; margin-top:2px; flex-wrap:wrap; justify-content:flex-end;">
            ${calc.asli < sub.kkm ? `
            <button onclick="triggerAIKatrol('${escapeJSAttr(student.id)}')" class="katrol-ai-btn-gemini" title="Terdapat nilai di bawah KKM, klik untuk Katrol dengan AI" style="padding: 0.15rem 0.5rem; font-size: 0.6rem; height: 24px; border-radius:4px;">
              <span class="material-symbols-rounded" style="font-size: 13px; position: relative; z-index: 1;">auto_awesome</span> 
              <span style="position: relative; z-index: 1; letter-spacing: 0.2px;">Katrol AI</span>
            </button>
            ` : ''}
            <!-- Subject task toggle switch -->
            <div class="toggle-switch-wrapper" style="display:flex; align-items:center; gap:0.35rem;">
              <label class="toggle-switch" style="transform:scale(0.8);">
                <input type="checkbox" id="complete-${student.id}-${sub.id}" ${isComplete ? "checked" : ""} 
                  onchange="updateInlineCompleteness('${escapeJSAttr(student.id)}', '${escapeJSAttr(sub.id)}', this.checked)">
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label" style="font-size:0.62rem; font-weight:700; color:var(--text-primary);">Lengkap</span>
            </div>
          </div>
        </div>
        
        ${chapterTabsHTML}
        
        <div class="detailed-babs-grid">
          ${babBreakdownHTML}
        </div>
        
        <!-- Summary block inside detail card -->
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.3rem; border-top:1px solid var(--border); padding-top:0.4rem; text-align:center;">
          <div style="position:relative;">
            <div style="font-size:0.58rem; color:var(--text-secondary); margin-bottom:2px; display:flex; align-items:center; justify-content:center; gap:0.2rem;">
              <span class="material-symbols-rounded" style="font-size:10px; color:#f59e0b;">star</span>
              PSAT
            </div>
            <input type="number" min="0" max="100"
              class="inline-grade-input"
              style="width:52px; height:26px; font-size:0.8rem; font-weight:700; padding:0 0.25rem; border-radius:4px; text-align:center; color:#f59e0b; border-color:rgba(245,158,11,0.3); background:rgba(245,158,11,0.07);"
              value="${(student.grades[sub.id] && student.grades[sub.id].psat !== undefined) ? student.grades[sub.id].psat : ''}"
              placeholder="-"
              oninput="updatePsatGrade('${escapeJSAttr(student.id)}', '${escapeJSAttr(sub.id)}', this.value)">
          </div>
          <div>
            <div style="font-size:0.58rem; color:var(--text-secondary);">Nilai Asli</div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-muted);" id="asli-${student.id}-${sub.id}">${hasAnyRecordedGradesForSubject(student, sub.id) ? calc.asli : '—'}</div>
          </div>
          <div>
            <div style="font-size:0.58rem; color:var(--text-secondary);">Nilai Akhir (KKM: ${sub.kkm})</div>
            <div style="font-weight:800; font-size:0.9rem; color:${calc.isKatrol ? '#ef4444' : 'var(--success)'};" id="akhir-${student.id}-${sub.id}">
              ${hasAnyRecordedGradesForSubject(student, sub.id) ? calc.akhir : '—'}
            </div>
          </div>
        </div>
      </div>
    `;
  });
  const actionsHTML = '';
  
  detailPane.innerHTML = `
    <!-- Detail Pane Header with Close Button (compact) -->
    <div style="display:flex; justify-content:center; align-items:center; border-bottom:1px solid var(--border); padding-bottom:1.5rem; margin-bottom:0.5rem; position:relative;">
      <!-- Close Button (Absolute Top Right) -->
      <button onclick="closeTeacherRightPane()" class="icon-btn" style="position:absolute; top:0; right:0; width:26px; height:26px; border-radius:50%; font-size:0.75rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:var(--text-secondary); cursor:pointer; z-index:10;" title="Tutup Detail">
        ✏
      </button>
      
      <!-- Center Wrapper for Photo and Info -->
      <div style="display:flex; align-items:center; gap:1.5rem; max-width: 90%;">
        
        <!-- Jumbo Photo Container -->
        <div style="position: relative; width: 150px; height: 250px; border-radius: 12px; overflow: hidden; background: var(--primary-grad); box-shadow: 0 6px 16px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" title="Klik untuk mengubah foto" onclick="document.getElementById('photo-upload-${student.id}').click()">
          ${student.photoBase64 ? 
            `<img src="${student.photoBase64}" alt="Foto ${escapeHTML(student.name)}" style="width: 100%; height: 100%; object-fit: cover;">` : 
            `<span style="color:white; font-family:var(--font-heading); font-weight:800; font-size:3.5rem;">${initials}</span>`
          }
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); height: 30px; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
            <span class="material-symbols-rounded" style="font-size: 16px; color: white;">photo_camera</span>
          </div>
        </div>
        <input type="file" id="photo-upload-${student.id}" style="display:none;" accept="image/*" onchange="uploadStudentPhoto('${escapeJSAttr(student.id)}', this)">
        
        <!-- Info Container (Left aligned text) -->
        <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: left; width: 100%;">
          
          <!-- View State -->
          <div id="profile-view-${student.id}" style="display: flex; flex-direction: column; width: 100%;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem;">
              <h4 style="font-family:var(--font-heading); font-size:1.3rem; font-weight:800; color:var(--text-primary); margin:0; line-height:1.2;">
                ${escapeHTML(student.name)}
              </h4>
              ${isWali ? 
                `<button onclick="document.getElementById('profile-view-${student.id}').style.display='none'; document.getElementById('profile-edit-${student.id}').style.display='flex';" class="icon-btn" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:var(--text-secondary); border-radius:4px; width:28px; height:28px; display:flex; align-items:center; justify-content:center;" title="Edit Data Siswa"><span class="material-symbols-rounded" style="font-size:16px;">settings</span></button>` 
              : ''}
              ${student.photoBase64 ? 
                `<button onclick="deleteStudentPhoto('${escapeJSAttr(student.id)}')" class="icon-btn" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:var(--rose); border-radius:4px; width:28px; height:28px; display:flex; align-items:center; justify-content:center;" title="Hapus foto"><span class="material-symbols-rounded" style="font-size:16px;">delete</span></button>` 
              : ''}
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <span style="font-size:0.8rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem;">
                <span class="material-symbols-rounded" style="font-size: 16px; opacity: 0.7;">school</span> Kelas: <strong style="color:var(--text-primary);">${escapeHTML(student.class || 'X-A')}</strong>
              </span>
              <span style="font-size:0.8rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem;">
                <span class="material-symbols-rounded" style="font-size: 16px; opacity: 0.7;">format_list_numbered</span> Absen: <strong style="color:var(--text-primary);">${student.absentNo !== undefined ? student.absentNo : '-'}</strong>
              </span>
              <span style="font-size:0.8rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem;">
                <span class="material-symbols-rounded" style="font-size: 16px; opacity: 0.7;">wc</span> Gender: <strong style="color:var(--text-primary);">${student.gender === 'L' ? 'Laki-laki' : (student.gender === 'P' ? 'Perempuan' : '-')}</strong>
              </span>
            </div>
          </div>
          
          <!-- Edit State (Hidden by default) -->
          <div id="profile-edit-${student.id}" style="display: none; flex-direction: column; gap: 0.5rem; background:var(--surface-0); padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border); width: 100%;">
            <input type="text" id="rename-input-${student.id}" class="form-control" value="${escapeHTML(student.name)}" style="font-size:0.8rem; font-weight:700; height:30px; padding:0 0.5rem; width: 100%;" placeholder="Nama Lengkap">
            <div style="display: flex; gap: 0.4rem;">
              <input type="text" id="reclass-input-${student.id}" class="form-control" value="${escapeHTML(student.class || 'X-A')}" style="font-size:0.75rem; font-weight:700; height:30px; flex:1; text-align:center; padding:0;" placeholder="Kelas">
              <input type="number" id="reabsent-input-${student.id}" class="form-control" value="${student.absentNo !== undefined && student.absentNo !== '-' ? student.absentNo : ''}" style="font-size:0.75rem; font-weight:700; height:30px; flex:1; text-align:center; padding:0;" placeholder="Absen" min="1" max="100">
              <select id="regender-select-${student.id}" class="filter-select" style="font-size:0.75rem; font-weight:700; height:30px; flex:1; padding:0 0.2rem;">
                <option value="L" ${student.gender === 'L' ? 'selected' : ''}>L</option>
                <option value="P" ${student.gender === 'P' ? 'selected' : ''}>P</option>
                <option value="-" ${student.gender === '-' || !student.gender ? 'selected' : ''}>-</option>
              </select>
            </div>
            <div style="display: flex; gap: 0.4rem; margin-top: 0.2rem;">
              <button class="action-btn" onclick="renameStudent('${escapeJSAttr(student.id)}')" style="font-size:0.75rem; height:28px; background:var(--secondary-grad); flex: 1; justify-content:center;">Simpan</button>
              <button class="action-btn" onclick="document.getElementById('profile-edit-${student.id}').style.display='none'; document.getElementById('profile-view-${student.id}').style.display='flex';" style="font-size:0.75rem; height:28px; background:rgba(255,255,255,0.1); flex: 1; justify-content:center; box-shadow:none;">Batal</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
    
    <!-- Subjects List Panel -->
    <div style="flex:1; overflow-y:auto; padding-right:2px; margin-bottom:0.3rem;">
      ${subjectsHTML}
    </div>
    
    <!-- Legend Info Block -->
    <div style="background:var(--surface-0); border:1px solid var(--border); border-radius:6px; padding:0.45rem; text-align:center; font-size:0.68rem; color:var(--text-secondary); font-weight:600; margin-top:0.25rem; margin-bottom:0.35rem;">
      ℹ️ Nilai tugas/UH di atas KKM akan otomatis melengkapi status belajar siswa.
    </div>
    
    <!-- Direktori Nilai (Report Card) Button -->
    <button onclick="openStudentReportCard('${escapeJSAttr(student.id)}')" style="width: 100%; padding: 0.75rem; background: var(--bg-card); color: var(--text-primary); border-radius: 8px; font-weight: 700; font-family: var(--font-heading); display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm);" onmouseover="this.style.background='var(--surface-1)'; this.style.borderColor='var(--border-hover)';" onmouseout="this.style.background='var(--bg-card)'; this.style.borderColor='var(--border-color)';">
      <span class="material-symbols-rounded" style="color: var(--primary);">account_tree</span> Direktori Nilai
    </button>
    
    ${actionsHTML}
  `;
}

function selectChapterTab(idx) {
  appState.currSelectedChapterIdx = idx;
  renderTeacherRightPane();
}

// --- INSTANT INLINE GRADE UPDATE V5 ---
function updateInlineGrade(studentId, subjectId, chapterName, gradeType, taskName, value) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  const parsedVal = parseInt(value, 10);
  const score = isNaN(parsedVal) ? 0 : Math.max(0, Math.min(100, parsedVal));

  // Initialize student grades branch if empty
  if (!student.grades[subjectId]) student.grades[subjectId] = createEmptySubjectGrades();
  const chGrades = ensureChapterGrades(student, subjectId, chapterName);
  if (gradeType === "task") {
    if (!chGrades.tasks) chGrades.tasks = {};
    chGrades.tasks[taskName] = score;
  } else if (gradeType === "tugasAkhir") {
    chGrades.tugasAkhir = score;
  } else if (gradeType === "ulangan") {
    chGrades.ulangan = score;
  }

  // Recalculate and update the inline expanded UI instantly!
  const calc = calculateStudentSubjectScore(student, subjectId);
  const chDetail = calc.chapters.find(c => c.name === chapterName);

  // Update Chapter Average on screen
  const chAvgEl = document.getElementById(`avg-${studentId}-${subjectId}-${chapterName.replace(/\s+/g, '')}`);
  if (chAvgEl && chDetail) {
    chAvgEl.innerText = `Avg: ${chDetail.average}`;
  }

  // Update Subject Nilai Asli on screen
  const asliEl = document.getElementById(`asli-${studentId}-${subjectId}`);
  if (asliEl) {
    asliEl.innerText = calc.asli.toString();
  }

  // Update Subject Nilai Akhir on screen (color coded V6)
  const akhirEl = document.getElementById(`akhir-${studentId}-${subjectId}`);
  if (akhirEl) {
    akhirEl.innerText = calc.akhir.toString();
    akhirEl.style.color = calc.isKatrol ? "#ef4444" : "var(--success)";
  }

  // Update the row inside the main student directory table instantly!
  if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
    const globalAvg = getStudentOverallAverage(student);
    const tableScoreEl = document.getElementById(`table-score-${studentId}`);
    if (tableScoreEl) {
      tableScoreEl.innerText = globalAvg.toString();
      
      // Update Katrol indicator inside Wali Kelas table
      let studentHasKatrol = false;
      appState.subjects.forEach(sub => {
        const subCalc = calculateStudentSubjectScore(student, sub.id);
        if (subCalc.isKatrol) studentHasKatrol = true;
      });
      
      tableScoreEl.style.color = studentHasKatrol ? "#ef4444" : "var(--success)";
      
      const katrolTag = document.getElementById(`table-katrol-tag-${studentId}`);
      if (katrolTag) {
        if (studentHasKatrol) {
          katrolTag.style.display = "inline-flex";
          katrolTag.className = "tooltip-wrapper";
          katrolTag.innerHTML = `
            <span class="katrol-badge" style="display:inline-flex; align-items:center; gap:0.2rem; color:#ef4444; font-size:0.55rem; font-weight:700;"><span class="material-symbols-rounded" style="font-size:10px; color:#ef4444;">shield</span> Katrol</span>
          `;
        } else {
          katrolTag.style.display = "none";
          katrolTag.innerHTML = "";
        }
      }
    }
  } else {
    // Regular teacher table row update
    const tableAsliEl = document.getElementById(`table-asli-${studentId}`);
    if (tableAsliEl) {
      tableAsliEl.innerText = calc.asli.toString();
    }
    
    const tableScoreEl = document.getElementById(`table-score-${studentId}`);
    if (tableScoreEl) {
      tableScoreEl.innerText = calc.akhir.toString();
      tableScoreEl.style.color = calc.isKatrol ? "#ef4444" : "var(--success)";
      
      const katrolTag = document.getElementById(`table-katrol-tag-${studentId}`);
      if (katrolTag) {
        if (calc.isKatrol) {
          katrolTag.style.display = "inline-flex";
          katrolTag.className = "tooltip-wrapper";
          katrolTag.innerHTML = `
            <span class="katrol-badge" style="display:inline-flex; align-items:center; gap:0.2rem; color:#ef4444; font-size:0.55rem; font-weight:700;"><span class="material-symbols-rounded" style="font-size:10px; color:#ef4444;">shield</span> KKM ${calc.kkm}</span>
          `;
        } else {
          katrolTag.style.display = "none";
          katrolTag.innerHTML = "";
        }
      }
    }
  }

  // Auto compute completeness dynamically!
  const isNowComplete = isStudentSubjectComplete(student, subjectId);
  student.completeness[subjectId] = isNowComplete;

  const checkbox = document.getElementById(`complete-${studentId}-${subjectId}`);
  if (checkbox) {
    checkbox.checked = isNowComplete;
  }

  // Update table row ratio, percentage, and badge Cell
  const comp = getOverallStudentCompleteness(student);
  const ratioEl = document.getElementById(`table-comp-ratio-${studentId}`);
  const pctEl = document.getElementById(`table-comp-pct-${studentId}`);
  if (ratioEl) ratioEl.innerText = `${comp.completed}/${comp.total} Mapel`;
  if (pctEl) pctEl.innerText = `${comp.percentage}% Selesai`;

  const badgeCell = document.getElementById(`table-badge-cell-${studentId}`);
  if (badgeCell) {
    if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
      badgeCell.innerHTML = `
        <span class="status-badge ${comp.isAllComplete ? 'complete' : 'incomplete'}">
          ${comp.isAllComplete ? '✔ <span class="hide-on-tablet">Lengkap</span>' : '❌ <span class="hide-on-tablet">Belum Lengkap</span>'}
        </span>
      `;
    } else {
      badgeCell.innerHTML = `
        <span class="status-badge ${isNowComplete ? 'complete' : 'incomplete'}">
          ${isNowComplete ? '✔ <span class="hide-on-tablet">Lengkap</span>' : '❌ <span class="hide-on-tablet">Belum Lengkap</span>'}
        </span>
      `;
    }
  }

  // Silently save — debounced sync ke server
  saveData({ silent: true });
  
  updateTeacherStats();
}

// Update PSAT (Penilaian Semester / Ulangan Semester) grade for a subject
function updatePsatGrade(studentId, subjectId, value) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  const parsedVal = parseInt(value, 10);
  const score = isNaN(parsedVal) ? null : Math.max(0, Math.min(100, parsedVal));

  if (!student.grades[subjectId]) {
    student.grades[subjectId] = { chapters: {} };
  }

  if (score === null) {
    delete student.grades[subjectId].psat;
  } else {
    student.grades[subjectId].psat = score;
  }

  saveData({ silent: true });
}

function updateChapterWeight(subId, chName, weightType, taskName, value, studentId) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const ch = sub.chapters.find(c => c.name === chName);
  if (!ch) return;

  if (!ch.weights) ch.weights = {};

  const parsedVal = parseInt(value, 10);
  const weight = isNaN(parsedVal) ? 1 : Math.max(0, Math.min(100, parsedVal));

  if (weightType === "task") {
    ch.weights[taskName] = weight;
  } else if (weightType === "tugasAkhir") {
    ch.weights['tugasAkhir'] = weight;
  } else if (weightType === "ulangan") {
    ch.weights['ulangan'] = weight;
  }

  saveData({ silent: true });

  // If a studentId is provided, reactively update the open expanded drawer elements!
  if (studentId) {
    const student = appState.students.find(s => s.id === studentId);
    if (student) {
      const calc = calculateStudentSubjectScore(student, subId);
      const chDetail = calc.chapters.find(c => c.name === chName);

      // Recalculate and update chapter average on screen
      const chAvgEl = document.getElementById(`avg-${studentId}-${subId}-${chName.replace(/\s+/g, '')}`);
      if (chAvgEl && chDetail) {
        chAvgEl.innerText = `Avg: ${chDetail.average}`;
      }

      // Recalculate and update Chapter total weight on screen
      const maxBobotEl = document.getElementById(`max-bobot-${studentId}-${subId}-${chName.replace(/\s+/g, '')}`);
      if (maxBobotEl) {
        const chTasks = ch.tasks || [];
        
        const ulWeight = ch.weights['ulangan'] !== undefined ? ch.weights['ulangan'] : 1;
        const totalWeightSum = chTasks.reduce((acc, t) => acc + (ch.weights[t] !== undefined ? parseInt(ch.weights[t], 10) : 1), 0) + parseInt(ulWeight, 10);
        maxBobotEl.innerText = `Maks Bobot: ${totalWeightSum}`;
      }

      // Update Subject Nilai Asli on screen
      const asliEl = document.getElementById(`asli-${studentId}-${subId}`);
      if (asliEl) {
        asliEl.innerText = calc.asli.toString();
      }

      // Update Subject Nilai Akhir on screen V6
      const akhirEl = document.getElementById(`akhir-${studentId}-${subId}`);
      if (akhirEl) {
        akhirEl.innerText = calc.akhir.toString();
        akhirEl.style.color = calc.isKatrol ? "#ef4444" : "var(--success)";
      }

      // Update the main row average score if Wali Kelas
      if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
        const globalAvg = getStudentOverallAverage(student);
        const tableScoreEl = document.getElementById(`table-score-${studentId}`);
        if (tableScoreEl) {
          tableScoreEl.innerText = globalAvg.toString();
          
          let studentHasKatrol = false;
          appState.subjects.forEach(s => {
            const subCalc = calculateStudentSubjectScore(student, s.id);
            if (subCalc.isKatrol) studentHasKatrol = true;
          });
          tableScoreEl.style.color = studentHasKatrol ? "#ef4444" : "var(--success)";
          
          const katrolTag = document.getElementById(`table-katrol-tag-${studentId}`);
          if (katrolTag) {
            if (studentHasKatrol) {
              katrolTag.style.display = "inline-flex";
              katrolTag.className = "tooltip-wrapper";
              katrolTag.innerHTML = `
                <span class="katrol-badge" style="display:inline-flex; align-items:center; gap:0.2rem; color:#ef4444; font-size:0.55rem; font-weight:700;"><span class="material-symbols-rounded" style="font-size:10px; color:#ef4444;">shield</span> Katrol</span>
              `;
            } else {
              katrolTag.style.display = "none";
              katrolTag.innerHTML = "";
            }
          }
        }
      } else {
        // Regular teacher table row update
        const tableAsliEl = document.getElementById(`table-asli-${studentId}`);
        if (tableAsliEl) {
          tableAsliEl.innerText = calc.asli.toString();
        }
        
        const tableScoreEl = document.getElementById(`table-score-${studentId}`);
        if (tableScoreEl) {
          tableScoreEl.innerText = calc.akhir.toString();
          tableScoreEl.style.color = calc.isKatrol ? "#ef4444" : "var(--success)";
          
          const katrolTag = document.getElementById(`table-katrol-tag-${studentId}`);
          if (katrolTag) {
            if (calc.isKatrol) {
              katrolTag.style.display = "inline-flex";
              katrolTag.className = "tooltip-wrapper";
              katrolTag.innerHTML = `
                <span class="katrol-badge" style="display:inline-flex; align-items:center; gap:0.2rem; color:#ef4444; font-size:0.55rem; font-weight:700;"><span class="material-symbols-rounded" style="font-size:10px; color:#ef4444;">shield</span> KKM ${calc.kkm}</span>
              `;
            } else {
              katrolTag.style.display = "none";
              katrolTag.innerHTML = "";
            }
          }
        }
      }
    }
  }

  saveData({ silent: true });
  updateTeacherStats();
}

function updateInlineCompleteness(studentId, subjectId, isChecked) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  student.completeness[subjectId] = isChecked;

  saveData({ silent: true });
  
  // Update completeness badge inside the parent row instantly!
  const comp = getOverallStudentCompleteness(student);
  const badgeCell = document.getElementById(`table-badge-cell-${studentId}`);
  
  if (appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2") {
    // Update ratio and percentage texts
    const ratioEl = document.getElementById(`table-comp-ratio-${studentId}`);
    const pctEl = document.getElementById(`table-comp-pct-${studentId}`);
    if (ratioEl) ratioEl.innerText = `${comp.completed}/${comp.total} Mapel`;
    if (pctEl) pctEl.innerText = `${comp.percentage}% Selesai`;
    
    if (badgeCell) {
      badgeCell.innerHTML = `
        <span class="status-badge ${comp.isAllComplete ? 'complete' : 'incomplete'}">
          ${comp.isAllComplete ? '✔ <span class="hide-on-tablet">Lengkap</span>' : '❌ <span class="hide-on-tablet">Belum Lengkap</span>'}
        </span>
      `;
    }
  } else {
    if (badgeCell) {
      badgeCell.innerHTML = `
        <span class="status-badge ${isChecked ? 'complete' : 'incomplete'}">
          ${isChecked ? '✔ <span class="hide-on-tablet">Lengkap</span>' : '❌ <span class="hide-on-tablet">Belum Lengkap</span>'}
        </span>
      `;
    }
  }

  updateTeacherStats();
  renderIncompleteStudentsList();
  renderTeacherRightPane(); // Re-sync Sisi Kanan V6
}

// Wali kelas renames student profile & class V6
function renameStudent(studentId) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  const newName = document.getElementById(`rename-input-${studentId}`).value.trim().toUpperCase();
  const newClass = document.getElementById(`reclass-input-${studentId}`).value.trim().toUpperCase();
  
  const newAbsentVal = document.getElementById(`reabsent-input-${studentId}`).value.trim();
  const newAbsentNo = newAbsentVal ? parseInt(newAbsentVal, 10) : "-";
  const newGender = document.getElementById(`regender-select-${studentId}`).value || "-";

  if (!newName || !newClass) {
    alert("Nama dan kelas tidak boleh kosong!");
    return;
  }

  const isNameTaken = appState.students.some(s => 
    (s.name || "").toLowerCase() === newName.toLowerCase() && s.id !== studentId
  );
  if (isNameTaken) {
    alert("Nama siswa ini sudah digunakan oleh siswa lain!");
    return;
  }

  student.name = newName;
  student.class = newClass;
  student.absentNo = newAbsentNo;
  student.gender = newGender;
  saveData();

  // Refresh class search dropdown on student view
  populateClassSelect();

  // Re-render the student table to update row details
  renderStudentTable();
  
  // Re-render the right-side detail editor pane dynamically V6
  renderTeacherRightPane();
  
  alert("Profil siswa berhasil diperbarui!");
}

function uploadStudentPhoto(studentId, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const student = appState.students.find(s => s.id === studentId);
    if (student) {
      student.photoBase64 = e.target.result;
      saveData();
      renderTeacherRightPane();
      renderStudentTable();
    }
  };
  reader.readAsDataURL(file);
}

function deleteStudentPhoto(studentId) {
  if (confirm("Hapus foto siswa ini?")) {
    const student = appState.students.find(s => s.id === studentId);
    if (student) {
      delete student.photoBase64;
      saveData();
      renderTeacherRightPane();
      renderStudentTable();
    }
  }
}

// Add simple student asking for Name and Class V6
function handleAddStudentFormSubmit(event) {
  event.preventDefault();

  if (appState.activeTeacherId !== "t-2") {
    alert("🚫 Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd yang memiliki wewenang untuk mendaftarkan siswa baru!");
    return;
  }

  const tabBulk = document.getElementById("add-student-tab-bulk");
  const isBulkActive = tabBulk && tabBulk.classList.contains("active");

  if (isBulkActive) {
    const bulkText = document.getElementById("add-student-bulk-input").value;
    const defaultClass = document.getElementById("add-student-bulk-class-input").value.trim().toUpperCase() || "8C";
    
    bulkAddStudents(bulkText, defaultClass);
    
    // Clear bulk fields and close modal
    document.getElementById("add-student-bulk-input").value = "";
    closeAddStudentModal();
    return;
  }

  const nameValue = document.getElementById("add-student-name-input").value.trim().toUpperCase();
  const classValue = document.getElementById("add-student-class-input").value.trim().toUpperCase() || "8C";

  const absentInputVal = document.getElementById("add-student-absent-input").value.trim();
  const absentNo = absentInputVal ? parseInt(absentInputVal, 10) : "-";
  const gender = document.getElementById("add-student-gender-input").value || "L";

  if (!nameValue || !classValue) {
    alert("Harap masukkan nama dan kelas siswa!");
    return;
  }

  const isNameTaken = appState.students.some(s => (s.name || "").toLowerCase() === nameValue.toLowerCase());
  if (isNameTaken) {
    alert("Nama siswa ini sudah ada di database!");
    return;
  }

  const { grades, completeness } = buildEmptyStudentGrades();

  const newStudent = {
    id: "stud-" + Date.now(),
    name: nameValue,
    class: classValue,
    absentNo: absentNo,
    gender: gender,
    grades,
    completeness,
    examCardGiven: false
  };

  appState.students.push(newStudent);
  saveData();
  
  // Refresh the lookup class dropdown
  populateClassSelect();
  
  document.getElementById("add-student-name-input").value = "";
  document.getElementById("add-student-class-input").value = "";
  document.getElementById("add-student-absent-input").value = "";
  document.getElementById("add-student-gender-input").value = "L";
  closeAddStudentModal();
}

function openAddStudentModal() {
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    alert("Hanya Wali Kelas yang dapat menambahkan siswa baru!");
    return;
  }
  document.getElementById("add-student-modal").classList.add("active");
  switchAddStudentTab("single"); // Reset to single tab when opened
}

function closeAddStudentModal() {
  document.getElementById("add-student-modal").classList.remove("active");
}

function switchAddStudentTab(tab) {
  const tabSingle = document.getElementById("add-student-tab-single");
  const tabBulk = document.getElementById("add-student-tab-bulk");
  const contentSingle = document.getElementById("add-student-content-single");
  const contentBulk = document.getElementById("add-student-content-bulk");

  if (!tabSingle || !tabBulk || !contentSingle || !contentBulk) return;

  if (tab === "single") {
    tabSingle.classList.add("active");
    tabBulk.classList.remove("active");
    contentSingle.classList.remove("d-none");
    contentBulk.classList.add("d-none");
    document.getElementById("add-student-name-input").required = true;
    document.getElementById("add-student-class-input").required = true;
  } else {
    tabSingle.classList.remove("active");
    tabBulk.classList.add("active");
    contentSingle.classList.add("d-none");
    contentBulk.classList.remove("d-none");
    document.getElementById("add-student-name-input").required = false;
    document.getElementById("add-student-class-input").required = false;
  }
}

// --- GRADE PUBLICATION TOGGLER V5 ---
function toggleGradePublication() {
  appState.publishGrades = !appState.publishGrades;
  saveData({ silent: true });
  
  renderPublishToggleState();
  
  // Refresh students search screen if active
  const searchBar = document.getElementById("student-search-input");
  if (searchBar && searchBar.value.trim()) {
    handleStudentSearch();
  }
}

function renderPublishToggleState() {
  const switchInput = document.getElementById("publish-grades-toggle-input");
  if (!switchInput) return;

  switchInput.checked = appState.publishGrades;
  
  const statusLabel = document.getElementById("publish-grades-status-label");
  if (statusLabel) {
    statusLabel.innerText = appState.publishGrades 
      ? "Nilai Tampil" 
      : "Nilai Sembunyi";
    statusLabel.style.color = appState.publishGrades ? "var(--success)" : "var(--warning)";
  }
}

function renderTeacherDashboard() {
  const teacherId = appState.activeTeacherId;
  if (!teacherId) return;

  const teacherName = appState.teachers.find(t => t.id === teacherId)?.name || (teacherId === "wali-kelas" ? "Wali Kelas" : "Guru");
  const greetingEl = document.getElementById("teacher-dashboard-greeting");
  if (greetingEl) {
    greetingEl.innerHTML = `Selamat Datang, <strong style="font-weight: 800; color: var(--primary);">${escapeHTML(teacherName)}</strong>`;
    
    // Check if teacher has subjects
    if (teacherId !== "wali-kelas" && teacherId !== "t-2" && appState.subjects.filter(s => s.teacherId === teacherId).length === 0) {
      greetingEl.innerHTML += `<div style="color: #ef4444; font-size: 0.85rem; margin-top: 0.5rem; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3);">
        <span class="material-symbols-rounded" style="font-size: 14px; vertical-align: text-bottom;">warning</span>
        Anda belum ditugaskan ke mata pelajaran apapun. Silakan hubungi admin atau atur di Pengaturan.
      </div>`;
    }
  }

  // Update Date
  const dateObj = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const dayEl = document.getElementById("teacher-dashboard-date-day");
  if (dayEl) dayEl.innerText = months[dateObj.getMonth()];
  const numEl = document.getElementById("teacher-dashboard-date-num");
  if (numEl) numEl.innerText = dateObj.getDate();

  const classFilterSelect = document.getElementById("td-class-filter");
  if (classFilterSelect && classFilterSelect.options.length <= 1) {
    appState.classes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.innerText = c;
      classFilterSelect.appendChild(opt);
    });
  }
  const selectedClass = classFilterSelect ? classFilterSelect.value : "ALL";

  // Calculate metrics
  let totalGradeAccum = 0;
  let gradePointsCount = 0;
  let totalTasksAccum = 0;
  let completedTasksAccum = 0;
  let incompleteStudentsCount = 0;
  
  const filteredStudents = appState.students.filter(st => selectedClass === "ALL" || st.class === selectedClass);
  const totalStudents = filteredStudents.length;

  const teacherSubjects = (teacherId !== "wali-kelas" && teacherId !== "t-2") 
    ? appState.subjects.filter(s => s.teacherId === teacherId)
    : appState.subjects;

  let studentAverages = [];

  filteredStudents.forEach(student => {
    let studentTotalGrade = 0;
    let studentGradeCount = 0;
    let isSubIncomplete = false;

    teacherSubjects.forEach(sub => {
      if (!isSubjectValidForStudentClass(sub.name, student.class)) return;

      totalTasksAccum++;
      if (student.completeness[sub.id] === true) {
        completedTasksAccum++;
      } else {
        isSubIncomplete = true;
      }

      if (!hasAnyRecordedGradesForSubject(student, sub.id)) return;

      const score = calculateStudentSubjectScore(student, sub.id);
      studentTotalGrade += score.asli;
      studentGradeCount++;
      totalGradeAccum += score.asli;
      gradePointsCount++;
    });

    if (isSubIncomplete) incompleteStudentsCount++;

    const avg = studentGradeCount > 0 ? Math.round((studentTotalGrade / studentGradeCount) * 10) / 10 : null;
    studentAverages.push({ 
      student, 
      avg, 
      incomplete: isSubIncomplete 
    });
  });

  const classAvg = gradePointsCount > 0 ? Math.round((totalGradeAccum / gradePointsCount) * 10) / 10 : '—';
  const taskPct = totalTasksAccum > 0 ? Math.round((completedTasksAccum / totalTasksAccum) * 100) : 0;
  
  // Update DOM metrics
  const mBelum = document.getElementById("td-metric-belum");
  if (mBelum) mBelum.innerText = incompleteStudentsCount;
  const mTugas = document.getElementById("td-metric-tugas");
  if (mTugas) mTugas.innerText = taskPct;
  const mSiswa = document.getElementById("td-metric-siswa");
  if (mSiswa) mSiswa.innerText = totalStudents;
  const mRata = document.getElementById("td-metric-rata");
  if (mRata) mRata.innerText = classAvg;

    // Render Top 3 and Needs Attention Per Class
  const perClassContainer = document.getElementById("td-per-class-container");
  if (perClassContainer) {
    perClassContainer.innerHTML = "";
    
    let classesToRender = appState.classes;
    if (selectedClass !== "ALL") {
       classesToRender = [selectedClass];
    }
    
    // Group all students by class
    const classGroups = {};
    classesToRender.forEach(c => {
       classGroups[c] = studentAverages.filter(s => s.student.class === c);
    });

    let renderedAny = false;
    
    classesToRender.forEach(cls => {
      const clsStudents = classGroups[cls] || [];
      if (clsStudents.length === 0) return;
      
      renderedAny = true;
      
      // Sort by average descending
      const sortedByAvg = [...clsStudents].sort((a, b) => b.avg - a.avg);
      const top3 = sortedByAvg.slice(0, 3);
      const needsAttention = sortedByAvg.filter(st => st.incomplete);
      
      let top3Html = "";
      if (top3.length === 0) {
         top3Html = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding: 1.5rem 0;">Belum ada data</div>`;
      } else {
         top3.forEach((stData, index) => {
            const rank = index + 1;
            let medal = "";
            let medalColor = "";
            let bgMedal = "";
            if (rank === 1) { medal = "🥇"; medalColor = "#fbbf24"; bgMedal = "rgba(251, 191, 36, 0.15)"; } // Gold
            else if (rank === 2) { medal = "🥈"; medalColor = "#94a3b8"; bgMedal = "rgba(148, 163, 184, 0.15)"; } // Silver
            else if (rank === 3) { medal = "🥉"; medalColor = "#b45309"; bgMedal = "rgba(180, 83, 9, 0.15)"; } // Bronze

            const avatarHtml = `<div style="width: 28px; height: 28px; border-radius: 50%; background: var(--bg-card-solid); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: var(--text-primary); border: 1px solid var(--border-color); flex-shrink: 0;">${stData.student.name.charAt(0).toUpperCase()}</div>`;
            
            top3Html += `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.5rem; background: var(--bg-card-solid); border: 1px solid var(--border-color); border-radius: var(--radius-sm); width: 100%; box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  ${avatarHtml}
                  <div style="display: flex; flex-direction: column; gap: 0.1rem;">
                    <span style="font-size: 0.7rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${escapeHTML(stData.student.name)}</span>
                    <div style="display: flex; align-items: center;">
                      <span style="font-size: 0.6rem; font-weight: 800; color: ${medalColor}; background: ${bgMedal}; padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.15rem; white-space: nowrap;">${medal} Rank ${rank}</span>
                    </div>
                  </div>
                </div>
                <span style="font-size: 0.85rem; font-weight: 800; font-family: var(--font-heading); color: var(--success);">${stData.avg !== null ? Math.round(stData.avg) : '—'}</span>
              </div>
            `;
         });
      }

      let attentionHtml = "";
      if (needsAttention.length === 0) {
         attentionHtml = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding: 1.5rem 0;">Semua siswa tuntas!</div>`;
      } else {
         needsAttention.forEach(stData => {
            const isCritical = stData.avg !== null && stData.avg < 60;
            const badgeText = isCritical ? "KRITIS" : (stData.avg === null ? "BELUM DINILAI" : "PERINGATAN");
            const badgeColor = isCritical ? "var(--danger)" : "var(--warning)";
            const bgTint = isCritical ? "rgba(239, 68, 68, 0.05)" : "rgba(245, 158, 11, 0.05)";
            const borderColor = isCritical ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)";
            
            let missingCount = 0;
            teacherSubjects.forEach(sub => {
              if (stData.student.completeness[sub.id] !== true) missingCount++;
            });
            
            let reason = stData.avg !== null ? `Rata-rata ${Math.round(stData.avg)}.` : 'Belum ada nilai tercatat.';
            if (missingCount > 0) reason += ` Ada tugas/ulangan yang sudah dirilis tapi belum tuntas.`;

            const avatarHtml = `<div style="width: 20px; height: 20px; border-radius: 50%; background: var(--bg-base); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.6rem; color: var(--text-primary); border: 1px solid var(--border-color); flex-shrink: 0;">${stData.student.name.charAt(0).toUpperCase()}</div>`;
            
            
            attentionHtml += `
              <div style="display: flex; flex-direction: column; gap: 0.2rem; padding: 0.35rem 0.5rem; background: ${bgTint}; border: 1px solid ${borderColor}; border-radius: var(--radius-sm); width: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: flex-start; align-items: flex-start;">
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    ${avatarHtml}
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 0.7rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${escapeHTML(stData.student.name)}</span>
                      <span style="font-size: 0.5rem; font-weight: 800; color: ${badgeColor}; text-transform: uppercase; margin-top: 0.1rem; white-space: nowrap;">${badgeText}</span>
                    </div>
                  </div>
                </div>
                <p style="font-size: 0.6rem; color: var(--text-secondary); margin: 0; line-height: 1.3; padding-left: 1.75rem;">
                  ${reason}
                </p>
              </div>
            `;
         });
      }

      perClassContainer.innerHTML += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; min-width: 250px; max-width: 280px; flex-shrink: 0; box-sizing: border-box;">
          <h2 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; margin: 0 0 1rem 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
             <span class="material-symbols-rounded">class</span> Kelas ${escapeHTML(cls)}
          </h2>
          
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
             <!-- Top 3 -->
             <div>
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                 <h3 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; margin: 0;">Rank 1-3</h3>
                 <span class="material-symbols-rounded" style="font-size: 16px; color: var(--success);">social_leaderboard</span>
               </div>
               <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                 ${top3Html}
               </div>
             </div>

             <!-- Needs Attention -->
             <div>
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                 <h3 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; margin: 0; color: var(--danger);">Perlu Perhatian</h3>
                 <span class="material-symbols-rounded" style="font-size: 16px; color: var(--danger);">warning</span>
               </div>
               <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                 ${attentionHtml}
               </div>
             </div>
          </div>
        </div>
      `;
    });
    
    if (!renderedAny) {
      perClassContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:3rem 0; font-size:0.9rem;">Belum ada data siswa untuk kelas yang Anda ajar.</div>`;
    }
  }
}

function updateTeacherStats() {
  const totalStudents = appState.students.length;
  document.getElementById("stat-total-students").innerText = totalStudents;

  if (totalStudents === 0 || appState.subjects.length === 0) {
    document.getElementById("stat-class-average").innerText = "0";
    document.getElementById("stat-class-completeness").innerText = "0%";
    document.getElementById("stat-incomplete-students").innerText = "0";
    return;
  }

  let totalGradeAccum = 0;
  let gradePointsCount = 0;
  let totalTasksAccum = 0;
  let completedTasksAccum = 0;
  let incompleteStudentsCount = 0;

  appState.students.forEach(student => {
    if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
      const teacherSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
      teacherSubjects.forEach(sub => {
        if (!hasAnyRecordedGradesForSubject(student, sub.id)) return;
        const score = calculateStudentSubjectScore(student, sub.id);
        totalGradeAccum += score.asli;
        gradePointsCount++;
        
        totalTasksAccum++;
        if (student.completeness[sub.id] === true) completedTasksAccum++;
      });
      
      let isSubIncomplete = false;
      teacherSubjects.forEach(sub => {
        if (student.completeness[sub.id] !== true) isSubIncomplete = true;
      });
      if (isSubIncomplete) incompleteStudentsCount++;
      
    } else {
      appState.subjects.forEach(sub => {
        if (!isSubjectValidForStudentClass(sub.name, student.class)) return;
        if (!hasAnyRecordedGradesForSubject(student, sub.id)) {
          totalTasksAccum++;
          return;
        }
        const score = calculateStudentSubjectScore(student, sub.id);
        totalGradeAccum += score.asli;
        gradePointsCount++;

        totalTasksAccum++;
        if (student.completeness[sub.id] === true) {
          completedTasksAccum++;
        }
      });

      const comp = getOverallStudentCompleteness(student);
      if (!comp.isAllComplete) {
        incompleteStudentsCount++;
      }
    }
  });

  const classAvg = gradePointsCount > 0 ? Math.round((totalGradeAccum / gradePointsCount) * 10) / 10 : '—';
  const taskPct = totalTasksAccum > 0 ? Math.round((completedTasksAccum / totalTasksAccum) * 100) : 0;

  document.getElementById("stat-class-average").innerText = classAvg;
  document.getElementById("stat-class-completeness").innerText = `${taskPct}%`;
  document.getElementById("stat-incomplete-students").innerText = incompleteStudentsCount;
}

// --- CONFIGURATION TAB MODULE ---
let configActiveGradeTab = '8';

function extractGradeFromSubjectName(subjectName) {
  if (subjectName.includes('Kelas 7')) return '7';
  if (subjectName.includes('Kelas 8')) return '8';
  if (subjectName.includes('Kelas 9')) return '9';
  return 'other';
}

function switchConfigGradeTab(grade) {
  configActiveGradeTab = grade;
  renderGradeTabs();
  renderSubjectsList();
}
window.switchConfigGradeTab = switchConfigGradeTab;

function renderGradeTabs() {
  const tabsContainer = document.getElementById('config-grade-tabs');
  if (!tabsContainer) return;

  const grades = ['7', '8', '9'];
  const hasSubjects = {
    7: appState.subjects.some((s) => extractGradeFromSubjectName(s.name) === '7'),
    8: appState.subjects.some((s) => extractGradeFromSubjectName(s.name) === '8'),
    9: appState.subjects.some((s) => extractGradeFromSubjectName(s.name) === '9'),
  };

  if (!hasSubjects[configActiveGradeTab]) {
    const firstAvailable = grades.find((g) => hasSubjects[g]);
    if (firstAvailable) configActiveGradeTab = firstAvailable;
  }

  tabsContainer.innerHTML = grades.map((g) => {
    const count = appState.subjects.filter((s) => extractGradeFromSubjectName(s.name) === g).length;
    const disabled = count === 0;
    return `<button type="button" class="config-grade-tab${configActiveGradeTab === g ? ' is-active' : ''}" role="tab" aria-selected="${configActiveGradeTab === g}" ${disabled ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : ''} onclick="switchConfigGradeTab('${g}')">Kelas ${g}${count > 0 ? ` (${count})` : ''}</button>`;
  }).join('');
}

function renderConfigTab() {
  const aySelect = document.getElementById("config-academic-year");
  const semSelect = document.getElementById("config-semester");
  const ayLabel = document.getElementById("config-academic-year-trigger-label");
  const semLabel = document.getElementById("config-semester-trigger-label");
  if (aySelect && appState.academicYear) {
    aySelect.value = appState.academicYear;
    if (ayLabel) ayLabel.innerText = appState.academicYear;
  }
  if (semSelect && appState.semester) {
    semSelect.value = appState.semester;
    if (semLabel) semLabel.innerText = appState.semester;
  }
  
  const leftPane = document.getElementById("config-left-pane");
  if (leftPane) {
    if (appState.activeTeacherId === "t-2") {
      leftPane.style.display = "flex";
      renderTeachersList();
    } else {
      leftPane.style.display = "none";
    }
  }

  renderGradeTabs();
  renderSubjectsList();
  populateTeacherOptions();
}

function applyTermConfiguration() {
  const aySelect = document.getElementById("config-academic-year");
  const semSelect = document.getElementById("config-semester");
  
  if (!aySelect || !semSelect) return;
  
  const newYear = aySelect.value;
  const newSem = semSelect.value;
  
  if (appState.academicYear === newYear && appState.semester === newSem) {
    alert("Sesi ini sudah aktif.");
    return;
  }
  
  if (confirm(`Anda akan beralih ke sesi Tahun Ajaran ${newYear} - Semester ${newSem}.\nData dari sesi saat ini akan disimpan dan UI akan dimuat ulang dengan data sesi baru.\nLanjutkan?`)) {
    saveData({ silent: true });
    
    appState.academicYear = newYear;
    appState.semester = newSem;
    
    writeLocalState();
    flushServerSync().catch((err) => console.warn('Gagal sinkron sesi baru:', err.message));
    
    loadData();
    renderConfigTab();
    alert(`Berhasil beralih ke ruang kerja: ${newYear} - ${newSem}`);
  }
}
window.applyTermConfiguration = applyTermConfiguration;

function renderTeachersList() {
  const container = document.getElementById("config-teachers-list");
  container.innerHTML = "";

  if (appState.teachers.length === 0) {
    container.innerHTML = '<div class="config-empty-state" style="padding:0.75rem;">Belum ada guru terdaftar.</div>';
    return;
  }

  appState.teachers.forEach(t => {
    const div = document.createElement("div");
    div.className = "config-teacher-item";

    const classesText = t.classes ? escapeHTML(t.classes) : "-";
    const mappedSubjects = appState.subjects.filter(s => s.teacherId === t.id).map(s => s.name).join(", ");
    const subjectText = mappedSubjects || (t.subjectDesc ? escapeHTML(t.subjectDesc) : "-");

    div.innerHTML = `
      <div>
        <div class="config-teacher-item__name">${escapeHTML(t.name)}</div>
        <div class="config-teacher-item__meta">Mapel: ${subjectText}<br>Kelas: ${classesText}</div>
        ${t.id === "t-2" ? '<div class="config-teacher-item__pw">Password login: <strong>guru123</strong></div>' : ""}
      </div>
      <div class="config-teacher-item__actions">
        <button class="icon-btn" style="width:26px; height:26px; display:flex; align-items:center; justify-content:center; color:var(--text-secondary);" onclick="editTeacherClasses('${escapeJSAttr(t.id)}')" title="Edit kelas"><span class="material-symbols-rounded" style="font-size:15px;">edit</span></button>
        <button class="icon-btn delete-btn" style="width:26px; height:26px; display:flex; align-items:center; justify-content:center;" onclick="deleteTeacher('${escapeJSAttr(t.id)}')"><span class="material-symbols-rounded" style="font-size:15px;">delete</span></button>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderSubjectsList() {
  const container = document.getElementById("config-subjects-list");
  container.innerHTML = "";

  const filteredSubjects = appState.subjects.filter(
    (sub) => extractGradeFromSubjectName(sub.name) === configActiveGradeTab
  );

  if (appState.subjects.length === 0) {
    container.innerHTML = '<div class="config-empty-state">Belum ada mata pelajaran. Tambahkan lewat form Master Data di sebelah kiri.</div>';
    return;
  }

  if (filteredSubjects.length === 0) {
    container.innerHTML = `<div class="config-empty-state">Tidak ada mapel untuk Kelas ${configActiveGradeTab}. Tambahkan mapel dengan nama yang menyertakan "(Kelas ${configActiveGradeTab})".</div>`;
    return;
  }

  filteredSubjects.forEach(sub => {
    const teacher = appState.teachers.find(t => t.id === sub.teacherId) || { name: "Tidak ada guru" };

    const card = document.createElement("div");
    card.className = "config-subject-card";

    let chaptersHTML = "";
    sub.chapters.forEach(ch => {
      const chTasks = ch.tasks || [];
      if (!ch.weights) ch.weights = {};

      let tasksListHTML = "";
      chTasks.forEach(t => {
        const tWeight = ch.weights[t] !== undefined ? ch.weights[t] : 1;
        tasksListHTML += `
          <div class="config-weight-row">
            <div class="config-weight-row__label">
              <span>${escapeHTML(t)}</span>
              <button class="icon-btn delete-btn" style="width:18px; height:18px;" onclick="deleteTaskFromChapter('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', '${escapeJSAttr(t)}')" title="Hapus tugas"><span class="material-symbols-rounded" style="font-size:12px;">close</span></button>
            </div>
            <div class="config-weight-row__input-wrap">
              <span>Bobot</span>
              <input type="number" min="0" max="100" class="config-weight-input"
                value="${tWeight}"
                oninput="updateChapterWeight('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', 'task', '${escapeJSAttr(t)}', this.value)">
            </div>
          </div>
        `;
      });

      const ulWeight = ch.weights['ulangan'] !== undefined ? ch.weights['ulangan'] : 1;
      const totalWeightSum = chTasks.reduce((acc, t) => acc + (ch.weights[t] !== undefined ? parseInt(ch.weights[t], 10) : 1), 0) + parseInt(ulWeight, 10);

      chaptersHTML += `
        <div class="config-chapter-block">
          <div class="config-chapter-block__header">
            <div style="display:flex; align-items:center; gap:0.5rem; min-width:0;">
              <span class="config-chapter-block__title">${escapeHTML(ch.name)}</span>
              <span class="config-weight-badge">Total bobot: ${totalWeightSum}</span>
            </div>
            <button class="icon-btn delete-btn" style="width:24px; height:24px;" title="Hapus bab" onclick="deleteChapterFromSubject('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}')"><span class="material-symbols-rounded" style="font-size:14px;">delete</span></button>
          </div>

          <div>
            ${tasksListHTML || '<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic; padding:0.25rem 0;">Belum ada tugas.</div>'}

            <div class="config-weight-row">
              <div class="config-weight-row__label config-weight-row__label--uh">Ulangan Harian (UH)</div>
              <div class="config-weight-row__input-wrap">
                <span>Bobot</span>
                <input type="number" min="0" max="100" class="config-weight-input"
                  value="${ulWeight}"
                  oninput="updateChapterWeight('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}', 'ulangan', null, this.value)">
              </div>
            </div>
          </div>

          <div class="config-add-task-row">
            <span class="material-symbols-rounded">add</span>
            <input type="text" id="add-task-input-${sub.id}-${ch.name.replace(/\s+/g, '')}" class="config-add-task-input" placeholder="Nama tugas baru (mis. Tugas 3)">
            <button type="button" class="config-add-task-btn" onclick="addTaskToChapter('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ch.name)}')">Tambah</button>
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="config-subject-card__header">
        <div>
          <h4 class="config-subject-card__title">${escapeHTML(sub.name)}</h4>
          <div class="config-subject-card__meta">Guru: ${escapeHTML(teacher.name)} · KKM: <strong>${sub.kkm}</strong></div>
        </div>
        <button class="icon-btn delete-btn" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center;" onclick="deleteSubject('${escapeJSAttr(sub.id)}')" title="Hapus mapel"><span class="material-symbols-rounded" style="font-size:16px;">delete</span></button>
      </div>

      <div class="config-chapters-grid">${chaptersHTML || '<div class="config-empty-state" style="padding:1rem; grid-column: 1 / -1;">Belum ada bab materi.</div>'}</div>

      <div class="config-add-chapter-row">
        <input type="text" id="add-chapter-input-${sub.id}" class="form-control" placeholder="Nama bab baru (mis. Bab 5)">
        <button type="button" class="action-btn" onclick="addChapterToSubject('${escapeJSAttr(sub.id)}')">Tambah Bab</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function populateTeacherOptions() {
  const select = document.getElementById("select-sub-teacher");
  if (!select) return;

  select.innerHTML = '<option value="">-- Pilih Guru Pengampu --</option>';
  appState.teachers.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.innerText = t.name;
    select.appendChild(opt);
  });
}

// Add teacher action
function handleAddTeacher(e) {
  e.preventDefault();

  if (appState.activeTeacherId !== "t-2") {
    alert("ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd yang memiliki wewenang untuk mendaftarkan guru baru!");
    return;
  }
  const nameInput = document.getElementById("input-teacher-name");
  const subjectInput = document.getElementById("input-teacher-subject");
  const classesInput = document.getElementById("input-teacher-classes");
  const name = nameInput.value.trim();
  const subjectDesc = subjectInput ? subjectInput.value.trim() : "";
  const classes = classesInput ? classesInput.value.trim() : "";

  if (!name) return;

  const isExist = appState.teachers.some(t => t.name.toLowerCase() === name.toLowerCase());
  if (isExist) {
    alert("Guru dengan nama ini sudah terdaftar!");
    return;
  }

  appState.teachers.push({
    id: "t-" + Date.now(),
    name: formatTeacherNameTitleCase(name),
    subjectDesc: subjectDesc,
    classes: classes
  });

  nameInput.value = "";
  if (subjectInput) subjectInput.value = "";
  if (classesInput) classesInput.value = "";
  saveData();
}

// Add subject action
function handleAddSubject(e) {
  e.preventDefault();

  if (appState.activeTeacherId !== "t-2") {
    alert("ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd yang memiliki wewenang untuk menambahkan mata pelajaran baru!");
    return;
  }
  const nameInput = document.getElementById("input-sub-name");
  const teacherSelect = document.getElementById("select-sub-teacher");
  const kkmInput = document.getElementById("input-sub-kkm");

  const name = nameInput.value.trim();
  const teacherId = teacherSelect.value;
  const kkm = parseInt(kkmInput.value, 10);

  if (!name || !teacherId || isNaN(kkm)) {
    alert("Harap lengkapi semua bidang mapel!");
    return;
  }

  const isExist = appState.subjects.some(s => (s.name || "").toLowerCase() === name.toLowerCase());
  if (isExist) {
    alert("Mata pelajaran dengan nama ini sudah terdaftar!");
    return;
  }

  const newSubId = "sub-" + Date.now();
  appState.subjects.push({
    id: newSubId,
    name: name,
    teacherId: teacherId,
    kkm: kkm,
    chapters: [
      { name: "Bab 1", tasks: ["Tugas 1"] } 
    ]
  });

  appState.students.forEach(st => {
    if (!st.grades[newSubId]) {
      st.grades[newSubId] = createEmptySubjectGrades();
      st.completeness[newSubId] = false;
    }
  });

  nameInput.value = "";
  teacherSelect.value = "";
  kkmInput.value = "75";
  saveData();
}

let currentEditingTeacherIdForClass = null;

function openClassChecklistModal(teacherId = null) {
  currentEditingTeacherIdForClass = teacherId;
  const container = document.getElementById("class-checklist-container");
  if (!container) return;
  
  // Get all registered classes
  const allClasses = appState.classes && appState.classes.length > 0 ? appState.classes : [];
  
  // Determine currently selected classes
  let selectedClasses = [];
  if (teacherId) {
    const teacher = appState.teachers.find(t => t.id === teacherId);
    if (teacher && teacher.classes) {
      selectedClasses = teacher.classes.split(',').map(c => c.trim().toUpperCase());
    }
  } else {
    // Reading from input field
    const input = document.getElementById("input-teacher-classes");
    if (input && input.value) {
      selectedClasses = input.value.split(',').map(c => c.trim().toUpperCase());
    }
  }

  container.innerHTML = "";
  
  // Generate checkboxes
  allClasses.sort().forEach(c => {
    const isChecked = selectedClasses.includes(c.toUpperCase()) ? "checked" : "";
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "0.5rem";
    label.style.padding = "0.75rem";
    label.style.background = "rgba(255,255,255,0.03)";
    label.style.borderRadius = "8px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <input type="checkbox" value="${c}" class="class-checklist-item" ${isChecked} style="accent-color: #a855f7; width: 16px; height: 16px; cursor: pointer;">
      <span style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">${c}</span>
    `;
    container.appendChild(label);
  });
  
  const modal = document.getElementById("class-checklist-modal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeClassChecklistModal() {
  const modal = document.getElementById("class-checklist-modal");
  if (modal) modal.style.display = "none";
}

function saveClassChecklist() {
  const checkboxes = document.querySelectorAll(".class-checklist-item:checked");
  const selectedClasses = Array.from(checkboxes).map(cb => cb.value).join(", ");
  
  if (currentEditingTeacherIdForClass) {
    // Edit existing teacher
    const teacher = appState.teachers.find(t => t.id === currentEditingTeacherIdForClass);
    if (teacher) {
      teacher.classes = selectedClasses;
      saveData();
      renderConfigTab();
    }
  } else {
    // New teacher input
    const input = document.getElementById("input-teacher-classes");
    if (input) {
      input.value = selectedClasses;
    }
  }
  
  closeClassChecklistModal();
}

function editTeacherClasses(teacherId) {
  openClassChecklistModal(teacherId);
}

function deleteTeacher(teacherId) {
  const teacher = appState.teachers.find(t => t.id === teacherId);
  if (!teacher) return;

  const checkInUse = appState.subjects.some(s => s.teacherId === teacherId);
  if (checkInUse) {
    alert(`Guru "${teacher.name}" tidak dapat dihapus karena masih mengampu beberapa mata pelajaran!`);
    return;
  }

  if (confirm(`Hapus guru "${teacher.name}"?`)) {
    appState.teachers = appState.teachers.filter(t => t.id !== teacherId);
    saveData();
  }
}

function deleteSubject(subjectId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  if (confirm(`Hapus mata pelajaran "${subject.name}"? Ini akan menghapus semua nilai mata pelajaran terkait untuk seluruh siswa.`)) {
    appState.subjects = appState.subjects.filter(s => s.id !== subjectId);
    
    appState.students.forEach(st => {
      delete st.grades[subjectId];
      delete st.completeness[subjectId];
    });

    saveData();
  }
}

function addChapterToSubject(subId) {
  const inp = document.getElementById(`add-chapter-input-${subId}`);
  const chName = inp.value.trim();

  if (!chName) return;

  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const isExist = sub.chapters.some(c => c.name.toLowerCase() === chName.toLowerCase());
  if (isExist) {
    alert("Bab dengan nama ini sudah ada!");
    return;
  }

  sub.chapters.push({
    name: chName,
    tasks: ["Tugas 1"]
  });

  appState.students.forEach(st => {
    if (!st.grades[subId]) {
      st.grades[subId] = { chapters: {} };
    }
    if (!st.grades[subId].chapters[chName]) {
      st.grades[subId].chapters[chName] = createEmptyChapterGrades();
    }
  });

  inp.value = "";
  saveData();
}

function deleteChapterFromSubject(subId, chName) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  if (confirm(`Hapus "${chName}" dari mata pelajaran "${sub.name}"?`)) {
    sub.chapters = sub.chapters.filter(c => c.name !== chName);

    appState.students.forEach(st => {
      if (st.grades[subId] && st.grades[subId].chapters) {
        delete st.grades[subId].chapters[chName];
      }
    });

    saveData();
  }
}

function addTaskToChapter(subId, chName) {
  const inputId = `add-task-input-${subId}-${chName.replace(/\s+/g, '')}`;
  const inp = document.getElementById(inputId);
  if (!inp) return;

  const tName = inp.value.trim();
  if (!tName) return;

  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const ch = sub.chapters.find(c => c.name === chName);
  if (!ch) return;

  if (ch.tasks.includes(tName)) {
    alert("Tugas dengan nama ini sudah terdaftar di bab ini!");
    return;
  }

  ch.tasks.push(tName);

  appState.students.forEach(st => {
    if (!st.grades[subId]) {
      st.grades[subId] = { chapters: {} };
    }
    if (!st.grades[subId].chapters[chName]) {
      st.grades[subId].chapters[chName] = createEmptyChapterGrades();
    }
    if (!st.grades[subId].chapters[chName].tasks) {
      st.grades[subId].chapters[chName].tasks = {};
    }
  });

  inp.value = "";
  saveData();
}

function deleteTaskFromChapter(subId, chName, tName) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const ch = sub.chapters.find(c => c.name === chName);
  if (!ch) return;

  if (confirm(`Hapus "${tName}" dari "${chName}"?`)) {
    ch.tasks = ch.tasks.filter(t => t !== tName);

    appState.students.forEach(st => {
      if (st.grades[subId] && st.grades[subId].chapters && st.grades[subId].chapters[chName] && st.grades[subId].chapters[chName].tasks) {
        delete st.grades[subId].chapters[chName].tasks[tName];
      }
    });

    saveData();
  }
}

// --- TEACHER MANAGEMENT FUNCTIONS V7 ---
function updateChapterMaxWeight(subId, chName, value, studentId) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const ch = sub.chapters.find(c => c.name === chName);
  if (!ch) return;

  const parsedVal = parseInt(value, 10);
  const targetMax = isNaN(parsedVal) ? 30 : Math.max(1, Math.min(1000, parsedVal));

  ch.targetMaxWeight = targetMax;

  saveData({ silent: true });

  // Recalculate and update indicator on screen instantly
  const chTasks = ch.tasks || [];
  const weights = ch.weights || {};
  
  const ulWeight = weights['ulangan'] !== undefined ? weights['ulangan'] : 1;
  const totalWeightSum = chTasks.reduce((acc, t) => acc + (weights[t] !== undefined ? parseInt(weights[t], 10) : 1), 0) + parseInt(ulWeight, 10);

  let statusColor = "var(--warning)";
  if (totalWeightSum === targetMax) statusColor = "var(--success)";
  if (totalWeightSum > targetMax) statusColor = "var(--danger)";

  const indicatorEl = document.getElementById(`bobot-indicator-${studentId}-${subId}-${chName.replace(/\s+/g, '')}`);
  if (indicatorEl) {
    indicatorEl.innerText = `${totalWeightSum}/${targetMax}`;
    indicatorEl.style.color = statusColor;
  }
}

function renderTeacherAssignmentsList() {
  const container = document.getElementById("teacher-assignments-list");
  if (!container) return;

  container.innerHTML = "";

  let assignedSubjects = appState.subjects;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  }

  let totalTasksRendered = 0;

  assignedSubjects.forEach(sub => {
    const assignments = sub.onlineAssignments || [];
    assignments.forEach(as => {
      totalTasksRendered++;
      
      const submissions = as.submissions || {};
      const subKeys = Object.keys(submissions);
      
      let submissionsHTML = "";
      if (subKeys.length === 0) {
        submissionsHTML = `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Belum ada jawaban dikumpulkan dari siswa.</div>`;
      } else {
        subKeys.forEach(studId => {
          const student = appState.students.find(s => s.id === studId);
          if (!student) return;

          const subData = submissions[studId];
          const isGraded = subData.grade !== null && subData.grade !== undefined;

          // Render details of student answers V18
          let answersDetailHTML = "";
          if (subData.answers && typeof subData.answers === "object") {
            answersDetailHTML = `<div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.25rem;">`;
            if (as.questions && as.questions.length > 0) {
              as.questions.forEach((q, qIdx) => {
                const studAns = subData.answers[q.id];
                if (studAns) {
                  if (q.type === "pg") {
                    const letter = ["A", "B", "C", "D"][studAns.answer] || "-";
                    const correctLetter = ["A", "B", "C", "D"][q.correctOptionIdx] || "-";
                    const isCorrect = studAns.isCorrect;
                    answersDetailHTML += `
                      <div style="font-size:0.75rem; border-left:3px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}; padding-left:0.5rem; margin-bottom:0.25rem;">
                        <strong>Soal ${qIdx + 1}:</strong> ${escapeHTML(q.questionText)}<br>
                        <span style="color:var(--text-secondary);">Jawaban siswa: <strong style="color:var(--text-primary);">${letter} (${escapeHTML(q.options[studAns.answer] || '')})</strong></span> | 
                        <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">${isCorrect ? 'Benar ✔' : 'Salah ✗ (Kunci: ' + correctLetter + ')'}</span>
                        <span style="color:var(--text-muted); font-size:0.7rem; margin-left:0.5rem;">(${studAns.pointsEarned} / ${q.points} Poin)</span>
                      </div>
                    `;
                  } else {
                    answersDetailHTML += `
                      <div style="font-size:0.75rem; border-left:3px solid var(--secondary); padding-left:0.5rem; margin-bottom:0.25rem;">
                        <strong>Soal ${qIdx + 1}:</strong> ${escapeHTML(q.questionText)}<br>
                        <span style="color:var(--text-secondary);">Jawaban Siswa:</span>
                        <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:4px; padding:0.45rem; margin-top:0.15rem; white-space:pre-line; color:var(--text-primary);">${escapeHTML(studAns.answer || '')}</div>
                        <span style="color:var(--text-muted); font-size:0.7rem;">(Bobot: ${q.points} Poin)</span>
                      </div>
                    `;
                  }
                }
              });
            } else {
              answersDetailHTML += `<div style="font-size:0.75rem; color:var(--text-muted);">Format jawaban tidak dikenali.</div>`;
            }
            answersDetailHTML += `</div>`;
          } else {
            // Legacy single question style
            const ansString = subData.answer || "";
            answersDetailHTML = `
              <div style="font-size:0.78rem; color:var(--text-secondary); background:var(--bg-secondary); border:1px solid var(--border); border-radius:4px; padding:0.5rem; white-space:pre-line;">
                Jawaban: ${escapeHTML(ansString)}
              </div>
            `;
          }

          submissionsHTML += `
            <div class="lms-submission-card">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <strong class="lms-submission-student">${escapeHTML(student.name)} <span style="font-weight:600; color:var(--text-secondary);">(${escapeHTML(student.class || '8A')})</span></strong>
                <span style="font-size:0.68rem; color:var(--text-muted);">${formatDateTime(new Date(subData.submittedAt))}</span>
              </div>
              ${answersDetailHTML}
              <div style="display:flex; align-items:center; gap:0.5rem; justify-content:flex-end;">
                <span style="font-size:0.75rem; color:var(--text-muted);">Skor Nilai:</span>
                <input type="number" min="0" max="100" class="inline-grade-input" style="width:50px; height:26px; font-size:0.8rem; padding:0 4px;"
                  value="${isGraded ? subData.grade : ''}"
                  placeholder="Input"
                  oninput="gradeOnlineAssignmentSubmission('${escapeJSAttr(sub.id)}', '${escapeJSAttr(as.id)}', '${escapeJSAttr(studId)}', this.value)">
                <span class="status-badge ${isGraded ? 'complete' : 'incomplete'}" style="font-size:0.65rem; padding:1px 6px;">
                  ${isGraded ? '✔ Dinilai' : '⏱ Perlu diperiksa'}
                </span>
              </div>
            </div>
          `;
        });
      }

      // Render questions preview inside the card V18
      let questionPreviewHTML = "";
      if (as.questions && as.questions.length > 0) {
        questionPreviewHTML = `<div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.25rem;">`;
        as.questions.forEach((q, idx) => {
          const typeLabel = q.type === "pg" ? "Pilihan Ganda" : "Essay";
          questionPreviewHTML += `
            <div style="font-size:0.75rem; color:var(--text-secondary);">
              <strong>Soal ${idx + 1} (${typeLabel} | ${q.points} Poin):</strong> ${escapeHTML(q.questionText)}
            </div>
          `;
        });
        questionPreviewHTML += `</div>`;
      } else {
        questionPreviewHTML = `<div>${escapeHTML(as.question)}</div>`;
      }

      const card = document.createElement("div");
      card.className = "lms-assignment-card";

      let visibilityHTML = `<div class="lms-visibility-box">
        <span class="lms-visibility-label">Visibilitas per kelas</span>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">`;
      
      appState.classes.forEach(c => {
        const isHidden = !as.hiddenClasses || as.hiddenClasses.includes(c);
        visibilityHTML += `
          <label class="lms-class-check">
            <input type="checkbox" ${!isHidden ? 'checked' : ''} onchange="toggleItemVisibility('${escapeJSAttr(sub.id)}', '${escapeJSAttr(as.id)}', 'assignment', '${escapeJSAttr(c)}', !this.checked)" style="accent-color:var(--indigo);">
            ${escapeHTML(c)}
          </label>
        `;
      });
      visibilityHTML += `</div></div>`;

      card.innerHTML = `
        <div class="lms-assignment-card-header">
          <div>
            <strong class="lms-assignment-title">${escapeHTML(as.title)}</strong>
            <span class="lms-assignment-meta">${escapeHTML(sub.name)} · Rilis ${formatDateTime(new Date(as.releaseTime))} · Batas ${formatDateTime(new Date(as.endTime))}</span>
          </div>
          <button class="icon-btn delete-btn" style="width:28px; height:28px; flex-shrink:0;" onclick="deleteOnlineAssignment('${escapeJSAttr(sub.id)}', '${escapeJSAttr(as.id)}')" title="Hapus tugas">
            <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
          </button>
        </div>
        <div class="lms-question-preview">
          <strong style="display:block; margin-bottom:0.35rem; font-size:0.75rem;">Soal yang dirilis</strong>
          ${questionPreviewHTML}
        </div>
        ${visibilityHTML}
        <div>
          <span style="font-size:0.72rem; font-weight:700; color:var(--indigo); display:block; margin-bottom:0.45rem;">Jawaban masuk (${subKeys.length})</span>
          ${submissionsHTML}
        </div>
      `;
      container.appendChild(card);
    });
  });

  if (totalTasksRendered === 0) {
    container.innerHTML = `
      <div class="lms-empty-state">
        <span class="material-symbols-rounded">assignment_late</span>
        <p>Belum ada tugas daring yang dirilis</p>
        <small>Buat tugas baru di panel kiri, lalu klik <strong>Rilis tugas</strong>.</small>
      </div>`;
  }
}

function gradeOnlineAssignmentSubmission(subjectId, assignmentId, studentId, value) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  const assignment = subject.onlineAssignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  const parsedVal = parseInt(value, 10);
  const grade = isNaN(parsedVal) ? null : Math.max(0, Math.min(100, parsedVal));

  if (!assignment.submissions) assignment.submissions = {};
  if (!assignment.submissions[studentId]) return;

  assignment.submissions[studentId].grade = grade;

  // Integrasi Otomatis ke Rapor Siswa:
  if (grade !== null && subject.chapters && subject.chapters.length > 0) {
    const student = appState.students.find(s => s.id === studentId);
    if (student) {
      const targetChapter = subject.chapters[0].name;
      const targetTask = subject.chapters[0].tasks[0] || "Tugas 1";

      if (!student.grades[subjectId]) {
        student.grades[subjectId] = { chapters: {} };
      }
      if (!student.grades[subjectId].chapters[targetChapter]) {
        student.grades[subjectId].chapters[targetChapter] = createEmptyChapterGrades();
      }
      
      student.grades[subjectId].chapters[targetChapter].tasks[targetTask] = grade;
      recalculateSubjectCompleteness(student, subjectId);
    }
  }

  saveData({ silent: true });
  updateTeacherStats();
}

function renderTeacherExamsList() {
  const container = document.getElementById("teacher-exams-list");
  if (!container) return;

  container.innerHTML = "";

  let assignedSubjects = appState.subjects;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  }

  let totalExamsRendered = 0;

  assignedSubjects.forEach(sub => {
    const exams = sub.onlineExams || [];
    exams.forEach(ex => {
      totalExamsRendered++;
      
      const submissions = ex.submissions || {};
      const subKeys = Object.keys(submissions);
      
      let submissionsHTML = "";
      if (subKeys.length === 0) {
        submissionsHTML = `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Belum ada siswa yang menyelesaikan ujian ini.</div>`;
      } else {
        subKeys.forEach(studId => {
          const student = appState.students.find(s => s.id === studId);
          if (!student) return;

          const subData = submissions[studId];
          const isGraded = subData.grade !== null && subData.grade !== undefined;

          let studentAnswersDetailHTML = "";
          const pck = subData.package || [];
          pck.forEach((qId, qIdx) => {
            const question = ex.questionBank.find(q => q.id === qId);
            if (!question) return;

            const studentAns = subData.answers[qId];
            let ansDisplay = studentAns || "Belum Dijawab";

            if (question.type === "pg") {
              const alphabet = ["A", "B", "C", "D"];
              const ansIdx = parseInt(studentAns, 10);
              const correctIdx = parseInt(question.correct, 10);
              const isCorrect = ansIdx === correctIdx;
              ansDisplay = `Opsi: ${alphabet[ansIdx] !== undefined ? alphabet[ansIdx] : 'Belum Dijawab'} - ${isCorrect ? '<span style="color:var(--success); font-weight:700;">BENAR (✔)</span>' : '<span style="color:var(--danger); font-weight:700;">SALAH (✗)</span>'}`;
            }

            studentAnswersDetailHTML += `
              <div style="font-size:0.72rem; color:var(--text-secondary); margin-bottom:4px; padding-left:0.5rem; border-left:2px solid var(--border-color);">
                <span>Q${qIdx+1} (${question.type.toUpperCase()}): ${escapeHTML(question.question)}</span>
                <div style="color:var(--text-primary); font-weight:600; margin-top:2px;">Jawab: ${escapeHTML(ansDisplay)}</div>
              </div>
            `;
          });

          let cheatWarningHTML = "";
          if (subData.isCheated) {
            cheatWarningHTML = `
              <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 6px; font-size: 0.72rem; color: var(--danger); font-weight: 700; display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
                🚨 TERDETEKSI CURANG (Beralih aplikasi/keluar 2x) - Ujian Dikunci Otomatis!
              </div>
            `;
          }

          submissionsHTML += `
            <div class="lms-submission-card">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <strong class="lms-submission-student">${escapeHTML(student.name)} <span style="font-weight:600; color:var(--text-secondary);">(${escapeHTML(student.class || '8A')})</span>${subData.isCheated ? ` <span style="background:var(--danger); color:white; font-size:0.6rem; padding:1px 6px; border-radius:4px; font-weight:800; animation:timerPulse 1.5s infinite; vertical-align:middle; display:inline-block;">CURANG</span>` : ''}</strong>
                <span style="font-size:0.68rem; color:var(--text-muted);">${formatDateTime(new Date(subData.submittedAt))}</span>
              </div>
              ${cheatWarningHTML}
              <div style="display:flex; flex-direction:column; gap:0.25rem; margin-top:0.25rem;">
                ${studentAnswersDetailHTML}
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; justify-content:flex-end; border-top:1px dashed var(--border); padding-top:0.5rem; margin-top:0.25rem;">
                <span style="font-size:0.75rem; color:var(--text-muted);">${subData.autoGradePg !== null ? `Auto PG: ${subData.autoGradePg} | ` : ''} Skor akhir ujian:</span>
                <input type="number" min="0" max="100" class="inline-grade-input" style="width:50px; height:26px; font-size:0.8rem; padding:0 4px;"
                  value="${isGraded ? subData.grade : ''}"
                  placeholder="Input"
                  oninput="gradeOnlineExamSubmission('${sub.id}', '${ex.id}', '${studId}', this.value)">
                <span class="status-badge ${isGraded ? 'complete' : 'incomplete'}" style="font-size:0.65rem; padding:1px 6px;">
                  ${isGraded ? '✔ Dinilai' : '⏱ Perlu koreksi'}
                </span>
              </div>
            </div>
          `;
        });
      }

      const card = document.createElement("div");
      card.className = "lms-assignment-card";

      let visibilityHTML = `<div class="lms-visibility-box">
        <span class="lms-visibility-label">Visibilitas per kelas</span>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">`;
      
      appState.classes.forEach(c => {
        const isHidden = !ex.hiddenClasses || ex.hiddenClasses.includes(c);
        visibilityHTML += `
          <label class="lms-class-check">
            <input type="checkbox" ${!isHidden ? 'checked' : ''} onchange="toggleItemVisibility('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ex.id)}', 'exam', '${escapeJSAttr(c)}', !this.checked)" style="accent-color:var(--indigo);">
            ${escapeHTML(c)}
          </label>
        `;
      });
      visibilityHTML += `</div></div>`;

      card.innerHTML = `
        <div class="lms-assignment-card-header">
          <div>
            <strong class="lms-assignment-title">${escapeHTML(ex.title)}</strong>
            <span class="lms-assignment-meta">${escapeHTML(sub.name)} · Rilis ${formatDateTime(new Date(ex.releaseTime))} · Durasi ${ex.duration} mnt</span>
          </div>
          <button class="icon-btn delete-btn" style="width:28px; height:28px; flex-shrink:0;" onclick="deleteOnlineExam('${escapeJSAttr(sub.id)}', '${escapeJSAttr(ex.id)}')" title="Hapus ujian">
            <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
          </button>
        </div>
        ${visibilityHTML}
        <div>
          <span style="font-size:0.72rem; font-weight:700; color:var(--indigo); display:block; margin-bottom:0.45rem;">Jawaban CBT masuk (${subKeys.length})</span>
          ${submissionsHTML}
        </div>
      `;
      container.appendChild(card);
    });
  });

  if (totalExamsRendered === 0) {
    container.innerHTML = `
      <div class="lms-empty-state">
        <span class="material-symbols-rounded">quiz</span>
        <p>Belum ada jadwal ujian CBT yang dirilis</p>
        <small>Buat sesi ujian baru di panel kiri untuk mapel Anda.</small>
      </div>`;
  }
}

function gradeOnlineExamSubmission(subjectId, examId, studentId, value) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  const exam = subject.onlineExams.find(e => e.id === examId);
  if (!exam) return;

  const parsedVal = parseInt(value, 10);
  const grade = isNaN(parsedVal) ? null : Math.max(0, Math.min(100, parsedVal));

  if (!exam.submissions) exam.submissions = {};
  if (!exam.submissions[studentId]) return;

  exam.submissions[studentId].grade = grade;

  // Integrasi Otomatis Ujian CBT ke Rapor Nilai Ulangan Siswa:
  if (grade !== null && subject.chapters && subject.chapters.length > 0) {
    const student = appState.students.find(s => s.id === studentId);
    if (student) {
      const targetChapter = subject.chapters[0].name;
      
      if (!student.grades[subjectId]) {
        student.grades[subjectId] = { chapters: {} };
      }
      if (!student.grades[subjectId].chapters[targetChapter]) {
        student.grades[subjectId].chapters[targetChapter] = createEmptyChapterGrades();
      }
      
      student.grades[subjectId].chapters[targetChapter].ulangan = grade;
      recalculateSubjectCompleteness(student, subjectId);
    }
  }

  saveData({ silent: true });
  updateTeacherStats();
}

function renderTeacherQuestionBankList() {
  const container = document.getElementById("teacher-question-bank-list");
  if (!container) return;

  container.innerHTML = "";

  let assignedSubjects = appState.subjects;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  }

  let totalQuestionsRendered = 0;

  assignedSubjects.forEach(sub => {
    const exams = sub.onlineExams || [];
    exams.forEach(ex => {
      const questions = ex.questionBank || [];
      questions.forEach((q, idx) => {
        totalQuestionsRendered++;

        const div = document.createElement("div");
        div.className = "lms-bank-item";
        
        let typeBadge = `<span class="status-badge complete" style="font-size:0.6rem; padding:1px 5px;">PG</span>`;
        if (q.type === "essay") typeBadge = `<span class="status-badge warning" style="font-size:0.6rem; padding:1px 5px;">ESSAY</span>`;
        if (q.type === "kertas") typeBadge = `<span class="status-badge warning" style="font-size:0.6rem; padding:1px 5px; background:rgba(6,182,212,0.1); color:var(--secondary);">KERTAS</span>`;
        if (q.type === "kustom") typeBadge = `<span class="status-badge" style="font-size:0.6rem; padding:1px 5px;">KUSTOM</span>`;

        div.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:0.15rem; max-width:80%;">
            <div style="display:flex; align-items:center; gap:0.35rem;">
              ${typeBadge}
              <span style="font-size:0.68rem; color:var(--text-muted); font-weight:700;">${sub.name} - ${ex.title}</span>
            </div>
            <span class="lms-bank-item-text">${escapeHTML(q.question)}</span>
          </div>
          <button class="icon-btn delete-btn" style="width:22px; height:22px; display:flex; align-items:center; justify-content:center;" onclick="deleteQuestionFromBank('${sub.id}', '${ex.id}', '${q.id}')"><span class="material-symbols-rounded" style="font-size: 12px;">close</span></button>
        `;
        container.appendChild(div);
      });
    });
  });

  if (totalQuestionsRendered === 0) {
    container.innerHTML = `
      <div class="lms-empty-state" style="padding:2rem 1rem;">
        <span class="material-symbols-rounded">library_books</span>
        <p>Bank soal masih kosong</p>
        <small>Tambahkan butir soal melalui form di panel kiri.</small>
      </div>`;
  }
}

function deleteOnlineAssignment(subId, assignmentId) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  if (confirm("Apakah Anda yakin ingin menghapus tugas daring ini? Seluruh kiriman siswa juga akan terhapus.")) {
    sub.onlineAssignments = sub.onlineAssignments.filter(a => a.id !== assignmentId);
    saveData();
    renderTeacherAssignmentsList();
    alert("Tugas daring berhasil dihapus!");
  }
}

function deleteOnlineExam(subId, examId) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  if (confirm("Apakah Anda yakin ingin menghapus ujian CBT ini? Seluruh lembar jawaban siswa juga akan terhapus.")) {
    sub.onlineExams = sub.onlineExams.filter(e => e.id !== examId);
    saveData();
    renderTeacherExamsList();
    renderTeacherQuestionBankList();
    alert("Ujian CBT berhasil dihapus!");
  }
}

function toggleItemVisibility(subjectId, itemId, itemType, className, isHidden) {
  const sub = appState.subjects.find(s => s.id === subjectId);
  if (!sub) return;

  let item = null;
  if (itemType === 'assignment') {
    item = sub.onlineAssignments.find(a => a.id === itemId);
  } else if (itemType === 'exam') {
    item = sub.onlineExams.find(e => e.id === itemId);
  } else if (itemType === 'directory') {
    if (!sub.tasksDirectory) sub.tasksDirectory = {};
    if (!sub.tasksDirectory[itemId]) {
      sub.tasksDirectory[itemId] = { hiddenClasses: getDefaultTaskHiddenClasses() };
    }
    item = sub.tasksDirectory[itemId];
  }

  if (!item) return;

  if (!item.hiddenClasses) item.hiddenClasses = [...appState.classes];

  if (isHidden) {
    if (!item.hiddenClasses.includes(className)) {
      item.hiddenClasses.push(className);
    }
  } else {
    item.hiddenClasses = item.hiddenClasses.filter(c => c !== className);
  }

  if (itemType === 'directory') {
    recalculateAllStudentsCompleteness();
  }

  saveData();
  
  if (itemType === 'assignment') {
    renderTeacherAssignmentsList();
  } else if (itemType === 'exam') {
    renderTeacherExamsList();
  } else if (itemType === 'directory') {
    renderTasksDirectoryTab();
  }
}

function toggleAllClassesVisibility(subjectId, itemId, itemType, hideAll, targetClass = "ALL") {
  const sub = appState.subjects.find(s => s.id === subjectId);
  if (!sub) return;
  if (itemType === 'directory') {
    if (!sub.tasksDirectory) sub.tasksDirectory = {};
    if (!sub.tasksDirectory[itemId]) {
      sub.tasksDirectory[itemId] = { hiddenClasses: getDefaultTaskHiddenClasses() };
    }
    const item = sub.tasksDirectory[itemId];
    
    if (!item.hiddenClasses) item.hiddenClasses = getDefaultTaskHiddenClasses();

    const scopedClasses = targetClass === "ALL"
      ? getClassesForSubjectScope(sub, "ALL")
      : getClassesForSubjectScope(sub, targetClass);

    if (targetClass === "ALL") {
      if (hideAll) {
        scopedClasses.forEach((className) => {
          if (!item.hiddenClasses.includes(className)) item.hiddenClasses.push(className);
        });
      } else {
        item.hiddenClasses = item.hiddenClasses.filter((className) => !scopedClasses.includes(className));
      }
    } else if (scopedClasses.includes(targetClass)) {
      if (hideAll) {
        if (!item.hiddenClasses.includes(targetClass)) item.hiddenClasses.push(targetClass);
      } else {
        item.hiddenClasses = item.hiddenClasses.filter(c => c !== targetClass);
      }
    }
    recalculateAllStudentsCompleteness();
    saveData();
    renderTasksDirectoryTab();
  }
}

function toggleChapterVisibility(subjectId, chapterName, hideAll, targetClass = "ALL") {
  const sub = appState.subjects.find(s => s.id === subjectId);
  if (!sub) return;
  if (!sub.tasksDirectory) sub.tasksDirectory = {};
  
  const chKey = "__CHAP__" + chapterName;
  if (!sub.tasksDirectory[chKey]) sub.tasksDirectory[chKey] = { hiddenClasses: [...appState.classes] };
  const item = sub.tasksDirectory[chKey];
  if (!item.hiddenClasses) item.hiddenClasses = [...appState.classes];
  
  if (targetClass === "ALL") {
    if (hideAll) {
      item.hiddenClasses = [...appState.classes];
    } else {
      item.hiddenClasses = [];
    }
  } else {
    if (hideAll) {
      if (!item.hiddenClasses.includes(targetClass)) item.hiddenClasses.push(targetClass);
    } else {
      item.hiddenClasses = item.hiddenClasses.filter(c => c !== targetClass);
    }
  }
  saveData();
  renderTasksDirectoryTab();
}

function deleteQuestionFromBank(subId, examId, qId) {
  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const exam = sub.onlineExams.find(e => e.id === examId);
  if (!exam) return;

  if (confirm("Hapus butir soal ini dari bank soal?")) {
    exam.questionBank = exam.questionBank.filter(q => q.id !== qId);
    saveData();
    renderTeacherQuestionBankList();
    renderTeacherExamsList();
    alert("Butir soal berhasil dihapus!");
  }
}

function populateTeacherDashboardOptions() {
  let assignedSubjects = appState.subjects;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  }

  const asSub = document.getElementById("assignment-subject-select");
  const exSub = document.getElementById("exam-subject-select");
  const qSub = document.getElementById("question-subject-select");

  if (asSub) {
    asSub.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
    assignedSubjects.forEach(s => {
      asSub.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
  }

  if (exSub) {
    exSub.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
    assignedSubjects.forEach(s => {
      exSub.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
  }

  if (qSub) {
    qSub.innerHTML = '<option value="">-- Pilih Mata Pelajaran/Ujian --</option>';
    assignedSubjects.forEach(s => {
      const exams = s.onlineExams || [];
      exams.forEach(ex => {
        qSub.innerHTML += `<option value="${s.id}|${ex.id}">${s.name} - ${ex.title}</option>`;
      });
    });
  }
}

function readImageAsBase64(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

// --- DYNAMIC LMS ASSIGNMENT BUILDER (GOOGLE FORM STYLE) V18 ---
appState.builderQuestions = [];

function addBuilderQuestion(type = 'pg') {
  if (!appState.builderQuestions) appState.builderQuestions = [];
  appState.builderQuestions.push({
    id: "q-" + Date.now() + Math.random().toString(36).substr(2, 5),
    type: type,
    questionText: "",
    points: 10,
    options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    correctOptionIdx: 0
  });
  renderBuilderQuestions();
}
window.addBuilderQuestion = addBuilderQuestion;

function deleteBuilderQuestion(id) {
  appState.builderQuestions = appState.builderQuestions.filter(q => q.id !== id);
  renderBuilderQuestions();
}
window.deleteBuilderQuestion = deleteBuilderQuestion;

function updateBuilderQuestionRadio(qId, optIdx) {
  const q = appState.builderQuestions.find(x => x.id === qId);
  if (q) q.correctOptionIdx = optIdx;
}
window.updateBuilderQuestionRadio = updateBuilderQuestionRadio;

function updateBuilderQuestionOption(qId, optIdx, val) {
  const q = appState.builderQuestions.find(x => x.id === qId);
  if (q) q.options[optIdx] = val;
}
window.updateBuilderQuestionOption = updateBuilderQuestionOption;

function updateBuilderQuestionType(qId, type) {
  const q = appState.builderQuestions.find(x => x.id === qId);
  if (q) {
    q.type = type;
    renderBuilderQuestions();
  }
}
window.updateBuilderQuestionType = updateBuilderQuestionType;

function updateBuilderQuestionPoints(qId, points) {
  const q = appState.builderQuestions.find(x => x.id === qId);
  if (q) q.points = parseInt(points, 10) || 0;
}
window.updateBuilderQuestionPoints = updateBuilderQuestionPoints;

function updateBuilderQuestionText(qId, text) {
  const q = appState.builderQuestions.find(x => x.id === qId);
  if (q) q.questionText = text;
}
window.updateBuilderQuestionText = updateBuilderQuestionText;

function renderBuilderQuestions() {
  const container = document.getElementById("assignment-questions-list");
  if (!container) return;
  container.innerHTML = "";

  if (!appState.builderQuestions || appState.builderQuestions.length === 0) {
    container.innerHTML = `
      <div class="lms-empty-state" style="padding:1.5rem 1rem;">
        <span class="material-symbols-rounded">quiz</span>
        <p>Belum ada pertanyaan</p>
        <small>Klik <strong>Tambah soal</strong> untuk mulai membuat tugas daring.</small>
      </div>`;
    return;
  }

  appState.builderQuestions.forEach((q, idx) => {
    const qDiv = document.createElement("div");
    qDiv.className = "builder-question-card";

    const pgOptionsHTML = q.type === "pg" ? `
      <div class="pg-options-block">
        <label class="lms-form-label">Pilihan jawaban & kunci</label>
        ${[0, 1, 2, 3].map(optIdx => {
          const letter = ["A", "B", "C", "D"][optIdx];
          const isCorrect = q.correctOptionIdx === optIdx;
          return `
            <div class="pg-option-row${isCorrect ? ' is-correct' : ''}">
              <input type="radio" name="builder-correct-${q.id}" value="${optIdx}" ${isCorrect ? "checked" : ""} 
                onchange="updateBuilderQuestionRadio('${q.id}', ${optIdx}); renderBuilderQuestions();" style="cursor:pointer; accent-color:var(--indigo);">
              <span class="pg-option-letter">${letter}</span>
              <input type="text" class="form-control" style="height:32px; font-size:0.8rem; padding:0 0.55rem; flex:1; border:none; background:transparent; box-shadow:none;" 
                value="${escapeHTML(q.options[optIdx])}" oninput="updateBuilderQuestionOption('${q.id}', ${optIdx}, this.value)" placeholder="Pilihan ${letter}">
            </div>
          `;
        }).join("")}
      </div>
    ` : "";

    qDiv.innerHTML = `
      <div class="builder-question-header">
        <span class="builder-question-index">Pertanyaan #${idx + 1}</span>
        <button type="button" class="icon-btn delete-btn" style="width:24px; height:24px;" onclick="deleteBuilderQuestion('${q.id}')" title="Hapus soal">
          <span class="material-symbols-rounded" style="font-size:14px;">close</span>
        </button>
      </div>
      <div class="builder-meta-grid">
        <div class="form-group" style="margin:0;">
          <label class="lms-form-label">Tipe soal</label>
          <select class="filter-select" style="width:100%; height:38px;" 
            onchange="updateBuilderQuestionType('${q.id}', this.value)">
            <option value="pg" ${q.type === "pg" ? "selected" : ""}>Pilihan ganda (autograde)</option>
            <option value="essay" ${q.type === "essay" ? "selected" : ""}>Jawaban singkat / essay</option>
            <option value="buku" ${q.type === "buku" ? "selected" : ""}>Instruksi bacaan / buku</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="lms-form-label">Bobot poin</label>
          <input type="number" class="form-control" style="height:38px;" 
            value="${q.points}" min="0" max="100" oninput="updateBuilderQuestionPoints('${q.id}', this.value)">
        </div>
      </div>
      <div class="form-group" style="margin:0;">
        <label class="lms-form-label">Soal</label>
        <textarea class="form-control" rows="2" style="min-height:72px;" 
          placeholder="Tuliskan butir pertanyaan di sini..." oninput="updateBuilderQuestionText('${q.id}', this.value)">${q.questionText}</textarea>
      </div>
      ${pgOptionsHTML}
    `;
    container.appendChild(qDiv);
  });
}
window.renderBuilderQuestions = renderBuilderQuestions;

async function handleCreateAssignmentFormSubmit(e) {
  e.preventDefault();
  const subId = document.getElementById("assignment-subject-select").value;
  const title = document.getElementById("assignment-title-input").value.trim();
  const releaseTime = document.getElementById("assignment-release-input").value;
  const startTime = document.getElementById("assignment-start-input").value || releaseTime;
  const endTime = document.getElementById("assignment-end-input").value;

  if (!subId || !title || !releaseTime || !endTime) {
    alert("Harap lengkapi seluruh kolom tugas daring!");
    return;
  }

  if (!appState.builderQuestions || appState.builderQuestions.length === 0) {
    alert("Harap tambahkan minimal 1 pertanyaan untuk tugas daring!");
    return;
  }

  // Check if all questions have texts
  let invalid = false;
  appState.builderQuestions.forEach(q => {
    if (!q.questionText.trim()) invalid = true;
  });
  if (invalid) {
    alert("Semua soal/pertanyaan wajib diisi!");
    return;
  }

  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const imageFileInput = document.getElementById("assignment-image-input");
  const imageDescInput = document.getElementById("assignment-image-desc-input");
  
  const imageFile = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;
  const imageBase64 = await readImageAsBase64(imageFile);
  const imageDesc = imageDescInput ? imageDescInput.value.trim() : "";

  if (!sub.onlineAssignments) sub.onlineAssignments = [];
  sub.onlineAssignments.push({
    id: "as-" + Date.now(),
    title,
    question: `Tugas Daring: ${title} (${appState.builderQuestions.length} Soal)`,
    questions: JSON.parse(JSON.stringify(appState.builderQuestions)),
    releaseTime,
    startTime,
    endTime,
    image: imageBase64,
    imageDesc: imageDesc,
    submissions: {}
  });

  saveData();
  
  document.getElementById("assignment-title-input").value = "";
  document.getElementById("assignment-release-input").value = "";
  document.getElementById("assignment-start-input").value = "";
  document.getElementById("assignment-end-input").value = "";
  if (imageFileInput) imageFileInput.value = "";
  if (imageDescInput) imageDescInput.value = "";

  // Reset builder questions to 1 default question
  appState.builderQuestions = [];
  addBuilderQuestion("pg");

  renderTeacherAssignmentsList();
  alert("Tugas daring baru berhasil dirilis!");
}

async function handleCreateExamFormSubmit(e) {
  e.preventDefault();
  const subId = document.getElementById("exam-subject-select").value;
  const title = document.getElementById("exam-title-input").value.trim();
  const releaseTime = document.getElementById("exam-release-input").value;
  const startTime = document.getElementById("exam-start-input").value || releaseTime;
  const endTime = document.getElementById("exam-end-input").value;
  const duration = parseInt(document.getElementById("exam-duration-input").value, 10);
  
  const shuffleInput = document.getElementById("exam-shuffle-input");
  const minSubmitInput = document.getElementById("exam-min-submit-input");
  
  const shuffle = shuffleInput ? shuffleInput.checked : true;
  const minSubmitTime = minSubmitInput ? parseInt(minSubmitInput.value, 10) : 10;

  if (!subId || !title || !releaseTime || !endTime || isNaN(duration)) {
    alert("Harap lengkapi seluruh kolom sesi ujian!");
    return;
  }

  const sub = appState.subjects.find(s => s.id === subId);
  if (!sub) return;

  const imageFileInput = document.getElementById("exam-image-input");
  const imageDescInput = document.getElementById("exam-image-desc-input");
  
  const imageFile = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;
  const imageBase64 = await readImageAsBase64(imageFile);
  const imageDesc = imageDescInput ? imageDescInput.value.trim() : "";

  if (!sub.onlineExams) sub.onlineExams = [];
  sub.onlineExams.push({
    id: "ex-" + Date.now(),
    title,
    releaseTime,
    startTime,
    endTime,
    duration,
    shuffle,
    minSubmitTime,
    image: imageBase64,
    imageDesc: imageDesc,
    questionBank: [],
    submissions: {}
  });

  saveData();

  document.getElementById("exam-title-input").value = "";
  document.getElementById("exam-release-input").value = "";
  document.getElementById("exam-start-input").value = "";
  document.getElementById("exam-end-input").value = "";
  document.getElementById("exam-duration-input").value = "60";
  if (imageFileInput) imageFileInput.value = "";
  if (imageDescInput) imageDescInput.value = "";
  if (shuffleInput) shuffleInput.checked = true;
  if (minSubmitInput) minSubmitInput.value = "10";

  populateTeacherDashboardOptions();
  renderTeacherExamsList();
  alert("Sesi Ujian CBT baru berhasil dijadwalkan!");
}

function handleAddQuestionFormSubmit(e) {
  e.preventDefault();
  const val = document.getElementById("question-subject-select").value;
  if (!val) return;

  const [subId, examId] = val.split("|");
  const type = document.getElementById("question-type-select").value;
  const questionText = document.getElementById("question-text-input").value.trim();

  const sub = appState.subjects.find(s => s.id === subId);
  const exam = sub.onlineExams.find(ex => ex.id === examId);
  if (!exam) return;

  const newQuestion = {
    id: "q-" + Date.now(),
    type,
    question: questionText
  };

  if (type === "pg") {
    const opt0 = document.getElementById("pg-opt-0").value.trim();
    const opt1 = document.getElementById("pg-opt-1").value.trim();
    const opt2 = document.getElementById("pg-opt-2").value.trim();
    const opt3 = document.getElementById("pg-opt-3").value.trim();
    const correct = parseInt(document.getElementById("pg-correct-select").value, 10);

    if (!opt0 || !opt1 || !opt2 || !opt3) {
      alert("Untuk tipe Pilihan Ganda, harap isi opsi A, B, C, dan D secara lengkap!");
      return;
    }

    newQuestion.options = [opt0, opt1, opt2, opt3];
    newQuestion.correct = correct;
  }

  if (!exam.questionBank) exam.questionBank = [];
  exam.questionBank.push(newQuestion);

  saveData();

  document.getElementById("question-text-input").value = "";
  document.getElementById("pg-opt-0").value = "";
  document.getElementById("pg-opt-1").value = "";
  document.getElementById("pg-opt-2").value = "";
  document.getElementById("pg-opt-3").value = "";

  renderTeacherQuestionBankList();
  renderTeacherExamsList();
  alert("Butir soal berhasil ditambahkan ke bank soal!");
}

function toggleQuestionOptions(type) {
  const pgArea = document.getElementById("pg-options-area");
  if (pgArea) {
    pgArea.style.display = type === "pg" ? "flex" : "none";
  }
}

// --- STUDENT AFFAIRS & DELETE SYSTEM ---
function deleteStudent(studentId) {
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    alert("Akses Ditolak!\nHanya Wali Kelas atau Tim Kesiswaan yang memiliki wewenang untuk menghapus data siswa!");
    return;
  }

  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  if (confirm(`Apakah Anda yakin ingin menghapus siswa "${student.name}"? Semua data nilai, tugas, dan kartu ujiannya akan terhapus secara permanen.`)) {
    appState.students = appState.students.filter(s => s.id !== studentId);
    saveData();
    
    // Refresh student view selectors
    populateClassSelect();
    populateTeacherClassFilter();
    
    // Re-render
    if (appState.selectedStudentId === studentId) {
      closeTeacherRightPane();
    } else {
      renderStudentTable();
      renderIncompleteStudentsList();
    }
    
    if (appState.teacherActiveTab === "kesiswaan") {
      renderKesiswaanTab();
    }
    
    updateTeacherStats();
    
    alert(`Siswa "${student.name}" berhasil dihapus dari database!`);
  }
}

function populateTeacherClassFilter() {
  const classFilterSelect = document.getElementById("teacher-class-filter-select");
  if (!classFilterSelect) return;

  const currentSelection = appState.teacherClassFilter || "all";
  classFilterSelect.innerHTML = '<option value="all">Semua Kelas</option>';

  const uniqueClasses = [];
  appState.students.forEach(st => {
    if (st.class && !uniqueClasses.includes(st.class)) {
      uniqueClasses.push(st.class);
    }
  });

  uniqueClasses.sort().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.innerText = c;
    if (c === currentSelection) opt.selected = true;
    classFilterSelect.appendChild(opt);
  });
}

// Helper: Mendapatkan kelas yang diajar minimal oleh satu guru
function getActiveClassesTaughtByTeachers() {
  const baseClasses = appState.classes && appState.classes.length > 0 
    ? appState.classes 
    : [];
  
  const taughtClasses = new Set();
  if (appState.teachers) {
    appState.teachers.forEach(t => {
      if (t.classes) {
        t.classes.split(',').forEach(c => taughtClasses.add(c.trim().toUpperCase()));
      }
    });
  }
  
  return baseClasses.filter(c => taughtClasses.has(c.toUpperCase()));
}

function populateKesiswaanClassFilter() {
  const filterSelect = document.getElementById("kesiswaan-class-filter");
  if (!filterSelect) return;

  const currentSelection = filterSelect.value || "all";
  filterSelect.innerHTML = '<option value="all">Semua Kelas</option>';

  const uniqueClasses = [];
  appState.students.forEach(st => {
    if (st.class && !uniqueClasses.includes(st.class)) {
      uniqueClasses.push(st.class);
    }
  });

  uniqueClasses.sort().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.innerText = c;
    if (c === currentSelection) opt.selected = true;
    filterSelect.appendChild(opt);
  });
}

function toggleExamCard(studentId) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  const details = getOverallStudentCompleteness(student);
  if (!details.isAllComplete && !student.examCardGiven) {
    alert("Siswa belum menyelesaikan seluruh tugasnya! Kartu ujian hanya dapat diberikan jika status tugas sudah Hijau (Lengkap).");
    return;
  }

  student.examCardGiven = !student.examCardGiven;
  saveData();
  alert(`Kartu ujian untuk ${student.name} berhasil ${student.examCardGiven ? 'diberikan' : 'dibatalkan'}!`);
}

function renderKesiswaanTab() {
  const tbody = document.getElementById("kesiswaan-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  const searchValue = (document.getElementById("kesiswaan-search-input")?.value || "").toLowerCase().trim();
  const classFilter = appState.kesiswaanClassFilter || "all";
  const statusFilter = document.getElementById("kesiswaan-status-filter")?.value || "all";

  // Calculate statistics
  let totalCount = appState.students.length;
  let completeCount = 0;
  let cardsGivenCount = 0;
  let pendingCardsCount = 0;

  appState.students.forEach(s => {
    const details = getOverallStudentCompleteness(s);
    if (details.isAllComplete) {
      completeCount++;
      if (s.examCardGiven) {
        cardsGivenCount++;
      } else {
        pendingCardsCount++;
      }
    } else {
      if (s.examCardGiven) {
        cardsGivenCount++;
      }
    }
  });

  // Update statistics on widgets
  const elTotal = document.getElementById("kesiswaan-stat-total");
  const elComplete = document.getElementById("kesiswaan-stat-complete");
  const elCardsGiven = document.getElementById("kesiswaan-stat-cards-given");
  const elCardsPending = document.getElementById("kesiswaan-stat-cards-pending");

  if (elTotal) elTotal.innerText = totalCount;
  if (elComplete) elComplete.innerText = completeCount;
  if (elCardsGiven) elCardsGiven.innerText = cardsGivenCount;
  if (elCardsPending) elCardsPending.innerText = pendingCardsCount;

  // Filter students
  const filtered = appState.students.filter(student => {
    // Search filter
    const matchesSearch = (student.name || "").toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;

    // Class filter
    if (classFilter !== "all" && student.class !== classFilter) return false;

    // Status filter
    const details = getOverallStudentCompleteness(student);
    if (statusFilter === "hijau" && !details.isAllComplete) return false;
    if (statusFilter === "belum" && details.isAllComplete) return false;
    if (statusFilter === "kartu" && !student.examCardGiven) return false;
    if (statusFilter === "belum-kartu" && (!details.isAllComplete || student.examCardGiven)) return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty-state" style="padding:3rem 1.5rem; text-align:center;">
          <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.5rem; line-height: 1; display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-rounded" style="font-size: 3.2rem; font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48; color: var(--danger);">error</span>
          </div>
          <h3 style="margin-bottom: 0.4rem; color: var(--text-primary); font-family: var(--font-heading); font-size: 1.05rem;">Data Tidak Tersedia</h3>
          <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto 1.15rem auto; font-size: 0.75rem; line-height: 1.5;">
            Siswa dengan kata kunci pencarian atau filter tersebut tidak terdaftar di sistem.
          </p>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(student => {
    const avatarContent = student.absentNo !== undefined && student.absentNo !== "-" ? student.absentNo : "-";
    const details = getOverallStudentCompleteness(student);
    const hasCard = !!student.examCardGiven;

    const tr = document.createElement("tr");
    tr.style.cursor = "default";
    tr.className = "clickable-student-row";

    const compRatio = `${details.completed}/${details.total} Mapel`;
    const compPct = `${details.percentage}% Selesai`;

    const completionBadgeHTML = details.isAllComplete 
      ? `<span class="status-badge complete" style="box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);">🟢 Tugas Hijau (100%)</span>`
      : `<span class="status-badge incomplete">🔴 Belum Lengkap (${details.percentage}%)</span>`;

    const cardStatusHTML = hasCard
      ? `<span class="status-badge complete" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.3); font-weight: 700;">🎫 Kartu Diberikan</span>`
      : `<span class="status-badge warning" style="background: rgba(245, 158, 11, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2);">❌ Belum Ada Kartu</span>`;

    let actionBtnHTML = "";
    if (details.isAllComplete) {
      if (hasCard) {
        actionBtnHTML = `
          <button class="action-btn secondary-btn" onclick="toggleExamCard('${student.id}')" style="font-size:0.75rem; padding: 0.35rem 0.85rem;">
            🔙 Tarik Kartu
          </button>
        `;
      } else {
        actionBtnHTML = `
          <button class="action-btn" onclick="toggleExamCard('${student.id}')" style="font-size:0.75rem; padding: 0.35rem 0.85rem; background: var(--success-grad);">
            🎫 Berikan Kartu
          </button>
        `;
      }
    } else {
      actionBtnHTML = `
        <button class="action-btn secondary-btn" style="font-size:0.75rem; padding: 0.35rem 0.85rem; cursor: not-allowed; opacity: 0.5;" disabled title="Tugas belum selesai">
          🔒 Belum Siap
        </button>
      `;
    }
    let deleteBtnHTML = "";

    const absenNo = student.absentNo !== undefined && student.absentNo !== "-" ? student.absentNo : "-";
    const genderDisplay = student.gender === "L" ? `<span style="color: #60a5fa; font-weight: 700; font-size: 0.78rem; margin-left: 0.35rem;" title="Laki-laki">♂</span>` : (student.gender === "P" ? `<span style="color: #f472b6; font-weight: 700; font-size: 0.78rem; margin-left: 0.35rem;" title="Perempuan">♀</span>` : "");

    tr.innerHTML = `
      <td class="text-center" style="width: 50px; padding: 0.5rem;">
        <span style="display:inline-flex; align-items:center; justify-content:center; min-width:28px; height:28px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:6px; font-size:0.72rem; font-weight:800; color:var(--primary); font-family:var(--font-heading);">${absenNo}</span>
      </td>
      <td style="padding-left: 1rem;">
        <div class="table-student-cell">
          <div>
            <div class="table-student-name" style="font-weight: 700; color: var(--text-primary);">${escapeHTML(student.name)}${genderDisplay}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">ID: ${student.id}</div>
          </div>
        </div>
      </td>
      <td class="text-center" style="font-weight: 700;">
        <span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">${student.class || 'X-A'}</span>
      </td>
      <td>
        <div class="text-center">
          <div style="margin-bottom: 2px;">${completionBadgeHTML}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${compRatio} | ${compPct}</div>
        </div>
      </td>
      <td class="text-center">
        ${cardStatusHTML}
      </td>
      <td class="text-center" style="white-space: nowrap;">
        ${actionBtnHTML}${deleteBtnHTML}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- COMPLETENESS REVISIONAL SYSTEM ---
function isStudentSubjectComplete(student, subjectId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return false;

  const sGrades = student.grades[subjectId] || { chapters: {} };
  const chapters = subject.chapters || [];
  let hasReleasedWork = false;
  let allReleasedComplete = true;

  chapters.forEach(ch => {
    const chTasks = ch.tasks || [];
    const sChGrades = sGrades.chapters && sGrades.chapters[ch.name] ? sGrades.chapters[ch.name] : {};
    const sTasks = sChGrades.tasks || {};

    chTasks.forEach(t => {
      const dirKey = `${ch.name}_${t}`;
      const tDir = subject.tasksDirectory?.[dirKey];
      if (!isDirectoryTaskReleased(tDir, student.class)) return;
      hasReleasedWork = true;
      if (isScoreLacking(sTasks[t], subject.kkm)) allReleasedComplete = false;
    });

    const ulDirKey = `${ch.name}_Ulangan`;
    const ulDir = subject.tasksDirectory?.[ulDirKey];
    if (isDirectoryTaskReleased(ulDir, student.class)) {
      hasReleasedWork = true;
      if (isScoreLacking(sChGrades.ulangan, subject.kkm)) allReleasedComplete = false;
    }
  });

  return !hasReleasedWork || allReleasedComplete;
}

// --- TABS RENDERING FOR CLASSES ---
function renderClassTabs() {
  // 1. Sidebar Class Tabs (Primary render target)
  const sidebarTabsContainer = document.getElementById("sidebar-class-tabs");
  const allClassContainer = document.getElementById("sidebar-semua-kelas-container");
  const sidebarClassSection = document.getElementById("sidebar-class-section");
  
  if (allClassContainer) {
    allClassContainer.innerHTML = "";
    const btnAll = document.createElement("button");
    btnAll.className = "sidebar-class-btn" + (appState.teacherClassFilter === "all" ? " active" : "");
    btnAll.innerHTML = `<span class="class-label-text">Semua</span>`;
    btnAll.title = "Semua Kelas";
    btnAll.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      appState.teacherClassFilter = "all";
      renderClassTabs();
      renderStudentTable();
    };
    allClassContainer.appendChild(btnAll);
  }
  
  if (sidebarTabsContainer) {
    sidebarTabsContainer.innerHTML = "";
    
    // Dynamic Classes sorted ascending (8C at top, 8G at bottom)
    const activeClasses = getActiveClassesTaughtByTeachers();
    activeClasses.sort().forEach(c => {
      const btn = document.createElement("button");
      btn.className = "sidebar-class-btn" + (appState.teacherClassFilter === c ? " active" : "");
      btn.innerHTML = `<span class="class-label-text">${c}</span>`;
      btn.title = c;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        appState.teacherClassFilter = c;
        renderClassTabs();
        renderStudentTable();
      };
      sidebarTabsContainer.appendChild(btn);
    });
  }

  // Show/hide sidebar class section based on current view (always hide to prevent redundancy)
  if (sidebarClassSection) {
    sidebarClassSection.style.display = "none";
  }

  // 2. Render teacher-class-tabs container (visible on mobile, hidden on desktop)
  const teacherTabsContainer = document.getElementById("teacher-class-tabs");
  if (teacherTabsContainer) {
    teacherTabsContainer.innerHTML = "";
    
    // Add "Semua" button
    const btnAll = document.createElement("button");
    btnAll.className = "action-btn" + (appState.teacherClassFilter === "all" ? "" : " secondary-btn");
    btnAll.style.fontSize = "0.75rem";
    btnAll.style.padding = "0.3rem 0.75rem";
    btnAll.innerText = "Semua";
    btnAll.onclick = (e) => {
      e.preventDefault();
      appState.teacherClassFilter = "all";
      renderClassTabs();
      renderStudentTable();
    };
    teacherTabsContainer.appendChild(btnAll);
    
    // Add class buttons
    const activeClasses = getActiveClassesTaughtByTeachers();
    const sortedClasses = [...activeClasses].sort();
    sortedClasses.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "action-btn" + (appState.teacherClassFilter === c ? "" : " secondary-btn");
      btn.style.fontSize = "0.75rem";
      btn.style.padding = "0.3rem 0.75rem";
      btn.innerText = c;
      btn.onclick = (e) => {
        e.preventDefault();
        appState.teacherClassFilter = c;
        renderClassTabs();
        renderStudentTable();
      };
      teacherTabsContainer.appendChild(btn);
    });
  }

  // 3. Kesiswaan Class Tabs (unchanged)
  const kesiswaanTabsContainer = document.getElementById("kesiswaan-class-tabs");
  if (kesiswaanTabsContainer) {
    kesiswaanTabsContainer.innerHTML = "";
    
    const currentFilter = appState.kesiswaanClassFilter || "all";

    // Dynamic Classes
    const activeClasses = getActiveClassesTaughtByTeachers();
    activeClasses.sort().forEach(c => {
      const btn = document.createElement("button");
      btn.className = currentFilter === c ? "action-btn" : "action-btn secondary-btn";
      btn.style.fontSize = "0.78rem";
      btn.style.padding = "0.35rem 0.85rem";
      btn.innerText = c;
      btn.onclick = (e) => {
        e.preventDefault();
        appState.kesiswaanClassFilter = c;
        renderClassTabs();
        renderKesiswaanTab();
      };
      kesiswaanTabsContainer.appendChild(btn);
    });

    // Add "Semua Kelas" tab on the far right
    const btnAll = document.createElement("button");
    btnAll.className = currentFilter === "all" ? "action-btn" : "action-btn secondary-btn";
    btnAll.style.fontSize = "0.78rem";
    btnAll.style.padding = "0.35rem 0.85rem";
    btnAll.innerText = "Semua Kelas";
    btnAll.onclick = (e) => {
      e.preventDefault();
      appState.kesiswaanClassFilter = "all";
      renderClassTabs();
      renderKesiswaanTab();
    };
    kesiswaanTabsContainer.appendChild(btnAll);
  }
}

// --- KESISWAAN ADMINISTRATION INPUTS ---
function populateKesiswaanStudentClassSelect() {
  const select = document.getElementById("kesiswaan-student-class-select");
  if (!select) return;

  const activeClasses = getActiveClassesTaughtByTeachers();
  select.innerHTML = '<option value="">-- Kelas --</option>';
  
  activeClasses.sort().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.innerText = c;
    select.appendChild(opt);
  });
}

function kesiswaanAddTeacher() {
  if (appState.activeTeacherId !== "t-2") {
    alert("ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd yang memiliki wewenang untuk mendaftarkan guru baru!");
    return;
  }

  const nameInput = document.getElementById("kesiswaan-teacher-name");
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) {
    alert("Harap masukkan nama guru!");
    return;
  }

  const isExist = appState.teachers.some(t => t.name.toLowerCase() === name.toLowerCase());
  if (isExist) {
    alert("Guru dengan nama tersebut sudah terdaftar!");
    return;
  }

  const newTeacher = {
    id: "tech-" + Date.now(),
    name: formatTeacherNameTitleCase(name)
  };

  appState.teachers.push(newTeacher);
  saveData();
  nameInput.value = "";
  alert(`Guru "${name}" berhasil didaftarkan!`);
}

function kesiswaanAddClass() {
  if (appState.activeTeacherId !== "t-2") {
    alert("ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd yang memiliki wewenang untuk mendaftarkan kelas baru!");
    return;
  }

  const classInput = document.getElementById("kesiswaan-class-name");
  if (!classInput) return;
  const className = classInput.value.trim().toUpperCase();
  if (!className) {
    alert("Harap masukkan nama kelas!");
    return;
  }

  if (!appState.classes) {
    appState.classes = [];
  }

  if (appState.classes.includes(className)) {
    alert("Kelas tersebut sudah terdaftar!");
    return;
  }

  appState.classes.push(className);
  saveData({ silent: true });
  
  // Refresh UI drop boxes & class tabs
  populateKesiswaanStudentClassSelect();
  renderClassTabs();
  
  classInput.value = "";
  alert(`Kelas "${className}" berhasil didaftarkan!`);
}

function kesiswaanAddStudent() {
  if (appState.activeTeacherId !== "t-2") {
    alert("ÃƒÂ¢Ã¢â‚¬ÂºÃ¢â‚¬Â Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd yang memiliki wewenang untuk mendaftarkan siswa baru!");
    return;
  }

  const nameInput = document.getElementById("kesiswaan-student-name");
  const classSelect = document.getElementById("kesiswaan-student-class-select");
  if (!nameInput || !classSelect) return;

  const name = nameInput.value.trim().toUpperCase();
  const studentClass = classSelect.value;

  const absentVal = document.getElementById("kesiswaan-student-absent").value.trim();
  const absentNo = absentVal ? parseInt(absentVal, 10) : "-";
  const gender = document.getElementById("kesiswaan-student-gender").value || "L";

  if (!name || !studentClass) {
    alert("Harap isi nama siswa dan pilih kelas!");
    return;
  }

  const isNameTaken = appState.students.some(s => (s.name || "").toLowerCase() === name.toLowerCase());
  if (isNameTaken) {
    alert("Nama siswa ini sudah ada di database!");
    return;
  }

  const { grades, completeness } = buildEmptyStudentGrades();

  const newStudent = {
    id: "stud-" + Date.now(),
    name: name,
    class: studentClass,
    absentNo: absentNo,
    gender: gender,
    grades,
    completeness,
    examCardGiven: false
  };

  appState.students.push(newStudent);
  saveData();

  // Refresh lookups & tables
  populateClassSelect();
  populateTeacherClassFilter();
  renderClassTabs();

  nameInput.value = "";
  document.getElementById("kesiswaan-student-absent").value = "";
  document.getElementById("kesiswaan-student-gender").value = "L";
  alert(`Siswa "${name}" (${studentClass}) berhasil didaftarkan!`);
}

// Bulk Add Students function
function bulkAddStudents(bulkText, defaultClass) {
  if (!bulkText.trim()) {
    alert("Harap masukkan daftar nama siswa!");
    return;
  }

  const lines = bulkText.split("\n");
  let addedCount = 0;
  let skippedCount = 0;

  lines.forEach((line, idx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return; // skip empty lines

    let name = cleanLine;
    let studentClass = defaultClass || "8C";
    let absentNo = "-";
    let gender = "-";

    // Split by comma and parse smart CSV
    if (cleanLine.includes(",")) {
      const parts = cleanLine.split(",");
      
      const p1 = parts[0].trim();
      const isFirstItemNumber = /^\d+$/.test(p1);

      if (isFirstItemNumber) {
        absentNo = parseInt(p1, 10);
        name = parts[1] ? parts[1].trim() : "";
        
        // Gender can be parts[2]
        const p3 = parts[2] ? parts[2].trim().toUpperCase() : "";
        if (p3 === "L" || p3 === "P" || p3 === "LAKI-LAKI" || p3 === "PEREMPUAN") {
          gender = p3[0];
        }
        
        // Class can be parts[3]
        const p4 = parts[3] ? parts[3].trim().toUpperCase() : "";
        if (p4) {
          studentClass = p4;
        }
      } else {
        name = p1;
        
        const p2 = parts[1] ? parts[1].trim().toUpperCase() : "";
        if (p2 === "L" || p2 === "P" || p2 === "LAKI-LAKI" || p2 === "PEREMPUAN") {
          gender = p2[0];
          
          const p3 = parts[2] ? parts[2].trim().toUpperCase() : "";
          if (p3) {
            studentClass = p3;
          }
        } else {
          // p2 is likely class
          if (p2) {
            studentClass = p2;
          }
          
          const p3 = parts[2] ? parts[2].trim().toUpperCase() : "";
          if (p3 === "L" || p3 === "P" || p3 === "LAKI-LAKI" || p3 === "PEREMPUAN") {
            gender = p3[0];
          }
        }
      }
    }

    if (!name) return;

    // Check duplicate
    const isNameTaken = appState.students.some(s => (s.name || "").toLowerCase() === name.toLowerCase());
    if (isNameTaken) {
      skippedCount++;
      return;
    }

    const { grades, completeness } = buildEmptyStudentGrades();

    const newStudent = {
      id: "stud-" + (Date.now() + idx),
      name: name,
      class: studentClass,
      absentNo: absentNo,
      gender: gender,
      grades,
      completeness,
      examCardGiven: false
    };

    appState.students.push(newStudent);
    addedCount++;
  });

  if (addedCount > 0) {
    saveData();
    populateClassSelect();
    populateTeacherClassFilter();
    renderClassTabs();
    if (appState.currentView === "guru") {
      renderStudentTable();
      updateTeacherStats();
      renderIncompleteStudentsList();
      if (appState.teacherActiveTab === "kesiswaan") {
        renderKesiswaanTab();
      }
    }
  }
  alert(`Pendaftaran massal selesai!\nBerhasil terdaftar: ${addedCount} siswa\nLewat (sudah terdaftar): ${skippedCount} siswa`);
}

// Helper function to generate realistic grades
// =========================================================
// CSV STUDENT IMPORT / EXPORT SYSTEM
// =========================================================

/**
 * Download a unified student template CSV for ALL classes (A-G) of a single tingkat.
 * The CSV layout has all 7 classes side-by-side in horizontal columns.
 * Format: Kelas A,,, Kelas B,,, ... (header row)
 *         No, Nama, L/P, (blank), No, Nama, L/P, (blank), ... (column header row)
 *         1,,, 1,,, ... (data rows 1-40)
 */
function downloadStudentTemplateCsv() {
  const defaultClasses = ["7A", "7B", "7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C", "8D", "8E", "8F", "8G", "9A", "9B", "9C", "9D", "9E", "9F", "9G"];
  const classList = appState.classes && appState.classes.length > 0 ? appState.classes : defaultClasses;
  const maxRows = 40;

  // Build CSV content
  // Row 1: Kelas headers
  const headerRow = classList.map(c => `Kelas ${c}`).join(",,,,");
  // Row 2: Column sub-headers
  const subHeaderRow = classList.map(() => "No,Nama,L/P").join(",,");

  const dataRows = [];
  for (let i = 1; i <= maxRows; i++) {
    const rowCells = classList.map(() => `${i},,`).join(",,");
    dataRows.push(rowCells);
  }

  const csvContent = "\uFEFF" + [headerRow, subHeaderRow, ...dataRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `template_siswa_semua_kelas.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showCsvFeedback(`✅ Template untuk semua kelas berhasil diunduh!`, "success");
}

/**
 * Parse the uploaded CSV file and import students for the chosen class.
 * Replaces ALL existing students in that class.
 */
function normalizeBrowserClassName(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^[789][A-G]$/i.test(trimmed)) return trimmed.toUpperCase();
  const kelasMatch = trimmed.match(/^kelas\s*([789][A-G])$/i);
  if (kelasMatch) return kelasMatch[1].toUpperCase();
  return trimmed.toUpperCase();
}

function fixMalformedCsvRow(line) {
  return line.replace(/(\d),,,,(\d),([A-Za-z])/g, '$1,$3');
}

function uploadStudentCsv(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return;

    const firstLine = lines[0].trim();
    const delimiter = firstLine.includes(";") ? ";" : ",";
    
    // Check if it's the unified template format (first line has "Kelas ")
    const firstCols = firstLine.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ""));
    const isUnifiedTemplate = firstCols.some(c => c.toLowerCase().startsWith("kelas "));

    const parsed = [];
    const classesFound = new Set();

    if (isUnifiedTemplate) {
      const classHeaders = [];
      for (let c = 0; c < firstCols.length; c++) {
        const colText = firstCols[c].toLowerCase();
        if (colText.startsWith("kelas ")) {
          const rawName = firstCols[c].substring(6).trim();
          classHeaders.push({ name: normalizeBrowserClassName(rawName), startCol: c });
        }
      }

      const startIdx = firstLine.toLowerCase().startsWith("sep=") ? 3 : 2;
      for (let i = startIdx; i < lines.length; i++) {
        const line = fixMalformedCsvRow(lines[i].trim());
        if (!line) continue;
        const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ""));

        for (const ch of classHeaders) {
          const rawNo = cols[ch.startCol];
          const absen = parseInt(rawNo, 10) || (parsed.filter(p => p.kelas === ch.name).length + 1);
          const nama = (cols[ch.startCol + 1] || "").trim().toUpperCase();
          const jkRaw = (cols[ch.startCol + 2] || "L").trim().toUpperCase();
          const jk = (jkRaw === "P" || jkRaw === "PEREMPUAN" || jkRaw === "FEMALE") ? "P" : "L";

          if (nama) {
            parsed.push({ absen, nama, jk, kelas: ch.name });
            classesFound.add(ch.name);
          }
        }
      }
    } else {
      // STANDARD 4-COLUMN PARSING (No, Nama, L/P, Kelas)
      let headerLine = firstLine;
      let startIdx = 0;
      if (firstLine.startsWith("sep=")) {
         headerLine = lines[1].trim();
         startIdx = 2;
      } else {
         const cols = firstLine.split(delimiter).map(c => c.trim().replace(/^"|"$/g, "").toLowerCase());
         if (cols.some(c => c.includes("nama") || c.includes("kelas"))) {
           startIdx = 1;
         } else {
           headerLine = "no,nama,l/p,kelas"; // Fallback assumptions if no headers
         }
      }

      const headers = headerLine.split(delimiter).map(c => c.trim().replace(/^"|"$/g, "").toLowerCase());
      
      let colNama = -1, colKelas = -1, colJk = -1, colNo = -1;
      headers.forEach((h, idx) => {
         if (h.includes("nama") || h.includes("name") || h.includes("siswa")) colNama = idx;
         else if (h.includes("kelas") || h.includes("rombel")) colKelas = idx;
         else if (h === "l/p" || h.includes("gender") || h.includes("jk")) colJk = idx;
         else if (h.includes("no") || h.includes("absen")) colNo = idx;
      });

      if (colNama === -1) colNama = 1;
      if (colKelas === -1) colKelas = 3;
      if (colJk === -1) colJk = 2;
      if (colNo === -1) colNo = 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = fixMalformedCsvRow(lines[i].trim());
        if (!line) continue;
        const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ""));
        const nama = (cols[colNama] || "").trim().toUpperCase();
        if (!nama) continue;
        
        let kelas = normalizeBrowserClassName(cols[colKelas] || "");
        if (!kelas) kelas = "UNASSIGNED";

        const jkRaw = (cols[colJk] || "L").trim().toUpperCase();
        const jk = (jkRaw === "P" || jkRaw === "PEREMPUAN" || jkRaw === "FEMALE") ? "P" : "L";
        const absen = parseInt(cols[colNo], 10) || (parsed.filter(p => p.kelas === kelas).length + 1);

        parsed.push({ absen, nama, jk, kelas });
        classesFound.add(kelas);
      }
    }

    if (parsed.length === 0) {
      showCsvFeedback("❌ Tidak ada data siswa yang valid di file CSV. Pastikan kolom Nama terisi!", "error");
      event.target.value = "";
      return;
    }

    // Process classes: register new classes
    classesFound.forEach(k => {
      if (!appState.classes.includes(k)) {
        appState.classes.push(k);
      }
    });
    appState.classes.sort();

    // Remove all existing students for the classes that are present in the CSV
    appState.students = appState.students.filter(st => !classesFound.has(st.class));

    // Add imported students
    parsed.forEach(st => {
      const { grades, completeness } = buildEmptyStudentGrades();
      appState.students.push({
        id: "stud-csv-" + st.kelas.toLowerCase() + "-" + st.absen + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
        name: st.nama,
        class: st.kelas,
        absentNo: st.absen,
        gender: st.jk,
        grades,
        completeness,
        examCardGiven: false
      });
    });

    saveData();
    populateClassSelect();

    // Set active class filter to the first imported class
    const firstImportedClass = Array.from(classesFound)[0];
    appState.teacherClassFilter = firstImportedClass;
    appState.kesiswaanClassFilter = firstImportedClass;

    if (appState.currentView === "guru") {
      populateTeacherClassFilter();
      updateTeacherStats();
      renderStudentTable();
      renderIncompleteStudentsList();
    }

    const classNamesStr = Array.from(classesFound).join(", ");
    showCsvFeedback(
      `✅ Berhasil mengimpor <strong>${parsed.length} siswa</strong> ke kelas <strong>${classNamesStr}</strong>!`,
      "success"
    );
    event.target.value = ""; // reset file input
  };

  reader.onerror = function() {
    showCsvFeedback("❌ Gagal membaca file. Pastikan file berformat CSV yang valid.", "error");
    event.target.value = "";
  };

  reader.readAsText(file, "UTF-8");
}

function showCsvFeedback(message, type) {
  const el = document.getElementById("csv-import-feedback");
  if (!el) return;
  el.innerHTML = message;
  el.className = "csv-feedback " + (type === "success" ? "csv-feedback-success" : "csv-feedback-error");
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 6000);
}
// Delete All Students function
function deleteAllStudents() {
  if (appState.activeTeacherId !== "t-2") {
    alert("Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd (Administrator) yang memiliki wewenang untuk menghapus seluruh data siswa!");
    return;
  }

  const userInput = prompt("🚨 PERINGATAN Keras!\n\nApakah Anda yakin ingin menghapus SELURUH data siswa di database? Tindakan ini akan menghapus semua nilai, pengerjaan tugas, lembar jawaban CBT, dan status kelengkapan secara permanen!\n\nKetik \"HAPUS\" (tanpa tanda kutip) pada kolom di bawah ini untuk mengonfirmasi:");

  if (userInput === "HAPUS") {
    appState.students = [];
    saveData();

    // Reset some states V6
    appState.selectedStudentId = null;
    closeTeacherRightPane();

    // Refresh lookups & tables
    populateClassSelect();
    populateTeacherClassFilter();
    renderClassTabs();
    
    if (appState.currentView === "guru") {
      renderStudentTable();
      updateTeacherStats();
      renderIncompleteStudentsList();
      if (appState.teacherActiveTab === "kesiswaan") {
        renderKesiswaanTab();
      }
    } else {
      // If we are in student view, reset view to empty search
      const placeholderArea = document.getElementById("student-placeholder-area");
      const resultsArea = document.getElementById("student-results-area");
      const searchInput = document.getElementById("student-search-input");
      if (searchInput) searchInput.value = "";
      if (placeholderArea) {
        placeholderArea.classList.remove("d-none");
        placeholderArea.innerHTML = `
          <div class="clean-placeholder-tip">
            <span class="material-symbols-rounded" style="font-size: 16px; color: var(--text-muted);">info</span>
            <span>Silakan pilih kelas dan nama Anda di atas.</span>
          </div>
        `;
      }
      if (resultsArea) resultsArea.classList.add("d-none");
    }

    alert("Seluruh data siswa berhasil dibersihkan dari database!");
  }
}

// Delete Class from Config function
function deleteClassFromConfig() {
  if (appState.activeTeacherId !== "t-2") {
    alert("Akses Ditolak!\nHanya Bpk. WAHYUDHA TRI SETIYOAJI, M.Pd (Administrator) yang memiliki wewenang untuk menghapus kelas!");
    return;
  }

  const selectEl = document.getElementById("config-delete-class-select");
  if (!selectEl) return;

  const classToDelete = selectEl.value;
  if (!classToDelete) {
    alert("Silakan pilih salah satu kelas terlebih dahulu dari daftar!");
    return;
  }

  const confirmMsg = `ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â PERINGATAN Keras!

Apakah Anda yakin ingin menghapus kelas "${classToDelete}" beserta SELURUH data siswa di dalamnya secara permanen?
Tindakan ini tidak dapat dibatalkan!

Ketik "HAPUS KELAS" (tanpa tanda kutip) pada kolom di bawah ini untuk mengonfirmasi:`;

  const userInput = prompt(confirmMsg);
  if (userInput === "HAPUS KELAS") {
    // Remove students in that class
    appState.students = appState.students.filter(s => s.class !== classToDelete);

    // Remove the class itself from classes list
    appState.classes = appState.classes.filter(c => c !== classToDelete);

    // Reset filters if the deleted class was active
    if (appState.teacherClassFilter === classToDelete) {
      appState.teacherClassFilter = "all";
    }
    if (appState.kesiswaanClassFilter === classToDelete) {
      appState.kesiswaanClassFilter = "all";
    }
    appState.selectedStudentId = null;
    closeTeacherRightPane();
    
    // Save to localStorage
    saveData();

    // Refresh UI
    populateClassSelect();
    populateTeacherClassFilter();
    renderClassTabs();

    if (appState.currentView === "guru") {
      renderStudentTable();
      updateTeacherStats();
      renderIncompleteStudentsList();
      if (appState.teacherActiveTab === "kesiswaan") {
        renderKesiswaanTab();
      }
    }

    alert(`Kelas "${classToDelete}" dan seluruh data siswa di dalamnya berhasil dihapus dari database!`);
  }
}

// --- HELPER STRINGS SCAPING ---
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function escapeJSAttr(str) {
  if (typeof str !== 'string') return str || '';
  return escapeHTML(str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"'));
}

// --- INCOMPLETE STUDENTS LIST RENDERING ---
function renderIncompleteStudentsList() {
  const container = document.getElementById("incomplete-students-list");
  if (!container) return;

  container.innerHTML = "";

  const assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  const isWali = appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2";
  const subjectsToScan = isWali ? appState.subjects : assignedSubjects;

  if (subjectsToScan.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); font-style: italic; font-size: 0.8rem; padding: 0.5rem; text-align: center;">
        Belum mengampu mata pelajaran.
      </div>
    `;
    return;
  }

  const incompleteList = [];

  appState.students.forEach(student => {
    let incompleteCount = 0;
    
    subjectsToScan.forEach(sub => {
      if (!isSubjectValidForStudentClass(sub.name, student.class)) return;
      const scoreInfo = calculateStudentSubjectScore(student, sub.id);
      scoreInfo.chapters.forEach(ch => {
        ch.tasks.forEach(t => {
          const dirKey = `${ch.name}_${t.name}`;
          const tDir = sub.tasksDirectory?.[dirKey];
          if (!isDirectoryTaskReleased(tDir, student.class)) return;
          if (isScoreLacking(t.score, scoreInfo.kkm)) incompleteCount++;
        });
        const ulDirKey = `${ch.name}_Ulangan`;
        const ulDir = sub.tasksDirectory?.[ulDirKey];
        if (isDirectoryTaskReleased(ulDir, student.class) && isScoreLacking(ch.ulangan, scoreInfo.kkm)) {
          incompleteCount++;
        }
      });
    });

    if (incompleteCount > 0) {
      incompleteList.push({
        id: student.id,
        name: student.name,
        class: student.class,
        incompleteCount: incompleteCount
      });
    }
  });

  if (incompleteList.length === 0) {
    container.innerHTML = `
      <div style="color: var(--success); font-style: italic; font-size: 0.8rem; padding: 0.5rem; text-align: center; font-weight: 600;">
        ✔ Semua siswa sudah menyelesaikan seluruh tugas!
      </div>
    `;
    return;
  }

  // Sort by highest incomplete count first
  incompleteList.sort((a, b) => b.incompleteCount - a.incompleteCount);

  incompleteList.forEach(item => {
    const div = document.createElement("div");
    div.className = "incomplete-student-item";
    div.style.cursor = "pointer";
    div.setAttribute("onclick", `selectTeacherStudent('${item.id}')`);
    div.innerHTML = `
      <span class="incomplete-name" style="color: var(--text-primary); font-weight: 600;">${escapeHTML(item.name)} <span style="font-size:0.7rem; background:var(--surface-1); padding:2px 6px; border-radius:4px; margin-left:4px; border:1px solid var(--border);">${escapeHTML(item.class || '8C')}</span></span>
      <span class="incomplete-tasks-count">${item.incompleteCount} Tugas Belum</span>
    `;
    container.appendChild(div);
  });
}

// --- ==============================================
//     V16 STATS CLICKS EVENT HANDLERS & GRAPHICAL RENDERERS
//     ============================================== ---

function openCompletenessAuditModal() {
  const modal = document.getElementById("completeness-audit-modal");
  if (!modal) return;
  modal.classList.add("active");
  renderCompletenessAuditDirectory();
  
  // Reset details pane to default
  const placeholder = document.getElementById("audit-detail-placeholder");
  const content = document.getElementById("audit-detail-content");
  if (placeholder) placeholder.style.display = "flex";
  if (content) content.style.display = "none";
}

function closeCompletenessAuditModal() {
  const modal = document.getElementById("completeness-audit-modal");
  if (modal) modal.classList.remove("active");
}

function openAveragesAnalyticsModal() {
  const modal = document.getElementById("averages-analytics-modal");
  if (!modal) return;
  modal.classList.add("active");
  renderAveragesAnalyticsCharts();
}

function closeAveragesAnalyticsModal() {
  const modal = document.getElementById("averages-analytics-modal");
  if (modal) modal.classList.remove("active");
}

function renderCompletenessAuditDirectory() {
  const container = document.getElementById("audit-class-groups-container");
  if (!container) return;
  container.innerHTML = "";

  const classes = sortClassNames([...(appState.classes || [])]);

  classes.forEach(cls => {
    const subject = getReportSubjectForClass(cls);
    if (!subject) return;
    const subjectId = subject.id;

    const classStudents = appState.students.filter(s => s.class === cls);
    if (classStudents.length === 0) return;

    const incompleteStudents = classStudents.filter(student => {
      return student.completeness[subjectId] !== true;
    });

    const isClassComplete = incompleteStudents.length === 0;

    const groupDiv = document.createElement("div");
    groupDiv.className = "audit-class-group";

    let headerHTML = "";
    if (isClassComplete) {
      headerHTML = `
        <div class="audit-class-header complete">
          <span>Kelas ${escapeHTML(cls)} · ${escapeHTML(subject.name)}</span>
          <span class="audit-student-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3);">100% Tuntas</span>
        </div>
      `;
    } else {
      headerHTML = `
        <div class="audit-class-header">
          <span>Kelas ${escapeHTML(cls)} · ${escapeHTML(subject.name)}</span>
          <span class="audit-student-badge" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25);">${incompleteStudents.length} Belum Lengkap</span>
        </div>
      `;
    }

    let listHTML = "";
    if (!isClassComplete) {
      incompleteStudents.forEach(student => {
        // Calculate missing tasks count
        const scoreInfo = calculateStudentSubjectScore(student, subjectId);
        let missingCount = 0;
        scoreInfo.chapters.forEach(ch => {
          ch.tasks.forEach(t => {
            const dirKey = `${ch.name}_${t.name}`;
            const tDir = subject.tasksDirectory?.[dirKey];
            if (!isDirectoryTaskReleased(tDir, student.class)) return;
            if (isScoreLacking(t.score, scoreInfo.kkm)) missingCount++;
          });
          const ulDirKey = `${ch.name}_Ulangan`;
          const ulDir = subject.tasksDirectory?.[ulDirKey];
          if (isDirectoryTaskReleased(ulDir, student.class) && isScoreLacking(ch.ulangan, scoreInfo.kkm)) {
            missingCount++;
          }
        });

        listHTML += `
          <div class="audit-student-row" id="audit-row-${student.id}" onclick="selectAuditStudent('${student.id}')">
            <span class="audit-student-name">${student.absentNo !== undefined && student.absentNo !== '-' ? student.absentNo + '. ' : ''}${escapeHTML(student.name)}</span>
            <span class="audit-student-badge" style="background: rgba(245, 158, 11, 0.12); color: var(--warning); font-size: 0.65rem;">${missingCount} Tugas Kosong</span>
          </div>
        `;
      });
    } else {
      listHTML = `
        <div style="padding: 0.85rem; text-align: center; color: var(--text-muted); font-size: 0.75rem; font-style: italic;">
          Seluruh siswa di kelas ini telah menyelesaikan tugas secara lengkap.
        </div>
      `;
    }

    groupDiv.innerHTML = `
      ${headerHTML}
      <div class="audit-class-students-list">
        ${listHTML}
      </div>
    `;

    container.appendChild(groupDiv);
  });
}

function selectAuditStudent(studentId) {
  // Highlight selected row in audit list
  document.querySelectorAll(".audit-student-row").forEach(row => {
    row.classList.remove("active");
  });

  const activeRow = document.getElementById(`audit-row-${studentId}`);
  if (activeRow) activeRow.classList.add("active");

  const placeholder = document.getElementById("audit-detail-placeholder");
  const content = document.getElementById("audit-detail-content");
  if (placeholder) placeholder.style.display = "none";
  if (content) content.style.display = "flex";

  const student = appState.students.find(s => s.id === studentId);
  const subject = getReportSubjectForClass(student?.class);
  if (!student || !subject) return;
  const subjectId = subject.id;

  const scoreInfo = calculateStudentSubjectScore(student, subjectId);

  // Render detail checklist on right pane
  let chaptersHTML = "";
  scoreInfo.chapters.forEach(ch => {
    let tasksHTML = "";
    
    ch.tasks.forEach(t => {
      const isLacking = t.score < scoreInfo.kkm;
      const statusIcon = isLacking 
        ? `<span class="material-symbols-rounded" style="font-size: 14px; color: var(--danger);">cancel</span>` 
        : `<span class="material-symbols-rounded" style="font-size: 14px; color: var(--success);">check_circle</span>`;
      const statusColor = isLacking ? "var(--danger)" : "var(--success)";
      const scoreDisplay = isLacking ? `Kosong (di bawah KKM ${scoreInfo.kkm})` : `${t.score}`;
      
      tasksHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.01); border-radius: 4px; border-bottom: 1px dashed rgba(255,255,255,0.03);">
          <span style="display: inline-flex; align-items: center; gap: 0.4rem; color: ${isLacking ? 'var(--text-secondary)' : 'var(--text-primary)'};">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0;">${statusIcon}</span> ${t.name}
          </span>
          <span style="font-weight: 700; color: ${statusColor};">${scoreDisplay}</span>
        </div>
      `;
    });

    
    const isUlLacking = ch.ulangan < scoreInfo.kkm;

    chaptersHTML += `
      <div style="background: var(--surface-0); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.5rem;">
        <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.85rem; color: var(--text-primary); display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.35rem; margin-bottom: 0.25rem;">
          <span style="display: inline-flex; align-items: center; gap: 0.35rem;"><span class="material-symbols-rounded" style="font-size: 16px;">folder_open</span> ${ch.name}</span>
          <span style="font-size: 0.7rem; color: var(--secondary);">KKM: ${scoreInfo.kkm}</span>
        </div>
        
        ${tasksHTML}
        
        <!-- Tugas Akhir dihapus dari struktur bab -->

        <!-- Ulangan Harian -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; padding: 0.35rem 0.5rem; background: var(--bg-secondary); border-radius: 4px;">
          <span style="display: inline-flex; align-items: center; gap: 0.4rem; color: ${isUlLacking ? 'var(--text-secondary)' : 'var(--text-primary)'};">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0;">${isUlLacking ? '<span class="material-symbols-rounded" style="font-size: 14px; color: var(--danger);">cancel</span>' : '<span class="material-symbols-rounded" style="font-size: 14px; color: var(--success);">check_circle</span>'}</span> Ulangan Harian (UH)
          </span>
          <span style="font-weight: 700; color: ${isUlLacking ? 'var(--danger)' : 'var(--success)'};">${isUlLacking ? `Kosong (< KKM)` : ch.ulangan}</span>
        </div>
      </div>
    `;
  });

  content.innerHTML = `
    <!-- Summary Info -->
    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-0); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem;">
      <div>
        <h4 style="font-family: var(--font-heading); font-weight: 800; font-size: 1rem; color: var(--text-primary); margin: 0;">${escapeHTML(student.name)}</h4>
        <span style="font-size: 0.72rem; color: var(--text-secondary);">Kelas ${escapeHTML(student.class || '')} | No. Absen: ${student.absentNo !== undefined ? student.absentNo : '-'}</span>
      </div>
      <button class="action-btn" onclick="jumpToEditStudent('${student.id}', '${student.class}')" style="font-size: 0.75rem; padding: 0.4rem 0.85rem; background: var(--primary-grad); display: inline-flex; align-items: center; gap: 0.25rem;">
        <span class="material-symbols-rounded" style="font-size:14px;">edit_note</span> Buka Detail & Edit
      </button>
    </div>

    <!-- Scrollable Checklist -->
    <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-right: 2px;">
      ${chaptersHTML}
    </div>
  `;
}

function jumpToEditStudent(studentId, classFilter) {
  // 1. Close the completeness audit modal
  closeCompletenessAuditModal();

  // 2. Set active teacher class filter
  appState.teacherClassFilter = classFilter;

  // 3. Force switch tab in teacher view to 'nilai' if it wasn't already
  appState.teacherActiveTab = "nilai";

  // 4. Force render the class tabs & table to match the class filter
  renderClassTabs();
  renderStudentTable();

  // 5. Select the student in teacher view to open the right pane instantly
  selectTeacherStudent(studentId);

  // 6. Smooth scroll to the active highlighted row
  setTimeout(() => {
    const activeRow = document.querySelector(".clickable-student-row.active-teacher-row");
    if (activeRow) {
      activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 150);
}

const ANALYTICS_CLASS_COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

function buildGradeAnalyticsChart(subject, classes) {
  const subjectId = subject.id;
  const chapters = subject.chapters || [];
  if (chapters.length === 0 || classes.length === 0) return '';

  const classColors = {};
  classes.forEach((cls, idx) => {
    classColors[cls] = ANALYTICS_CLASS_COLORS[idx % ANALYTICS_CLASS_COLORS.length];
  });

  const chartData = {};
  classes.forEach((cls) => { chartData[cls] = []; });

  chapters.forEach((ch) => {
    classes.forEach((cls) => {
      const classStudents = appState.students.filter((s) => s.class === cls);
      if (classStudents.length === 0) {
        chartData[cls].push(0);
        return;
      }
      let sumChAvg = 0;
      let count = 0;
      classStudents.forEach((st) => {
        const scoreInfo = calculateStudentSubjectScore(st, subjectId);
        const chDetail = scoreInfo.chapters.find((c) => c.name === ch.name);
        if (chDetail && chDetail.average !== null && chDetail.average !== undefined) {
          sumChAvg += chDetail.average;
          count++;
        }
      });
      chartData[cls].push(count > 0 ? Math.round((sumChAvg / count) * 10) / 10 : 0);
    });
  });

  let highestClass = '';
  let highestAverage = -1;
  const overallAverages = {};
  classes.forEach((cls) => {
    const validScores = chartData[cls].filter((v) => v > 0);
    const avg = validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : 0;
    overallAverages[cls] = avg;
    if (avg > highestAverage) {
      highestAverage = avg;
      highestClass = cls;
    }
  });

  const svgWidth = 600;
  const svgHeight = 320;
  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;
  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;
  const getX = (index) => paddingLeft + (index * (graphWidth / (chapters.length - 1 || 1)));
  const getY = (score) => {
    const s = Math.max(60, Math.min(100, score || 60));
    return paddingTop + graphHeight * (100 - s) / 40;
  };

  let gridLinesHTML = '';
  [60, 70, 80, 90, 100].forEach((score) => {
    const yVal = getY(score);
    const isKKM = score === subject.kkm;
    gridLinesHTML += `<line x1="${paddingLeft}" y1="${yVal}" x2="${svgWidth - paddingRight}" y2="${yVal}" stroke="${isKKM ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0,0,0,0.06)'}" stroke-width="${isKKM ? 1.5 : 1}" ${isKKM ? 'stroke-dasharray="4,4"' : ''} /><text x="${paddingLeft - 10}" y="${yVal + 4}" fill="${isKKM ? '#f87171' : 'var(--text-secondary)'}" font-size="10" text-anchor="end" font-weight="700">${score}${isKKM ? ' (KKM)' : ''}</text>`;
  });

  let xLabelsHTML = '';
  chapters.forEach((ch, idx) => {
    const xVal = getX(idx);
    xLabelsHTML += `<line x1="${xVal}" y1="${paddingTop}" x2="${xVal}" y2="${svgHeight - paddingBottom}" stroke="rgba(0,0,0,0.04)" stroke-width="1" stroke-dasharray="2,2" /><text x="${xVal}" y="${svgHeight - paddingBottom + 22}" fill="var(--text-secondary)" font-size="10.5" text-anchor="middle" font-weight="700">${escapeHTML(ch.name)}</text>`;
  });

  let linesPathsHTML = '';
  let dotsHTML = '';
  classes.forEach((cls) => {
    const color = classColors[cls];
    const points = chartData[cls].map((s, idx) => ({ x: getX(idx), y: getY(s), score: s }));
    if (points.some((p) => p.score > 0)) {
      linesPathsHTML += `<path d="M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    }
    points.forEach((p) => {
      if (p.score <= 0) return;
      dotsHTML += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="var(--bg-card-solid)" stroke="${color}" stroke-width="2.5" /><text x="${p.x}" y="${p.y - 10}" fill="${color}" font-size="8.5" text-anchor="middle" font-weight="800">${p.score}</text>`;
    });
  });

  let tableRowsHTML = '';
  let chapterHeadersHTML = chapters.map((ch) => `<th class="text-center">${escapeHTML(ch.name)}</th>`).join('');
  classes.forEach((cls) => {
    const color = classColors[cls];
    const scoresColsHTML = chartData[cls].map((s) => `<td class="text-center" style="font-weight: 600;">${s || '—'}</td>`).join('');
    tableRowsHTML += `<tr><td style="padding-left: 1rem; font-weight: 700;">${escapeHTML(cls)}${cls === highestClass && highestAverage > 0 ? ' <span style="font-size:0.65rem;color:var(--success);">Unggul</span>' : ''}</td>${scoresColsHTML}<td class="text-center" style="font-weight: 800; color: ${color};">${overallAverages[cls] || '—'}</td></tr>`;
  });

  return `
    <div class="chapter-analytics-card" style="margin-bottom: 1.5rem;">
      <div style="background: var(--surface-0); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border);">
          <div>
            <div style="font-family:var(--font-heading); font-weight:800; font-size:1rem;">${escapeHTML(subject.name)}</div>
            <div style="font-size:0.72rem; color:var(--text-secondary);">Perbandingan rata-rata nilai antar rombel tingkat kelas ${escapeHTML(getGradeFromClassName(classes[0]))}</div>
          </div>
          ${highestAverage > 0 ? `<div style="font-size:0.75rem; font-weight:700; color:var(--success); background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); padding:4px 10px; border-radius:var(--radius-sm);">Unggul: ${escapeHTML(highestClass)} (${highestAverage})</div>` : ''}
        </div>
        <div style="background:var(--bg-primary); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem;">
          <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" style="display:block;">${gridLinesHTML}${xLabelsHTML}${linesPathsHTML}${dotsHTML}</svg>
        </div>
        <div style="margin-top:1rem; border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden;">
          <table class="student-table" style="font-size:0.8rem; width:100%; margin:0;">
            <thead><tr><th style="padding-left:1rem;">Kelas</th>${chapterHeadersHTML}<th class="text-center">Rata-rata</th></tr></thead>
            <tbody>${tableRowsHTML}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAveragesAnalyticsCharts() {
  const container = document.getElementById("averages-charts-container");
  const legend = document.getElementById("averages-charts-legend");
  if (!container) return;
  container.innerHTML = "";
  if (legend) legend.innerHTML = "";

  const allClasses = sortClassNames(getAllAvailableClasses());
  const legendEntries = [];
  let chartsHTML = '';

  ['7', '8', '9'].forEach((grade) => {
    const subject = getSubjectForClassName(`${grade}A`);
    if (!subject) return;

    const gradeClasses = allClasses.filter((c) => c.startsWith(grade));
    const classesWithStudents = gradeClasses.filter((c) =>
      appState.students.some((s) => s.class === c)
    );
    if (classesWithStudents.length === 0) return;

    classesWithStudents.forEach((cls, idx) => {
      const color = ANALYTICS_CLASS_COLORS[idx % ANALYTICS_CLASS_COLORS.length];
      legendEntries.push({ cls, color });
    });

    chartsHTML += buildGradeAnalyticsChart(subject, classesWithStudents);
  });

  if (!chartsHTML) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:2rem 0;">Belum ada data siswa untuk ditampilkan. Impor data siswa terlebih dahulu.</div>`;
    return;
  }

  container.innerHTML = chartsHTML;

  if (legend) {
    legend.innerHTML = legendEntries.map(({ cls, color }) =>
      `<div style="display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; font-weight:600;"><span style="width:12px; height:12px; border-radius:3px; background:${color};"></span>${escapeHTML(cls)}</div>`
    ).join('');
  }
}

// --- JSON BACKUP SYSTEM ---
function exportBackupData() {
  const dataToExport = {
    version: "SiGrade-Backup-V5",
    timestamp: new Date().toISOString(),
    teachers: appState.teachers,
    subjects: appState.subjects,
    students: appState.students,
    classes: appState.classes
  };

  const jsonStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  a.href = url;
  a.download = `sigrade_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importBackupData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      
      // Simple validation to ensure file is a SiGrade backup
      if (!parsed.students || !parsed.subjects || !parsed.teachers) {
        alert("Impor Gagal!\nFile cadangan JSON tidak valid atau struktur data tidak dikenali.");
        return;
      }

      if (confirm(`Apakah Anda yakin ingin memulihkan data dari file cadangan ini?\n\nImpor ini akan menggantikan seluruh data guru, mata pelajaran, siswa, dan semua nilai yang ada saat ini secara permanen!`)) {
        appState.teachers = parsed.teachers;
        appState.subjects = parsed.subjects;
        appState.students = parsed.students;
        if (parsed.classes) {
          appState.classes = parsed.classes;
        }

        normalizeLoadedAppState();
        saveData();
        
        // Refresh everything
        populateClassSelect();
        populateTeacherClassFilter();
        renderClassTabs();
        
        if (appState.currentView === "guru") {
          renderStudentTableHeaders();
          renderStudentTable();
          renderIncompleteStudentsList();
          renderConfigTab();
          if (appState.teacherActiveTab === "kesiswaan") {
            renderKesiswaanTab();
          }
        }
        
        alert("🎉 Pemulihan Data Berhasil!\nSeluruh data dan nilai telah dipulihkan dengan sempurna dari file cadangan.");
      }
    } catch(err) {
      console.error(err);
      alert("🚨 Kesalahan Impor!\nFormat file tidak didukung atau JSON mengalami kerusakan (corrupted).");
    }
  };
  reader.readAsText(file);
  
  // Reset file input so same file can be selected again
  event.target.value = "";
}

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
  syncModeToggleActive(sessionStorage.getItem('sigrade_mode_intent') || 'siswa');
  if (!window.__skipLoadDataOnBoot) {
    loadData();
  }
  populateClassSelect();

  // V6 Class search selectors listeners
  const classSelect = document.getElementById("student-class-select");
  if (classSelect) {
    classSelect.addEventListener("change", handleClassSelectChange);
  }

  const nameSelect = document.getElementById("student-name-select");
  if (nameSelect) {
    nameSelect.addEventListener("change", handleNameSelectChange);
  }

  // Mode toggles (siswa/guru only — not PG/Essay/Buku buttons)
  document.querySelectorAll(".mode-toggle-group .toggle-btn[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const viewName = btn.dataset.view;
      if (viewName === "guru" && appState.currentView === "guru") {
        if (appState.teacherActiveTab !== "dashboard") {
          switchTeacherTab("dashboard");
        } else {
          switchTeacherRole();
        }
      } else {
        switchView(viewName);
      }
    });
  });

  // Close SiGrade nav dropdown when clicking anywhere outside it
  document.addEventListener("click", (e) => {
    const headerTabs = document.getElementById("header-teacher-tabs");
    const logoBtn = document.getElementById("sigrade-logo-btn");
    if (headerTabs && headerTabs.classList.contains("expanded")) {
      if (!headerTabs.contains(e.target) && (!logoBtn || !logoBtn.contains(e.target))) {
        closeSigradeDropdown();
      }
    }
  });

  // Tab switch in teacher view
  document.querySelectorAll(".teacher-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTeacherTab(btn.dataset.tab);
    });
  });

  // Student Search bindings
  const searchBtn = document.getElementById("student-search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", handleStudentSearch);
  }

  const searchInput = document.getElementById("student-search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleStudentSearch();
      }
    });
  }

  // Teacher filters & live searches
  const teacherFilterSelect = document.getElementById("teacher-filter-select");
  if (teacherFilterSelect) {
    teacherFilterSelect.addEventListener("change", (e) => {
      appState.teacherFilter = e.target.value;
      renderStudentTable();
    });
  }

  // (teacherClassFilter now managed via horizontal tab button clicks)

  const teacherSearchInput = document.getElementById("teacher-search-input");
  if (teacherSearchInput) {
    teacherSearchInput.addEventListener("input", (e) => {
      appState.teacherSearch = e.target.value;
      // Sync to sidebar search
      const sidebarSearch = document.getElementById("sidebar-search-input");
      if (sidebarSearch && sidebarSearch.value !== e.target.value) sidebarSearch.value = e.target.value;
      renderStudentTable();
    });
  }

  // Sidebar search input syncs with teacher search
  const sidebarSearchInput = document.getElementById("sidebar-search-input");
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener("input", (e) => {
      appState.teacherSearch = e.target.value;
      // Sync to directory search
      const dirSearch = document.getElementById("teacher-search-input");
      if (dirSearch && dirSearch.value !== e.target.value) dirSearch.value = e.target.value;
      renderStudentTable();
    });
  }

  // Kesiswaan toolbar filter bindings
  const kesiswaanSearchInput = document.getElementById("kesiswaan-search-input");
  if (kesiswaanSearchInput) {
    kesiswaanSearchInput.addEventListener("input", () => {
      renderKesiswaanTab();
    });
  }

  // (kesiswaanClassFilter now managed via horizontal tab button clicks)

  const kesiswaanStatusFilter = document.getElementById("kesiswaan-status-filter");
  if (kesiswaanStatusFilter) {
    kesiswaanStatusFilter.addEventListener("change", () => {
      renderKesiswaanTab();
    });
  }

  // Simplified Add Student Form submit V5
  const addStudentForm = document.getElementById("add-student-form");
  if (addStudentForm) {
    addStudentForm.addEventListener("submit", handleAddStudentFormSubmit);
  }

  const authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  const roleForm = document.getElementById("role-selector-form");
  if (roleForm) {
    roleForm.addEventListener("submit", handleRoleSubmit);
  }

  const teacherForm = document.getElementById("add-teacher-form");
  if (teacherForm) {
    teacherForm.addEventListener("submit", handleAddTeacher);
  }

  const subjectForm = document.getElementById("add-subject-form");
  if (subjectForm) {
    subjectForm.addEventListener("submit", handleAddSubject);
  }

  const createAssignmentForm = document.getElementById("create-assignment-form");
  if (createAssignmentForm) {
    createAssignmentForm.addEventListener("submit", handleCreateAssignmentFormSubmit);
  }

  const createExamForm = document.getElementById("create-exam-form");
  if (createExamForm) {
    createExamForm.addEventListener("submit", handleCreateExamFormSubmit);
  }

  const addQuestionForm = document.getElementById("add-question-form");
  if (addQuestionForm) {
    addQuestionForm.addEventListener("submit", handleAddQuestionFormSubmit);
  }

  document.body.classList.add("light-theme");
  localStorage.setItem("sigrade_theme", "light");

  // Always load sidebar collapsed by default V8
  const sidebar = document.getElementById("app-sidebar");
  if (sidebar) {
    sidebar.classList.remove("expanded");
    localStorage.setItem("sidebar_expanded", "false");
  }

  // Close sidebar on clicking any other elements (since brand S clicks stop propagation) V8
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("app-sidebar");
    if (!sidebar) return;
    
    if (sidebar.classList.contains("expanded")) {
      sidebar.classList.remove("expanded");
      localStorage.setItem("sidebar_expanded", "false");
      
      // Dispatch window resize event to trigger layout adjustments on grids
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
    }
  });

  // Setup initial view
  switchView("siswa");
  syncSidebarActiveState();
});

// V12: Auto-deselect student row and show default dashboard when clicking outside row or detail pane
document.addEventListener("click", (e) => {
  if (appState.currentView !== "guru") return;
  if (!appState.activeTeacherId) return;

  const workspaceGrid = document.querySelector(".teacher-workspace-grid");
  if (!workspaceGrid || !workspaceGrid.contains(e.target)) return;

  // Verify if click is outside of student rows, detail pane, and student enrollment action buttons/modal
  const isRowClick = e.target.closest(".clickable-student-row") || e.target.closest("tr");
  const isDetailPaneClick = e.target.closest("#teacher-right-pane");
  const isAddStudentClick = e.target.closest("#teacher-add-student-btn") || e.target.closest(".modal") || e.target.closest("[id*='modal']");
  const isCriticalBtnClick = e.target.closest("#teacher-delete-all-btn");

  if (!isRowClick && !isDetailPaneClick && !isAddStudentClick && !isCriticalBtnClick) {
    closeTeacherRightPane();
  }
});

// Setup initial view and handle routing
// Routing lock: mencegah hashchange loop saat pushState internal
let _isRoutingLocked = false;

document.addEventListener("DOMContentLoaded", () => {
  handleUrlRouting();
  window.addEventListener("hashchange", () => {
    if (_isRoutingLocked) return; // Abaikan jika dipicu oleh pushState internal
    handleUrlRouting();
  });
  window.addEventListener("popstate", () => {
    if (_isRoutingLocked) return;
    handleUrlRouting();
  });
});

// --- NEW ECOSYSTEM ROUTER ---
function handleUrlRouting() {
  const hash = window.location.hash;
  const path = window.location.pathname;

  let targetView = "siswa";
  if (hash === "#/guru" || path.endsWith("/guru")) {
    targetView = "guru";
  }

  // Guard: Jangan switch view jika sudah berada di view yang sama (mencegah loop/re-render)
  if (appState && appState.currentView === targetView) return;

  switchSidebarView(targetView, null);
}

function exportGradesToExcel(options = {}) {
  const fromReport = options.source === 'report' || appState.teacherActiveTab === 'direktori-nilai';

  const classFilterValue = fromReport
    ? (appState.reportClassFilter || '8C')
    : (appState.teacherClassFilter || 'all');
  const searchValue = fromReport
    ? (document.getElementById('report-table-search')?.value || '').toLowerCase().trim()
    : appState.teacherSearch.toLowerCase().trim();
  const filterValue = fromReport ? 'all' : appState.teacherFilter;
  
  const isWali = appState.activeTeacherId === "wali-kelas" || appState.activeTeacherId === "t-2";
  let assignedSubjects = isWali 
    ? appState.subjects 
    : appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);

  if (fromReport && classFilterValue && classFilterValue !== 'ALL') {
    const reportSubject = getReportSubjectForClass(classFilterValue);
    assignedSubjects = reportSubject ? [reportSubject] : assignedSubjects.filter((s) => {
      return isSubjectValidForStudentClass(s.name, classFilterValue);
    });
  }

  const filteredStudents = appState.students.filter(student => {
    const matchesSearch = (student.name || "").toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;
    if (classFilterValue !== "all" && student.class !== classFilterValue) return false;
    
    if (isWali) {
      const details = getOverallStudentCompleteness(student);
      if (filterValue === "complete" && !details.isAllComplete) return false;
      if (filterValue === "incomplete" && details.isAllComplete) return false;
    } else {
      let allAssignedComplete = true;
      assignedSubjects.forEach(s => {
        if (student.completeness[s.id] !== true) allAssignedComplete = false;
      });
      if (filterValue === "complete" && !allAssignedComplete) return false;
      if (filterValue === "incomplete" && allAssignedComplete) return false;
    }
    return true;
  });

  if (filteredStudents.length === 0) {
    alert("Tidak ada data siswa untuk diekspor.");
    return;
  }

  // Sort students by absent number if available, else by name
  filteredStudents.sort((a, b) => {
    const absA = parseInt(a.absentNo, 10);
    const absB = parseInt(b.absentNo, 10);
    if (!isNaN(absA) && !isNaN(absB)) {
      return absA - absB;
    }
    return a.name.localeCompare(b.name);
  });

  const headers = ["No", "Nama Siswa", "Kelas"];
  
  let headerFirstChapter = true;
  assignedSubjects.forEach(sub => {
    const chapters = sub.chapters || [];
    chapters.forEach(ch => {
      if (!headerFirstChapter) {
        headers.push("");
      }
      headerFirstChapter = false;
      const subPrefix = assignedSubjects.length > 1 ? `[${sub.name}] ` : "";
      headers.push(`${subPrefix}${ch.name} N1`);
      headers.push(`${subPrefix}${ch.name} N2`);
      
      headers.push(`${subPrefix}${ch.name} UH`);
    });
  });

  const csvRows = [];
  // UTF-8 BOM so Excel opens it with correct encoding
  csvRows.push("\uFEFF" + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

  filteredStudents.forEach((student, index) => {
    const row = [
      index + 1,
      student.absentNo !== undefined ? student.absentNo : "-",
      student.name,
      student.class || "-"
    ];

    let rowFirstChapter = true;
    assignedSubjects.forEach(sub => {
      const sGrades = student.grades && student.grades[sub.id];
      const chapters = sub.chapters || [];

      chapters.forEach(ch => {
        if (!rowFirstChapter) {
          row.push("");
        }
        rowFirstChapter = false;

        const chGrades = sGrades && sGrades.chapters && sGrades.chapters[ch.name]
          ? sGrades.chapters[ch.name] : null;

        let n1 = "-";
        let n2 = "-";
        let n3 = "-";
        let uh = "-";

        if (chGrades) {
          const tasks = ch.tasks || [];
          if (tasks.length > 0 && chGrades.tasks) {
            n1 = chGrades.tasks[tasks[0]] !== undefined ? chGrades.tasks[tasks[0]] : "-";
          }
          if (tasks.length > 1 && chGrades.tasks) {
            n2 = chGrades.tasks[tasks[1]] !== undefined ? chGrades.tasks[tasks[1]] : "-";
          }

          uh = chGrades.ulangan !== undefined ? chGrades.ulangan : "-";
        }

        row.push(n1);
        row.push(n2);
        
        row.push(uh);
      });
    });

    csvRows.push(row.map(val => {
      const strVal = String(val);
      if (strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const classLabel = classFilterValue === "all" ? "Semua_Kelas" : classFilterValue;
  
  a.href = url;
  a.download = `sigrade_nilai_${classLabel}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.exportGradesToExcel = exportGradesToExcel;

function getStudentSubjectN123UH(student, subjectId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return null;

  const sGrades = student.grades && student.grades[subjectId];
  const chapters = subject.chapters || [];
  if (chapters.length === 0) return null;

  let n1Sum = 0, n2Sum = 0, uhSum = 0;
  let n1Count = 0, n2Count = 0, uhCount = 0;

  chapters.forEach(ch => {
    const chGrades = sGrades && sGrades.chapters && sGrades.chapters[ch.name]
      ? sGrades.chapters[ch.name] : null;
    if (!chGrades) return;

    const tasks = ch.tasks || [];
    tasks.forEach((t, idx) => {
      const score = chGrades.tasks?.[t];
      if (!isRecordedScore(score)) return;
      if (idx === 0) { n1Sum += score; n1Count++; }
      else if (idx === 1) { n2Sum += score; n2Count++; }
    });

    const uh = chGrades.ulangan;
    if (isRecordedScore(uh)) {
      uhSum += uh;
      uhCount++;
    }
  });

  return {
    n1: n1Count > 0 ? Math.round(n1Sum / n1Count) : 0,
    n2: n2Count > 0 ? Math.round(n2Sum / n2Count) : 0,
    uh: uhCount > 0 ? Math.round(uhSum / uhCount) : 0
  };
}

function calculateN123UHFinal(comp, w1, w2, w4) {
  const total = (w1 + w2 + w4) || 1;
  return Math.round(((comp.n1 * w1) + (comp.n2 * w2) + (comp.uh * w4)) / total * 10) / 10;
}

function triggerAIKatrol(studentId) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  window.currentKatrolStudentId = studentId;
  window.proposedKatrolChanges = {
    studentId: studentId,
    subjects: {}
  };

  const modal = document.getElementById("ai-katrol-modal");
  if (modal) modal.style.display = "flex";

  const loading = document.getElementById("ai-katrol-loading");
  const result = document.getElementById("ai-katrol-result");
  if (loading) loading.style.display = "flex";
  if (result) result.style.display = "none";

  const W1 = 1, W2 = 1, W4 = 2;

  appState.subjects.forEach(sub => {
    if (!hasAnyRecordedGradesForSubject(student, sub.id)) return;

    const comps = getStudentSubjectN123UH(student, sub.id);
    if (!comps) return;

    const finalCurrent = calculateN123UHFinal(comps, W1, W2, W4);
    if (finalCurrent < sub.kkm) {
      const rawChanges = [];
      const tempGrades = JSON.parse(JSON.stringify(student.grades[sub.id] || { chapters: {} }));

      sub.chapters.forEach(ch => {
        const chName = ch.name;
        if (!tempGrades.chapters) tempGrades.chapters = {};
        if (!tempGrades.chapters[chName]) {
          tempGrades.chapters[chName] = createEmptyChapterGrades();
        }
        const sCh = tempGrades.chapters[chName];
        if (!sCh.tasks) sCh.tasks = {};

        const tasks = ch.tasks || [];
        const boostItems = [];

        if (tasks[0] && isRecordedScore(sCh.tasks[tasks[0]])) {
          boostItems.push({
            key: 'n1',
            val: sCh.tasks[tasks[0]],
            ch: chName,
            tName: tasks[0],
            setter: (v) => { sCh.tasks[tasks[0]] = v; }
          });
        }
        if (tasks[1] && isRecordedScore(sCh.tasks[tasks[1]])) {
          boostItems.push({
            key: 'n2',
            val: sCh.tasks[tasks[1]],
            ch: chName,
            tName: tasks[1],
            setter: (v) => { sCh.tasks[tasks[1]] = v; }
          });
        }
        if (isRecordedScore(sCh.ulangan)) {
          boostItems.push({
            key: 'uh',
            val: sCh.ulangan,
            ch: chName,
            tName: 'Ulangan Harian',
            setter: (v) => { sCh.ulangan = v; }
          });
        }

        boostItems.sort((a, b) => a.val - b.val);
        const usedValues = new Set();
        boostItems.forEach((item, idx) => {
          if (item.val < sub.kkm) {
            const gap = sub.kkm - item.val;
            let boost = Math.min(gap + 3 + idx * 2 + Math.floor(Math.random() * 3), 100 - item.val);
            let newVal = item.val + boost;
            while (usedValues.has(newVal) && newVal < 100) { newVal++; }
            usedValues.add(newVal);
            item.setter(newVal);
            rawChanges.push({
              chapter: item.ch,
              type: item.key.toUpperCase(),
              name: item.tName,
              oldVal: item.val,
              newVal: newVal
            });
          }
        });
      });

      const tempStudent = { grades: { [sub.id]: tempGrades } };
      const newComps = getStudentSubjectN123UH(tempStudent, sub.id);
      const newFinal = newComps ? calculateN123UHFinal(newComps, W1, W2, W4) : sub.kkm;

      window.proposedKatrolChanges.subjects[sub.id] = {
        name: sub.name,
        kkm: sub.kkm,
        oldComps: comps,
        newComps: newComps,
        oldFinal: finalCurrent,
        newFinal: newFinal,
        oldAvg: finalCurrent,
        newAvg: newFinal,
        rawChanges: rawChanges,
        newGradesBranch: tempGrades
      };
    }
  });

  setTimeout(() => {
    if (loading) loading.style.display = "none";
    if (result) result.style.display = "flex";

    document.getElementById("ai-katrol-student-name").innerText = `${student.name} (${student.class || '8A'})`;

    const tbody = document.getElementById("ai-katrol-comparison-tbody");
    tbody.innerHTML = "";

    const rawChangesList = document.getElementById("ai-katrol-raw-changes");
    rawChangesList.innerHTML = "";

    let hasSubjectToKatrol = false;
    let rawChangesHTML = "";

    for (const subId in window.proposedKatrolChanges.subjects) {
      hasSubjectToKatrol = true;
      const data = window.proposedKatrolChanges.subjects[subId];
      const oc = data.oldComps || { n1: 0, n2: 0, n3: 0, uh: 0 };
      const nc = data.newComps || oc;

      const compToRow = (label, key, oldV, newV) => {
        const oldOk = oldV >= data.kkm;
        const newOk = newV >= data.kkm;
        const pct = Math.min(oldV / data.kkm, 1) * 100;
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
            <td style="padding:0.35rem 0.5rem; font-size:0.72rem; font-weight:700; color:var(--text-primary);">${label}</td>
            <td style="padding:0.35rem 0.5rem; text-align:center;">
              <div style="display:flex; align-items:center; gap:0.4rem; justify-content:center;">
                <div style="flex:1; max-width:80px; height:6px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                  <div style="height:100%; width:${pct}%; background:${oldOk ? 'var(--success)' : 'var(--danger)'}; border-radius:4px;"></div>
                </div>
                <span style="font-weight:700; font-size:0.78rem; color:${oldOk ? 'var(--success)' : 'var(--danger)'};">${oldV}</span>
              </div>
            </td>
            <td style="padding:0.35rem 0.5rem; text-align:center;">
              <span style="font-weight:800; font-size:0.8rem; color:${newOk ? 'var(--success)' : 'var(--warning)'};">${newV}</span>
              ${oldV !== newV ? `<span style="font-size:0.6rem; color:var(--success); margin-left:2px;">▲${newV - oldV}</span>` : `<span style="font-size:0.6rem; color:var(--text-muted);">ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</span>`}
            </td>
          </tr>
        `;
      };

      tbody.innerHTML += `
        <tr style="border-bottom:1px dashed rgba(168,85,247,0.2);">
          <td colspan="3" style="padding:0.5rem 0.5rem 0.2rem 0.5rem; font-weight:800; color:#c084fc; font-size:0.82rem;">${escapeHTML(data.name)} (KKM: ${data.kkm})</td>
        </tr>
        ${compToRow('N1 (Tugas 1)', 'n1', oc.n1, nc.n1)}
        ${compToRow('N2 (Tugas 2)', 'n2', oc.n2, nc.n2)}
        
        ${compToRow('UH (Ulangan)', 'uh', oc.uh, nc.uh)}
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:0.45rem 0.5rem; font-weight:800; color:var(--text-primary); font-size:0.8rem;">Nilai Akhir</td>
          <td style="padding:0.45rem 0.5rem; text-align:center;">
            <span style="font-weight:700; font-size:0.85rem; color:var(--text-muted); text-decoration:line-through;">${data.oldFinal}</span>
          </td>
          <td style="padding:0.45rem 0.5rem; text-align:center;">
            <span style="font-weight:900; font-size:1rem; color:${data.newFinal >= data.kkm ? 'var(--success)' : 'var(--danger)'};">${data.newFinal}</span>
            <span class="status-badge complete" style="font-size:0.6rem; padding:1px 5px; margin-left:4px;">Tuntas ✨</span>
          </td>
        </tr>
      `;

      rawChangesHTML += `<div style="font-weight:700; color:#c084fc; margin:0.35rem 0 0.15rem;">[${escapeHTML(data.name)}]:</div>`;
      data.rawChanges.forEach(c => {
        rawChangesHTML += `<span style="color:var(--text-muted);">&nbsp;&nbsp;•</span> ${c.type} <span style="color:var(--text-secondary);">${c.oldVal} ÃƒÂ¢Ã…Â¾Ã‚Â¡ÃƒÂ¯Ã‚Â¸Ã‚Â</span> <span style="color:#10b981; font-weight:bold;">${c.newVal}</span><br>`;
      });
    }

    if (!hasSubjectToKatrol) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:1rem; color:var(--text-muted); font-style:italic;">Semua mata pelajaran siswa sudah memenuhi KKM.</td></tr>`;
      rawChangesHTML = "Tidak ada perubahan nilai.";
    }

    rawChangesList.innerHTML = rawChangesHTML;
  }, 1500);
}

function closeAIKatrolModal() {
  const modal = document.getElementById("ai-katrol-modal");
  if (modal) modal.style.display = "none";
}

function applyAIKatrolGrades() {
  const studentId = window.currentKatrolStudentId;
  const student = appState.students.find(s => s.id === studentId);
  if (!student || !window.proposedKatrolChanges) return;

  for (const subId in window.proposedKatrolChanges.subjects) {
    const data = window.proposedKatrolChanges.subjects[subId];
    student.grades[subId] = data.newGradesBranch;
  }

  saveData();
  renderStudentTable();
  renderTeacherRightPane();

  closeAIKatrolModal();

  let changedCount = 0;
  for (const k in window.proposedKatrolChanges.subjects) {
    const d = window.proposedKatrolChanges.subjects[k];
    changedCount += d.rawChanges ? d.rawChanges.length : 0;
  }

  alert(`🤖 Katrol Berhasil!\n\nNilai ${student.name} telah disesuaikan (${changedCount} komponen N1/N2/N3/UH berubah) untuk memenuhi KKM.`);
}

window.triggerAIKatrol = triggerAIKatrol;
window.closeAIKatrolModal = closeAIKatrolModal;
window.applyAIKatrolGrades = applyAIKatrolGrades;

function renderKatrolTab() {
  if (!appState.katrolClassFilter) {
    appState.katrolClassFilter = appState.classes[0] || "8C";
  }

  const classTabsContainer = document.getElementById("katrol-class-tabs");
  if (classTabsContainer) {
    classTabsContainer.innerHTML = "";
    const activeClasses = getActiveClassesTaughtByTeachers();
    activeClasses.forEach(cls => {
      const btn = document.createElement("button");
      btn.className = `class-tab${appState.katrolClassFilter === cls ? " active" : ""}`;
      btn.innerText = cls;
      btn.onclick = () => { appState.katrolClassFilter = cls; renderKatrolTab(); };
      classTabsContainer.appendChild(btn);
    });
  }

  const classStudents = appState.students.filter(s => s.class === appState.katrolClassFilter);
  const totalStudents = classStudents.length;
  const W1 = 1, W2 = 1, W4 = 2;

  let needingBooster = [];
  let tuntasCount = 0;

  classStudents.forEach(st => {
    let needsBoost = false;
    let subData = [];

    appState.subjects.forEach(sub => {
      const comps = getStudentSubjectN123UH(st, sub.id);
      if (!comps) return;
      const finalScore = calculateN123UHFinal(comps, W1, W2, W4);
      if (finalScore < sub.kkm) {
        needsBoost = true;
        subData.push({ subject: sub, comps, finalScore });
      }
    });

    if (needsBoost) {
      needingBooster.push({ student: st, subjects: subData });
    } else {
      tuntasCount++;
    }
  });

  const statTotal = document.getElementById("katrol-stat-total");
  const statNeeded = document.getElementById("katrol-stat-needed");
  const statComplete = document.getElementById("katrol-stat-complete");
  const btnClassLabel = document.getElementById("katrol-btn-class-label");

  if (statTotal) statTotal.innerText = totalStudents;
  if (statNeeded) statNeeded.innerText = needingBooster.length;
  if (statComplete) statComplete.innerText = tuntasCount;
  if (btnClassLabel) btnClassLabel.innerText = appState.katrolClassFilter;

  const normBtn = document.getElementById("norm-katrol-btn");
  if (normBtn) normBtn.style.display = totalStudents > 0 ? "inline-flex" : "none";

  const container = document.getElementById("katrol-cards-container");
  if (!container) return;
  container.innerHTML = "";

  if (totalStudents === 0) {
    container.innerHTML = `<div class="glass-card" style="grid-column:1/-1; text-align:center; padding:3rem 2rem; color:var(--text-secondary); font-style:italic;">Tidak ada data siswa untuk kelas ${appState.katrolClassFilter}. Silakan tambahkan siswa terlebih dahulu di tab Pengaturan.</div>`;
    return;
  }

  if (needingBooster.length === 0) {
    container.innerHTML = `<div class="glass-card" style="grid-column:1/-1; text-align:center; padding:3rem 2rem; color:var(--success); background:var(--success-bg); border:1px solid rgba(16,185,129,0.2); font-weight:700; font-size:1.15rem; display:flex; flex-direction:column; align-items:center; gap:0.5rem; justify-content:center;"><span class="material-symbols-rounded" style="font-size:2.5rem; color:var(--emerald);">celebrate</span> Luar Biasa! Semua siswa di kelas ${appState.katrolClassFilter} telah mencapai standar KKM di semua mata pelajaran.</div>`;
    return;
  }

  needingBooster.forEach(item => {
    const st = item.student;

    const subsHTML = item.subjects.map(sd => {
      const c = sd.comps;
      const sName = sd.subject.name;
      const kkm = sd.subject.kkm;

      const compRow = (label, icon, val, colorBar) => {
        const ok = val >= kkm;
        const pct = Math.min(val / (kkm || 70), 1) * 100;
        return `
          <div class="katrol-comp-row">
            <div class="katrol-comp-label">
              <span class="katrol-comp-icon">${icon}</span>
              <span class="katrol-comp-name">${label}</span>
            </div>
            <div class="katrol-comp-track">
              <div class="katrol-comp-fill" style="width:${pct}%; background:${colorBar};"></div>
            </div>
            <div class="katrol-comp-value ${ok ? 'ok' : 'low'}">${val}</div>
          </div>
        `;
      };

      return `
        <div class="katrol-subject-block">
          <div class="katrol-subject-header">
            <span>${escapeHTML(sName)}</span>
            <div class="katrol-subject-meta">
              <span class="katrol-kkm-badge">KKM ${kkm}</span>
              <span class="katrol-score-badge">${sd.finalScore}</span>
            </div>
          </div>
          <div class="katrol-comp-grid">
            ${compRow('N1 - Tugas 1', '<span class="material-symbols-rounded">edit_note</span>', c.n1, 'var(--danger)')}
            ${compRow('N2 - Tugas 2', '<span class="material-symbols-rounded">edit_note</span>', c.n2, 'var(--warning)')}
            
            ${compRow('UH - Ulangan', '<span class="material-symbols-rounded">emoji_events</span>', c.uh, 'var(--secondary)')}
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML += `
      <div class="katrol-student-card">
        <div class="katrol-card-header">
          <div class="katrol-card-info">
            <span class="katrol-card-avatar">${(st.name || '?')[0]}</span>
            <div>
              <div class="katrol-card-name">${escapeHTML(st.name)}</div>
              <div class="katrol-card-detail">Absen: ${st.absentNo || "-"} · ${escapeHTML(st.class || '')} · ${st.gender || "-"}</div>
            </div>
          </div>
          <span class="status-badge incomplete" style="font-size:0.65rem; padding:3px 10px; white-space:nowrap; border-radius:20px;">ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Perlu Katrol</span>
        </div>
        <div class="katrol-card-body">
          ${subsHTML}
        </div>
        <div class="katrol-card-footer">
          <div class="katrol-footer-note">💡 Komponen dengan nilai di bawah KKM akan dinaikkan oleh AI secara otomatis</div>
          <button onclick="triggerAIKatrol('${st.id}')" class="action-btn katrol-ai-btn">
            🤖 Katrol AI
          </button>
        </div>
      </div>
    `;
  });
}

function triggerBatchAIKatrol() {
  const classStudents = appState.students.filter(s => s.class === appState.katrolClassFilter);
  const W1 = 1, W2 = 1, W4 = 2;
  let boostedCount = 0;
  let totalChanges = 0;

  classStudents.forEach(st => {
    let studentBoosted = false;

    appState.subjects.forEach(sub => {
      if (!hasAnyRecordedGradesForSubject(st, sub.id)) return;

      const comps = getStudentSubjectN123UH(st, sub.id);
      if (!comps) return;
      const finalScore = calculateN123UHFinal(comps, W1, W2, W4);
      if (finalScore >= sub.kkm) return;

      studentBoosted = true;
      const tempGrades = JSON.parse(JSON.stringify(st.grades[sub.id] || { chapters: {} }));

      sub.chapters.forEach(ch => {
        const chName = ch.name;
        if (!tempGrades.chapters) tempGrades.chapters = {};
        if (!tempGrades.chapters[chName]) {
          tempGrades.chapters[chName] = createEmptyChapterGrades();
        }
        const sCh = tempGrades.chapters[chName];
        if (!sCh.tasks) sCh.tasks = {};

        const tasks = ch.tasks || [];
        const batchItems = [];

        if (tasks[0] && isRecordedScore(sCh.tasks[tasks[0]])) {
          batchItems.push({
            key: 'n1',
            val: sCh.tasks[tasks[0]],
            setter: (v) => { sCh.tasks[tasks[0]] = v; }
          });
        }
        if (tasks[1] && isRecordedScore(sCh.tasks[tasks[1]])) {
          batchItems.push({
            key: 'n2',
            val: sCh.tasks[tasks[1]],
            setter: (v) => { sCh.tasks[tasks[1]] = v; }
          });
        }
        if (isRecordedScore(sCh.ulangan)) {
          batchItems.push({
            key: 'uh',
            val: sCh.ulangan,
            setter: (v) => { sCh.ulangan = v; }
          });
        }

        batchItems.sort((a, b) => a.val - b.val);
        const batchUsed = new Set();
        batchItems.forEach((item, idx) => {
          if (item.val < sub.kkm) {
            const gap = sub.kkm - item.val;
            let boost = Math.min(gap + 2 + idx * 2 + Math.floor(Math.random() * 3), 100 - item.val);
            let newVal = item.val + boost;
            while (batchUsed.has(newVal) && newVal < 100) newVal++;
            batchUsed.add(newVal);
            item.setter(newVal);
            totalChanges++;
          }
        });
      });

      st.grades[sub.id] = tempGrades;
    });

    if (studentBoosted) boostedCount++;
  });

  if (boostedCount === 0) {
    alert(`💡 Tidak ada siswa di Kelas ${appState.katrolClassFilter} yang memerlukan katrol nilai.`);
    return;
  }

  saveData();
  renderKatrolTab();
  alert(`⚡ Katrol Massal Berhasil!\n\n${boostedCount} siswa di Kelas ${appState.katrolClassFilter} dikatrol (${totalChanges} komponen N1/N2/N3/UH disesuaikan).`);
}

function triggerNormalizeKatrol() {
  const cls = appState.katrolClassFilter;
  const classStudents = appState.students.filter(s => s.class === cls);
  if (classStudents.length === 0) {
    alert(`Tidak ada siswa di kelas ${cls}.`);
    return;
  }

  const W1 = 1, W2 = 1, W4 = 2;
  const normData = [];
  let anyChange = false;

  appState.subjects.forEach(sub => {
    const compKeys = ['n1', 'n2', 'n3', 'uh'];
    compKeys.forEach(key => {
      const vals = classStudents.map(st => {
        const comps = getStudentSubjectN123UH(st, sub.id);
        return comps ? comps[key] : null;
      }).filter(v => v !== null);
      if (vals.length === 0) return;

      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      if (maxV === minV) return; // all same, no normalization possible

      normData.push({ subjectId: sub.id, subjectName: sub.name, component: key, minV, maxV });
    });
  });

  if (normData.length === 0) {
    alert(`Tidak ada komponen yang bisa dinormalisasi. Mungkin semua nilai sudah seragam.`);
    return;
  }

  // Build modal content
  let html = '';
  normData.forEach(({ subjectId, subjectName, component, minV, maxV }) => {
    const labelMap = { n1: 'N1 - Tugas 1', n2: 'N2 - Tugas 2', n3: 'N3 - Tugas 3', uh: 'UH - Ulangan Harian' };
    const compLabel = labelMap[component] || component.toUpperCase();
    html += `<tr><td colspan="4" style="padding:0.5rem 0.5rem 0.25rem; font-weight:800; color:#22d3ee; font-size:0.8rem;">${escapeHTML(subName)} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ${compLabel}</td></tr>`;
    html += `<tr style="font-size:0.65rem; color:var(--text-muted);"><td></td><td>Rentang: ${minV} – ${maxV}</td><td>Target: 78 – 90</td><td></td></tr>`;

    classStudents.forEach(st => {
      const comps = getStudentSubjectN123UH(st, sub.id);
      if (!comps) return;
      const oldV = comps[component];
      const newV = Math.round(78 + ((oldV - minV) / (maxV - minV)) * (90 - 78));
      if (newV !== oldV) anyChange = true;
      const arrow = newV !== oldV ? '→' : '→';
      const color = newV !== oldV ? (newV > oldV ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)';
      html += `<tr class="norm-comparison">
        <td style="padding:0.25rem 0.5rem; font-size:0.7rem; color:var(--text-secondary);">${escapeHTML(st.name)}</td>
        <td style="padding:0.25rem 0.5rem; text-align:center; font-weight:600; color:var(--danger);">${oldV}</td>
        <td style="padding:0.25rem 0.5rem; text-align:center; font-weight:700; color:${color};">${newV}</td>
        <td style="padding:0.25rem 0.5rem; text-align:center; font-size:0.65rem; color:${newV > oldV ? 'var(--success)' : 'var(--text-muted)'};">${newV !== oldV ? (newV > oldV ? `▲${newV - oldV}` : `▼${oldV - newV}`) : 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â'}</td>
      </tr>`;
    });
  });

  window._normHtml = html;
  window._normAnyChange = anyChange;

  const existing = document.getElementById("norm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "norm-modal";
  modal.className = "modal-overlay";
  modal.classList.add("active");
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 700px;">
      <div class="modal-header">
        <h3 style="color:#22d3ee;">📊 Normalisasi Excel (78–90)</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✏</button>
      </div>
      <div class="modal-body" style="padding:1rem 1.5rem;">
        <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">
          Rumus: <code style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-size:0.7rem;">78 + ((nilai - MIN) / (MAX - MIN)) ÃƒÆ’Ã¢â‚¬â€ (90 - 78)</code>
          ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Nilai terendah kelas menjadi 78, tertinggi menjadi 90.
        </p>
        <div style="max-height:55vh; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color); position:sticky; top:0; background:var(--bg-secondary);">
                <th style="padding:0.4rem 0.5rem; text-align:left; font-weight:700;">Siswa</th>
                <th style="padding:0.4rem 0.5rem; text-align:center; font-weight:700;">Saat Ini</th>
                <th style="padding:0.4rem 0.5rem; text-align:center; font-weight:700; color:#22d3ee;">Hasil Normalisasi</th>
                <th style="padding:0.4rem 0.5rem; text-align:center; font-weight:700;">ÃƒÅ½Ã¢â‚¬Â</th>
              </tr>
            </thead>
            <tbody>${html}</tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn secondary-btn" onclick="this.closest('.modal-overlay').remove()">Tutup</button>
        <button id="norm-apply-btn" class="action-btn" style="background:linear-gradient(135deg,#06b6d4,#3b82f6);" onclick="applyNormalizeKatrol()" ${anyChange ? '' : 'disabled'}>${anyChange ? 'Terapkan Normalisasi' : 'Tidak Ada Perubahan'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function applyNormalizeKatrol() {
  if (!confirm("Terapkan normalisasi nilai ke semua siswa di kelas ini? Tindakan ini tidak dapat dibatalkan.")) return;

  const cls = appState.katrolClassFilter;
  const classStudents = appState.students.filter(s => s.class === cls);
  const W1 = 1, W2 = 1, W4 = 2;
  let changedCount = 0;

  appState.subjects.forEach(sub => {
    const compKeys = ['n1', 'n2', 'n3', 'uh'];
    compKeys.forEach(key => {
      const vals = classStudents.map(st => {
        const comps = getStudentSubjectN123UH(st, sub.id);
        return comps ? comps[key] : null;
      }).filter(v => v !== null);
      if (vals.length === 0) return;

      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      if (maxV === minV) return;

      classStudents.forEach(st => {
        const comps = getStudentSubjectN123UH(st, sub.id);
        if (!comps) return;
        const oldV = comps[key];
        const newV = Math.round(78 + ((oldV - minV) / (maxV - minV)) * (90 - 78));
        if (newV === oldV) return;

        // Apply to each chapter's grade
        const sGrades = st.grades && st.grades[sub.id];
        const chapters = sub.chapters || [];
        chapters.forEach(ch => {
          const chGrades = sGrades && sGrades.chapters && sGrades.chapters[ch.name];
          if (!chGrades) return;

          const tasks = ch.tasks || [];
          if (key === 'n1' && tasks[0]) {
            const cur = chGrades.tasks?.[tasks[0]];
            if (!isRecordedScore(cur) || cur !== oldV) return;
            if (!chGrades.tasks) chGrades.tasks = {};
            chGrades.tasks[tasks[0]] = Math.min(newV, 100);
          } else if (key === 'n2' && tasks[1]) {
            const cur = chGrades.tasks?.[tasks[1]];
            if (!isRecordedScore(cur) || cur !== oldV) return;
            if (!chGrades.tasks) chGrades.tasks = {};
            chGrades.tasks[tasks[1]] = Math.min(newV, 100);
          } else if (key === 'n3') {
            const cur = chGrades.tugasAkhir;
            if (!isRecordedScore(cur) || cur !== oldV) return;
            chGrades.tugasAkhir = Math.min(newV, 100);
          } else if (key === 'uh') {
            const cur = chGrades.ulangan;
            if (!isRecordedScore(cur) || cur !== oldV) return;
            chGrades.ulangan = Math.min(newV, 100);
          }
        });
        changedCount++;
      });
    });
  });

  if (changedCount > 0) {
    saveData();
    renderKatrolTab();
    const modal = document.getElementById("norm-modal");
    if (modal) modal.remove();
    alert(`📊 Normalisasi berhasil!\n\n${changedCount} komponen nilai disesuaikan untuk kelas ${cls} ke rentang 78–90.`);
  } else {
    alert("Tidak ada perubahan yang diterapkan.");
  }
}

window.renderKatrolTab = renderKatrolTab;
window.triggerBatchAIKatrol = triggerBatchAIKatrol;
window.triggerNormalizeKatrol = triggerNormalizeKatrol;
window.applyNormalizeKatrol = applyNormalizeKatrol;

// --- DIREKTORI TUGAS SISWA (Read-Only Mirror) ---
appState.studentCurriculumActiveChapter = null;
appState.studentCurriculumActiveTask = null;

function renderStudentCurriculumDirectory() {
  const student = getActiveStudent();
  const select = document.getElementById("student-curriculum-subject-select");
  const listContainer = document.getElementById("student-curriculum-list");
  const detailPane = document.getElementById("student-curriculum-detail");

  if (!select || !listContainer || !detailPane) return;

  if (!student) {
    listContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0;">Pilih kelas dan nama Anda terlebih dahulu.</div>`;
    return;
  }

  const validSubjects = getSubjectsForStudent(student);

  const currentVal = select.value;
  select.innerHTML = "";
  validSubjects.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.innerText = s.name;
    select.appendChild(opt);
  });

  if (validSubjects.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0;">Belum ada mata pelajaran untuk kelas Anda.</div>`;
    return;
  }

  if (currentVal && validSubjects.find(s => s.id === currentVal)) {
    select.value = currentVal;
  }

  const subject = appState.subjects.find(s => s.id === select.value);
  if (!subject) return;

  listContainer.innerHTML = "";

  (subject.chapters || []).forEach(ch => {
    const chHeader = document.createElement("div");
    chHeader.className = "task-dir-chapter-header";
    chHeader.innerHTML = `
      <span style="display:flex; align-items:center; gap:0.4rem;">
        <span class="material-symbols-rounded" style="font-size:15px; color:var(--indigo);">folder</span>
        <span style="font-weight:800;">${escapeHTML(ch.name)}</span>
        ${ch.title ? `<span style="font-size:0.7rem; color:var(--text-muted); font-weight:500;">— ${escapeHTML(ch.title)}</span>` : ""}
      </span>
    `;
    listContainer.appendChild(chHeader);

    const tasks = [];
    if (ch.tasks) ch.tasks.forEach(t => tasks.push({ name: t, type: "task" }));
    tasks.push({ name: "Ulangan", type: "ulangan" });

    tasks.forEach(t => {
      const key = `${ch.name}_${t.name}`;
      const tDir = subject.tasksDirectory?.[key];
      const isReleased = isDirectoryTaskReleased(tDir, student.class);
      const isActive = appState.studentCurriculumActiveChapter === ch.name && appState.studentCurriculumActiveTask === t.name;

      const item = document.createElement("div");
      item.className = `task-dir-item ${isActive ? "active" : ""} ${!isReleased ? "disabled" : ""}`;
      if (isReleased) {
        item.onclick = () => selectStudentCurriculumTask(student.id, subject.id, ch.name, t.type, t.name);
      }

      const modeLabel = tDir?.mode === 'buku' ? 'Buku' : (tDir?.mode === 'pg' ? 'PG' : 'Essay');
      item.innerHTML = `
        <span style="display:flex; align-items:center; gap:0.35rem; flex:1;">
          <span class="material-symbols-rounded" style="font-size:14px; color:${isReleased ? 'var(--secondary)' : 'var(--text-muted)'};">${t.type === 'ulangan' ? 'quiz' : 'assignment'}</span>
          <span style="font-size:0.8rem; font-weight:600; color:${isReleased ? 'var(--text-primary)' : 'var(--text-muted)'};">${escapeHTML(t.name)}</span>
        </span>
        <span style="font-size:0.65rem; padding:2px 6px; border-radius:4px; background:${isReleased ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)'}; color:${isReleased ? 'var(--secondary)' : 'var(--text-muted)'};">
          ${isReleased ? modeLabel : 'Belum Dibuka'}
        </span>
      `;
      listContainer.appendChild(item);
    });
  });
}

function selectStudentCurriculumTask(studentId, subjectId, chapterName, taskType, taskName) {
  appState.studentCurriculumActiveChapter = chapterName;
  appState.studentCurriculumActiveTask = taskName;
  renderStudentCurriculumDirectory();

  const student = appState.students.find(s => s.id === studentId);
  const subject = appState.subjects.find(s => s.id === subjectId);
  const detailPane = document.getElementById("student-curriculum-detail");
  if (!student || !subject || !detailPane) return;

  const key = `${chapterName}_${taskName}`;
  const tDir = subject.tasksDirectory?.[key];

  if (isDirectoryTaskHidden(tDir, student.class)) {
    detailPane.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:3rem;"><span class="material-symbols-rounded" style="font-size:40px; opacity:0.3; display:block; margin-bottom:0.5rem;">lock</span>Tugas ini belum dibuka oleh guru.</div>`;
    return;
  }

  const hasSubmitted = tDir.submissions && tDir.submissions[studentId];
  const modeIcon = tDir.mode === 'buku' ? 'menu_book' : (tDir.mode === 'pg' ? 'radio_button_checked' : 'edit_note');

  let bukuHTML = '';
  if (tDir.mode === 'buku') {
    bukuHTML = `
      <div style="background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.2); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase;">Referensi Buku</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);"><strong>Judul:</strong> ${escapeHTML(tDir.bukuTitle || 'Buku Paket')}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;"><strong>Halaman:</strong> ${escapeHTML(tDir.bukuPageStart || '?')} – ${escapeHTML(tDir.bukuPageEnd || '?')}</div>
      </div>
    `;
  }

  detailPane.innerHTML = `
    <div style="padding:1rem;">
      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
        <span class="material-symbols-rounded" style="font-size:24px; color:var(--indigo);">${modeIcon}</span>
        <div>
          <div style="font-size:0.75rem; color:var(--secondary); font-weight:700; text-transform:uppercase;">${escapeHTML(subject.name)} — ${escapeHTML(chapterName)}</div>
          <h3 style="font-family:var(--font-heading); font-weight:800; font-size:1.1rem; margin:0;">${escapeHTML(taskName)}</h3>
        </div>
      </div>

      <div style="background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.15); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase;">Materi / Teori</div>
        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; white-space:pre-line; margin:0;">${escapeHTML(tDir.theory || 'Materi sedang disiapkan.')}</p>
      </div>

      ${bukuHTML}

      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1.25rem;">
        <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase;">Petunjuk Pengerjaan</div>
        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; white-space:pre-line; margin:0;">${escapeHTML(tDir.instruction || 'Kerjakan sesuai petunjuk guru.')}</p>
      </div>

      ${hasSubmitted ? `<div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-sm); padding:0.75rem; margin-bottom:1rem; font-size:0.8rem; color:var(--success); display:flex; align-items:center; gap:0.35rem;"><span class="material-symbols-rounded" style="font-size:16px;">check_circle</span> Sudah dikumpulkan</div>` : ''}

      <button class="action-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:0.35rem;" onclick="openLmsModule('${escapeJSAttr(studentId)}', '${escapeJSAttr(subjectId)}', '${escapeJSAttr(chapterName)}', '${escapeJSAttr(taskType)}', '${escapeJSAttr(taskName)}')">
        <span class="material-symbols-rounded" style="font-size:18px;">bolt</span> ${hasSubmitted ? 'Lihat / Kerjakan Ulang' : 'Kerjakan Tugas'}
      </button>
    </div>
  `;
}

// --- DIREKTORI TUGAS EKOSISTEM V19 ---
appState.tasksDirectoryActiveChapter = null;
appState.tasksDirectoryActiveTask = null;
appState.tasksDirectoryEditing = false;
appState.tasksDirectoryQuestions = [];

function renderTasksDirectoryTab() {
  const select = document.getElementById("tasks-dir-subject-select");
  if (!select) return;

  // Populate subjects assigned to the teacher
  let assignedSubjects = appState.subjects;
  if (appState.activeTeacherId !== "wali-kelas" && appState.activeTeacherId !== "t-2") {
    assignedSubjects = appState.subjects.filter(s => s.teacherId === appState.activeTeacherId);
  }

  // Preserve selected subject value if valid
  const currentVal = select.value;
  select.innerHTML = "";
  assignedSubjects.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.innerText = s.name;
    select.appendChild(opt);
  });

  if (assignedSubjects.length === 0) {
    const listCont = document.getElementById("tasks-dir-list-container");
    if (listCont) {
      listCont.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0;">
          Tidak ada mata pelajaran yang ditugaskan kepada Anda.
        </div>
      `;
    }
    const rightPane = document.getElementById("tasks-dir-right-pane");
    if (rightPane) {
      rightPane.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:3rem 0;">
          Tidak ada data untuk ditampilkan.
        </div>
      `;
    }
    return;
  }

  if (currentVal && assignedSubjects.find(s => s.id === currentVal)) {
    select.value = currentVal;
  }

  const classSelect = document.getElementById("tasks-dir-class-select");
  const activeSubId = select.value;
  const subject = appState.subjects.find(s => s.id === activeSubId);
  
  if (classSelect) {
    const curClassVal = classSelect.value;
    classSelect.innerHTML = `<option value="ALL">Semua Kelas</option>`;
    const scopedClasses = getClassesForSubjectScope(subject, "ALL");

    scopedClasses.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.innerText = c;
      classSelect.appendChild(opt);
    });

    if (curClassVal && curClassVal !== "ALL" && scopedClasses.includes(curClassVal)) {
      classSelect.value = curClassVal;
    } else {
      classSelect.value = "ALL";
    }
  }
  const selectedClass = classSelect ? classSelect.value : "ALL";
  if (!subject) return;

  if (!subject.tasksDirectory) subject.tasksDirectory = {};

  // Render left panel (Chapters and Tasks)
  const listContainer = document.getElementById("tasks-dir-list-container");
  if (listContainer) {
    listContainer.innerHTML = "";

    const chapters = subject.chapters || [];
    chapters.forEach(ch => {
      // Chapter Header
      const chHeader = document.createElement("div");
      chHeader.className = "task-dir-chapter-header";
      chHeader.style.display = "flex";
      chHeader.style.justifyContent = "space-between";
      chHeader.style.alignItems = "center";
      chHeader.style.gap = "0.5rem";
      
      let isChapterReleased = true;
      let checkTasks = [];
      if (ch.tasks) checkTasks = [...ch.tasks];
      checkTasks.push("Ulangan");
      checkTasks.forEach(t => {
        const key = `${ch.name}_${t}`;
        const tDir = subject.tasksDirectory ? subject.tasksDirectory[key] : null;
        if (selectedClass === "ALL") {
          const scopedClasses = getClassesForSubjectScope(subject, "ALL");
          if (!scopedClasses.every((className) => isDirectoryTaskReleased(tDir, className))) {
            isChapterReleased = false;
          }
        } else {
          if (!isDirectoryTaskReleased(tDir, selectedClass)) {
            isChapterReleased = false;
          }
        }
      });

      chHeader.innerHTML = `
        <span style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0;">
          <span class="material-symbols-rounded" style="font-size:15px; color:var(--indigo); flex-shrink:0;">folder</span>
          <span style="font-weight:800; white-space:nowrap;">${escapeHTML(ch.name)}</span>
        </span>
        <input
          type="text"
          class="task-dir-title-input"
          value="${escapeHTML(ch.title || '')}"
          placeholder="Judul / Topik Bab..."
          title="Nama judul/topik bab ini"
          onblur="saveChapterTitle('${escapeJSAttr(subject.id)}', '${escapeJSAttr(ch.name)}', this.value)"
          onclick="event.stopPropagation()"
          style="flex:1;"
        />

      `;
      listContainer.appendChild(chHeader);

      // List of tasks for this chapter
      const tasks = [];
      if (ch.tasks) {
        ch.tasks.forEach(t => tasks.push({ name: t, type: "task" }));
      }
      
      tasks.push({ name: "Ulangan", type: "ulangan" });

      tasks.forEach(t => {
        const key = `${ch.name}_${t.name}`;
        let tDir = subject.tasksDirectory ? subject.tasksDirectory[key] : null;
        
        // Auto-patch old data that has questions but no mode
        if (tDir && !tDir.mode && tDir.questions && tDir.questions.length > 0) {
          tDir.mode = tDir.questions[0].type || 'essay';
        }

        const isActive = (appState.tasksDirectoryActiveChapter === ch.name && appState.tasksDirectoryActiveTask === t.name);
        const taskStatus = getTaskDirectoryStatus(subject, tDir, selectedClass);
        const hasSavedContent = !!(tDir && (tDir.mode || isTaskDirectoryContentComplete(tDir)));
        const item = document.createElement("div");
        
        item.className = `task-dir-item ${isActive ? "active" : ""}`;
        item.onclick = () => selectTasksDirectoryTask(ch.name, t.name);

        let visibilityHTML = `<div class="task-dir-visibility-row" onclick="event.stopPropagation()">`;
        const scopedClasses = getClassesForSubjectScope(subject, selectedClass);
        const isTaskReleased = selectedClass === "ALL"
          ? scopedClasses.length > 0 && scopedClasses.every((className) => isDirectoryTaskReleased(tDir, className))
          : isDirectoryTaskReleased(tDir, selectedClass);

        visibilityHTML += `
          <div class="task-dir-release-toggle">
            <label class="toggle-switch" style="transform: scale(0.8);">
              <input type="checkbox" ${isTaskReleased ? "checked" : ""} onchange="toggleAllClassesVisibility('${escapeJSAttr(subject.id)}', '${escapeJSAttr(key)}', 'directory', !this.checked, '${escapeJSAttr(selectedClass)}')">
              <span class="toggle-slider"></span>
            </label>
            <span class="hdr-pill-label">Rilis</span>
          </div>
          <div class="task-dir-class-groups">
            ${renderTaskDirectoryClassToggles(subject, subject.id, key, tDir, selectedClass)}
          </div>
        `;
        visibilityHTML += `</div>`;

        item.innerHTML = `
          <div class="task-dir-item-main">
            <span class="task-dir-item-name">
              <span class="material-symbols-rounded">description</span>
              <span>${escapeHTML(t.name)}</span>
            </span>
            <div class="task-dir-item-meta">
              ${taskStatus.mode ? renderTaskDirectoryModeBadge(taskStatus.mode) : ""}
              <span class="task-dir-status-badge task-dir-status-badge--${taskStatus.badgeClass}" title="${escapeHTML(taskStatus.hint)}">${escapeHTML(taskStatus.label)}</span>
              ${hasSavedContent ? `
              <button type="button" onclick="deleteTasksDirectoryTask('${escapeJSAttr(subject.id)}', '${escapeJSAttr(ch.name)}', '${escapeJSAttr(t.name)}'); event.stopPropagation();" class="task-dir-delete-btn" title="Reset tugas">
                <span class="material-symbols-rounded">delete</span>
              </button>
              ` : ""}
            </div>
          </div>
          ${visibilityHTML}
        `;
        listContainer.appendChild(item);
      });
    });
  }

  // Render right panel
  renderTasksDirectoryRightPane(subject);
}

function selectTasksDirectoryTask(chapterName, taskName) {
  appState.tasksDirectoryActiveChapter = chapterName;
  appState.tasksDirectoryActiveTask = taskName;
  appState.tasksDirectoryEditing = false;
  appState.tasksDirectoryQuestions = [];
  renderTasksDirectoryTab();
}

function deleteTasksDirectoryTask(subjectId, chapterName, taskName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus dan mereset seluruh data untuk ${taskName} di ${chapterName}?`)) return;

  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject || !subject.tasksDirectory) return;

  const key = `${chapterName}_${taskName}`;
  delete subject.tasksDirectory[key];

  if (appState.tasksDirectoryActiveChapter === chapterName && appState.tasksDirectoryActiveTask === taskName) {
    appState.tasksDirectoryEditing = false;
    appState.tasksDirectoryQuestions = [];
  }

  saveData();
  renderTasksDirectoryTab();
}

function renameTasksDirectoryChapter(subjectId, oldName) {
  const newName = prompt("Ubah Nama / Judul Bab:", oldName);
  if (newName === null) return; // User cancelled

  const cleanedName = newName.trim();
  if (!cleanedName) {
    alert("Nama bab tidak boleh kosong!");
    return;
  }

  if (cleanedName === oldName) return;

  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  const isExist = subject.chapters.some(c => c.name.toLowerCase() === cleanedName.toLowerCase());
  if (isExist) {
    alert("Bab dengan nama ini sudah ada!");
    return;
  }

  // 1. Rename chapter name in subject.chapters
  const ch = subject.chapters.find(c => c.name === oldName);
  if (ch) {
    ch.name = cleanedName;
  }

  // 2. Rename keys in subject.tasksDirectory
  if (subject.tasksDirectory) {
    const newTasksDirectory = {};
    for (const key of Object.keys(subject.tasksDirectory)) {
      if (key.startsWith(`${oldName}_`)) {
        const remainingKey = key.substring(oldName.length + 1); // after the underscore
        newTasksDirectory[`${cleanedName}_${remainingKey}`] = subject.tasksDirectory[key];
      } else {
        newTasksDirectory[key] = subject.tasksDirectory[key];
      }
    }
    subject.tasksDirectory = newTasksDirectory;
  }

  // 3. Rename in student grades
  appState.students.forEach(st => {
    if (st.grades && st.grades[subjectId] && st.grades[subjectId].chapters) {
      const chapters = st.grades[subjectId].chapters;
      if (chapters[oldName]) {
        chapters[cleanedName] = chapters[oldName];
        delete chapters[oldName];
      }
    }
  });

  // 4. Rename in student lmsSubmissions
  appState.students.forEach(st => {
    if (st.lmsSubmissions) {
      st.lmsSubmissions.forEach(subm => {
        if (subm.subjectId === subjectId && subm.chapterName === oldName) {
          subm.chapterName = cleanedName;
        }
      });
    }
  });

  // 5. Update active chapter state in Tasks Directory if it matches
  if (appState.tasksDirectoryActiveChapter === oldName) {
    appState.tasksDirectoryActiveChapter = cleanedName;
  }

  saveData();
  renderTasksDirectoryTab();
}

function addTasksDirectoryChapter(subjectId) {
  const name = prompt("Masukkan Nama Bab Baru:");
  if (!name || !name.trim()) return;

  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  if (subject.chapters.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    alert("Bab dengan nama tersebut sudah ada!");
    return;
  }

  subject.chapters.push({ name: name.trim(), title: "", tasks: [] });
  saveData();
  renderTasksDirectoryTab();
}

function deleteTasksDirectoryChapter(subjectId, chapterName) {
  if (!confirm(`Hapus bab "${chapterName}" beserta seluruh tugas dan nilainya?`)) return;

  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  subject.chapters = subject.chapters.filter(c => c.name !== chapterName);

  if (subject.tasksDirectory) {
    Object.keys(subject.tasksDirectory).forEach(key => {
      if (key.startsWith(`${chapterName}_`)) delete subject.tasksDirectory[key];
    });
  }

  appState.students.forEach(st => {
    if (st.grades && st.grades[subjectId] && st.grades[subjectId].chapters) {
      delete st.grades[subjectId].chapters[chapterName];
    }
    if (st.lmsSubmissions) {
      st.lmsSubmissions = st.lmsSubmissions.filter(subm => !(subm.subjectId === subjectId && subm.chapterName === chapterName));
    }
  });

  if (appState.tasksDirectoryActiveChapter === chapterName) {
    appState.tasksDirectoryActiveChapter = null;
    appState.tasksDirectoryActiveTask = null;
  }

  saveData();
  renderTasksDirectoryTab();
}

function saveChapterTitle(subjectId, chapterName, newTitle) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;
  const ch = subject.chapters.find(c => c.name === chapterName);
  if (!ch) return;
  ch.title = newTitle.trim();
  saveData();
}

function renderTasksDirectoryRightPane(subject) {
  const container = document.getElementById("tasks-dir-right-pane");
  if (!container) return;

  const chName = appState.tasksDirectoryActiveChapter;
  const tName = appState.tasksDirectoryActiveTask;
  const classSelect = document.getElementById("tasks-dir-class-select");
  const selectedClass = classSelect ? classSelect.value : "ALL";

  if (!chName || !tName) {
    container.innerHTML = `
      <div class="task-dir-empty-state">
        <span class="material-symbols-rounded">folder_open</span>
        <h3>Pusat Direktori Tugas</h3>
        <p>Pilih tugas di panel kiri, lalu tentukan jenisnya (PG, Essay, atau Buku) di sini.</p>
        <ul class="task-dir-empty-steps">
          <li><strong>1.</strong> Pilih tugas dari daftar bab</li>
          <li><strong>2.</strong> Pilih jenis tugas di panel ini</li>
          <li><strong>3.</strong> Isi konten dan simpan</li>
          <li><strong>4.</strong> Aktifkan <em>Rilis</em> per kelas di panel kiri</li>
        </ul>
      </div>
    `;
    return;
  }

  const key = `${chName}_${tName}`;
  const config = subject.tasksDirectory[key] || { theory: "", instruction: "", questions: [] };
  const panelHeader = `
    <div class="task-dir-right-header">
      <div>
        <span class="task-dir-right-eyebrow">${escapeHTML(subject.name)} · ${escapeHTML(chName)}</span>
        <h3>${escapeHTML(tName)}</h3>
      </div>
      ${config.mode ? renderTaskDirectoryModePicker(subject.id, chName, tName, config.mode, "segmented") : ""}
    </div>
    ${renderTaskDirectoryStatusStrip(subject, config, selectedClass)}
  `;

  if (!config.mode) {
    container.innerHTML = `
      <div class="task-dir-right-shell">
        ${panelHeader}
        <div class="task-dir-mode-intro">
          <h4>Pilih Jenis Tugas</h4>
          <p>Setiap tugas hanya memakai satu jenis. Pilih salah satu untuk mulai mengisi konten.</p>
          ${renderTaskDirectoryModePicker(subject.id, chName, tName, null, "cards")}
        </div>
      </div>
    `;
    return;
  }

  if (appState.tasksDirectoryEditing) {
    if (config.mode === 'buku') {
      container.innerHTML = `
        <div class="task-dir-right-shell">
          ${panelHeader}
          <div class="task-dir-editor-card">
          <h3 class="task-dir-editor-title">
            <span class="material-symbols-rounded">auto_stories</span> Kelola Tugas Buku
          </h3>
          <form id="tasks-dir-edit-form" class="task-dir-form" onsubmit="event.preventDefault();">
            <div class="task-dir-form-panel task-dir-form-panel--buku">
              <div class="form-group">
                <label class="task-dir-field-label" for="tasks-dir-edit-buku-title">Judul Buku</label>
                <input type="text" id="tasks-dir-edit-buku-title" class="form-control task-dir-field" placeholder="Contoh: Buku Paket IPA Terpadu Kelas 8" value="${escapeHTML(config.bukuTitle || '')}">
                <span class="task-dir-field-hint">Nama buku atau paket yang dirujuk siswa.</span>
              </div>
              <div class="form-group">
                <label class="task-dir-field-label" for="tasks-dir-edit-instruction">Petunjuk Pengerjaan Soal</label>
                <textarea id="tasks-dir-edit-instruction" class="form-control task-dir-field" rows="4" placeholder="Contoh: Kerjakan soal uji kompetensi bagian A dan B di buku tulis, lalu foto hasilnya.">${escapeHTML(config.instruction || '')}</textarea>
                <span class="task-dir-field-hint">Jelaskan apa yang harus dikerjakan siswa dari buku tersebut.</span>
              </div>
              <div class="task-dir-field-grid">
                <div class="form-group">
                  <label class="task-dir-field-label" for="tasks-dir-edit-buku-start">Halaman Awal</label>
                  <input type="number" id="tasks-dir-edit-buku-start" class="form-control task-dir-field task-dir-field--compact" placeholder="Misal: 12" value="${escapeHTML(config.bukuPageStart || '')}">
                </div>
                <div class="form-group">
                  <label class="task-dir-field-label" for="tasks-dir-edit-buku-end">Halaman Akhir</label>
                  <input type="number" id="tasks-dir-edit-buku-end" class="form-control task-dir-field task-dir-field--compact" placeholder="Misal: 15" value="${escapeHTML(config.bukuPageEnd || '')}">
                </div>
              </div>
            </div>
            <div class="task-dir-editor-actions">
              <div style="display:flex; gap:0.75rem;">
                <button type="button" class="action-btn secondary-btn" onclick="cancelTasksDirectoryTaskEdit()">Batal</button>
                <button type="button" class="action-btn" onclick="saveTasksDirectoryTask()">Simpan</button>
              </div>
            </div>
          </form>
          </div>
        </div>
      `;
      return;
    }

    // RENDER EDITOR WORKSPACE (Google Forms Style)
    let questionsHTML = "";
    if (appState.tasksDirectoryQuestions.length === 0) {
      questionsHTML = `
        <div style="text-align:center; padding: 3rem; background:rgba(255,255,255,0.02); border: 1px dashed var(--border); border-radius: var(--r-md); color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Belum ada pertanyaan. Tambahkan soal dari menu di bawah.
        </div>
      `;
    } else {
      appState.tasksDirectoryQuestions.forEach((q, idx) => {
        let qOptionsHTML = "";
        if (q.type === "pg") {
          qOptionsHTML = `
            <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1rem; margin-bottom:0.5rem;">
              ${[0, 1, 2, 3].map(optIdx => {
                return `
                  <div style="display:flex; align-items:center; gap:0.8rem;">
                    <input type="radio" name="builder-dir-correct-${q.id}" value="${optIdx}" ${q.correctOptionIdx === optIdx ? "checked" : ""}
                      onchange="updateTasksDirectoryQuestionRadio('${q.id}', ${optIdx})" style="cursor:pointer; width:18px; height:18px; accent-color:var(--indigo);" title="Tandai sebagai Jawaban Benar">
                    <input type="text" class="form-control task-dir-field task-dir-field--option"
                      value="${escapeHTML(q.options[optIdx])}" oninput="updateTasksDirectoryQuestionOption('${q.id}', ${optIdx}, this.value)" placeholder="Opsi ${optIdx + 1}">
                  </div>
                `;
              }).join("")}
            </div>
          `;
        }

        // Image section
        let imageHTML = "";
        if (q.image) {
          imageHTML = `
            <div style="margin-top:0.8rem; position:relative; display:inline-block; max-width:max-content;">
              <img src="${q.image}" style="max-height:200px; max-width:100%; border-radius:var(--r-xs); border:1px solid var(--border);">
              <button type="button" style="position:absolute; top:-10px; right:-10px; background:var(--bg-base); border:1px solid var(--border); color:var(--text-secondary); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:var(--shadow-sm);" onclick="deleteTasksDirectoryQuestionImage('${q.id}')">
                <span class="material-symbols-rounded" style="font-size:16px;">close</span>
              </button>
            </div>
          `;
        } else {
          imageHTML = `
            <div style="margin-top:0.5rem; display:flex; align-items:center;">
              <label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; color:var(--text-secondary); font-size:0.85rem; padding: 0.4rem 0.6rem; border-radius: var(--r-xs); transition:background 0.2s, color 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.color='var(--indigo)'" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)'">
                <span class="material-symbols-rounded" style="font-size:20px;">image</span> Sisipkan Gambar
                <input type="file" accept="image/*" style="display:none;" onchange="uploadTasksDirectoryQuestionImage(event, '${q.id}')">
              </label>
            </div>
          `;
        }

        const isPG = q.type === "pg";
        const borderColor = isPG ? "var(--indigo)" : "var(--emerald)";

        questionsHTML += `
          <div class="builder-question-card" style="background:var(--bg-card-solid); border:1px solid var(--border); border-left:4px solid ${borderColor}; border-radius:var(--r-md); padding:1.5rem; margin-bottom:1rem; position:relative; box-shadow:var(--shadow-sm); display:flex; flex-direction:row; gap:1.2rem; align-items:flex-start;">
            
            <!-- Left Side Numbering -->
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding-top:0.3rem;">
              <div style="width:32px; height:32px; border-radius:50%; background:${borderColor}20; border:1px solid ${borderColor}50; color:${borderColor}; display:flex; align-items:center; justify-content:center; font-family:var(--font-heading); font-weight:800; font-size:1.1rem;">
                ${idx + 1}
              </div>
            </div>

            <!-- Main Content Area -->
            <div style="flex:1; display:flex; flex-direction:column; min-width:0;">
              
              <div style="display:flex; gap:1.5rem; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap;">
                
                <!-- Left side: Question Text & Image -->
                <div style="flex:1; min-width:250px; display:flex; flex-direction:column; gap:0.5rem;">
                  <textarea class="form-control task-dir-field" rows="2"
                    placeholder="Tulis pertanyaan di sini" oninput="updateTasksDirectoryQuestionText('${q.id}', this.value); this.style.height='auto'; this.style.height=(this.scrollHeight)+'px';">${escapeHTML(q.questionText)}</textarea>
                  ${imageHTML}
                </div>

                <!-- Right side: Type & Points -->
                <div style="width:220px; display:flex; flex-direction:column; gap:0.5rem; flex-shrink:0;">

                  <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:var(--r-xs); padding:0 0.8rem; height:42px;">
                    <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">Poin:</span>
                    <input type="number" class="form-control task-dir-field task-dir-field--compact" style="max-width:120px;"
                      value="${q.points}" min="1" max="100" oninput="updateTasksDirectoryQuestionPoints('${q.id}', this.value)">
                  </div>
                </div>
              </div>

              <!-- Options (if PG) -->
              ${qOptionsHTML}

              <!-- Footer (Delete) -->
              <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border); padding-top:0.8rem; margin-top:1rem;">
                <button type="button" class="icon-btn" style="color:var(--text-secondary); background:transparent; border:none; width:36px; height:36px;" title="Hapus Soal" onclick="deleteTasksDirectoryQuestion('${q.id}')">
                  <span class="material-symbols-rounded" style="font-size:22px;">delete</span>
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = `
      <div class="task-dir-right-shell">
        ${panelHeader}
        <div class="task-dir-editor-card">
        <h3 class="task-dir-editor-title">
          <span class="material-symbols-rounded">edit_document</span> Formulir ${escapeHTML(TASK_DIRECTORY_MODE_META[config.mode]?.label || "Tugas")}
        </h3>

        <form id="tasks-dir-edit-form" class="task-dir-form" onsubmit="event.preventDefault();">
          
          <div class="task-dir-instruction-panel">
            <label class="task-dir-field-label" for="tasks-dir-edit-instruction">Petunjuk Pengerjaan</label>
            <textarea id="tasks-dir-edit-instruction" class="form-control task-dir-field" rows="3" placeholder="Contoh: Jawablah pertanyaan di bawah ini dengan jujur dan lengkap.">${escapeHTML(config.instruction || '')}</textarea>
            <span class="task-dir-field-hint">Instruksi singkat yang akan dibaca siswa sebelum mengerjakan.</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0;">
            ${questionsHTML}
          </div>

          <!-- Bottom Action Bar (Sticky) -->
          <div class="task-dir-editor-actions task-dir-editor-actions--split">
            <div style="display:flex; gap:0.5rem;">
              ${config.mode === 'essay' ? `
              <button type="button" class="action-btn secondary-btn" onclick="addTasksDirectoryQuestion('essay')">
                <span class="material-symbols-rounded">add_circle</span> Tambah Essay
              </button>
              ` : `
              <button type="button" class="action-btn secondary-btn" onclick="addTasksDirectoryQuestion('pg')">
                <span class="material-symbols-rounded">add_circle</span> Tambah PG
              </button>
              `}
            </div>
            <div style="display:flex; gap:0.75rem;">
              <button type="button" class="action-btn secondary-btn" onclick="cancelTasksDirectoryTaskEdit()">Batal</button>
              <button type="button" class="action-btn" onclick="saveTasksDirectoryTask()">Simpan</button>
            </div>
          </div>
        </form>
        </div>
      </div>
    `;
  } else {
    // RENDER DETAILS / PREVIEW / SUBMISSIONS PANE
    const submissions = config.submissions || {};
    const subKeys = Object.keys(submissions);
    
    let submissionsHTML = "";
    if (subKeys.length === 0) {
      submissionsHTML = `
        <div style="text-align:center; padding: 2rem 0; color: var(--text-muted); font-size: 0.8rem; font-style: italic;">
          Belum ada siswa yang mengumpulkan jawaban untuk tugas ini.
        </div>
      `;
    } else {
      subKeys.forEach(studId => {
        const student = appState.students.find(s => s.id === studId);
        if (!student) return;

        const subData = submissions[studId];
        const isGraded = subData.grade !== null && subData.grade !== undefined;

        let answersDetailHTML = `<div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.25rem;">`;
        if (config.questions && config.questions.length > 0) {
          config.questions.forEach((q, qIdx) => {
            const studAns = subData.answers[q.id];
            if (studAns) {
              if (q.type === "pg") {
                const letter = ["A", "B", "C", "D"][studAns.answer] || "-";
                const correctLetter = ["A", "B", "C", "D"][q.correctOptionIdx] || "-";
                const isCorrect = studAns.isCorrect;
                answersDetailHTML += `
                  <div style="font-size:0.75rem; border-left:3px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}; padding-left:0.5rem;">
                    <strong>Soal ${qIdx + 1}:</strong> ${escapeHTML(q.questionText)}<br>
                    <span style="color:var(--text-secondary);">Jawaban Siswa: <strong style="color:var(--text-primary);">${letter} (${escapeHTML(q.options[studAns.answer] || '')})</strong></span> | 
                    <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">${isCorrect ? 'Benar ✔' : 'Salah ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ (Kunci: ' + correctLetter + ')'}</span>
                    <span style="color:var(--text-muted); font-size:0.7rem; margin-left:0.5rem;">(${studAns.pointsEarned} / ${q.points} Poin)</span>
                  </div>
                `;
              } else {
                answersDetailHTML += `
                  <div style="font-size:0.75rem; border-left:3px solid var(--secondary); padding-left:0.5rem;">
                    <strong>Soal ${qIdx + 1}:</strong> ${escapeHTML(q.questionText)}<br>
                    <span style="color:var(--text-secondary);">Jawaban Siswa:</span>
                    <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:4px; padding:0.35rem; margin-top:0.15rem; white-space:pre-line; color:var(--text-primary);">${escapeHTML(studAns.answer || '')}</div>
                    <span style="color:var(--text-muted); font-size:0.7rem;">(Bobot: ${q.points} Poin)</span>
                  </div>
                `;
              }
            } else {
              answersDetailHTML += `
                <div style="font-size:0.75rem; border-left:3px solid var(--text-muted); padding-left:0.5rem; color:var(--text-muted);">
                  <strong>Soal ${qIdx + 1}:</strong> Tidak dijawab
                </div>
              `;
            }
          });
        }
        answersDetailHTML += `</div>`;

        submissionsHTML += `
          <div style="background:rgba(255,255,255,0.015); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:0.8rem; color:var(--text-primary);">${escapeHTML(student.name)} (${escapeHTML(student.class || '')})</strong>
              <span style="font-size:0.68rem; color:var(--text-muted);">${formatDateTime(new Date(subData.submittedAt))}</span>
            </div>
            ${answersDetailHTML}
            <div style="display:flex; align-items:center; gap:0.5rem; justify-content:flex-end; border-top:1px dashed rgba(255,255,255,0.04); padding-top:0.5rem; margin-top:0.25rem;">
              <span style="font-size:0.75rem; color:var(--text-muted);">Skor Nilai Siswa (0–100):</span>
              <input type="number" min="0" max="100" class="inline-grade-input" style="width:50px; height:26px; font-size:0.8rem; padding:0 4px;"
                value="${isGraded ? subData.grade : ''}"
                placeholder="Input"
                oninput="gradeTasksDirectorySubmission('${escapeJSAttr(subject.id)}', '${escapeJSAttr(chName)}', '${escapeJSAttr(tName)}', '${escapeJSAttr(studId)}', this.value)">
              <span class="status-badge ${isGraded ? 'complete' : 'incomplete'}" style="font-size:0.65rem; padding:1px 6px;">
                ${isGraded ? '✔ Dinilai' : 'ÃƒÂ¢Ã‚ÂÃ‚Â±ÃƒÂ¯Ã‚Â¸Ã‚Â Perlu Diperiksa'}
              </span>
            </div>
          </div>
        `;
      });
    }

    let questionsPreviewHTML = "";
    if (!config.questions || config.questions.length === 0) {
      questionsPreviewHTML = `
        <div style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">
          Belum ada butir soal yang dibuat untuk tugas ini. Siswa akan diarahkan ke petunjuk pengumpulan tugas standard jika mereka mengeklik "Kerjakan".
        </div>
      `;
    } else {
      questionsPreviewHTML = `<div style="display:flex; flex-direction:column; gap:0.6rem;">`;
      config.questions.forEach((q, idx) => {
        const typeLabel = q.type === "pg" ? "Pilihan Ganda" : "Essay";
        let opts = "";
        if (q.type === "pg") {
          opts = `<div style="font-size:0.72rem; color:var(--text-muted); padding-left:1rem; margin-top:0.15rem;">`;
          q.options.forEach((o, oIdx) => {
            const letter = ["A", "B", "C", "D"][oIdx];
            const isCorrect = q.correctOptionIdx === oIdx;
            opts += `<div style="${isCorrect ? 'color:var(--success); font-weight:700;' : ''}">${letter}. ${escapeHTML(o)} ${isCorrect ? '✔' : ''}</div>`;
          });
          opts += `</div>`;
        }

        let imgPreview = "";
        if (q.image) {
          imgPreview = `
            <div style="margin-top:0.35rem;">
              <img src="${q.image}" style="max-height:100px; border:1px solid var(--border); border-radius:4px; object-fit:contain;">
            </div>
          `;
        }

        questionsPreviewHTML += `
          <div style="font-size:0.78rem; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:0.5rem; margin-bottom:0.25rem;">
            <strong>Soal ${idx + 1} (${typeLabel} | ${q.points} Poin):</strong> ${escapeHTML(q.questionText)}
            ${imgPreview}
            ${opts}
          </div>
        `;
      });
      questionsPreviewHTML += `</div>`;
    }


    if (config.mode === 'buku') {
      container.innerHTML = `
        <div class="task-dir-right-shell">
          ${panelHeader}
          <div class="task-dir-preview-card">
          <div class="task-dir-preview-toolbar">
            <h4>Detail Buku</h4>
            <button class="action-btn" onclick="editTasksDirectoryTask()">
              <span class="material-symbols-rounded">edit_note</span> Edit Konten
            </button>
          </div>


          <div>
            <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.35rem;">Judul Buku:</h4>
            <div style="font-size:0.9rem; color:var(--text-primary); font-weight:600; padding:0.5rem 0;">
              ${escapeHTML(config.bukuTitle || 'Belum ada judul buku')}
            </div>
          </div>

          <div>
            <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.35rem;">Petunjuk Pengerjaan Soal:</h4>
            <div style="font-size:0.8rem; color:var(--text-primary); line-height:1.5; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.75rem; white-space:pre-line;">
              ${escapeHTML(config.instruction || 'Belum ada petunjuk tugas khusus disematkan.')}
            </div>
          </div>

          <div style="display:flex; gap:2rem;">
            <div>
              <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.35rem;">Halaman Awal:</h4>
              <div style="font-size:1rem; color:var(--secondary); font-weight:700;">
                ${escapeHTML(config.bukuPageStart || '-')}
              </div>
            </div>
            <div>
              <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.35rem;">Halaman Akhir:</h4>
              <div style="font-size:1rem; color:var(--secondary); font-weight:700;">
                ${escapeHTML(config.bukuPageEnd || '-')}
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top:1rem; margin-top:0.5rem;">
            <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.85rem; color:var(--secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem;">
              Jawaban Pengumpulan Siswa (${subKeys.length})
            </h4>
            ${submissionsHTML}
          </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="task-dir-right-shell">
        ${panelHeader}
        <div class="task-dir-preview-card">
        <div class="task-dir-preview-toolbar">
          <h4>Pratinjau Soal</h4>
          <button class="action-btn" onclick="editTasksDirectoryTask()">
            <span class="material-symbols-rounded">edit_note</span> Edit Konten
          </button>
        </div>

        <div>
          <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.35rem;">Rangkuman Materi Teori:</h4>
          <div style="font-size:0.8rem; color:var(--text-primary); line-height:1.5; background:rgba(0,0,0,0.12); border-radius:var(--radius-sm); padding:0.75rem; white-space:pre-line;">
            ${escapeHTML(config.theory || 'Belum ada penjelasan teori materi disematkan untuk tugas ini.')}
          </div>
        </div>

        <div>
          <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.35rem;">Petunjuk / Deskripsi Tugas:</h4>
          <div style="font-size:0.8rem; color:var(--text-primary); line-height:1.5; background:rgba(0,0,0,0.12); border-radius:var(--radius-sm); padding:0.75rem; white-space:pre-line;">
            ${escapeHTML(config.instruction || 'Belum ada instruksi tugas khusus disematkan.')}
          </div>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
          <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.82rem; color:var(--text-primary); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.25rem;">
            <span class="material-symbols-rounded" style="font-size:16px; color:var(--secondary);">quiz</span> Butir-Butir Soal
          </h4>
          ${questionsPreviewHTML}
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:1rem; margin-top:0.5rem;">
          <h4 style="font-family:var(--font-heading); font-weight:700; font-size:0.85rem; color:var(--secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem;">
            Jawaban Pengumpulan Siswa (${subKeys.length})
          </h4>
          ${submissionsHTML}
        </div>
        </div>
      </div>
    `;
  }
}

function editTasksDirectoryTask() {
  const select = document.getElementById("tasks-dir-subject-select");
  if (!select) return;
  const activeSubId = select.value;
  const subject = appState.subjects.find(s => s.id === activeSubId);
  if (!subject) return;

  const key = `${appState.tasksDirectoryActiveChapter}_${appState.tasksDirectoryActiveTask}`;
  const config = subject.tasksDirectory[key] || { theory: "", instruction: "", questions: [] };

  appState.tasksDirectoryQuestions = JSON.parse(JSON.stringify(config.questions || []));
  appState.tasksDirectoryEditing = true;
  renderTasksDirectoryTab();
}

function cancelTasksDirectoryTaskEdit() {
  appState.tasksDirectoryEditing = false;
  appState.tasksDirectoryQuestions = [];
  renderTasksDirectoryTab();
}

function addTasksDirectoryQuestion(type = "pg") {
  appState.tasksDirectoryQuestions.push({
    id: "q-dir-" + Date.now() + Math.random().toString(36).substr(2, 5),
    type: type,
    questionText: "",
    points: 10,
    options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    correctOptionIdx: 0,
    image: null
  });
  renderTasksDirectoryTab();
}

function deleteTasksDirectoryQuestion(qId) {
  appState.tasksDirectoryQuestions = appState.tasksDirectoryQuestions.filter(q => q.id !== qId);
  renderTasksDirectoryTab();
}

function updateTasksDirectoryQuestionType(qId, type) {
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) {
    q.type = type;
    renderTasksDirectoryTab();
  }
}

function updateTasksDirectoryQuestionPoints(qId, points) {
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) q.points = parseInt(points, 10) || 0;
}

function updateTasksDirectoryQuestionText(qId, text) {
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) q.questionText = text;
}

function updateTasksDirectoryQuestionOption(qId, optIdx, val) {
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) q.options[optIdx] = val;
}

function updateTasksDirectoryQuestionRadio(qId, optIdx) {
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) q.correctOptionIdx = optIdx;
}

async function uploadTasksDirectoryQuestionImage(event, qId) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  const base64 = await readImageAsBase64(file);
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) {
    q.image = base64;
    renderTasksDirectoryTab();
  }
}

function deleteTasksDirectoryQuestionImage(qId) {
  const q = appState.tasksDirectoryQuestions.find(x => x.id === qId);
  if (q) {
    q.image = null;
    renderTasksDirectoryTab();
  }
}

function saveTasksDirectoryTask() {
  const select = document.getElementById("tasks-dir-subject-select");
  if (!select) return;
  const activeSubId = select.value;
  const subject = appState.subjects.find(s => s.id === activeSubId);
  if (!subject) return;

  const chName = appState.tasksDirectoryActiveChapter;
  const tName = appState.tasksDirectoryActiveTask;
  const key = `${chName}_${tName}`;

  if (!subject.tasksDirectory) subject.tasksDirectory = {};
  const oldConfig = subject.tasksDirectory[key] || { submissions: {} };
  const currentMode = oldConfig.mode || 'essay';

  const hiddenClasses = Array.isArray(oldConfig.hiddenClasses)
    ? [...oldConfig.hiddenClasses]
    : getDefaultTaskHiddenClasses();

  if (currentMode === 'buku') {
    const bukuTitle = document.getElementById("tasks-dir-edit-buku-title").value.trim();
    const instruction = document.getElementById("tasks-dir-edit-instruction").value.trim();
    const bukuPageStart = document.getElementById("tasks-dir-edit-buku-start").value.trim();
    const bukuPageEnd = document.getElementById("tasks-dir-edit-buku-end").value.trim();

    if (!bukuTitle && !instruction) {
      alert("Isi judul buku atau petunjuk pengerjaan.");
      return;
    }
    if (!bukuPageStart || !bukuPageEnd) {
      alert("Lengkapi halaman awal dan akhir buku.");
      return;
    }
    
    subject.tasksDirectory[key] = {
      mode: 'buku',
      bukuTitle: bukuTitle,
      instruction: instruction,
      bukuPageStart: bukuPageStart,
      bukuPageEnd: bukuPageEnd,
      questions: [],
      submissions: oldConfig.submissions || {},
      hiddenClasses,
    };
  } else {
    const theoryElem = document.getElementById("tasks-dir-edit-theory");
    const theory = theoryElem ? theoryElem.value.trim() : "";
    const instruction = document.getElementById("tasks-dir-edit-instruction").value.trim();

    // Validate questions
    let invalid = false;
    appState.tasksDirectoryQuestions.forEach(q => {
      if (!q.questionText.trim()) invalid = true;
    });
    if (invalid) {
      alert("Butir pertanyaan/soal tidak boleh kosong!");
      return;
    }

    subject.tasksDirectory[key] = {
      mode: currentMode,
      theory: theory,
      instruction: instruction,
      questions: JSON.parse(JSON.stringify(appState.tasksDirectoryQuestions)),
      submissions: oldConfig.submissions || {},
      hiddenClasses,
    };
  }

  saveData();
  appState.tasksDirectoryEditing = false;
  appState.tasksDirectoryQuestions = [];
  renderTasksDirectoryTab();
  alert("Soal dan materi berhasil disimpan!");
}

function gradeTasksDirectorySubmission(subjectId, chapterName, taskItemName, studentId, value) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject || !subject.tasksDirectory) return;

  const key = `${chapterName}_${taskItemName}`;
  const config = subject.tasksDirectory[key];
  if (!config || !config.submissions || !config.submissions[studentId]) return;

  const parsed = parseInt(value, 10);
  const grade = isNaN(parsed) ? null : Math.max(0, Math.min(100, parsed));

  config.submissions[studentId].grade = grade;

  // Sync back to student's main grades rapor grid
  const student = appState.students.find(s => s.id === studentId);
  if (student && grade !== null) {
    const chGrades = ensureChapterGrades(student, subjectId, chapterName);
    // Find task type
    let taskType = "task";
    if (taskItemName === "Ulangan" || taskItemName === "Ulangan Harian") {
      taskType = "ulangan";
    }

    if (taskType === "task") {
      if (!chGrades.tasks) chGrades.tasks = {};
      chGrades.tasks[taskItemName] = grade;
    } else if (taskType === "ulangan") {
      chGrades.ulangan = grade;
    }

    recalculateSubjectCompleteness(student, subjectId);
  }

  saveData();
  // We don't want to re-render the select subject because it resets state, just update the right pane
  renderTasksDirectoryRightPane(subject);
}


function selectTaskDirectoryMode(subjectId, chapterName, taskName, mode) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject || !TASK_DIRECTORY_MODE_META[mode]) return;
  if (!subject.tasksDirectory) subject.tasksDirectory = {};
  const key = `${chapterName}_${taskName}`;
  ensureTaskDirectoryEntry(subject, key);
  const existing = subject.tasksDirectory[key];

  if (existing.mode === mode && appState.tasksDirectoryEditing
    && appState.tasksDirectoryActiveChapter === chapterName
    && appState.tasksDirectoryActiveTask === taskName) {
    return;
  }

  if (existing.mode && existing.mode !== mode && isTaskDirectoryContentComplete(existing)) {
    const fromLabel = TASK_DIRECTORY_MODE_META[existing.mode].label;
    const toLabel = TASK_DIRECTORY_MODE_META[mode].label;
    if (!confirm(`Ganti jenis tugas dari ${fromLabel} ke ${toLabel}? Konten lama akan dihapus.`)) {
      return;
    }
    const preserved = {
      hiddenClasses: existing.hiddenClasses,
      submissions: existing.submissions || {},
    };
    subject.tasksDirectory[key] = { mode, ...preserved };
  } else {
    subject.tasksDirectory[key].mode = mode;
    if (mode !== "buku") delete subject.tasksDirectory[key].page;
  }

  appState.tasksDirectoryActiveChapter = chapterName;
  appState.tasksDirectoryActiveTask = taskName;

  const config = subject.tasksDirectory[key];
  if (mode === "essay" || mode === "pg") {
    appState.tasksDirectoryQuestions = JSON.parse(JSON.stringify(config.questions || []));
    if (appState.tasksDirectoryQuestions.length === 0) {
      const newQ = {
        id: "q_" + Date.now(),
        type: mode,
        questionText: "",
        points: 10,
        image: null,
      };
      if (mode === "pg") {
        newQ.options = ["", "", "", ""];
        newQ.correctOptionIdx = 0;
      }
      appState.tasksDirectoryQuestions.push(newQ);
    } else {
      appState.tasksDirectoryQuestions.forEach((q) => {
        q.type = mode;
        if (mode === "pg" && !q.options) {
          q.options = ["", "", "", ""];
          q.correctOptionIdx = 0;
        }
      });
    }
  } else {
    appState.tasksDirectoryQuestions = [];
  }

  appState.tasksDirectoryEditing = true;
  saveData({ silent: true });
  renderTasksDirectoryTab();
}

function setTaskMode(subjectId, chapterName, taskName, mode) {
  selectTaskDirectoryMode(subjectId, chapterName, taskName, mode);
}

function setTaskPage(subjectId, chapterName, taskName, page) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;
  if (!subject.tasksDirectory) subject.tasksDirectory = {};
  const key = `${chapterName}_${taskName}`;
  if (!subject.tasksDirectory[key]) subject.tasksDirectory[key] = {};
  subject.tasksDirectory[key].page = page.trim();
  saveData();
  renderTasksDirectoryTab();
}

window.selectTasksDirectoryTask = selectTasksDirectoryTask;
window.selectTaskDirectoryMode = selectTaskDirectoryMode;
window.setTaskMode = setTaskMode;
window.editTasksDirectoryTask = editTasksDirectoryTask;
window.cancelTasksDirectoryTaskEdit = cancelTasksDirectoryTaskEdit;
window.addTasksDirectoryQuestion = addTasksDirectoryQuestion;
window.deleteTasksDirectoryQuestion = deleteTasksDirectoryQuestion;
window.updateTasksDirectoryQuestionType = updateTasksDirectoryQuestionType;
window.updateTasksDirectoryQuestionPoints = updateTasksDirectoryQuestionPoints;
window.updateTasksDirectoryQuestionText = updateTasksDirectoryQuestionText;
window.updateTasksDirectoryQuestionOption = updateTasksDirectoryQuestionOption;
window.updateTasksDirectoryQuestionRadio = updateTasksDirectoryQuestionRadio;
window.uploadTasksDirectoryQuestionImage = uploadTasksDirectoryQuestionImage;
window.deleteTasksDirectoryQuestionImage = deleteTasksDirectoryQuestionImage;
window.saveTasksDirectoryTask = saveTasksDirectoryTask;
window.gradeTasksDirectorySubmission = gradeTasksDirectorySubmission;
window.renameTasksDirectoryChapter = renameTasksDirectoryChapter;
window.saveChapterTitle = saveChapterTitle;

// --- DIREKTORI NILAI (TAB FULL TABLE) LOGIC ---
function formatReportChapterAverage(average) {
  if (average === null || average === undefined || average === '') return '—';
  return average;
}

function getReportSubjectsForTeacher() {
  return getSubjectsForTeacherScope();
}

function syncReportSubjectForClass(className) {
  const subjectDropdown = document.getElementById('report-table-subject');
  if (!subjectDropdown) return null;
  const subject = getReportSubjectForClass(className);
  if (subject) {
    subjectDropdown.value = subject.id;
  }
  const label = document.getElementById('report-page-subject-label');
  if (label) {
    label.textContent = subject
      ? `Mata pelajaran: ${subject.name} · KKM ${subject.kkm}`
      : 'Mata pelajaran: —';
  }
  return subject;
}

function switchReportGradeTab(grade) {
  appState.reportGradeFilter = grade;
  const allClasses = getAllAvailableClasses();
  const gradeClasses = allClasses.filter((c) => c.startsWith(grade));
  const classesWithStudents = [...new Set(appState.students.map((s) => s.class).filter(Boolean))];
  const firstWithStudents = gradeClasses.find((c) => classesWithStudents.includes(c));
  appState.reportClassFilter = firstWithStudents || gradeClasses[0] || appState.reportClassFilter;
  syncReportSubjectForClass(appState.reportClassFilter);
  renderReportTableOptions();
  renderReportTable();
}
window.switchReportGradeTab = switchReportGradeTab;

function switchReportClassTab(className) {
  appState.reportClassFilter = className;
  appState.reportGradeFilter = getGradeFromClassName(className) || appState.reportGradeFilter;
  syncReportSubjectForClass(className);
  renderReportTableOptions();
  renderReportTable();
}
window.switchReportClassTab = switchReportClassTab;

function formatReportScoreDisplay(score) {
  if (!isRecordedScore(score)) return '—';
  return score;
}

function formatReportTaskAverage(tasks) {
  const recorded = (tasks || []).filter((t) => isRecordedScore(t.score)).map((t) => Number(t.score));
  if (recorded.length === 0) return '—';
  return Math.round((recorded.reduce((sum, val) => sum + val, 0) / recorded.length) * 10) / 10;
}

function getReportKeterangan(student, subjectId, calc) {
  if (!hasAnyRecordedGradesForSubject(student, subjectId)) {
    return { text: 'Belum Dinilai', className: 'incomplete' };
  }
  if (calc.isKatrol) {
    return { text: 'Dibawah KKM', className: 'incomplete' };
  }
  return { text: 'Diatas KKM', className: 'complete' };
}

function renderReportTableOptions() {
  const allClasses = getAllAvailableClasses();
  const classesWithStudents = new Set(appState.students.map((s) => s.class).filter(Boolean));
  const gradeTabsContainer = document.getElementById('report-grade-tabs');
  const classTabsContainer = document.getElementById('report-table-class-tabs');

  if (!appState.reportGradeFilter) {
    appState.reportGradeFilter = getGradeFromClassName(appState.reportClassFilter) || '8';
  }

  if (!appState.reportClassFilter || !allClasses.includes(appState.reportClassFilter)) {
    const gradeClasses = allClasses.filter((c) => c.startsWith(appState.reportGradeFilter));
    const firstWithStudents = gradeClasses.find((c) => classesWithStudents.has(c));
    appState.reportClassFilter = firstWithStudents || gradeClasses[0] || allClasses.find((c) => c.startsWith('8')) || allClasses[0] || '8C';
  }

  if (gradeTabsContainer) {
    gradeTabsContainer.innerHTML = ['7', '8', '9'].map((grade) => {
      const count = allClasses.filter((c) => c.startsWith(grade)).length;
      const studentCount = appState.students.filter((s) => (s.class || '').startsWith(grade)).length;
      return `<button type="button" class="report-grade-tab${appState.reportGradeFilter === grade ? ' is-active' : ''}" role="tab" aria-selected="${appState.reportGradeFilter === grade}" onclick="switchReportGradeTab('${grade}')">Kelas ${grade}<span style="opacity:0.7;font-weight:600;"> · ${studentCount} siswa</span></button>`;
    }).join('');
  }

  if (classTabsContainer) {
    const gradeClasses = allClasses.filter((c) => c.startsWith(appState.reportGradeFilter));
    classTabsContainer.innerHTML = gradeClasses.map((className) => {
      const hasStudents = classesWithStudents.has(className);
      const count = appState.students.filter((s) => s.class === className).length;
      const isActive = appState.reportClassFilter === className;
      return `<button type="button" class="report-class-tab${isActive ? ' is-active' : ''}${hasStudents ? '' : ' is-empty'}" role="tab" aria-selected="${isActive}" title="${hasStudents ? `${count} siswa` : 'Belum ada siswa — impor CSV'}" onclick="switchReportClassTab('${escapeJSAttr(className)}')">${escapeHTML(className)}</button>`;
    }).join('');
  }

  const subjectDropdown = document.getElementById('report-table-subject');
  const currentSubj = subjectDropdown?.value;
  const mySubjects = getReportSubjectsForTeacher();

  if (subjectDropdown) {
    let subjHtml = '';
    if (mySubjects.length === 0) {
      subjHtml = '<option value="">Tidak ada mapel</option>';
    } else {
      mySubjects.forEach((s, idx) => {
        subjHtml += `<option value="${escapeHTML(s.id)}" ${(!currentSubj && idx === 0) || currentSubj === s.id ? 'selected' : ''}>${escapeHTML(s.name)}</option>`;
      });
    }
    subjectDropdown.innerHTML = subjHtml;
  }

  syncReportSubjectForClass(appState.reportClassFilter);
}

function renderReportTable() {
  const container = document.getElementById("report-table-container");
  if (!container) return;

  const classFilter = appState.reportClassFilter || "ALL";
  const searchTxt = document.getElementById("report-table-search")?.value.toLowerCase() || '';
  const subject = syncReportSubjectForClass(classFilter);
  const subjectId = subject?.id;

  if (!subjectId) {
    container.innerHTML = `<div class="report-empty-panel"><span class="material-symbols-rounded">menu_book</span><strong>Mapel tidak ditemukan</strong>Tidak ada mata pelajaran untuk tingkat kelas ini.</div>`;
    return;
  }

  let filtered = appState.students.filter(s => {
    if (classFilter !== "ALL" && (s.class || "X-A") !== classFilter) return false;
    if (searchTxt && !(s.name || "").toLowerCase().includes(searchTxt)) return false;
    return true;
  });

  filtered.sort((a,b) => {
    return (a.absentNo || 0) - (b.absentNo || 0) || a.name.localeCompare(b.name);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="report-empty-panel">
        <span class="material-symbols-rounded">groups</span>
        <strong>Belum ada siswa di kelas ${escapeHTML(classFilter)}</strong>
        Impor data siswa lewat menu <em>Kelola Guru & Mapel → Data Siswa Rombel</em>.
      </div>
    `;
    return;
  }

  const chapters = subject.chapters ? subject.chapters.map(ch => ch.name) : [];

  let html = `
    <table class="report-data-table student-table">
      <thead>
        <tr>
          <th class="report-col-no">No</th>
          <th class="report-col-name">Nama Siswa</th>
  `;

  chapters.forEach(ch => {
    html += `<th class="report-col-score">${escapeHTML(ch)}</th>`;
  });

  html += `
          <th class="report-col-score">Keterangan</th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach(student => {
    const calc = calculateStudentSubjectScore(student, subjectId);
    const noAbsen = student.absentNo || "-";
    const keterangan = getReportKeterangan(student, subjectId, calc);

    html += `
      <tr class="clickable-student-row" onclick="openStudentReportCard('${escapeJSAttr(student.id)}')" style="cursor:pointer;" title="Klik untuk lihat rincian nilai">
        <td class="report-col-no">${escapeHTML(String(noAbsen))}</td>
        <td class="report-col-name">${escapeHTML(student.name)}</td>
    `;

    chapters.forEach(chName => {
      const chData = calc.chapters.find(c => c.name === chName);
      const hasScores = chData && chData.average !== null && chData.average !== undefined;
      const avg = formatReportChapterAverage(chData ? chData.average : null);
      const colorStyle = hasScores
        ? (avg < calc.kkm ? 'var(--rose)' : 'var(--emerald)')
        : 'var(--text-muted)';
      html += `<td class="report-col-score" style="color: ${colorStyle};">${avg}</td>`;
    });

    html += `
        <td class="report-col-score">
          <span class="status-badge ${keterangan.className}">${keterangan.text}</span>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

window.renderReportTableOptions = renderReportTableOptions;
window.renderReportTable = renderReportTable;


function openStudentReportCard(studentId) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  const modal = document.getElementById('report-card-modal');
  const subtitle = document.getElementById('report-card-subtitle');
  const body = document.getElementById('report-card-body');

  if (!modal || !body) return;

  if (subtitle) {
    subtitle.innerHTML = 'Rapor Rekapitulasi Nilai Semester - <strong>' + escapeHTML(student.name) + '</strong> (' + escapeHTML(student.class || '-') + ')';
  }

  const validSubjects = getSubjectsForStudent(student);

  if (validSubjects.length === 0) {
    body.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Belum ada mata pelajaran untuk kelas ini.</div>';
    modal.style.display = 'flex';
    return;
  }

  let html = `
    <div style="overflow-x: auto;">
      <table class="report-table" style="width: 100%; border-collapse: collapse; min-width: 560px;">
        <thead>
          <tr style="background: var(--surface-1, rgba(0,0,0,0.03));">
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid var(--border-color); color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;">Mata Pelajaran</th>
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid var(--border-color); color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;">Bab</th>
            <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;">Tugas</th>
            <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;">UH</th>
            <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
  `;

  let hasRows = false;

  validSubjects.forEach((subject) => {
    const calc = calculateStudentSubjectScore(student, subject.id);
    const chapterRows = calc.chapters || [];

    if (chapterRows.length === 0) {
      html += `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px; font-weight: 600;">${escapeHTML(subject.name)}</td>
          <td colspan="4" style="padding: 12px; color: var(--text-muted); font-style: italic;">Belum ada bab</td>
        </tr>
      `;
      return;
    }

    chapterRows.forEach((ch, idx) => {
      const taskAvg = formatReportTaskAverage(ch.tasks);
      const uhScore = formatReportScoreDisplay(ch.ulangan);
      const avgDisplay = formatReportChapterAverage(ch.average);
      const hasChapterScore = ch.average !== null && ch.average !== undefined;
      const avgColor = hasChapterScore
        ? (ch.average < calc.kkm ? 'var(--rose, var(--danger))' : 'var(--emerald, var(--success))')
        : 'var(--text-muted)';

      hasRows = true;

      html += `
        <tr style="border-bottom: 1px solid var(--border-color);">
          ${idx === 0 ? `<td rowspan="${chapterRows.length}" style="padding: 12px; font-weight: 700; vertical-align: top; background: var(--surface-0, transparent);">${escapeHTML(subject.name)}<div style="font-size:0.68rem; color:var(--text-muted); font-weight:500; margin-top:4px;">KKM ${calc.kkm}</div></td>` : ''}
          <td style="padding: 12px;">${escapeHTML(ch.name)}</td>
          <td style="padding: 12px; text-align: center; font-weight: 600;">${taskAvg}</td>
          <td style="padding: 12px; text-align: center; font-weight: 600;">${uhScore}</td>
          <td style="padding: 12px; text-align: center; font-weight: 800; color: ${avgColor};">${hasChapterScore ? avgDisplay : '—'}</td>
        </tr>
      `;
    });

    const subjectAvgColor = calc.asli > 0
      ? (calc.isKatrol ? 'var(--amber)' : (calc.asli >= calc.kkm ? 'var(--emerald, var(--success))' : 'var(--rose, var(--danger))'))
      : 'var(--text-muted)';
    const subjectAvgLabel = calc.asli > 0
      ? (calc.isKatrol ? `${calc.akhir} (katrol)` : calc.akhir)
      : '—';

    html += `
      <tr style="background: var(--surface-1, rgba(0,0,0,0.02)); border-bottom: 2px solid var(--border-color);">
        <td colspan="4" style="padding: 10px 12px; text-align: right; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">Rata-rata ${escapeHTML(subject.name)}</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 800; color: ${subjectAvgColor};">${subjectAvgLabel}</td>
      </tr>
    `;
  });

  if (!hasRows) {
    html += '<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">Belum ada data nilai.</td></tr>';
  }

  html += '</tbody></table></div>';
  body.innerHTML = html;

  modal.style.display = 'flex';
}

function closeStudentReportCard() {
  const modal = document.getElementById('report-card-modal');
  if (modal) modal.style.display = 'none';
}

window.openStudentReportCard = openStudentReportCard;
window.closeStudentReportCard = closeStudentReportCard;

function exportAveragesToExcel() {
  const subjectId = document.getElementById("report-table-subject").value;
  if (!subjectId) {
    alert("Pilih mata pelajaran terlebih dahulu.");
    return;
  }
  
  const classFilter = appState.reportClassFilter || "ALL";
  const searchTxt = document.getElementById("report-table-search").value.toLowerCase();
  
  let filtered = appState.students.filter(s => {
    if (classFilter !== "ALL" && (s.class || "X-A") !== classFilter) return false;
    if (searchTxt && !(s.name || "").toLowerCase().includes(searchTxt)) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    alert("Tidak ada data siswa untuk diekspor.");
    return;
  }
  
  filtered.sort((a,b) => {
    const cA = a.class || "X-A";
    const cB = b.class || "X-A";
    if (cA !== cB) return cA.localeCompare(cB);
    return a.name.localeCompare(b.name);
  });
  
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;
  const chapters = subject.chapters ? subject.chapters.map(ch => ch.name) : [];
  
  const headers = ["No", "Nama Siswa", "Kelas"];
  chapters.forEach(ch => {
    headers.push(ch);
  });
  headers.push("Keterangan");
  
  const csvRows = [];
  csvRows.push("\uFEFF" + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));
  
  filtered.forEach((student, index) => {
    const row = [
      index + 1,
      student.name,
      student.class || "-"
    ];
    
    const calc = calculateStudentSubjectScore(student, subjectId);
    
    chapters.forEach(chName => {
      const chData = calc.chapters.find(c => c.name === chName);
      row.push(formatReportChapterAverage(chData ? chData.average : null));
    });
    
    const keterangan = getReportKeterangan(student, subjectId, calc);
    row.push(keterangan.text);
    
    csvRows.push(row.map(val => {
      const strVal = String(val);
      if (strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(","));
  });
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const hr = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const dateStr = `${d}-${m}-${y}_${hr}-${min}-${sec}`;
  const classLabel = classFilter === "ALL" ? "Semua_Kelas" : classFilter;
  const safeSubjName = subject.name.replace(/[^a-z0-9]/gi, '_');
  
  a.href = url;
  a.download = `R.${safeSubjName}_${classLabel}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.exportAveragesToExcel = exportAveragesToExcel;
window.actualSwitchView = actualSwitchView;
window.openRoleSelectionModal = openRoleSelectionModal;
window.switchView = switchView;
window.syncModeToggleActive = syncModeToggleActive;

