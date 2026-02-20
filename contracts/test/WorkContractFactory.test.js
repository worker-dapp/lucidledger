const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkContractFactory", function () {
  let factory, usdc, manualOracle;
  let admin, employer, worker, worker2, other;
  const PAYMENT = ethers.parseUnits("100", 6);
  const JOB_ID = 1;

  beforeEach(async function () {
    [admin, employer, worker, worker2, other] = await ethers.getSigners();

    // Deploy mock USDC
    const ERC20 = await ethers.getContractFactory("TestUSDC");
    usdc = await ERC20.deploy();

    // Deploy ManualOracle
    const ManualOracle = await ethers.getContractFactory("ManualOracle");
    manualOracle = await ManualOracle.deploy();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("WorkContractFactory");
    factory = await Factory.deploy(await usdc.getAddress(), admin.address);

    // Mint USDC to employer
    await usdc.mint(employer.address, ethers.parseUnits("10000", 6));
  });

  describe("Oracle registry", function () {
    it("admin registers an oracle", async function () {
      await expect(factory.connect(admin).registerOracle(await manualOracle.getAddress()))
        .to.emit(factory, "OracleRegistered")
        .withArgs("manual", await manualOracle.getAddress());

      expect(await factory.oracleRegistry("manual")).to.equal(await manualOracle.getAddress());
    });

    it("non-admin cannot register", async function () {
      await expect(
        factory.connect(other).registerOracle(await manualOracle.getAddress())
      ).to.be.revertedWith("Only admin");
    });

    it("admin removes an oracle", async function () {
      await factory.connect(admin).registerOracle(await manualOracle.getAddress());
      await expect(factory.connect(admin).removeOracle("manual"))
        .to.emit(factory, "OracleRemoved")
        .withArgs("manual");
      expect(await factory.oracleRegistry("manual")).to.equal(ethers.ZeroAddress);
    });

    it("cannot register same type twice", async function () {
      await factory.connect(admin).registerOracle(await manualOracle.getAddress());
      const ManualOracle2 = await ethers.getContractFactory("ManualOracle");
      const oracle2 = await ManualOracle2.deploy();
      await expect(
        factory.connect(admin).registerOracle(await oracle2.getAddress())
      ).to.be.revertedWith("Oracle type already registered");
    });
  });

  describe("Deploy with oracles", function () {
    beforeEach(async function () {
      await factory.connect(admin).registerOracle(await manualOracle.getAddress());
    });

    it("deploys contract with manual oracle", async function () {
      await usdc.connect(employer).approve(await factory.getAddress(), PAYMENT);

      const tx = await factory.connect(employer).deployContract(
        worker.address,
        ethers.ZeroAddress,
        PAYMENT,
        JOB_ID,
        ["manual"]
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => {
          try {
            return factory.interface.parseLog(log)?.name === "ContractDeployed";
          } catch { return false; }
        }
      );
      expect(event).to.not.be.undefined;

      // Check deployed contract has oracle
      const parsedEvent = factory.interface.parseLog(event);
      const contractAddr = parsedEvent.args.contractAddress;
      const WC = await ethers.getContractAt("WorkContract", contractAddr);
      expect(await WC.getOracleCount()).to.equal(1);
      expect(await WC.getOracle(0)).to.equal(await manualOracle.getAddress());
    });

    it("reverts on unregistered oracle type", async function () {
      await usdc.connect(employer).approve(await factory.getAddress(), PAYMENT);
      await expect(
        factory.connect(employer).deployContract(
          worker.address,
          ethers.ZeroAddress,
          PAYMENT,
          JOB_ID,
          ["gps"]
        )
      ).to.be.revertedWith("Unregistered oracle type");
    });
  });

  describe("Deploy without oracles (v1 compat)", function () {
    it("deploys contract with empty oracle array", async function () {
      await usdc.connect(employer).approve(await factory.getAddress(), PAYMENT);
      await factory.connect(employer).deployContract(
        worker.address,
        ethers.ZeroAddress,
        PAYMENT,
        JOB_ID,
        []
      );

      const contracts = await factory.getEmployerContracts(employer.address);
      expect(contracts.length).to.equal(1);

      const WC = await ethers.getContractAt("WorkContract", contracts[0]);
      expect(await WC.getOracleCount()).to.equal(0);
      // v1 compat: approveAndPay works from Funded
      await expect(WC.connect(employer).approveAndPay()).to.emit(WC, "WorkApproved");
    });
  });

  describe("Batch deploy", function () {
    beforeEach(async function () {
      await factory.connect(admin).registerOracle(await manualOracle.getAddress());
      const totalAmount = PAYMENT * 2n;
      await usdc.connect(employer).approve(await factory.getAddress(), totalAmount);
    });

    it("deploys batch with per-contract oracle arrays", async function () {
      const tx = await factory.connect(employer).deployBatch(
        [worker.address, worker2.address],
        [ethers.ZeroAddress, ethers.ZeroAddress],
        [PAYMENT, PAYMENT],
        [1, 2],
        [["manual"], []] // first with oracle, second without
      );

      await tx.wait();

      expect(await factory.getTotalContracts()).to.equal(2);
      const contracts = await factory.getEmployerContracts(employer.address);

      const WC1 = await ethers.getContractAt("WorkContract", contracts[0]);
      const WC2 = await ethers.getContractAt("WorkContract", contracts[1]);
      expect(await WC1.getOracleCount()).to.equal(1);
      expect(await WC2.getOracleCount()).to.equal(0);
    });

    it("emits BatchDeployed event", async function () {
      await expect(
        factory.connect(employer).deployBatch(
          [worker.address, worker2.address],
          [ethers.ZeroAddress, ethers.ZeroAddress],
          [PAYMENT, PAYMENT],
          [1, 2],
          [[], []]
        )
      ).to.emit(factory, "BatchDeployed")
        .withArgs(employer.address, 2, PAYMENT * 2n);
    });
  });

  describe("View functions", function () {
    it("tracks contracts correctly", async function () {
      await usdc.connect(employer).approve(await factory.getAddress(), PAYMENT);
      await factory.connect(employer).deployContract(
        worker.address,
        ethers.ZeroAddress,
        PAYMENT,
        JOB_ID,
        []
      );

      expect(await factory.getTotalContracts()).to.equal(1);
      expect(await factory.getEmployerContractCount(employer.address)).to.equal(1);
      const addr = await factory.getContractAt(0);
      expect(addr).to.not.equal(ethers.ZeroAddress);
    });
  });
});
