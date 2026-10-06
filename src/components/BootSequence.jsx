import { useEffect, useRef, useState } from 'react';
import AppWindow from './AppWindow.jsx';
import BootPopups from './BootPopups.jsx';
import { WindowBody, windowGroup, windowIds, windowMeta } from './windowContents.jsx';
import { projects } from '../data/projects.js';
import { buildBootScript, charDelay, pauseDelay, scrambleText } from './bootScript.js';

const banner = [
  '#   # ##### #   # ##### #   # #####',
  '#  #  #     ##  # #     #   #   #',
  '###   ####  # # # #     #####   #',
  '#  #  #     #  ## #     #   #   #',
  '#   # ##### #   # ##### #   # #####',
];
const scrambleGlyphs = '01#%@$&*+=';
const scrambleSteps = 14;

const commands = [
  { name: 'help', desc: 'show available commands' },
  { name: 'about', desc: 'who i am and what i use' },
  { name: 'projects', desc: 'selected work' },
  { name: 'resume', desc: 'view or download my resume' },
  { name: 'contact', desc: 'email and links' },
  { name: 'clear', desc: 'clear the terminal' },
];

const L = (text, tone = 'system') => ({ text, tone });

const outputs = {
  help: () => [
    L('available commands:', 'info'),
    ...commands.map((item) => L(`  ${`/${item.name}`.padEnd(11)} ${item.desc}`, 'dim')),
  ],
  'sudo hire kenchi': () => [
    L('[sudo] password for visitor: ********', 'dim'),
    L('access granted. kenchi has been added to your team.', 'success'),
    L('next step: kenchitomeldan@gmail.com', 'info'),
  ],
};

const aliases = { cv: 'resume', 'open projects': 'projects', 'open about': 'about', 'open resume': 'resume', 'cat contact': 'contact', '?': 'help' };

const formatClock = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const spinnerFrames = ['|', '/', '-', '\\'];
const loadingMs = 1100;
const BAR_WIDTH = 24;
const taskSteps = ['resolving command', 'reading data', 'rendering output'];
const stepSpan = 30;

const BOOT_BAR_WIDTH = 12;
const BOOT_SPEED = 0.16;
const resultToken = /^([\s\S]*\s)(OK|FOUND|UP|ESTABLISHED|COMPLETE|RUNNING|TRUE|RETRY|WARN|DONE)$/;

function TypeIn({ text, delay, duration }) {
  return (
    <span className="type-in" style={{ '--chars': text.length, '--delay': `${delay}s`, '--dur': `${duration}s` }}>{text}</span>
  );
}

function BootText({ text }) {
  const match = text.match(resultToken);
  if (!match) return text;
  return <>{match[1]}<span key={match[2]} className={`boot-result tok-${match[2].toLowerCase()}`}>{match[2]}</span></>;
}

function currentBootLines(step, boot, spinTick) {
  const head = step.kind === 'type' ? step.text : step.head;
  const tone = step.tone;
  switch (boot.phase) {
    case 'pre': return step.kind === 'dump' ? [] : [{ text: '', tone, cursor: true }];
    case 'type': return step.kind === 'dump' ? [] : [{ text: head.slice(0, boot.n), tone, cursor: true }];
    case 'glitch': return [{ text: scrambleText(head), tone }];
    case 'spin': return [{ text: `${head}[ ${spinnerFrames[spinTick % spinnerFrames.length]} ]`, tone }];
    case 'result': return [{ text: head + step.results[boot.n].text, tone }];
    case 'bar': {
      const filled = Math.round(boot.p * BOOT_BAR_WIDTH);
      return [{ text: `${head}[${'#'.repeat(filled).padEnd(BOOT_BAR_WIDTH, '.')}] ${String(Math.round(boot.p * 100)).padStart(3, ' ')}%`, tone }];
    }
    case 'dump': return step.lines.slice(0, boot.n);
    default: return step.final;
  }
}

