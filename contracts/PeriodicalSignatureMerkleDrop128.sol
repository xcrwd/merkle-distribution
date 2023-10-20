// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;
pragma abicoder v1;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@1inch/solidity-utils/contracts/libraries/SafeERC20.sol";
import "@1inch/solidity-utils/contracts/libraries/ECDSA.sol";

import "./interfaces/IPeriodicalSignatureMerkleDrop128.sol";

contract PeriodicalSignatureMerkleDrop128 is IPeriodicalSignatureMerkleDrop128, Ownable {
    using Address for address payable;
    using SafeERC20 for IERC20;

    address public immutable override token;
    // Claim period in seconds
    uint256 public override claimPeriod;
    bytes16 public override merkleRoot;

    mapping(address => uint256) public lastClaim;

    uint256 private constant _CLAIM_GAS_COST = 60000;

    receive() external payable {}  // solhint-disable-line no-empty-blocks

    constructor(uint256 claimPeriod_, address token_) {
        claimPeriod = claimPeriod_;
        token = token_;
    }

    function setMerkleRoot(bytes16 merkleRoot_) external override onlyOwner {
        emit MerkelRootUpdated(merkleRoot, merkleRoot_);
        merkleRoot = merkleRoot_;
    }

    function setClaimPeriod(uint256 claimPeriod_) external override onlyOwner {
        emit ClaimPeriodUpdated(claimPeriod, claimPeriod_);
        claimPeriod = claimPeriod_;
    }

    function claim(address receiver, uint256 amount, bytes calldata merkleProof, bytes calldata signature) external override {
        bytes32 signedHash = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(receiver)));
        address account = ECDSA.recover(signedHash, signature);
        require(lastClaim[account] == 0 || block.timestamp - lastClaim[account] >= claimPeriod, "Claim period has not passed yet");

        // Verify the merkle proof.
        bytes16 node = bytes16(keccak256(abi.encodePacked(account, amount)));
        require(_verifyAsm(merkleProof, merkleRoot, node), "CMD: Invalid proof");
        // (bool valid) = _verifyAsm(merkleProof, merkleRoot, node);
        // require(valid, "MD: Invalid proof");
        if (token == address(0)) {
            payable(receiver).sendValue(amount);
        } else {
            IERC20(token).safeTransfer(receiver, amount);
        }
        emit Claimed(receiver, amount);
        
        lastClaim[account] = block.timestamp;
        // _cashback();
    }

    function verify(bytes calldata proof, bytes16 root, bytes16 leaf) external pure returns (bool valid) {
        return _verifyAsm(proof, root, leaf);
    }

    function verify(bytes calldata proof, bytes16 leaf) external view returns (bool valid) {
        return _verifyAsm(proof, merkleRoot, leaf);
    }

    function _cashback() private {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            // solhint-disable-next-line avoid-tx-origin
            payable(tx.origin).sendValue(Math.min(block.basefee * _CLAIM_GAS_COST, balance));
        }
    }

    function _verifyAsm(bytes calldata proof, bytes16 root, bytes16 leaf) private pure returns (bool valid) {
        /// @solidity memory-safe-assembly
        assembly {  // solhint-disable-line no-inline-assembly
            let ptr := proof.offset

            for { let end := add(ptr, proof.length) } lt(ptr, end) { ptr := add(ptr, 0x10) } {
                let node := calldataload(ptr)

                switch lt(leaf, node)
                case 1 {
                    mstore(0x00, leaf)
                    mstore(0x10, node)
                }
                default {
                    mstore(0x00, node)
                    mstore(0x10, leaf)
                }

                leaf := keccak256(0x00, 0x20)
            }

            valid := iszero(shr(128, xor(root, leaf)))
        }
    }

    function rescueFunds(address token_, uint256 amount) external onlyOwner {
        if (token_ == address(0)) {
            payable(msg.sender).sendValue(amount);
        } else {
            IERC20(token_).safeTransfer(msg.sender, amount);
        }
    }
}
