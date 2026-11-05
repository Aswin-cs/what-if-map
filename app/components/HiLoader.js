"use client";

import MapLoader from './MapLoader';

export default function HiLoader({ isUnauth = false }) {
  return <MapLoader isUnauth={isUnauth} defaultStatus="BUILDING WORKSPACE" />;
}
