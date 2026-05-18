// 설문 문항 정의 (SPSS 친화 wide format)
// 응답값은 숫자 코드로 저장하고, 복수응답은 0/1 더미 코딩으로 분해됩니다.

const SIGUNGU = [
  '창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시',
  '의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'
];

const LIKERT_5_AGREE = ['전혀 그렇지 않다','그렇지 않다','보통이다','그렇다','매우 그렇다'];
const LIKERT_5_LEVEL = ['매우 낮음','낮음','보통','높음','매우 높음'];
const LIKERT_5_INFRA = ['매우 부족','부족','보통','충분','매우 충분'];
const LIKERT_5_DIFF  = ['전혀 어렵지 않다','어렵지 않다','보통이다','어렵다','매우 어렵다'];
const LIKERT_5_IMP   = ['전혀 중요하지 않다','중요하지 않다','보통이다','중요하다','매우 중요하다'];
const LIKERT_5_POS   = ['전혀 보유하지 못함','보유하지 못함','보통','보유함','매우 잘 보유함'];

// 중요도-보유도 13개 항목 (영역 A/B/C)
const IPA_ITEMS = [
  { id: 30, area: '영역 A. 정보교육 교육과정 운영', text: '실과 정보영역 성취기준에 맞춘 수업 설계' },
  { id: 31, area: '영역 A. 정보교육 교육과정 운영', text: '학교자율시간 정보 영역 교육과정 편성 및 운영' },
  { id: 32, area: '영역 A. 정보교육 교육과정 운영', text: '디지털·AI 소양 범교과 요소를 교과에 통합하여 지도' },
  { id: 33, area: '영역 A. 정보교육 교육과정 운영', text: '정보교육 성취기준과 연계하여 학기 단위 평가 계획을 수립하고 운영' },
  { id: 34, area: '영역 B. AI·정보 내용 지식', text: '컴퓨팅 사고력 개념 이해 및 지도' },
  { id: 35, area: '영역 B. AI·정보 내용 지식', text: '알고리즘과 프로그래밍 기초 이해 및 지도' },
  { id: 36, area: '영역 B. AI·정보 내용 지식', text: 'AI 기초 개념(기계학습 등) 이해 및 지도' },
  { id: 37, area: '영역 B. AI·정보 내용 지식', text: '데이터 리터러시(수집·분석·표현) 이해 및 지도' },
  { id: 38, area: '영역 B. AI·정보 내용 지식', text: 'AI 윤리(편향·프라이버시·책임) 이해 및 지도' },
  { id: 39, area: '영역 C. 정보교육 수업 운영 역량', text: '블록 기반 프로그래밍 수업 설계 및 운영' },
  { id: 40, area: '영역 C. 정보교육 수업 운영 역량', text: '피지컬 컴퓨팅·로봇 활용 수업 운영' },
  { id: 41, area: '영역 C. 정보교육 수업 운영 역량', text: 'AI 교구·플랫폼 활용 수업 운영' },
  { id: 42, area: '영역 C. 정보교육 수업 운영 역량', text: '정보교육 수업에서 학생 수준을 확인하는 형성평가를 설계하고 피드백 제공' },
];

// 상태
const state = {};
let currentStep = 0;
const steps = ['intro','eligibility','part1','part2','part3_1','part3_2','part3_3','part4','part5','submit'];

// 제출 완료 상태 (같은 브라우저에서 중복 제출 방지)
let submitted = false;
let submittedId = null;
try {
  const prev = localStorage.getItem('survey_submitted_id');
  if (prev) { submitted = true; submittedId = prev; }
} catch (e) {}

function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for (const k in attrs){
    if (k === 'class') n.className = attrs[k];
    else if (k === 'html') n.innerHTML = attrs[k];
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
    else n.setAttribute(k, attrs[k]);
  }
  for (const c of children){
    if (c == null) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}

function radioGroup(name, options, opts={}){
  const wrap = el('div',{class:'choices' + (opts.inline?' inline':'')});
  options.forEach((label, idx) => {
    const value = String(idx+1);
    const id = `${name}_${value}`;
    const input = el('input',{type:'radio', name, id, value,
      onchange: (e)=>{ state[name] = Number(e.target.value); onChange(name); }});
    if (String(state[name]) === value) input.checked = true;
    const lbl = el('label',{for:id,class:'choice'}, input, el('span',{}, label));
    wrap.appendChild(lbl);
  });
  return wrap;
}

