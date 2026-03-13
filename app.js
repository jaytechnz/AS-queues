/* =============================================
   QUEUE MASTERY — app.js
   Login, progress, simulators, quiz, exam prep
   ============================================= */

// ============ STUDENT SESSION ============
function getStudent() {
    try { return JSON.parse(localStorage.getItem('qm_student')); } catch { return null; }
}
function getProgress() {
    try { return JSON.parse(localStorage.getItem('qm_progress')) || defaultProgress(); } catch { return defaultProgress(); }
}
function defaultProgress() {
    return { visited: [], quizBest: 0, parsonsCompleted: [], examAttempts: {}, examScores: {} };
}
function saveProgress(p) { localStorage.setItem('qm_progress', JSON.stringify(p)); }

function doLogin() {
    const f = document.getElementById('loginFirst').value.trim();
    const l = document.getElementById('loginLast').value.trim();
    const err = document.getElementById('loginError');
    if (!f || !l) { err.textContent = 'Please enter both first and last name.'; return; }
    localStorage.setItem('qm_student', JSON.stringify({ first: f, last: l }));
    document.getElementById('loginOverlay').style.display = 'none';
    initSession();
}

function initSession() {
    const s = getStudent();
    if (!s) {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.style.display = 'flex';
        return;
    }
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
    // Set name in nav
    const navS = document.getElementById('navStudent');
    if (navS) navS.textContent = s.first + ' ' + s.last;
    // Hero welcome
    const hw = document.getElementById('heroWelcome');
    if (hw) hw.textContent = 'Welcome back, ' + s.first + '.';
    // Restore theme/font
    if (localStorage.getItem('qm_theme') === 'light') toggleTheme(true);
    if (localStorage.getItem('qm_font') === 'dyslexic') toggleFont(true);
    updateDashboard();
    updateGlobalProgress();
}

function markVisited(page) {
    const p = getProgress();
    if (!p.visited.includes(page)) { p.visited.push(page); saveProgress(p); }
    updateGlobalProgress();
}

function updateGlobalProgress() {
    const p = getProgress();
    const total = 7; // home, linear, circular, code, parsons, quiz, exam
    const pct = Math.round((p.visited.length / total) * 100);
    const fill = document.getElementById('progressFill');
    const txt = document.getElementById('progressText');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
}

function updateDashboard() {
    const p = getProgress();
    // Linear
    const lPct = p.visited.includes('linear') ? 100 : 0;
    setDash('dashLinearFill', 'dashLinearPct', lPct);
    // Circular
    const cPct = p.visited.includes('circular') ? 100 : 0;
    setDash('dashCircularFill', 'dashCircularPct', cPct);
    // Exam
    const attempted = Object.keys(p.examAttempts).length;
    const ePct = Math.round((attempted / 10) * 100);
    setDash('dashExamFill', 'dashExamPct', ePct);
}

function setDash(fillId, pctId, val) {
    const f = document.getElementById(fillId), t = document.getElementById(pctId);
    if (f) f.style.width = val + '%';
    if (t) t.textContent = val + '%';
}

// ============ THEME & FONT ============
function toggleTheme(_silent) {
    const html = document.documentElement;
    const label = document.getElementById('themeLabel');
    const btn = document.getElementById('themeToggle');
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        if (label) label.textContent = 'Dark Mode';
        if (btn) btn.classList.add('active');
        localStorage.setItem('qm_theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (label) label.textContent = 'Light Mode';
        if (btn) btn.classList.remove('active');
        localStorage.setItem('qm_theme', 'dark');
    }
    if (typeof drawCircularDiagram === 'function' && document.getElementById('circularCanvas')) drawCircularDiagram();
}

function toggleFont(_silent) {
    const body = document.body;
    const label = document.getElementById('fontLabel');
    const btn = document.getElementById('fontToggle');
    body.classList.toggle('dyslexic-font');
    if (body.classList.contains('dyslexic-font')) {
        if (label) label.textContent = 'Standard Font';
        if (btn) btn.classList.add('active');
        localStorage.setItem('qm_font', 'dyslexic');
    } else {
        if (label) label.textContent = 'Dyslexia Font';
        if (btn) btn.classList.remove('active');
        localStorage.setItem('qm_font', 'standard');
    }
}

function getCSSVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

// ============ NAVIGATION (index.html sections) ============
function navTo(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) { el.classList.add('active'); }
    document.querySelectorAll('#topNav .nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.dataset && l.dataset.section === id) l.classList.add('active');
    });
    markVisited(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'parsons') loadParsons(currentParsons);
    if (id === 'quiz' && quizState.currentQ === 0) showQuestion();
    if (id === 'exam') initExam();
}

// Handle section nav links
document.addEventListener('DOMContentLoaded', () => {
    initSession();
    markVisited('home');
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); navTo(link.dataset.section); });
    });
    // Handle hash-based navigation from other pages
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        if (document.getElementById(id)) navTo(id);
    }
    // Code tabs
    document.querySelectorAll('.code-tabs').forEach(g => {
        g.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const parent = tab.closest('.content-card') || tab.closest('.section');
                parent.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                parent.querySelectorAll('.code-block').forEach(b => b.classList.add('hidden'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.remove('hidden');
            });
        });
    });

    // Enter/Return key support for all interactive inputs
    // Login fields
    ['loginFirst', 'loginLast'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    });
    // Linear queue simulator
    const linIn = document.getElementById('linearInput');
    if (linIn) linIn.addEventListener('keydown', e => { if (e.key === 'Enter') linearEnqueue(); });
    // Circular queue simulator
    const cirIn = document.getElementById('circularInput');
    if (cirIn) cirIn.addEventListener('keydown', e => { if (e.key === 'Enter') circularEnqueue(); });
});

