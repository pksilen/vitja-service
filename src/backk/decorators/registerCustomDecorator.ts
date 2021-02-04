import { registerDecorator, ValidationDecoratorOptions } from 'class-validator';

export default function registerCustomDecorator(options: ValidationDecoratorOptions, testValue: any) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  registerDecorator({ ...options, testValue });
}
