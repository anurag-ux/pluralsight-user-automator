
import { useState } from "react";
import BulkAddToChannel from "@/components/BulkAddToChannel";
import BulkCreateUsers from "@/components/BulkCreateUsers";
import Header from "@/components/Header";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"add" | "create">("add");

  return (
    <div className="min-h-screen bg-ps-bg flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-6 py-3 text-sm font-medium rounded-l-lg ${
                activeTab === "add"
                  ? "bg-ps-pink text-white"
                  : "bg-white text-ps-dark1 hover:bg-ps-panel"
              }`}
              onClick={() => setActiveTab("add")}
            >
              Bulk Add to Channel
            </button>
            <button
              type="button"
              className={`px-6 py-3 text-sm font-medium rounded-r-lg ${
                activeTab === "create"
                  ? "bg-ps-pink text-white"
                  : "bg-white text-ps-dark1 hover:bg-ps-panel"
              }`}
              onClick={() => setActiveTab("create")}
            >
              Bulk Create Users
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {activeTab === "add" ? <BulkAddToChannel /> : <BulkCreateUsers />}
        </div>
      </main>
      
      <footer className="bg-ps-dark1 text-white p-4 text-center">
        <p className="text-sm">Pluralsight User Management Tool</p>
      </footer>
    </div>
  );
};

export default Index;
