import { userMutations } from './resources/user/user.schema';
import { postMutations } from './resources/post/post.schema';

const Mutation = `
  type Mutation {
    ${postMutations}
    ${userMutations}
  }
`;

export {
  Mutation
}
