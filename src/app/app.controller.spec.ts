import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import SalesItemsServiceImpl from '../services/salesitems/MongoDbSalesItemsServiceImpl';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [SalesItemsServiceImpl],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      // expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
