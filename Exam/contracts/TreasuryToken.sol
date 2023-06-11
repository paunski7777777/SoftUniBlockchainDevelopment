// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TreasuryToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Treasury", "TRY") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function transfer(address from, address to, uint256 amount) public {
        _transfer(from, to, amount);
    }
}