function likertRow(name, scale){
  const wrap = el('div',{class:'likert'});
  scale.forEach((label, idx) => {
    const value = String(idx+1);
    const id = `${name}_${value}`;
    const input = el('input',{type:'radio', name, id, value,
      onchange: (e)=>{ state[name] = Number(e.target.value); }});
    if (String(state[name]) === value) input.checked = true;
    const lbl = el('label',{for:id,class:'likert-cell'},
      input,
      el('span',{class:'num'}, value),
      el('span',{class:'lbl'}, label)
    );
    wrap.appendChild(lbl);
  });
  return wrap;
}

function checkboxGroup(prefix, options){
  const wrap = el('div',{class:'choices'});
  options.forEach((label, idx) => {
    const key = `${prefix}_${idx+1}`;
    const id = key;
    const input = el('input',{type:'checkbox', name:key, id, value:'1',
      onchange: (e)=>{ state[key] = e.target.checked ? 1 : 0; }});
    if (state[key] === 1) input.checked = true;
    wrap.appendChild(el('label',{for:id,class:'choice'}, input, el('span',{}, label)));
  });
  return wrap;
}

function selectDropdown(name, options, placeholder='선택하세요'){
  const sel = el('select',{name, onchange:(e)=>{ state[name] = Number(e.target.value); }});
  sel.appendChild(el('option',{value:''}, placeholder));
  options.forEach((label, idx)=>{
    const o = el('option',{value:String(idx+1)}, label);
    if (state[name] === idx+1) o.selected = true;
    sel.appendChild(o);
  });
  return sel;
}

function textArea(name, placeholder=''){
  const t = el('textarea',{name, placeholder,
    oninput:(e)=>{ state[name] = e.target.value; }});
  if (state[name]) t.value = state[name];
  return t;
}

function textInput(name, placeholder=''){
  const t = el('input',{type:'text', name, placeholder,
    oninput:(e)=>{ state[name] = e.target.value; }});
  if (state[name]) t.value = state[name];
  return t;
}

// 한 문항 블록 빌더
function item(num, title, control, sub){
  const wrap = el('div',{class:'item'});
  wrap.appendChild(el('div',{class:'item-title'},
    el('span',{class:'qnum'}, String(num)),
    el('span',{class:'qtext'}, title)
  ));
  if (sub) wrap.appendChild(el('div',{class:'item-sub'}, sub));
  wrap.appendChild(control);
  return wrap;
}

function likertItem(num, title, name, scale){
  return item(num, title, likertRow(name, scale));
}

// 분기 가능성 체크 (분기 변경 시 이전 가지 응답은 제거하여 잘못 저장되지 않도록 함)
function onChange(name){
  if (name === 'q14_1'){
    if (state.q14_1 === 1){
      ['q14_2_1','q14_2_2','q14_2_3','q14_2_4','q14_2_5','q14_2_6','q14_2_7','q14_2_other']
        .forEach(k => delete state[k]);
    } else {
      ['q15','q16','q17','q18'].forEach(k => delete state[k]);
    }
    render();
  } else if (name === 'q46'){
    if (state.q46 === 1){
      ['q49_1','q49_2','q49_3','q49_4','q49_5','q49_other'].forEach(k => delete state[k]);
    } else {
      ['q47','q48','q48_other'].forEach(k => delete state[k]);
    }
    if (state.q46 !== 5) delete state.q46_other;
    render();
  } else if (name === 'q48'){
    if (state.q48 !== 5) delete state.q48_other;
  } else if (name === 'q0'){
    render();
  }
}

