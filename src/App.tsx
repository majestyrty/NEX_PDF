import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudUpload,
  FileArchive,
  FileImage,
  FileText,
  Files,
  Gauge,
  HardDrive,
  Image,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  accent: string;
  supported: boolean;
  accepts: string;
  multiple?: boolean;
};

const tools: Tool[] = [
  { id: "merge", name: "Merge PDF", description: "Combine files in the order you want.", icon: Files, category: "Organize PDF", accent: "lilac", supported: true, accepts: ".pdf", multiple: true },
  { id: "split", name: "Split PDF", description: "Split a PDF into individual pages.", icon: FileArchive, category: "Organize PDF", accent: "peach", supported: true, accepts: ".pdf" },
  { id: "compress", name: "Compress PDF", description: "Reduce file size while keeping quality.", icon: Gauge, category: "Optimize PDF", accent: "mint", supported: false, accepts: ".pdf" },
  { id: "edit", name: "Edit PDF", description: "Make changes to text and images.", icon: FileText, category: "Edit PDF", accent: "blue", supported: false, accepts: ".pdf" },
  { id: "rotate", name: "Rotate PDF", description: "Turn pages to the right orientation.", icon: ArrowRight, category: "Organize PDF", accent: "peach", supported: true, accepts: ".pdf" },
  { id: "organize", name: "Organize pages", description: "Reorder pages with a custom sequence.", icon: Files, category: "Organize PDF", accent: "lilac", supported: true, accepts: ".pdf" },
  { id: "delete", name: "Delete pages", description: "Remove pages you don't need.", icon: X, category: "Organize PDF", accent: "rose", supported: true, accepts: ".pdf" },
  { id: "extract", name: "Extract pages", description: "Save selected pages as a new PDF.", icon: FileText, category: "Organize PDF", accent: "blue", supported: true, accepts: ".pdf" },
  { id: "protect", name: "Protect PDF", description: "Secure your document with a password.", icon: LockKeyhole, category: "Secure PDF", accent: "mint", supported: false, accepts: ".pdf" },
  { id: "unlock", name: "Unlock PDF", description: "Remove a password from a file you own.", icon: ShieldCheck, category: "Secure PDF", accent: "lilac", supported: false, accepts: ".pdf" },
  { id: "watermark", name: "Add watermark", description: "Stamp your pages with custom text.", icon: FileText, category: "Edit PDF", accent: "blue", supported: true, accepts: ".pdf" },
  { id: "pagenum", name: "Add page numbers", description: "Number every page automatically.", icon: FileText, category: "Edit PDF", accent: "peach", supported: true, accepts: ".pdf" },
  { id: "pdfword", name: "PDF to Word", description: "Turn PDF pages into an editable document.", icon: FileText, category: "Convert from PDF", accent: "blue", supported: false, accepts: ".pdf" },
  { id: "wordpdf", name: "Word to PDF", description: "Convert DOCX documents to PDF.", icon: FileText, category: "Convert to PDF", accent: "blue", supported: false, accepts: ".doc,.docx" },
  { id: "pdfexcel", name: "PDF to Excel", description: "Extract tables into a spreadsheet.", icon: Files, category: "Convert from PDF", accent: "mint", supported: false, accepts: ".pdf" },
  { id: "excelpdf", name: "Excel to PDF", description: "Export spreadsheets as PDF.", icon: Files, category: "Convert to PDF", accent: "mint", supported: false, accepts: ".xls,.xlsx" },
  { id: "pdfppt", name: "PDF to PowerPoint", description: "Convert pages into presentation slides.", icon: FileText, category: "Convert from PDF", accent: "peach", supported: false, accepts: ".pdf" },
  { id: "pptpdf", name: "PowerPoint to PDF", description: "Export presentations as PDF.", icon: FileText, category: "Convert to PDF", accent: "peach", supported: false, accepts: ".ppt,.pptx" },
  { id: "pdfjpg", name: "PDF to JPG", description: "Export PDF pages as images.", icon: FileImage, category: "Convert from PDF", accent: "rose", supported: false, accepts: ".pdf" },
  { id: "jpgpdf", name: "JPG to PDF", description: "Create a PDF from your images.", icon: Image, category: "Convert to PDF", accent: "rose", supported: true, accepts: ".jpg,.jpeg,.png", multiple: true },
  { id: "pngpdf", name: "PNG to PDF", description: "Create a PDF from PNG images.", icon: Image, category: "Convert to PDF", accent: "rose", supported: true, accepts: ".png", multiple: true },
  { id: "pdfpng", name: "PDF to PNG", description: "Export PDF pages as PNG images.", icon: FileImage, category: "Convert from PDF", accent: "rose", supported: false, accepts: ".pdf" },
];