function toggleQuickRef() { document.getElementById('quickRefPanel').classList.toggle('hidden'); }
function revealAnnotation(btn) {
    btn.closest('.anno-line').querySelector('.anno-reveal').classList.remove('hidden');
    btn.textContent = 'OK'; btn.classList.add('revealed');
}

// ============ LINEAR QUEUE SIMULATOR ============
let lq = { queue: [], front: 0, rear: -1, maxSize: 6 };
function linearReset() {
    const sel = document.getElementById('linearSize');
    if (!sel) return;
    lq.maxSize = parseInt(sel.value);
    lq.queue = new Array(lq.maxSize).fill(null);
    lq.front = 0; lq.rear = -1;
    renderLinear();
    document.getElementById('linearLog').innerHTML = '<div class="log-entry info">Queue initialised. Front = 0, Rear = -1.</div>';
}
function linearEnqueue() {
    const input = document.getElementById('linearInput');
    const val = input.value.trim();
    if (!val) { logLinear('Please enter a value.', 'warning'); return; }
    if (lq.rear >= lq.maxSize - 1) { logLinear(`OVERFLOW: Rear (${lq.rear}) >= MaxSize-1 (${lq.maxSize-1}). Queue full.`, 'error'); return; }
    lq.rear++; lq.queue[lq.rear] = val;
    logLinear(`Enqueue("${val}"): Rear incremented to ${lq.rear}. Queue[${lq.rear}] = "${val}".`, 'success');
    input.value = ''; renderLinear(lq.rear);
}
function linearDequeue() {
    if (lq.front > lq.rear) { logLinear(`UNDERFLOW: Front (${lq.front}) > Rear (${lq.rear}). Empty.`, 'error'); return; }
    const item = lq.queue[lq.front]; lq.queue[lq.front] = null;
    const old = lq.front; lq.front++;
    logLinear(`Dequeue(): Returned "${item}" from index ${old}. Front now ${lq.front}. Index ${old} is WASTED.`, 'warning');
    renderLinear(-1, old);
}
function renderLinear(animIn=-1, _animOut=-1) {
    const c = document.getElementById('linearArray'); if (!c) return; c.innerHTML = '';
    let count = 0;
    for (let i = 0; i < lq.maxSize; i++) {
        const cell = document.createElement('div'); cell.className = 'sim-cell';
        const mk = document.createElement('div'); mk.className = 'cell-markers';
        if (lq.front <= lq.rear) {
            if (i === lq.front) { mk.innerHTML += '<span class="marker marker-front">F</span>'; cell.classList.add('is-front'); }
            if (i === lq.rear) { mk.innerHTML += '<span class="marker marker-rear">R</span>'; cell.classList.add('is-rear'); }
        }
        if (lq.queue[i] !== null && i >= lq.front && i <= lq.rear) {
            cell.classList.add('filled'); cell.innerHTML = `<span class="cell-value">${lq.queue[i]}</span>`;
            if (i === animIn) cell.classList.add('pop-in'); count++;
        } else if (i < lq.front && lq.front > 0 && lq.rear >= 0) {
            cell.classList.add('wasted'); cell.innerHTML = '<span class="cell-value" style="font-size:0.7rem">wasted</span>';
        } else { cell.innerHTML = '<span class="cell-value" style="color:var(--text-muted)">·</span>'; }
        cell.appendChild(mk);
        const idx = document.createElement('span'); idx.className = 'cell-index'; idx.textContent = i; cell.appendChild(idx);
        c.appendChild(cell);
    }
    document.getElementById('linearFrontVal').textContent = lq.front;
    document.getElementById('linearRearVal').textContent = lq.rear;
    document.getElementById('linearSizeVal').textContent = count;
}
function logLinear(msg, type) {
    const log = document.getElementById('linearLog');
    const e = document.createElement('div'); e.className = `log-entry ${type}`; e.textContent = '> ' + msg;
    log.prepend(e);
}

