"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { sendMessage, listenForMessages } from "@/lib/firebase";
import ContractABI from "@/abis/DutchAuctionNFT.json";
import ERC20_ABI from "@/abis/ERC20.json";
import affiliateAbiRaw from "@/abis/AffiliateTracker.json";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { Fireworks } from "@fireworks-js/react";
import { useCallback } from "react";
import Image from "next/image";

const CONTRACT_ADDRESS = "0xf5A1188a656c392B9f5b26dC47f6ecE5f0cB8B3C";
const AFFILIATE_CONTRACT_ADDRESS = "0x572d382A8F359a5044376bE788052B121DDeD5A1";

const affiliateAbi = affiliateAbiRaw.abi;

type Countdown = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null;

declare global {
  interface Window {
    affiliateContract: ethers.Contract | null;
  }
}

export default function Home() {
  const [showVideo, setShowVideo] = useState(false);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [whitelistStartTime, setWhitelistStartTime] = useState<Date | null>(
    null
  );
  const [whitelistEndTime, setWhitelistEndTime] = useState<Date | null>(null);
  const [whitelistCountdown, setWhitelistCountdown] =
    useState<Countdown | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  type ChatMessage = {
    username: string;
    message: string;
    color?: string; // Assuming color might be optional
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState(""); // For the user’s name
  const [newMessage, setNewMessage] = useState(""); // For the message input
  const [usernameColor, setUsernameColor] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(false); // Track if listener has been set up
  const [walletAddress, setWalletAddress] = useState("");
  const [mintingStatus, setMintingStatus] = useState<string | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>(""); // Track user's choice
  const [auctionPrice, setAuctionPrice] = useState<bigint | null>(null);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [swiperHeight, setSwiperHeight] = useState("h-64"); // Default height for monitors
  const imageRef = useRef<HTMLImageElement>(null); // Ref to track image height
  const [whitelistMinted, setWhitelistMinted] = useState<bigint | null>(null);
  const [lastPriceRefresh, setLastPriceRefresh] = useState<number>(0);
  const [canRefreshPrice, setCanRefreshPrice] = useState<boolean>(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [totalMintCost, setTotalMintCost] = useState<bigint | null>(null);
  const [affiliateEarnings, setAffiliateEarnings] = useState(BigInt(0));
  const [remainingSupply, setRemainingSupply] = useState<number | null>(null);
  const [topAffiliates, setTopAffiliates] = useState<
    { address: string; mints: number }[]
  >([]);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [glowEffect] = useState(false);
  const [successMessage] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const tokenAddresses: Record<string, string> = {
    ANDY: "0x68BbEd6A47194EFf1CF514B50Ea91895597fc91E",
    WOLF: "0x67466BE17df832165F8C80a5A120CCc652bD7E69",
    PEPE: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  };
  const sampleImages = [
    "/images/a1.webp",
    "/images/a2.webp",
    "/images/a3.webp",
    "/images/a4.webp",
    "/images/a5.webp",
    "/images/a6.webp",
    "/images/a7.webp",
    "/images/a8.webp",
    "/images/a9.webp",
    "/images/a10.webp",
    "/images/a11.webp",
    "/images/a12.webp",
    "/images/a13.webp",
    "/images/a14.webp",
    "/images/a15.webp",
    "/images/a16.webp",
    "/images/a18.webp",
    "/images/a19.webp",
    "/images/a20.webp",
    "/images/a21.webp",
    "/images/a22.webp",
    "/images/a23.webp",
    "/images/a24.webp",
    "/images/a25.webp",
    "/images/a26.webp",
    "/images/a27.webp",
    "/images/a28.webp",
    "/images/a29.webp",
    "/images/a30.webp",
    "/images/a31.webp",
    "/images/a32.webp",
    "/images/a33.webp",
    "/images/a34.webp",
    "/images/a35.webp",
    "/images/a36.webp",
    "/images/a37.webp",
    "/images/a38.webp",
    "/images/a39.webp",
    "/images/a40.webp",
    "/images/a41.webp",
    "/images/a42.webp",
    "/images/a43.webp",
    "/images/a44.webp",
    "/images/a45.webp",
    "/images/a46.webp",
    "/images/a47.webp",
    "/images/a48.webp",
    "/images/a49.webp",
    "/images/a50.webp",
    "/images/a51.webp",
    "/images/a52.webp",
    "/images/a53.webp",
  ];

  useEffect(() => {
    if (!signer) return; //  Only initialize contract when signer is available

    const contractInstance = new ethers.Contract(
      CONTRACT_ADDRESS,
      ContractABI.abi,
      signer
    );
    setContract(contractInstance);
  }, [signer]); //  This ensures the contract initializes when signer updates

  // Affiliate Contract State
  const [affiliateContract, setAffiliateContract] =
    useState<ethers.Contract | null>(null);

  //  Initialize Contracts
  const initializeContracts = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      console.warn("🚨 Ethereum Wallet is not installed or not available.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);

      // ✅ Explicitly type `accounts` to avoid errors
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[] | null;

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]); //  No more TypeScript error
        console.log("✅ Wallet connected:", accounts[0]);
      } else {
        console.warn("🚨 No Ethereum Wallet Account connected.");
      }

      // Initialize Main Contract
      const mainContractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        ContractABI.abi,
        signerInstance
      );
      setContract(mainContractInstance);
      console.log(
        "✅ NFT Contract initialized with address:",
        mainContractInstance.target
      );

      // ✅ Initialize Affiliate Contract
      const affContractInstance = new ethers.Contract(
        AFFILIATE_CONTRACT_ADDRESS,
        affiliateAbi,
        signerInstance
      );
      setAffiliateContract(affContractInstance);
      console.log(
        "✅ Affiliate Contract initialized with address:",
        affContractInstance.target
      );
    } catch (error) {
      console.error("❌ Error initializing contracts:", error);
    }
  };

  useEffect(() => {
    initializeContracts(); // Calls the function on page load
  }, []);

  //get the reamining supply to show haha
  const fetchRemainingSupply = useCallback(async () => {
    if (!contract) return;

    try {
      const totalSupply: bigint = await contract.totalSupply();
      const maxSupply: bigint = await contract.maxSupply();
      // Use the hardcoded constant value since EXOTIC_RESERVE isn't accessible.
      const exoticReserve: bigint = 4n;

      console.log("Total Supply:", totalSupply.toString());
      console.log("Max Supply:", maxSupply.toString());
      console.log("Exotic Reserve:", exoticReserve.toString());

      // Calculate remaining supply and ensure it's not less than 0.
      const remaining = Math.max(
        0,
        Number(maxSupply) - Number(totalSupply) - Number(exoticReserve)
      );
      setRemainingSupply(remaining);
      console.log(`✅ Remaining Supply: ${remaining} NFTs`);
    } catch (error) {
      console.error("❌ Error fetching remaining supply:", error);
    }
  }, [contract]);

  useEffect(() => {
    if (contract) {
      fetchRemainingSupply();
    }
  }, [contract, fetchRemainingSupply, mintSuccess]); // Also update after a successful mint!

  useEffect(() => {
    if (contract) {
      fetchRemainingSupply();
    }
  }, [contract, fetchRemainingSupply, mintSuccess]); // Also update after a successful mint!

  useEffect(() => {
    if (!whitelistEndTime) return; // Ensure we have a valid end time

    const updateCountdown = () => {
      setWhitelistCountdown(calculateTimeLeft(whitelistEndTime));
    };

    // Update immediately and then every second
    updateCountdown();
    const interval = setInterval(updateCountdown, 500);

    return () => clearInterval(interval); // Cleanup when component unmounts
  }, [whitelistEndTime]); // Runs when whitelistEndTime updates

  // affiliate shit
  const fetchAffiliateEarnings = useCallback(async () => {
    console.log("🔍 Entered fetchAffiliateEarnings function...");

    if (!affiliateContract) {
      console.warn("🚨 affiliateContract is NOT initialized!");
      return;
    }

    if (!walletAddress) {
      console.warn("🚨 Wallet address is missing!");
      return;
    }

    try {
      console.log("🔹 Calling getAffiliateEarnings for:", walletAddress);

      const earnings = await affiliateContract.getAffiliateEarnings(
        walletAddress
      );
      console.log(
        "💰 Raw Earnings Data from Contract (before conversion):",
        earnings.toString()
      );

      setAffiliateEarnings(BigInt(earnings));
      console.log(
        `✅ Fetched affiliate earnings: ${ethers.formatEther(earnings)} ETH`
      );
    } catch (error) {
      console.error("❌ Error fetching affiliate earnings:", error);
    }
  }, [walletAddress, affiliateContract]); //  Now React sees this as the same function unless dependencies change

  useEffect(() => {
    console.log(
      "🔍 useEffect triggered! Checking walletAddress & affiliateContract..."
    );

    if (!walletAddress) {
      console.warn("⚠️ No wallet address found, skipping fetch.");
      return;
    }

    if (!affiliateContract) {
      console.warn("⚠️ No affiliate contract found, skipping fetch.");
      return;
    }

    console.log("✅ Fetching affiliate earnings now...");
    fetchAffiliateEarnings();
  }, [walletAddress, affiliateContract, fetchAffiliateEarnings]); //  Now it only runs when dependencies change

  const withdrawEarnings = async () => {
    if (!window.ethereum) {
      alert("❌ Ethereum Wallet is required!");
      return;
    }

    if (!contract) {
      alert("❌ NFT contract not initialized.");
      return;
    }

    try {
      console.log(`🚀 Withdrawing earnings for wallet: ${walletAddress}`);

      // Call withdraw from the main contract
      const tx: ethers.TransactionResponse = await (
        contract as unknown as {
          withdrawAffiliateEarnings: () => Promise<ethers.TransactionResponse>;
        }
      ).withdrawAffiliateEarnings();

      console.log("🚀 Transaction sent:", tx.hash);

      setMintingStatus(
        `⏳ Transaction Pending: ${tx.hash.substring(0, 10)}...`
      );

      await tx.wait();
      console.log(" Withdrawal Successful!");
      setMintingStatus(" Affiliate Earnings Withdrawn!");

      fetchAffiliateEarnings(); //  Update earnings balance after withdrawal
    } catch (error) {
      console.error("❌ Withdrawal failed:", error);
      alert("❌ Withdrawal failed. Try again.");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get("ref");

    if (referrer) {
      console.log(`🔗 Referral detected! Affiliate Wallet: ${referrer}`);
    }
  }, []);

  // this is for the check prices
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastPriceRefresh >= 10_000) {
        setCanRefreshPrice(true);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval); // Cleanup when component unmounts
  }, [lastPriceRefresh]); // Runs every time `lastPriceRefresh` changes

  // for displaying the to affiliates
  const fetchTopAffiliates = useCallback(async () => {
    if (!affiliateContract) {
      console.warn("🚨 Affiliate contract not initialized.");
      return;
    }

    try {
      console.log("🔹 Fetching top affiliates...");

      const topAddresses = await affiliateContract.getTopAffiliates();
      console.log("🏆 Raw Affiliate Addresses:", topAddresses);

      const affiliatesData = await Promise.all(
        topAddresses.map(async (address: string) => {
          if (ethers.isAddress(address) && address !== ethers.ZeroAddress) {
            const mintCount = await affiliateContract.affiliateMintCount(
              address
            );
            return { address, mints: Number(mintCount) };
          }
          return null;
        })
      );

      const filteredAffiliates = affiliatesData.filter((aff) => aff !== null);
      filteredAffiliates.sort((a, b) => b.mints - a.mints);

      setTopAffiliates(filteredAffiliates);
    } catch (error) {
      console.error("❌ Error fetching top affiliates:", error);
    }
  }, [affiliateContract]); //  Now it only changes when `affiliateContract` changes

  useEffect(() => {
    if (affiliateContract) {
      fetchTopAffiliates();
    }
  }, [affiliateContract, fetchTopAffiliates]); //

  const verifyWhitelist = async (tokenName: string) => {
    if (!walletAddress) {
      setErrorMessage("❌ Connect wallet first!");
      return;
    }

    if (!window.ethereum) {
      console.error("🚨 No Ethereum provider found!");
      setErrorMessage(
        "Ethereum Wallet is required to verify whitelist status."
      );
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(
        window.ethereum as unknown as ethers.Eip1193Provider
      );
      const signer = await provider.getSigner();

      const tokenAddress = tokenAddresses[tokenName];

      if (!tokenAddress) {
        setErrorMessage("❌ Invalid token selection.");
        return;
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        signer
      );

      const userBalance = await tokenContract.balanceOf(walletAddress);

      // ✅ Different verification requirements for each token
      let requiredAmount: bigint;
      switch (tokenName) {
        case "ANDY":
          requiredAmount = ethers.parseUnits("30000000", 18); // 1 ANDY required
          break;
        case "WOLF":
          requiredAmount = ethers.parseUnits("40000000", 18); // 5 WOLF required
          break;
        case "PEPE":
          requiredAmount = ethers.parseUnits("200000000", 18); // 10 PEPE required
          break;
        default:
          setErrorMessage("❌ Unsupported token.");
          return;
      }

      console.log(
        `🔹 ${tokenName} balance: ${userBalance.toString()} | Required: ${requiredAmount.toString()}`
      );

      if (BigInt(userBalance.toString()) >= requiredAmount) {
        const verificationData = {
          token: tokenName,
          timestamp: Date.now(),
        };
        localStorage.setItem("verifiedToken", JSON.stringify(verificationData));

        setVerifiedToken(tokenName); // ✅ Show success message
        setErrorMessage(null); // Clear any previous error
        console.log(`✅ Verified with ${tokenName}`);
      } else {
        setVerifiedToken(null); // Ensure success message is not shown
        setErrorMessage(
          `❌ You need at least ${ethers.formatUnits(
            requiredAmount,
            18
          )} ${tokenName} to verify.`
        );
      }
    } catch (error) {
      console.error("❌ Error verifying whitelist:", error);
      setErrorMessage(
        "❌ An error occurred during verification. Please try again."
      );
    }
  };

  // Define `fetchPrices` outside of useEffect so it's reusable
  const fetchPrices = useCallback(async () => {
    if (!contract) return;

    try {
      console.log("🔄 Fetching mint prices...");

      const auctionStartTime = await contract.auctionStartTime();
      const currentTime = Math.floor(Date.now() / 1000);

      console.log("📅 Auction Start Time:", auctionStartTime.toString());
      console.log("⏳ Current Time:", currentTime);

      if (new Date() < (whitelistEndTime ?? new Date(0))) {
        console.log("🔹 Fetching whitelist price...");

        const minted = await contract.whitelistMinted();
        setWhitelistMinted(minted);
        console.log("🔢 Whitelist Minted Count:", minted.toString());

        const tierIndex = Math.floor(Number(minted) / 250);
        console.log("🎯 Calculated Whitelist Tier:", tierIndex);

        setAuctionPrice(BigInt(0)); // Reset auction price
      } else if (auctionStartTime > 0 && currentTime >= auctionStartTime) {
        console.log("🔹 Fetching auction price...");

        const aucPrice = await contract.getCurrentPrice();
        setAuctionPrice(aucPrice);

        console.log(
          `✅ Updated Auction Price: ${ethers.formatEther(aucPrice)} ETH`
        );
      } else {
        console.warn(
          "🚨 Auction has not started yet. Skipping auction price fetch."
        );
        setAuctionPrice(BigInt(0));
      }
    } catch (error) {
      console.error("❌ Error fetching prices:", error);
    }
  }, [contract, whitelistEndTime]); // ✅ Dependencies stay here

  //  Now useEffect won't complain anymore
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleMintQuantityChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value) || 1;
    setMintQuantity(Math.max(1, Math.min(500, value))); // Ensure mint quantity stays within valid range
  };

  //refresh the price
  const handleRefreshPrice = () => {
    const now = Date.now();

    if (!canRefreshPrice) {
      setRefreshError("❌ Please wait 10s before refreshing.");
      setTimeout(() => setRefreshError(null), 2000);
      return;
    }

    setRefreshError(null);
    setLastPriceRefresh(now);
    setCanRefreshPrice(false); // Disable the button immediately
    console.log("🔄 Refreshing price...");
    fetchPrices();
  };

  useEffect(() => {
    const storedData = localStorage.getItem("verifiedToken");
    if (storedData) {
      const { token, timestamp } = JSON.parse(storedData);

      // Check if it's still valid (1 hour = 3600000 ms)
      if (Date.now() - timestamp < 3600000) {
        setVerifiedToken(token);
      } else {
        localStorage.removeItem("verifiedToken"); // Expired, remove it
      }
    }
  }, []);

  useEffect(() => {
    // Check sessionStorage to see if the video has been played
    const videoPlayed = sessionStorage.getItem("videoPlayed");
    if (!videoPlayed) {
      setShowVideo(true);
      sessionStorage.setItem("videoPlayed", "true");
    }
  }, []); // Only run this on the initial render

  useEffect(() => {
    const storedToken = sessionStorage.getItem("verifiedToken");
    if (storedToken) {
      setVerifiedToken(storedToken);
    }
  }, []);

  // Contract Initialization and Wallet Connection
  useEffect(() => {
    const initializeContract = async () => {
      if (!window.ethereum) {
        console.warn("🚨 Ethereum Wallet is not installed!");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 🔹 Fetch connected accounts safely
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[] | null;

        if (!accounts || accounts.length === 0) {
          console.warn(
            "🚨 No Ethereum Wallet account connected. Waiting for connection..."
          );
          return;
        }

        // 🔹 Safely set the wallet address
        setWalletAddress(accounts[0] || "");
        console.log("✅ Wallet connected:", accounts[0]);

        // 🔹 Initialize Contract
        const signer = await provider.getSigner();
        const newContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ContractABI.abi,
          signer
        );
        setContract(newContract);
        console.log(
          "✅ Contract initialized with address:",
          newContract.target
        );
      } catch (error) {
        console.error("❌ Error initializing contract:", error);
      }
    };

    initializeContract();

    // 🔹 Listen for wallet account changes
    window.ethereum?.on("accountsChanged", (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        console.log("🔄 Wallet changed:", accounts[0]);
        setWalletAddress(accounts[0] as string);
      } else {
        setWalletAddress("");
      }
    });
  }, []);

  useEffect(() => {
    if (isVideoPlaying) {
      const videoDuration = 23; // Time in seconds before the video closes (adjust as needed)
      const autoCloseTimer = setTimeout(() => {
        const videoElement = document.getElementById(
          "intro-video"
        ) as HTMLVideoElement;
        const audioElement = document.getElementById(
          "audio-playback"
        ) as HTMLAudioElement;
        if (videoElement && audioElement) {
          audioElement.currentTime = videoElement.currentTime; // Sync audio with video
          audioElement.play(); // Play audio from the same position
          videoElement.style.display = "none"; // Hide the video
        }
        setShowVideo(false); // Close the popup
        setIsVideoPlaying(false); // Reset playback state
      }, videoDuration * 1000); // Convert seconds to milliseconds

      return () => clearTimeout(autoCloseTimer); // Cleanup the timer if the component unmounts
    }
  }, [isVideoPlaying]);

  // Generate a random color for the username
  useEffect(() => {
    setUsernameColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`); // Random hex color
  }, []);

  // Scroll to the bottom whenever messages change
  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom(); // Call when `messages` changes
  }, [messages]);

  useEffect(() => {
    if (!messagesRef.current) {
      listenForMessages((fetchedMessages) => {
        setMessages(fetchedMessages);
      });
      messagesRef.current = true; // Mark listener as initialized
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = () => {
    if (newMessage.trim() && username) {
      sendMessage(username, newMessage.trim(), usernameColor);
      setNewMessage("");
    }
  };

  // update the height of the swiper carousel based on the screen width
  useEffect(() => {
    const updateHeight = () => {
      if (imageRef.current) {
        const imageHeight = imageRef.current.clientHeight; // Get the height of the image
        setSwiperHeight(`${imageHeight}px`); // Set the Swiper container's height to match
      }
    };

    updateHeight(); // Set height on initial load
    window.addEventListener("resize", updateHeight); // Listen for screen changes

    return () => window.removeEventListener("resize", updateHeight); // Cleanup listener
  }, []);

  const triggerSuccessEffects = () => {
    // 🎉 Show Confetti
    setMintSuccess(true);

    // ⚡ Quick Flash Effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    // On successful mint:
    setShowFireworks(true);
    setTimeout(() => {
      setShowFireworks(false);
    }, 8000);

    // ⏳ Hide all effects after 8 seconds
    setTimeout(() => {
      setMintSuccess(false);
      setShowFireworks(false);
    }, 8000);
  };

  //contract initializtion before we go and get times
  useEffect(() => {
    if (!contract) {
      console.warn(
        "⏳ Waiting for contract to be initialized before fetching sale times..."
      );
      return;
    }

    const fetchSaleTimes = async () => {
      try {
        console.log("🔍 Fetching sale times from contract...");

        // Fetch times from the contract
        const whitelistStart = await contract.whitelistStartTime();
        const whitelistEnd = await contract.whitelistEndTime();
        const publicMintStart = await contract.publicMintStartTime();

        // Convert BigNumber to numbers
        const whitelistStartTimeValue = Number(whitelistStart);
        const whitelistEndTimeValue = Number(whitelistEnd);
        const publicMintStartTimeValue = Number(publicMintStart);

        // Log raw values from contract
        console.log("✅ Raw Values from Contract:");
        console.log("   🕒 Whitelist Start (BigNumber):", whitelistStart);
        console.log("   🕒 Whitelist End (BigNumber):", whitelistEnd);
        console.log("   🕒 Public Mint Start (BigNumber):", publicMintStart);

        // Log converted values
        console.log("✅ Converted Timestamps:");
        console.log(
          "   📅 Whitelist Start:",
          new Date(whitelistStartTimeValue * 1000)
        );
        console.log(
          "   📅 Whitelist End:",
          new Date(whitelistEndTimeValue * 1000)
        );
        console.log(
          "   📅 Public Mint Start:",
          new Date(publicMintStartTimeValue * 1000)
        );

        // Set states
        setWhitelistStartTime(new Date(whitelistStartTimeValue * 1000));
        setWhitelistEndTime(new Date(whitelistEndTimeValue * 1000));
      } catch (error) {
        console.error("❌ Error fetching sale times:", error);
      }
    };

    fetchSaleTimes();
  }, [contract]); // Only runs when contract is set

  function calculateTimeLeft(targetDate: Date): Countdown {
    const now = new Date();
    const difference = +targetDate - +now;

    if (difference <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      total: difference,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  // Get white list mint price
  const calculateWhitelistCost = useCallback(
    async (quantity: number) => {
      if (!contract || !whitelistEndTime || whitelistEndTime <= new Date()) {
        console.log("❌ Whitelist is over. No cost calculation needed.");
        return BigInt(0);
      }

      try {
        let currentMinted = await contract.whitelistMinted(); // Get the number of NFTs already minted
        console.log(
          "🔹 Currently Minted in Whitelist:",
          currentMinted.toString()
        );

        let totalCost = BigInt(0);
        let mintsRemaining = quantity;
        let currentTierIndex = Math.floor(Number(currentMinted) / 100); // Get the current tier index

        while (mintsRemaining > 0) {
          const remainingInCurrentTier = 100 - (Number(currentMinted) % 100); // NFTs left at current price tier
          const mintInThisTier = Math.min(
            mintsRemaining,
            remainingInCurrentTier
          ); // How many will mint at this price

          totalCost +=
            BigInt(mintInThisTier) *
            BigInt(await contract.whitelistPrices(currentTierIndex)); // Calculate cost for this tier

          mintsRemaining -= mintInThisTier;
          currentMinted += BigInt(mintInThisTier);
          currentTierIndex = Math.floor(Number(currentMinted) / 100); // Move to next tier if necessary
        }

        return totalCost;
      } catch (error) {
        console.error("❌ Error calculating whitelist cost:", error);
        return BigInt(0);
      }
    },
    [contract, whitelistEndTime] //  Dependencies included
  );

  // Fetch Total Mint Cost for a white list mint
  const fetchTotalMintCost = useCallback(async () => {
    if (!contract || mintQuantity <= 0) return;

    try {
      const cost = await calculateWhitelistCost(mintQuantity);
      console.log(
        `💰 Calculated Total Mint Cost: ${ethers.formatEther(cost)} ETH`
      );
      setTotalMintCost(cost);
    } catch (error) {
      console.error("❌ Error fetching mint cost:", error);
      setTotalMintCost(null);
    }
  }, [contract, mintQuantity, calculateWhitelistCost]); //  Added `calculateWhitelistCost`

  //  Now no warning, and React knows all dependencies
  useEffect(() => {
    fetchTotalMintCost();
  }, [mintQuantity, whitelistMinted, fetchTotalMintCost]);

  const handleWhitelistMint = async () => {
    if (!walletAddress) {
      alert("❌ Please connect your wallet first!");
      return;
    }

    if (!contract) {
      alert("❌ Contract not initialized!");
      return;
    }

    if (!selectedToken) {
      alert("❌ Please select a token for whitelist verification.");
      return;
    }

    try {
      console.log("🔍 Checking whitelist eligibility...");

      if (!whitelistStartTime || !whitelistEndTime) {
        alert("❌ Whitelist sale times not set.");
        return;
      }

      if (new Date() < whitelistStartTime) {
        alert("❌ Whitelist sale has not started yet.");
        return;
      }

      if (new Date() > whitelistEndTime) {
        alert("❌ Whitelist sale has ended.");
        return;
      }

      const whitelistTokenAddress = tokenAddresses[selectedToken];

      if (!whitelistTokenAddress) {
        alert("❌ Invalid token selection.");
        return;
      }

      // 🔹 Check if the user is whitelisted
      const response = await contract.checkWhitelist(
        walletAddress,
        whitelistTokenAddress
      );

      if (typeof response === "boolean") {
        if (!response) {
          alert("❌ You are not eligible for the whitelist mint.");
          return;
        }
        console.log("✅ Whitelist verified (boolean-based checkWhitelist)");
      } else if (Array.isArray(response) && response.length === 2) {
        const [userBalance, requiredAmount] = response.map(BigInt);
        console.log(
          "🔍 checkWhitelist() returned:",
          userBalance.toString(),
          requiredAmount.toString()
        );

        if (userBalance < requiredAmount) {
          alert("❌ You are not eligible for the whitelist mint.");
          return;
        }
      } else {
        console.error("❌ Unexpected response from checkWhitelist:", response);
        alert("❌ Error verifying whitelist eligibility.");
        return;
      }

      console.log(`✅ ${selectedToken} whitelist verification successful.`);
      setMintingStatus("Minting in progress...");

      // 🔹 Get the current whitelist mint count
      let currentMinted = await contract.whitelistMinted();
      console.log(
        "🔹 Currently Minted in Whitelist:",
        currentMinted.toString()
      );

      // 🔹 Check if there is enough whitelist supply left
      const whitelistSupplyLeft =
        Number(await contract.WHITELIST_SUPPLY()) - Number(currentMinted);

      if (mintQuantity > whitelistSupplyLeft) {
        alert(
          `❌ Not enough whitelist supply left! Only ${whitelistSupplyLeft} NFTs are available.`
        );
        return;
      }

      let totalCost = BigInt(0);
      let mintsRemaining = mintQuantity;
      let currentTierIndex = Math.floor(Number(currentMinted) / 100); // Get the current tier index

      while (mintsRemaining > 0) {
        const remainingInCurrentTier = 100 - (Number(currentMinted) % 100);
        const mintInThisTier = Math.min(mintsRemaining, remainingInCurrentTier);

        const tierPrice = await contract.whitelistPrices(currentTierIndex);
        totalCost += BigInt(mintInThisTier) * BigInt(tierPrice);

        mintsRemaining -= mintInThisTier;
        currentMinted = BigInt(Number(currentMinted) + mintInThisTier);
        currentTierIndex = Math.floor(Number(currentMinted) / 100);
      }

      console.log(
        `💰 Total cost for ${mintQuantity} NFTs: ${ethers.formatEther(
          totalCost
        )} ETH`
      );

      // Proceed with the transaction if all checks are passed
      const tx = await contract.whitelistMint(
        mintQuantity,
        whitelistTokenAddress,
        {
          value: totalCost,
        }
      );

      console.log("⏳ Transaction sent, waiting for confirmation...");
      await tx.wait();
      console.log("✅ Transaction confirmed!");

      setMintingStatus("Mint successful! 🎉🎉");

      triggerSuccessEffects();
    } catch (error: unknown) {
      console.error("❌ Error during whitelist mint:", error);

      if (error instanceof Error) {
        if (error.message.includes("ExceedsWhitelistSupply")) {
          alert("❌ Transaction failed: Not enough whitelist supply left!");
        } else if (error.message.includes("InsufficientPayment")) {
          alert("❌ Transaction failed: Not enough ETH sent.");
        } else {
          alert("❌ Transaction failed. Please check the console for details.");
        }
      } else {
        alert("❌ An unknown error occurred.");
      }

      setMintingStatus("Mint failed.");
    }
  };

  //  HANDLE PUBLIC MINT FUNCTION (With Affiliate Tracking)
  const handlePublicMint = async () => {
    console.log("🚀 Public Mint Button Clicked!");

    if (!window.ethereum) {
      alert("❌ Ethereum Wallet is required!");
      return;
    }

    try {
      // 🔹 Fetch connected accounts safely
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[] | null;

      if (!accounts || accounts.length === 0) {
        alert("❌ Please connect your wallet!");
        return;
      }

      // 🔹 Set wallet address safely
      const currentWallet = accounts[0] ?? "";
      console.log("🔍 Using wallet:", currentWallet);

      if (!contract) {
        alert("❌ Contract not initialized!");
        return;
      }

      setMintingStatus("⏳ Minting in progress...");

      // 🔹 Get the current auction price
      const price = await contract.getCurrentPrice();
      console.log(`💰 Current auction price: ${ethers.formatEther(price)} ETH`);

      // 🔹 Check available supply before minting
      const totalSupply = await contract.totalSupply();
      const maxSupply = await contract.maxSupply();
      const exoticReserve = await contract.EXOTIC_RESERVE;
      const remainingSupply =
        Number(maxSupply) - Number(totalSupply) - Number(exoticReserve);

      if (mintQuantity > remainingSupply) {
        alert(
          `❌ Not enough NFTs left! Only ${remainingSupply} are available.`
        );
        return;
      }

      // 🔹 Calculate total cost based on quantity
      let totalCost = price * BigInt(mintQuantity);

      // 🔹 Capture Affiliate Address from URL (if present)
      const urlParams = new URLSearchParams(window.location.search);
      const affiliateAddress =
        urlParams.get("ref") || "0x0000000000000000000000000000000000000000"; // Default to null address if no affiliate

      console.log(`🔗 Affiliate Address Used: ${affiliateAddress}`);

      // 🔹 Apply 5% discount if an affiliate link is used
      if (affiliateAddress !== "0x0000000000000000000000000000000000000000") {
        totalCost = (totalCost * BigInt(95)) / BigInt(100); // Apply 5% discount
        console.log(
          `💸 Affiliate discount applied! New total cost: ${ethers.formatEther(
            totalCost
          )} ETH`
        );
      }

      // Get user's ETH balance
      const userBalanceHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [currentWallet, "latest"],
      });

      // Convert hex string to BigInt
      const userBalanceBigInt = BigInt(userBalanceHex as string);

      if (userBalanceBigInt < totalCost) {
        alert(
          `❌ Not enough ETH! You need at least ${ethers.formatEther(
            totalCost
          )} ETH.`
        );
        return;
      }

      // 🔹 Call batchMint with correct quantity & affiliate address
      const tx = await (
        contract as unknown as {
          batchMint: (
            quantity: number,
            affiliate: string,
            options?: { value: bigint }
          ) => Promise<{
            hash: string;
            wait: () => Promise<ethers.TransactionReceipt>;
          }>;
        }
      ).batchMint(mintQuantity, affiliateAddress, { value: totalCost });

      console.log("🚀 Transaction sent:", tx.hash);
      setMintingStatus(
        `⏳ Transaction Pending: ${tx.hash.substring(0, 10)}...`
      );

      await tx.wait();
      console.log("✅ Public Mint Successful!");
      setMintingStatus(
        `✅ Public Mint Successful! 🎉 You minted ${mintQuantity} NFTs.`
      );

      triggerSuccessEffects();
    } catch (error: unknown) {
      console.error("❌ Public mint failed:", error);

      if (error instanceof Error) {
        if (error.message.includes("NotEnoughPublicSupply")) {
          alert("❌ Transaction failed: Not enough NFTs left.");
        } else if (error.message.includes("InsufficientETH")) {
          alert("❌ Transaction failed: You did not send enough ETH.");
        } else if (error.message.includes("SelfReferralNotAllowed")) {
          alert("❌ Transaction failed: You cannot refer yourself.");
        } else {
          alert("❌ Transaction failed. Please check the console for details.");
        }
      } else {
        alert("❌ An unknown error occurred.");
      }

      setMintingStatus("❌ Public Mint Failed. Try Again.");
    }
  };

  const isWhitelistNotStarted =
    !whitelistStartTime ||
    whitelistStartTime.getTime() === 0 ||
    new Date() < whitelistStartTime;

  return (
    <div
      className="min-h-screen flex flex-col text-white relative"
      style={{
        backgroundImage: `url('/images/BoysClub.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "top center", // Ensures alignment
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed", // Keeps it fixed for a smoother look
        minHeight: "100vh", // Forces it to take full screen height
      }}
    >
      {/* Video Modal */}
      {showVideo && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50"
          style={{ backdropFilter: "blur(8px)" }}
        >
          {/* Container for the video with a smaller size */}
          <div className="relative bg-black rounded-lg p-4 w-[80vw] max-w-[1440px]">
            {/* Video Element */}
            <video
              id="intro-video"
              src="/videos/intro.mp4"
              className="rounded-lg w-full h-auto" // Make the video responsive within the container
              controls={false}
              muted={false} // Ensure audio is enabled, but not autoplayed
              loop={false} // Ensure the video does not loop
              onEnded={() => {
                const audioElement = document.getElementById(
                  "audio-playback"
                ) as HTMLAudioElement;
                if (audioElement) {
                  audioElement.pause(); // Stop audio when video ends
                }
                setShowVideo(false); // Close the popup
              }}
            />

            {/* Play Button */}
            <button
              id="play-button"
              className="absolute flex items-center justify-center text-white bg-gray-600 hover:bg-gray-800 rounded-full w-16 h-16 text-xl font-bold"
              style={{
                zIndex: 10, // Ensure button stays on top
                transform: "translate(-50%, -50%)",
                top: "50%",
                left: "50%",
              }}
              onClick={() => {
                const videoElement = document.getElementById(
                  "intro-video"
                ) as HTMLVideoElement;
                if (videoElement) {
                  videoElement.play();
                  setIsVideoPlaying(true); // Start the auto-close timer when the video plays
                }
                const playButton = document.getElementById("play-button");
                if (playButton) {
                  playButton.style.display = "none"; // Hide the play button after clicking
                }
              }}
            >
              ▶
            </button>

            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-700 rounded-full px-4 py-2"
              onClick={() => {
                const videoElement = document.getElementById(
                  "intro-video"
                ) as HTMLVideoElement;
                const audioElement = document.getElementById(
                  "audio-playback"
                ) as HTMLAudioElement;
                if (videoElement && audioElement) {
                  // Synchronize audio playback with the video's current position
                  audioElement.currentTime = videoElement.currentTime;
                  audioElement.play(); // Play audio from the same position
                }
                if (videoElement) {
                  videoElement.style.display = "none"; // Hide the video
                }
                setShowVideo(false); // Close the popup
              }}
            >
              X
            </button>
          </div>
        </div>
      )}

      {/* Audio Element for Continued Playback */}
      <audio
        id="audio-playback"
        src="/videos/intro.mp4"
        style={{ display: "none" }}
      />

      {/* Mute/Unmute Button */}
      <div className="fixed top-4 right-4 bg-gray-600 text-white rounded-full px-4 py-2 shadow-lg">
        <button
          id="mute-unmute-button"
          onClick={() => {
            const audioElement = document.getElementById(
              "audio-playback"
            ) as HTMLAudioElement;
            const button = document.getElementById(
              "mute-unmute-button"
            ) as HTMLButtonElement;
            if (audioElement && button) {
              audioElement.muted = !audioElement.muted; // Toggle mute state
              button.textContent = audioElement.muted ? "Unmute" : "Mute"; // Update button text
            }
          }}
        >
          Mute
        </button>
      </div>

      {/* Welcome and Minting Section */}
      <div
        className="flex-grow flex flex-col items-center justify-start space-y-6 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
        style={{ marginTop: "40px" }}
      >
        {/* Title - Scales for Different Screen Sizes */}
        <h1
          className="text-center font-modak text-6xl md:text-7xl lg:text-8xl leading-none text-white"
          style={{
            textShadow:
              "3px 3px 0 black, -3px 3px 0 black, 3px -3px 0 black, -3px -3px 0 black",
          }}
        >
          The <span className="text-red-500">B</span>
          <span className="text-green-500">o</span>
          <span className="text-pink-500">y</span>
          <span className="text-blue-500">&apos;</span>
          <span className="text-red-500">s</span>
          <span className="text-green-500"> C</span>
          <span className="text-pink-500">l</span>
          <span className="text-blue-500">u</span>
          <span className="text-red-500">b</span>
          <span className="text-white"> NFT Collection</span>
        </h1>
        <div className="flex items-center justify-center space-x-4">
          {/* Left Side - Etherscan & OpenSea */}
          <div className="flex space-x-3">
            {/* Etherscan */}
            <a
              href="https://sepolia.etherscan.io/address/0xF6bf4c23A3484c0614C48035a811Cc42c41c4b59#code"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/etherscan.jpg"
                alt="Etherscan"
                width={48} // Replace with actual width in pixels
                height={48} // Replace with actual height in pixels
                className="rounded-full border-4 border-white transition-transform duration-200 hover:scale-110"
              />
            </a>
          </div>

          {/* Slogan */}
          <p
            className="text-xl sm:text-2xl md:text-3xl text-white font-modak text-center mx-4"
            style={{
              textShadow:
                "2px 2px 0 black, -2px 2px 0 black, 2px -2px 0 black, -2px -2px 0 black",
            }}
          >
            Because the boys needed some drip.
          </p>

          {/* Right Side - X (Twitter) */}
          {/* Right Side - X (Twitter) and Whitepaper */}
          <div className="flex space-x-4">
            {/* X (Twitter) Logo */}
            <a
              href="https://x.com/theboysclubnft_?s=11"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/X.png"
                alt="X"
                width={48}
                height={48}
                className="rounded-full border-4 border-white transition-transform duration-200 hover:scale-110"
              />
            </a>

            {/* Whitepaper Logo */}
            <a
              href="https://the-boys-club-nft.gitbook.io/the-boys-club-nft" // Replace with actual whitepaper link
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/whitepaper.png" // Replace with actual image file
                alt="Whitepaper"
                width={48}
                height={48}
                className="rounded-full border-4 border-white transition-transform duration-200 hover:scale-110"
              />
            </a>
          </div>
        </div>
        {/* Minting Panel - Adjusts Width for Smaller Screens */}
        <div className="bg-gray-900 bg-opacity-70 p-3 sm:p-4 rounded-lg shadow-lg flex flex-col items-center space-y-3 w-full max-w-[320px] md:max-w-[390px]">
          {/* Token Selection Dropdown - Hides After Whitelist Ends */}
          {!whitelistEndTime || new Date() < whitelistEndTime ? (
            <div className="w-full">
              <label className="text-white text-xs sm:text-sm font-semibold block mb-1">
                Select Whitelist Token:
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full px-2 py-1 sm:px-3 sm:py-2 text-black border border-gray-700 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="">Select Token</option>
                <option value="ANDY">ANDY</option>
                <option value="WOLF">WOLF</option>
                <option value="PEPE">PEPE</option>
              </select>
            </div>
          ) : null}

          {/* Mint Quantity Selector */}
          <div className="flex items-center space-x-2 w-full">
            {/* Mint Quantity Input */}
            <input
              type="number"
              value={mintQuantity}
              onChange={handleMintQuantityChange}
              min="1"
              max="500"
              className="flex-grow px-2 py-1 text-xs sm:text-sm text-black bg-white border border-gray-700 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Refresh Price Button */}
            <button
              onClick={handleRefreshPrice}
              className="px-3 py-1 text-white text-xs sm:text-sm font-semibold rounded-md border bg-blue-500 border-blue-700 hover:bg-blue-600 transition-transform duration-300 hover:scale-105 disabled:opacity-50"
              disabled={!canRefreshPrice} // Uses new state
            >
              🔄 Refresh Price
            </button>
          </div>

          {/* Inline Error Message (Appears Below) */}
          {refreshError && (
            <p className="text-red-400 text-xs font-semibold mt-1">
              {refreshError}
            </p>
          )}

          {/* Total Minting Cost - Dynamically Adjusts for Whitelist/Public Sale */}
          <p className="text-white text-xs sm:text-sm font-semibold mt-2">
            Total Minting Cost:{" "}
            <span className="text-green-400">
              {new Date() < (whitelistEndTime ?? new Date(0))
                ? totalMintCost !== null &&
                  totalMintCost !== undefined &&
                  totalMintCost > 0
                  ? `${ethers.formatEther(totalMintCost)} ETH`
                  : "Fetching price..."
                : auctionPrice !== null &&
                  auctionPrice !== undefined &&
                  auctionPrice > 0
                ? `${ethers.formatEther(
                    auctionPrice * BigInt(mintQuantity)
                  )} ETH`
                : "Fetching price..."}
            </span>
          </p>

          {/* Minting Status Box - Prevents UI Jumping */}
          <div className="h-10 sm:h-12 w-full flex items-center justify-center">
            {mintingStatus && (
              <div
                className="px-3 py-1 text-xs sm:text-sm font-bold text-white bg-black bg-opacity-80 rounded-lg shadow-lg"
                style={{ backdropFilter: "blur(6px)" }}
              >
                {mintingStatus}
              </div>
            )}
          </div>

          {/* Minting Animation Effects */}
          <div className="relative w-full">
            {/* 🎉 Fullscreen Confetti Effect */}
            {mintSuccess && (
              <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                numberOfPieces={500} // Adjust this to a high but manageable number
                gravity={0.1} // Controls how fast the confetti falls
                wind={0.03} // Controls horizontal drift
                initialVelocityY={{ min: -18, max: 18 }} // Adjust for a more consistent flow
                initialVelocityX={{ min: -2, max: 2 }} // Adds some horizontal spread
                run={true} // Keep the confetti running
                recycle={true} // Recycle particles to create a continuous effect
                style={{ position: "fixed", top: 0, left: 0, zIndex: 1000 }}
              />
            )}

            {showFireworks && (
              <div className="fixed inset-0 z-50 pointer-events-none">
                <Fireworks
                  options={{
                    hue: { min: 0, max: 345 },
                    delay: { min: 5, max: 10 }, // More frequent explosions
                    acceleration: 1.1, // Increase speed of launch
                    friction: 0.96, // Reduce friction for smoother movement
                    gravity: 2, // Stronger gravity makes particles fall faster
                    particles: 150, // More particles per explosion
                    explosion: 8, // Larger explosion radius
                    intensity: 8, // Increase brightness and explosion size
                    boundaries: {
                      x: 0,
                      y: 0,
                      width: window.innerWidth,
                      height: window.innerHeight,
                    },
                    sound: {
                      enabled: false, // Enable if you want explosion sound
                    },
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}

            {/* ⚡ Fullscreen Flash Effect */}
            {showFlash && (
              <motion.div
                className="fixed inset-0 bg-white opacity-80 z-50"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* ✅ Centered Success Message */}
            {successMessage && (
              <motion.div
                className="fixed left-1/2 top-1/3 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-md text-xl font-bold shadow-lg z-50"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                ✅ Mint Successful!
              </motion.div>
            )}

            {/* 🛒 Mint Button */}
            <button
              className={`w-full px-4 sm:px-6 py-2 sm:py-3 text-white text-sm sm:text-lg uppercase font-bold rounded-md border-2 transition-transform duration-300 hover:scale-105 ${
                glowEffect ? "animate-pulse" : ""
              } ${
                !whitelistStartTime || whitelistStartTime.getTime() === 0
                  ? "bg-gray-500 border-gray-700 cursor-not-allowed"
                  : new Date() < whitelistStartTime
                  ? "bg-gray-500 border-gray-700 cursor-not-allowed"
                  : whitelistEndTime && new Date() > whitelistEndTime
                  ? "bg-blue-500 border-black hover:bg-blue-600"
                  : "bg-green-500 border-green-700 hover:bg-green-600"
              }`}
              onClick={async () => {
                console.log("🛑 Mint Button Clicked!");

                try {
                  if (new Date() > (whitelistEndTime ?? 0)) {
                    console.log("✅ Triggering Public Mint...");
                    await handlePublicMint();
                  } else {
                    console.log("✅ Triggering Whitelist Mint...");
                    await handleWhitelistMint();
                  }
                } catch (error) {
                  console.error("❌ Minting failed:", error);
                }
              }}
              disabled={
                !whitelistStartTime ||
                whitelistStartTime.getTime() === 0 ||
                new Date() < whitelistStartTime
              }
            >
              {new Date() > (whitelistEndTime ?? 0)
                ? "Public Mint"
                : "Whitelist Mint"}
            </button>
          </div>
        </div>
        {/* WHITELIST VERIFICATION SECTION - Hides After Whitelist Ends */}
        {!whitelistEndTime || new Date() < whitelistEndTime ? (
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 mt-4 sm:mt-6 bg-gray-900 bg-opacity-80 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-[300px] md:max-w-[500px]">
            <h2 className="text-white text-sm sm:text-xl uppercase font-bold bg-black px-4 sm:px-6 py-2 sm:py-3 rounded-md border-2 border-gray-600 text-center">
              Verify Whitelist Eligibility
            </h2>

            {/* Verify Button */}
            <button
              className="w-full px-4 sm:px-6 py-2 sm:py-3 text-white text-sm sm:text-lg uppercase font-bold bg-blue-500 rounded-md border-2 border-black transition-transform duration-300 hover:scale-105"
              onClick={() => verifyWhitelist(selectedToken)}
              disabled={!selectedToken}
            >
              Verify Whitelist
            </button>

            {/* Display success or error message */}
            {verifiedToken ? (
              <div className="px-4 sm:px-6 py-2 sm:py-3 text-black text-sm sm:text-lg font-bold bg-green-300 rounded-md border-2 border-black">
                ✅ Successfully verified with {verifiedToken}!
              </div>
            ) : errorMessage ? (
              <div className="px-4 sm:px-6 py-2 sm:py-3 text-red-500 text-sm sm:text-lg font-bold bg-white rounded-md border-2 border-black">
                {errorMessage}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {/* Countdown & Affiliate Section (Smaller Version) */}
      <div className="absolute right-6 md:right-40 top-32 md:top-40 flex flex-col space-y-4">
        {/* 🏆 Top Affiliates Box */}
        <div className="bg-black/70 rounded-lg p-2 sm:p-3 w-[200px] sm:w-[240px]">
          <h3 className="text-white font-semibold text-sm sm:text-md">
            🏆 Top Affiliates
          </h3>
          <ul className="text-gray-300 text-xs sm:text-sm">
            {topAffiliates.length > 0 ? (
              topAffiliates.map((aff, index) => (
                <li key={aff.address} className="flex justify-between">
                  <span>
                    #{index + 1} {aff.address.substring(0, 6)}...
                    {aff.address.slice(-4)}
                  </span>
                  <span className="text-green-400">{aff.mints} mints</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No affiliates yet.</li>
            )}
          </ul>
        </div>

        {/* ✅ Whitelist Countdown */}
        <div className="px-4 py-2 text-white text-xs sm:text-sm uppercase font-bold bg-green-500 rounded-md border-2 border-black overflow-hidden transition-transform duration-200 hover:scale-105 text-center w-[200px] sm:w-[240px]">
          <h2 className="text-sm font-bold">Whitelist Sale</h2>

          {isWhitelistNotStarted ? (
            <p className="text-yellow-400">Whitelist Not Started</p>
          ) : whitelistCountdown && whitelistCountdown.total > 0 ? (
            <p className="animate-pulse">
              {whitelistCountdown.days}d {whitelistCountdown.hours}h{" "}
              {whitelistCountdown.minutes}m {whitelistCountdown.seconds}s
            </p>
          ) : (
            <p className="text-red-400">Whitelist Over</p>
          )}
        </div>

        {/* 🌍 Public Sale Countdown */}
        <div className="px-4 py-2 text-white text-xs sm:text-sm uppercase font-bold bg-blue-500 rounded-md border-2 border-black overflow-hidden transition-transform duration-200 hover:scale-105 text-center w-[200px] sm:w-[240px]">
          <h2 className="text-sm font-bold">Public Sale</h2>
          {auctionPrice && auctionPrice > 0 ? (
            <p className="text-green-400">Public Mint Open</p>
          ) : (
            <p className="text-yellow-400">Not started</p>
          )}
        </div>

        {/* 🔗 Affiliate Link Generator */}
        {walletAddress && (
          <div className="px-4 py-2 bg-gray-900 text-white rounded-md border-2 border-blue-500 text-center w-[200px] sm:w-[240px]">
            <h2 className="text-xs font-bold uppercase mb-1">
              Your Affiliate Link
            </h2>
            <input
              type="text"
              value={`${window.location.origin}?ref=${walletAddress}`}
              readOnly
              className="w-full bg-gray-800 text-white text-xs px-2 py-1 rounded-md border border-gray-700"
            />
            <button
              className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-700 rounded-md text-white text-xs font-bold transition"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}?ref=${walletAddress}`
                );
                alert("✅ Affiliate link copied!");
              }}
            >
              Copy Link
            </button>
          </div>
        )}

        {/* 💰 Affiliate Withdrawal */}
        {affiliateEarnings > 0 && (
          <div className="px-4 py-2 bg-gray-900 text-white rounded-md border-2 border-green-500 text-center w-[200px] sm:w-[240px]">
            <h2 className="text-xs font-bold uppercase mb-1">
              Withdraw Earnings
            </h2>
            <button
              className="px-3 py-1 bg-green-500 hover:bg-green-700 rounded-md text-white text-xs font-bold transition"
              onClick={withdrawEarnings}
            >
              Withdraw {ethers.formatEther(affiliateEarnings)} ETH
            </button>
          </div>
        )}
      </div>

      {/* Live Chat Section */}
      <div
        className={`fixed left-4 sm:left-20 bg-gray-900 bg-opacity-90 text-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
          chatMinimized
            ? "h-12 w-[250px] sm:w-[350px] lg:w-[450px] overflow-hidden" // Keep width the same while collapsing upwards
            : "h-[300px] sm:h-[400px] lg:h-[500px] w-[250px] sm:w-[350px] lg:w-[450px]"
        }`}
        style={{
          top: "20%",
          bottom: chatMinimized ? "auto" : "20%", // Keeps the box position consistent
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Chat Header */}
        <div className="p-4 bg-black rounded-t-2xl flex justify-between items-center shadow-md">
          <h3 className="text-xl font-bold tracking-wide">💬 Live Chat</h3>

          {/* Minimize/Expand Button */}
          <button
            className="text-white bg-gray-600 hover:bg-gray-800 rounded-full px-3 py-1 text-sm font-semibold transition-transform duration-200 hover:scale-105"
            onClick={() => setChatMinimized(!chatMinimized)}
          >
            {chatMinimized ? "🔽 Expand" : "🔼 Minimize"}
          </button>
        </div>

        {/* Chat Content - Hidden if Minimized */}
        {!chatMinimized && (
          <>
            {/* Chat Messages */}
            <div
              className="flex-grow p-4 space-y-3 overflow-y-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.username === username
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 max-w-xs text-sm font-medium rounded-xl break-words ${
                      message.username === username
                        ? "bg-white bg-opacity-80 text-black shadow-md"
                        : "bg-gray-700 text-white shadow-lg"
                    }`}
                  >
                    <strong
                      className="block text-xs mb-1"
                      style={{ color: message.color || "#ffffff" }}
                    >
                      {message.username}
                    </strong>
                    <span>{message.message}</span>
                  </div>
                </div>
              ))}
              {/* Invisible div to track the bottom */}
              <div ref={messageEndRef}></div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-gray-800 rounded-b-2xl flex items-center space-x-3">
              {!username ? (
                <>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tempUsername.trim()) {
                        setUsername(tempUsername.trim());
                        setTempUsername("");
                      }
                    }}
                    className="flex-grow px-4 py-2 rounded-full bg-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (tempUsername.trim()) {
                        setUsername(tempUsername.trim());
                        setTempUsername("");
                      }
                    }}
                    className="px-5 py-2 rounded-full bg-green-500 hover:bg-green-700 text-white font-bold transition-transform transform hover:scale-105"
                  >
                    Set
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Type your message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newMessage.trim()) {
                        handleSendMessage();
                      }
                    }}
                    className="flex-grow px-4 py-2 rounded-full bg-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white font-bold transition-transform transform hover:scale-105"
                  >
                    Send
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Swiper Carousel Section */}
      <div
        className="w-full bg-gray-900 border-t border-gray-700 transition-all duration-300"
        style={{ height: swiperHeight }} // Set height dynamically
      >
        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          speed={3000} // Adjust speed for seamless scrolling
          loop
          slidesPerView={10} // Keeps number of images constant
          spaceBetween={0} // No spacing
          className="w-full h-full"
        >
          {sampleImages.map((image, index) => (
            <SwiperSlide
              key={index}
              className="flex justify-center items-center"
            >
              <Image
                ref={index === 0 ? imageRef : null} // Track the height of the first image
                src={image}
                alt={`Sample NFT ${index + 1}`}
                width={500} // ✅ Replace with actual width
                height={500} // ✅ Replace with actual height
                className="object-cover w-63 h-63 rounded-lg"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {/* Floating Connect Wallet Button - Top Left Corner (Styled to Match Other UI Boxes) */}
      {!walletAddress && (
        <button
          onClick={initializeContracts}
          className="fixed top-8 left-8 px-6 py-3 text-black text-sm sm:text-lg uppercase font-bold border-2 transition-transform duration-300 hover:scale-105 animate-bounce"
          style={{
            backgroundColor: "#FFD700", // Gold/Yellow color
            borderColor: "black", // Keeps the black border
            borderRadius: "6px", // Slightly rounded for a subtle square look
            boxShadow: "4px 4px 0 black", // Matching your other UI elements
            textShadow: "1px 1px 0 black", // Ensures readability
          }}
        >
          🔗 Connect Wallet
        </button>
      )}
      {/* Floating Remaining Supply Button */}
      {walletAddress && typeof remainingSupply === "number" && (
        <button
          className="fixed top-[90px] left-8 px-6 py-3 text-white text-sm sm:text-lg uppercase font-bold border-2 transition-transform duration-300 hover:scale-105 animate-bounce"
          style={{
            backgroundColor: "#800080", // Purple color
            borderColor: "black",
            borderRadius: "6px",
            boxShadow: "4px 4px 0 black",
            textShadow: "1px 1px 0 black",
            zIndex: 50, // Add z-index to ensure visibility
            display: "block", // Explicitly set display
          }}
        >
          🏆 {remainingSupply} Remaining!
        </button>
      )}
    </div>
  );
}
