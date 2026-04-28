import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

/* ---------- Icons (inline SVG) ---------- */
const I = {
  spark:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  cpu:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>,
  flow:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h10a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h12"/><circle cx="4" cy="7" r="1.6"/><circle cx="20" cy="19" r="1.6"/></svg>,
  stack:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="M3 12l9 4.5L21 12"/><path d="M3 16.5l9 4.5 9-4.5"/></svg>,
  rocket:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3c4 2 7 5 7 11-6 0-9-3-11-7l4-4Z"/><path d="M7 17c-2 0-4 2-4 4 2 0 4-2 4-4Z"/><path d="M10 14l-3 3"/><circle cx="16" cy="8" r="1"/></svg>,
  arrow:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 12l5 5L20 6"/></svg>,
  target:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  compass:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6 6-2Z" fill="currentColor" fillOpacity="0.2"/></svg>,
};

/* ---------- Scroll-reveal helper ---------- */
function Reveal({ children, delay=0, className="" }){
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const io = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){ setShow(true); io.disconnect(); }
    }, { threshold:0.12 });
    io.observe(el); return ()=>io.disconnect();
  },[]);
  return (
    <div ref={ref} style={{transitionDelay:`${delay}ms`}}
      className={`transition-all duration-[900ms] ease-out ${show?'opacity-100 translate-y-0':'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

function Logo({ compact = false }){
  const h = compact ? 56 : 72;
  const w = Math.round(h * (945/1024));
  // Footer (compact) logo is below the fold — defer loading and decoding so
  // it doesn't compete with the header logo for paint/decode time.
  const loadHint = compact ? 'lazy' : 'eager';
  const decodeHint = compact ? 'async' : 'auto';
  const fetchHint = compact ? 'low' : 'high';
  return (
    <a href="#home" className="group flex items-center">
      <span className="relative block"
            style={{ width:w, height:h, filter:'drop-shadow(0 0 14px rgba(34,211,238,0.35)) drop-shadow(0 0 22px rgba(168,85,247,0.28))' }}>
        <picture>
          <source srcSet="galtrix-logo-animated.webp" type="image/webp"/>
          <img src="galtrix-logo-transparent.png" alt="GALTRIX — Built for what's next"
               width={w} height={h}
               loading={loadHint} decoding={decodeHint} fetchpriority={fetchHint}
               style={{ display:'block', width:'100%', height:'100%', objectFit:'contain' }}/>
        </picture>
      </span>
    </a>
  );
}

function Header(){
  const links = [
    {id:'about', label:'About'},
    {id:'focus', label:'Focus'},
    {id:'principles', label:'Principles'},
    {id:'founders', label:'Founders'},
    {id:'contact', label:'Contact'},
  ];
  const [scrolled, setScrolled] = useState(false);
  useEffect(()=>{
    const on = ()=>setScrolled(window.scrollY>16);
    on(); window.addEventListener('scroll', on, {passive:true});
    return ()=>window.removeEventListener('scroll', on);
  },[]);
  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled?'border-b border-white/10 bg-[#04050d]/80 backdrop-blur-md':'bg-transparent'}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Logo/>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md md:flex">
          {links.map(l=>(
            <a key={l.id} href={`#${l.id}`} className="rounded-full px-4 py-1.5 text-[13px] font-medium text-white/70 transition hover:text-white hover:bg-white/10">{l.label}</a>
          ))}
        </nav>
        <a href="#contact" className="group inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-2.5 text-sm font-semibold text-[#04050d] glow-cyan transition hover:scale-[1.02]">
          Start a Project
          <I.arrow className="h-4 w-4 transition group-hover:translate-x-0.5"/>
        </a>
      </div>
    </header>
  );
}

