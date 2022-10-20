const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("SoulboundONFT721: ", function () {
    const chainId_A = 1
    const chainId_B = 2
    const name = "OmnichainNonFungibleToken"
    const symbol = "SoulboundONFT"

    let owner, warlock, lzEndpointMockA, lzEndpointMockB, LZEndpointMock, SoulboundONFT, soulboundONFT_A, soulboundONFT_B

    before(async function () {
        owner = (await ethers.getSigners())[0]
        warlock = (await ethers.getSigners())[1]
        LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        SoulboundONFT = await ethers.getContractFactory("SoulboundONFT")
    })

    beforeEach(async function () {
        lzEndpointMockA = await LZEndpointMock.deploy(chainId_A)
        lzEndpointMockB = await LZEndpointMock.deploy(chainId_B)

        // generate a proxy to allow it to go SoulboundONFT
        soulboundONFT_A = await SoulboundONFT.deploy(name, symbol, lzEndpointMockA.address)
        soulboundONFT_B = await SoulboundONFT.deploy(name, symbol, lzEndpointMockB.address)

        // wire the lz endpoints to guide msgs back and forth
        lzEndpointMockA.setDestLzEndpoint(soulboundONFT_B.address, lzEndpointMockB.address)
        lzEndpointMockB.setDestLzEndpoint(soulboundONFT_A.address, lzEndpointMockA.address)

        // set each contracts source address so it can send to each other
        await soulboundONFT_A.setTrustedRemote(chainId_B, ethers.utils.solidityPack(["address", "address"], [soulboundONFT_B.address, soulboundONFT_A.address]))
        await soulboundONFT_B.setTrustedRemote(chainId_A, ethers.utils.solidityPack(["address", "address"], [soulboundONFT_A.address, soulboundONFT_B.address]))
    })

    it("sendFrom() - from Chain A to Chain B", async function () {
        const tokenId = 1
        await soulboundONFT_A.mint()

        // estimate nativeFees
        let nativeFee = (await soulboundONFT_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await soulboundONFT_A.sendFrom(owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await soulboundONFT_B.ownerOf(tokenId)).to.be.equal(owner.address)
    })

    it("transferFrom() - reverts on same chain", async function () {
        const tokenId = 1
        await soulboundONFT_A.mint()

        expect(await soulboundONFT_A.ownerOf(tokenId)).to.be.equal(owner.address)

        await expect(soulboundONFT_B.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID")

        await expect(
            soulboundONFT_A.transferFrom(owner.address, warlock.address, tokenId)
        ).to.be.revertedWith("SoulboundONFT: token transfer is BLOCKED")
    })

    it("sendFrom() - revert if trying to send to different address other than the owner", async function () {
        const tokenId = 1
        await soulboundONFT_A.mint()

        // estimate nativeFees
        let nativeFee = (await soulboundONFT_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await soulboundONFT_A.sendFrom(owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await soulboundONFT_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // approve the other user to send the token
        await soulboundONFT_B.approve(warlock.address, tokenId)

        // estimate nativeFees
        nativeFee = (await soulboundONFT_B.estimateSendFee(chainId_A, warlock.address, tokenId, false, "0x")).nativeFee

        // sends across
        await expect(
            soulboundONFT_B.connect(warlock).sendFrom(
                owner.address,
                chainId_A,
                warlock.address,
                tokenId,
                warlock.address,
                ethers.constants.AddressZero,
                "0x",
                { value: nativeFee }
            )
        ).to.be.revertedWith("SoulboundONFT: must transfer to same address on new chain")
    })

    it("sendFrom() - reverts if contract is approved, but not the sending user", async function () {
        const tokenId = 1
        await soulboundONFT_A.mint()

        // approve the proxy to swap your token
        await soulboundONFT_A.approve(soulboundONFT_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await soulboundONFT_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await soulboundONFT_A.sendFrom(owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await soulboundONFT_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // approve the contract to swap your token
        await soulboundONFT_B.approve(soulboundONFT_B.address, tokenId)

        // reverts because contract is approved, not the user
        await expect(
            soulboundONFT_B.connect(warlock).sendFrom(
                owner.address,
                chainId_A,
                warlock.address,
                tokenId,
                warlock.address,
                ethers.constants.AddressZero,
                "0x"
            )
        ).to.be.revertedWith("ONFT721: send caller is not owner nor approved")
    })

    it("sendFrom() - reverts if not approved on non proxy chain", async function () {
        const tokenId = 1
        await soulboundONFT_A.mint()

        // approve the proxy to swap your token
        await soulboundONFT_A.approve(soulboundONFT_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await soulboundONFT_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await soulboundONFT_A.sendFrom(owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await soulboundONFT_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // reverts because user is not approved
        await expect(
            soulboundONFT_B.connect(warlock).sendFrom(
                owner.address,
                chainId_A,
                warlock.address,
                tokenId,
                warlock.address,
                ethers.constants.AddressZero,
                "0x"
            )
        ).to.be.revertedWith("ONFT721: send caller is not owner nor approved")
    })

    it("sendFrom() - reverts if sender does not own token", async function () {
        const tokenIdA = 1
        const tokenIdB = 2
        // mint to both owners
        await soulboundONFT_A.mint()
        await soulboundONFT_A.mint()
        // approve owner.address to transfer, but not the other
        await soulboundONFT_A.setApprovalForAll(soulboundONFT_A.address, true)

        await expect(
            soulboundONFT_A.connect(warlock).sendFrom(
                warlock.address,
                chainId_B,
                warlock.address,
                tokenIdA,
                warlock.address,
                ethers.constants.AddressZero,
                "0x"
            )
        ).to.be.revertedWith("ONFT721: send caller is not owner nor approved")
        await expect(
            soulboundONFT_A.connect(warlock).sendFrom(
                warlock.address,
                chainId_B,
                owner.address,
                tokenIdA,
                owner.address,
                ethers.constants.AddressZero,
                "0x"
            )
        ).to.be.revertedWith("ONFT721: send caller is not owner nor approved")
    })
})
