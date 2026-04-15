"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Station {
  serialNo: number;
  stationName: string;
  stationCode: string;
  arrival: string;
  departure: string;
  day: number;
  distance: string;
  lat: number | null;
  lng: number | null;
  state: string | null;
}

interface TrainMapProps {
  stations: Station[];
  trainName: string;
}

export interface TrainMapHandle {
  flyToStation: (stationCode: string, index: number) => void;
}

// Color palette for states
const STATE_COLORS: Record<string, string> = {
  Karnataka: "#e74c3c",
  "Tamil Nadu": "#3498db",
  "Andhra Pradesh": "#2ecc71",
  Telangana: "#f39c12",
  Maharashtra: "#9b59b6",
  "Madhya Pradesh": "#1abc9c",
  "Uttar Pradesh": "#e67e22",
  Bihar: "#2980b9",
  "West Bengal": "#d35400",
  Jharkhand: "#27ae60",
  Odisha: "#8e44ad",
  Rajasthan: "#c0392b",
  Gujarat: "#16a085",
  Punjab: "#f1c40f",
  Haryana: "#7f8c8d",
  Kerala: "#2c3e50",
  Goa: "#d63384",
  Chhattisgarh: "#fd7e14",
  Delhi: "#6610f2",
  Assam: "#20c997",
  Uttarakhand: "#0dcaf0",
  "Jammu & Kashmir": "#6f42c1",
  "Himachal Pradesh": "#198754",
  Puducherry: "#dc3545",
  Tripura: "#adb5bd",
};

function getStateColor(state: string | null): string {
  if (!state) return "#95a5a6";
  return STATE_COLORS[state] || "#95a5a6";
}

