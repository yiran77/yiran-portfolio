'use client';
/* oxlint-disable next/no-img-element jsx-a11y/media-has-caption */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AccordionVideoGallery,
  CircularPortraitGallery,
  ComparisonSlider,
  DriftWallGallery,
  EvenImageGrid,
  FilmStripHero,
  FolderVideoGallery,
  LanyardGallery,
  MasonryGallery,
  ScrollStackGallery,
  SkewedCarousel,
  WatercolorFeature,
} from '@/components/showcase-effects';
import type { ImageWork, VideoWork } from '@/components/showcase-effects';

type SelectedMedia =
  | { kind: 'video'; item: VideoWork }
  | { kind: 'image'; item: ImageWork };

const filters = [
  ['all', '全部作品'],
  ['video', '影像'],
  ['design', '视觉设计'],
  ['photography', '摄影'],
  ['research', '研究与网页'],
] as const;

const experience = [
  {
    date: '2025.06—11',
    company: '央视创造传媒有限公司',
    role: '短视频编导',
    detail: '参与央视中秋晚会、中国短视频大会、CMG中国微短剧盛典及上合展映周等重点项目。',
  },
  {
    date: '2025.02—06',
    company: '纪录片《中国医生》第三季',
    role: '短视频运营',
    detail: '每周产出4—7个选题，独立完成20+条短视频，平均浏览量2万+。',
  },
  {
    date: '2024.12—2025.02',
    company: '中国青年网',
    role: '短视频运营',
    detail: '独立策划制作新闻短视频30+条，最高播放量20万+，持续优化完播与互动。',
  },
  {
    date: '2024.01—02',
    company: '通海县县委宣传部',
    role: '办公室综合岗',
    detail: '完成政策解读、文化宣传与活动执行，参与民俗民间艺术展演保障。',
  },
];

const strengths = [
  {
    number: '100+',
    title: '全流程内容制作',
    text: '覆盖选题、脚本、拍摄、剪辑、调色与封面设计，把创意推进到可发布成片。',
  },
  {
    number: '100万+',
    title: '内容传播与增长',
    text: '根据播放、完播与互动数据调整内容方向，让创作判断与用户反馈形成闭环。',
  },
  {
    number: '10+',
    title: '跨媒介工具链',
    text: '熟练使用 PR、AE、FCP、DaVinci、PS、LRC、AU 及多类生成式 AI 工具。',
  },
  {
    number: '35万字',
    title: '研究与深度叙事',
    text: '参与白塔寺口述史调研，将访谈、文献与社区观察转化为系统性内容成果。',
  },
];

function VideoArchive({
  videos,
  onSelect,
}: {
  videos: VideoWork[];
  onSelect: (item: VideoWork) => void;
}) {
  const series = useMemo(
    () => Array.from(new Set(videos.map((item) => item.series))),
    [videos],
  );

  return (
    <section className="motion-archive-section">
      <div className="archive-heading motion-archive-heading">
        <p>MOTION / EDIT</p>
        <h3>影像作品</h3>
        <span>{String(videos.length).padStart(2, '0')} VIDEOS</span>
      </div>
      <div className="motion-archive">
        {series.map((seriesName, seriesIndex) => {
        const works = videos.filter((item) => item.series === seriesName);
        const renderGallery = () => {
          switch (seriesName) {
            case '上合组织国家优秀影视作品展映周':
              return <LanyardGallery items={works} onSelect={onSelect} />;
            case '央视中秋晚会':
              return <ScrollStackGallery items={works} onSelect={onSelect} />;
            case '中国短视频大会 第二季':
              return <AccordionVideoGallery items={works} onSelect={onSelect} />;
            case 'CMG中国微短剧盛典':
              return <AccordionVideoGallery items={works} onSelect={onSelect} />;
            case '实习作品':
              return (
                <SkewedCarousel
                  items={works.map((item) => ({ id: item.id, title: item.title, video: item }))}
                  onOpen={(entry) => entry.video && onSelect(entry.video)}
                />
              );
            case '艺人短视频':
              return (
                <SkewedCarousel
                  items={works.map((item) => ({ id: item.id, title: item.title, video: item }))}
                  onOpen={(entry) => entry.video && onSelect(entry.video)}
                />
              );
            case '校园影像':
              return <FolderVideoGallery items={works} onSelect={onSelect} />;
            case 'AI影像实验':
              return works[0] ? <WatercolorFeature item={works[0]} onSelect={onSelect} /> : null;
            default:
              return null;
          }
        };
        return (
          <section className="motion-series" key={seriesName} data-reveal>
            <div className="series-heading">
              <span>{String(seriesIndex + 1).padStart(2, '0')}</span>
              <h3>{seriesName === '实习作品' ? '其他实习作品' : seriesName}</h3>
              <p>{String(works.length).padStart(2, '0')} FILMS</p>
            </div>
            {renderGallery()}
          </section>
        );
        })}
      </div>
    </section>
  );
}

