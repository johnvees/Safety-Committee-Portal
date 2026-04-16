import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  AlertTriangle,
  ClipboardList,
  FileSearch,
  GraduationCap,
  BookOpen,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Users,
  Activity,
  LogIn,
  ChevronRight,
  Leaf,
  Wrench,
  Lock,
  Heart,
  HardHat,
  Award,
  ChevronDown,
  Droplets,
  Zap,
  Building2,
  TrendingUp,
  TreePine,
  Star,
} from 'lucide-react';

// ─── Floating hero particles ─────────────────────────────
const PARTICLES = [
  {
    icon: Shield,
    cls: 'float-a',
    color: '#ef4444',
    size: 34,
    top: '14%',
    left: '6%',
  },
  {
    icon: Leaf,
    cls: 'float-b',
    color: '#10b981',
    size: 28,
    top: '10%',
    left: '88%',
  },
  {
    icon: Heart,
    cls: 'float-c',
    color: '#f43f5e',
    size: 24,
    top: '65%',
    left: '3%',
  },
  {
    icon: HardHat,
    cls: 'float-d',
    color: '#f59e0b',
    size: 32,
    top: '58%',
    left: '93%',
  },
  {
    icon: AlertTriangle,
    cls: 'float-e',
    color: '#6366f1',
    size: 26,
    top: '82%',
    left: '16%',
  },
  {
    icon: CheckCircle2,
    cls: 'float-f',
    color: '#0ea5e9',
    size: 22,
    top: '78%',
    left: '80%',
  },
  {
    icon: Activity,
    cls: 'float-g',
    color: '#8b5cf6',
    size: 28,
    top: '6%',
    left: '50%',
  },
  {
    icon: Award,
    cls: 'float-h',
    color: '#14b8a6',
    size: 24,
    top: '88%',
    left: '44%',
  },
  {
    icon: Droplets,
    cls: 'float-i',
    color: '#38bdf8',
    size: 20,
    top: '22%',
    left: '72%',
  },
  {
    icon: Zap,
    cls: 'float-j',
    color: '#fbbf24',
    size: 22,
    top: '30%',
    left: '25%',
  },
];

// ─── Ticker items ─────────────────────────────────────────
const TICKER = [
  'Safety First',
  'PT Charoen Pokphand Indonesia',
  'Zero Accident',
  'Integrated HSE',
  'Environmental Care',
  'ISO 45001',
  'Employee Wellbeing',
  'Green Operations',
  'Compliance Ready',
  'Health & Safety Excellence',
  'Risk Management',
  'HSE Culture',
];

// ─── Stats ────────────────────────────────────────────────
const STATS = [
  {
    target: 5,
    suffix: '',
    label: 'Finding Categories',
    sub: 'Safety · Quality · Environment · Compliance · Operational',
    color: '#6366f1',
    icon: BarChart3,
  },
  {
    target: 8,
    suffix: '+',
    label: 'Position Levels',
    sub: 'From Staff to President with structured access',
    color: '#10b981',
    icon: Users,
  },
  {
    target: 6,
    suffix: '',
    label: 'Platform Modules',
    sub: 'Complete & integrated HSE management system',
    color: '#f59e0b',
    icon: Building2,
  },
  {
    target: 24,
    suffix: '/7',
    label: 'Monitoring',
    sub: 'Monitor findings & notifications anytime, anywhere',
    color: '#0ea5e9',
    icon: Activity,
  },
];