// ===== 화면 렌더링 =====
function renderIntro(container){
  container.appendChild(el('h1',{}, '경상남도 초등교사의 정보교육 인식 및 교육요구도 분석 설문지'));
  container.appendChild(el('div',{class:'card'},
    el('h2',{},'안내문'),
    el('p',{},'안녕하십니까.'),
    el('p',{},'본 설문은 2022 개정 교육과정 시행 이후 경상남도 초등학교 정보교육의 운영 실태와 교사의 교육요구를 분석하기 위한 연구의 일환으로 진행됩니다.'),
    el('p',{},'본 설문은 정보교육 운영 경험이 있는 3~6학년 담임교사를 대상으로 합니다.'),
    el('p',{},'본 설문은 무기명으로 진행되며, 응답하신 모든 내용은 연구 목적 외에는 사용되지 않습니다. 응답에 소요되는 시간은 약 10~13분이며, 정답이 없으므로 솔직하게 응답해 주시기 바랍니다.'),
    el('p',{class:'muted'},'연구진: 진주교육대학교 교육대학원 컴퓨터교육전공 / AI융합교육전공'),
    el('p',{class:'muted'},'교신저자: 박정호 교수 (진주교육대학교 컴퓨터교육과)')
  ));
}

function renderEligibility(c){
  c.appendChild(el('h2',{},'응답 자격 확인'));
  c.appendChild(item('Q0','귀하는 현재 어느 학년을 담당하고 계십니까?',
    radioGroup('q0', ['1학년','2학년','3학년','4학년','5학년','6학년','교과전담','기타'])
  ));
  if (state.q0 != null && (state.q0 < 3 || state.q0 > 6)){
    c.appendChild(el('div',{class:'notice error'},
      '본 설문은 3~6학년 담임교사를 대상으로 합니다. 응답해 주셔서 감사합니다.'
    ));
  }
}

function renderPart1(c){
  c.appendChild(el('h2',{},'제1부. 응답자 배경'));
  c.appendChild(item(1,'성별', radioGroup('q1',['남성','여성'])));
  c.appendChild(item(2,'교직 경력', radioGroup('q2',
    ['5년 미만','5년 이상 ~ 10년 미만','10년 이상 ~ 20년 미만','20년 이상'])));
  c.appendChild(item(3,'근무 학교 소재 시·군', selectDropdown('q3', SIGUNGU)));
  c.appendChild(item(4,'근무 학교 규모 (학급 수 기준)', radioGroup('q4',
    ['6학급 이하 (소규모)','7~24학급 (중규모)','25학급 이상 (대규모)'])));
  c.appendChild(item(5,'정보·SW·AI 관련 선도(연구)학교 또는 시범학교 운영 경험',
    radioGroup('q5',['운영 경험 있음 (현재 또는 과거)','운영 경험 없음'])));
  c.appendChild(item(6,'최근 3년간 정보·SW·AI 관련 직무연수 이수 시간',
    radioGroup('q6',['없음','1~15시간','16~30시간','31~60시간','61시간 이상'])));
  c.appendChild(item(7,'SW/AI 분야에서 본인의 전반적 전문성 수준',
    radioGroup('q7', LIKERT_5_LEVEL)));
  c.appendChild(item(8,'정보교육 직접 지도 경험 (복수 응답 가능)',
    checkboxGroup('q8',[
      '학교자율시간에 정보 영역을 운영한 경험',
      '실과 정보영역을 운영한 경험',
      '방과후·창체 등에서 정보·SW·AI 관련 수업 운영 경험',
      '직접 지도 경험 없음'
    ])));
}

function renderPart2(c){
  c.appendChild(el('h2',{},'제2부. 본교의 정보교육 인프라'));
  c.appendChild(el('p',{class:'scale-hint'},'1: 매우 부족  ~  5: 매우 충분'));
  c.appendChild(likertItem('9-1','정보교육실/컴퓨터실','q9_1', LIKERT_5_INFRA));
  c.appendChild(likertItem('9-2','1인 1기기 (태블릿/노트북)','q9_2', LIKERT_5_INFRA));
  c.appendChild(likertItem('9-3','피지컬 컴퓨팅 교구','q9_3', LIKERT_5_INFRA));
  c.appendChild(likertItem('9-4','AI 교육 도구·플랫폼 접근','q9_4', LIKERT_5_INFRA));
}

