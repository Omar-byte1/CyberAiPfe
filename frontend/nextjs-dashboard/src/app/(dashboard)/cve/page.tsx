"use client";
import { useMemo, useState } from "react";
import rawCveData from "../../../../../../data/cve_sample.json";
import {
  ExternalLink,
  Search,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
export default function CVEDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [expandedCVE, setExpandedCVE] = useState<string | null>(
    null,
  ); /* Handle both NIST structure (vulnerabilities array) and flat array */
  const cveList = useMemo(() => {
    if (Array.isArray(rawCveData)) return rawCveData;
    if (rawCveData && (rawCveData as any).vulnerabilities) {
      return (rawCveData as any).vulnerabilities.map((v: any) => v.cve);
    }
    return [];
  }, []);
  const filteredCves = useMemo(() => {
    return cveList
      .filter((cve: any) => {
        const basicScore =
          cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ||
          cve?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ||
          cve?.score ||
          0;
        const cveId = (cve?.id || cve?.cve_id || "").toLowerCase();
        const desc = (
          cve?.descriptions?.[0]?.value ||
          cve?.description ||
          ""
        ).toLowerCase();
        const termLower = searchTerm.toLowerCase();
        const matchesSearch =
          cveId.includes(termLower) || desc.includes(termLower);
        let matchesSeverity = true;
        if (severityFilter === "CRITICAL") matchesSeverity = basicScore >= 9.0;
        else if (severityFilter === "HIGH")
          matchesSeverity = basicScore >= 7.0 && basicScore < 9.0;
        else if (severityFilter === "MEDIUM")
          matchesSeverity = basicScore >= 4.0 && basicScore < 7.0;
        return matchesSearch && matchesSeverity;
      })
      .sort((a: any, b: any) => {
        const scoreA =
          a?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ||
          a?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ||
          a?.score ||
          0;
        const scoreB =
          b?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ||
          b?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ||
          b?.score ||
          0;
        return scoreB - scoreA;
      });
  }, [cveList, searchTerm, severityFilter]);
  const getScoreBadge = (score: number) => {
    if (score >= 9.0)
      return "bg-rose-500/10 border border-rose-500/30 text-rose-400 ";
    if (score >= 7.0)
      return "bg-orange-500/10 border border-orange-500/30 text-orange-400 ";
    if (score >= 4.0)
      return "bg-amber-500/10 border border-amber-500/30 text-amber-400";
    return "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
  };
  const getSeverityLabel = (score: number) => {
    if (score >= 9.0) return "CRITIQUE";
    if (score >= 7.0) return "ÉLEVÉ";
    if (score >= 4.0) return "MODÉRÉ";
    return "FAIBLE";
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">
      {" "}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        {" "}
        <div>
          {" "}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight mb-2">
            {" "}
            Base <span className="text-rose-400">CVE</span>{" "}
          </h1>{" "}
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-2">
            {" "}
            <Flame className="w-4 h-4 text-rose-500" /> Vulnerabilities &
            Exposures Reference{" "}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-wrap gap-4 items-center relative overflow-hidden shadow-sm">
          {" "}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 pointer-events-none" />{" "}
          <div className="relative group z-10 w-64">
            {" "}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-rose-400 transition-colors" />{" "}
            <input
              type="text"
              placeholder="Rechercher CVE-2024..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl text-xs font-medium focus:border-green-500 outline-none transition-all placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />{" "}
          </div>{" "}
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest outline-none z-10 cursor-pointer focus:border-green-500 transition-all custom-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            {" "}
            <option value="ALL" className="bg-white text-gray-600">
              TOUTES CATÉGORIES
            </option>{" "}
            <option value="CRITICAL" className="bg-white text-gray-600">
              CRITIQUE (9.0+)
            </option>{" "}
            <option value="HIGH" className="bg-white text-gray-600">
              ÉLEVÉ (7.0 - 8.9)
            </option>{" "}
            <option value="MEDIUM" className="bg-white text-gray-600">
              MODÉRÉ (4.0 - 6.9)
            </option>{" "}
          </select>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 relative overflow-hidden min-h-[500px]">
        {" "}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-500/5 pointer-events-none" />{" "}
        <div className="p-6 border-b border-gray-200 relative z-10">
          {" "}
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
            {" "}
            {filteredCves.length} vulnérabilité(s) trouvée(s){" "}
          </p>{" "}
        </div>{" "}
        <div className="divide-y divide-white/[0.03] relative z-10 max-h-[700px] overflow-y-auto custom-scrollbar">
          {" "}
          {filteredCves.length === 0 ? (
            <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
              Aucune correspondance trouvée.
            </div>
          ) : (
            filteredCves.map((cve: any, index: number) => {
              const cvssData =
                cve?.metrics?.cvssMetricV31?.[0]?.cvssData ||
                cve?.metrics?.cvssMetricV2?.[0]?.cvssData;
              const baseScore = cvssData?.baseScore || cve?.score || 0;
              const cveId = cve?.id || cve?.cve_id || `CVE-UNKNOWN-${index}`;
              const description =
                cve?.descriptions?.find((d: any) => d.lang === "en")?.value ||
                cve?.description ||
                "No description available.";
              const isExpanded = expandedCVE === cveId;
              return (
                <div key={cveId} className="transition-all hover:bg-gray-50">
                  {" "}
                  <div
                    onClick={() => setExpandedCVE(isExpanded ? null : cveId)}
                    className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer gap-4 group"
                  >
                    {" "}
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      {" "}
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-rose-500/30 transition-colors">
                        {" "}
                        <ShieldAlert
                          className={`w-4 h-4 ${baseScore >= 9.0 ? "text-rose-400" : baseScore >= 7.0 ? "text-orange-400" : "text-emerald-400"}`}
                        />{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <h3 className="text-lg font-black text-gray-900 group-hover:text-red-600 transition-colors flex items-center gap-2 tracking-tight">
                          {" "}
                          {cveId}{" "}
                        </h3>{" "}
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
                          {" "}
                          {cvssData?.version
                            ? `CVSS ${cvssData.version}`
                            : "GLOBAL SCORE"}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-6 shrink-0">
                      {" "}
                      <div className="flex flex-col items-end">
                        {" "}
                        <div
                          className={`px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 ${getScoreBadge(baseScore)}`}
                        >
                          {" "}
                          <span>{baseScore.toFixed(1)}</span>{" "}
                          <span className="text-[9px] uppercase tracking-widest opacity-80 border-l border-current pl-2">
                            {getSeverityLabel(baseScore)}
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-gray-50 group-hover:text-gray-900 transition-all">
                        {" "}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {isExpanded && (
                    <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                      {" "}
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 mb-6">
                        {" "}
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-rose-500/70">
                          {" "}
                          <FileText className="w-3.5 h-3.5" />{" "}
                          <span>Détails Techniques</span>{" "}
                        </div>{" "}
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                          {" "}
                          {description}{" "}
                        </p>{" "}
                      </div>{" "}
                      {cvssData && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {" "}
                          <MetricCard
                            label="Vector"
                            value={cvssData.vectorString}
                          />{" "}
                          <MetricCard
                            label="Attack Vector"
                            value={
                              cvssData.attackVector || cvssData.accessVector
                            }
                          />{" "}
                          <MetricCard
                            label="Complexity"
                            value={
                              cvssData.attackComplexity ||
                              cvssData.accessComplexity
                            }
                          />{" "}
                          <MetricCard
                            label="Privileges"
                            value={
                              cvssData.privilegesRequired ||
                              cvssData.authentication
                            }
                          />{" "}
                        </div>
                      )}{" "}
                      {/* References Section */}{" "}
                      {cve.references && cve.references.length > 0 && (
                        <div className="mb-8">
                          {" "}
                          <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-rose-500/70">
                            {" "}
                            <LinkIcon className="w-3.5 h-3.5" />{" "}
                            <span>Références NIST & Sécurité</span>{" "}
                          </div>{" "}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {" "}
                            {cve.references
                              .slice(0, 6)
                              .map((ref: any, i: number) => (
                                <a
                                  key={i}
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-rose-500/30 transition-all group/ref"
                                >
                                  {" "}
                                  <span className="text-[10px] font-bold text-gray-500 group-hover/ref:text-gray-600 truncate max-w-[90%]">
                                    {ref.url}
                                  </span>{" "}
                                  <ExternalLink className="w-3 h-3 text-gray-600 group-hover/ref:text-rose-400 shrink-0" />{" "}
                                </a>
                              ))}{" "}
                          </div>{" "}
                        </div>
                      )}{" "}
                      <div className="flex justify-end border-t border-gray-200 pt-6">
                        {" "}
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all shadow-sm"
                        >
                          {" "}
                          Consulter la source officielle{" "}
                          <ExternalLink className="w-3 h-3" />{" "}
                        </a>{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                </div>
              );
            })
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
function MetricCard({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 ">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </p>
      <p
        className="text-xs font-bold text-gray-600 truncate max-w-full"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
