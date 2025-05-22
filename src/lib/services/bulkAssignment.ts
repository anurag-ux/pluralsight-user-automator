import axios from 'axios';

const APIURL = "http://localhost:3001/api/graphql";

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

const getHeaders = (apiKey: string) => ({
    'Authorization': `Bearer ${apiKey}`,
    'clientversion': 'SSP Automation 1.0',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
});

export const fetchUsers = async (apiKey: string): Promise<User[]> => {
    try {
        const query = `query {
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

        const response = await axios.post(APIURL, { query }, { 
            headers: getHeaders(apiKey),
            withCredentials: true
        });
        
        if (response.data.errors) {
            throw new Error(`Error on PaaS Side: ${response.data.errors[0].message}`);
        }

        if (!response.data.data?.users?.nodes) {
            throw new Error('Invalid response format from users query');
        }

        return response.data.data.users.nodes;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
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
        const users = await fetchUsers(actorPsUserId);
        const { userIds, notFoundEmails } = findUserIdsByEmails(users, emails);

        if (notFoundEmails.length > 0) {
            throw new Error(`Users not found for emails: ${notFoundEmails.join(', ')}`);
        }

        if (userIds.length === 0) {
            throw new Error('No valid users found to add to the channel');
        }

        const query = `mutation {
  addChannelMembers(input: {
    channelId: "${channelId}"
    memberPsUserIds: ${JSON.stringify(userIds)}
    actorPsUserId: "${actorPsUserId}"
    instructions: "${instructions || ''}"
    skipNotificationEmail: ${skipNotificationEmail || false}
  }) {
    memberPsUserIds
    channelId
    actorPsUserId
    instructions
    skipNotificationEmail
  }
}`;

        const response = await axios.post(APIURL, { query }, { 
            headers: getHeaders(actorPsUserId),
            withCredentials: true
        });

        if (response.data.errors) {
            throw new Error(`Error on PaaS Side: ${response.data.errors[0].message}`);
        }

        return response.data.data.addChannelMembers;
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
        const users = await fetchUsers(assignedByPsUserId);
        const { userIds, notFoundEmails } = findUserIdsByEmails(users, emails);

        if (notFoundEmails.length > 0) {
            throw new Error(`Users not found for emails: ${notFoundEmails.join(', ')}`);
        }

        if (userIds.length === 0) {
            throw new Error('No valid users found to add to Role IQ');
        }

        const query = `mutation {
  assignUsersToRole(input: {
    roleId: "${roleId}"
    psUserIds: ${JSON.stringify(userIds)}
    assignedByPsUserId: "${assignedByPsUserId}"
    message: "${message || ''}"
  }) {
    assignedByPsUserId
    roleId
    psUserIds
    message
  }
}`;

        const response = await axios.post(APIURL, { query }, { 
            headers: getHeaders(assignedByPsUserId),
            withCredentials: true
        });

        if (response.data.errors) {
            throw new Error(`Error on PaaS Side: ${response.data.errors[0].message}`);
        }

        return response.data.data.assignUsersToRole;
    } catch (error) {
        console.error('Error adding users to Role IQ:', error);
        throw error;
    }
}; 