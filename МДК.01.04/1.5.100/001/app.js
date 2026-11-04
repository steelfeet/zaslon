'use strict';

// ---------- ДАННЫЕ ----------
const ACTS = {
  1: {
    title: 'Акт I. Идентификация',
    scenes: [
      {
        system: 'Приветствую. Для начала работы мне нужно понять, кто вы. Представьтесь, пожалуйста.',
        choices: [
          { text: 'Назвать свое имя: «Я — Алексей Иванов, стажер».', correct: true,
            feedback: 'Принято. Алексей Иванов. Я зафиксировала ваше имя в журнале посещений.',
            edu: 'ИДЕНТИФИКАЦИЯ — это присвоение субъекту доступа уникального имени (логина, ID, номера пропуска). Это заявление: «Я — Вася». Важно: На этом этапе система еще не доверяет вам, она просто знает, как вас зовут.'
          },
          { text: 'Попытаться пройти молча.', correct: false,
            feedback: 'Ошибка. Идентификация не пройдена. Я не могу работать с анонимом. Доступ запрещен.'
          },
          { text: 'Сказать: «Я — директор банка».', correct: false,
            feedback: 'Стоп. Вы назвались директором, но в базе нет такого стажера. Это ложная идентификация. Вызов охраны!'
          }
        ]
      }
    ]
  },
  2: {
    title: 'Акт II. Аутентификация',
    scenes: [
      {
        system: 'Алексей, я вижу ваше имя, но мне нужно убедиться, что вы — это действительно вы. У вас есть 3 попытки. Ваш ключ доступа — это дата вашего рождения + код из СМС.',
        choices: [
          { text: 'Ввести пароль, который вы придумали сами (например, «12345»).', correct: false,
            feedback: 'Проверка... Пароль слишком простой. Взломщик подобрал его за 2 секунды. Это плохая аутентификация. Доступ заблокирован.'
          },
          { text: 'Приложить отпечаток пальца к сканеру (Биометрия).', correct: true,
            feedback: 'Отпечаток совпадает с базой. Отлично! Вы доказали, что вы — это вы. Процесс АУТЕНТИФИКАЦИИ пройден. Теперь я доверяю этому сеансу.',
            edu: 'АУТЕНТИФИКАЦИЯ — это проверка подлинности. Доказательство того, что субъект действительно тот, за кого себя выдает. Факторы аутентификации: Знание (пароль, PIN). Владение (токен, телефон, смарт-карта). Биометрия (палец, лицо, сетчатка).'
          },
          { text: 'Попросить коллегу приложить свой пропуск.', correct: false,
            feedback: 'Чужой пропуск? Это попытка обмана. Аутентификация не пройдена.'
          }
        ]
      }
    ]
  },
  3: {
    title: 'Акт III. Авторизация',
    scenes: [
      {
        system: 'Алексей, вы успешно вошли. Но теперь мне нужно определить ваши права. Кто вы в системе?',
        choices: [
          { text: 'Администратор (все права).', correct: false,
            feedback: 'Попытка повышения привилегий! Вы стажер, но пытаетесь получить права админа. Это нарушение политики безопасности. Инцидент записан в лог.'
          },
          { text: 'Кассир (доступ к деньгам).', correct: false,
            feedback: 'Кассир? Ваша роль — стажер. Несоответствие прав. Доступ к деньгам запрещен.'
          },
          { text: 'Стажер (только просмотр).', correct: true,
            feedback: 'Роль подтверждена. Вам разрешен только просмотр курса валют. Кнопка перевода денег для вас неактивна (серая). Это АВТОРИЗАЦИЯ.',
            edu: 'АВТОРИЗАЦИЯ — это предоставление субъекту прав на доступ к ресурсам и определение разрешенных действий. Простыми словами: Аутентификация говорит «Ты — Вася», а Авторизация говорит «Васе можно только читать, но нельзя писать».'
          }
        ]
      },
      {
        system: 'Вдруг экран мигает. Появляется «Тень»: «Я украл логин Алексея (Идентификация) и подобрал пароль (Аутентификация). Теперь я войду в систему!»',
        choices: [
          { text: 'Ничего, он войдет.', correct: false,
            feedback: 'Нет. Даже зная пароль, без второго фактора Хакер не пройдет Аутентификацию.'
          },
          { text: 'Двухфакторная аутентификация (2FA).', correct: true,
            feedback: 'Верно! Даже зная пароль, без второго фактора (СМС или отпечатка) Хакер не пройдет Аутентификацию. А если бы и прошел — Авторизация ограничила бы его права только просмотром, и он не смог бы украсть деньги.',
            edu: 'Двухфакторная аутентификация (2FA) — метод защиты, при котором для входа требуется два разных фактора: например, пароль (знание) и код из СМС (владение). Это значительно усложняет взлом.'
          },
          { text: 'Авторизация.', correct: false,
            feedback: 'Авторизация происходит после аутентификации. Но без аутентификации хакер не получит даже прав.'
          }
        ]
      }
    ]
  }
};

const QUIZ = [
  {
    q: 'Что такое идентификация?',
    options: [
      'Присвоение субъекту уникального имени (логина, ID)',
      'Проверка подлинности субъекта',
      'Предоставление прав доступа к ресурсам',
      'Шифрование данных'
    ],
    correct: 0,
    explain: 'Идентификация — это заявление «Я — Вася». Система просто знает, как вас зовут.'
  },
  {
    q: 'Какой из перечисленных факторов НЕ относится к аутентификации?',
    options: [
      'Знание (пароль, PIN)',
      'Владение (токен, телефон)',
      'Биометрия (отпечаток пальца)',
      'Роль в системе (стажёр, администратор)'
    ],
    correct: 3,
    explain: 'Роль в системе — это авторизация. Аутентификация проверяет, что вы — это вы.'
  },
  {
    q: 'Что означает авторизация?',
    options: [
      'Проверка подлинности пользователя',
      'Присвоение пользователю уникального имени',
      'Предоставление прав на доступ к ресурсам и определение разрешённых действий',
      'Двухфакторная проверка'
    ],
    correct: 2,
    explain: 'Авторизация говорит: «Васе можно только читать, но нельзя писать».'
  },
  {
    q: 'Хакер украл логин и пароль. Что помешает ему войти в систему?',
    options: [
      'Ничего, он войдет',
      'Двухфакторная аутентификация (2FA)',
      'Авторизация',
      'Идентификация'
    ],
    correct: 1,
    explain: '2FA требует второй фактор (СМС, отпечаток), которого у хакера нет.'
  },
  {
    q: 'В какой последовательности происходит доступ к защищённой системе?',
    options: [
      'Авторизация → Аутентификация → Идентификация',
      'Идентификация → Аутентификация → Авторизация',
      'Аутентификация → Идентификация → Авторизация',
      'Идентификация → Авторизация → Аутентификация'
    ],
    correct: 1,
    explain: 'Сначала система узнаёт имя (идентификация), затем проверяет подлинность (аутентификация), затем даёт права (авторизация).'
  }
];

// ---------- СОСТОЯНИЕ ----------
const state = {
  screen: 'title',
  act: 1,
  scene: 0,
  actCompleted: { 1: false, 2: false, 3: false },
  quizAnswers: [],
  quizIndex: 0,
  quizScore: 0,
  quizDone: false,
  sound: true,
  voice: true,
  journal: [],
  audioCtx: null,
};

// ---------- DOM ----------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const hud = $('#hud');
const hudAct = $('#hudAct');
const hudFill = $('#hudFill');
const tSound = $('#tSound');
const tVoice = $('#tVoice');
const tJournal = $('#tJournal');
const journal = $('#journal');
const journalBody = $('#journalBody');
const jClose = $('#jClose');
const scrim = $('#scrim');

const screens = {
  title: $('#s-title'),
  brief: $('#s-brief'),
  act1: $('#s-act1'),
  act2: $('#s-act2'),
  act3: $('#s-act3'),
  final: $('#s-final'),
  quiz: $('#s-quiz'),
  result: $('#s-result'),
};

