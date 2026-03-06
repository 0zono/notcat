
export interface Building {
  id: string;
  lat: number;
  lng: number;
  address?: string;
  type: string;
  polygon: [number, number][]; // Footprint do imóvel
}

export interface Territory {
  id: string;
  name: string;
  coordinates: [number, number][];
}

export interface ServiceArea {
  id: string;
  name: string;
  type: 'concession' | 'maintenance' | 'restricted';
  coordinates: [number, number][];
  color: string;
}

export interface Branch {
  id: string;
  name: string;
  type: 'headquarters' | 'branch'; // Matriz ou Filial
  lat: number;
  lng: number;
  manager: string;
}

export interface ConsumerUnit {
  id: string;
  lat: number;
  lng: number;
  owner: string;
  status: 'active' | 'inactive';
  lastReading: string;
}

export interface ArtesianWell {
  id: string;
  lat: number;
  lng: number;
  registrationDate: string;
}

export interface InspectionAlert {
  id: string;
  buildingId: string;
  location: [number, number];
  reason: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  address: string;
}

export interface AuditReport {
  summary: string;
  recommendations: string[];
  riskLevel: string;
}