function ImageArchive({
  items,
  title,
  eyebrow,
  onSelect,
}: {
  items: ImageWork[];
  title: string;
  eyebrow: string;
  onSelect: (item: ImageWork) => void;
}) {
  const groups = Array.from(new Set(items.map((item) => item.series)));
  return (
    <section className="image-archive" data-reveal>
      <div className="archive-heading">
        <p>{eyebrow}</p>
        <h3>{title}</h3>
        <span>{String(items.length).padStart(2, '0')} IMAGES</span>
      </div>
      {groups.map((group) => (
        <div className="image-group" key={group}>
          <div className="image-group-title">
            <span>{group}</span>
            <i>{String(items.filter((item) => item.series === group).length).padStart(2, '0')}</i>
          </div>
          {(() => {
            const groupItems = items.filter((item) => item.series === group);
            if (group === '短视频封面') return <DriftWallGallery items={groupItems} onSelect={onSelect} />;
            if (group === '白塔寺与石狮文创') return <MasonryGallery items={groupItems} onSelect={onSelect} />;
            if (group === '海报设计') {
              return (
                <SkewedCarousel
                  items={groupItems.map((item) => ({ id: item.id, title: item.title, image: item.src }))}
                  onOpen={(entry) => {
                    const original = groupItems.find((item) => item.id === entry.id);
                    if (original) onSelect(original);
                  }}
                />
              );
            }
            if (group === '艺人视觉宣传') return <EvenImageGrid items={groupItems} onSelect={onSelect} />;
            if (group === '澜 明信片' && groupItems[0] && groupItems[1]) {
              return <ComparisonSlider before={groupItems[0]} after={groupItems[1]} onSelect={onSelect} />;
            }
            if (group === '人物摄影') return <CircularPortraitGallery items={groupItems} onSelect={onSelect} label="人物摄影" />;
            if (group === '景物摄影') return <CircularPortraitGallery items={groupItems} onSelect={onSelect} label="景物摄影" />;
            return <MasonryGallery items={groupItems} onSelect={onSelect} />;
          })()}
        </div>
      ))}
    </section>
  );
}

