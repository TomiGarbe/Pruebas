import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import { FaUserAlt, FaTruck, FaMapMarkerAlt } from "react-icons/fa";
import { renderToStaticMarkup } from "react-dom/server";

import { useMapsData } from "./useMapsData";
import { useMapRoutes } from "./useMapRoutes";
import { usePopups } from "./usePopups";
import { getClientes } from "../../services/clienteService";
import { getSucursales } from "../../services/sucursalService";

const useMapa = (mapInstanceRef, createRoutingControl, isMobile) => {
  const {
    users,
    cuadrillas,
    sucursales
  } = useMapsData();

  const { generarRutas, clearRoutes } = useMapRoutes(
    mapInstanceRef,
    createRoutingControl
  );
  const { showPopup } = usePopups(mapInstanceRef, isMobile);

  const [clientes, setClientes] = useState([]);
  const [sucursalMeta, setSucursalMeta] = useState({});
  const [clienteFilter, setClienteFilter] = useState("");
  const [showEncargados, setShowEncargados] = useState(true);
  const [showCuadrillas, setShowCuadrillas] = useState(true);
  const [showSucursales, setShowSucursales] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const compassRef = useRef(null);

  const usersMarkersRef = useRef([]);
  const cuadrillasMarkersRef = useRef([]);
  const sucursalMarkersRef = useRef([]);

  const toggleEncargados = () => setShowEncargados((prev) => !prev);
  const toggleCuadrillas = () => setShowCuadrillas((prev) => !prev);
  const toggleSucursales = () => setShowSucursales((prev) => !prev);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleCuadrillaSelection = (cuadrilla) => {
    clearRoutes();
    generarRutas(cuadrilla);
    mapInstanceRef.current.setView([cuadrilla.lat, cuadrilla.lng], 13);
    showPopup({ type: "cuadrilla", ...cuadrilla }, [cuadrilla.lat, cuadrilla.lng]);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleEncargadoSelection = (user) => {
    clearRoutes();
    mapInstanceRef.current.setView([user.lat, user.lng], 13);
    showPopup({ type: "encargado", ...user }, [user.lat, user.lng]);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleSucursalSelection = (sucursal) => {
    clearRoutes();
    mapInstanceRef.current.setView([sucursal.lat, sucursal.lng], 13);
    showPopup({ type: "sucursal", ...sucursal }, [sucursal.lat, sucursal.lng]);
    if (isMobile) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const fetchClientesData = async () => {
      try {
        const [clientesResponse, sucursalesResponse] = await Promise.all([getClientes(), getSucursales()]);
        setClientes(clientesResponse.data || []);
        const meta = {};
        (sucursalesResponse.data || []).forEach((sucursal) => {
          meta[sucursal.id] = sucursal;
        });
        setSucursalMeta(meta);
      } catch (error) {
        console.error("Error fetching clientes para el mapa:", error);
      }
    };
    fetchClientesData();
  }, []);

  const filteredSucursales = sucursales.filter((sucursal) => {
    if (!clienteFilter) return true;
    const meta = sucursalMeta[sucursal.id];
    return meta && String(meta.cliente_id) === clienteFilter;
  });

  useEffect(() => {
    if (!mapInstanceRef.current || !filteredSucursales.length) return;

    usersMarkersRef.current.forEach((m) => m?.remove());
    cuadrillasMarkersRef.current.forEach((m) => m?.remove());
    sucursalMarkersRef.current.forEach((m) => m?.remove());

    if (users.length && showEncargados) {
      users.forEach((user) => {
        const marker = L.marker([user.lat, user.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(<FaUserAlt size={22} color="#2c2c2c" />),
            className: "encargado-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: user.name,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => handleEncargadoSelection(user));
        usersMarkersRef.current.push(marker);
      });
    }

    if (cuadrillas.length && showCuadrillas) {
      cuadrillas.forEach((c) => {
        const marker = L.marker([c.lat, c.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(<FaTruck size={22} color="#2c2c2c" />),
            className: "cuadrilla-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: c.name,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => handleCuadrillaSelection(c));
        cuadrillasMarkersRef.current.push(marker);
      });
    }

    if (filteredSucursales.length && showSucursales) {
      filteredSucursales.forEach((s) => {
        const marker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            html: renderToStaticMarkup(
              <FaMapMarkerAlt size={22} color="#2c2c2c" />
            ),
            className: "sucursal-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
          title: s.name,
        }).addTo(mapInstanceRef.current);
        marker.on("click", () => handleSucursalSelection(s));
        sucursalMarkersRef.current.push(marker);
      });
    }

    return () => {
      usersMarkersRef.current.forEach(marker => marker?.remove());
      cuadrillasMarkersRef.current.forEach(marker => marker?.remove());
      sucursalMarkersRef.current.forEach(marker => marker?.remove());
    };
  }, [users, cuadrillas, filteredSucursales, showEncargados, showCuadrillas, showSucursales]);

  useEffect(() => {
    if (!mapInstanceRef.current || !compassRef.current) return;

    const map = mapInstanceRef.current;

    const updateCompass = () => {
      const angle = map.getBearing ? map.getBearing() : 0; // leaflet-rotate
      // Aguja compensa la rotación del mapa
      const needle = compassRef.current.querySelector('.compass-needle');
      if (needle) needle.style.transform = `rotate(${-angle}deg)`;
    };

    map.on('rotate', updateCompass);
    updateCompass();

    return () => map.off('rotate', updateCompass);
  }, []);

  return {
    users,
    cuadrillas,
    sucursales: filteredSucursales,
    clientes,
    clienteFilter,
    setClienteFilter,
    compassRef,
    showEncargados,
    showCuadrillas,
    showSucursales,
    isSidebarOpen,
    toggleEncargados,
    toggleCuadrillas,
    toggleSucursales,
    toggleSidebar,
    handleCuadrillaSelection,
    handleEncargadoSelection,
    handleSucursalSelection,
    setIsSidebarOpen,
  };
};

export default useMapa;
