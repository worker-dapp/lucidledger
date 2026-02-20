const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkContract", function () {
  let workContract, manualOracle, usdc;
  let admin, employer, worker, mediator, other;
  const PAYMENT = ethers.parseUnits("100", 6); // 100 USDC
  const JOB_ID = 1;

  async function deployFixture({ oracles = [] } = {}) {
    [admin, employer, worker, mediator, other] = await ethers.getSigners();

    // Deploy mock USDC
    const ERC20 = await ethers.getContractFactory("TestUSDC");
    usdc = await ERC20.deploy();

    // Deploy ManualOracle
    const ManualOracle = await ethers.getContractFactory("ManualOracle");
    manualOracle = await ManualOracle.deploy();

    // Resolve oracle array
    const oracleAddrs = [];
    for (const o of oracles) {
      oracleAddrs.push(await o.getAddress());
    }

    // Deploy WorkContract
    const WC = await ethers.getContractFactory("WorkContract");
    workContract = await WC.deploy(
      employer.address,
      worker.address,
      ethers.ZeroAddress, // mediator assigned later
      await usdc.getAddress(),
      PAYMENT,
      JOB_ID,
      admin.address,
      oracleAddrs
    );

    // Fund the contract (simulating factory behavior)
    await usdc.mint(await workContract.getAddress(), PAYMENT);

    return { workContract, usdc, manualOracle };
  }

  describe("Constructor", function () {
    it("sets initial state to Funded", async function () {
      await deployFixture();
      expect(await workContract.state()).to.equal(0); // Funded
    });

    it("stores oracle references", async function () {
      await deployFixture({ oracles: [manualOracle] });
      const ManualOracle = await ethers.getContractFactory("ManualOracle");
      const oracle = await ManualOracle.deploy();

      const WC = await ethers.getContractFactory("WorkContract");
      const wc = await WC.deploy(
        employer.address,
        worker.address,
        ethers.ZeroAddress,
        await usdc.getAddress(),
        PAYMENT,
        JOB_ID,
        admin.address,
        [await oracle.getAddress()]
      );
      expect(await wc.getOracleCount()).to.equal(1);
      expect(await wc.getOracle(0)).to.equal(await oracle.getAddress());
    });

    it("reverts if worker == employer", async function () {
      [admin, employer] = await ethers.getSigners();
      const ERC20 = await ethers.getContractFactory("TestUSDC");
      const token = await ERC20.deploy();
      const WC = await ethers.getContractFactory("WorkContract");
      await expect(
        WC.deploy(employer.address, employer.address, ethers.ZeroAddress, await token.getAddress(), PAYMENT, JOB_ID, admin.address, [])
      ).to.be.revertedWith("Employer cannot be the worker");
    });
  });

  describe("Happy path: Funded → Completed (with oracles)", function () {
    beforeEach(async function () {
      const ManualOracle = await ethers.getContractFactory("ManualOracle");
      const oracle = await ManualOracle.deploy();
      await deployFixture();
      manualOracle = oracle;
      const WC = await ethers.getContractFactory("WorkContract");
      workContract = await WC.deploy(
        employer.address,
        worker.address,
        ethers.ZeroAddress,
        await usdc.getAddress(),
        PAYMENT,
        JOB_ID,
        admin.address,
        [await manualOracle.getAddress()]
      );
      await usdc.mint(await workContract.getAddress(), PAYMENT);
    });

    it("employer verifies oracle then approves from Funded", async function () {
      expect(await workContract.state()).to.equal(0); // Funded

      // Employer verifies via oracle
      await manualOracle.connect(employer).verify(await workContract.getAddress());
      expect(await workContract.checkOracles()).to.equal(true);

      // Employer approves and pays
      await expect(workContract.connect(employer).approveAndPay())
        .to.emit(workContract, "WorkApproved")
        .withArgs(worker.address, PAYMENT);
      expect(await workContract.state()).to.equal(2); // Completed
      expect(await usdc.balanceOf(worker.address)).to.equal(PAYMENT);
    });

    it("reverts approveAndPay without oracle verification", async function () {
      await expect(
        workContract.connect(employer).approveAndPay()
      ).to.be.revertedWith("Oracle verification not complete");
    });
  });

  describe("No oracles: Funded → Completed", function () {
    beforeEach(async function () {
      await deployFixture({ oracles: [] });
    });

    it("approveAndPay works from Funded state", async function () {
      await expect(workContract.connect(employer).approveAndPay())
        .to.emit(workContract, "WorkApproved");
      expect(await workContract.state()).to.equal(2); // Completed
    });
  });

  describe("Funded → Cancelled", function () {
    beforeEach(async function () {
      await deployFixture();
    });

    it("employer cancels and gets USDC refund", async function () {
      const balanceBefore = await usdc.balanceOf(employer.address);
      await expect(workContract.connect(employer).cancelContract())
        .to.emit(workContract, "ContractCancelled")
        .withArgs(employer.address, PAYMENT);
      expect(await workContract.state()).to.equal(5); // Cancelled
      expect(await usdc.balanceOf(employer.address)).to.equal(balanceBefore + PAYMENT);
    });

    it("only employer can cancel", async function () {
      await expect(
        workContract.connect(worker).cancelContract()
      ).to.be.revertedWith("Only employer can cancel");
    });
  });

  describe("Funded → Disputed → Resolved", function () {
    beforeEach(async function () {
      await deployFixture();
    });

    it("either party can raise dispute from Funded", async function () {
      await expect(workContract.connect(worker).raiseDispute("Late payment"))
        .to.emit(workContract, "DisputeRaised")
        .withArgs(worker.address, "Late payment");
      expect(await workContract.state()).to.equal(3); // Disputed
    });

    it("employer can raise dispute from Funded", async function () {
      await expect(workContract.connect(employer).raiseDispute("Worker no-show"))
        .to.emit(workContract, "DisputeRaised")
        .withArgs(employer.address, "Worker no-show");
      expect(await workContract.state()).to.equal(3); // Disputed
    });

    it("mediator resolves 100% to worker", async function () {
      await workContract.connect(worker).raiseDispute("Bad work conditions");
      await workContract.connect(admin).assignMediator(mediator.address);

      await expect(workContract.connect(mediator).resolveDispute(100))
        .to.emit(workContract, "DisputeResolved")
        .withArgs(mediator.address, PAYMENT, 0);
      expect(await workContract.state()).to.equal(2); // Completed
      expect(await usdc.balanceOf(worker.address)).to.equal(PAYMENT);
    });

    it("mediator resolves 0% (full refund to employer)", async function () {
      await workContract.connect(worker).raiseDispute("Bad work conditions");
      await workContract.connect(admin).assignMediator(mediator.address);

      const balanceBefore = await usdc.balanceOf(employer.address);
      await expect(workContract.connect(mediator).resolveDispute(0))
        .to.emit(workContract, "DisputeResolved")
        .withArgs(mediator.address, 0, PAYMENT);
      expect(await workContract.state()).to.equal(4); // Refunded
      expect(await usdc.balanceOf(employer.address)).to.equal(balanceBefore + PAYMENT);
    });

    it("mediator resolves 50% split", async function () {
      await workContract.connect(worker).raiseDispute("Partial work");
      await workContract.connect(admin).assignMediator(mediator.address);

      const halfPayment = PAYMENT / 2n;
      await workContract.connect(mediator).resolveDispute(50);
      expect(await workContract.state()).to.equal(2); // Completed
      expect(await usdc.balanceOf(worker.address)).to.equal(halfPayment);
      expect(await usdc.balanceOf(employer.address)).to.equal(halfPayment);
    });
  });

  describe("topUp", function () {
    beforeEach(async function () {
      await deployFixture();
    });

    it("increases escrow balance and paymentAmount", async function () {
      const topUpAmount = ethers.parseUnits("50", 6);
      await usdc.mint(other.address, topUpAmount);
      await usdc.connect(other).approve(await workContract.getAddress(), topUpAmount);

      await expect(workContract.connect(other).topUp(topUpAmount))
        .to.emit(workContract, "EscrowTopUp");
      expect(await workContract.paymentAmount()).to.equal(PAYMENT + topUpAmount);
      expect(await workContract.getBalance()).to.equal(PAYMENT + topUpAmount);
    });
  });

  describe("Access control", function () {
    beforeEach(async function () {
      await deployFixture();
    });

    it("only employer can approve", async function () {
      await expect(
        workContract.connect(worker).approveAndPay()
      ).to.be.revertedWith("Only employer can approve");
    });

    it("only admin can assign mediator", async function () {
      await expect(
        workContract.connect(employer).assignMediator(mediator.address)
      ).to.be.revertedWith("Only admin");
    });

    it("only mediator can resolve", async function () {
      await workContract.connect(worker).raiseDispute("reason");
      await workContract.connect(admin).assignMediator(mediator.address);
      await expect(
        workContract.connect(employer).resolveDispute(50)
      ).to.be.revertedWith("Only mediator can resolve disputes");
    });
  });

  describe("getDetails", function () {
    it("returns expanded tuple with oracle count", async function () {
      const ManualOracle = await ethers.getContractFactory("ManualOracle");
      const oracle = await ManualOracle.deploy();

      const WC = await ethers.getContractFactory("WorkContract");
      const wc = await WC.deploy(
        employer.address,
        worker.address,
        ethers.ZeroAddress,
        await usdc.getAddress(),
        PAYMENT,
        JOB_ID,
        admin.address,
        [await oracle.getAddress()]
      );

      const details = await wc.getDetails();
      expect(details._employer).to.equal(employer.address);
      expect(details._oracleCount).to.equal(1);
    });
  });
});
