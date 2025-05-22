
import axios from 'axios';

// Base URL for Pluralsight API
const PLURALSIGHT_API_BASE_URL = 'https://app.pluralsight.com/api';
const WORKATO_WEBHOOK_URL = 'https://www.workato.com/webhooks/rest/12345678-your-webhook'; // Replace with actual webhook

export interface PluralsightUser {
  handle: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserAssignment {
  email: string;
  handle?: string;
  status: 'ready' | 'not_found' | 'error';
  errorMessage?: string;
}

export interface UserCreation {
  email: string;
  password: string;
  status: 'success' | 'error';
  errorMessage?: string;
  emailSent: boolean;
}

// Fetch user handle by email
export const fetchUserByEmail = async (email: string, apiKey: string): Promise<PluralsightUser | null> => {
  try {
    const response = await axios.get(`${PLURALSIGHT_API_BASE_URL}/users`, {
      params: { email },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Add user to channel
export const addUserToChannel = async (
  channelId: string, 
  userHandle: string, 
  apiKey: string
): Promise<boolean> => {
  try {
    await axios.post(
      `${PLURALSIGHT_API_BASE_URL}/channels/${channelId}/users`,
      {
        handle: userHandle,
        access_level: 'viewer'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error adding user to channel:', error);
    return false;
  }
};

// Add user to Role IQ
export const addUserToRoleIQ = async (
  roleIqId: string,
  userHandle: string,
  apiKey: string
): Promise<boolean> => {
  try {
    await axios.post(
      `${PLURALSIGHT_API_BASE_URL}/roleiq/${roleIqId}/users`,
      {
        handle: userHandle,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error adding user to Role IQ:', error);
    return false;
  }
};

// Create new user
export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  apiKey: string
): Promise<boolean> => {
  try {
    await axios.post(
      `${PLURALSIGHT_API_BASE_URL}/users`,
      {
        email,
        first_name: firstName || 'N/A',
        last_name: lastName || 'N/A',
        password
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
};

// Send user credentials to Workato
export const sendCredentialsToWorkato = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    await axios.post(
      WORKATO_WEBHOOK_URL,
      {
        email,
        username: email,
        temporary_password: password
      }
    );
    return true;
  } catch (error) {
    console.error('Error sending credentials to Workato:', error);
    return false;
  }
};

// Generate random password
export const generatePassword = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};
