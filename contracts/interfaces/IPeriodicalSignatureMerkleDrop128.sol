// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v1;

// Allows anyone to claim a token if they exist in a merkle root.
interface IPeriodicalSignatureMerkleDrop128 {
    // Returns the address of the token distributed by this contract.
    function token() external view returns (address);
    // Sets the merkle root of the merkle tree containing cumulative account balances available to claim and it's deph.
    function setMerkleRoot(bytes16 merkleRoot_, uint256 deph_) external;
    // Sets the claim period.
    function setClaimPeriod(uint256 claimPeriod_) external;
    // Returns the merkle root of the merkle tree containing account balances available to claim.
    function merkleRoot() external view returns (bytes16);
    // Returns the tree depth of the merkle tree containing account balances available to claim.
    function depth() external view returns (uint256);
    // Claim the given amount of the token to the given address. Reverts if the inputs are invalid.
    function claim(address receiver, uint256 amount, bytes calldata merkleProof, bytes calldata signature) external;
    // Verifies that given leaf and merkle proof matches given merkle root and returns leaf index.
    function verify(bytes calldata proof, bytes16 root, bytes16 leaf) external view returns (bool valid, uint256 index);
}
