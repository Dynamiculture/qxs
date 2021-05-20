// deployer for timelock
import * as dotenv from 'dotenv';
import { ContractTransaction, BigNumber, ethers } from "ethers";
import { QXS } from "../typechain";

const abi = [
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function mint(address to) public',
]

async function main() {
  dotenv.config();
  const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
  const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY || '';
  const URL = `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`;
  console.log(`url: ${URL}`);

  const provider = new ethers.providers.JsonRpcProvider(URL);
  const deployer = new ethers.Wallet(RINKEBY_PRIVATE_KEY, provider);
  const deployerAddress = await deployer.getAddress();
  console.log(`deployer address: ${deployerAddress}`);

  const contractAddress = process.env.CONTRACT_ADDRESS || '';
  const mintToAddress = process.env.MINT_TO_ADDRESS || '';
  console.log(`mintToAddress: ${mintToAddress}`);  

  const contract: QXS = new ethers.Contract(contractAddress, abi, deployer) as QXS;

  let totalSupply = await contract.totalSupply({ gasLimit: 3000000 });
  console.log(`totalSupply before minting: ${totalSupply}`);

  const receipt: ContractTransaction = await contract.connect(deployer)
    .mint(mintToAddress, { gasLimit: 3000000 });

  // receipt should include tokenURI with tokenID
  // here is where you would supply metadata to the above address
  // possibly with a REST post that would create json at that address
  // that would contain a link to the mp4, etc.
  console.log('minted:', receipt);

  totalSupply = await contract.totalSupply({ gasLimit: 3000000 });
  console.log(`totalSupply after minting: ${totalSupply}`);

  // checks each slot for a token until all are found
  for (let i = 0, tokenCnt = 0; tokenCnt < totalSupply.toNumber(); i++) {
    let product;
    try {
      product = await contract.tokenURI(i, { gasLimit: 3000000 });
      tokenCnt++;
    } catch (e) {
      console.log(`no token at id: ${i}`);
      continue;
    }
    console.log(`product: ${product}`);
  }
  process.exit(0)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });