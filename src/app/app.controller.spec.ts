import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { MongodbSalesItemsServiceImpl } from '../services/salesitems/MongoDbSalesItemsServiceImpl';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [MongodbSalesItemsServiceImpl],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      // expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
