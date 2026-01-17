import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
    solidity: {
        version: "0.8.26",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // Mantle Testnet
        mantleTestnet: {
            url: process.env.RPC_URL || "https://rpc.sepolia.mantle.xyz",
            chainId: 5003,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        mantleMainnet: {
            url: "https://rpc.mantle.xyz",
            chainId: 5000,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: {
            mantleTestnet: process.env.MANTLE_API_KEY || "",
            mantleMainnet: process.env.MANTLE_API_KEY || "",
        },
        customChains: [
            {
                network: "mantleTestnet",
                chainId: 5003,
                urls: {
                    apiURL: "https://explorer.sepolia.mantle.xyz/api",
                    browserURL: "https://explorer.sepolia.mantle.xyz",
                },
            },
            {
                network: "mantleMainnet",
                chainId: 5000,
                urls: {
                    apiURL: "https://explorer.mantle.xyz/api",
                    browserURL: "https://explorer.mantle.xyz",
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
