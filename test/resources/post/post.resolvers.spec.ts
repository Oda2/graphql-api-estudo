import * as jwt from 'jsonwebtoken';

import { app, db, handleError, chai, expect } from "../../test-utils";
import { UserInstance } from "../../../src/models/UserModel";
import { PostInstance } from "../../../src/models/PostModel"
import { JWT_SECRET } from '../../../src/utils/utils';

describe('Post', () => {
  let token: string;
  let userId: number;
  let postId: number;

  beforeEach(() => {
    return db.Comment.destroy({ where: {} })
      .then((rows: number) => db.Post.destroy({ where: {} }))
      .then((rows: number) => db.User.destroy({ where: {} }))
      .then((rows: number) => db.User.create({
        name: 'Rocket',
        email: 'rocket@guardians.com',
        password: '1234'
      })).then((user: UserInstance) => {
        userId = user.get('id');

        const payload = { sub: userId };
        token = jwt.sign(payload, JWT_SECRET);

        return db.Post.bulkCreate([
          {
            title: 'First post',
            content: 'First post',
            author: userId,
            photo: 'some_photo'
          },
          {
            title: 'Second post',
            content: 'Second post',
            author: userId,
            photo: 'some_photo'
          },
          {
            title: 'Third post',
            content: 'Third post',
            author: userId,
            photo: 'some_photo'
          }
        ]);
      }).then((posts: PostInstance[]) => {
        postId = posts[0].get('id');
      });
  });

  describe('Queries', () => {
    describe('application/json', () => {

      describe('posts', () => {
        it('should return a list of Posts', () => {
          let body = {
            query: `
              query {
                posts {
                  title
                  content
                  photo
                }
              }`
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments'])
              expect(postList[0]).to.have.keys(['title', 'content', 'photo']);
              expect(postList[0].title).to.equals('First post');
            })
            .catch(handleError);
        });

        it('should return a list of Posts and Author', () => {
          let body = {
            query: `
              query {
                posts {
                  title
                  content
                  photo
                  author {
                    id
                  }
                }
              }`
          };
  
          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'comments'])
              expect(postList[0]).to.have.keys(['title', 'content', 'photo', 'author']);
              expect(postList[0].title).to.equals('First post');
            })
            .catch(handleError);
        });

        it('should paginate a list of Posts', () => {
          let body = {
            query: `
            query getPostList($first: Int, $offset: Int) {
              posts(first: $first, offset: $offset) {
                id
                title
              }
            }`,
            variables: {
              first: 2,
              offset: 1
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList[0]).to.not.have.keys(['content', 'photo', 'createdAt', 'updatedAt', 'author', 'comments'])
              expect(postList[0]).to.have.keys(['id', 'title']);
              expect(postList[0].title).to.equals('Second post');
            })
            .catch(handleError);
        });

      });

      describe('post', () => {
        it('should return a single Post with your author', () => {
          let body = {
            query: `
              query getSinglePost($id: ID!) {
                post(id: $id) {
                  id
                  title
                  content
                  author {
                    name
                    email
                  }
                }
              }`,
            variables: {
              id: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const singlePost = res.body.data.post;
              expect(res.body.data).to.be.an('object');
              expect(singlePost).to.be.an('object');
              expect(singlePost).to.not.have.keys(['photo', 'createdAt', 'updatedAt'])
              expect(singlePost).to.have.keys(['id', 'title', 'content', 'author']);
              expect(singlePost.title).to.equal('First post');
              expect(singlePost.author).to.be.an('object').with.keys(['name', 'email']);
            })
            .catch(handleError);

        });

        it('should return only \'title\' attribute', () => {
          let body = {
            query: `
              query getSinglePost($id: ID!) {
                post(id: $id) {
                  title
                }
              }`,
            variables: {
              id: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const singlePost = res.body.data.post;
              expect(res.body.data).to.be.an('object');
              expect(singlePost).to.be.an('object');
              expect(singlePost).to.not.have.keys(['id', 'content']);
              expect(singlePost.title).to.equal('First post');
              expect(singlePost.content).to.be.undefined;
            })
            .catch(handleError);
        });

      });
    });

    describe('application/graphql', () => {
      describe('posts', () => {
        it('should return a list of Posts', () => {
          let query = `
              query {
                posts {
                  title
                  content
                  photo
                }
              }`;

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/graphql')
            .send(query)
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments'])
              expect(postList[0]).to.have.keys(['title', 'content', 'photo']);
              expect(postList[0].title).to.equals('First post');
            })
            .catch(handleError);
        });

        it('should paginate a list of Posts', () => {
          let query = `
            query getPostList($first: Int, $offset: Int) {
              posts(first: $first, offset: $offset) {
                id
                title
              }
            }`;

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/graphql')
            .send(query)
            .query({
              variables: JSON.stringify({
                first: 2,
                offset: 1
              })
            })
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList).to.be.an('array').with.length(2);
              expect(postList[0]).to.not.have.keys(['createdAt', 'updatedAt', 'author', 'comments'])
              expect(postList[0]).to.have.keys(['id', 'title']);
              expect(postList[0].title).to.equals('Second post');
            })
            .catch(handleError);
        });

      });
    });

  });

  describe('Mutattions', () => {
    describe('application/json', () => {
      describe('createPost', () => {

        it('should create new Post', () => {
          let body = {
            query: `
              mutation createNewPost($input: PostInput!) {
                createPost(input: $input) {
                  id
                  title
                  author {
                    id
                    name
                    email
                  }
                }
              }
            `,
            variables: {
              input: {
                title: 'Fourth post',
                content: 'Fourth post',
                photo: 'some_photo'
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const createPost = res.body.data.createPost;

              expect(createPost).to.be.an('object');
              expect(createPost.title).to.be.equal('Fourth post');
              expect(createPost.author).to.be.an('object').with.keys(['id', 'name', 'email']);
              expect(parseInt(createPost.author.id)).to.be.a('number');
              expect(parseInt(createPost.author.id)).to.equal(userId);
              expect(parseInt(createPost.id)).to.be.a('number');
            })
            .catch(handleError);
        });
      });

      describe('updatePost', () => {
        it('should update an existing Post', () => {
          let body = {
            query: `
              mutation updateExistingPost($id: ID!, $input: PostInput!) {
                updatePost(id: $id, input: $input) {
                  id
                  title
                  content
                  photo
                }
              }
            `,
            variables: {
              id: postId,
              input: {
                title: 'Post changed',
                content: 'Content changed',
                photo: 'some_photo_2'
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const updatePost = res.body.data.updatePost;

              expect(updatePost).to.be.an('object');
              expect(updatePost.title).to.be.equal('Post changed');
              expect(updatePost.content).to.be.equal('Content changed');
              expect(updatePost.photo).to.be.equal('some_photo_2');
              expect(parseInt(updatePost.id)).to.be.a('number');
            })
            .catch(handleError);
        });
      });

      describe('deletePost', () => {
        it('should delete an existing Post', () => {
          let body = {
            query: `
              mutation deleteExistingPost($id: ID!) {
                deletePost(id: $id)
              }
            `,
            variables: {
              id: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data).to.have.key('deletePost');
              expect(res.body.data.deletePost).to.be.true;
            })
            .catch(handleError);
        });
      });
    });

  });

});