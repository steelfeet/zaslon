/* ===== js\theme.js ===== */
/* Apply the palette before paint; keep the control and browser chrome in sync. */
(() => {
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let selectedTheme;
  try { selectedTheme = localStorage.getItem('zke-theme'); } catch { /* Use system preference. */ }
  const isTheme = value => value === 'light' || value === 'dark';
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#171a18' : '#f4f4ef';
    const button = document.querySelector('#themeButton');
    if (!button) return;
    const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  }
  applyTheme(isTheme(selectedTheme) ? selectedTheme : systemTheme.matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(document.documentElement.dataset.theme);
    document.querySelector('#themeButton').addEventListener('click', () => {
      selectedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(selectedTheme);
      try { localStorage.setItem('zke-theme', selectedTheme); } catch { /* Theme remains active for this session. */ }
    });
  });
  systemTheme.addEventListener('change', event => {
    if (!isTheme(selectedTheme)) applyTheme(event.matches ? 'dark' : 'light');
  });
})();

/* ===== js\schematic.js ===== */
/* Native vector reconstruction of 114.2.082.002 ПС.
 * Component terminals and net membership are explicit so the drawing can be
 * checked independently of its teaching animation. Coordinates follow the
 * supplied drawing, with extra room around labels and the transformer.
 */
