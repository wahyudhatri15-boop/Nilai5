// routes/teacher.js — endpoint guru (butuh kunci guru)

const express = require('express');
const teacherAuth = require('../middleware/teacherAuth');
const { loadFullAppState, updateAppState } = require('../lib/stateManager');
const { isRecordedScore } = require('../lib/gradeUtils');

const router = express.Router();

// Semua route di sini memerlukan kunci guru
router.use(teacherAuth);

// ── Helper: validasi kunci guru ───────────────────────────────────────────────
async function resolveTeacher(state, teacherKey) {
  const teacher = (state.teachers || []).find((t) => t.key === teacherKey);
  if (!teacher) {
    const err = new Error('Kunci guru tidak valid');
    err.status = 403;
    throw err;
  }
  return teacher;
}

// ── Data guru + mata pelajaran yang diampu ────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const state = await loadFullAppState();
    const teacher = await resolveTeacher(state, req.teacherKey);
    const subjects = (state.subjects || []).filter((s) => s.teacherId === teacher.id);
    res.json({ teacher: { id: teacher.id, name: teacher.name, classes: teacher.classes }, subjects });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Nilai siswa untuk sebuah mata pelajaran ───────────────────────────────────
router.get('/grades/:subjectId', async (req, res) => {
  try {
    const state = await loadFullAppState();
    const teacher = await resolveTeacher(state, req.teacherKey);
    const subject = (state.subjects || []).find((s) => s.id === req.params.subjectId);
    if (!subject) return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
    if (subject.teacherId !== teacher.id)
      return res.status(403).json({ error: 'Mata pelajaran bukan milik Anda' });

    const students = (state.students || []).map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      absentNo: s.absentNo,
      grades: s.grades?.[subject.id] || {},
      completeness: s.completeness?.[subject.id] || false,
    }));

    res.json({ subject, students });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Beri nilai essay / manual ─────────────────────────────────────────────────
router.post('/grade', async (req, res) => {
  try {
    const { studentId, subjectId, chapterName, taskType, taskItemName, grade } = req.body;
    if (!studentId || !subjectId || grade === undefined || grade === null) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const result = await updateAppState((state) => {
      const teacher = (state.teachers || []).find((t) => t.key === req.teacherKey);
      if (!teacher) {
        const err = new Error('Kunci guru tidak valid');
        err.status = 403;
        throw err;
      }
      const subject = (state.subjects || []).find((s) => s.id === subjectId);
      if (!subject || subject.teacherId !== teacher.id) {
        const err = new Error('Mata pelajaran bukan milik Anda');
        err.status = 403;
        throw err;
      }
      const student = (state.students || []).find((s) => s.id === studentId);
      if (!student) {
        const err = new Error('Siswa tidak ditemukan');
        err.status = 404;
        throw err;
      }

      if (!student.grades) student.grades = {};
      if (!student.grades[subjectId]) student.grades[subjectId] = { chapters: {} };
      const ch = chapterName || 'Umum';
      if (!student.grades[subjectId].chapters[ch])
        student.grades[subjectId].chapters[ch] = { tasks: {} };

      if (taskType === 'ulangan') {
        student.grades[subjectId].chapters[ch].ulangan = Number(grade);
      } else {
        const key = taskItemName || taskType || 'tugas';
        student.grades[subjectId].chapters[ch].tasks[key] = Number(grade);
      }

      return { success: true };
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Tulis state penuh (replace) ───────────────────────────────────────────────
router.put('/state', async (req, res) => {
  try {
    const newState = req.body;
    if (!newState || typeof newState !== 'object') {
      return res.status(400).json({ error: 'Body harus berupa JSON object' });
    }
    const result = await updateAppState((state) => {
      // Validate that the teacher exists (check newState first in case backend state is empty)
      const allTeachers = (state.teachers && state.teachers.length > 0) ? state.teachers : (newState.teachers || []);
      const teacher = allTeachers.find((t) => t.key === req.teacherKey);
      if (!teacher) {
        const err = new Error('Kunci guru tidak valid');
        err.status = 403;
        throw err;
      }
      Object.assign(state, newState);
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Daftar submission tugas / ujian ──────────────────────────────────────────
router.get('/submissions/:subjectId', async (req, res) => {
  try {
    const state = await loadFullAppState();
    const teacher = await resolveTeacher(state, req.teacherKey);
    const subject = (state.subjects || []).find((s) => s.id === req.params.subjectId);
    if (!subject) return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
    if (subject.teacherId !== teacher.id)
      return res.status(403).json({ error: 'Mata pelajaran bukan milik Anda' });

    res.json({
      onlineAssignments: subject.onlineAssignments || [],
      onlineExams: subject.onlineExams || [],
      tasksDirectory: subject.tasksDirectory || {},
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
