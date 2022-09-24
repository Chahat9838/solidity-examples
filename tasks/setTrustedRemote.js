const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    // get local contract name
    let localContract = taskArgs.localContract;

    // get remote contract name
    let remoteContract = taskArgs.remoteContract;

    // get deployed remote contract address
    const remoteAddress = getDeploymentAddresses(taskArgs.targetNetwork)[remoteContract]

    // get remote chain id
    const remoteChainId = CHAIN_ID[taskArgs.targetNetwork]

    // get local contract
    const contractInstance = await ethers.getContract(localContract)
    console.log(`[local] contract address: ${contractInstance.address}`)
    console.log({remoteChainId})
    console.log({remoteAddress})

    // check if pathway is already set
    const isTrustedRemoteSet = await contractInstance.isTrustedRemote(remoteChainId, remoteAddress);

    if(!isTrustedRemoteSet) {
        try {
            let tx = await (await contractInstance.setTrustedRemote(remoteChainId, remoteAddress)).wait()
            console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAddress})`)
            console.log(` tx: ${tx.transactionHash}`)
        } catch (e) {
            if (e.error.message.includes("The chainId + address is already trusted")) {
                console.log("*source already set*")
            } else {
                console.log(`❌ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAddress})`)
            }
        }
    } else {
        console.log("*source already set*")
    }
}
