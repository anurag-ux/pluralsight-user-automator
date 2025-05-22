import { gql } from '@apollo/client';
import { client } from './graphql';

interface BulkAssignmentOptions {
    actorPsUserId: string;
    assignedByPsUserId: string;
    instructions?: string;
    skipNotificationEmail?: boolean;
    message?: string;
}

interface User {
    psUserId: string;
    email: string;
    additionalEmails: string[];
    firstName: string;
    lastName: string;
}

const ADD_CHANNEL_MEMBERS = gql`
  mutation AddChannelMembers($input: AddChannelMembersInput!) {
    addChannelMembers(input: $input) {
      memberPsUserIds
      channelId
      actorPsUserId
      instructions
      skipNotificationEmail
    }
  }
`;

const ASSIGN_USERS_TO_ROLE = gql`
  mutation AssignUsersToRole($input: AssignUsersToRoleInput!) {
    assignUsersToRole(input: $input) {
      assignedByPsUserId
      roleId
      psUserIds
      message
    }
  }
`;

const USERS_QUERY = gql`query {
  users(first: 500) {
    nodes {
      id
      psUserId
      email
      additionalEmails
      firstName
      lastName
      startedOn
      createdOn
      note
      teamNames
      isOnAccount
      removedOn
      lastLogin
      currentSsoIdentifier
      ssoEnabled
      planId
      mfaEnabled
      productIds
      teams {
        edges {
          isDirect
          node {
            id
            parentTeamId
            name
            description
            planId
          }
        }
      }
    }
  }
}`;

export const fetchUsers = async (): Promise<User[]> => {
    try {
        const response = await client.query({
            query: USERS_QUERY,
            fetchPolicy: 'network-only',
        });

        if (!response.data?.users?.nodes) {
            throw new Error('Invalid response format from users query');
        }

        return response.data.users.nodes;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users from the plan. Please check your API key and try again.');
    }
};

export const findUserIdsByEmails = (users: User[], emails: string[]): { userIds: string[], notFoundEmails: string[] } => {
    const userIds: string[] = [];
    const notFoundEmails: string[] = [];

    emails.forEach(email => {
        const user = users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() ||
            u.additionalEmails?.some(e => e.toLowerCase() === email.toLowerCase())
        );

        if (user) {
            userIds.push(user.psUserId);
        } else {
            notFoundEmails.push(email);
        }
    });

    return { userIds, notFoundEmails };
};

export const addUsersToChannel = async (
    channelId: string,
    emails: string[],
    options: BulkAssignmentOptions
) => {
    const { actorPsUserId, instructions, skipNotificationEmail } = options;

    try {
        // Fetch all users and find their IDs
        const users = await fetchUsers();
        const { userIds, notFoundEmails } = findUserIdsByEmails(users, emails);

        if (notFoundEmails.length > 0) {
            throw new Error(`Users not found for emails: ${notFoundEmails.join(', ')}`);
        }

        if (userIds.length === 0) {
            throw new Error('No valid users found to add to the channel');
        }

        const response = await client.mutate({
            mutation: ADD_CHANNEL_MEMBERS,
            variables: {
                input: {
                    channelId,
                    memberPsUserIds: userIds,
                    actorPsUserId,
                    instructions,
                    skipNotificationEmail,
                },
            },
        });

        if (!response.data?.addChannelMembers) {
            throw new Error('Invalid response from addChannelMembers mutation');
        }

        return response.data.addChannelMembers;
    } catch (error) {
        console.error('Error adding users to channel:', error);
        throw error;
    }
};

export const addUsersToRoleIQ = async (
    roleId: string,
    emails: string[],
    options: BulkAssignmentOptions
) => {
    const { assignedByPsUserId, message } = options;

    try {
        // Fetch all users and find their IDs
        const users = await fetchUsers();
        const { userIds, notFoundEmails } = findUserIdsByEmails(users, emails);

        if (notFoundEmails.length > 0) {
            throw new Error(`Users not found for emails: ${notFoundEmails.join(', ')}`);
        }

        if (userIds.length === 0) {
            throw new Error('No valid users found to add to Role IQ');
        }

        const response = await client.mutate({
            mutation: ASSIGN_USERS_TO_ROLE,
            variables: {
                input: {
                    roleId,
                    psUserIds: userIds,
                    assignedByPsUserId,
                    message,
                },
            },
        });

        if (!response.data?.assignUsersToRole) {
            throw new Error('Invalid response from assignUsersToRole mutation');
        }

        return response.data.assignUsersToRole;
    } catch (error) {
        console.error('Error adding users to Role IQ:', error);
        throw error;
    }
}; 