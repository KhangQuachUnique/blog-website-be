import { PartialType } from '@nestjs/mapped-types';
import { CreateUserReactDto } from './create-user-react.dto';

export class UpdateUserReactDto extends PartialType(CreateUserReactDto) {}
