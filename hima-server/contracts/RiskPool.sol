// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RiskPool
 * @dev Manages pooled capital for insurance coverage on Mantle Network
 * @notice LPs deposit capital and receive pool tokens representing their share
 */
contract RiskPool is AccessControl, ReentrancyGuard, Pausable, ERC20 {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Capital token (e.g., USDC on Mantle)
    IERC20 public immutable capitalToken;

    // Pool statistics
    uint256 public totalPremiumsRecorded; // Total premiums in KES equivalent
    uint256 public totalClaimsRecorded; // Total claims paid in KES equivalent
    uint256 public totalCapitalDeposited; // Total capital deposited in token units
    uint256 public totalCapitalWithdrawn; // Total capital withdrawn in token units

    // Events
    event CapitalDeposited(
        address indexed provider,
        uint256 amount,
        uint256 poolTokensMinted
    );

    event CapitalWithdrawn(
        address indexed provider,
        uint256 amount,
        uint256 poolTokensBurned
    );

    event PremiumRecorded(
        uint256 indexed policyId,
        uint256 amountKES,
        uint256 timestamp
    );

    event ClaimPayoutRecorded(
        uint256 indexed policyId,
        uint256 indexed claimId,
        uint256 amountKES,
        uint256 timestamp
    );

    /**
     * @dev Constructor
     * @param _capitalToken Address of the capital token (e.g., USDC)
     */
    constructor(address _capitalToken) ERC20("Hima Risk Pool Token", "HRPT") {
        require(_capitalToken != address(0), "Invalid capital token");
        capitalToken = IERC20(_capitalToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    /**
     * @notice Deposit capital and receive pool tokens
     * @param _amount Amount of capital token to deposit
     */
    function depositCapital(
        uint256 _amount
    ) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be > 0");

        // Calculate pool tokens to mint
        uint256 poolTokensToMint;
        uint256 totalPoolTokens = totalSupply();
        uint256 totalPoolCapital = capitalToken.balanceOf(address(this));

        if (totalPoolTokens == 0 || totalPoolCapital == 0) {
            // First deposit: 1:1 ratio
            poolTokensToMint = _amount;
        } else {
            // Subsequent deposits: proportional to pool share
            poolTokensToMint = (_amount * totalPoolTokens) / totalPoolCapital;
        }

        // Transfer capital token from depositor
        require(
            capitalToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        // Mint pool tokens
        _mint(msg.sender, poolTokensToMint);

        totalCapitalDeposited += _amount;

        emit CapitalDeposited(msg.sender, _amount, poolTokensToMint);
    }

    /**
     * @notice Withdraw capital by burning pool tokens
     * @param _poolTokenAmount Amount of pool tokens to burn
     */
    function withdrawCapital(
        uint256 _poolTokenAmount
    ) external whenNotPaused nonReentrant {
        require(_poolTokenAmount > 0, "Amount must be > 0");
        require(
            balanceOf(msg.sender) >= _poolTokenAmount,
            "Insufficient pool tokens"
        );

        // Calculate capital to return
        uint256 totalPoolTokens = totalSupply();
        uint256 totalPoolCapital = capitalToken.balanceOf(address(this));
        uint256 capitalToReturn = (_poolTokenAmount * totalPoolCapital) /
            totalPoolTokens;

        require(capitalToReturn > 0, "No capital to withdraw");

        // Burn pool tokens
        _burn(msg.sender, _poolTokenAmount);

        // Transfer capital token to withdrawer
        require(
            capitalToken.transfer(msg.sender, capitalToReturn),
            "Transfer failed"
        );

        totalCapitalWithdrawn += capitalToReturn;

        emit CapitalWithdrawn(msg.sender, capitalToReturn, _poolTokenAmount);
    }

    /**
     * @notice Record premium received (operator only)
     * @param _policyId Policy ID
     * @param _amountKES Premium amount in KES
     */
    function recordPremium(
        uint256 _policyId,
        uint256 _amountKES
    ) external onlyRole(OPERATOR_ROLE) {
        require(_amountKES > 0, "Amount must be > 0");

        totalPremiumsRecorded += _amountKES;

        emit PremiumRecorded(_policyId, _amountKES, block.timestamp);
    }

    /**
     * @notice Record claim payout (operator only)
     * @param _policyId Policy ID
     * @param _claimId Claim ID
     * @param _amountKES Claim amount in KES
     */
    function recordClaimPayout(
        uint256 _policyId,
        uint256 _claimId,
        uint256 _amountKES
    ) external onlyRole(OPERATOR_ROLE) {
        require(_amountKES > 0, "Amount must be > 0");

        totalClaimsRecorded += _amountKES;

        emit ClaimPayoutRecorded(
            _policyId,
            _claimId,
            _amountKES,
            block.timestamp
        );
    }

    /**
     * @notice Get pool statistics
     */
    function getPoolStats()
        external
        view
        returns (
            uint256 totalCapital,
            uint256 totalPoolTokens,
            uint256 premiumsRecorded,
            uint256 claimsRecorded,
            uint256 netPremiums
        )
    {
        return (
            capitalToken.balanceOf(address(this)),
            totalSupply(),
            totalPremiumsRecorded,
            totalClaimsRecorded,
            totalPremiumsRecorded > totalClaimsRecorded
                ? totalPremiumsRecorded - totalClaimsRecorded
                : 0
        );
    }

    /**
     * @notice Get LP's share of the pool
     * @param _provider LP address
     */
    function getProviderShare(
        address _provider
    )
        external
        view
        returns (
            uint256 poolTokenBalance,
            uint256 capitalValue,
            uint256 sharePercentage
        )
    {
        uint256 poolTokens = balanceOf(_provider);
        uint256 totalPoolTokens = totalSupply();
        uint256 totalPoolCapital = capitalToken.balanceOf(address(this));

        uint256 capital = totalPoolTokens > 0
            ? (poolTokens * totalPoolCapital) / totalPoolTokens
            : 0;

        uint256 share = totalPoolTokens > 0
            ? (poolTokens * 10000) / totalPoolTokens // Basis points
            : 0;

        return (poolTokens, capital, share);
    }

    /**
     * @notice Emergency withdraw (admin only)
     * @param _amount Amount to withdraw
     * @param _to Recipient address
     */
    function emergencyWithdraw(
        uint256 _amount,
        address _to
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");

        require(capitalToken.transfer(_to, _amount), "Transfer failed");
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