function CommandOutput({ entry, onUpdate, onLoaded }) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return undefined;
    const startedAt = performance.now();
    const tick = window.setInterval(() => setProgress(Math.min(((performance.now() - startedAt) / loadingMs) * 100, 100)), 40);
    const done = window.setTimeout(() => setIsLoading(false), loadingMs + 120);
    return () => { window.clearInterval(tick); window.clearTimeout(done); };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || lineIndex >= entry.lines.length) return undefined;
    const finished = charIndex >= entry.lines[lineIndex].text.length;
    const timer = window.setTimeout(() => {
      if (finished) {
        setLineIndex((current) => current + 1);
        setCharIndex(0);
      } else {
        setCharIndex((current) => current + 1);
      }
    }, finished ? 30 : 4);
    return () => window.clearTimeout(timer);
  }, [isLoading, lineIndex, charIndex, entry.lines]);

  useEffect(() => { onUpdate(); }, [isLoading, lineIndex, charIndex, progress]);

  useEffect(() => {
    if (!isLoading && entry.kind === 'clear') onLoaded?.();
  }, [isLoading]);

  const typing = !isLoading && lineIndex < entry.lines.length ? entry.lines[lineIndex] : null;

  return (
    <div className="boot-log-entry">
      <p className="boot-line system">visitor@you:~$ {entry.command}</p>
      {isLoading && (
        <div className="boot-progress">
          <p className="boot-line info boot-spinner">
            [{'#'.repeat(Math.round((progress / 100) * BAR_WIDTH)).padEnd(BAR_WIDTH, '.')}] {String(Math.round(progress)).padStart(3, ' ')}%
          </p>
          {taskSteps.map((step, index) => {
            const startsAt = index * stepSpan;
            if (progress < startsAt) return null;
            const isDone = progress >= startsAt + stepSpan;
            return (
              <p className={`boot-line ${isDone ? 'success' : 'dim'}`} key={step}>
                {`${step} `.padEnd(24, '.')} {isDone ? 'OK' : spinnerFrames[Math.floor(progress / 8) % spinnerFrames.length]}
              </p>
            );
          })}
        </div>
      )}
      {!isLoading && entry.lines.slice(0, lineIndex).map((line, index) => (
        <p className={`boot-line ${line.tone}`} key={index}>{line.text}</p>
      ))}
      {typing && (
        <p className={`boot-line ${typing.tone}`}>{typing.text.slice(0, charIndex)}<span className="boot-typing-cursor" aria-hidden="true" /></p>
      )}
    </div>
  );
}

