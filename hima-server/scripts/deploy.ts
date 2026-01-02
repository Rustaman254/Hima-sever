import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("🚀 Deploying Hima Micro-Insurance contracts to Mantle Testnet...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "MNT\n");

    // Step 1: Deploy Mock USDC (for testnet LP deposits)
    console.log("1️⃣  Deploying MockUSDC (for LP capital)...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const usdcAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC deployed to:", usdcAddress);
    console.log("   Initial supply: 1,000,000 USDC\n");

    // Step 2: Deploy PolicyRegistry
    console.log("2️⃣  Deploying PolicyRegistry...");
    const PolicyRegistry = await ethers.getContractFactory("PolicyRegistry");
    const policyRegistry = await PolicyRegistry.deploy();
    await policyRegistry.waitForDeployment();
    const policyRegistryAddress = await policyRegistry.getAddress();
    console.log("✅ PolicyRegistry deployed to:", policyRegistryAddress);
    console.log("");

    // Step 3: Deploy RiskPool
    console.log("3️⃣  Deploying RiskPool...");
    const RiskPool = await ethers.getContractFactory("RiskPool");
    const riskPool = await RiskPool.deploy(usdcAddress);
    await riskPool.waitForDeployment();
    const riskPoolAddress = await riskPool.getAddress();
    console.log("✅ RiskPool deployed to:", riskPoolAddress);
    console.log("");

    // Step 4: Deploy ClaimRegistry
    console.log("4️⃣  Deploying ClaimRegistry...");
    const ClaimRegistry = await ethers.getContractFactory("ClaimRegistry");
    const claimRegistry = await ClaimRegistry.deploy();
    await claimRegistry.waitForDeployment();
    const claimRegistryAddress = await claimRegistry.getAddress();
    console.log("✅ ClaimRegistry deployed to:", claimRegistryAddress);
    console.log("");

    // Step 5: Fund RiskPool with initial USDC for testing
    console.log("5️⃣  Funding RiskPool with initial capital...");
    const fundAmount = ethers.parseUnits("100000", 6); // 100,000 USDC
    const approveTx = await mockUSDC.approve(riskPoolAddress, fundAmount);
    await approveTx.wait();

    // Deposit capital to RiskPool
    const depositTx = await riskPool.depositCapital(fundAmount);
    await depositTx.wait();
    console.log("✅ Deposited 100,000 USDC to RiskPool\n");

    // Step 6: Grant OPERATOR_ROLE to deployer (backend service wallet)
    console.log("6️⃣  Granting roles to backend service wallet...");
    const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));

    const grantPolicyTx = await policyRegistry.grantRole(OPERATOR_ROLE, deployer.address);
    await grantPolicyTx.wait();

    const grantPoolTx = await riskPool.grantRole(OPERATOR_ROLE, deployer.address);
    await grantPoolTx.wait();

    const grantClaimTx = await claimRegistry.grantRole(OPERATOR_ROLE, deployer.address);
    await grantClaimTx.wait();

    console.log("✅ OPERATOR_ROLE granted to:", deployer.address);
    console.log("");

    // Step 7: Verify deployment
    console.log("7️⃣  Verifying deployment...");
    const poolStats = await riskPool.getPoolStats();
    console.log("   RiskPool total capital:", ethers.formatUnits(poolStats[0], 6), "USDC");
    console.log("   RiskPool total pool tokens:", ethers.formatUnits(poolStats[1], 18), "HRPT");

    const policyStats = await policyRegistry.getStats();
    console.log("   PolicyRegistry total policies:", policyStats[0].toString());

    const claimStats = await claimRegistry.getStats();
    console.log("   ClaimRegistry total claims:", claimStats[0].toString());
    console.log("");

    // Print summary
    console.log("=".repeat(70));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(70));
    console.log("\n📋 Contract Addresses:");
    console.log("   MockUSDC:        ", usdcAddress);
    console.log("   PolicyRegistry:  ", policyRegistryAddress);
    console.log("   RiskPool:        ", riskPoolAddress);
    console.log("   ClaimRegistry:   ", claimRegistryAddress);
    console.log("\n🔗 Explorer Links:");
    console.log("   MockUSDC:        ", `https://explorer.testnet.mantle.xyz/address/${usdcAddress}`);
    console.log("   PolicyRegistry:  ", `https://explorer.testnet.mantle.xyz/address/${policyRegistryAddress}`);
    console.log("   RiskPool:        ", `https://explorer.testnet.mantle.xyz/address/${riskPoolAddress}`);
    console.log("   ClaimRegistry:   ", `https://explorer.testnet.mantle.xyz/address/${claimRegistryAddress}`);
    console.log("\n📝 Next Steps:");
    console.log("   1. Update .env with:");
    console.log(`      USDC_ADDRESS=${usdcAddress}`);
    console.log(`      POLICY_REGISTRY_ADDRESS=${policyRegistryAddress}`);
    console.log(`      RISK_POOL_ADDRESS=${riskPoolAddress}`);
    console.log(`      CLAIM_REGISTRY_ADDRESS=${claimRegistryAddress}`);
    console.log("   2. Restart your server");
    console.log("   3. Test the integration");
    console.log("\n💡 Notes:");
    console.log("   - Rider payments are via M-Pesa (not USDC)");
    console.log("   - USDC is only for LP capital deposits");
    console.log("   - Backend service wallet has OPERATOR_ROLE");
    console.log("=".repeat(70) + "\n");

    // Save deployment info to file
    const fs = require("fs");
    const deploymentInfo = {
        network: "mantle-testnet",
        chainId: 5001,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            MockUSDC: usdcAddress,
            PolicyRegistry: policyRegistryAddress,
            RiskPool: riskPoolAddress,
            ClaimRegistry: claimRegistryAddress,
        },
        roles: {
            OPERATOR_ROLE: deployer.address,
        },
    };

    fs.writeFileSync(
        "deployment-info.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("💾 Deployment info saved to deployment-info.json\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
