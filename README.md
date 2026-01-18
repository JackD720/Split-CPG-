# Split

**Share costs, grow together.**

Split is a platform for CPG (Consumer Packaged Goods) brands to share costs on:
- 📸 **Content** - Photography, videography, studio rentals
- 🏠 **Housing** - Trade show Airbnbs, hotels
- 🏪 **Popups** - Booth space, retail pop-ins

## Features

- **Open Discovery** - Find other CPG brands looking to share costs
- **Easy Payments** - Stripe Connect powered splits with automatic distribution
- **Event Feed** - Stay updated on trade shows and networking events
- **Company Profiles** - Showcase your brand and connect with others

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Payments**: Stripe Connect
- **Auth**: Firebase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project
- Stripe account

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/split.git
cd split

# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Environment Variables

See `.env.example` for required variables:
- Firebase credentials
- Stripe API keys
- Frontend URL

## Deployment

### Vercel (Frontend)

```bash
vercel --prod
```

The `vercel.json` is configured to build and deploy the React frontend.

### Backend

Deploy the Express server to your preferred platform (Railway, Render, etc.) and update the API URL in the frontend.

## Project Structure

```
split/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── ...
│   └── ...
├── server/           # Express backend
│   ├── routes/
│   ├── config/
│   └── index.js
└── ...
```

## API Routes

- `GET/POST /api/companies` - Company profiles
- `GET/POST /api/splits` - Split listings
- `POST /api/splits/:id/join` - Join a split
- `GET/POST /api/events` - Event feed
- `POST /api/payments/connect/create` - Stripe Connect onboarding
- `POST /api/payments/split/:id/pay` - Payment for split participation

## License

MIT

---

Built for CPG founders 🍫
