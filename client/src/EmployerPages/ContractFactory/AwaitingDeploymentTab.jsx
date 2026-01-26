import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Rocket, AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react";
import { parseUnits } from "viem";
import apiService from "../../services/api";
import {
  getUSDCBalance,
  deployBatchViaFactory,
  checkFactoryConfiguration,
} from "../../contracts/deployViaFactory";
import { TxSteps, checkAAConfiguration, parseAAError } from "../../contracts/aaClient";
import { useAuth } from "../../hooks/useAuth";

const USDC_DECIMALS = 6;

// Deployment step messages for UI
const stepMessages = {
  [TxSteps.IDLE]: "",
  [TxSteps.PREPARING_USEROP]: "Preparing transaction...",
  [TxSteps.SIGNING_USEROP]: "Sign in your wallet...",
  [TxSteps.SUBMITTING_USEROP]: "Submitting to network (gas-free)...",
  [TxSteps.CONFIRMING]: "Waiting for blockchain confirmation...",
  [TxSteps.SUCCESS]: "Deployment complete!",
  [TxSteps.ERROR]: "Deployment failed",
};

const AwaitingDeploymentTab = ({ employerId }) => {
  const { smartWalletClient, smartWalletAddress } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState("");
  const [deploymentStep, setDeploymentStep] = useState(TxSteps.IDLE);
  const [deploymentMessage, setDeploymentMessage] = useState("");
  const [deploymentError, setDeploymentError] = useState("");
  const [currentDeployingId, setCurrentDeployingId] = useState(null);
  const [deployedContracts, setDeployedContracts] = useState([]);
  const [configValid, setConfigValid] = useState(true);
  const [configMissing, setConfigMissing] = useState([]);
  const [aaConfigValid, setAaConfigValid] = useState(true);

  // Check configuration on mount
  useEffect(() => {
    const config = checkFactoryConfiguration();
    setConfigValid(config.valid);
    setConfigMissing(config.missing);

    const aaConfig = checkAAConfiguration({ smartWalletClient });
    setAaConfigValid(aaConfig.valid);
    if (!aaConfig.valid) {
      setConfigMissing((prev) => [...prev, ...aaConfig.missing]);
    }
  }, [smartWalletClient]);

  const fetchSignedApplications = async () => {
    if (!employerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await apiService.getApplicationsByEmployer(employerId, "signed");
      setApplications(response?.data || []);
    } catch (error) {
      setMessage(error.message || "Failed to load signed applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedApplications();
  }, [employerId]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(applications.map((app) => app.id)));
  };

  const handleStatusChange = ({ step, message }) => {
    setDeploymentStep(step);
    setDeploymentMessage(message);
  };

  /**
   * Validate applications and build deployment configurations.
   * Returns array of valid deployments for batch deployment.
   */
  const validateAndBuildDeployments = async (selectedApps) => {
    const deployments = [];

    for (let i = 0; i < selectedApps.length; i++) {
      const app = selectedApps[i];
      const job = app.job;
      const employee = app.employee;

      if (!job || !employee) {
        throw new Error(`Application ${app.id}: Missing job or employee data`);
      }

      if (!employee.wallet_address) {
        throw new Error(
          `Application ${app.id}: Worker ${employee.first_name} ${employee.last_name} has no wallet address`
        );
      }

      const paymentAmount = Number(job.salary || 0);
      if (paymentAmount <= 0) {
        throw new Error(`Application ${app.id}: Job has no salary set`);
      }

      deployments.push({
        applicationId: app.id,
        workerAddress: employee.wallet_address,
        paymentAmountUSD: paymentAmount,
        jobId: job.id,
        job,
        employee,
      });
    }

    return deployments;
  };

  const deploySelected = async () => {
    if (selectedIds.size === 0) {
      setMessage("Select at least one contract to deploy.");
      return;
    }

    if (!configValid || !aaConfigValid) {
      setMessage("Configuration incomplete. Check environment variables.");
      return;
    }

    if (!smartWalletClient || !smartWalletAddress) {
      setMessage("Please connect your wallet first.");
      return;
    }

    setMessage("");
    setDeploymentError("");
    setDeployedContracts([]);
    setDeploymentStep(TxSteps.PREPARING_USEROP);
    setDeploymentMessage("Preparing batch deployment...");

    const selectedApps = applications.filter((app) => selectedIds.has(app.id));

    try {
      // Validate and build deployment configurations
      setDeploymentMessage("Validating applications...");
      const deployments = await validateAndBuildDeployments(selectedApps);

      // Calculate total USDC needed
      const totalUSDC = deployments.reduce((sum, d) => sum + d.paymentAmountUSD, 0);

      // Check USDC balance
      setDeploymentMessage("Checking USDC balance...");
      const balance = await getUSDCBalance(smartWalletAddress);
      const requiredAmount = parseUnits(totalUSDC.toString(), USDC_DECIMALS);

      if (balance.raw < requiredAmount) {
        throw new Error(
          `Insufficient USDC. Have: ${balance.formatted} USDC, Need: ${totalUSDC} USDC. ` +
            `Get testnet USDC at https://faucet.circle.com/`
        );
      }

      // Mark all as deploying
      setCurrentDeployingId("batch");
      setDeploymentMessage(`Deploying ${deployments.length} contract(s)...`);

      // Single batch deployment (one wallet signature for all contracts)
      const result = await deployBatchViaFactory({
        smartWalletClient,
        deployments,
        onStatusChange: handleStatusChange,
      });

      // Save all contracts to database
      const deployedResults = [];
      for (let i = 0; i < deployments.length; i++) {
        const deployment = deployments[i];
        const contractAddress = result.contractAddresses[i];

        await apiService.createDeployedContract({
          job_posting_id: deployment.jobId,
          employee_id: deployment.employee.id,
          employer_id: deployment.job.employer_id,
          contract_address: contractAddress,
          payment_amount: deployment.paymentAmountUSD,
          payment_currency: "USDC",
          payment_frequency: deployment.job.pay_frequency || null,
          status: "active",
          selected_oracles: deployment.job.selected_oracles || "manual_verification",
          verification_status: "pending",
          deployment_tx_hash: result.txHash,
        });

        deployedResults.push({
          applicationId: deployment.applicationId,
          workerName: `${deployment.employee?.first_name || ""} ${deployment.employee?.last_name || ""}`.trim(),
          contractAddress,
          txHash: result.txHash,
          basescanUrl: `https://sepolia.basescan.org/address/${contractAddress}`,
        });
      }

      // Update all application statuses
      const applicationIds = deployments.map((d) => d.applicationId);
      await apiService.bulkUpdateApplicationStatus(applicationIds, "deployed");

      setDeployedContracts(deployedResults);
      setDeploymentStep(TxSteps.SUCCESS);
      setDeploymentMessage(
        `Successfully deployed ${deployments.length} contract(s) with a single signature!`
      );
    } catch (error) {
      console.error("Batch deployment error:", error);
      setDeploymentStep(TxSteps.ERROR);
      setDeploymentError(parseAAError(error));
    } finally {
      setCurrentDeployingId(null);
      setSelectedIds(new Set());
      await fetchSignedApplications();
    }
  };

  const resetDeploymentState = () => {
    setDeploymentStep(TxSteps.IDLE);
    setDeploymentMessage("");
    setDeploymentError("");
    setDeployedContracts([]);
  };

  const signedCount = useMemo(() => applications.length, [applications.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Loading signed contracts...
      </div>
    );
  }

  // Configuration warning
  if (!configValid || !aaConfigValid) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Blockchain Configuration Required</h3>
            <p className="text-sm text-amber-700 mt-1">
              The following environment variables must be set to enable contract deployment:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 mt-2">
              {configMissing.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
            <p className="text-sm text-amber-700 mt-3">
              See the setup documentation for Base Sepolia testnet configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#0D3B66]">Awaiting Deployment</h2>
          <p className="text-sm text-gray-500">
            Signed offers ready for blockchain deployment on Base Sepolia.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Rocket className="h-4 w-4 text-purple-600" />
          {signedCount} signed contracts
        </div>
      </div>

      {/* Gas Sponsorship Banner */}
      <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
        <Zap className="h-5 w-5 text-green-600" />
        <div className="text-sm">
          <span className="font-medium text-green-800">Gas fees sponsored</span>
          <span className="text-green-700"> — No ETH required for contract deployment!</span>
        </div>
      </div>

      {/* Deployment Progress */}
      {deploymentStep !== TxSteps.IDLE && deploymentStep !== TxSteps.SUCCESS && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {deploymentStep === TxSteps.ERROR ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            )}
            <div className="flex-1">
              <p className="font-medium text-blue-800">
                {deploymentMessage || stepMessages[deploymentStep]}
              </p>
              {deploymentStep === TxSteps.SIGNING_USEROP && (
                <p className="text-sm text-blue-600 mt-1">
                  Check your wallet for a signature request
                </p>
              )}
              {deploymentError && (
                <p className="text-sm text-red-600 mt-1">{deploymentError}</p>
              )}
            </div>
          </div>
          {deploymentStep === TxSteps.ERROR && (
            <button
              onClick={resetDeploymentState}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Dismiss and try again
            </button>
          )}
        </div>
      )}

      {/* Deployment Success */}
      {deploymentStep === TxSteps.SUCCESS && deployedContracts.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800">
                {deployedContracts.length} contract(s) deployed successfully!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Gas fees were sponsored — no ETH was spent.
              </p>
              <div className="mt-3 space-y-2">
                {deployedContracts.map((contract) => (
                  <div
                    key={contract.applicationId}
                    className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-green-100"
                  >
                    <span className="text-gray-700">{contract.workerName}</span>
                    <a
                      href={contract.basescanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      View on BaseScan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
              <button
                onClick={resetDeploymentState}
                className="mt-3 text-sm text-green-600 hover:text-green-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.size === applications.length && applications.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Select all
          </label>
          <span>{selectedIds.size} selected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-6 py-3">Worker</th>
                <th className="text-left font-medium px-6 py-3">Role</th>
                <th className="text-left font-medium px-6 py-3">Signed</th>
                <th className="text-left font-medium px-6 py-3">Payment (USDC)</th>
                <th className="text-left font-medium px-6 py-3">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const employee = application.employee;
                const job = application.job;
                const isDeploying = currentDeployingId === application.id;
                const hasWallet = Boolean(employee?.wallet_address);

                return (
                  <tr
                    key={application.id}
                    className={`border-t border-gray-100 ${isDeploying ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(application.id)}
                          onChange={() => toggleSelect(application.id)}
                          disabled={!hasWallet || isDeploying}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                        />
                        <div>
                          <div className="font-medium text-[#0D3B66]">
                            {employee?.first_name || "Unknown"} {employee?.last_name || ""}
                            {isDeploying && (
                              <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin text-blue-600" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{employee?.email || ""}</div>
                        </div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{job?.title || "--"}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {application.offer_accepted_at
                        ? new Date(application.offer_accepted_at).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {job?.salary || "--"} USDC / {job?.pay_frequency || "--"}
                    </td>
                    <td className="px-6 py-4">
                      {hasWallet ? (
                        <span className="text-xs text-gray-500 font-mono">
                          {employee.wallet_address.slice(0, 6)}...{employee.wallet_address.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">No wallet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    No signed contracts awaiting deployment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-gray-500">
            <p>Contracts deploy to Base Sepolia with USDC escrow.</p>
            <p className="mt-1">
              Need testnet USDC?{" "}
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Circle Faucet
              </a>
            </p>
          </div>
          <button
            onClick={deploySelected}
            disabled={selectedIds.size === 0 || deploymentStep !== TxSteps.IDLE || !smartWalletClient || !smartWalletAddress}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Rocket className="h-4 w-4" />
            Deploy to Blockchain
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-amber-700">{message}</p>}
    </div>
  );
};

export default AwaitingDeploymentTab;
