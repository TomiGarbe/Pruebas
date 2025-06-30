import React, { createContext, useState } from 'react';

export const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [selectedMantenimientos, setSelectedMantenimientos] = useState([]);

  const addMantenimiento = (mantenimiento) => {
    setSelectedMantenimientos((prev) => {
      if (!prev.some((m) => m.id === mantenimiento.id)) {
        return [...prev, mantenimiento];
      }
      return prev;
    });
  };

  const removeMantenimiento = (mantenimientoId) => {
    setSelectedMantenimientos((prev) =>
      prev.filter((m) => m.id !== mantenimientoId)
    );
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