// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint value = 666;

    function setValue(uint a) public returns (uint) {
        require(a != 666, "invalid value");
        value = a;
        return value;
    }

    function getValue() public view returns (uint) {
        return value;
    }

    function getCallData(uint a) public pure returns (bytes memory) {
        return abi.encodeWithSelector(this.setValue.selector, a);
    }
}
