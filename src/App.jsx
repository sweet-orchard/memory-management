import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  Activity, 
  Box, 
  Terminal,
  RefreshCcw,
  ShieldAlert,
  HardDrive,
  Network,
  Binary,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Home,
  Building,
  MapPin,
  Globe,
  Zap,
  Wind,
  AlertTriangle,
  AppWindow,
  Copy,
  Info,
  Database,
  ShieldCheck
} from 'lucide-react';

// --- Theme & Style Tokens ---
const COLORS = {
  primary: '#38bdf8', // Sky Blue (GVM)
  logic: '#fbbf24',   // Amber (GPM)
  secondary: '#a855f7', // Purple (HPM)
  balloon: '#f97316',  // Orange (Ballooning context)
  sharing: '#2dd4bf',  // Teal (TPS context)
  driver: '#ea580c',   // Darker Orange
  pressure: '#ef4444', // Red for HPM pressure pulse
  warning: '#f97316',  // Orange for the Warning alert
  bg: '#020617',
  glass: 'rgba(15, 23, 42, 0.75)',
};

const FONT_TECH = '"JetBrains Mono", monospace';
const FONT_UI = '"Outfit", "Inter", sans-serif';

const APP_DATA = [
  { name: "Kernel", hex: "CF FA ED FE", appId: 1 },
  { name: "System", hex: "89 50 4E 47", appId: 1 },
  { name: "Browser", hex: "47 45 54 20", appId: 1 },
  { name: "Slack", hex: "7B 22 6F 6B", appId: 1 },
  { name: "Notes", hex: "48 65 6C 6C 6F 00", appId: 2 },
  { name: "Docker", hex: "23 21 2F 62", appId: 2 },
  { name: "Bash", hex: "65 63 68 6f", appId: 2 },
  { name: "Browser", hex: "47 45 54 20", appId: 2 } 
];

const SCENARIOS = {
  NORMAL: [
    { title: "1. Apps Use Virtual Addresses", desc: "Both apps request GVA 0x7ffd1234. These are private 'fake' addresses.", layer: "gvm", analogy: { icon: <Home size={14}/>, text: "Apartment #502" } },
    { title: "2. Isolation Translation", desc: "Linux uses individual Page Tables per App to prevent memory overlapping.", layer: "pt-layer", analogy: { icon: <Building size={14}/>, text: "Building Number" } },
    { title: "3. Hypervisor Mapping", desc: "The Hypervisor maps Guest pages to unique real hardware frames.", layer: "gpm", analogy: { icon: <MapPin size={14}/>, text: "Actual Street Address" } },
    { title: "4. Hardware Silicon Write", desc: "CPU writes to silicon. App 1 and App 2 are physically separated in RAM.", layer: "hpm", analogy: { icon: <Globe size={14}/>, text: "City Administration" } }
  ],
  SHADOW: [
    { title: "1. Shadow Pre-Check", desc: "Apps request GVA. Hypervisor has pre-shadowed maps for both processes.", layer: "gvm", analogy: { icon: <Zap size={14}/>, text: "VIP Shortcut" } },
    { title: "2. Fast-Path Hit", desc: "MMU finds direct maps to hardware in the Shadow Page Table (SPT).", layer: "spt-layer", analogy: { icon: <Zap size={14}/>, text: "Saved Favorite" } },
    { title: "3. Direct Hardware Jump", desc: "CPU jumps directly to silicon for both apps, bypassing guest OS logic.", layer: "hpm", analogy: { icon: <Globe size={14}/>, text: "Instant Delivery" } }
  ],
  BALLOON: [
    { title: "1. Host Pressure", desc: "Physical RAM is low. Red Alert triggered.", layer: "hpm", analogy: { icon: <Wind size={14}/>, text: "Tax Notice" } },
    { title: "2. Driver Inflation", desc: "Balloon Driver inflates in Guest memory to reclaim non-essential pages.", layer: "gvm", analogy: { icon: <Box size={14}/>, text: "Reserving Rooms" } },
    { title: "3. Resource Locking", desc: "Guest OS locks physical RAM for the driver.", layer: "gpm", analogy: { icon: <ShieldAlert size={14}/>, text: "Marking Occupied" } },
    { title: "4. Hypervisor Reclaim", desc: "Physical frames recovered. System memory is now stable.", layer: "hpm", analogy: { icon: <Globe size={14}/>, text: "Public Use" } }
  ],
  TPS: [
    { title: "1. Content ID Scan", desc: "Hypervisor scans Browser pages in App 1 and App 2 to find duplicates.", layer: "gvm", icon: <Copy size={14}/> },
    { title: "2. Translation Check", desc: "Hypervisor monitors the Guest Page Table mappings for both instances.", layer: "pt-layer", icon: <Copy size={14}/> },
    { title: "3. Identity Found & Merge", desc: "Both map to a single silicon frame. One redundant frame is evacuated.", layer: "gpm", icon: <Copy size={14}/> },
    { title: "4. Deduplication Reclaim", desc: "The duplicate hardware frame is freed. Memory is shared successfully.", layer: "hpm", icon: <Copy size={14}/> }
  ]
};

