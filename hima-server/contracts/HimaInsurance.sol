// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HimaInsurance
 * @dev Production-level insurance smart contract for motorcycle insurance on Mantle
 * @notice This contract manages policy creation, premium payments, and claims processing
 */
contract HimaInsurance is AccessControl, ReentrancyGuard, Pausable {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // USDC token interface
    IERC20 public immutable usdcToken;

    // Policy structure
    struct Policy {
        string policyNumber;
        address policyHolder;
        uint256 premiumAmount; // In USDC (6 decimals)
        uint256 coverageAmount; // Maximum claim amount
        uint256 startDate;
        uint256 endDate;
        CoverageType coverageType;
        PolicyStatus status;
        string motorcycleDetails; // Off-chain reference hash
        uint256 totalPaid;
        uint256 lastPaymentDate;
    }

    // Claim structure
    struct Claim {
        uint256 policyId;
        address claimant;
        uint256 claimAmount;
        string claimDetails; // IPFS hash or off-chain reference
        uint256 submittedAt;
        uint256 processedAt;
        ClaimStatus status;
        string rejectionReason;
    }

    // Enums
    enum CoverageType {
        BASIC,
        COMPREHENSIVE,
        PREMIUM
    }
    enum PolicyStatus {
        ACTIVE,
        EXPIRED,
        CANCELLED,
        SUSPENDED
    }
    enum ClaimStatus {
        PENDING,
        APPROVED,
        REJECTED,
        PAID
    }

    // State variables
    uint256 public policyCounter;
    uint256 public claimCounter;
    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;

    mapping(uint256 => Policy) public policies;
    mapping(string => uint256) public policyNumberToId;
    mapping(address => uint256[]) public userPolicies;
    mapping(uint256 => Claim[]) public policyClaims;
    mapping(uint256 => Claim) public claims;

    // Coverage type to coverage amount multipliers (basis points, 10000 = 100%)
    mapping(CoverageType => uint256) public coverageMultipliers;

    // Events
    event PolicyCreated(
        uint256 indexed policyId,
        string policyNumber,
        address indexed policyHolder,
        uint256 premiumAmount,
        CoverageType coverageType
    );

    event PremiumPaid(
        uint256 indexed policyId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );

    event PolicyStatusChanged(
        uint256 indexed policyId,
        PolicyStatus oldStatus,
        PolicyStatus newStatus
    );

    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed claimant,
        uint256 claimAmount
    );

    event ClaimProcessed(
        uint256 indexed claimId,
        ClaimStatus status,
        uint256 paidAmount
    );

    event CoverageMultiplierUpdated(
        CoverageType coverageType,
        uint256 oldMultiplier,
        uint256 newMultiplier
    );

    // Modifiers
    modifier onlyPolicyHolder(uint256 _policyId) {
        require(
            policies[_policyId].policyHolder == msg.sender,
            "Not policy holder"
        );
        _;
    }

    modifier policyExists(uint256 _policyId) {
        require(
            _policyId > 0 && _policyId <= policyCounter,
            "Policy does not exist"
        );
        _;
    }

    modifier policyActive(uint256 _policyId) {
        require(
            policies[_policyId].status == PolicyStatus.ACTIVE,
            "Policy not active"
        );
        require(
            block.timestamp <= policies[_policyId].endDate,
            "Policy expired"
        );
        _;
    }

    /**
     * @dev Constructor
     * @param _usdcToken Address of USDC token on Mantle
     */
    constructor(address _usdcToken) {
        require(_usdcToken != address(0), "Invalid USDC address");

        usdcToken = IERC20(_usdcToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Set default coverage multipliers (basis points)
        coverageMultipliers[CoverageType.BASIC] = 50000; // 5x premium
        coverageMultipliers[CoverageType.COMPREHENSIVE] = 100000; // 10x premium
        coverageMultipliers[CoverageType.PREMIUM] = 200000; // 20x premium
    }

    /**
     * @notice Create a new insurance policy
     * @param _policyNumber Unique policy number from off-chain system
     * @param _policyHolder Address of the policy holder
     * @param _premiumAmount Annual premium in USDC (6 decimals)
     * @param _coverageType Type of coverage
     * @param _motorcycleDetails Off-chain reference (IPFS hash or database ID)
     * @param _durationDays Policy duration in days
     */
    function createPolicy(
        string memory _policyNumber,
        address _policyHolder,
        uint256 _premiumAmount,
        CoverageType _coverageType,
        string memory _motorcycleDetails,
        uint256 _durationDays
    )
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(_policyHolder != address(0), "Invalid policy holder");
        require(_premiumAmount > 0, "Premium must be greater than 0");
        require(_durationDays >= 1 && _durationDays <= 365, "Invalid duration");
        require(
            policyNumberToId[_policyNumber] == 0,
            "Policy number already exists"
        );
        require(
            bytes(_motorcycleDetails).length > 0,
            "Motorcycle details required"
        );

        policyCounter++;
        uint256 policyId = policyCounter;

        uint256 coverageAmount = (_premiumAmount *
            coverageMultipliers[_coverageType]) / 10000;

        policies[policyId] = Policy({
            policyNumber: _policyNumber,
            policyHolder: _policyHolder,
            premiumAmount: _premiumAmount,
            coverageAmount: coverageAmount,
            startDate: block.timestamp,
            endDate: block.timestamp + (_durationDays * 1 days),
            coverageType: _coverageType,
            status: PolicyStatus.ACTIVE,
            motorcycleDetails: _motorcycleDetails,
            totalPaid: 0,
            lastPaymentDate: 0
        });

        policyNumberToId[_policyNumber] = policyId;
        userPolicies[_policyHolder].push(policyId);

        emit PolicyCreated(
            policyId,
            _policyNumber,
            _policyHolder,
            _premiumAmount,
            _coverageType
        );

        return policyId;
    }

    /**
     * @notice Pay premium for a policy
     * @param _policyId ID of the policy
     * @param _amount Amount to pay in USDC
     */
    function payPremium(
        uint256 _policyId,
        uint256 _amount
    ) external policyExists(_policyId) whenNotPaused nonReentrant {
        Policy storage policy = policies[_policyId];
        require(policy.status == PolicyStatus.ACTIVE, "Policy not active");
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer USDC from payer to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );

        policy.totalPaid += _amount;
        policy.lastPaymentDate = block.timestamp;
        totalPremiumsCollected += _amount;

        emit PremiumPaid(_policyId, msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Submit a claim
     * @param _policyId ID of the policy
     * @param _claimAmount Amount claimed in USDC
     * @param _claimDetails Off-chain reference (IPFS hash, photos, documents)
     */
    function submitClaim(
        uint256 _policyId,
        uint256 _claimAmount,
        string memory _claimDetails
    )
        external
        policyExists(_policyId)
        policyActive(_policyId)
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        Policy storage policy = policies[_policyId];
        require(msg.sender == policy.policyHolder, "Not policy holder");
        require(_claimAmount > 0, "Claim amount must be greater than 0");
        require(
            _claimAmount <= policy.coverageAmount,
            "Claim exceeds coverage"
        );
        require(bytes(_claimDetails).length > 0, "Claim details required");

        claimCounter++;
        uint256 claimId = claimCounter;

        claims[claimId] = Claim({
            policyId: _policyId,
            claimant: msg.sender,
            claimAmount: _claimAmount,
            claimDetails: _claimDetails,
            submittedAt: block.timestamp,
            processedAt: 0,
            status: ClaimStatus.PENDING,
            rejectionReason: ""
        });

        policyClaims[_policyId].push(claims[claimId]);

        emit ClaimSubmitted(claimId, _policyId, msg.sender, _claimAmount);

        return claimId;
    }

    /**
     * @notice Approve and pay a claim (Oracle/Admin only)
     * @param _claimId ID of the claim
     */
    function approveClaim(
        uint256 _claimId
    ) external onlyRole(ORACLE_ROLE) whenNotPaused nonReentrant {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");

        Policy storage policy = policies[claim.policyId];
        require(policy.status == PolicyStatus.ACTIVE, "Policy not active");
        require(block.timestamp <= policy.endDate, "Policy expired");

        // Check contract has enough USDC
        require(
            usdcToken.balanceOf(address(this)) >= claim.claimAmount,
            "Insufficient contract balance"
        );

        claim.status = ClaimStatus.APPROVED;
        claim.processedAt = block.timestamp;

        // Transfer USDC to claimant
        require(
            usdcToken.transfer(claim.claimant, claim.claimAmount),
            "USDC transfer failed"
        );

        claim.status = ClaimStatus.PAID;
        totalClaimsPaid += claim.claimAmount;

        emit ClaimProcessed(_claimId, ClaimStatus.PAID, claim.claimAmount);
    }

    /**
     * @notice Reject a claim (Oracle/Admin only)
     * @param _claimId ID of the claim
     * @param _reason Reason for rejection
     */
    function rejectClaim(
        uint256 _claimId,
        string memory _reason
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        require(bytes(_reason).length > 0, "Rejection reason required");

        claim.status = ClaimStatus.REJECTED;
        claim.processedAt = block.timestamp;
        claim.rejectionReason = _reason;

        emit ClaimProcessed(_claimId, ClaimStatus.REJECTED, 0);
    }

    /**
     * @notice Update policy status
     * @param _policyId ID of the policy
     * @param _newStatus New status
     */
    function updatePolicyStatus(
        uint256 _policyId,
        PolicyStatus _newStatus
    ) external onlyRole(OPERATOR_ROLE) policyExists(_policyId) {
        Policy storage policy = policies[_policyId];
        PolicyStatus oldStatus = policy.status;
        policy.status = _newStatus;

        emit PolicyStatusChanged(_policyId, oldStatus, _newStatus);
    }

    /**
     * @notice Update coverage multiplier
     * @param _coverageType Coverage type
     * @param _newMultiplier New multiplier in basis points
     */
    function updateCoverageMultiplier(
        CoverageType _coverageType,
        uint256 _newMultiplier
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _newMultiplier > 0 && _newMultiplier <= 500000,
            "Invalid multiplier"
        );

        uint256 oldMultiplier = coverageMultipliers[_coverageType];
        coverageMultipliers[_coverageType] = _newMultiplier;

        emit CoverageMultiplierUpdated(
            _coverageType,
            oldMultiplier,
            _newMultiplier
        );
    }

    /**
     * @notice Get user's policies
     * @param _user User address
     */
    function getUserPolicies(
        address _user
    ) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    /**
     * @notice Get policy claims
     * @param _policyId Policy ID
     */
    function getPolicyClaims(
        uint256 _policyId
    ) external view returns (Claim[] memory) {
        return policyClaims[_policyId];
    }

    /**
     * @notice Get policy details
     * @param _policyId Policy ID
     */
    function getPolicy(
        uint256 _policyId
    ) external view returns (Policy memory) {
        return policies[_policyId];
    }

    /**
     * @notice Get claim details
     * @param _claimId Claim ID
     */
    function getClaim(uint256 _claimId) external view returns (Claim memory) {
        return claims[_claimId];
    }

    /**
     * @notice Check if policy is active
     * @param _policyId Policy ID
     */
    function isPolicyActive(uint256 _policyId) external view returns (bool) {
        if (_policyId == 0 || _policyId > policyCounter) return false;
        Policy memory policy = policies[_policyId];
        return
            policy.status == PolicyStatus.ACTIVE &&
            block.timestamp <= policy.endDate;
    }

    /**
     * @notice Withdraw USDC (Admin only, for emergency)
     * @param _amount Amount to withdraw
     * @param _to Recipient address
     */
    function withdrawUSDC(
        uint256 _amount,
        address _to
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");
        require(
            usdcToken.balanceOf(address(this)) >= _amount,
            "Insufficient balance"
        );

        require(usdcToken.transfer(_to, _amount), "USDC transfer failed");
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

    /**
     * @notice Get contract statistics
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalPolicies,
            uint256 totalClaims,
            uint256 premiumsCollected,
            uint256 claimsPaid,
            uint256 contractBalance
        )
    {
        return (
            policyCounter,
            claimCounter,
            totalPremiumsCollected,
            totalClaimsPaid,
            usdcToken.balanceOf(address(this))
        );
    }
}
