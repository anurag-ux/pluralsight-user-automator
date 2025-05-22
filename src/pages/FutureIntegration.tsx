import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader as DHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";

const BulkUploadForm = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <DHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Bulk Upload Users</DialogTitle>
        </DHeader>
        <form className="space-y-6 mt-2">
          <Input type="file" accept=".csv" required className="bg-gray-50 border border-gray-200 rounded-lg p-3" />
          <Button type="submit" className="w-full bg-[#6c2ebf] hover:bg-[#5a23a6] text-white font-semibold rounded-lg py-2 text-base shadow">
            Upload
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function FutureIntegration() {
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f4fa] flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI (ML / Agentic AI / Copilot)</h1>
          <div className="flex gap-4">
            <Button className="bg-[#6c2ebf] hover:bg-[#5a23a6] text-white font-semibold rounded-lg px-5 py-2 shadow" onClick={() => setShowBulkUpload(true)}>
              Bulk Upload Users
            </Button>
            <Button variant="outline" className="border-[#6c2ebf] text-[#6c2ebf] font-semibold rounded-lg px-5 py-2">
              Add Members
            </Button>
          </div>
        </div>
        <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#edeaf7] px-8 py-6 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">AI Fundamentals for Everyone <span className='font-normal text-gray-500'>(3h 31m)</span></CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ul className="space-y-6">
              <li className="flex items-center gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="w-16 h-10 bg-gray-200 rounded-lg" />
                <div>
                  <div className="font-semibold text-gray-900">Artificial Intelligence: Foundations</div>
                  <div className="text-xs text-gray-500">Skill IQ Assessment • 15m</div>
                </div>
              </li>
              <li className="flex items-center gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="w-16 h-10 bg-gray-200 rounded-lg" />
                <div>
                  <div className="font-semibold text-gray-900">Artificial Intelligence: The Big Picture of AI</div>
                  <div className="text-xs text-gray-500">Course • 1h 15m</div>
                </div>
              </li>
              <li className="flex items-center gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="w-16 h-10 bg-gray-200 rounded-lg" />
                <div>
                  <div className="font-semibold text-gray-900">Getting Started with Artificial Intelligence for Business</div>
                  <div className="text-xs text-gray-500">Course • 59m 54s</div>
                </div>
              </li>
              <li className="flex items-center gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="w-16 h-10 bg-gray-200 rounded-lg" />
                <div>
                  <div className="font-semibold text-gray-900">Artificial Intelligence Essentials: AIOps (Artificial Intelligence for IT Operations)</div>
                  <div className="text-xs text-gray-500">Course • 1h 2m</div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <BulkUploadForm open={showBulkUpload} onClose={() => setShowBulkUpload(false)} />
      <footer className="bg-white text-gray-500 p-4 text-center mt-8 border-t border-gray-200">
        <p className="text-sm">Pluralsight User Management Tool</p>
      </footer>
    </div>
  );
} 