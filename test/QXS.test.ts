import { ethers } from "hardhat";
import chai from "chai";
import { QXS__factory, QXS } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber } from "ethers";

const { expect } = chai;

let qxs: QXS;
let qxsFactory: QXS__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const amount: BigNumber = BigNumber.from(5000);

const name = 'MinterAutoIDToken';
const symbol = 'QXS';
const baseURI = 'my.app/';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));

describe("qxs", () => {

    beforeEach(async () => {
        [deployer, other] = await ethers.getSigners();
        qxsFactory = (await ethers.getContractFactory(
            'QXS',
            deployer
        )) as QXS__factory;

        qxs = (await qxsFactory.deploy(name, symbol, baseURI)) as QXS;
        expect(qxs.address).to.properAddress;
    });

    describe("deployment", async () => {
        // it('token has correct name', async () => {
        //     expect(await qxs.name()).to.equal(name);
        // });

        // it('token has correct symbol', async () => {
        //     expect(await qxs.symbol()).to.equal(symbol);
        // });

        it('deployer has the default admin role', async () => {
            expect(await qxs.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.equal(1);
            expect(await qxs.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(deployer.address);
        });

        it('deployer has the minter role', async () => {
            expect(await qxs.getRoleMemberCount(MINTER_ROLE)).to.equal(1);
            expect(await qxs.getRoleMember(MINTER_ROLE, 0)).to.equal(deployer.address);
        });

        it('deployer has the pauser role', async () => {
            expect(await qxs.getRoleMemberCount(PAUSER_ROLE)).to.equal(1);
            expect(await qxs.getRoleMember(PAUSER_ROLE, 0)).to.equal(deployer.address);
        });

        it('minter and pauser role admin is the default admin', async () => {
            expect(await qxs.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
            expect(await qxs.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });
    });

    describe("minting", async () => {
        it('deployer can mint tokens', async () => {
            const tokenId = ethers.BigNumber.from(0);

            await expect(qxs.connect(deployer).mint(other.address))
                .to.emit(qxs, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, tokenId);

            expect(await qxs.balanceOf(other.address)).to.equal(1);
            expect(await qxs.ownerOf(tokenId)).to.equal(other.address);

            expect(await qxs.tokenURI(tokenId)).to.equal(baseURI + tokenId);            
        });

        it('other accounts cannot mint tokens', async () => {
            await expect(qxs.connect(other).mint(other.address))
                .to.be.revertedWith('ERC721PresetMinterPauserAutoId: must have minter role to mint');
        });
    });

    describe("pausing", async () => {
        it('deployer can pause', async () => {
            await expect(qxs.connect(deployer).pause())
                .to.emit(qxs, 'Paused')
                .withArgs(deployer.address);
            expect(await qxs.paused()).to.equal(true);
        });

        it('deployer can unpause', async () => {
            await qxs.connect(deployer).pause();
            await expect(qxs.connect(deployer).unpause())
                .to.emit(qxs, 'Unpaused')
                .withArgs(deployer.address);
            expect(await qxs.paused()).to.equal(false);
        });

        it('cannot mint while paused', async () => {
            await qxs.connect(deployer).pause();
            await expect(qxs.connect(deployer).mint(other.address))
                .to.be.revertedWith('ERC721Pausable: token transfer while paused');
        });

        it('other accounts cannot pause', async () => {
            await expect(qxs.connect(other).pause())
                .to.be.revertedWith('ERC721PresetMinterPauserAutoId: must have pauser role to pause');
        });

        it('other accounts cannot unpause', async () => {
            await qxs.connect(deployer).pause();
            await expect(qxs.connect(other).unpause())
                .to.be.revertedWith('ERC721PresetMinterPauserAutoId: must have pauser role to unpause');
        });
    });

    describe("burning", async () => {
        it('holders can burn their tokens', async () => {
            const tokenId = ethers.BigNumber.from(0);

            await qxs.connect(deployer).mint(other.address);

            await expect(qxs.connect(other).burn(tokenId))
                .to.emit(qxs, 'Transfer')
                .withArgs(other.address, ZERO_ADDRESS, tokenId);
            expect(await qxs.balanceOf(other.address)).to.equal(0);
            expect(await qxs.totalSupply()).to.equal(0);
        });
    });
});


