import React, { useState } from 'react';
import {
  Server,
  Globe,
} from 'lucide-react';
import { NiagaraServiceSubView, StationProfile } from '../../types/niagaraService';
import { StationWebBrowser } from './StationWebBrowser';
import { StationConnectionManager } from './StationConnectionManager';
import { DEFAULT_STATION_PROFILES } from '../../data/stationProfiles';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface NiagaraServiceStudioProps {
  activeSubView: NiagaraServiceSubView;
  onSelectSubView: (subView: NiagaraServiceSubView) => void;
  onOpenPriorityOverride?: (pointName: string, curVal: any) => void;
}

export const NiagaraServiceStudio: React.FC<NiagaraServiceStudioProps> = ({
  activeSubView = 'connection_manager',
  onSelectSubView,
  onOpenPriorityOverride,
}) => {
  const { isDark } = useNiagaraTheme();

  // Saved Stations Profile State with localStorage caching
  const [stations, setStations] = useState<StationProfile[]>(() => {
    try {
      const saved = localStorage.getItem('niagara_saved_station_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (s) => s && s.id !== 'st_plant_jace8000' && s.id !== 'st_campus_supervisor'
          );
          return cleaned;
        }
      }
    } catch (e) {}
    return DEFAULT_STATION_PROFILES;
  });

  const [activeStationId, setActiveStationId] = useState<string>(
    () => stations[0]?.id || ''
  );

  const currentStation = stations.find((s) => s.id === activeStationId) || stations[0] || null;

  const saveStationsToStorage = (updated: StationProfile[]) => {
    setStations(updated);
    try {
      localStorage.setItem('niagara_saved_station_profiles', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddStation = (newStation: StationProfile) => {
    const updated = [newStation, ...stations.filter((s) => s.id !== newStation.id)];
    saveStationsToStorage(updated);
    setActiveStationId(newStation.id);
  };

  const handleUpdateStation = (updatedStation: StationProfile) => {
    const updated = stations.map((s) => (s.id === updatedStation.id ? updatedStation : s));
    saveStationsToStorage(updated);
  };

  const handleDeleteStation = (stationId: string) => {
    const updated = stations.filter((s) => s.id !== stationId);
    saveStationsToStorage(updated);
    if (activeStationId === stationId) {
      setActiveStationId(updated[0]?.id || '');
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col h-full overflow-hidden select-none font-sans ${
        isDark ? 'bg-[#060b14] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Primary Station Connection Manager View */}
      <StationConnectionManager
        stations={stations}
        activeStationId={activeStationId}
        onSelectStation={(st) => setActiveStationId(st.id)}
        onAddStation={handleAddStation}
        onUpdateStation={handleUpdateStation}
        onDeleteStation={handleDeleteStation}
        onLaunchBrowser={(st) => {
          setActiveStationId(st.id);
        }}
      />
    </div>
  );
};
