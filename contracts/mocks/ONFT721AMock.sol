// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../token/onft/onft721a/ONFT721A.sol";

// DISCLAIMER: This contract can only be deployed on one chain when deployed and calling
// setTrustedRemotes with remote contracts. This is due to the sequential way 721A mints tokenIds.
// This contract must be the first minter of each token id
contract ONFT721AMock is ONFT721A {
    constructor(string memory _name, string memory _symbol, address _layerZeroEndpoint) ONFT721A(_name, _symbol, _layerZeroEndpoint) {}

    function mint(uint _amount) external payable {
        _safeMint(msg.sender, _amount, "");
    }
}
