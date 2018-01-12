import { UserModel, UserInstance } from '../../models/UserModel';
import { DataLoaderParam } from '../../interfaces/DataLoaderParamInterface';
import { RequestFields } from '../ast/RequestFields';

export class UserLoader {
  static batchUsers(User: UserModel, params: DataLoaderParam<number>[], requestedFields: RequestFields): Promise<UserInstance[]> {
    let ids: number[] = params.map(item => item.key);

    return Promise.resolve(
      User
        .findAll({
          where: { id: { $in: ids } },
          attributes: requestedFields.getFields(params[0].info, { keep: ['id'], exclude: ['post'] })
        })
    )
  }
}