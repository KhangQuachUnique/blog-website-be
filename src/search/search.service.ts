import { Injectable } from '@nestjs/common';
import { SearchDto, SearchType } from './dto/search.dto';
import { SearchDao } from './search.dao';

@Injectable()
export class SearchService {
  constructor(private readonly searchDao: SearchDao) {}

  async search(searchDto: SearchDto) {
    const { q, type } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; // Chuẩn bị chuỗi tìm kiếm tương đối (ILIKE)

    // Nếu type là ALL hoặc undefined, tìm tất cả loại
    if (type === SearchType.ALL || !type) {
      return await this.searchDao.searchAll(keyword);
    }

    // Tìm kiếm theo loại cụ thể
    switch (type) {
      case SearchType.POST:
        return await this.searchDao.searchPosts(keyword);
      case SearchType.USER:
        return await this.searchDao.searchUsers(keyword);
      case SearchType.COMMUNITY:
        return await this.searchDao.searchCommunities(keyword);
      case SearchType.HASHTAG:
        return await this.searchDao.searchHashtags(keyword);
      default:
        return [];
    }
  }
}