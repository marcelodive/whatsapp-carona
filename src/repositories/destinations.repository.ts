import { Duration, LatLngLiteral } from "@google/maps";
import { BaseRepository } from "./base.repository.js";

export type Destination = {
  id: string,
  origin: LatLngLiteral,
  destination: LatLngLiteral,
  waypoints: LatLngLiteral[],
  duration: Duration,
}

export class DestinationsRepository extends BaseRepository<Destination> {
  constructor() {
    super('destinations');
  }

  findByBuildId(origin: LatLngLiteral,
    destination: LatLngLiteral,
    waypoints: LatLngLiteral[]): Destination {
      return this.findById(this.buildId(origin, destination, waypoints));
  }

  buildId(origin: LatLngLiteral,
    destination: LatLngLiteral,
    waypoints: LatLngLiteral[]): string {
    return JSON.stringify(origin) + JSON.stringify(destination) + JSON.stringify(waypoints);
  }
}