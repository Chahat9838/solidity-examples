// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../ONFT721.sol";
import "../../../util/BitMath.sol";

/// @title Interface of the DistributeONFT721 standard
contract DistributeONFT721 is ONFT721 {

    uint16 public constant FUNCTION_TYPE_DISTRIBUTE = 2;
    uint16 public constant NUM_TOKENS_PER = 250;

    event Distribute(uint16 indexed _srcChainId, TokenDistribute[] tokenDistribute);
    event ReceiveDistribute(uint16 indexed _srcChainId, bytes indexed _srcAddress, TokenDistribute[] tokenDistribute);

    struct TokenDistribute {
        uint index;
        uint value;
    }

    uint[] public tokenIds = new uint[](40);

    /// @notice Constructor for the DistributeONFT721
    /// @param _name the name of the token
    /// @param _symbol the token symbol
    /// @param _layerZeroEndpoint handles message transmission across chains
    /// @param _indexArray to set to all ones representing token ids available to mint
    constructor(string memory _name, string memory _symbol, address _layerZeroEndpoint, uint[] memory _indexArray, uint _value) ONFT721(_name, _symbol, _layerZeroEndpoint){
        uint _indexArrayLength = _indexArray.length;
        for(uint i; i < _indexArrayLength;) {
            tokenIds[_indexArray[i]] = _value;
            unchecked{++i;}
        }
    }

    //---------------------------Public Functions----------------------------------------

    // override estimateSendFee in ONFT721Core to pass in FUNCTION_TYPE into payload
    function estimateSendFee(uint16 _dstChainId, bytes memory _toAddress, uint _tokenId, bool _useZro, bytes memory _adapterParams) public view virtual override(IONFT721Core,ONFT721Core) returns (uint nativeFee, uint zroFee) {
        bytes memory payload = abi.encode(FUNCTION_TYPE_SEND, _toAddress, _tokenId);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function countAllSetBits() public view returns (uint count) {
        uint tokenIdsLength = tokenIds.length;
        for(uint i = 0; i < tokenIdsLength; i++) {
            count += BitLib.countSetBits(tokenIds[i]);
        }
        return count;
    }

    //---------------------------External Functions----------------------------------------

    function distributeTokens(uint16 _dstChainId, TokenDistribute[] memory _tokenDistribute, address payable _refundAddress, address _zroPaymentAddress) external payable onlyOwner {
        require(_verifyAmounts(_tokenDistribute), "Invalid input");
        _flipBits(_tokenDistribute);
        bytes memory payload = abi.encode(FUNCTION_TYPE_DISTRIBUTE, _tokenDistribute);
        bytes memory _adapterParams = _getMultiAdaptParams(_tokenDistribute.length);
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
        emit Distribute(_dstChainId, _tokenDistribute);
    }

    function getDistributeTokens(uint _amount) external view returns (TokenDistribute[] memory) {
        uint tokenDistributeSize = _countTokenDistributeSize(_amount);
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

    function estimateDistributeFee(uint16 _dstChainId, TokenDistribute[] memory _tokenDistribute, bool _useZro) external view returns (uint nativeFee, uint zroFee) {
        return _estimatePayloadFee(_dstChainId, abi.encode(FUNCTION_TYPE_DISTRIBUTE, _tokenDistribute), _tokenDistribute.length, _useZro);
    }

    //---------------------------Internal Functions----------------------------------------

    // override _send in ONFT721Core to pass in FUNCTION_TYPE into payload
    function _send(address _from, uint16 _dstChainId, bytes memory _toAddress, uint _tokenId, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) internal virtual override(ONFT721Core) {
        _debitFrom(_from, _dstChainId, _toAddress, _tokenId);

        bytes memory payload = abi.encode(FUNCTION_TYPE_SEND, _toAddress, _tokenId);

        if (useCustomAdapterParams) {
            _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, NO_EXTRA_GAS);
        } else {
            require(_adapterParams.length == 0, "LzApp: _adapterParams must be empty.");
        }
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);

        emit SendToChain(_dstChainId, _from, _toAddress, _tokenId);
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64, /*_nonce*/
        bytes memory _payload
    ) internal virtual override {
        uint8 functionType;
        assembly {
            functionType := mload(add(_payload, 32))
        }

        if(functionType == FUNCTION_TYPE_SEND) {
            (, bytes memory toAddressBytes, uint tokenId) = abi.decode(_payload, (uint16, bytes, uint));
            address toAddress;
            assembly {
                toAddress := mload(add(toAddressBytes, 20))
            }
            _creditTo(_srcChainId, toAddress, tokenId);
            emit ReceiveFromChain(_srcChainId, _srcAddress, toAddress, tokenId);
        } else if(functionType == FUNCTION_TYPE_DISTRIBUTE) {
            (, TokenDistribute[] memory tokenDistribute) = abi.decode(_payload, (uint16, TokenDistribute[]));
            for(uint i = 0; i < tokenDistribute.length; i++) {
                uint temp = tokenIds[tokenDistribute[i].index];
                tokenIds[tokenDistribute[i].index] = temp | tokenDistribute[i].value;
            }
            emit ReceiveDistribute(_srcChainId, _srcAddress, tokenDistribute);
        }
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

    function _estimatePayloadFee(uint16 _dstChainId, bytes memory _payload, uint _amount, bool _useZro) internal view returns (uint nativeFee, uint zroFee) {
        require(_amount > 0, "Amount must be greater than 0");
        uint16 version = 1;
        uint destinationGas = 200000 + ((_amount - 1) * 50000);
        bytes memory _adapterParams = abi.encodePacked(version, destinationGas);
        return lzEndpoint.estimateFees(_dstChainId, address(this), _payload, _useZro, _adapterParams);
    }

    function _countTokenDistributeSize(uint _amount) internal view returns (uint) {
        uint count;
        uint tokenIdsLength = tokenIds.length;
        for(uint i = 0; i < tokenIdsLength; i++) {
            uint currentTokenId = tokenIds[i];
            count += BitLib.countSetBits(currentTokenId);
            if(count >= _amount) return i + 1;
        }
        return 0;
    }

    function _getMultiAdaptParams(uint _amount) internal pure returns (bytes memory) {
        require(_amount > 0, "Amount must be greater than 0");
        uint16 version = 1;
        uint destinationGas = 200000 + ((_amount - 1) * 50000);
        return abi.encodePacked(version, destinationGas);
    }

    function _getNextMintTokenId() internal returns (uint tokenId) {
        uint tokenIdsLength = tokenIds.length;
        for(uint i = 0; i < tokenIdsLength; i++) {
            uint currentTokenId = tokenIds[i];
            if(currentTokenId == 0) continue;
            uint position = BitLib.mostSignificantBitPosition(currentTokenId);
            uint temp = 1 << position;
            tokenIds[i] = tokenIds[i] ^ temp;
            tokenId = (255 - position) + (i * NUM_TOKENS_PER) + 1;
            break;
        }
        return tokenId;
    }
}
