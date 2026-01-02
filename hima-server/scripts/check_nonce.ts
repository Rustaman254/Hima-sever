import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Address:", deployer.address);

    // Get latest committed nonce
    const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
    console.log("Latest nonce:", nonce);

    // Get pending nonce (including mempool)
    const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
    console.log("Pending nonce:", pendingNonce);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