// ============ CIRCULAR QUEUE SIMULATOR ============
let cq = { queue: [], front: 0, rear: -1, size: 0, maxSize: 6 };
function circularReset() {
    const sel = document.getElementById('circularSize');
    if (!sel) return;
    cq.maxSize = parseInt(sel.value);
    cq.queue = new Array(cq.maxSize).fill(null);
    cq.front = 0; cq.rear = -1; cq.size = 0;
    renderCircular();
    document.getElementById('circularLog').innerHTML = '<div class="log-entry info">Circular queue initialised. Front = 0, Rear = -1, Size = 0.</div>';
}
function circularEnqueue() {
    const input = document.getElementById('circularInput');
    const val = input.value.trim();
    if (!val) { logCircular('Please enter a value.', 'warning'); return; }
    if (cq.size >= cq.maxSize) { logCircular(`OVERFLOW: Size (${cq.size}) = MaxSize. Full.`, 'error'); return; }
    const old = cq.rear; cq.rear = (cq.rear + 1) % cq.maxSize; cq.queue[cq.rear] = val; cq.size++;
    logCircular(`Enqueue("${val}"): Rear = (${old}+1) MOD ${cq.maxSize} = ${cq.rear}. Size = ${cq.size}.`, 'success');
    input.value = ''; renderCircular(cq.rear);
}
function circularDequeue() {
    if (cq.size === 0) { logCircular('UNDERFLOW: Size = 0. Empty.', 'error'); return; }
    const item = cq.queue[cq.front]; cq.queue[cq.front] = null;
    const old = cq.front; cq.front = (cq.front + 1) % cq.maxSize; cq.size--;
    logCircular(`Dequeue(): Returned "${item}" from [${old}]. Front = (${old}+1) MOD ${cq.maxSize} = ${cq.front}. Size = ${cq.size}.`, 'warning');
    renderCircular(-1, old);
}
function renderCircular(animIn=-1, _animOut=-1) {
    const c = document.getElementById('circularArray'); if (!c) return; c.innerHTML = '';
    for (let i = 0; i < cq.maxSize; i++) {
        const cell = document.createElement('div'); cell.className = 'sim-cell';
        const mk = document.createElement('div'); mk.className = 'cell-markers';
        if (cq.size > 0) {
            if (i === cq.front) { mk.innerHTML += '<span class="marker marker-front">F</span>'; cell.classList.add('is-front'); }
            if (i === cq.rear) { mk.innerHTML += '<span class="marker marker-rear">R</span>'; cell.classList.add('is-rear'); }
        }
        if (cq.queue[i] !== null) {
            cell.classList.add('filled'); cell.innerHTML = `<span class="cell-value">${cq.queue[i]}</span>`;
            if (i === animIn) cell.classList.add('pop-in');
        } else { cell.innerHTML = '<span class="cell-value" style="color:var(--text-muted)">·</span>'; }
        cell.appendChild(mk);
        const idx = document.createElement('span'); idx.className = 'cell-index'; idx.textContent = i; cell.appendChild(idx);
        c.appendChild(cell);
    }
    document.getElementById('circularFrontVal').textContent = cq.front;
    document.getElementById('circularRearVal').textContent = cq.rear;
    document.getElementById('circularSizeVal').textContent = cq.size;
}
function logCircular(msg, type) {
    const log = document.getElementById('circularLog');
    const e = document.createElement('div'); e.className = `log-entry ${type}`; e.textContent = '> ' + msg;
    log.prepend(e);
}

// ============ CIRCULAR CANVAS DIAGRAM ============
function drawCircularDiagram(data) {
    const canvas = document.getElementById('circularCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = 120;
    const colBorder = getCSSVar('--border'), colMuted = getCSSVar('--text-muted'),
          colAccent = getCSSVar('--accent'), colSuccess = getCSSVar('--success'),
          colGold = getCSSVar('--dark-gold'), colEmpty = getCSSVar('--cell-empty'),
          colFilled = getCSSVar('--cell-filled-bg'), colFBorder = getCSSVar('--cell-filled-border'),
          colFrBg = getCSSVar('--cell-front-bg'), colFrBrd = getCSSVar('--cell-front-border'),
          colReBg = getCSSVar('--cell-rear-bg'), colReBrd = getCSSVar('--cell-rear-border');
    ctx.clearRect(0, 0, W, H);
    const slots = data ? data.slots : [{val:null},{val:null},{val:null},{val:null},{val:null}];
    const n = slots.length, fIdx = data ? data.front : -1, rIdx = data ? data.rear : -1;
    ctx.strokeStyle = colBorder; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = colMuted; ctx.font = '12px "DM Sans",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Circular Queue', cx, cy - 8); ctx.fillText('Size: ' + n, cx, cy + 10);
    for (let i = 0; i < n; i++) {
        const a = (Math.PI*2*i/n) - Math.PI/2, x = cx + R*Math.cos(a), y = cy + R*Math.sin(a);
        let fill = colEmpty, brd = colBorder, tc = colMuted;
        if (slots[i].val !== null) { fill = colFilled; brd = colFBorder; tc = colAccent; }
        if (i === fIdx && data && data.size > 0) { fill = colFrBg; brd = colFrBrd; tc = colSuccess; }
        if (i === rIdx && data && data.size > 0) { fill = colReBg; brd = colReBrd; tc = colGold; }
        ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI*2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = brd; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = tc; ctx.font = 'bold 14px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(slots[i].val !== null ? slots[i].val : '·', x, y);
        const lx = cx + (R+38)*Math.cos(a), ly = cy + (R+38)*Math.sin(a);
        ctx.fillStyle = colMuted; ctx.font = '11px "JetBrains Mono",monospace'; ctx.fillText('['+i+']', lx, ly);
        if (data && data.size > 0) {
            const mx = cx + (R-38)*Math.cos(a), my = cy + (R-38)*Math.sin(a);
            if (i === fIdx) { ctx.fillStyle = colSuccess; ctx.font = 'bold 10px "DM Sans",sans-serif'; ctx.fillText('F', mx, my); }
            if (i === rIdx) { ctx.fillStyle = colGold; ctx.font = 'bold 10px "DM Sans",sans-serif'; ctx.fillText('R', mx, my); }
        }
    }
}
const traceStates = [
    { slots:[{val:null},{val:null},{val:null},{val:null},{val:null}], front:0, rear:-1, size:0, info:'Initial state: empty circular queue, 5 slots.\nFront = 0, Rear = -1, Size = 0.' },
    { slots:[{val:'A'},{val:null},{val:null},{val:null},{val:null}], front:0, rear:0, size:1, info:'Enqueue(A): Rear = (-1+1) MOD 5 = 0.\nQueue[0] = A. Size = 1.' },
    { slots:[{val:'A'},{val:'B'},{val:null},{val:null},{val:null}], front:0, rear:1, size:2, info:'Enqueue(B): Rear = (0+1) MOD 5 = 1.\nQueue[1] = B. Size = 2.' },
    { slots:[{val:'A'},{val:'B'},{val:'C'},{val:null},{val:null}], front:0, rear:2, size:3, info:'Enqueue(C): Rear = (1+1) MOD 5 = 2.\nQueue[2] = C. Size = 3.' },
    { slots:[{val:'A'},{val:'B'},{val:'C'},{val:'D'},{val:null}], front:0, rear:3, size:4, info:'Enqueue(D): Rear = (2+1) MOD 5 = 3.\nQueue[3] = D. Size = 4.' },
    { slots:[{val:null},{val:'B'},{val:'C'},{val:'D'},{val:null}], front:1, rear:3, size:3, info:'Dequeue() returns "A" from [0].\nFront = (0+1) MOD 5 = 1. Size = 3.\nIndex 0 now FREE for reuse.' },
    { slots:[{val:null},{val:null},{val:'C'},{val:'D'},{val:null}], front:2, rear:3, size:2, info:'Dequeue() returns "B" from [1].\nFront = (1+1) MOD 5 = 2. Size = 2.' },
    { slots:[{val:null},{val:null},{val:'C'},{val:'D'},{val:'E'}], front:2, rear:4, size:3, info:'Enqueue(E): Rear = (3+1) MOD 5 = 4.\nQueue[4] = E. Size = 3.' },
    { slots:[{val:'F'},{val:null},{val:'C'},{val:'D'},{val:'E'}], front:2, rear:0, size:4, info:'Enqueue(F): Rear = (4+1) MOD 5 = 0. WRAP-AROUND!\nQueue[0] = F. Size = 4.\nRear wrapped to index 0 — reusing freed space.' },
];
function runTrace(step) {
    drawCircularDiagram(traceStates[step]);
    document.getElementById('traceInfo').textContent = traceStates[step].info;
    document.querySelectorAll('.trace-steps .btn').forEach((b,i) => {
        b.style.background = i===step ? 'var(--accent)' : ''; b.style.color = i===step ? '#fff' : ''; b.style.borderColor = i===step ? 'var(--accent)' : '';
    });
}

