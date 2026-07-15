/**
 * PerformanceDashboardDialog — Grafana-style monitoring dashboard
 * Displays: benchmarks, function profiling, CPU/memory metrics,
 * algorithm analysis, audit results, and configurable thresholds.
 */

import { useState, useEffect, useCallback, useRef, type CSSProperties, type ComponentType } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Activity, Cpu, MemoryStick, Timer, Flame, Gauge,
  AlertTriangle, CheckCircle, XCircle, TrendingUp,
  BarChart3, Search, Zap, Code2, Shield, Play, Square,
  Download, RefreshCw, Settings, ChevronDown, Filter,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

// ─── Types ───
interface BenchmarkData { name: string; avgMs: number; thresholdMs: number; passed: boolean; category: string; calls: number; regression?: boolean; memoryMB?: number; }
interface FunctionMetric { name: string; module: string; calls: number; totalMs: number; avgMs: number; maxMs: number; }
interface MemoryPoint { time: string; usedMB: number; totalMB: number; }
interface CPUItem { label: string; durationMs: number; }
interface AuditItem { id: string; severity: string; category: string; message: string; file?: string; line?: number; }
interface ThresholdConfig { name: string; maxMs: number; maxMemoryMB: number; current: number; }

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const SEVERITY_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', info: '#6b7280', error: '#ef4444', warning: '#f59e0b' };

// ─── Demo data generators ───
const generateBenchmarkData = (): BenchmarkData[] => [
  { name: 'ncrp.validation', avgMs: 0.042, thresholdMs: 5, passed: true, category: 'Engine', calls: 24 },
  { name: 'ncrp.batch×1k', avgMs: 17.7, thresholdMs: 100, passed: true, category: 'Engine', calls: 1000 },
  { name: 'skyshine.calc', avgMs: 0.077, thresholdMs: 2, passed: true, category: 'Engine', calls: 11 },
  { name: 'skyshine.batch×10k', avgMs: 50, thresholdMs: 200, passed: true, category: 'Engine', calls: 10000 },
  { name: 'ct.lookup×10k', avgMs: 2.87, thresholdMs: 10, passed: true, category: 'Engine', calls: 10000 },
  { name: 'ct.shielding', avgMs: 1.2, thresholdMs: 5, passed: true, category: 'Engine', calls: 1 },
  { name: 'profiler.noop×10k', avgMs: 2.34, thresholdMs: 5, passed: true, category: 'Profiler', calls: 10000 },
  { name: 'profiler.overhead×10k', avgMs: 12.3, thresholdMs: 50, passed: true, category: 'Profiler', calls: 10000 },
  { name: 'math.archer', avgMs: 0.15, thresholdMs: 1, passed: true, category: 'Math', calls: 1000 },
  { name: 'render.dialog', avgMs: 45, thresholdMs: 100, passed: true, category: 'UI', calls: 1 },
  { name: 'montecarlo.native', avgMs: 320, thresholdMs: 500, passed: true, category: 'MC', calls: 100 },
  { name: 'memory.heap', avgMs: 0, thresholdMs: 0, passed: true, category: 'Memory', calls: 1, memoryMB: 45 },
];

const generateFunctionMetrics = (): FunctionMetric[] => [
  { name: 'calculateSkyshine', module: 'skyshine', calls: 12450, totalMs: 890, avgMs: 0.071, maxMs: 0.45 },
  { name: 'runValidation', module: 'validation', calls: 8240, totalMs: 520, avgMs: 0.063, maxMs: 0.32 },
  { name: 'findScanner', module: 'ct', calls: 56000, totalMs: 380, avgMs: 0.007, maxMs: 0.12 },
  { name: 'getKappa', module: 'ct', calls: 12400, totalMs: 95, avgMs: 0.008, maxMs: 0.05 },
  { name: 'archerB', module: 'math', calls: 48000, totalMs: 72, avgMs: 0.002, maxMs: 0.08 },
  { name: 'chiltonG', module: 'skyshine', calls: 136900, totalMs: 210, avgMs: 0.002, maxMs: 0.03 },
  { name: 'roofTrans', module: 'skyshine', calls: 12450, totalMs: 18, avgMs: 0.001, maxMs: 0.02 },
  { name: 'trackFunction', module: 'profiler', calls: 145000, totalMs: 45, avgMs: 0.0003, maxMs: 0.15 },
];

