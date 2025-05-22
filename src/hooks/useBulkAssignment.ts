import { useState } from 'react';
import { useToast } from './use-toast';
import { addUsersToChannel, addUsersToRoleIQ, fetchUsers } from '@/lib/services/bulkAssignment';

interface BulkAssignmentOptions {
  actorPsUserId: string;
  assignedByPsUserId: string;
  instructions?: string;
  skipNotificationEmail?: boolean;
  message?: string;
}

export const useBulkAssignment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addUsersToChannel = async (
    channelId: string,
    emails: string[],
    options: BulkAssignmentOptions
  ) => {
    setIsLoading(true);
    try {
      await addUsersToChannel(channelId, emails, options);
      toast({
        title: "Success",
        description: `Successfully added ${emails.length} users to channel`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add users to channel";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUsersToRoleIQ = async (
    roleId: string,
    emails: string[],
    options: BulkAssignmentOptions
  ) => {
    setIsLoading(true);
    try {
      await addUsersToRoleIQ(roleId, emails, options);
      toast({
        title: "Success",
        description: `Successfully added ${emails.length} users to Role IQ`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add users to Role IQ";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmails = async (emails: string[]): Promise<{ valid: string[], invalid: string[] }> => {
    try {
      const users = await fetchUsers();
      const validEmails: string[] = [];
      const invalidEmails: string[] = [];

      emails.forEach(email => {
        const user = users.find(u => 
          u.email.toLowerCase() === email.toLowerCase() || 
          u.additionalEmails?.some(e => e.toLowerCase() === email.toLowerCase())
        );

        if (user) {
          validEmails.push(email);
        } else {
          invalidEmails.push(email);
        }
      });

      return { valid: validEmails, invalid: invalidEmails };
    } catch (error) {
      console.error('Error validating emails:', error);
      throw new Error("Failed to validate emails. Please try again.");
    }
  };

  return {
    isLoading,
    addUsersToChannel,
    addUsersToRoleIQ,
    validateEmails,
  };
}; 