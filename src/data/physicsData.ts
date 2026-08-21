import { CelestialBody } from '../types';

export const CELESTIAL_BODIES: CelestialBody[] = [
  {
    id: 'earth',
    name: 'Earth',
    g: 9.81,
    description: 'Standard terrestrial gravity at sea level.',
    atmosphereDensity: 1.225,
    color: '#3B82F6',
    radiusKm: 6371,
    icon: '🌍'
  },
  {
    id: 'moon',
    name: 'Moon',
    g: 1.62,
    description: 'One-sixth of Earth gravity. No atmospheric drag.',
    atmosphereDensity: 0.0,
    color: '#9CA3AF',
    radiusKm: 1737,
    icon: '🌕'
  },
  {
    id: 'mars',
    name: 'Mars',
    g: 3.71,
    description: 'Red planet gravity with thin CO2 atmosphere.',
    atmosphereDensity: 0.02,
    color: '#EF4444',
    radiusKm: 3389,
    icon: '🔴'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    g: 24.79,
    description: 'Gas giant with immense surface gravity.',
    atmosphereDensity: 1.33,
    color: '#D97706',
    radiusKm: 69911,
    icon: '🪐'
  },
  {
    id: 'europa',
    name: 'Europa',
    g: 1.31,
    description: 'Jovian icy moon with ocean beneath crust.',
    atmosphereDensity: 0.0,
    color: '#60A5FA',
    radiusKm: 1560,
    icon: '🧊'
  },
  {
    id: 'neutron_star',
    name: 'Neutron Star',
    g: 100.0, // Scaled for visual demonstration
    description: 'Extreme gravity regime (scaled 100 m/s² for real-time visualization).',
    atmosphereDensity: 0.0,
    color: '#A855F7',
    radiusKm: 12,
    icon: '⚡'
  }
];
