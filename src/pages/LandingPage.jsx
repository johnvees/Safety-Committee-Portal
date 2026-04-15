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
  'K3 Terpadu',
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
    label: 'Kategori Temuan',
    sub: 'Safety · Quality · Environment · Compliance · Operational',
    color: '#6366f1',
    icon: BarChart3,
  },
  {
    target: 8,
    suffix: '+',
    label: 'Level Jabatan',
    sub: 'Dari Staff hingga President dengan akses terstruktur',
    color: '#10b981',
    icon: Users,
  },
  {
    target: 6,
    suffix: '',
    label: 'Modul Platform',
    sub: 'Sistem manajemen K3 lengkap & terintegrasi',
    color: '#f59e0b',
    icon: Building2,
  },
  {
    target: 24,
    suffix: '/7',
    label: 'Monitoring',
    sub: 'Pantau temuan & notifikasi kapan saja dan di mana saja',
    color: '#0ea5e9',
    icon: Activity,
  },
];

// ─── HSE Pillars ─────────────────────────────────────────
const PILLARS = [
  {
    title: 'Keselamatan Kerja',
    en: 'Occupational Safety',
    color: '#ef4444',
    from: '#ef4444',
    to: '#f97316',
    Icon: Shield,
    BigIcon: HardHat,
    desc: 'Perlindungan menyeluruh terhadap risiko kecelakaan kerja di seluruh area operasional pabrik PT Charoen Pokphand Indonesia.',
    points: [
      'Inspeksi rutin harian & mingguan',
      'Identifikasi hazard & potensi bahaya',
      'Pemantauan APD & compliance',
      'Pengelolaan temuan lapangan real-time',
    ],
    badge: 'Zero Accident',
    badgeSub: 'Target Utama',
  },
  {
    title: 'Kesehatan Lingkungan',
    en: 'Environmental Health',
    color: '#10b981',
    from: '#10b981',
    to: '#0ea5e9',
    Icon: Leaf,
    BigIcon: TreePine,
    desc: 'Komitmen PT Charoen Pokphand Indonesia terhadap kelestarian lingkungan hidup dan pengelolaan limbah yang bertanggung jawab.',
    points: [
      'Pengelolaan limbah B3 & non-B3',
      'Pemantauan kualitas udara & air',
      'Program penghijauan & konservasi',
      'Kepatuhan regulasi lingkungan KLHK',
    ],
    badge: 'ISO 14001',
    badgeSub: 'Environmental Standard',
  },
  {
    title: 'Kesehatan Karyawan',
    en: 'Employee Wellness',
    color: '#f43f5e',
    from: '#f43f5e',
    to: '#8b5cf6',
    Icon: Heart,
    BigIcon: Award,
    desc: 'Program kesehatan komprehensif untuk memastikan kesejahteraan fisik dan mental seluruh karyawan PT Charoen Pokphand Indonesia.',
    points: [
      'Medical check-up & pemeriksaan berkala',
      'Program wellness & gizi kerja',
      'Penanganan PAK (Penyakit Akibat Kerja)',
      'Ergonomi & kenyamanan tempat kerja',
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
    title: 'Manajemen Temuan',
    en: 'Findings Management',
    desc: 'Catat, pantau, dan tindak lanjuti temuan safety, quality, environment, compliance, dan operasional.',
    features: [
      'Tracking status & deadline',
      'Notifikasi & eskalasi',
      'Laporan biaya perbaikan',
    ],
    active: true,
  },
  {
    id: 'incident',
    Icon: FileSearch,
    color: '#ef4444',
    from: 'from-red-500',
    to: 'to-rose-500',
    title: 'Laporan Insiden',
    en: 'Incident Report',
    desc: 'Laporkan dan investigasi insiden kecelakaan kerja, near-miss, dan kejadian berbahaya.',
    features: [
      'Root cause analysis',
      'Tindakan korektif & preventif',
      'Statistik insiden',
    ],
    active: false,
  },
  {
    id: 'inspection',
    Icon: Shield,
    color: '#0ea5e9',
    from: 'from-sky-500',
    to: 'to-cyan-500',
    title: 'Jadwal Inspeksi',
    en: 'Safety Inspection',
    desc: 'Kelola jadwal inspeksi rutin, audit K3, dan checklist digital yang dapat dikustomisasi.',
    features: ['Checklist digital', 'Penjadwalan otomatis', 'Riwayat inspeksi'],
    active: false,
  },
  {
    id: 'risk',
    Icon: Activity,
    color: '#f59e0b',
    from: 'from-amber-500',
    to: 'to-orange-500',
    title: 'Penilaian Risiko',
    en: 'Risk Assessment',
    desc: 'Identifikasi, evaluasi, dan kendalikan risiko dengan matriks HIRADC/HIRAC.',
    features: ['Matriks risiko HIRADC', 'Monitoring kontrol', 'Risk register'],
    active: false,
  },
  {
    id: 'training',
    Icon: GraduationCap,
    color: '#10b981',
    from: 'from-emerald-500',
    to: 'to-teal-500',
    title: 'Pelatihan K3',
    en: 'Safety Training',
    desc: 'Kelola program pelatihan K3, sertifikasi karyawan, dan rekam jejak kompetensi.',
    features: ['Rekap sertifikasi', 'Jadwal pelatihan', 'Tracking kompetensi'],
    active: false,
  },
  {
    id: 'docs',
    Icon: BookOpen,
    color: '#8b5cf6',
    from: 'from-violet-500',
    to: 'to-purple-500',
    title: 'Dokumen & Regulasi',
    en: 'Safety Documents',
    desc: 'Akses SOP, prosedur K3, dan peraturan perundangan dalam repositori terpusat.',
    features: [
      'SOP & Prosedur',
      'Regulasi KLHK & Kemenaker',
      'Guideline internal',
    ],
    active: false,
  },
];

// ─── How it works ────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'Login & Akses',
    desc: 'Masuk dengan akun Anda. Sistem otomatis menyesuaikan tampilan dan fitur berdasarkan role jabatan.',
    Icon: LogIn,
    color: '#6366f1',
  },
  {
    n: '02',
    title: 'Catat Temuan',
    desc: 'Input temuan lapangan lengkap dengan foto, kategori, prioritas, checklist, dan estimasi biaya.',
    Icon: ClipboardList,
    color: '#0ea5e9',
  },
  {
    n: '03',
    title: 'Tindak Lanjut',
    desc: 'Tim terkait mendapat notifikasi otomatis dan dapat memperbarui status, biaya, serta progress.',
    Icon: Activity,
    color: '#f59e0b',
  },
  {
    n: '04',
    title: 'Selesai & Arsip',
    desc: 'Temuan selesai otomatis masuk arsip dengan laporan lengkap siap untuk keperluan audit & pelaporan.',
    Icon: CheckCircle2,
    color: '#10b981',
  },
];

