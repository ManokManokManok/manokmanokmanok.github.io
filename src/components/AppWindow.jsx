import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_WIDTH = 260;
const MIN_HEIGHT = 140;
const EDGE = 8;
const resizeDirections = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const clampPosition = (x, y, width, height) => ({
  x: Math.min(Math.max(EDGE, x), Math.max(EDGE, window.innerWidth - width - EDGE)),
  y: Math.min(Math.max(EDGE, y), Math.max(EDGE, window.innerHeight - height - EDGE)),
});

export default function AppWindow({ title, width: requestedWidth, centered, anchor, groupWidth, exitStyle, index, open, focused, zIndex, onFocus, onHide, onExited, children }) {
  const windowRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const movedRef = useRef(false);
  const exitModeRef = useRef('minimize');
  const initialWidth = Math.min(requestedWidth, window.innerWidth - 16);
  const [size, setSize] = useState({ width: initialWidth, height: null });
  const [position, setPosition] = useState(() => {
    if (anchor) {
      const start = (window.innerWidth - groupWidth) / 2;
      return clampPosition(anchor === 'left' ? start : start + groupWidth - initialWidth, 96, initialWidth, 120);
    }
    return clampPosition(window.innerWidth - initialWidth - 48 - index * 40, 96 + index * 36, initialWidth, 120);
  });
  const [isMounted, setIsMounted] = useState(open);
  const [isDragging, setIsDragging] = useState(false);
  const isClosing = isMounted && !open;

  useEffect(() => {
    if (!open) return;
    exitModeRef.current = 'minimize';
    setIsMounted(true);
  }, [open]);

  useEffect(() => {
    const keepInView = () => {
      const height = windowRef.current?.offsetHeight ?? 120;
      setPosition((current) => clampPosition(current.x, current.y, size.width, height));
    };
    window.addEventListener('resize', keepInView);
    return () => window.removeEventListener('resize', keepInView);
  }, [size.width]);

  const center = () => {
    const height = windowRef.current?.offsetHeight ?? 120;
    setPosition(clampPosition((window.innerWidth - size.width) / 2, (window.innerHeight - height) / 2, size.width, height));
  };

  useLayoutEffect(() => {
    if (centered) center();
  }, []);

  const handlePointerDown = (event) => {
    if (event.target.closest('button')) return;
    movedRef.current = true;
    dragRef.current = { dx: event.clientX - position.x, dy: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;
    setPosition(clampPosition(event.clientX - dragRef.current.dx, event.clientY - dragRef.current.dy, size.width, windowRef.current?.offsetHeight ?? 120));
  };

  const handlePointerUp = (event) => {
    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const startResize = (dir) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    onFocus?.();
    movedRef.current = true;
    const element = windowRef.current;
    resizeRef.current = {
      dir,
      x: event.clientX,
      y: event.clientY,
      left: position.x,
      top: position.y,
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizeMove = (event) => {
    const start = resizeRef.current;
    if (!start) return;
    const { dir } = start;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const maxWidth = dir.includes('w') ? start.left + start.width - EDGE : window.innerWidth - start.left - EDGE;
    const maxHeight = dir.includes('n') ? start.top + start.height - EDGE : window.innerHeight - start.top - EDGE;
    let nextWidth = start.width;
    let nextHeight = start.height;
    if (dir.includes('e')) nextWidth = start.width + dx;
    if (dir.includes('w')) nextWidth = start.width - dx;
    if (dir.includes('s')) nextHeight = start.height + dy;
    if (dir.includes('n')) nextHeight = start.height - dy;
    nextWidth = Math.min(Math.max(nextWidth, MIN_WIDTH), Math.max(MIN_WIDTH, maxWidth));
    nextHeight = Math.min(Math.max(nextHeight, MIN_HEIGHT), Math.max(MIN_HEIGHT, maxHeight));
    setSize({ width: nextWidth, height: nextHeight });
    setPosition({
      x: dir.includes('w') ? start.left + start.width - nextWidth : start.left,
      y: dir.includes('n') ? start.top + start.height - nextHeight : start.top,
    });
  };

  const endResize = (event) => {
    resizeRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const hide = (mode) => {
    exitModeRef.current = mode;
    onHide(mode);
  };

  if (!open && !isMounted) return null;

  const classes = ['cmd-window'];
  if (isDragging) classes.push('dragging');
  if (focused) classes.push('focused');
  if (size.height !== null) classes.push('sized');
  if (isClosing) classes.push('closing', exitStyle ?? exitModeRef.current);

  return (
    <aside
      ref={windowRef}
      className={classes.join(' ')}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height ?? undefined, zIndex }}
      role="dialog"
      aria-label={title}
      onPointerDown={onFocus}
      onLoadCapture={() => { if (centered && !movedRef.current) center(); }}
      onAnimationEnd={(event) => {
        if (!isClosing || event.target !== event.currentTarget) return;
        setIsMounted(false);
        if ((exitStyle ?? exitModeRef.current) === 'close') onExited?.();
      }}
    >
      <header
        className="cmd-window-bar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="cmd-window-title">{title}</span>
        <span className="cmd-window-actions">
          <button type="button" onClick={() => hide('minimize')} aria-label="Minimize window">_</button>
          <button type="button" onClick={() => hide('close')} aria-label="Close window">x</button>
        </span>
      </header>
      <div className="cmd-window-body">{children}</div>
      {resizeDirections.map((dir) => (
        <span
          key={dir}
          className={`cmd-resize ${dir}`}
          onPointerDown={startResize(dir)}
          onPointerMove={handleResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        />
      ))}
    </aside>
  );
}
