const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json")
const ONFT_ARGS = require("../constants/onftArgs.json")

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`>>> your address: ${deployer}`)

    await deploy("ERC20Mock", {
        from: deployer,
        args: ["USDC","USDC"],
        log: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["ERC20Mock"]
