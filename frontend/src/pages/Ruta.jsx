import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { RouteContext } from '../context/RouteContext';
import { getSucursalesLocations } from '../services/maps';
import { bearing } from '@turf/turf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-geometryutil';
import '../styles/mapa.css';

const mapContainerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -31.4167, lng: -64.1833 };

const Ruta = () => {
  const { currentEntity } = useContext(AuthContext);
  const { selectedMantenimientos } = useContext(RouteContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const lastRouteRef = useRef(null);
  const userMarkerRef = useRef(null);
  const prevLatLngRef = useRef(null);

  // Cargar sucursales al montar
  useEffect(() => {
    if (!currentEntity) return navigate('/login');
    getSucursalesLocations()
      .then(res => setSucursales(res.data))
      .catch(() => setError('Error al cargar sucursales'));
  }, [currentEntity, navigate]);

  useEffect(() => {
    const ids = [...new Set(selectedMantenimientos.map(m => m.id_sucursal))].filter(Boolean);
    setSelectedSucursales(ids.map(String));
  }, [selectedMantenimientos]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 20,
      rotate: true,
      rotateControl: false,
    });
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(map);
    return () => map.remove();
  }, []);

  const centerOnUser = () => {
    if (mapInstanceRef.current && prevLatLngRef.current) {
      mapInstanceRef.current.setView(prevLatLngRef.current, 20);
    }
  };

  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigating(false);
      setSteps([]);
      setCurrentStepIndex(0);
    } else if (routingControl) {
      iniciarNavegacion(routingControl);
    }
  };

  const iniciarNavegacion = (route) => {
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) return;

    const instructions = waypoints.slice(1).map((wp, i) => {
      const instruction = route.getPlan().instructions?.find(inst => inst.waypointIndex === i + 1);
      return {
        start_location: [wp.latLng.lat, wp.latLng.lng],
        instructions: instruction ? instruction.text : `Waypoint ${i + 1}`,
      };
    });

    setSteps(instructions);
    setIsNavigating(true);
  };

  // Geolocalización y rotación basada en movimiento
  useEffect(() => {
    if (!navigator.geolocation) return setError('Geolocalización no disponible');

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const currentLatLng = L.latLng(latitude, longitude);

        // Calcular ángulo según movimiento
        let heading = 0;
        if (prevLatLngRef.current) {
          heading = bearing([
            prevLatLngRef.current.lng,
            prevLatLngRef.current.lat,
          ], [longitude, latitude]);
        }
        prevLatLngRef.current = currentLatLng;

        // Rotar y centrar mapa
        if (isNavigating && mapInstanceRef.current?.setBearing) {
          mapInstanceRef.current.setView(currentLatLng, 20);
          mapInstanceRef.current.setBearing(-heading);
        }

        // Marcar ubicación actual
        userMarkerRef.current?.remove();
        userMarkerRef.current = L.marker(currentLatLng, {
          icon: L.divIcon({
            html: `<div style="width: 15px; height: 20px; background: blue; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
        }).addTo(mapInstanceRef.current);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating]);

  // Generar ruta
  useEffect(() => {
    if (!selectedSucursales.length || !sucursales.length || !mapInstanceRef.current) return;

    const user = prevLatLngRef.current;
    if (!user) return;

    const waypoints = selectedSucursales.map(id => {
      const s = sucursales.find(s => s.id == id);
      return s ? L.latLng(s.lat, s.lng) : null;
    }).filter(Boolean);

    if (routingControl) {
      mapInstanceRef.current.removeControl(routingControl);
      setRoutingControl(null);
    }
    if (routePolyline) {
      routePolyline.remove();
      setRoutePolyline(null);
    }

    const control = L.Routing.control({
      waypoints: [user, ...waypoints],
      router: L.Routing.osrmv1({ serviceUrl: import.meta.env.VITE_OSRM_URL }),
      lineOptions: { styles: [{ color: '#FF0000', weight: 5 }] },
      createMarker: () => null,
      addWaypoints: false,
      routeWhileDragging: false,
      show: false
    }).addTo(mapInstanceRef.current);

    control.on('routesfound', (e) => {
      const route = e.routes[0];
      const poly = L.polyline(route.coordinates, { color: '#FF0000', weight: 5 });
      poly.addTo(mapInstanceRef.current);
      setRoutePolyline(poly);
      mapInstanceRef.current.fitBounds(poly.getBounds());
      setRoutingControl(control);
    });

    control.on('routingerror', () => setError('Error al calcular la ruta'));
  }, [selectedSucursales, sucursales]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <Button variant="primary" onClick={centerOnUser} className="mb-2">
        Centrar en mi ubicación
      </Button>
      <Button variant={isNavigating ? 'danger' : 'success'} onClick={toggleNavegacion} disabled={!routingControl} className="mb-3 ms-2">
        {isNavigating ? 'Detener navegación' : 'Iniciar navegación'}
      </Button>
      <div ref={mapRef} style={mapContainerStyle}></div>
    </div>
  );
};

export default Ruta;