const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { promisify } = require("util");
const randomBytesAsync = promisify(require("crypto").randomBytes);
const { ether } = require("@openzeppelin/test-helpers");
const { toBN } = require("../test/helpers/utils");
const fs = require('fs');
const difference = require("lodash.difference");
const Wallet = require("ethereumjs-wallet").default;

const COUNT = 10;
const AMOUNT = ether("1"); // 10^18 wei

async function genPriv() {
    return (await randomBytesAsync(16)).toString("hex").padStart(64, "0");
}

async function genPrivs(n) {
    return Promise.all(Array.from({ length: n }, genPriv));
}

function keccak128(input) {
    return keccak256(input).slice(0, 16);
}

function makeDrop(wallets, amounts) {
    const elements = wallets.map(
        (w, i) => w + toBN(amounts[i]).toString(16, 64)
    );
    const leaves = elements.map(keccak128).map(x => MerkleTree.bufferToHex(x));
    const tree = new MerkleTree(leaves, keccak128, { sortPairs: true });
    const root = tree.getHexRoot();
    const proofs = leaves.map(tree.getProof, tree);
    return { elements, leaves, root, proofs };
}

const oldAccounts = JSON.parse(fs.readFileSync('accounts.json', { encoding: 'utf8' }));
if (typeof oldAccounts !== 'object') throw new Error('Invalid JSON');

async function main() {
    const badAccounts = process.argv[2] !== undefined ? process.argv[2].split(',') : [];
    const oldGoodAccounts = difference(oldAccounts, badAccounts);
    const privs = await genPrivs(COUNT - oldGoodAccounts.length);
    const accounts = [...oldGoodAccounts, ...privs.map(p =>
        Wallet.fromPrivateKey(Buffer.from(p, "hex")).getAddressString()
    )];
    fs.writeFileSync('accounts.json', JSON.stringify(accounts));
    const amounts = Array(COUNT).fill(AMOUNT);
    const drop = makeDrop(accounts, amounts);

    console.log(
        JSON.stringify({
            merkleRoot: drop.root,
            tokenTotal: '0x' + amounts.reduce((a, b) => a.add(b), toBN('0')).toString(16),
            claims: accounts.map((w, i) => ({
                wallet: w,
                amount: '0x' + amounts[i].toString(16),
                proof: drop.proofs[i]
            })).reduce((a, { wallet, amount, proof }) => {
                a[wallet] = { amount, proof };
                return a;
            }, {}),
        }, null, 2),
    );
}

main();
