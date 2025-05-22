import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BulkAddToChannel from "@/components/BulkAddToChannel";
import BulkAddToRoleIQ from "@/components/BulkAddToRoleIQ";
import Header from "@/components/Header";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"add" | "roleiq">("add");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ps-bg flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex justify-center mb-8 flex-col items-center">
          <button
            className="mb-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            onClick={() => navigate("/future-integration")}
          >
            Future Integration Idea
          </button>
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
                activeTab === "roleiq"
                  ? "bg-ps-pink text-white"
                  : "bg-white text-ps-dark1 hover:bg-ps-panel"
              }`}
              onClick={() => setActiveTab("roleiq")}
            >
              Bulk Add to Role IQ
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {activeTab === "add" ? <BulkAddToChannel /> : <BulkAddToRoleIQ />}
        </div>
      </main>
      
      <footer className="bg-ps-dark1 text-white p-4 text-center">
        <p className="text-sm">Pluralsight User Management Tool</p>
      </footer>
    </div>
  );
};

export default Index;
