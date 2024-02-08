import { Message, Whatsapp } from 'venom-bot';
import { UserService } from './user.service.js';
import { ActionService } from './action.service.js';
import { sleepRnd } from '../helpers/helpers.js';
import { RouteService } from './route.service.js';

export class MessageService {
  private static client: Whatsapp;
  private userService: UserService;
  private actionService: ActionService;
  private routeService: RouteService;
  
  constructor(client: Whatsapp) {
    MessageService.client = client;
    this.userService = new UserService();
    this.actionService = new ActionService();
    this.routeService = new RouteService();
  }

  async handleMessage(message: Message) {
    if (message.body === `\\TRIGGER_RIDE_CALCULATIONS`) {
      this.routeService.updateRoutes();
    } else {
      const isUserRegistered = this.userService.isUserRegistered(message.from);
      if (isUserRegistered) {
        await this.actionService.handleNextAction(message);
      } else {
        this.userService.startUserRegistration(message);
      }
    }
  }

  static async sendText(to: string, message: string): Promise<void> {
    await sleepRnd();
    MessageService.client.sendText(to, message);
  }

  static getClient(): Whatsapp {
    return MessageService.client;
  }

  static setClient(client: Whatsapp) {
    MessageService.client = client;
  }
}