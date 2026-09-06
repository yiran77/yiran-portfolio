'use client';
/* oxlint-disable next/no-img-element jsx-a11y/media-has-caption react/react-compiler */

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight, FolderOpen, Play } from 'lucide-react';

export type VideoWork = {
  id: string;
  title: string;
  series: string;
  kind: string;
  orientation: string;
  duration: number;
  preview: string;
  full: string;
  poster: string;
};

export type ImageWork = {
  id: string;
  title: string;
  series: string;
  kind: string;
  orientation: string;
  src: string;
};

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.max(0, seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function AmbientVideo({ item, className = '' }: { item: VideoWork; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          window.setTimeout(() => element.play().catch(() => undefined), 0);
        } else {
          element.pause();
        }
      },
      { rootMargin: '300px 0px', threshold: 0.04 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={ready ? item.preview : undefined}
      poster={item.poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={`${item.title} 静音动态预览`}
    />
  );
}

function VideoCaption({ item, compact = false }: { item: VideoWork; compact?: boolean }) {
  return (
    <span className={`effect-caption${compact ? ' is-compact' : ''}`}>
      <span>{item.title}</span>
      <i>{formatDuration(item.duration)}</i>
    </span>
  );
}

function PlayDot() {
  return <span className="effect-play"><Play size={13} fill="currentColor" /></span>;
}

export function FilmStripHero({ images }: { images: ImageWork[] }) {
  const selected = useMemo(() => {
    const preferred = ['image-32', 'image-46', 'image-27', 'image-11', 'image-22', 'image-48', 'image-39', 'image-19', 'image-53', 'image-24', 'image-41', 'image-50'];
    const chosen = preferred.map((id) => images.find((item) => item.id === id)).filter(Boolean) as ImageWork[];
    return chosen.length >= 8 ? chosen : images.slice(0, 12);
  }, [images]);

  const rows = [
    [...selected.slice(0, 6), ...selected.slice(0, 6)],
    [...selected.slice(4, 10), ...selected.slice(4, 10)],
    [...selected.slice(7), ...selected.slice(0, 2), ...selected.slice(7), ...selected.slice(0, 2)],
  ];

  return (
    <div className="hero-reels" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div className={`hero-reel hero-reel-${rowIndex + 1}`} key={rowIndex}>
          <div className="hero-reel-track">
            {row.map((item, index) => (
              <span className="hero-reel-frame" key={`${rowIndex}-${item.id}-${index}`}>
                <img src={item.src} alt="" draggable={false} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LanyardGallery({ items, onSelect }: { items: VideoWork[]; onSelect: (item: VideoWork) => void }) {
  const handlePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--lanyard-x', `${x * 14}deg`);
    event.currentTarget.style.setProperty('--lanyard-y', `${y * -10}deg`);
  };

  return (
    <div className="lanyard-gallery">
      {items.map((item, index) => (
        <div className={`lanyard-slot lanyard-slot-${index + 1}`} key={item.id}>
          <span className="lanyard-anchor"><i /></span>
          <span className="lanyard-band"><b>LYR · PORTFOLIO · FILM · </b></span>
          <button
            type="button"
            className="lanyard-card"
            onPointerMove={handlePointer}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty('--lanyard-x', '0deg');
              event.currentTarget.style.setProperty('--lanyard-y', '0deg');
            }}
            onClick={() => onSelect(item)}
            aria-label={`播放 ${item.title}`}
          >
            <span className="lanyard-clip" />
            <span className={`lanyard-media ${item.orientation}`}>
              <AmbientVideo item={item} />
              <PlayDot />
            </span>
            <VideoCaption item={item} compact />
            <span className="lanyard-index">0{index + 1}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function ScrollStackGallery({ items, onSelect }: { items: VideoWork[]; onSelect: (item: VideoWork) => void }) {
  return (
    <div className="scroll-stack-gallery">
      {items.map((item, index) => (
        <div className="scroll-stack-layer" key={item.id}>
          <button
            type="button"
            className="scroll-stack-card"
            style={{ '--stack-index': index, '--stack-count': items.length } as CSSProperties}
            onClick={() => onSelect(item)}
          >
            <span className="scroll-stack-number">{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
            <span className="scroll-stack-media"><AmbientVideo item={item} /><span className="video-vignette" /><PlayDot /></span>
            <span className="scroll-stack-copy"><b>{item.title}</b><i>MOTION / EDIT · {formatDuration(item.duration)}</i></span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function ParallaxCardsGallery({ items, onSelect }: { items: VideoWork[]; onSelect: (item: VideoWork) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--parallax-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 2}`);
    event.currentTarget.style.setProperty('--parallax-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 2}`);
  };
  return (
    <div className="parallax-deck" ref={rootRef} onPointerMove={onMove} onPointerLeave={() => {
      rootRef.current?.style.setProperty('--parallax-x', '0');
      rootRef.current?.style.setProperty('--parallax-y', '0');
    }}>
      <div className="parallax-copy">
        <span>MOVE TO SHIFT DEPTH</span>
        <b>{items[active]?.title}</b>
        <i>{formatDuration(items[active]?.duration ?? 0)}</i>
      </div>
      <div className="parallax-stage">
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`parallax-card ${item.orientation}${active === index ? ' is-active' : ''}`}
            style={{ '--card-index': index, '--card-offset': index - (items.length - 1) / 2 } as CSSProperties}
            onPointerEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => onSelect(item)}
          >
            <AmbientVideo item={item} />
            <span className="video-vignette" />
            <span className="parallax-card-label">0{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AccordionVideoGallery({ items, onSelect }: { items: VideoWork[]; onSelect: (item: VideoWork) => void }) {
  const [active, setActive] = useState(Math.min(1, items.length - 1));
  return (
    <div className="accordion-video" aria-label="微短剧盛典视频画廊">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          className={`accordion-panel${index === active ? ' is-active' : ''}`}
          onPointerEnter={() => setActive(index)}
          onFocus={() => setActive(index)}
          onClick={() => index === active ? onSelect(item) : setActive(index)}
        >
          <AmbientVideo item={item} />
          <span className="accordion-shade" />
          <span className="accordion-count">0{index + 1}</span>
          <span className="accordion-label"><i /><b>{item.title}</b><em>{formatDuration(item.duration)}</em></span>
          <PlayDot />
        </button>
      ))}
    </div>
  );
}

type SkewedItem = { id: string; title: string; image?: string; video?: VideoWork };

export function SkewedCarousel({ items, onOpen }: { items: SkewedItem[]; onOpen: (item: SkewedItem) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const paused = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(40, now - last);
      last = now;
      if (!paused.current) {
        track.scrollLeft += direction.current * delta * 0.022;
        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) direction.current = -1;
        if (track.scrollLeft <= 1) direction.current = 1;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [items]);

  const updateDepth = () => {
    const root = trackRef.current;
    if (!root) return;
    const center = root.scrollLeft + root.clientWidth / 2;
    root.querySelectorAll<HTMLElement>('.skewed-card').forEach((card) => {
      const itemCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.max(-1, Math.min(1, (itemCenter - center) / root.clientWidth));
      card.style.setProperty('--skew-distance', String(distance));
    });
  };

  return (
    <div className="skewed-shell">
      <div className="skewed-controls">
        <span>DRAG / SCROLL</span>
        <button type="button" onClick={() => trackRef.current?.scrollBy({ left: -420, behavior: 'smooth' })}><ChevronLeft /></button>
        <button type="button" onClick={() => trackRef.current?.scrollBy({ left: 420, behavior: 'smooth' })}><ChevronRight /></button>
      </div>
      <div
        className="skewed-track"
        ref={trackRef}
        onScroll={updateDepth}
        onPointerEnter={() => { paused.current = true; }}
        onPointerLeave={() => { paused.current = false; }}
        onWheel={(event: WheelEvent<HTMLDivElement>) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) trackRef.current?.scrollBy({ left: event.deltaY * 0.55 });
        }}
      >
        {items.map((item, index) => (
          <button type="button" className={`skewed-card${item.video?.orientation === 'portrait' || item.image ? ' is-portrait' : ''}`} key={item.id} onClick={() => onOpen(item)}>
            <span className="skewed-frame">
              {item.video ? <AmbientVideo item={item.video} /> : <img src={item.image} alt={item.title} loading="lazy" />}
              <span className="video-vignette" />
              {item.video && <PlayDot />}
            </span>
            <span className="skewed-meta"><b>{item.title}</b><i>0{index + 1}</i></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function InfiniteSpiralGallery({ items, onSelect }: { items: VideoWork[]; onSelect: (item: VideoWork) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const progress = useRef(0);
  const target = useRef(0);
  const hovering = useRef(false);
  const dragging = useRef(false);
  const lastY = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let previous = performance.now();
    const render = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (!hovering.current && !dragging.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) target.current += delta * 0.24;
      progress.current += (target.current - progress.current) * (1 - Math.exp(-delta * 9));
      const width = root.clientWidth;
      const mobile = width < 620;
      const radius = mobile ? Math.min(115, width * 0.28) : Math.min(330, width * 0.24);
      const spacing = mobile ? 92 : 128;
      const count = items.length;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        let offset = index - progress.current;
        offset = ((offset + count / 2) % count + count) % count - count / 2;
        const angle = offset * (360 / Math.max(count, 5));
        const radians = angle * Math.PI / 180;
        const x = Math.sin(radians) * radius;
        const z = Math.cos(radians);
        const scale = 0.76 + (z + 1) * 0.19;
        const edge = Math.min(1, Math.abs(offset) / (count / 2));
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * spacing}px, 0) rotateZ(${offset * -2.5}deg) scale(${scale})`;
        card.style.opacity = String(1 - edge * 0.64);
        card.style.filter = edge > 0.72 ? `blur(${(edge - 0.72) * 14}px)` : 'none';
        card.style.zIndex = String(Math.round((z + 1) * 100));
      });
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  return (
    <div
      className="spiral-gallery"
      ref={rootRef}
      onPointerEnter={() => { hovering.current = true; }}
      onPointerLeave={() => { hovering.current = false; dragging.current = false; }}
      onPointerDown={(event) => { dragging.current = true; lastY.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (!dragging.current) return; target.current -= (event.clientY - lastY.current) / 110; lastY.current = event.clientY; }}
      onPointerUp={(event) => { dragging.current = false; event.currentTarget.releasePointerCapture(event.pointerId); }}
    >
      <div className="spiral-axis"><span>ARTIST / SHORTS</span><i /><b>05</b></div>
      {items.map((item, index) => (
        <button
          type="button"
          className={`spiral-card ${item.orientation}`}
          key={item.id}
          ref={(node) => { cardRefs.current[index] = node; }}
          onClick={() => onSelect(item)}
        >
          <AmbientVideo item={item} />
          <span className="video-vignette" />
          <VideoCaption item={item} compact />
        </button>
      ))}
    </div>
  );
}

export function FolderVideoGallery({ items, onSelect }: { items: VideoWork[]; onSelect: (item: VideoWork) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`archive-folder${open ? ' is-open' : ''}`}>
      <button className="folder-tab" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <FolderOpen /> <span>UCASS / CAMPUS ARCHIVE</span><b>{open ? '收起档案' : '展开 08 项'}</b>
      </button>
      <div className="folder-papers">
        {items.map((item, index) => (
          <button
            type="button"
            className="folder-paper"
            key={item.id}
            style={{ '--paper-index': index, '--paper-count': items.length } as CSSProperties}
            onClick={() => onSelect(item)}
            tabIndex={open ? 0 : -1}
          >
            <span className={`folder-paper-media ${item.orientation}`}><AmbientVideo item={item} /><span className="video-vignette" /><PlayDot /></span>
            <VideoCaption item={item} compact />
          </button>
        ))}
      </div>
      <div className="folder-front"><span>LYR–08</span><b>校园影像档案</b><i>SELECTED WORK / 2023—2025</i></div>
    </div>
  );
}

export function WatercolorFeature({ item, onSelect }: { item: VideoWork; onSelect: (item: VideoWork) => void }) {
  return (
    <div className="watercolor-feature">
      <div className="watercolor-ink ink-one" />
      <div className="watercolor-ink ink-two" />
      <div className="watercolor-noise" />
      <button type="button" className="watercolor-card" onClick={() => onSelect(item)}>
        <span className="watercolor-media"><AmbientVideo item={item} /><span className="video-vignette" /><PlayDot /></span>
        <span className="watercolor-copy"><span>AI FILM / EXPERIMENT 01</span><b>{item.title}</b><i>{formatDuration(item.duration)}</i></span>
      </button>
    </div>
  );
}

export function DriftWallGallery({ items, onSelect }: { items: ImageWork[]; onSelect: (item: ImageWork) => void }) {
  const rows = [items.slice(0, 5), items.slice(5, 10)];

  return (
    <div className="cover-dome" aria-label="短视频封面穹顶画廊">
      <div className="cover-dome-stage">
        {rows.map((row, rowIndex) => (
          <div className={`cover-dome-row ${rowIndex === 0 ? 'is-crown' : 'is-base'}`} key={rowIndex}>
            {row.map((item, index) => {
              const center = (row.length - 1) / 2;
              const distance = index - center;
              const curve = distance * distance * (rowIndex === 0 ? 13 : 7);
              return (
                <button
                  type="button"
                  className={`cover-dome-card${item.orientation === 'landscape' ? ' is-landscape' : ''}`}
                  key={item.id}
                  onClick={() => onSelect(item)}
                  style={{
                    '--dome-y': `${curve}px`,
                    '--dome-turn': `${distance * 5.5}deg`,
                    '--dome-roll': `${distance * 1.1}deg`,
                    '--dome-scale': 1 - Math.abs(distance) * 0.025,
                  } as CSSProperties}
                >
                  <span className="cover-dome-media">
                    <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
                  </span>
                  <span className="cover-dome-meta">
                    <i>{String(rowIndex * 5 + index + 1).padStart(2, '0')}</i>
                    <b>{item.title}</b>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <span className="cover-dome-hint">10 COVERS · SELECT TO VIEW</span>
    </div>
  );
}

export function MasonryGallery({ items, onSelect }: { items: ImageWork[]; onSelect: (item: ImageWork) => void }) {
  return (
    <div className="bits-masonry">
      {items.map((item, index) => (
        <button type="button" className="bits-masonry-item" key={item.id} onClick={() => onSelect(item)} style={{ '--masonry-delay': `${index * 55}ms` } as CSSProperties}>
          <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
          <span><b>{item.title}</b><i>VIEW ↗</i></span>
        </button>
      ))}
    </div>
  );
}

export function EvenImageGrid({ items, onSelect }: { items: ImageWork[]; onSelect: (item: ImageWork) => void }) {
  return (
    <div className="even-image-grid">
      {items.map((item, index) => (
        <button type="button" key={item.id} onClick={() => onSelect(item)}>
          <img src={item.src} alt={item.title} loading="lazy" />
          <span>0{index + 1} · {item.title}</span>
        </button>
      ))}
    </div>
  );
}

export function ComparisonSlider({ before, after, onSelect }: { before: ImageWork; after: ImageWork; onSelect: (item: ImageWork) => void }) {
  const [position, setPosition] = useState(50);
  const rootRef = useRef<HTMLDivElement>(null);
  const update = (clientX: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)));
  };
  return (
    <div
      className="comparison-slider"
      ref={rootRef}
      style={{ '--compare': `${position}%` } as CSSProperties}
      onPointerMove={(event) => { if (event.buttons === 1 || event.pointerType === 'touch') update(event.clientX); }}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); update(event.clientX); }}
      onDoubleClick={() => onSelect(position < 50 ? before : after)}
    >
      <img src={after.src} alt={after.title} draggable={false} />
      <div className="comparison-before"><img src={before.src} alt={before.title} draggable={false} /></div>
      <span className="comparison-label is-before">正面 / FRONT</span>
      <span className="comparison-label is-after">背面 / BACK</span>
      <div className="comparison-handle"><ArrowLeftRight /></div>
      <input type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-label="拖动比较明信片正反面" />
    </div>
  );
}

function useCircularMotion(count: number, speed = 0.004) {
  const progress = useRef(0);
  const target = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const render = (now: number) => {
      const dt = Math.min(40, now - prev);
      prev = now;
      if (!dragging.current) {
        target.current += velocity.current;
        velocity.current *= 0.94;
        if (Math.abs(velocity.current) < 0.0002 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) target.current += speed * dt;
      }
      progress.current += (target.current - progress.current) * 0.09;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const pointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastX.current = event.clientX;
    velocity.current = 0;
  }, []);
  const pointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = event.clientX - lastX.current;
    lastX.current = event.clientX;
    target.current -= delta * 0.006;
    velocity.current = -delta * 0.0008;
  }, []);
  const pointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    void event;
  }, []);
  const wheel = useCallback((event: WheelEvent<HTMLDivElement>) => { target.current += (event.deltaY || event.deltaX) * 0.002; }, []);
  return useMemo(
    () => ({ progress, target, refs, root, pointerDown, pointerMove, pointerUp, wheel, count }),
    [count, pointerDown, pointerMove, pointerUp, wheel],
  );
}

export function CircularPortraitGallery({
  items,
  onSelect,
  label = '人物摄影',
}: {
  items: ImageWork[];
  onSelect: (item: ImageWork) => void;
  label?: string;
}) {
  const motion = useCircularMotion(items.length, 0.0024);
  useEffect(() => {
    const root = motion.root.current;
    if (!root) return;
    let raf = 0;
    const render = () => {
      const width = root.clientWidth;
      const spacing = Math.min(380, width * 0.28);
      motion.refs.current.forEach((card, index) => {
        if (!card) return;
        let offset = index - motion.progress.current;
        offset = ((offset + items.length / 2) % items.length + items.length) % items.length - items.length / 2;
        const normalized = Math.max(-1.7, Math.min(1.7, offset / 2.3));
        const x = normalized * spacing;
        const bend = Math.abs(normalized) * Math.abs(normalized) * 86;
        const scale = 1 - Math.min(0.34, Math.abs(normalized) * 0.16);
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${bend}px, ${-Math.abs(normalized) * 100}px) rotateZ(${normalized * -8}deg) scale(${scale})`;
        card.style.opacity = String(Math.max(0, 1 - Math.abs(normalized) * 0.38));
        card.style.zIndex = String(100 - Math.round(Math.abs(normalized) * 10));
      });
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [items, motion]);

  return (
    <div className="circular-portrait" ref={motion.root} onPointerDown={motion.pointerDown} onPointerMove={motion.pointerMove} onPointerUp={motion.pointerUp} onPointerCancel={motion.pointerUp} onWheel={motion.wheel}>
      <span className="circular-guide">DRAG THE ARC · {label}</span>
      {items.map((item, index) => (
        <button type="button" className="circular-portrait-card" key={item.id} ref={(node) => { motion.refs.current[index] = node; }} onClick={() => onSelect(item)}>
          <img src={item.src} alt={item.title} draggable={false} />
          <span>{item.title}</span>
        </button>
      ))}
    </div>
  );
}

export function CircleSceneryGallery({ items, onSelect }: { items: ImageWork[]; onSelect: (item: ImageWork) => void }) {
  const motion = useCircularMotion(items.length, 0.0016);
  const [activeTitle, setActiveTitle] = useState(items[0]?.title ?? '');
  useEffect(() => {
    const root = motion.root.current;
    if (!root) return;
    let raf = 0;
    let lastActive = -1;
    const render = () => {
      const mobile = root.clientWidth < 620;
      const radius = mobile ? Math.min(175, root.clientWidth * 0.38) : Math.min(430, root.clientWidth * 0.29);
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      motion.refs.current.forEach((card, index) => {
        if (!card) return;
        const angle = (index - motion.progress.current) * (360 / items.length);
        const rad = angle * Math.PI / 180;
        const x = Math.sin(rad) * radius;
        const z = Math.cos(rad);
        const y = Math.sin(rad * 2) * (mobile ? 22 : 40);
        const scale = 0.68 + (z + 1) * 0.25;
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotateY(${angle * -0.14}deg) scale(${scale})`;
        card.style.opacity = String(0.25 + (z + 1) * 0.375);
        card.style.zIndex = String(Math.round((z + 1) * 100));
        if (Math.abs(angle % 360) < nearestDistance) { nearestDistance = Math.abs(angle % 360); nearestIndex = index; }
      });
      if (nearestIndex !== lastActive) { lastActive = nearestIndex; setActiveTitle(items[nearestIndex]?.title ?? ''); }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [items, motion]);
  return (
    <div className="circle-scenery" ref={motion.root} onPointerDown={motion.pointerDown} onPointerMove={motion.pointerMove} onPointerUp={motion.pointerUp} onPointerCancel={motion.pointerUp} onWheel={motion.wheel}>
      <div className="circle-core"><span>SCENERY</span><b>{activeTitle}</b><i>DRAG / WHEEL</i></div>
      {items.map((item, index) => (
        <button type="button" className="circle-scenery-card" key={item.id} ref={(node) => { motion.refs.current[index] = node; }} onClick={() => onSelect(item)}>
          <img src={item.src} alt={item.title} draggable={false} />
        </button>
      ))}
    </div>
  );
}

export function GalleryFrame({ children, note }: { children: ReactNode; note?: string }) {
  return <div className="gallery-frame">{children}{note && <span className="gallery-frame-note">{note}</span>}</div>;
}