const TECH_SPECS = {
  NORMAL: {
    label: "SLAT Architecture",
    icon: <Binary className="text-sky-400" size={18} />,
    summary: "Second-Level Address Translation (Intel EPT / AMD RVI) provides hardware-assisted memory virtualization.",
    details: [
      { head: "Standard Logic", body: "The Guest OS handles GVA to GPA translation. The Hypervisor handles GPA to HPA using hardware page tables." },
      { head: "Why use it?", body: "It offers near-native performance because the hardware MMU performs the translation walkthrough without software traps." },
      { head: "System Impact", body: "Lowest possible CPU overhead. It is the gold standard for high-performance virtualization." }
    ]
  },
  SHADOW: {
    label: "Shadow Paging Logic",
    icon: <Zap className="text-purple-400" size={18} />,
    summary: "A software-based translation method where the hypervisor creates its own 'Shadow' tables for the CPU.",
    details: [
      { head: "The Mechanism", body: "The Hypervisor intercepts (traps) every guest update to its internal page tables to update the Shadow Table." },
      { head: "Why use it?", body: "Enables virtualization on older hardware that lacks SLAT support. Essential for legacy compatibility." },
      { head: "Performance Hit", body: "High CPU overhead. Every context switch or memory map change requires hypervisor intervention (VM-Exits)." }
    ]
  },
  BALLOON: {
    label: "Memory Ballooning",
    icon: <Wind className="text-orange-400" size={18} />,
    summary: "A dynamic resource reclamation technique using a proprietary driver inside the Guest OS.",
    details: [
      { head: "How it works", body: "When the host is under pressure, the balloon driver 'inflates' by requesting RAM from the guest kernel." },
      { head: "The Strategy", body: "It forces the guest OS to decide which pages are least important, effectively pushing them to the guest's own disk swap." },
      { head: "Resource Impact", body: "Allows high memory over-commitment. The host can safely run more VMs than physical RAM would otherwise permit." }
    ]
  },
  TPS: {
    label: "Transparent Page Sharing",
    icon: <Copy className="text-teal-400" size={18} />,
    summary: "A content-based deduplication engine that shares identical memory pages across different Virtual Machines.",
    details: [
      { head: "Scanning Logic", body: "Background tasks hash pages. If bit-patterns match, the hypervisor merges them into one physical copy." },
      { head: "The Benefit", body: "Massive RAM savings for VDI (Virtual Desktops) where 20+ VMs run identical Windows kernels and apps." },
      { head: "Security Impact", body: "Modern implementations use 'salting' to prevent side-channel attacks where one VM tries to guess another VM's data." }
    ]
  }
};

