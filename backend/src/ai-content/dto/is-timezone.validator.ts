import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValidTimezone } from '../lib/schedule'

// The campaign's daily reset and generation window are computed in this zone,
// so an unknown identifier has to be rejected at the edge rather than blowing
// up inside the scheduler.
export function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isValidTimezone(value),
        defaultMessage: () => 'timezone must be a valid IANA time zone (for example Europe/Istanbul)',
      },
    })
  }
}
