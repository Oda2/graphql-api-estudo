import { AuthUser } from './AuthUserInterface';
import { DbConnection } from './DbConnectionInterface';
import { DataLoaders } from './DataLoadersInterface';
import { RequestFields } from '../graphql/ast/RequestFields';

export interface ResolverContext {
  db?: DbConnection;
  authorization?: string;
  authUser?: AuthUser;
  dataloaders?: DataLoaders;
  requestFields?: RequestFields;
}