// ---------- УТИЛИТЫ ----------
function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('is-active'));
  screens[id].classList.add('is-active');
  state.screen = id;
  hud.hidden = (id === 'title');
  updateHUD();
  window.scrollTo(0, 0);
}

function updateHUD() {
  let label = `АКТ ${state.act}`;
  if (state.screen === 'quiz') label = 'ТЕСТ';
  if (state.screen === 'result') label = 'ИТОГ';
  if (state.screen === 'final') label = 'ФИНАЛ';
  hudAct.textContent = label;

  const total = 4; // 3 акта + тест
  let completed = 0;
  if (state.actCompleted[1]) completed++;
  if (state.actCompleted[2]) completed++;
  if (state.actCompleted[3]) completed++;
  if (state.quizDone) completed++;
  const pct = (completed / total) * 100;
  hudFill.style.width = pct + '%';
}

function logJournal(text, type = 'info') {
  state.journal.push({ text, type, time: new Date().toLocaleTimeString() });
  if (state.journal.length > 50) state.journal.shift();
  renderJournal();
}

function renderJournal() {
  if (state.journal.length === 0) {
    journalBody.innerHTML = '<p class="journal__empty">Записей пока нет.</p>';
    return;
  }
  journalBody.innerHTML = state.journal.map(e => {
    const cls = e.type === 'ok' ? 'journal__entry--ok' : e.type === 'err' ? 'journal__entry--err' : '';
    return `<div class="journal__entry ${cls}">[${e.time}] ${e.text}</div>`;
  }).join('');
  journalBody.scrollTop = journalBody.scrollHeight;
}

// ---------- ЗВУК ----------
function ensureAudio() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
}

function playTone(freq, duration = 0.15, type = 'sine') {
  if (!state.sound) return;
  ensureAudio();
  const ctx = state.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function speak(text) {
  if (!state.voice || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ru-RU';
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

// ---------- РЕНДЕР АКТОВ ----------
function renderActScreen(screenId, actNum, sceneIndex) {
  const act = ACTS[actNum];
  const scene = act.scenes[sceneIndex];
  const screen = screens[`act${actNum}`];
  screen.innerHTML = `
    <div class="page">
      <div class="act-head">
        <span class="act-num">Акт ${actNum}</span>
        <h2>${act.title}</h2>
      </div>
      <div class="scene">
        <div class="system-bubble">
          <div class="system-avatar">С</div>
          <div class="system-text" id="sysText">${scene.system}</div>
        </div>
        <div class="choices" id="choices">
          ${scene.choices.map((c, i) => `
            <button class="choice" data-index="${i}">${c.text}</button>
          `).join('')}
        </div>
        <div class="feedback" id="feedback" hidden></div>
        <div class="edu" id="eduBlock" hidden>
          <div class="note">
            <div class="note__head"><span class="note__mark">§</span>Обучающий блок</div>
            <div class="note__body" id="eduText"></div>
          </div>
          <button class="btn" id="continueBtn">Продолжить</button>
        </div>
      </div>
    </div>
  `;

  screen.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => {
      handleChoice(actNum, sceneIndex, parseInt(btn.dataset.index));
    });
  });

  speak(scene.system);
}

function handleChoice(actNum, sceneIndex, choiceIndex) {
  const act = ACTS[actNum];
  const scene = act.scenes[sceneIndex];
  const choice = scene.choices[choiceIndex];
  const screen = screens[`act${actNum}`];
  const sysText = screen.querySelector('#sysText');
  const choicesDiv = screen.querySelector('#choices');
  const feedbackDiv = screen.querySelector('#feedback');
  const eduBlock = screen.querySelector('#eduBlock');

  if (choice.correct) {
    choicesDiv.querySelectorAll('.choice').forEach(b => b.disabled = true);
    sysText.textContent = choice.feedback;
    playTone(880, 0.12, 'sine');
    logJournal(`✅ ${choice.feedback}`, 'ok');
    if (choice.edu) {
      eduBlock.hidden = false;
      screen.querySelector('#eduText').innerHTML = choice.edu;
      speak(choice.edu);
      const contBtn = screen.querySelector('#continueBtn');
      contBtn.addEventListener('click', () => nextScene());
    } else {
      feedbackDiv.hidden = false;
      feedbackDiv.innerHTML = `<button class="btn" id="continueBtn">Продолжить</button>`;
      feedbackDiv.querySelector('#continueBtn').addEventListener('click', () => nextScene());
    }
  } else {
    playTone(220, 0.25, 'sawtooth');
    sysText.textContent = choice.feedback;
    speak(choice.feedback);
    logJournal(`❌ ${choice.feedback}`, 'err');
    choicesDiv.querySelectorAll('.choice').forEach(b => b.disabled = true);
    feedbackDiv.hidden = false;
    feedbackDiv.innerHTML = `<button class="btn btn--small" id="retryBtn">Попробовать снова</button>`;
    feedbackDiv.querySelector('#retryBtn').addEventListener('click', () => {
      renderActScreen(`s-act${actNum}`, actNum, sceneIndex);
    });
  }
}

