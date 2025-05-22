
import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  parseCSV,
  CsvUser,
  generateCsvDownload
} from "@/utils/csvUtils";
import {
  fetchUserByEmail,
  addUserToRoleIQ,
  UserAssignment
} from "@/utils/apiUtils";

const BulkAddToRoleIQ = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [roleIqId, setRoleIqId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUserAssignments([]);
    }
  };

  const handlePreviewAssignments = async () => {
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
    setIsPreviewing(true);
    
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
      const batchSize = 5;
      const assignments: UserAssignment[] = [];

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (user) => {
          try {
            const userInfo = await fetchUserByEmail(user.email, apiKey);
            
            if (!userInfo) {
              return {
                email: user.email,
                status: 'not_found' as const,
                errorMessage: 'User not found in Pluralsight'
              };
            }
            
            return {
              email: user.email,
              handle: userInfo.handle,
              status: 'ready' as const
            };
          } catch (error) {
            return {
              email: user.email,
              status: 'error' as const,
              errorMessage: 'Error fetching user information'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        assignments.push(...batchResults);
        
        // Update assignments incrementally
        setUserAssignments([...assignments]);
      }
      
      const readyCount = assignments.filter(a => a.status === 'ready').length;
      
      toast({
        title: "Preview Complete",
        description: `Found ${readyCount} of ${users.length} users ready for Role IQ assignment.`,
        variant: readyCount === 0 ? "destructive" : "default",
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

  const handleSubmitAssignments = async () => {
    if (!roleIqId) {
      toast({
        title: "Role IQ ID Required",
        description: "Please enter the Role IQ ID",
        variant: "destructive",
      });
      return;
    }

    const readyUsers = userAssignments.filter(user => user.status === 'ready');
    
    if (readyUsers.length === 0) {
      toast({
        title: "No eligible users",
        description: "No users are ready for Role IQ assignment",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const results: UserAssignment[] = [...userAssignments];
    let successCount = 0;
    
    // Process in sequential batches to avoid overwhelming the API
    for (const user of readyUsers) {
      try {
        if (user.handle) {
          const success = await addUserToRoleIQ(roleIqId, user.handle, apiKey);
          
          const userIndex = results.findIndex(u => u.email === user.email);
          
          if (success) {
            results[userIndex] = {
              ...results[userIndex],
              status: 'ready',
            };
            successCount++;
          } else {
            results[userIndex] = {
              ...results[userIndex],
              status: 'error',
              errorMessage: 'Failed to add to Role IQ'
            };
          }
          
          // Update UI after each operation
          setUserAssignments([...results]);
        }
      } catch (error) {
        console.error(`Error adding user ${user.email} to Role IQ:`, error);
      }
    }
    
    setIsLoading(false);
    
    toast({
      title: "Assignment Complete",
      description: `Successfully added ${successCount} of ${readyUsers.length} users to Role IQ.`,
      variant: successCount === readyUsers.length ? "default" : "destructive",
    });
  };

  const handleDownloadResults = () => {
    if (userAssignments.length === 0) return;
    
    const downloadData = userAssignments.map(assignment => ({
      email: assignment.email,
      handle: assignment.handle || 'N/A',
      status: assignment.status,
      errorMessage: assignment.errorMessage || ''
    }));
    
    generateCsvDownload(downloadData, 'role-iq-assignments-results.csv');
  };

  const handleClearForm = () => {
    setSelectedFile(null);
    setUserAssignments([]);
    setIsPreviewing(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-ps-dark1 mb-4">Bulk Add to Role IQ</h2>
      
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
            CSV should contain email addresses in a column labeled "email" or "Email"
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
            onClick={handlePreviewAssignments} 
            className="bg-ps-blue hover:bg-ps-blue/90 text-white"
            disabled={isLoading || !selectedFile}
          >
            {isLoading && isPreviewing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Previewing...
              </>
            ) : (
              'Preview Assignments'
            )}
          </Button>
        </div>

        {userAssignments.length > 0 && (
          <>
            <div>
              <label className="block text-ps-heading font-medium mb-2">
                Role IQ ID
              </label>
              <Input
                type="text"
                value={roleIqId}
                onChange={(e) => setRoleIqId(e.target.value)}
                className="w-full"
                placeholder="Enter Role IQ ID"
              />
            </div>
            
            <div className="overflow-x-auto">
              <h3 className="text-lg font-medium text-ps-dark1 mb-2">User Assignment Preview</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>User Handle</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAssignments.map((assignment, index) => (
                    <TableRow key={index}>
                      <TableCell>{assignment.email}</TableCell>
                      <TableCell>{assignment.handle || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'ready' 
                            ? 'bg-green-100 text-green-800' 
                            : assignment.status === 'not_found'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.status === 'ready' ? 'Ready' : 
                           assignment.status === 'not_found' ? 'Not Found' : 'Error'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSubmitAssignments} 
                className="bg-ps-pink hover:bg-ps-pink/90 text-white flex-1"
                disabled={isLoading || userAssignments.filter(a => a.status === 'ready').length === 0}
              >
                {isLoading && !isPreviewing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Assigning to Role IQ...
                  </>
                ) : (
                  'Submit to Role IQ'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDownloadResults}
                className="flex-1"
                disabled={userAssignments.length === 0}
              >
                Download Results
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkAddToRoleIQ;
