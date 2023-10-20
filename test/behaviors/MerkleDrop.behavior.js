const { makeSignature } = require('../helpers/utils');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

function claimedEvent (account, amount) {
    return { account, amount };
}

function shouldBehaveLikeMerkleDropFor4WalletsWithBalances1234 (errorPrefix, wallets, findSortedIndex) {
    describe('Single drop for 4 wallets: [1, 2, 3, 4]', async function () {
        describe('First wallet', async function () {
            it('should succeed to claim 1 token', async function () {
                await expectEvent(
                    await this.drop.claim(this.receivers[0], 1, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0])),
                    'Claimed', claimedEvent(wallets[0], '1'),
                );
            });

            it('should fail to claim second time', async function () {
                await this.drop.claim(this.receivers[0], 1, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]));

                await expectRevert(
                    (
                        this.drop.claim(this.receivers[0], 1, this.proofs[findSortedIndex(this, 0)], makeSignature(wallets[0], this.receivers[0]))
                    ),
                    `${errorPrefix}: Nothing to claim`,
                );
            });
        });

        describe('Second wallet', async function () {
            it('should succeed to claim', async function () {
                await expectEvent(
                    (
                        await this.drop.claim(this.receivers[1], 2, this.proofs[findSortedIndex(this, 1)], makeSignature(wallets[1], this.receivers[1]))
                    ),
                    'Claimed', claimedEvent(wallets[1], '2'),
                );
            });

            it('should fail to claim second time', async function () {
                await this.drop.claim(this.receivers[1], 2, this.proofs[findSortedIndex(this, 1)], makeSignature(wallets[1], this.receivers[1]));

                await expectRevert(
                    (
                        this.drop.claim(this.receivers[1], 2, this.proofs[findSortedIndex(this, 1)], makeSignature(wallets[1], this.receivers[1]))
                    ),
                    `${errorPrefix}: Nothing to claim`,
                );
            });
        });

        describe('Third wallet', async function () {
            it('should succeed to claim', async function () {
                await expectEvent(
                    (
                        await this.drop.claim(this.receivers[2], 3, this.proofs[findSortedIndex(this, 2)], makeSignature(wallets[2], this.receivers[2]))
                    ),
                    'Claimed', claimedEvent(wallets[2], '3'),
                );
            });

            it('should fail to claim second time', async function () {
                await this.drop.claim(this.receivers[2], 3, this.proofs[findSortedIndex(this, 2)], makeSignature(wallets[2], this.receivers[2]));

                await expectRevert(
                    (
                        this.drop.claim(this.receivers[2], 3, this.proofs[findSortedIndex(this, 2)], makeSignature(wallets[2], this.receivers[2]))
                    ),
                    `${errorPrefix}: Nothing to claim`,
                );
            });
        });

        describe('Forth wallet', async function () {
            it('should succeed to claim', async function () {
                await expectEvent(
                    (
                        await this.drop.claim(this.receivers[3], 4, this.proofs[findSortedIndex(this, 3)], makeSignature(wallets[3], this.receivers[3]))
                    ),
                    'Claimed', claimedEvent(wallets[3], '4'),
                );
            });

            it('should fail to claim 1 tokens after 4 tokens', async function () {
                await expectEvent(
                    (
                        await this.drop.claim(this.receivers[3], 4, this.proofs[findSortedIndex(this, 3)], makeSignature(wallets[3], this.receivers[3]))
                    ),
                    'Claimed', claimedEvent(wallets[3], '4'),
                );

                await expectRevert(
                    (
                        this.drop.claim(this.receivers[3], 4, this.proofs[findSortedIndex(this, 3)], makeSignature(wallets[3], this.receivers[3]))
                    ),
                    `${errorPrefix}: Nothing to claim`,
                );
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeMerkleDropFor4WalletsWithBalances1234,
};
