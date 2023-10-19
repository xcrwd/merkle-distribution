const { BN } = require('@openzeppelin/test-helpers');
const { MerkleTree } = require('merkletreejs');
const { personalSign } = require('@metamask/eth-sig-util');
const keccak256 = require('keccak256');
const { toBN } = require('./helpers/utils');
const { promisify } = require("util");
const randomBytesAsync = promisify(require("crypto").randomBytes);
const Wallet = require("ethereumjs-wallet").default;

// const { gasspectEVM } = require('./helpers/profileEVM');

const {
    shouldBehaveLikeMerkleDropFor4WalletsWithBalances1234,
} = require('./behaviors/MerkleDrop.behavior');

const {
    shouldBehaveLikeCumulativeMerkleDropFor4WalletsWithBalances1234,
} = require('./behaviors/CumulativeMerkleDrop.behavior');

const PeriodicalSignatureMerkleDrop128 = artifacts.require('PeriodicalSignatureMerkleDrop128');
const CLAIM_PERIOD = BigInt(60 * 60 * 24 * 30);

function keccak128(input) {
    return keccak256(input).slice(0, 16);
}

async function makeDrop (_token, drop, wallets, amounts, deposit) {
    const elements = wallets.map((w, i) => '0x' + w.substr(2) + toBN(amounts[i]).toString(16, 64));
    const hashedElements = elements.map(keccak128).map(x => MerkleTree.bufferToHex(x));
    const tree = new MerkleTree(elements, keccak128, { hashLeaves: true, sort: true });
    const root = tree.getHexRoot();
    const leaves = tree.getHexLeaves();

    const proofs = leaves
        .map(tree.getHexProof, tree)
        .map(proof => '0x' + proof.map(p => p.substr(2)).join(''));
    
    await drop.setMerkleRoot(root);

    await network.provider.send("hardhat_setBalance", [
        drop.address,
        `0x${toBN(deposit).toString(16)}`,
    ]);

    return { hashedElements, leaves, root, proofs };
}

async function genPriv() {
    return (await randomBytesAsync(16)).toString("hex").padStart(64, "0");
}

async function genPrivs(n) {
    return Promise.all(Array.from({ length: n }, genPriv));
}

contract('PeriodicalSignatureMerkleDrop128', async function ([_, w1, w2, w3, w4]) {
    const wallets = [w1, w2, w3, w4];

    function findSortedIndex (self, i) {
        return self.leaves.indexOf(self.hashedElements[i]);
    }

    beforeEach(async function () {
        this.drop = await PeriodicalSignatureMerkleDrop128.new(CLAIM_PERIOD, "0x0000000000000000000000000000000000000000");
    });

    it('Benchmark 30000 wallets (merkle tree height 15)', async function () {
        const benchmarkWallets = (await genPrivs(30000))
            .map(p => Wallet.fromPrivateKey(Buffer.from(p, "hex"))
        );
        const receivers = Array(30000).fill().map((_, i) => '0x' + (new BN(w1.substr(2), 16)).addn(i).toString('hex'));
        const amount = 1_000_000_000_000_000_000n;
        const amounts = Array(30000).fill().map((_) => amount);

        const { hashedElements, leaves, root, proofs } = await makeDrop(this.token, this.drop, benchmarkWallets.map(w => w.getAddressString()), amounts, 30000n * amount);
        this.hashedElements = hashedElements;
        this.leaves = leaves;
        this.root = root;
        this.proofs = proofs;

        if (this.drop.contract.methods.verify) {
            await this.drop.contract.methods.verify(this.proofs[findSortedIndex(this, 0)], this.root, this.leaves[findSortedIndex(this, 0)]).send({ from: _ });
            expect(await this.drop.verify(this.proofs[findSortedIndex(this, 0)], this.root, this.leaves[findSortedIndex(this, 0)])).to.be.true;
        }
        const signature = personalSign({ privateKey: benchmarkWallets[0].getPrivateKey(), data: keccak256(receivers[0]) });
        await this.drop.claim(receivers[0], amount, this.proofs[findSortedIndex(this, 0)], signature);
    });

    describe('Single drop for 4 wallets: [1, 2, 3, 4]', async function () {
        beforeEach(async function () {
            const { hashedElements, leaves, root, proofs } = await makeDrop(this.token, this.drop, [w1, w2, w3, w4], [1, 2, 3, 4], 10);
            this.hashedElements = hashedElements;
            this.leaves = leaves;
            this.root = root;
            this.proofs = proofs;
        });

        shouldBehaveLikeMerkleDropFor4WalletsWithBalances1234('CMD', [w1, w2, w3, w4], findSortedIndex);
    });

    describe('Double drop for 4 wallets: [1, 2, 3, 4] + [2, 3, 4, 5] = [3, 5, 7, 9]', async function () {
        async function makeFirstDrop (self) {
            const { hashedElements, leaves, root, proofs } = await makeDrop(self.token, self.drop, [w1, w2, w3, w4], [1, 2, 3, 4], 1 + 2 + 3 + 4);
            self.hashedElements = hashedElements;
            self.leaves = leaves;
            self.root = root;
            self.proofs = proofs;
        }

        async function makeSecondDrop (self) {
            const { hashedElements, leaves, root, proofs } = await makeDrop(self.token, self.drop, [w1, w2, w3, w4], [3, 5, 7, 9], 2 + 3 + 4 + 5);
            self.hashedElements = hashedElements;
            self.leaves = leaves;
            self.root = root;
            self.proofs = proofs;
        }

        shouldBehaveLikeCumulativeMerkleDropFor4WalletsWithBalances1234('CMD', _, [w1, w2, w3, w4], findSortedIndex, makeFirstDrop, makeSecondDrop);
    });
});