// ============ PARSONS PROBLEMS ============
const parsonsProblems = [
    { title:'linear queue enqueue', instruction:'Arrange the pseudocode for a <strong>linear queue enqueue</strong>.', lines:['PROCEDURE Enqueue(Queue, Rear, MaxSize, Item)','    IF Rear >= MaxSize - 1 THEN','        OUTPUT "Queue is full"','    ELSE','        Rear <- Rear + 1','        Queue[Rear] <- Item','    ENDIF','ENDPROCEDURE'], hints:['Start with the procedure declaration.','Check if full before adding.','Increment rear BEFORE placing the item.'] },
    { title:'linear queue dequeue', instruction:'Arrange the pseudocode for a <strong>linear queue dequeue</strong>.', lines:['FUNCTION Dequeue(Queue : INTEGER, Front : INTEGER, Rear : INTEGER)','    IF Front > Rear THEN','        OUTPUT "Queue is empty"','        RETURN ""','    ELSE','        Item <- Queue[Front]','        Front <- Front + 1','        RETURN Item','    ENDIF','ENDFUNCTION'], hints:['Start with the function declaration.','Check empty first (Front > Rear).','Save item BEFORE incrementing front.'] },
    { title:'circular queue enqueue', instruction:'Arrange the pseudocode for a <strong>circular queue enqueue</strong> using MOD.', lines:['PROCEDURE Enqueue(Queue, Rear, Size, MaxSize, Item)','    IF Size >= MaxSize THEN','        OUTPUT "Queue is full"','    ELSE','        Rear <- (Rear + 1) MOD MaxSize','        Queue[Rear] <- Item','        Size <- Size + 1','    ENDIF','ENDPROCEDURE'], hints:['Start with the procedure header.','Check fullness using Size.','MOD makes the rear wrap around.'] },
    { title:'circular queue dequeue', instruction:'Arrange the pseudocode for a <strong>circular queue dequeue</strong> using MOD.', lines:['FUNCTION Dequeue(Queue, Front, Size, MaxSize)','    IF Size = 0 THEN','        OUTPUT "Queue is empty"','        RETURN ""','    ELSE','        Item <- Queue[Front]','        Front <- (Front + 1) MOD MaxSize','        Size <- Size - 1','        RETURN Item','    ENDIF','ENDFUNCTION'], hints:['Start with the function header.','Check emptiness with Size = 0.','Retrieve item BEFORE moving front.'] }
];
let currentParsons = 0, parsonsHintIdx = 0, draggedElement = null;

document.querySelectorAll('.parsons-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.parsons-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active'); currentParsons = parseInt(tab.dataset.problem); parsonsHintIdx = 0; loadParsons(currentParsons);
    });
});

