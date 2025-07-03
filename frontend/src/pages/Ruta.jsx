import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
const ARRIVAL_RADIUS = 50; // meters

const Ruta = () => {
  const { currentEntity } = useContext(AuthContext);
  const { selectedMantenimientos } = useContext(RouteContext);
  const navigate = useNavigate();
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const prevLatLngRef = useRef(null);

  const fetchSelectedSucursales = async () => {
    try {
      const response = await getSucursalesLocations();
      const sucursales = response.data;
      const ids = [...new Set(selectedMantenimientos.map(m => m.id_sucursal))].filter(Boolean);
      let filteredSucursales = sucursales.filter(sucursal => ids.includes(Number(sucursal.id)));
      
      // Sort by distance from user if location available
      if (prevLatLngRef.current) {
        filteredSucursales = [...filteredSucursales].sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(prevLatLngRef.current.lat - a.lat, 2) +
            Math.pow(prevLatLngRef.current.lng - a.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(prevLatLngRef.current.lat - b.lat, 2) +
            Math.pow(prevLatLngRef.current.lng - b.lng, 2)
          );
          return distA - distB;
        });
      }
      
      setSelectedSucursales(filteredSucursales);
    } catch (error) {
      console.error('Error fetching selected sucursales:', error);
      setError('Error al cargar sucursales');
    }
  };

  const centerOnUser = () => {
    if (mapInstanceRef.current && prevLatLngRef.current) {
      mapInstanceRef.current.setView(prevLatLngRef.current, 20);
    } else {
      console.log('Cannot center: map or user location not available');
    }
  };

  const toggleNavegacion = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else if (routingControl) {
      iniciarNavegacion(routingControl);
    } else {
      console.log('Cannot start navigation: no routing control');
    }
  };

  const iniciarNavegacion = (route) => {
    const waypoints = route.getPlan().getWaypoints();
    if (!waypoints || waypoints.length < 2) {
      console.log('Not enough waypoints to navigate');
      return;
    }

    waypoints.slice(1).map((wp, i) => ({
      start_location: [wp.latLng.lat, wp.latLng.lng],
      instructions: route.getPlan().instructions?.find(inst => inst.waypointIndex === i + 1)?.text || `Waypoint ${i + 1}`,
    }));

    setIsNavigating(true);
    centerOnUser();
  };

  const generarRuta = () => {
    if (!selectedSucursales.length || !mapInstanceRef.current || !prevLatLngRef.current) {
      console.log('Route generation skipped: missing data');
      return;
    }

    const waypoints = selectedSucursales.map((s) => L.latLng(s.lat, s.lng)).filter(Boolean);

    if (routingControl) {
      mapInstanceRef.current.removeControl(routingControl);
      setRoutingControl(null);
    }

    if (routePolyline) {
      routePolyline.remove();
      setRoutePolyline(null);
    }

    const control = L.Routing.control({
      waypoints: [prevLatLngRef.current, ...waypoints],
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

    control.on('routingerror', (err) => {
      console.error('Routing error:', err);
      setError('Error al calcular la ruta');
    });
  };

  // Iniciar mapa
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
    return () => {
      map.remove();
    };
  }, []);

  // Cargar sucursales seleccionadas al montar o cambiar selectedMantenimientos
  useEffect(() => {
    if (!currentEntity) {
      console.log('No current entity, navigating to login');
      return navigate('/login');
    }
    fetchSelectedSucursales();
  }, [currentEntity, navigate, selectedMantenimientos]);

  // Generar ruta al cambiar selectedSucursales
  useEffect(() => {
    generarRuta();
  }, [selectedSucursales]);

  // Geolocalización
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      return setError('Geolocalización no disponible');
    }

    console.log('Starting geolocation watch');
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const currentLatLng = L.latLng(latitude, longitude);

        // Check if user reached any sucursal
        if (selectedSucursales.length && currentLatLng) {
          const updatedSucursales = selectedSucursales.filter(sucursal => {
            const distance = currentLatLng.distanceTo(L.latLng(sucursal.lat, sucursal.lng));
            return distance > ARRIVAL_RADIUS;
          });
          if (updatedSucursales.length !== selectedSucursales.length) {
            setSelectedSucursales(updatedSucursales);
          }
        }

        // Actualizar marcador de usuario
        userMarkerRef.current?.remove();
        userMarkerRef.current = L.marker(currentLatLng, {
          icon: L.divIcon({
            html: `<div style="width: 15px; height: 20px; background: blue; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>`,
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          }),
        }).addTo(mapInstanceRef.current);

        // Rotar mapa si está navegando
        if (isNavigating && mapInstanceRef.current?.setBearing) {
          let heading = 0;
          if (prevLatLngRef.current) {
            heading = bearing(
              [prevLatLngRef.current.lng, prevLatLngRef.current.lat],
              [longitude, latitude]
            );
          }
          mapInstanceRef.current.setView(currentLatLng, 20);
          mapInstanceRef.current.setBearing(-heading);
        }

        prevLatLngRef.current = currentLatLng;

        // Trigger route recalculation if navigating
        if (isNavigating) {
          generarRuta();
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true, maximumAge: 250, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating]);

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