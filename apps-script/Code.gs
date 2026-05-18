/**
 * 경상남도 초등교사 정보교육 인식·요구도 설문 - 백엔드
 *
 * 배포 절차:
 *   1) 응답을 저장할 Google Sheet 의 "확장 프로그램 → Apps Script" 진입
 *   2) Code.gs 를 동일한 프로젝트에 붙여넣기
 *   3) Apps Script 편집기 좌측 톱니바퀴(프로젝트 설정) → "스크립트 속성"
 *        - 속성: SPREADSHEET_ID
 *        - 값:   응답을 저장할 시트의 ID (URL 의 /d/ 와 /edit 사이 문자열)
 *   4) setupHeaders() 함수를 1회 실행해 첫 번째 행에 SPSS용 컬럼 헤더를 작성
 *   5) "배포 → 새 배포 → 유형: 웹앱"
 *        - 액세스 권한: "모든 사용자"
 *        - 다음으로 실행: "나"
 *      배포 후 생성되는 URL 을 assets/config.js 의 SURVEY_ENDPOINT 에 넣기
 */

const SHEET_NAME = '응답';

function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('스크립트 속성 SPREADSHEET_ID 가 설정되지 않았습니다. 프로젝트 설정 → 스크립트 속성에서 추가하세요.');
  }
  return id;
}

// ========== 컬럼 정의 ==========
// SPSS 친화적 wide format. 복수응답은 0/1 더미 코딩.
// 분기로 해당 없는 문항은 빈 칸으로 둡니다 (SPSS system missing 처리 가능).

function getColumns_() {
  const cols = [];

  const add = (key, label, type) => cols.push({ key, label, type });

  add('timestamp',      '제출시각',                'datetime');
  add('submission_id',  '제출ID',                  'text');

  // Q0 응답자격
  add('q0', 'Q0_담당학년(1=1학년 2=2 3=3 4=4 5=5 6=6 7=교과전담 8=기타)', 'int');

  // 제1부
  add('q1', 'Q1_성별(1=남 2=여)', 'int');
  add('q2', 'Q2_교직경력(1=5미만 2=5~10 3=10~20 4=20+)', 'int');
  add('q3', 'Q3_시군(1~18: 창원 진주 통영 사천 김해 밀양 거제 양산 의령 함안 창녕 고성 남해 하동 산청 함양 거창 합천)', 'int');
  add('q4', 'Q4_학교규모(1=소 2=중 3=대)', 'int');
  add('q5', 'Q5_선도학교경험(1=있음 2=없음)', 'int');
  add('q6', 'Q6_연수시간(1=0 2=1~15 3=16~30 4=31~60 5=61+)', 'int');
  add('q7', 'Q7_SW/AI전문성(1~5)', 'int');
  add('q8_1', 'Q8_1_학교자율시간경험',  'int01');
  add('q8_2', 'Q8_2_실과정보경험',      'int01');
  add('q8_3', 'Q8_3_방과후창체경험',    'int01');
  add('q8_4', 'Q8_4_직접지도경험없음',  'int01');

  // 제2부 인프라
  add('q9_1', 'Q9_1_컴퓨터실(1~5)', 'int');
  add('q9_2', 'Q9_2_1인1기기(1~5)', 'int');
  add('q9_3', 'Q9_3_피지컬교구(1~5)', 'int');
  add('q9_4', 'Q9_4_AI플랫폼(1~5)', 'int');

  // 제3부-1 실과
  add('q10','Q10_실과정보시수충분(1~5)','int');
  add('q11','Q11_실과정보내용적합(1~5)','int');
  add('q12','Q12_실과타영역통합효과(1~5)','int');
  add('q13','Q13_실과정보지도어려움없음(1~5)','int');

  // 제3부-2 학교자율시간
  add('q14_1','Q14_1_자율시간운영(1=운영 2=미운영 3=모름)','int');
  add('q15','Q15_자율시간안정운영(1~5)','int');
  add('q16','Q16_자율시간일관성(1~5)','int');
  add('q17','Q17_자율시간이해도(1~5)','int');
  add('q18','Q18_자율시간지속가능(1~5)','int');
  add('q14_2_1','Q14_2_1_전문성부족','int01');
  add('q14_2_2','Q14_2_2_인프라부족','int01');
  add('q14_2_3','Q14_2_3_타교과우선','int01');
  add('q14_2_4','Q14_2_4_제도운영미숙','int01');
  add('q14_2_5','Q14_2_5_협의합의어려움','int01');
  add('q14_2_6','Q14_2_6_자료예시부족','int01');
  add('q14_2_7','Q14_2_7_모르겠음','int01');
  add('q14_2_other','Q14_2_기타','text');

  // 제3부-3 어려움
  add('q19','Q19_정보소양부족(1~5)','int');
  add('q20','Q20_수업구성(1~5)','int');
  add('q21','Q21_학습전략(1~5)','int');
  add('q22','Q22_교육과정분석(1~5)','int');
  add('q23','Q23_평가전문성(1~5)','int');
  add('q24','Q24_자료제작(1~5)','int');
  add('q25','Q25_동료협력(1~5)','int');
  add('q26','Q26_예산부족(1~5)','int');
  add('q27','Q27_기자재노후(1~5)','int');
  add('q28','Q28_행정지원부족(1~5)','int');
  add('q29','Q29_연수추격못함(1~5)','int');

  // 제4부 중요도-보유도 (Q30~Q42 각 imp/pos)
  for (let i = 30; i <= 42; i++) {
    add(`q${i}_imp`, `Q${i}_중요도(1~5)`, 'int');
    add(`q${i}_pos`, `Q${i}_보유도(1~5)`, 'int');
  }

  // 제5부
  add('q43','Q43_정보교과신설필요(1~5)','int');
  add('q44','Q44_새교수학습필요(1~5)','int');
  add('q45','Q45_전담교사로해결가능(1~5)','int');
  add('q46','Q46_선호운영방식(1=신설 2=실과확대 3=자율유지 4=현체제 5=기타)','int');
  add('q46_other','Q46_기타','text');
  add('q47','Q47_적정시작학년(1=1학년 2=2 3=3 4=4 5=5 6=불필요)','int');
  add('q48','Q48_적정주당시수(1=1H 2=2H 3=차등 4=불필요 5=기타)','int');
  add('q48_other','Q48_기타','text');
  add('q49_1','Q49_1_현체제충분','int01');
  add('q49_2','Q49_2_전문성확보어려움','int01');
  add('q49_3','Q49_3_타교과시수축소우려','int01');
  add('q49_4','Q49_4_학습부담우려','int01');
  add('q49_5','Q49_5_인프라부족','int01');
  add('q49_other','Q49_기타','text');
  add('q50','Q50_자유의견','text');

  return cols;
}

