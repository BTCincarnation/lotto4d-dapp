import { abi } from "./abi";
import Web3 from "web3";

const address = "0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2";
const web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-mainnet.infura.io));
const lotto4DStats = new web3.eth.Contract(abi, address);
export default lotto4DStats;