function loadParsons(idx) {
    const prob = parsonsProblems[idx]; if (!prob) return;
    const inst = document.getElementById('parsonsInstructions'); if (inst) inst.innerHTML = prob.instruction;
    const bank = document.getElementById('parsonsBank'), sol = document.getElementById('parsonsSolution');
    if (!bank || !sol) return;
    bank.innerHTML = ''; sol.innerHTML = '';
    const fb = document.getElementById('parsonsFeedback'); if (fb) { fb.textContent = ''; fb.className = 'parsons-feedback'; }
    [...prob.lines].sort(() => Math.random() - 0.5).forEach(line => bank.appendChild(createParsonsLine(line)));
}
function createParsonsLine(text) {
    const el = document.createElement('div'); el.className = 'parsons-line'; el.textContent = text; el.draggable = true;
    el.addEventListener('dragstart', e => { draggedElement = el; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); document.querySelectorAll('.parsons-line').forEach(l => l.classList.remove('drag-over')); draggedElement = null; });
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drag-over'); if (draggedElement && draggedElement !== el) { const p = el.parentNode; const children = [...p.children]; const di = children.indexOf(draggedElement), dri = children.indexOf(el); if (p === draggedElement.parentNode) { di < dri ? p.insertBefore(draggedElement, el.nextSibling) : p.insertBefore(draggedElement, el); } else { p.insertBefore(draggedElement, el); } } });
    el.addEventListener('click', () => { if (el.parentNode.id === 'parsonsBank') document.getElementById('parsonsSolution').appendChild(el); else document.getElementById('parsonsBank').appendChild(el); });
    return el;
}
['parsonsBank','parsonsSolution'].forEach(id => {
    const c = document.getElementById(id); if (!c) return;
    c.addEventListener('dragover', e => { e.preventDefault(); });
    c.addEventListener('drop', e => { e.preventDefault(); if (draggedElement) c.appendChild(draggedElement); });
});
function checkParsons() {
    const prob = parsonsProblems[currentParsons]; const sol = [...document.getElementById('parsonsSolution').children]; const fb = document.getElementById('parsonsFeedback');
    if (!sol.length) { fb.textContent = 'Move lines into solution area first.'; fb.className = 'parsons-feedback hint'; return; }
    if (sol.length !== prob.lines.length) { fb.textContent = `Need ${prob.lines.length} lines. You have ${sol.length}.`; fb.className = 'parsons-feedback incorrect'; return; }
    let all = true;
    sol.forEach((el, i) => { el.classList.remove('correct','incorrect'); if (el.textContent === prob.lines[i]) el.classList.add('correct'); else { el.classList.add('incorrect'); all = false; } });
    if (all) {
        fb.innerHTML = '<strong>Perfect!</strong> All lines correct.'; fb.className = 'parsons-feedback correct';
        const p = getProgress(); if (!p.parsonsCompleted.includes(currentParsons)) { p.parsonsCompleted.push(currentParsons); saveProgress(p); }
    } else {
        const cc = sol.filter((el, i) => el.textContent === prob.lines[i]).length;
        fb.innerHTML = `<strong>${cc}/${prob.lines.length}</strong> correct. Green = right, red = wrong position.`; fb.className = 'parsons-feedback incorrect';
    }
}
function resetParsons() { parsonsHintIdx = 0; loadParsons(currentParsons); }
function hintParsons() {
    const prob = parsonsProblems[currentParsons]; const fb = document.getElementById('parsonsFeedback');
    if (parsonsHintIdx < prob.hints.length) { fb.innerHTML = `<strong>Hint ${parsonsHintIdx+1}:</strong> ${prob.hints[parsonsHintIdx]}`; fb.className = 'parsons-feedback hint'; parsonsHintIdx++; }
    else { fb.textContent = 'No more hints. Check your answer to see misplaced lines.'; fb.className = 'parsons-feedback hint'; }
}

