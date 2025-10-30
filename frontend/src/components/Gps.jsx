import { useState } from "react";

const Gps = ({ onLocationUpdate }) => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [locationData, setLocationData] = useState(null);

    const handleGetLocation = () => {
        setError(null);
        setIsLoading(true);
        setLocationData(null);
        
        const geo = navigator.geolocation;
        if (!geo) {
            setError("Geolocation is not supported by this browser.");
            setIsLoading(false);
            return;
        }

        geo.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log("Raw GPS coordinates:", { latitude, longitude });
                    
                    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
                    if (!apiKey) {
                        throw new Error("API key is missing");
                    }

                    const formattedCoords = `${latitude},${longitude}`;
                    const url = `https://api.opencagedata.com/geocode/v1/json?q=${formattedCoords}&key=${apiKey}`;

                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error("Failed to fetch address");
                    }

                    const data = await response.json();
                    console.log("OpenCage API Response:", data);
                    
                    if (data.results && data.results.length > 0) {
                        const result = data.results[0];
                        const components = result.components;
                        
                        // Extract address components
                        const country = components.country || "India";
                        const state = components.state || "Kerala";
                        const district = components.state_district || components.county || components.city || "";
                        const street = components.road || components.suburb || components.neighbourhood || "";
                        const address = result.formatted;
                        
                        console.log("Extracted location components:", {
                            country,
                            state,
                            district,
                            street,
                            address
                        });

                        const newLocationData = {
                            latitude,
                            longitude,
                            lat: latitude,
                            lng: longitude,
                            address,
                            country,
                            state,
                            district,
                            street,
                            formatted_address: address
                        };
                        
                        console.log("Location data to be sent:", newLocationData);
                        setLocationData(newLocationData);
                        
                        if (onLocationUpdate) {
                            onLocationUpdate(newLocationData);
                        }
                    } else {
                        throw new Error("No results found from OpenCage API");
                    }
                } catch (err) {
                    console.error("Error getting location:", err);
                    setError(err.message || "Error getting location");
                } finally {
                    setIsLoading(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Unable to get your location. Please ensure location access is enabled.");
                setIsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <div className="gps-component">
            <button 
                onClick={handleGetLocation}
                className="get-location-btn"
                disabled={isLoading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isLoading ? '#cccccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '10px'
                }}
            >
                {isLoading ? 'Getting Location...' : 'Get Current Location'}
            </button>
            
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <>
                    {locationData ? (
                        <div className="location-info">
                            <div className="coordinates">
                                <p>Latitude: {locationData.latitude}</p>
                                <p>Longitude: {locationData.longitude}</p>
                            </div>
                            <div className="address">
                                <p>Address: {locationData.address || "Fetching address..."}</p>
                                <p>Country: {locationData.country}</p>
                                <p>State: {locationData.state}</p>
                                <p>District: {locationData.district}</p>
                                <p>Street: {locationData.street}</p>
                            </div>
                        </div>
                    ) : (
                        <p>Click the button to get your current location</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Gps;