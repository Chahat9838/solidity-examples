// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/onft/extension/DistributeONFT721.sol";

contract DistributeONFT721Mock is DistributeONFT721 {
    constructor(
        address _layerZeroEndpoint,
        uint[] memory _indexArray,
        uint[] memory _valueArray
    ) DistributeONFT721("ExampleDistribute", "ONFT", _layerZeroEndpoint, _indexArray, _valueArray) {}

    function mint() public {
        require(countAllSetBits() >= 1, "Not enough tokens to Mint");
        uint tokenId = _getNextMintTokenId();
        _safeMint(msg.sender, tokenId);
    }
}
