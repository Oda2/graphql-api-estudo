import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import * as cors from 'cors';
import * as compression from 'compression';

import db from './models';
import schema from './graphql/schema';
import { extractJwtMiddleware } from './middlewares/extract-jwt.middleware';
import { DataLoaderFactory } from './graphql/dataloaders/DataLoaderFactory';
import { RequestFields } from './graphql/ast/RequestFields';

class App {
  public express: express.Application;
  private dataLoaderFactory: DataLoaderFactory;
  private requestFields: RequestFields;

  constructor() {
    this.express = express();
    this.init();
  }

  private init(): void {
    this.requestFields = new RequestFields();
    this.dataLoaderFactory = new DataLoaderFactory(db, this.requestFields);
    this.middleware();
  }

  private middleware(): void {
    this.express.use(cors({
      origin: '*', // http://myapp.com
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Encoding'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    this.express.use(compression());
    
    this.express.use('/graphql',
      (req, res, next) => {
        req['context'] = {};
        req['context']['db'] = db;
        req['context']['dataloaders'] = this.dataLoaderFactory.getLoaders();
        req['context']['requestFields'] = this.requestFields;
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
