import React, { useState } from 'react';
import {
  Settings,
  Radio,
  Network,
  Cpu,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Power,
  Layers,
  Search,
  Shield,
  HelpCircle,
  Info,
} from 'lucide-react';
import {
  NetworkAdapterConfig,
  NetworkInterfaceInfo,
  NetworkMode,
  LoadedPcapFile,
} from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface NetworkAdapterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NetworkAdapterConfig;
  onSaveConfig: (newConfig: NetworkAdapterConfig) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  onUploadPcap: (file: File) => void;
  loadedPcap: LoadedPcapFile | null;
  onEnableDemoMode: () => void;
}

export const AVAILABLE_INTERFACES: NetworkInterfaceInfo[] = [
  {
    id: 'eth0',
    name: 'eth0',
    displayName: 'Ethernet (eth0 - Primary Field LAN)',
    type: 'ethernet',
    macAddress: '00:1E:C9:82:11:4A',
    ipAddress: '192.168.1.50',
    subnetMask: '255.255.255.0',
    broadcastAddress: '192.168.1.255',
    isUp: true,
  },
  {
    id: 'eth1',
    name: 'eth1',
    displayName: 'Ethernet (eth1 - Secondary BMS Backbone)',
    type: 'ethernet',
    macAddress: '00:1E:C9:82:11:4B',
    ipAddress: '10.0.100.50',
    subnetMask: '255.255.255.0',
    broadcastAddress: '10.0.100.255',
    isUp: true,
  },
  {
    id: 'wlan0',
    name: 'wlan0',
    displayName: 'Wi-Fi (wlan0 - Technician Commissioning)',
    type: 'wifi',
    macAddress: 'F4:D4:88:3A:90:1C',
    ipAddress: '172.20.10.15',
    subnetMask: '255.255.255.240',
    broadcastAddress: '172.20.10.15',
    isUp: true,
  },
  {
    id: 'lo',
    name: 'lo',
    displayName: 'Localhost / Loopback (127.0.0.1)',
    type: 'loopback',
    macAddress: '00:00:00:00:00:00',
    ipAddress: '127.0.0.1',
    subnetMask: '255.0.0.0',
    broadcastAddress: '127.255.255.255',
    isUp: true,
  },
];