function renderPart3_1(c){
  c.appendChild(el('h2',{},'제3부-1. 실과 정보영역 운영'));
  c.appendChild(el('p',{class:'scale-hint'},'1: 전혀 그렇지 않다  ~  5: 매우 그렇다'));
  c.appendChild(likertItem(10,'실과 교과 내 정보영역의 시수가 정보교육에 충분하다.','q10', LIKERT_5_AGREE));
  c.appendChild(likertItem(11,'실과 교과서의 정보영역 내용이 현 시대의 정보교육에 적합하다.','q11', LIKERT_5_AGREE));
  c.appendChild(likertItem(12,'실과 내 다른 영역(기술의 이용, 가정생활)과 정보영역의 통합 운영이 효과적이다.','q12', LIKERT_5_AGREE));
  c.appendChild(likertItem(13,'실과 교과 내에서 정보영역을 가르치는 데 어려움이 없다.','q13', LIKERT_5_AGREE));
}

function renderPart3_2(c){
  c.appendChild(el('h2',{},'제3부-2. 학교자율시간 정보 운영'));
  c.appendChild(item('14-1','귀 학교는 현재 학교자율시간(17시간)으로 정보교육을 운영하고 있습니까?',
    radioGroup('q14_1',['운영하고 있다','운영하지 않는다','잘 모르겠다'])));

  if (state.q14_1 === 1){
    c.appendChild(el('p',{class:'scale-hint'},'아래는 운영 학교 응답자만 답하는 문항입니다. (1: 전혀 그렇지 않다 ~ 5: 매우 그렇다)'));
    c.appendChild(likertItem(15,'학교자율시간을 통한 정보교육 운영이 안정적으로 이루어지고 있다.','q15', LIKERT_5_AGREE));
    c.appendChild(likertItem(16,'학교자율시간 정보 운영이 학교마다 일관성 있게 진행되고 있다.','q16', LIKERT_5_AGREE));
    c.appendChild(likertItem(17,'학교자율시간 정보 운영에 대한 교사의 이해도가 충분하다.','q17', LIKERT_5_AGREE));
    c.appendChild(likertItem(18,'학교자율시간 정보 운영이 지속 가능하다고 본다.','q18', LIKERT_5_AGREE));
  } else if (state.q14_1 === 2 || state.q14_1 === 3){
    c.appendChild(item('14-2','귀 학교에서 학교자율시간을 정보교육에 활용하지 않는(또는 잘 모르겠다고 응답한) 주된 이유는 무엇입니까? (복수 응답 가능)',
      checkboxGroup('q14_2',[
        '교사의 정보교육 전문성·자신감 부족',
        '학교 정보교육 인프라(기기·교구·환경) 부족',
        '다른 교과·영역이 더 우선됨',
        '학교자율시간 제도 자체의 운영이 학교 내에서 미숙',
        '교육과정 편성 시 협의·합의 어려움',
        '학교자율시간 정보교육 관련 자료·예시 부족',
        '잘 모르겠음'
      ])));
    c.appendChild(item('14-2 기타','기타 의견', textInput('q14_2_other','기타 사유 (선택)')));
  }
}

function renderPart3_3(c){
  c.appendChild(el('h2',{},'제3부-3. 정보교육 운영의 어려움'));
  c.appendChild(el('p',{class:'scale-hint'},'1: 전혀 어렵지 않다  ~  5: 매우 어렵다'));
  c.appendChild(el('h3',{},'A. 내적 어려움 (교사 차원)'));
  c.appendChild(likertItem(19,'본인의 정보 소양 부족','q19', LIKERT_5_DIFF));
  c.appendChild(likertItem(20,'수업 내용 구성의 어려움','q20', LIKERT_5_DIFF));
  c.appendChild(likertItem(21,'학습 전략 모색의 어려움','q21', LIKERT_5_DIFF));
  c.appendChild(likertItem(22,'교육과정 분석의 어려움','q22', LIKERT_5_DIFF));
  c.appendChild(likertItem(23,'평가 전문성 부족','q23', LIKERT_5_DIFF));
  c.appendChild(likertItem(24,'수업 자료 제작의 어려움','q24', LIKERT_5_DIFF));
  c.appendChild(likertItem(25,'동료 교사와의 협력 어려움','q25', LIKERT_5_DIFF));
  c.appendChild(el('h3',{},'B. 외적 어려움 (학교·시스템 차원)'));
  c.appendChild(likertItem(26,'예산 부족','q26', LIKERT_5_DIFF));
  c.appendChild(likertItem(27,'기자재 부족 및 노후화','q27', LIKERT_5_DIFF));
  c.appendChild(likertItem(28,'관리자의 행정 지원 부족','q28', LIKERT_5_DIFF));
  c.appendChild(likertItem(29,'직무연수가 정보교육 변화를 따라가지 못함','q29', LIKERT_5_DIFF));
}

