const CHAIN_IDS = require("../constants/chainIds.json")

module.exports = async function (taskArgs, hre) {
    const signers = await ethers.getSigners()
    const owner = signers[0]
    let contract = await ethers.getContract(taskArgs.contract)

    try {
        let tx = await contract.transferOwnership(taskArgs.address)
        console.log(`✅ [${hre.network.name}] transferOwnership()`)
    } catch (e) {
        console.log(e)
    }
}
