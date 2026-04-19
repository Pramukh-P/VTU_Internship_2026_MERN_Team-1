import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { toast } from "sonner";
import {
  MapPin, Building2, Eye, Heart, ArrowLeft, ExternalLink,
  ChevronRight, Loader2, LayoutGrid, Check, ShieldCheck,
  FileText, ChevronLeft, AlertCircle, Navigation,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const parseJwt = (token) => {
  try { const p = token.split(".")[1]; return p ? JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/"))) : null; }
  catch { return null; }
};
const formatPrice = (p) => {
  if (!p && p !== 0) return "—";
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
  return `₹${Number(p).toLocaleString("en-IN")}`;
};

// ── Extract lat/lng from Google Maps URL ──────────────────────────────────────
function extractLatLng(url) {
  if (!url) return null;

  // Try !3dLAT!4dLNG first (more accurate)
  let match = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (match) {
    return { lat: match[1], lng: match[2] };
  }

  // fallback to @lat,lng
  match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { lat: match[1], lng: match[2] };
  }

  return null;
}

function LocationMapWidget({ locationLink, projectName }) {
  const coords = extractLatLng(locationLink);

  if (!coords) {
    return (
      <div className="p-4 text-red-500 text-sm">
        Invalid Google Maps link
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`;

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-sm font-semibold">Location Map</span>

        <a
          href={locationLink}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary"
        >
          Open in Google Maps
        </a>
      </div>

      {/* Map */}
      <div className="h-[300px]">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ── Slideshow ─────────────────────────────────────────────────────────────────
function ProjectSlideshow({ sketchImage, projectImages, companyName }) {
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const toUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BASE}${url}`;
  };
  const allImages = [
    ...(sketchImage ? [{ url: toUrl(sketchImage.url), label: "Layout" }] : []),
    ...(projectImages || []).map(i => ({ url: toUrl(i.url), label: "Photo" })),
  ];
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);
  const start = useCallback(() => {
    if (allImages.length <= 1) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % allImages.length), 4000);
  }, [allImages.length]);
  useEffect(() => { start(); return () => clearInterval(timer.current); }, [start]);

  if (!allImages.length) {
    const initials = companyName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "SP";
    return (
      <div className="w-full h-80 rounded-2xl flex flex-col items-center justify-center border"
        style={{ background: "color-mix(in srgb, var(--primary) 10%, var(--muted))", borderColor: "var(--border)" }}>
        <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-2xl font-bold mb-3"
          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>{initials}</div>
        <span className="text-sm text-muted-foreground">{companyName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden h-80 bg-muted group">
        {allImages.map((img, i) => (
          <img key={i} src={img.url} alt={img.label}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3">
          <span className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm">
            {allImages[idx]?.label}
          </span>
        </div>
        {allImages.length > 1 && (
          <>
            <button onClick={() => { clearInterval(timer.current); setIdx(i => (i - 1 + allImages.length) % allImages.length); start(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button onClick={() => { clearInterval(timer.current); setIdx(i => (i + 1) % allImages.length); start(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button key={i} onClick={() => { clearInterval(timer.current); setIdx(i); start(); }}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trust badges section ──────────────────────────────────────────────────────
function TrustSection({ project }) {
  const docs = project.projectDocuments || [];
  const hasDoc = (key) => docs.some(d => d.docType === key);
  const badges = [
    { key: "reraCertificate", label: "RERA Verified", doc: hasDoc("reraCertificate") },
    { key: "landTitle", label: "Land Title Deed", doc: hasDoc("landTitle") },
    { key: "dcConversion", label: "DC Conversion", doc: hasDoc("dcConversion") },
    { key: "encumbranceCertificate", label: "EC Certificate", doc: hasDoc("encumbranceCertificate") },
    { key: "kathaType", label: `Katha ${project.kathaType || "—"}`, doc: !!project.kathaType },
  ];
  const verifiedCount = badges.filter(b => b.doc).length;
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" /> Legal Compliance
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
          {verifiedCount}/{badges.length} Verified
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map(b => (
          <span key={b.key} className={`trust-badge ${b.doc ? "" : "trust-badge-pending"}`}>
            {b.doc ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {b.label}
          </span>
        ))}
      </div>
      {verifiedCount === badges.length && (
        <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          All compliance documents verified — this project meets RERA and legal standards.
        </p>
      )}
    </div>
  );
}

// ── Plot card ─────────────────────────────────────────────────────────────────
const STATUS_STYLES = { available: "status-available", blocked: "status-blocked", sold: "status-sold" };

function PlotCard({ plot, projectId, isLoggedIn }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (!isLoggedIn) { toast.info("Login to view plot details"); navigate("/login"); return; }
    navigate(`/projects/${projectId}/plots/${plot._id}`);
  };
  return (
    <div onClick={handleClick} className="card-sp cursor-pointer p-4 space-y-3 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{plot.plotNumber}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{plot.facing} Facing</p>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[plot.status]}`}>
          {plot.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
        <span>Size: <span className="text-foreground font-medium">{plot.sizeSqft} sq.ft</span></span>
        <span>Road: <span className="text-foreground font-medium">{plot.roadWidth}</span></span>
        {plot.dimensions && <span className="col-span-2">Dim: <span className="text-foreground font-medium">{plot.dimensions}</span></span>}
        {plot.cornerPlot && <span className="text-primary font-semibold col-span-2">✦ Corner Plot</span>}
      </div>
      <div className="flex items-center justify-between pt-1">
        <p className="font-bold text-foreground">{formatPrice(plot.price)}</p>
        <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5 transition-all" style={{ color: "var(--primary)" }}>
          Details <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const payload = parseJwt(token);
  const isLoggedIn = !!token;
  const isInvestor = payload?.role === "investor";

  const [project, setProject] = useState(null);
  const [plots, setPlots] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api.get(`/api/public/projects/${projectId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { setProject(r.data.project); setPlots(r.data.plots || []); setIsSaved(r.data.isSaved || false); })
      .catch(() => { toast.error("Project not found"); navigate("/"); })
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const handleToggleInterest = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    if (!isInvestor) { toast.info("Only investors can save projects"); return; }
    setIsSaving(true);
    try {
      const r = await api.post(`/api/interests/${projectId}/toggle`);
      setIsSaved(r.data.saved);
      toast.success(r.data.message);
      setProject(p => ({ ...p, interestCount: p.interestCount + (r.data.saved ? 1 : -1) }));
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setIsSaving(false); }
  };

  const filteredPlots = statusFilter === "all" ? plots : plots.filter(p => p.status === statusFilter);
  const plotStats = {
    total: plots.length,
    available: plots.filter(p => p.status === "available").length,
    blocked: plots.filter(p => p.status === "blocked").length,
    sold: plots.filter(p => p.status === "sold").length,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--primary)" }} />
    </div>
  );
  if (!project) return null;

  const priceList = plots.map(p => p.price).filter(Boolean);
  const minPrice = priceList.length ? Math.min(...priceList) : null;
  const maxPrice = priceList.length ? Math.max(...priceList) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
        <span>/</span>
        <button onClick={() => navigate("/projects")} className="hover:text-foreground transition-colors">Projects</button>
        <span>/</span>
        <span className="text-foreground font-medium">{project.projectName}</span>
      </div>

      {/* Top section */}
      <div className="grid lg:grid-cols-2 gap-8">
        <ProjectSlideshow
          sketchImage={project.sketchImage}
          projectImages={project.projectImages}
          companyName={project.builderId?.companyName}
        />

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
                ● Active
              </span>
              {project.amenities?.slice(0, 2).map(a => (
                <span key={a} className="text-[10px] px-2.5 py-1 rounded-full"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{a}</span>
              ))}
            </div>
            <h1 className="display-font font-bold text-foreground leading-tight"
              style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)" }}>
              {project.projectName}
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" />{project.builderId?.companyName}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{project.location}</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>

          {minPrice !== null && (
            <div className="rounded-xl p-4 space-y-1"
              style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price Range</p>
              <p className="display-font text-2xl font-bold text-foreground">
                {formatPrice(minPrice)}
                {maxPrice !== minPrice && <span className="text-muted-foreground font-normal text-lg"> – {formatPrice(maxPrice)}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{plotStats.total} plots · {plotStats.available} available</p>
            </div>
          )}

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{project.viewCount} views</span>
            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{project.interestCount} interested</span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleToggleInterest} disabled={isSaving || !isLoggedIn}
              variant={isSaved ? "default" : "outline"} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isSaved
                ? <><Check className="h-4 w-4" /> Saved</>
                : <><Heart className="h-4 w-4" /> Save Project</>}
            </Button>
            {project.locationLink && (
              <Button variant="outline" asChild className="gap-2">
                <a href={project.locationLink} target="_blank" rel="noreferrer">
                  <MapPin className="h-4 w-4" /> Google Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            {!isLoggedIn && (
              <Link to="/login"><Button variant="outline" className="gap-2">Login to interact</Button></Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Embedded Map Widget ── */}
      {project.locationLink && (
        <LocationMapWidget locationLink={project.locationLink} projectName={project.projectName} />
      )}

      {/* Trust section */}
      <TrustSection project={project} />

      {/* Amenities */}
      {project.amenities?.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {project.amenities.map(a => (
              <div key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plot inventory */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="display-font text-2xl font-bold text-foreground flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" /> Plot Inventory
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {plotStats.available} available · {plotStats.blocked} blocked · {plotStats.sold} sold
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all", "available", "blocked", "sold"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${statusFilter === s
                  ? "text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"}`}
                style={statusFilter === s ? { background: "var(--primary)" } : {}}>
                {s === "all" ? `All (${plotStats.total})` : `${s} (${plotStats[s]})`}
              </button>
            ))}
          </div>
        </div>

        {filteredPlots.length === 0
          ? <p className="text-sm text-muted-foreground py-8 text-center">No plots with this status.</p>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlots.map(p => <PlotCard key={p._id} plot={p} projectId={projectId} isLoggedIn={isLoggedIn} />)}
          </div>}
      </div>

      {/* Builder info */}
      <div className="section-divider" />
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">About the Builder</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
            {project.builderId?.companyName?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{project.builderId?.companyName}</p>
            <p className="text-xs text-muted-foreground">{project.builderId?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
