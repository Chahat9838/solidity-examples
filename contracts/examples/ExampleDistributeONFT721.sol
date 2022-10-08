// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/onft/extension/DistributeONFT721.sol";

contract ExampleDistributeONFT721 is DistributeONFT721 {
    constructor(
        address _layerZeroEndpoint,
        uint[] memory _indexArray,
        uint _value
    ) DistributeONFT721("ExampleDistribute", "ONFT", _layerZeroEndpoint, _indexArray, _value) {}

    function mint() public {
        require(countAllSetBits() >= 1, "Not enough tokens to Mint");
        uint tokenId = getNextMintTokenId();
        _safeMint(msg.sender, tokenId);
    }
}
