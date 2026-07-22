// lib/stateManager.js — manajemen state aplikasi (baca/tulis via Supabase)

const { readState, writeState } = require('./supabaseStore');

let cache = null;
let cacheTs = 0;
const CACHE_TTL_MS = 5000; // 5 detik

/**
 * Membaca seluruh state aplikasi.
 * Menggunakan cache singkat agar tidak terlalu sering hit Supabase.
 * @returns {Promise<object>}
 */
async function loadFullAppState() {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_TTL_MS) {
    return cache;
  }
  cache = await readState();
  cacheTs = now;
  return cache;
}

/**
 * Membaca state, menjalankan mutasi, lalu menyimpan kembali.
 * @param {function(object): *} mutatorFn  Fungsi yang memodifikasi state dan boleh return nilai.
 * @returns {Promise<*>} nilai kembalian dari mutatorFn
 */
async function updateAppState(mutatorFn) {
  const state = await readState(); // selalu baca fresh saat mutasi
  const result = await mutatorFn(state);
  await writeState(state);
  cache = state;
  cacheTs = Date.now();
  return result;
}

// ── Helpers klasifikasi & filter ──────────────────────────────────────────────

/**
 * Mengecek apakah nama mata pelajaran berlaku untuk kelas tertentu.
 * Konvensi: nama mapel yang mengandung "[X]" hanya untuk kelas X.
 * Jika tidak ada penanda kelas, berlaku untuk semua.
 */
function isSubjectValidForStudentClass(subjectName, className) {
  if (!subjectName || !className) return false;
  const match = subjectName.match(/\[([^\]]+)\]/);
  if (!match) return true; // tidak ada penanda → berlaku semua kelas
  const allowedClasses = match[1].split(',').map((c) => c.trim());
  return allowedClasses.some((c) => className.startsWith(c) || className === c);
}

/**
 * Mengembalikan daftar mata pelajaran yang tersedia untuk seorang siswa.
 */
function getSubjectsForStudent(state, student) {
  if (!student) return [];
  return (state.subjects || []).filter((s) =>
    isSubjectValidForStudentClass(s.name, student.class)
  );
}

/**
 * Menentukan apakah sebuah tugas (dari tasksDirectory) sudah dirilis untuk kelas tertentu.
 */
function isTaskReleasedForClass(task, className, allClasses) {
  if (!task) return false;
  if (!task.hiddenClasses || task.hiddenClasses.length === 0) return true;
  if (className === 'ALL') {
    // Dirilis setidaknya untuk satu kelas
    const totalClasses = (allClasses || []).length;
    return task.hiddenClasses.length < totalClasses;
  }
  return !task.hiddenClasses.includes(className);
}

// ── Sanitizers ────────────────────────────────────────────────────────────────

function sanitizeQuestionForPublic(q) {
  if (!q) return q;
  const { correctOptionIdx, correct, ...rest } = q;
  return rest;
}

function sanitizeOnlineAssignmentForPublic(a) {
  if (!a) return a;
  const { submissions, ...rest } = a;
  if (rest.questions) {
    rest.questions = rest.questions.map(sanitizeQuestionForPublic);
  }
  return rest;
}

function sanitizeOnlineExamForPublic(e) {
  if (!e) return e;
  const { submissions, questionBank, ...rest } = e;
  return rest;
}

function sanitizeSubjectForStudentPortal(subject, student, allClasses) {
  if (!subject) return subject;
  return {
    id: subject.id,
    name: subject.name,
    teacherId: subject.teacherId,
    kkm: subject.kkm,
    chapters: subject.chapters || [],
    onlineAssignments: (subject.onlineAssignments || [])
      .filter((a) => !a.hiddenClasses?.includes(student.class))
      .map(sanitizeOnlineAssignmentForPublic),
    onlineExams: (subject.onlineExams || [])
      .filter((e) => !e.hiddenClasses?.includes(student.class))
      .map(sanitizeOnlineExamForPublic),
  };
}

/**
 * Membangun key material LMS dari taskType dan taskItemName.
 * Contoh: 'materi', 'video', 'tugas', 'ulangan', 'pg'
 */
function resolveLmsMaterialKey(taskType, taskItemName) {
  if (taskItemName) return taskItemName;
  return taskType || 'tugas';
}

// ── Mutasi grades ─────────────────────────────────────────────────────────────

function applyGradeToStudentChapter(student, subject, chapterName, taskType, taskItemName, grade) {
  if (!student.grades) student.grades = {};
  if (!student.grades[subject.id]) student.grades[subject.id] = { chapters: {} };
  if (!student.grades[subject.id].chapters[chapterName]) {
    student.grades[subject.id].chapters[chapterName] = { tasks: {} };
  }

  const ch = student.grades[subject.id].chapters[chapterName];

  if (taskType === 'ulangan') {
    ch.ulangan = grade;
  } else {
    if (!ch.tasks) ch.tasks = {};
    const key = taskItemName || taskType;
    ch.tasks[key] = grade;
  }

  recalculateSubjectCompleteness(student, subject);
}

function recalculateSubjectCompleteness(student, subject) {
  if (!student.completeness) student.completeness = {};
  const grades = student.grades?.[subject.id];
  if (!grades) {
    student.completeness[subject.id] = false;
    return;
  }

  const chapters = subject.chapters || [];
  if (chapters.length === 0) {
    student.completeness[subject.id] = true;
    return;
  }

  const allComplete = chapters.every((ch) => {
    const chGrades = grades.chapters?.[ch.name];
    if (!chGrades) return false;
    return chGrades.ulangan !== undefined && chGrades.ulangan !== null;
  });

  student.completeness[subject.id] = allComplete;
}

module.exports = {
  loadFullAppState,
  updateAppState,
  isSubjectValidForStudentClass,
  getSubjectsForStudent,
  isTaskReleasedForClass,
  sanitizeSubjectForStudentPortal,
  sanitizeOnlineAssignmentForPublic,
  sanitizeOnlineExamForPublic,
  sanitizeQuestionForPublic,
  resolveLmsMaterialKey,
  applyGradeToStudentChapter,
  recalculateSubjectCompleteness,
};
