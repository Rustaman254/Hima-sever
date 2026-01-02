// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ClaimRegistry
 * @dev Manages insurance claim records on Mantle Network
 * @notice Provides transparent on-chain claim tracking and status updates
 */
contract ClaimRegistry is AccessControl, Pausable {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Enums
    enum ClaimStatus {
        PENDING,
        APPROVED,
        REJECTED,
        PAID
    }

    // Claim structure
    struct Claim {
        uint256 claimId; // Unique claim ID
        uint256 policyId; // Associated policy ID
        bytes32 riderHash; // Hashed rider identifier
        uint256 claimAmountKES; // Claim amount in KES
        bytes32 claimDataHash; // Hash of claim data (IPFS/storage reference)
        ClaimStatus status; // Current claim status
        uint256 submittedAt; // Submission timestamp
        uint256 processedAt; // Processing timestamp
        string rejectionReason; // Reason if rejected
    }

    // State variables
    uint256 public claimCounter;
    mapping(uint256 => Claim) public claims;
    mapping(uint256 => uint256[]) public policyClaims; // policyId => claimIds
    mapping(bytes32 => uint256[]) public riderClaims; // riderHash => claimIds

    // Events
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        bytes32 indexed riderHash,
        uint256 claimAmountKES,
        bytes32 claimDataHash
    );

    event ClaimApproved(
        uint256 indexed claimId,
        uint256 indexed policyId,
        uint256 timestamp
    );

    event ClaimRejected(
        uint256 indexed claimId,
        uint256 indexed policyId,
        string reason,
        uint256 timestamp
    );

    event ClaimPaid(
        uint256 indexed claimId,
        uint256 indexed policyId,
        uint256 amountKES,
        uint256 timestamp
    );

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @notice Submit a new claim
     * @param _policyId Associated policy ID
     * @param _riderHash Hashed rider identifier
     * @param _claimAmountKES Claim amount in KES
     * @param _claimDataHash Hash of claim data (photos, documents, etc.)
     */
    function submitClaim(
        uint256 _policyId,
        bytes32 _riderHash,
        uint256 _claimAmountKES,
        bytes32 _claimDataHash
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused returns (uint256) {
        require(_policyId > 0, "Invalid policy ID");
        require(_riderHash != bytes32(0), "Rider hash required");
        require(_claimAmountKES > 0, "Claim amount must be > 0");
        require(_claimDataHash != bytes32(0), "Claim data hash required");

        claimCounter++;
        uint256 claimId = claimCounter;

        claims[claimId] = Claim({
            claimId: claimId,
            policyId: _policyId,
            riderHash: _riderHash,
            claimAmountKES: _claimAmountKES,
            claimDataHash: _claimDataHash,
            status: ClaimStatus.PENDING,
            submittedAt: block.timestamp,
            processedAt: 0,
            rejectionReason: ""
        });

        policyClaims[_policyId].push(claimId);
        riderClaims[_riderHash].push(claimId);

        emit ClaimSubmitted(
            claimId,
            _policyId,
            _riderHash,
            _claimAmountKES,
            _claimDataHash
        );

        return claimId;
    }

    /**
     * @notice Approve a claim
     * @param _claimId Claim ID to approve
     */
    function approveClaim(
        uint256 _claimId
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(_claimId > 0 && _claimId <= claimCounter, "Invalid claim");

        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");

        claim.status = ClaimStatus.APPROVED;
        claim.processedAt = block.timestamp;

        emit ClaimApproved(_claimId, claim.policyId, block.timestamp);
    }

    /**
     * @notice Reject a claim
     * @param _claimId Claim ID to reject
     * @param _reason Rejection reason
     */
    function rejectClaim(
        uint256 _claimId,
        string memory _reason
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(_claimId > 0 && _claimId <= claimCounter, "Invalid claim");
        require(bytes(_reason).length > 0, "Reason required");

        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");

        claim.status = ClaimStatus.REJECTED;
        claim.processedAt = block.timestamp;
        claim.rejectionReason = _reason;

        emit ClaimRejected(_claimId, claim.policyId, _reason, block.timestamp);
    }

    /**
     * @notice Mark claim as paid (after M-Pesa payout)
     * @param _claimId Claim ID
     */
    function markClaimPaid(
        uint256 _claimId
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(_claimId > 0 && _claimId <= claimCounter, "Invalid claim");

        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.APPROVED, "Claim not approved");

        claim.status = ClaimStatus.PAID;

        emit ClaimPaid(
            _claimId,
            claim.policyId,
            claim.claimAmountKES,
            block.timestamp
        );
    }

    /**
     * @notice Get claim details
     * @param _claimId Claim ID
     */
    function getClaim(uint256 _claimId) external view returns (Claim memory) {
        require(_claimId > 0 && _claimId <= claimCounter, "Invalid claim");
        return claims[_claimId];
    }

    /**
     * @notice Get all claims for a policy
     * @param _policyId Policy ID
     */
    function getClaimsByPolicy(
        uint256 _policyId
    ) external view returns (uint256[] memory) {
        return policyClaims[_policyId];
    }

    /**
     * @notice Get all claims for a rider
     * @param _riderHash Hashed rider identifier
     */
    function getClaimsByRider(
        bytes32 _riderHash
    ) external view returns (uint256[] memory) {
        return riderClaims[_riderHash];
    }

    /**
     * @notice Get claim statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 totalClaims,
            uint256 pendingClaims,
            uint256 approvedClaims,
            uint256 rejectedClaims,
            uint256 paidClaims
        )
    {
        uint256 pending = 0;
        uint256 approved = 0;
        uint256 rejected = 0;
        uint256 paid = 0;

        for (uint256 i = 1; i <= claimCounter; i++) {
            ClaimStatus status = claims[i].status;
            if (status == ClaimStatus.PENDING) pending++;
            else if (status == ClaimStatus.APPROVED) approved++;
            else if (status == ClaimStatus.REJECTED) rejected++;
            else if (status == ClaimStatus.PAID) paid++;
        }

        return (claimCounter, pending, approved, rejected, paid);
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
