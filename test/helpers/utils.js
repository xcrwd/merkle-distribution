const { BN } = require('@openzeppelin/test-helpers');
const { personalSign } = require('@metamask/eth-sig-util');
const keccak256 = require('keccak256');
const ethWallet = require('ethereumjs-wallet').default;

function toBN (x) {
    return new BN(x);
}

function generateSalt () {
    return ethWallet.generate().getPrivateKeyString().substr(0, 34);
}

function makeSignature(wallet, receiver) {
    return personalSign({ privateKey: wallet.getPrivateKey(), data: keccak256(receiver) });
}

module.exports = {
    toBN,
    generateSalt,
    makeSignature
};
