import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Map, Marker, Popup, NavigationControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const INDIA_BOUNDS = [
  [68.1, 6.7],  // Southwest
  [97.4, 35.7]  // Northeast
];

const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const [viewport, setViewport] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4.5
  });
  const [searchInput, setSearchInput] = useState('');
  const [marker, setMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
  if (!apiKey) {
    return <div style={{ padding: 20, color: 'red' }}>MapTiler API key is missing</div>;
  }
  const mapStyle = `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`;

  // 1. Add click handler for the map
  const handleMapClick = useCallback(async (e) => {
    const { lngLat } = e;
    setIsLoading(true);
    
    try {
      // Reverse geocode the clicked location
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lngLat.lng},${lngLat.lat}.json?key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.features.length > 0) {
        const place = data.features[0];
        const location = {
          lng: lngLat.lng,
          lat: lngLat.lat,
          name: place.text || 'Selected Location',
          address: place.place_name
        };
        setMarker(location);
        setViewport(v => ({ ...v, longitude: lngLat.lng, latitude: lngLat.lat, zoom: 12 }));
        
        // Pass the location back to parent component
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      }
    } catch (err) {
      setError('Failed to get location details');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, onLocationSelect]);

  // 2. Modified search function to work with clicks
  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchInput)}.json?key=${apiKey}&country=in`
      );
      
      if (!response.ok) throw new Error(`API request failed`);
      
      const data = await response.json();
      
      if (!data.features?.length) throw new Error('No locations found');
      
      const firstResult = data.features[0];
      const [lng, lat] = firstResult.center;
      
      const location = {
        lng,
        lat,
        name: firstResult.text || searchInput,
        address: firstResult.place_name
      };
      
      setViewport({
        longitude: lng,
        latitude: lat,
        zoom: 12
      });
      setMarker(location);
      
      // Pass the location back to parent component
      if (onLocationSelect) {
        onLocationSelect(location);
      }
      
    } catch (err) {
      setError(err.message);
      setMarker(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, apiKey, onLocationSelect]);

  // ... (keep your existing 3D terrain useEffect) ...

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a location"
          style={{
            padding: '8px',
            width: '250px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginRight: '8px',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '8px 12px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          backgroundColor: '#ffcccc',
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#cc0000',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          {error}
        </div>
      )}

      <Map
        ref={mapRef}
        mapLib={maplibregl}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        maxBounds={INDIA_BOUNDS}
        minZoom={3.5}
      >
        {marker && (
          <Marker 
            longitude={marker.lng} 
            latitude={marker.lat} 
            color="#ff5252"
            draggable
            onDragEnd={handleMapClick}
          >
            <Popup
              closeButton={true}
              closeOnClick={false}
              anchor="bottom"
            >
              <div style={{ padding: 8, minWidth: 200 }}>
                <div style={{ fontWeight: 'bold' }}>{marker.name}</div>
                {marker.address && (
                  <div style={{ fontSize: '0.9em' }}>{marker.address}</div>
                )}
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        <NavigationControl position="bottom-right" />
      </Map>
    </div>
  );
};

export default MapComponent;