import React, { useState } from "react";
import { FileText, Edit2, Trash2, Play, MoreVertical, Calendar, DollarSign, Tag } from "lucide-react";

const ContractCard = ({ contract, onUse, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never used";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200 relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-[#EE964B] bg-opacity-10 rounded-lg">
            <FileText className="h-5 w-5 text-[#EE964B]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-[#0D3B66]">
                {contract.name}
              </h3>
              {contract.usage_count > 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                  <Tag className="h-3 w-3" />
                  Template
                </span>
              )}
            </div>
            {contract.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {contract.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(contract);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(contract.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700">
            {formatCurrency(contract.base_salary, contract.currency)}
            {contract.pay_frequency && ` / ${contract.pay_frequency}`}
          </span>
        </div>

        {contract.job_type && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
              {contract.job_type}
            </span>
            {contract.location_type && (
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                {contract.location_type}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(contract.last_used_at)}</span>
        </div>
        <div className="text-xs font-medium text-gray-600">
          Used {contract.usage_count || 0}×
        </div>
      </div>

      {/* Use Contract Button */}
      <button
        onClick={() => onUse(contract)}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors duration-200"
      >
        <Play className="h-4 w-4" />
        {contract.usage_count > 1 ? "Use Template" : "Post Job"}
      </button>
    </div>
  );
};

export default ContractCard;
