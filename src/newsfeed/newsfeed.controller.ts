import { Controller } from '@nestjs/common';
import { NewsfeedService } from './newsfeed.service';

@Controller('newsfeed')
export class NewsfeedController {
  constructor(private readonly newsfeedService: NewsfeedService) {}
}
