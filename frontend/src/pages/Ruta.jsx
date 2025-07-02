import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import { bearing } from '@turf/turf';

const MapaConRotacionDinamica = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerUserRef = useRef(null);
  const previousPosition = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const map = L.map(mapRef.current, {
      center: [-31.4167, -64.1833], // Posición inicial cualquiera
      zoom: 18,
      rotate: true,
      rotateControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por este navegador.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const current = [latitude, longitude];

        // Agregar o actualizar marcador
        if (!markerUserRef.current) {
          markerUserRef.current = L.marker(current, {
            icon: L.divIcon({
              html: `<div style="width: 15px; height: 20px; background: blue; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); transform: translateY(-50%);"></div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 20],
            }),
          }).addTo(mapInstanceRef.current);
        } else {
          markerUserRef.current.setLatLng(current);
        }

        // Si hay una posición anterior, calcular el ángulo
        if (previousPosition.current) {
          const from = [previousPosition.current[1], previousPosition.current[0]];
          const to = [longitude, latitude];
          const angle = bearing(from, to);

          // Rotar el mapa hacia la dirección del movimiento
          if (mapInstanceRef.current.setBearing) {
            mapInstanceRef.current.setView(current, 18);
            mapInstanceRef.current.setBearing(-angle); // Negativo para que la dirección quede "hacia arriba"
          }
        } else {
          // Primera vez: centrar el mapa
          mapInstanceRef.current.setView(current, 18);
        }

        previousPosition.current = [latitude, longitude];
      },
      (err) => {
        console.error(err);
        setError('Error al obtener tu ubicación.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      map.remove();
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {error && <div style={{ color: 'red', padding: '1rem' }}>{error}</div>}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default MapaConRotacionDinamica;