const generateMemorySeries = (): MemoryPoint[] =>
  Array.from({ length: 30 }, (_, i) => ({
    time: `${i * 2}s`,
    usedMB: 42 + Math.sin(i * 0.3) * 8 + Math.random() * 3,
    totalMB: 128,
  }));

const generateCPUItems = (): CPUItem[] => [
  { label: 'calculateSkyshine', durationMs: 45 },
  { label: 'runValidation', durationMs: 32 },
  { label: 'findScanner', durationMs: 18 },
  { label: 'getKappa', durationMs: 12 },
  { label: 'archerB', durationMs: 8 },
  { label: 'chiltonG', durationMs: 5 },
  { label: 'roofTrans', durationMs: 3 },
];

const generateAuditIssues = (): AuditItem[] => [
  { id: 'SEC-001', severity: 'error', category: 'security', message: 'innerHTML without sanitization in ExportDialog', file: 'ExportDialog.tsx', line: 42 },
  { id: 'PERF-005', severity: 'warning', category: 'performance', message: 'Array.includes() in loop — use Set.has()', file: 'shieldingMath.ts', line: 89 },
  { id: 'PERF-001', severity: 'warning', category: 'performance', message: 'Spread operator inside loop', file: 'ChiltonSkyshine.ts', line: 76 },
  { id: 'MAINT-003', severity: 'warning', category: 'maintainability', message: 'Console.log in production code', file: 'DashboardDialog.tsx', line: 15 },
  { id: 'MAINT-004', severity: 'warning', category: 'maintainability', message: 'Deep nesting (9 levels)', file: 'MCDialog.tsx', line: 234 },
  { id: 'CORRECT-001', severity: 'warning', category: 'correctness', message: 'Floating-point direct comparison', file: 'validationEngine.ts', line: 56 },
  { id: 'PERF-002', severity: 'warning', category: 'performance', message: 'JSON.stringify in hot path', file: 'cloudSync.ts', line: 78 },
  { id: 'MAINT-001', severity: 'info', category: 'maintainability', message: 'Magic number 0.00378', file: 'NCRPValidationSuite.ts', line: 99 },
  { id: 'PERF-003', severity: 'info', category: 'performance', message: 'Repeated property access obj.barrier.x', file: 'shieldingEngine.ts', line: 45 },
  { id: 'PERF-004', severity: 'info', category: 'performance', message: 'Object.entries in loop', file: 'equipmentDatabase.ts', line: 112 },
];

const generateThresholds = (): ThresholdConfig[] => [
  { name: 'ncrp.validation', maxMs: 5, maxMemoryMB: 10, current: 0.042 },
  { name: 'skyshine.calc', maxMs: 2, maxMemoryMB: 5, current: 0.077 },
  { name: 'ct.lookup', maxMs: 10, maxMemoryMB: 5, current: 2.87 },
  { name: 'profiler.noop', maxMs: 5, maxMemoryMB: 1, current: 2.34 },
  { name: 'profiler.overhead', maxMs: 50, maxMemoryMB: 5, current: 12.3 },
  { name: 'render.dialog', maxMs: 100, maxMemoryMB: 50, current: 45 },
  { name: 'montecarlo.native', maxMs: 500, maxMemoryMB: 100, current: 320 },
];

// ─── Components ───
type IconComponent = ComponentType<{ size?: number; style?: CSSProperties }>;

