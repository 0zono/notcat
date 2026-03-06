
import { Building, Territory } from '../types';

const CUIABA_BBOX = "-15.61,-56.12,-15.58,-56.07";

export const fetchResidentialData = async (): Promise<{ buildings: Building[], territories: Territory[] }> => {
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${CUIABA_BBOX});
      way["landuse"="residential"](${CUIABA_BBOX});
    );
    out body;
    >;
    out skel qt;
  `;
  
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Falha ao buscar dados do OSM');
    
    const data = await response.json();
    
    // Helper to resolve coordinates from nodes
    const nodesMap: Record<number, [number, number]> = {};
    data.elements.filter((e: any) => e.type === 'node').forEach((n: any) => {
      nodesMap[n.id] = [n.lat, n.lon];
    });

    const buildings: Building[] = [];
    const territories: Territory[] = [];

    data.elements.filter((e: any) => e.type === 'way').forEach((way: any) => {
      const coords = way.nodes.map((nodeId: number) => nodesMap[nodeId]).filter(Boolean);
      
      if (way.tags.building) {
        // Find center for marker
        const latSum = coords.reduce((acc: number, c: any) => acc + c[0], 0);
        const lngSum = coords.reduce((acc: number, c: any) => acc + c[1], 0);
        
        buildings.push({
          id: way.id.toString(),
          lat: latSum / coords.length,
          lng: lngSum / coords.length,
          address: way.tags['addr:street'] ? `${way.tags['addr:street']}, ${way.tags['addr:housenumber'] || 'S/N'}` : 'Endereço não mapeado',
          type: way.tags.building,
          polygon: coords // Store the full footprint
        });
      } else if (way.tags.landuse === 'residential') {
        territories.push({
          id: way.id.toString(),
          name: way.tags.name || 'Setor Residencial',
          coordinates: coords
        });
      }
    });

    return { buildings, territories };
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    return { buildings: [], territories: [] };
  }
};
