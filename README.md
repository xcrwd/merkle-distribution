<div align="center">
    <img src="https://github.com/1inch/farming/blob/master/.github/1inch_github_w.svg#gh-light-mode-only">
    <img src="https://github.com/1inch/farming/blob/master/.github/1inch_github_b.svg#gh-dark-mode-only">
</div>

# Merkle Distribution
[![Build Status](https://github.com/1inch/merkle-distribution/actions/workflows/test.yml/badge.svg)](https://github.com/1inch/merkle-distribution/actions)
[![Coverage Status](https://codecov.io/gh/1inch/merkle-distribution/branch/master/graph/badge.svg?token=4AY5FRY8HN)](https://codecov.io/gh/1inch/merkle-distribution)

Set of smart contracts for gas efficient merkle tree drops. 

## Sequential cumulative Merkle Tree drops

Each next Merkle Tree root replaces previous one and should contain cumulative balances of all the participants. Cumulative claimed amount is used as invalidation for every participant.

## Signature-based drop

Each entry of the drop contains private key which is used to sign the address of the receiver. This is done to safely distribute the drop and prevent MEV stealing.

## Signature-periodic drop

The same as signature-based drop but:
1. Merkle tree can be replaced as it's done in Sequential cumulative Merkle Tree drop
2. Drops native token
3. Allow claim once in configurable period.