function renderPart4(c){
  c.appendChild(el('h2',{},'제4부. 정보교육 역량에 대한 중요도-보유도 인식'));
  c.appendChild(el('p',{class:'scale-hint'},'각 항목에 대해 중요도(1: 전혀 중요하지 않다 ~ 5: 매우 중요하다)와 보유도(1: 전혀 보유하지 못함 ~ 5: 매우 잘 보유함)를 각각 응답해 주십시오.'));
  let currentArea = '';
  IPA_ITEMS.forEach(it => {
    if (it.area !== currentArea){
      c.appendChild(el('h3',{}, it.area));
      currentArea = it.area;
    }
    const block = el('div',{class:'item ipa-item'});
    block.appendChild(el('div',{class:'item-title'},
      el('span',{class:'qnum'}, String(it.id)),
      el('span',{class:'qtext'}, it.text)
    ));
    block.appendChild(el('div',{class:'ipa-pair'},
      el('div',{class:'ipa-col'},
        el('div',{class:'ipa-label'},'중요도'),
        likertRow(`q${it.id}_imp`, LIKERT_5_IMP)
      ),
      el('div',{class:'ipa-col'},
        el('div',{class:'ipa-label'},'보유도'),
        likertRow(`q${it.id}_pos`, LIKERT_5_POS)
      )
    ));
    c.appendChild(block);
  });
}

function renderPart5(c){
  c.appendChild(el('h2',{},'제5부. 정보교과 신설에 대한 인식'));
  c.appendChild(el('p',{class:'scale-hint'},'1: 전혀 그렇지 않다  ~  5: 매우 그렇다'));
  c.appendChild(likertItem(43,'차기 초등학교 교육과정에서 정보교과 신설이 필요하다.','q43', LIKERT_5_AGREE));
  c.appendChild(likertItem(44,'정보·SW교육은 기존의 강의 방식과 다른 교수학습방법이 필요하다.','q44', LIKERT_5_AGREE));
  c.appendChild(likertItem(45,'정보교과를 별도로 신설하지 않더라도, 정보 전담교사 배치만으로 현재의 정보교육 운영 문제를 충분히 해결할 수 있다.','q45', LIKERT_5_AGREE));

  c.appendChild(item(46,'다음 정보교육 운영 방식 중 어느 쪽을 가장 선호하십니까? (단일 선택)',
    radioGroup('q46',[
      '정보교과 신설 (독립 교과)',
      '실과 내 정보영역 확대',
      '학교자율시간을 통한 자율과목 형태 유지',
      '현 체제 (실과 정보영역 + 학교자율시간) 유지',
      '기타'
    ])));
  if (state.q46 === 5){
    c.appendChild(item('46 기타','기타 의견', textInput('q46_other','기타 운영 방식 (자유 기술)')));
  }

  if (state.q46 === 1){
    c.appendChild(item(47,'정보교과를 신설할 경우, 적정 시작 학년은 언제라고 보십니까?',
      radioGroup('q47',['1학년부터','2학년부터','3학년부터','4학년부터','5학년부터','신설 불필요'])));
    c.appendChild(item(48,'정보교과를 신설할 경우, 적정 주당 시수는 얼마라고 보십니까?',
      radioGroup('q48',[
        '주당 1시간','주당 2시간',
        '학년별 차등 (저학년 1시간, 고학년 2시간)',
        '신설 불필요','기타'
      ])));
    if (state.q48 === 5){
      c.appendChild(item('48 기타','기타 의견', textInput('q48_other','기타 주당 시수 의견')));
    }
  } else if (state.q46 != null){
    c.appendChild(item(49,'정보교과 신설을 선택하지 않은 경우, 그 이유는 무엇입니까? (복수 응답 가능)',
      checkboxGroup('q49',[
        '현 체제로도 정보교육이 충분히 가능하다',
        '교과 신설 시 교사의 전문성 확보가 어렵다',
        '다른 교과 시수 축소 우려',
        '학생 학습 부담 증가 우려',
        '학교 차원의 인프라 부족'
      ])));
    c.appendChild(item('49 기타','기타 의견', textInput('q49_other','기타 사유 (선택)')));
  }

  c.appendChild(item(50,'본인의 정보교육 운영 경험 중 가장 인상적이었던 사례(성공 또는 어려움)나, 정보교육 관련 자유 의견이 있으시면 자유롭게 작성해 주십시오. (선택 응답)',
    textArea('q50','자유 의견')));
}

