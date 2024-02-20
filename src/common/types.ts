import {
  ParkingSpaceApplicationCategory,
  ParkingSpaceType,
} from 'onecore-types'

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

export const parkingSpaceApplicationCategoryTranslation: Record<
  string,
  ParkingSpaceApplicationCategory
> = {
  'Bilplats (extern)': ParkingSpaceApplicationCategory.external,
  'Bilplats (intern)': ParkingSpaceApplicationCategory.internal,
}

export enum ProcessStatus {
  successful,
  failed,
  inProgress,
}

export interface ProcessResult {
  response?: any
  processStatus: ProcessStatus
  httpStatus: number
}