// ========== 헤더 자동 생성 ==========
function setupHeaders() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const cols = getColumns_();
  // 1행: SPSS friendly key (변수명)
  // 2행: 사람이 읽기 좋은 라벨 (참고용)
  const keys = cols.map(c => c.key);
  const labels = cols.map(c => c.label);

  sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
  sheet.getRange(2, 1, 1, labels.length).setValues([labels]);

  sheet.getRange(1, 1, 2, keys.length)
    .setFontWeight('bold')
    .setBackground('#eef2ff')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(2);
  sheet.autoResizeColumns(1, keys.length);

  SpreadsheetApp.getUi && SpreadsheetApp.getUi().alert(
    `헤더 생성 완료: ${keys.length}개 컬럼 (시트: ${SHEET_NAME})`
  );
}

// ========== POST 핸들러 ==========
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.openById(getSpreadsheetId_());
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupHeaders();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    const cols = getColumns_();
    const now = new Date();
    const submissionId = Utilities.getUuid();

    const row = cols.map(col => {
      if (col.key === 'timestamp') return now;
      if (col.key === 'submission_id') return submissionId;
      const v = payload[col.key];
      if (v === undefined || v === null || v === '') return '';
      if (col.type === 'int' || col.type === 'int01') {
        const n = Number(v);
        return isNaN(n) ? '' : n;
      }
      return String(v);
    });

    sheet.appendRow(row);
    return jsonOut_({ ok: true, id: submissionId });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return jsonOut_({ ok: true, hint: '이 엔드포인트는 POST 전용입니다.' });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
