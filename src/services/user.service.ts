import { Message } from 'venom-bot';
import { User, UsersRepository } from '../repositories/users.repository.js';
import { MessageService } from './message.service.js';

export class UserService {
  private usersRepository: UsersRepository;
  
  constructor() {
    this.usersRepository = new UsersRepository();
  }

  isUserRegistered (id: string): boolean {
    return !!this.usersRepository.findById(id);
  }

  update(user: User): void {
    this.usersRepository.update(user.id, user);
  }

  async startUserRegistration (message: Message) {
    await MessageService.sendText(message.from, 'Olá! Antes de começarmos, vamos fazer seu cadastro rapidinho?\n\nPrimeiramente, *qual seu nome*? (Nome e sobrenome)');
    this.update(this.buildUserFromMessage(message));
  }
  
  findById (id: string): User {
    return this.usersRepository.findById(id);
  }

  private buildUserFromMessage(message: Message) {
    const user: User = {
      id: message.from,
      phone: message.from.split('@')[0],
      lastAction: this.startUserRegistration.name,
      isTalkingToHuman: false,
    };
    return user;
  }

  findAll(): {[key: string] : User} {
    return this.usersRepository.findAll()
  }

  restartUser(user: User) {
    return this.usersRepository.restartUser(user);
  }
}