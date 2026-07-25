export type TimeMode = 'auto' | 'day' | 'sunset' | 'night';

export interface TimeConfig {
  mode: TimeMode;
  resolvedPhase: 'day' | 'sunset' | 'night';
  formattedTime: string;
  isNight: boolean;
  sunPosition: [number, number, number];
  directionalLightColor: string;
  directionalLightIntensity: number;
  ambientLightIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  canvasBackground: string;
  skyTurbidity: number;
  skyRayleigh: number;
  starsVisible: boolean;
  starsCount: number;
  headlightsIntensity: number;
  badgeIcon: string;
  badgeName: string;
}

export function getTimeConfig(mode: TimeMode = 'auto', customDate?: Date): TimeConfig {
  const date = customDate || new Date();
  const hours = date.getHours();
  
  // Format local time e.g., "11:03 PM"
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let phase: 'day' | 'sunset' | 'night' = 'day';

  if (mode === 'auto') {
    if (hours >= 6 && hours < 18) {
      phase = 'day';
    } else if (hours === 5 || hours === 18) {
      phase = 'sunset';
    } else {
      phase = 'night';
    }
  } else {
    phase = mode;
  }

  if (phase === 'day') {
    return {
      mode,
      resolvedPhase: 'day',
      formattedTime,
      isNight: false,
      sunPosition: [100, 45, 80],
      directionalLightColor: '#fff8e7',
      directionalLightIntensity: 1.8,
      ambientLightIntensity: 0.6,
      hemisphereSky: '#87ceeb',
      hemisphereGround: '#4a7c59',
      hemisphereIntensity: 0.4,
      fogColor: '#a8d5a2',
      fogNear: 100,
      fogFar: 280,
      canvasBackground: '#87ceeb',
      skyTurbidity: 6,
      skyRayleigh: 0.8,
      starsVisible: false,
      starsCount: 0,
      headlightsIntensity: 0.3,
      badgeIcon: '☀️',
      badgeName: 'Day',
    };
  }

  if (phase === 'sunset') {
    return {
      mode,
      resolvedPhase: 'sunset',
      formattedTime,
      isNight: false,
      sunPosition: [120, 10, 40],
      directionalLightColor: '#ff7e36',
      directionalLightIntensity: 1.4,
      ambientLightIntensity: 0.45,
      hemisphereSky: '#ff8c53',
      hemisphereGround: '#3a4d3f',
      hemisphereIntensity: 0.5,
      fogColor: '#d87d56',
      fogNear: 80,
      fogFar: 260,
      canvasBackground: '#2c1e30',
      skyTurbidity: 12,
      skyRayleigh: 3.5,
      starsVisible: true,
      starsCount: 1500,
      headlightsIntensity: 4.0,
      badgeIcon: '🌅',
      badgeName: 'Sunset',
    };
  }

  // Night
  return {
    mode,
    resolvedPhase: 'night',
    formattedTime,
    isNight: true,
    sunPosition: [-80, -30, -50],
    directionalLightColor: '#60a5fa',
    directionalLightIntensity: 0.45,
    ambientLightIntensity: 0.18,
    hemisphereSky: '#0f172a',
    hemisphereGround: '#06101e',
    hemisphereIntensity: 0.25,
    fogColor: '#0b1329',
    fogNear: 50,
    fogFar: 220,
    canvasBackground: '#050b14',
    skyTurbidity: 1,
    skyRayleigh: 0.1,
    starsVisible: true,
    starsCount: 5000,
    headlightsIntensity: 14.0,
    badgeIcon: '🌙',
    badgeName: 'Night',
  };
}
