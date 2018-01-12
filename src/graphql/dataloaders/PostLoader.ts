import { PostModel, PostInstance } from '../../models/PostModel';
import { DataLoaderParam } from '../../interfaces/DataLoaderParamInterface';
import { RequestFields } from '../ast/RequestFields';

export class PostLoader {
  static batchPosts(Post: PostModel, params: DataLoaderParam<number>[], requestedFields: RequestFields): Promise<PostInstance[]> {
    let ids: number[] = params.map(item => item.key);

    return Promise.resolve(
      Post
        .findAll({
          where: { id: { $in: ids } },
          attributes: requestedFields.getFields(params[0].info, { keep: ['id'], exclude: ['comment'] })
        })
    )
  }
}