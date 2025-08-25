import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should redirect to /api', () => {
      const redirectMock = jest.fn();
      const mockResponse = {
        redirect: redirectMock,
      } as unknown as Response;

      appController.redirectToSwagger(mockResponse);
      expect(redirectMock).toHaveBeenCalledWith('/api');
    });
  });
});
