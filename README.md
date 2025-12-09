🎓 Credentify – Decentralized Academic Credential Verification System

Credentify is a modern blockchain-powered platform designed to transform traditional paper-based academic certificates into tamper-proof, instantly verifiable digital credentials.
It empowers universities to issue certificates on-chain, allows students to own their credentials cryptographically, and enables employers to verify authenticity within seconds — all without relying on centralized authorities.

🚀 Overview

Every year, institutions and companies face challenges with:

Fake degrees

Manual verification delays

Paper-based documentation

Data loss and lack of trust

Credentify solves this by using blockchain, IPFS, and QR-based verification to create an automated, transparent, and secure credential lifecycle.

From issuance → ownership → verification — everything is decentralized and immutable.

✨ Features
🔐 Decentralized Certificate Issuance

Universities mint academic certificates directly on-chain.
Once created, certificates cannot be tampered with or duplicated.

🧑‍🎓 Student Credential Wallet

Students receive certificates directly into their blockchain wallet.
A dedicated student dashboard shows all issued certificates.

🏢 University Issuer Dashboard

A clean and intuitive interface for issuing:

Certificate files (PDF)

Student information

Course & degree details

🧾 IPFS-Powered PDF Storage

Uploaded certificate documents are stored on IPFS, generating a unique, permanent hash.

🔍 Instant Verification via QR Code

Employers or third parties can verify a certificate by:

Scanning a QR code

Uploading a QR image

Entering a certificate ID

This returns verifiable on-chain authenticity.

⚡ Real-Time Blockchain Sync

The verification module checks certificate existence directly from the smart contract.

🖼️ Screenshots (UI Preview)
Home Page – Decentralized Credentials

A clean landing section explaining decentralized credentials and a CTA to enter the dashboard.

Real-Time Verification Panel

A visual block explaining live verification status with blockchain sync indicators.

Issuance Workflow

A three-step card layout showing:

University issues

Student receives

Employer verifies

University Issuer Dashboard

A full-featured form where institutions can:

Upload PDFs → IPFS

Enter student details

Issue on-chain certificates

Verification Page

Includes:

QR code scanner

Image upload for QR

Dynamic verification result panel

Student Dashboard

Displays all certificates issued to the student’s wallet.
Shows “No Certificates Yet” until issuance.

🧠 How Credentify Works
Role	Action	Outcome
University	Uploads PDF → issues certificate on-chain	Certificate becomes immutable
Student	Receives certificate tied to their wallet	Gains verifiable ownership
Employer	Scans QR or enters Certificate ID	Verifies instantly from blockchain
🛠️ Tech Stack
Smart Contracts

Solidity

Foundry

Ethers.js

Ethereum Testnet (Sepolia)

Frontend

React

TailwindCSS

Zustand

wagmi / RainbowKit 

Storage

IPFS (Pinata / Web3.Storage)

Other

QR Code Generator

QR Code Scanner

Vercel / Netlify deployment

📂 Project Structure
root/
│── contracts/
│   └── Credentify.sol
│
│── frontend/
│   ├── pages/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── styles/
│
│── scripts/
│   └── deploy.js
│
│── test/
│   └── credentify.test.js
│
└── README.md

⚙️ Installation

Clone the repository:

git clone https://github.com/your-username/credentify.git
cd credentify


Install dependencies:

npm install


Compile smart contracts:

npx hardhat compile

🏃 Run Locally
Start the frontend
cd frontend
npm run dev

Deploy contracts to a testnet
npx hardhat run scripts/deploy.js --network sepolia

🔒 Environment Variables

Create a .env file for:

NEXT_PUBLIC_ALCHEMY_RPC=
PRIVATE_KEY=
PINATA_API_KEY=
PINATA_API_SECRET=

🧪 Running Tests
npx hardhat test

📘 Usage / Flow
1️⃣ University Issues Certificate

Upload PDF

Enter student details

Contract mints certificate

IPFS hash + metadata stored on-chain

2️⃣ Student Views Credential

Opens student dashboard

Sees certificates issued to wallet

3️⃣ Employer Verifies

Scans QR / uploads QR

Contract returns:

Authenticity

Issuer

Student

IPFS link

Issue metadata

🗺️ Roadmap

✔ QR-Based Verification

✔ IPFS Storage

✔ Decentralized Issuance

⏳ Employer Dashboard

⏳ Multi-Institution Onboarding

⏳ Soulbound NFTs for Credentials

⏳ Automated PDF → QR code embedding

⏳ Mobile App for Verification

🤝 Contributing

Contributions are welcome.
Please create an issue or submit a PR.

📄 License

MIT License © 2025

👤 Author

Aditya Ingole
Blockchain Developer | Web3 Engineer

GitHub: Aditya-ingole21
LinkedIn: 
