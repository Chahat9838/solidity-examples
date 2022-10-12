// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../onft721Distribute/DistributeCore.sol";

/// @title Interface of the DistributeONFT721 standard
contract DistributeONFT721 is DistributeCore {

    /// @notice Constructor for the DistributeONFT721
    /// @param _name the name of the token
    /// @param _symbol the token symbol
    /// @param _layerZeroEndpoint handles message transmission across chains
    /// @param _indexArray to set to all ones representing token ids available to mint
    constructor(string memory _name, string memory _symbol, address _layerZeroEndpoint, uint[] memory _indexArray, uint _value) DistributeCore(_name, _symbol, _layerZeroEndpoint, _indexArray, _value) {}

    function distributeTokens(uint16 _dstChainId, TokenDistribute[] memory _tokenDistribute, address payable _refundAddress, address _zroPaymentAddress) external payable onlyOwner {
        require(_verifyAmounts(_tokenDistribute), "Invalid input");
        _flipBits(_tokenDistribute);
        bytes memory payload = abi.encode(FUNCTION_TYPE_DISTRIBUTE, _tokenDistribute);
        bytes memory _adapterParams = _getMultiAdaptParams(_tokenDistribute.length);
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
        emit Distribute(_dstChainId, _tokenDistribute);
    }

    function _verifyAmounts(TokenDistribute[] memory _tokenDistribute) internal view returns (bool) {
        uint _tokenDistributeLength = _tokenDistribute.length;
        for(uint i = 0; i < _tokenDistributeLength; i++) {
            uint tempTokenIds = tokenIds[_tokenDistribute[i].index];
            uint result = tempTokenIds & _tokenDistribute[i].value;
            if(result != _tokenDistribute[i].value) return false;
        }
        return true;
    }

    function _flipBits(TokenDistribute[] memory _tokenDistribute) internal {
        uint _tokenDistributeLength = _tokenDistribute.length;
        for(uint i = 0; i < _tokenDistributeLength; i++) {
            tokenIds[_tokenDistribute[i].index] = tokenIds[_tokenDistribute[i].index] ^ _tokenDistribute[i].value;
        }
    }

    function getDistributeTokens(uint _amount) external view returns (TokenDistribute[] memory) {
        uint tokenDistributeSize = countTokenDistributeSize(_amount);
        require(tokenDistributeSize != 0, "Not enough tokens to distribute");
        uint amountNeeded = _amount;
        uint tokenIdsLength = tokenIds.length;
        TokenDistribute[] memory tokenDistributeFixed = new TokenDistribute[](tokenDistributeSize);
        for(uint i = 0; i < tokenIdsLength; i++) {
            uint currentTokenId = tokenIds[i];
            if(currentTokenId == 0) continue;
            if(amountNeeded == 0) break;
            uint sendValue;
            uint position;
            while(amountNeeded != 0) {
                position = BitLib.mostSignificantBitPosition(currentTokenId);
                uint temp = 1 << position;
                currentTokenId = currentTokenId ^ temp;
                sendValue = sendValue | temp;
                amountNeeded -= 1;
                if(currentTokenId == 0) break;
            }
            tokenDistributeFixed[i] = TokenDistribute(i, sendValue);
        }
        return tokenDistributeFixed;
    }
}
