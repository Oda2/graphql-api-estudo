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
`;

const resolvers = {
  Query: {
    allUsers: () => users
  }
};

export default makeExecutableSchema({ typeDefs, resolvers});