const TrainMap = forwardRef<TrainMapHandle, TrainMapProps>(
  function TrainMap({ stations, trainName }, ref) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const highlightCircleRef = useRef<L.CircleMarker | null>(null);

    useImperativeHandle(ref, () => ({
      flyToStation(stationCode: string, index: number) {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Try by "code-index" key first, then just code
        const key = `${stationCode}-${index}`;
        const marker = markersRef.current.get(key);
        if (!marker) return;

        const latLng = marker.getLatLng();

        // Remove previous highlight
        if (highlightCircleRef.current) {
          highlightCircleRef.current.remove();
          highlightCircleRef.current = null;
        }

        // Fly to the station
        map.flyTo(latLng, 10, { duration: 0.8 });

        // Add a pulsing highlight circle
        const highlight = L.circleMarker(latLng, {
          radius: 20,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.8,
          className: "pulse-marker",
        }).addTo(map);
        highlightCircleRef.current = highlight;

        // Open the popup after flying
        setTimeout(() => {
          marker.openPopup();
        }, 850);

        // Remove highlight after a few seconds
        setTimeout(() => {
          if (highlightCircleRef.current === highlight) {
            highlight.remove();
            highlightCircleRef.current = null;
          }
        }, 4000);
      },
    }));

    useEffect(() => {
      if (!mapRef.current) return;

      // Clean up previous map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();

      const stationsWithCoords = stations.filter(
        (s) => s.lat !== null && s.lng !== null
      );

      if (stationsWithCoords.length === 0) return;

      // Create map
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      // Build route line coordinates and add markers
      const routeCoords: L.LatLngExpression[] = [];

      stationsWithCoords.forEach((station, idx) => {
        const latLng: L.LatLngExpression = [station.lat!, station.lng!];
        routeCoords.push(latLng);

        const isFirst = idx === 0;
        const isLast = idx === stationsWithCoords.length - 1;
        const color = getStateColor(station.state);

        // Create custom icon
        const size = isFirst || isLast ? 14 : 9;
        const borderColor = isFirst ? "#22c55e" : isLast ? "#ef4444" : color;
        const fillColor = isFirst ? "#22c55e" : isLast ? "#ef4444" : "#ffffff";

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background: ${fillColor};
            border: 2.5px solid ${borderColor};
            border-radius: 50%;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker(latLng, { icon }).addTo(map);

        // Store marker reference with unique key
        const originalIndex = stations.findIndex(
          (s) => s.stationCode === station.stationCode && s.lat === station.lat
        );
        const key = `${station.stationCode}-${originalIndex}`;
        markersRef.current.set(key, marker);

        // Popup content with weather + amenities placeholders
        const weatherId = `weather-${station.stationCode}-${idx}`;
        const amenitiesId = `amenities-${station.stationCode}-${idx}`;
        const popupContent = `
          <div style="font-family: system-ui; min-width: 220px; max-width: 280px;">
            <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 4px;">
              ${station.stationName}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
              ${station.stationCode} &middot; ${station.state || "Unknown"}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
              <div><span style="color: #94a3b8;">Arr:</span> <strong>${station.arrival || "—"}</strong></div>
              <div><span style="color: #94a3b8;">Dep:</span> <strong>${station.departure || "—"}</strong></div>
              <div><span style="color: #94a3b8;">Day:</span> <strong>${station.day}</strong></div>
              <div><span style="color: #94a3b8;">Dist:</span> <strong>${station.distance || "—"}</strong></div>
            </div>
            <div id="${weatherId}" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              Loading weather...
            </div>
            <div id="${amenitiesId}" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              Loading nearby amenities...
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
              Stop #${station.serialNo}
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { maxWidth: 320 });

        // Fetch weather + amenities when popup opens
        marker.on("popupopen", () => {
          // Weather
          const wEl = document.getElementById(weatherId);
          if (wEl && wEl.dataset.loaded !== "true") {
            wEl.dataset.loaded = "true";
            fetch(`/api/weather?lat=${station.lat}&lng=${station.lng}`)
              .then((r) => r.json())
              .then((w) => {
                if (w.error) {
                  wEl.textContent = "Weather unavailable";
                  return;
                }
                wEl.innerHTML = `
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 20px; line-height: 1;">${w.icon}</span>
                    <div>
                      <div style="font-weight: 600; color: #1e293b; font-size: 13px;">
                        ${w.temperature}°C
                        <span style="font-weight: 400; color: #64748b; font-size: 11px;">feels ${w.feelsLike}°C</span>
                      </div>
                      <div style="color: #64748b; font-size: 11px;">
                        ${w.description} &middot; 💧${w.humidity}% &middot; 💨${w.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                `;
              })
              .catch(() => {
                wEl.textContent = "Weather unavailable";
              });
          }

          // Amenities
          const aEl = document.getElementById(amenitiesId);
          if (aEl && aEl.dataset.loaded !== "true") {
            aEl.dataset.loaded = "true";
            fetch(`/api/amenities?lat=${station.lat}&lng=${station.lng}&radius=500`)
              .then((r) => r.json())
              .then((a) => {
                if (a.error || !a.amenities || a.amenities.length === 0) {
                  aEl.innerHTML = `<span style="color: #94a3b8; font-size: 11px;">🏪 No amenities found nearby</span>`;
                  return;
                }
                // Group by category
                const groups: Record<string, number> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                a.amenities.forEach((item: any) => {
                  groups[item.category] = (groups[item.category] || 0) + 1;
                });
                const catIcons: Record<string, string> = {
                  food: "🍽️",
                  atm: "🏧",
                  toilets: "🚻",
                  pharmacy: "💊",
                  shop: "🛒",
                  waiting: "🪑",
                  other: "📍",
                };
                const catLabels: Record<string, string> = {
                  food: "Food",
                  atm: "ATM/Bank",
                  toilets: "Toilets",
                  pharmacy: "Pharmacy",
                  shop: "Shop",
                  waiting: "Waiting",
                  other: "Other",
                };
                // Summary pills
                const summary = Object.entries(groups)
                  .map(
                    ([cat, count]) =>
                      `<span style="display: inline-flex; align-items: center; gap: 2px; background: #f1f5f9; padding: 2px 6px; border-radius: 999px; font-size: 10px; color: #475569; margin-right: 4px; margin-bottom: 2px;">${catIcons[cat] || "📍"} <strong>${count}</strong> ${catLabels[cat] || cat}</span>`
                  )
                  .join("");
                // Top 5 nearest
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const top = a.amenities.slice(0, 5).map((item: any) => {
                  const icon = catIcons[item.category] || "📍";
                  const name = item.name.length > 28 ? item.name.slice(0, 28) + "…" : item.name;
                  return `<div style="font-size: 11px; color: #475569; display: flex; justify-content: space-between; gap: 4px;"><span>${icon} ${name}</span><span style="color: #94a3b8;">${item.distance}m</span></div>`;
                }).join("");
                aEl.innerHTML = `
                  <div style="font-weight: 600; color: #1e293b; font-size: 11px; margin-bottom: 4px;">
                    Nearby (${a.total} within 500m)
                  </div>
                  <div style="margin-bottom: 4px;">${summary}</div>
                  <div style="margin-top: 4px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
                    ${top}
                  </div>
                `;
              })
              .catch(() => {
                if (aEl) aEl.textContent = "Amenities unavailable";
              });
          }
        });
      });

      // Draw route line with gradient effect using polyline segments
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const fromStation = stationsWithCoords[i];
        const toStation = stationsWithCoords[i + 1];
        const segment = [routeCoords[i], routeCoords[i + 1]];

        // Use the "from" station's state color
        const color = getStateColor(fromStation.state);

        // Draw a slightly thicker background line
        L.polyline(segment, {
          color: "#1e293b",
          weight: 5,
          opacity: 0.2,
        }).addTo(map);

        // Draw the colored line
        L.polyline(segment, {
          color,
          weight: 3,
          opacity: 0.85,
          dashArray: fromStation.state !== toStation.state ? "8, 6" : undefined,
        }).addTo(map);
      }

      // Fit bounds with padding
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [40, 40] });

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        markersRef.current.clear();
      };
    }, [stations, trainName]);

    return (
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: "400px" }}
      />
    );
  }
);

export default TrainMap;
