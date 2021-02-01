import dayjs from 'dayjs';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import DbCleanupService from './DbCleanupService';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { SalesItem } from '../salesitems/types/entities/SalesItem';
import SqlEquals from '../../backk/dbmanager/sql/expressions/SqlEquals';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import { Injectable } from '@nestjs/common';
import { CronJob } from '../../backk/decorators/service/function/CronJob';
import MongoDbManager from '../../backk/dbmanager/MongoDbManager';
import MongoDbQuery from '../../backk/dbmanager/mongodb/MongoDbQuery';

@Injectable()
export default class DbCleanupServiceImpl extends DbCleanupService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @CronJob({ minutes: 0, hours: 2 }, [1, 2, 5, 10, 30, 60, 120, 500])
  deleteOldUnsoldSalesItems(): Promise<void | ErrorResponse> {
    console.log('deleteOldUnsoldSalesItems: ' + new Date());
    return this.dbManager.deleteEntitiesByFilters(
      this.dbManager instanceof MongoDbManager
        ? [
            new MongoDbQuery<SalesItem>({
              state: 'forSale',
              createdattimestamp: { $lt: dayjs().subtract(4, 'months').toDate() }
            })
          ]
        : [
            new SqlEquals({ state: 'forSale' }),
            new SqlExpression('createdattimestamp < current_timestamp() - INTERVAL 4 month')
          ],
      SalesItem
    );
  }
}