type Section = "Overview" | "All tools" | "File transfer" | "NEX MB Compressor" | "NEX AI Connect" | "Pricing" | "Settings";

const navItems: { title: Section; icon: LucideIcon }[] = [
  { title: "Overview", icon: Gauge },
  { title: "All tools", icon: Files },
  { title: "File transfer", icon: CloudUpload },
  { title: "NEX MB Compressor", icon: FileArchive },
  { title: "NEX AI Connect", icon: Sparkles },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function parsePageNumbers(value: string, pageCount: number) {
  const pages = value.split(",").map((part) => Number(part.trim()));
  if (!pages.length || pages.some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
    throw new Error(`Enter page numbers from 1 to ${pageCount}, separated by commas.`);
  }
  return pages.map((page) => page - 1);
}

async function runTool(tool: Tool, files: File[], option: string, setProgress: (value: number) => void) {
  const { PDFDocument, degrees, rgb, StandardFonts } = await import("pdf-lib");
  if (!files.length) throw new Error("Choose a file to continue.");
  setProgress(10);

  if (tool.id === "jpgpdf" || tool.id === "pngpdf") {
    const pdf = await PDFDocument.create();
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const bytes = await file.arrayBuffer();
      const image = file.name.toLowerCase().endsWith(".png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      setProgress(20 + Math.round(((index + 1) / files.length) * 70));
    }
    const output = await pdf.save();
    downloadBlob(new Blob([output as BlobPart], { type: "application/pdf" }), "nex-images.pdf");
    return;
  }

  if (tool.id === "merge") {
    const merged = await PDFDocument.create();
    for (let index = 0; index < files.length; index += 1) {
      const source = await PDFDocument.load(await files[index].arrayBuffer());
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
      setProgress(15 + Math.round(((index + 1) / files.length) * 75));
    }
    downloadBlob(new Blob([await merged.save() as BlobPart], { type: "application/pdf" }), "merged.pdf");
    return;
  }

  if (tool.id === "split") {
    const { default: JSZip } = await import("jszip");
    const source = await PDFDocument.load(await files[0].arrayBuffer());
    const zip = new JSZip();
    for (const [index, pageIndex] of source.getPageIndices().entries()) {
      const onePage = await PDFDocument.create();
      const [page] = await onePage.copyPages(source, [pageIndex]);
      onePage.addPage(page);
      zip.file(`page-${String(index + 1).padStart(3, "0")}.pdf`, await onePage.save());
      setProgress(15 + Math.round(((index + 1) / source.getPageCount()) * 75));
    }
    downloadBlob(await zip.generateAsync({ type: "blob" }), "split-pages.zip");
    return;
  }

  const pdf = await PDFDocument.load(await files[0].arrayBuffer());
  const pageCount = pdf.getPageCount();
  setProgress(45);

  if (tool.id === "rotate") {
    pdf.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + 90) % 360)));
  } else if (tool.id === "delete" || tool.id === "extract" || tool.id === "organize") {
    const indices = parsePageNumbers(option, pageCount);
    if (tool.id === "organize" && (indices.length !== pageCount || new Set(indices).size !== pageCount)) {
      throw new Error(`Include each page exactly once to reorder all ${pageCount} pages.`);
    }
    const output = await PDFDocument.create();
    const chosen = tool.id === "delete"
      ? pdf.getPageIndices().filter((index) => !indices.includes(index))
      : indices;
    if (!chosen.length) throw new Error("At least one page must remain in the document.");
    const copied = await output.copyPages(pdf, chosen);
    copied.forEach((page) => output.addPage(page));
    downloadBlob(new Blob([await output.save() as BlobPart], { type: "application/pdf" }), `${tool.id}.pdf`);
    setProgress(100);
    return;
  } else if (tool.id === "watermark") {
    const text = option.trim();
    if (!text) throw new Error("Enter the watermark text first.");
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText(text, { x: width * 0.1, y: height * 0.48, size: 34, font, color: rgb(0.42, 0.36, 0.65), opacity: 0.28, rotate: degrees(35) });
    });
  } else if (tool.id === "pagenum") {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.getPages().forEach((page, index) => {
      const { width } = page.getSize();
      page.drawText(`${index + 1}`, { x: width - 48, y: 20, size: 10, font, color: rgb(0.3, 0.31, 0.36) });
    });
  }
  setProgress(82);
  downloadBlob(new Blob([await pdf.save() as BlobPart], { type: "application/pdf" }), `${tool.id}.pdf`);
}

