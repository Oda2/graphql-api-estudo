import { makeExecutableSchema } from 'graphql-tools';

const users: any[] = [
  {
    id: 1,
    name: "Renato",
    email: "renato@email.com.br"
  },
  {
    id: 2,
    name: "Oda",
    email: "oda@email.com.br"
  }
];

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    allUsers: [User!]!
  }

  type Mutation {
    createUser(name: String!, email: String!): User
  }
`;

const resolvers = {
  Query: {
    allUsers: () => users
  },
  Mutation: {
    createUser: (parent, args, context, info) => {
      const newUser = Object.assign({ id: users.length + 1}, args);
      users.push(newUser);
      return newUser;
    }
  }
};

export default makeExecutableSchema({ typeDefs, resolvers});