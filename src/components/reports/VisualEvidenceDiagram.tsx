import React from 'react';
import { VisualEvidenceFigure } from '../../types/reports';

interface VisualEvidenceDiagramProps {
  figure: VisualEvidenceFigure;
  isDark?: boolean;
}

export const VisualEvidenceDiagram: React.FC<VisualEvidenceDiagramProps> = ({ figure }) => {
  // Helper to render highlight callout boxes & badges over any diagram
  const renderAnnotations = () => {
    if (!figure.annotations || figure.annotations.length === 0) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {figure.annotations.map((ann) => (
          <div
            key={ann.id}
            style={{
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              width: ann.width ? `${ann.width}%` : 'auto',
              height: ann.height ? `${ann.height}%` : 'auto',
            }}
            className="absolute border-2 border-dashed border-red-500 bg-red-500/15 rounded shadow-lg flex flex-col justify-between p-1 transition-all"
          >
            {ann.label && (
              <span className="self-start -mt-3.5 -ml-1 bg-red-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md border border-red-400 whitespace-nowrap">
                ⚠️ {ann.label}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // If a technician uploaded a custom screenshot base64/url, render it with annotations
  if (figure.imageUrl) {
    return (
      <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded border border-slate-700 overflow-hidden flex items-center justify-center">
        <img
          src={figure.imageUrl}
          alt={figure.title}
          className="w-full h-full object-contain"
        />
        {renderAnnotations()}
      </div>
    );
  }

  // Pre-rendered high-fidelity diagrams matching the PDF figures
  switch (figure.diagramType) {
    case 'jace_resource':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#0a121e] border border-slate-700 rounded p-2 text-white font-mono text-[10px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          {/* Niagara Resource Monitor Window */}
          <div className="flex items-center justify-between border-b border-slate-700 pb-1 text-slate-300">
            <span className="font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Resource Monitor [JACE-8000 (89% Heap Utilized)]
            </span>
            <span className="text-[9px] text-slate-400">sys:ResourceMonitor</span>
          </div>

          {/* Graph & Pie layout */}
          <div className="grid grid-cols-3 gap-2 flex-1 my-1 items-center">
            {/* CPU & Memory Waveform */}
            <div className="col-span-2 h-full bg-[#050b14] border border-slate-800 rounded p-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="text-[9px] text-slate-400 flex justify-between">
                <span>CPU & Mem (Sawtooth Spike)</span>
                <span className="text-red-400 font-bold">53 MB Free / 494 MB</span>
              </div>
              {/* Simulated sawtooth graph */}
              <svg className="w-full h-24 overflow-visible" viewBox="0 0 200 60">
                <path
                  d="M0,45 L20,35 L40,50 L45,15 L60,48 L75,40 L90,52 L95,12 L110,46 L130,38 L140,55 L145,10 L160,42 L180,36 L195,50 L200,48"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <path
                  d="M0,30 L30,28 L60,32 L90,27 L120,30 L150,25 L180,28 L200,26"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {/* Red Callout Box */}
                <rect x="85" y="5" width="22" height="52" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 1" />
              </svg>
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>00:00</span>
                <span>GC Thrashing Cycle</span>
                <span>24:00</span>
              </div>
            </div>

            {/* Heap Dial / Pie chart */}
            <div className="h-full bg-[#050b14] border border-slate-800 rounded p-1.5 flex flex-col items-center justify-center text-center relative">
              <div className="relative w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-950/30">
                <span className="text-xs font-bold text-red-400">89.2%</span>
                <div className="absolute -top-1 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <span className="text-[9px] text-red-400 font-bold mt-1">CRITICAL HEAP</span>
              <span className="text-[8px] text-slate-400">GC Limit Near Max</span>
            </div>
          </div>

          {/* Bottom Table Values */}
          <div className="bg-[#030712] border border-slate-800 rounded p-1 grid grid-cols-4 gap-1 text-[8px]">
            <div><span className="text-slate-500">Heap Free:</span> <strong className="text-red-400">53.2 MB</strong></div>
            <div><span className="text-slate-500">Heap Max:</span> 494.0 MB</div>
            <div><span className="text-slate-500">Threads:</span> 142</div>
            <div><span className="text-slate-500">FD Count:</span> 812</div>
          </div>
        </div>
      );

    case 'polling_service':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#0a121e] border border-slate-700 rounded p-2 text-white font-mono text-[10px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          <div className="flex items-center justify-between border-b border-slate-700 pb-1 text-slate-300">
            <span className="font-bold text-sky-400">BacnetMultiPollService — Policy Distribution</span>
            <span className="text-[9px] text-amber-400 font-bold">Unbalanced 5s Load</span>
          </div>

          {/* Polling Distribution Table */}
          <div className="flex-1 my-1 overflow-hidden bg-[#050b14] border border-slate-800 rounded">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                  <th className="p-1 text-left">Policy Name</th>
                  <th className="p-1 text-left">Interval</th>
                  <th className="p-1 text-right">Points</th>
                  <th className="p-1 text-right">Poll %</th>
                  <th className="p-1 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="bg-red-950/30 border-l-2 border-red-500 text-red-200">
                  <td className="p-1 font-bold">Normal Poll</td>
                  <td className="p-1">5.000s</td>
                  <td className="p-1 text-right font-bold">1,058</td>
                  <td className="p-1 text-right font-bold text-red-400">84.0%</td>
                  <td className="p-1 text-center text-red-400 font-bold">OVERLOAD</td>
                </tr>
                <tr className="text-slate-400">
                  <td className="p-1">Fast Poll</td>
                  <td className="p-1">1.000s</td>
                  <td className="p-1 text-right">0</td>
                  <td className="p-1 text-right">0.0%</td>
                  <td className="p-1 text-center text-slate-500">Unused</td>
                </tr>
                <tr className="text-slate-400">
                  <td className="p-1">Slow Poll</td>
                  <td className="p-1">30.000s</td>
                  <td className="p-1 text-right">0</td>
                  <td className="p-1 text-right">0.0%</td>
                  <td className="p-1 text-center text-slate-500">Unused</td>
                </tr>
                <tr className="text-slate-300">
                  <td className="p-1">COV Subscriptions</td>
                  <td className="p-1">Event-Driven</td>
                  <td className="p-1 text-right">202</td>
                  <td className="p-1 text-right">16.0%</td>
                  <td className="p-1 text-center text-emerald-400 font-bold">Active</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-red-950/40 border border-red-800/60 rounded p-1.5 flex items-center justify-between text-[9px] text-red-300">
            <span>⚠️ 3,051,840+ polls/day hitting single 5s thread</span>
            <span className="font-bold">Recommendation: Tier to 30s/60s</span>
          </div>
        </div>
      );

    case 'app_director':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-black border border-slate-700 rounded p-2 text-emerald-400 font-mono text-[9px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400">
            <span className="font-bold text-slate-200">Application Director — Station Console Log</span>
            <span className="text-red-400 font-bold bg-red-950/60 px-1 rounded border border-red-800">BACnet ID Collision</span>
          </div>

          {/* Console Text stream */}
          <div className="flex-1 my-1 p-1 bg-black/90 rounded border border-slate-900 overflow-y-auto space-y-1 font-mono leading-tight">
            <div className="text-slate-500">2026-08-26 14:12:01 INFO [bacnet.client] Initializing BacnetNetwork...</div>
            <div className="text-red-400 bg-red-950/40 p-0.5 rounded border-l-2 border-red-500 font-bold">
              [SEVERE] Duplicate Object ID:device:70031 used by AHU3_VFD! Resetting to old id:device:70032
            </div>
            <div className="text-amber-400">2026-08-26 14:12:16 WARN [bacnet.mstp] Token pass timeout on MAC 1 (AHU3_VFD)</div>
            <div className="text-red-400 bg-red-950/40 p-0.5 rounded border-l-2 border-red-500 font-bold">
              [SEVERE] Duplicate Object ID:device:70031 used by AHU3_VFD! Resetting to old id:device:70032
            </div>
            <div className="text-slate-500">2026-08-26 14:12:31 INFO [bacnet.poll] Re-syncing device 70032 point bindings...</div>
            <div className="text-red-400 bg-red-950/40 p-0.5 rounded border-l-2 border-red-500 font-bold">
              [SEVERE] Duplicate Object ID:device:70031 used by AHU3_VFD! Resetting to old id:device:70032
            </div>
          </div>

          <div className="text-[8px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
            <span>Danfoss FC-101 VFD Parameter 8-70 uncommitted</span>
            <span className="text-amber-400 font-bold">Loop every 15 seconds</span>
          </div>
        </div>
      );

    case 'chiller_plant':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#061224] border border-slate-700 rounded p-2 text-white font-mono text-[9px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          <div className="flex items-center justify-between border-b border-sky-900/60 pb-1">
            <span className="font-bold text-sky-300">Central Chilled Water Plant (CH-1 & CHW Loop)</span>
            <span className="bg-red-900/60 text-red-300 px-1 rounded border border-red-700 font-bold">4 Active Alarms</span>
          </div>

          {/* Plant Graphic Schematic */}
          <div className="flex-1 my-1 relative bg-[#020a16] border border-sky-950 rounded p-2 flex items-center justify-between">
            {/* Chiller 1 Block */}
            <div className="w-28 bg-slate-900 border-2 border-sky-500 rounded p-1.5 flex flex-col gap-1 text-[8px] shadow-lg">
              <span className="font-bold text-sky-400 border-b border-slate-800 pb-0.5">CHILLER 1 (Lead)</span>
              <div className="flex justify-between"><span>Status:</span> <strong className="text-emerald-400">RUNNING</strong></div>
              <div className="flex justify-between"><span>CHWS Temp:</span> <strong className="text-emerald-400">44.0°F</strong></div>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                <span>Flow Switch:</span> <span>NO FLOW</span>
              </div>
              <div className="flex justify-between text-sky-300">
                <span>Flow Meter:</span> <span>221.3 gpm</span>
              </div>
            </div>

            {/* Piping Loop with Sensors */}
            <div className="flex-1 px-3 flex flex-col justify-around h-full relative">
              {/* Supply Header Pipe */}
              <div className="h-3 bg-gradient-to-r from-sky-600 to-sky-400 rounded-full flex items-center justify-between px-2 relative">
                <span className="text-[7px] font-bold text-slate-950">SUPPLY (CHWS)</span>
                {/* Loop Supply Alarm Callout */}
                <div className="absolute -top-5 right-2 bg-red-600 text-white font-bold px-1 rounded border border-red-300 animate-bounce">
                  Loop Supply: 54.2°F (ALARM)
                </div>
              </div>

              {/* Return Header Pipe with Corrupted Sensor */}
              <div className="h-3 bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-full flex items-center justify-between px-2 relative mt-4">
                <span className="text-[7px] font-bold text-white">RETURN (CHWR)</span>
                {/* Loop Return TS-1 Sensor in Alarm */}
                <div className="absolute -bottom-5 right-4 bg-red-600 text-white font-bold px-1 rounded border border-red-300 animate-pulse">
                  TS-1 Return: 302.1°F (CORRUPTED)
                </div>
              </div>
            </div>

            {/* Primary Pump PCHWP-2 */}
            <div className="w-24 bg-slate-900 border-2 border-red-500 rounded p-1.5 flex flex-col gap-1 text-[8px] shadow-lg">
              <span className="font-bold text-amber-400 border-b border-slate-800 pb-0.5">PCHWP-2</span>
              <div className="flex justify-between"><span>Cmd:</span> <strong>STOP</strong></div>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/80 px-0.5 rounded">
                <span>Alarm:</span> <span>HAND ALARM</span>
              </div>
              <div className="text-[7px] text-slate-400">Verified Auto in field</div>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 flex justify-between border-t border-sky-950 pt-1">
            <span>Binding mismatch on Loop Supply vs CHWS output</span>
            <span className="text-red-400 font-bold">Flow Switch Defective</span>
          </div>
        </div>
      );

    case 'ahu_graphic':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#071324] border border-slate-700 rounded p-2 text-white font-mono text-[9px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-bold text-emerald-400">{figure.title}</span>
            <span className="bg-red-950 text-red-300 px-1 rounded border border-red-700 font-bold">PX Graphic View</span>
          </div>

          {/* AHU Schematic */}
          <div className="flex-1 my-1 bg-[#030914] border border-slate-800 rounded p-2 flex items-center justify-between relative overflow-hidden">
            {/* Outside Air Section with AFMS & Damper */}
            <div className="w-24 bg-slate-900 border border-slate-700 rounded p-1 flex flex-col gap-0.5 text-[8px]">
              <span className="font-bold text-sky-400 border-b border-slate-800">OUTSIDE AIR</span>
              <div className="flex justify-between"><span>OAD Pos:</span> <strong className="text-amber-400">100%</strong></div>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                <span>OA Flow:</span> <span>177 CFM</span>
              </div>
              <div className="text-[7px] text-slate-400">Setpoint: 1,400 CFM</div>
            </div>

            {/* Filter Section in Alarm */}
            <div className="w-16 bg-red-950/40 border-2 border-red-500 rounded p-1 flex flex-col items-center justify-center text-center text-[7px] animate-pulse">
              <span className="font-bold text-red-400">FILTERS</span>
              <span className="text-red-300 font-extrabold mt-0.5">ALARM</span>
              <span className="text-[6px] text-slate-400">Pre & Final</span>
            </div>

            {/* Cooling Coil & Hunting Valve */}
            <div className="w-24 bg-slate-900 border-2 border-red-500 rounded p-1 flex flex-col gap-0.5 text-[8px] relative">
              <span className="font-bold text-sky-400 border-b border-slate-800">COOLING COIL</span>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                <span>CHW Valve:</span> <span>100% (Pri 16)</span>
              </div>
              <div className="flex justify-between text-sky-300"><span>SA Temp:</span> <strong className="text-red-400 font-bold">49.8°F</strong></div>
              <div className="text-[7px] text-slate-400">Setpoint: 55.0°F</div>
              <div className="absolute -top-3 right-0 bg-red-600 text-white text-[7px] font-bold px-1 rounded">
                OVERCOOLING
              </div>
            </div>

            {/* Supply Fan Section */}
            <div className="w-24 bg-slate-900 border border-slate-700 rounded p-1 flex flex-col gap-0.5 text-[8px]">
              <span className="font-bold text-emerald-400 border-b border-slate-800">SUPPLY FAN</span>
              <div className="flex justify-between"><span>Command:</span> <strong>START (20%)</strong></div>
              <div className="flex justify-between text-emerald-400"><span>Status:</span> <strong>RUNNING</strong></div>
              <div className="flex justify-between text-slate-400"><span>VFD Freq:</span> <strong>32.4 Hz</strong></div>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
            <span>Airflow measuring station (AFMS) differential calibration failure</span>
            <span className="text-red-400 font-bold">Freeze Stat Trip Risk</span>
          </div>
        </div>
      );

    case 'fcu_graphic':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#08152b] border border-slate-700 rounded p-2 text-white font-mono text-[9px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-bold text-sky-300">{figure.title}</span>
            <span className="bg-red-900/60 text-red-300 px-1 rounded border border-red-700 font-bold">Tridium FCU Graphic</span>
          </div>

          {/* FCU Duct Schematic */}
          <div className="flex-1 my-1 bg-[#020a16] border border-slate-800 rounded p-2 flex items-center justify-between relative overflow-hidden">
            {/* Left Point Sheet */}
            <div className="w-28 bg-slate-900 border border-slate-700 rounded p-1.5 flex flex-col gap-0.5 text-[8px]">
              <span className="font-bold text-slate-300 border-b border-slate-800 pb-0.5">TERMINAL DATA</span>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                <span>Space Temp:</span> <span>74.7°F (SP 72°)</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Cooling Valve:</span> <span>100% {`{overridden}`}</span>
              </div>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/40 px-0.5 rounded">
                <span>Unit Mode:</span> <span>Unocc Heat @ 16</span>
              </div>
            </div>

            {/* FCU Duct Cutaway Graphic */}
            <div className="flex-1 px-2 flex items-center justify-center relative">
              <div className="w-full h-14 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded border border-slate-600 flex items-center justify-around px-2 relative">
                {/* Fan Icon */}
                <div className="w-8 h-8 rounded-full border border-emerald-400 flex items-center justify-center bg-emerald-950/60 text-[7px] text-emerald-300 font-bold">
                  FAN
                </div>
                {/* Cooling Coil Valve with Override arrow */}
                <div className="w-8 h-8 rounded border-2 border-amber-500 flex items-center justify-center bg-amber-950/60 text-[7px] text-amber-300 font-bold relative">
                  CCV
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[6px] font-extrabold px-0.5 rounded">
                    OVR: 100%
                  </div>
                </div>
                {/* Broken Electric Duct Heater Widget (Empty White Box as in PDF) */}
                <div className="w-10 h-10 bg-white border-2 border-red-500 rounded flex flex-col items-center justify-center text-center p-0.5 shadow-lg relative">
                  <span className="text-[6px] text-red-600 font-extrabold">BROKEN ORD</span>
                  <span className="text-[5px] text-slate-700">Empty Box</span>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[6px] font-bold px-1 rounded whitespace-nowrap">
                    Unbound EDH
                  </div>
                </div>
              </div>
            </div>

            {/* Right Status */}
            <div className="w-24 bg-slate-900 border border-slate-700 rounded p-1.5 flex flex-col gap-0.5 text-[8px]">
              <span className="font-bold text-slate-300 border-b border-slate-800 pb-0.5">DISCHARGE</span>
              <div className="text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                No DAT Sensor Installed
              </div>
              <div className="text-slate-400 mt-1">Schedule: OCCUPIED</div>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
            <span>Ghost Priority 16 write forcing Unoccupied Heat</span>
            <span className="text-amber-400 font-bold">Operator Override Active</span>
          </div>
        </div>
      );

    case 'vav_graphic':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#09152a] border border-slate-700 rounded p-2 text-white font-mono text-[9px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-bold text-sky-300">{figure.title}</span>
            <span className="bg-red-900/60 text-red-300 px-1 rounded border border-red-700 font-bold">VAV Terminal Box</span>
          </div>

          <div className="flex-1 my-1 bg-[#020a16] border border-slate-800 rounded p-2 flex items-center justify-between relative">
            <div className="w-28 bg-slate-900 border border-slate-700 rounded p-1.5 flex flex-col gap-0.5 text-[8px]">
              <span className="font-bold text-slate-300 border-b border-slate-800 pb-0.5">ZONE PARAMETERS</span>
              <div className="flex justify-between text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                <span>Space Temp:</span> <span>65.6°F (SP 72.2°)</span>
              </div>
              <div className="flex justify-between text-sky-300">
                <span>Airflow:</span> <strong>317.8 CFM</strong>
              </div>
              <div className="text-[7px] text-slate-400">Min Airflow SP: 270 CFM</div>
            </div>

            <div className="flex-1 px-3 flex flex-col items-center justify-center">
              <div className="w-full h-12 bg-slate-800 border border-slate-600 rounded flex items-center justify-around px-2 relative">
                <span className="text-[8px] text-sky-400 font-bold">VAV DAMPER (35%)</span>
                {/* Electric Reheat Sitting at 0% */}
                <div className="w-16 bg-red-950 border-2 border-red-500 rounded p-0.5 text-center text-[7px] text-red-300 font-bold animate-pulse">
                  REHEAT: 0.0%
                </div>
                <div className="absolute -top-3.5 right-4 bg-red-600 text-white text-[7px] font-bold px-1 rounded">
                  DA Temp: 51.9°F
                </div>
              </div>
            </div>

            <div className="w-24 bg-slate-900 border border-slate-700 rounded p-1.5 flex flex-col gap-0.5 text-[8px]">
              <span className="font-bold text-slate-300 border-b border-slate-800 pb-0.5">HEATING CALL</span>
              <div className="text-amber-400 font-bold">Call Active (100%)</div>
              <div className="text-red-400 font-bold bg-red-950/60 px-0.5 rounded">Elec Coil OFF</div>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
            <span>Reheat safety interlock or PID loop enable condition locked</span>
            <span className="text-red-400 font-bold">Zone Under-Temperature</span>
          </div>
        </div>
      );

    case 'exhaust_fan':
      return (
        <div className="relative w-full h-56 sm:h-64 bg-[#09152a] border border-slate-700 rounded p-2 text-white font-mono text-[9px] select-none flex flex-col justify-between overflow-hidden shadow-inner">
          {renderAnnotations()}
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-bold text-sky-300">{figure.title}</span>
            <span className="bg-red-900/60 text-red-300 px-1 rounded border border-red-700 font-bold">Exhaust Fan Alarms</span>
          </div>

          <div className="flex-1 my-1 grid grid-cols-2 gap-2">
            {/* EF-2 Card */}
            <div className="bg-[#040c18] border-2 border-red-500 rounded p-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between text-slate-300 font-bold border-b border-slate-800 pb-0.5">
                  <span>EF-2 (Battery Workshop)</span>
                  <span className="text-red-400">FAIL ALARM</span>
                </div>
                <div className="mt-2 space-y-1 text-[8px]">
                  <div className="flex justify-between"><span>Command:</span> <strong className="text-emerald-400">START (ON)</strong></div>
                  <div className="flex justify-between text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                    <span>Status Proof (CT):</span> <span>STOPPED</span>
                  </div>
                  <div className="text-[7px] text-slate-400">Fan mechanically running in field</div>
                </div>
              </div>
              <span className="text-[7px] text-amber-400">Cause: CT threshold calibrated too high</span>
            </div>

            {/* EF-4 Card */}
            <div className="bg-[#040c18] border-2 border-red-500 rounded p-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between text-slate-300 font-bold border-b border-slate-800 pb-0.5">
                  <span>EF-4 (Restrooms 131/136)</span>
                  <span className="text-red-400">NUISANCE ALARM</span>
                </div>
                <div className="mt-2 space-y-1 text-[8px]">
                  <div className="flex justify-between"><span>Command:</span> <strong className="text-slate-400">STOP (OFF)</strong></div>
                  <div className="flex justify-between"><span>Status Proof:</span> <strong className="text-slate-400">STOPPED</strong></div>
                  <div className="text-red-400 font-bold bg-red-950/60 px-0.5 rounded">
                    Alarm Block: EVALUATING IN OFF
                  </div>
                </div>
              </div>
              <span className="text-[7px] text-amber-400">Cause: Missing Load-to-Status Latency (L2SL) block</span>
            </div>
          </div>

          <div className="text-[8px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
            <span>Current switch threshold & latching alarm logic errors</span>
            <span className="text-emerald-400 font-bold">2 Units Affected</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-56 sm:h-64 bg-slate-900 border border-slate-700 rounded flex flex-col items-center justify-center text-slate-400 p-4 text-center">
          <span className="text-sm font-bold text-slate-300 mb-1">{figure.title}</span>
          <span className="text-xs text-slate-500">Visual proof graphic captured from ECS Workbench Studio</span>
        </div>
      );
  }
};
