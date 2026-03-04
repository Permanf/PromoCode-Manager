import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClickhouseSyncService } from '../clickhouse/clickhouse-sync.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly clickhouseSync: ClickhouseSyncService,
  ) {}

  async create(createUserDto: CreateUserDto, passwordHash: string): Promise<UserDocument> {
    const { password: _p, ...rest } = createUserDto;
    const user = new this.userModel({
      ...rest,
      passwordHash,
    });
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+passwordHash').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .select('-passwordHash')
      .exec();
    if (!user) throw new NotFoundException(`User #${id} not found`);
    await this.clickhouseSync.syncUser(user).catch((e) => console.error('CH sync:', e));
    return user;
  }

  async deactivate(id: string): Promise<UserDocument> {
    return this.update(id, { isActive: false });
  }
}
