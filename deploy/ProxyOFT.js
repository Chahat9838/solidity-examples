const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json")

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`>>> your address: ${deployer}`)

    const lzEndpointAddress = LZ_ENDPOINTS[hre.network.name]
    console.log(`[${hre.network.name}] Endpoint Address: ${lzEndpointAddress}`)

    let usdcAddresses = {
        "goerli": "0x9C2c8363C7fd93D82B7309D7f711b0D7B652ce3D",
        "fuji": "0xAe564e9A99788fC65224c91D5A9Ea9F8d556c2D5",
    }

    await deploy("ProxyOFT", {
        from: deployer,
        args: [lzEndpointAddress, usdcAddresses[hre.network.name]],
        log: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["ProxyOFT"]