function renderSubmit(c){
  c.appendChild(el('h2',{},'설문 제출'));
  c.appendChild(el('p',{},'응답해 주신 내용을 제출합니다. 제출 후에는 수정이 어렵습니다.'));
  c.appendChild(el('button',{class:'btn primary', onclick: submitSurvey},'제출하기'));
  c.appendChild(el('div',{id:'submit-status', class:'submit-status'}));
}

// ===== 분기 및 유효성 검사 =====
function validateStep(stepKey){
  const errors = [];
  const need = (name, label) => { if (state[name] == null || state[name] === '') errors.push(label); };

  if (stepKey === 'eligibility'){
    need('q0','Q0');
    if (state.q0 != null && (state.q0 < 3 || state.q0 > 6)) errors.push('__terminate__');
  }
  if (stepKey === 'part1'){
    [1,2,3,4,5,6,7].forEach(n=>need(`q${n}`,`Q${n}`));
    // q8: 최소 1개 체크
    const anyQ8 = [1,2,3,4].some(i => state[`q8_${i}`] === 1);
    if (!anyQ8) errors.push('Q8 (1개 이상 선택)');
  }
  if (stepKey === 'part2'){
    ['q9_1','q9_2','q9_3','q9_4'].forEach(k=>need(k,k.toUpperCase().replace('_','-')));
  }
  if (stepKey === 'part3_1'){
    [10,11,12,13].forEach(n=>need(`q${n}`,`Q${n}`));
  }
  if (stepKey === 'part3_2'){
    need('q14_1','Q14-1');
    if (state.q14_1 === 1) [15,16,17,18].forEach(n=>need(`q${n}`,`Q${n}`));
    if (state.q14_1 === 2 || state.q14_1 === 3){
      const any = [1,2,3,4,5,6,7].some(i => state[`q14_2_${i}`] === 1);
      const hasOther = state.q14_2_other && state.q14_2_other.trim();
      if (!any && !hasOther) errors.push('Q14-2 (1개 이상 선택 또는 기타 기입)');
    }
  }
  if (stepKey === 'part3_3'){
    for (let n=19; n<=29; n++) need(`q${n}`,`Q${n}`);
  }
  if (stepKey === 'part4'){
    IPA_ITEMS.forEach(it => {
      need(`q${it.id}_imp`, `Q${it.id} 중요도`);
      need(`q${it.id}_pos`, `Q${it.id} 보유도`);
    });
  }
  if (stepKey === 'part5'){
    [43,44,45,46].forEach(n=>need(`q${n}`,`Q${n}`));
    if (state.q46 === 1){
      need('q47','Q47'); need('q48','Q48');
    } else if (state.q46 != null && state.q46 !== 1){
      const any = [1,2,3,4,5].some(i => state[`q49_${i}`] === 1);
      const hasOther = state.q49_other && state.q49_other.trim();
      if (!any && !hasOther) errors.push('Q49 (1개 이상 선택 또는 기타 기입)');
    }
  }
  return errors;
}

function renderThankYou(){
  const root = document.getElementById('app');
  root.innerHTML = '';
  const section = el('section',{class:'card notice success'});
  section.appendChild(el('h2',{}, '제출이 완료되었습니다'));
  section.appendChild(el('p',{}, '응답해 주셔서 진심으로 감사합니다.'));
  section.appendChild(el('p',{class:'muted'}, '이 창은 닫으셔도 됩니다.'));
  if (submittedId) {
    section.appendChild(el('p',{class:'muted'}, `제출 ID: ${submittedId}`));
  }
  root.appendChild(section);
}