function App() {
  const [section, setSection] = useState<Section>("Overview");
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All tools");
  const [files, setFiles] = useState<File[]>([]);
  const [option, setOption] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [aiOpened, setAiOpened] = useState(false);
  const [activities, setActivities] = useState<{ name: string; detail: string; time: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleTools = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesQuery = !query || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query);
      return matchesQuery && (filter === "All tools" || tool.category === filter);
    });
  }, [search, filter]);

  function openTool(tool: Tool) {
    setActiveTool(tool);
    setFiles([]);
    setOption("");
    setProgress(0);
    setError("");
    setResult("");
  }

  function closeTool() {
    if (processing) return;
    setActiveTool(null);
    setFiles([]);
  }

  function addFiles(list: FileList | null) {
    if (!list || !activeTool) return;
    const selected = Array.from(list);
    const valid = selected.filter((file) => activeTool.accepts.split(",").some((ext) => file.name.toLowerCase().endsWith(ext)));
    if (!valid.length) {
      setError(`Choose a supported file type: ${activeTool.accepts.replace(/,/g, ", ")}.`);
      return;
    }
    if (!activeTool.multiple) setFiles(valid.slice(0, 1));
    else setFiles((current) => [...current, ...valid].slice(0, 30));
    setError("");
    setResult("");
  }

  async function processFiles() {
    if (!activeTool || !activeTool.supported) return;
    setProcessing(true);
    setError("");
    setResult("");
    setProgress(0);
    try {
      await runTool(activeTool, files, option, setProgress);
      setProgress(100);
      setResult("Your file is ready. The download has started.");
      setActivities((current) => [
        { name: files[0]?.name ?? activeTool.name, detail: `${activeTool.name} · ${files.length} file${files.length === 1 ? "" : "s"}`, time: "Just now" },
        ...current,
      ].slice(0, 5));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong while processing this file.");
    } finally {
      setProcessing(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  return (
    <div className={`app-shell${darkMode ? " dark" : ""}`}>
      {mobileNav && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar${mobileNav ? " sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">N<span>×</span></div>
          <div><strong>NEX <b>PDF</b></strong><small>by NEXORA</small></div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        <div className="workspace-picker">
          <div className="workspace-avatar">N</div>
          <div><strong>My workspace</strong><small>Free plan</small></div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ title, icon: Icon }) => (
            <button key={title} className={`nav-item${section === title ? " nav-active" : ""}`} onClick={() => { setSection(title); setMobileNav(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{title}</span>
              {title === "NEX AI Connect" && <span className="new-pill">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label nav-label-spaced">PREFERENCES</div>
        <nav className="main-nav" aria-label="Preferences">
          <button className={`nav-item${section === "Pricing" ? " nav-active" : ""}`} onClick={() => setSection("Pricing")}><Zap size={18} strokeWidth={1.8} /><span>Plans & pricing</span></button>
          <button className={`nav-item${section === "Settings" ? " nav-active" : ""}`} onClick={() => setSection("Settings")}><Settings2 size={18} strokeWidth={1.8} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={16} /></div>
            <strong>Do more with Pro</strong>
            <p>More tools for your everyday work.</p>
            <button onClick={() => setSection("Pricing")}>Explore plans <ArrowRight size={14} /></button>
          </div>
          <button className="profile-row" onClick={() => setSection("Settings")}>
            <div className="profile-avatar">JD</div>
            <div><strong>Jamie Doe</strong><small>Local preview account</small></div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{section}</strong></div>
          <div className="topbar-actions">
            <button className="theme-toggle icon-button" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="top-profile" onClick={() => setSection("Settings")}><span className="profile-avatar small-avatar">JD</span><ChevronDown size={14} /></button>
          </div>
        </header>

        <div className="page-content">
          {section === "Overview" && <Overview onSelect={setSection} onTool={openTool} onAI={() => setSection("NEX AI Connect")} activities={activities} search={search} setSearch={setSearch} />}
          {section === "All tools" && <ToolsPage tools={visibleTools} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onTool={openTool} />}
          {section === "File transfer" && <UnavailablePage kind="transfer" />}
          {section === "NEX MB Compressor" && <UnavailablePage kind="compressor" />}
          {section === "NEX AI Connect" && <AIPage aiOpened={aiOpened} onConnect={() => { window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer"); setAiOpened(true); }} />}
          {section === "Pricing" && <PricingPage />}
          {section === "Settings" && <SettingsPage />}
        </div>
      </main>

      {activeTool && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeTool(); }}>
          <section className="tool-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <button className="icon-button back-button" aria-label="Back to tools" onClick={closeTool}><ArrowLeft size={18} /></button>
              <div><span className="eyebrow">{activeTool.category}</span><h2 id="modal-title">{activeTool.name}</h2></div>
              <button className="icon-button modal-close" aria-label="Close" onClick={closeTool}><X size={19} /></button>
            </div>
            {activeTool.supported ? (
              <>
                <p className="modal-description">{activeTool.description} Files are processed locally in your browser and are not uploaded.</p>
                <div className={`drop-zone${files.length ? " has-files" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}>
                  <input ref={inputRef} type="file" accept={activeTool.accepts} multiple={activeTool.multiple} hidden onChange={(event: ChangeEvent<HTMLInputElement>) => addFiles(event.target.files)} />
                  <div className="drop-icon">{files.length ? <CheckCircle2 size={22} /> : <Upload size={21} />}</div>
                  <strong>{files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "Drop files here or browse"}</strong>
                  <span>{activeTool.accepts.replace(/,/g, ", ").toUpperCase()} · Processed on this device</span>
                </div>
                {files.length > 0 && <div className="selected-files">{files.map((file, index) => <div className="file-row" key={`${file.name}-${index}`}><div className="file-type-icon"><FileText size={17} /></div><div className="file-meta"><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button className="icon-button remove-file" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={16} /></button></div>)}</div>}
                {["delete", "extract", "organize"].includes(activeTool.id) && <label className="option-field"><span>{activeTool.id === "organize" ? "New page order" : "Page numbers"} <small>{activeTool.id === "delete" ? "(to remove)" : "(comma separated, e.g. 1, 3, 5)"}</small></span><input value={option} onChange={(event) => setOption(event.target.value)} placeholder={activeTool.id === "organize" ? "e.g. 3, 1, 2" : "e.g. 2, 4"} /></label>}
                {activeTool.id === "watermark" && <label className="option-field"><span>Watermark text</span><input value={option} onChange={(event) => setOption(event.target.value)} placeholder="e.g. CONFIDENTIAL" maxLength={80} /></label>}
                {error && <div className="inline-error" role="alert">{error}</div>}
                {result && <div className="inline-success" role="status"><CheckCircle2 size={17} />{result}</div>}
                {processing && <div className="progress-wrap"><div className="progress-info"><span>Processing securely on this device</span><strong>{progress}%</strong></div><div className="progress-track"><div style={{ width: `${progress}%` }} /></div></div>}
                <div className="modal-footer"><span><ShieldCheck size={15} /> Your files stay on your device</span><button className="primary-button" disabled={!files.length || processing} onClick={() => void processFiles()}>{processing ? "Processing..." : "Process file"} {!processing && <ArrowRight size={16} />}</button></div>
              </>
            ) : (
              <div className="service-notice">
                <div className="notice-icon"><Settings2 size={20} /></div>
                <h3>This tool needs a server service</h3>
                <p>It is not enabled in this browser-only preview. To avoid a misleading result, file processing is unavailable until a trusted conversion service is configured.</p>
                <button className="secondary-button" onClick={closeTool}>Back to tools</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Overview({ onSelect, onTool, onAI, activities, search, setSearch }: { onSelect: (section: Section) => void; onTool: (tool: Tool) => void; onAI: () => void; activities: { name: string; detail: string; time: string }[]; search: string; setSearch: (search: string) => void }) {
  const featured = ["merge", "compress", "jpgpdf", "split"].map((id) => tools.find((tool) => tool.id === id)!);
  return (
    <>
      <section className="welcome-row">
        <div><div className="welcome-kicker"><span className="status-dot" /> YOUR DOCUMENT WORKSPACE</div><h1>Everything You Need<br />to Work With Documents.</h1><p>Convert, compress, edit, organize and transfer your files with NEX PDF.</p></div>
        <div className="welcome-art" aria-hidden="true"><div className="art-glow" /><div className="art-paper paper-back"><span /><span /><span /></div><div className="art-paper paper-front"><div className="art-pdf">PDF</div><span /><span /><span /></div><div className="art-sparkle sparkle-one">✦</div><div className="art-sparkle sparkle-two">✦</div></div>
      </section>
      <section className="search-panel">
        <div className="home-search"><Search size={19} /><input value={search} placeholder="What would you like to do?" onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSelect("All tools"); }} /></div>
        <div className="search-suggestions"><span>Popular:</span>{["Merge PDF", "Compress PDF", "PDF to Word"].map((name) => <button key={name} onClick={() => { const tool = tools.find((candidate) => candidate.name === name); if (tool) onTool(tool); }}>{name}</button>)}</div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">QUICK ACCESS</span><h2>Popular tools</h2></div><button className="text-button" onClick={() => onSelect("All tools")}>See all tools <ArrowRight size={15} /></button></div>
        <div className="tool-grid featured-grid">{featured.map((tool) => <ToolCard key={tool.id} tool={tool} onClick={() => onTool(tool)} />)}</div>
      </section>
      <section className="insight-grid">
        <div className="panel activity-panel">
          <div className="panel-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h3>Recent activity</h3></div></div>
          <div className="activity-list">{activities.length ? activities.map((activity, index) => <div className="activity-row" key={`${activity.name}-${index}`}><div className={`activity-file activity-color-${index % 3}`}><FileText size={17} /></div><div className="activity-detail"><strong>{activity.name}</strong><span>{activity.detail}</span></div><time>{activity.time}</time></div>) : <div className="activity-empty"><Clock3 size={17} /><span>Your processed files will appear here.</span></div>}</div>
        </div>
        <div className="ai-promo">
          <div className="ai-promo-top"><div className="ai-mark"><Sparkles size={19} /></div><span className="new-pill">NEX AI</span></div>
          <span className="eyebrow">A LITTLE MORE FOCUS</span><h3>Your next big idea<br />starts with a question.</h3><p>Open ChatGPT securely on its official website. Your sign-in stays yours.</p>
          <button onClick={onAI}>Explore NEX AI <ArrowUpRight size={15} /></button>
          <div className="ai-orbit orbit-a" /><div className="ai-orbit orbit-b" />
        </div>
      </section>
      <div className="privacy-strip"><ShieldCheck size={16} /><span><strong>Privacy first.</strong> Files processed with available local tools stay in your browser.</span><button onClick={() => onSelect("Settings")}>Learn more <ArrowRight size={13} /></button></div>
    </>
  );
}

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const Icon = tool.icon;
  return <button className="tool-card" onClick={onClick}><div className={`tool-icon ${tool.accent}`}><Icon size={19} strokeWidth={1.8} /></div><div className="tool-card-copy"><strong>{tool.name}</strong><span>{tool.description}</span></div><ArrowUpRight className="tool-arrow" size={16} /></button>;
}

function ToolsPage({ tools: filtered, filter, setFilter, search, setSearch, onTool }: { tools: Tool[]; filter: string; setFilter: (filter: string) => void; search: string; setSearch: (search: string) => void; onTool: (tool: Tool) => void }) {
  const categories = ["All tools", ...Array.from(new Set(tools.map((tool) => tool.category)))];
  return <section className="tools-page">
    <div className="page-intro"><span className="eyebrow">YOUR TOOLKIT</span><h1>All tools</h1><p>Everything you need to get more from your documents.</p></div>
    <div className="tools-search"><Search size={18} /><input aria-label="Search tools" placeholder="Search a tool..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filtered.length} tools</span></div>
    <div className="category-pills">{categories.map((category) => <button key={category} className={filter === category ? "category-active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div>
    {filtered.length ? <div className="tool-grid">{filtered.map((tool) => <div className="tool-card-wrap" key={tool.id}><ToolCard tool={tool} onClick={() => onTool(tool)} />{!tool.supported && <span className="service-tag">Server required</span>}</div>)}</div> : <div className="empty-search"><Search size={24} /><strong>No matching tools</strong><span>Try another search or category.</span></div>}
    <div className="tools-note"><CircleHelp size={16} /><span>Tools marked “Server required” need a configured processing service and are not enabled in this preview.</span></div>
  </section>;
}

function UnavailablePage({ kind }: { kind: "transfer" | "compressor" }) {
  const transfer = kind === "transfer";
  return <section className="service-page">
    <div className="page-intro"><span className="eyebrow">{transfer ? "SEND WITH CONFIDENCE" : "NEX MB COMPRESSOR"}</span><h1>{transfer ? "File transfer" : "Compress more than documents."}</h1><p>{transfer ? "Share large files with a secure, private transfer." : "One place to make heavy files lighter."}</p></div>
    <div className="service-hero-card">
      <div className="service-hero-icon">{transfer ? <CloudUpload size={27} /> : <FileArchive size={27} />}</div>
      <span className="service-status"><span /> SERVICE NOT CONFIGURED</span>
      <h2>{transfer ? "Your files deserve a proper home." : "A powerful compressor needs a processing service."}</h2>
      <p>{transfer ? "Resumable uploads, private share links and download tracking need private object storage and a server. They are intentionally unavailable until those services are configured." : "Large-file compression needs dedicated, format-aware processing workers. This preview will not upload or alter your files."}</p>
      <div className="service-specs">
        <div><HardDrive size={17} /><span>{transfer ? "Up to 200 GB per transfer*" : "Up to 50 GB per file*"}</span></div>
        <div><ShieldCheck size={17} /><span>Private storage by design</span></div>
        <div><Clock3 size={17} /><span>{transfer ? "Resumable upload support" : "Streaming worker processing"}</span></div>
      </div>
      <a className="secondary-button" href="/README.md#production-implementation-still-required" target="_blank" rel="noreferrer"><CircleHelp size={16} /> Learn about setup</a>
      <small>*Limits are product targets and require server-side enforcement before the service is enabled.</small>
    </div>
    <div className="service-lower-grid"><div className="panel"><div className="lower-icon"><LockKeyhole size={18} /></div><h3>Private by default</h3><p>Files are not made public. Share links require expiring, access-controlled storage.</p></div><div className="panel"><div className="lower-icon orange"><Zap size={18} /></div><h3>Built for big files</h3><p>Chunked transfer and background processing are designed for reliable large-file work.</p></div></div>
  </section>;
}

function AIPage({ aiOpened, onConnect }: { aiOpened: boolean; onConnect: () => void }) {
  return <section className="ai-page">
    <div className="page-intro"><span className="eyebrow">YOUR AI, YOUR CHOICE</span><h1>NEX AI Connect</h1><p>Access ChatGPT directly, without bringing its sign-in into NEX PDF.</p></div>
    <div className="ai-connect-card">
      <div className="connect-visual"><div className="connect-orbit"><div className="connect-center"><Sparkles size={28} /></div><div className="connect-node node-one"><span>n</span></div><div className="connect-node node-two"><FileText size={16} /></div><div className="connect-node node-three"><span>✦</span></div></div></div>
      <div className="connect-content"><span className="eyebrow">OFFICIAL CHATGPT WEBSITE</span><h2>A direct link.<br />Nothing between you and ChatGPT.</h2><p>Continue on the official ChatGPT site and sign in there. NEX PDF never asks for or stores your ChatGPT password.</p><button className="primary-button" onClick={onConnect}>{aiOpened ? "Open ChatGPT again" : "Connect to ChatGPT"} <ArrowUpRight size={16} /></button><div className="external-note"><ShieldCheck size={15} /> Opens <strong>chatgpt.com</strong> in a new tab</div></div>
    </div>
    <div className="api-callout"><div className="api-callout-icon"><Settings2 size={19} /></div><div><strong>Need AI inside your workspace?</strong><p>An OpenAI API integration is separate from ChatGPT and requires an administrator-managed API key and separate billing.</p></div><span className="service-tag">Not configured</span></div>
    <div className="ai-safety-note"><LockKeyhole size={16} /><span><strong>Your accounts remain separate.</strong> Opening ChatGPT does not connect an API account or grant NEX PDF access to your ChatGPT data.</span></div>
  </section>;
}

function PricingPage() {
  return <section className="pricing-page"><div className="page-intro"><span className="eyebrow">SIMPLE, FLEXIBLE</span><h1>Plans that work for you.</h1><p>Choose what fits your document workflow. No hidden limits.</p></div><div className="pricing-grid"><div className="plan-card"><span className="eyebrow">START HERE</span><h2>Free</h2><p className="plan-price">$0 <small>/ forever</small></p><p className="plan-caption">For occasional document tasks.</p><div className="plan-divider" /><PlanFeature>Browser-based PDF tools</PlanFeature><PlanFeature>Files stay on your device</PlanFeature><PlanFeature>Basic processing tools</PlanFeature>  <div className="plan-status">Preview only</div></div><div className="plan-card pro-plan"><span className="pro-badge"><Sparkles size={13} /> COMING SOON</span><span className="eyebrow">MORE ROOM TO WORK</span><h2>Pro</h2><p className="plan-price">— <small>/ month</small></p><p className="plan-caption">For teams and frequent workflows.</p><div className="plan-divider" /><PlanFeature>Higher processing limits</PlanFeature><PlanFeature>Batch and advanced tools</PlanFeature><PlanFeature>Large file transfers</PlanFeature><button className="primary-button" disabled>Coming soon</button></div></div><p className="pricing-footnote"><ShieldCheck size={15} /> Plans, prices and usage limits need a configured account and billing backend before purchase.</p></section>;
}

function PlanFeature({ children }: { children: ReactNode }) { return <div className="plan-feature"><Check size={15} />{children}</div>; }

function SettingsPage() {
  return <section className="settings-page"><div className="page-intro"><span className="eyebrow">YOUR ACCOUNT</span><h1>Settings</h1><p>Manage your workspace preferences and connections.</p></div><div className="settings-card"><div className="settings-profile"><div className="profile-avatar large-avatar">JD</div><div><h2>Jamie Doe</h2><p>Local preview account · No sign-in configured</p></div><span className="service-tag">Preview</span></div><div className="settings-row"><div><strong>Account security</strong><span>Sign-in and session management require a secure authentication backend.</span></div><LockKeyhole size={18} /></div><div className="settings-row"><div><strong>Connected services</strong><span>ChatGPT opens on its official site. No API connection is active.</span></div><ArrowUpRight size={18} /></div><div className="settings-row"><div><strong>File privacy</strong><span>Supported file operations run in your browser. This preview does not store files.</span></div><ShieldCheck size={18} /></div></div><div className="settings-disclaimer"><CircleHelp size={17} /><span>Authentication, saved history and admin controls must be configured on a backend before this workspace can be used as a production account.</span></div></section>;
}

export default App;
