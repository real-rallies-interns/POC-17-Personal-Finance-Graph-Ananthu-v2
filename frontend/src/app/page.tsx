'use client';
import { useEffect, useState } from 'react';

export default function RealRailsDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/intelligence/rail-data')
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  if (!data) return <div className="bg-[#030712] text-[#38BDF8] p-10">Initializing Rail...</div>;

  return (
    <main className="flex h-screen bg-[#030712] overflow-hidden text-white">
      {/* MAIN STAGE (70%) - For Visualization [cite: 26] */}
      <section className="w-[70%] p-8 border-r border-[#1F2937] overflow-y-auto">
        <h1 className="text-[#38BDF8] font-black text-4xl mb-8 tracking-tighter">FINANCE_RAIL_v1.0</h1>
        <div className="h-64 bg-[#0B1117] border border-[#1F2937] rounded-lg p-6 mb-8 flex items-center justify-center">
          <p className="text-gray-500 italic">Analytical Graph Visualization Placeholder</p>
        </div>
      </section>

      {/* INTELLIGENCE SIDEBAR (30%)  */}
      <aside className="w-[30%] bg-[#0B1117] p-8 border-l border-[#1F2937] flex flex-col gap-8">
        <div>
          <p className="text-[#38BDF8] text-xs font-bold tracking-widest mb-2 uppercase">Intelligence Sidebar</p>
          <h2 className="text-3xl font-bold">${data.sidebar.metrics.total_spent}</h2>
        </div>

        <div>
          <h3 className="text-[#38BDF8] text-xs font-bold mb-2 uppercase">Why This Matters</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{data.sidebar.why_it_matters}</p>
        </div>

        <div>
          <h3 className="text-[#38BDF8] text-xs font-bold mb-2 uppercase">Ghost Alerts</h3>
          {data.sidebar.insights.map((sub: any) => (
            <div key={sub.name} className="p-4 bg-[#030712] border border-[#1F2937] rounded mb-2">
              <p className="text-[#818CF8] font-bold">{sub.name}</p>
              <p className="text-xl font-black">${sub.amount}</p>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}