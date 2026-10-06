const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

export const charDelay = (speed = 'normal') => {
  if (speed === 'fast') return Math.round(rand(1, 2));
  if (speed === 'slow') return Math.round(rand(6, 14));
  return Math.random() < 0.1 ? Math.round(rand(6, 14)) : Math.round(rand(1, 4));
};

export const pauseDelay = () => (Math.random() < 0.05 ? Math.round(rand(40, 90)) : Math.round(rand(2, 18)));

const glitchGlyphs = '01#%@$&*+=<>/\\';
export const scrambleText = (text) => [...text].map((char) => (
  char !== ' ' && Math.random() < 0.3 ? glitchGlyphs[Math.floor(Math.random() * glitchGlyphs.length)] : char
)).join('');

const kernelNoise = [
  'acpi: bus type PCI registered',
  'pci 0000:00:01.0: [8086:7000] type 00 class 0x060100',
  'usbcore: registered new interface driver usbfs',
  'usbcore: registered new interface driver hub',
  'NET: Registered PF_INET protocol family',
  'clocksource: tsc: mask: 0xffffffffffffffff',
  'random: crng init done',
  'systemd[1]: detected architecture x86-64',
  'EXT4-fs (sda1): mounted filesystem with ordered data mode',
  'input: AT Translated Set 2 keyboard as /devices/platform/i8042',
];

const funLines = [
  ['brewing coffee', 'OK'],
  ['compiling excuses', 'OK'],
  ['warming up the GPU', 'OK'],
  ['untangling cables', 'DONE'],
  ['reticulating splines', 'OK'],
  ['asking the rubber duck', 'OK'],
  ['feeding the build server', 'DONE'],
];

const hexDump = (text) => {
  const bytes = [...text].map((char) => char.charCodeAt(0));
  const rows = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const chunk = bytes.slice(offset, offset + 16);
    const hex = chunk.map((byte) => byte.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
    const ascii = chunk.map((byte) => String.fromCharCode(byte)).join('');
    rows.push(`0x${offset.toString(16).padStart(4, '0')}: ${hex}  |${ascii}|`);
  }
  return rows;
};

