"use client";

import { useEffect, useRef } from "react";

export interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  harvest: boolean;
  brake: boolean;
}

const KEYS: Record<string, keyof Keys> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "harvest",
  ShiftLeft: "brake",
  ShiftRight: "brake",
};

const keys: Keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  harvest: false,
  brake: false,
};

export function getKeys(): Keys {
  return keys;
}

export function useVehicleControls() {
  const keysRef = useRef<Keys>(keys);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = KEYS[e.code];
      if (key) {
        keys[key] = true;
        if (e.code === "Space") e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = KEYS[e.code];
      if (key) keys[key] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keysRef;
}
