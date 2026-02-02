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
  Copy,
  Info,
  Database,
  ShieldCheck
} from 'lucide-react';
import whatsappIcon from './assets/whatsapp icon.png';
import edgeIcon from './assets/edge icon.png';

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
  { name: `"Hello!" message to Ian`, hex: "CF FA ED FE", appId: 1 },
  { name: "Somebody's profile photo", hex: "89 50 4E 47", appId: 1 },
  { name: "Windows OS code", hex: "47 45 54 20", appId: 1 },
  { name: "Notification sound", hex: "7B 22 6F 6B", appId: 1 },
  { name: "Bookmark List", hex: "48 65 6C 6C 6F 00", appId: 2 },
  { name: "YouTube video tab", hex: "23 21 2F 62", appId: 2 },
  { name: "Image loading", hex: "65 63 68 6f", appId: 2 },
  { name: "Windows OS code", hex: "47 45 54 20", appId: 2 } 
];

const SCENARIOS = {
  NORMAL: [
    { title: "1. Apps ask for memory", desc: "WhatsApp inside the virtual machine needs to save \"Hello!\" so it asks for address 5000. Edge also asks for address 5000. Both apps use the same address because every app starts with the same default memory layout.", layer: "gvm", analogy: { icon: <Home size={14}/>, text: "Apartment #502" } },
    { title: "2. Page table sorts out the addresses", desc: "OS sees both apps want address 5000. The page table translates them to different addresses so they don't collide. WhatsApp's 5000 becomes 2000. Edge’s 5000 becomes 3000. Problem solved - they have different addresses.", layer: "pt-layer", analogy: { icon: <Building size={14}/>, text: "Building Number" } },
    { title: "3. Hypervisor Mapping", desc: "The page table gave WhatsApp address 2000. Now WhatsApp wants actually use physical location and be able to store it. BUT the hypervisor says “stop, stop, stop, this is not your real address, your REAL address is 2309. The hypervisor redirects the data into another location with another address.", layer: "gpm", analogy: { icon: <MapPin size={14}/>, text: "Actual Street Address" } },
    { title: "4. Actual data storing", desc: "This is the moment where the data will be actually stored into a physical memory. WhatsApp message “Hello!” is now stored within the address 2309 and edge's data (bookmark list) is stored in another address 4320.", layer: "hpm", analogy: { icon: <Globe size={14}/>, text: "City Administration" } }
  ],
  SHADOW: [
    { title: "1. Apps request memory (shadow pre-check)", desc: "WhatsApp requests address 5000. Edge requests address 5000. The hypervisor already created shadow page tables for both apps ahead of time. These shadow tables map directly from virtual addresses to physical RAM addresses. The hypervisor is ready to translate both requests.", layer: "gvm", analogy: { icon: <Zap size={14}/>, text: "VIP Shortcut" } },
    { title: "2. Direct addresses to physical RAM", desc: "The hypervisor uses the shadow page table to translate directly without using 2 translations. WhatsApp’s address 5000 becomes HPM address 4021. Edge’s address 5000 becomes HPM address 1792. The shadow table skips the GPM layer completely. Both translations happen instantly without the guest OS knowing.", layer: "spt-layer", analogy: { icon: <Zap size={14}/>, text: "Saved Favorite" } },
    { title: "3. Actual data storing using shadowing", desc: `WhatsApp’s message “Hello!” is stored at physical address 4021. The data went straight from virtual addresses to physical RAM. No GPM middle step. Faster memory access but the hypervisor must update shadow tables whenever the VM’s OS changes its page tables. This adds CPU overhead and memory usage.`, layer: "hpm", analogy: { icon: <Globe size={14}/>, text: "Instant Delivery" } }
  ],
  BALLOON: [
    { title: "1. The host is running out of RAM", desc: "Physical RAM is low. Red Alert triggered. The VM running WhatsApp and Edge was assigned 4GB. But the host needs some of that RAM back for itself. The hypervisor detects the pressure and triggers the balloon driver.", layer: "hpm", analogy: { icon: <Wind size={14}/>, text: "Tax Notice" } },
    { title: "2. Driver Inflation", desc: "The hypervisor tells the balloon driver inside the VM to inflate. The balloon driver asks the OS for 1GB of memory. The OS thinks this is a normal app requesting memory, so it gives the balloon 1GB.", layer: "gvm", analogy: { icon: <Box size={14}/>, text: "Reserving Rooms" } },
    { title: "3. Resource Locking", desc: "The OS finds 1GB of memory that WhatsApp and Edge aren’t using much. The OS hands those pages to the balloon driver. Now WhatsApp and Edge can’t touch those pages anymore. From the VM’s perspective, the balloon is using that memory.", layer: "gpm", analogy: { icon: <ShieldAlert size={14}/>, text: "Marking Occupied" } },
    { title: "4. Hypervisor Reclaim", desc: "The hypervisor sees which physical RAM pages the balloon took. The hypervisor grabs those physical pages back and gives them to the host. The VM still thinks it has 4GB, but 1GB is just balloon memory that goes nowhere. The host now has more free RAM.", layer: "hpm", analogy: { icon: <Globe size={14}/>, text: "Public Use" } }
  ],
  TPS: [
    { title: "1. Hypervisor Scans for Duplicates", desc: "WhatsApp and Edge are both running. They both loaded Windows OS code into memory. The hypervisor scans their memory pages in the background and finds that WhatsApp has Windows OS code at physical address xxxx and Edge has the exact same Windows OS code at physical address xoxo. The content is identical.", layer: "gvm", icon: <Copy size={14}/> },
    { title: "2. Hypervisor Detects Match", desc: "The hypervisor compares the pages bytes by byte. They match perfectly. Both apps are storing same Windows OS code in two different physical locations. This is wasted RAM. The hypervisor decides to merge them.", layer: "pt-layer", icon: <Copy size={14}/> },
    { title: "3. Redirect to Single Frame  ", desc: "GPU has heard hypervisor and creates a similar address location for both apps. The hypervisor keeps the Windows OS code at physical address xxxx and updates Edge’s mapping to point to xxxx instead of xoxo. Now both WhatsApp and Edge point to the same physical memory location. They’re sharing the page. Neither app knows this happened.", layer: "gpm", icon: <Copy size={14}/> },
    { title: "4. Free Duplicate Memory", desc: "The hypervisor frees physical address  xoxo because nobody needs it anymore. The duplicate memory is gone. Both apps still access the same Windows OS code, but now it only takes up one physical code, but now it only takes up one physical page instead of two. Memory saved. If either app tries to modify the page, the hypervisor creates a separate copy for the app.", layer: "hpm", icon: <Copy size={14}/> }
  ]
};

