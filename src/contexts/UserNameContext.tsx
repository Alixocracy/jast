import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const USER_NAME_KEY = "focusflow-user-name";

interface UserNameContextType {
  userName: string;
  updateUserName: (name: string) => void;
}

const UserNameContext = createContext<UserNameContextType | undefined>(undefined);

export function UserNameProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_NAME_KEY);
      if (stored) {
        setUserName(stored);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const updateUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem(USER_NAME_KEY, name);
  };

  return (
    <UserNameContext.Provider value={{ userName, updateUserName }}>
      {children}
    </UserNameContext.Provider>
  );
}

export function useUserName() {
  const context = useContext(UserNameContext);
  if (context === undefined) {
    throw new Error("useUserName must be used within a UserNameProvider");
  }
  return context;
}
