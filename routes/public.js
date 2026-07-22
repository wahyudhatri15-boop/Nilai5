// routes/public.js — endpoint publik (murid, tanpa login)

const express = require('express');
const {
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
} = require('../lib/stateManager');
const { isRecordedScore } = require('../lib/gradeUtils');

const router = express.Router();

function sanitizeBootstrapSubject(subject, allClasses) {
  return {
    id: subject.id,
    name: subject.name,
    teacherId: subject.teacherId,
    kkm: subject.kkm,
    chapters: subject.chapters || [],
    tasksDirectory: sanitizeTaskDirectoryAllClasses(subject.tasksDirectory, allClasses),
    onlineAssignments: (subject.onlineAssignments || [])
      .filter((a) => !a.hiddenClasses || a.hiddenClasses.length < (allClasses || []).length)
      .map((a) => sanitizeOnlineAssignmentForPublic(a)),
    onlineExams: (subject.onlineExams || [])
      .filter((e) => !e.hiddenClasses || e.hiddenClasses.length < (allClasses || []).length)
      .map((e) => sanitizeOnlineExamForPublic(e)),
  };
}

function sanitizeTaskDirectoryAllClasses(tasksDirectory, allClasses) {
  if (!tasksDirectory) return {};
  const result = {};
  for (const [key, task] of Object.entries(tasksDirectory)) {
    const isReleased = isTaskReleasedForClass(task, 'ALL', allClasses);
    if (!isReleased) continue;

    result[key] = {
      mode: task.mode || 'essay',
      theory: task.theory || '',
      instruction: task.instruction || '',
      bukuTitle: task.bukuTitle || '',
      bukuPageStart: task.bukuPageStart || '',
      bukuPageEnd: task.bukuPageEnd || '',
      hiddenClasses: task.hiddenClasses || [],
      questions: (task.questions || []).map(sanitizeQuestionForPublic),
    };
  }
  return result;
}

function findStudentOrFail(state, studentId) {
  return (state.students || []).find((s) => s.id === studentId) || null;
}

function findSubjectOrFail(state, subjectId) {
  return (state.subjects || []).find((s) => s.id === subjectId) || null;
}

function assertStudentSubjectAccess(state, student, subject) {
  if (!student || !subject) {
    const err = new Error('Siswa atau mata pelajaran tidak ditemukan');
    err.status = 404;
    throw err;
  }
  if (!isSubjectValidForStudentClass(subject.name, student.class)) {
    const err = new Error('Mata pelajaran tidak tersedia untuk kelas siswa ini');
    err.status = 403;
    throw err;
  }
  const allowed = getSubjectsForStudent(state, student);
  if (!allowed.some((s) => s.id === subject.id)) {
    const err = new Error('Mata pelajaran tidak diampu untuk kelas siswa ini');
    err.status = 403;
    throw err;
  }
}

