import { Address, RentInfo } from 'onecore-types'

export enum ParkingSpaceType {
  WarmGarage,
  ColdGarage,
  ThermalGarage,
  CentralGarage,
  MotorcycleGarage,
  ParkingSpaceWithoutElectricity,
  ParkingSpaceWithElectricity,
  CaravanParkingSpace,
  MotorcycleParkingSpace,
  ParkingDeck,
  Carport,
  Garage,
  ColdGarageWithElectricity,
  CollectiveParkingSpace,
  FreeParkingSpace,
  ParkingSpaceWithElectricityWEBEL,
  VisitorParkingSpace,
  CentralFacilityParkingSpace,
  DisabledParkingPlace,
  ParkingSpaceWithChargingBox,
  CarportWithChargingBox,
}

export const parkingSpaceTypeTranslation: Record<string, ParkingSpaceType> = {
  VARMG: ParkingSpaceType.WarmGarage,
  KALLG: ParkingSpaceType.ColdGarage,
  TERMOG: ParkingSpaceType.ThermalGarage,
  CENTG: ParkingSpaceType.CentralGarage,
  MCGAR: ParkingSpaceType.MotorcycleGarage,
  PPLUEL: ParkingSpaceType.ParkingSpaceWithoutElectricity,
  PPLMEL: ParkingSpaceType.ParkingSpaceWithElectricity,
  HUSVPL: ParkingSpaceType.CaravanParkingSpace,
  MCPPL: ParkingSpaceType.MotorcycleParkingSpace,
  PDÄCK: ParkingSpaceType.ParkingDeck,
  CPORT: ParkingSpaceType.Carport,
  GARAGE: ParkingSpaceType.Garage,
  KGAREL: ParkingSpaceType.ColdGarageWithElectricity,
  SAMPPL: ParkingSpaceType.CollectiveParkingSpace,
  PPLFRI: ParkingSpaceType.FreeParkingSpace,
  PPLWEB: ParkingSpaceType.ParkingSpaceWithElectricityWEBEL,
  PBESÖK: ParkingSpaceType.VisitorParkingSpace,
  CENTER: ParkingSpaceType.CentralFacilityParkingSpace,
  PHKP: ParkingSpaceType.DisabledParkingPlace,
  LADDBOX: ParkingSpaceType.ParkingSpaceWithChargingBox,
  CPORTMBOX: ParkingSpaceType.CarportWithChargingBox,
}

export enum ParkingSpaceApplicationCategory {
  internal = 0,
  external = 1,
}

export const parkingSpaceApplicationCategoryTranslation: Record<
  string,
  ParkingSpaceApplicationCategory
> = {
  'Bilplats (extern)': ParkingSpaceApplicationCategory.external,
  'Bilplats (intern)': ParkingSpaceApplicationCategory.internal,
}

export interface ParkingSpace {
  parkingSpaceId: string
  address: Address
  rent: RentInfo
  vacantFrom: Date
  type: ParkingSpaceType
  applicationCategory: ParkingSpaceApplicationCategory
}
