// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../onft/ONFT721.sol";

contract SoulboundONFT is ONFT721 {
    using BytesLib for bytes;

    uint public currentTokenId;

    constructor(string memory _name, string memory _symbol, address _lzEndpoint) ONFT721(_name, _symbol, _lzEndpoint) {
        currentTokenId = 1;
    }

    function mint() external payable {
        _safeMint(msg.sender, currentTokenId++);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override virtual {
        require(from == address(0) || to == address(0), "SoulboundONFT: token transfer is BLOCKED");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _debitFrom(address _from, uint16, bytes memory _toAddress, uint _tokenId) internal virtual override(ONFT721) {
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ONFT721: send caller is not owner nor approved");
        require(ERC721.ownerOf(_tokenId) == _from, "ONFT721: send from incorrect owner");
        require(_from == _toAddress.toAddress(0), "SoulboundONFT: must transfer to same address on new chain");
        _burn(_tokenId);
    }

    function _creditTo(uint16, address _toAddress, uint _tokenId) internal virtual override(ONFT721) {
        require(!_exists(_tokenId) || (_exists(_tokenId) && ERC721.ownerOf(_tokenId) == address(this)));
        _safeMint(_toAddress, _tokenId);
    }
}