function nextScene() {
  const actNum = state.act;
  const act = ACTS[actNum];
  if (state.scene < act.scenes.length - 1) {
    state.scene++;
    renderActScreen(`s-act${actNum}`, actNum, state.scene);
  } else {
    state.actCompleted[actNum] = true;
    updateHUD();
    if (actNum < 3) {
      state.act = actNum + 1;
      state.scene = 0;
      showScreen(`act${state.act}`);
      renderActScreen(`s-act${state.act}`, state.act, 0);
    } else {
      showFinal();
    }
  }
}

// ---------- ФИНАЛЬНЫЙ ЭКРАН (ИТОГИ) ----------
function showFinal() {
  showScreen('final');
  screens.final.innerHTML = `
    <div class="page">
      <div class="act-head">
        <span class="act-num">Финал</span>
        <h2>Цепочка безопасности</h2>
      </div>
      <div class="cards">
        <article class="card">
          <h3>Идентификация</h3>
          <p>«Кто ты?» — ввод логина, предъявление имени. Система узнаёт, как вас зовут.</p>
        </article>
        <article class="card">
          <h3>Аутентификация</h3>
          <p>«Докажи!» — ввод пароля, отпечаток, СМС. Система убеждается, что это действительно вы.</p>
        </article>
        <article class="card">
          <h3>Авторизация</h3>
          <p>«Что тебе можно?» — права доступа, роль, чтение/запись. Система решает, что вам разрешено.</p>
        </article>
      </div>
      <div class="note">
        <div class="note__head"><span class="note__mark">§</span>Главный вывод</div>
        <div class="note__body">
          <p><b>Безопасность строится на цепочке: Идентификация → Аутентификация → Авторизация.</b> Разрыв любого звена ведёт к уязвимости.</p>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn--big" id="toQuiz">Итоговое Тестирование</button>
      </div>
    </div>
  `;
  screens.final.querySelector('#toQuiz').addEventListener('click', startQuiz);
}

// ---------- ТЕСТ ----------
function startQuiz() {
  state.quizAnswers = [];
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizDone = false;
  showScreen('quiz');
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = QUIZ[state.quizIndex];
  screens.quiz.innerHTML = `
    <div class="page">
      <div class="act-head">
        <span class="act-num">Тест</span>
        <h2>Вопрос ${state.quizIndex + 1} из ${QUIZ.length}</h2>
      </div>
      <div class="quiz-question">
        <h3>${q.q}</h3>
        <div class="quiz-options" id="quizOptions">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}">${opt}</button>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="quizFeedback" hidden></div>
      </div>
    </div>
  `;
  screens.quiz.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => handleQuizAnswer(parseInt(btn.dataset.index)));
  });
}