// ============ QUIZ ============
const quizQuestions = [
    { q:'What does FIFO stand for?', opts:['First In First Out','Fast Input Fast Output','First In Final Output','Fixed Input Fixed Output'], correct:0, topic:'basics', fb:{ correct:'Correct. FIFO means the first element added is the first removed.', incorrect:'FIFO stands for First In First Out. The first item enqueued is always the first dequeued.' }},
    { q:'In a linear queue, what happens to index 0 after dequeuing the first element?', opts:['Reused for next enqueue','Becomes wasted space','Deleted from memory','Array shifts left'], correct:1, topic:'linear', fb:{ correct:'Exactly. In a linear queue, dequeued slots become permanently wasted.', incorrect:'In a linear queue, the front pointer moves forward. Index 0 is NOT reused — it becomes wasted space.' }},
    { q:'Linear queue: MaxSize=5, Front=3, Rear=4. How many elements?', opts:['1','2','3','5'], correct:1, topic:'linear', fb:{ correct:'Correct. Rear - Front + 1 = 4 - 3 + 1 = 2.', incorrect:'Elements = Rear - Front + 1 = 4 - 3 + 1 = 2.' }},
    { q:'Primary advantage of circular over linear queue?', opts:['Faster','Reuses freed space by wrapping','Uses less memory','Stores more types'], correct:1, topic:'circular', fb:{ correct:'Exactly. MOD wraps the rear pointer to reuse freed slots.', incorrect:'Circular queues reuse freed space via MOD wrap-around.' }},
    { q:'Circular queue MaxSize=6, Rear=5. New Rear after enqueue?', opts:['6','0','-1','1'], correct:1, topic:'circular', fb:{ correct:'Correct. (5+1) MOD 6 = 0. Wrap-around.', incorrect:'(5+1) MOD 6 = 0. The pointer wraps to index 0.' }},
    { q:'An ADT defines:', opts:['Only the data structure','Data and operations on that data','Only operations, not data','The specific language implementation'], correct:1, topic:'adt', fb:{ correct:'Correct. An ADT is data AND operations — WHAT, not HOW.', incorrect:'An ADT defines both data AND operations. It is abstract — no implementation details.' }},
    { q:'Which condition means a linear queue is empty?', opts:['Front = Rear','Front > Rear','Rear = MaxSize-1','Front = 0'], correct:1, topic:'linear', fb:{ correct:'Correct. Front > Rear means all elements dequeued.', incorrect:'Empty when Front > Rear — front has passed rear.' }},
    { q:'Circular queue with size counter: how to detect full?', opts:['Front = Rear','Size = 0','Size = MaxSize','Rear = MaxSize-1'], correct:2, topic:'circular', fb:{ correct:'Correct. Size = MaxSize means all slots occupied.', incorrect:'With size counter: full when Size = MaxSize.' }},
    { q:'What is 7 MOD 5?', opts:['0','1','2','1.4'], correct:2, topic:'circular', fb:{ correct:'Correct. 7 / 5 = remainder 2.', incorrect:'7 MOD 5 = 2 (remainder). MOD enables circular wrap-around.' }},
    { q:'A queue is most appropriate when:', opts:['Reversing element order','Processing in arrival order','Random access needed','Undoing operations'], correct:1, topic:'basics', fb:{ correct:'Exactly. FIFO = fair, sequential processing.', incorrect:'Queues process in FIFO order — first in, first out.' }},
    { q:'Correct rear pointer update for circular enqueue?', opts:['Rear <- Rear + 1','Rear <- (Rear+1) MOD MaxSize','Rear <- Rear MOD MaxSize + 1','Rear <- MaxSize MOD (Rear+1)'], correct:1, topic:'circular', fb:{ correct:'Correct. Add 1 then MOD to wrap.', incorrect:'(Rear+1) MOD MaxSize: increment then wrap.' }},
    { q:'Why might a linear queue report "full" with space available?', opts:['Front pointer corrupted','Dequeued indices cannot be reused','Too many elements','MOD failed'], correct:1, topic:'linear', fb:{ correct:'Exactly. Dequeued indices are permanently wasted in linear queues.', incorrect:'Dequeued indices are permanently wasted. Rear reaches MaxSize-1 and reports full — even with empty slots at the front.' }},
];
const quizState = { currentQ: 0, score: 0, answers: [], answered: false };
function showQuestion() {
    if (quizState.currentQ >= quizQuestions.length) { showResults(); return; }
    const q = quizQuestions[quizState.currentQ]; quizState.answered = false;
    document.getElementById('quizCurrent').textContent = quizState.currentQ + 1;
    document.getElementById('quizTotal').textContent = quizQuestions.length;
    document.getElementById('quizScore').textContent = quizState.score;
    document.getElementById('quizProgressFill').style.width = (quizState.currentQ / quizQuestions.length * 100) + '%';
    document.getElementById('quizQuestion').textContent = q.q;
    const oc = document.getElementById('quizOptions'); oc.innerHTML = '';
    ['A','B','C','D'].forEach((l,i) => {
        const b = document.createElement('div'); b.className = 'quiz-option';
        b.innerHTML = `<span class="opt-letter">${l}</span><span>${q.opts[i]}</span>`;
        b.addEventListener('click', () => selectAnswer(i)); oc.appendChild(b);
    });
    document.getElementById('quizFeedback').textContent = ''; document.getElementById('quizFeedback').className = 'quiz-feedback';
    document.getElementById('quizNextBtn').classList.add('hidden');
}
function selectAnswer(idx) {
    if (quizState.answered) return; quizState.answered = true;
    const q = quizQuestions[quizState.currentQ]; const opts = document.querySelectorAll('.quiz-option'); const fb = document.getElementById('quizFeedback');
    opts.forEach((o,i) => { if (i===q.correct) o.classList.add('correct'); else if (i===idx&&idx!==q.correct) o.classList.add('incorrect'); else o.classList.add('disabled'); });
    if (idx === q.correct) { quizState.score++; document.getElementById('quizScore').textContent = quizState.score; fb.innerHTML = `<strong>Correct.</strong> ${q.fb.correct}`; fb.className = 'quiz-feedback correct'; }
    else { fb.innerHTML = `<strong>Not quite.</strong> ${q.fb.incorrect}`; fb.className = 'quiz-feedback incorrect'; }
    quizState.answers.push({ question: quizState.currentQ, isCorrect: idx === q.correct });
    document.getElementById('quizNextBtn').classList.remove('hidden');
}
function nextQuestion() { quizState.currentQ++; showQuestion(); }
function showResults() {
    const qc = document.getElementById('quizCard'); if (qc) qc.classList.add('hidden');
    document.getElementById('quizResults').classList.remove('hidden');
    const pct = Math.round((quizState.score / quizQuestions.length) * 100);
    const inc = quizQuestions.length - quizState.score;
    document.getElementById('resultsTitle').textContent = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Well Done!' : pct >= 50 ? 'Good Effort' : 'Keep Practising';
    document.getElementById('resultsScore').innerHTML = `<span style="color:var(--accent)">${pct}%</span>`;
    document.getElementById('resultsBreakdown').innerHTML = `<div class="rb-item rb-correct"><span class="rb-num">${quizState.score}</span>Correct</div><div class="rb-item rb-incorrect"><span class="rb-num">${inc}</span>Incorrect</div><div class="rb-item rb-total"><span class="rb-num">${quizQuestions.length}</span>Total</div>`;
    const wrong = {}; quizState.answers.filter(a => !a.isCorrect).forEach(a => { const t = quizQuestions[a.question].topic; wrong[t] = (wrong[t]||0)+1; });
    let adv = pct >= 90 ? 'Excellent understanding. Consider exploring linked-list implementations next.' : 'Focus areas:\n';
    if (wrong.basics) adv += '- Revisit ADT Intro for FIFO fundamentals.\n';
    if (wrong.adt) adv += '- Review what makes an ADT.\n';
    if (wrong.linear) adv += '- Practise with the linear queue simulator.\n';
    if (wrong.circular) adv += '- Use the circular trace tool for MOD practice.\n';
    document.getElementById('resultsAdvice').textContent = adv;
    document.getElementById('quizProgressFill').style.width = '100%';
    const p = getProgress(); p.quizBest = Math.max(p.quizBest, pct); p.visited.includes('quiz') || p.visited.push('quiz'); saveProgress(p);
}
function restartQuiz() {
    quizState.currentQ = 0; quizState.score = 0; quizState.answers = []; quizState.answered = false;
    const qc = document.getElementById('quizCard'); if (qc) qc.classList.remove('hidden');
    document.getElementById('quizResults').classList.add('hidden'); showQuestion();
}

