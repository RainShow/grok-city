import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FLEET_REFRESH_MS, loadFleet, SAMPLE_FLEET, type FleetFile } from './fleet';

const FleetContext = createContext<FleetFile>(SAMPLE_FLEET);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleet, setFleet] = useState<FleetFile>(SAMPLE_FLEET);
  useEffect(() => {
    let live = true;
    const pull = () => {
      loadFleet().then((next) => {
        if (live) setFleet(next);
      });
    };
    pull();
    const id = window.setInterval(pull, FLEET_REFRESH_MS);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, []);
  return <FleetContext.Provider value={fleet}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  return useContext(FleetContext);
}
