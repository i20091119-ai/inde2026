# 경상남도 초등교사 정보교육 인식·요구도 설문

설문 응답을 Google Sheets에 SPSS 친화 wide format(한 응답자 = 한 행, 변수당 1개 컬럼)으로 자동 적재하는 정적 웹앱입니다.

- 프런트엔드: 순수 HTML/CSS/JS (모바일 친화, 분기 로직 포함)
- 백엔드: Google Apps Script 웹앱 (별도 서버 불필요)
- 저장소: Google Sheets

## 파일 구조

```
.
├─ index.html               # 설문 페이지
├─ assets/
│  ├─ style.css             # 스타일
│  ├─ survey.js             # 문항 정의 + 분기 + 제출 로직
│  └─ config.js             # 배포 후 Apps Script URL 입력
└─ apps-script/
   └─ Code.gs               # Sheets 헤더 자동 생성 + POST 응답 저장
```

## 1) Google Sheets 준비

기본값은 사용자가 알려준 시트 ID:
`1l6gpTG8U5FoCUgPdHKXZG4GLySnsfxxrOav_VMu6XS0`

다른 시트를 쓰려면 `apps-script/Code.gs` 의 `SPREADSHEET_ID` 값을 교체하세요.

## 2) Apps Script 배포

1. 위 스프레드시트 열기 → 메뉴 **확장 프로그램 → Apps Script**
2. 새 프로젝트가 열리면 기본 `Code.gs` 내용을 모두 지우고, 이 저장소의 `apps-script/Code.gs` 내용을 그대로 붙여넣기
3. 저장 (Ctrl/Cmd + S)
4. 좌측 함수 선택 드롭다운에서 `setupHeaders` 선택 → **실행** 클릭
   - 권한 요청이 뜨면 본인 Google 계정으로 승인
   - 완료 후 시트에 `응답` 탭이 만들어지고 1행(변수명)·2행(라벨)이 자동 생성됨
5. 우상단 **배포 → 새 배포 → 톱니바퀴 → 웹앱** 선택
   - 설명: 자유롭게
   - **다음 사용자 인증으로 실행: 나**
   - **액세스 권한이 있는 사용자: 모든 사용자**
   - **배포** 클릭 → 발급되는 웹앱 URL 복사

## 3) 프런트엔드 설정

`assets/config.js` 를 열어 `SURVEY_ENDPOINT` 값을 위에서 복사한 웹앱 URL로 교체합니다.

```js
window.SURVEY_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
```

## 4) 호스팅

정적 파일이라 어디든 올리면 됩니다. 가장 간단한 옵션:

- **GitHub Pages**: 이 저장소를 GitHub에 푸시한 뒤 Settings → Pages에서 main 브랜치 root 게시
- **로컬 테스트**: `python3 -m http.server 8000` 로 띄우고 `http://localhost:8000` 접속

> 단, 로컬에서 테스트할 때도 Apps Script URL은 정상 동작합니다 (CORS preflight 회피 위해 `text/plain` 으로 POST).

## 5) SPSS Import 팁

- 1행(변수명): SPSS 변수명으로 그대로 사용
- 2행(라벨): SPSS 변수 라벨로 활용 (붙여넣기)
- 객관식: 숫자 코드 그대로 적재 → SPSS 값 라벨 정의만 추가하면 됨
- 복수응답: `q8_1, q8_2, ...` 형태로 더미 코딩(0/1) → 다중응답 세트로 정의
- 분기로 응답하지 않은 문항은 빈 칸 → SPSS에서 system missing
- Q3 시·군 코드: 1=창원시 … 18=합천군 (헤더 라벨에 코드 매핑 명시됨)

## 6) 분기 요약

- **Q0** 1~4 (3~6학년 담임) → 제1부 진행 / 5~8 → 자동 종료 메시지
- **Q14-1**
  - 1(운영함) → Q15~Q18 응답
  - 2/3(미운영/모름) → Q14-2 응답 (Q15~Q18은 빈 칸으로 저장)
- **Q46**
  - 1(정보교과 신설) → Q47, Q48 응답
  - 2~5(그 외) → Q49 응답 (Q47, Q48은 빈 칸으로 저장)

## 7) 컬럼 추가/수정

문항이 추가/변경되면 두 곳을 함께 수정합니다:

- 프런트: `assets/survey.js` 의 렌더링/검증 부분
- 백엔드: `apps-script/Code.gs` 의 `getColumns_()` 정의 후 `setupHeaders()` 재실행
  - 헤더가 바뀌면 시트의 1·2 행이 새 정의로 덮어쓰여집니다. 기존 응답이 있다면 백업 후 진행하세요.