const period = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export function buildBootScript() {
  let clock = 0;
  const stamp = () => {
    clock += rand(0.002, 0.012);
    return `[${clock.toFixed(6).padStart(10, ' ')}]`;
  };
  const dotted = (label, width = 66) => `${stamp()} ${label} `.padEnd(width, '.') + ' ';
  const steps = [];

  const push = (step) => {
    if (steps.length > 2 && step.kind !== 'dump' && !step.pre && Math.random() < 0.07) step.pre = randInt(250, 500);
    steps.push(step);
  };

  const type = (text, tone, opts = {}) => push({ kind: 'type', text, tone, ...opts, final: [{ text, tone }] });

  const spin = (head, results, tone = 'success') => {
    const last = results[results.length - 1];
    push({ kind: 'spin', head, results, tone, final: [{ text: head + last.text, tone }] });
  };

  const bar = (head, ms, done = 'OK', tone = 'success') => {
    push({ kind: 'bar', head, ms, tone, final: [{ text: `${head}[${'#'.repeat(12)}] ${done}`, tone }] });
  };

  const dump = (lines, gap = 22) => push({ kind: 'dump', lines, gap, final: lines });

  const funPool = shuffle(funLines);
  const maybeFun = (chance = 0.35) => {
    if (Math.random() > chance || funPool.length === 0) return;
    const [label, result] = funPool.pop();
    spin(dotted(label, 52), [{ text: result, ms: randInt(250, 550) }]);
  };

  const now = new Date();
  const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
  const build = `KENCHI-DEV-${String(randInt(1, 999)).padStart(3, '0')}`;
  const memory = pick([8, 16, 32]);
  const ip = `192.168.${String(randInt(0, 9)).padStart(2, '0')}.${randInt(2, 254)}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  type(`${stamp()} KENCHI_OS 6.26.01-portfolio x86_64 booting`, 'system', { speed: 'fast' });
  type(`${stamp()} BIOS date: ${date}  |  build: ${build}`, 'dim', { speed: 'fast' });
  spin(dotted('CPU: initializing visual processing unit'), [{ text: 'OK', ms: randInt(350, 700) }]);
  type(`${stamp()} memory: ${memory}GB available / ${memory * 256}MB allocated`, 'dim');

  dump(kernelNoise.slice(0, randInt(5, 7)).map((text) => ({ text: `${stamp()} ${text}`, tone: 'dim' })));

  spin(dotted('loading /lib/identity.so'), [{ text: 'OK', ms: randInt(250, 500) }]);
  bar(dotted('loading /lib/curiosity.so', 40), randInt(500, 900));
  maybeFun();
  spin(dotted('loading /lib/problem-solving.so'), [{ text: 'OK', ms: randInt(250, 500) }]);

  spin(dotted('mounting virtual filesystem: /portfolio'), [{ text: 'OK', ms: randInt(200, 450) }]);
  spin(dotted('mounting virtual filesystem: /projects'), [
    { text: 'RETRY', ms: randInt(350, 600), tone: 'warn' },
    { text: 'OK', ms: randInt(400, 700) },
  ]);
  spin(dotted('mounting virtual filesystem: /toolbox'), [{ text: 'OK', ms: randInt(200, 450) }]);

  type(`${stamp()} checking filesystem integrity`, 'system');
  ['/portfolio', '/projects', '/toolbox'].forEach((mount) => bar(`             -> ${mount} `.padEnd(34, '.') + ' ', randInt(350, 650)));

  spin(dotted(`network interface eth0: ${ip}`), [{ text: 'UP', ms: randInt(300, 600) }], 'info');
  spin(dotted('secure connection: TLS 1.3'), [{ text: 'ESTABLISHED', ms: randInt(400, 800) }], 'info');
  maybeFun();

  type(`${stamp()} scanning /projects for active modules`, 'system');
  ['verif-ai', 'bimby', 'upang-booktrack'].forEach((name) => spin(`             -> ${name} `.padEnd(52, '.') + ' ', [{ text: 'FOUND', ms: randInt(150, 350) }]));

  dump([
    { text: `${stamp()} dumping identity block`, tone: 'system' },
    ...hexDump('SHEAN KENCHI TOMELDAN / DAGUPAN-CITY').map((text) => ({ text, tone: 'dim' })),
  ], 35);

  bar(dotted('indexing skills: python / react / kotlin / ai', 54), randInt(700, 1100), 'COMPLETE');
  maybeFun();
  spin(dotted('starting service: creative_engine'), [{ text: 'RUNNING', ms: randInt(250, 550) }], 'info');
  spin(dotted('starting service: shipping_engine'), [{ text: 'RUNNING', ms: randInt(250, 550) }], 'info');
  spin(`${stamp()} warn: coffee level low, retrying `.padEnd(66, '.') + ' ', [
    { text: 'WARN', ms: randInt(350, 600), tone: 'warn' },
    { text: 'OK', ms: randInt(500, 900) },
  ]);
  type(`${dotted('checking status: available_for_opportunities')}TRUE`, 'success');

  type(`${stamp()} user: shean_kenchi_tomeldan`, 'system', { glitch: true });
  type(`${stamp()} location: dagupan-city / philippines`, 'dim');
  type(`${stamp()} role: software developer / product thinker`, 'dim');

  type(`${stamp()} detecting timezone: ${timezone}`, 'dim');
  type(`${stamp()} display: ${window.innerWidth}x${window.innerHeight} @ ${window.devicePixelRatio || 1}x / locale ${navigator.language}`, 'dim');
  type(`${stamp()} good ${period()}, visitor.`, 'info');

  type(`${stamp()} portfolio manifest: 3 areas / 3 projects / 1 user`, 'info');
  spin(dotted('starting interactive shell'), [{ text: 'OK', ms: randInt(400, 800) }]);
  type(`${stamp()} system ready. awaiting visitor input.`, 'system', { speed: 'slow' });

  return steps;
}
