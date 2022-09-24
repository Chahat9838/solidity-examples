const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json")

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`>>> your address: ${deployer}`)

    const lzEndpointAddress = LZ_ENDPOINTS[hre.network.name]
    console.log(`[${hre.network.name}] Endpoint Address: ${lzEndpointAddress}`)

    let usdcAddresses = {
        "goerli": "0x4f481b910B097797632A96C669C81F5e5A7b49Ed",
        "fuji": "0xA5902870E3D5E086f706cCB770F1404b71658db6",
    }

    await deploy("ProxyOFT", {
        from: deployer,
        args: [lzEndpointAddress, usdcAddresses[hre.network.name]],
        log: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["ProxyOFT"]