// ============ EXAM PREP (AI-powered) ============
const examQuestions = [
    { id:0, marks:3, difficulty:'easy', text:'Describe what is meant by an Abstract Data Type (ADT). Give one example of an ADT.' },
    { id:1, marks:2, difficulty:'easy', text:'State the purpose of the front pointer and the rear pointer in a queue.' },
    { id:2, marks:3, difficulty:'easy', text:'Give two real-world examples where a queue data structure would be appropriate. For each, explain why a queue is suitable.' },
    { id:3, marks:3, difficulty:'medium', text:'A linear queue is implemented using a 1D array of size 5. The front pointer is 2 and the rear pointer is 4. Explain what happens when a dequeue operation is performed. State the new values of the pointers.' },
    { id:4, marks:3, difficulty:'medium', text:'A linear queue has items at indices 3, 4, and 5 of an array of size 6. Explain why it is not possible to add another item, even though indices 0, 1, and 2 are empty.' },
    { id:5, marks:4, difficulty:'medium', text:'Explain what is meant by overflow and underflow in the context of a queue. For each, state the condition that would be checked in a linear queue.' },
    { id:6, marks:3, difficulty:'medium', text:'A circular queue has MaxSize = 6, Front = 4, Rear = 1, and Size = 4. State the array indices that currently contain valid data. Show your working.' },
    { id:7, marks:4, difficulty:'hard', text:'Explain why a circular queue is more memory-efficient than a linear queue. Use a specific example with an array of size 5 to support your answer.' },
    { id:8, marks:4, difficulty:'hard', text:'Describe, using pseudocode or structured English, the complete algorithm for enqueuing an item into a circular queue. Include all necessary checks.' },
    { id:9, marks:3, difficulty:'hard', text:'Explain the role of the MOD operator in a circular queue. Give a specific numerical example showing how it causes a pointer to wrap around to the beginning of the array.' },
];

let examPage = 0;
const EXAM_PER_PAGE = 3;

function initExam() {
    markVisited('exam');
    renderExamNav();
    renderExamPage();
}

function renderExamNav() {
    const nav = document.getElementById('examNav'); if (!nav) return;
    const p = getProgress(); nav.innerHTML = '';
    examQuestions.forEach((q, i) => {
        const dot = document.createElement('div'); dot.className = 'exam-dot';
        if (i >= examPage * EXAM_PER_PAGE && i < (examPage+1) * EXAM_PER_PAGE) dot.classList.add('active');
        if (p.examAttempts[i]) dot.classList.add('attempted');
        if (p.examScores[i] && p.examScores[i] >= 70) dot.classList.add('completed');
        dot.textContent = i + 1;
        dot.onclick = () => { examPage = Math.floor(i / EXAM_PER_PAGE); renderExamPage(); renderExamNav(); };
        nav.appendChild(dot);
    });
}

function renderExamPage() {
    const container = document.getElementById('examQuestionsContainer'); if (!container) return;
    container.innerHTML = '';
    const p = getProgress();
    const start = examPage * EXAM_PER_PAGE;
    const end = Math.min(start + EXAM_PER_PAGE, examQuestions.length);

    for (let i = start; i < end; i++) {
        const q = examQuestions[i];
        const card = document.createElement('div'); card.className = 'exam-q-card'; card.id = 'examQ' + i;
        const savedAns = p.examAttempts[i] || '';
        card.innerHTML = `
            <div class="exam-q-num">Question ${i+1} of ${examQuestions.length} <span class="exam-q-marks">[${q.marks} marks]</span></div>
            <div class="exam-q-text">${q.text}</div>
            <textarea class="exam-textarea" id="examAns${i}" placeholder="Type your answer here...">${savedAns}</textarea>
            <div class="exam-actions">
                <button class="btn btn-primary" onclick="submitExamQ(${i})">Submit for Feedback</button>
                <button class="btn btn-secondary" onclick="clearExamQ(${i})">Clear</button>
            </div>
            <div id="examFb${i}"></div>
        `;
        container.appendChild(card);
    }

    const prev = document.getElementById('examPrevBtn'), next = document.getElementById('examNextBtn');
    if (prev) prev.disabled = examPage === 0;
    if (next) next.disabled = end >= examQuestions.length;
    renderExamNav();
}

