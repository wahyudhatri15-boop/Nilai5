// lib/gradeUtils.js — utilitas perhitungan nilai

/**
 * Menentukan apakah nilai perlu dicatat ke rekap siswa.
 * Nilai yang valid: angka 0–100.
 * Null / undefined / string berarti belum dinilai (hanya essay pending).
 * @param {*} grade
 * @returns {boolean}
 */
function isRecordedScore(grade) {
  return grade !== null && grade !== undefined && typeof grade === 'number';
}

/**
 * Menghitung rata-rata nilai dari array angka (mengabaikan null/undefined).
 * @param {Array<number|null>} values
 * @returns {number|null}
 */
function average(values) {
  const valid = values.filter((v) => v !== null && v !== undefined && typeof v === 'number');
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
}

/**
 * Mengambil nilai akhir sebuah chapter dari grades siswa.
 * @param {object} studentGrades  student.grades[subjectId]
 * @param {string} chapterName
 * @returns {number|null}
 */
function getChapterFinalGrade(studentGrades, chapterName) {
  if (!studentGrades || !studentGrades.chapters) return null;
  const ch = studentGrades.chapters[chapterName];
  if (!ch) return null;

  const scores = [];
  if (ch.ulangan !== undefined) scores.push(ch.ulangan);
  if (ch.tasks) {
    Object.values(ch.tasks).forEach((v) => {
      if (typeof v === 'number') scores.push(v);
    });
  }
  return average(scores);
}

module.exports = { isRecordedScore, average, getChapterFinalGrade };
