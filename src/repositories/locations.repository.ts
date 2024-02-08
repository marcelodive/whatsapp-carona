import { LatLngLiteral } from "@google/maps"
import { BaseRepository } from "./base.repository.js"

export type LocationByCep = {
  id: string,
  cep: string,
  location: LatLngLiteral
}

export class LocationsRepository extends BaseRepository<LocationByCep> {
  constructor() {
    super('locations-by-cep');
  }
}