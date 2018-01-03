import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";

import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { PostInstance } from "../../../models/PostModel";

export const postResolvers = {
  Query: {
    posts: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Post
        .findAll({
          limit: first,
          offset: offset
        });
    },

    post: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Post
        .findById(id)
        .then((post: PostInstance) => {
          if (!post) {
            throw new Error(`Post with id ${id} not found`);
          }

          return post;
        });
    }
  },

  Mutation: {
    createPost: (parent, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.sequelize.transaction((t: Transaction) => {
        return db.Post.create(args.input, { transaction: t });
      });
    },

    updatePost: (parent, { id, input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);
      return db.sequelize.transaction((t: Transaction) => {
        return db.Post
          .findById(id)
          .then((post: PostInstance) => {
            if (!post) throw new Error(`Post with id ${id} not found!`);
            return post.update(input, { transaction: t });
          });
      });
    },

    deletePost: (parent, { id, input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);
      return db.sequelize.transaction((t: Transaction) => {
        return db.Post
          .findById(id)
          .then((post: PostInstance) => {
            if (!post) throw new Error(`Post with id ${id} not found`);
            return post.destroy({ transaction: t })
              .then((post) => !!post);
          });
      });
    }
  }
};