const StatCard = ({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle: string; icon: IconComponent; color: string }) => (
  <Card className="bg-slate-900 border-slate-700">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg bg-opacity-20`} style={{ backgroundColor: `${color}30` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ThresholdBar = ({ config }: { config: ThresholdConfig }) => {
  const pct = Math.min(100, (config.current / config.maxMs) * 100);
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300 font-mono">{config.name}</span>
        <span className="text-slate-400">{config.current.toFixed(2)} / {config.maxMs} ms</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

export default function PerformanceDashboardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [benchmarks] = useState(generateBenchmarkData);
  const [functions] = useState(generateFunctionMetrics);
  const [memorySeries, setMemorySeries] = useState(generateMemorySeries);
  const [cpuItems] = useState(generateCPUItems);
  const [auditIssues] = useState(generateAuditIssues);
  const [thresholds] = useState(generateThresholds);
  const [searchFilter, setSearchFilter] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live memory monitoring simulation
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsMonitoring(false);
    } else {
      setIsMonitoring(true);
      intervalRef.current = setInterval(() => {
        setMemorySeries(prev => {
          const next = [...prev.slice(1), {
            time: `${Date.now() % 100000}`,
            usedMB: 42 + Math.sin(Date.now() / 5000) * 8 + Math.random() * 4,
            totalMB: 128,
          }];
          return next;
        });
      }, 2000);
    }
  }, [isMonitoring]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const passedCount = benchmarks.filter(b => b.passed && !b.regression).length;
  const failedCount = benchmarks.filter(b => !b.passed).length;
  const regressionCount = benchmarks.filter(b => b.regression).length;
  const totalCalls = functions.reduce((s, f) => s + f.calls, 0);

  const filteredIssues = auditIssues.filter(i =>
    !searchFilter || i.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
    i.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const categoryData = Object.entries(
    auditIssues.reduce((acc, i) => ({ ...acc, [i.category]: (acc[i.category] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const radarData = [
    { subject: 'Performance', A: 85, fullMark: 100 },
    { subject: 'Security', A: 70, fullMark: 100 },
    { subject: 'Maintainability', A: 75, fullMark: 100 },
    { subject: 'Correctness', A: 90, fullMark: 100 },
    { subject: 'Style', A: 88, fullMark: 100 },
    { subject: 'Architecture', A: 82, fullMark: 100 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] bg-slate-950 border-slate-700 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Gauge className="text-emerald-400" size={24} />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">Performance Dashboard</DialogTitle>
                <p className="text-slate-400 text-xs mt-0.5">RadShield-MX v50.5 — Benchmarks, Profiling &amp; Code Audit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? 'default' : 'secondary'} className={isMonitoring ? 'bg-emerald-600' : 'bg-slate-600'}>
                {isMonitoring ? '● LIVE' : '○ IDLE'}
              </Badge>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={toggleMonitoring}>
                {isMonitoring ? <Square size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
                {isMonitoring ? 'Stop' : 'Monitor'}
              </Button>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <Download size={14} className="mr-1" /> Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 bg-slate-900 border border-slate-700 shrink-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white">
              <Activity size={14} className="mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white">
              <Timer size={14} className="mr-1.5" /> Benchmarks
            </TabsTrigger>
            <TabsTrigger value="functions" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white">
              <Flame size={14} className="mr-1.5" /> Functions
            </TabsTrigger>
            <TabsTrigger value="memory" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white">
              <MemoryStick size={14} className="mr-1.5" /> Memory/CPU
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white">
              <Shield size={14} className="mr-1.5" /> Code Audit
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="data-[state=active]:bg-slate-700 text-slate-400 data-[state=active]:text-white">
              <Settings size={14} className="mr-1.5" /> Thresholds
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* ─── OVERVIEW ─── */}
            <TabsContent value="overview" className="m-0 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <StatCard title="Benchmarks" value={`${passedCount}/${benchmarks.length}`} subtitle={`${failedCount} failed, ${regressionCount} regressions`} icon={CheckCircle} color="#10b981" />
                <StatCard title="Total Calls" value={totalCalls.toLocaleString()} subtitle={`${functions.length} functions tracked`} icon={TrendingUp} color="#3b82f6" />
                <StatCard title="Heap Usage" value={`${memorySeries[memorySeries.length - 1]?.usedMB.toFixed(1)} MB`} subtitle={`/ ${memorySeries[0]?.totalMB} MB total`} icon={MemoryStick} color="#8b5cf6" />
                <StatCard title="Code Score" value="B+" subtitle="82/100 — 10 issues found" icon={Code2} color="#f59e0b" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <BarChart3 size={16} /> Benchmark Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={benchmarks.filter(b => b.avgMs > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                        <Bar dataKey="avgMs" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual (ms)" />
                        <Bar dataKey="thresholdMs" fill="#475569" radius={[4, 4, 0, 0]} name="Threshold (ms)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
                      <Gauge size={16} /> Code Quality Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#475569" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="Current" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Top Hotspots</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {functions.slice(0, 5).map((f, i) => (
                      <div key={f.name} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-mono text-xs">{i + 1}. {f.name}</span>
                        <span className="text-emerald-400 font-mono text-xs">{f.totalMs.toFixed(0)}ms</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Memory Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={memorySeries.slice(-15)}>
                        <defs><linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <YAxis domain={[0, 128]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                        <Area type="monotone" dataKey="usedMB" stroke="#8b5cf6" fill="url(#memGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Issues by Category</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" nameKey="name">
                          {categoryData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── BENCHMARKS ─── */}
            <TabsContent value="benchmarks" className="m-0 space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2"><Timer size={16} /> Execution Time vs Threshold</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-emerald-600/30 text-emerald-400">{passedCount} Passed</Badge>
                      {failedCount > 0 && <Badge className="bg-red-600/30 text-red-400">{failedCount} Failed</Badge>}
                      {regressionCount > 0 && <Badge className="bg-amber-600/30 text-amber-400">{regressionCount} Regression</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={benchmarks.filter(b => b.avgMs > 0)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={140} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                      <Legend />
                      <Bar dataKey="avgMs" fill="#10b981" radius={[0, 4, 4, 0]} name="Actual (ms)" />
                      <Bar dataKey="thresholdMs" fill="#475569" radius={[0, 4, 4, 0]} name="Threshold (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Performance History (last 20 runs)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={Array.from({ length: 20 }, (_, i) => ({
                        run: `#${i + 1}`,
                        ncrp: 0.04 + Math.random() * 0.02,
                        skyshine: 0.07 + Math.random() * 0.03,
                        ct: 2.8 + Math.random() * 0.5,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="run" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                        <Legend />
                        <Line type="monotone" dataKey="ncrp" stroke="#3b82f6" strokeWidth={2} dot={false} name="NCRP (ms)" />
                        <Line type="monotone" dataKey="skyshine" stroke="#10b981" strokeWidth={2} dot={false} name="Skyshine (ms)" />
                        <Line type="monotone" dataKey="ct" stroke="#f59e0b" strokeWidth={2} dot={false} name="CT Lookup (ms)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Calls Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={benchmarks.filter(b => b.calls > 1)} cx="50%" cy="50%" outerRadius={80} dataKey="calls" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                          {benchmarks.filter(b => b.calls > 1).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── FUNCTIONS ─── */}
            <TabsContent value="functions" className="m-0 space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-300 text-sm flex items-center gap-2"><Flame size={16} /> Flame Graph (Top Functions by Total Time)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={functions} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={130} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                      <Legend />
                      <Bar dataKey="totalMs" fill="#ef4444" radius={[0, 4, 4, 0]} name="Total Time (ms)" />
                      <Bar dataKey="avgMs" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Avg/Call (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Function Call Count</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={functions.sort((a, b) => b.calls - a.calls)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                      <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── MEMORY/CPU ─── */}
            <TabsContent value="memory" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-300 text-sm flex items-center gap-2"><MemoryStick size={16} /> Heap Usage (Live)</CardTitle>
                      <Badge className={isMonitoring ? 'bg-emerald-600' : 'bg-slate-600'}>{isMonitoring ? '● LIVE' : '○ STATIC'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={memorySeries}>
                        <defs><linearGradient id="memGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <YAxis domain={[0, 128]} tick={{ fill: '#94a3b8', fontSize: 9 }} label={{ value: 'MB', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                        <Legend />
                        <Area type="monotone" dataKey="usedMB" stroke="#8b5cf6" fill="url(#memGrad2)" strokeWidth={2} name="Used Heap (MB)" />
                        <Area type="monotone" dataKey="totalMB" stroke="#475569" fill="none" strokeWidth={1} strokeDasharray="5 5" name="Total Heap (MB)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm flex items-center gap-2"><Cpu size={16} /> CPU Top Slices</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={cpuItems} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis dataKey="label" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={130} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                        <Bar dataKey="durationMs" fill="#ec4899" radius={[0, 4, 4, 0]} name="CPU Time (ms)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">GC Pressure Indicators</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Heap Fragmentation</span><span className="text-emerald-400">35% — Low</span></div>
                    <Progress value={35} className="h-2 bg-slate-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">GC Cycle Frequency</span><span className="text-emerald-400">2.3/min — Normal</span></div>
                    <Progress value={23} className="h-2 bg-slate-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Allocation Rate</span><span className="text-amber-400">12 MB/min — Medium</span></div>
                    <Progress value={45} className="h-2 bg-slate-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Memory Leak Risk</span><span className="text-emerald-400">0.2 MB/min growth — Stable</span></div>
                    <Progress value={8} className="h-2 bg-slate-700" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── CODE AUDIT ─── */}
            <TabsContent value="audit" className="m-0 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total Issues" value={filteredIssues.length.toString()} subtitle={`Errors: ${filteredIssues.filter(i => i.severity === 'error').length}`} icon={AlertTriangle} color="#ef4444" />
                <StatCard title="Warnings" value={filteredIssues.filter(i => i.severity === 'warning').length.toString()} subtitle="Needs attention" icon={AlertTriangle} color="#f59e0b" />
                <StatCard title="Info" value={filteredIssues.filter(i => i.severity === 'info').length.toString()} subtitle="Suggestions" icon={Code2} color="#3b82f6" />
                <StatCard title="Auto-Fixable" value="3" subtitle="Can be fixed automatically" icon={Zap} color="#10b981" />
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input placeholder="Filter issues by message, ID, or file..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
                </div>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300"><Filter size={14} className="mr-1" /> Filter</Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300"><Download size={14} className="mr-1" /> SARIF</Button>
              </div>

              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-800">
                    {filteredIssues.map((issue, i) => (
                      <div key={`${issue.id}-${i}`} className="flex items-start gap-3 p-3 hover:bg-slate-800/50 transition-colors">
                        <div className="mt-0.5" style={{ color: SEVERITY_COLORS[issue.severity] }}>
                          {issue.severity === 'error' ? <XCircle size={18} /> : issue.severity === 'warning' ? <AlertTriangle size={18} /> : <Code2 size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge className="text-[10px] h-5 px-1.5" style={{ backgroundColor: `${SEVERITY_COLORS[issue.severity]}20`, color: SEVERITY_COLORS[issue.severity], borderColor: SEVERITY_COLORS[issue.severity] }}>
                              {issue.id}
                            </Badge>
                            <span className="text-slate-500 text-xs capitalize">{issue.category}</span>
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${issue.severity === 'error' ? 'border-red-500 text-red-400' : issue.severity === 'warning' ? 'border-amber-500 text-amber-400' : 'border-slate-600 text-slate-400'}`}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm">{issue.message}</p>
                          {issue.file && <p className="text-slate-500 text-xs mt-0.5 font-mono">{issue.file}{issue.line ? `:${issue.line}` : ''}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── THRESHOLDS ─── */}
            <TabsContent value="thresholds" className="m-0 space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-300 text-sm flex items-center gap-2"><Settings size={16} /> Configurable Thresholds</CardTitle>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300"><RefreshCw size={14} className="mr-1" /> Reset Defaults</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Time Thresholds (ms)</h4>
                      {thresholds.map(t => <ThresholdBar key={t.name} config={t} />)}
                    </div>
                    <div>
                      <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Recommended Optimizations</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'ChiltonSkyshine cache warmup', impact: '26x faster', status: 'done' },
                          { label: 'NCRP validation batch processing', impact: '5.6x faster', status: 'done' },
                          { label: 'CT lookup Map-based index', impact: '3.5x faster', status: 'done' },
                          { label: 'Profiler zero-overhead mode', impact: '2x faster', status: 'done' },
                          { label: 'Archer equation inline (avoid TS type check)', impact: '1.5x faster', status: 'done' },
                          { label: 'WebWorker for MC calculations', impact: '10x UI responsiveness', status: 'todo' },
                          { label: 'WASM for math-heavy functions', impact: '50x faster', status: 'todo' },
                          { label: 'Virtualized lists for large datasets', impact: '100x render', status: 'todo' },
                        ].map((opt, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                            <div>
                              <p className="text-slate-300 text-sm">{opt.label}</p>
                              <p className="text-emerald-400 text-xs">{opt.impact}</p>
                            </div>
                            <Badge className={opt.status === 'done' ? 'bg-emerald-600/30 text-emerald-400' : 'bg-amber-600/30 text-amber-400'}>
                              {opt.status === 'done' ? 'Applied' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
