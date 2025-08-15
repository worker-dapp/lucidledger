import { useState } from "react";

const GetLocation = () => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        name: "Unknown",
      });
      const [loading, setLoading] = useState(false);
    
      const fetchLocation = () => {
        if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser");
          return;
        }
    
        setLoading(true);
    
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
    
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              const locationName = data.display_name || "Unknown Location";
    
              setLocation({
                latitude,
                longitude,
                name: locationName,
              });
            } catch (error) {
              console.error("Error fetching location name:", error);
              setLocation((prev) => ({ ...prev, name: "Failed to retrieve name" }));
            }
    
            setLoading(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve location");
            setLoading(false);
          }
        );
      };
      return { fetchLocation, location, loading };
}

export default GetLocation