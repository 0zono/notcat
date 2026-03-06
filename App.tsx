
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AlertTriangle, 
  Map as MapIcon, 
  Search, 
  CheckCircle, 
  TrendingDown,
  LayoutDashboard,
  FileText,
  Loader2,
  Menu,
  Droplets,
  Upload,
  Info,
  DollarSign,
  Filter,
  HardHat,
  XCircle,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Globe2,
  Zap,
  Layers,
  Settings,
  List,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Building2,
  Landmark,
  Plus,
  Scan,
  Satellite,
  Activity,
  Lock,
  MousePointer2,
  Database,
  FileSpreadsheet,
  UploadCloud,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { fetchResidentialData } from './services/osmService';
import { analyzeIrregularities } from './services/geminiService';
import { Building, ConsumerUnit, InspectionAlert, AuditReport, Territory, ArtesianWell, Branch, ServiceArea } from './types';

// --- Helpers for Mock Data ---
const FIRST_NAMES = ["Carlos", "Ana", "João", "Maria", "Pedro", "Lucia", "Paulo", "Fernanda", "Rafael", "Juliana", "Marcos", "Beatriz", "Lucas", "Mariana", "Gabriel", "Camila", "Mateus", "Larissa", "Gustavo", "Amanda", "Roberto", "Cláudia", "Ricardo", "Patrícia"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Nunes", "Moreira", "Cardoso", "Teixeira"];

const generateBrazillianName = () => {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
};

const generateRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

// --- Custom Icon Definitions ---
const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const corporateIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #1e293b; border: 2px solid white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V21"/><path d="M14 7h1"/><path d="M8 7h1"/><path d="M14 11h1"/><path d="M8 11h1"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const redIcon = createIcon('red');     // Fraud/Alert
const orangeIcon = createIcon('orange'); // Investigating
const blueIcon = createIcon('blue'); // Well

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

// Optimization: Component to track map bounds for virtualization using useMapEvents hook
const MapBoundsHandler = ({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) => {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });

  // Initial bounds update on mount
  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
};

