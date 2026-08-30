import React from 'react';
import { PaletteItem } from '../types/niagara';
import {
  X,
  Plus,
  Info,
  Package,
  Layers,
  Cpu,
  Zap,
  Sliders,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface BlockInfoModalProps {
  item: PaletteItem | null;
  onClose: () => void;
  onAddBlock: (item: PaletteItem) => void;
}

export const BlockInfoModal: React.FC<BlockInfoModalProps> = ({
  item,
  onClose,
  onAddBlock,
}) => {
  const { theme } = useNiagaraTheme();

  if (!item) return null;

  // Generate clear default explanations and usage examples if not explicitly set
  const explanation =
    item.detailedExplanation || getFallbackExplanation(item);
  const example = item.usageExample || getFallbackUsageExample(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-400 bg-white text-black flex flex-col overflow-hidden">
        {/* Color Top Accent Banner */}
        <div
          className="h-2.5 w-full shrink-0"
          style={{ backgroundColor: item.color || '#0284c7' }}
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-300 bg-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md shrink-0"
              style={{ backgroundColor: item.color || '#0284c7' }}
            >
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black tracking-tight truncate text-black">
                  {item.label}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-400 text-black border border-amber-600">
                  {item.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono mt-0.5 font-black text-black">
                <span className="flex items-center gap-1 text-black font-black">
                  <Package className="w-3.5 h-3.5 text-sky-700" />
                  {item.palette}.jar
                </span>
                <span className="text-black font-black">•</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-200 border border-slate-300 text-[10px] font-black text-black">
                  {item.category}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-black hover:bg-slate-200 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white text-black">
          {/* Section 1: Understandable Explanation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-black tracking-wider">
              <Info className="w-4 h-4 text-sky-700 stroke-[2.5]" />
              <span className="text-black font-black">What This Block Is & Does</span>
            </div>
            <p className="text-sm leading-relaxed text-black bg-sky-50 p-3.5 rounded-xl border border-sky-300 font-sans font-bold">
              {explanation}
            </p>
          </div>

          {/* Section 2: Real-World HVAC Controls Usage Example */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-black tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-700 stroke-[2.5]" />
              <span className="text-black font-black">Real-World Control System Example</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 space-y-3 text-xs text-black">
              <div>
                <span className="font-black text-black text-xs block mb-1">
                  📌 Scenario: {example.scenario}
                </span>
                <p className="text-black leading-relaxed font-sans font-medium">
                  <strong className="text-black font-black">Wiring & Connection Setup:</strong> {example.setup}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-800 shrink-0 mt-0.5 stroke-[2.5]" />
                <p className="text-black font-medium font-sans">
                  <strong className="text-black font-black">Expected Control Output:</strong> {example.expectedResult}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Slots & Inputs / Outputs Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-black tracking-wider">
              <Layers className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span className="text-black font-black">Input & Output Slots</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Inputs */}
              <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 text-black">
                <div className="font-black text-black mb-2 flex items-center justify-between">
                  <span className="text-black font-black">Input Slots ({item.defaultInputs.length})</span>
                  <span className="text-[10px] text-black font-mono font-black">Receives Signals</span>
                </div>
                <div className="space-y-1.5 font-mono">
                  {item.defaultInputs.map((slot) => (
                    <div
                      key={slot.name}
                      className="p-1.5 rounded bg-slate-200/80 border border-slate-300 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-black text-black">{slot.name}</span>
                      <span className="text-black font-black text-[10px]">{slot.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 text-black">
                <div className="font-black text-black mb-2 flex items-center justify-between">
                  <span className="text-black font-black">Output Slots ({item.defaultOutputs.length})</span>
                  <span className="text-[10px] text-black font-mono font-black">Dispatches Signals</span>
                </div>
                <div className="space-y-1.5 font-mono">
                  {item.defaultOutputs.map((slot) => (
                    <div
                      key={slot.name}
                      className="p-1.5 rounded bg-slate-200/80 border border-slate-300 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-black text-black">{slot.name}</span>
                      <span className="text-black font-black text-[10px]">{slot.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configurable Properties */}
          {Object.keys(item.defaultProperties).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-black tracking-wider">
                <Sliders className="w-4 h-4 text-purple-700 stroke-[2.5]" />
                <span className="text-black font-black">Configurable Tuning Properties</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs text-black">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(item.defaultProperties).map(([propKey, propVal]) => (
                    <div key={propKey} className="flex items-center justify-between p-1.5 rounded bg-slate-200/80 border border-slate-300">
                      <span className="text-black font-black">{propKey}:</span>
                      <span className="text-black font-black">{String(propVal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-300 bg-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-black font-mono font-black">
            💡 Tip: Drag & drop directly to place anywhere on canvas
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-200 hover:bg-slate-300 text-black border border-slate-300"
            >
              Close
            </button>

            <button
              onClick={() => {
                onAddBlock(item);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all border border-amber-600"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Block to Wire Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getFallbackExplanation(item: PaletteItem): string {
  switch (item.type) {
    case 'LoopPoint':
      return 'The LoopPoint is a Proportional-Integral-Derivative (PID) loop controller. It measures a Process Variable (like Supply Air Temp) against a desired Setpoint, calculating a smooth 0-100% modulation signal for valves, dampers, or variable frequency drives.';
    case 'And':
      return 'The And block is a logic gate that outputs TRUE only when all connected active inputs are TRUE. If any input is FALSE, the output drops to FALSE immediately.';
    case 'Or':
      return 'The Or block outputs TRUE if at least one connected input is TRUE. It only outputs FALSE when all connected inputs are FALSE.';
    case 'Not':
      return 'The Not block (Inverter) flips boolean signals. Inputting TRUE produces FALSE, and inputting FALSE produces TRUE.';
    case 'Equal':
      return 'The Equal block compares two numeric inputs (In A and In B). It outputs TRUE if the difference between them is within the configured deadband margin.';
    case 'GreaterThan':
      return 'Compares In A and In B, outputting TRUE whenever In A is strictly greater than In B.';
    case 'LessThan':
      return 'Compares In A and In B, outputting TRUE whenever In A is strictly less than In B.';
    case 'Between':
      return 'Checks if a numeric input falls within specified Low Limit and High Limit boundaries, outputting TRUE while within range.';
    case 'Add':
      return 'Calculates the sum of all connected numeric inputs, providing an accurate total output.';
    case 'Subtract':
      return 'Subtracts Input B from Input A (InA - InB). Great for calculating pressure differentials across pumps or filters.';
    case 'Multiply':
      return 'Multiplies Input 1 by Input 2 (In1 × In2). Useful for scaling sensor values or calculating power load requirements.';
    case 'Divide':
      return 'Divides Input A by Input B with built-in zero-division safety protection to prevent station faults.';
    case 'Min':
      return 'Monitors multiple numeric inputs and automatically passes the lowest value to the output.';
    case 'Max':
      return 'Monitors multiple numeric inputs and passes the highest value to the output (e.g. highest zone cooling demand).';
    case 'Average':
      return 'Calculates the average (arithmetic mean) of all connected numeric inputs, ideal for multi-sensor space averaging.';
    case 'BooleanSwitch':
      return 'Acts as a electronic relay switch. When Switch Control is TRUE, it outputs InTrue. When Switch Control is FALSE, it outputs InFalse.';
    case 'NumericSwitch':
      return 'Routes either the Occupied Setpoint or Unoccupied Setpoint depending on the boolean Occupancy input signal.';
    case 'BooleanDelay':
      return 'Applies configurable Delay-On-Make and Delay-On-Break timers to prevent chatter on equipment run signals.';
    case 'OneShot':
      return 'Fires a clean, timed pulse of specified duration whenever the input transitions from FALSE to TRUE.';
    case 'MinOnHand':
      return 'Enforces anti-short-cycling by guaranteeing equipment stays running for a minimum duration once energized.';
    case 'RuntimeTotalizer':
      return 'Tracks total operating run hours and equipment start cycles to trigger maintenance alerts.';
    case 'Reset':
      return 'Calculates a dynamic setpoint reset curve (e.g. lowering Heating Water Setpoint as Outdoor Air Temp rises).';
    case 'LeadLagCycle':
      return 'Alternates lead and lag operation between dual pumps or chillers to equalize runtime and handle equipment trip faults.';
    case 'Tstat':
      return 'Thermostat logic controller with independent heating and cooling setpoints and deadband interlocks.';
    case 'BooleanWritable':
      return 'Standard Niagara 16-level priority array boolean point. Higher priority levels (like Priority 1 Life Safety or Priority 8 Operator) override lower levels.';
    case 'NumericWritable':
      return 'Standard Niagara 16-level priority array numeric point for setpoints and analog commands.';
    case 'AlarmSource':
      return 'Monitors a fault condition and dispatches a BMS Alarm to the Niagara Alarm Console after a time delay.';
    case 'OutOfRangeAlarm':
      return 'Triggers an alarm if a temperature or pressure reading strays above High Limit or below Low Limit.';
    case 'BooleanSchedule':
      return 'Weekly occupancy schedule block that outputs TRUE during scheduled operating hours.';
    default:
      return `${item.label} (${item.type}) provides ${item.category.toLowerCase()} processing inside ECS Workbench Studio wire sheets.`;
  }
}

function getFallbackUsageExample(item: PaletteItem): {
  scenario: string;
  setup: string;
  expectedResult: string;
} {
  switch (item.type) {
    case 'LoopPoint':
      return {
        scenario: 'AHU Supply Air Temperature Control',
        setup: 'Connect Supply Air Temp Sensor (72°F) to "controlledVariable" slot and Setpoint (70°F) to "setpoint" slot.',
        expectedResult: 'Calculates a 40% open command to the Chilled Water Valve to bring supply temp down to 70°F.',
      };
    case 'And':
      return {
        scenario: 'Air Handler Fan Start Interlock Safety',
        setup: 'Connect Occupancy Schedule to in1, Supply Fan Status to in2, and Duct High Pressure Limit Switch to in3.',
        expectedResult: 'Outputs TRUE to enable heating/cooling only when schedule is Occupied AND Fan is Running AND Pressure is Normal.',
      };
    case 'Or':
      return {
        scenario: 'Building Freeze Protection Loop',
        setup: 'Connect Low Temp Sensor 1 to in1 and Low Temp Sensor 2 to in2.',
        expectedResult: 'Outputs TRUE to open heating valves if EITHER sensor drops below freezing.',
      };
    case 'LeadLagCycle':
      return {
        scenario: 'Dual Chilled Water Pump Lead/Lag Alternation',
        setup: 'Connect System Enable to "enable" and Pump 1 Fault to "dev1Fault".',
        expectedResult: 'Runs Lead Pump 1. If Pump 1 trips a fault, instantly starts Lag Pump 2 to maintain chilled water flow.',
      };
    case 'Reset':
      return {
        scenario: 'Outdoor Air Temperature Heating Water Reset Curve',
        setup: 'Connect Outdoor Air Temp sensor (20°F) to "in" slot. Set Input Low=10°F/Output Low=180°F and Input High=60°F/Output High=120°F.',
        expectedResult: 'Automatically increases boiler supply water setpoint to 170°F on cold days and drops to 120°F on mild days.',
      };
    default:
      return {
        scenario: `Standard ${item.category} Wire Sheet Setup`,
        setup: `Connect field sensor point to input slot ${item.defaultInputs[0]?.name || 'in'}.`,
        expectedResult: `Processes logic according to ${item.type} parameters and outputs result to connected downstream point.`,
      };
  }
}
