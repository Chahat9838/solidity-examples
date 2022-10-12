// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../../../lzApp/NonblockingLzApp.sol";
import "../../../util/BitMath.sol";

contract DistributeCore is NonblockingLzApp, ERC721 {
    uint public constant NO_EXTRA_GAS = 0;
    uint8 public constant FUNCTION_TYPE_SEND = 1;
    uint8 public constant FUNCTION_TYPE_DISTRIBUTE = 2;
    uint8 public constant NUM_TOKENS_PER = 250;

    uint[] public tokenIds = new uint[](40);

    event SetUseCustomAdapterParams(bool _useCustomAdapterParams);
    event SendToChain(uint16 indexed _dstChainId, address indexed _from, bytes indexed _toAddress, uint[] _tokenIdArray);
    event ReceiveFromChain(uint16 indexed _srcChainId, bytes indexed _srcAddress, address indexed _toAddress, uint[] _tokenIdArray);
    event Distribute(uint16 indexed _srcChainId, TokenDistribute[] tokenDistribute);
    event ReceiveDistribute(uint16 indexed _srcChainId, bytes indexed _srcAddress, TokenDistribute[] tokenDistribute);

    struct TokenDistribute {
        uint index;
        uint value;
    }

    bool public useCustomAdapterParams;

    /// @notice Constructor for the DistributeONFT
    /// @param _name the name of the token
    /// @param _symbol the token symbol
    /// @param _lzEndpoint handles message transmission across chains
    constructor(string memory _name, string memory _symbol, address _lzEndpoint, uint256[] memory _indexArray, uint _value) ERC721(_name, _symbol) NonblockingLzApp(_lzEndpoint) {
        uint _indexArrayLength = _indexArray.length;
        for(uint i; i < _indexArrayLength;) {
            tokenIds[_indexArray[i]] = _value;
            unchecked{++i;}
        }
    }

    function estimateSendFee(uint16 _dstChainId, bytes memory _toAddress, uint _tokenId, bool _useZro, bytes memory _adapterParams) external view returns (uint nativeFee, uint zroFee) {
        bytes memory payload = abi.encode(FUNCTION_TYPE_SEND, _toAddress, _toSingletonArray(_tokenId));
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function estimateDistributeFee(uint16 _dstChainId, TokenDistribute[] memory _tokenDistribute, bool _useZro) external view returns (uint nativeFee, uint zroFee) {
        return _estimatePayloadFee(_dstChainId, abi.encode(FUNCTION_TYPE_DISTRIBUTE, _tokenDistribute), _tokenDistribute.length, _useZro);
    }

    function estimateSendMultiFee(uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIdArray, bool _useZro) external view returns (uint nativeFee, uint zroFee) {
        return _estimatePayloadFee(_dstChainId, abi.encode(FUNCTION_TYPE_SEND, _toAddress, _tokenIdArray), _tokenIdArray.length, _useZro);
    }

    function _estimatePayloadFee(uint16 _dstChainId, bytes memory _payload, uint _amount, bool _useZro) internal view returns (uint nativeFee, uint zroFee) {
        require(_amount > 0, "Amount must be greater than 0");
        uint16 version = 1;
        uint destinationGas = 200000 + ((_amount - 1) * 50000);
        bytes memory _adapterParams = abi.encodePacked(version, destinationGas);
        return lzEndpoint.estimateFees(_dstChainId, address(this), _payload, _useZro, _adapterParams);
    }

    function setUseCustomAdapterParams(bool _useCustomAdapterParams) external onlyOwner {
        useCustomAdapterParams = _useCustomAdapterParams;
        emit SetUseCustomAdapterParams(_useCustomAdapterParams);
    }

    function sendFrom(address _from, uint16 _dstChainId, bytes memory _toAddress, uint _tokenId, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) public payable {
        _send(_from, _dstChainId, _toAddress, _toSingletonArray(_tokenId), _refundAddress, _zroPaymentAddress, _adapterParams);
    }

    function sendFrom(address _from, uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIdArray, address payable _refundAddress, address _zroPaymentAddress) public payable {
        bytes memory _adapterParams = _getMultiAdaptParams(_tokenIdArray.length);
        _send(_from, _dstChainId, _toAddress, _tokenIdArray, _refundAddress, _zroPaymentAddress, _adapterParams);
    }

    function _getMultiAdaptParams(uint _amount) internal pure returns (bytes memory) {
        require(_amount > 0, "Amount must be greater than 0");
        uint16 version = 1;
        uint destinationGas = 200000 + ((_amount - 1) * 50000);
        return abi.encodePacked(version, destinationGas);
    }

    function _toSingletonArray(uint element) internal pure returns (uint[] memory) {
        uint[] memory array = new uint[](1);
        array[0] = element;
        return array;
    }

    function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIdArray) internal {
        for (uint i = 0; i < _tokenIdArray.length; i++) {
            require(_isApprovedOrOwner(_msgSender(), _tokenIdArray[i]), "ONFT721: send caller is not owner nor approved");
            require(ERC721.ownerOf(_tokenIdArray[i]) == _from, "ONFT721: send from incorrect owner");
            _transfer(_from, address(this), _tokenIdArray[i]);
        }
    }

    function _creditTo(uint16, address _toAddress, uint[] memory _tokenIdArray) internal {
        for (uint i = 0; i < _tokenIdArray.length; i++) {
            require(!_exists(_tokenIdArray[i]) || (_exists(_tokenIdArray[i]) && ERC721.ownerOf(_tokenIdArray[i]) == address(this)));
            if (!_exists(_tokenIdArray[i])) {
                _safeMint(_toAddress, _tokenIdArray[i]);
            } else {
                _transfer(address(this), _toAddress, _tokenIdArray[i]);
            }
        }
    }

    function _send(address _from, uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIdArray, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) internal virtual {
        _debitFrom(_from, _dstChainId, _toAddress, _tokenIdArray);

        bytes memory payload = abi.encode(FUNCTION_TYPE_SEND, _toAddress, _tokenIdArray);

        if(_tokenIdArray.length == 1) {
            if (useCustomAdapterParams) {
                _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, NO_EXTRA_GAS);
            } else {
                require(_adapterParams.length == 0, "LzApp: _adapterParams must be empty.");
            }
        }
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);

        emit SendToChain(_dstChainId, _from, _toAddress, _tokenIdArray);
    }

    function countAllSetBits() public view returns (uint count) {
        uint tokenIdsLength = tokenIds.length;
        for(uint i = 0; i < tokenIdsLength; i++) {
            count += BitLib.countSetBits(tokenIds[i]);
        }
        return count;
    }

    function countTokenDistributeSize(uint _amount) internal view returns (uint) {
        uint count;
        uint tokenIdsLength = tokenIds.length;
        for(uint i = 0; i < tokenIdsLength; i++) {
            uint currentTokenId = tokenIds[i];
            count += BitLib.countSetBits(currentTokenId);
            if(count >= _amount) return i + 1;
        }
        return 0;
    }

    function getNextMintTokenId() internal returns (uint tokenId) {
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
            (, bytes memory toAddressBytes, uint[] memory _tokenIdArray) = abi.decode(_payload, (uint8, bytes, uint[]));
            address toAddress;
            assembly {
                toAddress := mload(add(toAddressBytes, 20))
            }
            _creditTo(_srcChainId, toAddress, _tokenIdArray);
            emit ReceiveFromChain(_srcChainId, _srcAddress, toAddress, _tokenIdArray);
        } else if(functionType == FUNCTION_TYPE_DISTRIBUTE) {
            (, TokenDistribute[] memory tokenDistribute) = abi.decode(_payload, (uint8, TokenDistribute[]));
            for(uint i = 0; i < tokenDistribute.length; i++) {
                uint temp = tokenIds[tokenDistribute[i].index];
                tokenIds[tokenDistribute[i].index] = temp | tokenDistribute[i].value;
            }
            emit ReceiveDistribute(_srcChainId, _srcAddress, tokenDistribute);
        }
    }
}