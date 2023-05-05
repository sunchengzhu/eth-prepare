// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BatchTransfer {
    function transfer(address payable[] memory _recipients, uint256 _amount) public payable {
        require(_recipients.length > 0, "Recipient list is empty");
        require(_amount > 0, "Amount is zero");
        require(msg.value == _recipients.length * _amount, "Insufficient ETH sent");

        for (uint256 i = 0; i < _recipients.length; i++) {
            _recipients[i].transfer(_amount);
        }
    }
}
