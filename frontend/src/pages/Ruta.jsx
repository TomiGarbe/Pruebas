import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { RouteContext } from '../context/RouteContext';
import { getSucursalesLocations } from '../services/maps';
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
  const { userLocation, setIsNavigating } = useContext(LocationContext);
  const { currentEntity } = useContext(AuthContext);
  const { selectedMantenimientos } = useContext(RouteContext);
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigatingState] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const lastRouteRef = useRef(null);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!currentEntity) navigate('/login');
    else getSucursalesLocations().then(res => {
      setSucursales(res.data);
    }).catch(err => {
      console.error(err);
      setError('Error al cargar sucursales');
    });
  }, [currentEntity, navigate]);

  useEffect(() => {
    const sucursalIds = [...new Set(selectedMantenimientos.map(m => m.id_sucursal))].filter(Boolean);
    setSelectedSucursales(sucursalIds.map(id => String(id)));
  }, [selectedMantenimientos]);

  useEffect(() => {
    setIsNavigating(isNavigating);
  }, [isNavigating, setIsNavigating]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [userLocation?.lat || defaultCenter.lat, userLocation?.lng || defaultCenter.lng],
      zoom: 20,
      rotate: true,
      rotateControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
    };
  }, []);

  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigatingState(false);
      setSteps([]);
      setCurrentStepIndex(0);
    } else if (routingControl) {
      iniciarNavegacion(routingControl);
    }
  };

  const iniciarNavegacion = (route) => {
    if (!userLocation || !mapInstanceRef.current || !route) return;
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) {
      setError('Ruta inválida: insuficientes waypoints');
      return;
    }
    const instructions = waypoints.slice(1).map((wp, i) => {
      const instruction = route.getPlan().instructions?.find(inst => inst.waypointIndex === i + 1);
      return {
        start_location: [wp.latLng.lat, wp.latLng.lng],
        instructions: instruction ? instruction.text : `Dirígete a waypoint ${i + 1}`
      };
    });
    setSteps(instructions);
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 20, { animate: true, duration: 1.5 });
    setIsNavigatingState(true);
  };

  const centerOnUser = () => {
    if (!userLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 20);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { heading, latitude, longitude } = pos.coords;
        const currentLatLng = L.latLng(latitude, longitude);

        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: `<div style="width: 15px; height: 20px; background: blue; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); transform: translateY(-50%);"></div>`,
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 20]
          })
        }).addTo(mapInstanceRef.current);

        if (isNavigating && mapInstanceRef.current) {
          mapInstanceRef.current.setBearing(heading);
          mapInstanceRef.current.panTo([latitude, longitude]);
          console.log('Map rotated to heading:', heading, 'Panned to:', { lat: latitude, lng: longitude });
        }

        if (isNavigating && routePolyline && mapInstanceRef.current) {
          const closest = L.GeometryUtil.closest(mapInstanceRef.current, routePolyline, currentLatLng);
          const isOnRoute = closest && closest.distance < 50; // 50m threshold
          if (!isOnRoute) {
            console.log('User deviated from route, recalculating...');
            setRoutingControl(null);
            setRoutePolyline(null);
            setSteps([]);
            setCurrentStepIndex(0);
            lastRouteRef.current = null;
          }
        }

        if (isNavigating && steps.length > 0) {
          const index = steps.findIndex((step, i) => {
            const loc = step.start_location;
            const dist = L.latLng(latitude, longitude).distanceTo(L.latLng(loc[0], loc[1])) / 1000;
            return dist < 0.03; // 30m threshold
          });
          if (index !== -1 && index !== currentStepIndex) {
            setCurrentStepIndex(index);
            console.log('Updated step index:', index);
          }
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener la ubicación. Habilite los servicios de ubicación.');
        if (!userLocation) {
          setIsNavigatingState(false);
          mapInstanceRef.current?.setView([defaultCenter.lat, defaultCenter.lng], 20);
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, routePolyline, userLocation, steps, currentStepIndex]);

  useEffect(() => {
    if (!selectedSucursales.length || !userLocation || !sucursales.length || !mapInstanceRef.current) {
      if (routingControl) {
        mapInstanceRef.current.removeControl(routingControl);
        setRoutingControl(null);
      }
      if (routePolyline) {
        routePolyline.remove();
        setRoutePolyline(null);
      }
      setSteps([]);
      setIsNavigatingState(false);
      lastRouteRef.current = null;
      if (userLocation) {
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 20);
      }
      return;
    }

    const currentRouteKey = JSON.stringify(selectedSucursales);
    if (routingControl && lastRouteRef.current === currentRouteKey) return;

    let farthest = null;
    let maxDist = -1;
    selectedSucursales.forEach(id => {
      const s = sucursales.find(s => s.id == id);
      if (!s) return;
      const dist = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(s.lat, s.lng)) / 1000;
      if (dist > maxDist) {
        maxDist = dist;
        farthest = s;
      }
    });

    if (!farthest) {
      setError('No se pudo determinar la sucursal más lejana');
      return;
    }

    const waypoints = selectedSucursales
      .filter(id => id !== String(farthest.id))
      .map(id => {
        const s = sucursales.find(s => s.id == id);
        return s ? L.latLng(s.lat, s.lng) : null;
      })
      .filter(Boolean);

    if (routingControl) {
      mapInstanceRef.current.removeControl(routingControl);
      setRoutingControl(null);
    }
    if (routePolyline) {
      routePolyline.remove();
      setRoutePolyline(null);
    }

    const control = L.Routing.control({
      waypoints: [L.latLng(userLocation.lat, userLocation.lng), ...waypoints, L.latLng(farthest.lat, farthest.lng)],
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
      setRoutePolyline(poly);
      poly.addTo(mapInstanceRef.current);
      mapInstanceRef.current.fitBounds(L.latLngBounds(route.coordinates));
      lastRouteRef.current = currentRouteKey;
      setRoutingControl(control);
    });

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
      setError('Error al calcular la ruta');
    });
  }, [selectedSucursales, userLocation, sucursales]);

  return (
    <div className="map-container">
      {error && <div className="alert alert-danger">{error}</div>}
      <Button variant="primary" onClick={centerOnUser} disabled={!userLocation} className="mb-2">
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