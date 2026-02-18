import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreate(auth0Id: string, email?: string, name?: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { auth0Id } });

    if (!user) {
      user = this.userRepo.create({ auth0Id, email, name });
      await this.userRepo.save(user);
    }

    return user;
  }
}
