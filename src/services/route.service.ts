import { DestinationsRepository } from "../repositories/destinations.repository.js";
import { LocationsRepository } from "../repositories/locations.repository.js";
import { DESTINY_CEP } from "../repositories/routes.repository.js";
import { RIDE_TYPE, User } from "../repositories/users.repository.js";
import googleMapsClient, { Duration, LatLngLiteral } from '@google/maps';
import { MessageService } from "./message.service.js";
import { UserService } from "./user.service.js";
import { MAPS_KEY } from "../../globals.js";

export class RouteService {
  private mapsClient: googleMapsClient.GoogleMapsClientWithPromise;
  private locationsRepository: LocationsRepository;
  private destinationsRepository: DestinationsRepository
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
    this.locationsRepository = new LocationsRepository();
    this.destinationsRepository = new DestinationsRepository();
    this.mapsClient = googleMapsClient.createClient({
      key: MAPS_KEY,
      Promise: Promise
     });
  }
  
  async updateRoutes() {
    console.log('Updating routes...')
    const users = this.userService.findAll();
    
    const {drivers, hitchhikers} = this.categorizeUsers(users);

    for(const driver of drivers) {
      for (const hitchhiker of hitchhikers) {
        await this.computeRide(driver, hitchhiker)
      }
    }
  }

  private categorizeUsers(users: {[key: string]: User}) {
    return Object.keys(users).reduce(({drivers, hitchhikers}, userKey) => {
      const user = users[userKey];

      if (user.ride?.type === RIDE_TYPE.give) {
        drivers.push(user);
      } else {
        hitchhikers.push(user);
      }

      return {drivers, hitchhikers};
    }, {drivers: [] as User[], hitchhikers: [] as User[]})
  }

  private async computeRide(driver: User, hitchhiker: User) {
    if (!driver.cep || !hitchhiker.cep) return; 

    const driverLocation = await this.getLocation(driver.cep);
    const hitchhikerLocation = await this.getLocation(hitchhiker.cep)
    const destinyLocation = await this.getLocation(DESTINY_CEP);

    const toDestityId = driver.cep + DESTINY_CEP;
    const toDestity = await this.getDuration(toDestityId, driverLocation, destinyLocation, [])
    const toDestityInMin = Math.ceil(toDestity.value/60);
    
    const toHitchhikerAndDestityId = driver.cep + hitchhiker.cep + DESTINY_CEP;
    const toHitchhikerAndDestity = await this.getDuration(toHitchhikerAndDestityId, driverLocation, destinyLocation, [hitchhikerLocation])
    const toHitchhikerAndDestityInMin =  Math.floor(toHitchhikerAndDestity.value/60);

    const difference = toHitchhikerAndDestityInMin - toDestityInMin;

    if (difference <= Number(driver.ride?.maxAddition)) {
      if(driver.ride && !driver.ride?.possibleHitchhikersIds?.includes(hitchhiker.id)) {
        driver.ride.possibleHitchhikersIds ||= [];
        driver.ride.possibleHitchhikersIds.push(hitchhiker.id);
        this.userService.update(driver);

        MessageService.sendText(driver.id, `Oba, encontramos uma pessoa que você pode dar carona (só você fica sabendo deste detalhe)!
        
Entre em contato com *${hitchhiker.name}* pelo número ${hitchhiker.phone} e combinem a carona para o próximo culto!

O CEP dele(a) é *${hitchhiker.cep}* e você pode saber mais informações de sua localização aproximada por este link: http://maps.google.com/?q=${hitchhiker.cep}`);
      }
    }
  }

  private async getLocation(cep: string): Promise<LatLngLiteral> {
    const dbLocation = this.locationsRepository.findById(cep);
    if (dbLocation) {
      return dbLocation.location;
    } else {
      const response = await this.mapsClient.geocode({address: cep + ', Brazil'}).asPromise();
      const location = response.json.results[0].geometry.location;
      this.locationsRepository.update(cep, {id: cep, cep, location});
      return location;
    }
  }

  private async getDuration (durationId: string, origin: LatLngLiteral, destination: LatLngLiteral, 
    waypoints: LatLngLiteral[] = [])
     : Promise<Duration> 
    {
      const destinationDb = this.destinationsRepository.findById(durationId);
      if (destinationDb) {
        return destinationDb.duration;
      } else {
        const date = new Date();
        date.setHours(22);
        date.setMinutes(30);
        const arrival_time = Math.floor(date.getTime() / 1000);

        const response = await this.mapsClient.directions({
          origin, 
          destination, 
          waypoints, 
          arrival_time,
        }).asPromise()
        const duration = response.json.routes[0].legs[0].duration;
        duration.value = response.json.routes[0].legs.reduce((total, leg) => (total + leg.duration.value), 0)
        this.destinationsRepository.update(durationId, {id: durationId, origin, destination, waypoints, duration});
        return duration;
      }
  }
}