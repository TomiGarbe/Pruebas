import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const RouteContext = React.createContext();

export const RouteProvider = ({ children }) => {
  const { currentEntity } = useContext(AuthContext);
  const [selectedMantenimientos, setSelectedMantenimientos] = useState([]);

  useEffect(() => {
    if (currentEntity) {
      const stored = localStorage.getItem(`selectedMantenimientos_${currentEntity.id}`);
      if (stored) {
        setSelectedMantenimientos(JSON.parse(stored));
      }
    }
  }, [currentEntity]);

  useEffect(() => {
    if (currentEntity && selectedMantenimientos.length) {
      localStorage.setItem(
        `selectedMantenimientos_${currentEntity.id}`,
        JSON.stringify(selectedMantenimientos)
      );
    } else if (currentEntity && !selectedMantenimientos.length) {
      localStorage.removeItem(`selectedMantenimientos_${currentEntity.id}`);
    }
  }, [selectedMantenimientos, currentEntity]);

  const addMantenimiento = (mantenimiento) => {
    setSelectedMantenimientos((prev) => [...prev, mantenimiento]);
  };

  const removeMantenimiento = (id) => {
    setSelectedMantenimientos((prev) => prev.filter((m) => m.id !== id));
  };

  const clearMantenimientos = () => {
    setSelectedMantenimientos([]);
  };

  return (
    <RouteContext.Provider
      value={{ selectedMantenimientos, addMantenimiento, removeMantenimiento, clearMantenimientos }}
    >
      {children}
    </RouteContext.Provider>
  );
};