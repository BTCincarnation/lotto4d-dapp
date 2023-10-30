import React, { Component } from "react";
import logo from "./image/logo.png";
import telegram from "./image/telegram.svg";
import github from "./image/github.svg";
import "./App.css";
import LoadingScreen from './LoadingScreen';
import web3 from "./web3";
import { abi } from "./abi";
import lotto4DStats from "./lottery";
import CountDownTimer from "./countDownTimer"

class App extends Component {
  state = {
    loading: true,
    account: null, // This will store the connected Ethereum wallet address
    isWalletConnected: false, // A flag to track whether a wallet is connected or not
    lotto4DContract: null,
    playerMaticBalance: "0", // Player's MATIC balance
    playerL4DBalance: "0", // Player's L4D token balance    
    minimumBet: 0.1, // Minimum bet amount in L4D
    maximumBet: 250, // Maximum bet amount in L4D
    drawTime: 86400, // Draw time 24 hour in seconds
    lastDrawTimestamp: 0,
    timeUntilNextDraw: null,
    lastDrawResult: 0,
    poolBalance: 0,
    totalBets: 0,     // Total bets placed
    totalAmount: 0,   // Total amount bet
    
    bets: [
      { guess: "", amount: "", numDigit: "" } // Initial row for inputting guess and amount
    ],
    betHistory: [], // Array to store the history of bets
    drawResultHistorys: [],
    currentPage: 1,
    itemsPerPage: 10,
    currentPageDrawResults: 1,
    itemsPerPageDrawResults: 10,
    winnerHistory: [[], []], // Array to store the history of winners
    message: "",
    messageForm: ""
  };

  connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {


        // Detect the current network 137 polygon mainnet
      const chainId = 137;
      console.log('current chain' + chainId);
      if (window.ethereum.networkVersion !== chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: web3.utils.toHex(chainId) }]
          });
        } catch (err) {
            // This error code indicates that the chain has not been added to MetaMask
          if (err.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainName: 'Polygon',
                  chainId: web3.utils.toHex(chainId),
                  nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
                  rpcUrls: ['https://polygon-rpc.com/']
                }
              ]
            });
          }
        }
      }
        try {
              // Request account access if not enabled
              await window.ethereum.request({ method: "eth_requestAccounts" });
              const accounts = await web3.eth.getAccounts();
              const account = accounts[0];
              this.setState({ account: account, isWalletConnected: true });
                    
            
                  // Create a new Web3 instance using the same provider
                  const address = "0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2";
                  // const w3 = new Web3(window.web3.currentProvider);
                  const lotto4DContract = new web3.eth.Contract(abi, address);
                  this.setState({ lotto4DContract: lotto4DContract });
        // Fetch and set the user's MATIC balance
        const playerMaticBalance = await web3.eth.getBalance(account);
        this.setState({ playerMaticBalance: web3.utils.fromWei(playerMaticBalance.toString(), "ether") });

        // Fetch and set the user's L4D token balance
        const playerL4DBalance = await lotto4DStats.methods.balanceOf(account).call();
        this.setState({ playerL4DBalance: web3.utils.fromWei(playerL4DBalance.toString(), "gwei") });
      } catch (error) {
        console.error('User denied account access:', error);

      }
    
    } else {
      window.alert('Non-Ethereum browser detected. You should consider install MetaMask or use dapp browser!');
      this.setState({ message: "MetaMask or a compatible wallet is not installed" });
    }   
  
    };




  disconnectWallet = () => { 
    this.setState({ account: null, isWalletConnected: false });
  };

  calculateTimeUntilNextDraw = () => {
    const { lastDrawTimestamp, drawTime } = this.state;
    const lastDrawTimestampNumber = Number(lastDrawTimestamp); // Convert to a number
    const drawTimeNumber = Number(drawTime);
    const timeDifference = lastDrawTimestampNumber + drawTimeNumber;
    
    return timeDifference;
  };

  addL4DTokenToWallet = () => { 
    
    const tokenAddress = "0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2";
    const tokenSymbol = "L4D";
    const tokenDecimals = 9;
    const tokenImageUrl = "https://raw.githubusercontent.com/BTCincarnation/lotto4d-dapp/main/src/image/256logo.png";

    if (window.ethereum) {
      window.ethereum
        .request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImageUrl,
            },
          },
        })
        .then((success) => {
          if (success) {
            console.log(`Successfully added ${tokenSymbol} to wallet`);
            this.setState({ message: "Successfully added L4D to wallet" });
          } else {
            console.error(`Failed to add ${tokenSymbol} to wallet`);
            this.setState({ message: "Failed to add L4D to wallet" });
          }
        })
        .catch((error) => {
          console.error(`Error adding ${tokenSymbol} to wallet: ${error.message}`);
          this.setState({ message: "Error adding L4D to wallet " + error.message });
        });
    }
  }

  async componentDidMount() {
    this.loadingTimer = setTimeout(() => {
      this.setState({ loading: false });
    }, 7000);

    // Fetch contract data such as lastDrawTimestamp, lastDrawResult, and configuration settings
    const lastDrawTimestamp = await lotto4DStats.methods.getLastDrawTime().call();
    const lastDrawResult = await lotto4DStats.methods.getLastDrawResult().call();
    const poolBalance = await lotto4DStats.methods.getContractBalance().call();
    const minimumBet = web3.utils.fromWei(await lotto4DStats.methods.minimumBet().call(), "gwei");
    const maximumBet = web3.utils.fromWei(await lotto4DStats.methods.maximumBet().call(), "gwei");
    // const drawTime = await lotto4DStats.methods.drawTime().call();
    
    this.setState({ lastDrawTimestamp, lastDrawResult, minimumBet, maximumBet, poolBalance: web3.utils.fromWei(poolBalance.toString(), "gwei") });

    const timeUntilNextDraw = this.calculateTimeUntilNextDraw();
    this.setState({ timeUntilNextDraw });

    const drawResultHistorys = await lotto4DStats.methods.getAllDrawResults().call();  
    this.setState({ drawResultHistorys: drawResultHistorys || [] });     
    const betHistory = await lotto4DStats.methods.getBetHistory().call();
    this.setState({ betHistory: betHistory || [] });
    const betTotal = await lotto4DStats.methods.getTotalBets().call();
    const amountTotal = await lotto4DStats.methods.getTotalAmounts().call();
    this.setState({ totalBets: betTotal ? betTotal : "0", totalAmount: amountTotal ? web3.utils.fromWei(amountTotal.toString(), "gwei") : "0" });
    const winnerHistory = await lotto4DStats.methods.getWinnerLists().call();
    this.setState({ winnerHistory: winnerHistory || [[], []] }); // Use empty arrays as fallback
  }

  componentWillUnmount() {
    clearTimeout(this.loadingTimer);
  }

  identifyBetType = (guessN)  => { 
    // Convert the guess to a string 
    const guessStr = guessN.toString();
  
    // Check the length of the guess string to determine the bet type
    const length = guessStr.length;
    if (length === 2) {
      return '2';
    } else if (length === 3) {
      return '3';
    } else if (length === 4) {
      return '4';
    } else {
      return 'Invalid digit';
    }
  }

  handleInputChange = (index, field, value) => {
    const newBets = [...this.state.bets];
    if (field === 'guess') {
      const betType = this.identifyBetType(value);
      // Validate and format guess input
      if (value.length < 2) {
        // Handle invalid guess input (less than 2 characters)
        this.setState({ messageForm: "Request at least 2 digits for guess!" });
      } else if (value.length === 2) {
          // Handle valid guess input
          this.setState({ messageForm: "" });
  
      } else if (value.length > 4) {
        // Trim to four digits if longer
        value = value.slice(0, 4);
        this.setState({ messageForm: "Request at most 4 digits for guess!" });
      }
      newBets[index]['numDigit'] = betType;
    } else if (field === 'amount') {
      // Validate amount input
      const amountValue = parseFloat(value);
      if (isNaN(amountValue) || amountValue < this.state.minimumBet || amountValue > this.state.maximumBet) {
        // Invalid amount or out of range
        this.setState({ messageForm: `Bet amount should be between ${this.state.minimumBet} and ${this.state.maximumBet}` });
        return;
      }
    }
    newBets[index][field] = value;
    this.setState({ bets: newBets }); 
  };

  addRow = () => {
    const newBets = [...this.state.bets, { guess: "", amount: "", numDigit: "" }];
    this.setState({ bets: newBets });
  };

  removeRow = (index) => {
    const newBets = [...this.state.bets];
    newBets.splice(index, 1);
    this.setState({ bets: newBets });
  };

    nextPage = () => {
      this.setState((prevState) => ({
        currentPage: prevState.currentPage + 1,
      }));
    };
  
    prevPage = () => {
      this.setState((prevState) => ({
        currentPage: prevState.currentPage - 1,
      }));
    };

    nextPageDrawResults = () => {
      this.setState((prevState) => ({
        currentPageDrawResults: prevState.currentPageDrawResults + 1,
      }));
    };
    
    prevPageDrawResults = () => {
      this.setState((prevState) => ({
        currentPageDrawResults: prevState.currentPageDrawResults - 1,
      }));
    };

  placeBatchBets = async () => {

    const requestTwoDigitFields = this.state.bets.some((bet) => bet.guess.length < 2);

    const hasEmptyFields = this.state.bets.some((bet) => bet.guess === '' || bet.amount === '');
  
    if (hasEmptyFields) {
     this.setState({ messageForm: "guess or amount cant empty!" });
     return;
    } 
    if (requestTwoDigitFields) {
     this.setState({ messageForm: "Request at least 2 digits for guess!" });
      return;
    }   
    if (this.state.isWalletConnected) {
      const accounts = await web3.eth.getAccounts();
      const guesses = this.state.bets.map((bet) => Number(bet.guess));
      const amountsInWei = this.state.bets.map((bet) => web3.utils.toWei(bet.amount.toString(), "gwei"));
      const digits = this.state.bets.map((bet) => Number(bet.numDigit));
      
      this.setState({ messageForm: "Waiting for transaction..." });


      try {
        const estimatedGas = await this.state.lotto4DContract.methods.placeBatchBetsWithToken(guesses, amountsInWei, digits).estimateGas({
            from: accounts[0],
            
        });
        await this.state.lotto4DContract.methods.placeBatchBetsWithToken(guesses, amountsInWei, digits).send({
          from: accounts[0],
          gas: estimatedGas,
          
      });

       this.setState({ messageForm: "Bets submited successfully." });
      } catch (error) {
        console.error(`Failed to Draw` + error);
  if (error.message.includes("Draw time has passed")) {
    this.setState({ messageForm: "Error: Bet time has passed, Please Draw result First" });
  } else {
    this.setState({ messageForm: "Error: " + error.message });
  }
      }
    } else {
      this.setState({ messageForm: "Please connect your wallet!" });
      return;
    }  
  };

  draw = async () => {
    const accounts = await web3.eth.getAccounts();

    try {
        const estimatedGas = await this.state.lotto4DContract.methods.draw().estimateGas({
            from: accounts[0],
        });
        this.setState({ message: "Estimated gas: " + estimatedGas + ". Waiting for transaction..." });

        await this.state.lotto4DContract.methods.draw().send({
            from: accounts[0],
            gas: web3.utils.toHex(estimatedGas),
        });
        this.setState({ message: "Draw completed successfully" });
    } catch (error) {

    if (error.message.includes("Draw time has not passed yet")) {
      this.setState({ message: "Please wait countdown time draw reached zero"});
    } else {
     this.setState({ message: "Error:  Draw failed "});
     console.error(`Failed to Draw` + error);
    }
      }
  };

  render() {
        const { loading, betHistory, currentPage, itemsPerPage, drawResultHistorys, currentPageDrawResults, itemsPerPageDrawResults, } = this.state;
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = betHistory.slice(indexOfFirstItem, indexOfLastItem);
        const indexOfLastDrawResult = currentPageDrawResults * itemsPerPageDrawResults;
        const indexOfFirstDrawResult = indexOfLastDrawResult - itemsPerPageDrawResults;
        const currentDrawResults = drawResultHistorys.slice(indexOfFirstDrawResult, indexOfLastDrawResult);

      return (
        <div>
          {loading ? ( 
            <LoadingScreen />
        ) : (
        <div className="Lottery">
            <div className="App-logo"><img src={logo} alt="Logo" /></div>
              <h1>Lotto 4D Dapp</h1>
            <div className="Lottery-container">
  
              <div className="result-container">
                <p className="details-result">Last Draw Result: </p><hr />
                {this.state.lastDrawResult ? (
                this.state.lastDrawResult.toString().padStart(4, '0').split('').map((digit, index) => (
                <div key={index} className="LotteryBall">
                {digit}
              </div>
                ))
                 ) : (
              <div>Loading Latest Draw Result...</div>
              )}
              </div>
              <div className="details-container">             
              <div className="details">
              <table className="tbackground">
                <tbody>
                <tr>
                  <td>Lotto 4D Pool Balance:</td>
                  <td>{this.state.poolBalance ? this.state.poolBalance : '0'} L4D</td>
                </tr>
                <tr>
                  <td>Total Bets Submited:</td>
                  <td>{this.state.totalBets ? this.state.totalBets.toString() : '0'} Bets</td>
                </tr>
                <tr>
                  <td>Total Amount Bets Placed:</td>
                  <td>{this.state.totalAmount ? this.state.totalAmount : '0'} L4D</td>
                </tr>
                <tr>
                  <td>Last draw time:</td>
                  <td>{new Date(Number(this.state.lastDrawTimestamp) * 1000).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Next draw time:</td>
                  <td>{new Date(Number(this.state.timeUntilNextDraw) * 1000).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Minimum Bet:</td>
                  <td>{this.state.minimumBet} L4D</td>
                </tr>
                <tr>
                  <td>Maximum Bet:</td>
                  <td>{this.state.maximumBet} L4D</td>
                </tr>
                <tr>
                  <td>Draw Time:</td>
                  <td>{this.state.drawTime} seconds</td>
                </tr>
                </tbody>
              </table>
              </div>
              </div>
               
              <hr />
      
              {/* Display the countdown timer */}     
              <CountDownTimer />

              <hr />
      
              <div className="details-container">
            {this.state.isWalletConnected ? (
              <div className="details">
                <table className="tbackground">
                <tbody>
                <tr>
                  <td>Connected Address:</td>
                  <td>{this.state.account ? `${this.state.account}` : 'N/A'}</td>
                </tr>
                <tr>
                  <td>MATIC Balance:</td>
                  <td>{this.state.playerMaticBalance} MATIC</td>
                </tr>
                <tr>
                  <td>L4D Balance:</td>
                  <td>{this.state.playerL4DBalance} L4D</td>
                </tr>
                </tbody>
                </table>
                <button variant="outlined" color="primary" className="form-button" onClick={this.addL4DTokenToWallet}>
                  Add L4D to Wallet
                </button>
                <a href="https://www.pinksale.finance/launchpad/0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2?chain=Matic" target="_blank" rel="noreferrer" variant="outlined" color="primary" className="form-button">Buy L4D</a>

                  <button variant="outlined" color="primary" className="form-button" onClick={this.draw}>
                    Draw
                  </button>

                <button variant="outlined" color="secondary" className="form-button" onClick={this.disconnectWallet}>
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button variant="outlined" color="primary" className="form-button" onClick={this.connectWallet}>
                Connect Wallet
              </button>
            )}
                <h4 className="message">{this.state.message}</h4>  
              </div>
      
              <hr />
              <div className="form-container"> 
 
                <h4>Try your Luck, Place Bets:</h4>
                {this.state.bets.map((bet, index) => (
                <div className="form-input" key={index}>
                <input
                className="BetInput"
                placeholder="Guess Number (00-99) (000-999) (0000-9999)"
                type="number"
                value={bet.guess}
                onChange={(e) => this.handleInputChange(index, "guess", e.target.value)}
                required
                />
                <input
                className="BetInput"
                placeholder="Amount (L4D)"
                type="number"
                step="1"
                min={this.state.minimumBet}
                max={this.state.maximumBet}
                value={bet.amount}
                onChange={(e) => this.handleInputChange(index, "amount", e.target.value)}
                required
                />
                
                <button variant="outlined" color="primary" className="RemoveButton" onClick={() => this.removeRow(index)}>Remove</button>
            </div>
          ))}
          <button variant="outlined" color="primary" className="form-button" onClick={this.addRow}>Add Row</button>
          <button variant="outlined" color="primary" className="form-button" onClick={this.placeBatchBets}>Submit Bets</button>
          <h4 className="message">{this.state.messageForm}</h4>   
              </div>

              <hr />
      
              <div className="form-container">
              <h3>Latest Bet History</h3>
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Guess</th>
              <th>Amount (L4D)</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(currentItems) && currentItems.map((bet, index) => (
              <tr key={index}>
                <td>{bet.player ? `${bet.player.slice(0, 20)}xxxxxxxxxx` : 'N/A'}</td>
                <td>{bet.guess ? bet.guess.toString().padStart(bet.numDigit, '0') : 'N/A'}</td>
                <td>{bet.amount ? web3.utils.fromWei(bet.amount.toString(), 'gwei') : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
                      {/* Pagination controls */}
        <div>
          <button onClick={this.prevPage} disabled={currentPage === 1}>
            Previous Page
          </button>
          <button
            onClick={this.nextPage}
            disabled={indexOfLastItem >= betHistory.length}
          >
            Next Page
          </button>
        </div>
      </div>
              
              <hr />
      
              <div className="form-container">
                <h3>Latest 10 Winner History</h3>
                <table>
                <thead>
                <tr>
                  <th>Address</th>
                  <th>Draw Result</th>
                  <th>Digit</th>
                  <th>Bet (L4D)</th>
                  <th>Win (L4D)</th>
                </tr>
                </thead>
                {this.state.winnerHistory 
        .filter((addressWin) => addressWin && addressWin !== '0x0000000000000000000000000000000000000000') // Filter out empty and zero addresses
        .slice(-10) // Display only the last 10 winners
        .map((addressWin, index) => (
          <tr key={index}>
            <td>{addressWin.addressWin ? `${addressWin.addressWin.slice(0, 10)}xxxxxxxxxx` : 'N/A'}</td>
            <td>{addressWin.drawNum ? addressWin.drawNum.toString().padStart(4, '0') : 'N/A'}</td>
            <td>{addressWin.digit ? addressWin.digit.toString() : 'N/A'}</td>
            <td>{addressWin.betAmount ? addressWin.betAmount.toString() : 'N/A'}</td>
            <td>{addressWin.winAmount ? web3.utils.fromWei(addressWin.winAmount.toString(), 'gwei') : 'N/A'}</td>
          </tr>
        ))}
                </table>
              </div>

              <div className="form-container">
                <h3>Draw Result History</h3>
                  <table>
                  <thead>
                    <tr>
                      <th>Draw Result</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDrawResults.map((result, index) => (
                      <tr key={index}>
                        <td>{result.result ? result.result.toString().padStart(4, '0') : 'N/A'}</td>
                        <td>
                          {result.timestamp
                            ? new Date(Number(result.timestamp) * 1000).toLocaleString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination controls for Draw Result History */}
                <div>
                  <button
                    onClick={this.prevPageDrawResults}
                    disabled={currentPageDrawResults === 1}
                  >
                    Previous Page
                  </button>
                  <button
                    onClick={this.nextPageDrawResults}
                    disabled={indexOfLastDrawResult >= drawResultHistorys.length}
                  >
                    Next Page
                  </button>
                </div>
              </div>

              <hr />
              <div className="details-container">             
                <div className="about">
              
                <h3>What's Lotto 4 Digit?</h3>
                <p>Lotto 4 Digit is similar to the Singapore lottery. Betting numbers from 2 digit, 3 digit and 4 digit. Lotto 4 Digit is an open-source project and built on blockchain technology, making it secure, decentralized, anonymous, transparent draw result, and 100% fair.</p>

                <h3>Open Source And Secure</h3>
                <p>Our commitment to open source means that our codebase is accessible to everyone, fostering transparency and collaboration within the community. Also we prioritize security and ensure that your data and transactions are protected at all times.</p>

                <h3>No KYC, Anonymous And Decentralized</h3>
                <p>We respect your privacy. There's no need for user registration, KYC checks, or depositing funds. Simply connect your wallet and start placing bets securely. When you connect your wallet and engage with our platform, you can do so anonymously, without revealing personal information. Decentralized platfrom, Anyone can Draw result after count down timer reached zero, any rewards you win will be sent directly to your wallet</p>

                <h3>Transparent And 100% Fair</h3>
                <p>Our draw results are generated using random blockchain algorithms and displayed publicly in our smart contracts. You can trust that every draw is completely fair and random.</p>

                <h3>Win rate payout:</h3>
                <p>2 Digit Number = Amount Bet x 70.</p>
                <p>3 Digit Number = Amount Bet x 350.</p>
                <p>4 Digit Number = Amount Bet x 4000.</p>

                <hr />

                <h3>Token Detials</h3>

                <table className="tbackground">
                <tbody>
                <tr>
                  <td>Token Name:</td>
                  <td> Lotto 4 Digit</td>
                  </tr>
                <tr>
                  <td>Token Symbol:</td>
                  <td> L4D</td>
                  </tr>
                <tr>
                  <td>Token Decimal:</td>
                  <td> 9</td>
                  </tr>
                <tr>
                  <td>Network:</td>
                  <td> Polygon</td>
                  </tr>
                <tr>
                  <td>Total Supply:</td>
                  <td> 10,000,000 L4D</td>
                  </tr>
                <tr>
                  <td>Total Maximum Supply:</td>
                  <td> 10.000.000 L4D</td>
                  </tr>
                <tr>
                  <td>ICO Token:</td>
                  <td> 9,000,000 L4D (90%)</td>
                  </tr>
                <tr>
                  <td>Initial Lotto 4D Pool Balance:</td>
                  <td> 1,000,000 L4D (10%)</td>
                </tr>
                </tbody>
                </table>

                <p>ICO For Early Investor Price: 1 MATIC = 5 L4D</p>
                <p>ICO Sold 100% For Liquility Pool, Unsold L4D Token Accumulate To Lotto 4D Pool Balance</p>
                <p>ICO Start At 02 Nov 2023 - 09 Nov 2023</p>
                <p>Buy ICO At Pinksale.finance: 
                <a href="https://www.pinksale.finance/launchpad/0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2?chain=Matic" target="_blank" rel="noreferrer" className="form-button">Buy</a>
                </p>

                <hr />

                <h3>Feedback, Support and Bug Reports</h3>
                <p>If you have any feedback, need support, or want to report bugs, please don't hesitate to mail us at support@lotto4d.app or reach out on our Telegram channel. We are always happy to hear from our players and strive to improve the experience for everyone.</p>
               
            </div>
              </div>
          
            </div>
            <div className="footer-container">
            <div className="social-icons">
                <a href="https://t.me/lotto4digit" target="_blank" rel="noreferrer"><img src={telegram} alt="telegram" className="footer-socials" /></a> 
                <a href="https://github.com/BTCincarnation/Lotto4d-SmartContract" target="_blank" rel="noreferrer"><img src={github} alt="github" className="footer-socials" /></a>
            </div>
          
            <div className="footer-text">
              <p>Contract:
              <a href="https://polygonscan.com/address/0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2" target="_blank" rel="noreferrer">0x07E78d26FCfF2E3bcAb75AB2cCaA7AFD5E84cEe2</a> 
              </p><br />
              <p>Copyright © 2023 Lotto4d.app</p>
            </div> 
          </div>
        </div>
          )}
        </div>
      );
      
  }
}

export default App;