function buildLockSchematic() {
  const pins = {}, elements = [], wires = [], nets = [], junctions = [];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const line = d => `<path d="${d}"/>`;
  const text = (x,y,value,cls='',anchor='start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
  const register = (id, terminals, body, label, bounds, extra='') => {
    pins[id] = terminals;
    const [x,y,w,h] = bounds;
    elements.push(`<g class="circuit-part ${extra}" data-part="${esc(id)}" tabindex="0" role="button" aria-label="${esc(id)}: показать описание"><title>${esc(id)} — назначение и состояние</title><rect class="part-hitbox" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/><g class="part-symbol">${body}</g>${label}</g>`);
  };
  function resistor(id,x,y,vertical=false,length=50,labelSide=1) {
    const terminals = {A:[x,y],B:vertical?[x,y+length]:[x+length,y]};
    const middle=length/2;
    const body=vertical
      ? line(`M${x} ${y}v${middle-14} M${x} ${y+middle+14}V${y+length}`)+`<rect x="${x-5}" y="${y+middle-14}" width="10" height="28"/>`
      : line(`M${x} ${y}h${middle-14} M${x+middle+14} ${y}H${x+length}`)+`<rect x="${x+middle-14}" y="${y-5}" width="28" height="10"/>`;
    const label=vertical ? text(x+labelSide*12,y+middle+4,id,'component-label',labelSide<0?'end':'start') : text(x+middle,y-13,id,'component-label','middle');
    register(id,terminals,body,label,vertical?[x-10,y-4,20,length+8]:[x-4,y-10,length+8,20]);
  }
  function capacitor(id,x,y,vertical=false,length=40,polar=false,labelPosition=null) {
    const middle=length/2, gap=4;
    const body=vertical
      ? line(`M${x} ${y}V${y+middle-gap} M${x-12} ${y+middle-gap}h24 M${x-12} ${y+middle+gap}h24 M${x} ${y+middle+gap}V${y+length}`)
      : line(`M${x} ${y}H${x+middle-gap} M${x+middle-gap} ${y-12}v24 M${x+middle+gap} ${y-12}v24 M${x+middle+gap} ${y}H${x+length}`);
    const [lx,ly] = labelPosition || (vertical?[x+18,y+middle-8]:[x+middle,y-19]);
    const labels=text(lx,ly,id,'component-label',vertical?'start':'middle')+(polar?text(x-15,y+middle+19,'+','polarity','end'):'');
    register(id,{A:[x,y],B:vertical?[x,y+length]:[x+length,y]},body,labels,vertical?[x-16,y-3,32,length+6]:[x-3,y-16,length+6,32]);
  }
  function diode(id,x,y,{vertical=false,up=false,length=45,labelPosition=null}={}) {
    let body, terminals;
    if (!vertical) {
      const m=x+length/2;
      body=line(`M${x} ${y}H${m-9} M${m-9} ${y-9}l18 9l-18 9Z M${m+9} ${y-11}v22 M${m+9} ${y}H${x+length}`);
      terminals={A:[x,y],K:[x+length,y]};
    } else {
      const m=y+length/2;
      body=up
        ? line(`M${x} ${y}V${m-9} M${x-10} ${m-9}h20 M${x-9} ${m+9}l9 -18l9 18Z M${x} ${m+9}V${y+length}`)
        : line(`M${x} ${y}V${m-9} M${x-9} ${m-9}l9 18l9 -18Z M${x-10} ${m+9}h20 M${x} ${m+9}V${y+length}`);
      terminals=up?{K:[x,y],A:[x,y+length]}:{A:[x,y],K:[x,y+length]};
    }
    const [lx,ly]=labelPosition || (vertical?[x+16,y+length/2+4]:[x+length/2,y-16]);
    register(id,terminals,body,text(lx,ly,id,'component-label',vertical?'start':'middle'),vertical?[x-14,y-3,28,length+6]:[x-3,y-14,length+6,28]);
  }
  function thyristor(id,y,stage) {
    const x=660, m=y+17.5;
    const body=line(`M${x} ${y}V${m-9} M${x-10} ${m-9}h20 M${x-9} ${m+9}l9 -18l9 18Z M${x} ${m+9}V${y+35} M638 ${y+5}h8l10 13`);
    register(id,{K:[x,y],A:[x,y+35],G:[638,y+5]},body,text(678,m+5,id,'component-label'),[632,y-6,66,50],`memory-device" data-stage="${stage}`);
  }
  function transistor(id,cx,cy,{upperEmitter=false,pnp=true,labelPosition=null}={}) {
    let body, terminals;
    if (upperEmitter) {
      // VT1 has its base on the right and its emitter at the top.
      terminals={B:[cx+30,cy],E:[cx-10,cy-35],C:[cx-10,cy+35]};
      body=`<circle cx="${cx}" cy="${cy}" r="20"/>`+line(`M${cx+10} ${cy-13}v26 M${cx+30} ${cy}H${cx+10} M${cx+10} ${cy-7}l-20 -13v-15 M${cx+10} ${cy+7}l-20 13v15`)
        +`<path class="arrow-fill" d="M${cx-8} ${cy-19}l8 2l-4 5Z"/>`;
    } else {
      terminals={B:[cx-25,cy],C:[cx+10,cy-35],E:[cx+10,cy+35]};
      body=`<circle cx="${cx}" cy="${cy}" r="20"/>`+line(`M${cx-10} ${cy-13}v26 M${cx-25} ${cy}H${cx-10} M${cx-10} ${cy-7}l20 -13v-15 M${cx-10} ${cy+7}l20 13v15`)
        +`<path class="arrow-fill" d="${pnp?`M${cx-3} ${cy+11}l8 1l-4 5Z`:`M${cx+8} ${cy+19}l-8 -1l4 -5Z`}"/>`;
    }
    const [lx,ly]=labelPosition||[cx+23,cy-21];
    register(id,terminals,body,text(lx,ly,id,'component-label'),[cx-29,cy-39,65,78],`transistor-device" data-device="${id}`);
  }
  function bridge(id,cx,cy) {
    const r=28;
    const body=line(`M${cx} ${cy-r}l${r} ${r}l-${r} ${r}l-${r} -${r}Z M${cx-9} ${cy-8}l9 16l9 -16Z M${cx-10} ${cy+9}h20`);
    register(id,{MINUS:[cx,cy-r],PLUS:[cx,cy+r],AC1:[cx-r,cy],AC2:[cx+r,cy]},body,
      text(cx-12,cy-r-13,id,'component-label')+text(cx+5,cy-r-2,'−','polarity')+text(cx+5,cy+r+13,'+','polarity')+text(cx-r-8,cy+4,'~','polarity','end')+text(cx+r+8,cy+4,'~','polarity'),[cx-38,cy-42,82,85]);
  }
  function net(id,connections,d,cls='',dots=[]) {
    nets.push({id,connections,d});
    wires.push(`<path class="net ${cls}" data-net="${id}" d="${d}"/>`);
    dots.forEach(([x,y])=>junctions.push(`<circle class="junction ${cls}" cx="${x}" cy="${y}" r="2.5"/>`));
  }

  // S1 and plug field are drawn as actual contacts and connectors.
  let keyboard='<rect class="device-outline" x="268" y="349" width="62" height="420" rx="3"/>'+text(280,370,'S1','component-label')+line('M245 385V790');
  const keyPins={C:[245,790]}, plugPins={C:[376,830]};
  let plugs='<rect class="device-outline" x="350" y="349" width="89" height="444" rx="3"/>';
  for(let i=0;i<10;i++) {
    const y=385+i*40, digit=(i+1)%10;
    keyboard+=`<g data-key-contact="${digit}">${line(`M245 ${y}h33l13 -10 M297 ${y}H330`)}<circle cx="297" cy="${y}" r="1.8"/>${text(308,y-7,digit,'key-digit')}</g>`;
    keyPins['K'+(i+1)]=[330,y]; plugPins['I'+(i+1)]=[400,y]; plugPins['O'+(i+1)]=[435,y];
    plugs+=line(`M400 ${y}h7 M407 ${y-6}l6 6l-6 6 M417 ${y-6}l6 6l-6 6 M423 ${y}h12`)+text(393,y-12,`XP${i+1} / XS${i+1}`,'connector-label');
  }
  keyboard+=text(253,808,'13','pin-label');
  plugs+=line('M376 810V830')+text(386,822,'13','pin-label');
  register('S1',keyPins,keyboard,'',[235,344,100,467]);
  register('XP/XS',plugPins,plugs,'',[343,344,99,490]);
  [['R1',385],['R3',425],['R5',465],['R7',505]].forEach(([id,y])=>resistor(id,450,y));
  [['R2',475],['R4',545],['R6',615]].forEach(([id,y])=>resistor(id,575,y));
  resistor('R8',729,340,true);
  resistor('R9',660,685,true,50,-1);
  resistor('R11',660,765,true,50,-1);
  resistor('R10',730,765,true,50,-1);
  resistor('R12',835,685,true,50,-1);
  resistor('R13',875,640,true,55,-1);
  resistor('R14',875,765,true,50,-1);
  resistor('R15',915,580,true,55);
  resistor('R16',945,660,true,35,-1);
  resistor('R17',955,765,true);
  resistor('R18',1020,580,true);
  resistor('R19',935,855);
  resistor('R20',920,340,true);
  capacitor('C1',835,745,true,60,true,[807,783]);
  capacitor('C2',1070,710,true,80,true);
  capacitor('C3',945,640,false,40,false,[968,616]);
  capacitor('C4',620,493); capacitor('C5',620,565); capacitor('C6',620,637);
  diode('VD1',555,610,{vertical:true,up:true,length:55,labelPosition:[548,647]});
  diode('VD2',580,585,{labelPosition:[603,572]});
  diode('VD3',565,680,{vertical:true,length:55,labelPosition:[582,717]});
  diode('VD4',580,655,{labelPosition:[603,678]});
  [440,510,580,650].forEach((y,i)=>thyristor('VD'+(5+i),y,i+1));
  diode('VD9',885,375,{vertical:true,length:40,labelPosition:[901,418]});
  transistor('VT1',670,390,{upperEmitter:true,pnp:false,labelPosition:[672,352]});
  transistor('VT5',700,720,{labelPosition:[719,685]});
  transistor('VT2',780,720,{labelPosition:[775,685]});
  transistor('VT3',900,710,{labelPosition:[883,675]});
  transistor('VT4',1010,710,{labelPosition:[1020,675]});
  register('YA1',{A:[847,375],B:[847,415]},line('M847 375V385 M847 405V415')+'<rect x="831" y="385" width="32" height="20"/>',text(830,363,'YA1','component-label'),[825,371,44,48]);
  register('HL1',{A:[920,435],B:[920,465]},'<circle class="lamp-bulb" cx="920" cy="450" r="15"/>'+line('M910 440l20 20 M910 460l20 -20'),text(945,454,'HL1','component-label'),[901,431,70,39]);
  register('S2',{A:[980,535],B:[1025,535]},'<circle cx="980" cy="535" r="2.5"/><circle cx="1025" cy="535" r="2.5"/><path id="exitContact" d="M980 535L1015 519"/>'+line('M1005 508v11 M999 508h12'),text(1010,497,'S2','component-label'),[975,493,58,48]);
  bridge('VD10',1160,560); bridge('VD11',1160,670);
  const transformer=line('M1255 514V752 M1262 514V752 M1230 525h8q16 0 16 10t-16 10q16 0 16 10t-16 10q16 0 16 10t-16 10q16 0 16 10t-16 10h-8 M1230 650h8q16 0 16 10t-16 10q16 0 16 10t-16 10q16 0 16 10t-16 10q16 0 16 10t-16 10h-8 M1287 560h-4q-14 0 -14 10t14 10q-14 0 -14 10t14 10q-14 0 -14 10t14 10q-14 0 -14 10t14 10q-14 0 -14 10t14 10q-14 0 -14 10t14 10q-14 0 -14 10t14 10h4');
  register('T1',{S5:[1230,525],S6:[1230,605],S4:[1230,650],S3:[1230,730],P1:[1287,560],P2:[1287,700]},transformer,text(1235,494,'T1','component-label')+text(1222,518,'5','pin-label')+text(1222,620,'6','pin-label')+text(1222,643,'4','pin-label')+text(1222,744,'3','pin-label')+text(1296,551,'1','pin-label')+text(1296,716,'2','pin-label'),[1216,489,96,273]);
  register('FU1',{A:[1320,560],B:[1380,560]},line('M1320 560h14 M1366 560h14 M1334 560h32')+'<rect x="1334" y="555" width="32" height="10"/>',text(1350,542,'FU1','component-label','middle'),[1316,539,68,33]);

  // All component terminals belong to exactly one named electrical net.
  for(let i=0;i<10;i++)net('key-'+i,['S1.K'+(i+1),'XP/XS.I'+(i+1)],`M330 ${385+i*40}H400`,'key-net');
  [['R1',385],['R3',425],['R5',465],['R7',505]].forEach(([id,y],i)=>nets.push({id:'plug-'+i,connections:['XP/XS.O'+(i+1),id+'.A'],d:`M435 ${y}H450`}));
  net('common',['S1.C','XP/XS.C','R2.A','R4.A','R6.A','R11.B','R10.B','VT2.E','R14.B','C1.B','R17.B','C2.B','VD10.PLUS','VD11.PLUS','S2.B'],
    'M245 790H360V830H1160 M376 830V810 M540 475V830 M540 475H575 M540 545H575 M540 615H575 M660 815V830 M730 815V830 M790 755V830 M835 805V830 M875 815V830 M955 815V830 M1070 790V830 M1160 588V610H1110V830 M1160 698V830 M1025 535H1090V830','common-net',[[376,830],[540,545],[540,615],[540,830],[660,830],[730,830],[790,830],[835,830],[875,830],[955,830],[1070,830],[1090,830],[1110,830]]);
  net('stage-1-gate',['R1.B','VD5.G'],'M500 385H542V445H638','gate-net stage-route-1');
  net('stage-2-gate',['R3.B','VD6.G','C4.A'],'M500 425H525V515H638 M620 493V515','gate-net stage-route-2',[[620,515]]);
  net('stage-3-input',['R5.B','VD2.A','VD1.K'],'M500 465H508V585H580 M555 585V610','gate-net stage-route-3',[[555,585]]);
  net('stage-3-gate',['VD2.K','VD7.G','C5.A'],'M625 585H638 M620 565V585H625','gate-net stage-route-3',[[625,585]]);
  net('stage-4-input',['R7.B','VD4.A','VD3.A'],'M500 505H492V655H580 M565 655V680','gate-net stage-route-4',[[565,655]]);
  net('stage-4-gate',['VD4.K','VD8.G','C6.A'],'M625 655H638 M620 637V655H625','gate-net stage-route-4',[[625,655]]);
  net('memory-1',['VD5.A','VD6.K','R2.B','C4.B'],'M660 475V510 M625 475H660','memory-net',[[660,475],[660,493]]);
  net('memory-2',['VD6.A','VD7.K','R4.B','C5.B'],'M660 545V580 M625 545H660','memory-net',[[660,545],[660,565]]);
  net('memory-3',['VD7.A','VD8.K','R6.B','C6.B'],'M660 615V650 M625 615H660','memory-net',[[660,615],[660,637]]);
  net('chain-supply',['VT1.C','VD5.K'],'M660 425V440','chain-supply');
  net('full-code',['VD8.A','R9.A','R12.A'],'M660 685H675V665H835V685','full-code-net',[[660,685]]);
  net('key-base',['R9.B','R11.A','VT5.B'],'M660 735V765 M660 750H675V720','driver-net',[[660,750]]);
  net('darlington',['VT5.E','VT2.B','R10.A'],'M710 755H755V720 M730 755V765','driver-net',[[730,755]]);
  net('load-return',['VT5.C','VT2.C','YA1.B','HL1.B','S2.A','VD9.K'],'M710 685V690H790V535H980 M790 535V685 M847 415V535 M920 465V535 M885 415H847','load-return-net',[[790,690],[847,535],[920,535],[847,415]]);
  net('load-negative',['YA1.A','R20.A','VD9.A','VD10.MINUS'],'M847 375V310H1160V532 M920 310V340 M885 375H847','load-negative-net',[[920,310],[847,375]]);
  net('lamp',['R20.B','HL1.A'],'M920 390V435','lamp-net');
  net('logic-negative',['VT1.E','R8.A','R13.A','R15.A','C2.A','VD11.MINUS'],'M660 355V328H805V550H1070V710 M729 328V340 M875 550V640 M915 550V580 M1050 550V642H1160','logic-supply-net',[[729,328],[875,550],[915,550],[1050,550]]);
  net('vt1-base',['VT1.B','R8.B','R18.A'],'M700 390H729V580H1020','bias-net',[[729,390]]);
  net('timer-input',['R12.B','C1.A','R13.B','R14.A','VT3.B'],'M835 735V745H875 M875 695V765 M875 710H875','timer-net',[[835,745],[875,745],[875,710]]);
  net('timer-emitter',['VT3.E','VT4.E','R17.A'],'M910 745V755H1020V745 M955 755V765','timer-net',[[955,755]]);
  net('vt3-collector',['VT3.C','R15.B','R16.A','C3.A'],'M915 635V640H945V660 M910 675V640H915','timer-net',[[915,640],[945,640]]);
  net('vt4-base',['VT4.B','R16.B'],'M945 695V710H985','timer-net');
  net('vt4-collector',['VT4.C','R18.B'],'M1020 630V675','timer-net');
  net('feedback',['R19.B','C3.B'],'M985 855H995V640H985','feedback-net');
  net('error-bus',[...Array.from({length:6},(_,i)=>'XP/XS.O'+(i+5)),'VD1.A','VD3.K','R19.A'],'M435 545H450V855H935 M435 585H450 M435 625H450 M435 665H450 M435 705H450 M435 745H450 M555 665V855 M565 735V855','error-net',[[450,585],[450,625],[450,665],[450,705],[450,745],[555,855],[565,855]]);
  net('ac-load-5',['VD10.AC1','T1.S5'],'M1230 525H1115V560H1132','ac-net');
  net('ac-load-6',['VD10.AC2','T1.S6'],'M1230 605H1205V560H1188','ac-net');
  net('ac-logic-4',['VD11.AC2','T1.S4'],'M1230 650H1205V670H1188','ac-net');
  net('ac-logic-3',['VD11.AC1','T1.S3'],'M1230 730H1115V670H1132','ac-net');
  net('mains-fuse',['T1.P1','FU1.A'],'M1287 560H1320','mains-net');
  net('mains-19',['FU1.B'],'M1380 560H1410 M1404 555l6 5l-6 5','mains-net');
  net('mains-18',['T1.P2'],'M1287 700H1410 M1404 695l6 5l-6 5','mains-net');

  const styles=`
    .vector-schematic{background:var(--panel-2,#f0f1ec);color:var(--text,#242823)}
    .vector-schematic .net,.vector-schematic .part-symbol{fill:none;stroke:var(--wire,#7e897c);stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
    .vector-schematic text{font:12px monospace;fill:var(--text,#242823);stroke:var(--panel-2,#f0f1ec);stroke-width:3px;paint-order:stroke fill;stroke-linejoin:round}
    .vector-schematic .component-label{font-weight:700}.vector-schematic .connector-label{font-size:9px;fill:var(--muted,#656e63)}
    .vector-schematic .pin-label,.vector-schematic .polarity{font-size:10px}.vector-schematic .zone-label{font:10px sans-serif;letter-spacing:1px;fill:var(--muted,#656e63)}
    .vector-schematic .part-symbol rect,.vector-schematic .part-symbol circle{fill:var(--panel-2,#f0f1ec)}
    .vector-schematic .part-symbol .device-outline{fill:none;stroke:var(--line,#dddfd7)}
    .vector-schematic .part-symbol .arrow-fill{fill:var(--wire,#7e897c);stroke:none}
    .vector-schematic .part-hitbox{fill:transparent;stroke:none}.vector-schematic .junction{fill:var(--wire,#7e897c);stroke:none}
    .vector-schematic .current-flow,.vector-schematic .signal-overlay,.vector-schematic .fault-flow,.vector-schematic .flyback-flow{fill:none;pointer-events:none}
    .vector-schematic .current-flow{stroke:var(--accent,#3659d9);stroke-width:3;stroke-dasharray:3 12;opacity:0}
    .vector-schematic .signal-overlay{stroke:var(--signal,#986016);stroke-width:3;opacity:0}
    .vector-schematic .fault-flow{stroke:var(--danger,#b43f35);stroke-width:2.5;opacity:0}
    .vector-schematic .flyback-flow{stroke:var(--signal,#986016);stroke-width:3;stroke-dasharray:2 8;opacity:0}
  `;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" id="lockCircuit" class="schematic vector-schematic" viewBox="210 260 1240 655" aria-labelledby="circuitTitle circuitDescription" data-state="idle"><title id="circuitTitle">Принципиальная схема ЗКЭ-4-10, 114.2.082.002 ПС</title><desc id="circuitDescription">Векторная перерисовка: S1, наборное поле XP/XS, четыре тиристора, пять транзисторов, все резисторы и конденсаторы, электромагнит, лампа, кнопка выхода, трансформатор и выпрямители. Выберите деталь для пояснения.</desc><style>${styles}</style><defs><pattern id="vectorCircuitGrid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="currentColor" opacity=".13"/></pattern></defs><rect x="210" y="260" width="1240" height="655" fill="url(#vectorCircuitGrid)"/>
    ${text(268,285,'01 / КЛАВИАТУРА','zone-label')}${text(533,285,'02 / КОДОВАЯ ЦЕПОЧКА','zone-label')}${text(846,285,'03 / ЭЛЕКТРОМАГНИТ','zone-label')}${text(1160,285,'04 / ПИТАНИЕ','zone-label')}
    <g class="circuit-nets">${wires.join('')}<g id="codeWires" aria-label="Перемычки набора кода"></g>${junctions.join('')}</g><g class="circuit-components">${elements.join('')}</g>
    ${text(1380,614,'~220 В','component-label','middle')}${text(1380,635,'50 Гц','connector-label','middle')}${text(1410,547,'19','pin-label','middle')}${text(1410,720,'18','pin-label','middle')}
    ${text(670,892,'VT5 + VT2 · СОСТАВНОЙ КЛЮЧ','zone-label')}${text(960,892,'VT3 / VT4 · ВЫДЕРЖКА','zone-label')}${text(370,878,'Общий провод (+)','pin-label')}
    <g class="signal-overlay" aria-hidden="true"><path id="inputTrace" d="M330 385H400H435H450H500H542V445H638"/></g>
    <g class="current-flow code-current" aria-hidden="true"><path d="M790 830V755 M790 685V535H847V415 M847 375V310H1160V532 M1160 588V610H1110V830H790"/></g>
    <g class="current-flow exit-current" aria-hidden="true"><path d="M1090 830V535H847V415 M847 375V310H1160V532 M1160 588V610H1110V830H1090"/></g>
    <g class="current-flow lamp-current" aria-hidden="true"><path d="M920 535V465 M920 435V390 M920 340V310"/></g>
    <g class="fault-flow" aria-hidden="true"><path d="M450 545V855H935 M985 855H995V640H985 M729 580H1020V675"/></g>
    <g class="flyback-flow" aria-hidden="true"><path d="M847 415V375H885V415H847"/></g>
    </svg>`;
  return {svg,pins,nets,partIds:Object.keys(pins),inputRoutes:[
    'M435 385H500H542V445H638','M435 425H500H525V515H638 M620 493V515',
    'M435 465H500H508V585H638 M620 565V585','M435 505H500H492V655H638 M620 637V655'
  ]};
}
if(typeof module !== 'undefined' && module.exports) module.exports=buildLockSchematic;

/* ===== js\circuit.js ===== */
/* Native SVG reconstruction of the supplied 114.2.082.002 ПС photograph.
 * Reference designators are retained; animation is a discrete teaching model,
 * not an electrical solver. No component values are inferred from the photo. */
(() => {
  const host = document.querySelector('#diagramHost');
  const schematic = buildLockSchematic();
  host.innerHTML = schematic.svg;
  let releaseTimer, previousState = 'idle', previousExit = false;

  const groups = {
    input: { title: 'S1 · Клавиатура и наборное поле', refs: 'S1, XP1–XP10 / XS1–XS10, R1, R3, R5, R7', text: 'Каждая цифра имеет отдельный провод. Наборное поле соединяет четыре выбранные клавиши с четырьмя ступенями кода. Резисторы ограничивают ток управляющих электродов тиристоров.', route: 'Клавиша S1 → соединитель XP/XS → R1 / R3 / R5 / R7 → управляющий электрод VD5 / VD6 / VD7 / VD8.', state: () => `В модели установлено соединение для кода ${currentCode.split('').join(' → ')}. Остальные клавиши относятся к цепи сброса.` },
    memory: { title: 'VD5–VD8 · Четыре ступени памяти', refs: 'VD5, VD6, VD7, VD8; R2, R4, R6; C4, C5, C6', text: 'Тиристор открывается управляющим импульсом и сохраняет проводящее состояние, пока через него проходит достаточный ток. Последовательность ступеней задаёт порядок цифр. Межступенчатые RC-цепи участвуют в переходных процессах и переключении цепочки.', route: 'Первая цифра → VD5; вторая → VD6; третья → VD7; четвёртая → VD8. Полный набор меняет состояние управляющего каскада VT1.', state: () => `Проводящих ступеней в учебной модели: ${currentEntered.length} из 4. ${currentState === 'error' ? 'После ошибки вся цепочка сброшена.' : 'Синим выделены принятые ступени.'}` },
    reset: { title: 'VD1–VD4, R19 · Цепи сброса и развязки', refs: 'VD1–VD4, R19, C3; управляющие каскады VT3 / VT4 / VT1', text: 'Некодовые клавиши объединены в отдельную шину. Через цепь обратной связи R19 и C3 воздействие поступает в управляющий каскад. Изменение режима VT1 прерывает ток удержания тиристоров, и память стирается. VD1–VD4 участвуют в развязке входных и сбросовых цепей.', route: 'Некодовая клавиша → общая шина ошибки → R19 / C3 → управляющий каскад → запирание VT1 → снятие тока удержания VD5–VD8.', state: () => currentState === 'error' ? 'Сработал сброс: ступени памяти выключены, электромагнит не включался.' : 'Ошибки нет. Цепь готова обнулить последовательность при неверном вводе.' },
    timer: { title: 'C1, VT3, VT4 · Выдержка открытия', refs: 'C1, C3; VT1, VT3, VT4; R8, R12–R18', text: 'После полного кода через R12 начинает заряжаться C1. Напряжение на входе VT3 изменяется. После выдержки каскад VT3 / VT4 переключается и через R18 меняет смещение VT1. Ток цепочки тиристоров прекращается, составной ключ VT5 / VT2 выключается. C3 связан с цепью обратной связи через R19.', route: 'VD8 открыт → R12 → заряд C1 → VT3 / VT4 → R18 → VT1 закрыт → VD5–VD8 и силовой ключ выключены.', state: () => currentState === 'open' ? 'В стенде автоматическое закрытие отключено. Открытое состояние сохраняется до нажатия «Закрыть замок» или «Сбросить».' : 'Импульс открытия не запущен. Точные напряжения C1 по фотографии не определяются.' },
    output: { title: 'VT5 + VT2, YA1 · Силовой ключ и защёлка', refs: 'VT5, VT2; R9–R11; YA1, VD9, HL1, R20, S2', text: 'VT5 и VT2 образуют составной транзисторный ключ: эмиттер VT5 соединён с базой VT2, а их коллекторы объединены. Он усиливает управляющий ток и замыкает цепь электромагнита. YA1 втягивает якорь; HL1 сигнализирует об открытии. VD9 ограничивает выброс самоиндукции. S2 напрямую замыкает цепь нагрузки при удержании.', route: 'Общий (+) → силовой ключ VT2 / VT5 → YA1 → отрицательный выход VD10. Ветвь R20 + HL1 включена параллельно YA1. S2 шунтирует ключ.', state: () => currentState === 'open' ? 'YA1 включён, HL1 горит, якорь втянут. Защёлка освобождена.' : 'YA1 обесточен, HL1 не горит. Пружина удерживает защёлку в закрытом положении.' },
    power: { title: 'T1 · Два канала питания', refs: 'T1, FU1, VD10, VD11, C2', text: 'FU1 стоит во входной сетевой цепи. Трансформатор T1 понижает напряжение и отделяет низковольтные цепи от сети. Две вторичные обмотки и два моста питают нагрузку и электронику раздельно. C2 сглаживает пульсации питания электроники.', route: 'Сеть ~220 В / 50 Гц → FU1 → T1 → VD10 (электромагнит) и VD11 + C2 (схема управления).', state: () => 'Питание присутствует и при закрытом замке. Номиналы вторичных напряжений на исходном снимке не указаны.' }
  };
  const stageRouteAfterResistor = [
    'M500 385H542V445H638',
    'M500 425H525V515H638 M620 493V515',
    'M500 465H508V585H580 M555 585V610 M580 585H625H638',
    'M500 505H492V655H580 M565 655V680 M580 655H625H638'
  ];
  const codeRoute = (keyRow, stage) => {
    const resistorRow = 385 + stage * 40;
    const railX = 446 + stage * 8;
    return `M330 ${keyRow}H400V${keyRow}H435H${railX}V${resistorRow}H450H500` + stageRouteAfterResistor[stage].slice(`M500 ${resistorRow}`.length);
  };
  const names = {
    S1:'Десятиклавишный блок ввода', 'XP/XS':'Наборные соединители кода', S2:'Кнопка выхода изнутри', T1:'Трансформатор с двумя каналами', FU1:'Сетевой предохранитель', YA1:'Катушка электромагнита защёлки', HL1:'Сигнальная лампа открытия',
    VT1:'Управляющий транзистор цепочки кода', VT2:'Выходной транзистор составного ключа', VT5:'Входной транзистор составного ключа', VT3:'Транзистор времязадающего каскада', VT4:'Транзистор выходного каскада',
    VD9:'Диод подавления самоиндукции YA1', VD10:'Мост питания электромагнита', VD11:'Мост питания электроники', C1:'Времязадающий конденсатор', C2:'Сглаживающий конденсатор питания', C3:'Конденсатор связи каскадов', R8:'Резистор смещения VT1', R20:'Ограничение тока лампы HL1',
    R1:'Резистор управляющей цепи VD5', R3:'Резистор управляющей цепи VD6', R5:'Резистор управляющей цепи VD7', R7:'Резистор управляющей цепи VD8',
    R2:'Резистор межступенчатой цепи', R4:'Резистор межступенчатой цепи', R6:'Резистор межступенчатой цепи',
    R9:'Резистор управления базой VT5', R10:'Резистор базы VT2', R11:'Резистор смещения базы VT5',
    R12:'Резистор цепи C1', R13:'Резистор цепи управления VT3', R14:'Резистор цепи управления VT3',
    R15:'Резистор каскада выдержки', R16:'Резистор каскада выдержки', R17:'Резистор общей цепи VT3 / VT4', R18:'Резистор цепи VT4', R19:'Резистор связи выходного и входного узлов',
    C4:'Конденсатор связи первой и второй ступеней', C5:'Конденсатор связи второй и третьей ступеней', C6:'Конденсатор связи третьей и четвёртой ступеней',
    VD1:'Диод связи цепи сброса', VD2:'Диод развязки сигналов', VD3:'Диод связи цепи сброса', VD4:'Диод развязки сигналов'
  };
  const groupFor = id => id === 'S1' || id === 'XP/XS' || /^R[1357]$/.test(id) ? 'input'
    : /^VD[5-8]$/.test(id) || /^R[246]$/.test(id) || /^C[4-6]$/.test(id) ? 'memory'
    : /^(VD[1-4]|R19)$/.test(id) ? 'reset'
    : /^(T1|FU1|VD10|VD11|C2)$/.test(id) ? 'power'
    : /^(VT[25]|R9|R10|R11|YA1|VD9|HL1|R20|S2)$/.test(id) ? 'output' : 'timer';
  let selected = 'memory', selectedPart = '', currentState = 'idle', currentEntered = [], currentCode = '1234', currentExit = false;
  function showComponentTooltip(group, id) {
    if (!id) return;
    const tooltip = document.querySelector('#componentTooltip');
    const info = groups[group];
    document.querySelector('#tooltipTitle').textContent = `${id} · ${names[id] || (/^VD[5-8]$/.test(id) ? `Тиристор ${Number(id.slice(2))-4}-й ступени` : /^R/.test(id) ? 'Резистор цепи' : /^C/.test(id) ? 'Конденсатор цепи' : info.title.split(' · ')[1])}`;
    document.querySelector('#tooltipText').textContent = names[id] ? `${names[id]}. ${info.text}` : info.text;
    tooltip.hidden = false;
  }
  function inspect(group, id = '', showHint = false) {
    selected = group; selectedPart = id;
    const info = groups[group];
    document.querySelectorAll('[data-part]').forEach(p => p.classList.toggle('is-selected', id ? p.dataset.part === id : groupFor(p.dataset.part) === group));
    if (showHint) showComponentTooltip(group, id);
  }
  host.addEventListener('click', e => { const p = e.target.closest('[data-part]'); if (p) inspect(groupFor(p.dataset.part), p.dataset.part, true); });
  host.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-part]')) { e.preventDefault(); inspect(groupFor(e.target.dataset.part), e.target.dataset.part, true); } });
  function renderNodeInfo(group) {
    const info = groups[group];
    document.querySelector('#detailTitle').textContent = info.title;
    document.querySelector('#detailRefs').textContent = info.refs;
    document.querySelector('#detailText').textContent = info.text;
    document.querySelector('#detailRoute').textContent = info.route;
    document.querySelector('#detailState').textContent = info.state();
    document.querySelectorAll('[data-node]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.node === group)));
    document.querySelector('.component-detail-disclosure').open = true;
  }
  document.querySelectorAll('[data-node]').forEach(b => b.onclick = () => renderNodeInfo(b.dataset.node));
  const componentIds = ['S1','XP/XS',...Array.from({length:20},(_,i)=>'R'+(i+1)),...Array.from({length:6},(_,i)=>'C'+(i+1)),...Array.from({length:11},(_,i)=>'VD'+(i+1)),...Array.from({length:5},(_,i)=>'VT'+(i+1)),'YA1','HL1','S2','T1','FU1'];
  document.querySelector('#componentList').innerHTML = componentIds.map(id => `<tr><th scope="row"><button type="button" data-inspect="${id}">${id}</button></th><td>${names[id] || (/^VD[5-8]$/.test(id) ? 'Тиристор памяти кода' : /^VD/.test(id) ? 'Диод развязки сигналов' : /^C/.test(id) ? 'Межступенчатый конденсатор' : groups[groupFor(id)].title.split(' · ')[1])}</td><td>${groupFor(id) === 'memory' ? 'Память' : groups[groupFor(id)].title.split(' · ')[1]}</td></tr>`).join('');
  document.querySelector('#componentList').onclick = e => { const b = e.target.closest('[data-inspect]'); if (b) inspect(groupFor(b.dataset.inspect),b.dataset.inspect, true); };
  document.querySelector('#componentTooltip .component-tooltip__close').onclick = () => { document.querySelector('#componentTooltip').hidden = true; };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('#componentTooltip').hidden = true; });
  let zoom = 100;
  const setZoom = value => { zoom = Math.max(75,Math.min(200,value)); host.style.minWidth = '0'; host.style.width = `${Math.max(host.parentElement.clientWidth,1050)*zoom/100}px`; document.querySelector('#zoomValue').textContent = `${zoom}%`; document.querySelector('#zoomOut').disabled = zoom === 75; document.querySelector('#zoomIn').disabled = zoom === 200; };
  const fitZoom = () => { const available = host.parentElement.clientWidth; const fitted = Math.floor((available / 1050) * 100); setZoom(Math.max(75, Math.min(100, fitted))); };
  window.addEventListener('resize', fitZoom);
  fitZoom();
  document.querySelector('#downloadSvg').onclick = () => {
    const svg = document.querySelector('#lockCircuit').cloneNode(true);
    svg.querySelectorAll('#codeWires,.signal-overlay,.current-flow,.fault-flow,.flyback-flow').forEach(node => node.remove());
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {type: 'image/svg+xml'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'zke-4-10-circuit.svg'; link.click(); URL.revokeObjectURL(link.href);
  };
  renderNodeInfo('memory');
  document.querySelector('#zoomIn').onclick = () => setZoom(zoom+25);
  document.querySelector('#zoomOut').onclick = () => setZoom(zoom-25);
  document.querySelector('#zoomFit').onclick = fitZoom;
  const panel = document.querySelector('.circuit-panel');
  const placeholder = document.createComment('circuit panel home'); panel.before(placeholder);
  const modal = document.querySelector('#circuitModal');
  document.querySelector('#expandCircuit').onclick = () => { modal.append(panel); modal.showModal(); setZoom(zoom); document.querySelector('#collapseCircuit').focus(); };
  document.querySelector('#collapseCircuit').onclick = () => modal.close();
  modal.addEventListener('close', () => { placeholder.after(panel); setZoom(zoom); document.querySelector('#expandCircuit').focus(); });
  window.lockDiagram = {
    render(state, entered, code, fromExit = false) {
      currentState = state; currentEntered = [...entered]; currentCode = code; currentExit = fromExit;
      const drawing = document.querySelector('#lockCircuit');
      drawing.dataset.state = state;
      drawing.dataset.exit = String(fromExit);
      drawing.classList.toggle('is-held', state === 'open' && !fromExit);
      drawing.querySelector('#exitContact').setAttribute('d',fromExit ? 'M980 535H1025' : 'M980 535L1015 519');
      clearTimeout(releaseTimer);
      drawing.classList.remove('is-releasing','is-flyback');
      drawing.querySelectorAll('[data-device]').forEach(p => {
        p.classList.toggle('is-biased', ['VT1','VT4'].includes(p.dataset.device) && state !== 'error');
        p.classList.toggle('is-on', ['VT5','VT2'].includes(p.dataset.device) && state === 'open' && !fromExit);
      });
      if (previousState === 'open' && state === 'idle') {
        drawing.classList.add('is-flyback');
        if (!previousExit) drawing.classList.add('is-releasing');
        releaseTimer = setTimeout(() => drawing.classList.remove('is-releasing','is-flyback'),600);
      }
      previousState = state; previousExit = fromExit;
      drawing.querySelectorAll('[data-key-contact]').forEach(p => p.classList.toggle('key-active', false));
      const keyRows = Object.fromEntries([...drawing.querySelectorAll('[data-key-contact]')].map((p, i) => [p.dataset.keyContact, 385 + i * 40]));
      drawing.querySelector('#codeWires').innerHTML = [...code].map((digit, stage) => {
        const resistorRow = 385 + stage * 40;
        const railX = 446 + stage * 8;
        return `<path class="net code-wire" data-code-stage="${stage + 1}" d="M435 ${keyRows[digit]}H${railX}V${resistorRow}H450"/>`;
      }).join('');
      drawing.querySelectorAll('[data-stage]').forEach(p => p.classList.toggle('is-conducting',Number(p.dataset.stage) <= entered.length));
      drawing.querySelectorAll('.memory-net').forEach((p,i) => p.classList.toggle('is-conducting',i < entered.length));
      document.querySelectorAll('[data-stage-card]').forEach(p => { const active = Number(p.dataset.stageCard) <= entered.length; p.classList.toggle('is-conducting',active); p.querySelector('small').textContent = active ? 'проводит' : 'закрыт'; });

      inspect(selected, selectedPart);
    },
    pulse(key) {
      const index = currentCode.indexOf(key);
      document.querySelector('#keypadSignal').textContent = `S1 · нажата ${key}${index < 0 ? ' → сброс' : ` → ступень ${index+1}`}`;
      document.querySelector('#lockCircuit').classList.add('is-receiving');
      const keyRow = 385 + ((Number(key) + 9) % 10) * 40;
      document.querySelector('#inputTrace').setAttribute('d', index < 0 ? `M330 ${keyRow}H400H435V855H935` : codeRoute(keyRow, index));
      document.querySelectorAll('[data-key-contact]').forEach(p=>p.classList.toggle('key-active',p.dataset.keyContact === key));
    },
    clearPulse() { document.querySelector('#lockCircuit').classList.remove('is-receiving'); document.querySelectorAll('.key-active').forEach(p=>p.classList.remove('key-active')); document.querySelector('#keypadSignal').textContent = 'S1 · ожидание клавиши'; }
  };
})();

/* ===== js\app.js ===== */
/* app.js — interaction layer: code validation, visual state, sound, dialogs and local persistence. */
const $ = (selector) => document.querySelector(selector);
let activeCode = localStorage.getItem('zke-code') || '1234';
if (!/^\d{4}$/.test(activeCode) || new Set(activeCode).size !== 4) activeCode = '1234';
let exitOverride = false;
let entered = [];
let faultId;
let inputPulseId;
let circuitState = 'idle';
let soundEnabled = localStorage.getItem('zke-sound') === 'true';
const quiz = [
  ['Что происходит при неверной цифре?', ['Цепь продолжает работу', 'Цепь сбрасывается', 'Дверь открывается'], 1],
  ['Какой элемент физически убирает защёлку?', ['Электромагнит', 'Тиристор', 'Клавиша'], 0],
  ['Что подаёт питание на электромагнит?', ['Транзисторный выходной каскад', 'Микроконтроллер DD1', 'Резистор R1'], 0],
  ['Какую функцию выполняют VD5–VD8?', ['Хранят последовательность цифр', 'Выпрямляют сетевое напряжение', 'Подсвечивают лампу'], 0],
  ['Какой элемент формирует выдержку после открытия?', ['C1', 'FU1', 'S1'], 0],
  ['Для чего нужен VD9?', ['Для подавления выброса самоиндукции YA1', 'Для выбора кода', 'Для усиления звука'], 0],
  ['Что происходит при нажатии S2?', ['Нагрузка включается напрямую', 'Код стирается навсегда', 'Схема переходит в режим настройки'], 0],
  ['Какую роль играет HL1?', ['Сигнализирует об открытии замка', 'Запоминает первую цифру', 'Понижает напряжение'], 0],
  ['Что соединяет наборное поле XP/XS?', ['Выбранные клавиши с каскадами кода', 'Сеть с трансформатором', 'Лампу с корпусом'], 0],
  ['Как закрывается замок в учебном стенде?', ['Кнопкой «Закрыть замок» или сбросом', 'Автоматически через 1 секунду', 'Только после выключения браузера'], 0]
];

function tone(type = 'click') { if (!soundEnabled || !window.AudioContext) return; const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); const now = ctx.currentTime; osc.type = type === 'error' ? 'sawtooth' : 'sine'; osc.frequency.setValueAtTime(type === 'success' ? 780 : type === 'error' ? 140 : 350, now); if (type === 'success') osc.frequency.exponentialRampToValueAtTime(1180, now + .12); gain.gain.setValueAtTime(.06, now); gain.gain.exponentialRampToValueAtTime(.001, now + (type === 'error' ? .3 : .12)); osc.start(now); osc.stop(now + .35); }
function setLog(text) { $('#eventLog').textContent = text; }
const attemptHistory = [];
const attemptLogList = $('#attemptLogList');
function recordAttempt(code, result) {
  attemptHistory.unshift({ code, result, time: new Date() });
  attemptHistory.length = Math.min(attemptHistory.length, 5);
  renderAttemptHistory();
}
function renderAttemptHistory() {
  $('#clearAttemptLog').disabled = attemptHistory.length === 0;
  if (!attemptHistory.length) {
    attemptLogList.innerHTML = '<li class="attempt-log__empty">Попыток пока нет.</li>';
    return;
  }
  attemptLogList.innerHTML = attemptHistory.map(({code, result, time}) => `<li class="attempt-log__item attempt-log__item--${result === 'Успех' ? 'success' : 'error'}"><span class="attempt-log__code">${code.split('').join(' ')}</span><span class="attempt-log__result">${result}</span><time datetime="${time.toISOString()}">${time.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</time></li>`).join('');
}
$('#clearAttemptLog').onclick = () => { attemptHistory.length = 0; renderAttemptHistory(); };
function updateCircuit(state = circuitState) {
  circuitState = state;
  const powered = state === 'open';
  window.lockDiagram.render(state, entered, activeCode, exitOverride);
  $('#closeLockButton').disabled = !powered;
  $('#finishPulse').disabled = !powered;
  $('#lockReadout').textContent = powered ? (exitOverride ? 'S2 УДЕРЖИВАЕТСЯ' : 'ДО ЗАКРЫТИЯ КНОПКОЙ') : 'ОЖИДАНИЕ КОДА';
  ['#backspaceButton', '#codeInput', '#applyCode', '#nextStep'].forEach(selector => {
    $(selector).disabled = powered || state === 'error';
  });
  $('#resetButton').disabled = false;
  $('#keypadReset').disabled = false;
  $('#exitButton').disabled = state === 'error' || (powered && !exitOverride);
  $('#exitButton').textContent = exitOverride ? 'S2 · Отпустить кнопку' : 'S2 · Выход изнутри';
  document.querySelectorAll('[data-key]').forEach(b => b.disabled = powered || state === 'error');
  document.querySelectorAll('[data-stage-digit]').forEach(p => p.textContent = activeCode[Number(p.dataset.stageDigit)]);
  $('#driverReading').textContent = `${entered.length} / 4`;
  $('#relayReading').textContent = powered ? (exitOverride ? 'S2 нажата' : 'Вручную') : 'Нет';
  $('#coilReading').textContent = powered ? 'Включён' : 'Выключен';
  $('#circuitStatus').textContent = powered
    ? (exitOverride ? 'S2 удерживается · YA1 включён напрямую' : 'Код принят · замок открыт до закрытия кнопкой')
    : state === 'error' ? 'Неверная цифра · тиристорная память сброшена'
    : entered.length ? `Проводят ${entered.length} из 4 тиристоров · ожидание следующей цифры`
    : 'Ожидание кода · VD5–VD8 закрыты';
  $('#logicText').textContent = powered
    ? (exitOverride ? 'S2 замкнула цепь нагрузки в обход составного ключа VT5 / VT2. YA1 включён, HL1 горит. Нажмите S2 повторно, чтобы отпустить кнопку и закрыть замок.' : 'VD5–VD8 проводят. Составной ключ VT5 / VT2 включил YA1; HL1 горит. Замок и схема остаются в открытом состоянии до нажатия «Закрыть замок» или «Сбросить».')
    : state === 'error' ? 'Сработала цепь сброса R19 / C3 и управляющий каскад: ток удержания цепочки прерван, VD5–VD8 закрыты. Начните набор сначала.'
    : entered.length ? `Цифра ${entered[entered.length-1]} принята: VD${entered.length+4} проводит. Ток удержания сохраняет состояние. ${entered.length < 4 ? `Следующая ступень — VD${entered.length+5}.` : ''} Электромагнит пока выключен.`
    : 'VD5–VD8 закрыты. Выпрямители питают схему, но импульс открытия отсутствует. YA1 обесточен; пружина удерживает защёлку.';
}
function clearInputPulse() {
  clearTimeout(inputPulseId);
  inputPulseId = undefined;
  window.lockDiagram.clearPulse();
}
function pulseInput(key) {
  clearInputPulse();
  window.lockDiagram.pulse(key);
  inputPulseId = setTimeout(clearInputPulse, 650);
}
function updateScreen() {
  $('#codeDisplay').textContent = [...entered, ...Array(4 - entered.length).fill('—')].join(' ');
  $('#progressNumber').textContent = `${entered.length}/4`;
  updateCircuit();
}
function reset(message = 'Система сброшена. Ожидание нового ввода.') {
  exitOverride = false;
  clearTimeout(faultId);
  faultId = undefined;
  clearInputPulse();
  entered = [];
  circuitState = 'idle';
  $('#lockStage').classList.remove('is-open');
  $('#lockPill').classList.remove('is-open');
  $('#lockPill').textContent = 'ЗАКРЫТ';
  $('#lamp').className = 'lamp';
  $('#powerDot').classList.remove('is-on');
  updateScreen();
  setLog(message);
}
function openLock(fromExit = false) {
  exitOverride = fromExit;
  updateCircuit('open');
  $('#lockStage').classList.add('is-open');
  $('#lockPill').classList.add('is-open');
  $('#lockPill').textContent = 'ОТКРЫТ';
  $('#lamp').className = 'lamp is-success';
  $('#powerDot').classList.add('is-on');
  setLog(fromExit ? 'S2 удерживается. Прямое питание YA1; нажмите S2 повторно, чтобы отпустить.' : 'Код принят. VT5 / VT2 включили YA1. Замок открыт до нажатия «Закрыть замок» или «Сбросить».');
  if (!fromExit) recordAttempt(entered.join(''), 'Успех');
  tone('success');
}
function incorrect(key) {
  recordAttempt(entered.join('') + key, 'Ошибка');
  entered = [];
  circuitState = 'error';
  updateScreen();
  $('#lamp').className = 'lamp is-error';
  setLog('Неверная цифра — ввод сброшен. Тиристорная память сброшена, YA1 выключен.');
  tone('error');
  faultId = setTimeout(() => reset(), 700);
}
function input(key) {
  if (circuitState === 'open' || circuitState === 'error' || entered.length >= 4) return;
  tone();
  pulseInput(key);
  const candidate = entered.join('') + key;
  if (!activeCode.startsWith(candidate)) return incorrect(key);
  entered.push(key);
  updateScreen();
  if (candidate === activeCode) return openLock();
  setLog(`Введено ${entered.length} из 4 цифр. Очередной тиристор проводит; набор ещё не завершён.`);
}
function applyCode() {
  const value = $('#codeInput').value.trim();
  if (!/^\d{4}$/.test(value) || new Set(value).size !== 4) {
    $('#codeHint').textContent = 'Нужны четыре разные цифры: у каждой клавиши оригинала один провод к наборному полю.';
    $('#codeHint').style.color = 'var(--danger)'; return;
  }
  activeCode = value; localStorage.setItem('zke-code', value);
  $('#codeInput').value = value;
  $('#codeHint').textContent = 'Соединения XP/XS обновлены в модели. Код сохранён в этом браузере.';
  $('#codeHint').style.color = ''; $('#saveNote').textContent = 'сохранено сейчас';
  reset('Наборное поле перенастроено. Можно вводить новый код.');
}
function renderQuiz(index = 0, score = 0) { const host = $('#quizContent'); if (index === quiz.length) { host.innerHTML = `<h2>Готово</h2><p class="quiz-result">${score} из ${quiz.length} — ${score === quiz.length ? 'идеально!' : 'ещё один заход?'}</p><button class="button button--primary" id="restartQuiz">Пройти ещё раз</button>`; $('#restartQuiz').onclick = () => renderQuiz(); return; } const [question, options, answer] = quiz[index]; host.innerHTML = `<p class="quiz-progress">ВОПРОС ${index + 1} / ${quiz.length}</p><h2>${question}</h2><div class="quiz-options">${options.map((option, i) => `<button data-answer="${i}">${option}</button>`).join('')}</div>`; host.querySelectorAll('button').forEach(button => button.onclick = () => renderQuiz(index + 1, score + (+button.dataset.answer === answer))); }

$('#codeInput').value = activeCode; updateScreen();
$('#keypad').addEventListener('click', e => { const key = e.target.dataset.key; if (key) input(key); });
$('#closeLockButton').onclick = () => reset('Замок закрыт кнопкой. YA1 выключен; пружина вернула защёлку.');
$('#finishPulse').onclick = $('#closeLockButton').onclick;
$('#nextStep').onclick = () => input(activeCode[entered.length]);
$('#exitButton').onclick = () => { if (exitOverride) return reset('S2 отпущена. YA1 выключен; пружина вернула защёлку.'); clearInputPulse(); entered = []; updateScreen(); openLock(true); };
$('#keypadReset').onclick = () => reset(); $('#resetButton').onclick = () => reset(); $('#backspaceButton').onclick = () => reset('Тиристорная память сброшена целиком. Начните с первой цифры.');
$('#applyCode').onclick = applyCode; $('#codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyCode(); });
document.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]:not(#circuitModal)') || e.target.closest('input, select, textarea, [contenteditable="true"]') || e.ctrlKey || e.altKey || e.metaKey) return;
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); input(e.key); }
});
const extrasModal = $('#extrasModal');
extrasModal.addEventListener('close', () => $('#extrasButton').setAttribute('aria-expanded', 'false'));
extrasModal.addEventListener('click', event => {
  const bounds = extrasModal.getBoundingClientRect();
  if (event.target === extrasModal && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) extrasModal.close();
});

function updateSoundButton() {
  $('#soundButton').classList.toggle('is-active', soundEnabled);
  $('#soundButton').setAttribute('aria-pressed', String(soundEnabled));
  $('#soundButton').setAttribute('aria-label', soundEnabled ? 'Выключить звук' : 'Включить звук');
}
updateSoundButton();
$('#soundButton').onclick = () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('zke-sound', soundEnabled);
  updateSoundButton();
  tone();
};
document.querySelectorAll('[data-open-modal]').forEach(button => button.onclick = () => { const modal = $(`#${button.dataset.openModal}`); if (modal.id === 'quizModal') renderQuiz(); modal.showModal(); if (modal.id === 'extrasModal') $('#extrasButton').setAttribute('aria-expanded', 'true'); }); document.querySelectorAll('.modal-close').forEach(button => button.onclick = () => button.closest('dialog').close());

// Compact minesweeper: mines are placed after the first move, so it is always safe.
const mineBoard = $('#minesweeperBoard');
const mineMessage = $('#minesweeperMessage');
const mineCounter = $('#minesweeperMines');
const mineFlagToggle = $('#minesweeperFlagToggle');
const mineSize = 9;
const mineTotal = 10;
let mineCells = [];
let mineGameOver = false;
let mineFlagMode = false;
const mineIndex = (row, column) => row * mineSize + column;
function mineNeighbours(index) { const row = Math.floor(index / mineSize); const column = index % mineSize; const result = []; for (let r = row - 1; r <= row + 1; r++) for (let c = column - 1; c <= column + 1; c++) if (r >= 0 && r < mineSize && c >= 0 && c < mineSize && (r !== row || c !== column)) result.push(mineIndex(r, c)); return result; }
function renderMineCell(index) { const cell = mineCells[index]; const button = mineBoard.children[index]; button.className = 'mine-cell'; button.textContent = ''; if (cell.open) { button.classList.add('is-open'); if (cell.mine) { button.classList.add('is-mine'); button.textContent = '✹'; } else if (cell.count) { button.classList.add(`number-${Math.min(cell.count, 4)}`); button.textContent = cell.count; } } else if (cell.flagged) { button.classList.add('is-flagged'); button.textContent = '⚑'; } }
function updateMineCounter() { mineCounter.textContent = `МИНЫ: ${mineTotal - mineCells.filter(cell => cell.flagged).length}`; }
function prepareMines(safeIndex) { const forbidden = new Set([safeIndex, ...mineNeighbours(safeIndex)]); const candidates = Array.from({ length: mineSize * mineSize }, (_, i) => i).filter(i => !forbidden.has(i)); for (let i = candidates.length - 1; i > 0; i--) { const swap = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[swap]] = [candidates[swap], candidates[i]]; } candidates.slice(0, mineTotal).forEach(index => mineCells[index].mine = true); mineCells.forEach((cell, index) => cell.count = mineNeighbours(index).filter(neighbour => mineCells[neighbour].mine).length); }
function openMineCell(index) { const cell = mineCells[index]; if (mineGameOver || cell.open || cell.flagged) return; if (!mineCells.some(item => item.mine)) prepareMines(index); cell.open = true; if (cell.mine) { mineGameOver = true; mineMessage.textContent = 'Мина. Попробуйте ещё раз.'; mineCells.forEach((item, i) => { if (item.mine) { item.open = true; renderMineCell(i); } }); tone('error'); return; } renderMineCell(index); if (!cell.count) mineNeighbours(index).forEach(openMineCell); if (!mineCells.some(item => !item.mine && !item.open)) { mineGameOver = true; mineMessage.textContent = 'Поле очищено — отлично!'; tone('success'); } }
function flagMineCell(index) { const cell = mineCells[index]; if (mineGameOver || cell.open) return; cell.flagged = !cell.flagged; renderMineCell(index); updateMineCounter(); }
function newMinesweeper() { mineGameOver = false; mineFlagMode = false; mineCells = Array.from({ length: mineSize * mineSize }, () => ({ mine: false, open: false, flagged: false, count: 0 })); mineBoard.innerHTML = ''; mineCells.forEach((_, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'mine-cell'; button.setAttribute('role', 'gridcell'); button.setAttribute('aria-label', `Клетка ${index + 1}`); button.onclick = () => mineFlagMode ? flagMineCell(index) : openMineCell(index); button.oncontextmenu = event => { event.preventDefault(); flagMineCell(index); }; mineBoard.append(button); }); mineMessage.textContent = 'Поле готово'; mineFlagToggle.textContent = 'Режим: открыть клетки'; mineFlagToggle.setAttribute('aria-pressed', 'false'); updateMineCounter(); }
$('#minesweeperReset').onclick = newMinesweeper;
mineFlagToggle.onclick = () => { mineFlagMode = !mineFlagMode; mineFlagToggle.textContent = mineFlagMode ? 'Режим: ставить флажки' : 'Режим: открыть клетки'; mineFlagToggle.setAttribute('aria-pressed', String(mineFlagMode)); };
newMinesweeper();

// Radio uses the selected public stream directly, so the volume slider is a native draggable control.
const radioAudio = $('#radioAudio');
const radioStation = $('#radioStation');
const radioPlay = $('#radioPlay');
const radioVolume = $('#radioVolume');
const radioVolumeValue = $('#radioVolumeValue');
const radioStations = $('#radioStations');
const radioOptions = [...radioStation.options];
function setRadioVolume() { radioAudio.volume = Number(radioVolume.value) / 100; radioVolumeValue.textContent = `${radioVolume.value}%`; }
function updateRadioButton() { const isPlaying = !radioAudio.paused; radioAudio.dataset.playing = String(isPlaying); radioPlay.textContent = isPlaying ? '❚❚' : '▶'; radioPlay.setAttribute('aria-label', isPlaying ? 'Поставить радио на паузу' : 'Включить радио'); }
function updateRadioCards() { [...radioStations.children].forEach(card => card.classList.toggle('is-selected', card.dataset.value === radioStation.value)); }
function selectRadioStation(value) { radioStation.value = value; radioStation.dispatchEvent(new Event('change')); }
radioOptions.forEach(option => { const card = document.createElement('button'); card.type = 'button'; card.className = 'radio-station-card'; card.dataset.value = option.value; card.title = option.textContent; card.setAttribute('aria-label', `Включить ${option.textContent}`); card.innerHTML = `<img src="https://radiobells.com/stations/${option.dataset.logo}_70.webp" alt="" loading="lazy"><span>${option.textContent}</span>`; card.onclick = () => selectRadioStation(option.value); radioStations.append(card); });
radioAudio.src = radioStation.value;
setRadioVolume();
radioVolume.addEventListener('input', setRadioVolume);
radioPlay.onclick = async () => { if (radioAudio.paused) { try { await radioAudio.play(); } catch { radioPlay.title = 'Не удалось включить этот поток. Выберите другую станцию.'; } } else radioAudio.pause(); updateRadioButton(); };
radioStation.onchange = async () => { const shouldResume = !radioAudio.paused; radioAudio.src = radioStation.value; if (shouldResume) { try { await radioAudio.play(); } catch { /* The play button keeps a retry available. */ } } updateRadioButton(); updateRadioCards(); };
radioAudio.onplay = updateRadioButton;
radioAudio.onpause = updateRadioButton;
updateRadioCards();

// Hidden story sequence: code 1984 opens a short archive and reaction test.
const archiveModal = $('#archiveModal');
const archiveReader = $('#archiveReader');
let archiveInterval;
let archiveTimeout;
function clearArchiveTest() { clearInterval(archiveInterval); clearTimeout(archiveTimeout); archiveInterval = undefined; archiveTimeout = undefined; }
function openArchive() { reset('Обнаружен архив №1984. Доступ предоставлен на один сеанс.'); archiveModal.showModal(); }
function showArchiveFile(index) { document.querySelectorAll('[data-archive-file]').forEach(file => file.classList.toggle('is-open', +file.dataset.archiveFile === index)); clearArchiveTest(); if (index === 0) archiveReader.innerHTML = '<p><b>ШИФР СМЕНЫ</b><br>«Если лампа горит слишком ровно — проверьте не лампу, а того, кто на неё смотрит».</p>'; if (index === 1) archiveReader.innerHTML = '<p><b>ЗАПИСКА ОПЕРАТОРА</b><br>03:14. После четвёртого сигнала дверь открылась сама. В журнале этого нет. Не обсуждать по внутренней связи.</p>'; if (index === 2) archiveReader.innerHTML = '<p><b>ПРОВЕРКА ЛИНИИ</b><br>Найдите светящуюся лампу 6 раз за 10 секунд.</p><button class="button button--primary" id="startSignalTest">Запустить проверку</button>'; const startButton = $('#startSignalTest'); if (startButton) startButton.onclick = startSignalTest; }
function startSignalTest() { clearArchiveTest(); let score = 0; let current = -1; let finished = false; archiveReader.innerHTML = '<div class="signal-test"><div class="signal-test__top"><span id="signalTestScore">СИГНАЛЫ: 0 / 6</span><span>10.0 c</span></div><div class="signal-lamps">' + Array.from({ length: 5 }, (_, index) => `<button class="signal-lamp" data-signal-lamp="${index}" aria-label="Сигнальная лампа ${index + 1}"></button>`).join('') + '</div></div>'; const scoreLabel = $('#signalTestScore'); const lamps = [...archiveReader.querySelectorAll('[data-signal-lamp]')]; const nextLamp = () => { lamps[current]?.classList.remove('is-target'); current = Math.floor(Math.random() * lamps.length); lamps[current].classList.add('is-target'); }; lamps.forEach((lamp, index) => lamp.onclick = () => { if (finished || index !== current) return; score++; scoreLabel.textContent = `СИГНАЛЫ: ${score} / 6`; if (score === 6) { finished = true; clearArchiveTest(); archiveReader.innerHTML = '<p><b>ЛИНИЯ ЧИСТА.</b><br>Наблюдатель отключён. Запись автоматически удалится после закрытия архива.</p>'; tone('success'); } else nextLamp(); }); nextLamp(); archiveInterval = setInterval(nextLamp, 850); archiveTimeout = setTimeout(() => { if (finished) return; finished = true; clearArchiveTest(); archiveReader.innerHTML = `<p><b>ПРОВЕРКА ЗАВЕРШЕНА.</b><br>Зафиксировано сигналов: ${score} из 6. Архив остаётся доступен.</p>`; tone('error'); }, 10000); }
document.querySelectorAll('[data-archive-file]').forEach(file => file.onclick = () => showArchiveFile(+file.dataset.archiveFile));
archiveModal.addEventListener('close', clearArchiveTest);

/* ===== js\arcade.js ===== */
(() => {
  'use strict';
  const modal = document.querySelector('#arcadeModal');
  const canvas = document.querySelector('#arcadeCanvas');
  const ctx = canvas.getContext('2d');
  const ui = name => document.querySelector('#arcade' + name);
  const W = 360, H = 480;
  const held = new Set(), pointers = new Map();
  let mode, state, paused = false, over = false, raf = 0, last = 0, accumulator = 0, best = 0;
  const random = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function record() {
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem('zke-arcade-' + mode, String(best)); } catch {}
    }
    ui('Score').textContent = 'Счёт: ' + state.score;
    if (mode === 'jump') ui('Score').textContent += ' · Уровень ' + (1 + Math.floor(difficulty(state.score) * 5));
    ui('Best').textContent = 'Рекорд: ' + best;
  }
  function end(message) {
    over = true; record(); held.clear(); pointers.clear();
    ui('Status').textContent = message + ' Счёт: ' + state.score;
    ui('Pause').disabled = true;
  }
  function pause(value = !paused) {
    if (over || !modal.open) return;
    paused = value; held.clear(); pointers.clear();
    ui('Pause').textContent = paused ? 'Продолжить' : 'Пауза';
    ui('Status').textContent = paused ? 'Пауза' : 'Игра идёт';
    last = 0; accumulator = 0; draw();
  }
  function restart() {
    cancelAnimationFrame(raf); paused = false; over = false; held.clear(); pointers.clear();
    last = 0; accumulator = 0;
    try { best = Number(localStorage.getItem('zke-arcade-' + mode)) || 0; } catch { best = 0; }
    ui('Pause').textContent = 'Пауза'; ui('Pause').disabled = false;
    ui('Status').textContent = 'Игра идёт';
    state = mode === 'snake' ? newSnake() : newJump();
    record(); draw(); raf = requestAnimationFrame(frame); canvas.focus();
  }
  function open(type) {
    mode = type;
    ui('Title').textContent = type === 'jump' ? 'Прыжок оператора' : 'Змейка';
    ui('Help').textContent = type === 'jump'
      ? '← → или A/D — движение · W / Пробел — огонь · P — пауза. Края соединены. Зелёные площадки прочные, голубые движутся, рыжие ломаются, белые исчезают. Пружина ↑, ранец J, щит S.'
      : 'Стрелки или WASD — поворот · P — пауза. Собирайте еду, избегайте стен и своего хвоста.';
    document.querySelectorAll('[data-control]').forEach(button => {
      button.hidden = type === 'jump' ? ['up','down'].includes(button.dataset.control) : button.dataset.control === 'shoot';
    });
    if (!modal.open) modal.showModal();
    restart();
  }
  // All input and animation belong to the open game only.
  document.querySelectorAll('[data-arcade]').forEach(button => button.addEventListener('click', () => open(button.dataset.arcade)));
  ui('Restart').onclick = restart; ui('Pause').onclick = () => pause();
  ui('Close').onclick = () => modal.close();
  modal.addEventListener('close', () => { cancelAnimationFrame(raf); held.clear(); pointers.clear(); last = 0; });
  window.addEventListener('blur', () => pause(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
  const keys = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', KeyA:'left', KeyD:'right', KeyW:'up', KeyS:'down', Space:'shoot' };
  document.addEventListener('keydown', event => {
    if (!modal.open) return;
    if (event.code === 'Escape') return;
    event.stopImmediatePropagation();
    if (event.code === 'KeyP') { event.preventDefault(); if (!event.repeat) pause(); return; }
    const control = mode === 'jump' && event.code === 'KeyW' ? 'shoot' : keys[event.code];
    if (!control) return;
    event.preventDefault();
    if (paused || over) return;
    held.add(event.code);
    if (mode === 'snake') turn(control);
  }, true);
  document.addEventListener('keyup', event => { if (modal.open) held.delete(event.code); });
  document.querySelectorAll('[data-control]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (paused || over) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, button.dataset.control);
      if (mode === 'snake') turn(button.dataset.control);
    });
    const release = event => pointers.delete(event.pointerId);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
  const pressed = key => [...held].some(code => (mode === 'jump' && code === 'KeyW' ? 'shoot' : keys[code]) === key) || [...pointers.values()].includes(key);
  function frame(time) {
    if (!modal.open) return;
    const dt = last ? Math.min((time-last)/1000, .05) : 0; last = time;
    if (!paused && !over) {
      accumulator += dt;
      while (accumulator >= 1/120 && !over) {
        mode === 'jump' ? stepJump(1/120) : stepSnake(1/120);
        accumulator -= 1/120;
      }
      record();
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function newSnake() {
    const s = { body:[{x:9,y:12},{x:8,y:12},{x:7,y:12}], dir:{x:1,y:0}, queue:[], elapsed:0, score:0 };
    food(s); return s;
  }
  function food(s) {
    const free = [];
    for(let y=0;y<24;y++) for(let x=0;x<18;x++)
      if(!s.body.some(p => p.x===x && p.y===y)) free.push({x,y});
    s.food = free[Math.floor(Math.random()*free.length)] || null;
  }
  function turn(control) {
    const dirs = {left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}};
    const next = dirs[control], previous = state.queue.at(-1) || state.dir;
    if (!next || state.queue.length >= 2 || (next.x===previous.x && next.y===previous.y) || (next.x===-previous.x && next.y===-previous.y)) return;
    state.queue.push(next);
  }
  function stepSnake(dt) {
    const s=state; s.elapsed+=dt;
    const interval=Math.max(.065,.17-s.score*.003);
    if(s.elapsed<interval) return;
    s.elapsed-=interval;
    if(s.queue.length) s.dir=s.queue.shift();
    const head={x:s.body[0].x+s.dir.x,y:s.body[0].y+s.dir.y};
    const eating=s.food && head.x===s.food.x && head.y===s.food.y;
    const occupied=eating?s.body:s.body.slice(0,-1);
    if(head.x<0||head.x>=18||head.y<0||head.y>=24||occupied.some(p=>p.x===head.x&&p.y===head.y)) return end('Игра окончена.');
    s.body.unshift(head);
    if(eating) { s.score++; food(s); if(!s.food) end('Всё поле заполнено. Победа!'); }
    else s.body.pop();
  }
  // World Y grows downward; upward progress moves the camera, never the physics.
  function newJump() {
    const s={player:{x:170,y:390,vy:-520}, platforms:[{x:135,y:430,w:90,type:'solid',item:null}], enemies:[], shots:[], debris:[], time:0, camera:0, top:430, anchor:135, score:0, boost:0, shield:0, cooldown:0, generated:0};
    generate(s); return s;
  }
  // Difficulty rises over 600 points, then stays within normal jump reach.
  function difficulty(score) { return clamp(score / 600, 0, 1); }
  function generate(s) {
    const d = difficulty(s.score);
    while(s.top>s.camera-110) {
      s.top-=random(50+24*d,68+18*d); s.generated++;
      s.anchor=clamp(s.anchor+random(-60-10*d,60+10*d),12,W-88);
      const roll=Math.random();
      // Permanent landing in every row keeps the main route reachable.
      const platform={x:s.anchor,y:s.top,w:86-30*d,type:'solid',item:null};
      if(s.generated>5 && roll<.12+.48*d) { platform.type='moving'; platform.base=platform.x; platform.phase=random(0,6); platform.speed=1+1.3*d; }
      if(s.generated%8===0) platform.item=['spring','jet','shield'][Math.floor(Math.random()*3)];
      s.platforms.push(platform);
      if(s.generated>5 && Math.random()<.25+.4*d) s.platforms.push({x:clamp(s.anchor+(s.anchor<180?130:-130),0,300),y:s.top+25,w:56-10*d,type:Math.random()<.5?'break':'vanish',item:null});
      const enemyInterval = Math.max(3,8-Math.floor(d*5));
      if(s.generated>14 && s.generated%enemyInterval===0) s.enemies.push({x:s.anchor<180?280:55,y:s.top-30,base:s.anchor<180?280:55,phase:random(0,6),r:16,speed:1.5+2*d,range:18+20*d});
    }
  }
  function stepJump(dt) {
    const s=state,p=s.player;
    s.time += dt;
    s.debris.forEach(d => { d.life -= dt; d.x += d.vx*dt; d.y += d.vy*dt; d.vy += d.gravity*dt; d.angle += d.spin*dt; });
    s.debris = s.debris.filter(d => d.life > 0);
    s.boost=Math.max(0,s.boost-dt); s.shield=Math.max(0,s.shield-dt); s.cooldown-=dt;
    const speed=240;
    p.x+=((pressed('right')?1:0)-(pressed('left')?1:0))*speed*dt;
    if(p.x>W) p.x=-24; if(p.x<-24) p.x=W;
    const oldBottom=p.y+30;
    p.vy=s.boost>0?-640:p.vy+1450*dt;
    p.y+=p.vy*dt;
    s.platforms.forEach(a => {
      if(a.type==='moving') { a.phase+=dt*(a.speed||1); a.x=clamp(a.base+Math.sin(a.phase)*22,0,W-a.w); }
    });
    if(p.vy>0) {
      const landing=s.platforms.filter(a=>!a.dead&&oldBottom<=a.y&&p.y+30>=a.y&&p.x+24>a.x&&p.x<a.x+a.w).sort((a,b)=>a.y-b.y)[0];
      if(landing) {
        if(landing.type==='break') shatter(landing);
        else {
          p.y=landing.y-30; p.vy=-520;
          if(landing.type==='vanish') shatter(landing);
          if(landing.item==='spring') p.vy=-850;
          if(landing.item==='jet') s.boost=2.5;
          if(landing.item==='shield') s.shield=7;
          if(landing.item!=='spring') landing.item=null;
        }
      }
    }
    if(pressed('shoot')&&s.cooldown<=0) { s.shots.push({x:p.x+12,y:p.y}); s.cooldown=.2; }
    s.shots.forEach(b=>b.y-=750*dt);
    s.enemies.forEach(e=>{
      e.phase+=dt*(e.speed||2); e.x=e.base+Math.sin(e.phase)*(e.range||22);
      s.shots.forEach(b=>{ if(!b.dead&&!e.dead&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+6) {e.dead=true;b.dead=true;} });
      if(!e.dead&&p.x+24>e.x-e.r&&p.x<e.x+e.r&&p.y+30>e.y-e.r&&p.y<e.y+e.r) {
        if(s.shield>0||s.boost>0) e.dead=true;
        else if(p.vy>0&&oldBottom<=e.y) {e.dead=true;p.vy=-520;}
        else end('Столкновение с охранным дроном.');
      }
    });
    s.camera=Math.min(s.camera,p.y-H*.42);
    s.score=Math.max(s.score,Math.floor(-s.camera/10));
    s.platforms=s.platforms.filter(a=>!a.dead&&a.y<s.camera+H+70);
    s.enemies=s.enemies.filter(e=>!e.dead&&e.y<s.camera+H+60);
    s.shots=s.shots.filter(b=>!b.dead&&b.y>s.camera-30);
    generate(s);
    if(p.y>s.camera+H+30) end('Падение. Попробуйте ещё раз!');
  }
  function shatter(platform) {
    if(platform.dead) return;
    platform.dead=true;
    const ghost=platform.type==='vanish';
    for(let i=0;i<8;i++) {
      state.debris.push({
        x:platform.x+(i+.5)*platform.w/8,y:platform.y+5,
        w:platform.w/8-1,h:ghost?5:10,
        vx:(i-3.5)*random(12,24),vy:ghost?random(-65,-15):random(-120,-45),
        gravity:ghost?30:550,angle:0,spin:random(-5,5),
        life:ghost?.65:1.1,color:ghost?'#b2e9ea':'#bd8151',
        highlight:ghost?'#ffffff':'#f5c68a'
      });
    }
  }
  function rounded(x,y,w,h,r,color) {
    ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
  }
  function drawOperator(x,y,vy,cooldown) {
    // Outlined suit, helmet visor and boots retain the 24 × 30 collision silhouette.
    ctx.save(); ctx.translate(x+12,y+15);
    ctx.rotate(clamp(((pressed('right')?1:0)-(pressed('left')?1:0))*.09,-.09,.09));
    rounded(-12,-3,24,18,5,'#15262a');
    rounded(-10,-2,20,15,4,'#e6d5a5');
    rounded(-14,0,5,10,2,'#789a83'); rounded(9,0,5,10,2,'#789a83');
    rounded(-9,10,7,5,2,'#405a5f'); rounded(2,10,7,5,2,'#405a5f');
    rounded(-12,-16,24,20,8,'#15262a');
    rounded(-10,-15,20,18,7,'#f2e7c9');
    rounded(-8,-12,16,11,4,'#255769');
    rounded(-6,-11,12,4,2,'#67bbcd');
    rect(-5,-10,4,2,'#d9faff');
    rounded(-6,4,12,6,2,'#526c64');
    circle(-3,7,1.3,'#c9ff6b'); circle(2,7,1.3,'#ffa967');
    rect(-1,-18,3,5,'#b8cbd1');
    if(cooldown>.14) { circle(.5,-20,4,'#ffe98a'); circle(.5,-20,2,'#fffbea'); }
    ctx.restore();
  }
  function drawDrone(x,y,time) {
    ctx.save(); ctx.translate(x,y);
    // Wide rotor arms, armoured shell and one red sensor distinguish enemies.
    rect(-25,-6,50,4,'#738395');
    [-23,23].forEach(dx=>{
      rect(dx-2,-12,4,10,'#a0b0b9');
      const span=8+Math.sin(time*50)*4;
      rounded(dx-span,-13,span*2,3,1,'#c1d6df');
    });
    rounded(-17,-12,34,26,9,'#18222f');
    rounded(-15,-10,30,22,8,'#718496');
    rounded(-12,-9,24,6,3,'#afbec8');
    rounded(-12,-3,24,11,5,'#293345');
    circle(0,2,7,'#752a46'); circle(0,2,4.5,'#ff526e'); circle(-1,0,1.7,'#ffe4d1');
    rect(-10,11,5,4,'#344959'); rect(5,11,5,4,'#344959');
    rect(-11,-5,3,2,'#ffcb77'); rect(8,-5,3,2,'#ffcb77');
    ctx.restore();
  }
  function rect(x,y,w,h,color) {ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function circle(x,y,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function draw() {
    rect(0,0,W,H,'#0d191c');
    ctx.strokeStyle='#1a3033';ctx.lineWidth=1;
    const grid = mode === 'snake' ? 20 : 24;
    const offset=mode==='jump'?((-state.camera)%grid):0;
    for(let x=0;x<W;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=offset;y<H;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    if(mode==='snake') drawSnake(); else drawJump();
    if(paused||over) {
      rect(0,0,W,H,'rgba(4,10,12,.72)');
      ctx.fillStyle='#dfffbd';ctx.font='bold 24px monospace';ctx.textAlign='center';
      ctx.fillText(paused?'ПАУЗА':'КОНЕЦ ИГРЫ',W/2,H/2-10);
      ctx.font='14px monospace';ctx.fillText('Счёт: '+state.score,W/2,H/2+22);ctx.textAlign='left';
    }
  }
  function drawSnake() {
    const s=state;
    if(s.food) {circle(s.food.x*20+10,s.food.y*20+10,7,'#ff965e');}
    s.body.forEach((p,i)=>rect(p.x*20+1,p.y*20+1,18,18,i===0?'#dfff91':'#77b86c'));
    const h=s.body[0];rect(h.x*20+5,h.y*20+5,3,3,'#13201c');rect(h.x*20+12,h.y*20+5,3,3,'#13201c');
  }
  function drawJump() {
    const s=state,p=s.player,cy=s.camera;
    s.platforms.forEach(a=>{
      const y=a.y-cy;
      rect(a.x,y,a.w,9,({solid:'#9ce578',moving:'#65c5e6',break:'#c68d62',vanish:'#e0e9df'})[a.type]);
      rect(a.x+3,y+9,a.w-6,3,'#38524c');
      if(a.type==='break') {ctx.strokeStyle='#302522';ctx.beginPath();ctx.moveTo(a.x+20,y);ctx.lineTo(a.x+29,y+5);ctx.lineTo(a.x+22,y+9);ctx.stroke();}
      if(a.item) {rect(a.x+a.w/2-9,y-20,18,18,a.item==='spring'?'#ffe38a':a.item==='jet'?'#ff986e':'#8cdeed');ctx.fillStyle='#152322';ctx.font='bold 14px monospace';ctx.fillText(({spring:'↑',jet:'J',shield:'S'})[a.item],a.x+a.w/2-4,y-6);}
    });
    s.debris.forEach(d => {
      ctx.save(); ctx.globalAlpha = Math.min(1,d.life/.35);
      ctx.translate(d.x,d.y-cy); ctx.rotate(d.angle);
      rect(-d.w/2,-d.h/2,d.w,d.h,d.color);
      rect(-d.w/2,-d.h/2,d.w,2,d.highlight);
      ctx.restore();
    });
    s.enemies.forEach(e=>drawDrone(e.x,e.y-cy,s.time));
    s.shots.forEach(b=>rect(b.x-2,b.y-cy,4,12,'#fff2a1'));
    const y=p.y-cy;
    if(s.shield>0){ctx.strokeStyle='#8cdeed';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+12,y+15,25,0,Math.PI*2);ctx.stroke();}
    if(s.boost>0){rect(p.x+5,y+28,14,18+Math.sin(performance.now()/50)*5,'#ff965e');}
    drawOperator(p.x,y,p.vy,s.cooldown);
    ctx.fillStyle='#95b5aa';ctx.font='11px monospace';
    if(s.boost>0)ctx.fillText('РАНЕЦ '+s.boost.toFixed(1),10,20);
    else if(s.shield>0)ctx.fillText('ЩИТ '+Math.ceil(s.shield),10,20);
  }
})();

/* ===== js\weather.js ===== */
(() => {
  const modal = document.querySelector('#weatherModal');
  const status = document.querySelector('#weatherStatus');
  const content = document.querySelector('#weatherContent');
  const refresh = document.querySelector('#weatherRefresh');
  let loadedAt = 0;
  let pending = false;
  const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
    latitude: '54.2093', longitude: '79.7477',
    current: 'temperature_2m,apparent_temperature,is_day,precipitation,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
    forecast_days: '3', timezone: 'Europe/Moscow'
  });
  const degrees = value => Number.isFinite(value) ? Math.round(value) + '°' : '—';
  function sky(code, day = 1) {
    if (code === 0) return [day ? '☀' : '☾', 'Ясно'];
    if ([1, 2].includes(code)) return ['⛅', 'Переменная облачность'];
    if (code === 3) return ['☁', 'Пасмурно'];
    if ([45, 48].includes(code)) return ['≋', 'Туман'];
    if ([51, 53, 55, 56, 57].includes(code)) return ['☂', 'Морось'];
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['☂', 'Дождь'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['❄', 'Снег'];
    if ([95, 96, 99].includes(code)) return ['ϟ', 'Гроза'];
    return ['◇', 'Нет данных'];
  }
  function clock(value) { return typeof value === 'string' && value.includes('T') ? value.split('T')[1].slice(0, 5) : '—'; }
  function render(data) {
    const current = data.current;
    const daily = data.daily;
    if (!current || !Number.isFinite(current.temperature_2m) || !daily || !Array.isArray(daily.time)) throw new Error('Incomplete forecast');
    const [icon, label] = sky(current.weather_code, current.is_day);
    const card = document.createElement('div');
    card.className = 'weather-current';
    const symbol = document.createElement('span');
    symbol.className = 'weather-icon';
    symbol.textContent = icon;
    symbol.setAttribute('aria-hidden', 'true');
    const summary = document.createElement('div');
    const temperature = document.createElement('strong');
    temperature.textContent = degrees(current.temperature_2m);
    const description = document.createElement('p');
    description.textContent = label + ' · ощущается как ' + degrees(current.apparent_temperature);
    summary.append(temperature, description);
    card.append(symbol, summary);
    const details = document.createElement('p');
    details.className = 'weather-details';
    details.textContent = 'Осадки: ' + (Number.isFinite(current.precipitation) ? current.precipitation + ' мм' : '—') + ' · Восход ' + clock(daily.sunrise?.[0]) + ' · Закат ' + clock(daily.sunset?.[0]);
    const forecast = document.createElement('div');
    forecast.className = 'weather-forecast';
    daily.time.slice(0, 3).forEach((date, index) => {
      const day = document.createElement('div');
      const title = document.createElement('span');
      title.textContent = index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : new Date(date + 'T12:00:00Z').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
      const weather = document.createElement('span');
      const [symbol, label] = sky(daily.weather_code?.[index]);
      weather.textContent = symbol;
      weather.setAttribute('aria-label', label);
      weather.title = label;
      const range = document.createElement('strong');
      range.textContent = degrees(daily.temperature_2m_max?.[index]) + ' / ' + degrees(daily.temperature_2m_min?.[index]);
      day.append(title, weather, range);
      forecast.append(day);
    });
    content.replaceChildren(card, details, forecast);
    content.hidden = false;
    status.textContent = 'Данные на ' + clock(current.time) + ' МСК';
  }
  async function load(force = false) {
    if (pending || (!force && Date.now() - loadedAt < 600000)) return;
    pending = true;
    refresh.disabled = true;
    status.textContent = 'Загрузка прогноза…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Weather unavailable');
      render(await response.json());
      loadedAt = Date.now();
    } catch {
      status.textContent = loadedAt ? 'Не удалось обновить. Показан предыдущий прогноз — попробуйте ещё раз.' : 'Погода сейчас недоступна. Проверьте интернет и нажмите «Обновить».';
    } finally {
      clearTimeout(timeout);
      pending = false;
      refresh.disabled = false;
    }
  }
  document.querySelector('#weatherButton').addEventListener('click', () => {
    modal.showModal();
    load();
  });
  refresh.addEventListener('click', () => load(true));
})();

