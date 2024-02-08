import { Message } from 'venom-bot';
import { UserService } from './user.service.js';
import { DOMAINS, RIDE_TYPE, User } from '../repositories/users.repository.js';
import { MessageService } from './message.service.js';
import { ValidationReturn, isFullName, isNumberBetween1and5, isValidCEP } from '../helpers/validators.js';
import { RouteService } from './route.service.js';

const ANSWER = {
  yes: 1,
  no: 2
};

const MENU_OPTIONS = {
  human: 1,
  ride_jvv: 2,
}

type ActionFunction = (message: Message, user: User) => void;
 
 type ActionType = {
  nextAction: ActionFunction | { [key: number]: ActionFunction };
  validator?: ValidatorType;
 };
 
 type Actions = {
  [key: string]: ActionType;
 };

type ValidatorType = (string: string) => ValidationReturn;

export class ActionService {
  private userService: UserService;
  private routesService: RouteService;
  private TRIGGER_MENU_KEYWORD = 'MENU';
  
  ACTIONS: Actions;
  
  constructor () {
    this.userService = new UserService();
    this.routesService = new RouteService();

    this.ACTIONS = {
      [this.userService.startUserRegistration.name]: {
         nextAction: this.handleSelectedMenuOption,
         validator: isFullName,
      },
      [this.handleSelectedMenuOption.name]: {
         nextAction: {
           [MENU_OPTIONS.human]: this.handleHumanInteraction,
           [MENU_OPTIONS.ride_jvv]: this.handleRideJVVInteraction,
         },
      },
      [this.handleEndingInteraction.name]: {
        nextAction: {
          [MENU_OPTIONS.human]: this.handleHumanInteraction,
          [MENU_OPTIONS.ride_jvv]: this.handleRideJVVInteraction,
        },
      },
      [this.handleRideJVVInteraction.name]: {
         nextAction:  this.handleCEP,
         validator: isValidCEP,
      },
      [this.handleIncorrectRegistration.name]: {
         nextAction: this.handleName,
         validator: isFullName,
      },
      [this.handleName.name]: {
         nextAction: this.handleCEP,
         validator: isValidCEP,
      },
      [this.handleCEP.name]: {
         nextAction: {
           [RIDE_TYPE.give]:  this.handleGiveRide,
           [RIDE_TYPE.get]: this.handleLastStepRegistration,
         },
      },
      [this.handleGiveRide.name]: {
         nextAction: this.handleLastStepRegistration,
         validator: isNumberBetween1and5,
      },
      [this.handleLastStepRegistration.name]: {
         nextAction: {
           [ANSWER.yes]: this.handleRegistrationCompleted,
           [ANSWER.no]: this.handleIncorrectRegistration,
         },
      },
      [this.handleRegistrationCompleted.name]: {
        nextAction: this.handleRegistrationCompleted
      },
      [this.handleHumanInteraction.name]: {
         nextAction: this.handleHumanInteraction,
      },
     };
  }

  async handleNextAction(message: Message) {
    const user = this.userService.findById(message.from);
    const action = this.ACTIONS[user.lastAction];
    const isValid = !action?.validator || this.isValidMessage(action?.validator, message);

    if (isValid) {
      let nextAction;
  
      if (typeof action?.nextAction === 'function') {
        nextAction = action?.nextAction.bind(this);
      } else {
        nextAction = action?.nextAction?.[Number(message.body)]?.bind(this);
      }
  
      if (typeof nextAction === 'function') {
        user.lastAction = nextAction.name.slice(6);
        this.userService.update(user);
        await nextAction(message, user);
      } else if (action) {
        MessageService.sendText(message.from, 'Por favor, escolha uma opção numérica válida.');
      } else {
        this.handleError(message, user);
      }
    }
  }

  isValidMessage(validator: ValidatorType, message: Message): boolean {
    const result = validator(message.body);
    if (!result.isValid) {
      MessageService.sendText(message.from, result.errorMessage);
    }
    return result.isValid;
  }

