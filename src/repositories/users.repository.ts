import { BaseRepository } from './base.repository.js';

export const RIDE_TYPE = {
  give: 1,
  get: 2
};

export enum DOMAINS {
  ride = 'ride', 
  human = 'human', 
  menu = 'menu'
};

export type User = {
  id: string,
  name?: string,
  phone?: string,
  cep?: string,
  lastAction: string,
  ride?: {
    type: number,
    maxAddition?: number,
    possibleHitchhikersIds?: string[]
  }
  isTalkingToHuman: boolean,
}

export class UsersRepository extends BaseRepository<User> {
  constructor () {
    super('users');
  }

  restartUser(user: User) {
    return this.update(user.id, 
      {id: user.id, phone: user.phone, lastAction: user.lastAction, isTalkingToHuman: false});
  }
}
