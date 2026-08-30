import { NiagaraBlock, NiagaraLink, NiagaraBlockStatus } from '../types/niagara';

export interface InjectedFault {
  id: string;
  type: 'freeze_stat' | 'airflow_loss' | 'sensor_fault' | 'high_static' | 'power_loss';
  name: string;
  description: string;
  active: boolean;
  targetBlockId?: string;
}

export interface SimulationOptions {
  enableThermalDynamics?: boolean;
  injectedFaults?: InjectedFault[];
}

export interface SimulationResult {
  blockValues: Record<string, Record<string, any>>;
  blockStatuses: Record<string, NiagaraBlockStatus>;
  activeLinkIds: Set<string>;
}

/**
 * Helper to determine candidate value for a Writable point priority level (1..16).
 * Authentic Niagara N4 Priority Array resolution:
 * An input slot level is only active if:
 * 1. A priorityArray property value is set (User/Station Command), OR
 * 2. An explicit simulation override is active in currentOverrides, OR
 * 3. A WireSheet wire link is connected to this input slot and providing a value.
 */
function getWritableCandidate(
  block: NiagaraBlock,
  level: number,
  vals: Record<string, any>,
  props: Record<string, any>,
  currentOverrides: Record<string, Record<string, any>>,
  links: NiagaraLink[]
): any {
  const slotName = `in${level}`;

  // 1. Property priority array entry (User/Station Command)
  const propVal = props.priorityArray?.[level];
  if (propVal !== undefined && propVal !== null) {
    return propVal;
  }

  // 2. Simulation override in UI test bench
  const overrideVal = currentOverrides[block.id]?.[slotName];
  if (overrideVal !== undefined && overrideVal !== null) {
    return overrideVal;
  }

  // 3. Wired link connected to this slot
  const isWired = links.some((l) => l.toBlockId === block.id && l.toSlot === slotName);
  if (isWired && vals[slotName] !== undefined && vals[slotName] !== null) {
    return vals[slotName];
  }

  return null;
}

/**
 * Closed-Loop Physical Thermal Dynamics & Environmental Physics
 */
function applyThermalDynamics(
  blocks: NiagaraBlock[],
  blockValues: Record<string, Record<string, any>>,
  previousValues: Record<string, Record<string, any>>,
  currentOverrides: Record<string, Record<string, any>>
) {
  let fanActive = false;
  let coolingVal = 0;
  let heatingVal = 0;
  let oatVal = 75.0;

  // Scan across station blocks to detect active actuators & environmental context
  blocks.forEach((b) => {
    const vals = blockValues[b.id] || {};
    const nameLower = b.name.toLowerCase();

    // Fan Command
    if (
      nameLower.includes('fan') ||
      nameLower.includes('sf_') ||
      nameLower.includes('supplyfan') ||
      nameLower.includes('fan_cmd')
    ) {
      if (vals['out'] !== undefined) fanActive = Boolean(vals['out']);
      else if (vals['dev1Cmd'] !== undefined) fanActive = Boolean(vals['dev1Cmd']);
    }

    // Cooling Valve / Damper Output
    if (nameLower.includes('cool') || nameLower.includes('clg') || nameLower.includes('chw')) {
      const v = Number(vals['out'] ?? vals['in'] ?? 0);
      if (!isNaN(v)) coolingVal = Math.max(coolingVal, v);
    }

    // Heating Valve Output
    if (nameLower.includes('heat') || nameLower.includes('htg') || nameLower.includes('hhw')) {
      const v = Number(vals['out'] ?? vals['in'] ?? 0);
      if (!isNaN(v)) heatingVal = Math.max(heatingVal, v);
    }

    // Outdoor Air Temp (OAT)
    if (nameLower.includes('oat') || nameLower.includes('outdoor')) {
      const v = Number(vals['out'] ?? vals['in'] ?? 75);
      if (!isNaN(v)) oatVal = v;
    }
  });

  // Dynamic feedback update for Discharge Air Temp (DAT) and Zone Temp
  blocks.forEach((b) => {
    const nameLower = b.name.toLowerCase();
    const vals = blockValues[b.id];
    if (!vals) return;

    // Discharge Air Temp (DAT / SAT)
    if (
      (nameLower.includes('dat') ||
        nameLower.includes('discharge') ||
        nameLower.includes('supplyair')) &&
      currentOverrides[b.id]?.['out'] === undefined &&
      currentOverrides[b.id]?.['in'] === undefined
    ) {
      const prevDAT = Number(previousValues[b.id]?.['out'] ?? vals['out'] ?? 70.0);
      let targetDAT = oatVal;

      if (fanActive) {
        if (coolingVal > 5) {
          // Cooling active: DAT drops towards 52°F depending on valve modulation
          targetDAT = 52.0 + (1 - coolingVal / 100) * (oatVal - 52.0);
        } else if (heatingVal > 5) {
          // Heating active: DAT rises towards 105°F
          targetDAT = 70.0 + (heatingVal / 100) * 35.0;
        } else {
          // Mixed air ventilation DAT
          targetDAT = Math.min(oatVal, 68.0);
        }
      }

      // Smooth exponential thermal transition step
      const newDAT = Number((prevDAT + (targetDAT - prevDAT) * 0.25).toFixed(1));
      vals['out'] = newDAT;
      if (vals['in'] !== undefined) vals['in'] = newDAT;
    }

    // Space / Zone Temperature
    if (
      (nameLower.includes('space') ||
        nameLower.includes('zone') ||
        nameLower.includes('roomtemp')) &&
      currentOverrides[b.id]?.['out'] === undefined &&
      currentOverrides[b.id]?.['in'] === undefined
    ) {
      const prevSpace = Number(previousValues[b.id]?.['out'] ?? vals['out'] ?? 74.0);
      const datBlock = blocks.find(
        (x) =>
          x.name.toLowerCase().includes('dat') ||
          x.name.toLowerCase().includes('discharge')
      );
      const currentDAT = datBlock ? Number(blockValues[datBlock.id]?.['out'] ?? 55) : 55;

      let targetSpace = oatVal > 72 ? 78.0 : 64.0;
      if (fanActive) {
        targetSpace = currentDAT + (targetSpace - currentDAT) * 0.35;
      }

      const newSpace = Number((prevSpace + (targetSpace - prevSpace) * 0.08).toFixed(1));
      vals['out'] = newSpace;
      if (vals['in'] !== undefined) vals['in'] = newSpace;
    }

    // Duct Static Pressure
    if (
      (nameLower.includes('static') || nameLower.includes('pressure') || nameLower.includes('dsp')) &&
      currentOverrides[b.id]?.['out'] === undefined &&
      currentOverrides[b.id]?.['in'] === undefined
    ) {
      const prevDSP = Number(previousValues[b.id]?.['out'] ?? vals['out'] ?? 0.0);
      const targetDSP = fanActive ? 1.5 : 0.0; // 1.5 in. w.g. under fan operation
      const newDSP = Number((prevDSP + (targetDSP - prevDSP) * 0.3).toFixed(2));
      vals['out'] = newDSP;
      if (vals['in'] !== undefined) vals['in'] = newDSP;
    }
  });
}