  handleHumanInteraction(message: Message, user: User) {
    if (!user.isTalkingToHuman) {
      user.isTalkingToHuman = true;
      this.userService.update(user);
      MessageService.sendText(message.from, 'Aguarde, em breve alguém da Equipe GC irá conversar com você.\n\nCaso queira voltar para o menu inicial, digite a palavra ' + this.TRIGGER_MENU_KEYWORD);
      MessageService.sendText('553198650197@c.us',  `${user.name} quer conversar com um humano: ${user.phone}.`);
    } else if (message.body === this.TRIGGER_MENU_KEYWORD) {
      this.handleEndingInteraction(message, user);
    }
  }

  handleEndingInteraction(message: Message, user: User) {
    user.isTalkingToHuman = false;
    user.lastAction = this.handleEndingInteraction.name;
    this.handleSelectedMenuOption(message, user);
  }

  handleRideJVVInteraction(message: Message, user: User) {
    this.userService.update(user);
    if (!user.cep) {
      MessageService.sendText(message.from, 'Para o cadastro no _Caronas JVV_, precisamos saber o seu CEP (somente números, por favor)');
    } else {
      this.handleRegistrationCompleted(message, user);
    }
  }

  handleIncorrectRegistration(message: Message, user: User) {
    this.userService.restartUser(user);
    MessageService.sendText(message.from, 'Tudo bem, vamos começar novamente.\n\nQual seu nome completo? (Nome e sobrenome)');
  }
  
  handleName(message: Message, user: User) {
    user.name = message.body;
    this.userService.update(user);
    MessageService.sendText(message.from, 'Obrigado! Agora precisamos saber o seu CEP (somente números, por favor)');
  }

  handleSelectedMenuOption(message: Message, user: User) {
    user.name = message.body !== this.TRIGGER_MENU_KEYWORD ? message.body : user.name;
    this.userService.update(user);
    MessageService.sendText(message.from, `${user.name}, qual das opções abaixo você deseja acessar?
  *1* - Falar com um ser humano
  *2* - Caronas JVV`)
  }

  handleCEP(message: Message, user: User) {
    user.cep = message.body;
    this.userService.update(user);
    MessageService.sendText(message.from, `Agora preciso saber se você quer *dar carona* ou *receber carona*:
*1* - Dar carona.
*2* - Receber carona.`);
  }

  handleGiveRide(message: Message, user: User) {
    user.ride = { type: RIDE_TYPE.give };
    this.userService.update(user);
    MessageService.sendText(message.from, `Ótimo! E fique tranquilo(a), só você fica sabendo para quem você pode dar carona (para evitar possíveis constrangimentos) :)
    
Agora, uma última pergunta, quantos minutos você está disposto a acrescentar no seu trajeto para oferecer carona?
(Digite um número de 1 a 5)`);
  }

  handleLastStepRegistration(message: Message, user: User) {
    if (!user.ride) {
      user.ride = { type: RIDE_TYPE.get };
    } else if (user?.ride?.type === RIDE_TYPE.give && !user.ride?.maxAddition) {
      user.ride.maxAddition = Number(message.body);
    }

    this.userService.update(user);

    MessageService.sendText(message.from, `Confira abaixo se todos os dados estão corretos:

- Nome: ${user.name}
- CEP: ${user.cep}
- ${user.ride?.type === RIDE_TYPE.give ? 'Você se disponibilizou a dar carona com acréscimo de *' + user.ride.maxAddition + ' min* no trajeto' : 'Você está esperando receber uma carona.'}

Estas informações estão corretas?
1 - Sim
2 - Não
`);
  }

  async handleRegistrationCompleted(message: Message, user: User) {
    const messageToSend = user.ride?.type === RIDE_TYPE.get
      ? '*Seu cadastro foi realizado com sucesso!* Avisaremos para motoristas que tenham rotas similares à sua que você deseja uma carona - e lembre-se: seja generoso, oferte pelo menos 1 litro de gasolina =)'
      : '*Seu cadastro foi realizado com sucesso!* Avisaremos para você quando encontrarmos alguém compatível com sua rota que possa receber sua carona =)'
    MessageService.sendText(message.from, messageToSend);
    this.handleEndingInteraction({...message, body: this.TRIGGER_MENU_KEYWORD}, user);
    await this.routesService.updateRoutes();
  }

  handleError(message: Message, user: User) {
    MessageService.sendText(message.from, 'Ocorreu um erro inesperado. Por favor, entre em contato com o Marcelo (31998650197) para corrigí-lo.');
  }
}