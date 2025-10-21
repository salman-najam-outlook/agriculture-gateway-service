import { SetMetadata } from '@nestjs/common';

export const PlansAllowed = (...plans) => SetMetadata('plans', plans);
