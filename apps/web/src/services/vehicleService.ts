import { apiFetch } from './api';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  nickname: string | null;
}

export interface VehicleInput {
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  nickname?: string | null;
}

export function listVehicles(): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>('/vehicles');
}

export function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return apiFetch<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateVehicle(id: number, input: Partial<VehicleInput>): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteVehicle(id: number): Promise<void> {
  return apiFetch<void>(`/vehicles/${id}`, { method: 'DELETE' });
}
