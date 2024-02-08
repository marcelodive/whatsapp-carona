import * as venom from 'venom-bot';
import { MessageService } from './src/services/message.service.js';

if (!process.env.TEST_MESSAGE) {
  venom
    .create({
      session: '' + new Date(),
      multidevice: false,
    } as venom.CreateOptions)
    .then((client) => start(client))
    .catch((erro) => {
      console.error(erro);
    });
  
  function start(client: venom.Whatsapp) {
    client.onMessage(async (message) => {
      const messageService = new MessageService(client);
      if (!message.isGroupMsg) {
        messageService.handleMessage(message);
      }
    });
  }
} else {
  test();
  
  function test() {
    const fakeClient = {sendText: (to: string, message: string) => console.log(to, message)} as any;
    const messageService = new MessageService(fakeClient);
  
    console.log(process.env.TEST_MESSAGE)
    const fakeMessage = {body: process.env.TEST_MESSAGE, from: 'fake_number'} as any;
    messageService.handleMessage(fakeMessage); 
  }
}