/**
 * Apply Active Fault Injections
 */
function applyInjectedFaults(
  blocks: NiagaraBlock[],
  blockValues: Record<string, Record<string, any>>,
  blockStatuses: Record<string, NiagaraBlockStatus>,
  faults: InjectedFault[]
) {
  const activeFaults = faults.filter((f) => f.active);
  if (activeFaults.length === 0) return;

  activeFaults.forEach((fault) => {
    switch (fault.type) {
      case 'freeze_stat': {
        const target = blocks.find(
          (b) =>
            b.id === fault.targetBlockId ||
            b.name.toLowerCase().includes('freeze') ||
            b.name.toLowerCase().includes('lowtemp') ||
            b.name.toLowerCase().includes('safety')
        );
        if (target) {
          blockValues[target.id]['out'] = true;
          blockValues[target.id]['in'] = true;
          blockValues[target.id]['alarm'] = true;
          blockValues[target.id]['in1'] = true; // Priority 1 emergency trip!
          blockStatuses[target.id] = { ...blockStatuses[target.id], unackedAlarm: true, ok: false };
        }
        break;
      }

      case 'airflow_loss': {
        const target = blocks.find(
          (b) =>
            b.id === fault.targetBlockId ||
            b.name.toLowerCase().includes('proof') ||
            b.name.toLowerCase().includes('airflow') ||
            b.name.toLowerCase().includes('status')
        );
        if (target) {
          blockValues[target.id]['out'] = false;
          blockValues[target.id]['in'] = false;
          blockStatuses[target.id] = { ...blockStatuses[target.id], ok: false, fault: true };
        }
        break;
      }

      case 'sensor_fault': {
        const target = blocks.find(
          (b) =>
            b.id === fault.targetBlockId ||
            b.name.toLowerCase().includes('temp') ||
            b.name.toLowerCase().includes('sensor') ||
            b.name.toLowerCase().includes('oat')
        );
        if (target) {
          blockValues[target.id]['out'] = -999.0;
          blockValues[target.id]['in'] = -999.0;
          blockStatuses[target.id] = { ...blockStatuses[target.id], ok: false, down: true };
        }
        break;
      }

      case 'high_static': {
        const target = blocks.find(
          (b) =>
            b.id === fault.targetBlockId ||
            b.name.toLowerCase().includes('static') ||
            b.name.toLowerCase().includes('dsp') ||
            b.name.toLowerCase().includes('pressure')
        );
        if (target) {
          blockValues[target.id]['out'] = 3.8; // High static pressure trip (3.8 in. w.g.)
          blockValues[target.id]['in'] = 3.8;
          blockValues[target.id]['alarm'] = true;
          blockStatuses[target.id] = { ...blockStatuses[target.id], unackedAlarm: true, ok: false };
        }
        break;
      }

      case 'power_loss': {
        blocks.forEach((b) => {
          if (
            b.name.toLowerCase().includes('power') ||
            b.name.toLowerCase().includes('line') ||
            b.name.toLowerCase().includes('enable')
          ) {
            blockValues[b.id]['out'] = false;
            blockValues[b.id]['in'] = false;
            blockStatuses[b.id] = { ...blockStatuses[b.id], ok: false, down: true };
          }
        });
        break;
      }
    }
  });
}