export const NetworkAdapterConfigModal: React.FC<NetworkAdapterConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onConnect,
  onDisconnect,
  isConnected,
  onUploadPcap,
  loadedPcap,
  onEnableDemoMode,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [activeTab, setActiveTab] = useState<'adapter' | 'bacnet' | 'bbmd' | 'serial' | 'pcap' | 'sandbox'>('adapter');
  const [formData, setFormData] = useState<NetworkAdapterConfig>(config);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  if (!isOpen) return null;

  const handleInterfaceChange = (ifaceId: string) => {
    const found = AVAILABLE_INTERFACES.find((i) => i.id === ifaceId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        interfaceId: found.id,
        ipAddress: found.ipAddress,
        subnetMask: found.subnetMask,
        broadcastAddress: found.broadcastAddress,
      }));
    }
  };

  const handleSaveAndConnect = () => {
    onSaveConfig({
      ...formData,
      mode: 'live_adapter',
    });
    onConnect();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsProcessingFile(true);
      setTimeout(() => {
        onUploadPcap(file);
        setIsProcessingFile(false);
        onClose();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-4xl rounded-xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          isDark
            ? 'bg-[#09152b] border-slate-700/80 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-[#060f1f] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Network Adapter & BACnet Interface Setup
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold border ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isConnected ? '● ADAPTER BOUND' : '○ DISCONNECTED / IDLE'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Select your physical NIC, configure BACnet/IP UDP sockets, BBMD routing, or import real Wireshark captures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b px-6 gap-2 text-xs font-semibold overflow-x-auto ${
            isDark ? 'bg-[#081224] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {[
            { id: 'adapter', label: '1. Network Adapter & IP', icon: Network },
            { id: 'bacnet', label: '2. BACnet/IP Comm', icon: Radio },
            { id: 'bbmd', label: '3. BBMD & Foreign Device', icon: Shield },
            { id: 'serial', label: '4. RS-485 Serial MS/TP', icon: Cpu },
            { id: 'pcap', label: '5. Import Field .PCAP', icon: UploadCloud },
            { id: 'sandbox', label: '6. Campus Equipment Baseline', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-400 font-bold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Network Adapter & IP */}
          {activeTab === 'adapter' && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-950 dark:text-sky-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Select Local Physical or Virtual Network Interface</p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Niagara Workbench requires binding its BACnet Comm Service to a valid local network interface controller (NIC) to send/receive UDP 47808 broadcast traffic on your field subnet.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-800 dark:text-slate-300">
                  Active Network Interface (NIC)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_INTERFACES.map((iface) => {
                    const isSelected = formData.interfaceId === iface.id;
                    return (
                      <div
                        key={iface.id}
                        onClick={() => handleInterfaceChange(iface.id)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-600 dark:border-sky-400 text-sky-950 dark:text-sky-200 ring-1 ring-sky-500'
                            : isDark
                            ? 'bg-[#0c1c38] border-slate-700/60 hover:border-slate-600 text-slate-100'
                            : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                            <Network className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            {iface.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              iface.isUp
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'
                            }`}
                          >
                            {iface.isUp ? 'UP / ACTIVE' : 'DOWN'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono mb-1 font-semibold">
                          {iface.ipAddress} / {iface.subnetMask}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">MAC: {iface.macAddress}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Local IP Address</label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Subnet Mask</label>
                  <input
                    type="text"
                    value={formData.subnetMask}
                    onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Subnet Broadcast Address</label>
                  <input
                    type="text"
                    value={formData.broadcastAddress}
                    onChange={(e) => setFormData({ ...formData, broadcastAddress: e.target.value })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACnet/IP Comm */}
          {activeTab === 'bacnet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-950 dark:text-emerald-200">
                <p className="font-bold mb-1">BACnet Communication Stack Parameters</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Standard BACnet/IP uses UDP port 47808 (Hex 0xBAC0). Each ECS Workbench Studio instance or BACnet client must have a unique Local Device Instance ID on the network.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">BACnet UDP Port</label>
                  <input
                    type="number"
                    value={formData.udpPort}
                    onChange={(e) => setFormData({ ...formData, udpPort: parseInt(e.target.value, 10) || 47808 })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border font-bold ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Default: 47808 (0xBAC0)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">BACnet Network Number (DNET)</label>
                  <input
                    type="number"
                    value={formData.bacnetNetworkNumber}
                    onChange={(e) => setFormData({ ...formData, bacnetNetworkNumber: parseInt(e.target.value, 10) || 1 })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border font-bold ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">1 to 65534 (0 indicates local network)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Local Station Device Instance ID</label>
                  <input
                    type="number"
                    value={formData.localDeviceInstance}
                    onChange={(e) => setFormData({ ...formData, localDeviceInstance: parseInt(e.target.value, 10) || 50000 })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border font-bold ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Range: 0 to 4194303 (must be globally unique)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Local Station Device Name</label>
                  <input
                    type="text"
                    value={formData.localDeviceName}
                    onChange={(e) => setFormData({ ...formData, localDeviceName: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded border font-medium ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Announced in BACnet I-Am responses</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BBMD & Foreign Device */}
          {activeTab === 'bbmd' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200">
                <p className="font-bold mb-1">BACnet Broadcast Management Device (BBMD) & Foreign Device Registration</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  When your workstation is on a different VLAN or subnet from the field controllers, broadcast Who-Is packets cannot cross IP routers without registering as a Foreign Device to a BBMD.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40">
                <input
                  type="checkbox"
                  id="enableBbmd"
                  checked={formData.bbmdEnabled}
                  onChange={(e) => setFormData({ ...formData, bbmdEnabled: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="enableBbmd" className="text-xs font-bold text-slate-900 dark:text-slate-200 cursor-pointer">
                  Enable Foreign Device Registration (Register to remote BBMD)
                </label>
              </div>

              {formData.bbmdEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Remote BBMD IP Address</label>
                    <input
                      type="text"
                      value={formData.bbmdIp}
                      onChange={(e) => setFormData({ ...formData, bbmdIp: e.target.value })}
                      placeholder="e.g. 192.168.1.1"
                      className={`w-full px-3 py-2 text-xs font-mono rounded border ${
                        isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">BBMD UDP Port</label>
                    <input
                      type="number"
                      value={formData.bbmdPort}
                      onChange={(e) => setFormData({ ...formData, bbmdPort: parseInt(e.target.value, 10) || 47808 })}
                      className={`w-full px-3 py-2 text-xs font-mono rounded border ${
                        isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Time to Live (TTL Seconds)</label>
                    <input
                      type="number"
                      value={formData.bbmdTtl}
                      onChange={(e) => setFormData({ ...formData, bbmdTtl: parseInt(e.target.value, 10) || 300 })}
                      className={`w-full px-3 py-2 text-xs font-mono rounded border ${
                        isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RS-485 Serial MS/TP */}
          {activeTab === 'serial' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-950 dark:text-amber-200">
                <p className="font-bold mb-1">RS-485 Serial Bus & MS/TP Comm Port</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Configure the local USB-to-RS485 transceiver or JACE serial port to sniff, transmit, or diagnose token-ring traffic on field MS/TP trunks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Serial COM Port</label>
                  <select
                    value={formData.serialPort}
                    onChange={(e) => setFormData({ ...formData, serialPort: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded border font-semibold ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="COM1">COM1 (Motherboard Serial)</option>
                    <option value="COM3">COM3 (USB-RS485 Dongle A)</option>
                    <option value="COM4">COM4 (USB-RS485 Dongle B)</option>
                    <option value="/dev/ttyUSB0">/dev/ttyUSB0 (Linux USB-Serial)</option>
                    <option value="/dev/ttyS0">/dev/ttyS0 (JACE Native RS-485 Trunk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Baud Rate</label>
                  <select
                    value={formData.baudRate}
                    onChange={(e) => setFormData({ ...formData, baudRate: parseInt(e.target.value, 10) as any })}
                    className={`w-full px-3 py-2 text-xs rounded border font-semibold ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="9600">9600 Baud</option>
                    <option value="19200">19200 Baud</option>
                    <option value="38400">38400 Baud (Standard MS/TP)</option>
                    <option value="76800">76800 Baud (High Speed)</option>
                    <option value="115200">115200 Baud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-800 dark:text-slate-300">Max Master (Max MAC)</label>
                  <input
                    type="number"
                    value={formData.maxMaster}
                    onChange={(e) => setFormData({ ...formData, maxMaster: parseInt(e.target.value, 10) || 127 })}
                    className={`w-full px-3 py-2 text-xs font-mono rounded border font-bold ${
                      isDark ? 'bg-[#0c1c38] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Tip: Match the highest MAC on trunk to reduce token delays
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Import Field .PCAP */}
          {activeTab === 'pcap' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-950 dark:text-purple-200">
                <p className="font-bold mb-1">Load Real Jobsite Wireshark Network Captures (.pcap, .pcapng, .json)</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Upload actual packet capture files recorded from your field laptop or Wireshark. The app will parse all real BACnet/IP frames, discover active controllers, and populate diagnostics automatically from the file.
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDark ? 'border-slate-700 hover:border-purple-400 bg-slate-900/40' : 'border-slate-300 hover:border-purple-500 bg-slate-50'
                }`}
              >
                <UploadCloud className="w-12 h-12 mx-auto mb-3 text-purple-600 dark:text-purple-400 animate-bounce" />
                <h3 className="text-sm font-bold mb-1 text-slate-900 dark:text-slate-100">Upload Wireshark Capture File</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-4">
                  Drag and drop a <code className="text-purple-700 dark:text-purple-300 font-mono font-bold">.pcap</code>, <code className="text-purple-700 dark:text-purple-300 font-mono font-bold">.pcapng</code>, or exported JSON capture file here
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-md">
                  <FileCode className="w-4 h-4" />
                  <span>Choose Capture File</span>
                  <input
                    type="file"
                    accept=".pcap,.pcapng,.cap,.json,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {loadedPcap && (
                <div className="p-4 rounded-lg border border-purple-300 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-950/20 text-xs space-y-1 text-purple-950 dark:text-purple-200">
                  <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 font-bold">
                    <span>Active Capture File: {loadedPcap.fileName}</span>
                    <span className="text-[11px] font-mono">{(loadedPcap.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Parsed <strong className="text-slate-900 dark:text-white">{loadedPcap.packetCount}</strong> packets across <strong className="text-slate-900 dark:text-white">{loadedPcap.timeSpanSecs}s</strong> duration, discovering <strong className="text-slate-900 dark:text-white">{loadedPcap.devicesDiscoveredCount}</strong> controllers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Campus Baseline */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-950 dark:text-sky-200">
                <p className="font-bold mb-1">Campus Equipment Baseline</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Load standard pre-configured BACnet/IP and MS/TP controller topology (AHUs, Chillers, VAVs, Boiler Plants) for offline engineering validation.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-sky-300 dark:border-sky-800/40 bg-sky-50 dark:bg-sky-950/20">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">Load Campus Network Topology (11 Field Devices)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Populates standard BACnet IP, MS/TP, and Modbus equipment to verify network hierarchy and diagnostics.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onEnableDemoMode();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
                >
                  Load Topology
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t ${
            isDark ? 'bg-[#060f1f] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Disconnect Adapter</span>
              </button>
            ) : (
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Status: Adapter is unconfigured / disconnected</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndConnect}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-900/30 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Bind Interface</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
