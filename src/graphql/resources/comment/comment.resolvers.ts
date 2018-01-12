import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";

import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";

export const commentResolvers = {

  Comment: {
    user: (parent, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
      return userLoader
        .load(parent.get('author'))
        .catch(handleError);
    },

    post: (parent, args, { db, dataloaders: { postLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
      return postLoader
        .load(parent.get('post'))
        .catch(handleError);
    }
  },

  Query: {
    commentsByPost: (parent, { postId, first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      postId = parseInt(postId);
      return db.Comment
        .findAll({
          where: { post: postId },
          limit: first,
          offset: offset
        })
        .catch(handleError);
    }
  },

  Mutation: {
    createComment: compose(...authResolvers)
      ((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
        input.user = authUser.id;
        return db.sequelize.transaction((t: Transaction) => {
          return db.Comment.create(input, { transaction: t });
        }).catch(handleError);
      }),

    updateComment: compose(...authResolvers)
      ((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
        id = parseInt(id);
        return db.sequelize.transaction((t: Transaction) => {
          return db.Comment
            .findById(id)
            .then((comment: CommentInstance) => {
              throwError(!comment, `Post with id ${id} not found!`);
              throwError(comment.get('user') != authUser.id, 'Unauthorized! you can only edit comments by yourself!');
              return comment.update(input, { transaction: t });
            }).catch(handleError);
        });
      }),

    deleteComment: compose(...authResolvers)
      ((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
        id = parseInt(id);
        return db.sequelize.transaction((t: Transaction) => {
          return db.Comment
            .findById(id)
            .then((comment: CommentInstance) => {
              throwError(!comment, `Post with id ${id} not found!`);
              throwError(comment.get('user') != authUser.id, 'Unauthorized! you can only edit comments by yourself!');
              return comment.destroy({ transaction: t })
                .then((comment) => !!comment);
            });
        }).catch(handleError);
      })
  }
}