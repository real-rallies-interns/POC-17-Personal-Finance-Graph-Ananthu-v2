'use client';
import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function RealRailsDashboard() {
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState(30); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false); 
  const [activeView, setActiveView] = useState<'history' | 'forecast'>('history');

  useEffect(() => {
    setIsMounted(true);
    fetch('http://127.0.0.1:8000/intelligence/rail-data')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Connection Error:", err));
  }, []);

  const downloadCSV = () => {
    const txs = data.main_stage.transactions;
    const headers = "Date,Merchant,Category,Amount\n";
    const rows = txs.map((t: any) => `${t.date},"${t.name}",${t.category[0]},${t.amount}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RealRails_Retail_Ledger.csv`;
    a.click();
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RealRails_Institutional_Protocol.json`;
    a.click();
  };

  if (!data) return (
    <div className="h-screen bg-[#030712] flex items-center justify-center text-[#38BDF8] font-mono animate-pulse">
      INITIALIZING_FINANCE_RAIL_PROTOCOL...
    </div>
  );

  const sortedChartData = data.main_stage.transactions.slice().sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestDateObj = sortedChartData.length > 0 ? new Date(sortedChartData[sortedChartData.length - 1].date) : new Date();
  const cutoffTime = latestDateObj.getTime() - (timeRange * 24 * 60 * 60 * 1000);

  const dynamicTransactions = sortedChartData.filter((tx: any) => new Date(tx.date).getTime() >= cutoffTime);
  const expenseTransactions = dynamicTransactions.filter((tx: any) => !tx.category.includes('Income'));
  
  const filteredTableTransactions = data.main_stage.transactions.filter((tx: any) => 
    tx.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.category.some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const dynamicIncome = dynamicTransactions.filter((tx: any) => tx.category.includes('Income')).reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const dynamicOutflow = expenseTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  
  const savingsRate = dynamicIncome > 0 ? ((dynamicIncome - dynamicOutflow) / dynamicIncome) * 100 : 0;
  const topCategory = [...new Set(expenseTransactions.map((t: any) => t.category[0]))]
    .map(cat => ({ name: cat, total: expenseTransactions.filter((t: any) => t.category[0] === cat).reduce((s: number, t: any) => s + t.amount, 0) }))
    .sort((a, b) => b.total - a.total)[0]?.name || "N/A";

  const mockCurrentBalance = 150000; 
  const dailyBurnRate = dynamicOutflow / timeRange;
  const dynamicRunway = dailyBurnRate > 0 ? Math.round(mockCurrentBalance / dailyBurnRate) : 999;
  
  const depletionDate = new Date(new Date().getTime() + (dynamicRunway * 24 * 60 * 60 * 1000));
  const depletionDateString = depletionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const forecastData = [];
  let currentSimBalance = mockCurrentBalance;
  let dayCount = 0;
  const recurringBillsByDay: Record<number, any[]> = {};
  data.sidebar.insights.forEach((sub: any) => {
      const billDay = new Date(sub.last_date).getDate();
      if (!recurringBillsByDay[billDay]) recurringBillsByDay[billDay] = [];
      recurringBillsByDay[billDay].push(sub);
  });
  const dailyNoiseRate = data.sidebar.metrics.daily_noise_rate || dailyBurnRate;
  const currentDate = new Date();
  while (currentSimBalance > 0 && dayCount <= 365) {
      const simDate = new Date(currentDate); simDate.setDate(simDate.getDate() + dayCount);
      const simDayOfMonth = simDate.getDate();
      currentSimBalance -= dailyNoiseRate;
      let billsToday = 0; let billsHit: any[] = [];
      if (recurringBillsByDay[simDayOfMonth]) {
          recurringBillsByDay[simDayOfMonth].forEach(bill => { billsToday += bill.amount; billsHit.push(bill); });
          currentSimBalance -= billsToday;
      }
      forecastData.push({ date: simDate.toISOString().split('T')[0], balance: Math.max(0, currentSimBalance), isBillDay: billsToday > 0, billsHit: billsHit, totalDrainedToday: dailyNoiseRate + billsToday });
      dayCount++;
  }

  const dynamicInsights = data.sidebar.insights.map((sub: any) => {
    const windowTxs = dynamicTransactions.filter((tx: any) => tx.name === sub.name);
    if (windowTxs.length === 0) return null;
    return { ...sub, occurrencesInWindow: windowTxs.length, total_spent_window: windowTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0) };
  }).filter(Boolean);

  const historyDrilldown = selectedDate && activeView === 'history' ? data.main_stage.transactions.filter((tx: any) => tx.date === selectedDate) : [];
  const forecastDrilldown = selectedDate && activeView === 'forecast' ? forecastData.find(d => d.date === selectedDate) : null;

  return (
    <main className="flex h-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#38BDF8] selection:text-[#030712]">
      
      {selectedDate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`bg-[#0B1117] border ${activeView === 'history' ? 'border-[#38BDF8]/50 shadow-[0_0_40px_rgba(56,189,248,0.15)]' : 'border-[#818CF8]/50 shadow-[0_0_40px_rgba(129,140,248,0.15)]'} rounded-2xl p-8 max-w-md w-full relative`}>
            <button onClick={() => setSelectedDate(null)} className={`absolute top-5 right-5 text-gray-500 transition-colors ${activeView === 'history' ? 'hover:text-[#38BDF8]' : 'hover:text-[#818CF8]'}`}>✕</button>
            <p className={`${activeView === 'history' ? 'text-[#38BDF8]' : 'text-[#818CF8]'} text-[10px] font-bold tracking-[0.2em] uppercase mb-1`}>{activeView === 'history' ? 'Daily Drilldown' : 'Forecasted Drain'}</p>
            <h3 className="text-2xl font-black text-white mb-6">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {activeView === 'history' ? historyDrilldown.map((tx: any) => (
                <div key={tx.transaction_id} className="flex justify-between items-center p-4 bg-[#030712] border border-[#1F2937] rounded-lg hover:border-[#38BDF8]/30 transition-colors">
                  <div><p className="font-bold text-gray-300">{tx.name}</p><p className="text-[9px] text-gray-500 uppercase mt-0.5">{tx.category[0]}</p></div>
                  <p className={`font-mono font-black text-lg ${tx.category.includes('Income') ? 'text-green-400' : 'text-[#38BDF8]'}`}>{tx.category.includes('Income') ? '+' : ''}₹{tx.amount.toFixed(2)}</p>
                </div>
              )) : forecastDrilldown ? (
                <>
                  <div className="flex justify-between items-center p-4 bg-[#030712] border border-[#1F2937] rounded-lg"><div><p className="font-bold text-gray-300">Daily Average Spend</p></div><p className="font-mono font-black text-gray-400 text-lg">₹{dailyNoiseRate.toFixed(2)}</p></div>
                  {forecastDrilldown.billsHit.map((bill: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-[#030712] border border-[#ef4444]/50 rounded-lg"><div><p className="font-bold text-white">{bill.name}</p></div><p className="font-mono font-black text-[#ef4444] text-lg">₹{bill.amount.toFixed(2)}</p></div>
                  ))}
                </>
              ) : <p className="text-gray-500 italic text-sm text-center py-4">No activity.</p>}
            </div>
          </div>
        </div>
      )}

      {/* MAIN STAGE (70%) -  */}
      <section className="w-[70%] p-10 border-r border-[#1F2937] flex flex-col relative overflow-y-auto">
        <header className="mb-10 shrink-0 flex justify-between items-end">
          <div><div className="flex items-center gap-3 mb-2"><div className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"></div><p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.3em] uppercase">System Live</p></div><h1 className="text-white font-black text-6xl tracking-tighter italic uppercase">Finance<span className="text-[#38BDF8]">_Rail</span></h1></div>
          <div className="flex bg-[#0B1117] border border-[#1F2937] p-1 rounded-lg">
            <button onClick={() => setActiveView('history')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${activeView === 'history' ? 'bg-[#38BDF8] text-[#030712]' : 'text-gray-500 hover:text-white'}`}>Historical Flow</button>
            <button onClick={() => setActiveView('forecast')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${activeView === 'forecast' ? 'bg-[#818CF8] text-[#030712]' : 'text-gray-500 hover:text-white'}`}>Runway Forecast</button>
          </div>
        </header>

        <div className="h-[400px] shrink-0 bg-[#0B1117] border border-[#1F2937] rounded-xl p-8 relative shadow-2xl overflow-hidden group mb-8">
          {activeView === 'history' ? (
            <div className="absolute top-6 left-8 right-8 z-10 flex justify-between items-start pointer-events-none"><div><p className="text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase opacity-60">{timeRange}D_SPENDING_VELOCITY</p><h3 className="text-2xl font-bold mt-1">Institutional Flow</h3></div>
            <div className="flex gap-2 pointer-events-auto">{[7, 30, 60, 90].map(days => (<button key={days} onClick={() => setTimeRange(days)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${timeRange === days ? 'bg-[#38BDF8] text-[#030712]' : 'bg-[#030712] text-gray-500 border border-[#1F2937] hover:border-[#38BDF8]'}`}>{days} Days</button>))}</div></div>
          ) : (<div className="absolute top-6 left-8 z-10 pointer-events-none"><p className="text-[#818CF8] text-[10px] font-bold tracking-widest uppercase opacity-60">DETERMINISTIC_MODELING</p><h3 className="text-2xl font-bold mt-1">Cash Runway Burn-Down</h3></div>)}
          
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" className="cursor-pointer">
              {activeView === 'history' ? (
                <AreaChart data={dynamicTransactions} margin={{ top: 70, right: 0, left: -20, bottom: 0 }} onClick={(e: any) => { if (e && e.activeLabel) setSelectedDate(e.activeLabel); }}>
                  <defs><linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/><stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} /><XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} /><Tooltip contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }} itemStyle={{ color: '#38BDF8', fontWeight: 'bold' }} cursor={{ stroke: '#38BDF8', strokeWidth: 1 }} formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Daily Disbursement']} /><Area type="monotone" dataKey="amount" stroke="#38BDF8" fillOpacity={1} fill="url(#cyanGradient)" strokeWidth={3} animationDuration={1000} activeDot={{ r: 6, fill: '#030712', stroke: '#38BDF8', strokeWidth: 2 }} />
                </AreaChart>
              ) : (
                <AreaChart data={forecastData} margin={{ top: 90, right: 20, left: -10, bottom: 0 }} onClick={(e: any) => { if (e && e.activeLabel) setSelectedDate(e.activeLabel); }}>
                  <defs><linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818CF8" stopOpacity={0.5}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} /><XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }} 
                    itemStyle={{ color: '#818CF8', fontWeight: 'bold' }} 
                    cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: "5 5" }} 
                    formatter={(value: number, name: string, props: any) => [
                      `₹${value.toLocaleString()}`, 
                      props.payload.isBillDay ? 'Balance (Automated Bill Hit!)' : 'Projected Liquidity'
                    ]} 
                  />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Zero Liquidity Line', fill: '#ef4444', fontSize: 10 }} />
                  <Area type="monotone" dataKey="balance" stroke="#818CF8" fillOpacity={1} fill="url(#indigoGradient)" strokeWidth={3} animationDuration={1500} activeDot={{ r: 6, fill: '#030712', stroke: '#818CF8', strokeWidth: 2 }} dot={(props: any) => props.payload.isBillDay ? <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="#0B1117" strokeWidth={2} /> : null} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#0B1117] border border-[#1F2937] rounded-xl p-8 shadow-2xl shrink-0">
          <div className="flex justify-between items-end mb-6"><div><p className="text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase opacity-60">Phase 1 Baseline</p><h3 className="text-2xl font-bold mt-1">Transaction Ledger</h3></div>
          <input type="text" placeholder="Search merchants..." className="bg-[#030712] border border-[#1F2937] text-white px-4 py-2 rounded-lg focus:border-[#38BDF8] w-72 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-[#818CF8] text-[10px] uppercase tracking-widest border-b border-[#1F2937]"><tr><th className="pb-3">Date</th><th className="pb-3">Merchant</th><th className="pb-3">Category</th><th className="pb-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-[#1F2937]/50">{filteredTableTransactions.map((tx: any) => (<tr key={tx.transaction_id} className="hover:bg-[#1F2937]/20 group"><td className="py-4 text-gray-500 font-mono text-xs">{tx.date}</td><td className="py-4 font-bold text-gray-300">{tx.name}</td><td className="py-4"><span className={`px-2 py-1 bg-[#030712] border ${tx.category.includes('Income') ? 'border-green-400/50 text-green-400' : 'border-[#1F2937] text-gray-400'} rounded text-[9px] font-bold uppercase`}>{tx.category[0]}</span></td><td className={`py-4 text-right font-mono font-bold ${tx.category.includes('Income') ? 'text-green-400' : 'text-[#38BDF8]'}`}>{tx.category.includes('Income') ? '+' : ''}₹{tx.amount.toFixed(2)}</td></tr>))}</tbody></table></div>
        </div>
      </section>

      {/* INTELLIGENCE SIDEBAR (30%) -  */}
      <aside className="w-[30%] bg-[#0B1117] p-10 border-l border-[#1F2937] overflow-y-auto flex flex-col gap-10">
        
        {/* STORYLINE SECTION - [cite: 31, 63] */}
        <section>
          <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.2em] mb-4 uppercase">Institutional Storyline</p>
          <div className="p-5 bg-[#030712] border border-[#38BDF8]/20 rounded-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-colors">
            <div className={`absolute top-0 left-0 w-1 h-full ${dynamicOutflow > dynamicIncome ? 'bg-red-500' : 'bg-[#38BDF8]'}`}></div>
            <p className="text-white font-bold text-sm leading-relaxed">
              Your {timeRange}-day <span className="text-[#38BDF8] italic">{topCategory}</span> volume is the primary driver of institutional outflow. 
              {dynamicOutflow > dynamicIncome ? (
                <span className="block mt-2 text-red-400">CRITICAL: Your disbursement rate is {Math.abs(savingsRate).toFixed(1)}% higher than income. Liquidity correction recommended.</span>
              ) : (
                <span className="block mt-2 text-green-400">EFFICIENCY: You are retaining {savingsRate.toFixed(1)}% of your institutional flow. Current velocity builds liquidity.</span>
              )}
            </p>
          </div>
        </section>

        <section>
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1">{timeRange}D Net Gap</p>
          <h2 className={`text-4xl font-black ${dynamicIncome > dynamicOutflow ? 'text-green-400' : 'text-red-400'}`}>₹{(dynamicIncome - dynamicOutflow).toLocaleString('en-IN')}</h2>
        </section>

        {/* WHY THIS MATTERS - [cite: 64] */}
        <section className="bg-[#030712] p-6 border border-[#1F2937] rounded-lg">
          <h3 className="text-[#38BDF8] text-[10px] font-bold mb-3 uppercase tracking-[0.15em]">Why This Matters</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{data.sidebar.why_it_matters}</p>
        </section>

        {/* PREDICTIVE ADVISOR - [cite: 23, 25] */}
        <section className="bg-[#030712] p-6 border border-[#818CF8]/40 rounded-lg group hover:border-[#818CF8]/60 transition-all shadow-[0_0_15px_rgba(129,140,248,0.05)]">
          <h3 className="text-[#818CF8] text-[10px] font-bold mb-2 uppercase tracking-[0.15em]">Predictive Advisor</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-white text-5xl font-black tracking-tighter">{dynamicRunway}</p>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Days Left</span>
          </div>
          <p className="text-[#818CF8] text-[11px] mt-3 font-bold leading-snug">
            Cash depletion expected on {depletionDateString}.
          </p>
          <p className="text-gray-500 text-[9px] mt-1 italic">GPS: Spending velocity at current average of ₹{dailyBurnRate.toFixed(0)}/day will exhaust institutional rails by this date.</p>
        </section>

        <section className="flex-1">
          <h3 className="text-[#38BDF8] text-[10px] font-bold mb-5 uppercase tracking-[0.15em]">Ghost Rails ({timeRange}D)</h3>
          <div className="space-y-4">
            {dynamicInsights.length > 0 ? dynamicInsights.map((sub: any) => (
              <div key={sub.name} className="p-5 bg-[#030712] border border-[#1F2937] rounded-lg shadow-inner"><h4 className="text-white text-lg font-bold">{sub.name}</h4><div className="flex justify-between items-end mt-2 border-t border-[#1F2937]/50 pt-2"><div><p className="text-[9px] text-gray-500 uppercase">Hit {sub.occurrencesInWindow}x</p><p className="text-xl font-black text-[#818CF8]">₹{sub.amount}</p></div><div className="text-right"><p className="text-[9px] text-red-500/80 font-bold uppercase">Total Leak</p><p className="text-xl font-black text-red-400">₹{sub.total_spent_window.toFixed(2)}</p></div></div></div>
            )) : <p className="text-gray-600 text-[10px] italic text-center py-4 border border-dashed border-[#1F2937] rounded-lg uppercase tracking-widest">No leaks detected.</p>}
          </div>
        </section>

        <section className="pt-6 border-t border-[#1F2937]">
          <p className="text-gray-500 text-[9px] font-bold tracking-[0.2em] mb-4 uppercase">Data Portability</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={downloadCSV} className="py-3 bg-[#0B1117] border border-[#1F2937] text-white font-bold text-[9px] uppercase rounded hover:border-[#38BDF8] transition-colors">Excel / CSV</button>
            <button onClick={downloadJSON} className="py-3 bg-[#0B1117] border border-[#1F2937] text-white font-bold text-[9px] uppercase rounded hover:border-[#38BDF8] transition-colors">Institutional JSON</button>
          </div>
          <button className="w-full mt-3 py-5 bg-[#38BDF8] text-[#030712] font-black text-[10px] uppercase rounded shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:bg-white transition-all" onClick={() => window.print()}>Generate Protocol Report</button>
        </section>
      </aside>
    </main>
  );
}