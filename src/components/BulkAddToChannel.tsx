
import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, Check, X } from "lucide-react";
import { 
  parseCSV, 
  CsvUser, 
  generateCsvDownload 
} from "@/utils/csvUtils";
import { 
  fetchUserByEmail, 
  addUserToChannel,
  UserAssignment 
} from "@/utils/apiUtils";

const BulkAddToChannel = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [channelId, setChannelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [isPreviewed, setIsPreviewed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    details: Array<{email: string; status: string; message?: string}>;
  }>({
    success: 0,
    failed: 0,
    details: []
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsPreviewed(false);
      setUserAssignments([]);
      setResults({
        success: 0,
        failed: 0,
        details: []
      });
    }
  };

  const handlePreviewClick = async () => {
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
        description: "Please enter your Pluralsight Plan API Key",
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

      // Process users in batches to not overwhelm the API
      const batchSize = 5;
      const assignments: UserAssignment[] = [];

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map(async (user) => {
          try {
            const pluralsightUser = await fetchUserByEmail(user.email, apiKey);
            
            if (pluralsightUser) {
              return {
                email: user.email,
                handle: pluralsightUser.handle,
                status: 'ready' as const
              };
            } else {
              return {
                email: user.email,
                status: 'not_found' as const
              };
            }
          } catch (error) {
            return {
              email: user.email,
              status: 'error' as const,
              errorMessage: 'Failed to fetch user'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        assignments.push(...batchResults);
      }

      setUserAssignments(assignments);
      setIsPreviewed(true);
      
      toast({
        title: "Preview Ready",
        description: `Found ${assignments.filter(a => a.status === 'ready').length} of ${assignments.length} users`,
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

  const handleSubmit = async () => {
    if (!channelId) {
      toast({
        title: "Channel ID Required",
        description: "Please enter the Pluralsight Channel ID",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Pluralsight Plan API Key",
        variant: "destructive",
      });
      return;
    }

    if (userAssignments.length === 0 || !isPreviewed) {
      toast({
        title: "Preview Required",
        description: "Please preview your assignments before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const results = {
      success: 0,
      failed: 0,
      details: [] as Array<{email: string; status: string; message?: string}>
    };

    // Process ready users in batches
    const readyUsers = userAssignments.filter(user => user.status === 'ready');
    const batchSize = 5;

    for (let i = 0; i < readyUsers.length; i += batchSize) {
      const batch = readyUsers.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        if (user.handle) {
          try {
            const success = await addUserToChannel(channelId, user.handle, apiKey);
            
            if (success) {
              results.success++;
              results.details.push({
                email: user.email,
                status: 'success'
              });
            } else {
              results.failed++;
              results.details.push({
                email: user.email,
                status: 'failed',
                message: 'API error adding user to channel'
              });
            }
          } catch (error) {
            results.failed++;
            results.details.push({
              email: user.email,
              status: 'failed',
              message: 'Error adding user to channel'
            });
          }
        }
      }));
    }

    // Add not found users to results
    userAssignments
      .filter(user => user.status === 'not_found' || user.status === 'error')
      .forEach(user => {
        results.failed++;
        results.details.push({
          email: user.email,
          status: 'failed',
          message: user.status === 'not_found' ? 'User not found' : user.errorMessage
        });
      });

    setResults(results);
    setIsSubmitting(false);

    toast({
      title: "Assignment Complete",
      description: `Successfully added ${results.success} users, failed to add ${results.failed} users`,
      variant: results.failed > 0 ? "destructive" : "default",
    });
  };

  const handleDownloadResults = () => {
    if (results.details.length === 0) return;
    
    const downloadData = results.details.map(detail => ({
      email: detail.email,
      status: detail.status,
      message: detail.message || ''
    }));
    
    generateCsvDownload(downloadData, 'channel-assignment-results.csv');
  };

  const handleClearForm = () => {
    setSelectedFile(null);
    setUserAssignments([]);
    setIsPreviewed(false);
    setResults({
      success: 0,
      failed: 0,
      details: []
    });
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-ps-dark1 mb-4">Bulk Add to Channel</h2>
      
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-ps-heading font-medium mb-2">
              Pluralsight Channel ID
            </label>
            <Input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full"
              placeholder="Enter Channel ID"
            />
          </div>
          <div>
            <label className="block text-ps-heading font-medium mb-2">
              Pluralsight Plan API Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
              placeholder="Enter API Key"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handlePreviewClick} 
            className="bg-ps-blue-bright hover:bg-ps-blue-bright/90 text-white"
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Preview Assignments'
            )}
          </Button>
        </div>

        {isPreviewed && userAssignments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-ps-dark1 mb-2">Preview Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ps-panel">
                <thead className="bg-ps-table">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      User Handle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ps-neutral uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-ps-panel">
                  {userAssignments.map((user, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ps-dark1">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ps-dark1">
                        {user.handle || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'ready' 
                            ? 'bg-green-100 text-green-800' 
                            : user.status === 'not_found'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'ready' && <Check className="mr-1 h-3 w-3" />}
                          {user.status === 'error' && <X className="mr-1 h-3 w-3" />}
                          {user.status === 'ready' ? 'Ready' : user.status === 'not_found' ? 'Not Found' : 'Error'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleSubmit} 
                className="bg-ps-pink hover:bg-ps-pink/90 text-white"
                disabled={isSubmitting || userAssignments.filter(u => u.status === 'ready').length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit to Channel'
                )}
              </Button>
            </div>
          </div>
        )}

        {results.details.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-ps-dark1 mb-2">Assignment Results</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-green-800">Success: {results.success}</p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p className="text-sm text-red-800">Failed: {results.failed}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleDownloadResults}
              className="w-full mt-2"
            >
              Download Results as CSV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkAddToChannel;