// --- LANDING PAGE COMPONENT ---
const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-y-auto font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Radial Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Droplets size={24} className="text-white" />
             </div>
             <span className="text-xl font-bold tracking-tight text-white">NotCat<span className="text-cyan-400">.sys</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Plataforma</a>
            <a href="#solution" className="hover:text-white transition-colors">Tecnologia</a>
            <a href="#cases" className="hover:text-white transition-colors">Resultados</a>
          </div>
          <div className="flex gap-4">
             <button className="text-slate-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">Login Corporativo</button>
             <button 
               onClick={onEnter}
               className="bg-white text-slate-950 px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:bg-cyan-50 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 group"
             >
               Acessar Sistema <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md animate-fade-in shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Operação Ativa em Cuiabá
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-tight text-white">
            Inteligência contra<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">Perdas Não Técnicas.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            O <strong className="text-white">NotCat</strong> cruza dados geoespaciais do OpenStreetMap com a base comercial da concessionária para identificar ligações clandestinas e poços irregulares com precisão de satélite.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-3"
            >
              <Activity size={20}/> Iniciar Varredura
            </button>
            <button className="w-full sm:w-auto h-14 px-8 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-bold text-lg transition-colors backdrop-blur-md flex items-center justify-center gap-3">
              <MousePointer2 size={20}/> Solicitar Demo
            </button>
          </div>

          {/* Abstract Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-t-2xl border-x border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10 h-full w-full pointer-events-none"></div>
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Cuiab%C3%A1_Brazil_ISS_2003.jpg" 
               alt="Satellite Map" 
               className="w-full h-64 object-cover rounded-t-lg opacity-40 grayscale mix-blend-luminosity"
             />
             <div className="absolute top-10 left-10 right-10 flex gap-4 z-0 opacity-50">
                <div className="w-1/4 h-24 bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="w-1/4 h-24 bg-slate-800 rounded-lg animate-pulse delay-75"></div>
                <div className="w-1/4 h-24 bg-slate-800 rounded-lg animate-pulse delay-100"></div>
                <div className="w-1/4 h-24 bg-slate-800 rounded-lg animate-pulse delay-150"></div>
             </div>
          </div>
        </div>
      </header>

      {/* Metrics Section */}
      <section className="border-y border-white/5 bg-slate-900/50 backdrop-blur-sm py-12 z-20 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
           <div>
              <p className="text-4xl font-black text-white mb-1">R$ 12mi</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Receita Recuperada</p>
           </div>
           <div>
              <p className="text-4xl font-black text-white mb-1">98.5%</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Precisão de Detecção</p>
           </div>
           <div>
              <p className="text-4xl font-black text-white mb-1">15k+</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Imóveis Auditados</p>
           </div>
           <div>
              <p className="text-4xl font-black text-white mb-1">24/7</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Monitoramento Ativo</p>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10" id="features">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-black mb-4">Tecnologia de Ponta a Ponta</h2>
               <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                 Nossa plataforma integra múltiplas camadas de dados para criar um gêmeo digital da sua rede de distribuição.
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               {/* Card 1 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Satellite className="text-blue-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Mapeamento via Satélite</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Utilizamos dados do OpenStreetMap e imagens orbitais para identificar polígonos de construção e áreas residenciais recentes não cadastradas.
                  </p>
               </div>

               {/* Card 2 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-cyan-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Scan className="text-cyan-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Algoritmo Anti-Fraude</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Cruzamento automático entre existência física do imóvel e base comercial ativa. Detecta "gatos", by-passes e poços clandestinos instantaneamente.
                  </p>
               </div>

               {/* Card 3 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Zap className="text-purple-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Inteligência Gemini AI</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Geração de relatórios executivos táticos. A IA analisa padrões de ocorrências e sugere se a equipe deve fazer "Blitz" ou "Inspeção Cirúrgica".
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-white/10 shadow-2xl">
           <div className="absolute top-0 right-0 p-20 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 p-20 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
           
           <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10 text-white">Recupere Receita Agora.</h2>
           <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
             Não deixe que perdas não técnicas drenem o faturamento da sua concessionária. O NotCat é a solução definitiva para regularização.
           </p>
           <button 
             onClick={onEnter}
             className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl shadow-black/20 relative z-10 inline-flex items-center gap-2"
           >
             Acessar Dashboard <ArrowRight size={20} />
           </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Droplets size={20} />
          <span className="font-bold">NotCat Systems</span>
        </div>
        <p className="text-slate-600 text-sm">
          &copy; 2024 NotCat Utility Integrity System. Todos os direitos reservados.<br/>
          Desenvolvido para eficácia operacional em saneamento.
        </p>
      </footer>
    </div>
  );
};

// --- DASHBOARD HOME COMPONENT (NEW) ---
const DashboardHome: React.FC<{
  stats: {
    totalBuildings: number;
    totalConsumers: number;
    totalWells: number;
    activeAlerts: number;
    investigating: number;
    resolved: number;
  },
  alerts: InspectionAlert[]
}> = ({ stats, alerts }) => {
  
  // Fake revenue calc: approx R$ 450 per fraud/month * 12 months
  const potentialRevenue = (stats.activeAlerts * 450 * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fraudRate = stats.totalBuildings > 0 ? ((stats.activeAlerts / stats.totalBuildings) * 100).toFixed(1) : '0';

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
         <h2 className="text-3xl font-black text-slate-900 mb-2">Visão Geral Operacional</h2>
         <p className="text-slate-500">Monitoramento de perdas não técnicas e eficiência de recuperação.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <AlertTriangle size={64} className="text-red-600" />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Irregularidades Detectadas</p>
            <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.activeAlerts}</h3>
            <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
               <TrendingUp size={14} />
               <span>{fraudRate}% da rede</span>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <DollarSign size={64} className="text-green-600" />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Receita em Risco (Anual)</p>
            <h3 className="text-3xl font-black text-slate-900 mb-1">{potentialRevenue}</h3>
            <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
               <TrendingUp size={14} />
               <span>Estimativa IA</span>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <HardHat size={64} className="text-yellow-600" />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Ordens em Campo</p>
            <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.investigating}</h3>
            <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold">
               <Activity size={14} />
               <span>Em andamento</span>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <ShieldCheck size={64} className="text-blue-600" />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Eficiência de Recuperação</p>
            <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.resolved}</h3>
            <div className="flex items-center gap-1 text-blue-600 text-xs font-bold">
               <CheckCircle size={14} />
               <span>Casos resolvidos</span>
            </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Main Chart Area (Simulated) */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-800">Distribuição de Ocorrências por Região</h3>
               <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Ver Detalhes</button>
            </div>
            
            <div className="space-y-4">
               {/* Mock Bars */}
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>Zona Norte (Setor Residencial)</span>
                     <span>45%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 w-[45%] rounded-full"></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>Zona Leste (Expansão)</span>
                     <span>30%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-cyan-500 w-[30%] rounded-full"></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>Centro Histórico</span>
                     <span>15%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 w-[15%] rounded-full"></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>Zona Industrial</span>
                     <span>10%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-slate-400 w-[10%] rounded-full"></div>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
               <div>
                  <p className="text-2xl font-black text-slate-800">{stats.totalBuildings}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold">Total Imóveis</p>
               </div>
               <div>
                  <p className="text-2xl font-black text-slate-800">{stats.totalConsumers}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold">Conexões Ativas</p>
               </div>
               <div>
                  <p className="text-2xl font-black text-slate-800">{stats.totalWells}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold">Poços Monitorados</p>
               </div>
            </div>
         </div>

         {/* Right Column: Recent Alerts */}
         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[400px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                   <Bell size={16} className="text-slate-400"/> Alertas Recentes
                </span>
             </div>
             <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {alerts.slice(0, 10).map(alert => (
                   <div key={alert.id} className="p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
                      <div className="flex items-start gap-3">
                         <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.status === 'investigating' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                         <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">{alert.buildingId}</p>
                            <p className="text-[10px] text-slate-500 truncate">{alert.reason}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{alert.status === 'open' ? 'Pendente' : 'Em Análise'}</p>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             <div className="p-3 border-t border-slate-100 text-center">
                <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Ver Todos os Alertas</button>
             </div>
         </div>
      </div>
    </div>
  );
};

// --- DATA VIEW COMPONENT (NEW) ---
const DataView: React.FC<{
  consumers: ConsumerUnit[];
  setConsumers: (c: ConsumerUnit[]) => void;
  wells: ArtesianWell[];
  setWells: (w: ArtesianWell[]) => void;
  buildings: Building[];
  onDataUpdate: (newConsumers: ConsumerUnit[], newWells: ArtesianWell[]) => void;
}> = ({ consumers, setConsumers, wells, setWells, buildings, onDataUpdate }) => {
  const [activeType, setActiveType] = useState<'consumer' | 'well'>('consumer');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  
  // Form States
  const [manualId, setManualId] = useState('');
  const [manualOwner, setManualOwner] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadStatus('processing');
    
    // Simulate processing file
    setTimeout(() => {
      // Mock importing data near Cuiaba
      const count = Math.floor(Math.random() * 20) + 5;
      if (activeType === 'consumer') {
        const newConsumers: ConsumerUnit[] = [];
        for (let i = 0; i < count; i++) {
           const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
           if (randomBuilding) {
             newConsumers.push({
               id: `IMPORT-${Date.now()}-${i}`,
               lat: randomBuilding.lat,
               lng: randomBuilding.lng,
               owner: generateBrazillianName(),
               status: 'active',
               lastReading: new Date().toISOString().split('T')[0]
             });
           }
        }
        const updated = [...consumers, ...newConsumers];
        setConsumers(updated);
        onDataUpdate(updated, wells);
      } else {
        const newWells: ArtesianWell[] = [];
        for (let i = 0; i < count; i++) {
           const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
           if (randomBuilding) {
             newWells.push({
               id: `WELL-IMP-${Date.now()}-${i}`,
               lat: randomBuilding.lat,
               lng: randomBuilding.lng,
               registrationDate: new Date().toISOString().split('T')[0]
             });
           }
        }
        const updated = [...wells, ...newWells];
        setWells(updated);
        onDataUpdate(consumers, updated);
      }
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }, 1500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLat || !manualLng) return;

    if (activeType === 'consumer') {
      const newConsumer: ConsumerUnit = {
        id: manualId || `MAN-${Date.now()}`,
        owner: manualOwner || 'Sem Nome',
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng),
        status: 'active',
        lastReading: new Date().toISOString().split('T')[0]
      };
      const updated = [...consumers, newConsumer];
      setConsumers(updated);
      onDataUpdate(updated, wells);
    } else {
      const newWell: ArtesianWell = {
        id: manualId || `W-MAN-${Date.now()}`,
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng),
        registrationDate: new Date().toISOString().split('T')[0]
      };
      const updated = [...wells, newWell];
      setWells(updated);
      onDataUpdate(consumers, updated);
    }
    
    // Reset form
    setManualId('');
    setManualOwner('');
    setManualLat('');
    setManualLng('');
    setUploadStatus('success');
    setTimeout(() => setUploadStatus('idle'), 3000);
  };

  // Helper to pre-fill lat/lng for demo purposes
  const fillRandomCoord = () => {
    if (buildings.length > 0) {
      const b = buildings[Math.floor(Math.random() * buildings.length)];
      setManualLat(b.lat.toString());
      setManualLng(b.lng.toString());
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto max-w-6xl mx-auto">
      <header className="mb-8">
         <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
           <Database className="text-blue-600" size={32} />
           Central de Dados Geoespaciais
         </h2>
         <p className="text-slate-500 text-lg">Gerencie a base de ativos e consumidores para reprocessamento de fraudes.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit mb-8">
         <button 
           onClick={() => setActiveType('consumer')}
           className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeType === 'consumer' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
         >
           <User size={18} /> Base Comercial (Hidrômetros)
         </button>
         <button 
           onClick={() => setActiveType('well')}
           className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeType === 'well' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
         >
           <Droplets size={18} /> Poços Artesianos (DAEE)
         </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         
         {/* Left Column: Input Methods */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Drag & Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-3xl p-10 text-center transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-xl' 
                  : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
               {uploadStatus === 'processing' && (
                 <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-800 font-bold">Processando Geometrias...</p>
                 </div>
               )}

               {uploadStatus === 'success' && (
                 <div className="absolute inset-0 bg-green-50/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in">
                    <CheckCircle size={56} className="text-green-500 mb-4" />
                    <p className="text-green-800 font-bold text-lg">Base Atualizada com Sucesso!</p>
                    <p className="text-green-600 text-sm mt-1">O algoritmo de fraude foi reexecutado.</p>
                 </div>
               )}

               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 transition-colors">
                  <UploadCloud size={32} className="text-slate-400 group-hover:text-blue-600" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Upload de Arquivos em Lote</h3>
               <p className="text-slate-500 max-w-md mx-auto mb-6">
                 Arraste arquivos <strong>.CSV, .XLSX ou .GEOJSON</strong> contendo coordenadas e metadados. O sistema fará o matching espacial automaticamente.
               </p>
               <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                 Selecionar Arquivo no Computador
               </button>
            </div>

            {/* 2. Manual Entry */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <Plus size={20} className="text-blue-600"/> Cadastro Manual Unitário
                 </h3>
                 <button onClick={fillRandomCoord} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md">
                    Preencher Coord. Aleatória (Demo)
                 </button>
               </div>
               
               <form onSubmit={handleManualSubmit} className="grid md:grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID / Matrícula</label>
                     <input 
                       required
                       value={manualId}
                       onChange={(e) => setManualId(e.target.value)}
                       type="text" 
                       className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                       placeholder={activeType === 'consumer' ? "Ex: UC-998877" : "Ex: 2024.11.001"}
                     />
                  </div>
                  {activeType === 'consumer' && (
                    <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável</label>
                       <input 
                         required
                         value={manualOwner}
                         onChange={(e) => setManualOwner(e.target.value)}
                         type="text" 
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                         placeholder="Nome Completo"
                       />
                    </div>
                  )}
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Latitude</label>
                     <input 
                       required
                       value={manualLat}
                       onChange={(e) => setManualLat(e.target.value)}
                       type="number" 
                       step="any"
                       className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                       placeholder="-15.0000"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Longitude</label>
                     <input 
                       required
                       value={manualLng}
                       onChange={(e) => setManualLng(e.target.value)}
                       type="number" 
                       step="any"
                       className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                       placeholder="-56.0000"
                     />
                  </div>
                  <div className="col-span-2 mt-2">
                     <button type="submit" className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${activeType === 'consumer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200'}`}>
                       Confirmar Inclusão
                     </button>
                  </div>
               </form>
            </div>
         </div>

         {/* Right Column: Stats & Recent List */}
         <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
               <div className="relative z-10">
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Registrado</p>
                 <div className="text-5xl font-black mb-1">
                   {activeType === 'consumer' ? consumers.length : wells.length}
                 </div>
                 <p className="text-slate-400 text-sm">
                   {activeType === 'consumer' ? 'Unidades Ativas' : 'Poços Outorgados'}
                 </p>
               </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
               <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <span className="font-bold text-slate-700 text-sm">Registros Recentes</span>
                 <FileSpreadsheet size={16} className="text-slate-400"/>
               </div>
               <div className="overflow-y-auto flex-1 p-2 space-y-2">
                  {(activeType === 'consumer' ? [...consumers].reverse() : [...wells].reverse()).slice(0, 20).map((item, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-300 transition-colors group">
                       <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-slate-500 font-bold">{(item as any).id}</span>
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                       </div>
                       <p className="text-sm font-bold text-slate-800 truncate">
                         {(item as any).owner || 'Registro DAEE'}
                       </p>
                       <p className="text-[10px] text-slate-400 mt-1">
                         LAT: {(item as any).lat.toFixed(4)} • LNG: {(item as any).lng.toFixed(4)}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

// --- SETTINGS VIEW COMPONENT ---
const SettingsView: React.FC<{ 
  branches: Branch[], 
  onAddBranch: (b: Branch) => void,
  onRemoveBranch: (id: string) => void,
  serviceAreas: ServiceArea[]
}> = ({ branches, onAddBranch, onRemoveBranch, serviceAreas }) => {
  const [newBranchName, setNewBranchName] = useState('');
  
  const handleAdd = () => {
    if (!newBranchName) return;
    onAddBranch({
      id: Date.now().toString(),
      name: newBranchName,
      type: 'branch',
      lat: -15.596 - (Math.random() * 0.01),
      lng: -56.097 + (Math.random() * 0.01),
      manager: 'Gerente Designado'
    });
    setNewBranchName('');
  };

  return (
    <div className="p-8 max-w-5xl h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Configurações Corporativas</h2>
      
      <div className="grid gap-6">
        
        {/* Gestão de Unidades */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building2 size={20} className="text-blue-600"/> Gestão de Unidades</h3>
          
          <div className="mb-6 flex gap-2">
            <input 
              type="text" 
              placeholder="Nome da nova filial..."
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
            />
            <button onClick={handleAdd} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <Plus size={16} /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {branches.map(branch => (
              <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${branch.type === 'headquarters' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    <Landmark size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{branch.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{branch.type === 'headquarters' ? 'Matriz' : 'Filial'} • {branch.manager}</p>
                  </div>
                </div>
                {branch.type !== 'headquarters' && (
                  <button onClick={() => onRemoveBranch(branch.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Áreas de Atuação */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe2 size={20} className="text-green-600"/> Áreas de Concessão (Polígonos)</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceAreas.map(area => (
                 <div key={area.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: area.color }}></div>
                    <Layers size={20} style={{ color: area.color }} />
                    <div>
                       <p className="text-sm font-bold text-slate-700">{area.name}</p>
                       <p className="text-xs text-slate-500 uppercase">{area.type}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Parâmetros Gerais */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm opacity-75">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings size={20} className="text-slate-500"/> Parâmetros do Sistema</h3>
          <p className="text-sm text-slate-500">Configurações globais de detecção são gerenciadas pela Matriz.</p>
        </div>
      </div>
    </div>
  );
};

// --- LIST VIEW COMPONENT ---
const ListView: React.FC<{ alerts: InspectionAlert[] }> = ({ alerts }) => (
  <div className="p-8 h-full overflow-y-auto">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-slate-800">Registro de Irregularidades</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
        Exportar CSV
      </button>
    </div>
    
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">ID Alerta</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Severidade</th>
            <th className="px-6 py-4">Endereço</th>
            <th className="px-6 py-4">Motivo</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map(alert => (
            <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs text-slate-500">{alert.id}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  alert.status === 'open' ? 'bg-red-100 text-red-800' :
                  alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.status === 'open' ? 'Pendente' : alert.status === 'investigating' ? 'Em Análise' : 'Resolvido'}
                </span>
              </td>
              <td className="px-6 py-4">
                 <span className={`font-bold ${alert.severity === 'high' ? 'text-red-600' : 'text-slate-600'}`}>
                   {alert.severity === 'high' ? 'ALTA' : 'MÉDIA'}
                 </span>
              </td>
              <td className="px-6 py-4 text-slate-700 truncate max-w-[200px]" title={alert.address}>{alert.address}</td>
              <td className="px-6 py-4 text-slate-500">{alert.reason}</td>
              <td className="px-6 py-4 text-right">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Detalhes</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- DASHBOARD COMPONENT ---
const Dashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'list' | 'settings' | 'reports' | 'data'>('dashboard');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [consumers, setConsumers] = useState<ConsumerUnit[]>([]);
  const [wells, setWells] = useState<ArtesianWell[]>([]);
  const [alerts, setAlerts] = useState<InspectionAlert[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'standard'>('satellite');
  const [filterMode, setFilterMode] = useState<'all' | 'alerts' | 'investigating'>('all');
  
  // Optimization State: Track current map bounds to only render visible items
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  // Corporate Data
  const [branches, setBranches] = useState<Branch[]>([
    { id: 'HQ', name: 'Matriz Administrativa', type: 'headquarters', lat: -15.596, lng: -56.097, manager: 'Roberto Santos' },
    { id: 'BR-1', name: 'Posto Avançado Norte', type: 'branch', lat: -15.592, lng: -56.092, manager: 'Ana Lima' }
  ]);

  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([
    { 
      id: 'SA-1', 
      name: 'Setor 1 - Centro Sul', 
      type: 'concession', 
      color: '#3b82f6', // Blue
      coordinates: [
        [-15.600, -56.105],
        [-15.600, -56.090],
        [-15.590, -56.090],
        [-15.590, -56.105]
      ]
    },
    { 
      id: 'SA-2', 
      name: 'Setor 2 - Expansão', 
      type: 'maintenance', 
      color: '#eab308', // Yellow
      coordinates: [
         [-15.590, -56.105],
         [-15.590, -56.085],
         [-15.580, -56.085],
         [-15.580, -56.105]
      ]
    }
  ]);

  const cuiabaCenter: [number, number] = [-15.596, -56.097];

  // Logic: Algorithmic Optimization (Spatial Hashing)
  const recalculateAlerts = (bldgs: Building[], cons: ConsumerUnit[], artWells: ArtesianWell[]) => {
    const foundAlerts: InspectionAlert[] = [];
    
    // Spatial Grid for Consumers
    // Round lat/lng to 3 decimal places (~100m buckets)
    const gridSize = 0.001; 
    const getGridKey = (lat: number, lng: number) => 
      `${Math.floor(lat/gridSize)}:${Math.floor(lng/gridSize)}`;
      
    const consumerGrid: Record<string, ConsumerUnit[]> = {};
    const wellGrid: Record<string, ArtesianWell[]> = {};

    // Populate Grid O(N)
    cons.forEach(c => {
      const key = getGridKey(c.lat, c.lng);
      if (!consumerGrid[key]) consumerGrid[key] = [];
      consumerGrid[key].push(c);
    });
    
    artWells.forEach(w => {
      const key = getGridKey(w.lat, w.lng);
      if (!wellGrid[key]) wellGrid[key] = [];
      wellGrid[key].push(w);
    });

    // Check Buildings O(M) with O(1) lookup
    bldgs.forEach(b => {
      const key = getGridKey(b.lat, b.lng);
      // Check current cell and immediate neighbors (3x3 grid) to account for edge cases
      const latIdx = Math.floor(b.lat/gridSize);
      const lngIdx = Math.floor(b.lng/gridSize);
      
      let hasUC = false;
      let hasWell = false;

      // Scan 3x3 neighbors
      for(let x = -1; x <= 1; x++) {
        for(let y = -1; y <= 1; y++) {
          const checkKey = `${latIdx+x}:${lngIdx+y}`;
          
          if (!hasUC && consumerGrid[checkKey]) {
            hasUC = consumerGrid[checkKey].some(c => {
              const dist = Math.sqrt(Math.pow(b.lat - c.lat, 2) + Math.pow(b.lng - c.lng, 2));
              return dist < 0.00015;
            });
          }
          
          if (!hasWell && wellGrid[checkKey]) {
            hasWell = wellGrid[checkKey].some(w => {
              const dist = Math.sqrt(Math.pow(b.lat - w.lat, 2) + Math.pow(b.lng - w.lng, 2));
              return dist < 0.00015;
            });
          }
        }
      }

      if (!hasUC && !hasWell) {
        const isHighSeverity = Math.random() > 0.5;
        foundAlerts.push({
          id: `ALERT-${b.id}`,
          buildingId: b.id,
          location: [b.lat, b.lng],
          reason: 'Ausência de hidrômetro em área residencial ativa.',
          severity: isHighSeverity ? 'high' : 'medium',
          status: 'open',
          address: b.address || 'Endereço não identificado'
        });
      }
    });
    setAlerts(foundAlerts);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { buildings: osmBldgs, territories: osmTerrs } = await fetchResidentialData();
      setBuildings(osmBldgs);
      setTerritories(osmTerrs);

      const buildingsWithConsumers: ConsumerUnit[] = [];
      const buildingsWithWells: ArtesianWell[] = [];

      osmBldgs.forEach((b) => {
        const rand = Math.random();
        
        // 70% chance of being a regular customer
        if (rand < 0.70) {
            buildingsWithConsumers.push({
                id: `UC-${b.id.slice(-6)}`,
                lat: b.lat,
                lng: b.lng,
                owner: generateBrazillianName(),
                status: Math.random() > 0.95 ? 'inactive' : 'active',
                lastReading: generateRandomDate(new Date(2024, 0, 1), new Date())
            });
        } 
        // 10% chance of having a registered well (and maybe no water connection)
        else if (rand < 0.80) {
            buildingsWithWells.push({
                id: `OUT-${Math.floor(1000 + Math.random() * 9000)}/24`,
                lat: b.lat,
                lng: b.lng,
                registrationDate: generateRandomDate(new Date(2020, 0, 1), new Date(2023, 11, 31))
            });
            // Small chance they have BOTH well and connection (uncommon but possible)
            if (Math.random() > 0.7) {
                 buildingsWithConsumers.push({
                    id: `UC-${b.id.slice(-6)}`,
                    lat: b.lat,
                    lng: b.lng,
                    owner: generateBrazillianName(),
                    status: 'active',
                    lastReading: generateRandomDate(new Date(2024, 0, 1), new Date())
                });
            }
        }
        // Remaining 20% are potential frauds (No UC, No Well) - handled by recalculateAlerts logic naturally
      });
      
      setConsumers(buildingsWithConsumers);
      setWells(buildingsWithWells);
      recalculateAlerts(osmBldgs, buildingsWithConsumers, buildingsWithWells);
      setLoading(false);
    };

    initData();
  }, []);

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    setActiveTab('reports');
    const result = await analyzeIrregularities(buildings.length, alerts, wells.length);
    setReport(result);
    setAnalyzing(false);
  };

  const handleDispatch = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'investigating' } : a));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
  };

  const addBranch = (b: Branch) => setBranches([...branches, b]);
  const removeBranch = (id: string) => setBranches(branches.filter(b => b.id !== id));

  // Handle updates from DataView
  const handleDataUpdate = (newConsumers: ConsumerUnit[], newWells: ArtesianWell[]) => {
    setConsumers(newConsumers);
    setWells(newWells);
    recalculateAlerts(buildings, newConsumers, newWells);
  };

  const filteredAlerts = useMemo(() => {
    if (filterMode === 'all') return alerts.filter(a => a.status !== 'resolved');
    if (filterMode === 'alerts') return alerts.filter(a => a.status === 'open');
    if (filterMode === 'investigating') return alerts.filter(a => a.status === 'investigating');
    return [];
  }, [alerts, filterMode]);

  // --- VIRTUALIZATION / VIEWPORT CULLING ---
  
  // 1. Visible Buildings (Polygons)
  const visibleBuildings = useMemo(() => {
    if (!mapBounds) return [];
    // Pad bounds by 20% (reduced from 50% for performance) to render slightly off-screen
    const padded = mapBounds.pad(0.2); 
    return buildings.filter(b => padded.contains({ lat: b.lat, lng: b.lng }));
  }, [buildings, mapBounds]);

  // 2. Visible Alerts (Markers)
  const visibleAlerts = useMemo(() => {
    if (!mapBounds) return [];
    const padded = mapBounds.pad(0.2);
    return filteredAlerts.filter(a => padded.contains({ lat: a.location[0], lng: a.location[1] }));
  }, [filteredAlerts, mapBounds]);

  // 3. Visible Wells (Markers)
  const visibleWells = useMemo(() => {
    if (!mapBounds || filterMode !== 'all') return [];
    const padded = mapBounds.pad(0.2);
    return wells.filter(w => padded.contains({ lat: w.lat, lng: w.lng }));
  }, [wells, mapBounds, filterMode]);


  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 z-20">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <div className="bg-blue-600 p-1.5 rounded-lg">
             <Droplets size={20} className="text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">NotCat<span className="text-blue-500">.sys</span></span>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Principal</p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={18} /> Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <MapIcon size={18} /> Mapa Operacional
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={18} /> Lista de Ocorrências
            <span className="ml-auto bg-slate-800 text-slate-400 text-xs py-0.5 px-2 rounded-full border border-slate-700">{alerts.length}</span>
          </button>
          <button 
             onClick={runAIAnalysis}
             className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            {analyzing ? <Loader2 size={18} className="animate-spin text-purple-400" /> : <BarChart3 size={18} />}
            Relatórios IA
          </button>

          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8 mb-2">Administração</p>
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Database size={18} /> Central de Dados
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={18} /> Configurações
          </button>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Diretor de Ops</p>
              <p className="text-xs text-slate-500 truncate">admin@notcat.com</p>
            </div>
            <button className="ml-auto text-slate-500 hover:text-red-400"><LogOut size={16}/></button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
           <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Painel</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-slate-800 capitalize">
                {activeTab === 'dashboard' ? 'Visão Geral Executiva' :
                 activeTab === 'map' ? 'Monitoramento em Tempo Real' : 
                 activeTab === 'list' ? 'Gestão de Irregularidades' :
                 activeTab === 'data' ? 'Gestão de Dados & Ativos' :
                 activeTab === 'settings' ? 'Configurações Corporativas' : 'Inteligência Artificial'}
              </span>
           </div>

           {/* Controls visible only on map */}
           {activeTab === 'map' && (
             <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setMapStyle('satellite')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${mapStyle === 'satellite' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <Globe2 size={14}/> Satélite
                  </button>
                  <button 
                    onClick={() => setMapStyle('standard')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${mapStyle === 'standard' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <MapIcon size={14}/> Mapa
                  </button>
                </div>
                
                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                   <button onClick={() => setFilterMode('all')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterMode === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Tudo</button>
                   <button onClick={() => setFilterMode('alerts')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'alerts' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"/> Pendentes
                   </button>
                   <button onClick={() => setFilterMode('investigating')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'investigating' ? 'bg-yellow-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"/> Análise
                   </button>
                </div>
             </div>
           )}

           {activeTab !== 'map' && <div className="w-32"></div>}
        </header>

        {/* Content Views */}
        <main className="flex-1 relative bg-slate-50 overflow-hidden">

          {/* DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
             <DashboardHome 
               stats={{
                 totalBuildings: buildings.length,
                 totalConsumers: consumers.length,
                 totalWells: wells.length,
                 activeAlerts: alerts.filter(a => a.status === 'open').length,
                 investigating: alerts.filter(a => a.status === 'investigating').length,
                 resolved: alerts.filter(a => a.status === 'resolved').length
               }}
               alerts={alerts}
             />
          )}
          
          {/* MAP VIEW */}
          {activeTab === 'map' && (
            <>
              {loading && (
                <div className="absolute inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-600 font-bold text-sm tracking-wide animate-pulse">CARREGANDO GIS...</p>
                </div>
              )}
              
              <MapContainer 
                center={cuiabaCenter} 
                zoom={16} 
                zoomControl={false} 
                className="w-full h-full"
                preferCanvas={true} // CRITICAL: Enables Canvas renderer for better performance
              >
                {/* 1. Track Bounds for Virtualization */}
                <MapBoundsHandler onBoundsChange={setMapBounds} />

                {mapStyle === 'satellite' ? (
                   <TileLayer
                     attribution='Tiles &copy; Esri'
                     url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                   />
                ) : (
                   <TileLayer
                     attribution='&copy; OpenStreetMap'
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   />
                )}
                <ChangeView center={cuiabaCenter} />

                {/* 2. SERVICE AREAS (Concession Territories) - Background Layer */}
                {serviceAreas.map(area => (
                  <Polygon 
                    key={area.id}
                    positions={area.coordinates}
                    pathOptions={{
                      color: area.color,
                      fillColor: area.color,
                      fillOpacity: 0.1,
                      weight: 1,
                      dashArray: '10, 10'
                    }}
                  >
                     <Tooltip sticky>
                        <span className="font-bold text-xs">{area.name}</span>
                     </Tooltip>
                  </Polygon>
                ))}

                {/* 3. BUILDING POLYGONS (Colored by Status) */}
                {visibleBuildings.map(b => {
                  const hasAlert = alerts.some(a => a.buildingId === b.id && a.status !== 'resolved');
                  const hasWell = wells.some(w => {
                    const dist = Math.sqrt(Math.pow(b.lat - w.lat, 2) + Math.pow(b.lng - w.lng, 2));
                    return dist < 0.00015;
                  });
                  const isConsumer = consumers.some(c => `UC-${b.id}` === c.id);
                  
                  // Color Logic
                  let fillColor = '#94a3b8'; // Neutral Slate (No Data)
                  let color = '#94a3b8';
                  
                  if (hasAlert) {
                    fillColor = '#ef4444'; // Red (Alert)
                    color = '#ef4444';
                  } else if (hasWell) {
                     fillColor = '#06b6d4'; // Cyan (Well)
                     color = '#06b6d4';
                  } else if (isConsumer) {
                    fillColor = '#22c55e'; // Green (Regular)
                    color = '#22c55e';
                  }

                  return (
                    <Polygon 
                      key={`poly-${b.id}`}
                      positions={b.polygon}
                      pathOptions={{
                        color: color,
                        fillColor: fillColor,
                        fillOpacity: mapStyle === 'satellite' ? 0.3 : 0.4,
                        weight: hasAlert ? 2 : 1,
                      }}
                    >
                      {/* Only show tooltip for irregular/wells/consumers, or neutral to identify */}
                      <Tooltip>Imóvel: {b.id}</Tooltip>
                    </Polygon>
                  );
                })}

                {/* 4. MARKERS LAYER (Only for Alerts, Wells and Corporate) */}
                
                {/* Branches / Offices */}
                {branches.map(b => (
                  <Marker key={b.id} position={[b.lat, b.lng]} icon={corporateIcon}>
                    <Popup className="rounded-xl border-none shadow-xl">
                      <div className="p-3 text-center min-w-[150px]">
                        <Building2 size={24} className="mx-auto text-blue-900 mb-2"/>
                        <p className="font-black text-sm text-slate-900">{b.name}</p>
                        <p className="text-xs text-slate-500">{b.type === 'headquarters' ? 'Sede Administrativa' : 'Filial Operacional'}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Wells Markers (Cyan Dots) */}
                {visibleWells.map(w => (
                   <CircleMarker 
                    key={w.id} 
                    center={[w.lat, w.lng]} 
                    radius={6}
                    pathOptions={{
                      color: 'white',
                      weight: 2,
                      fillColor: '#06b6d4', // Cyan
                      fillOpacity: 1
                    }}
                  >
                     <Popup className="rounded-xl border-none shadow-xl">
                       <div className="w-[200px] bg-white rounded-lg overflow-hidden">
                          <div className="bg-cyan-50 px-3 py-2 border-b border-cyan-100 flex items-center gap-2">
                             <Droplets size={14} className="text-cyan-600"/>
                             <span className="text-xs font-bold text-cyan-800 uppercase">Poço Artesiano</span>
                          </div>
                          <div className="p-3">
                             <p className="text-sm font-bold text-slate-800 mb-1">Registro DAEE</p>
                             <p className="text-xs text-slate-500">ID: {w.id}</p>
                             <p className="text-xs text-slate-500">Data: {w.registrationDate}</p>
                          </div>
                       </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {/* ALERTS (Red Markers/Dots) */}
                {visibleAlerts.map(a => (
                  <CircleMarker 
                    key={a.id} 
                    center={a.location} 
                    radius={6}
                    pathOptions={{
                       color: 'white',
                       weight: 2,
                       fillColor: a.status === 'investigating' ? '#f59e0b' : '#ef4444', // Orange or Red
                       fillOpacity: 1
                    }}
                  >
                    <Popup className="rounded-xl border-none shadow-2xl">
                      <div className="w-[280px] bg-white rounded-lg overflow-hidden font-sans">
                        <div className={`px-4 py-3 flex items-center justify-between border-b ${
                           a.status === 'investigating' ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
                        }`}>
                           <div className="flex items-center gap-2">
                              {a.status === 'investigating' ? <HardHat size={16} className="text-yellow-600"/> : <AlertTriangle size={16} className="text-red-600"/>}
                              <span className={`text-xs font-black uppercase tracking-wide ${
                                a.status === 'investigating' ? 'text-yellow-700' : 'text-red-700'
                              }`}>
                                {a.status === 'investigating' ? 'Em Análise' : 'Possível Fraude'}
                              </span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 font-mono">{a.buildingId}</span>
                        </div>

                        <div className="p-4 space-y-3">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Localização</p>
                              <div className="flex items-start gap-2">
                                <MapIcon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-sm font-medium text-slate-700 leading-snug">
                                  {a.address || "Endereço não confirmado pelo GIS"}
                                </p>
                              </div>
                           </div>
                           <div className="pt-2 flex flex-col gap-2">
                              {a.status === 'open' ? (
                                <button 
                                  onClick={() => handleDispatch(a.id)}
                                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                >
                                  <HardHat size={14} /> GERAR ORDEM DE SERVIÇO
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => handleResolve(a.id)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700">Confirmar</button>
                                  <button onClick={() => handleResolve(a.id)} className="flex-1 bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded hover:bg-slate-300">Descartar</button>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </>
          )}

          {/* LIST VIEW */}
          {activeTab === 'list' && <ListView alerts={alerts} />}

          {/* DATA VIEW (NEW) */}
          {activeTab === 'data' && (
             <DataView 
               consumers={consumers}
               setConsumers={setConsumers}
               wells={wells}
               setWells={setWells}
               buildings={buildings}
               onDataUpdate={handleDataUpdate}
             />
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <SettingsView 
              branches={branches} 
              onAddBranch={addBranch} 
              onRemoveBranch={removeBranch} 
              serviceAreas={serviceAreas}
            />
          )}

          {/* REPORTS VIEW */}
          {activeTab === 'reports' && (
            <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
               <div className="flex items-center gap-4 mb-8">
                  <div className="bg-purple-600 p-3 rounded-xl shadow-lg shadow-purple-200">
                    <Zap size={24} className="text-white"/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Relatório de Inteligência</h2>
                    <p className="text-slate-500 text-sm">Análise tática gerada pelo Gemini 3 Flash</p>
                  </div>
                  {!report && !analyzing && (
                    <button onClick={runAIAnalysis} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">
                       Gerar Nova Análise
                    </button>
                  )}
               </div>

               {analyzing ? (
                 <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <Loader2 size={40} className="animate-spin text-purple-600 mb-4"/>
                    <p className="text-slate-600 font-medium">Processando dados de satélite e consumo...</p>
                 </div>
               ) : report ? (
                 <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Summary Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Resumo Executivo</h3>
                       <p className="text-lg text-slate-800 leading-relaxed font-medium">{report.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                       {/* Risk Card */}
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Nível de Risco Operacional</h3>
                          <div className="flex items-center gap-4">
                             <div className={`text-4xl font-black ${report.riskLevel === 'Crítico' ? 'text-red-500' : 'text-yellow-500'}`}>
                               {report.riskLevel.toUpperCase()}
                             </div>
                             <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${report.riskLevel === 'Crítico' ? 'bg-red-500 w-[90%]' : 'bg-yellow-500 w-[60%]'}`}
                                ></div>
                             </div>
                          </div>
                       </div>

                       {/* Recommendations */}
                       <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Ações Recomendadas</h3>
                          <ul className="space-y-4">
                            {report.recommendations.map((rec, i) => (
                              <li key={i} className="flex gap-3">
                                <div className="mt-1 bg-blue-500/20 p-1 rounded-full text-blue-400 h-fit">
                                  <ArrowRight size={14} />
                                </div>
                                <span className="text-sm font-medium leading-relaxed text-slate-200">{rec}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-20 text-slate-400">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>Nenhum relatório gerado para a sessão atual.</p>
                 </div>
               )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// --- MAIN APP CONTAINER ---
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');

  if (currentView === 'landing') {
    return <LandingPage onEnter={() => setCurrentView('app')} />;
  }

  return <Dashboard />;
};

export default App;
