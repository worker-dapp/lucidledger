import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import ContractCard from "./ContractCard";
import JobCreationWizard from "./JobCreationWizard";
import PostJobModal from "./PostJobModal";
import { Plus, AlertCircle, FileText } from "lucide-react";

const ContractLibrary = ({ employerId }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wizardActive, setWizardActive] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  useEffect(() => {
    if (employerId) {
      fetchContracts();
    }
  }, [employerId]);

  const fetchContracts = async () => {
    if (!employerId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getContractTemplates(employerId);
      if (response?.success) {
        setContracts(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setWizardActive(true);
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to delete this contract?")) {
      return;
    }

    try {
      await apiService.deleteContractTemplate(contractId);
      await fetchContracts();
    } catch (err) {
      console.error("Error deleting contract:", err);
      alert("Failed to delete contract: " + err.message);
    }
  };

  const handleUseContract = (contract) => {
    setSelectedContract(contract);
    setIsPostModalOpen(true);
  };

  const handleWizardComplete = () => {
    setWizardActive(false);
    fetchContracts();
  };

  const handleWizardCancel = () => {
    setWizardActive(false);
  };

  const handlePostModalSuccess = () => {
    setIsPostModalOpen(false);
    setSelectedContract(null);
    fetchContracts();
  };

  if (!employerId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Profile Required</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please complete your employer profile to create contracts.
          </p>
        </div>
      </div>
    );
  }

  // If wizard is active, show wizard instead of library
  if (wizardActive) {
    return (
      <JobCreationWizard
        employerId={employerId}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  // Library view
  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0D3B66]">Contract Library</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create job contracts once and reuse them for bulk hiring
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          Create New Job
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Contracts</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-600">Loading contracts...</div>
        </div>
      )}

      {/* Contracts Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.length === 0 ? (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No contracts yet
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your first job contract to streamline hiring
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                Create New Job
              </button>
            </div>
          ) : (
            contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onUse={handleUseContract}
                onEdit={() => alert("Edit functionality coming soon")}
                onDelete={handleDeleteContract}
              />
            ))
          )}
        </div>
      )}

      {/* Post Job Modal (for reusing templates) */}
      {isPostModalOpen && selectedContract && (
        <PostJobModal
          employerId={employerId}
          preselectedTemplate={selectedContract}
          onClose={() => {
            setIsPostModalOpen(false);
            setSelectedContract(null);
          }}
          onSuccess={handlePostModalSuccess}
        />
      )}
    </div>
  );
};

export default ContractLibrary;
