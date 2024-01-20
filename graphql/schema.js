const { buildSchema } = require("graphql");

exports.Schema = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }
    input UserInputData {
        name: String!
        email: String!
        password: String!
    }
    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }
    type GetPostResponse {
        posts: [Post!]!
        totalItems: Int!
    } 
    type AuthData {
        token: String!
        userId: String!
    }
    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
    }
    type RootQuery {
        loginUser(email: String!, password: String!): AuthData!
        getPosts(currentPage: String!): GetPostResponse!
    }
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