function render(){
  const root = document.getElementById('app');
  root.innerHTML = '';

  // 이미 제출 완료된 경우 감사 화면 고정 (이전/재제출 차단)
  if (submitted){
    renderThankYou();
    return;
  }

  // 자격 미달이면 종료 화면 고정
  if (state.q0 != null && (state.q0 < 3 || state.q0 > 6)){
    root.appendChild(el('h1',{},'설문 안내'));
    root.appendChild(el('div',{class:'card notice error'},
      el('p',{},'본 설문은 정보교육 운영 경험이 있는 3~6학년 담임교사를 대상으로 합니다.'),
      el('p',{},'응답해 주셔서 진심으로 감사합니다.')
    ));
    return;
  }

  // 진행률
  const total = steps.length;
  const pct = Math.round((currentStep / (total-1)) * 100);
  root.appendChild(el('div',{class:'progress'},
    el('div',{class:'progress-bar', style:`width:${pct}%`})
  ));
  root.appendChild(el('div',{class:'progress-label'}, `${currentStep+1} / ${total} 단계`));

  const section = el('section',{class:'card'});
  const key = steps[currentStep];
  if (key === 'intro') renderIntro(section);
  else if (key === 'eligibility') renderEligibility(section);
  else if (key === 'part1') renderPart1(section);
  else if (key === 'part2') renderPart2(section);
  else if (key === 'part3_1') renderPart3_1(section);
  else if (key === 'part3_2') renderPart3_2(section);
  else if (key === 'part3_3') renderPart3_3(section);
  else if (key === 'part4') renderPart4(section);
  else if (key === 'part5') renderPart5(section);
  else if (key === 'submit') renderSubmit(section);
  root.appendChild(section);

  // 네비게이션
  const nav = el('div',{class:'nav'});
  if (currentStep > 0){
    nav.appendChild(el('button',{class:'btn', onclick: ()=>{ currentStep--; render(); window.scrollTo(0,0); }},'이전'));
  } else {
    nav.appendChild(el('span',{}));
  }
  if (key !== 'submit'){
    nav.appendChild(el('button',{class:'btn primary', onclick: ()=>{
      const errs = validateStep(key);
      if (errs.includes('__terminate__')) { render(); return; }
      if (errs.length){
        alert('아직 응답하지 않은 항목이 있습니다:\n\n' + errs.join('\n'));
        return;
      }
      currentStep++;
      render();
      window.scrollTo(0,0);
    }}, key === 'intro' ? '설문 시작' : '다음'));
  }
  root.appendChild(nav);
}

// ===== 제출 =====
function buildPayload(){
  // 컬럼 정의와 동일한 순서로 채워서 전송
  const payload = { ...state };
  // 복수응답/조건부 누락 키는 백엔드에서 빈 칸으로 처리
  return payload;
}

async function submitSurvey(){
  const status = document.getElementById('submit-status');
  status.textContent = '제출 중...';
  status.className = 'submit-status';
  const btn = document.querySelector('.btn.primary');
  if (btn) btn.disabled = true;

  // 최종 검증
  const allKeys = ['eligibility','part1','part2','part3_1','part3_2','part3_3','part4','part5'];
  const errs = [];
  allKeys.forEach(k => errs.push(...validateStep(k)));
  if (errs.length){
    status.textContent = '아직 응답하지 않은 항목이 있어 제출할 수 없습니다: ' + errs.join(', ');
    status.classList.add('error');
    if (btn) btn.disabled = false;
    return;
  }

  try {
    const endpoint = window.SURVEY_ENDPOINT;
    if (!endpoint || endpoint.includes('YOUR_DEPLOYMENT')){
      throw new Error('Apps Script 배포 URL이 설정되지 않았습니다. config.js의 SURVEY_ENDPOINT를 확인하세요.');
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      // text/plain 으로 보내야 Apps Script CORS preflight 회피
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(buildPayload())
    });
    const data = await res.json();
    if (data.ok){
      submitted = true;
      submittedId = data.id || '';
      try { localStorage.setItem('survey_submitted_id', submittedId || '1'); } catch(e){}
      renderThankYou();
      window.scrollTo(0, 0);
    } else {
      throw new Error(data.error || '알 수 없는 오류');
    }
  } catch (e){
    status.textContent = '제출 중 오류가 발생했습니다: ' + e.message;
    status.classList.add('error');
    if (btn) btn.disabled = false;
  }
}

// init
document.addEventListener('DOMContentLoaded', render);
