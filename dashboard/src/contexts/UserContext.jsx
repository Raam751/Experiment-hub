import { createContext, useContext } from 'react';
import { getStoredUser } from '../api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const user = getStoredUser();
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

export function useIsAdmin() {
  const user = useUser();
  return user?.role === 'admin';
}