export default function BootSequence() {
  const scriptRef = useRef(null);
  if (!scriptRef.current) scriptRef.current = buildBootScript();
  const lastLogin = useRef(`last login: ${new Date().toLocaleString()} from visitor`).current;
  const steps = scriptRef.current;
  const [boot, setBoot] = useState({ i: 0, phase: 'pre', n: 0, p: 0 });
  const [spinTick, setSpinTick] = useState(0);
  const [command, setCommand] = useState('');
  const [log, setLog] = useState([]);
  const [eraseLines, setEraseLines] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [trayIds, setTrayIds] = useState([]);
  const [mountedIds, setMountedIds] = useState([]);
  const [visibleWindows, setVisibleWindows] = useState({});
  const [focusOrder, setFocusOrder] = useState([]);
  const [activeProject, setActiveProject] = useState(projects[0].id);
  const [isBlinking, setIsBlinking] = useState(false);
  const [groupExit, setGroupExit] = useState(null);
  const windowStateRef = useRef({});
  const [bannerStep, setBannerStep] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const commandRef = useRef(null);
  const outputRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const isReady = boot.i >= steps.length;
  const uptime = Math.floor((now.getTime() - startedAtRef.current) / 1000);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (bannerStep >= scrambleSteps) return undefined;
    const timer = window.setTimeout(() => setBannerStep((current) => current + 1), 70);
    return () => window.clearTimeout(timer);
  }, [bannerStep]);

  useEffect(() => {
    if (boot.i >= steps.length) return undefined;
    const step = steps[boot.i];
    const head = step.kind === 'type' ? step.text : step.head;
    const go = (patch, delay) => window.setTimeout(() => setBoot((current) => ({ ...current, ...patch })), delay * BOOT_SPEED);
    let timer;

    if (boot.phase === 'pre') {
      timer = go({ phase: step.kind === 'dump' ? 'dump' : 'type', n: 0 }, step.pre ?? 0);
    } else if (boot.phase === 'type') {
      if (boot.n < head.length) timer = go({ n: boot.n + 1 }, charDelay(step.speed));
      else if (step.kind === 'spin') timer = go({ phase: 'spin', n: 0 }, 60);
      else if (step.kind === 'bar') timer = go({ phase: 'bar', p: 0 }, 60);
      else timer = go({ phase: step.glitch ? 'glitch' : 'pause' }, 0);
    } else if (boot.phase === 'glitch') {
      timer = go({ phase: 'pause' }, 340);
    } else if (boot.phase === 'spin') {
      timer = go({ phase: 'result' }, step.results[boot.n].ms);
    } else if (boot.phase === 'result') {
      timer = boot.n >= step.results.length - 1
        ? go({ phase: 'pause' }, 0)
        : go({ phase: 'spin', n: boot.n + 1 }, 380);
    } else if (boot.phase === 'bar') {
      timer = boot.p >= 1
        ? go({ phase: 'pause' }, 0)
        : go({ p: Math.min(1, boot.p + (40 / (step.ms * BOOT_SPEED)) * (0.4 + Math.random() * 1.2)) }, 40 / BOOT_SPEED);
    } else if (boot.phase === 'dump') {
      timer = boot.n >= step.lines.length ? go({ phase: 'pause' }, 0) : go({ n: boot.n + 1 }, step.gap);
    } else {
      timer = window.setTimeout(() => setBoot({ i: boot.i + 1, phase: 'pre', n: 0, p: 0 }), pauseDelay());
    }

    return () => window.clearTimeout(timer);
  }, [boot, steps]);

  useEffect(() => {
    if (boot.phase !== 'spin' && boot.phase !== 'glitch') return undefined;
    const timer = window.setInterval(() => setSpinTick((value) => value + 1), 80);
    return () => window.clearInterval(timer);
  }, [boot.phase]);

  const skipBoot = () => {
    setBoot({ i: steps.length, phase: 'pre', n: 0, p: 0 });
    setBannerStep(scrambleSteps);
  };

  useEffect(() => {
    if (!isReady) return;
    commandRef.current?.focus();
  }, [isReady]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!isReady) {
        skipBoot();
        return;
      }
      if (event.target instanceof HTMLInputElement || event.key.length !== 1) return;
      commandRef.current?.focus();
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isReady]);

  useEffect(() => {
    if (!outputRef.current) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [boot, log]);

  const scrollToBottom = () => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  };

  const focusWindow = (id) => setFocusOrder((current) => [...current.filter((item) => item !== id), id]);

  const openWindow = (id) => {
    if (id !== 'projectdetail') setTrayIds((current) => (current.includes(id) ? current : [...current, id]));
    setMountedIds((current) => (current.includes(id) ? current : [...current, id]));
    setVisibleWindows((current) => ({ ...current, [id]: true }));
    focusWindow(id);
  };

  const hideWindow = (id, mode = 'minimize') => {
    if (mode === 'blink') {
      setVisibleWindows((current) => ({ ...current, [id]: false }));
      return;
    }
    const ids = windowGroup.includes(id) ? windowGroup : [id];
    setGroupExit(mode);
    setVisibleWindows((current) => ({ ...current, ...Object.fromEntries(ids.map((item) => [item, false])) }));
    if (mode === 'close') setTrayIds((current) => current.filter((item) => !ids.includes(item)));
  };

  const topWindow = [...focusOrder].reverse().find((id) => visibleWindows[id]);
  windowStateRef.current = { visibleWindows, activeProject };

  const windowTitle = (id) => (id === 'projectdetail' ? `${activeProject}/` : windowMeta[id].title);

  const openProjectDetail = (projectId) => {
    const { visibleWindows: visible, activeProject: active } = windowStateRef.current;
    if (!visible.projectdetail) {
      setActiveProject(projectId);
      openWindow('projectdetail');
    } else if (active === projectId) {
      focusWindow('projectdetail');
    } else {
      setIsBlinking(true);
      hideWindow('projectdetail', 'blink');
      window.setTimeout(() => {
        setActiveProject(projectId);
        setIsBlinking(false);
        openWindow('projectdetail');
      }, 340);
    }
  };

  const toggleFromTray = (id) => {
    const ids = windowGroup.includes(id) ? windowGroup : [id];
    if (!ids.some((item) => visibleWindows[item])) ids.forEach(openWindow);
    else if (!ids.includes(topWindow)) ids.forEach(focusWindow);
    else hideWindow(id);
  };

  const startErase = () => {
    setEraseLines(log.flatMap((entry) => [
      L(`visitor@you:~$ ${entry.command}`, 'system'),
      ...entry.lines,
    ]));
  };

  useEffect(() => {
    if (!eraseLines) return undefined;
    if (eraseLines.length === 0) {
      setEraseLines(null);
      setLog([]);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setEraseLines((current) => {
        const last = current[current.length - 1];
        const trimmed = last.text.slice(0, -14);
        return trimmed ? [...current.slice(0, -1), { ...last, text: trimmed }] : current.slice(0, -1);
      });
    }, 16);
    return () => window.clearTimeout(timer);
  }, [eraseLines]);

  const runCommand = (raw) => {
    const typed = raw.trim().toLowerCase().replace(/^\/+/, '').replace(/\s+/g, ' ');
    if (!isReady || eraseLines || !typed) return;
    const name = aliases[typed] ?? typed;
    const shown = `/${typed}`;

    setHistory((current) => [shown, ...current]);
    setHistoryIndex(-1);
    setCommand('');

    if (name === 'clear') {
      setLog((current) => [...current, { id: `${Date.now()}-${current.length}`, command: shown, lines: [], kind: 'clear' }]);
      return;
    }

    if (windowIds.includes(name)) {
      window.setTimeout(() => {
        openWindow(name);
        if (name === 'projects') openProjectDetail(projects[0].id);
      }, loadingMs + 120);
    }

    const lines = outputs[name]
      ? outputs[name]()
      : windowIds.includes(name)
        ? [L(`launching ${name} window ... OK`, 'success')]
        : [L(`command not found: ${shown}. try '/help'`, 'error')];
    setLog((current) => [...current, { id: `${Date.now()}-${current.length}`, command: shown, lines }]);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(command);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const prefix = command.trim().toLowerCase().replace(/^\/+/, '');
      const match = prefix && commands.find((item) => item.name.startsWith(prefix));
      if (match) setCommand(`/${match.name}`);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      const next = Math.min(Math.max(historyIndex + (event.key === 'ArrowUp' ? 1 : -1), -1), history.length - 1);
      setHistoryIndex(next);
      setCommand(next === -1 ? '' : history[next]);
    }
  };

  const scrambledBanner = banner.map((row) => (
    [...row].map((char) => (
      char === '#' && Math.random() * scrambleSteps > bannerStep
        ? scrambleGlyphs[Math.floor(Math.random() * scrambleGlyphs.length)]
        : char
    )).join('')
  )).join('\n');

  const bootEntries = [
    ...steps.slice(0, boot.i).flatMap((step, i) => step.final.map((line, j) => ({ ...line, key: `${i}-${j}` }))),
    ...(isReady ? [] : currentBootLines(steps[boot.i], boot, spinTick).map((line, j) => ({ ...line, key: `${boot.i}-${j}` }))),
  ];

  return (
    <section className="boot-sequence" aria-label="Portfolio boot sequence" onClick={() => { if (!isReady) skipBoot(); }}>
      <div className="boot-noise" aria-hidden="true" />
      <div className="boot-vignette" aria-hidden="true" />
      <div className="boot-shell">
        <div className="boot-chrome">
          <span><i className={isReady ? 'ready' : ''} /> KENCHI OS / TERMINAL</span>
          <span className="boot-chrome-right">
            {isReady && (
              <button type="button" className="boot-chrome-button" onClick={() => toggleFromTray('help')}>
                [ ? COMMANDS ]
              </button>
            )}
            <span className={`boot-state ${isReady ? 'ready' : ''}`}>{isReady ? 'READY' : 'BOOTING'}</span>
            <span>UP {String(Math.floor(uptime / 60)).padStart(2, '0')}:{String(uptime % 60).padStart(2, '0')}</span>
            <span>{formatClock(now)}</span>
          </span>
        </div>
        <div className="boot-output" ref={outputRef} aria-live="polite">
          <pre className="boot-banner" aria-label="Kenchi system online">{scrambledBanner}</pre>
          <p className="boot-status"><span>///</span> SYSTEM ONLINE / PORTFOLIO KERNEL READY</p>
          {bootEntries.map((line) => (
            <p className={`boot-line ${line.tone}`} key={line.key}>
              <BootText text={line.text} />
              {line.cursor && <span className="boot-typing-cursor" aria-hidden="true" />}
            </p>
          ))}
          {!isReady && <p className="boot-skip">press any key to skip</p>}
          {isReady && (
            <div className="boot-prompt-block">
              <p className="boot-ready"><TypeIn text="PORTFOLIO SYSTEM READY" delay={0} duration={0.45} /></p>
              <p className="boot-lastlogin"><TypeIn text={lastLogin} delay={0.45} duration={0.5} /></p>
              {eraseLines ? (
                <div className="boot-log-entry">
                  {eraseLines.map((line, index) => (
                    <p className={`boot-line ${line.tone}`} key={index}>
                      {line.text}{index === eraseLines.length - 1 && <span className="boot-typing-cursor" aria-hidden="true" />}
                    </p>
                  ))}
                </div>
              ) : log.map((entry) => (
                <CommandOutput entry={entry} onUpdate={scrollToBottom} onLoaded={startErase} key={entry.id} />
              ))}
              <p className="boot-question"><TypeIn text="visitor@you:~$ welcome. type /help to see what you can do." delay={0.95} duration={0.8} /></p>
              <div className="boot-input-line enter" onClick={() => commandRef.current?.focus()}>
                <span className="boot-prompt-label">visitor@you:~$</span>
                <span className="boot-input-wrap">
                  <span className="boot-typed" aria-hidden="true">
                    {command}
                    <span className="boot-block-cursor" />
                    {!command && <span className="boot-ghost">type "/help" to get started</span>}
                  </span>
                  <input
                    ref={commandRef}
                    value={command}
                    onChange={(event) => setCommand(event.target.value.slice(0, 24))}
                    onKeyDown={handleKeyDown}
                    aria-label="Type a command. Try /help"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    autoFocus
                  />
                </span>
              </div>
            </div>
          )}
        </div>
        {isReady && (
          <nav className="boot-tray" aria-label="Open windows">
            <span className="boot-tray-label">TRAY</span>
            {trayIds.length === 0 && <span className="boot-tray-empty">empty. try /help</span>}
            {trayIds.map((id) => (
              <button
                type="button"
                key={id}
                className={`boot-tray-item${visibleWindows[id] ? ' open' : ''}${topWindow === id ? ' active' : ''}`}
                onClick={() => toggleFromTray(id)}
              >
                {windowTitle(id)}
              </button>
            ))}
          </nav>
        )}
        <div className="boot-footer"><span>BUILD / TEST / LEARN</span><span>dagupan-city.ph</span><span>v1.0.0</span></div>
      </div>
      <BootPopups running={!isReady} />
      {isReady && mountedIds.map((id) => (
        <AppWindow
          key={id}
          title={windowTitle(id)}
          width={windowMeta[id].width}
          centered={windowMeta[id].centered}
          anchor={windowMeta[id].anchor}
          groupWidth={windowMeta[id].groupWidth}
          exitStyle={isBlinking && id === 'projectdetail' ? 'blink' : (windowGroup.includes(id) ? groupExit ?? undefined : undefined)}
          index={Math.max(trayIds.indexOf(id), 0)}
          open={Boolean(visibleWindows[id])}
          focused={topWindow === id}
          zIndex={5 + focusOrder.indexOf(id)}
          onFocus={() => focusWindow(id)}
          onHide={(mode) => hideWindow(id, mode)}
          onExited={() => setMountedIds((current) => current.filter((item) => item !== id))}
        >
          <WindowBody id={id} commands={commands} onRun={runCommand} onOpen={openProjectDetail} activeProject={activeProject} />
        </AppWindow>
      ))}
    </section>
  );
}
