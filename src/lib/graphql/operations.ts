import { gql } from '@apollo/client';

// Query to get user details
export const GET_USER = gql`
  query GetUser($email: String!) {
    user(email: $email) {
      id
      email
      firstName
      lastName
      channels {
        id
        name
      }
      roleIQ {
        id
        name
      }
    }
  }
`;

// Query to get channel details
export const GET_CHANNEL = gql`
  query GetChannel($id: ID!) {
    channel(id: $id) {
      id
      name
      members {
        id
        email
      }
    }
  }
`;

// Mutation to add users to a channel
export const ADD_USERS_TO_CHANNEL = gql`
  mutation AddUsersToChannel($channelId: ID!, $userIds: [ID!]!) {
    addUsersToChannel(channelId: $channelId, userIds: $userIds) {
      success
      message
      addedUsers {
        id
        email
      }
      errors {
        userId
        message
      }
    }
  }
`;

// Mutation to add users to Role IQ
export const ADD_USERS_TO_ROLE_IQ = gql`
  mutation AddUsersToRoleIQ($roleIQId: ID!, $userIds: [ID!]!) {
    addUsersToRoleIQ(roleIQId: $roleIQId, userIds: $userIds) {
      success
      message
      addedUsers {
        id
        email
      }
      errors {
        userId
        message
      }
    }
  }
`; 