function Hero(){
  return (
    <section id="home" className="relative">
      <div className="mx-auto grid min-h-[94vh] w-full max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="relative z-20 max-w-3xl">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/5 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-cyan-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70"/>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300 glow-cyan"/>
              </span>
              Private Corporation &mdash; Venture Platform
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="font-display text-[48px] font-bold leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-[96px]">
              <span className="block">GALTRIX</span>
              <span className="block mt-3 text-[24px] sm:text-3xl lg:text-[40px] font-medium text-white/80">
                Built for <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">What&apos;s Next.</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              A forward-thinking corporation focused on innovation, technology, and intelligent solutions.
              Built on ambition, precision, and vision &mdash; designed to create scalable ventures across
              AI, automation, digital infrastructure, and next-generation business systems.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#focus" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3.5 text-sm font-semibold text-[#04050d] glow-cyan transition hover:shadow-[0_0_60px_rgba(34,211,238,0.45)]">
                Explore Focus Areas
                <I.arrow className="h-4 w-4 transition group-hover:translate-x-0.5"/>
              </a>
              <a href="#about" className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-400/5 px-6 py-3.5 text-sm text-purple-100 backdrop-blur transition hover:bg-purple-400/10 hover:border-purple-300/60">
                View Corporate Profile
              </a>
            </div>
          </Reveal>

          <Reveal delay={520}>
            <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-2xl">
              {[
                ['AI', 'Artificial Intelligence'],
                ['AUTO', 'Automation'],
                ['INFRA', 'Digital Infrastructure'],
                ['VNTR', 'Strategic Ventures'],
              ].map(([k,v])=>(
                <div key={k} className="border-l border-white/10 pl-3">
                  <div className="font-display text-xs font-bold tracking-[0.2em] text-cyan-300">{k}</div>
                  <div className="mt-1 text-[12px] leading-5 text-white/65">{v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right: portal visual */}
        <Reveal delay={400}>
          <div className="relative flex items-center justify-center py-8 lg:py-0">
            <div className="relative aspect-square w-full max-w-[420px]">
              {/* rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-300/25 glow-cyan"/>
              <div className="absolute inset-[10%] rounded-full border border-purple-400/25 glow-purple"/>
              <div className="absolute inset-[22%] rounded-full border border-cyan-300/30 glow-cyan"/>
              <div className="absolute inset-[36%] rounded-full border border-purple-400/30 glow-purple"/>
              {/* core */}
              <div className="absolute inset-[42%] rounded-full bg-gradient-to-br from-cyan-300 via-white to-purple-400 glow-cyan animate-pulse"/>
              {/* orbiting dots */}
              <div className="absolute inset-0 animate-[spin_18s_linear_infinite]">
                <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 glow-cyan"/>
              </div>
              <div className="absolute inset-[10%] animate-[spin_28s_linear_infinite_reverse]">
                <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-purple-400 glow-purple"/>
              </div>
              <div className="absolute inset-[22%] animate-[spin_36s_linear_infinite]">
                <div className="absolute left-1/2 bottom-0 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-200 glow-cyan"/>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function About(){
  const meta = [
    { k:'Founders', v:'Jann Gabriel Guillermety · Edwin Gabriel Garcia' },
    { k:'Company Type', v:'Private Corporation / Venture Platform' },
    { k:'Primary Identity', v:'AI · Automation · Digital Infrastructure · Scalable Ventures' },
    { k:'Positioning', v:'Modern, premium, and future-facing' },
  ];
  return (
    <section id="about" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <div className="divider-glow mb-16 w-32"/>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">About Galtrix</div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              A corporate overview of innovation, technology, and intelligent systems.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-[15px] leading-8 text-white/75">
              Galtrix is a forward-thinking corporation focused on innovation, technology, and
              intelligent solutions for the future. Built on ambition, precision, and vision,
              Galtrix is designed to create scalable ventures across AI, automation, digital
              infrastructure, and next-generation business systems.
            </p>
            <p className="mt-5 text-[15px] leading-8 text-white/65">
              Our mission is to develop powerful ideas into lasting enterprises that shape
              industries and drive progress.
            </p>
          </Reveal>
        </div>

        {/* Meta grid */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] sm:grid-cols-2">
          {meta.map((m,i)=>(
            <Reveal key={m.k} delay={i*100}>
              <div className="border border-white/5 bg-[#06081a]/50 p-7 backdrop-blur-md transition hover:bg-[#06081a]/80">
                <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">{m.k}</div>
                <div className="mt-3 text-lg font-medium text-white">{m.v}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Vision + Mission */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl border border-cyan-300/30 bg-[#06081a]/70 p-8 backdrop-blur-md glow-cyan">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl"/>
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/10"><I.target className="h-5 w-5 text-cyan-300"/></span>
                <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300">Vision</div>
              </div>
              <p className="relative mt-6 text-[15px] leading-8 text-white/80">
                To build a modern enterprise platform where engineering, automation, and strategic
                thinking converge to create high-impact businesses with long-term value.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-purple-400/30 bg-[#06081a]/70 p-8 backdrop-blur-md glow-purple">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-400/15 blur-3xl"/>
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-purple-300/40 bg-purple-300/10"><I.compass className="h-5 w-5 text-purple-300"/></span>
                <div className="text-[11px] uppercase tracking-[0.4em] text-purple-300">Mission</div>
              </div>
              <p className="relative mt-6 text-[15px] leading-8 text-white/80">
                Develop intelligent systems, scalable ventures, and premium digital solutions that
                transform ambition into operational excellence.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Focus(){
  const items = [
    { icon:I.cpu, accent:'cyan', title:'Artificial Intelligence', text:'Applied AI systems, intelligent workflows, and next-generation digital services.' },
    { icon:I.flow, accent:'purple', title:'Automation', text:'Operational tools and process automation designed for efficiency, scale, and reliability.' },
    { icon:I.stack, accent:'cyan', title:'Digital Infrastructure', text:'Technology foundations that support performance, growth, and modern business execution.' },
    { icon:I.rocket, accent:'purple', title:'Strategic Ventures', text:'A scalable business model built to expand into future products, services, and markets.' },
  ];
  return (
    <section id="focus" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Reveal className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.4em] text-purple-300/90">Strategic Focus</div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              A scalable brand platform across high-value sectors.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-md text-[14px] leading-7 text-white/60">
              Galtrix is structured to operate as a scalable brand platform with room to expand
              into multiple high-value sectors.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {items.map((c,i)=>{
            const Icn = c.icon;
            const isCyan = c.accent==='cyan';
            return (
              <Reveal key={c.title} delay={(i%2)*120}>
                <div className={`group relative h-full overflow-hidden rounded-[28px] border bg-[#06081a]/70 p-8 backdrop-blur-md transition hover:-translate-y-1 ${isCyan?'border-cyan-300/20 hover:border-cyan-300/40 hover:glow-cyan':'border-purple-400/20 hover:border-purple-400/40 hover:glow-purple'}`}>
                  <div aria-hidden className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-opacity ${isCyan?'bg-cyan-400/10 group-hover:bg-cyan-400/25':'bg-purple-400/10 group-hover:bg-purple-400/25'}`}/>
                  <div className="relative flex items-start justify-between">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl border ${isCyan?'border-cyan-300/30 bg-cyan-300/5':'border-purple-400/30 bg-purple-400/5'}`}>
                      <Icn className={`h-6 w-6 ${isCyan?'text-cyan-300':'text-purple-300'}`}/>
                    </div>
                    <span className={`font-display text-[11px] font-bold tracking-[0.3em] ${isCyan?'text-cyan-300/80':'text-purple-300/80'}`}>0{i+1}</span>
                  </div>
                  <h3 className="relative mt-6 text-2xl font-semibold text-white">{c.title}</h3>
                  <p className="relative mt-3 text-[14px] leading-7 text-white/70">{c.text}</p>
                  <div className={`relative mt-8 h-px w-full bg-gradient-to-r ${isCyan?'from-cyan-300/60 via-white/10 to-transparent':'from-purple-400/60 via-white/10 to-transparent'}`}/>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Principles(){
  const items = [
    'Precision in execution',
    'Scalable systems over temporary fixes',
    'Modern design with real-world utility',
    'Long-term value creation',
  ];
  return (
    <section id="principles" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">Core Principles</div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              Disciplined ambition. Intelligent execution.
            </h2>
            <div className="mt-10 rounded-3xl border border-gradient-to-r border-cyan-300/20 bg-[#06081a]/70 p-7 backdrop-blur-md"
                 style={{borderImage:'linear-gradient(135deg,rgba(34,211,238,0.4),rgba(168,85,247,0.4)) 1'}}>
              <div className="text-[11px] uppercase tracking-[0.38em] text-purple-300">Brand Statement</div>
              <p className="mt-4 text-lg leading-8 text-white/85">
                Galtrix represents <span className="text-glow-cyan text-cyan-200">disciplined ambition</span>,{' '}
                <span className="text-glow-purple text-purple-200">intelligent execution</span>, and the pursuit of lasting enterprise value.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((t, i)=>(
              <Reveal key={t} delay={i*110}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#06081a]/70 p-7 backdrop-blur-md transition hover:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className={`font-display text-3xl font-bold ${i%2===0?'text-cyan-300 text-glow-cyan':'text-purple-300 text-glow-purple'}`}>
                      0{i+1}
                    </span>
                    <span className={`grid h-9 w-9 place-items-center rounded-full border ${i%2===0?'border-cyan-300/40 bg-cyan-300/10':'border-purple-400/40 bg-purple-400/10'}`}>
                      <I.check className={`h-4 w-4 ${i%2===0?'text-cyan-300':'text-purple-300'}`}/>
                    </span>
                  </div>
                  <div className="mt-6 text-lg font-medium text-white">{t}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Founders(){
  const people = [
    { name:'Jann Gabriel Guillermety', role:'Co-Founder', initials:'JG', accent:'cyan' },
    { name:'Edwin Gabriel Garcia',    role:'Co-Founder', initials:'EG', accent:'purple' },
  ];
  return (
    <section id="founders" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <Reveal className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.4em] text-purple-300/90">Founders</div>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
            Built by operators with a long-term view.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {people.map((p,i)=>{
            const isCyan = p.accent==='cyan';
            return (
              <Reveal key={p.name} delay={i*120}>
                <div className={`group relative overflow-hidden rounded-3xl border bg-[#06081a]/70 p-8 backdrop-blur-md transition hover:-translate-y-1 ${isCyan?'border-cyan-300/25 hover:glow-cyan':'border-purple-400/25 hover:glow-purple'}`}>
                  <div aria-hidden className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${isCyan?'bg-cyan-400/15':'bg-purple-400/15'}`}/>
                  <div className="relative flex items-center gap-5">
                    <div className={`grid h-20 w-20 place-items-center rounded-2xl border text-lg font-display font-bold tracking-[0.1em] ${isCyan?'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 glow-cyan':'border-purple-400/40 bg-purple-400/10 text-purple-200 glow-purple'}`}>
                      {p.initials}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-white/50">{p.role}</div>
                      <div className="mt-1 text-xl font-semibold text-white">{p.name}</div>
                    </div>
                  </div>
                  <div className="relative mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"/>
                  <p className="relative mt-6 text-[14px] leading-7 text-white/65">
                    Driving Galtrix's vision across engineering, automation, and strategic ventures &mdash;
                    building intelligent systems with long-term value.
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Inquiry endpoints
// ───────────────────────────────────────────────────────────────────────────
// Formspree handles the internal inquiry notification + Telegram webhook
// (configured on Formspree's side). Do not change this URL or the Telegram
// integration breaks.
const FORMSPREE_URL = 'https://formspree.io/f/xykljbzj';

// Google Apps Script Web App URL — sends the client confirmation email and
// an internal notification via Gmail. See APPS_SCRIPT_SETUP.md and
// apps-script/galtrix-confirmation.gs in the repo for setup steps.
// Replace the placeholder below with the deployed Web App URL after step 9
// of the setup guide.
const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

const APPS_SCRIPT_CONFIGURED = !APPS_SCRIPT_URL.startsWith('YOUR_');

const isValidEmail = (s)=> /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

function Contact(){
  const [form, setForm] = useState({ fullName:'', email:'', company:'', project:'' });
  // statuses:
  //   'idle' | 'sending'
  //   'sent'             — both Formspree + Apps Script appear successful
  //   'sent-no-email'    — Formspree ok, but Apps Script call failed at network layer
  //   'error'            — Formspree failed (inquiry notification didn't go through)
  const [status, setStatus] = useState('idle');
  const [validationError, setValidationError] = useState('');
  const onChange = (k)=>(e)=>{
    setForm(f=>({...f,[k]:e.target.value}));
    if (validationError) setValidationError('');
  };

  const validate = ()=>{
    if (!form.fullName.trim()) return 'Please enter your name.';
    if (!form.email.trim()) return 'Please enter your email.';
    if (!isValidEmail(form.email)) return 'Please enter a valid email address.';
    if (!form.project.trim()) return 'Please tell us about your project.';
    return '';
  };

  const submit = async (e)=>{
    e.preventDefault();
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    setStatus('sending');

    // (1) Formspree submission — keeps existing inquiry + Telegram flow alive
    const formspreeData = new FormData();
    formspreeData.append('fullName', form.fullName);
    formspreeData.append('email',    form.email);
    formspreeData.append('company',  form.company);
    formspreeData.append('project',  form.project);
    formspreeData.append('source',   'Galtrix Website Contact Form');

    const formspreeReq = fetch(FORMSPREE_URL, {
      method: 'POST',
      body:    formspreeData,
      headers: { 'Accept': 'application/json' },
    }).then(r => r.ok);

    // (2) Apps Script submission — sends Gmail confirmation to the client.
    // Uses no-cors + text/plain so we avoid Apps Script's CORS preflight
    // limitations. The response is opaque, so we treat any non-throw as ok.
    const appsScriptReq = APPS_SCRIPT_CONFIGURED
      ? fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode:   'no-cors',
          body:   JSON.stringify({
            name:    form.fullName,
            email:   form.email,
            company: form.company,
            message: form.project,
            source:  'Galtrix Website Contact Form',
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        }).then(()=>true).catch(()=>false)
      : Promise.resolve(false); // no-op if URL not yet configured

    const [formspreeRes, appsScriptRes] = await Promise.allSettled([formspreeReq, appsScriptReq]);
    const formspreeOk  = formspreeRes.status === 'fulfilled' && formspreeRes.value === true;
    const appsScriptOk = appsScriptRes.status === 'fulfilled' && appsScriptRes.value === true;

    if (formspreeOk && appsScriptOk)        setStatus('sent');
    else if (formspreeOk && !appsScriptOk)  setStatus(APPS_SCRIPT_CONFIGURED ? 'sent-no-email' : 'sent');
    else                                    setStatus('error');
  };

  const inputBase = "w-full rounded-2xl border bg-[#04050d]/60 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 transition focus:bg-[#04050d]/90";

  return (
    <section id="contact" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-28 lg:grid-cols-[1fr_0.95fr] lg:px-10">
        <Reveal>
          <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">Contact</div>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
            Start the next phase of your digital presence.
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-8 text-white/70">
            Galtrix partners with ambitious teams building at the edges of AI, automation, and
            digital infrastructure. Share your project and our team will follow up.
          </p>
          <ul className="mt-10 space-y-4 text-[14px] text-white/80">
            {['Enterprise-grade positioning','Scalable systems, engineered to last','Modern design with real-world utility'].map((t, i)=>(
              <li key={t} className="flex items-center gap-3">
                <span className={`grid h-6 w-6 place-items-center rounded-full border ${i%2===0?'border-cyan-300/40 bg-cyan-300/10':'border-purple-400/40 bg-purple-400/10'}`}>
                  <I.check className={`h-3.5 w-3.5 ${i%2===0?'text-cyan-200':'text-purple-200'}`}/>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={140}>
          <form
            action="https://formspree.io/f/xykljbzj"
            method="POST"
            onSubmit={submit}
            className="relative overflow-hidden rounded-[32px] border border-cyan-300/20 bg-[#06081a]/80 p-7 backdrop-blur-md glow-cyan">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"/>
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-400/15 blur-3xl"/>

            <input type="hidden" name="source" value="Galtrix Website Contact Form" />

            {(status === 'sent' || status === 'sent-no-email') ? (
              <div className="relative flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 glow-cyan">
                  <I.check className="h-8 w-8 text-cyan-200"/>
                </div>
                <div className="text-xl font-semibold text-white">Thank you. Your inquiry has been received.</div>
                <p className="max-w-md text-[14px] leading-7 text-white/70">
                  GALTRIX has received your message successfully.
                  {status === 'sent' && ' A confirmation email has been sent to your inbox, and our team will review your inquiry shortly.'}
                  {status === 'sent-no-email' && ' Our team will review your inquiry shortly.'}
                </p>
                {status === 'sent-no-email' && (
                  <p className="max-w-md text-[12px] leading-6 text-amber-200/80">
                    Note: we couldn&apos;t deliver the automatic confirmation email to your inbox right now,
                    but your inquiry has been recorded and we&apos;ll be in touch.
                  </p>
                )}
                <button type="button"
                  onClick={()=>{setStatus('idle'); setForm({fullName:'',email:'',company:'',project:''});}}
                  className="mt-4 rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white">
                  Send another
                </button>
              </div>
            ) : (
              <div className="relative grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">Full Name</span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange('fullName')}
                    required
                    className={`${inputBase} border-white/10 focus:border-cyan-300/50`}
                    placeholder="Your name" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange('email')}
                    required
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                    className={`${inputBase} border-white/10 focus:border-purple-400/50`}
                    placeholder="you@company.com" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">Company <span className="text-white/30 normal-case tracking-normal">(optional)</span></span>
                  <input
                    name="company"
                    value={form.company}
                    onChange={onChange('company')}
                    className={`${inputBase} border-white/10 focus:border-cyan-300/50`}
                    placeholder="Your company" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">Tell us about your project</span>
                  <textarea
                    name="project"
                    value={form.project}
                    onChange={onChange('project')}
                    required
                    className={`${inputBase} min-h-[140px] border-white/10 focus:border-cyan-300/50`}
                    placeholder="What are you trying to build?" />
                </label>
                <button type="submit" disabled={status==='sending'}
                  className="group mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-4 text-sm font-semibold text-[#04050d] glow-cyan transition hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] disabled:opacity-70">
                  {status==='sending' ? 'Sending…' : 'Submit Inquiry'}
                  <I.arrow className="h-4 w-4 transition group-hover:translate-x-0.5"/>
                </button>
                {validationError && (
                  <p className="text-center text-[13px] text-amber-300/90">{validationError}</p>
                )}
                {status === 'error' && (
                  <p className="text-center text-[13px] text-red-300/90">
                    Inquiry notification could not be completed. Please try again or email us directly at galtrix.info@galtrix.net.
                  </p>
                )}
                <p className="text-center text-[11px] uppercase tracking-[0.25em] text-white/35">
                  We&apos;ll never share your information.
                </p>
              </div>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Legal(){
  const sections = [
    {
      id:'privacy',
      accent:'cyan',
      eyebrow:'Privacy',
      title:'How we handle your information.',
      blocks:[
        { h:'Our commitment', p:'At GALTRIX, we respect your privacy and handle personal information with care. This notice explains what we collect, how it is used, and the choices available to you.' },
        { h:'Information we collect', p:'When you contact us through our website, we may collect the name, email address, and message details you voluntarily submit. We do not knowingly collect sensitive personal data.' },
        { h:'How we use it', p:'Information is used to respond to your inquiry, follow up on your request, and maintain the quality of our services. We do not sell or rent personal data to third parties.' },
        { h:'Third-party processing', p:'Contact form submissions may be processed through trusted third-party providers (such as Formspree). These providers operate under their own privacy and security standards.' },
        { h:'Your choices', p:'You may request access to, correction of, or deletion of your personal information at any time by contacting galtrix.info@galtrix.net.' },
      ],
    },
    {
      id:'terms',
      accent:'purple',
      eyebrow:'Terms',
      title:'The terms that govern your use of this website.',
      blocks:[
        { h:'Overview', p:'The GALTRIX website is provided for general informational and business purposes. By accessing or using this site, you agree to the terms outlined below.' },
        { h:'Acceptable use', p:'You agree to use the site lawfully and in a manner that does not infringe on the rights of others or restrict their use of the platform.' },
        { h:'Intellectual property', p:'All content, branding, visual identity, and materials on this website are owned or controlled by GALTRIX and protected by applicable intellectual property laws. Unauthorized copying, reproduction, misuse, or interference with the site is prohibited.' },
        { h:'Updates', p:'Information on this website may be modified, updated, or removed at any time without prior notice.' },
        { h:'Limitation of liability', p:'GALTRIX provides this website on an "as is" basis and is not liable for any indirect or consequential damages arising from its use.' },
      ],
    },
    {
      id:'security',
      accent:'cyan',
      eyebrow:'Security',
      title:'How we protect what you share with us.',
      blocks:[
        { h:'Our approach', p:'GALTRIX takes the protection of submitted information seriously. We apply reasonable technical and organizational measures designed to safeguard personal data shared through our website.' },
        { h:'Secure processing', p:'Where applicable, trusted third-party providers are used to process and transmit information through established security practices.' },
        { h:'Limitations', p:'While we take meaningful steps to protect your data, no digital platform can guarantee complete security.' },
        { h:'Report a concern', p:'If you believe you have identified a security issue related to the GALTRIX website, please contact us at galtrix.info@galtrix.net so we can review it promptly.' },
      ],
    },
  ];
  return (
    <section id="legal" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <Reveal className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">Legal</div>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
            Transparency, trust, and responsible practice.
          </h2>
        </Reveal>

        <div className="mt-16 space-y-10">
          {sections.map((s, idx)=>{
            const isCyan = s.accent==='cyan';
            return (
              <Reveal key={s.id} delay={idx*120}>
                <div id={s.id} className={`group relative overflow-hidden rounded-[28px] border bg-[#06081a]/70 p-8 backdrop-blur-md transition lg:p-10 ${isCyan?'border-cyan-300/25 hover:glow-cyan':'border-purple-400/25 hover:glow-purple'}`}>
                  <div aria-hidden className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${isCyan?'bg-cyan-400/10':'bg-purple-400/10'}`}/>
                  <div className="relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                      <div className={`text-[11px] uppercase tracking-[0.4em] ${isCyan?'text-cyan-300/90':'text-purple-300/90'}`}>{s.eyebrow}</div>
                      <h3 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
                        {s.title}
                      </h3>
                      <div className={`mt-6 h-px w-24 bg-gradient-to-r ${isCyan?'from-cyan-300/70 to-transparent':'from-purple-400/70 to-transparent'}`}/>
                    </div>
                    <div className="space-y-6">
                      {s.blocks.map(b=>(
                        <div key={b.h}>
                          <div className={`text-[11px] uppercase tracking-[0.32em] ${isCyan?'text-cyan-200/85':'text-purple-200/85'}`}>{b.h}</div>
                          <p className="mt-2 text-[14.5px] leading-8 text-white/75">{b.p}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer(){
  const cols = [
    { h:'Company', l:[{t:'About',h:'#about'},{t:'Founders',h:'#founders'},{t:'Principles',h:'#principles'},{t:'Contact',h:'#contact'}] },
    { h:'Focus', l:[{t:'AI',h:'#focus'},{t:'Automation',h:'#focus'},{t:'Infrastructure',h:'#focus'},{t:'Ventures',h:'#focus'}] },
    { h:'Legal', l:[{t:'Privacy',h:'#privacy'},{t:'Terms',h:'#terms'},{t:'Security',h:'#security'}] },
  ];
  return (
    <footer className="relative border-t border-white/10 bg-[#04050d]/90 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Logo/>
          <p className="mt-5 max-w-xs text-[13px] leading-7 text-white/55">
            Galtrix is a private corporation and venture platform &mdash; designed to create
            scalable ventures across AI, automation, digital infrastructure, and next-generation
            business systems.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 glow-cyan"/>
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/65">Operating globally</span>
          </div>
        </div>
        {cols.map(c=>(
          <div key={c.h}>
            <div className="text-[11px] uppercase tracking-[0.4em] text-white/40">{c.h}</div>
            <ul className="mt-5 space-y-3">
              {c.l.map(x=>(
                <li key={x.t}><a href={x.h} className="text-[14px] text-white/70 transition hover:text-white">{x.t}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-6 py-6 text-[12px] uppercase tracking-[0.3em] text-white/45 md:flex-row md:items-center lg:px-10">
          <div>© {new Date().getFullYear()} GALTRIX — All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="transition hover:text-white">Privacy</a>
            <a href="#terms" className="transition hover:text-white">Terms</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App(){
  useEffect(()=>{ document.documentElement.style.scrollBehavior = 'smooth'; }, []);
  return (
    <div className="min-h-screen text-white selection:bg-cyan-400/30">
      <Header/>
      <main>
        <Hero/>
        <About/>
        <Focus/>
        <Principles/>
        <Founders/>
        <Contact/>
        <Legal/>
      </main>
      <Footer/>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