export function runSimulationStep(
  blocks: NiagaraBlock[],
  links: NiagaraLink[],
  currentOverrides: Record<string, Record<string, any>> = {},
  previousValues: Record<string, Record<string, any>> = {},
  options: SimulationOptions = {}
): SimulationResult {
  const blockValues: Record<string, Record<string, any>> = {};
  const blockStatuses: Record<string, NiagaraBlockStatus> = {};
  const activeLinkIds = new Set<string>();

  // 1. Initialize block values from previous state, inputs/outputs, and overrides
  blocks.forEach((block) => {
    blockValues[block.id] = {};
    blockStatuses[block.id] = { ok: true, ...(block.status || {}) };

    const prevBlockVals = previousValues[block.id] || {};

    // Set input defaults
    (block.inputs || []).forEach((input) => {
      const overrideVal = currentOverrides[block.id]?.[input.name];
      if (overrideVal !== undefined) {
        blockValues[block.id][input.name] = overrideVal;
      } else if (prevBlockVals[input.name] !== undefined) {
        blockValues[block.id][input.name] = prevBlockVals[input.name];
      } else if (input.value !== undefined) {
        blockValues[block.id][input.name] = input.value;
      } else if (input.fallback !== undefined) {
        blockValues[block.id][input.name] = input.fallback;
      } else {
        blockValues[block.id][input.name] = null;
      }
    });

    // Set output defaults from previous values
    (block.outputs || []).forEach((output) => {
      const prevVal = prevBlockVals[output.name];
      blockValues[block.id][output.name] = prevVal !== undefined ? prevVal : (output.value ?? 0);
    });

    // Carry forward persistent internal state attributes
    ['_tickCount', '_onTimer', '_offTimer', 'elapsedTime', 'timeRemaining', 'hours', 'starts', 'integral', 'error'].forEach((key) => {
      if (prevBlockVals[key] !== undefined) {
        blockValues[block.id][key] = prevBlockVals[key];
      }
    });
  });

  // 2. Multi-pass signal propagation loop to settle wire connections across canvas
  const passes = Math.max(10, Math.min(blocks.length * 2, 25));

  for (let pass = 0; pass < passes; pass++) {
    const isLastPass = pass === passes - 1;

    // Propagate wire links
    links.forEach((link) => {
      const sourceBlock = blocks.find((b) => b.id === link.fromBlockId);
      const targetBlock = blocks.find((b) => b.id === link.toBlockId);

      if (sourceBlock && targetBlock) {
        const sourceVal = blockValues[sourceBlock.id]?.[link.fromSlot];
        if (sourceVal !== undefined && sourceVal !== null) {
          // If the target slot is not manually overridden, propagate wire value
          if (currentOverrides[targetBlock.id]?.[link.toSlot] === undefined) {
            blockValues[targetBlock.id][link.toSlot] = sourceVal;
          }

          // Mark wire as active if non-zero / true / active string
          if (
            sourceVal === true ||
            (typeof sourceVal === 'number' && Math.abs(sourceVal) > 0.001) ||
            (typeof sourceVal === 'string' && sourceVal.length > 0 && sourceVal !== '0')
          ) {
            activeLinkIds.add(link.id);
          }
        }
      }
    });

    // Evaluate logic for each block
    blocks.forEach((block) => {
      const vals = blockValues[block.id];
      const prevBlockVals = previousValues[block.id] || {};
      const props = block.properties || {};

      switch (block.type) {
        // --- LOGIC GATES ---
        case 'And': {
          const inVals = (block.inputs || [])
            .map((inp) => vals[inp.name])
            .filter((v) => v !== null && v !== undefined);
          vals['out'] = inVals.length > 0 && inVals.every((v) => Boolean(v));
          break;
        }

        case 'Or': {
          const inVals = (block.inputs || [])
            .map((inp) => vals[inp.name])
            .filter((v) => v !== null && v !== undefined);
          vals['out'] = inVals.length > 0 && inVals.some((v) => Boolean(v));
          break;
        }

        case 'Not': {
          const inVal = vals['in'] ?? vals['in1'];
          vals['out'] = !Boolean(inVal);
          break;
        }

        case 'Xor': {
          const in1 = Boolean(vals['in1'] ?? false);
          const in2 = Boolean(vals['in2'] ?? false);
          vals['out'] = in1 !== in2;
          break;
        }

        case 'Equal': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          const deadband = Number(props.deadband || 0.1);
          vals['out'] = Math.abs(inA - inB) <= deadband;
          break;
        }

        case 'NotEqual': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          const deadband = Number(props.deadband || 0.1);
          vals['out'] = Math.abs(inA - inB) > deadband;
          break;
        }

        case 'GreaterThan': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          vals['out'] = inA > inB;
          break;
        }

        case 'GreaterThanOrEqual': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          vals['out'] = inA >= inB;
          break;
        }

        case 'LessThan': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          vals['out'] = inA < inB;
          break;
        }

        case 'LessThanOrEqual': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          vals['out'] = inA <= inB;
          break;
        }

        case 'Between': {
          const inVal = Number(vals['in'] ?? vals['in1'] ?? 0);
          const low = Number(vals['lowLimit'] ?? props.lowLimit ?? 0);
          const high = Number(vals['highLimit'] ?? props.highLimit ?? 100);
          vals['out'] = inVal >= low && inVal <= high;
          break;
        }

        case 'SRLatch': {
          const set = Boolean(vals['set']);
          const reset = Boolean(vals['reset']);
          const prevQ = Boolean(prevBlockVals['out'] ?? vals['out'] ?? false);
          let currentQ = prevQ;
          if (reset) {
            currentQ = false;
          } else if (set) {
            currentQ = true;
          }
          vals['out'] = currentQ;
          vals['notOut'] = !currentQ;
          break;
        }

        case 'FlipFlop': {
          const clock = Boolean(vals['clock']);
          const clear = Boolean(vals['clear']);
          const d = Boolean(vals['d'] ?? true);
          const prevClock = Boolean(prevBlockVals['clock'] ?? false);
          const prevQ = Boolean(prevBlockVals['out'] ?? vals['out'] ?? false);
          const risingEdge = clock && !prevClock;

          let currentQ = prevQ;
          if (clear) {
            currentQ = false;
          } else if (risingEdge) {
            currentQ = d;
          }
          vals['out'] = currentQ;
          break;
        }

        // --- MATH BLOCKS ---
        case 'Add': {
          const sum = (block.inputs || []).reduce((acc, inp) => {
            const v = Number(vals[inp.name]);
            return acc + (isNaN(v) ? 0 : v);
          }, 0);
          vals['out'] = Number(sum.toFixed(props.precision ?? 1));
          break;
        }

        case 'Subtract': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 0);
          vals['out'] = Number((inA - inB).toFixed(props.precision ?? 1));
          break;
        }

        case 'Multiply': {
          const in1 = Number(vals['in1'] ?? vals['inA'] ?? 1);
          const in2 = Number(vals['in2'] ?? vals['inB'] ?? 1);
          vals['out'] = Number((in1 * in2).toFixed(props.precision ?? 2));
          break;
        }

        case 'Divide': {
          const inA = Number(vals['inA'] ?? vals['in1'] ?? 0);
          const inB = Number(vals['inB'] ?? vals['in2'] ?? 1);
          vals['out'] = inB === 0 ? 0 : Number((inA / inB).toFixed(props.precision ?? 2));
          break;
        }

        case 'Min': {
          const nums = (block.inputs || [])
            .map((inp) => Number(vals[inp.name]))
            .filter((n) => !isNaN(n));
          vals['out'] = nums.length ? Math.min(...nums) : 0;
          break;
        }

        case 'Max': {
          const nums = (block.inputs || [])
            .map((inp) => Number(vals[inp.name]))
            .filter((n) => !isNaN(n));
          vals['out'] = nums.length ? Math.max(...nums) : 0;
          break;
        }

        case 'Average': {
          const nums = (block.inputs || [])
            .map((inp) => Number(vals[inp.name]))
            .filter((n) => !isNaN(n));
          const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
          vals['out'] = Number(avg.toFixed(props.precision ?? 1));
          break;
        }

        case 'Abs': {
          const inVal = Number(vals['in'] ?? 0);
          vals['out'] = Number(Math.abs(inVal).toFixed(props.precision ?? 1));
          break;
        }

        case 'Round': {
          const inVal = Number(vals['in'] ?? 0);
          const prec = Number(props.precision ?? 1);
          vals['out'] = Number(inVal.toFixed(prec));
          break;
        }

        case 'Limit': {
          const inVal = Number(vals['in'] ?? 0);
          const low = Number(vals['lowLimit'] ?? props.lowLimit ?? 0);
          const high = Number(vals['highLimit'] ?? props.highLimit ?? 100);
          vals['out'] = Math.max(low, Math.min(high, inVal));
          break;
        }

        case 'Scale': {
          const inVal = Number(vals['in'] ?? 0);
          const inLow = Number(vals['inLow'] ?? props.inputLow ?? 0);
          const inHigh = Number(vals['inHigh'] ?? props.inputHigh ?? 100);
          const outLow = Number(vals['outLow'] ?? props.outputLow ?? 0);
          const outHigh = Number(vals['outHigh'] ?? props.outputHigh ?? 100);
          const denominator = inHigh - inLow || 1;
          const ratio = Math.max(0, Math.min(1, (inVal - inLow) / denominator));
          vals['out'] = Number((outLow + ratio * (outHigh - outLow)).toFixed(props.precision ?? 1));
          break;
        }

        // --- SWITCHES & DEMULTIPLEXERS ---
        case 'BooleanSwitch': {
          const switchIn = Boolean(vals['switchIn']);
          const inTrue = Boolean(vals['inTrue']);
          const inFalse = Boolean(vals['inFalse']);
          vals['out'] = switchIn ? inTrue : inFalse;
          break;
        }

        case 'NumericSwitch': {
          const switchIn = Boolean(vals['switchIn']);
          const inTrue = Number(vals['inTrue'] ?? 0);
          const inFalse = Number(vals['inFalse'] ?? 0);
          vals['out'] = switchIn ? inTrue : inFalse;
          break;
        }

        case 'EnumSwitch': {
          const switchIn = Boolean(vals['switchIn']);
          vals['out'] = switchIn ? (vals['inTrue'] ?? 'Occupied') : (vals['inFalse'] ?? 'Unoccupied');
          break;
        }

        case 'StringSwitch': {
          const switchIn = Boolean(vals['switchIn']);
          vals['out'] = switchIn ? (vals['inTrue'] ?? 'True') : (vals['inFalse'] ?? 'False');
          break;
        }

        case 'StatusDemux': {
          const inStatus = vals['in'] ?? 'ok';
          vals['ok'] = inStatus === 'ok';
          vals['fault'] = inStatus === 'fault';
          vals['down'] = inStatus === 'down';
          vals['overridden'] = inStatus === 'overridden';
          vals['out'] = typeof inStatus === 'number' ? inStatus : 0;
          break;
        }

        case 'Multiplexer': {
          const sel = Math.max(0, Math.min(3, Math.floor(Number(vals['select'] ?? 0))));
          const inputs = [vals['in0'] ?? 0, vals['in1'] ?? 0, vals['in2'] ?? 0, vals['in3'] ?? 0];
          vals['out'] = inputs[sel];
          break;
        }

        case 'Demultiplexer': {
          const inVal = Number(vals['in'] ?? 0);
          const sel = Math.max(0, Math.min(3, Math.floor(Number(vals['select'] ?? 0))));
          vals['out0'] = sel === 0 ? inVal : 0;
          vals['out1'] = sel === 1 ? inVal : 0;
          vals['out2'] = sel === 2 ? inVal : 0;
          vals['out3'] = sel === 3 ? inVal : 0;
          break;
        }

        // --- TIMERS & DELAYS ---
        case 'BooleanDelay': {
          const inVal = Boolean(vals['in']);
          const timePeriod = Number(props.timePeriod || 5);
          const prevElapsed = Number(prevBlockVals['elapsedTime'] ?? 0);

          if (isLastPass) {
            if (inVal) {
              const newElapsed = Math.min(timePeriod, prevElapsed + 1);
              vals['elapsedTime'] = newElapsed;
              vals['out'] = newElapsed >= timePeriod;
            } else {
              vals['elapsedTime'] = 0;
              vals['out'] = false;
            }
          } else {
            vals['out'] = prevElapsed >= timePeriod && inVal;
          }
          break;
        }

        case 'OneShot': {
          const inVal = Boolean(vals['in']);
          const timePeriod = Number(props.timePeriod || 5);
          const prevIn = Boolean(prevBlockVals['in'] ?? false);
          const prevRemaining = Number(prevBlockVals['timeRemaining'] ?? 0);

          if (isLastPass) {
            if (inVal && !prevIn) {
              vals['timeRemaining'] = timePeriod;
              vals['out'] = true;
            } else if (prevRemaining > 0) {
              const newRemaining = prevRemaining - 1;
              vals['timeRemaining'] = newRemaining;
              vals['out'] = newRemaining > 0;
            } else {
              vals['timeRemaining'] = 0;
              vals['out'] = false;
            }
          } else {
            vals['out'] = prevRemaining > 0 || (inVal && !prevIn);
          }
          break;
        }

        case 'MinOnHand': {
          const inVal = Boolean(vals['in']);
          const minTime = Number(props.minOnTime || props.timePeriod || 5);
          const prevTimer = Number(prevBlockVals['_onTimer'] ?? 0);

          if (isLastPass) {
            if (inVal) {
              vals['_onTimer'] = minTime;
              vals['out'] = true;
            } else if (prevTimer > 0) {
              vals['_onTimer'] = prevTimer - 1;
              vals['out'] = true;
            } else {
              vals['_onTimer'] = 0;
              vals['out'] = false;
            }
          } else {
            vals['out'] = inVal || prevTimer > 0;
          }
          break;
        }

        case 'MinOffHand': {
          const inVal = Boolean(vals['in']);
          const minTime = Number(props.minOffTime || props.timePeriod || 5);
          const prevTimer = Number(prevBlockVals['_offTimer'] ?? 0);

          if (isLastPass) {
            if (!inVal) {
              vals['_offTimer'] = minTime;
              vals['out'] = false;
            } else if (prevTimer > 0) {
              vals['_offTimer'] = prevTimer - 1;
              vals['out'] = false;
            } else {
              vals['_offTimer'] = 0;
              vals['out'] = true;
            }
          } else {
            vals['out'] = !(!inVal || prevTimer > 0);
          }
          break;
        }

        case 'RuntimeTotalizer': {
          const inVal = Boolean(vals['in']);
          const resetVal = Boolean(vals['reset']);
          const prevHours = Number(prevBlockVals['hours'] ?? vals['hours'] ?? 0);
          const prevStarts = Number(prevBlockVals['starts'] ?? vals['starts'] ?? 0);
          const prevIn = Boolean(prevBlockVals['in'] ?? false);

          if (isLastPass) {
            if (resetVal) {
              vals['hours'] = 0;
              vals['starts'] = 0;
            } else {
              let currentStarts = prevStarts;
              if (inVal && !prevIn) {
                currentStarts += 1;
              }
              let currentHours = prevHours;
              if (inVal) {
                // 1 second tick = 1/3600 hours
                currentHours += 1 / 3600;
              }
              vals['hours'] = Number(currentHours.toFixed(4));
              vals['starts'] = currentStarts;
            }
          } else {
            vals['hours'] = prevHours;
            vals['starts'] = prevStarts;
          }
          break;
        }

        case 'FreqPulse': {
          const enable = vals['enable'] === undefined ? true : Boolean(vals['enable']);
          const prevCount = Number(prevBlockVals['_tickCount'] ?? 0);

          if (isLastPass) {
            const newCount = prevCount + 1;
            vals['_tickCount'] = newCount;
            vals['out'] = enable ? newCount % 2 === 0 : false;
          } else {
            vals['out'] = enable ? prevCount % 2 === 0 : false;
          }
          break;
        }

        // --- HVAC & CONTROL ---
        case 'LoopPoint': {
          const cv = Number(vals['controlledVariable'] ?? 72);
          const sp = Number(vals['setpoint'] ?? 70);
          const enable = vals['enable'] === undefined ? true : Boolean(vals['enable']);
          const isDirect = (props.action || 'direct') === 'direct';
          const kp = Number(props.proportionalConstant ?? 4.0);
          const ki = Number(props.integralConstant ?? 0.2);
          const kd = Number(props.derivativeConstant ?? 0.05);
          const deadband = Number(props.deadband ?? 0.5);
          const lowLimit = Number(props.lowLimit ?? 0);
          const highLimit = Number(props.highLimit ?? 100);

          if (!enable) {
            vals['out'] = 0;
            vals['error'] = 0;
            vals['integral'] = 0;
            break;
          }

          let rawError = isDirect ? cv - sp : sp - cv;
          let error = Math.abs(rawError) < deadband ? 0 : rawError;

          const prevIntegral = Number(prevBlockVals['integral'] ?? 0);
          const prevError = Number(prevBlockVals['error'] ?? 0);

          let newIntegral = prevIntegral;
          if (isLastPass) {
            // Integrate error with anti-windup clamping (-50 to +50)
            newIntegral = Math.max(-50, Math.min(50, prevIntegral + error * ki));
            vals['integral'] = Number(newIntegral.toFixed(2));
            vals['error'] = Number(error.toFixed(2));
          }

          const derivative = (error - prevError) * kd;
          const pTerm = error * kp;
          const rawOutput = pTerm + newIntegral + derivative;
          const clampedOutput = Math.max(lowLimit, Math.min(highLimit, rawOutput));

          vals['out'] = Number(clampedOutput.toFixed(1));
          break;
        }

        case 'Reset': {
          const inVal = Number(vals['in'] ?? 0);
          const xLow = Number(props.inputLow ?? 10);
          const xHigh = Number(props.inputHigh ?? 60);
          const yLow = Number(props.outputLow ?? 180);
          const yHigh = Number(props.outputHigh ?? 120);

          let ratio = (inVal - xLow) / (xHigh - xLow || 1);
          ratio = Math.max(0, Math.min(1, ratio));
          const outVal = yLow + ratio * (yHigh - yLow);
          vals['out'] = Number(outVal.toFixed(1));
          break;
        }

        case 'LeadLagCycle': {
          const enable = vals['enable'] === undefined ? true : Boolean(vals['enable']);
          const dev1Fault = Boolean(vals['dev1Fault']);
          const dev2Fault = Boolean(vals['dev2Fault']);
          const cycleTrigger = Boolean(vals['cycleTrigger']);
          const prevTrigger = Boolean(prevBlockVals['cycleTrigger'] ?? false);
          const prevLead = Number(prevBlockVals['leadIndex'] ?? 1);

          let lead = prevLead;
          if (isLastPass && cycleTrigger && !prevTrigger) {
            lead = prevLead === 1 ? 2 : 1;
          }
          if (dev1Fault && !dev2Fault) {
            lead = 2;
          } else if (dev2Fault && !dev1Fault) {
            lead = 1;
          }

          vals['leadIndex'] = lead;
          vals['dev1Cmd'] = enable && (lead === 1 || (dev2Fault && !dev1Fault));
          vals['dev2Cmd'] = enable && (lead === 2 || (dev1Fault && !dev2Fault));
          break;
        }

        case 'LeadLagN': {
          const enable = vals['enable'] === undefined ? true : Boolean(vals['enable']);
          const demand = Number(vals['demand'] ?? 50);
          const f1 = Boolean(vals['fault1']);
          const f2 = Boolean(vals['fault2']);
          const f3 = Boolean(vals['fault3']);

          let stages = 1;
          if (demand > 70) stages = 3;
          else if (demand > 35) stages = 2;

          vals['cmd1'] = enable && stages >= 1 && !f1;
          vals['cmd2'] = enable && (stages >= 2 || f1) && !f2;
          vals['cmd3'] = enable && (stages >= 3 || (stages >= 2 && (f1 || f2))) && !f3;
          vals['activeStages'] = stages;
          break;
        }

        case 'Tstat': {
          const temp = Number(vals['temp'] ?? 72);
          const heatSP = Number(vals['heatSetpoint'] ?? 68);
          const coolSP = Number(vals['coolSetpoint'] ?? 74);
          const deadband = Number(props.deadband ?? 0.5);
          const enable = vals['enable'] === undefined ? true : Boolean(vals['enable']);

          if (!enable) {
            vals['heatCmd'] = false;
            vals['coolCmd'] = false;
            vals['effectiveMode'] = 'disabled';
          } else if (temp < heatSP - deadband) {
            vals['heatCmd'] = true;
            vals['coolCmd'] = false;
            vals['effectiveMode'] = 'heating';
          } else if (temp > coolSP + deadband) {
            vals['heatCmd'] = false;
            vals['coolCmd'] = true;
            vals['effectiveMode'] = 'cooling';
          } else if (temp >= heatSP && temp <= coolSP) {
            vals['heatCmd'] = false;
            vals['coolCmd'] = false;
            vals['effectiveMode'] = 'satisfied';
          } else {
            // Maintain previous mode in deadband hysteresis range
            vals['heatCmd'] = Boolean(prevBlockVals['heatCmd']);
            vals['coolCmd'] = Boolean(prevBlockVals['coolCmd']);
            vals['effectiveMode'] = prevBlockVals['effectiveMode'] || 'satisfied';
          }
          break;
        }

        case 'StagePoint': {
          const inVal = Number(vals['in'] ?? 0);
          const enable = vals['enable'] === undefined ? true : Boolean(vals['enable']);
          vals['stage1'] = enable && inVal >= 20;
          vals['stage2'] = enable && inVal >= 45;
          vals['stage3'] = enable && inVal >= 70;
          vals['stage4'] = enable && inVal >= 90;
          break;
        }

        case 'Ramp': {
          const targetVal = Number(vals['in'] ?? 0);
          const rampRate = Number(props.rampRate ?? 5.0); // units per tick
          const prevOut = Number(prevBlockVals['out'] ?? targetVal);

          if (isLastPass) {
            if (Math.abs(targetVal - prevOut) <= rampRate) {
              vals['out'] = targetVal;
            } else if (targetVal > prevOut) {
              vals['out'] = Number((prevOut + rampRate).toFixed(1));
            } else {
              vals['out'] = Number((prevOut - rampRate).toFixed(1));
            }
          } else {
            vals['out'] = prevOut;
          }
          break;
        }

        case 'DewPoint': {
          const t = Number(vals['temp'] ?? 75);
          const rh = Math.max(1, Math.min(100, Number(vals['humidity'] ?? 50)));
          const a = 17.27;
          const b = 237.7;
          const tc = (t - 32) * (5 / 9);
          const alpha = (a * tc) / (b + tc) + Math.log(rh / 100);
          const dpc = (b * alpha) / (a - alpha);
          const dpf = (dpc * 9) / 5 + 32;
          vals['dewPoint'] = Number(dpf.toFixed(props.precision ?? 1));
          break;
        }

        case 'Enthalpy': {
          const t = Number(vals['temp'] ?? 72);
          const rh = Math.max(1, Math.min(100, Number(vals['humidity'] ?? 45)));
          const pSat = 0.0886 * Math.exp((17.27 * ((t - 32) * 5 / 9)) / (((t - 32) * 5 / 9) + 237.3));
          const pVap = (rh / 100) * pSat;
          const humidityRatio = 0.622 * (pVap / (14.696 - pVap));
          const h = 0.24 * t + humidityRatio * (1061 + 0.444 * t);
          vals['enthalpy'] = Number(h.toFixed(props.precision ?? 1));
          break;
        }

        // --- POINTS & WRITABLES ---
        case 'BooleanWritable': {
          let resolvedVal: any = null;
          let isOvr = false;
          let activeLevel = 0;

          for (let level = 1; level <= 16; level++) {
            const candidate = getWritableCandidate(block, level, vals, props, currentOverrides, links);
            if (candidate !== null && candidate !== undefined) {
              resolvedVal = Boolean(candidate);
              activeLevel = level;
              if (level <= 10 && level !== 16) {
                isOvr = true;
              }
              break;
            }
          }

          if (activeLevel === 0) {
            resolvedVal = vals['fallback'] !== undefined && vals['fallback'] !== null 
              ? Boolean(vals['fallback']) 
              : (props.fallbackValue !== undefined ? Boolean(props.fallbackValue) : Boolean(props.defaultOutput ?? false));
          }

          vals['out'] = resolvedVal;
          blockStatuses[block.id].overridden = isOvr;
          break;
        }

        case 'NumericWritable': {
          let resolvedVal: any = null;
          let isOvr = false;
          let activeLevel = 0;

          for (let level = 1; level <= 16; level++) {
            const candidate = getWritableCandidate(block, level, vals, props, currentOverrides, links);
            if (candidate !== null && candidate !== undefined) {
              resolvedVal = Number(candidate);
              activeLevel = level;
              if (level <= 10 && level !== 16) {
                isOvr = true;
              }
              break;
            }
          }

          if (activeLevel === 0) {
            resolvedVal = vals['fallback'] !== undefined && vals['fallback'] !== null 
              ? Number(vals['fallback']) 
              : (props.fallbackValue !== undefined ? Number(props.fallbackValue) : Number(props.defaultOutput ?? 0));
          }

          vals['out'] = resolvedVal;
          blockStatuses[block.id].overridden = isOvr;
          break;
        }

        case 'EnumWritable': {
          let resolvedVal: any = null;
          let isOvr = false;
          let activeLevel = 0;

          for (let level = 1; level <= 16; level++) {
            const candidate = getWritableCandidate(block, level, vals, props, currentOverrides, links);
            if (candidate !== null && candidate !== undefined) {
              resolvedVal = candidate;
              activeLevel = level;
              if (level <= 10 && level !== 16) {
                isOvr = true;
              }
              break;
            }
          }

          if (activeLevel === 0) {
            resolvedVal = vals['fallback'] || props.fallbackValue || props.defaultOutput || 'Auto';
          }

          vals['out'] = resolvedVal;
          blockStatuses[block.id].overridden = isOvr;
          break;
        }

        case 'StringWritable': {
          let resolvedVal: any = null;

          for (let level = 1; level <= 16; level++) {
            const candidate = getWritableCandidate(block, level, vals, props, currentOverrides, links);
            if (candidate !== null && candidate !== undefined) {
              resolvedVal = String(candidate);
              break;
            }
          }

          if (resolvedVal === null) {
            resolvedVal = String(vals['fallback'] || props.fallbackValue || props.defaultOutput || 'Normal');
          }
          vals['out'] = resolvedVal;
          break;
        }

        case 'BooleanPoint': {
          vals['out'] = Boolean(vals['in'] ?? true);
          break;
        }

        case 'NumericPoint': {
          vals['out'] = Number(vals['in'] ?? 0);
          break;
        }

        // --- ALARMS ---
        case 'AlarmSource': {
          const inVal = Boolean(vals['in']);
          const inhibit = Boolean(vals['inhibit']);
          const isAlarm = inVal && !inhibit;
          vals['alarm'] = isAlarm;
          vals['unacked'] = isAlarm;
          blockStatuses[block.id].unackedAlarm = isAlarm;
          break;
        }

        case 'OutOfRangeAlarm': {
          const inVal = Number(vals['in'] ?? 70);
          const high = Number(vals['highLimit'] ?? 85);
          const low = Number(vals['lowLimit'] ?? 50);
          const isAlarm = inVal > high || inVal < low;
          vals['alarm'] = isAlarm;
          blockStatuses[block.id].unackedAlarm = isAlarm;
          break;
        }

        case 'ChangeOfStateAlarm': {
          const inVal = Boolean(vals['in']);
          const alarmVal = Boolean(vals['alarmValue'] ?? true);
          const isAlarm = inVal === alarmVal;
          vals['alarm'] = isAlarm;
          blockStatuses[block.id].unackedAlarm = isAlarm;
          break;
        }

        // --- SCHEDULES ---
        case 'BooleanSchedule': {
          const overrideVal = vals['override'];
          vals['out'] = overrideVal !== null && overrideVal !== undefined ? Boolean(overrideVal) : Boolean(props.defaultOutput ?? true);
          vals['nextState'] = !vals['out'];
          break;
        }

        case 'NumericSchedule': {
          const overrideVal = vals['override'];
          vals['out'] = overrideVal !== null && overrideVal !== undefined ? Number(overrideVal) : Number(props.defaultOutput ?? 72.0);
          break;
        }

        case 'EnumSchedule': {
          const overrideVal = vals['override'];
          vals['out'] = overrideVal !== null && overrideVal !== undefined ? overrideVal : (props.defaultOutput || 'Occupied');
          break;
        }

        // --- CONVERSION ---
        case 'StatusNumericToBoolean': {
          const inVal = Number(vals['in'] ?? 0);
          const threshold = Number(vals['threshold'] ?? 0.5);
          vals['out'] = inVal > threshold;
          break;
        }

        case 'BooleanToNumeric': {
          const inVal = Boolean(vals['in']);
          const trueVal = Number(vals['trueValue'] ?? 100);
          const falseVal = Number(vals['falseValue'] ?? 0);
          vals['out'] = inVal ? trueVal : falseVal;
          break;
        }

        default: {
          // Fallback pass-through
          if ((block.outputs || []).length > 0) {
            const firstIn = (block.inputs || [])[0]?.name;
            if (firstIn && vals[firstIn] !== undefined) {
              vals[block.outputs[0].name] = vals[firstIn];
            }
          }
          break;
        }
      }
    });
  }

  // 3. Post-calculation thermal dynamics loop feedback (if enabled)
  if (options.enableThermalDynamics !== false) {
    applyThermalDynamics(blocks, blockValues, previousValues, currentOverrides);
  }

  // 4. Apply active injected field faults
  if (options.injectedFaults && options.injectedFaults.length > 0) {
    applyInjectedFaults(blocks, blockValues, blockStatuses, options.injectedFaults);
  }

  // 5. Enforce simulation overrides directly on block values (e.g. preset test scenarios & manual test overrides)
  Object.keys(currentOverrides).forEach((blockId) => {
    const slotOverrides = currentOverrides[blockId];
    if (!slotOverrides || !blockValues[blockId]) return;
    Object.keys(slotOverrides).forEach((slotName) => {
      const val = slotOverrides[slotName];
      if (val !== undefined && val !== null) {
        blockValues[blockId][slotName] = val;
      }
    });
    if (blockStatuses[blockId]) {
      blockStatuses[blockId].overridden = true;
    }
  });

  return {
    blockValues,
    blockStatuses,
    activeLinkIds,
  };
}
