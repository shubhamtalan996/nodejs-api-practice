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
    type RootMutation {
        createUser(userInput: UserInputData): User!
    }
    type RootQuery {
        hello: String
    }
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
