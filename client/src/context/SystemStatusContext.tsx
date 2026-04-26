import { createContext, useContext, useEffect, useState } from "react";
import { checkDatabaseHealth } from "@/utils/checkDatabase";

interface SystemStatus {
  dbOnline: boolean;
}

const SystemStatusContext = createContext<SystemStatus>({
  dbOnline: true,
});

export const SystemStatusProvider = ({ children }: any) => {
  const [dbOnline, setDbOnline] = useState(true);

  useEffect(() => {
    const check = async () => {
      const status = await checkDatabaseHealth();
      setDbOnline(status);
    };

    check();
    const interval = setInterval(check, 300000); // check every 300s
    return () => clearInterval(interval);
  }, []);

  return (
    <SystemStatusContext.Provider value={{ dbOnline }}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => useContext(SystemStatusContext);