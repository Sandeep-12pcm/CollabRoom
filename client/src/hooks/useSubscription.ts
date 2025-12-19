// hooks/useSubscription.ts
import { useProfile } from "./useProfile";

export const useSubscription = () => {
  const { profile } = useProfile(); 
  return {
    isPro: profile?.is_pro === true,
    isFree: !profile?.is_pro,
  };
};
