const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("DistributeONFT721: ", function () {
    const chainId_A = 1
    const chainId_B = 2
    const chainId_C = 3
    const chainId_D = 4

    let owner, LZEndpointMock, ONFT, warlock
    let distributeONFT721_A, distributeONFT721_B, distributeONFT721_C, distributeONFT721_D
    let lzEndpointMock_A, lzEndpointMock_B, lzEndpointMock_C, lzEndpointMock_D
    let initialValue = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC0";

    before(async function () {
        owner = (await ethers.getSigners())[0]
        warlock = (await ethers.getSigners())[1]
        LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        ONFT = await ethers.getContractFactory("DistributeONFT721Mock")
    })

    beforeEach(async function () {
        lzEndpointMock_A = await LZEndpointMock.deploy(chainId_A)
        lzEndpointMock_B = await LZEndpointMock.deploy(chainId_B)
        lzEndpointMock_C = await LZEndpointMock.deploy(chainId_C)
        lzEndpointMock_D = await LZEndpointMock.deploy(chainId_D)

        let initialValueArray = [initialValue,initialValue,initialValue,initialValue,initialValue,initialValue,initialValue,initialValue,initialValue,initialValue]

        // create two UniversalONFT instances
        distributeONFT721_A = await ONFT.deploy(lzEndpointMock_A.address, [0,1,2,3,4,5,6,7,8,9], initialValueArray)
        distributeONFT721_B = await ONFT.deploy(lzEndpointMock_B.address, [10,11,12,13,14,15,16,17,18,19], initialValueArray)
        distributeONFT721_C = await ONFT.deploy(lzEndpointMock_C.address, [20,21,22,23,24,25,26,27,28,29], initialValueArray)
        distributeONFT721_D = await ONFT.deploy(lzEndpointMock_D.address, [30,31,32,33,34,35,36,37,38,39], initialValueArray)

        await lzEndpointMock_A.setDestLzEndpoint(distributeONFT721_B.address, lzEndpointMock_B.address)
        await lzEndpointMock_A.setDestLzEndpoint(distributeONFT721_C.address, lzEndpointMock_C.address)
        await lzEndpointMock_A.setDestLzEndpoint(distributeONFT721_D.address, lzEndpointMock_D.address)

        await lzEndpointMock_B.setDestLzEndpoint(distributeONFT721_A.address, lzEndpointMock_A.address)
        await lzEndpointMock_B.setDestLzEndpoint(distributeONFT721_C.address, lzEndpointMock_C.address)
        await lzEndpointMock_B.setDestLzEndpoint(distributeONFT721_D.address, lzEndpointMock_D.address)

        await lzEndpointMock_C.setDestLzEndpoint(distributeONFT721_A.address, lzEndpointMock_A.address)
        await lzEndpointMock_C.setDestLzEndpoint(distributeONFT721_B.address, lzEndpointMock_B.address)
        await lzEndpointMock_C.setDestLzEndpoint(distributeONFT721_D.address, lzEndpointMock_D.address)

        await lzEndpointMock_D.setDestLzEndpoint(distributeONFT721_A.address, lzEndpointMock_A.address)
        await lzEndpointMock_D.setDestLzEndpoint(distributeONFT721_B.address, lzEndpointMock_B.address)
        await lzEndpointMock_D.setDestLzEndpoint(distributeONFT721_C.address, lzEndpointMock_C.address)


        await distributeONFT721_A.setTrustedRemoteAddress(chainId_B, distributeONFT721_B.address)
        await distributeONFT721_A.setTrustedRemoteAddress(chainId_C, distributeONFT721_C.address)
        await distributeONFT721_A.setTrustedRemoteAddress(chainId_D, distributeONFT721_D.address)

        await distributeONFT721_B.setTrustedRemoteAddress(chainId_A, distributeONFT721_A.address)
        await distributeONFT721_B.setTrustedRemoteAddress(chainId_C, distributeONFT721_C.address)
        await distributeONFT721_B.setTrustedRemoteAddress(chainId_D, distributeONFT721_D.address)

        await distributeONFT721_C.setTrustedRemoteAddress(chainId_A, distributeONFT721_A.address)
        await distributeONFT721_C.setTrustedRemoteAddress(chainId_B, distributeONFT721_B.address)
        await distributeONFT721_C.setTrustedRemoteAddress(chainId_D, distributeONFT721_D.address)

        await distributeONFT721_D.setTrustedRemoteAddress(chainId_A, distributeONFT721_A.address)
        await distributeONFT721_D.setTrustedRemoteAddress(chainId_B, distributeONFT721_B.address)
        await distributeONFT721_D.setTrustedRemoteAddress(chainId_C, distributeONFT721_C.address)
    })

    it("contructor() - check initialization", async function () {
        for (let i = 0; i < 10; i++) {
            expect(await distributeONFT721_A.tokenIds(i)).to.equal(initialValue)
            expect(await distributeONFT721_B.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_C.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_D.tokenIds(i)).to.equal("0x0")
        }

        for (let i = 10; i < 20; i++) {
            expect(await distributeONFT721_A.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_B.tokenIds(i)).to.equal(initialValue)
            expect(await distributeONFT721_C.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_D.tokenIds(i)).to.equal("0x0")
        }

        for (let i = 20; i < 30; i++) {
            expect(await distributeONFT721_A.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_B.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_C.tokenIds(i)).to.equal(initialValue)
            expect(await distributeONFT721_D.tokenIds(i)).to.equal("0x0")
        }

        for (let i = 30; i < 40; i++) {
            expect(await distributeONFT721_A.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_B.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_C.tokenIds(i)).to.equal("0x0")
            expect(await distributeONFT721_D.tokenIds(i)).to.equal(initialValue)
        }

        let totalTokenCount = parseInt(await distributeONFT721_A.callStatic.countAllSetBits())
        totalTokenCount +=  parseInt(await distributeONFT721_B.callStatic.countAllSetBits())
        totalTokenCount +=  parseInt(await distributeONFT721_C.callStatic.countAllSetBits())
        totalTokenCount +=  parseInt(await distributeONFT721_D.callStatic.countAllSetBits())

        expect(totalTokenCount).to.equal(10000)
    })

    it.skip("mint() - all tokens", async function () {
        // console.log("distributeONFT721_A");
        for (let i = 1; i <= 2500; i++) {
            await distributeONFT721_A.mint()
            expect(await distributeONFT721_A.ownerOf(i)).to.be.equal(owner.address)
        }

        // console.log("distributeONFT721_B");
        for (let i = 2501; i <= 5000; i++) {
            await distributeONFT721_B.mint()
            expect(await distributeONFT721_B.ownerOf(i)).to.be.equal(owner.address)
        }

        // console.log("distributeONFT721_C");
        for (let i = 5001; i <= 7500; i++) {
            await distributeONFT721_C.mint()
            expect(await distributeONFT721_C.ownerOf(i)).to.be.equal(owner.address)
        }

        // console.log("distributeONFT721_D");
        for (let i = 7501; i <= 10000; i++) {
            await distributeONFT721_D.mint()
            expect(await distributeONFT721_D.ownerOf(i)).to.be.equal(owner.address)
        }
    })

    it("distributeTokens() - Random", async function () {
        let chains = [1,2,3,4]
        let currentValues = [2500,2500,2500,2500]
        let currentChains = [distributeONFT721_A,distributeONFT721_B,distributeONFT721_C,distributeONFT721_D]
        let breakFor = false;
        for (let j = 0; j < 8 && !breakFor; j++) {
            let currentDistributer = j % 4;
            for (let i = 0; i < 8 && !breakFor; i++) {
                if(i % 4 === currentDistributer) continue;
                let randomTokens;
                while(true) {
                    randomTokens = Math.floor(Math.random() * (250 - 1 + 1)) + 1;
                    if(currentValues[currentDistributer] >= randomTokens) break;
                }
                // console.log("-----------------------------------BEFORE-----------------------------------------------");
                // console.log("A: " + parseInt(await distributeONFT721_A.callStatic.countAllSetBits()))
                // console.log("B: " + parseInt(await distributeONFT721_B.callStatic.countAllSetBits()))
                // console.log("C: " + parseInt(await distributeONFT721_C.callStatic.countAllSetBits()))
                // console.log("D: " + parseInt(await distributeONFT721_D.callStatic.countAllSetBits()))
                // console.log("-----------------------------------SENDING-----------------------------------------------");
                // console.log(chainStr[currentDistributer] + " -> " + randomTokens + " -> " + chainStr[i % 4])
                let tokenDistribute = await currentChains[currentDistributer].getDistributeTokens(randomTokens)
                await currentChains[currentDistributer].distributeTokens(
                    chains[i % 4],
                    tokenDistribute,
                    owner.address,
                    owner.address,
                    { value: ethers.utils.parseEther("5")  }
                )

                currentValues[currentDistributer] -= randomTokens
                currentValues[i % 4] += randomTokens
                // console.log("-----------------------------------AFTER----------------------------`-------------------");
                // console.log("A: " + parseInt(await distributeONFT721_A.callStatic.countAllSetBits()))
                // console.log("B: " + parseInt(await distributeONFT721_B.callStatic.countAllSetBits()))
                // console.log("C: " + parseInt(await distributeONFT721_C.callStatic.countAllSetBits()))
                // console.log("D: " + parseInt(await distributeONFT721_D.callStatic.countAllSetBits()))
                // // console.log("A: " + parseInt(await distributeONFT721_A.callStatic.countAllSetBits()) + " " + currentValues[0])
                // // console.log("B: " + parseInt(await distributeONFT721_B.callStatic.countAllSetBits()) + " " + currentValues[1])
                // // console.log("C: " + parseInt(await distributeONFT721_C.callStatic.countAllSetBits()) + " " + currentValues[2])
                // // console.log("D: " + parseInt(await distributeONFT721_D.callStatic.countAllSetBits()) + " " + currentValues[3])
            }
        }
        let currentDistributerCount_A = parseInt(await distributeONFT721_A.callStatic.countAllSetBits())
        expect(currentDistributerCount_A).to.equal(currentValues[0])

        let currentDistributerCount_B = parseInt(await distributeONFT721_B.callStatic.countAllSetBits())
        expect(currentDistributerCount_B).to.equal(currentValues[1])

        let currentDistributerCount_C = parseInt(await distributeONFT721_C.callStatic.countAllSetBits())
        expect(currentDistributerCount_C).to.equal(currentValues[2])

        let currentDistributerCount_D = parseInt(await distributeONFT721_D.callStatic.countAllSetBits())
        expect(currentDistributerCount_D).to.equal(currentValues[3])

        let totalTokenCount = parseInt(await distributeONFT721_A.callStatic.countAllSetBits())
        totalTokenCount +=  parseInt(await distributeONFT721_B.callStatic.countAllSetBits())
        totalTokenCount +=  parseInt(await distributeONFT721_C.callStatic.countAllSetBits())
        totalTokenCount +=  parseInt(await distributeONFT721_D.callStatic.countAllSetBits())

        expect(totalTokenCount).to.equal(10000)

        // console.log("------------------------------------FINAL-------------------------------------------");

        // console.log("A: " + parseInt(await distributeONFT721_A.callStatic.countAllSetBits()) + " " + currentValues[0])
        // console.log("B: " + parseInt(await distributeONFT721_B.callStatic.countAllSetBits()) + " " + currentValues[1])
        // console.log("C: " + parseInt(await distributeONFT721_C.callStatic.countAllSetBits()) + " " + currentValues[2])
        // console.log("D: " + parseInt(await distributeONFT721_D.callStatic.countAllSetBits()) + " " + currentValues[3])
    })

    it("sendFrom() - your own tokens", async function () {
        const tokenId = 1
        await distributeONFT721_A.mint()

        // verify the owner of the token is on the source chain
        expect(await distributeONFT721_A.ownerOf(tokenId)).to.be.equal(owner.address)

        // token doesn't exist on other chain
        await expect(distributeONFT721_B.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID")

        // can transfer token on srcChain as regular erC721
        await distributeONFT721_A.transferFrom(owner.address, warlock.address, tokenId)
        expect(await distributeONFT721_A.ownerOf(tokenId)).to.be.equal(warlock.address)

        // approve the proxy to swap your token
        await distributeONFT721_A.connect(warlock).approve(distributeONFT721_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await distributeONFT721_A.estimateSendFee(chainId_B, warlock.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await distributeONFT721_A.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
            warlock.address,
            chainId_B,
            warlock.address,
            tokenId,
            warlock.address,
            ethers.constants.AddressZero,
            "0x",
            { value: nativeFee }
        )

        // token is burnt
        expect(await distributeONFT721_A.ownerOf(tokenId)).to.be.equal(distributeONFT721_A.address)

        // token received on the dst chain
        expect(await distributeONFT721_B.ownerOf(tokenId)).to.be.equal(warlock.address)

        // estimate nativeFees
        nativeFee = (await distributeONFT721_B.estimateSendFee(chainId_A, warlock.address, tokenId, false, "0x")).nativeFee

        // can send to other onft contract eg. not the original nft contract chain
        await distributeONFT721_B.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
            warlock.address,
            chainId_A,
            warlock.address,
            tokenId,
            warlock.address,
            ethers.constants.AddressZero,
            "0x",
            { value: nativeFee }
        )

        // token is burned on the sending chain
        expect(await distributeONFT721_B.ownerOf(tokenId)).to.be.equal(distributeONFT721_B.address)
    })

    it("sendFrom() - reverts if not owner on non proxy chain", async function () {
        const tokenId = 1
        await distributeONFT721_A.mint()

        // approve the proxy to swap your token
        await distributeONFT721_A.approve(distributeONFT721_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await distributeONFT721_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await distributeONFT721_A["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await distributeONFT721_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // reverts because other address does not own it
        await expect(
            distributeONFT721_B.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
                warlock.address,
                chainId_A,
                warlock.address,
                tokenId,
                warlock.address,
                ethers.constants.AddressZero,
                "0x"
            )
        ).to.be.revertedWith("ONFT721: send caller is not owner nor approved")
    })

    it("sendFrom() - on behalf of other user", async function () {
        const tokenId = 1
        await distributeONFT721_A.mint()

        // approve the proxy to swap your token
        await distributeONFT721_A.approve(distributeONFT721_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await distributeONFT721_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await distributeONFT721_A["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await distributeONFT721_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // approve the other user to send the token
        await distributeONFT721_B.approve(warlock.address, tokenId)

        // estimate nativeFees
        nativeFee = (await distributeONFT721_B.estimateSendFee(chainId_A, warlock.address, tokenId, false, "0x")).nativeFee

        // sends across
        await distributeONFT721_B.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
            owner.address,
            chainId_A,
            warlock.address,
            tokenId,
            warlock.address,
            ethers.constants.AddressZero,
            "0x",
            { value: nativeFee }
        )

        // token received on the dst chain
        expect(await distributeONFT721_A.ownerOf(tokenId)).to.be.equal(warlock.address)
    })

    it("sendFrom() - reverts if contract is approved, but not the sending user", async function () {
        const tokenId = 1
        await distributeONFT721_A.mint()

        // approve the proxy to swap your token
        await distributeONFT721_A.approve(distributeONFT721_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await distributeONFT721_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await distributeONFT721_A["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await distributeONFT721_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // approve the contract to swap your token
        await distributeONFT721_B.approve(distributeONFT721_B.address, tokenId)

        // reverts because contract is approved, not the user
        await expect(
            distributeONFT721_B.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
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
        await distributeONFT721_A.mint()

        // approve the proxy to swap your token
        await distributeONFT721_A.approve(distributeONFT721_A.address, tokenId)

        // estimate nativeFees
        let nativeFee = (await distributeONFT721_A.estimateSendFee(chainId_B, owner.address, tokenId, false, "0x")).nativeFee

        // swaps token to other chain
        await distributeONFT721_A["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](owner.address, chainId_B, owner.address, tokenId, owner.address, ethers.constants.AddressZero, "0x", {
            value: nativeFee,
        })

        // token received on the dst chain
        expect(await distributeONFT721_B.ownerOf(tokenId)).to.be.equal(owner.address)

        // reverts because user is not approved
        await expect(
            distributeONFT721_B.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
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
        // mint to both owners
        await distributeONFT721_A.mint()

        // approve owner.address to transfer, but not the other
        await distributeONFT721_A.setApprovalForAll(distributeONFT721_A.address, true)

        await expect(
            distributeONFT721_A.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
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
            distributeONFT721_A.connect(warlock)["sendFrom(address,uint16,bytes,uint256,address,address,bytes)"](
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
