import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import db from './models';
import schema from './graphql/schema';
import { extractJwtMiddleware } from './middlewares/extract-jwt.middleware';
import { DataLoaderFactory } from './graphql/dataloaders/DataLoaderFactory';

class App {
  public express: express.Application;
  private dataLoaderFactory: DataLoaderFactory;

  constructor() {
    this.express = express();
    this.init();
  }

  private init(): void {
    this.dataLoaderFactory = new DataLoaderFactory(db);
    this.middleware();
  }

  private middleware(): void {
    this.express.use('/graphql',
      (req, res, next) => {
        req['context'] = {};
        req['context']['db'] = db;
        req['context']['dataloaders'] = this.dataLoaderFactory.getLoaders();
        next();
      },

      extractJwtMiddleware(),

      graphqlHTTP((req) => ({
        schema: schema,
        graphiql: process.env.NODE_ENV === 'development',
        context: req['context']
      }))
    );
  }
}

export default new App().express;