function examPagePrev() { if (examPage > 0) { examPage--; renderExamPage(); } }
function examPageNext() { if ((examPage+1)*EXAM_PER_PAGE < examQuestions.length) { examPage++; renderExamPage(); } }

function clearExamQ(i) {
    const ta = document.getElementById('examAns' + i); if (ta) ta.value = '';
    const fb = document.getElementById('examFb' + i); if (fb) fb.innerHTML = '';
}

async function submitExamQ(i) {
    const q = examQuestions[i];
    const ta = document.getElementById('examAns' + i);
    const answer = ta ? ta.value.trim() : '';
    if (!answer) { const fb = document.getElementById('examFb'+i); fb.innerHTML = '<div class="exam-feedback" style="color:var(--error)">Please write an answer before submitting.</div>'; return; }

    // Save attempt
    const p = getProgress(); p.examAttempts[i] = answer; saveProgress(p);

    const fb = document.getElementById('examFb' + i);
    fb.innerHTML = '<div class="exam-loading">Analysing your answer...</div>';

    const student = getStudent();
    const studentName = student ? student.first : 'Student';

    // Determine adaptive context
    const avgScore = Object.values(p.examScores).length > 0 ? Math.round(Object.values(p.examScores).reduce((a,b)=>a+b,0)/Object.values(p.examScores).length) : -1;
    let adaptiveNote = '';
    if (avgScore >= 0 && avgScore < 40) adaptiveNote = 'This student is struggling. Be encouraging, give clear explanations, and suggest specific things to revise.';
    else if (avgScore >= 40 && avgScore < 70) adaptiveNote = 'This student has partial understanding. Praise what is correct, then clearly explain gaps.';
    else if (avgScore >= 70) adaptiveNote = 'This student is doing well. Challenge them to add more depth, better terminology, or exam technique.';

    const systemPrompt = `You are a Cambridge AS Computer Science 9618 examiner providing feedback on a student's answer about queues. The student's name is ${studentName}.

Assess the answer on three axes:
1. ACCURACY: Is the answer factually correct? Are pointer values, conditions, and operations described correctly?
2. TERMINOLOGY: Does the student use correct CS terminology (e.g. "enqueue", "dequeue", "front pointer", "rear pointer", "MOD", "overflow", "underflow", "FIFO")?
3. DEPTH: Is the answer detailed enough for the marks available? Does it show understanding beyond surface-level?

${adaptiveNote}

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
{"accuracy_score":0-100,"accuracy_feedback":"...","terminology_score":0-100,"terminology_feedback":"...","depth_score":0-100,"depth_feedback":"...","overall_score":0-100,"improvement":"...","encouragement":"..."}

The overall_score should reflect a weighted combination: accuracy 50%, terminology 25%, depth 25%. Keep each feedback field to 1-2 sentences. The improvement field should give one specific, actionable suggestion. The encouragement field should be a brief positive comment addressed to ${studentName}.`;

    const userMsg = `Question (${q.marks} marks): ${q.text}\n\nStudent's answer: ${answer}`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMsg }]
            })
        });
        const data = await response.json();
        const text = data.content.map(c => c.text || '').join('');
        const clean = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(clean);

        p.examScores[i] = result.overall_score; saveProgress(p); updateDashboard(); renderExamNav();

        const badgeClass = result.overall_score >= 70 ? 'badge-high' : result.overall_score >= 40 ? 'badge-mid' : 'badge-low';
        fb.innerHTML = `
        <div class="exam-feedback">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem">
                <strong style="font-size:1.1rem">Feedback</strong>
                <span class="exam-score-badge ${badgeClass}">${result.overall_score}%</span>
            </div>
            <h4 class="fb-accuracy">Accuracy (${result.accuracy_score}%)</h4>
            <p>${result.accuracy_feedback}</p>
            <h4 class="fb-terminology">Terminology (${result.terminology_score}%)</h4>
            <p>${result.terminology_feedback}</p>
            <h4 class="fb-depth">Depth (${result.depth_score}%)</h4>
            <p>${result.depth_feedback}</p>
            <div class="fb-improve"><strong>To improve:</strong> ${result.improvement}</div>
            <p style="color:var(--dark-gold);margin-top:0.5rem;font-style:italic">${result.encouragement}</p>
        </div>`;
    } catch (err) {
        fb.innerHTML = `<div class="exam-feedback" style="border-color:var(--error)">
            <strong style="color:var(--error)">Could not get AI feedback.</strong>
            <p>This feature requires an API connection. If running locally, ensure you have network access. Error: ${err.message}</p>
            <p style="margin-top:0.5rem">Your answer has been saved. You can review it later.</p>
        </div>`;
    }
}

// ============ EXPOSE FUNCTIONS CALLED FROM HTML ============
window.toggleQuickRef = toggleQuickRef;
window.revealAnnotation = revealAnnotation;
window.linearReset = linearReset;
window.linearDequeue = linearDequeue;
window.circularReset = circularReset;
window.circularDequeue = circularDequeue;
window.runTrace = runTrace;
window.checkParsons = checkParsons;
window.resetParsons = resetParsons;
window.hintParsons = hintParsons;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;
window.examPagePrev = examPagePrev;
window.examPageNext = examPageNext;
window.clearExamQ = clearExamQ;
window.submitExamQ = submitExamQ;
