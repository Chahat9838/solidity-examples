// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../OFTCore.sol";
import "../IOFT.sol";

contract WrappedOFT is OFTCore, ERC20, IOFT {

    mapping(uint16 => uint256) public remoteBalances;

    constructor(string memory _name, string memory _symbol, address _lzEndpoint) ERC20(_name, _symbol) OFTCore(_lzEndpoint) {}

    function decimals() public view override returns (uint8) {
        return 6;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(OFTCore, IERC165) returns (bool) {
        return interfaceId == type(IOFT).interfaceId || interfaceId == type(IERC20).interfaceId || super.supportsInterface(interfaceId);
    }

    function circulatingSupply() public view virtual override returns (uint) {
        return totalSupply();
    }

    function _debitFrom(address _from, uint16 _dstChainId, bytes memory, uint _amount) internal virtual override {
        address spender = _msgSender();
        if (_from != spender) _spendAllowance(_from, spender, _amount);
        require(remoteBalances[_dstChainId] >= _amount, "WrappedOFT: Not enough balance on destination chain");
        remoteBalances[_dstChainId] -= _amount;
        _burn(_from, _amount);
    }

    function _creditTo(uint16 _srcChainId, address _toAddress, uint _amount) internal virtual override {
        remoteBalances[_srcChainId] += _amount;
        _mint(_toAddress, _amount);
    }
}
