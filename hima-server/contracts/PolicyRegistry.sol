// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PolicyRegistry
 * @dev Manages insurance policy records on Mantle Network
 * @notice Stores policy data with rider privacy (hashed identifiers only)
 */
contract PolicyRegistry is AccessControl, Pausable {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Enums
    enum CoverageType {
        TRIP, // Single trip coverage
        DAILY, // 24-hour coverage
        WEEKLY, // 7-day coverage
        MONTHLY // 30-day coverage
    }

    enum Tier {
        BASIC, // Basic coverage tier
        STANDARD, // Standard coverage tier
        PLUS // Plus coverage tier
    }

    enum PolicyStatus {
        ACTIVE,
        EXPIRED,
        CLAIMED,
        CANCELLED
    }

    // Policy structure
    struct Policy {
        string policyId; // Human-readable ID (e.g., "HIMA-TRIP-20241229-001")
        bytes32 riderHash; // keccak256(phoneNumber) - no PII on-chain
        CoverageType coverageType; // Trip, Daily, or Weekly
        Tier tier; // Basic, Standard, or Plus
        uint256 startTime; // Policy start timestamp
        uint256 endTime; // Policy end timestamp
        uint256 sumAssuredKES; // Coverage amount in KES (stored as integer, e.g., 50000 = 50,000 KES)
        uint256 premiumKES; // Premium amount in KES
        PolicyStatus status; // Current policy status
        uint256 createdAt; // Creation timestamp
    }

    // State variables
    uint256 public policyCounter;
    mapping(uint256 => Policy) public policies;
    mapping(string => uint256) public policyIdToIndex;
    mapping(bytes32 => uint256[]) public riderPolicies;

    // Events
    event PolicyCreated(
        uint256 indexed policyIndex,
        string policyId,
        bytes32 indexed riderHash,
        CoverageType coverageType,
        Tier tier,
        uint256 sumAssuredKES
    );

    event PolicyStatusUpdated(
        uint256 indexed policyIndex,
        string policyId,
        PolicyStatus oldStatus,
        PolicyStatus newStatus
    );

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    /**
     * @notice Create a new insurance policy
     * @param _policyId Human-readable policy ID
     * @param _riderHash Hashed rider identifier (keccak256 of phone number)
     * @param _coverageType Type of coverage (trip/daily/weekly)
     * @param _tier Coverage tier (basic/standard/plus)
     * @param _startTime Policy start timestamp
     * @param _endTime Policy end timestamp
     * @param _sumAssuredKES Sum assured in KES
     * @param _premiumKES Premium amount in KES
     */
    function createPolicy(
        string memory _policyId,
        bytes32 _riderHash,
        CoverageType _coverageType,
        Tier _tier,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _sumAssuredKES,
        uint256 _premiumKES
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused returns (uint256) {
        require(bytes(_policyId).length > 0, "Policy ID required");
        require(_riderHash != bytes32(0), "Rider hash required");
        require(_endTime > _startTime, "Invalid time range");
        require(_sumAssuredKES > 0, "Sum assured must be > 0");
        require(_premiumKES > 0, "Premium must be > 0");
        require(policyIdToIndex[_policyId] == 0, "Policy ID already exists");

        policyCounter++;
        uint256 policyIndex = policyCounter;

        policies[policyIndex] = Policy({
            policyId: _policyId,
            riderHash: _riderHash,
            coverageType: _coverageType,
            tier: _tier,
            startTime: _startTime,
            endTime: _endTime,
            sumAssuredKES: _sumAssuredKES,
            premiumKES: _premiumKES,
            status: PolicyStatus.ACTIVE,
            createdAt: block.timestamp
        });

        policyIdToIndex[_policyId] = policyIndex;
        riderPolicies[_riderHash].push(policyIndex);

        emit PolicyCreated(
            policyIndex,
            _policyId,
            _riderHash,
            _coverageType,
            _tier,
            _sumAssuredKES
        );

        return policyIndex;
    }

    /**
     * @notice Update policy status
     * @param _policyIndex Policy index
     * @param _newStatus New status
     */
    function setPolicyStatus(
        uint256 _policyIndex,
        PolicyStatus _newStatus
    ) external onlyRole(OPERATOR_ROLE) {
        require(
            _policyIndex > 0 && _policyIndex <= policyCounter,
            "Invalid policy"
        );

        Policy storage policy = policies[_policyIndex];
        PolicyStatus oldStatus = policy.status;
        policy.status = _newStatus;

        emit PolicyStatusUpdated(
            _policyIndex,
            policy.policyId,
            oldStatus,
            _newStatus
        );
    }

    /**
     * @notice Get policy by index
     * @param _policyIndex Policy index
     */
    function getPolicy(
        uint256 _policyIndex
    ) external view returns (Policy memory) {
        require(
            _policyIndex > 0 && _policyIndex <= policyCounter,
            "Invalid policy"
        );
        return policies[_policyIndex];
    }

    /**
     * @notice Get policy by ID
     * @param _policyId Policy ID
     */
    function getPolicyById(
        string memory _policyId
    ) external view returns (Policy memory) {
        uint256 policyIndex = policyIdToIndex[_policyId];
        require(policyIndex > 0, "Policy not found");
        return policies[policyIndex];
    }

    /**
     * @notice Get all policies for a rider
     * @param _riderHash Hashed rider identifier
     */
    function getPoliciesByRider(
        bytes32 _riderHash
    ) external view returns (uint256[] memory) {
        return riderPolicies[_riderHash];
    }

    /**
     * @notice Check if policy is currently active
     * @param _policyIndex Policy index
     */
    function isPolicyActive(uint256 _policyIndex) external view returns (bool) {
        if (_policyIndex == 0 || _policyIndex > policyCounter) return false;

        Policy memory policy = policies[_policyIndex];
        return
            policy.status == PolicyStatus.ACTIVE &&
            block.timestamp >= policy.startTime &&
            block.timestamp <= policy.endTime;
    }

    /**
     * @notice Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Get contract statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 totalPolicies,
            uint256 activePolicies,
            uint256 expiredPolicies,
            uint256 claimedPolicies
        )
    {
        uint256 active = 0;
        uint256 expired = 0;
        uint256 claimed = 0;

        for (uint256 i = 1; i <= policyCounter; i++) {
            PolicyStatus status = policies[i].status;
            if (status == PolicyStatus.ACTIVE) active++;
            else if (status == PolicyStatus.EXPIRED) expired++;
            else if (status == PolicyStatus.CLAIMED) claimed++;
        }

        return (policyCounter, active, expired, claimed);
    }
}
