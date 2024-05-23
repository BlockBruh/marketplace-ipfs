import { Module } from '@nestjs/common';
import { DatabaseService } from './service/database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpfsHashes } from './model/ipfsHashes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IpfsHashes])],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
