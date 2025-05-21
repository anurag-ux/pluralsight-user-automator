
import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, X } from "lucide-react";
import {
  parseCSV,
  CsvUser,
  generateCsvDownload
} from "@/utils/csvUtils";
import {
  createUser,
  sendCredentialsToWorkato,
  generatePassword,
  UserCreation
} from "@/utils/apiUtils";

const BulkCreateUsers = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [apiKey, setApiKey] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [creationResults, setCreationResults] = useState<UserCreation[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setCreationResults([]);
    }
  };

  const handleCreateUsers = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file containing user emails",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Pluralsight Admin API Key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const users: CsvUser[] = await parseCSV(selectedFile);
      
      if (users.length === 0) {
        toast({
          title: "No valid users found",
          description: "The CSV file does not contain any valid email addresses",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Process users in batches
      const batchSize = 3;
      const results: UserCreation[] = [];

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (user) => {
          const password = generatePassword();
          
          try {
            // Create user in Pluralsight
            const userCreated = await createUser(
              user.email,
              password,
              user.firstName || 'N/A',
              user.lastName || 'N/A',
              apiKey
            );
            
            if (!userCreated) {
              return {
                email: user.email,
                password,
                status: 'error' as const,
                errorMessage: 'Failed to create user',
                emailSent: false
              };
            }
            
            // Send credentials to Workato for emailing
            const emailSent = await sendCredentialsToWorkato(user.email, password);
            
            return {
              email: user.email,
              password,
              status: 'success' as const,
              emailSent
            };
          } catch (error) {
            return {
              email: user.email,
              password,
              status: 'error' as const,
              errorMessage: 'Error during user creation',
              emailSent: false
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Update results incrementally
        setCreationResults([...results]);
      }
      
      const successCount = results.filter(r => r.status === 'success').length;
      const emailCount = results.filter(r => r.emailSent).length;
      
      toast({
        title: "User Creation Complete",
        description: `Created ${successCount} of ${users.length} users. ${emailCount} onboarding emails sent.`,
        variant: successCount === users.length ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error processing CSV",
        description: "There was an error processing the CSV file",
        variant: "destructive",
      });
      console.error("CSV processing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResults = () => {
    if (creationResults.length === 0) return;
    
    const downloadData = creationResults.map(result => ({
      email: result.email,
      password: result.password,
      status: result.status,
      emailSent: result.emailSent ? 'Yes' : 'No',
      errorMessage: result.errorMessage || ''
    }));
    
    generateCsvDownload(downloadData, 'user-creation-results.csv');
  };

  const handleClearForm = () => {
    setSelectedFile(null);
    setCreationResults([]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-ps-dark1 mb-4">Bulk Create Users</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-ps-heading font-medium mb-2">
            Upload CSV of User Emails
          </label>
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-ps-neutral file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-ps-panel file:text-ps-dark1 hover:file:bg-ps-panel/90"
            />
            {selectedFile && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={handleClearForm}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="mt-1 text-sm text-ps-neutral">Selected: {selectedFile.name}</p>
          )}
          <p className="mt-1 text-xs text-ps-neutral">
            CSV should contain: email (required), firstName, lastName, role (optional)
          </p>
        </div>

        <div>
          <label className="block text-ps-heading font-medium mb-2">
            Pluralsight Admin API Key
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full"
            placeholder="Enter API Key"
          />
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handleCreateUsers} 
            className="bg-ps-pink hover:bg-ps-pink/90 text-white"
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              'Create Users'
            )}
          </Button>
        </div>

        {creationResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-ps-dark1 mb-2">User Creation Results</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ps-panel">
                <thead className="bg-ps-table">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      Temp Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      Email Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-ps-panel">
                  {creationResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ps-dark1">
                        {result.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono bg-ps-table">
                        {result.password}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.emailSent
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.emailSent ? 'Sent' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleDownloadResults}
                className="w-full"
              >
                Download Results with Passwords
              </Button>
            </div>
            
            <p className="mt-2 text-xs text-ps-neutral text-center">
              Important: Download and save this data. For security reasons, temporary passwords will not be accessible again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkCreateUsers;
