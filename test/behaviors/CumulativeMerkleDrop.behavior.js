const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { makeSignature } = require('../helpers/utils');

function claimedEvent (account, amount) {
    return { account, amount };
}

function shouldBehaveLikeCumulativeMerkleDropFor4WalletsWithBalances1234 (errorPrefix, wallets, findSortedIndex, makeFirstDrop, makeSecondDrop, is128version = true) {
    describe('First wallet checks', async function () {
        beforeEach(async function () {
            await makeFirstDrop(this);
        });

        it('should success to claim 1 token, second drop, move time and claim 2 tokens', async function () {
            await expectEvent(
                (
                    await this.drop.claim(this.receivers[0], 1, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                ),
                'Claimed', claimedEvent(wallets[0], '1'),
            );

            await makeSecondDrop(this);
            await network.provider.send("evm_mine", [60 * 60 * 24 * 30]); // CLAIM_PERIOD

            await expectEvent(
                (
                    await this.drop.claim(this.receivers[0], 2, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                ),
                'Claimed', claimedEvent(wallets[0], '2'),
            );

            await expectRevert(
                (
                    await this.drop.claim(this.receivers[0], 2, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                ),
                `${errorPrefix}: Nothing to claim`,
            );
        });

        it('should success to claim all 2 tokens after second drop', async function () {
            await makeSecondDrop(this);

            await expectEvent(
                (
                    await this.drop.claim(this.receivers[0], 2, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                ),
                'Claimed', claimedEvent(wallets[0], '2'),
            );
        });

        it('should fail to claim after succelfful claim of all 3 tokens after second drop', async function () {
            await makeSecondDrop(this);

            await expectEvent(
                (
                    await this.drop.claim(this.receivers[0], 2, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                ),
                'Claimed', claimedEvent(wallets[0], '2'),
            );

            await expectRevert(
                (
                    await this.drop.claim(this.receivers[0], 2, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                ),
                `${errorPrefix}: Nothing to claim`,
            );
        });
    });
}

module.exports = {
    shouldBehaveLikeCumulativeMerkleDropFor4WalletsWithBalances1234,
};