const TECH_SPECS = {
  NORMAL: {
    label: "NORMAL TRACE",
    icon: <Binary className="text-sky-400" size={18} />,
    paragraphs: [
      "This is just a normal tracing and it provides a good isolation. Two layers of isolation = two layers of translation. The VM has no idea it’s being virtualised. WhatsApp thinks it’s running on real hardware with real addresses. It’s completely fooled. This is why it can run Windows inside Linux without Windows knowing.",
      "This approach with double translation isn’t great because it creates delays, slows down the system and takes memory to store all these addresses. A normal app makes millions of memory accesses per second. Each access needs two translations. That’s why even a tiny delay per translation may create big issues on running virtualisation.",
      "This is where hardware-assisted virtualisation comes in. Modern CPUs have special features that handle memory translation in hardware instead of software. This makes the double translation much faster and reduces the performance overhead significantly. It’s also called SLAT architecture."
    ]
  },
  SHADOW: {
    label: "Shadow Paging Logic",
    icon: <Zap className="text-purple-400" size={18} />,
    paragraphs: [
      "The \"shadow\" name comes from the fact that this table shadows the VM's page table. It's a hidden copy that the VM doesn't know exists. It provides faster memory access because it doesn’t have the double translation, it create a dirrect address that the hardware could use to store its data. However, the OS updates its own page table more often for shadowing because the hypervisor must detect the change and update the dhadow table to match. This syncing creates overhead and slows down performance because every time the VM updates its page table, the hypervisor has to detect that change and update its shadow copy.",
      "Shadow paging is still used today on older CPUs that don't have hardware virtualisation support. But modern systems use SLAT instead because it's much faster and simpler."
    ]
  },
  BALLOON: {
    label: "Memory Ballooning",
    icon: <Wind className="text-orange-400" size={18} />,
    paragraphs: [
      "The balloon driver is a special piece of software installed inside the guest OS that communicates with the hypervisor. When the host runs low on memory, the hypervisor sends a signal to the balloon driver to \"inflate\" - meaning it requests memory from the guest OS. The guest OS thinks the balloon driver is just a normal application asking for RAM, so it allocates memory pages to it.",
      "Once the balloon driver receives these pages, it doesn't actually use them for anything. Instead, it just holds onto them, preventing the guest OS from using that memory. The hypervisor then reclaims the corresponding physical memory pages and gives them back to the host system.",
      "The VM doesn't actually need less memory. It's being forced to give up RAM. If WhatsApp or Edge suddenly need that memory back, the VM's OS has to swap data to disk because the balloon is holding the RAM. This makes the VM slow. Heavy ballooning can cripple VM performance because disk is 1000x slower than RAM."
    ]
  },
  TPS: {
    label: "Transparent Page Sharing",
    icon: <Copy className="text-teal-400" size={18} />,
    paragraphs: [
      "VMs running the same OS have tons of duplicate pages. Windows system files, common libraries, shared code. All identical. Storing each copy separately wastes RAM. TPS finds the duplicates and merges them. One physical page instead of multiple copies.",
      "The hypervisor scans memory pages and creates a hash for each. Same hash = same content. When it finds matches, it points both VMs to one physical page and frees the duplicate. The VMs have no idea. They think they each have their own memory. In case when one of the apps writes a unique data that is different from the duplicate,  the hypervisor will immediately create a separate copy for the app.",
      "It frees up some space but it might have also some security issues. Shared pages can leak information between VMs through timing attacks. An attacker in one VM can measure how long memory access takes and figure out if another VM is using the same page. This reveals what the other VM is doing. Modern systems disable TPS by default because performance isn't worth the security risk."
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
      gpa: i === 0 ? `m1(2309)` :
           i === 1 ? `pB(3801)` :
           i === 2 ? `pC(892)` :
           i === 3 ? `pD(4523)` :
           i === 4 ? `m2(4320)` :
           i === 5 ? `pF(3256)` :
           i === 6 ? `p10(1678)` :
           `p11(4012)`,
      hpaIndex: i === 4 ? 14 : i === 0 ? 2 : (i * 2 + 1) % 16,
      hpa: i === 4 ? `#9182` : i === 0 ? `#4021` : `#${(i * 128 + 1024).toString()}`,
      ptEntry: i === 0 ? "m1" : i === 1 ? "pB" : i === 2 ? "pC" : i === 3 ? "pD" : i === 4 ? "p10" : i === 5 ? "pF" : i === 6 ? "m2" : "p11",
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
      setScenarioStep(s => {
        const nextStep = s + 1;
        return nextStep;
      });
      if (scenarioType === 'TPS') setSelectedBlock(null);
      else if (scenarioType !== 'BALLOON') setSelectedBlock(memoryBlocks[4]);
    } else {
      setScenarioStep(-1);
      setScenarioType(null);
      setSelectedBlock(null);
    }
  };

  const startScenario = (type) => {
    setScenarioType(null);
    setScenarioStep(-1);
    setSelectedBlock(null);
    setTimeout(() => {
      setScenarioType(type);
      setScenarioStep(0);
      if (type === 'TPS' || type === 'BALLOON') setSelectedBlock(null);
      else setSelectedBlock(memoryBlocks[4]);
      setTimeout(() => setRenderTrigger(prev => prev + 1), 100);
    }, 0);
  };

  return (
    <div className="min-h-screen w-full text-slate-200 overflow-hidden font-sans p-4 md:p-6 selection:bg-sky-500/30" 
         style={{ backgroundColor: COLORS.bg, fontFamily: FONT_UI }}>
      
      <div className="fixed inset-0 pointer-events-none opacity-20"
           style={{ 
             backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }} />
      
      <div className="relative z-10 max-w-[1300px] mx-auto w-full">
        

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        <div className="lg:col-span-8 flex flex-col gap-5 relative h-full">
          
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
          <MemoryLayer id="gvm" title="GVM // GUEST VIRTUAL MEMORY" color={COLORS.primary} subtitle="" isActive={currentScenario[scenarioStep]?.layer === 'gvm'}>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(appNum => (
                <div key={`app-container-${appNum}`} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {appNum === 1 ? (
                      <img src={whatsappIcon} alt="WhatsApp icon" className="h-4 w-4 block -mt-0.5" loading="lazy" />
                    ) : (
                      <img src={edgeIcon} alt="Edge icon" className="h-4 w-4 block -mt-0.5" loading="lazy" />
                    )}
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">
                      {appNum === 1 ? 'WhatsApp' : 'Edge'}
                    </span>
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
                          className={`h-11 rounded border cursor-pointer transition-all flex flex-col items-center justify-center text-[11px] font-mono leading-none ${
                            arrived ? (isTPSTarget ? 'border-teal-400 bg-teal-400/20 shadow-lg' : 'border-sky-400 bg-sky-400/20 shadow-lg') : 
                            (isSelected || isSecondary) ? 'border-sky-400 bg-transparent' :
                            isBalloonTarget ? 'border-orange-500/80 bg-orange-500/10 shadow-lg' :
                            'border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40'
                          }`}
                        >
                          <span className={arrived ? 'text-white font-bold' : (isTPSTarget ? 'text-teal-400' : isBalloonTarget ? 'text-orange-400 font-black' : (isSelected || isSecondary) ? 'text-sky-400' : 'text-sky-300')}>
                            {isBalloonTarget ? 'DRV' : block.appName}
                          </span>
                          {isTPSTarget && <span className="mt-1 text-[9px] text-teal-300/60 uppercase">Duplicate_ID: 104F</span>}
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
                <div className="flex items-center gap-2 mb-2"><Binary size={14} className="text-sky-400 -mt-0.5" /><span className="text-[11px] font-bold uppercase text-slate-400">Page Table</span></div>
                <div className="grid grid-cols-4 gap-1.5">
                   {memoryBlocks.map((block, idx) => {
                     const isSelectedPT = (scenarioType === 'NORMAL') && selectedBlock?.ptTarget === idx;
                     const isSecondaryPT = (scenarioType === 'NORMAL') && secondaryBlock.ptTarget === idx;
                     const isTPSTargetPT = (scenarioType === 'TPS') && block.isTPSCandidate;
                     const isPathActive = (isSelectedPT || isSecondaryPT || isTPSTargetPT) && scenarioStep >= 1;
                     const isArrivedNow = isPathActive && currentScenario[scenarioStep]?.layer === 'pt-layer';
                     return (
                       <div key={`pt-rect-${idx}`} id={`pt-layer-block-${idx}`} className={`h-10 rounded border text-[12px] font-mono flex items-center justify-center transition-all ${ isArrivedNow ? (isTPSTargetPT ? 'border-teal-400 bg-teal-400/20' : 'border-sky-400 bg-sky-400/20 shadow-md scale-105') : isPathActive ? (isTPSTargetPT ? 'border-teal-400/50 text-teal-200' : 'border-sky-400 bg-transparent text-sky-200') : 'border-white/5 bg-white/5 text-slate-500'}`}>{block.ptEntry}</div>
                     );
                   })}
                </div>
             </div>
             <div className={`bg-white/5 border rounded-xl p-3 backdrop-blur-md transition-all ${currentScenario[scenarioStep]?.layer === 'spt-layer' && scenarioType === 'SHADOW' ? 'border-purple-400 bg-purple-400/20 shadow-lg' : 'border-white/10 opacity-70'}`}>
                <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-purple-400 -mt-0.5" /><span className="text-[11px] font-bold uppercase text-slate-400">Shadow Table</span></div>
                <div className="grid grid-cols-4 gap-1.5">
                   {memoryBlocks.map((block, idx) => {
                     const isShadowMode = scenarioType === 'SHADOW';
                     const isSelectedSPT = isShadowMode && selectedBlock?.ptTarget === idx;
                     const isSecondarySPT = isShadowMode && secondaryBlock.ptTarget === idx;
                     const isPathActive = (isSelectedSPT || isSecondarySPT) && scenarioStep >= 1;
                     const isArrivedNow = isPathActive && currentScenario[scenarioStep]?.layer === 'spt-layer';
                     return (
                       <div key={`spt-rect-${idx}`} id={`spt-layer-block-${idx}`} className={`h-10 rounded border text-[12px] font-mono flex items-center justify-center transition-all ${ isArrivedNow ? 'border-purple-400 bg-purple-400/30 shadow-md scale-105' : isPathActive ? 'border-purple-400 bg-transparent text-purple-200' : 'border-white/5 bg-white/5 text-slate-600'}`}>{block.sptEntry}</div>
                     );
                   })}
                </div>
             </div>
          </div>

          {/* GPM Layer */}
          <MemoryLayer id="gpm" title="GPM // Guest Physical Memory" color={COLORS.logic} subtitle="" isActive={currentScenario[scenarioStep]?.layer === 'gpm'}>
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
                    <span style={{ fontFamily: FONT_TECH, fontSize: '12px' }} className={arrived ? 'text-amber-200 font-bold' : isBalloonTarget ? 'text-orange-200 font-black' : isPathActive ? (isTPSTarget ? 'text-teal-300' : 'text-amber-400 font-bold') : 'text-slate-400'}>
                      {isBalloonTarget ? 'LOCK' : block.gpa}
                    </span>
                  </div>
                );
              })}
            </div>
          </MemoryLayer>

          {/* HPM Layer */}
          <MemoryLayer id="hpm" title="HPM // Host Physical Memory" color={COLORS.secondary} subtitle="" isActive={currentScenario[scenarioStep]?.layer === 'hpm'}>
            <div className="relative">
              {scenarioType === 'BALLOON' && scenarioStep >= 0 && scenarioStep < currentScenario.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: [0, 1, 0], y: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-orange-500/60 backdrop-blur-md border border-orange-400/40 px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                    <AlertTriangle className="text-orange-950" size={18} />
                    <p className="text-[12px] font-black text-orange-950 uppercase tracking-widest leading-none">Low Memory Warning</p>
                  </div>
                </motion.div>
              )}

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
                      initial={false}
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
                      className={`h-12 rounded-lg border transition-all duration-300 relative flex items-center justify-center ${isActiveInPath ? 'z-20' : ''}`}
                    >
                      {isBalloonReclaimed || isTPSReclaimed ? (
                        <span className="text-[10px] text-slate-300 font-black tracking-tighter">FREE</span>
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
        <div className="lg:col-span-4 flex flex-col gap-5 h-full">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => startScenario('NORMAL')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'NORMAL' ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
              <Activity size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>NORMAL</span>
            </button>
            <button onClick={() => startScenario('SHADOW')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'SHADOW' ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
              <Zap size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>SHADOW</span>
            </button>
            <button onClick={() => startScenario('BALLOON')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'BALLOON' ? 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
              <Wind size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>BALLOON</span>
            </button>
            <button onClick={() => startScenario('TPS')} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${scenarioType === 'TPS' ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
              <Copy size={14} /><span style={{ fontFamily: FONT_TECH, fontSize: '10px' }}>TPS</span>
            </button>
          </div>
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

          <div className="flex-1">
            <GlassCard title="SMART EXPLANATION" accent="#fff" icon={<Info size={14}/>}>
            <AnimatePresence mode="wait">
              {scenarioType ? (
                <motion.div key={scenarioType} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    {TECH_SPECS[scenarioType].icon}
                    <span className="text-sm font-black uppercase tracking-tighter text-white">{TECH_SPECS[scenarioType].label}</span>
                  </div>
                  {TECH_SPECS[scenarioType].paragraphs ? (
                    <div className="space-y-3">
                      {TECH_SPECS[scenarioType].paragraphs.map((text, i) => (
                        <p key={i} className="text-sm text-slate-300 leading-relaxed">{text}</p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400 italic leading-relaxed">{TECH_SPECS[scenarioType].summary}</p>
                      <div className="space-y-4">
                        {TECH_SPECS[scenarioType].details.map((item, i) => (
                          <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-1">{item.head}</h4>
                            <p className="text-[11px] text-slate-300 leading-snug">{item.body}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center px-6" key="default">
                   <div className="p-4 bg-white/5 rounded-full mb-4 opacity-20"><ShieldCheck size={40} /></div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                     Click on one of the buttons above to start a memory management scenario demonstration.
                   </p>
                </div>
              )}
            </AnimatePresence>
            </GlassCard>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

// --- Helper Components ---
const MemoryLayer = ({ id, title, color, subtitle, children, isActive, className = '' }) => (
  <div className={`relative p-5 rounded-2xl border transition-all duration-500 ${isActive ? 'bg-white/10 border-white/40 shadow-2xl scale-[1.01]' : 'bg-white/5 border-white/5'} ${className}`} style={{ backdropFilter: 'blur(10px)' }}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xs font-black tracking-[0.2em] mb-1" style={{ color }}>{title}</h3>
        {subtitle ? (
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{subtitle}</p>
        ) : null}
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
