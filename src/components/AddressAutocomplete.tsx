"use client";

import { useRef, useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: Record<string, unknown>
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              geometry?: {
                location: { lat: () => number; lng: () => number };
              };
            };
          };
        };
      };
    };
  }
}

export default function AddressAutocomplete({ value, onChange, placeholder, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!inputRef.current || initialized) return;
    if (!window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address && place.geometry) {
        onChange(
          place.formatted_address,
          place.geometry.location.lat(),
          place.geometry.location.lng()
        );
      }
    });

    setInitialized(true);
  }, [initialized, onChange]);

  // Retry initialization when Google Maps loads
  useEffect(() => {
    if (initialized) return;
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        setInitialized(false); // trigger re-run of above effect
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [initialized]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Enter address"}
      className={className || "w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"}
    />
  );
}