const App = () => {
  const [scenarioType, setScenarioType] = useState(null); 
  const [scenarioStep, setScenarioStep] = useState(-1);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Derive current scenario based on state
  const currentScenario = useMemo(() => scenarioType ? SCENARIOS[scenarioType] : [], [scenarioType]);

  const memoryBlocks = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      appId: APP_DATA[i].appId,
      appName: APP_DATA[i].name,
      hexData: APP_DATA[i].hex,
      gva: i === 4 ? `0x7FFD1234` : i === 0 ? `0x7FFD1234` : `0x${(i * 0x1000 + 0x400000).toString(16).toUpperCase().padStart(8, '0')}`,
      gpa: i === 4 ? `m2` : i === 0 ? `m1` : `p${(i + 10).toString(16).toUpperCase()}`,
      hpaIndex: i === 4 ? 14 : i === 0 ? 2 : (i * 2 + 1) % 16,
      hpa: i === 4 ? `#9182` : i === 0 ? `#4021` : `#${(i * 128 + 1024).toString()}`,
      ptEntry: i === 0 ? "m1" : i === 1 ? "pB" : i === 2 ? "pC" : i === 3 ? "pD" : i === 4 ? "m2" : i === 5 ? "pF" : i === 6 ? "p10" : "p11",
      sptEntry: i === 4 ? `#9182` : i === 0 ? `#4021` : `#${(i * 128 + 1024).toString()}`,
      ptTarget: i === 4 ? 6 : i, 
      isBalloonable: [2, 3, 5, 6, 7].includes(i),
      isTPSCandidate: i === 2 || i === 7 
    }));
  }, []);

  const secondaryBlock = useMemo(() => memoryBlocks[0], [memoryBlocks]);
  const tpsBlock1 = useMemo(() => memoryBlocks[2], [memoryBlocks]);
  const tpsBlock2 = useMemo(() => memoryBlocks[7], [memoryBlocks]);

  useEffect(() => {
    const handleResize = () => setRenderTrigger(prev => prev + 1);
    const timer = setTimeout(() => setRenderTrigger(prev => prev + 1), 500);
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); };
  }, [scenarioStep, scenarioType]);

  const calculateBlockCenter = (index, layerId) => {
    const element = document.getElementById(`${layerId}-block-${index}`);
    if (!element) return "0,0";
    const rect = element.getBoundingClientRect();
    const main = element.closest('main');
    const parent = main ? main.getBoundingClientRect() : { left: 0, top: 0 };
    return `${rect.left - parent.left + rect.width / 2} ${rect.top - parent.top + rect.height / 2}`;
  };

  const handleNext = () => {
    if (scenarioStep < currentScenario.length - 1) {
      setScenarioStep(s => s + 1);
      if (scenarioType === 'TPS') setSelectedBlock(null);
      else if (scenarioType !== 'BALLOON') setSelectedBlock(memoryBlocks[4]);
    } else {
      setScenarioStep(-1);
      setScenarioType(null);
      setSelectedBlock(null);
    }
  };

  const startScenario = (type) => {
    setScenarioType(type);
    setScenarioStep(0);
    if (type === 'TPS' || type === 'BALLOON') setSelectedBlock(null);
    else setSelectedBlock(memoryBlocks[4]);
    setTimeout(() => setRenderTrigger(prev => prev + 1), 100);
  };

  return (
    <div className="min-h-screen w-full text-slate-200 overflow-hidden font-sans p-4 md:p-6 selection:bg-sky-500/30" 
         style={{ backgroundColor: COLORS.bg, fontFamily: FONT_UI }}>
      
      <div className="fixed inset-0 pointer-events-none opacity-20"
           style={{ 
             backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }} />
      
      <header className="relative z-10 flex flex-col items-start mb-6 gap-2 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg">
            <Cpu className="text-sky-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 uppercase leading-none">
              Hyper_Memory_Monitor
            </h1>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => startScenario('NORMAL')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'NORMAL' ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
            <Activity size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>TRACE_SLAT</span>
          </button>
          <button onClick={() => startScenario('SHADOW')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'SHADOW' ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
            <Zap size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>TRACE_SHADOW</span>
          </button>
          <button onClick={() => startScenario('BALLOON')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'BALLOON' ? 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
            <Wind size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>TRACE_BALLOONING</span>
          </button>
          <button onClick={() => startScenario('TPS')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'TPS' ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
            <Copy size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>TRACE_TPS</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        <div className="lg:col-span-8 flex flex-col gap-5 relative">
          
          <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full">
            <AnimatePresence>
              {selectedBlock && scenarioType === 'NORMAL' && (
                <React.Fragment key={`normal-p-trace-${renderTrigger}`}>
                  {scenarioStep >= 1 && <motion.path key={`n1-p-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(selectedBlock.id, 'gvm')} L ${calculateBlockCenter(selectedBlock.ptTarget, 'pt-layer')}`} stroke={COLORS.primary} strokeWidth="3" fill="none" strokeDasharray="6,6" />}
                  {scenarioStep >= 2 && <motion.path key={`n2-p-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(selectedBlock.ptTarget, 'pt-layer')} L ${calculateBlockCenter(selectedBlock.id, 'gpm')}`} stroke={COLORS.logic} strokeWidth="3" fill="none" strokeDasharray="6,6" />}
                  {scenarioStep >= 3 && <motion.path key={`n3-p-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(selectedBlock.id, 'gpm')} L ${calculateBlockCenter(selectedBlock.hpaIndex, 'hpm')}`} stroke={COLORS.secondary} strokeWidth="3" fill="none" />}
                </React.Fragment>
              )}

              {selectedBlock && scenarioType === 'SHADOW' && (
                <React.Fragment key={`shadow-p-trace-${renderTrigger}`}>
                  {scenarioStep >= 1 && <motion.path key={`s1-p-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(selectedBlock.id, 'gvm')} L ${calculateBlockCenter(selectedBlock.ptTarget, 'spt-layer')}`} stroke={COLORS.secondary} strokeWidth="3" fill="none" strokeDasharray="2,2" />}
                  {scenarioStep >= 2 && <motion.path key={`s2-p-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(selectedBlock.ptTarget, 'spt-layer')} L ${calculateBlockCenter(selectedBlock.hpaIndex, 'hpm')}`} stroke={COLORS.secondary} strokeWidth="3" fill="none" className="drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />}
                </React.Fragment>
              )}

              {scenarioType === 'SHADOW' && scenarioStep >= 0 && (
                <React.Fragment key={`shadow-s-trace-${renderTrigger}`}>
                  {scenarioStep >= 1 && <motion.path key={`s1-s-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(secondaryBlock.id, 'gvm')} L ${calculateBlockCenter(secondaryBlock.ptTarget, 'spt-layer')}`} stroke={COLORS.secondary} strokeWidth="3" fill="none" strokeDasharray="2,2" opacity={0.7} />}
                  {scenarioStep >= 2 && <motion.path key={`s2-s-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(secondaryBlock.ptTarget, 'spt-layer')} L ${calculateBlockCenter(secondaryBlock.hpaIndex, 'hpm')}`} stroke={COLORS.secondary} strokeWidth="3" fill="none" opacity={0.7} />}
                </React.Fragment>
              )}

              {scenarioType === 'NORMAL' && scenarioStep >= 0 && (
                <React.Fragment key={`normal-s-trace-${renderTrigger}`}>
                  {scenarioStep >= 1 && <motion.path key={`n1-s-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(secondaryBlock.id, 'gvm')} L ${calculateBlockCenter(secondaryBlock.ptTarget, 'pt-layer')}`} stroke={COLORS.primary} strokeWidth="3" fill="none" strokeDasharray="4,4" opacity={0.5} />}
                  {scenarioStep >= 2 && <motion.path key={`n2-s-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(secondaryBlock.ptTarget, 'pt-layer')} L ${calculateBlockCenter(secondaryBlock.id, 'gpm')}`} stroke={COLORS.logic} strokeWidth="3" fill="none" strokeDasharray="4,4" opacity={0.5} />}
                  {scenarioStep >= 3 && <motion.path key={`n3-s-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(secondaryBlock.id, 'gpm')} L ${calculateBlockCenter(secondaryBlock.hpaIndex, 'hpm')}`} stroke={COLORS.secondary} strokeWidth="3" fill="none" opacity={0.5} />}
                </React.Fragment>
              )}

              {scenarioType === 'TPS' && (
                <React.Fragment key={`tps-trace-${renderTrigger}`}>
                  {scenarioStep >= 1 && (
                    <>
                      <motion.path key={`tps-1a-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(tpsBlock1.id, 'gvm')} L ${calculateBlockCenter(tpsBlock1.ptTarget, 'pt-layer')}`} stroke={COLORS.sharing} strokeWidth="3" fill="none" strokeDasharray="4,4" />
                      <motion.path key={`tps-1b-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(tpsBlock2.id, 'gvm')} L ${calculateBlockCenter(tpsBlock2.ptTarget, 'pt-layer')}`} stroke={COLORS.sharing} strokeWidth="3" fill="none" strokeDasharray="4,4" />
                    </>
                  )}
                  {scenarioStep >= 2 && (
                    <>
                      <motion.path key={`tps-2a-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(tpsBlock1.ptTarget, 'pt-layer')} L ${calculateBlockCenter(tpsBlock1.id, 'gpm')}`} stroke={COLORS.sharing} strokeWidth="3" fill="none" strokeDasharray="4,4" />
                      <motion.path key={`tps-2b-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(tpsBlock2.ptTarget, 'pt-layer')} L ${calculateBlockCenter(tpsBlock2.id, 'gpm')}`} stroke={COLORS.sharing} strokeWidth="3" fill="none" strokeDasharray="4,4" />
                    </>
                  )}
                  {scenarioStep >= 3 && (
                    <>
                      <motion.path key={`tps-3a-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(tpsBlock1.id, 'gpm')} L ${calculateBlockCenter(tpsBlock1.hpaIndex, 'hpm')}`} stroke={COLORS.sharing} strokeWidth="3" fill="none" />
                      <motion.path key={`tps-3b-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(tpsBlock2.id, 'gpm')} L ${calculateBlockCenter(tpsBlock1.hpaIndex, 'hpm')}`} stroke={COLORS.sharing} strokeWidth="3" fill="none" />
                    </>
                  )}
                </React.Fragment>
              )}

              {scenarioType === 'BALLOON' && (
                <React.Fragment key={`balloon-trace-${renderTrigger}`}>
                  {scenarioStep >= 1 && memoryBlocks.filter(b => b.isBalloonable).map(block => (
                    <motion.path key={`b1-${block.id}-${renderTrigger}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} d={`M ${calculateBlockCenter(block.hpaIndex, 'hpm')} L ${calculateBlockCenter(block.id, 'gvm')}`} stroke={COLORS.balloon} strokeWidth="2" fill="none" strokeDasharray="4,4" />
                  ))}
                  {scenarioStep >= 2 && memoryBlocks.filter(b => b.isBalloonable).map(block => (
                    <motion.path key={`b2-${block.id}-${renderTrigger}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={`M ${calculateBlockCenter(block.id, 'gvm')} L ${calculateBlockCenter(block.id, 'gpm')}`} stroke={COLORS.balloon} strokeWidth="3" fill="none" />
                  ))}
                  {scenarioStep >= 3 && memoryBlocks.filter(b => b.isBalloonable).map(block => (
                    <motion.path key={`b3-${block.id}-${renderTrigger}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={`M ${calculateBlockCenter(block.id, 'gpm')} L ${calculateBlockCenter(block.hpaIndex, 'hpm')}`} stroke={COLORS.balloon} strokeWidth="3" fill="none" />
                  ))}
                </React.Fragment>
              )}
            </AnimatePresence>
          </svg>

          {/* GVM Layer */}
          <MemoryLayer id="gvm" title="GVM // GUEST VIRTUAL LAYER" color={COLORS.primary} subtitle="Isolated Address Spaces" isActive={currentScenario[scenarioStep]?.layer === 'gvm'}>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(appNum => (
                <div key={`app-container-${appNum}`} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AppWindow size={10} className="text-sky-400" />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Application {appNum}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {memoryBlocks.filter(b => b.appId === appNum).map(block => {
                      const isBalloonTarget = scenarioType === 'BALLOON' && scenarioStep >= 1 && block.isBalloonable;
                      const isTPSTarget = scenarioType === 'TPS' && scenarioStep >= 0 && block.isTPSCandidate;
                      const isSelected = selectedBlock?.id === block.id;
                      const isSecondary = (scenarioType === 'NORMAL' || scenarioType === 'SHADOW') && secondaryBlock.id === block.id && scenarioStep >= 0;
                      const arrived = scenarioType && scenarioStep >= 0 && currentScenario[scenarioStep]?.layer === 'gvm' && (isSelected || isSecondary || isTPSTarget);
                      
                      return (
                        <div key={`gvm-rect-${block.id}`} id={`gvm-block-${block.id}`} onClick={() => { setSelectedBlock(block); setScenarioType(null); }}
                          className={`h-11 rounded border cursor-pointer transition-all flex flex-col items-center justify-center text-[9px] font-mono leading-none ${
                            arrived ? (isTPSTarget ? 'border-teal-400 bg-teal-400/20 shadow-lg' : 'border-sky-400 bg-sky-400/20 shadow-lg') : 
                            (isSelected || isSecondary) ? 'border-sky-400 bg-transparent' :
                            isBalloonTarget ? 'border-orange-500/80 bg-orange-500/10 shadow-lg' :
                            'border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40'
                          }`}
                        >
                          <span className={arrived ? 'text-white font-bold' : (isTPSTarget ? 'text-teal-400' : isBalloonTarget ? 'text-orange-400 font-black' : (isSelected || isSecondary) ? 'text-sky-400' : 'text-sky-300')}>
                            {isBalloonTarget ? 'DRV' : `"${block.appName}"`}
                          </span>
                          {isTPSTarget && <span className="mt-1 text-[7px] text-teal-300/60 uppercase">D-UP_ID: 104F</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </MemoryLayer>

          {/* Logic Layers */}
          <div className="grid grid-cols-2 gap-4">
             <div className={`bg-white/5 border rounded-xl p-3 backdrop-blur-md transition-all ${currentScenario[scenarioStep]?.layer === 'pt-layer' || (scenarioType === 'TPS' && scenarioStep >= 1 && scenarioStep <= 2) ? 'border-sky-400 bg-sky-400/10' : 'border-white/10 opacity-70'}`}>
                <div className="flex items-center gap-2 mb-2"><Binary size={10} className="text-sky-400" /><span className="text-[9px] font-bold uppercase text-slate-400">Page Table</span></div>
                <div className="grid grid-cols-4 gap-1.5">
                   {memoryBlocks.map((block, idx) => {
                     const isSelectedPT = (scenarioType === 'NORMAL') && selectedBlock?.ptTarget === idx;
                     const isSecondaryPT = (scenarioType === 'NORMAL') && secondaryBlock.ptTarget === idx;
                     const isTPSTargetPT = (scenarioType === 'TPS') && block.isTPSCandidate;
                     const isPathActive = (isSelectedPT || isSecondaryPT || isTPSTargetPT) && scenarioStep >= 1;
                     const isArrivedNow = isPathActive && currentScenario[scenarioStep]?.layer === 'pt-layer';
                     return (
                       <div key={`pt-rect-${idx}`} id={`pt-layer-block-${idx}`} className={`h-5 rounded border text-[7px] font-mono flex items-center justify-center transition-all ${ isArrivedNow ? (isTPSTargetPT ? 'border-teal-400 bg-teal-400/20' : 'border-sky-400 bg-sky-400/20 shadow-md scale-105') : isPathActive ? (isTPSTargetPT ? 'border-teal-400/50 text-teal-200' : 'border-sky-400 bg-transparent text-sky-200') : 'border-white/5 bg-white/5 text-slate-500'}`}>{block.ptEntry}</div>
                     );
                   })}
                </div>
             </div>
             <div className={`bg-white/5 border rounded-xl p-3 backdrop-blur-md transition-all ${currentScenario[scenarioStep]?.layer === 'spt-layer' && scenarioType === 'SHADOW' ? 'border-purple-400 bg-purple-400/20 shadow-lg' : 'border-white/10 opacity-70'}`}>
                <div className="flex items-center gap-2 mb-2"><Zap size={10} className="text-purple-400" /><span className="text-[9px] font-bold uppercase text-slate-400">Shadow Table</span></div>
                <div className="grid grid-cols-4 gap-1.5">
                   {memoryBlocks.map((block, idx) => {
                     const isShadowMode = scenarioType === 'SHADOW';
                     const isSelectedSPT = isShadowMode && selectedBlock?.ptTarget === idx;
                     const isSecondarySPT = isShadowMode && secondaryBlock.ptTarget === idx;
                     const isPathActive = (isSelectedSPT || isSecondarySPT) && scenarioStep >= 1;
                     const isArrivedNow = isPathActive && currentScenario[scenarioStep]?.layer === 'spt-layer';
                     return (
                       <div key={`spt-rect-${idx}`} id={`spt-layer-block-${idx}`} className={`h-5 rounded border text-[7px] font-mono flex items-center justify-center transition-all ${ isArrivedNow ? 'border-purple-400 bg-purple-400/30 shadow-md scale-105' : isPathActive ? 'border-purple-400 bg-transparent text-purple-200' : 'border-white/5 bg-white/5 text-slate-600'}`}>{block.sptEntry}</div>
                     );
                   })}
                </div>
             </div>
          </div>

          {/* GPM Layer */}
          <MemoryLayer id="gpm" title="GPM // INTERMEDIATE LOGIC" color={COLORS.logic} subtitle="Guest Physical Frames" isActive={currentScenario[scenarioStep]?.layer === 'gpm'}>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {memoryBlocks.map(block => {
                const isBalloonTarget = scenarioType === 'BALLOON' && scenarioStep >= 2 && block.isBalloonable;
                const isTPSTarget = scenarioType === 'TPS' && scenarioStep >= 2 && block.isTPSCandidate;
                const isSelected = (scenarioType === 'NORMAL') && selectedBlock?.id === block.id;
                const isSecondary = (scenarioType === 'NORMAL') && secondaryBlock.id === block.id;
                const isPathActive = (isSelected || isSecondary || isTPSTarget) && scenarioStep >= 2;
                const arrived = isPathActive && currentScenario[scenarioStep]?.layer === 'gpm';
                return (
                  <div key={`gpm-rect-${block.id}`} id={`gpm-block-${block.id}`}
                    className={`h-11 rounded-lg border flex items-center justify-center transition-all ${
                      arrived ? (isTPSTarget ? 'border-teal-400 bg-teal-400/30 shadow-lg scale-105' : 'border-amber-400 bg-amber-400/30 shadow-lg scale-105') : 
                      isPathActive ? (isTPSTarget ? 'border-teal-400 bg-transparent' : 'border-amber-400 bg-transparent text-amber-200') :
                      isBalloonTarget ? 'border-orange-500/80 bg-orange-500/10 shadow-lg' :
                      'border-amber-500/20 bg-amber-500/5'
                    }`}
                  >
                    <span style={{ fontFamily: FONT_TECH, fontSize: '10px' }} className={arrived ? 'text-amber-200 font-bold' : isBalloonTarget ? 'text-orange-200 font-black' : isPathActive ? (isTPSTarget ? 'text-teal-300' : 'text-amber-400 font-bold') : 'text-slate-400'}>
                      {isBalloonTarget ? 'LOCK' : block.gpa}
                    </span>
                  </div>
                );
              })}
            </div>
          </MemoryLayer>

          {/* HPM Layer */}
          <MemoryLayer id="hpm" title="HPM // SILICON FABRIC" color={COLORS.secondary} subtitle="Host Physical Hardware" isActive={currentScenario[scenarioStep]?.layer === 'hpm'}>
            <div className="relative">
              <AnimatePresence>
                {scenarioType === 'BALLOON' && scenarioStep === 0 && (
                  <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: [0.7, 1, 0.7], y: 0 }} transition={{ duration: 2, repeat: 2, ease: "easeInOut" }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" key="pressure-warning">
                    <div className="bg-orange-500/60 backdrop-blur-md border border-orange-400/40 px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                      <AlertTriangle className="text-orange-950" size={18} />
                      <p className="text-[12px] font-black text-orange-950 uppercase tracking-widest leading-none">Low Memory Warning</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {Array.from({ length: 16 }).map((_, i) => {
                  const mappedBlock = memoryBlocks.find(b => b.hpaIndex === i);
                  const isSelected = selectedBlock?.hpaIndex === i;
                  const isSecondary = (scenarioType === 'NORMAL' || scenarioType === 'SHADOW') && secondaryBlock.hpaIndex === i;
                  const isArrivedAtHPM = (scenarioType === 'NORMAL' && scenarioStep === 3) || (scenarioType === 'SHADOW' && scenarioStep === 2) || (scenarioType === 'TPS' && scenarioStep === 3);
                  const isActiveInPath = (isSelected || isSecondary) && scenarioStep >= (scenarioType === 'SHADOW' ? 2 : 3);
                  const isTPSFrame1 = scenarioType === 'TPS' && i === tpsBlock1.hpaIndex && scenarioStep >= 2;
                  const isTPSFrame2Duplicate = scenarioType === 'TPS' && i === tpsBlock2.hpaIndex && scenarioStep >= 2;
                  const isTPSReclaimed = scenarioType === 'TPS' && i === tpsBlock2.hpaIndex && scenarioStep === 3;
                  const isBalloonReclaimed = scenarioType === 'BALLOON' && scenarioStep === 3 && mappedBlock?.isBalloonable;
                  const isOtherInBalloonFinal = scenarioType === 'BALLOON' && scenarioStep === 3 && !isBalloonReclaimed;
                  const isHighPressureActive = scenarioType === 'BALLOON' && scenarioStep === 0;
                  const isUnderPressureStatic = scenarioType === 'BALLOON' && (scenarioStep === 1 || scenarioStep === 2);

                  return (
                    <motion.div key={`hpm-rect-${i}`} id={`hpm-block-${i}`}
                      animate={isArrivedAtHPM && (isSelected || isSecondary) ? { backgroundColor: 'rgba(168, 85, 247, 0.4)', borderColor: COLORS.secondary, scale: 1.1 } : 
                               isActiveInPath ? { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.8)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)' } :
                               isHighPressureActive ? { borderColor: [COLORS.pressure, 'rgba(239, 68, 68, 0.3)', COLORS.pressure], backgroundColor: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.25)', 'rgba(239, 68, 68, 0.1)'] } :
                               isUnderPressureStatic ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' } :
                               isOtherInBalloonFinal ? { backgroundColor: 'rgba(249, 115, 22, 0.25)', borderColor: 'rgba(249, 115, 22, 0.4)' } :
                               isBalloonReclaimed || isTPSReclaimed ? { backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.15)', boxShadow: 'none' } : 
                               isTPSFrame1 ? { backgroundColor: 'rgba(45, 212, 191, 0.3)', borderColor: COLORS.sharing, boxShadow: scenarioStep === 3 ? '0 0 20px rgba(45, 212, 191, 0.4)' : 'none' } :
                               isTPSFrame2Duplicate && scenarioStep === 2 ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: COLORS.secondary } :
                               { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: 'rgba(168, 85, 247, 0.1)' }}
                      transition={isHighPressureActive ? { duration: 2, repeat: 2 } : {}}
                      className={`h-9 rounded-lg border transition-all duration-300 relative flex items-center justify-center ${isActiveInPath ? 'z-20' : ''}`}
                    >
                      {isBalloonReclaimed || isTPSReclaimed ? (
                        <span className="text-[8px] text-slate-300 font-black tracking-tighter">FREE</span>
                      ) : (mappedBlock || isHighPressureActive || isUnderPressureStatic || isActiveInPath || isOtherInBalloonFinal || isTPSFrame1 || (isTPSFrame2Duplicate && scenarioStep === 2)) ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${ (isSelected || isSecondary) && isArrivedAtHPM ? 'bg-white shadow-[0_0_8px_white]' : isHighPressureActive ? 'bg-red-500 animate-pulse' : (isActiveInPath ? 'bg-purple-400' : isOtherInBalloonFinal ? 'bg-orange-500/50' : isTPSFrame1 ? 'bg-teal-400 shadow-[0_0_10px_teal]' : 'bg-purple-500/30')}`} />
                      ) : null}
                      {isTPSFrame1 && scenarioStep === 3 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full border border-slate-900 shadow-lg" title="Shared Page" />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </MemoryLayer>
        </div>

        {/* Info Panels */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {scenarioType && (
            <div className={`border rounded-xl p-5 shadow-xl transition-colors ${
              scenarioType === 'SHADOW' ? 'bg-purple-500/10 border-purple-500/50' : 
              scenarioType === 'TPS' ? 'bg-teal-500/10 border-teal-500/50 shadow-[0_0_20px_rgba(45,212,191,0.1)]' :
              scenarioType === 'BALLOON' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'bg-sky-500/10 border-sky-500/50'
            }`}>
               <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${scenarioType === 'SHADOW' ? 'text-purple-400' : scenarioType === 'TPS' ? 'text-teal-400' : scenarioType === 'BALLOON' ? 'text-orange-400' : 'text-sky-400'}`}>{scenarioType} // TRACE</span>
                  <span className="text-[10px] text-slate-500 font-mono">{scenarioStep + 1} / {currentScenario.length}</span>
               </div>
               <h3 className="text-lg font-bold text-white mb-2">{currentScenario[scenarioStep]?.title}</h3>
               <p className="text-sm text-slate-400 leading-relaxed mb-5">{currentScenario[scenarioStep]?.desc}</p>
               <div className="flex gap-3">
                  <button onClick={() => setScenarioStep(s => Math.max(0, s-1))} className="flex-1 py-2 rounded border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold uppercase">Back</button>
                  <button onClick={handleNext} className={`flex-1 py-2 rounded text-black font-black text-xs transition-colors uppercase ${scenarioType === 'SHADOW' ? 'bg-purple-400 hover:bg-purple-300' : scenarioType === 'TPS' ? 'bg-teal-400 hover:bg-teal-300' : scenarioType === 'BALLOON' ? 'bg-orange-400 hover:bg-orange-300' : 'bg-sky-400 hover:bg-sky-300'}`}>{scenarioStep === currentScenario.length - 1 ? "Finish" : "Next"}</button>
               </div>
            </div>
          )}

          <GlassCard title="HYPERVISOR INTELLIGENCE" accent="#fff" icon={<Info size={14}/>}>
            <AnimatePresence mode="wait">
              {scenarioType ? (
                <motion.div key={scenarioType} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    {TECH_SPECS[scenarioType].icon}
                    <span className="text-sm font-black uppercase tracking-tighter text-white">{TECH_SPECS[scenarioType].label}</span>
                  </div>
                  <p className="text-xs text-slate-400 italic leading-relaxed">{TECH_SPECS[scenarioType].summary}</p>
                  <div className="space-y-4">
                    {TECH_SPECS[scenarioType].details.map((item, i) => (
                      <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 mb-1">{item.head}</h4>
                        <p className="text-[11px] text-slate-300 leading-snug">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center px-6" key="default">
                   <div className="p-4 bg-white/5 rounded-full mb-4 opacity-20"><ShieldCheck size={40} /></div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                     Select a scenario trace to analyze hypervisor logic, performance impact, and resource management strategies.
                   </p>
                </div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </main>
    </div>
  );
};

// --- Helper Components ---
const MemoryLayer = ({ id, title, color, subtitle, children, isActive }) => (
  <div className={`relative p-5 rounded-2xl border transition-all duration-500 ${isActive ? 'bg-white/10 border-white/40 shadow-2xl scale-[1.01]' : 'bg-white/5 border-white/5'}`} style={{ backdropFilter: 'blur(10px)' }}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xs font-black tracking-[0.2em] mb-1" style={{ color }}>{title}</h3>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{subtitle}</p>
      </div>
      <Layers size={14} className="text-slate-600" />
    </div>
    {children}
  </div>
);

const GlassCard = ({ title, children, accent = COLORS.primary, icon }) => (
  <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col bg-slate-900/50 shadow-lg h-full" style={{ backdropFilter: 'blur(20px)' }}>
    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-white/5">
      {icon}
      <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: accent }}>{title}</span>
    </div>
    <div className="p-4 flex-1">{children}</div>
  </div>
);

export default App;