// ─── Component ───────────────────────────────────────────
export default function LandingPage({ onLogin }) {
  const [hlIdx, setHlIdx] = useState(0);
  const [hlKey, setHlKey] = useState(0);
  const [statsOn, setStatsOn] = useState(false);
  const [counts, setCounts] = useState(STATS.map(() => 0));
  const [mouseMap, setMouseMap] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const statsRef = useRef(null);

  const HEADLINES = [
    'Keselamatan Kerja',
    'Kesehatan Karyawan',
    'Lingkungan Hidup',
    'Kepatuhan K3',
  ];

  // Headline rotation
  useEffect(() => {
    const t = setInterval(() => {
      setHlIdx((i) => (i + 1) % HEADLINES.length);
      setHlKey((k) => k + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Parallax scroll
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Stat counter trigger
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStatsOn(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!statsOn) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCounts(STATS.map((s) => Math.floor(ease * s.target)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [statsOn]);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleCardMouse = (e, id) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouseMap((m) => ({
      ...m,
      [id]: { x: e.clientX - r.left, y: e.clientY - r.top },
    }));
  };
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
              ['#pillars', 'Pilar HSE'],
              ['#modules', 'Modul'],
              ['#how', 'Cara Kerja'],
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
            <LogIn size={15} /> Masuk
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
            Platform Manajemen K3 Terpadu · CPIN
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-3 text-white">
            Sistem Informasi
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
              Menjaga{' '}
              <span style={{ color: '#a5b4fc' }}>{HEADLINES[hlIdx]}</span> di
              Seluruh Fasilitas
            </p>
          </div>

          <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Platform digital terpadu untuk pengelolaan keselamatan, kesehatan
            kerja, dan lingkungan hidup di seluruh unit operasional{' '}
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
              Masuk ke Sistem
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
              Lihat Modul <ArrowRight size={16} />
            </a>
          </div>

          {/* Mini stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: '5 Kategori Temuan', color: '#6366f1' },
              { label: 'Zero Accident Target', color: '#ef4444' },
              { label: 'ISO 45001 & 14001', color: '#10b981' },
              { label: 'Real-time Notifikasi', color: '#f59e0b' },
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
            <Leaf size={11} /> Pilar Utama K3
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Health, Safety & Environment
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            Tiga pilar utama komitmen PT Charoen Pokphand Indonesia dalam
            menciptakan lingkungan kerja yang aman, sehat, dan berkelanjutan.
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
            <Building2 size={11} /> Modul Sistem
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Platform Lengkap Manajemen K3
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            Rangkaian modul terintegrasi yang mendukung seluruh proses manajemen
            K3 — dari pelaporan hingga tindak lanjut dan pelaporan audit.
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
                      {mod.active ? 'Tersedia' : 'Segera Hadir'}
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
                      Buka Modul <ArrowRight size={14} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Lock size={12} /> Dalam Pengembangan
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
            <TrendingUp size={11} /> Cara Kerja
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Mudah & Terstruktur
          </h2>
          <p className="text-base text-gray-500 max-w-lg mx-auto">
            Empat langkah sederhana dari pencatatan temuan hingga arsip laporan
            siap audit.
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
              Siap Memulai?
            </h2>
            <p className="text-base text-gray-400 mb-8 max-w-md mx-auto">
              Masuk dengan akun Anda dan mulai kelola findings safety, quality,
              dan lingkungan secara digital.
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
              Masuk Sekarang
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
