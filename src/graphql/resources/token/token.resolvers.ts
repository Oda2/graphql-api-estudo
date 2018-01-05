import { GraphQLResolveInfo, Token } from "graphql";
import { Transaction } from "sequelize";
import * as jwt from 'jsonwebtoken';

import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { UserInstance } from "../../../models/UserModel";
import { handleError, JWT_SECRET } from "../../../utils/utils";

export const tokenResolvers = {

  Mutation: {
    createToken: (parent, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.User.findOne({
        where: { email: args.email },
        attributes: ['id', 'password']
      })
        .then((user: UserInstance) => {
          let errorMessage: string = 'Unauthorized, wrong email or password!'
          if (!user) throw new Error(errorMessage);
          if (!user.isPassword(user.get('password'), args.password)) throw new Error(errorMessage);

          const payload = { sub: user.get('id') };
          return {
            token: jwt.sign(payload, JWT_SECRET)
          };
        })
        .catch(handleError);
    }
  }
}