// ─── HSE Pillars ─────────────────────────────────────────
const PILLARS = [
  {
    title: 'Occupational Safety',
    en: 'Occupational Safety',
    color: '#ef4444',
    from: '#ef4444',
    to: '#f97316',
    Icon: Shield,
    BigIcon: HardHat,
    desc: 'Comprehensive protection against occupational accident risks across all operational areas of PT Charoen Pokphand Indonesia.',
    points: [
      'Daily & weekly routine inspections',
      'Hazard identification & potential risks',
      'PPE & compliance monitoring',
      'Real-time field findings management',
    ],
    badge: 'Zero Accident',
    badgeSub: 'Primary Target',
  },
  {
    title: 'Environmental Health',
    en: 'Environmental Health',
    color: '#10b981',
    from: '#10b981',
    to: '#0ea5e9',
    Icon: Leaf,
    BigIcon: TreePine,
    desc: 'PT Charoen Pokphand Indonesia\'s commitment to environmental sustainability and responsible waste management.',
    points: [
      'B3 & non-B3 waste management',
      'Air & water quality monitoring',
      'Greening & conservation programs',
      'KLHK environmental regulation compliance',
    ],
    badge: 'ISO 14001',
    badgeSub: 'Environmental Standard',
  },
  {
    title: 'Employee Wellness',
    en: 'Employee Wellness',
    color: '#f43f5e',
    from: '#f43f5e',
    to: '#8b5cf6',
    Icon: Heart,
    BigIcon: Award,
    desc: 'Comprehensive health programs to ensure the physical and mental well-being of all PT Charoen Pokphand Indonesia employees.',
    points: [
      'Medical check-up & periodic examinations',
      'Wellness & occupational nutrition programs',
      'Occupational Disease (PAK) management',
      'Ergonomics & workplace comfort',
    ],
    badge: 'K3 Excellence',
    badgeSub: 'Health Standard',
  },
];

// ─── Modules ─────────────────────────────────────────────
const MODULES = [
  {
    id: 'findings',
    Icon: ClipboardList,
    color: '#6366f1',
    from: 'from-indigo-500',
    to: 'to-purple-500',
    title: 'Findings Management',
    en: 'Findings Management',
    desc: 'Record, monitor, and follow up on safety, quality, environment, compliance, and operational findings.',
    features: [
      'Tracking status & deadline',
      'Notifications & escalation',
      'Repair cost reporting',
    ],
    active: true,
  },
  {
    id: 'incident',
    Icon: FileSearch,
    color: '#ef4444',
    from: 'from-red-500',
    to: 'to-rose-500',
    title: 'Incident Report',
    en: 'Incident Report',
    desc: 'Report and investigate workplace accident incidents, near-misses, and dangerous events.',
    features: [
      'Root cause analysis',
      'Corrective & preventive actions',
      'Incident statistics',
    ],
    active: false,
  },
  {
    id: 'inspection',
    Icon: Shield,
    color: '#0ea5e9',
    from: 'from-sky-500',
    to: 'to-cyan-500',
    title: 'Safety Inspection',
    en: 'Safety Inspection',
    desc: 'Manage routine inspection schedules, HSE audits, and customizable digital checklists.',
    features: ['Digital checklist', 'Automated scheduling', 'Inspection history'],
    active: false,
  },
  {
    id: 'risk',
    Icon: Activity,
    color: '#f59e0b',
    from: 'from-amber-500',
    to: 'to-orange-500',
    title: 'Risk Assessment',
    en: 'Risk Assessment',
    desc: 'Identify, evaluate, and control risks using HIRADC/HIRAC matrices.',
    features: ['HIRADC risk matrix', 'Control monitoring', 'Risk register'],
    active: false,
  },
  {
    id: 'training',
    Icon: GraduationCap,
    color: '#10b981',
    from: 'from-emerald-500',
    to: 'to-teal-500',
    title: 'Safety Training',
    en: 'Safety Training',
    desc: 'Manage HSE training programs, employee certifications, and competency records.',
    features: ['Certification summary', 'Training schedule', 'Competency tracking'],
    active: false,
  },
  {
    id: 'docs',
    Icon: BookOpen,
    color: '#8b5cf6',
    from: 'from-violet-500',
    to: 'to-purple-500',
    title: 'Safety Documents',
    en: 'Safety Documents',
    desc: 'Access SOPs, HSE procedures, and regulations in a centralized repository.',
    features: [
      'SOPs & Procedures',
      'KLHK & Kemenaker regulations',
      'Internal guidelines',
    ],
    active: false,
  },
];

// ─── How it works ────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'Login & Access',
    desc: 'Sign in with your account. The system automatically adjusts the interface and features based on your role.',
    Icon: LogIn,
    color: '#6366f1',
  },
  {
    n: '02',
    title: 'Record Finding',
    desc: 'Input field findings complete with photos, category, priority, checklist, and cost estimates.',
    Icon: ClipboardList,
    color: '#0ea5e9',
  },
  {
    n: '03',
    title: 'Follow Up',
    desc: 'Relevant teams receive automatic notifications and can update status, costs, and progress.',
    Icon: Activity,
    color: '#f59e0b',
  },
  {
    n: '04',
    title: 'Complete & Archive',
    desc: 'Completed findings are automatically archived with full reports ready for audit & reporting purposes.',
    Icon: CheckCircle2,
    color: '#10b981',
  },
];

