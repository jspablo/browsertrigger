import { useState, useEffect } from "react";

export function useStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // Load initial value from storage
    const loadValue = async () => {
      try {
        // Remove 'local:' prefix for storage API
        const storageKey = key.replace('local:', '');
        const item = await browser.storage.local.get(storageKey);
        if (item[storageKey] !== undefined) {
          setStoredValue(item[storageKey]);
        }
      } catch (error) {
        console.error("Error loading from storage:", error);
      }
    };

    loadValue();

    // Listen for storage changes
    const handleStorageChange = (changes: any, areaName: string) => {
      const storageKey = key.replace('local:', '');
      if (areaName === "local" && changes[storageKey]) {
        setStoredValue(changes[storageKey].newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key]);

  const setValue = async (value: T) => {
    try {
      const storageKey = key.replace('local:', '');
      await browser.storage.local.set({ [storageKey]: value });
      setStoredValue(value);
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  };

  return [storedValue, setValue] as const;
}
