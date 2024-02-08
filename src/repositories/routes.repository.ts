import { BaseRepository } from "./base.repository.js";

export type Route = {
  id: string,
  driverCEP: string,
  hitchhikerCEP: string,
  destinyCEP: string,
  tripMin: number,
  tripWithHitchhikerMin: number,
}

export class RoutesRepository extends BaseRepository<Route> {
  constructor() {
    super('routes');
  }
}