// ─── Component ───────────────────────────────────────────
/**
 * LandingPage — the public marketing/introduction page shown before login.
 * Contains: sticky navbar, animated hero, scrolling ticker, stats counter,
 * HSE pillars section, platform modules grid, how-it-works steps, CTA banner, footer.
 *
 * Props:
 *   onLogin  Callback invoked when any "Sign In" button is clicked.
 *            Switches to LoginPage via AuthGate (no navigation required).
 */
export default function LandingPage({ onLogin }) {
  // ── Rotating headline state ────────────────────────────────────────────────
  const [hlIdx, setHlIdx] = useState(0);  // index of the currently displayed headline
  const [hlKey, setHlKey] = useState(0);  // incremented on each rotation to re-trigger CSS animation

  // ── Stats counter animation state ──────────────────────────────────────────
  const [statsOn, setStatsOn]   = useState(false);              // true once the stats section enters the viewport
  const [counts, setCounts]     = useState(STATS.map(() => 0)); // animated current value for each stat

  // ── Mouse glow effect state ────────────────────────────────────────────────
  // Tracks cursor position over module cards; { [moduleId]: { x, y } | null }
  const [mouseMap, setMouseMap] = useState({});

  // ── Parallax scroll state ──────────────────────────────────────────────────
  const [scrollY, setScrollY] = useState(0); // window.scrollY, updated on scroll for floating particles

  // Ref attached to the stats section — used by IntersectionObserver to trigger the counter
  const statsRef = useRef(null);

  // The phrases that cycle in the hero sub-headline
  const HEADLINES = [
    'Occupational Safety',
    'Employee Health',
    'Work Environment',
    'HSE Compliance',
  ];

  // Rotate the hero headline every 3 seconds; incrementing hlKey forces the fade-in animation to replay
  useEffect(() => {
    const t = setInterval(() => {
      setHlIdx((i) => (i + 1) % HEADLINES.length);
      setHlKey((k) => k + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Track scroll position for the floating particles parallax effect
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true }); // passive = no blocking
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Start the stat counter animation once the stats section scrolls into view (≥30% visible)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStatsOn(true);
          obs.disconnect(); // only trigger once
        }
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // Run the eased counter animation over 1800ms using requestAnimationFrame
  useEffect(() => {
    if (!statsOn) return;
    const duration = 1800; // total animation duration in ms
    const start = performance.now();
    const tick = (now) => {
      const p    = Math.min((now - start) / duration, 1); // progress 0 → 1
      const ease = 1 - Math.pow(1 - p, 3);               // cubic ease-out curve
      setCounts(STATS.map((s) => Math.floor(ease * s.target)));
      if (p < 1) requestAnimationFrame(tick); // keep going until done
    };
    requestAnimationFrame(tick);
  }, [statsOn]);

  // Scroll-reveal: add 'revealed' class to elements with class 'reveal' when they enter the viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            obs.unobserve(e.target); // only animate once per element
          }
        }),
      { threshold: 0.1 }, // trigger when 10% of the element is visible
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /**
   * Track mouse position relative to a module card for the spotlight glow effect.
   * @param {MouseEvent} e
   * @param {string} id - Module ID (used as the key in mouseMap)
   */
  const handleCardMouse = (e, id) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouseMap((m) => ({
      ...m,
      [id]: { x: e.clientX - r.left, y: e.clientY - r.top }, // position relative to card
    }));
  };

  /** Clear the glow position when the mouse leaves a module card */
  const clearCardMouse = (id) => setMouseMap((m) => ({ ...m, [id]: null }));

  return (
    <div
      className="min-h-screen text-gray-200 overflow-x-hidden"
      style={{ background: '#080a0f' }}
    >
      {/* ── Sticky Navbar ── */}
      <header
        className="sticky top-0 z-50 border-b border-white/5"
        style={{
          background: 'rgba(8,10,15,0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 0 20px #6366f140',
              }}
            >
              <AlertTriangle size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-none">
                Safety Committee
              </p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                PT Charoen Pokphand Indonesia
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {[
              ['#pillars', 'HSE Pillars'],
              ['#modules', 'Modules'],
              ['#how', 'How It Works'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-gray-200 transition"
              >
                {label}
              </a>
            ))}
          </nav>
          <button
            onClick={onLogin}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: '0 4px 16px #6366f130',
            }}
          >
            <LogIn size={15} /> Sign In
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="blob-1 absolute w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle,#6366f1,transparent 70%)',
              top: '-15%',
              left: '-10%',
            }}
          />
          <div
            className="blob-2 absolute w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle,#10b981,transparent 70%)',
              bottom: '-10%',
              right: '-8%',
            }}
          />
          <div
            className="blob-3 absolute w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle,#f43f5e,transparent 70%)',
              top: '40%',
              left: '55%',
            }}
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 40%, #080a0f 100%)',
            }}
          />
        </div>

        {/* Floating particles — parallax offset */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          {PARTICLES.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className={`absolute ${p.cls}`}
                style={{ top: p.top, left: p.left, color: p.color }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 ping-slow rounded-full"
                    style={{
                      background: p.color + '30',
                      width: p.size,
                      height: p.size,
                    }}
                  />
                  <div
                    className="relative rounded-xl flex items-center justify-center"
                    style={{
                      width: p.size + 16,
                      height: p.size + 16,
                      background: p.color + '12',
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${p.color}25`,
                    }}
                  >
                    <Icon size={p.size - 8} style={{ color: p.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Spinning ring decoration */}
        <div
          className="absolute pointer-events-none opacity-50"
          style={{
            width: 600,
            height: 600,
            border: '1px dashed #6366f1',
            borderRadius: '50%',
            animation: 'spinSlow 60s linear infinite',
          }}
        />
        <div
          className="absolute pointer-events-none opacity-50"
          style={{
            width: 400,
            height: 400,
            border: '1px dashed #10b981',
            borderRadius: '50%',
            animation: 'spinSlow 60s linear infinite reverse',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-5 max-w-5xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 border text-xs font-bold px-4 py-1.5 rounded-full mb-8"
            style={{
              borderColor: '#6366f130',
              background: '#6366f110',
              color: '#a5b4fc',
            }}
          >
            <Star size={11} className="fill-indigo-400 text-indigo-400" />
            Integrated HSE Management Platform · CPIN
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-3 text-white">
            Information System
          </h1>
          <h2
            className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-2"
            style={{
              background: 'linear-gradient(135deg,#6366f1,#a78bfa,#38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Safety Committee
          </h2>

          {/* Rotating phrase */}
          <div className="h-10 flex items-center justify-center mb-6 overflow-hidden">
            <p
              key={hlKey}
              className="headline-fade text-lg md:text-xl font-semibold"
              style={{ color: '#94a3b8' }}
            >
              Protecting{' '}
              <span style={{ color: '#a5b4fc' }}>{HEADLINES[hlIdx]}</span>{' '}
              Across All Facilities
            </p>
          </div>

          <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            An integrated digital platform for managing safety, occupational
            health, and environmental affairs across all operational units of{' '}
            <span className="text-gray-400 font-semibold">
              PT Charoen Pokphand Indonesia
            </span>
            .
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onLogin}
              className="group flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl transition-all text-base"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 8px 32px #6366f140',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = '0 12px 40px #6366f160')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = '0 8px 32px #6366f140')
              }
            >
              <LogIn size={18} />
              Sign In to System
              <ChevronRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <a
              href="#modules"
              className="flex items-center gap-2 font-medium px-6 py-4 rounded-2xl transition-all text-base text-gray-400 hover:text-gray-200"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              View Modules <ArrowRight size={16} />
            </a>
          </div>

          {/* Mini stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: '5 Finding Categories', color: '#6366f1' },
              { label: 'Zero Accident Target', color: '#ef4444' },
              { label: 'ISO 45001 & 14001', color: '#10b981' },
              { label: 'Real-time Notifications', color: '#f59e0b' },
            ].map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: p.color + '12',
                  border: `1px solid ${p.color}25`,
                  color: p.color,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: p.color }}
                />
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#ticker"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 hover:text-gray-400 transition"
        >
          <span className="text-xs">Scroll</span>
          <ChevronDown size={18} className="animate-bounce" />
        </a>
      </section>

      {/* ── Ticker ── */}
      <div
        id="ticker"
        className="overflow-hidden border-y py-4"
        style={{
          borderColor: 'rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="ticker-track flex whitespace-nowrap gap-0">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-6 text-sm font-semibold text-gray-600"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section ref={statsRef} className="max-w-7xl mx-auto px-5 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="reveal relative rounded-2xl p-6 text-center overflow-hidden group cursor-default"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = s.color + '40')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')
                }
              >
                {/* glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${s.color}10, transparent 70%)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-opacity"
                  style={{ background: s.color }}
                />
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center relative z-10"
                  style={{ background: s.color + '15' }}
                >
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <p className="text-4xl font-black text-white relative z-10">
                  {counts[i]}
                  {s.suffix}
                </p>
                <p
                  className="text-sm font-bold mt-1 relative z-10"
                  style={{ color: s.color }}
                >
                  {s.label}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-tight relative z-10">
                  {s.sub}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HSE Pillars ── */}
      <section id="pillars" className="max-w-7xl mx-auto px-5 pb-24">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
            style={{
              background: '#10b98115',
              border: '1px solid #10b98130',
              color: '#6ee7b7',
            }}
          >
            <Leaf size={11} /> Core HSE Pillars
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Health, Safety & Environment
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            The three core pillars of PT Charoen Pokphand Indonesia's commitment
            to creating a safe, healthy, and sustainable work environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => {
            const Icon = p.Icon;
            const BigIcon = p.BigIcon;
            return (
              <div
                key={p.title}
                className="reveal relative rounded-3xl overflow-hidden group"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  border: `1px solid ${p.color}20`,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {/* Gradient background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${p.from}08, transparent)`,
                  }}
                />
                {/* Decorative rings */}
                <div
                  className="absolute -right-10 -top-10 w-48 h-48 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${p.color}12` }}
                />
                <div
                  className="absolute -right-5 -top-5 w-32 h-32 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${p.color}18` }}
                />
                {/* Big faded icon */}
                <div
                  className="absolute right-4 top-4 pointer-events-none"
                  style={{ opacity: 0.06 }}
                >
                  <BigIcon size={110} style={{ color: p.color }} />
                </div>
                {/* Content */}
                <div className="relative z-10 p-7">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg,${p.from},${p.to})`,
                      boxShadow: `0 8px 24px ${p.color}30`,
                    }}
                  >
                    <Icon size={26} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-0.5">
                    {p.title}
                  </h3>
                  <p
                    className="text-xs font-semibold mb-4"
                    style={{ color: p.color + 'cc' }}
                  >
                    {p.en}
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed mb-5">
                    {p.desc}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {p.points.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-center gap-2.5 text-sm text-gray-400"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: p.color }}
                        />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  {/* Badge stat */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: p.color + '10',
                      border: `1px solid ${p.color}20`,
                    }}
                  >
                    <div>
                      <p
                        className="text-lg font-black"
                        style={{ color: p.color }}
                      >
                        {p.badge}
                      </p>
                      <p className="text-xs text-gray-500">{p.badgeSub}</p>
                    </div>
                  </div>
                </div>
                {/* Bottom accent line */}
                <div
                  className="h-0.5 w-0 group-hover:w-full transition-all duration-700"
                  style={{
                    background: `linear-gradient(90deg,${p.from},${p.to})`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="max-w-7xl mx-auto px-5 pb-24">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
            style={{
              background: '#6366f115',
              border: '1px solid #6366f130',
              color: '#a5b4fc',
            }}
          >
            <Building2 size={11} /> System Modules
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Complete HSE Management Platform
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            An integrated suite of modules supporting the entire HSE management
            process — from reporting to follow-up and audit reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon || mod.Icon;
            const mp = mouseMap[mod.id];
            return (
              <div
                key={mod.id}
                className="reveal relative rounded-2xl overflow-hidden group transition-all duration-200"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  border: mod.active
                    ? `1px solid ${mod.color}30`
                    : '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: mod.active ? 'pointer' : 'default',
                }}
                onMouseMove={(e) => handleCardMouse(e, mod.id)}
                onMouseLeave={() => clearCardMouse(mod.id)}
                onClick={mod.active ? onLogin : undefined}
                onMouseEnter={(e) => {
                  if (mod.active)
                    e.currentTarget.style.borderColor = mod.color + '60';
                }}
              >
                {/* Mouse glow */}
                {mp && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at ${mp.x}px ${mp.y}px, ${mod.color}15, transparent 60%)`,
                    }}
                  />
                )}
                {/* Top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{
                    background: `linear-gradient(90deg,${mod.color},transparent)`,
                    opacity: mod.active ? 0.8 : 0.2,
                  }}
                />

                <div className="relative z-10 p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{
                        background: `linear-gradient(135deg,${mod.color},${mod.color}99)`,
                        boxShadow: `0 6px 20px ${mod.color}30`,
                      }}
                    >
                      <Icon size={22} className="text-white" />
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={
                        mod.active
                          ? {
                              background: mod.color + '15',
                              color: mod.color,
                              border: `1px solid ${mod.color}30`,
                            }
                          : {
                              background: 'rgba(255,255,255,0.04)',
                              color: '#4b5563',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }
                      }
                    >
                      {mod.active ? 'Available' : 'Coming Soon'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-0.5">
                    {mod.title}
                  </h3>
                  <p
                    className="text-xs font-medium mb-3"
                    style={{ color: mod.color + 'bb' }}
                  >
                    {mod.en}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                    {mod.desc}
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {mod.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <div
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: mod.color + '80' }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {mod.active ? (
                    <div
                      className="flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all"
                      style={{ color: mod.color }}
                    >
                      Open Module <ArrowRight size={14} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Lock size={12} /> In Development
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how" className="max-w-7xl mx-auto px-5 pb-24">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
            style={{
              background: '#f59e0b15',
              border: '1px solid #f59e0b30',
              color: '#fcd34d',
            }}
          >
            <TrendingUp size={11} /> How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Simple & Structured
          </h2>
          <p className="text-base text-gray-500 max-w-lg mx-auto">
            Four simple steps from recording a finding to archiving an
            audit-ready report.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => {
            const Icon = s.Icon;
            return (
              <div
                key={i}
                className="reveal relative group rounded-2xl p-6"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = s.color + '30')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')
                }
              >
                {/* Connector line (not on last) */}
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 -right-2.5 z-10 w-5 h-px"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xs font-black"
                    style={{ color: s.color + '60' }}
                  >
                    {s.n}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: s.color + '15' }}
                  >
                    <Icon size={18} style={{ color: s.color }} />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-5 pb-20">
        <div
          className="reveal relative rounded-3xl overflow-hidden p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, #6366f115, #8b5cf610)',
            border: '1px solid #6366f125',
          }}
        >
          {/* Decorative blobs inside CTA */}
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle,#6366f118,transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle,#8b5cf615,transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 12px 40px #6366f140',
              }}
            >
              <AlertTriangle size={28} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-base text-gray-400 mb-8 max-w-md mx-auto">
              Sign in with your account and start managing safety, quality,
              and environmental findings digitally.
            </p>
            <button
              onClick={onLogin}
              className="group inline-flex items-center gap-2 text-white font-bold px-10 py-4 rounded-2xl transition-all text-base"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 8px 32px #6366f145',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = '0 14px 48px #6366f165')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = '0 8px 32px #6366f145')
              }
            >
              <LogIn size={17} />
              Sign In Now
              <ChevronRight
                size={15}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <AlertTriangle size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 leading-none">
                Safety Committee
              </p>
              <p className="text-xs text-gray-700 leading-none mt-0.5">
                PT Charoen Pokphand Indonesia
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-700 text-center">
            © {new Date().getFullYear()} PT Charoen Pokphand Indonesia ·
            Findings Management System v1.0
          </p>
          <div className="flex items-center gap-4">
            {['Safety', 'Health', 'Environment'].map((t, i) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-xs text-gray-700"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: ['#ef4444', '#f43f5e', '#10b981'][i] }}
                />
                {t}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
