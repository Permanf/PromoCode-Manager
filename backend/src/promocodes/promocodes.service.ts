import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promocode, PromocodeDocument } from './schemas/promocode.schema';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { ClickhouseSyncService } from '../clickhouse/clickhouse-sync.service';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class PromocodesService {
  constructor(
    @InjectModel(Promocode.name) private promocodeModel: Model<PromocodeDocument>,
    private readonly clickhouseSync: ClickhouseSyncService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreatePromocodeDto): Promise<PromocodeDocument> {
    const existing = await this.promocodeModel.findOne({ code: dto.code.toUpperCase() }).exec();
    if (existing) throw new ConflictException(`Promocode ${dto.code} already exists`);
    const promocode = new this.promocodeModel({ ...dto, code: dto.code.toUpperCase() });
    const saved = await promocode.save();
    await this.clickhouseSync.syncPromocode(saved).catch((err) => console.error('CH sync error:', err));
    this.cache.invalidate('analytics:*').catch(() => {});
    return saved;
  }

  async findAll(): Promise<PromocodeDocument[]> {
    return this.promocodeModel.find().exec();
  }

  async findById(id: string): Promise<PromocodeDocument | null> {
    return this.promocodeModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<PromocodeDocument | null> {
    return this.promocodeModel.findOne({ code: code.toUpperCase() }).exec();
  }

  async update(id: string, dto: UpdatePromocodeDto): Promise<PromocodeDocument> {
    const promocode = await this.promocodeModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!promocode) throw new NotFoundException(`Promocode #${id} not found`);
    await this.clickhouseSync.syncPromocode(promocode).catch((err) => console.error('CH sync error:', err));
    this.cache.invalidate('analytics:*').catch(() => {});
    return promocode;
  }

  async deactivate(id: string): Promise<PromocodeDocument> {
    return this.update(id, { isActive: false });
  }
}
