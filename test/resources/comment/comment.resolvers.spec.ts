import * as jwt from 'jsonwebtoken';

import { app, db, handleError, chai, expect } from "../../test-utils";
import { UserInstance } from "../../../src/models/UserModel";
import { PostInstance } from "../../../src/models/PostModel"
import { CommentInstance } from "../../../src/models/CommentModel"
import { JWT_SECRET } from '../../../src/utils/utils';

describe('Comment', () => {
  let token: string;
  let userId: number;
  let postId: number;
  let commentId: number;

  beforeEach(() => {
    return db.Comment.destroy({ where: {} })
      .then((rows: number) => db.Post.destroy({ where: {} }))
      .then((rows: number) => db.User.destroy({ where: {} }))
      .then((rows: number) => db.User.create({
        name: 'Peter Quill',
        email: 'peter@guardians.com',
        password: '1234'
      })).then((user: UserInstance) => {
        userId = user.get('id');

        const payload = { sub: userId };
        token = jwt.sign(payload, JWT_SECRET);

        return db.Post.create(
          {
            title: 'First post',
            content: 'First post',
            author: userId,
            photo: 'some_photo'
          },
        );
      }).then((post: PostInstance) => {
        postId = post.get('id');

        return db.Comment.bulkCreate([
          {
            comment: 'First comment',
            user: userId,
            post: postId
          },
          {
            comment: 'Second comment',
            user: userId,
            post: postId
          },
          {
            comment: 'Third comment',
            user: userId,
            post: postId
          }
        ]).then((comments: CommentInstance[]) => {
          commentId = comments[0].get('id');
        });
      });
  });

  describe('Queries', () => {
    describe('application/json', () => {

      describe('commentsByPost', () => {
        it('should return a list of Comments', () => {
          let body = {
            query: `
              query getCommentsByPostList($postId: ID!, $first: Int, $offset: Int) {
                commentsByPost(postId: $postId, first: $first, offset: $offset) {
                  comment
                  user {
                    id
                  }
                  post {
                    id
                  }
                }
              }`,
            variables: {
              postId: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const commentsList = res.body.data.commentsByPost;
              expect(res.body.data).to.be.an('object');
              expect(commentsList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt'])
              expect(commentsList[0]).to.have.keys(['comment', 'user', 'post']);
              expect(commentsList[0].comment).to.equals('First comment');
              expect(parseInt(commentsList[0].user.id)).to.equals(userId);
              expect(parseInt(commentsList[0].post.id)).to.equals(postId);
            })
            .catch(handleError);
        });

      });
    });
  });

  describe('Mutattions', () => {
    describe('application/json', () => {
      describe('createComment', () => {

        it('should create a new Comment', () => {
          let body = {
            query: `
              mutation createNewComment($input: CommentInput!) {
                createComment(input: $input) {
                  comment
                  user {
                    id
                    name
                  }
                  post {
                    id
                    title
                  }
                }
              }
            `,
            variables: {
              input: {
                comment: 'Fourth comment',
                post: postId
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const createComment = res.body.data.createComment;

              expect(createComment).to.be.an('object');
              expect(createComment.comment).to.be.equal('Fourth comment');
              expect(createComment.user).to.be.an('object').with.keys(['id', 'name']);
              expect(parseInt(createComment.user.id)).to.be.a('number');
              expect(parseInt(createComment.user.id)).to.equal(userId);
              expect(parseInt(createComment.post.id)).to.be.a('number');
              expect(parseInt(createComment.post.id)).to.equal(postId);
            })
            .catch(handleError);
        });
      });

      describe('updateComment', () => {
        it('should update an existing Comment', () => {
          let body = {
            query: `
              mutation updateExistingComment($id: ID!, $input: CommentInput!) {
                updateComment(id: $id, input: $input) {
                  id
                  comment
                }
              }
            `,
            variables: {
              id: commentId,
              input: {
                comment: 'Comment changed',
                post: postId
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const updateComment = res.body.data.updateComment;

              expect(updateComment).to.be.an('object');
              expect(updateComment.comment).to.be.equal('Comment changed');
              expect(parseInt(updateComment.id)).to.be.a('number');
            })
            .catch(handleError);
        });
      });

      describe('deleteComment', () => {
        it('should delete an existing Comment', () => {
          let body = {
            query: `
              mutation deleteExistingComment($id: ID!) {
                deleteComment(id: $id)
              }
            `,
            variables: {
              id: commentId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data).to.have.key('deleteComment');
              expect(res.body.data.deleteComment).to.be.true;
            })
            .catch(handleError);
        });
      });
    });
  });

});