import { useEffect, useRef, useState } from 'react';

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const BAR_WIDTH = 16;
const MAX_POPUPS = 3;

const cmd = (text) => ({ kind: 'cmd', text });
const out = (text, tone = 'out') => ({ kind: 'out', text, tone });
const bar = (label, target = 100) => ({ kind: 'bar', label, target });

const factories = [
  () => ({
    title: 'ssh',
    width: 330,
    lines: [cmd('ssh visitor@kenchi.dev'), out('connecting ...'), out('host key verified'), out('authenticating ... OK'), out('welcome to KENCHI_OS', 'ok')],
  }),
  () => ({
    title: 'ping',
    width: 340,
    lines: [
      cmd('ping kenchi.dev'),
      ...Array.from({ length: 4 }, () => out(`64 bytes from 192.168.1.${randInt(2, 90)}: time=${randInt(8, 48)} ms`)),
      out('4 packets sent, 0% loss', 'ok'),
    ],
  }),
  () => ({
    title: 'top',
    width: 300,
    lines: [cmd('top -n1'), bar('cpu', randInt(18, 85)), bar('mem', randInt(30, 80)), out(`tasks: ${randInt(90, 180)} total, 1 running`)],
  }),
  () => ({
    title: 'portfolio.log',
    width: 360,
    lines: [
      cmd('tail -f portfolio.log'),
      out(`[${String(randInt(10, 23)).padStart(2, '0')}:${String(randInt(10, 59)).padStart(2, '0')}] render: area-01 ready`),
      out('[..] cache: warmed 12 entries'),
      out('[..] session: visitor connected'),
      out('[..] motion_engine: idle', 'ok'),
    ],
  }),
  () => ({
    title: 'build',
    width: 320,
    lines: [cmd('npm run build'), bar('building'), out(`built in ${rand(0.8, 2.4).toFixed(1)}s`, 'ok')],
  }),
  () => ({
    title: 'wget',
    width: 340,
    lines: [cmd('wget kenchi.dev/resume.pdf'), bar('resume.pdf'), out("saved 'resume.pdf' [128 KB]", 'ok')],
  }),
  () => ({
    title: 'ALERT',
    width: 340,
    lines: [cmd('alert --level=warn'), out('WARNING: too much talent detected', 'warn'), out('suppressing ... FAILED', 'warn')],
  }),
];

function PopupTerminal({ spec, onDone }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(onDone);
  const current = spec.lines[index];

  useEffect(() => {
    if (!current) {
      doneRef.current();
      return undefined;
    }
    let timer;
    if (current.kind === 'cmd') {
      timer = window.setTimeout(() => {
        if (typed < current.text.length) setTyped((value) => value + 1);
        else { setIndex((value) => value + 1); setTyped(0); }
      }, typed < current.text.length ? 18 : 140);
    } else if (current.kind === 'out') {
      timer = window.setTimeout(() => setIndex((value) => value + 1), rand(80, 200));
    } else {
      timer = window.setTimeout(() => {
        if (progress >= current.target) { setIndex((value) => value + 1); setProgress(0); }
        else setProgress((value) => Math.min(current.target, value + rand(6, 16)));
      }, progress >= current.target ? 100 : 45);
    }
    return () => window.clearTimeout(timer);
  }, [current, typed, progress]);

  const rows = spec.lines.slice(0, index);

  const renderLine = (line, key) => {
    if (line.kind === 'cmd') return <p className="popup-cmd" key={key}>$ {line.text}</p>;
    if (line.kind === 'out') return <p className={`popup-${line.tone}`} key={key}>{line.text}</p>;
    const value = key === 'live' ? progress : line.target;
    const filled = Math.round((value / 100) * BAR_WIDTH);
    return <p className="popup-out" key={key}>{line.label.padEnd(10, ' ')}[{'#'.repeat(filled).padEnd(BAR_WIDTH, '.')}] {String(Math.round(value)).padStart(3, ' ')}%</p>;
  };

  return (
    <div className="popup-term">
      {rows.map((line, i) => renderLine(line, i))}
      {current?.kind === 'cmd' && <p className="popup-cmd">$ {current.text.slice(0, typed)}<span className="boot-typing-cursor" aria-hidden="true" /></p>}
      {current?.kind === 'bar' && renderLine(current, 'live')}
    </div>
  );
}

export default function BootPopups({ running }) {
  const [popups, setPopups] = useState([]);
  const lastTypeRef = useRef(-1);
  const idRef = useRef(0);

  const closePopup = (id) => {
    setPopups((current) => current.map((item) => (item.id === id ? { ...item, closing: true } : item)));
    window.setTimeout(() => setPopups((current) => current.filter((item) => item.id !== id)), 320);
  };

  useEffect(() => {
    if (!running) {
      setPopups((current) => current.map((item) => ({ ...item, closing: true })));
      const timer = window.setTimeout(() => setPopups([]), 320);
      return () => window.clearTimeout(timer);
    }

    let timer;
    const limit = window.innerWidth < 720 ? 1 : MAX_POPUPS;
    const spawn = () => {
      setPopups((current) => {
        if (current.filter((item) => !item.closing).length >= limit) return current;
        let type = randInt(0, factories.length - 1);
        if (type === lastTypeRef.current) type = (type + 1) % factories.length;
        lastTypeRef.current = type;
        const spec = factories[type]();
        const width = Math.min(spec.width, window.innerWidth - 16);
        const x = window.innerWidth * rand(0.46, 0.7) - width / 2;
        const y = window.innerHeight * rand(0.18, 0.62);
        idRef.current += 1;
        return [...current, { id: idRef.current, spec, width, x: Math.max(8, x), y, closing: false }];
      });
      timer = window.setTimeout(spawn, rand(450, 1200));
    };
    timer = window.setTimeout(spawn, 700);
    return () => window.clearTimeout(timer);
  }, [running]);

  return popups.map((popup) => (
    <aside
      key={popup.id}
      className={`cmd-window popup focused${popup.closing ? ' closing close' : ''}`}
      style={{ left: popup.x, top: popup.y, width: popup.width }}
      aria-hidden="true"
    >
      <header className="cmd-window-bar">
        <span className="cmd-window-title">{popup.spec.title}</span>
        <span className="popup-dots">_ x</span>
      </header>
      <div className="cmd-window-body">
        <PopupTerminal spec={popup.spec} onDone={() => window.setTimeout(() => closePopup(popup.id), rand(500, 1100))} />
      </div>
    </aside>
  ));
}