router.get('/bootstrap', async (req, res) => {
  try {
    const state = await loadFullAppState();
    const classFilter = req.query.class;
    const teachers = (state.teachers || []).map((t) => ({
      id: t.id,
      name: t.name,
      classes: t.classes,
    }));

    let subjects = (state.subjects || []).map((s) => sanitizeBootstrapSubject(s, state.classes));

    if (classFilter) {
      subjects = subjects
        .filter((s) => isSubjectValidForStudentClass(s.name, classFilter))
        .map((s) => {
          const full = (state.subjects || []).find((sub) => sub.id === s.id);
          if (!full) return s;
          return sanitizeBootstrapSubject(full, state.classes);
        });
    }

    res.json({
      academicYear: state.academicYear,
      semester: state.semester,
      publishGrades: state.publishGrades,
      classes: state.classes || [],
      teachers,
      subjects,
      students: (state.students || []).map((s) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        gender: s.gender,
        absentNo: s.absentNo,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes', async (_req, res) => {
  try {
    const state = await loadFullAppState();
    res.json(state.classes || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/students', async (req, res) => {
  try {
    const className = req.query.class;
    const state = await loadFullAppState();
    let students = state.students || [];
    if (className) {
      students = students.filter((s) => s.class === className);
    }
    res.json(
      students.map((s) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        gender: s.gender,
        absentNo: s.absentNo,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:id', async (req, res) => {
  try {
    const state = await loadFullAppState();
    const student = findStudentOrFail(state, req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    const subjects = getSubjectsForStudent(state, student).map((s) =>
      sanitizeSubjectForStudentPortal(s, student, state.classes)
    );

    res.json({
      student: {
        id: student.id,
        name: student.name,
        class: student.class,
        gender: student.gender,
        absentNo: student.absentNo,
        grades: state.publishGrades ? (student.grades || {}) : {},
        completeness: student.completeness || {},
      },
      publishGrades: state.publishGrades,
      subjects,
      teachers: (state.teachers || []).map((t) => ({ id: t.id, name: t.name, classes: t.classes })),
      academicYear: state.academicYear,
      semester: state.semester,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/curriculum', async (req, res) => {
  try {
    const className = req.query.class;
    if (!className) {
      return res.status(400).json({ error: 'Parameter class diperlukan' });
    }

    const state = await loadFullAppState();
    const subjects = (state.subjects || [])
      .filter((s) => isSubjectValidForStudentClass(s.name, className))
      .map((s) => {
        const tasksDirectory = {};
        for (const [key, task] of Object.entries(s.tasksDirectory || {})) {
          if (!isTaskReleasedForClass(task, className, state.classes)) continue;
          tasksDirectory[key] = {
            mode: task.mode || 'essay',
            theory: task.theory || '',
            instruction: task.instruction || '',
            bukuTitle: task.bukuTitle || '',
            bukuPageStart: task.bukuPageStart || '',
            bukuPageEnd: task.bukuPageEnd || '',
            questions: (task.questions || []).map(sanitizeQuestionForPublic),
          };
        }
        return {
          id: s.id,
          name: s.name,
          teacherId: s.teacherId,
          kkm: s.kkm,
          chapters: s.chapters || [],
          tasksDirectory,
        };
      });

    res.json({ className, subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lms/submit', async (req, res) => {
  try {
    const {
      studentId,
      subjectId,
      chapterName,
      taskType,
      taskItemName,
      answers,
    } = req.body;

    if (!studentId || !subjectId || !chapterName || !taskType) {
      return res.status(400).json({ error: 'Data pengumpulan tidak lengkap' });
    }

    const result = await updateAppState((state) => {
      const student = findStudentOrFail(state, studentId);
      const subject = findSubjectOrFail(state, subjectId);
      assertStudentSubjectAccess(state, student, subject);

      const materialKey = resolveLmsMaterialKey(taskType, taskItemName);
      const key = `${chapterName}_${materialKey}`;
      const customConfig = subject.tasksDirectory?.[key];

      if (!customConfig || !isTaskReleasedForClass(customConfig, student.class, state.classes)) {
        const err = new Error('Tugas belum dirilis untuk kelas Anda');
        err.status = 403;
        throw err;
      }

      let finalGrade = null;
      let hasEssay = false;
      const answersData = {};

      if (customConfig.questions && customConfig.questions.length > 0) {
        let autoScore = 0;
        let totalPoints = 0;

        for (const q of customConfig.questions) {
          totalPoints += q.points || 0;
          if (q.type === 'pg') {
            const selectedIdx = answers?.[q.id]?.answer;
            if (selectedIdx === undefined || selectedIdx === null) {
              const err = new Error('Harap lengkapi semua jawaban PG');
              err.status = 400;
              throw err;
            }
            const isCorrect = selectedIdx === q.correctOptionIdx;
            answersData[q.id] = {
              type: 'pg',
              answer: selectedIdx,
              isCorrect,
              pointsEarned: isCorrect ? q.points : 0,
            };
            if (isCorrect) autoScore += q.points;
          } else {
            answersData[q.id] = {
              type: q.type || 'essay',
              answer: answers?.[q.id]?.answer || 'Dikerjakan di buku latihan',
              pointsEarned: null,
            };
            hasEssay = true;
          }
        }

        if (!hasEssay) {
          finalGrade = totalPoints > 0 ? Math.round((autoScore / totalPoints) * 100) : 100;
        }
      } else {
        answersData.legacy = { answer: 'Selesai dibaca/dikerjakan' };
        hasEssay = true;
      }

      if (!customConfig.submissions) customConfig.submissions = {};
      customConfig.submissions[studentId] = {
        answers: answersData,
        submittedAt: new Date().toISOString(),
        grade: finalGrade,
      };

      if (isRecordedScore(finalGrade)) {
        applyGradeToStudentChapter(student, subject, chapterName, taskType, taskItemName, finalGrade);
      } else {
        recalculateSubjectCompleteness(student, subject);
      }

      return {
        success: true,
        grade: finalGrade,
        hasEssay,
        message: hasEssay
          ? 'Tugas berhasil dikumpulkan! Silakan tunggu guru memeriksa.'
          : `Tugas berhasil dikumpulkan! Nilai otomatis: ${finalGrade}`,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/assignment/submit', async (req, res) => {
  try {
    const { studentId, subjectId, assignmentId, answers, legacyAnswer } = req.body;

    if (!studentId || !subjectId || !assignmentId) {
      return res.status(400).json({ error: 'Data pengumpulan tidak lengkap' });
    }

    const result = await updateAppState((state) => {
      const student = findStudentOrFail(state, studentId);
      const subject = findSubjectOrFail(state, subjectId);
      assertStudentSubjectAccess(state, student, subject);

      const assignment = (subject.onlineAssignments || []).find((a) => a.id === assignmentId);
      if (!assignment) {
        const err = new Error('Tugas daring tidak ditemukan');
        err.status = 404;
        throw err;
      }
      if (assignment.hiddenClasses?.includes(student.class)) {
        const err = new Error('Tugas daring tidak tersedia untuk kelas Anda');
        err.status = 403;
        throw err;
      }

      const now = new Date();
      const endTime = new Date(assignment.endTime);
      if (assignment.endTime && now > endTime) {
        const err = new Error('Batas waktu tugas daring sudah berakhir');
        err.status = 403;
        throw err;
      }

      if (assignment.submissions?.[studentId]) {
        const err = new Error('Tugas daring sudah pernah dikumpulkan');
        err.status = 409;
        throw err;
      }

      let answersData = {};
      let autoScore = 0;
      let totalPoints = 0;
      let hasEssay = false;

      if (assignment.questions && assignment.questions.length > 0) {
        for (const q of assignment.questions) {
          totalPoints += q.points || 0;
          if (q.type === 'pg') {
            const selectedIdx = answers?.[q.id]?.answer;
            if (selectedIdx === undefined || selectedIdx === null) {
              const err = new Error('Harap lengkapi semua jawaban PG');
              err.status = 400;
              throw err;
            }
            const isCorrect = selectedIdx === q.correctOptionIdx;
            answersData[q.id] = {
              type: 'pg',
              answer: selectedIdx,
              isCorrect,
              pointsEarned: isCorrect ? q.points : 0,
            };
            if (isCorrect) autoScore += q.points;
          } else {
            const essayAnswer = answers?.[q.id]?.answer;
            if (!essayAnswer || !String(essayAnswer).trim()) {
              const err = new Error('Harap lengkapi semua jawaban essay');
              err.status = 400;
              throw err;
            }
            answersData[q.id] = {
              type: 'essay',
              answer: String(essayAnswer).trim(),
              pointsEarned: null,
            };
            hasEssay = true;
          }
        }
      } else {
        const answerVal = legacyAnswer || answers?.legacy?.answer;
        if (!answerVal || !String(answerVal).trim()) {
          const err = new Error('Harap masukkan jawaban tugas Anda');
          err.status = 400;
          throw err;
        }
        answersData = String(answerVal).trim();
      }

      let finalGrade = null;
      if (assignment.questions && assignment.questions.length > 0 && !hasEssay) {
        finalGrade = totalPoints > 0 ? Math.round((autoScore / totalPoints) * 100) : 100;
      }

      if (!assignment.submissions) assignment.submissions = {};
      assignment.submissions[studentId] = {
        answers: answersData,
        submittedAt: new Date().toISOString(),
        grade: finalGrade,
      };

      let message;
      if (assignment.questions && assignment.questions.length > 0) {
        message = hasEssay
          ? 'Tugas daring berhasil dikumpulkan! Nilai PG terhitung otomatis, silakan tunggu guru memeriksa jawaban essay Anda.'
          : `Tugas daring berhasil dikumpulkan! Nilai otomatis: ${finalGrade}`;
      } else {
        message = 'Tugas daring berhasil dikumpulkan! Silakan tunggu guru memberikan penilaian.';
      }

      return { success: true, grade: finalGrade, hasEssay, message };
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/cbt/submit', async (req, res) => {
  try {
    const {
      studentId,
      subjectId,
      examId,
      answers,
      questionPackage,
      isCheated,
      cheatCount,
    } = req.body;

    if (!studentId || !subjectId || !examId) {
      return res.status(400).json({ error: 'Data pengumpulan ujian tidak lengkap' });
    }

    const result = await updateAppState((state) => {
      const student = findStudentOrFail(state, studentId);
      const subject = findSubjectOrFail(state, subjectId);
      assertStudentSubjectAccess(state, student, subject);

      const exam = (subject.onlineExams || []).find((e) => e.id === examId);
      if (!exam) {
        const err = new Error('Ujian CBT tidak ditemukan');
        err.status = 404;
        throw err;
      }
      if (exam.hiddenClasses?.includes(student.class)) {
        const err = new Error('Ujian CBT tidak tersedia untuk kelas Anda');
        err.status = 403;
        throw err;
      }
      if (exam.submissions?.[studentId]) {
        const err = new Error('Ujian CBT sudah pernah dikumpulkan');
        err.status = 409;
        throw err;
      }

      const submittedAnswers = answers || {};
      let pgCount = 0;
      let pgCorrect = 0;

      (exam.questionBank || []).forEach((q) => {
        if (q.type === 'pg') {
          pgCount += 1;
          const ans = submittedAnswers[q.id];
          if (ans !== undefined && parseInt(ans, 10) === q.correct) {
            pgCorrect += 1;
          }
        }
      });

      const cheated = Boolean(isCheated);
      const autoGradePg = pgCount > 0 ? Math.round((pgCorrect / pgCount) * 100) : null;
      const allPg = pgCount === (exam.questionBank || []).length && pgCount > 0;

      if (!exam.submissions) exam.submissions = {};
      exam.submissions[studentId] = {
        package: questionPackage || (exam.questionBank || []).map((q) => q.id),
        answers: submittedAnswers,
        submittedAt: new Date().toISOString(),
        grade: cheated ? 0 : (autoGradePg !== null && allPg ? autoGradePg : null),
        autoGradePg: cheated ? 0 : autoGradePg,
        isCheated: cheated,
        cheatCount: cheatCount || 0,
      };

      if (subject.chapters && subject.chapters.length > 0) {
        const targetChapter = subject.chapters[0].name;
        if (!student.grades) student.grades = {};
        if (!student.grades[subject.id]) student.grades[subject.id] = { chapters: {} };
        if (!student.grades[subject.id].chapters[targetChapter]) {
          student.grades[subject.id].chapters[targetChapter] = { tasks: {} };
        }

        if (cheated) {
          student.grades[subject.id].chapters[targetChapter].ulangan = 0;
          if (!student.completeness) student.completeness = {};
          student.completeness[subject.id] = false;
        } else if (autoGradePg !== null && allPg) {
          applyGradeToStudentChapter(student, subject, targetChapter, 'ulangan', '', autoGradePg);
        } else {
          recalculateSubjectCompleteness(student, subject);
        }
      }

      return {
        success: true,
        grade: exam.submissions[studentId].grade,
        isCheated: cheated,
        message: cheated
          ? 'Ujian ditutup karena pelanggaran proctoring. Jawaban terkirim dengan status curang.'
          : 'Seluruh lembar jawaban ujian CBT telah dikirim dan terekam.',
      };
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