function ResearchSection() {
  return (
    <section className="research-section" data-reveal>
      <div className="archive-heading">
        <p>RESEARCH / INTERACTIVE</p>
        <h3>研究与网页</h3>
        <span>02 PROJECTS</span>
      </div>
      <div className="research-grid">
        <article className="oral-card">
          <figure
            className="report-cover"
            aria-label="白塔寺历史文化街区口述史正文节选"
          >
            <div className="report-excerpt-page">
              <div className="report-excerpt-meta">
                <span>个人口述史 01</span>
                <span>白塔寺历史文化街区</span>
              </div>
              <p className="report-excerpt-kicker">老街坊的白塔岁月</p>
              <h5>胡同生活<br />一段情</h5>
              <blockquote>
                “我就爱住平房，不爱住楼房，因为平房里人情味儿特别浓。”
              </blockquote>
              <p className="report-excerpt-body">
                楼房里一家一个单元，出门可能好几年都不认识街坊邻居；胡同里不一样，这就是胡同文化吧。
              </p>
              <div className="report-excerpt-footer">
                <span>ORAL HISTORY / 2025</span>
                <b>01</b>
              </div>
            </div>
            <span className="report-cover-label">口述史 / 节选</span>
          </figure>
          <div className="report-copy">
            <p className="mono-label">2025 · FIELD RESEARCH</p>
            <h4>白塔寺历史文化街区口述史调研</h4>
            <p className="report-lead">
              以居民口述补充宏观史料未记录的生活细节，观察城市更新中胡同记忆、社区关系与文化传承的变化。
            </p>
            <div className="research-facts">
              <div><b>16组</b><span>关键信息人</span></div>
              <div><b>14篇</b><span>个人口述史</span></div>
              <div><b>35万字</b><span>访谈逐字稿</span></div>
            </div>
            <div className="excerpt-list">
              <p><span>01</span>记录胡同邻里互助、传统小店与日常生活的微观记忆。</p>
              <p><span>02</span>将商业化更新与原住民实际需求放在同一视野中观察。</p>
              <p><span>03</span>结合半结构化访谈、实地观察与文献分析梳理街区历史。</p>
            </div>
            <p className="privacy-note">研究项目节选 · 已隐藏受访者与团队敏感信息</p>
          </div>
        </article>

        <a
          className="web-project"
          href="https://readymag.website/u672075943/5650021/"
          target="_blank"
          rel="noreferrer"
          aria-label="打开中国电影120周年交互网页"
        >
          <div className="web-orbit" aria-hidden="true">
            <span>1905</span><i /><span>2025</span>
          </div>
          <div className="web-copy">
            <p className="mono-label">INTERACTIVE WEB / READYMAG</p>
            <h4>中国电影<br />120周年</h4>
            <span className="web-cta">
              <strong>打开交互网页</strong>
              <small>EXPLORE NOW</small>
              <ExternalLink size={19} />
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}

export default function Portfolio({
  videos,
  images,
}: {
  videos: VideoWork[];
  images: ImageWork[];
}) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<SelectedMedia | null>(null);
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  const design = images.filter((item) => item.kind === 'design');
  const photography = images.filter((item) => item.kind === 'photography');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [filter]);

  function copyText(type: 'email' | 'phone', value: string) {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(type);
        window.setTimeout(() => setCopied(null), 1600);
      })
      .catch(() => undefined);
  }

  function moveGlow(event: React.PointerEvent<HTMLElement>) {
    rootRef.current?.style.setProperty('--pointer-x', `${event.clientX}px`);
    rootRef.current?.style.setProperty('--pointer-y', `${event.clientY}px`);
  }

  return (
    <main className="portfolio" ref={rootRef} onPointerMove={moveGlow}>
      <div className="pointer-glow" aria-hidden="true" />
      <header className="site-nav">
        <a className="brand" href="#top" aria-label="返回首页">
          <span className="brand-mark">LYR</span>
          <span>PORTFOLIO / 2026</span>
        </a>
        <nav aria-label="主要导航">
          <a href="#archive">作品</a>
          <a href="#about">优势</a>
          <a href="#contact">联系</a>
        </nav>
        <a className="contact-pill" href="mailto:20231071127@ucass.edu.cn">
          联系我 <ArrowUpRight size={16} />
        </a>
      </header>

      <section className="hero" id="top">
        <FilmStripHero images={images} />
        <div className="hero-shade" />
        <div className="film-rail film-rail-left" aria-hidden="true" />
        <div className="film-rail film-rail-right" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-kicker">
            <span>中国社会科学院大学</span>
            <span>广播电视学</span>
          </div>
          <h1>
            <span>罗伊然的</span>
            <span className="outline-type">作品集</span>
          </h1>
          <div className="hero-footer">
            <p>
              影像创作 · 视觉设计 · 摄影 · 内容研究
              <br />
              从选题、拍摄到剪辑与传播，构建完整的内容表达。
            </p>
            <a href="#archive" className="scroll-cue">
              <span>SCROLL TO EXPLORE</span>
              <i><ArrowDown size={17} /></i>
            </a>
          </div>
        </div>
        <div className="frame-code" aria-hidden="true">FRAME 001 — LYR / 25FPS</div>
      </section>

      <section className="manifesto" data-reveal>
        <p className="mono-label">CREATIVE PROFILE / 2023—2026</p>
        <h2>镜头记录现场，<br />设计建立秩序，<br /><span>内容抵达观众。</span></h2>
        <div className="manifesto-bottom">
          <p>一名持续在影像、传播与视觉表达之间寻找连接的创作者。</p>
          <div className="manifesto-stats">
            <span><b>{videos.length}</b> VIDEOS</span>
            <span><b>{images.length}</b> IMAGES</span>
            <span><b>04</b> DISCIPLINES</span>
          </div>
        </div>
      </section>

      <section className="archive-shell" id="archive">
        <Tabs value={filter} onValueChange={(value) => setFilter(value)} className="archive-tabs">
          <div className="archive-topline">
            <div>
              <p className="mono-label">WORK INDEX</p>
              <h2>作品档案</h2>
            </div>
            <TabsList variant="line" className="filter-list" aria-label="作品分类">
              {filters.map(([value, label]) => (
                <TabsTrigger value={value} key={value} className="filter-trigger">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {(filter === 'all' || filter === 'video') && (
          <VideoArchive videos={videos} onSelect={(item) => setSelected({ kind: 'video', item })} />
        )}
        {(filter === 'all' || filter === 'design') && (
          <ImageArchive
            items={design}
            title="视觉设计"
            eyebrow="GRAPHIC / CULTURAL CREATIVE"
            onSelect={(item) => setSelected({ kind: 'image', item })}
          />
        )}
        {(filter === 'all' || filter === 'photography') && (
          <ImageArchive
            items={photography}
            title="摄影作品"
            eyebrow="PORTRAIT / SCENERY"
            onSelect={(item) => setSelected({ kind: 'image', item })}
          />
        )}
        {(filter === 'all' || filter === 'research') && <ResearchSection />}
      </section>

      <section className="about-section" id="about">
        <div className="about-intro" data-reveal>
          <p className="mono-label">WHY ME / PERSONAL STRENGTHS</p>
          <h2>不只完成一条视频，<br />也理解它如何被看见。</h2>
          <p>在国家级文化项目、纪录片与新闻短视频实践中，形成从内容判断到视觉落地的完整能力。</p>
        </div>
        <div className="strength-grid">
          {strengths.map((item, index) => (
            <article key={item.title} data-reveal>
              <div className="strength-top"><span>0{index + 1}</span><b>{item.number}</b></div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="experience-block" data-reveal>
          <div className="experience-title">
            <p className="mono-label">EXPERIENCE</p>
            <h3>真实项目里的<br />内容实践</h3>
          </div>
          <div className="experience-list">
            {experience.map((item) => (
              <article key={item.company}>
                <span>{item.date}</span>
                <div><h4>{item.company}</h4><p>{item.detail}</p></div>
                <b>{item.role}</b>
              </article>
            ))}
          </div>
        </div>
        <div className="skill-line" data-reveal>
          <span>PR</span><i /> <span>AE</span><i /> <span>DAVINCI</span><i /> <span>FCP</span><i />
          <span>PS</span><i /> <span>LRC</span><i /> <span>AI TOOLS</span>
        </div>
      </section>

      <footer className="contact-section" id="contact">
        <div className="contact-film" aria-hidden="true"><Film /></div>
        <p className="mono-label">CONTACT / AVAILABLE FOR NEW STORIES</p>
        <h2>让下一次创作，<br /><span>从这里开始。</span></h2>
        <div className="contact-links">
          <div>
            <span>EMAIL</span>
            <a href="mailto:20231071127@ucass.edu.cn">20231071127@ucass.edu.cn</a>
            <Button variant="ghost" size="icon" onClick={() => copyText('email', '20231071127@ucass.edu.cn')} aria-label="复制邮箱">
              {copied === 'email' ? <Check /> : <Copy />}
            </Button>
          </div>
          <div>
            <span>PHONE</span>
            <a href="tel:13320584898">133 2058 4898</a>
            <Button variant="ghost" size="icon" onClick={() => copyText('phone', '13320584898')} aria-label="复制手机号">
              {copied === 'phone' ? <Check /> : <Copy />}
            </Button>
          </div>
        </div>
        <div className="footer-meta">
          <span>罗伊然 · 中国社会科学院大学 · 广播电视学</span>
          <a href="#top">BACK TO TOP ↑</a>
          <span>BEIJING / CHINA · 2026</span>
        </div>
      </footer>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="media-dialog" showCloseButton>
          {selected && (
            <>
              <DialogTitle>{selected.item.title}</DialogTitle>
              <DialogDescription>{selected.item.series}</DialogDescription>
              <div className={`dialog-stage ${selected.kind}`}>
                {selected.kind === 'video' ? (
                  <video src={selected.item.full} poster={selected.item.poster} controls autoPlay playsInline />
                ) : (
                  <img src={selected.item.src} alt={selected.item.title} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