function handleQuizAnswer(index) {
  const q = QUIZ[state.quizIndex];
  const buttons = screens.quiz.querySelectorAll('.quiz-option');
  buttons.forEach(b => b.disabled = true);
  const feedback = screens.quiz.querySelector('#quizFeedback');
  const isCorrect = index === q.correct;
  if (isCorrect) {
    state.quizScore++;
    playTone(880, 0.12, 'sine');
    buttons[index].classList.add('correct');
  } else {
    playTone(220, 0.2, 'sawtooth');
    buttons[index].classList.add('wrong');
    buttons[q.correct].classList.add('correct');
  }
  feedback.hidden = false;
  feedback.innerHTML = `<b>${isCorrect ? 'Верно!' : 'Неверно.'}</b> ${q.explain}`;
  state.quizAnswers.push({ question: q.q, correct: isCorrect });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn';
  nextBtn.textContent = state.quizIndex < QUIZ.length - 1 ? 'Следующий вопрос' : 'Показать результат';
  nextBtn.style.marginTop = '1rem';
  nextBtn.addEventListener('click', () => {
    if (state.quizIndex < QUIZ.length - 1) {
      state.quizIndex++;
      renderQuizQuestion();
    } else {
      showResult();
    }
  });
  feedback.appendChild(nextBtn);
}

function showResult() {
  state.quizDone = true;
  updateHUD();
  showScreen('result');
  const score = state.quizScore;
  const total = QUIZ.length;
  const percent = Math.round((score / total) * 100);
  let rank = 'Стажёр';
  if (percent >= 90) rank = 'Агент безопасности';
  else if (percent >= 70) rank = 'Сотрудник';
  else if (percent >= 50) rank = 'Практикант';
  else rank = 'Требуется переподготовка';

  screens.result.innerHTML = `
    <div class="page">
      <div class="act-head">
        <span class="act-num">Результат</span>
        <h2>Золотой пропуск</h2>
      </div>
      <div class="result-pass">
        <p>Банк «Кристалл» · отдел информационной безопасности</p>
        <h3>ПРОПУСК №1957-К</h3>
        <p>Выдан: Алексею Иванову</p>
        <p class="chain">Идентификация → Аутентификация → Авторизация</p>
        <p class="score">${score} из ${total} (${percent}%)</p>
        <p>Звание: <b>${rank}</b></p>
      </div>
      <div class="note">
        <div class="note__head"><span class="note__mark">§</span>Шпаргалка</div>
        <div class="note__body">
          <p><b>Идентификация</b> — «Кто ты?» (Ввод логина, предъявление имени).</p>
          <p><b>Аутентификация</b> — «Докажи!» (Ввод пароля, отпечаток, СМС).</p>
          <p><b>Авторизация</b> — «Что тебе можно?» (Права доступа, роль, чтение/запись).</p>
          <p><b>Главный вывод:</b> Безопасность строится на цепочке: Идентификация → Аутентификация → Авторизация. Разрыв любого звена ведёт к уязвимости.</p>
        </div>
      </div>
      <div class="actions">
        <button class="btn" id="restartBtn">Пройти заново</button>
      </div>
    </div>
  `;
  screens.result.querySelector('#restartBtn').addEventListener('click', () => {
    location.reload();
  });
  logJournal(`📋 Тест завершён: ${score}/${total}`, 'ok');
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
function init() {
  hud.hidden = true;
  showScreen('title');

  $('#startBtn').addEventListener('click', () => {
    ensureAudio();
    showScreen('brief');
  });

  $('#toAct1').addEventListener('click', () => {
    state.act = 1;
    state.scene = 0;
    showScreen('act1');
    renderActScreen('s-act1', 1, 0);
  });

  tSound.addEventListener('click', () => {
    state.sound = !state.sound;
    tSound.setAttribute('aria-pressed', state.sound);
    tSound.textContent = state.sound ? 'звук' : 'звук ✕';
  });
  tVoice.addEventListener('click', () => {
    state.voice = !state.voice;
    tVoice.setAttribute('aria-pressed', state.voice);
    tVoice.textContent = state.voice ? 'голос' : 'голос ✕';
    if (!state.voice) window.speechSynthesis.cancel();
  });

  tJournal.addEventListener('click', () => {
    journal.classList.add('is-open');
    scrim.hidden = false;
  });
  jClose.addEventListener('click', closeJournal);
  scrim.addEventListener('click', closeJournal);

  function closeJournal() {
    journal.classList.remove('is-open');
    scrim.hidden = true;
  }

  updateHUD();
}

document.addEventListener('DOMContentLoaded', init);