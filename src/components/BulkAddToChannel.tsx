import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Download } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBulkAssignment } from '@/hooks/useBulkAssignment';
import { Switch } from "@/components/ui/switch";
import Papa from 'papaparse';

interface UserPreview {
  email: string;
  status: 'ready' | 'exists' | 'error';
  message?: string;
}

const BulkAddToChannel = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<UserPreview[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { isLoading, addUsersToChannel, validateEmails } = useBulkAssignment();
  const [ownerEmail, setOwnerEmail] = useState("");

  const handleDemoModeToggle = (checked: boolean) => {
    setIsDemoMode(checked);
    if (checked) {
      setChannelId("demo-channel-123");
      setApiKey("demo-api-key-456");
      // Load dummy CSV file
      fetch('/dummy-users.csv')
        .then(response => response.text())
        .then(csvText => {
          Papa.parse(csvText, {
            complete: (results) => {
              const emails = results.data
                .slice(1)
                .map((row: any) => row.email)
                .filter(Boolean);
              setEmails(emails);
              setSelectedFile(new File([csvText], 'dummy-users.csv', { type: 'text/csv' }));
            },
            header: true,
          });
        });
    } else {
      setChannelId("");
      setApiKey("");
      setSelectedFile(null);
      setEmails([]);
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setSelectedFile(selectedFile);
      Papa.parse(selectedFile, {
        complete: (results) => {
          const emails = results.data
            .slice(1)
            .map((row: any) => row.email)
            .filter(Boolean);
          setEmails(emails);
        },
        header: true,
      });
      setPreviewData([]);
      setIsPreviewing(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile || !channelId || !apiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide channel ID, API key, and select a file",
        variant: "destructive",
      });
      return;
    }

    setIsPreviewing(true);
    try {
      if (isDemoMode) {
        console.log('=== Demo Mode Preview Debug Info ===');
        console.log('Channel ID:', channelId);
        console.log('Owner Email:', ownerEmail);
        console.log('Users to preview:', emails);
        console.log('========================');
        
        // In demo mode, mark all emails as ready
        const preview = emails.map(email => ({
          email,
          status: 'ready' as const
        }));
        setPreviewData(preview);
        toast({
          title: "Preview Ready",
          description: `Found ${emails.length} users ready to add`,
        });
      } else {
        console.log('=== Preview Debug Info ===');
        console.log('Channel ID:', channelId);
        console.log('Owner Email:', ownerEmail);
        console.log('Users to validate:', emails);
        
        const { valid, invalid } = await validateEmails(emails);
        
        console.log('Valid users:', valid);
        console.log('Invalid users:', invalid);
        console.log('========================');
        
        const preview = emails.map(email => {
          if (invalid.includes(email)) {
            return {
              email,
              status: 'error' as const,
              message: 'User not found in plan'
            };
          }
          return {
            email,
            status: 'ready' as const
          };
        });
        
        setPreviewData(preview);
        
        if (invalid.length > 0) {
          toast({
            title: "Some Users Not Found",
            description: `${invalid.length} users were not found in the plan`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Preview Ready",
            description: `Found ${valid.length} users ready to add`,
          });
        }
      }
    } catch (error) {
      console.error('=== Preview Error ===');
      console.error('Error details:', error);
      console.error('========================');
      
      toast({
        title: "Preview Failed",
        description: "Failed to preview users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || emails.length === 0 || !apiKey || !ownerEmail) return;
    
    const readyUsers = previewData
      .filter(user => user.status === 'ready')
      .map(user => user.email);
    
    if (readyUsers.length === 0) {
      toast({
        title: "No Users to Add",
        description: "All users are already in the channel or have errors",
        variant: "destructive",
      });
      return;
    }

    if (isDemoMode) {
      console.log('=== Demo Mode Debug Info ===');
      console.log('Channel ID:', channelId);
      console.log('Owner Email:', ownerEmail);
      console.log('Users to add:', readyUsers);
      console.log('========================');
      
      toast({
        title: "Demo Mode",
        description: `Would add ${readyUsers.length} users to channel ${channelId} (Owner: ${ownerEmail})`,
      });
      return;
    }
    
    try {
      console.log('=== Channel Creation Debug Info ===');
      console.log('Channel ID:', channelId);
      console.log('Owner Email:', ownerEmail);
      console.log('Users to add:', readyUsers);
      console.log('API Mutation Input:', {
        channelId,
        memberPsUserIds: readyUsers,
        actorPsUserId: apiKey,
        assignedByPsUserId: apiKey,
      });
      
      const result = await addUsersToChannel(channelId, readyUsers, {
        actorPsUserId: apiKey,
        assignedByPsUserId: apiKey,
      });

      console.log('Success Response:', result);
      console.log('========================');
    } catch (error) {
      console.error('=== Channel Creation Error ===');
      console.error('Error details:', error);
      console.error('API Mutation Input:', {
        channelId,
        memberPsUserIds: readyUsers,
        actorPsUserId: apiKey,
        assignedByPsUserId: apiKey,
      });
      console.error('========================');
      throw error;
    }
  };

  const handleClearForm = () => {
    setSelectedFile(null);
    setEmails([]);
    setPreviewData([]);
    setIsPreviewing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-white/50 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-gray-100">
      <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 p-8">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white text-2xl font-light tracking-wide">Bulk Add Users</CardTitle>
            <p className="text-gray-400 mt-1 text-sm">Add multiple users to a channel at once</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
            <Switch
              id="demo-mode"
              checked={isDemoMode}
              onCheckedChange={handleDemoModeToggle}
              className="data-[state=checked]:bg-gray-700"
            />
            <Label htmlFor="demo-mode" className="text-gray-300 text-sm font-medium">Demo Mode</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="channelId" className="text-sm font-medium text-gray-700">Channel ID</Label>
              <Input
                id="channelId"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Enter channel ID"
                required
                className="h-11 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">API Key</Label>
                <a 
                  href="https://developer.pluralsight.com/manage-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Get API Key
                </a>
              </div>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API Key"
                required
                className="h-11 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="ownerEmail" className="text-sm font-medium text-gray-700">Owner Email ID</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="Enter owner email"
                required
                className="h-11 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="file" className="text-sm font-medium text-gray-700">User Emails CSV File</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent = "email\nuser@example.com\nanother@example.com";
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'user-emails-template.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
                className="text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="relative">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                required
                className="h-11 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-200 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 p-2"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <Check className="h-4 w-4 mr-2 text-gray-400" />
                {emails.length} users found in {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={handlePreview}
              disabled={isLoading || !channelId || !apiKey || emails.length === 0}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Previewing...
                </>
              ) : (
                'Preview Users'
              )}
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !channelId || !apiKey || emails.length === 0 || previewData.length === 0}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Add Users to Channel'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleClearForm}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Clear Form
            </Button>
          </div>
        </form>

        {previewData.length > 0 && (
          <div className="mt-8 animate-fadeIn">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Preview Results</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white/50 backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-gray-50/50">
                    <TableHead className="font-medium text-gray-700 text-sm">User Email</TableHead>
                    <TableHead className="font-medium text-gray-700 text-sm">Status</TableHead>
                    <TableHead className="font-medium text-gray-700 text-sm">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((user) => (
                    <TableRow key={user.email} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <TableCell className="font-medium text-gray-700">{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'ready' 
                            ? 'bg-gray-100 text-gray-700'
                            : user.status === 'exists'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.status === 'ready' && <Check className="mr-1.5 h-3.5 w-3.5 text-gray-500" />}
                          {user.status === 'error' && <X className="mr-1.5 h-3.5 w-3.5 text-gray-500" />}
                          {user.status === 'ready' ? 'Ready' : user.status === 'exists' ? 'Exists' : 'Error'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">{user.message || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkAddToChannel;
